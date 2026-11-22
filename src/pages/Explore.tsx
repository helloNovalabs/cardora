import GameTiles from '../components/GameTiles'

export default function Explore() {
  return (
    <div className="stack fade-in" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Classeurs</h1>
        <p className="muted small">Choisis un jeu, puis l'extension que tu collectionnes.</p>
      </div>
      <GameTiles all />
    </div>
  )
}
