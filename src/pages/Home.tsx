import { t as tr } from '../lib/i18n'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { wasSeen } from '../lib/seen'
import { fmt, ownedInSet, unitValue, useCollection } from '../lib/store'
import { CardFace } from '../components/CardFace'
import { MarketRail } from '../components/Market'
import { GAMES, gameName } from '../lib/games'
import { CardWall } from '../components/CardWall'
import { ISearch } from '../components/Icons'
import { CountUp } from '../components/Brand'
import GameTiles from '../components/GameTiles'
import { WishAlert } from '../components/InvestTools'

const cardUrl = (c: { game: string; setId: string; id: string }) => `/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`

export default function Home() {
  const s = useCollection()
  const owned = Object.values(s.owned)
  if (owned.length === 0 && s.followed.length === 0) return wasSeen() || (s.sealed ?? []).length ? <Welcome /> : <Navigate to="/decouvrir" replace />

  const count = owned.reduce((n, o) => n + o.qty, 0)
  const value = owned.reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0)
  const top = [...owned].filter(o => unitValue(o) != null).sort((a, b) => (unitValue(b) ?? 0) - (unitValue(a) ?? 0)).slice(0, 10)
  const best = top[0]
  const byGame = GAMES.filter(g => g.ready).map(g => ({
    label: g.name, color: g.color,
    value: owned.filter(o => o.card.game === g.id).reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0),
    n: owned.filter(o => o.card.game === g.id).reduce((n, o) => n + o.qty, 0),
  })).filter(p => p.n > 0).sort((a, b) => b.value - a.value)

  const hist = s.history ?? []
  const prev = hist.length > 1 ? hist[hist.length - 2].v : null
  const diff = prev != null ? value + (s.sealed?.reduce((n, x) => n + (x.value ?? x.buy ?? 0) * x.qty, 0) ?? 0) - prev : 0
  const show = top.slice(0, 3)

  return (
    <div className="stack fade-in hm" style={{ gap: 34 }}>
      <WishAlert />
      <section className={'hm-hero' + (show.length ? '' : ' solo')}>
        <div className="hm-val">
          <span>{s.sealed?.length ? tr('Tes cartes valent') : tr('Ta collection vaut')}</span>
          <CountUp value={value} className="value-big" />
          {Math.abs(diff) >= 0.01 && <em className={diff > 0 ? 'up' : 'down'}>{diff > 0 ? '+' : '−'}{fmt(Math.abs(diff))} {tr('depuis ta dernière visite')}</em>}
          <p>
            <b>{count}</b> {tr(count > 1 ? 'cartes' : 'carte')}<i /><b>{s.followed.length}</b> {tr(s.followed.length > 1 ? 'classeurs' : 'classeur')}
            {best && <><i />{tr('la plus chère')} <b>{fmt(unitValue(best))}</b></>}
          </p>
          {byGame.length > 1 && value > 0 && (
            <div className="hm-mix" aria-label={byGame.map(p => `${p.label} ${fmt(p.value)}`).join(', ')}>
              {byGame.map(p => <span key={p.label} title={`${p.label} : ${fmt(p.value)}`} style={{ flexGrow: Math.max(p.value, value * .02), background: p.color }} />)}
            </div>
          )}
        </div>
        {show.length > 0 && (
          <div className={'hm-show n' + show.length}>
            {(show.length === 3 ? [show[1], show[0], show[2]] : show).map(o => (
              <Link key={o.card.key} to={cardUrl(o.card)} aria-label={o.card.name}><CardFace card={o.card} big /></Link>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <div className="sec-h"><h2>{tr('Mes classeurs')}</h2><Link to="/jeux">{tr('Nouveau classeur')}</Link></div>
        {s.followed.length === 0 ? (
          <Link to="/jeux" className="hm-none">{tr('Ouvre une extension et touche « Suivre ce classeur » : tu verras ici ta progression.')}</Link>
        ) : (
          <div className="hm-binders">
            {s.followed.map(f => {
              const mine = ownedInSet(s, f.game, f.setId)
              const worth = mine.reduce((n, o) => n + (unitValue(o) ?? 0) * o.qty, 0)
              const pct = f.total ? Math.min(100, (mine.length / f.total) * 100) : 0
              const peek = [...mine].sort((a, b) => (unitValue(b) ?? 0) - (unitValue(a) ?? 0)).slice(0, 3)
              return (
                <Link key={f.game + f.setId} to={`/jeux/${f.game}/${encodeURIComponent(f.setId)}`} className="hm-binder">
                  <span className="peek">
                    {peek.map(o => <span key={o.card.key}><CardFace card={o.card} /></span>)}
                    {peek.length === 0 && f.logo && <img className="lg" src={f.logo} alt="" loading="lazy" style={f.game === 'magic' ? { filter: 'invert(1)' } : undefined} />}
                  </span>
                  <span className="txt">
                    <b className="ellipsis">{f.name}</b>
                    <small>{gameName(f.game)}{worth > 0 ? `, ${fmt(worth)}` : ''}</small>
                  </span>
                  <strong>{Math.round(pct)} %</strong>
                  <span className="bar"><span style={{ width: pct + '%' }} /></span>
                  <small className="cnt">{mine.length} / {f.total || '?'}</small>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {top.length > 3 && (
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
                <span className="price-pill">{o.grade?.value != null ? fmt(o.grade.value) : fmt(o.price?.value, o.price?.currency)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <MarketRail />
      <Maker />
    </div>
  )
}

function Welcome() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  return (
    <div className="stack fade-in hm" style={{ gap: 34 }}>
      <section className="hm-start">
        <CardWall columns={5} />
        <div>
          <h1>{tr('Quelle est ta première carte ?')}</h1>
          <form className="hm-search" onSubmit={e => { e.preventDefault(); nav(q.trim() ? `/ajouter?q=${encodeURIComponent(q.trim())}` : '/ajouter') }}>
            <ISearch />
            <input aria-label={tr('Chercher une carte')} placeholder={tr('Dracaufeu, Pikachu, Luffy…')} value={q} onChange={e => setQ(e.target.value)} />
            <button className="btn primary sm">{tr('Chercher')}</button>
          </form>
          <Link to="/decouvrir">{tr('Revoir la présentation de Cardora')}</Link>
        </div>
      </section>
      <section className="stack">
        <h2>{tr('Ou ouvre un classeur')}</h2>
        <GameTiles />
      </section>
      <MarketRail />
      <Maker />
    </div>
  )
}

/** Tout en bas : « Un projet de » + logo BRILVA Labs. */
function Maker() {
  return (
    <div className="maker">
      <span>{tr('Un projet de')}</span>
      <img src="/brand/brilva-labs-blanc.png" alt="BRILVA Labs" width={132} height={79} loading="lazy" />
    </div>
  )
}
