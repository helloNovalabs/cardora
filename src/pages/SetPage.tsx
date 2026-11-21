import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fillPrices, gameColor, gameName, loadSet, type SetData } from '../lib/games'
import { addCard, fmt, follow, refreshFollowed, removeCard, toEur, unfollow, updatePrices, useCollection } from '../lib/store'
import type { Card, GameId, Price } from '../lib/types'
import { IBack, ICheck, ILeft, IRight } from '../components/Icons'
import { Confetti, Ring, Seg } from '../components/Visuals'
import { CountUp } from '../components/Brand'

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
  const touchX = useRef(0)

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
    return { missing, cost, unknown, cheapest: priced.slice(0, 8), dearest: priced.slice(-6).reverse(), haveCount, value }
  }, [data, prices, col.owned])

  if (err) return <div className="stack"><button className="back" onClick={() => nav(-1)}><IBack />Retour</button><p className="down">Impossible de charger cette extension. Réessaie dans un instant.</p></div>
  if (!data || !stats) return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="skel" style={{ height: 60 }} /><div className="skel" style={{ height: 220 }} /><div className="skel" style={{ height: 420 }} />
    </div>
  )

  const list = data.cards.filter(c => (filter === 'have' ? has(c) : filter === 'miss' ? !has(c) : true))
  const step = isDesk() ? 2 : 1
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const p = Math.min(page, pages - 1)
  const pageCards = (i: number) => list.slice(i * PER_PAGE, (i + 1) * PER_PAGE)
  const pct = data.cards.length ? Math.round((stats.haveCount / data.cards.length) * 100) : 0
  const usd = game === 'onepiece'
  const pricedCount = data.cards.filter(c => prices[c.key]).length
  const cardUrl = (c: Card) => `/carte/${game}/${encodeURIComponent(data.set.id)}/${encodeURIComponent(c.id)}`

  const tap = (c: Card) => {
    if (check) {
      if (has(c)) removeCard(c.key)
      else {
        addCard(c, prices[c.key] ?? null, followedInfo ?? undefined)
        setPopped(c.key)
        if (navigator.vibrate) navigator.vibrate(12)
        if (stats.missing.length === 1) { setParty(true); window.setTimeout(() => setParty(false), 3200) }
      }
    } else nav(cardUrl(c))
  }
  const go = (to: number, d: 'next' | 'prev') => { if (to < 0 || to > pages - 1 || to === p) return; setDir(d); setPage(to) }
  const next = () => go(Math.min(pages - 1, p + step), 'next')
  const prev = () => go(Math.max(0, p - step), 'prev')

  const slot = (c: Card) => {
    const q = has(c)
    const pr = prices[c.key]
    return (
      <button key={c.key} className={'slot ' + (q ? 'have' : 'miss') + (popped === c.key && q ? ' pop' : '')} onClick={() => tap(c)} aria-label={`${c.name} n° ${c.number}${q ? ', dans ta collection' : ', manquante'}`}>
        {c.image ? <img src={c.image} alt="" loading="lazy" /> : <div className="noimg">{c.name}<br />n° {c.number}</div>}
        <span className="ok"><ICheck /></span>
        {q > 1 && <span className="qty">×{q}</span>}
        <span className="tag">{pr?.value != null ? fmt(pr.value, pr.currency) : `n° ${c.number}`}</span>
      </button>
    )
  }

  const rail = (cards: Card[], kind: 'cheap' | 'hot') => (
    <div className="rail">
      {cards.map(c => (
        <Link key={c.key} to={cardUrl(c)} className="mini" style={{ width: 104 }}>
          <div className="pic">{c.image && <img src={c.image} alt="" loading="lazy" />}</div>
          <span className="nm ellipsis" style={{ fontSize: 12 }}>{c.name}</span>
          <span className={'price-pill ' + kind}>{fmt(prices[c.key]?.value, prices[c.key]?.currency)}</span>
        </Link>
      ))}
    </div>
  )

  return (
    <div className="stack" style={{ gap: 20, '--gc': gameColor(game) } as CSSProperties}>
      <button className="back" onClick={() => nav(`/jeux/${game}`)}><IBack />{gameName(game)}</button>

      <div className="set-head">
        <Ring pct={pct} size={72} stroke={7}><span style={{ fontSize: 15 }}>{pct}%</span></Ring>
        <div className="grow">
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}>{data.set.name}</h1>
          <p className="muted small" style={{ marginTop: 4 }}><b style={{ color: 'var(--text)' }}>{stats.haveCount}</b> sur {data.cards.length} cartes</p>
        </div>
        {data.set.logo && <img className="setlogo desk-only" src={data.set.logo} alt="" style={game === 'magic' ? { filter: 'invert(1)' } : undefined} />}
      </div>
      {followedInfo && (
        <button className={'btn sm' + (isFollowed ? '' : ' primary')} style={{ alignSelf: 'flex-start' }} onClick={() => (isFollowed ? unfollow(game, data.set.id) : follow(followedInfo))}>
          {isFollowed ? '✓ Dans mes classeurs' : 'Suivre ce classeur'}
        </button>
      )}

      {party && <Confetti />}
      <section className="panel finish">
        <div>
          <span className="kicker">Combien pour finir ?<button className="help" onClick={() => setTip(t => !t)} aria-label="Comment c'est calculé ?">?</button></span>
          {tip && (
            <p className="tip" style={{ marginTop: 8 }}>
              On additionne le prix du marché de chaque carte qui te manque (une seule de chaque). C'est une estimation :
              en achetant malin (lots, échanges), tu peux payer moins.
            </p>
          )}
          {stats.missing.length === 0 ? (
            <h2 style={{ fontSize: 28, marginTop: 8 }}>Classeur complet, bravo !</h2>
          ) : (
            <>
              <CountUp value={stats.cost} className="num foil-text big" />
              <p className="muted small">
                Il te manque <b style={{ color: 'var(--text)' }}>{stats.missing.length} carte{stats.missing.length > 1 ? 's' : ''}</b>
                {stats.unknown > 0 && !loadingPrices ? `, dont ${stats.unknown} sans prix connu (non comptée${stats.unknown > 1 ? 's' : ''})` : ''}.
                {usd ? ' Prix TCGplayer convertis depuis le dollar.' : ' Prix Cardmarket du moment.'}
              </p>
              {loadingPrices && (
                <div style={{ marginTop: 10 }}>
                  <div className="bar" style={{ height: 4 }}><span style={{ width: `${(pricedCount / data.cards.length) * 100}%` }} /></div>
                  <p className="lav tiny" style={{ marginTop: 5 }}>Je récupère les prix, {pricedCount} sur {data.cards.length}</p>
                </div>
              )}
            </>
          )}
          {stats.value > 0 && stats.cost > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="split">
                <span style={{ width: `${(stats.value / (stats.value + stats.cost)) * 100}%`, background: 'var(--up)' }} />
                <span style={{ width: `${(stats.cost / (stats.value + stats.cost)) * 100}%`, background: 'var(--foil)' }} />
              </div>
              <div className="keys">
                <span><i style={{ background: 'var(--up)' }} />Tu as {fmt(stats.value)}</span>
                <span><i style={{ background: 'var(--rose)' }} />Il reste {fmt(stats.cost)}</span>
              </div>
            </div>
          )}
          {stats.value > 0 && stats.cost === 0 && <p className="small" style={{ marginTop: 8 }}>Tes cartes de ce classeur valent <b className="up">{fmt(stats.value)}</b>.</p>}
        </div>
        {stats.missing.length > 0 && (stats.cheapest.length > 0 || stats.dearest.length > 0) && (
          <div className="stack" style={{ gap: 4, minWidth: 0 }}>
            {stats.cheapest.length > 0 && <><h3>Pour avancer pas cher</h3>{rail(stats.cheapest, 'cheap')}</>}
            {stats.dearest.length > 0 && <><h3>Les plus chères qui te manquent</h3>{rail(stats.dearest, 'hot')}</>}
          </div>
        )}
      </section>

      <div className="toolbar">
        <Seg value={filter} onChange={v => { setFilter(v); setPage(0) }} options={[['all', 'Toutes'], ['have', `J'ai ${stats.haveCount}`], ['miss', `Manquantes ${stats.missing.length}`]]} />
        <button className={'btn sm check-btn' + (check ? ' on' : '')} onClick={() => setCheck(v => !v)}>
          {check ? <><ICheck />Terminé</> : 'Cocher mes cartes'}
        </button>
      </div>
      {check && <p className="check-hint"><ICheck />Touche une carte pour l'ajouter, retouche-la pour la retirer.</p>}

      {list.length === 0 ? (
        <p className="muted small empty">Aucune carte ici pour l'instant.</p>
      ) : (
        <>
          <div className={'binders' + (check ? ' checking' : '')} key={`${p}-${filter}`} onTouchStart={e => { touchX.current = e.touches[0].clientX }} onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 60) { if (dx < 0) next(); else prev() }
          }}>
            <div className={'binder flip-' + dir}>{pageCards(p).map(slot)}</div>
            {p + 1 < pages && <div className={'binder desk-only flip-' + dir}>{pageCards(p + 1).map(slot)}</div>}
          </div>
          <div className="page-nav">
            <button className="btn round" disabled={p === 0} onClick={prev} aria-label="Page précédente"><ILeft /></button>
            <div className="stack" style={{ gap: 6, alignItems: 'center' }}>
              <span className="lbl">Page {p + 1}{step === 2 && p + 1 < pages ? `–${p + 2}` : ''} / {pages}</span>
              {pages <= 24 && <div className="dots">{Array.from({ length: pages }, (_, i) => <i key={i} className={i === p || (step === 2 && i === p + 1) ? 'on' : ''} />)}</div>}
            </div>
            <button className="btn round" disabled={p >= pages - step} onClick={next} aria-label="Page suivante"><IRight /></button>
          </div>
          <p className="muted tiny mob-only" style={{ textAlign: 'center' }}>Glisse le classeur pour tourner les pages</p>
        </>
      )}
    </div>
  )
}

const isDesk = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches
