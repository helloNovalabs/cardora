import { t as tr } from '../lib/i18n'
import GameTiles from '../components/GameTiles'

export default function Explore() {
  return (
    <div className="stack fade-in" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>{tr('Classeurs')}</h1>
        <p className="muted small">{tr("Choisis un jeu, puis l'extension que tu collectionnes.")}</p>
      </div>
      <GameTiles all />
    </div>
  )
}
