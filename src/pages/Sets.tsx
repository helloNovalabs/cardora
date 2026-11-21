import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { gameColor, gameName, listSets } from '../lib/games'
import { ownedInSet, useCollection } from '../lib/store'
import type { GameId, SetInfo } from '../lib/types'
import { IBack, ISearch } from '../components/Icons'

export default function Sets() {
  const game = useParams().game as GameId
  const nav = useNavigate()
  const col = useCollection()
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

  const gc = { '--gc': gameColor(game) } as CSSProperties

  return (
    <div className="stack" style={{ gap: 16, ...gc }}>
      <button className="back" onClick={() => nav('/jeux')}><IBack />Jeux</button>
      <div className="row" style={{ gap: 12 }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: gameColor(game), boxShadow: `0 0 16px ${gameColor(game)}` }} />
        <h1>{gameName(game)}</h1>
        {sets && <span className="badge" style={{ marginLeft: 'auto' }}>{sets.length} extensions</span>}
      </div>
      <div className="search">
        <ISearch />
        <input className="field" placeholder="Chercher une extension" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {err && <p className="down small">Impossible de charger les extensions. Vérifie ta connexion et réessaie.</p>}
      {!sets && !err && (
        <div className="grid-ext">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skel" style={{ height: 150 }} />)}</div>
      )}
      <div className="grid-ext">
        {shown.map(s => {
          const followed = col.followed.some(f => f.game === game && f.setId === s.id)
          const have = followed ? ownedInSet(col, game, s.id).length : 0
          const pct = followed && s.total ? Math.min(100, (have / s.total) * 100) : 0
          return (
            <Link key={s.id} to={`/jeux/${game}/${encodeURIComponent(s.id)}`} className={'ext' + (followed ? ' followed' : '')} style={gc}>
              <div className="lg">
                <ExtLogo src={s.logo} code={s.id.toUpperCase()} invert={game === 'magic'} />
              </div>
              <h3>{s.name}</h3>
              {followed ? (
                <>
                  <div className="bar"><span style={{ width: pct + '%' }} /></div>
                  <div className="meta"><span className="lav">{have} / {s.total}</span><span>Suivi</span></div>
                </>
              ) : (
                <div className="meta"><span>{s.total ? `${s.total} cartes` : ''}</span><span>{s.date?.slice(0, 4) ?? ''}</span></div>
              )}
            </Link>
          )
        })}
      </div>
      {sets && shown.length === 0 && <p className="muted small empty">Aucune extension ne correspond. Essaie un autre mot.</p>}
    </div>
  )
}

function ExtLogo({ src, code, invert }: { src?: string; code: string; invert: boolean }) {
  const [bad, setBad] = useState(false)
  if (!src || bad) return <span className="code">{code}</span>
  return <img src={src} alt="" loading="lazy" style={invert ? { filter: 'invert(1)', maxHeight: 34 } : undefined} onError={() => setBad(true)} />
}
