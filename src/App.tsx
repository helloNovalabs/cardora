import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { IBinder, IHome, IPlus, ISearch, IUser } from './components/Icons'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Sets from './pages/Sets'
import SetPage from './pages/SetPage'
import CardPage from './pages/CardPage'
import Add from './pages/Add'
import Account from './pages/Account'

const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')
const tab = ({ isActive }: { isActive: boolean }) => 'tab ' + (isActive ? 'on' : '')

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i />Cardora</div>
        <NavLink to="/" end className={cls}><IHome />Ma collection</NavLink>
        <NavLink to="/jeux" className={cls}><IBinder />Classeurs</NavLink>
        <NavLink to="/ajouter" className={cls}><ISearch />Chercher une carte</NavLink>
        <NavLink to="/compte" className={cls}><IUser />Mon compte</NavLink>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jeux" element={<Explore />} />
          <Route path="/jeux/:game" element={<Sets />} />
          <Route path="/jeux/:game/:setId" element={<SetPage />} />
          <Route path="/carte/:game/:setId/:id" element={<CardPage />} />
          <Route path="/ajouter" element={<Add />} />
          <Route path="/compte" element={<Account />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <nav className="tabbar">
        <NavLink to="/" end className={tab}><IHome />Collection</NavLink>
        <NavLink to="/ajouter" className="tab plus"><span className="dot"><IPlus /></span>Ajouter</NavLink>
        <NavLink to="/jeux" className={tab}><IBinder />Classeurs</NavLink>
        <NavLink to="/compte" className={tab}><IUser />Compte</NavLink>
      </nav>
    </div>
  )
}
