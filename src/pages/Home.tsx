import { Link } from 'react-router-dom'
import { fmt, ownedInSet, toEur, useCollection } from '../lib/store'
import { GAMES, gameColor, gameName } from '../lib/games'
import { IChevron } from '../components/Icons'
import { Donut, HoloCard, Ring } from '../components/Visuals'
import GameTiles from '../components/GameTiles'

const FAN = [
  { src: 'https://cards.lorcast.io/card/digital/large/crd_a6a007b0f7ae4fa19480721bacd2b0b6.avif?1747508548', alt: 'Elsa, Lorcana' },
  { src: 'https://assets.tcgdex.net/fr/sv/sv03.5/199/high.webp', alt: 'Dracaufeu-ex, Pokémon' },
  { src: 'https://images.ygoprodeck.com/images/cards/89631139.jpg', alt: 'Dragon Blanc aux Yeux Bleus, Yu-Gi-Oh!' },
]

export default function Home() {
  const s = useCollection()
  const owned = Object.values(s.owned)
  const empty = owned.length === 0 && s.followed.length === 0

  if (empty) return <Welcome />

  const count = owned.reduce((n, o) => n + o.qty, 0)
  const value = owned.reduce((n, o) => n + (toEur(o.price) ?? 0) * o.qty, 0)
  const hasUsd = owned.some(o => o.price?.currency === 'USD')
  const top = [...owned].sort((a, b) => (toEur(b.price) ?? 0) - (toEur(a.price) ?? 0)).slice(0, 5)
  const byGame = GAMES.filter(g => g.ready).map(g => ({
    label: g.name, color: g.color,
    value: owned.filter(o => o.card.game === g.id).reduce((n, o) => n + (toEur(o.price) ?? 0) * o.qty, 0),
    n: owned.filter(o => o.card.game === g.id).reduce((n, o) => n + o.qty, 0),
  })).filter(p => p.n > 0)

  return (
    <div className="stack fade-in" style={{ gap: 22 }}>
      <div className="top mob-only"><div className="brand"><i />Cardora</div></div>

      <section className="hero value-card">
        <div>
          <div className="label">Ta collection vaut</div>
          <div className="stat-big" style={{ margin: '8px 0 6px' }}>{fmt(value)}</div>
          <p className="muted small">
            {count} carte{count > 1 ? 's' : ''} · {s.followed.length} classeur{s.followed.length > 1 ? 's' : ''}
          </p>
          <p className="muted tiny" style={{ marginTop: 8, maxWidth: 360 }}>
            Prix du marché d'aujourd'hui (Cardmarket{hasUsd ? ', et TCGplayer converti en euros pour One Piece et Lorcana' : ''}).
            On n'invente jamais de prix : une carte sans prix connu compte pour 0.
          </p>
        </div>
        {byGame.length > 1 && value > 0 && (
          <div className="row" style={{ gap: 16 }}>
            <Donut parts={byGame} size={110} />
            <div className="legend">
              {byGame.map(p => (
                <div key={p.label}><i style={{ background: p.color }} /><span>{p.label}</span><b style={{ marginLeft: 'auto', paddingLeft: 10 }}>{fmt(p.value)}</b></div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="stack">
        <div className="row between"><h2>Mes classeurs</h2><Link to="/jeux" className="small lav">+ Nouveau classeur</Link></div>
        {s.followed.length === 0 && <p className="muted small">Ouvre une extension et touche « Suivre ce classeur » pour la voir ici.</p>}
        <div className="grid-sets">
          {s.followed.map(f => {
            const have = ownedInSet(s, f.game, f.setId).length
            const pct = f.total ? Math.min(100, (have / f.total) * 100) : 0
            return (
              <Link key={f.game + f.setId} to={`/jeux/${f.game}/${encodeURIComponent(f.setId)}`} className="box set-card">
                <Ring pct={pct} color={gameColor(f.game)} />
                <div className="grow">
                  <h3 className="ellipsis">{f.name}</h3>
                  <p className="muted tiny" style={{ marginTop: 3 }}>{gameName(f.game)} · {have} / {f.total || '?'} cartes</p>
                  <p className="lav tiny" style={{ marginTop: 3 }}>Voir combien pour finir →</p>
                </div>
                {f.logo ? <img className="setlogo" src={f.logo} alt="" loading="lazy" /> : <span className="muted"><IChevron /></span>}
              </Link>
            )
          })}
        </div>
      </section>

      {top.length > 0 && (
        <section className="box">
          <h2 style={{ marginBottom: 6 }}>Mes cartes les plus chères</h2>
          <div className="list">
            {top.map((o, i) => (
              <Link key={o.card.key} to={`/carte/${o.card.game}/${encodeURIComponent(o.card.setId)}/${encodeURIComponent(o.card.id)}`} className="li">
                <b className="muted small" style={{ width: 16 }}>{i + 1}</b>
                {o.card.image ? <img className="thumb" src={o.card.image} alt="" loading="lazy" /> : <div className="thumb" />}
                <div className="grow">
                  <div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{o.card.name}{o.qty > 1 ? ` ×${o.qty}` : ''}</div>
                  <div className="muted tiny ellipsis"><span className="gdot-s" style={{ background: gameColor(o.card.game) }} />{o.card.setName ?? gameName(o.card.game)} · n° {o.card.number}</div>
                </div>
                <b style={{ fontSize: 14 }}>{fmt(o.price?.value, o.price?.currency)}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="stack">
        <h2>Les jeux</h2>
        <GameTiles />
      </section>

      <p className="muted tiny" style={{ textAlign: 'center' }}>
        Ta collection est gardée sur cet appareil. Bientôt : un compte pour la retrouver sur ton ordinateur.
      </p>
    </div>
  )
}

function Welcome() {
  return (
    <div className="stack fade-in" style={{ gap: 22 }}>
      <div className="top mob-only"><div className="brand"><i />Cardora</div></div>
      <section className="hero">
        <div className="hero-grid">
          <div className="stack" style={{ gap: 12 }}>
            <span className="badge" style={{ alignSelf: 'flex-start' }}>Pokémon · One Piece · Yu-Gi-Oh! · Magic · Lorcana</span>
            <h1>Ta collection de cartes,<br /><span className="lav">enfin claire.</span></h1>
            <p className="muted small" style={{ maxWidth: 420 }}>
              Ce que tu as, ce qu'il te manque, combien il faut pour finir, et si ta carte vaut le coup d'être gradée.
              Avec les vrais prix du marché, en euros.
            </p>
            <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
              <Link to="/jeux" className="btn primary">Commencer mon classeur</Link>
              <Link to="/ajouter" className="btn ghost">Chercher une carte</Link>
            </div>
          </div>
          <div className="fan">
            {FAN.map(c => <HoloCard key={c.src} src={c.src} alt={c.alt} />)}
          </div>
        </div>
        <p className="holo-hint">Touche ou survole une carte pour la faire briller ✨</p>
      </section>

      <section className="steps">
        {[
          ['Choisis un classeur', "Une extension de ton jeu : Écarlate et Violet 151, Romance Dawn…"],
          ['Coche tes cartes', 'Un toucher par carte. Celles qui te manquent restent en gris.'],
          ['Vois où tu en es', 'Combien il te manque, combien ça coûte, et les cartes à acheter en premier.'],
        ].map(([t, d], i) => (
          <div key={t} className="box step">
            <b className="n">{i + 1}</b>
            <div><h3>{t}</h3><p className="muted small" style={{ marginTop: 3 }}>{d}</p></div>
          </div>
        ))}
      </section>

      <section className="stack">
        <h2>Choisis ton jeu</h2>
        <GameTiles />
      </section>
    </div>
  )
}
