import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameName, imgLarge, loadCard } from '../lib/games'
import { addCard, fmt, removeCard, toEur, useCollection } from '../lib/store'
import type { Card, GameId, Price } from '../lib/types'
import { IBack, IGrade } from '../components/Icons'
import { HoloCard, PriceChart } from '../components/Visuals'

// Coûts indicatifs tout compris (envoi + assurance), modifiables par l'utilisateur.
const GRADERS = [
  { id: 'pca', name: 'PCA', cost: 20, note: 'Français, envoi simple' },
  { id: 'collectaura', name: 'CollectAura', cost: 20, note: 'Français' },
  { id: 'psa', name: 'PSA', cost: 45, note: 'Américain, souvent via un intermédiaire' },
]

export default function CardPage() {
  const { game, setId = '', id = '' } = useParams() as { game: GameId; setId: string; id: string }
  const nav = useNavigate()
  const col = useCollection()
  const [card, setCard] = useState<Card | null>(null)
  const [price, setPrice] = useState<Price | null>(null)
  const [err, setErr] = useState(false)
  const [tip, setTip] = useState(false)

  useEffect(() => {
    setCard(null); setErr(false)
    loadCard(game, setId, id).then(r => { setCard(r.card); setPrice(r.price) }).catch(() => setErr(true))
  }, [game, setId, id])

  if (err) return <div className="stack"><button className="back" onClick={() => nav(-1)}><IBack />Retour</button><p className="down">Carte introuvable pour l'instant.</p></div>
  if (!card) return <div className="spin" />

  const q = col.owned[card.key]?.qty ?? 0
  const trend = price?.value != null && price.avg30 ? Math.round(((price.value - price.avg30) / price.avg30) * 100) : null

  return (
    <div className="stack" style={{ gap: 18 }}>
      <button className="back" onClick={() => nav(-1)}><IBack />Retour</button>
      <div className="card-hero">
        {card.image ? (
          <div>
            <HoloCard src={imgLarge(card)} alt={card.name} rare={!/^(common|commune|c)$/i.test(card.rarity ?? '')} className="card-big" />
            <p className="holo-hint">Bouge ton doigt sur la carte pour la faire briller</p>
          </div>
        ) : <div className="box empty">Pas d'image</div>}
        <div className="stack" style={{ gap: 16 }}>
          <div>
            <h1>{card.name}</h1>
            <p className="muted small" style={{ marginTop: 4 }}>
              {gameName(game)} · {card.setName ?? card.setId} · n° {card.number}{card.rarity ? ` · ${card.rarity}` : ''}
            </p>
          </div>

          <div className="box">
            <div className="label">Prix brut (non gradée)<button className="help" onClick={() => setTip(t => !t)} aria-label="C'est quoi ?">?</button></div>
            {tip && (
              <p className="tip">
                « Brut » = la carte telle quelle, sans boîtier de gradation. Le prix affiché est la tendance du marché :
                ce que les gens paient en ce moment pour cette carte en bon état, sur {price?.source?.split(' ')[0] ?? 'le marché'}.
              </p>
            )}
            <div className="row" style={{ alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span className="stat-n">{fmt(price?.value, price?.currency)}</span>
              {trend != null && trend !== 0 && <b className={trend > 0 ? 'up' : 'down'}>{trend > 0 ? '+' : ''}{trend} % sur 30 j</b>}
            </div>
            {price?.value == null ? (
              <p className="muted small" style={{ marginTop: 4 }}>Pas de prix fiable pour cette carte. On préfère ne rien inventer.</p>
            ) : (
              <>
                {(price.avg30 || price.avg7) && (
                  <div style={{ marginTop: 14 }}>
                    <PriceChart currency={price.currency} points={[
                      { label: 'Moy. 30 j', v: price.avg30 }, { label: 'Moy. 7 j', v: price.avg7 },
                      { label: 'Hier', v: price.avg1 }, { label: "Aujourd'hui", v: price.value },
                    ]} />
                  </div>
                )}
                <p className="muted tiny" style={{ marginTop: 8 }}>
                  Source : {price.source}{price.low ? ` · la moins chère en vente : ${fmt(price.low, price.currency)}` : ''}
                </p>
              </>
            )}
          </div>

          <div className="row" style={{ gap: 10 }}>
            {q > 0 ? (
              <>
                <button className="btn" onClick={() => removeCard(card.key)} aria-label="En retirer une">−</button>
                <span style={{ fontWeight: 700 }}>{q} dans ta collection</span>
                <button className="btn" onClick={() => addCard(card, price)} aria-label="En ajouter une">+</button>
              </>
            ) : (
              <button className="btn primary" style={{ flex: 1 }} onClick={() => addCard(card, price)}>Ajouter à ma collection</button>
            )}
          </div>

          <GradeCalc card={card} price={price} />
        </div>
      </div>
    </div>
  )
}

function GradeCalc({ card, price }: { card: Card; price: Price | null }) {
  const [g, setG] = useState(GRADERS[0])
  const [cost, setCost] = useState(String(GRADERS[0].cost))
  const [graded, setGraded] = useState('')
  const raw = toEur(price)
  const c = parseFloat(cost.replace(',', '.')) || 0
  const gv = parseFloat(graded.replace(',', '.'))
  const breakEven = raw != null ? raw + c : null
  const gain = raw != null && Number.isFinite(gv) ? gv - raw - c : null
  const search = encodeURIComponent(`${card.name} ${card.number} ${g.name} 10`)

  return (
    <section className="box stack">
      <div className="row" style={{ gap: 8 }}><span className="lav"><IGrade /></span><h2>Ça vaut le coup de la grader ?</h2></div>

      <div className="seg">
        {GRADERS.map(x => (
          <button key={x.id} className={g.id === x.id ? 'on' : ''} onClick={() => { setG(x); setCost(String(x.cost)) }}>{x.name}</button>
        ))}
      </div>
      <label className="small muted">
        Coût de la gradation tout compris (€) · {g.note}
        <input className="field" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} style={{ marginTop: 6 }} />
      </label>

      {breakEven != null ? (
        <p className="small">
          Pour gagner de l'argent, ta carte doit se vendre <b className="lav">au moins {fmt(breakEven)}</b> une fois gradée
          (prix brut {fmt(raw)} + gradation {fmt(c)}).
        </p>
      ) : (
        <p className="small muted">Sans prix brut fiable, on ne peut pas calculer le seuil.</p>
      )}

      <a className="btn sm" target="_blank" rel="noreferrer" href={`https://www.ebay.fr/sch/i.html?_nkw=${search}&LH_Sold=1&LH_Complete=1`}>
        Voir les ventes en {g.name} 10 sur eBay ↗
      </a>
      <label className="small muted">
        Prix vu en {g.name} 10 (€)
        <input className="field" inputMode="decimal" placeholder="150" value={graded} onChange={e => setGraded(e.target.value)} style={{ marginTop: 6 }} />
      </label>
      {gain != null && (
        <p style={{ fontWeight: 650 }} className={gain > 0 ? 'up' : 'down'}>
          {gain > 0 ? `Oui : environ +${fmt(gain)} si elle obtient 10.` : `Non : tu perdrais environ ${fmt(-gain)}.`}
        </p>
      )}
      <p className="muted tiny">
        Une note 9 se vend souvent bien moins cher qu'un 10. Vérifie bien les bords, les coins et la surface avant d'envoyer.
      </p>
    </section>
  )
}
