import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GAMES } from '../lib/games'
import { useCollection } from '../lib/store'

export default function GameTiles() {
  const col = useCollection()
  const per: Record<string, number> = {}
  for (const o of Object.values(col.owned)) per[o.card.game] = (per[o.card.game] ?? 0) + o.qty
  return (
    <div className="grid-games">
      {GAMES.map(g => {
        const style = { '--gc': g.color } as CSSProperties
        const inner = (
          <>
            {g.art && <span className="art" style={{ backgroundImage: `url("${g.art}")`, backgroundPosition: g.artPos, backgroundSize: g.artPos ? '100% auto' : undefined }} />}
            {g.ready && per[g.id] ? <span className="count">{per[g.id]} carte{per[g.id] > 1 ? 's' : ''}</span> : null}
            {!g.ready && <span className="count">Bientôt</span>}
            <h3>{g.name}</h3>
            <p>{g.hint}</p>
          </>
        )
        return g.ready ? (
          <Link key={g.id} to={`/jeux/${g.id}`} className="game-tile" style={style}>{inner}</Link>
        ) : (
          <div key={g.id} className="game-tile off" style={style}>{inner}</div>
        )
      })}
    </div>
  )
}
