import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { GAMES, gameColor, gameMeta, gameName, listSets } from '../lib/games'
import { tcgSealedPrice } from '../lib/tcg'
import { deleteSealed, fmt, getState, saveSealed, toEur, sealedUnit, totals, unitValue, useCollection, type Sealed, type SealedKind } from '../lib/store'
import type { GameId, SetInfo } from '../lib/types'
import { CountUp } from '../components/Brand'
import { Seg, ValueChart } from '../components/Visuals'
import { KINDS, SealedArt, kindLabel } from '../components/Sealed'
import { IPlus } from '../components/Icons'
import { CardFace } from '../components/CardFace'

const cardUrl = (c: { game: string; setId: string; id: string }) => `/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`
const signed = (n: number) => (n >= 0 ? '+' : '−') + fmt(Math.abs(n))
const pct = (gain: number, base: number) => (base > 0 ? Math.round((gain / base) * 100) : null)
export const cardmarketSearch = (game: GameId, q: string) => {
  const cm = gameMeta(game)?.cm
  return cm ? `https://www.cardmarket.com/fr/${cm}/Products/Search?searchString=${encodeURIComponent(q)}`
    : `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(q)}`
}

export default function Invest() {
  const s = useCollection()
  const t = totals(s)
  const sealed = s.sealed ?? []
  const [range, setRange] = useState<'30' | '90' | 'all'>('30')
  const [edit, setEdit] = useState<Sealed | 'new' | null>(null)

  // Les produits scellés ajoutés depuis une extension suivent le prix TCGplayer tout seuls (une fois par jour).
  useEffect(() => {
    const day = 20 * 3600 * 1000
    for (const x of getState().sealed ?? []) {
      if (!x.src || (x.valueAt && Date.now() - x.valueAt < day)) continue
      tcgSealedPrice(x.src).then(p => {
        const v = toEur(p)
        if (v == null) return
        const cur = (getState().sealed ?? []).find(y => y.id === x.id)
        if (cur) saveSealed({ ...cur, value: Math.round(v * 100) / 100, valueAt: Date.now() })
      }).catch(() => {})
    }
  }, [])

  const hist = useMemo(() => {
    const h = s.history ?? []
    if (range === 'all') return h
    const from = new Date(Date.now() - Number(range) * 864e5).toLocaleDateString('sv-SE')
    return h.filter(x => x.d >= from)
  }, [s.history, range])
  const first = hist[0]
  const change = first && hist.length > 1 ? t.total - first.v : null

  // Cartes qui bougent : prix d'aujourd'hui comparé à la moyenne des 30 derniers jours
  const movers = Object.values(s.owned)
    .filter(o => o.price?.value != null && o.price.avg30)
    .map(o => ({ o, p: ((o.price!.value! - o.price!.avg30!) / o.price!.avg30!) * 100 }))
    .filter(x => Math.abs(x.p) >= 1)
  const ups = [...movers].filter(x => x.p > 0).sort((a, b) => b.p - a.p).slice(0, 4)
  const downs = [...movers].filter(x => x.p < 0).sort((a, b) => a.p - b.p).slice(0, 4)

  const deals = Object.values(s.owned)
    .filter(o => o.buy != null && unitValue(o) != null)
    .map(o => ({ o, g: ((unitValue(o) ?? 0) - (o.buy ?? 0)) * o.qty }))
    .sort((a, b) => b.g - a.g).slice(0, 6)

  const cardsShare = t.total > 0 ? (t.cards / t.total) * 100 : 0
  const gp = pct(t.gain, t.paid)

  return (
    <div className="stack fade-in" style={{ gap: 28 }}>
      <section className="panel inv-hero">
        <div className="stack" style={{ gap: 4 }}>
          <span className="kicker">Tout ce que tu possèdes vaut</span>
          <CountUp value={t.total} className="num foil-text value-big" />
          {t.tracked > 0 ? (
            <p className="gain-line">
              <span className={'delta ' + (t.gain >= 0 ? 'up' : 'down')}>{signed(t.gain)}{gp != null ? ` (${gp >= 0 ? '+' : ''}${gp} %)` : ''}</span>
              <span className="muted small">par rapport à ce que tu as payé ({fmt(t.paid)}, sur {t.tracked} objet{t.tracked > 1 ? 's' : ''})</span>
            </p>
          ) : (
            <p className="muted small" style={{ maxWidth: 440 }}>Note ce que tu as payé (sur la fiche d’une carte ou d’un objet scellé) pour voir combien tu gagnes.</p>
          )}
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <div className="row between wrap" style={{ gap: 10 }}>
            <span className="small" style={{ fontWeight: 700 }}>
              {change != null ? <>Sur la période : <span className={change >= 0 ? 'up' : 'down'}>{signed(change)}</span></> : 'Évolution'}
            </span>
            <Seg value={range} onChange={setRange} options={[['30', '30 jours'], ['90', '3 mois'], ['all', 'Tout']]} />
          </div>
          {hist.length > 0 ? <ValueChart points={hist} /> : <div className="vchart empty-chart muted small">La courbe démarre dès que tu ajoutes une carte.</div>}
          {(s.history?.length ?? 0) < 3 && <p className="muted tiny">Cardora note la valeur une fois par jour quand tu ouvres l’appli : la courbe se remplit avec le temps.</p>}
        </div>

        {t.total > 0 && (
          <div className="mix">
            <div className="mix-bar"><span style={{ width: cardsShare + '%' }} /><span style={{ width: 100 - cardsShare + '%' }} /></div>
            <div className="row between small">
              <span><i className="dot c" />Cartes <b>{fmt(t.cards)}</b></span>
              <span><i className="dot s" />Scellé <b>{fmt(t.sealed)}</b></span>
            </div>
          </div>
        )}
      </section>

      <section className="stack">
        <div className="sec-h"><h2>Mes objets scellés</h2>{sealed.length > 0 && <button className="link" onClick={() => setEdit('new')}>Ajouter</button>}</div>
        <p className="muted small" style={{ maxWidth: 560, marginTop: -4 }}>
          Boosters, displays, coffrets jamais ouverts. Ajoutés depuis la page d’une extension, ils ont une photo et un prix TCGplayer qui se met à jour tout seul. Sinon, tu notes toi-même le prix et on t’envoie vérifier sur Cardmarket.
        </p>
        <div className="grid-sealed">
          {sealed.map(x => {
            const unit = sealedUnit(x)
            const g = x.buy != null ? (unit - x.buy) * x.qty : null
            const old = x.valueAt != null && Date.now() - x.valueAt > 30 * 864e5
            return (
              <button key={x.id} className="sealed-tile" style={{ '--gc': gameColor(x.game) } as CSSProperties} onClick={() => setEdit(x)}>
                <div className="stage">{x.image ? <img className="sealed-photo" src={x.image} alt="" loading="lazy" /> : <SealedArt kind={x.kind} color={gameColor(x.game)} logo={x.logo} label={x.setName ?? gameName(x.game)} size={118} invert={x.game === 'magic'} />}</div>
                {x.qty > 1 && <span className="qty">×{x.qty}</span>}
                <span className="nm">{x.setName || gameName(x.game)}</span>
                <span className="muted tiny">{kindLabel(x.kind)}</span>
                <span className="row between" style={{ marginTop: 4 }}>
                  <b className="num">{fmt(unit * x.qty)}</b>
                  {g != null && Math.round(g) !== 0 && <span className={'tiny ' + (g > 0 ? 'up' : 'down')}>{signed(g)}</span>}
                </span>
                {x.value == null && <span className="tiny muted">Prix d’achat (pas de prix du jour)</span>}
                {old && <span className="tiny warn">Prix à revérifier</span>}
              </button>
            )
          })}
          <button className="sealed-tile add" onClick={() => setEdit('new')}>
            <div className="stage ghosts">
              <SealedArt kind="booster" color="#3DC8FF" label="?" size={70} />
              <SealedArt kind="etb" color="#FF3D6E" label="?" size={84} />
            </div>
            <span className="nm"><IPlus />Ajouter un objet scellé</span>
          </button>
        </div>
      </section>

      {(ups.length > 0 || downs.length > 0) && (
        <section className="stack">
          <div className="sec-h"><h2>Ce qui bouge</h2><span className="muted tiny">Prix du jour comparé à la moyenne sur 30 jours</span></div>
          <div className="movers">
            {[['Ça monte', ups], ['Ça baisse', downs]].map(([title, list]) => (list as typeof ups).length > 0 && (
              <div key={title as string} className="box stack" style={{ gap: 8 }}>
                <h3 className="small">{title as string}</h3>
                {(list as typeof ups).map(({ o, p }) => (
                  <Link key={o.card.key} to={cardUrl(o.card)} className="mover">
                    {o.card.image ? <img src={o.card.image} alt="" loading="lazy" /> : <span className="ph" />}
                    <span className="grow ellipsis small" style={{ fontWeight: 700 }}>{o.card.name}</span>
                    <span className="tiny muted">{fmt(o.price?.value, o.price?.currency)}</span>
                    <span className={'delta ' + (p > 0 ? 'up' : 'down')}>{p > 0 ? '▲' : '▼'} {Math.abs(Math.round(p))} %</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="stack">
        <div className="sec-h"><h2>Mes meilleures affaires</h2></div>
        {deals.length === 0 ? (
          <p className="muted small box">Ouvre une carte de ta collection et note « J’ai payé » : tu verras ici les cartes qui t’ont rapporté le plus.</p>
        ) : (
          <div className="rail">
            {deals.map(({ o, g }) => (
              <Link key={o.card.key} to={cardUrl(o.card)} className="mini">
                <div className="pic"><CardFace card={o.card} /></div>
                <span className="nm ellipsis">{o.card.name}</span>
                <span className={'delta ' + (g >= 0 ? 'up' : 'down')}>{signed(g)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {edit && <SealedSheet item={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

const READY = GAMES.filter(g => g.ready) as (typeof GAMES[number] & { id: GameId })[]
const toNum = (v: string) => { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null }

function SealedSheet({ item, onClose }: { item: Sealed | null; onClose: () => void }) {
  const [game, setGame] = useState<GameId>(item?.game ?? 'pokemon')
  const [kind, setKind] = useState<SealedKind>(item?.kind ?? 'booster')
  const [setName, setSetName] = useState(item?.setName ?? '')
  const [logo, setLogo] = useState(item?.logo)
  const [qty, setQty] = useState(item?.qty ?? 1)
  const [buy, setBuy] = useState(item?.buy != null ? String(item.buy) : '')
  const [value, setValue] = useState(item?.value != null ? String(item.value) : '')
  const [sets, setSets] = useState<SetInfo[]>([])
  const [focus, setFocus] = useState(false)

  useEffect(() => { listSets(game).then(setSets).catch(() => setSets([])) }, [game])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose])

  const sugg = useMemo(() => {
    const q = setName.trim().toLowerCase()
    return q ? sets.filter(x => x.name.toLowerCase().includes(q) && x.name !== setName).slice(0, 6) : []
  }, [sets, setName])

  const color = gameColor(game)
  const label = setName || gameName(game)
  const save = () => {
    const v = toNum(value)
    saveSealed({
      id: item?.id ?? Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      game, kind, name: `${kindLabel(kind)} ${setName}`.trim(), setName: setName.trim() || undefined, logo,
      qty, buy: toNum(buy), value: v, valueAt: v == null ? null : (item && item.value === v ? item.valueAt : Date.now()),
      addedAt: item?.addedAt ?? Date.now(), image: item?.image, src: item?.src,
    })
    onClose()
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item ? 'Modifier l’objet scellé' : 'Ajouter un objet scellé'} onClick={e => e.stopPropagation()} style={{ '--gc': color } as CSSProperties}>
        <div className="sheet-grip" />
        <div className="sheet-preview">
          <SealedArt kind={kind} color={color} logo={logo} label={label} size={150} invert={game === 'magic'} />
        </div>
        <h2>{item ? 'Modifier' : 'Ajouter un objet scellé'}</h2>

        <div className="stack" style={{ gap: 8 }}>
          <span className="kicker">Jeu</span>
          <div className="chips">
            {READY.map(g => (
              <button key={g.id} className={'chip' + (game === g.id ? ' on' : '')} style={{ '--gc': g.color } as CSSProperties}
                onClick={() => { if (g.id !== game) { setGame(g.id); setSetName(''); setLogo(undefined) } }}>
                <span className="gdot-s" style={{ background: g.color }} />{g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <span className="kicker">Type</span>
          <div className="kinds">
            {KINDS.map(k => (
              <button key={k.id} className={'kind' + (kind === k.id ? ' on' : '')} onClick={() => setKind(k.id)} aria-pressed={kind === k.id}>
                <SealedArt kind={k.id} color={color} label="" size={46} />
                <span>{k.short}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="stack" style={{ gap: 8, position: 'relative' }}>
          <span className="kicker">Extension</span>
          <input className="field" placeholder="Par exemple : 151, Évolutions Prismatiques…" value={setName}
            onChange={e => { const v = e.target.value; setSetName(v); setLogo(sets.find(x => x.name.toLowerCase() === v.trim().toLowerCase())?.logo) }} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} />
          {focus && sugg.length > 0 && (
            <div className="sugg">
              {sugg.map(x => (
                <button key={x.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setSetName(x.name); setLogo(x.logo); setFocus(false) }}>
                  {x.logo ? <img src={x.logo} alt="" style={game === 'magic' ? { filter: 'invert(1)' } : undefined} /> : <span className="ph" />}
                  <span className="ellipsis">{x.name}</span>
                  {x.date && <span className="muted tiny">{x.date.slice(0, 4)}</span>}
                </button>
              ))}
            </div>
          )}
        </label>

        <div className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
          <div className="stack grow" style={{ gap: 8 }}>
            <span className="kicker">Combien</span>
            <div className="qty-mini">
              <button className="btn sm" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Un de moins">−</button>
              <b>{qty}</b>
              <button className="btn sm" onClick={() => setQty(q => q + 1)} aria-label="Un de plus">+</button>
            </div>
          </div>
        </div>

        <div className="two">
          <label className="stack" style={{ gap: 8 }}>
            <span className="kicker">J’ai payé (pour un)</span>
            <input className="field" inputMode="decimal" placeholder="Par ex. 55" value={buy} onChange={e => setBuy(e.target.value)} />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <span className="kicker">Prix aujourd’hui (pour un)</span>
            <input className="field" inputMode="decimal" placeholder="Par ex. 80" value={value} onChange={e => setValue(e.target.value)} />
          </label>
        </div>
        <a className="btn sm" target="_blank" rel="noreferrer" href={cardmarketSearch(game, `${setName}`.trim() || gameName(game))}>
          Voir les prix sur Cardmarket ↗
        </a>
        <p className="muted tiny">Sans prix du jour, on compte le prix que tu as payé. Pense à le mettre à jour de temps en temps.</p>

        <div className="row" style={{ gap: 10, marginTop: 4 }}>
          {item && <button className="btn ghost down" onClick={() => { if (confirm('Retirer cet objet de ta collection ?')) { deleteSealed(item.id); onClose() } }}>Retirer</button>}
          <button className="btn ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>Annuler</button>
          <button className="btn primary" onClick={save}>{item ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
      </div>
    </div>
  )
}
