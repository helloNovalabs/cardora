import type { GameId } from './types'

/** Lecture d'une photo de carte, sur le téléphone même (Tesseract, rien n'est envoyé ailleurs que pour télécharger l'outil de lecture). */

/** Réduit la photo, la passe en gris et renforce le contraste : la lecture est plus rapide et plus juste. */
async function prepare(file: File): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const ctx = c.getContext('2d')!
  ctx.filter = 'grayscale(1) contrast(1.35)'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close?.()
  return c
}

const LANGS: Partial<Record<GameId, string>> = { pokemon: 'fra+eng', yugioh: 'fra+eng', lorcana: 'eng+fra', magic: 'eng+fra' }

// Mots imprimés sur toutes les cartes : ce ne sont pas des noms
const NOISE = /^(pv|hp|de base|base|basic|niveau|stage|talent|ability|attaque|attack|faiblesse|weakness|résistance|resistance|retraite|retreat|illus|pokémon|pokemon|dresseur|trainer|supporter|objet|item|énergie|energy|stade|stadium|effet|effect|monstre|monster|magie|spell|piège|trap|carte|card|atk|def|tcg|ex|gx|vmax|vstar|character|personnage|action|song|chanson|creature|créature|instant|sorcery|rituel|enchantment|artifact|legendary|légendaire|evolution|évolution|évolue|evolves|from|moins|cette|dégâts|damage)$/i

export interface ScanResult { names: string[]; number?: string; text: string }

export async function readCard(file: File, game: GameId, onProgress: (p: number) => void): Promise<ScanResult> {
  const [{ createWorker }, canvas] = await Promise.all([import('tesseract.js'), prepare(file)])
  const worker = await createWorker(LANGS[game] ?? 'eng', 1, {
    logger: m => { if (m.status === 'recognizing text') onProgress(m.progress) },
  })
  try {
    const { data } = await worker.recognize(canvas)
    const text = data.text
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

    // Le numéro : « 199/165 » (Pokémon), « LOB-FR001 » (Yu-Gi-Oh!), « 123/204 » (Lorcana, Magic)
    const num = text.match(/\b[A-Z0-9]{2,5}-[A-Z]{0,2}\d{3}\b/)?.[0] ?? text.match(/\b0*(\d{1,3})\s*\/\s*\d{2,3}\b/)?.[1]

    // Les noms possibles : les lignes de lettres, dans l'ordre (le nom est en haut de la carte)
    const names: string[] = []
    const push = (c: string) => { if (c.length >= 3 && !names.includes(c)) names.push(c) }
    // Le nom est souvent le mot le plus long des premières lignes (la lecture ajoute parfois une lettre en trop à la fin)
    for (const l of lines.slice(0, 3)) {
      const w = l.replace(/[^\p{L}'-]/gu, ' ').split(/\s+/).filter(x => x.length >= 4 && !NOISE.test(x)).sort((a, b) => b.length - a.length)[0]
      if (w) { push(w); push(w.slice(0, -1)); push(w.slice(0, -2)) }
    }
    for (const l of lines) {
      const words = l.replace(/[^\p{L}' -]/gu, ' ').split(/\s+/).filter(w => w.length >= 3 && !NOISE.test(w))
      if (!words.length) continue
      const letters = l.replace(/[^\p{L}]/gu, '').length
      if (letters < 4 || letters / l.replace(/\s/g, '').length < 0.45) continue
      const full = words.slice(0, 4).join(' ')
      for (const cand of [full, words.slice(0, 2).join(' '), words[0]]) push(cand)
      if (names.length >= 12) break
    }
    return { names, number: num, text }
  } finally {
    await worker.terminate()
  }
}
