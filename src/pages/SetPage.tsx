import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fillPrices, gameName, loadSet, type SetData } from '../lib/games'
import { addCard, fmt, follow, refreshFollowed, removeCard, toEur, unfollow, updatePrices, useCollection } from '../lib/store'
import type { Card, GameId, Price } from '../lib/types'
import { IBack } from '../components/Icons'
import { Confetti } from '../components/Visuals'

type Filter = 'all' | 'have' | 'miss'
const PER_PAGE = 9

export default function SetPage() {
  const { game, setId = '' } = useParams() as { game: GameId; setId: string }
  const nav = useNavigate()
  const col = useCollection()
  const [data, setData] = useState<SetData | null>(null)
  const [err, setErr] = useState(false)
  const [prices, setPrices] = useState<Record<string, Price>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [check, setCheck] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const [popped, setPopped] = useState('')
  const [party, setParty] = useState(false)
  const [tip, setTip] = useState(false)

  useEffect(() => {
    let alive = true
    setData(null); setErr(false); setPage(0)
    loadSet(game, setId).then(d => {
      if (!alive) return
      setData(d); setPrices(d.prices); updatePrices(d.prices)
      refreshFollowed({ game, setId: d.set.id, name: d.set.name, total: d.cards.length, logo: d.set.logo })
      if (game === 'pokemon') {
        setLoadingPrices(true)
        const acc: Record<string, Price> = {}
        fillPrices(d.cards, acc, p => { if (alive) { setPrices(p); updatePrices(p) } }).finally(() => alive && setLoadingPrices(false))
      }
    }).catch(() => alive && setErr(true))
    return () => { alive = false }
  }, [game, setId])

  const followedInfo = data && { game, setId: data.set.id, name: data.set.name, total: data.cards.length, logo: data.set.logo }
  const isFollowed = col.followed.some(f => f.game === game && f.setId === (data?.set.id ?? setId))
  const has = (c: Card) => col.owned[c.key]?.qty ?? 0

  const stats = useMemo(() => {
    if (!data) return null
    const missing = data.cards.filter(c => !col.owned[c.key])
    let cost = 0, unknown = 0
    for (const c of missing) {
      const v = toEur(prices[c.key])
      if (v == null) unknown++
      else cost += v
    }
    const priced = missing.filter(c => toEur(prices[c.key]) != null).sort((a, b) => toEur(prices[a.key])! - toEur(prices[b.key])!)
    const haveCount = data.cards.length - missing.length
    const value = data.cards.reduce((n, c) => n + (toEur(prices[c.key]) ?? 0) * (col.owned[c.key]?.qty ?? 0), 0)
    return { missing, cost, unknown, cheapest: priced.slice(0, 5), dearest: priced.slice(-3).reverse(), haveCount, value }
  }, [data, prices, col.owned])

  if (err) return <div className="stack"><button className="back" onClick={() => nav(-1)}><IBack />Retour</button><p className="down">Impossible de charger cette extension. Réessaie dans un instant.</p></div>
  if (!data || !stats) return <div className="spin" />

  const list = data.cards.filter(c => (filter === 'have' ? has(c) : filter === 'miss' ? !has(c) : true))
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const p = Math.min(page, pages - 1)
  const pageCards = (i: number) => list.slice(i * PER_PAGE, (i + 1) * PER_PAGE)
  const pct = data.cards.length ? Math.round((stats.haveCount / data.cards.length) * 100) : 0
  const usd = game === 'onepiece'
  const pricedCount = data.cards.filter(c => prices[c.key]).length

  const tap = (c: Card) => {
    if (check) {
      if (has(c)) removeCard(c.key)
      else {
        addCard(c, prices[c.key] ?? null, followedInfo ?? undefined)
        setPopped(c.key)
        if (stats.missing.length === 1) { setParty(true); window.setTimeout(() => setParty(false), 3200) }
      }
    } else nav(`/carte/${game}/${encodeURIComponent(data.set.id)}/${encodeURIComponent(c.id)}`)
  }
  const go = (to: number, d: 'next' | 'prev') => { setDir(d); setPage(to) }

  const slot = (c: Card) => {
    const q = has(c)
    const pr = prices[c.key]
    return (
      <button key={c.key} className={'slot' + (q ? '' : ' miss') + (popped === c.key && q ? ' pop' : '')} onClick={() => tap(c)} aria-label={`${c.name} n° ${c.number}${q ? ', dans ta collection' : ', manquante'}`}>
        {c.image ? <img src={c.image} alt="" loading="lazy" /> : <div className="noimg">{c.name}<br />n° {c.number}</div>}
        {q > 1 && <span className="qty">×{q}</span>}
        <span className="tag" style={{ color: q ? 'var(--text)' : 'var(--lavande)' }}>
          {pr?.value != null ? fmt(pr.value, pr.currency) : `n° ${c.number}`}
        </span>
      </button>
    )
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <button className="back" onClick={() => nav(`/jeux/${game}`)}><IBack />{gameName(game)}</button>

      <div className="row between wrap" style={{ gap: 12 }}>
        <div className="row grow" style={{ gap: 12 }}>
          {data.set.logo && <img className="setlogo" src={data.set.logo} alt="" style={game === 'magic' ? { filter: 'invert(1)' } : undefined} />}
          <div className="grow">
            <h1 style={{ fontSize: 21 }}>{data.set.name}</h1>
            <p className="muted small">{stats.haveCount} / {data.cards.length} cartes · {pct} %</p>
          </div>
        </div>
        {followedInfo && (
          <button className="btn sm ghost" onClick={() => (isFollowed ? unfollow(game, data.set.id) : follow(followedInfo))}>
            {isFollowed ? 'Retirer de mes classeurs' : 'Suivre ce classeur'}
          </button>
        )}
      </div>
      <div className="bar"><span style={{ width: pct + '%' }} /></div>

      {/* ---- Combien pour finir ---- */}
      {party && <Confetti />}
      <section className="box stack" style={{ background: 'linear-gradient(150deg, #261E45, #1A1626 70%)' }}>
        <div className="label">Combien pour finir ?<button className="help" onClick={() => setTip(t => !t)} aria-label="Comment c'est calculé ?">?</button></div>
        {tip && (
          <p className="tip" style={{ marginTop: 0 }}>
            On additionne le prix du marché de chaque carte qui te manque (une seule de chaque). C'est une estimation :
            en achetant malin (lots, échanges), tu peux payer moins.
          </p>
        )}
        {stats.missing.length === 0 ? (
          <h2>Bravo, ce classeur est complet 🎉</h2>
        ) : (
          <>
            <div>
              <span className="stat-n">≈ {fmt(stats.cost)}</span>
              <p className="muted small" style={{ marginTop: 2 }}>
                Il te manque {stats.missing.length} carte{stats.missing.length > 1 ? 's' : ''}
                {stats.unknown > 0 && !loadingPrices ? ` (dont ${stats.unknown} sans prix connu, non comptée${stats.unknown > 1 ? 's' : ''})` : ''}.
                {usd ? ' Prix TCGplayer convertis depuis le dollar.' : ' Prix Cardmarket du moment.'}
              </p>
              {loadingPrices && <p className="lav tiny" style={{ marginTop: 4 }}>Je récupère les prix… {pricedCount} / {data.cards.length}</p>}
            </div>
            {stats.cheapest.length > 0 && (
              <div>
                <h3 style={{ marginBottom: 4 }}>Pour avancer pas cher</h3>
                <div className="list">
                  {stats.cheapest.map(c => (
                    <Link key={c.key} className="li" to={`/carte/${game}/${encodeURIComponent(data.set.id)}/${encodeURIComponent(c.id)}`}>
                      {c.image ? <img className="thumb" src={c.image} alt="" loading="lazy" /> : <div className="thumb" />}
                      <div className="grow ellipsis small">{c.name} <span className="muted">n° {c.number}</span></div>
                      <b className="small">{fmt(prices[c.key]?.value, prices[c.key]?.currency)}</b>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {stats.dearest.length > 0 && (
              <p className="muted small">
                Les plus chères qui te manquent : {stats.dearest.map(c => `${c.name} (${fmt(prices[c.key]?.value, prices[c.key]?.currency)})`).join(', ')}.
              </p>
            )}
          </>
        )}
        {stats.value > 0 && stats.cost > 0 && (
          <div>
            <div className="split">
              <span style={{ width: `${(stats.value / (stats.value + stats.cost)) * 100}%`, background: 'var(--up)' }} />
              <span style={{ width: `${(stats.cost / (stats.value + stats.cost)) * 100}%`, background: 'var(--violet)' }} />
            </div>
            <div className="row between tiny" style={{ marginTop: 6 }}>
              <span><b className="up">●</b> Tu as {fmt(stats.value)}</span>
              <span><b style={{ color: 'var(--violet)' }}>●</b> Reste {fmt(stats.cost)}</span>
            </div>
          </div>
        )}
        {stats.value > 0 && stats.cost === 0 && <p className="small">Tes cartes de ce classeur valent <b className="up">{fmt(stats.value)}</b>.</p>}
      </section>

      {/* ---- Classeur ---- */}
      <div className="row between wrap" style={{ gap: 10 }}>
        <div className="chips">
          {([['all', 'Toutes'], ['have', "J'ai"], ['miss', 'Il me manque']] as [Filter, string][]).map(([k, l]) => (
            <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => { setFilter(k); setPage(0) }}>{l}</button>
          ))}
        </div>
        <button className={'btn sm' + (check ? ' primary' : '')} onClick={() => setCheck(v => !v)}>
          {check ? 'Terminé' : 'Cocher mes cartes'}
        </button>
      </div>
      {check && <p className="lav small">Touche une carte pour l'ajouter à ta collection, retouche-la pour la retirer.</p>}

      {list.length === 0 ? (
        <p className="muted small empty">Aucune carte ici pour l'instant.</p>
      ) : (
        <>
          <div className="binders" key={`${p}-${filter}`}>
            <div className={'binder flip-' + dir}>{pageCards(p).map(slot)}</div>
            {p + 1 < pages && <div className={'binder desk-only flip-' + dir}>{pageCards(p + 1).map(slot)}</div>}
          </div>
          <div className="page-nav">
            <button className="btn sm" disabled={p === 0} onClick={() => go(Math.max(0, p - (isDesk() ? 2 : 1)), 'prev')}>‹ Page</button>
            <span>Page {p + 1}{isDesk() && p + 1 < pages ? `–${p + 2}` : ''} / {pages}</span>
            <button className="btn sm" disabled={p >= pages - (isDesk() ? 2 : 1)} onClick={() => go(Math.min(pages - 1, p + (isDesk() ? 2 : 1)), 'next')}>Page ›</button>
          </div>
        </>
      )}
    </div>
  )
}

const isDesk = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches
