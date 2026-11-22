import { useEffect, useRef, useState } from 'react'
import { gameMeta, isTcgOnly } from '../lib/games'
import { tcgCover, tcgCoverCached, tcgSets } from '../lib/tcg'
import type { GameId, SetInfo } from '../lib/types'

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')
const groupsWait = new Map<number, Promise<SetInfo[]>>()

/** Trouve l'extension TCGplayer qui correspond (même id, même code ou même nom). */
async function groupFor(game: GameId, set: SetInfo): Promise<string | null> {
  const cat = gameMeta(game)?.tcg
  if (!cat) return null
  if (isTcgOnly(game)) return set.id // déjà un id TCGplayer
  if (!groupsWait.has(cat)) groupsWait.set(cat, tcgSets(cat))
  const groups = await groupsWait.get(cat)!
  const id = norm(set.id), name = norm(set.name), code = norm(set.code ?? '')
  const g = groups.find(x => norm(x.code ?? '') === id || (code && norm(x.code ?? '') === code))
    ?? groups.find(x => norm(x.name) === name)
  return g?.id ?? null
}

/** L'image d'une extension sans logo : son booster (ou sa boîte) TCGplayer, chargée quand la tuile arrive à l'écran. */
export function SetCover({ game, set, fallback }: { game: GameId; set: SetInfo; fallback: React.ReactNode }) {
  const cat = gameMeta(game)?.tcg
  const [src, setSrc] = useState<string | undefined>(() => (cat && isTcgOnly(game) ? tcgCoverCached(cat, set.id) : undefined))
  const [bad, setBad] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (src !== undefined || !cat || !ref.current) return
    let live = true
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const g = await groupFor(game, set).catch(() => null)
      const url = g ? await tcgCover(cat, g) : ''
      if (live) setSrc(url)
    }, { rootMargin: '200px' })
    io.observe(ref.current)
    return () => { live = false; io.disconnect() }
  }, [cat, game, set, src])
  if (src && !bad) return <span className="set-cover"><img src={src} alt="" loading="lazy" onError={() => setBad(true)} /></span>
  return <span ref={ref} className="set-cover-wait">{fallback}</span>
}
