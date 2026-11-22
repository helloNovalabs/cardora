import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { t as tr } from '../lib/i18n'
import { marketCached, marketCards, type MarketCard } from '../lib/market'
import { fmt } from '../lib/store'
import { CardFace } from './CardFace'

const url = (c: MarketCard['card']) => `/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`
const pctText = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(Math.abs(n) < 10 ? 1 : 0)} %`

function useMarket() {
  const [list, setList] = useState<MarketCard[] | null>(marketCached)
  useEffect(() => {
    let live = true
    marketCards(l => { if (live) setList(l) }).then(l => { if (live) setList(l) }).catch(() => { if (live) setList(x => x ?? []) })
    return () => { live = false }
  }, [])
  return list
}

/** La vraie évolution : moyenne 30 jours, 7 jours, hier, aujourd'hui. */
function Spark({ m }: { m: MarketCard }) {
  const p = [m.price.avg30, m.price.avg7, m.price.avg1, m.price.value].filter((v): v is number => v != null)
  if (p.length < 2) return null
  const lo = Math.min(...p), hi = Math.max(...p), span = hi - lo || 1
  const pts = p.map((v, i) => `${(i / (p.length - 1)) * 100},${26 - ((v - lo) / span) * 22}`).join(' ')
  return <svg className={'mk-spark ' + ((m.trend ?? 0) >= 0 ? 'up' : 'down')} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden><polyline points={pts} vectorEffect="non-scaling-stroke" /></svg>
}

function Item({ m, rank }: { m: MarketCard; rank: number }) {
  return (
    <Link to={url(m.card)} className={'mk-item' + (rank === 1 ? ' first' : '')}>
      <span className="mk-pic"><CardFace card={rank === 1 ? { ...m.card, image: m.card.image.replace('/low.webp', '/high.webp') } : m.card} /></span>
      <span className="mk-rank">{rank}</span>
      <span className="mk-info">
        <b className="ellipsis">{m.card.name}</b>
        <small className="ellipsis">{m.card.setName}</small>
        <Spark m={m} />
        <span className="mk-num"><strong>{fmt(m.price.value)}</strong>{m.trend != null && <em className={m.trend >= 0 ? 'up' : 'down'}>{pctText(m.trend)}</em>}</span>
      </span>
    </Link>
  )
}

const BUDGETS: [string, number, number][] = [['Tous les prix', 0, Infinity], ['Moins de 50 €', 0, 50], ['50 à 200 €', 50, 200], ['Plus de 200 €', 200, Infinity]]
const VIEWS = ['Ça monte', 'Ça baisse', 'Les plus chères']

/** Le classement du marché Pokémon. */
export function MarketTrends() {
  const list = useMarket()
  const [view, setView] = useState(0)
  const [budget, setBudget] = useState(0)
  const shown = useMemo(() => {
    const [, lo, hi] = BUDGETS[budget]
    const l = (list ?? []).filter(m => m.price.value! >= lo && m.price.value! < hi)
    if (view === 0) return l.filter(m => (m.trend ?? 0) > 0).sort((a, b) => b.trend! - a.trend!)
    if (view === 1) return l.filter(m => (m.trend ?? 0) < 0).sort((a, b) => a.trend! - b.trend!)
    return [...l].sort((a, b) => b.price.value! - a.price.value!)
  }, [list, view, budget])
  return (
    <section className="stack mk" style={{ gap: 14 }}>
      <div className="mk-tabs" role="tablist">
        {VIEWS.map((v, i) => <button key={v} role="tab" aria-selected={view === i} onClick={() => setView(i)}>{tr(v)}</button>)}
      </div>
      <div className="chips" role="group" aria-label={tr('Budget')}>
        {BUDGETS.map(([l], i) => <button key={l} className="chip-btn" aria-pressed={budget === i} onClick={() => setBudget(i)}>{tr(l)}</button>)}
      </div>
      {!list || (list.length === 0) ? <div className="mk-grid">{Array.from({ length: 5 }, (_, i) => <div key={i} className={'skel' + (i ? '' : ' mk-skel')} style={{ minHeight: 150 }} />)}</div>
        : shown.length === 0 ? <p className="muted small">{tr('Aucune carte à ce prix pour le moment.')}</p>
        : <div className="mk-grid">{shown.slice(0, 9).map((m, i) => <Item key={m.card.key} m={m} rank={i + 1} />)}</div>}
      <p className="muted tiny">{tr('Prix Cardmarket du jour. Le pourcentage compare la moyenne sur 7 jours à celle sur 30 jours, pour les cartes rares des dernières extensions. Ce n’est pas un conseil d’achat.')}</p>
    </section>
  )
}

/** Sur l'accueil : les cartes qui montent le plus. */
export function MarketRail() {
  const list = useMarket()
  const top = (list ?? []).filter(m => (m.trend ?? 0) > 0).sort((a, b) => b.trend! - a.trend!).slice(0, 10)
  if (!top.length) return null
  return (
    <section className="stack" style={{ gap: 6 }}>
      <div className="sec-h"><h2>{tr('Ça monte en ce moment')}</h2><Link to="/boutique">{tr('Voir le marché')}</Link></div>
      <div className="rail">
        {top.map(m => (
          <Link key={m.card.key} to={url(m.card)} className="mini">
            <div className="pic"><CardFace card={m.card} /></div>
            <span className="nm ellipsis">{m.card.name}</span>
            <span className="delta up">{pctText(m.trend!)}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
