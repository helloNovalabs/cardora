import { Link } from 'react-router-dom'
import { fmt, ownedInSet, toEur, useCollection } from '../lib/store'
import { gameName } from '../lib/games'
import { IChevron } from '../components/Icons'

export default function Home() {
  const s = useCollection()
  const owned = Object.values(s.owned)
  const count = owned.reduce((n, o) => n + o.qty, 0)
  const value = owned.reduce((n, o) => n + (toEur(o.price) ?? 0) * o.qty, 0)
  const hasUsd = owned.some(o => o.price?.currency === 'USD')
  const top = [...owned].sort((a, b) => (toEur(b.price) ?? 0) - (toEur(a.price) ?? 0)).slice(0, 5)

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="top mob-only">
        <div className="brand"><i />Cardora</div>
      </div>

      <div className="box" style={{ background: 'linear-gradient(150deg, #261E45, #1A1626 60%)' }}>
        <div className="label">Valeur de ta collection</div>
        <div className="stat-n" style={{ marginTop: 4 }}>{fmt(value)}</div>
        <p className="muted small" style={{ marginTop: 4 }}>
          {count} carte{count > 1 ? 's' : ''} · prix du marché Cardmarket{hasUsd ? ' (One Piece converti depuis le dollar)' : ''}
        </p>
      </div>

      {s.followed.length === 0 ? (
        <div className="box empty stack" style={{ alignItems: 'center' }}>
          <h2>Commence ton premier classeur</h2>
          <p className="muted small" style={{ maxWidth: 340 }}>
            Choisis une extension : tu vois tes cartes, celles qui te manquent, et combien il te faut pour la finir.
          </p>
          <Link to="/jeux" className="btn primary">Choisir une extension</Link>
        </div>
      ) : (
        <section className="stack">
          <div className="row between"><h2>Mes classeurs</h2><Link to="/jeux" className="small lav">+ Ajouter</Link></div>
          {s.followed.map(f => {
            const have = ownedInSet(s, f.game, f.setId).length
            const pct = f.total ? Math.min(100, Math.round((have / f.total) * 100)) : 0
            return (
              <Link key={f.game + f.setId} to={`/jeux/${f.game}/${encodeURIComponent(f.setId)}`} className="box row" style={{ padding: 14 }}>
                {f.logo ? <img className="setlogo" src={f.logo} alt="" loading="lazy" /> : null}
                <div className="grow">
                  <div className="row between"><h3 className="ellipsis">{f.name}</h3><span className="lav small" style={{ fontWeight: 700 }}>{pct} %</span></div>
                  <p className="muted tiny" style={{ margin: '2px 0 8px' }}>{gameName(f.game)} · {have} / {f.total || '?'} cartes</p>
                  <div className="bar"><span style={{ width: pct + '%' }} /></div>
                </div>
                <span className="muted"><IChevron /></span>
              </Link>
            )
          })}
        </section>
      )}

      {top.length > 0 && (
        <section className="box">
          <h2 style={{ marginBottom: 6 }}>Mes cartes les plus chères</h2>
          <div className="list">
            {top.map(o => (
              <Link key={o.card.key} to={`/carte/${o.card.game}/${encodeURIComponent(o.card.setId)}/${encodeURIComponent(o.card.id)}`} className="li">
                {o.card.image ? <img className="thumb" src={o.card.image} alt="" loading="lazy" /> : <div className="thumb" />}
                <div className="grow">
                  <div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{o.card.name}{o.qty > 1 ? ` ×${o.qty}` : ''}</div>
                  <div className="muted tiny ellipsis">{o.card.setName ?? gameName(o.card.game)} · n° {o.card.number}</div>
                </div>
                <b style={{ fontSize: 14 }}>{fmt(o.price?.value, o.price?.currency)}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="muted tiny" style={{ textAlign: 'center' }}>
        Ta collection est gardée sur cet appareil. Bientôt : un compte pour la retrouver sur ton ordinateur.
      </p>
    </div>
  )
}
