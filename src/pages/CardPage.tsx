import { WishBox } from '../components/InvestTools'
import { t as tr } from '../lib/i18n'
import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { gameColor, imgLarge, loadCard } from '../lib/games'
import { addCard, defaultLang, fmt, removeCard, setBuy, setCardLang, setGrade, toEur, useCollection, type Grade } from '../lib/store'
import { LangPicker, buyLinks, langOf } from '../components/Lang'
import { CardFace } from '../components/CardFace'
import type { Card, GameId, Price } from '../lib/types'
import { IBack, IGrade, IPlus } from '../components/Icons'
import { HoloCard, PriceChart, Seg } from '../components/Visuals'

// Coûts indicatifs tout compris (envoi + assurance), modifiables par l'utilisateur.
const GRADERS = [
  { id: 'pca', name: 'PCA', cost: 20, note: 'Français, envoi simple' },
  { id: 'collectaura', name: 'CollectAura', cost: 20, note: 'Français' },
  { id: 'psa', name: 'PSA', cost: 45, note: 'Américain, souvent via un intermédiaire' },
]

type Tab = 'price' | 'buy' | 'mine' | 'grade'

export default function CardPage() {
  const { game, setId = '', id = '' } = useParams() as { game: GameId; setId: string; id: string }
  const nav = useNavigate()
  const col = useCollection()
  const [card, setCard] = useState<Card | null>(null)
  const [price, setPrice] = useState<Price | null>(null)
  const [err, setErr] = useState(false)
  const [tab, setTab] = useState<Tab>('price')
  const [bump, setBump] = useState(0)

  useEffect(() => {
    setCard(null); setErr(false); setTab('price')
    loadCard(game, setId, id).then(r => { setCard(r.card); setPrice(r.price) }).catch(() => setErr(true))
  }, [game, setId, id])

  if (err) return <div className="stack"><button className="back" onClick={() => nav(-1)}><IBack />{tr('Retour')}</button><p className="down">{tr("Carte introuvable pour l'instant.")}</p></div>
  if (!card) return (
    <div className="cp"><div className="cp-grid"><div className="cp-stage"><div className="skel card-big" style={{ aspectRatio: '63/88' }} /></div><div className="cp-info"><div className="skel" style={{ height: 70 }} /><div className="skel" style={{ height: 110 }} /><div className="skel" style={{ height: 56 }} /></div></div></div>
  )

  const q = col.owned[card.key]?.qty ?? 0
  const grade = col.owned[card.key]?.grade ?? null
  const trend = price?.value != null && price.avg30 ? Math.round(((price.value - price.avg30) / price.avg30) * 100) : null
  const add = () => { addCard(card, price); setBump(b => b + 1); if (navigator.vibrate) navigator.vibrate(12) }

  const face = <HoloCard src={card.image ? imgLarge(card) : ''} face={card.image ? undefined : <CardFace card={card} big />} alt={card.name} rare={!/^(common|commune|c)$/i.test(card.rarity ?? '')} className={grade ? undefined : 'card-big'} />
  const pane = tab === 'mine' && q === 0 ? 'price' : tab
  const tabs: [Tab, string][] = [['price', tr('Prix')], ['buy', tr('Acheter')], ...(q > 0 ? [['mine', tr('Ma carte')] as [Tab, string]] : []), ['grade', tr('Grader')]]
  const figures: [string, number | null | undefined][] = price ? [[tr('La moins chère'), price.low], [tr('Moyenne 7 jours'), price.avg7], [tr('Moyenne 30 jours'), price.avg30]] : []

  return (
    <div className="cp fade-in" style={{ '--gc': gameColor(game) } as CSSProperties}>
      {card.image && <div className="cp-glow" aria-hidden><img src={card.image} alt="" referrerPolicy="no-referrer" /></div>}
      <button className="back" onClick={() => nav(-1)}><IBack />{tr('Retour')}</button>
      <div className="cp-grid">
        <div className="cp-stage">
          {grade ? (
            <div className="slab card-big">
              <div className={'slab-label ' + grade.by.toLowerCase() + (grade.by === 'BGS' && grade.g === '10' ? ' b10' : '')}>
                <div style={{ minWidth: 0 }}><div className="co">{grade.by}</div><div className="nm">{card.name}, n° {card.number}</div></div>
                <div className="g">{grade.g}<small>{GRADE_WORD[grade.g] ?? ''}</small></div>
              </div>
              {face}
            </div>
          ) : face}
        </div>

        <div className="cp-info">
          <h1>{card.name}</h1>
          <p className="cp-meta">
            <span className="gdot-s" style={{ background: gameColor(game) }} />
            <Link to={`/jeux/${game}/${encodeURIComponent(card.setId)}`}>{card.setName ?? card.setId}</Link>
            <span>n° {card.number}</span>
            {card.rarity && <span>{card.rarity}</span>}
          </p>

          {price?.value != null ? (
            <div className="cp-price">
              <strong>{fmt(price.value, price.currency)}</strong>
              {trend != null && trend !== 0 && <em className={trend > 0 ? 'up' : 'down'}>{tr('{s}{n} % en 30 jours', { s: trend > 0 ? '+' : '−', n: Math.abs(trend) })}</em>}
            </div>
          ) : (
            <p className="cp-noprice">{tr('Pas de prix fiable pour cette carte. On préfère ne rien inventer.')}</p>
          )}

          <div className="cp-act">
            {q > 0 ? (
              <div className="qty-ctl">
                <button className="btn" onClick={() => removeCard(card.key)} aria-label={tr('En retirer une')}>−</button>
                <div className="q"><b key={bump} className="fade-in" style={{ display: 'block' }}>{q}</b>{tr('dans ta collection')}</div>
                <button className="btn primary" onClick={add} aria-label={tr('En ajouter une')}><IPlus /></button>
              </div>
            ) : (
              <button className="btn primary" style={{ height: 56, fontSize: 16 }} onClick={add}><IPlus />{tr('Ajouter à ma collection')}</button>
            )}
            <WishBox card={card} price={price} />
          </div>

          <div className="cp-tabs" role="tablist" aria-label={tr('Détails de la carte')}>
            {tabs.map(([k, label]) => <button key={k} role="tab" aria-selected={pane === k} onClick={() => setTab(k)}>{label}</button>)}
          </div>

          <div className="cp-pane" role="tabpanel" key={pane}>
            {pane === 'price' && (price?.value == null ? (
              <p className="muted small">{tr('Tu peux quand même regarder les offres dans l’onglet Acheter.')}</p>
            ) : (
              <>
                {(price.avg30 || price.avg7) && <PriceChart currency={price.currency} points={[
                  { label: tr('Moy. 30 j'), v: price.avg30 }, { label: tr('Moy. 7 j'), v: price.avg7 },
                  { label: tr('Hier'), v: price.avg1 }, { label: tr("Aujourd'hui"), v: price.value },
                ]} />}
                <dl className="cp-figs">
                  {figures.filter(([, v]) => v != null && v > 0).map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{fmt(v, price.currency)}</dd></div>)}
                </dl>
                <p className="muted tiny">{tr('Prix de la carte sans boîtier de gradation, en bon état. Source : {s}.', { s: price.source ?? '' })}</p>
              </>
            ))}
            {pane === 'buy' && <LangBox card={card} owned={q > 0} lang={col.owned[card.key]?.lang} />}
            {pane === 'mine' && (
              <>
                <BuyPrice cardKey={card.key} qty={q} buy={col.owned[card.key]?.buy ?? null} now={toEur(price)} />
                <GradePicker card={card} grade={grade} />
              </>
            )}
            {pane === 'grade' && <GradeCalc card={card} price={price} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/** La langue de ma carte (si je l'ai), et où l'acheter dans une langue. */
function LangBox({ card, owned, lang }: { card: Card; owned: boolean; lang?: string }) {
  const [want, setWant] = useState<string | undefined>(lang ?? defaultLang(card.game))
  useEffect(() => { setWant(lang ?? defaultLang(card.game)) }, [card.key, lang])
  const cur = owned ? lang ?? defaultLang(card.game) : want
  const pick = (v?: string) => { if (!v) return; if (owned) setCardLang(card.key, v); else setWant(v) }
  return (
    <section className="box stack" style={{ gap: 12 }}>
      <div className="sec-h"><h2 style={{ fontSize: 20 }}>{owned ? tr('Ma carte est en') : tr('Je la cherche en')}</h2></div>
      <LangPicker value={cur} onChange={pick} />
      <p className="muted tiny">{tr('Le prix au-dessus vaut pour toutes les langues. Une carte japonaise ou anglaise peut coûter bien plus ou bien moins : regarde les offres dans sa langue.')}</p>
      <div className="row wrap" style={{ gap: 8 }}>
        {buyLinks(card.game, card.name, cur, card.number).map((l, i) => <a key={l.name} className={'btn sm' + (i ? '' : ' primary')} href={l.url} target="_blank" rel="noreferrer">{i === 0 && cur ? tr('{v} en {l}', { v: l.name, l: langOf(cur)?.tag ?? '' }) : l.name}</a>)}
      </div>
    </section>
  )
}

const COMPANIES = ['PSA', 'CGC', 'BGS', 'SGC', 'PCA', 'CollectAura']
const NOTES = ['10', '9.5', '9', '8.5', '8', '7', '6']
const GRADE_WORD: Record<string, string> = { '10': 'GEM MINT', '9.5': 'GEM MINT', '9': 'MINT', '8.5': 'NM-MT+', '8': 'NM-MT', '7': 'NEAR MINT', '6': 'EX-MT' }

/** Ma carte est-elle gradée ? Par qui, quelle note, et combien elle vaut dans son boîtier. */
function GradePicker({ card, grade }: { card: Card; grade: Grade | null }) {
  const [v, setV] = useState(grade?.value != null ? String(grade.value) : '')
  useEffect(() => { setV(grade?.value != null ? String(grade.value) : '') }, [card.key, grade?.value])
  const pick = (by: string | null, g?: string) => {
    if (!by) return setGrade(card.key, null)
    setGrade(card.key, { by, g: g ?? grade?.g ?? '10', value: grade?.value ?? null })
  }
  const commit = () => {
    if (!grade) return
    const n = parseFloat(v.replace(',', '.'))
    setGrade(card.key, { ...grade, value: Number.isFinite(n) && n >= 0 ? n : null })
  }
  const search = grade ? encodeURIComponent(`${card.name} ${card.number} ${grade.by} ${grade.g}`) : ''
  return (
    <section className="box stack" style={{ gap: 12 }}>
      <div className="row" style={{ gap: 10 }}><span className="lav"><IGrade /></span><h2>{tr('Ma carte est gradée ?')}</h2></div>
      <div className="chips wrap" role="group" aria-label={tr('Société de gradation')}>
        <button className="chip-btn" aria-pressed={!grade} onClick={() => pick(null)}>{tr('Non gradée')}</button>
        {COMPANIES.map(c => <button key={c} className="chip-btn" aria-pressed={grade?.by === c} onClick={() => pick(c)}>{c}</button>)}
      </div>
      {grade && (
        <>
          <span className="kicker">{tr('Sa note')}</span>
          <div className="chips wrap" role="group" aria-label={tr('Note')}>
            {NOTES.map(n => <button key={n} className="chip-btn round" aria-pressed={grade.g === n} onClick={() => pick(grade.by, n)}>{n}</button>)}
            <button className="chip-btn" aria-pressed={grade.g === '5'} onClick={() => pick(grade.by, '5')}>{tr('5 ou moins')}</button>
          </div>
          <label className="stack" style={{ gap: 6 }}>
            <span className="kicker">{tr("Ce qu'elle vaut en {g}, en euros", { g: `${grade.by} ${grade.g}` })}</span>
            <input className="field" inputMode="decimal" placeholder={tr('Regarde les ventes eBay, puis note le prix')} value={v} onChange={e => setV(e.target.value)}
              onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
          </label>
          <a className="btn sm" target="_blank" rel="noreferrer" href={`https://www.ebay.fr/sch/i.html?_nkw=${search}&LH_Sold=1&LH_Complete=1`}>{tr('Voir les ventes en {g} sur eBay ↗', { g: `${grade.by} ${grade.g}` })}</a>
          <p className="muted tiny">{grade.value != null ? tr('Cardora compte ce prix dans ta collection et ton investissement, à la place du prix brut.') : tr('Tant que tu ne notes pas de prix, Cardora compte le prix brut.')}</p>
        </>
      )}
    </section>
  )
}

/** « J'ai payé » : prix d'achat d'une carte, pour suivre la plus-value. */
function BuyPrice({ cardKey, qty, buy, now }: { cardKey: string; qty: number; buy: number | null; now: number | null }) {
  const [v, setV] = useState(buy != null ? String(buy) : '')
  useEffect(() => { setV(buy != null ? String(buy) : '') }, [cardKey, buy])
  const commit = () => {
    const n = parseFloat(v.replace(',', '.'))
    setBuy(cardKey, Number.isFinite(n) && n >= 0 ? n : null)
  }
  const gain = buy != null && now != null ? (now - buy) * qty : null
  const p = buy && gain != null ? Math.round((gain / (buy * qty)) * 100) : null
  return (
    <section className="box buy">
      <label className="stack" style={{ gap: 6 }}>
        <span className="kicker">{tr('J’ai payé (pour une carte), en euros')}</span>
        <input className="field" inputMode="decimal" placeholder={tr('Par ex. 12')} value={v} onChange={e => setV(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
      </label>
      {gain != null ? (
        <div className={'verdict ' + (gain >= 0 ? 'up' : 'down')}>
          <b className={gain >= 0 ? 'up' : 'down'}>{gain >= 0 ? '+' : '−'}{fmt(Math.abs(gain))}{p != null ? ` (${p >= 0 ? '+' : ''}${p} %)` : ''}</b>
          {gain >= 0 ? (qty > 1 ? tr('Tu gagnes ça sur tes {n} cartes, au prix d’aujourd’hui.', { n: qty }) : tr('Tu gagnes ça sur cette carte, au prix d’aujourd’hui.')) : tr('Elle vaut moins que ce que tu l’as payée.')}
        </div>
      ) : (
        <p className="muted tiny">{tr('Note ton prix d’achat : Cardora calcule ta plus-value ici et dans Investissement.')}</p>
      )}
    </section>
  )
}

function GradeCalc({ card, price }: { card: Card; price: Price | null }) {
  const [gid, setGid] = useState(GRADERS[0].id)
  const g = GRADERS.find(x => x.id === gid)!
  const [cost, setCost] = useState(String(GRADERS[0].cost))
  const [graded, setGraded] = useState('')
  const raw = toEur(price)
  const c = parseFloat(cost.replace(',', '.')) || 0
  const gv = parseFloat(graded.replace(',', '.'))
  const breakEven = raw != null ? raw + c : null
  const gain = raw != null && Number.isFinite(gv) ? gv - raw - c : null
  const search = encodeURIComponent(`${card.name} ${card.number} ${g.name} 10`)

  return (
    <section className="box stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 10 }}><span className="lav"><IGrade /></span><h2>{tr('Ça vaut le coup de la grader ?')}</h2></div>

      <Seg full value={gid} onChange={v => { setGid(v); setCost(String(GRADERS.find(x => x.id === v)!.cost)) }} options={GRADERS.map(x => [x.id, x.name] as [string, string])} />
      <label className="small muted">
        {tr('Coût de la gradation tout compris, en euros.')} {tr(g.note)}.
        <input className="field" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} style={{ marginTop: 6 }} />
      </label>

      {breakEven != null ? (
        <div className="stack" style={{ gap: 8 }}>
          <p className="small muted">{tr("Pour gagner de l'argent, elle doit se vendre au moins :")}</p>
          <div className="even">
            <span className="p">{tr('{v} brut', { v: fmt(raw) })}</span><span className="muted">+</span>
            <span className="p">{tr('{v} gradation', { v: fmt(c) })}</span><span className="muted">=</span>
            <span className="p res">{fmt(breakEven)}</span>
          </div>
        </div>
      ) : (
        <p className="small muted">{tr('Sans prix brut fiable, on ne peut pas calculer le seuil.')}</p>
      )}

      <a className="btn sm" target="_blank" rel="noreferrer" href={`https://www.ebay.fr/sch/i.html?_nkw=${search}&LH_Sold=1&LH_Complete=1`}>
        {tr('Voir les ventes en {g} 10 sur eBay ↗', { g: g.name })}
      </a>
      <label className="small muted">
        {tr('Prix vu en {g} 10, en euros', { g: g.name })}
        <input className="field" inputMode="decimal" placeholder="150" value={graded} onChange={e => setGraded(e.target.value)} style={{ marginTop: 6 }} />
      </label>
      {gain != null && (
        <div className={'verdict ' + (gain > 0 ? 'up' : 'down')}>
          <b className={gain > 0 ? 'up' : 'down'}>{gain > 0 ? `+${fmt(gain)}` : `−${fmt(-gain)}`}</b>
          {gain > 0 ? tr('Oui, ça vaut le coup si elle obtient 10.') : tr('Non, tu perdrais de l’argent même avec un 10.')}
        </div>
      )}
      <p className="muted tiny">
        {tr("Une note 9 se vend souvent bien moins cher qu'un 10. Vérifie bien les bords, les coins et la surface avant d'envoyer.")}
      </p>
    </section>
  )
}
