import { Link } from 'react-router-dom'
import { GAMES } from '../lib/games'

export default function Explore() {
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <h1>Classeurs</h1>
        <p className="muted small" style={{ marginTop: 4 }}>Choisis un jeu, puis l'extension que tu collectionnes.</p>
      </div>
      <div className="grid-games">
        {GAMES.map(g =>
          g.ready ? (
            <Link key={g.id} to={`/jeux/${g.id}`} className="box stack" style={{ gap: 6, minHeight: 104, justifyContent: 'flex-end' }}>
              <h3>{g.name}</h3>
              <p className="muted tiny">{g.hint}</p>
            </Link>
          ) : (
            <div key={g.id} className="box stack" style={{ gap: 6, minHeight: 104, justifyContent: 'flex-end', opacity: .5 }}>
              <h3>{g.name}</h3>
              <span className="badge" style={{ alignSelf: 'flex-start' }}>Bientôt</span>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
