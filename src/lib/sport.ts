import type { Card, GameId, SetInfo } from './types'

/** Cartes de sport : pas d'API gratuite. Les listes officielles (checklists) sont rangées dans src/data,
 *  et les cartes sont dessinées (pas de photo libre de droits). Prix : notés par la personne. */

// Albums venus des listes de laststicker.com (une ligne = [numéro, nom, équipe, type]) : src/data/albums/<id>.json
const A = (id: string, name: string, total: number, date: string, group: string, code: string): SetInfo => ({ id, name, total, date, group, code })
export const SPORT_SETS: Record<string, SetInfo[]> = {
  foot: [
    A('l1-2526', 'Panini Foot Ligue 1 2025-2026', 602, '2025', 'France', 'L1'),
    A('axl-l1-2627', 'Adrenalyn XL Ligue 1 2026-2027', 649, '2026', 'France', 'AXL'),
    A('axl-l1-2526', 'Adrenalyn XL Ligue 1 2025-2026', 589, '2025', 'France', 'AXL'),
    A('l2-2526', 'Panini Foot Ligue 2 2025-2026', 288, '2025', 'France', 'L2'),
    { id: 'wc2026', name: 'Panini Coupe du monde 2026', total: 971, date: '2026-04-30', group: 'Coupe du monde 2026', code: 'WC26' },
    { id: 'wc2026-maj', name: 'Coupe du monde 2026 : la mise à jour', total: 118, date: '2026-07-15', group: 'Coupe du monde 2026', code: 'MAJ' },
    A('axl-wc26', 'Adrenalyn XL Coupe du monde 2026', 991, '2026', 'Coupe du monde 2026', 'AXL'),
    A('ucl-2526', 'Topps Ligue des champions 2025-2026', 584, '2025', 'Coupes d’Europe', 'UCL'),
    A('ma-ucl-2526', 'Match Attax Ligue des champions 2025-2026', 738, '2025', 'Coupes d’Europe', 'MA'),
    A('f365-2026', 'Panini FIFA 365 2026', 660, '2025', 'FIFA 365 (grands clubs du monde)', '365'),
    A('axl-f365-2526', 'Adrenalyn XL FIFA 365 2025-2026', 914, '2025', 'FIFA 365 (grands clubs du monde)', 'AXL'),
    A('pl-2526', 'Topps Premier League 2025-2026', 582, '2025', 'Angleterre', 'PL'),
    A('liga-2526', 'Este LaLiga 2025-2026', 780, '2025', 'Espagne', 'LIGA'),
    A('calcio-2526', 'Panini Calciatori 2025-2026', 804, '2025', 'Italie', 'SA'),
    A('bl-2526', 'Topps Bundesliga 2025-2026', 381, '2025', 'Allemagne', 'BL'),
  ],
  f1: [
    A('ta-2026', 'Topps Turbo Attax F1 2026', 422, '2026', 'Turbo Attax', 'TA26'),
    { id: 'chrome-2025', name: 'Topps Chrome F1 2025', total: 200, date: '2025-11-07', group: 'Topps Chrome', code: 'CHR25' },
  ],
}
/** Numéro de l'album sur laststicker.com : photos des vignettes et couverture de l'album. */
const LS: Record<string, number> = {
  'l1-2526': 11771, 'axl-l1-2627': 12475, 'axl-l1-2526': 11414, 'l2-2526': 11772, wc2026: 12176, 'axl-wc26': 12029,
  'ucl-2526': 11732, 'ma-ucl-2526': 11483, 'f365-2026': 11592, 'axl-f365-2526': 11415, 'pl-2526': 11908, 'liga-2526': 11361,
  'calcio-2526': 11718, 'bl-2526': 11697, 'ta-2026': 12348, 'chrome-2025': 11964,
}
const LS_IMG = 'https://www.laststicker.com/i/'
for (const list of Object.values(SPORT_SETS)) for (const s of list) {
  const id = LS[s.id === 'wc2026-maj' ? 'wc2026' : s.id]
  if (id) s.logo = `${LS_IMG}album/${id}.jpg`
}
/** La photo d'une vignette (pas toutes sont photographiées : sinon on garde le dessin). */
export function sportPhoto(c: Card): string {
  const id = LS[c.setId]
  if (!id) return ''
  const n = c.setId === 'wc2026' ? c.number.toLowerCase().replace(/\s+/g, '') : c.number
  return `${LS_IMG}cards/${id}/${encodeURIComponent(n)}.jpg`
}
export const PHOTO_CREDIT = 'Photos des vignettes : laststicker.com'
const ALBUMS = import.meta.glob<{ default: [string, string, string, string][] }>('../data/albums/*.json')

/** Petit code d'équipe (3 lettres) pour dessiner l'écusson. */
const short = (t: string) => {
  const w = t.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(x => x.length > 2 && !/^(FC|AS|SC|AC|RC|US|SSC|CF|OGC|Real|Club|The|del|de|des|and)$/i.test(x))
  return (w.length >= 3 ? w.map(x => x[0]).join('') : (w[0] ?? t).slice(0, 3)).slice(0, 3).toUpperCase()
}
/** Écusson / photo d'équipe / joueur, d'après le nom de la vignette. */
const kindOf = (name: string) => /^(logo|team badge|badge|club badge|emblem|scudetto|escudo|wappen|écusson)\b/i.test(name) ? 'crest'
  : /^(team|team photo|squadra|equipo|mannschaft|équipe)( photo)?\b/i.test(name) ? 'team' : 'player'

const POS: Record<string, string> = { GK: 'Gardien', DF: 'Défenseur', MF: 'Milieu', FW: 'Attaquant', crest: 'Écusson', team: "Photo d'équipe", history: 'Histoire', update: 'Mise à jour' }
const slug = (n: string) => n.replace(/\s+/g, '-')

type WC = { n: string; name: string; team: string; code: string; k: string; was?: string }
type F1 = { n: string; name: string; team: string; sub: string; rc: boolean }

export async function sportSet(game: GameId, setId: string): Promise<{ set: SetInfo; cards: Card[] }> {
  const info = SPORT_SETS[game]?.find(s => s.id === setId)
  if (!info) throw new Error('Extension inconnue')
  let cards: Card[] = []
  const file = ALBUMS[`../data/albums/${setId}.json`]
  if (file) {
    const rows = (await file()).default
    cards = rows.map(([n, name, team, type]) => {
      const id = slug(n)
      return game === 'f1'
        ? { key: `f1:${setId}:${id}`, game, id, setId, setName: info.name, number: n, name, rarity: type || 'Base', image: '', extra: { team, sub: type || team, rc: false } }
        : { key: `foot:${setId}:${id}`, game, id, setId, setName: info.name, number: n, name, rarity: type || 'Normale', image: '',
          extra: { team, code: NATION_OF[team] ?? short(team || info.code || 'FOOT'), k: kindOf(name) } }
    })
  } else if (game === 'foot') {
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

/** Couleurs des grands clubs ; sinon une couleur fixe tirée du nom. */
const CLUBS: [RegExp, [string, string]][] = [
  [/paris saint|psg/i, ['#004170', '#DA291C']], [/marseille/i, ['#2FAEE0', '#FFFFFF']], [/lyon/i, ['#1D3C8F', '#DA291C']], [/monaco/i, ['#E30613', '#FFFFFF']],
  [/lille|losc/i, ['#E01E13', '#20325F']], [/lens/i, ['#FFD700', '#E30613']], [/nice/i, ['#C8102E', '#111111']], [/rennes/i, ['#E13327', '#111111']],
  [/nantes/i, ['#FCD405', '#00843D']], [/strasbourg/i, ['#009FE3', '#FFFFFF']], [/brest/i, ['#E30613', '#FFFFFF']], [/toulouse/i, ['#6B3FA0', '#FFFFFF']],
  [/saint-?etienne/i, ['#009639', '#FFFFFF']], [/auxerre/i, ['#FFFFFF', '#0057A8']], [/lorient/i, ['#F58220', '#111111']], [/metz/i, ['#7A1E3A', '#FFFFFF']],
  [/real madrid/i, ['#FFFFFF', '#FEBE10']], [/barcelona|barça/i, ['#A50044', '#004D98']], [/atl[eé]tico/i, ['#CB3524', '#262E61']],
  [/manchester city/i, ['#6CABDD', '#1C2C5B']], [/manchester united/i, ['#DA291C', '#FBE122']], [/liverpool/i, ['#C8102E', '#00B2A9']],
  [/arsenal/i, ['#EF0107', '#FFFFFF']], [/chelsea/i, ['#034694', '#FFFFFF']], [/tottenham/i, ['#FFFFFF', '#132257']], [/newcastle/i, ['#241F20', '#FFFFFF']],
  [/bayern/i, ['#DC052D', '#0066B2']], [/dortmund/i, ['#FDE100', '#111111']], [/leverkusen/i, ['#E32221', '#111111']], [/leipzig/i, ['#DD0741', '#FFFFFF']],
  [/juventus/i, ['#111111', '#FFFFFF']], [/inter\b|internazionale/i, ['#0068A8', '#111111']], [/milan/i, ['#FB090B', '#111111']], [/napoli/i, ['#12A0D7', '#FFFFFF']],
  [/roma\b/i, ['#8E1F2F', '#F0BC42']], [/benfica/i, ['#E83030', '#FFFFFF']], [/porto/i, ['#00428C', '#FFFFFF']], [/ajax/i, ['#D2122E', '#FFFFFF']],
]
const PALETTE: [string, string][] = [['#1D4ED8', '#FFFFFF'], ['#B91C1C', '#FFFFFF'], ['#047857', '#FDE047'], ['#7C3AED', '#FFFFFF'], ['#0F172A', '#38BDF8'], ['#C2410C', '#111111'], ['#0E7490', '#FFFFFF'], ['#9D174D', '#FDE68A']]
const hash = (t: string) => [...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
/** Les noms de pays (anglais) des albums Adrenalyn → codes de l'album Coupe du monde, pour garder leurs couleurs. */
const NATION_OF: Record<string, string> = {
  Mexico: 'MEX', 'South Africa': 'RSA', 'Korea Republic': 'KOR', 'South Korea': 'KOR', Czechia: 'CZE', Canada: 'CAN', 'Bosnia and Herzegovina': 'BIH', Qatar: 'QAT',
  Switzerland: 'SUI', Brazil: 'BRA', Morocco: 'MAR', Haiti: 'HAI', Scotland: 'SCO', USA: 'USA', 'United States': 'USA', Paraguay: 'PAR', Australia: 'AUS',
  Türkiye: 'TUR', Turkey: 'TUR', Germany: 'GER', 'Curaçao': 'CUW', "Côte d'Ivoire": 'CIV', 'Ivory Coast': 'CIV', Ecuador: 'ECU', Netherlands: 'NED', Japan: 'JPN',
  Sweden: 'SWE', Tunisia: 'TUN', Belgium: 'BEL', Egypt: 'EGY', 'IR Iran': 'IRN', Iran: 'IRN', 'New Zealand': 'NZL', Spain: 'ESP', 'Cabo Verde': 'CPV', 'Cape Verde': 'CPV',
  'Saudi Arabia': 'KSA', Uruguay: 'URU', France: 'FRA', Senegal: 'SEN', Iraq: 'IRQ', Norway: 'NOR', Argentina: 'ARG', Algeria: 'ALG', Austria: 'AUT', Jordan: 'JOR',
  Portugal: 'POR', 'DR Congo': 'COD', 'Congo DR': 'COD', Uzbekistan: 'UZB', Colombia: 'COL', England: 'ENG', Croatia: 'CRO', Ghana: 'GHA', Panama: 'PAN',
}

export function sportColors(c: Card): [string, string] {
  if (c.game === 'foot') {
    const nat = NATIONS[c.extra?.code ?? '']
    if (nat && (!c.extra?.team || NATION_OF[c.extra.team] || c.setId.startsWith('wc2026'))) return nat
    const t = c.extra?.team ?? ''
    for (const [re, col] of CLUBS) if (re.test(t)) return col
    return t ? PALETTE[hash(t) % PALETTE.length] : ['#166534', '#FFFFFF']
  }
  const t = c.extra?.team ?? ''
  for (const [re, col] of F1_TEAMS) if (re.test(t)) return col
  return ['#3B0764', '#FBBF24'] // légendes, sans écurie
}
export const isSport = (g: GameId) => g === 'foot' || g === 'f1'
