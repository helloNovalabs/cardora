import { t as tr } from '../lib/i18n'
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PICK_GAMES as GAMES, type GameMeta } from '../lib/games'
import { useCollection } from '../lib/store'
import { ISearch } from './Icons'

const SHELVES: { id: GameMeta['shelf']; title: string; hint: string }[] = [
  { id: 'big', title: 'Les plus collectionnés', hint: '' },
  { id: 'sport', title: 'Sport', hint: '' },
  { id: 'more', title: 'Tous les autres jeux', hint: '' },
]

/** Les jeux en tuiles. `all` : les trois rayons avec une recherche (page Classeurs). Sinon : les principaux + « Tous les jeux ». */
export default function GameTiles({ all = false }: { all?: boolean }) {
  const col = useCollection()
  const [q, setQ] = useState('')
  const per: Record<string, number> = {}
  for (const o of Object.values(col.owned)) { const g = o.card.game === 'pokemonjp' ? 'pokemon' : o.card.game; per[g] = (per[g] ?? 0) + o.qty }

  const tile = (g: GameMeta, small = false) => (
    <Link key={g.id} to={`/jeux/${g.id}`} className={'game-tile' + (small ? ' sm' : '') + (g.art ? '' : ' drawn ' + g.id)} style={{ '--gc': g.color } as CSSProperties}>
      {g.art ? (
        <span className="art" style={{ backgroundImage: `url("${g.art}")`, backgroundPosition: g.artPos, backgroundSize: g.artPos ? '100% auto' : undefined }} />
      ) : <span className="art" />}
      {per[g.id] ? <span className="count">{per[g.id]} {tr(per[g.id] > 1 ? 'cartes' : 'carte')}</span> : null}
      <h3>{g.name}</h3>
    </Link>
  )

  if (!all) {
    const main = GAMES.filter(g => g.shelf !== 'more').slice(0, 9)
    return (
      <div className="grid-games">
        {main.map(g => tile(g))}
        <Link to="/jeux" className="game-tile all-games">
          <span className="stack-mini">{GAMES.filter(g => g.shelf === 'more' && g.art).slice(0, 4).map(g => <i key={g.id} style={{ backgroundImage: `url("${g.art}")` }} />)}</span>
          <h3>{tr('Tous les jeux')}</h3>
          <p>{tr('{n} jeux', { n: GAMES.length })}</p>
        </Link>
      </div>
    )
  }

  const t = q.trim().toLowerCase()
  const shown = GAMES.filter(g => !t || g.name.toLowerCase().includes(t))
  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="search">
        <ISearch />
        <input className="field" placeholder={tr('Chercher parmi {n} jeux', { n: GAMES.length })} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {SHELVES.map(sh => {
        const list = shown.filter(g => g.shelf === sh.id)
        if (!list.length) return null
        return (
          <section key={sh.id} className="stack" style={{ gap: 10 }}>
            <div className="sec-h"><h2>{tr(sh.title)}</h2><span className="muted small">{list.length}</span></div>
            {sh.hint && <p className="muted tiny" style={{ marginTop: -4 }}>{tr(sh.hint)}</p>}
            <div className={'grid-games' + (sh.id === 'more' ? ' small' : '')}>{list.map(g => tile(g, sh.id === 'more'))}</div>
          </section>
        )
      })}
      {shown.length === 0 && <p className="muted small empty">{tr("Aucun jeu ne s'appelle comme ça. Essaie un autre mot.")}</p>}
    </div>
  )
}
