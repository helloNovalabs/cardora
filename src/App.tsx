import { lazy, Suspense, useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { IBag, IBinder, IChart, IHome, IPlus, IUser } from './components/Icons'
import { Brand } from './components/Brand'
import { snapshot, totals, useCollection } from './lib/store'
import { useAccount } from './lib/sync'
import { t as tr, useAppLang } from './lib/i18n'
import Home from './pages/Home'
const Explore = lazy(() => import('./pages/Explore'))
const Sets = lazy(() => import('./pages/Sets'))
const SetPage = lazy(() => import('./pages/SetPage'))
const CardPage = lazy(() => import('./pages/CardPage'))
const Add = lazy(() => import('./pages/Add'))
const Account = lazy(() => import('./pages/Account'))
const Invest = lazy(() => import('./pages/Invest'))
const Landing = lazy(() => import('./pages/Landing'))
const Shop = lazy(() => import('./pages/Shop'))
const Legal = lazy(() => import('./pages/Legal'))

const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
const TABS = [
  { to: '/', label: 'Collection', icon: <IHome />, match: (p: string) => p === '/' || p.startsWith('/carte') },
  { to: '/jeux', label: 'Classeurs', icon: <IBinder />, match: (p: string) => p.startsWith('/jeux') },
  { to: '/boutique', label: 'Marché', icon: <IBag />, match: (p: string) => p.startsWith('/boutique') },
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
  const value = totals(col).total
  // Une photo de la valeur par jour, pour la courbe de la page Investir
  useEffect(() => { const id = window.setTimeout(snapshot, 1500); return () => window.clearTimeout(id) }, [value])
  const active = TABS.findIndex(t => t.match(pathname))
  const appLang = useAppLang()

  if (pathname === '/decouvrir') return <Suspense fallback={null}><Landing key={appLang} /></Suspense>
  if (pathname === '/mentions-legales') return <Suspense fallback={null}><Legal key={appLang} /></Suspense>

  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" aria-label="Cardora"><Brand /></Link>
        <nav className="nav">
          <NavLink to="/" end className={cls}><IHome />{tr('Ma collection')}</NavLink>
          <NavLink to="/jeux" className={cls}><IBinder />{tr('Classeurs')}</NavLink>
          <NavLink to="/boutique" className={cls}><IBag />{tr('Marché')}</NavLink>
          <NavLink to="/investir" className={cls}><IChart />{tr('Investissement')}</NavLink>
          <NavLink to="/compte" className={cls}><IUser />{tr('Mon compte')}</NavLink>
          <NavLink to="/ajouter" className={({ isActive }) => 'add' + (isActive ? ' on' : '')}><IPlus />{tr('Ajouter une carte')}</NavLink>
        </nav>
        <div className="side-foot">
          <NavLink to="/compte" className={({ isActive }) => 'me' + (isActive ? ' on' : '')}>
            <Avatar />
            <div className="grow">
              <div className="small ellipsis" style={{ fontWeight: 700 }}>{acc.email ?? tr('Se connecter')}</div>
              <div className="tiny muted">{acc.email ? (acc.status === 'error' ? tr('Pas synchronisé') : tr('Synchronisé sur tes appareils')) : tr('Pour retrouver tes cartes partout')}</div>
            </div>
          </NavLink>
        </div>
      </aside>

      <main className="main">
        <header className="mob-head">
          <Link to="/" aria-label="Cardora"><Brand /></Link>
          <Link to="/compte" aria-label={tr('Mon compte')}><Avatar /></Link>
        </header>
        <Suspense key={appLang} fallback={<div className="stack" style={{ gap: 16 }}><div className="skel" style={{ height: 60 }} /><div className="skel" style={{ height: 320 }} /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jeux" element={<Explore />} />
          <Route path="/jeux/:game" element={<Sets />} />
          <Route path="/jeux/:game/:setId" element={<SetPage />} />
          <Route path="/carte/:game/:setId/:id" element={<CardPage />} />
          <Route path="/ajouter" element={<Add />} />
          <Route path="/investir" element={<Invest />} />
          <Route path="/boutique" element={<Shop />} />
          <Route path="/compte" element={<Account />} />
          <Route path="*" element={<Home />} />
        </Routes>
        </Suspense>
      </main>

      <nav className="dock" aria-label="Menu">
        <div className="dock-bar">
          <span className="dock-pill" style={{ transform: `translateX(${Math.max(0, active) * 100}%)`, opacity: active < 0 ? 0 : 1 }} />
          {TABS.map((t, i) => (
            <Link key={t.to} to={t.to} className={'tab' + (i === active ? ' on' : '')} aria-current={i === active ? 'page' : undefined}>{t.icon}{tr(t.label)}</Link>
          ))}
        </div>
        <NavLink to="/ajouter" className={({ isActive }) => 'fab' + (isActive ? ' on' : '')} aria-label={tr('Ajouter une carte')}><IPlus /></NavLink>
      </nav>
    </div>
  )
}
