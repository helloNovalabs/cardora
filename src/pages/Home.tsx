import { t as tr } from '../lib/i18n'
import type { CSSProperties } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { wasSeen } from '../lib/seen'
import { fmt, ownedInSet, unitValue, useCollection } from '../lib/store'
import { CardFace } from '../components/CardFace'
import { MarketRail } from '../components/Market'
import { GAMES, gameColor, gameName } from '../lib/games'
import { Donut, HoloCard, Ring } from '../components/Visuals'
import { CountUp } from '../components/Brand'
import GameTiles from '../components/GameTiles'

const FAN = [
  { src: 'https://cards.lorcast.io/card/digital/large/crd_a6a007b0f7ae4fa19480721bacd2b0b6.avif?1747508548', alt: 'Elsa, Lorcana' },
  { src: 'https://assets.tcgdex.net/fr/sv/sv03.5/199/high.webp', alt: 'Dracaufeu-ex, Pokémon' },
  { src: 'https://images.ygoprodeck.com/images/cards/89631139.jpg', alt: 'Dragon Blanc aux Yeux Bleus, Yu-Gi-Oh!' },
]

const cardUrl = (c: { game: string; setId: string; id: string }) => `/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`

export default function Home() {
  const s = useCollection()
  const owned = Object.values(s.owned)
  if (owned.length === 0 && s.followed.length === 0) return wasSeen() || (s.sealed ?? []).length ? <Welcome /> : <Navigate to="/decouvrir" replace />

  const count = owned.reduce((n, o) => n + o.qty, 0)
  const value = owned.reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0)
  const hasUsd = owned.some(o => o.price?.currency === 'USD')
  const top = [...owned].filter(o => unitValue(o) != null).sort((a, b) => (unitValue(b) ?? 0) - (unitValue(a) ?? 0)).slice(0, 10)
  const best = top[0]
  const byGame = GAMES.filter(g => g.ready).map(g => ({
    label: g.name, color: g.color,
    value: owned.filter(o => o.card.game === g.id).reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0),
    n: owned.filter(o => o.card.game === g.id).reduce((n, o) => n + o.qty, 0),
  })).filter(p => p.n > 0).sort((a, b) => b.value - a.value)

  return (
    <div className="stack fade-in" style={{ gap: 28 }}>
      <section className="panel hello">
        <div>
          <span className="kicker">{s.sealed?.length ? tr('Tes cartes valent') : tr('Ta collection vaut')}</span>
          <CountUp value={value} className="num foil-text value-big" />
          <p className="muted tiny" style={{ maxWidth: 380 }}>
            {tr("Prix du marché d'aujourd'hui, Cardmarket")}{hasUsd ? tr(' et TCGplayer converti en euros') : ''}{tr('. Une carte sans prix connu compte pour 0.')}
          </p>
          <div className="stats">
            <div className="stat"><b>{count}</b><span>{tr(count > 1 ? 'cartes' : 'carte')}</span></div>
            <div className="stat"><b>{s.followed.length}</b><span>{tr(s.followed.length > 1 ? 'classeurs' : 'classeur')}</span></div>
            <div className="stat"><b>{best ? fmt(unitValue(best)) : '—'}</b><span>{tr('la plus chère')}</span></div>
          </div>
        </div>
        {byGame.length <= 1 && top.length >= 3 && (
          <div className="desk-only" style={{ placeItems: 'center' }}>
            <div className="fan" style={{ height: 210 }}>
              {[top[1], top[0], top[2]].map((o, i) => <HoloCard key={o.card.key} src={o.card.image} alt={o.card.name} rare={i === 1} face={o.card.image ? undefined : <CardFace card={o.card} big />} />)}
            </div>
          </div>
        )}
        {byGame.length > 1 && value > 0 && (
          <div className="split-games">
            <Donut parts={byGame} size={132}><b>{byGame.length}</b>jeu{byGame.length > 1 ? 'x' : ''}</Donut>
            <div className="legend">
              {byGame.map(p => (
                <div key={p.label}><i style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }} /><span className="ellipsis">{p.label}</span><b>{fmt(p.value)}</b></div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="stack">
        <div className="sec-h"><h2>{tr('Mes classeurs')}</h2><Link to="/jeux">{tr('Nouveau classeur')}</Link></div>
        {s.followed.length === 0 && (
          <Link to="/jeux" className="set-card" style={{ '--gc': '#FFFFFF' } as CSSProperties}>
            <p className="small muted">{tr('Ouvre une extension et touche « Suivre ce classeur » : tu verras ici ta progression.')}</p>
          </Link>
        )}
        <div className="grid-sets">
          {s.followed.map(f => {
            const mine = ownedInSet(s, f.game, f.setId)
            const have = mine.length
            const worth = mine.reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0)
            const pct = f.total ? Math.min(100, (have / f.total) * 100) : 0
            return (
              <Link key={f.game + f.setId} to={`/jeux/${f.game}/${encodeURIComponent(f.setId)}`} className="set-card" style={{ '--gc': gameColor(f.game) } as CSSProperties}>
                <Ring pct={pct} size={58} />
                <div className="grow">
                  <h3 className="ellipsis">{f.name}</h3>
                  <p className="meta"><span className="gdot-s" style={{ background: gameColor(f.game) }} />{gameName(f.game)}, {have} sur {f.total || '?'}</p>
                  <p className="worth">{worth > 0 ? tr('Tes cartes : {v}', { v: fmt(worth) }) : tr('Voir combien pour finir')}</p>
                </div>
                {f.logo && <img className="setlogo" src={f.logo} alt="" loading="lazy" style={f.game === 'magic' ? { filter: 'invert(1)' } : undefined} />}
              </Link>
            )
          })}
        </div>
      </section>

      {top.length > 0 && (
        <section className="stack" style={{ gap: 6 }}>
          <div className="sec-h"><h2>{tr('Mes cartes les plus chères')}</h2></div>
          <div className="rail">
            {top.map((o, i) => (
              <Link key={o.card.key} to={cardUrl(o.card)} className="mini">
                <div className="pic">
                  <CardFace card={o.card} />
                  {o.grade && <span className="grade-badge">{o.grade.by} {o.grade.g}</span>}
                  <span className={'rank' + (i === 0 ? ' r1' : '')}>{i + 1}</span>
                </div>
                <span className="nm ellipsis">{o.card.name}{o.qty > 1 ? ` ×${o.qty}` : ''}</span>
                <span className={'price-pill' + (i < 3 ? ' hot' : '')}>{o.grade?.value != null ? fmt(o.grade.value) : fmt(o.price?.value, o.price?.currency)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <MarketRail />
    </div>
  )
}

function Welcome() {
  return (
    <div className="stack fade-in welcome" style={{ gap: 24 }}>
      <section className="panel">
        <div className="hello">
          <div className="stack" style={{ gap: 14 }}>
            <h1>{tr('Ta collection de cartes, enfin claire.')}</h1>
            <p className="muted" style={{ maxWidth: 440, fontSize: 15 }}>
              {tr("Ce que tu as, ce qu'il te manque, combien il faut pour finir, et si ta carte vaut le coup d'être gradée. Avec les vrais prix du marché, en euros.")}
            </p>
            <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
              <Link to="/jeux" className="btn primary">{tr('Commencer mon classeur')}</Link>
              <Link to="/ajouter" className="btn ghost">{tr('Chercher une carte')}</Link>
            </div>
            <Link to="/decouvrir" className="small" style={{ color: 'var(--lavande)' }}>{tr('Revoir la présentation de Cardora')}</Link>
          </div>
          <div>
            <div className="fan">
              {FAN.map(c => <HoloCard key={c.src} src={c.src} alt={c.alt} />)}
            </div>
            <p className="holo-hint">{tr('Touche une carte pour la faire briller')}</p>
          </div>
        </div>
      </section>

      <section className="steps">
        {[
          ['Choisis un classeur', 'Une extension de ton jeu : Écarlate et Violet 151, Romance Dawn…'],
          ['Coche tes cartes', 'Un toucher par carte. Celles qui te manquent restent en gris.'],
          ['Vois où tu en es', 'Combien il te manque, combien ça coûte, et les cartes à acheter en premier.'],
        ].map(([t, d], i) => (
          <div key={t} className="step">
            <b className="n">{i + 1}</b>
            <div><h3>{tr(t)}</h3><p className="muted small" style={{ marginTop: 3 }}>{tr(d)}</p></div>
          </div>
        ))}
      </section>

      <section className="stack">
        <h2>{tr('Choisis ton jeu')}</h2>
        <GameTiles />
      </section>
    </div>
  )
}
