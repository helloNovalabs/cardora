import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { gameName, listSets } from '../lib/games'
import type { GameId, SetInfo } from '../lib/types'
import { IBack, IChevron } from '../components/Icons'

export default function Sets() {
  const game = useParams().game as GameId
  const nav = useNavigate()
  const [sets, setSets] = useState<SetInfo[] | null>(null)
  const [err, setErr] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    setSets(null); setErr(false)
    listSets(game).then(setSets).catch(() => setErr(true))
  }, [game])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (sets ?? []).filter(s => !t || s.name.toLowerCase().includes(t) || s.id.toLowerCase().includes(t)).slice(0, 120)
  }, [sets, q])

  return (
    <div className="stack">
      <button className="back" onClick={() => nav('/jeux')}><IBack />Jeux</button>
      <h1>{gameName(game)}</h1>
      <input className="field" placeholder="Nom de l'extension" value={q} onChange={e => setQ(e.target.value)} />
      {err && <p className="down small">Impossible de charger les extensions. Vérifie ta connexion et réessaie.</p>}
      {!sets && !err && <div className="spin" />}
      <div className="box" style={{ padding: '4px 14px' }}>
        <div className="list">
          {shown.map(s => (
            <Link key={s.id} to={`/jeux/${game}/${encodeURIComponent(s.id)}`} className="li">
              {s.logo ? <img className="setlogo" src={s.logo} alt="" loading="lazy" style={game === 'magic' ? { filter: 'invert(1)', height: 26 } : undefined} /> : <div className="setlogo" />}
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                <div className="muted tiny">{s.id.toUpperCase()}{s.total ? ` · ${s.total} cartes` : ''}{s.date ? ` · ${s.date.slice(0, 4)}` : ''}</div>
              </div>
              <span className="muted"><IChevron /></span>
            </Link>
          ))}
          {sets && shown.length === 0 && <p className="muted small" style={{ padding: 14 }}>Aucune extension ne correspond.</p>}
        </div>
      </div>
    </div>
  )
}
