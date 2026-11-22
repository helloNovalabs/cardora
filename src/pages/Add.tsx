import { CardFace } from '../components/CardFace'
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

  const add = async (c: Card) => {
    setToast({ text: `${c.name} ajoutée ✓`, img: c.image })
    window.setTimeout(() => setToast(null), 1800)
    addCard(c, await priceFor(c))
  }

  return (
    <div className="stack fade-in" style={{ gap: 16 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>Ajouter une carte</h1>
        <p className="muted small">Tape le nom de la carte, puis touche-la pour l'ajouter.</p>
      </div>

      <div className="chips">
        {OPTIONS.map(o => (
          <button key={o.id} className={'chip' + (game === o.id ? ' on' : '')} style={{ '--gc': gameColor(o.id) } as CSSProperties} onClick={() => setGame(o.id)}><i />{o.name}</button>
        ))}
      </div>

      {game === 'onepiece' ? (
        <div className="box stack">
          <p className="small">Pour One Piece, le plus rapide est d'ouvrir l'extension et de cocher tes cartes dans le classeur.</p>
          <Link to="/jeux/onepiece" className="btn primary">Ouvrir les extensions One Piece</Link>
        </div>
      ) : game === 'autre' ? (
        <div className="box stack">
          <p className="small">Foot, F1, Riftbound, Star Wars, Digimon, Gundam et tous les autres : choisis le jeu, ouvre l'extension et coche tes cartes dans le classeur.</p>
          <Link to="/jeux" className="btn primary">Voir tous les jeux</Link>
        </div>
      ) : (
        <div className="search"><ISearch /><input className="field" autoFocus placeholder={({ pokemon: 'Dracaufeu', yugioh: 'Magicien Sombre', lorcana: 'Elsa', magic: 'Lightning Bolt' } as Record<GameId, string>)[game]} value={q} onChange={e => setQ(e.target.value)} /></div>
      )}

      {!res && !busy && (
        <div className="box row" style={{ gap: 12 }}>
          <span className="badge">Bientôt</span>
          <p className="small muted">Scanner tes cartes avec l'appareil photo.</p>
        </div>
      )}

      {busy && <div className="cards-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skel" style={{ aspectRatio: '63/88' }} />)}</div>}
      {res && !busy && res.length === 0 && <p className="muted small">Aucune carte trouvée. Essaie un autre nom.</p>}
      {res && res.length > 0 && (
        <div className="cards-grid">
          {res.map(c => {
            const qn = col.owned[c.key]?.qty ?? 0
            return (
              <button key={c.key} className={'slot' + (qn ? ' have' : '')} onClick={() => add(c)} aria-label={`Ajouter ${c.name}`}>
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
