import { BusFront, ClipboardList, LayoutDashboard, MapPinned, Route, Settings, Truck, UsersRound, X } from 'lucide-react'

export type AppPage = 'dashboard' | 'trips' | 'shuttle' | 'trucks' | 'crew' | 'locations' | 'settings'

interface Props {
  companyName: string
  activePage: AppPage
  mobileOpen: boolean
  onNavigate: (page: AppPage) => void
  onClose: () => void
}

export function AppSidebar({ companyName, activePage, mobileOpen, onNavigate, onClose }: Props) {
  const navigate = (page: AppPage) => { onNavigate(page); onClose() }

  return <>
    <button className={`sidebar-scrim ${mobileOpen ? 'visible' : ''}`} onClick={onClose} aria-label="Close navigation" tabIndex={mobileOpen ? 0 : -1} />
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-brand"><span><Route size={21} /></span><div><strong>{companyName}</strong><small>LOGILEDGER</small></div><button onClick={onClose} aria-label="Close navigation"><X size={19} /></button></div>
      <nav className="sidebar-nav">
        <p>Workspace</p>
        <button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={18} /><span>Dashboard</span></button>
        <button className={activePage === 'trips' ? 'active' : ''} onClick={() => navigate('trips')}><ClipboardList size={18} /><span>Trips</span></button>
        <button className={activePage === 'shuttle' ? 'active' : ''} onClick={() => navigate('shuttle')}><BusFront size={18} /><span>Shuttle service</span></button>
        <p>Management</p>
        <button className={activePage === 'trucks' ? 'active' : ''} onClick={() => navigate('trucks')}><Truck size={18} /><span>Trucks</span></button>
        <button className={activePage === 'crew' ? 'active' : ''} onClick={() => navigate('crew')}><UsersRound size={18} /><span>Drivers &amp; helpers</span></button>
        <button className={activePage === 'locations' ? 'active' : ''} onClick={() => navigate('locations')}><MapPinned size={18} /><span>Locations</span></button>
        <p>Account</p>
        <button className={activePage === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Settings size={18} /><span>Settings</span></button>
      </nav>
      <div className="sidebar-footer"><span><i /> Cloudflare D1 connected</span><small>Secure logistics workspace</small></div>
    </aside>
  </>
}
