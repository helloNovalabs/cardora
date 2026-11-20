import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GAMES } from '../lib/games'

export default function GameTiles() {
  return (
    <div className="grid-games">
      {GAMES.map(g => {
        const style = { '--gc': g.color } as CSSProperties
        const inner = (
          <>
            {g.art && <span className="art" style={{ backgroundImage: `url("${g.art}")`, backgroundPosition: g.artPos, backgroundSize: g.artPos ? '100% auto' : undefined }} />}
            <h3><span className="gdot" />{g.name}</h3>
            <p className="muted tiny" style={{ marginTop: 4 }}>{g.hint}</p>
            {!g.ready && <span className="badge" style={{ alignSelf: 'flex-start', marginTop: 8 }}>Bientôt</span>}
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
