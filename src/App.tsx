import { useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { IBinder, IChart, IHome, IPlus, IUser } from './components/Icons'
import { Brand } from './components/Brand'
import { fmt, snapshot, totals, useCollection } from './lib/store'
import { useAccount } from './lib/sync'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Sets from './pages/Sets'
import SetPage from './pages/SetPage'
import CardPage from './pages/CardPage'
import Add from './pages/Add'
import Account from './pages/Account'
import Invest from './pages/Invest'

const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
const TABS = [
  { to: '/', label: 'Collection', icon: <IHome />, match: (p: string) => p === '/' || p.startsWith('/carte') },
  { to: '/jeux', label: 'Classeurs', icon: <IBinder />, match: (p: string) => p.startsWith('/jeux') },
  { to: '/investir', label: 'Investir', icon: <IChart />, match: (p: string) => p.startsWith('/investir') },
  { to: '/compte', label: 'Compte', icon: <IUser />, match: (p: string) => p.startsWith('/compte') },
]

function Avatar() {
  const acc = useAccount()
  return acc.email
    ? <span className="avatar on">{acc.email[0].toUpperCase()}</span>
    : <span className="avatar"><IUser /></span>
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const col = useCollection()
  const acc = useAccount()
  const owned = Object.values(col.owned)
  const t = totals(col)
  const value = t.total
  const count = owned.reduce((n, o) => n + o.qty, 0)
  const nSealed = (col.sealed ?? []).reduce((n, x) => n + x.qty, 0)
  // Une photo de la valeur par jour, pour la courbe de la page Investir
  useEffect(() => { const id = window.setTimeout(snapshot, 1500); return () => window.clearTimeout(id) }, [value])
  const active = TABS.findIndex(t => t.match(pathname))

  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" aria-label="Accueil Cardora"><Brand /></Link>
        <nav className="nav">
          <NavLink to="/" end className={cls}><IHome />Ma collection</NavLink>
          <NavLink to="/jeux" className={cls}><IBinder />Classeurs</NavLink>
          <NavLink to="/investir" className={cls}><IChart />Investissement</NavLink>
          <NavLink to="/compte" className={cls}><IUser />Mon compte</NavLink>
          <NavLink to="/ajouter" className={({ isActive }) => 'add' + (isActive ? ' on' : '')}><IPlus />Ajouter une carte</NavLink>
        </nav>
        <div className="side-foot">
          <Link to="/investir" className="wallet">
            <span className="kicker">Ta collection vaut</span>
            <span className="num foil-text">{fmt(value)}</span>
            <span className="tiny muted">{count} carte{count > 1 ? 's' : ''}{nSealed ? `, ${nSealed} scellé${nSealed > 1 ? 's' : ''}` : ''}, {col.followed.length} classeur{col.followed.length > 1 ? 's' : ''}</span>
            {t.tracked > 0 && Math.round(t.gain) !== 0 && <span className={'tiny ' + (t.gain > 0 ? 'up' : 'down')} style={{ display: 'block', fontWeight: 700, marginTop: 2 }}>{t.gain > 0 ? '+' : '−'}{fmt(Math.abs(t.gain))} depuis l’achat</span>}
          </Link>
          <NavLink to="/compte" className={({ isActive }) => 'me' + (isActive ? ' on' : '')}>
            <Avatar />
            <div className="grow">
              <div className="small ellipsis" style={{ fontWeight: 700 }}>{acc.email ?? 'Se connecter'}</div>
              <div className="tiny muted">{acc.email ? (acc.status === 'error' ? 'Pas synchronisé' : 'Synchronisé sur tes appareils') : 'Pour retrouver tes cartes partout'}</div>
            </div>
          </NavLink>
        </div>
      </aside>

      <main className="main">
        <header className="mob-head">
          <Link to="/" aria-label="Accueil Cardora"><Brand /></Link>
          <Link to="/compte" aria-label="Mon compte"><Avatar /></Link>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jeux" element={<Explore />} />
          <Route path="/jeux/:game" element={<Sets />} />
          <Route path="/jeux/:game/:setId" element={<SetPage />} />
          <Route path="/carte/:game/:setId/:id" element={<CardPage />} />
          <Route path="/ajouter" element={<Add />} />
          <Route path="/investir" element={<Invest />} />
          <Route path="/compte" element={<Account />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <nav className="dock" aria-label="Navigation">
        <div className="dock-bar">
          <span className="dock-pill" style={{ transform: `translateX(${Math.max(0, active) * 100}%)`, opacity: active < 0 ? 0 : 1 }} />
          {TABS.map((t, i) => (
            <Link key={t.to} to={t.to} className={'tab' + (i === active ? ' on' : '')} aria-current={i === active ? 'page' : undefined}>{t.icon}{t.label}</Link>
          ))}
        </div>
        <NavLink to="/ajouter" className={({ isActive }) => 'fab' + (isActive ? ' on' : '')} aria-label="Ajouter une carte"><IPlus /></NavLink>
      </nav>
    </div>
  )
}
