import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { t as tr } from '../lib/i18n'
import { priceFor, searchCards } from '../lib/games'
import { fmt, getState, setWishPrice, setWishTarget, toEur, toggleWish, unitValue, useCollection, type State } from '../lib/store'
import type { Card, Price } from '../lib/types'
import { CardFace } from './CardFace'

const url = (c: Card) => `/carte/${c.game}/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.id)}`
const toNum = (v: string) => { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null }

/** Le cœur sur la fiche d'une carte, et le prix auquel on veut l'acheter. */
export function WishBox({ card, price }: { card: Card; price: Price | null }) {
  const col = useCollection()
  const w = col.wish?.[card.key]
  const [v, setV] = useState(w?.target != null ? String(w.target) : '')
  return (
    <div className="wish-box">
      <button className={'wish-btn' + (w ? ' on' : '')} aria-pressed={!!w} onClick={() => toggleWish(card, price)}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path d="M12 20.5S3.5 15.4 3.5 9A4.7 4.7 0 0 1 12 6.4 4.7 4.7 0 0 1 20.5 9c0 6.4-8.5 11.5-8.5 11.5Z" /></svg>
        {w ? tr('Dans mes envies') : tr('Je la veux')}
      </button>
      {w && <label className="wish-target">{tr('Mon prix cible')}<input className="field" inputMode="decimal" placeholder="€" value={v} onChange={e => { setV(e.target.value); setWishTarget(card.key, toNum(e.target.value)) }} /></label>}
    </div>
  )
}

/** Les cartes voulues, et celles qui sont passées sous le prix cible. */
export function WishList() {
  const col = useCollection()
  const list = Object.values(col.wish ?? {}).sort((a, b) => b.addedAt - a.addedAt)
  useEffect(() => {
    for (const w of Object.values(getState().wish ?? {})) priceFor(w.card).then(p => { if (p) setWishPrice(w.card.key, p) }).catch(() => {})
  }, [])
  return (
    <section className="stack">
      <div className="sec-h"><h2>{tr('Mes envies')}</h2>{list.length > 0 && <span className="muted small">{list.length}</span>}</div>
      {list.length === 0 ? <p className="muted small box">{tr('Touche « Je la veux » sur une carte et fixe ton prix cible : Cardora te montre ici quand elle passe en dessous.')}</p> : (
        <div className="rail">
          {list.map(w => {
            const p = toEur(w.price), hit = w.target != null && p != null && p <= w.target
            return (
              <Link key={w.card.key} to={url(w.card)} className={'mini' + (hit ? ' wish-hit' : '')}>
                <div className="pic"><CardFace card={w.card} /></div>
                <span className="nm ellipsis">{w.card.name}</span>
                <span className="price-pill">{fmt(p)}</span>
                {hit ? <span className="tiny up">{tr('Prix atteint')}</span> : w.target != null ? <span className="tiny muted">{tr('Cible {v}', { v: fmt(w.target) })}</span> : null}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

type Pick = { card: Card; v: number | null }

function Side({ title, list, onAdd, onDel, own }: { title: string; list: Pick[]; onAdd: (c: Card) => void; onDel: (k: string) => void; own: boolean }) {
  const col = useCollection()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Card[]>([])
  useEffect(() => {
    const s = q.trim()
    if (s.length < 2) { setRes([]); return }
    const id = window.setTimeout(() => {
      const mine = Object.values(col.owned).map(o => o.card).filter(c => c.name.toLowerCase().includes(s.toLowerCase()))
      if (own && mine.length) setRes(mine.slice(0, 6))
      else searchCards('pokemon', s).then(l => setRes(l.filter(c => c.image).slice(0, 6))).catch(() => setRes([]))
    }, 350)
    return () => window.clearTimeout(id)
  }, [q, own, col.owned])
  const sum = list.reduce((n, x) => n + (x.v ?? 0), 0)
  return (
    <div className="tr-side">
      <div className="row between"><h3>{title}</h3><b className="num">{fmt(sum)}</b></div>
      <input className="field" placeholder={tr('Nom de la carte')} value={q} onChange={e => setQ(e.target.value)} />
      {res.length > 0 && <div className="tr-res">{res.map(c => <button key={c.key} aria-label={tr('Ajouter {c}', { c: c.name })} onClick={() => { onAdd(c); setQ('') }}><CardFace card={c} /></button>)}</div>}
      {list.map(x => <div key={x.card.key} className="tr-line"><span className="ellipsis">{x.card.name}</span><b>{x.v == null ? tr('Pas de prix') : fmt(x.v)}</b><button aria-label={tr('Retirer')} onClick={() => onDel(x.card.key)}>×</button></div>)}
    </div>
  )
}

/** Cet échange est-il juste ? On compare les prix du marché des deux côtés. */
export function TradeCheck() {
  const [give, setGive] = useState<Pick[]>([])
  const [get, setGet] = useState<Pick[]>([])
  const add = (set: typeof setGive) => (c: Card) => {
    const own = getState().owned[c.key]
    set(l => l.some(x => x.card.key === c.key) ? l : [...l, { card: c, v: own ? unitValue(own) : null }])
    if (!own) priceFor(c).then(p => set(l => l.map(x => x.card.key === c.key ? { ...x, v: toEur(p) } : x))).catch(() => {})
  }
  const del = (set: typeof setGive) => (k: string) => set(l => l.filter(x => x.card.key !== k))
  const a = give.reduce((n, x) => n + (x.v ?? 0), 0), b = get.reduce((n, x) => n + (x.v ?? 0), 0)
  const diff = b - a, ready = give.length > 0 && get.length > 0, even = Math.abs(diff) <= Math.max(a, b) * 0.1
  const pos = a + b > 0 ? (b / (a + b)) * 100 : 50
  return (
    <section className="stack">
      <div className="sec-h"><h2>{tr('Cet échange est juste ?')}</h2></div>
      <div className="box stack" style={{ gap: 14 }}>
        <div className="tr-grid">
          <Side title={tr('Je donne')} list={give} onAdd={add(setGive)} onDel={del(setGive)} own />
          <Side title={tr('Je reçois')} list={get} onAdd={add(setGet)} onDel={del(setGet)} own={false} />
        </div>
        {ready && (
          <div className="tr-meter">
            <div className="tr-bar"><i style={{ left: pos + '%' }} /></div>
            <b className={even ? '' : diff > 0 ? 'up' : 'down'}>{even ? tr('Échange équilibré') : diff > 0 ? tr('Tu gagnes {v}', { v: fmt(diff) }) : tr('Tu perds {v}', { v: fmt(-diff) })}</b>
          </div>
        )}
      </div>
    </section>
  )
}

const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"` }
/** Télécharge toute la collection dans un fichier pour Excel ou Numbers. */
export function exportCsv(s: State) {
  const rows: unknown[][] = [['Type', 'Jeu', 'Nom', 'Extension', 'Numéro', 'Langue', 'Quantité', 'Gradation', 'Prix payé (€)', 'Valeur (€)']]
  for (const o of Object.values(s.owned)) rows.push(['Carte', o.card.game, o.card.name, o.card.setName ?? o.card.setId, o.card.number, o.lang ?? '', o.qty, o.grade ? `${o.grade.by} ${o.grade.g}` : '', o.buy ?? '', unitValue(o) ?? ''])
  for (const x of s.sealed ?? []) rows.push(['Scellé', x.game, x.name, x.setName ?? '', '', '', x.qty, '', x.buy ?? '', x.value ?? ''])
  const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cardora-collection.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function useRepartition(s: State) {
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const o of Object.values(s.owned)) { const k = o.card.setName ?? o.card.setId; m.set(k, (m.get(k) ?? 0) + (unitValue(o) ?? 0) * o.qty) }
    const all = [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    const total = all.reduce((n, [, v]) => n + v, 0)
    return all.slice(0, 5).map(([name, v]) => ({ name, v, pct: total ? (v / total) * 100 : 0 }))
  }, [s.owned])
}
