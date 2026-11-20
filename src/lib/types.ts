export type GameId = 'pokemon' | 'magic' | 'onepiece' | 'yugioh' | 'lorcana'

export interface SetInfo {
  id: string
  name: string
  total: number
  logo?: string
  date?: string
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
