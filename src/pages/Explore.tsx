import GameTiles from '../components/GameTiles'

export default function Explore() {
  return (
    <div className="stack fade-in" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Classeurs</h1>
        <p className="muted small">Choisis un jeu, puis l'extension que tu collectionnes.</p>
      </div>
      <GameTiles />
      <p className="muted tiny" style={{ maxWidth: 560 }}>
        Foot et F1 arrivent : il n'existe pas encore de base de prix gratuite et fiable pour ces cartes, et on préfère ne pas afficher de faux prix.
      </p>
    </div>
  )
}
