import { LangMenu } from '../components/LangMenu'
import { PokeFan } from '../components/PokeFan'
import { POKE_LANGS, getPokeLang, setPokeLang } from '../lib/pokeLang'
import { t as tr } from '../lib/i18n'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { gameColor, gameName, listSets } from '../lib/games'
import { ownedInSet, useCollection } from '../lib/store'
import type { GameId, SetInfo } from '../lib/types'
import { IBack, ISearch } from '../components/Icons'
import { SealedArt } from '../components/Sealed'
import { isSport } from '../lib/sport'
import { SetCover } from '../components/SetCover'

type Sort = 'serie' | 'name' | 'mine'
const SORTS: { id: Sort; label: string }[] = [
  { id: 'serie', label: 'Par série' },
  { id: 'name', label: 'De A à Z' },
  { id: 'mine', label: 'Mes classeurs d’abord' },
]

export default function Sets() {
  const game = useParams().game as GameId
  const nav = useNavigate()
  const col = useCollection()
  const [sets, setSets] = useState<SetInfo[] | null>(null)
  const [err, setErr] = useState(false)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('serie')
  const [shut, setShut] = useState<Record<string, boolean>>({})

  const isPokemon = game === 'pokemon' || game === 'pokemonjp'
  const [pl, setPl] = useState(getPokeLang)
  const pickLang = (c: string) => {
    setPokeLang(c); setPl(c)
    nav(c === 'ja' ? '/jeux/pokemonjp' : '/jeux/pokemon', { replace: true })
  }
  useEffect(() => { if (game === 'pokemon' && getPokeLang() === 'ja') nav('/jeux/pokemonjp', { replace: true }) }, [game, nav])

  useEffect(() => {
    setSets(null); setErr(false); setShut({})
    listSets(game).then(setSets).catch(() => setErr(true))
  }, [game, pl])

  const isFollowed = (id: string) => col.followed.some(f => f.game === game && f.setId === id)

  /** Les extensions rangées en rayons (série, année…) dans l'ordre où elles arrivent. */
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase()
    const list = (sets ?? []).filter(s => !t || s.name.toLowerCase().includes(t) || s.id.toLowerCase().includes(t) || (s.code ?? '').toLowerCase().includes(t))
    if (sort === 'name') return [{ name: '', items: [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr')) }]
    const out: { name: string; items: SetInfo[] }[] = []
    if (sort === 'mine') {
      const mine = list.filter(s => isFollowed(s.id))
      if (mine.length) out.push({ name: tr('Mes classeurs'), items: mine })
    }
    for (const s of list) {
      if (sort === 'mine' && isFollowed(s.id)) continue
      const g = s.group ?? tr('Autres')
      let box = out.find(o => o.name === g)
      if (!box) out.push(box = { name: g, items: [] })
      box.items.push(s)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, q, sort, col.followed])

  const count = groups.reduce((n, g) => n + g.items.length, 0)
  const gc = { '--gc': gameColor(game) } as CSSProperties

  const tile = (s: SetInfo) => {
    const followed = isFollowed(s.id)
    const have = followed ? ownedInSet(col, game, s.id).length : 0
    const pct = followed && s.total ? Math.min(100, (have / s.total) * 100) : 0
    return (
      <Link key={s.id} to={`/jeux/${game}/${encodeURIComponent(s.id)}`} className={'ext' + (game === 'pokemon' ? ' set-fan' : '') + (isSport(game) && s.logo ? ' cover' : '') + (followed ? ' followed' : '') + (s.soon ? ' soon' : '')} style={gc}>
        {s.soon && <span className="soon-tag">{tr('À venir')}</span>}
        <div className="lg">
          {game === 'pokemon'
            ? <PokeFan key={pl} set={s} fallback={<ExtLogo game={game} set={s} invert={false} color={gameColor(game)} />} />
            : <ExtLogo game={game} set={s} invert={game === 'magic'} color={gameColor(game)} />}
        </div>
        <h3>{s.name}</h3>
        {followed ? (
          <>
            <div className="bar"><span style={{ width: pct + '%' }} /></div>
            <div className="meta"><span className="lav">{have} / {s.total}</span><span>{tr('Suivi')}</span></div>
          </>
        ) : (
          <div className="meta"><span>{s.total ? tr('{n} cartes', { n: s.total }) : s.code ?? ''}</span><span>{fmtDate(s.date)}</span></div>
        )}
      </Link>
    )
  }

  return (
    <div className="stack" style={{ gap: 16, ...gc }}>
      <button className="back" onClick={() => nav('/jeux')}><IBack />{tr('Jeux')}</button>
      <div className="row" style={{ gap: 12 }}>
        <h1>{isPokemon ? 'Pokémon' : gameName(game)}</h1>
        <span style={{ marginLeft: 'auto' }}>{isPokemon && <LangMenu value={game === 'pokemonjp' ? 'ja' : pl} options={POKE_LANGS} label={tr('Langue des cartes')} onChange={pickLang} />}</span>
      </div>
      <div className="search">
        <ISearch />
        <input className="field" placeholder={tr('Chercher une extension, un code (ex. OP09, SV8)')} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="chips" role="group" aria-label={tr('Ranger les extensions')}>
        {SORTS.map(s => <button key={s.id} className="chip-btn" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{tr(s.label)}</button>)}
      </div>
      {err && <p className="down small">{tr('Impossible de charger les extensions. Vérifie ta connexion et réessaie.')}</p>}
      {!sets && !err && (
        <div className="grid-ext">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skel" style={{ height: 150 }} />)}</div>
      )}
      {groups.map(g => g.items.length > 0 && (
        <section key={g.name || 'all'} className="set-group">
          {g.name && (
            <button className="set-group-h" aria-expanded={!shut[g.name]} onClick={() => setShut(x => ({ ...x, [g.name]: !x[g.name] }))}>
              <h2>{g.name}</h2>
              <span className="muted small">{g.items.length}</span>
              <span className="chev" aria-hidden>›</span>
            </button>
          )}
          {!shut[g.name] && <div className="grid-ext">{g.items.map(tile)}</div>}
        </section>
      ))}
      {sets && count === 0 && <p className="muted small empty">{tr('Aucune extension ne correspond. Essaie un autre mot.')}</p>}
    </div>
  )
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function fmtDate(d?: string) {
  if (!d) return ''
  const m = Number(d.slice(5, 7))
  return m ? `${MOIS[m - 1]} ${d.slice(0, 4)}` : d.slice(0, 4)
}

function ExtLogo({ game, set, invert, color }: { game: GameId; set: SetInfo; invert: boolean; color: string }) {
  const [bad, setBad] = useState(false)
  const src = set.logo
  const code = (set.code || set.id).toUpperCase().slice(0, 8)
  // Pas de logo : le booster de l'extension (TCGplayer), et en attendant un booster dessiné avec son code
  const drawn = <span className="ext-ph"><SealedArt kind="booster" color={color} label="" size={42} /><span className="code">{code}</span></span>
  if (!src || bad) return isSport(game) ? drawn : <SetCover game={game} set={set} fallback={drawn} />
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" style={invert ? { filter: 'invert(1)', maxHeight: 34 } : undefined} onError={() => setBad(true)} />
}
