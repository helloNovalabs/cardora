import { t as tr } from '../lib/i18n'
import { CardFace } from '../components/CardFace'
import { readCard } from '../lib/scan'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { canSearch, priceFor, searchCards } from '../lib/games'
import { addCard, useCollection } from '../lib/store'
import type { Card, GameId } from '../lib/types'
import { gameColor } from '../lib/games'
import { IPlus, ISearch } from '../components/Icons'
import type { CSSProperties } from 'react'

const OPTIONS: { id: GameId; name: string }[] = [
  { id: 'pokemon', name: 'Pokémon' },
  { id: 'yugioh', name: 'Yu-Gi-Oh!' },
  { id: 'lorcana', name: 'Lorcana' },
  { id: 'magic', name: 'Magic' },
  { id: 'onepiece', name: 'One Piece' },
  { id: 'autre', name: 'Autres jeux' },
]

export default function Add() {
  const col = useCollection()
  const [game, setGame] = useState<GameId>('pokemon')
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Card[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ text: string; img: string } | null>(null)
  const t = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(t.current)
    if (!canSearch(game) || q.trim().length < 2) { setRes(null); return }
    setBusy(true)
    t.current = window.setTimeout(() => {
      searchCards(game, q).then(setRes).catch(() => setRes([])).finally(() => setBusy(false))
    }, 350)
  }, [q, game])

  const fileRef = useRef<HTMLInputElement>(null)
  const [scan, setScan] = useState<{ url: string; step: 'read' | 'search' | 'done' | 'fail'; p: number; names: string[] } | null>(null)
  const [hint, setHint] = useState<string | undefined>()
  useEffect(() => { setScan(null); setHint(undefined) }, [game])

  /** Photo → lecture du nom et du numéro → recherche du premier nom qui donne des cartes. */
  const onScan = async (f: File) => {
    if (scan?.url) URL.revokeObjectURL(scan.url)
    const url = URL.createObjectURL(f)
    setScan({ url, step: 'read', p: 0, names: [] }); setHint(undefined)
    try {
      const r = await readCard(f, game, p => setScan(x => x && { ...x, p }))
      setScan(x => x && { ...x, step: 'search', names: r.names })
      for (const cand of r.names.slice(0, 8)) {
        const list = await searchCards(game, cand).catch(() => [] as Card[])
        if (list.length) { setHint(r.number); setQ(cand); setScan(x => x && { ...x, step: 'done' }); return }
      }
      setScan(x => x && { ...x, step: 'fail' })
    } catch {
      setScan(x => x && { ...x, step: 'fail' })
    }
  }
  const sameNo = (c: Card) => !!hint && (c.number.replace(/^0+/, '') === hint.replace(/^0+/, '') || c.number.toUpperCase() === hint.toUpperCase())
  const shown = res && hint ? [...res].sort((a, b) => Number(sameNo(b)) - Number(sameNo(a))) : res

  const add = async (c: Card) => {
    setToast({ text: tr('{c} ajoutée ✓', { c: c.name }), img: c.image })
    window.setTimeout(() => setToast(null), 1800)
    addCard(c, await priceFor(c))
  }

  return (
    <div className="stack fade-in" style={{ gap: 16 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>{tr('Ajouter une carte')}</h1>
        <p className="muted small">{tr("Tape le nom de la carte, puis touche-la pour l'ajouter.")}</p>
      </div>

      <div className="chips">
        {OPTIONS.map(o => (
          <button key={o.id} className={'chip' + (game === o.id ? ' on' : '')} style={{ '--gc': gameColor(o.id) } as CSSProperties} onClick={() => setGame(o.id)}><i />{tr(o.name)}</button>
        ))}
      </div>

      {game === 'onepiece' ? (
        <div className="box stack">
          <p className="small">{tr("Pour One Piece, le plus rapide est d'ouvrir l'extension et de cocher tes cartes dans le classeur.")}</p>
          <Link to="/jeux/onepiece" className="btn primary">{tr('Ouvrir les extensions One Piece')}</Link>
        </div>
      ) : game === 'autre' ? (
        <div className="box stack">
          <p className="small">{tr("Foot, F1, Riftbound, Star Wars, Digimon, Gundam et tous les autres : choisis le jeu, ouvre l'extension et coche tes cartes dans le classeur.")}</p>
          <Link to="/jeux" className="btn primary">{tr('Voir tous les jeux')}</Link>
        </div>
      ) : (
        <div className="search"><ISearch /><input className="field" autoFocus placeholder={({ pokemon: 'Dracaufeu', yugioh: 'Magicien Sombre', lorcana: 'Elsa', magic: 'Lightning Bolt' } as Record<GameId, string>)[game]} value={q} onChange={e => setQ(e.target.value)} /></div>
      )}

      {canSearch(game) && (
        <div className="scan box">
          {scan?.url && <img className="scan-shot" src={scan.url} alt={tr('Ta photo')} />}
          <div className="stack grow" style={{ gap: 6, minWidth: 0 }}>
            <h3 className="small" style={{ fontWeight: 800 }}>{tr('Scanner une carte')}</h3>
            {!scan && <p className="tiny muted">{tr('Prends ta carte en photo, bien à plat et sans reflet. Cardora lit le nom et le numéro, puis te montre la carte.')}</p>}
            {scan?.step === 'read' && <><p className="tiny muted">{tr('Je lis la carte… {n} %', { n: Math.round(scan.p * 100) })}</p><span className="bar"><span style={{ width: `${Math.max(6, scan.p * 100)}%` }} /></span></>}
            {scan?.step === 'search' && <p className="tiny muted">{tr('Je cherche « {q} »…', { q: scan.names[0] })}</p>}
            {scan?.step === 'done' && <p className="tiny">{tr("J'ai lu")} <b>« {q} »</b>{hint ? <> {tr('et le numéro')} <b>{hint}</b></> : null}. {tr("Touche la bonne carte pour l'ajouter.")}</p>}
            {scan?.step === 'fail' && <p className="tiny down">{tr("Je n'ai pas réussi à lire le nom. Reprends la photo de plus près, ou tape le nom au-dessus.")}</p>}
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn primary sm" disabled={scan?.step === 'read' || scan?.step === 'search'} onClick={() => fileRef.current?.click()}>
                {scan ? tr('Scanner une autre carte') : tr('Prendre une photo')}
              </button>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onScan(f) }} />
        </div>
      )}

      {busy && <div className="cards-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skel" style={{ aspectRatio: '63/88' }} />)}</div>}
      {res && !busy && res.length === 0 && <p className="muted small">{tr('Aucune carte trouvée. Essaie un autre nom.')}</p>}
      {res && res.length > 0 && (
        <div className="cards-grid">
          {(shown ?? []).map(c => {
            const qn = col.owned[c.key]?.qty ?? 0
            return (
              <button key={c.key} className={'slot' + (qn ? ' have' : '') + (sameNo(c) ? ' scan-hit' : '')} onClick={() => add(c)} aria-label={tr('Ajouter {c}', { c: c.name })}>
                <CardFace card={c} />
                {qn > 0 ? <span className="qty">×{qn}</span> : <span className="add"><IPlus /></span>}
                <span className="tag">{c.game === 'yugioh' ? c.number : `${c.setId.toUpperCase()} · ${c.number}`}</span>
              </button>
            )
          })}
        </div>
      )}
      {toast && <div className="toast" role="status">{toast.img && <img src={toast.img} alt="" />}{toast.text}</div>}
    </div>
  )
}
