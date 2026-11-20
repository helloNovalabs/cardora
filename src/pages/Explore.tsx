import GameTiles from '../components/GameTiles'

export default function Explore() {
  return (
    <div className="stack fade-in" style={{ gap: 18 }}>
      <div>
        <h1>Classeurs</h1>
        <p className="muted small" style={{ marginTop: 4 }}>Choisis un jeu, puis l'extension que tu collectionnes.</p>
      </div>
      <GameTiles />
      <p className="muted tiny">
        Foot et F1 arrivent : aucune base de prix gratuite et fiable n'existe encore pour ces cartes, et on préfère ne pas afficher de faux prix.
      </p>
    </div>
  )
}
