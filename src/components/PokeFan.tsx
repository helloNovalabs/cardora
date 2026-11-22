import { useState } from 'react'
import type { SetInfo } from '../lib/types'

/** Une carte de l'éventail. Les numéros sont écrits « 007 » ou « 7 » selon l'époque : on essaie les deux. */
function FanCard({ base, n, onFail }: { base: string; n: number; onFail: () => void }) {
  const forms = [String(n).padStart(3, '0'), String(n)].filter((x, i, l) => l.indexOf(x) === i)
  const [i, setI] = useState(0)
  return <img src={`${base}/${forms[i]}/low.webp`} alt="" loading="lazy" onError={() => { if (i + 1 < forms.length) setI(i + 1); else onFail() }} />
}

/** La tuile d'une extension Pokémon : ses trois dernières cartes (les plus rares) et son logo.
 *  Les adresses sont déduites du logo : aucun appel en plus, donc c'est immédiat. */
export function PokeFan({ set, fallback }: { set: SetInfo; fallback: React.ReactNode }) {
  const [bad, setBad] = useState(false)
  const base = set.art ?? set.logo?.replace(/\/logo\.webp$/, '')
  const last = set.last ?? set.total
  if (bad || !base || last < 3) return <>{fallback}</>
  // Parmi les cartes secrètes quand il y en a assez : des illustrations différentes, pas trois cartes dorées
  const extra = last - set.total
  const nums = extra >= 6 ? [0.3, 0.55, 0.8].map(p => set.total + Math.ceil(extra * p)) : [last - 1, last - 2, last]
  return (
    <span className="pf">
      {nums.map(n => <FanCard key={n} base={base} n={n} onFail={() => setBad(true)} />)}
      {set.logo && <img className="pf-logo" src={set.logo} alt="" loading="lazy" />}
    </span>
  )
}
