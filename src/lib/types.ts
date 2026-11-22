/** Identifiant du jeu : pokemon, magic, onepiece, yugioh, lorcana, foot, f1, et tous les jeux TCGplayer (riftbound, digimon…). */
export type GameId = string

export interface SetInfo {
  id: string
  name: string
  total: number
  logo?: string
  date?: string
  code?: string
  /** Rangement dans la liste : série (Pokémon), année, type de produit… */
  group?: string
  /** Pas encore sorti */
  soon?: boolean
}

export interface Card {
  key: string // `${game}:${id}`
  game: GameId
  id: string
  setId: string
  setName?: string
  number: string
  name: string
  image: string
  rarity?: string
  /** Cartes de sport : équipe, sous-série, rookie… (elles sont dessinées, pas photographiées) */
  extra?: { team?: string; sub?: string; rc?: boolean; code?: string; k?: string; was?: string }
}

export interface Price {
  value: number | null
  currency: 'EUR' | 'USD'
  source: string
  avg30?: number | null
  avg1?: number | null
  avg7?: number | null
  low?: number | null
  updated?: string
}
