import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { priceFor, searchCards } from '../lib/games'
import { addCard, useCollection } from '../lib/store'
import type { Card, GameId } from '../lib/types'

const OPTIONS: { id: GameId; name: string }[] = [
  { id: 'pokemon', name: 'Pokémon' },
  { id: 'yugioh', name: 'Yu-Gi-Oh!' },
  { id: 'lorcana', name: 'Lorcana' },
  { id: 'magic', name: 'Magic' },
  { id: 'onepiece', name: 'One Piece' },
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
    if (game === 'onepiece' || q.trim().length < 2) { setRes(null); return }
    setBusy(true)
    t.current = window.setTimeout(() => {
      searchCards(game, q).then(setRes).catch(() => setRes([])).finally(() => setBusy(false))
    }, 350)
  }, [q, game])

  const add = async (c: Card) => {
    setToast({ text: `${c.name} ajoutée ✓`, img: c.image })
    window.setTimeout(() => setToast(null), 1800)
    addCard(c, await priceFor(c))
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div>
        <h1>Ajouter une carte</h1>
        <p className="muted small" style={{ marginTop: 4 }}>Tape le nom de la carte, puis touche-la pour l'ajouter.</p>
      </div>

      <div className="chips">
        {OPTIONS.map(o => (
          <button key={o.id} className={'chip' + (game === o.id ? ' on' : '')} onClick={() => setGame(o.id)}>{o.name}</button>
        ))}
      </div>

      {game === 'onepiece' ? (
        <div className="box stack">
          <p className="small">Pour One Piece, le plus rapide est d'ouvrir l'extension et de cocher tes cartes dans le classeur.</p>
          <Link to="/jeux/onepiece" className="btn primary">Ouvrir les extensions One Piece</Link>
        </div>
      ) : (
        <input className="field" autoFocus placeholder={({ pokemon: 'Dracaufeu', yugioh: 'Magicien Sombre', lorcana: 'Elsa', magic: 'Lightning Bolt', onepiece: '' } as Record<GameId, string>)[game]} value={q} onChange={e => setQ(e.target.value)} />
      )}

      <div className="box row" style={{ gap: 12, opacity: .7 }}>
        <span className="badge">Bientôt</span>
        <p className="small muted">Scanner tes cartes avec l'appareil photo.</p>
      </div>

      {busy && <div className="spin" />}
      {res && !busy && res.length === 0 && <p className="muted small">Aucune carte trouvée. Essaie un autre nom.</p>}
      {res && res.length > 0 && (
        <div className="cards-grid">
          {res.map(c => {
            const qn = col.owned[c.key]?.qty ?? 0
            return (
              <button key={c.key} className="slot" onClick={() => add(c)} aria-label={`Ajouter ${c.name}`}>
                {c.image ? <img src={c.image} alt="" loading="lazy" /> : <div className="noimg">{c.name}</div>}
                {qn > 0 && <span className="qty">×{qn}</span>}
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
