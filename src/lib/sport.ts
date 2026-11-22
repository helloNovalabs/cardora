import type { Card, GameId, SetInfo } from './types'

/** Cartes de sport : pas d'API gratuite. Les listes officielles (checklists) sont rangées dans src/data,
 *  et les cartes sont dessinées (pas de photo libre de droits). Prix : notés par la personne. */

export const SPORT_SETS: Record<string, SetInfo[]> = {
  foot: [
    { id: 'wc2026', name: 'Panini Coupe du monde 2026', total: 971, date: '2026-04-30', group: 'Albums Panini', code: 'WC26' },
    { id: 'wc2026-maj', name: 'Coupe du monde 2026 : la mise à jour', total: 118, date: '2026-07-15', group: 'Albums Panini', code: 'MAJ' },
  ],
  f1: [
    { id: 'chrome-2025', name: 'Topps Chrome F1 2025', total: 200, date: '2025-11-07', group: 'Topps', code: 'CHR25' },
  ],
}

const POS: Record<string, string> = { GK: 'Gardien', DF: 'Défenseur', MF: 'Milieu', FW: 'Attaquant', crest: 'Écusson', team: "Photo d'équipe", history: 'Histoire', update: 'Mise à jour' }
const slug = (n: string) => n.replace(/\s+/g, '-')

type WC = { n: string; name: string; team: string; code: string; k: string; was?: string }
type F1 = { n: string; name: string; team: string; sub: string; rc: boolean }

export async function sportSet(game: GameId, setId: string): Promise<{ set: SetInfo; cards: Card[] }> {
  const info = SPORT_SETS[game]?.find(s => s.id === setId)
  if (!info) throw new Error('Extension inconnue')
  let cards: Card[] = []
  if (game === 'foot') {
    const d = (await import('../data/wc2026.json')).default as { cards: WC[]; update: WC[] }
    const list = setId === 'wc2026-maj' ? d.update : d.cards
    cards = list.map(c => ({
      key: `foot:${setId}:${slug(c.n)}`, game, id: slug(c.n), setId, setName: info.name, number: c.n, name: c.name,
      rarity: POS[c.k] ?? c.k, image: '', extra: { team: c.team, code: c.code, k: c.k, was: c.was },
    }))
  } else if (game === 'f1') {
    const d = (await import('../data/f1-chrome-2025.json')).default as { base: F1[] }
    cards = d.base.map(c => ({
      key: `f1:${setId}:${c.n}`, game, id: c.n, setId, setName: info.name, number: c.n, name: c.name,
      rarity: c.sub, image: '', extra: { team: c.team, sub: c.sub, rc: c.rc },
    }))
  }
  return { set: { ...info, total: cards.length }, cards }
}

// ---------- Couleurs pour dessiner les cartes ----------

/** Couleurs des maillots (deux couleurs par équipe). */
const NATIONS: Record<string, [string, string]> = {
  MEX: ['#006847', '#CE1126'], RSA: ['#007A4D', '#FFB612'], KOR: ['#C60C30', '#003478'], CZE: ['#D7141A', '#11457E'], CAN: ['#D80621', '#FFFFFF'],
  BIH: ['#002395', '#FECB00'], QAT: ['#8A1538', '#FFFFFF'], SUI: ['#D52B1E', '#FFFFFF'], BRA: ['#FEDD00', '#009C3B'], MAR: ['#C1272D', '#006233'],
  HAI: ['#00209F', '#D21034'], SCO: ['#0065BF', '#FFFFFF'], USA: ['#0A3161', '#B31942'], PAR: ['#D52B1E', '#0038A8'], AUS: ['#FFCD00', '#00843D'],
  TUR: ['#E30A17', '#FFFFFF'], GER: ['#111111', '#DD0000'], CUW: ['#002B7F', '#F9E814'], CIV: ['#F77F00', '#009E60'], ECU: ['#FFDD00', '#034EA2'],
  NED: ['#F36C21', '#21468B'], JPN: ['#0B2A6F', '#BC002D'], SWE: ['#006AA7', '#FECC00'], TUN: ['#E70013', '#FFFFFF'], BEL: ['#ED2939', '#FAE042'],
  EGY: ['#CE1126', '#111111'], IRN: ['#239F40', '#DA0000'], NZL: ['#111111', '#FFFFFF'], ESP: ['#AA151B', '#F1BF00'], CPV: ['#003893', '#CF2027'],
  KSA: ['#006C35', '#FFFFFF'], URU: ['#5CBFEB', '#0038A8'], FRA: ['#002654', '#ED2939'], SEN: ['#00853F', '#FDEF42'], IRQ: ['#007A3D', '#CE1126'],
  NOR: ['#BA0C2F', '#00205B'], ARG: ['#74ACDF', '#FFFFFF'], ALG: ['#006233', '#D21034'], AUT: ['#ED2939', '#FFFFFF'], JOR: ['#007A3D', '#CE1126'],
  POR: ['#C8102E', '#006600'], COD: ['#007FFF', '#CE1021'], UZB: ['#1EB53A', '#0099B5'], COL: ['#FCD116', '#003893'], ENG: ['#FFFFFF', '#CF081F'],
  CRO: ['#FF0000', '#171796'], GHA: ['#006B3F', '#FCD116'], PAN: ['#DA121A', '#072357'], FWC: ['#7C5CFF', '#FBBF24'],
}
const F1_TEAMS: [RegExp, [string, string]][] = [
  [/red bull racing/i, ['#1B2A6B', '#E10600']], [/ferrari/i, ['#DC0000', '#FFF200']], [/mclaren/i, ['#FF8000', '#1E1E1E']],
  [/mercedes/i, ['#00A19C', '#111111']], [/aston martin/i, ['#006F62', '#CEDC00']], [/racing bulls|cash app/i, ['#2B4562', '#FFFFFF']],
  [/haas/i, ['#B6BABD', '#E10600']], [/alpine/i, ['#0090FF', '#FF87BC']], [/williams/i, ['#005AFF', '#00A0DE']], [/sauber|kick/i, ['#52E252', '#111111']],
  [/^F2/i, ['#1E3A8A', '#38BDF8']], [/^F3/i, ['#334155', '#F472B6']],
]

export function sportColors(c: Card): [string, string] {
  if (c.game === 'foot') return NATIONS[c.extra?.code ?? ''] ?? ['#166534', '#FFFFFF']
  const t = c.extra?.team ?? ''
  for (const [re, col] of F1_TEAMS) if (re.test(t)) return col
  return ['#3B0764', '#FBBF24'] // légendes, sans écurie
}
export const isSport = (g: GameId) => g === 'foot' || g === 'f1'
