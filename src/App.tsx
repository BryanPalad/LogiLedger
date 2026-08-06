import { LogOut, Menu, Moon, Plus, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppSidebar, type AppPage } from './components/AppSidebar'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { DashboardOverview } from './components/DashboardOverview'
import { LandingPage } from './components/LandingPage'
import { PinLogin } from './components/PinLogin'
import { SearchBar } from './components/SearchBar'
import { SettingsPage } from './components/SettingsPage'
import { ShuttleServicePage } from './components/ShuttleServicePage'
import { SuccessToast } from './components/SuccessToast'
import { TripModal } from './components/TripModal'
import { TripDetailsModal } from './components/TripDetailsModal'
import { TripTable } from './components/TripTable'
import { LocationManagementModal } from './components/LocationManagementModal'
import { PersonnelManagementModal } from './components/PersonnelManagementModal'
import { TruckManagementModal } from './components/TruckManagementModal'
import { storageService } from './services/storageService'
import { authService, type CompanySession } from './services/authService'
import { locationService } from './services/locationService'
import { personnelService } from './services/personnelService'
import { truckService } from './services/truckService'
import { fuelLogService } from './services/fuelLogService'
import { shuttleService } from './services/shuttleService'
import type { FuelLog, FuelLogInput, ModalMode, Personnel, PersonnelInput, SavedLocation, SavedLocationInput, SavedTruck, SavedTruckInput, ShuttleService, ShuttleServiceInput, Trip, TripInput } from './types'
import { exportTripsToCsv } from './utils/exportCsv'

const today = () => new Date().toISOString().slice(0, 10)
const emptyTrip = (): TripInput => ({
  tripDate: today(), truckPlateNumber: '', driverName: '', helperName: '', driverStartTime: '', driverEndTime: '',
  homeProvinceCode: '', homeProvince: '', homeCityCode: '', homeCity: '', homeBarangayCode: '', homeBarangay: '', homeAddress: '',
  endingProvinceCode: '', endingProvince: '', endingCityCode: '', endingCity: '', endingBarangayCode: '', endingBarangay: '', endingAddress: '',
  originProvinceCode: '', originProvince: '', originCityCode: '', originCity: '', originBarangayCode: '', originBarangay: '', originAddress: '',
  destinationProvinceCode: '', destinationProvince: '', destinationCityCode: '', destinationCity: '', destinationBarangayCode: '', destinationBarangay: '', destinationAddress: '',
  destination: '', customerName: '',
  revenue: 0, driverRate: 0, helperRate: 0, gasExpense: 0, parkingExpense: 0, tollExpense: 0,
  foodExpense: 0, otherExpense: 0, dropOffs: [], remarks: '',
})

function App() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [savedTrucks, setSavedTrucks] = useState<SavedTruck[]>([])
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [shuttleRecords, setShuttleRecords] = useState<ShuttleService[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [company, setCompany] = useState<CompanySession | null>(null)
  const [rememberedCompany, setRememberedCompany] = useState<CompanySession>(() => authService.getRememberedCompany())
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [modal, setModal] = useState<{ mode: ModalMode; trip?: Trip } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)
  const [viewTarget, setViewTarget] = useState<Trip | null>(null)
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSearch(storageService.getSearch())
      setMonth(storageService.getMonth())
      setTheme(storageService.getTheme())
      authService.hasSession()
        .then(async (session) => {
          setAuthenticated(Boolean(session))
          setCompany(session)
          if (session) setRememberedCompany(session)
          if (session) {
            const [loadedTrips, loadedLocations, loadedPersonnel, loadedTrucks, loadedFuelLogs, loadedShuttleRecords] = await Promise.all([storageService.getTrips(), locationService.getLocations(), personnelService.getPersonnel(), truckService.getTrucks(), fuelLogService.getFuelLogs(), shuttleService.getRecords()])
            setTrips(loadedTrips); setSavedLocations(loadedLocations); setPersonnel(loadedPersonnel); setSavedTrucks(loadedTrucks); setFuelLogs(loadedFuelLogs); setShuttleRecords(loadedShuttleRecords)
          }
        })
        .catch((error: unknown) => setStorageError(error instanceof Error ? error.message : 'Unable to load trips.'))
        .finally(() => setLoading(false))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [toast])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen)
    return () => document.body.classList.remove('sidebar-open')
  }, [sidebarOpen])
  useEffect(() => {
    const expireSession = () => { setAuthenticated(false); setCompany(null); setAuthView('login'); setTrips([]); setSavedLocations([]); setPersonnel([]); setSavedTrucks([]); setFuelLogs([]); setShuttleRecords([]); setModal(null); setDeleteTarget(null); setViewTarget(null); setSidebarOpen(false); setToast(null) }
    window.addEventListener('auth-expired', expireSession)
    return () => window.removeEventListener('auth-expired', expireSession)
  }, [])

  const loadWorkspace = async () => {
    const [loadedTrips, loadedLocations, loadedPersonnel, loadedTrucks, loadedFuelLogs, loadedShuttleRecords] = await Promise.all([storageService.getTrips(), locationService.getLocations(), personnelService.getPersonnel(), truckService.getTrucks(), fuelLogService.getFuelLogs(), shuttleService.getRecords()])
    setTrips(loadedTrips); setSavedLocations(loadedLocations); setPersonnel(loadedPersonnel); setSavedTrucks(loadedTrucks); setFuelLogs(loadedFuelLogs); setShuttleRecords(loadedShuttleRecords)
  }
  const login = async (pin: string, workspace?: string) => {
    const activeCompany = await authService.login(pin, workspace)
    await loadWorkspace()
    setCompany(activeCompany)
    setRememberedCompany(activeCompany)
    setAuthenticated(true)
    setAuthView('landing')
    setStorageError('')
  }
  const signup = async (companyName: string, pin: string) => {
    const activeCompany = await authService.signup(companyName, pin)
    await loadWorkspace()
    setCompany(activeCompany)
    setRememberedCompany(activeCompany)
    setAuthenticated(true)
    setAuthView('landing')
    setStorageError('')
  }
  const logout = async () => {
    await authService.logout()
    setAuthenticated(false)
    setCompany(null)
    setAuthView('landing')
    setTrips([])
    setSavedLocations([])
    setPersonnel([])
    setSavedTrucks([])
    setFuelLogs([])
    setShuttleRecords([])
    setModal(null)
    setDeleteTarget(null)
    setViewTarget(null)
    setSidebarOpen(false)
    setToast(null)
  }

  const updateSearch = (value: string) => { setSearch(value); storageService.saveSearch(value) }
  const updateMonth = (value: string) => { setMonth(value); storageService.saveMonth(value) }
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next); storageService.saveTheme(next)
  }
  const monthFilteredTrips = useMemo(() => [...trips]
    .filter((trip) => !month || trip.tripDate.startsWith(month))
    .sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.createdAt.localeCompare(a.createdAt)), [trips, month])
  const visibleTrips = useMemo(() => {
    const query = search.trim().toLowerCase()
    return monthFilteredTrips
      .filter((trip) => !query || [
        trip.driverName, trip.helperName, trip.truckPlateNumber, trip.destination, trip.customerName,
        trip.homeProvince, trip.homeCity, trip.homeBarangay, trip.homeAddress,
        trip.endingProvince, trip.endingCity, trip.endingBarangay, trip.endingAddress,
        trip.originProvince, trip.originCity, trip.originBarangay, trip.originAddress,
        trip.destinationProvince, trip.destinationCity, trip.destinationBarangay, trip.destinationAddress,
        ...trip.dropOffs.flatMap((dropOff) => [dropOff.destinationProvince, dropOff.destinationCity, dropOff.destinationBarangay, dropOff.destinationAddress]),
      ].some((value) => (value ?? '').toLowerCase().includes(query)))
  }, [monthFilteredTrips, search])

  const saveTrip = async (input: TripInput) => {
    setSaving(true)
    setStorageError('')
    try {
      const isEdit = modal?.mode === 'edit' && !!modal.trip
      if (isEdit && modal?.trip) setTrips(await storageService.updateTrip(modal.trip.id, input))
      else setTrips(await storageService.createTrip(input))
      setModal(null)
      setToast({ id: crypto.randomUUID(), message: isEdit ? 'Trip updated successfully.' : 'Trip added successfully.' })
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to save the trip.')
    } finally {
      setSaving(false)
    }
  }
  const deleteTrip = async () => {
    if (!deleteTarget) return
    setStorageError('')
    try {
      setTrips(await storageService.deleteTrip(deleteTarget.id))
      setDeleteTarget(null)
      setToast({ id: crypto.randomUUID(), message: 'Trip deleted successfully.' })
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Unable to delete the trip.')
    }
  }
  const saveLocation = async (input: SavedLocationInput, id?: string) => {
    if (id) await locationService.updateLocation(id, input)
    else await locationService.createLocation(input)
    setSavedLocations(await locationService.getLocations())
    setToast({ id: crypto.randomUUID(), message: id ? 'Saved location updated.' : 'Location saved successfully.' })
  }
  const deleteLocation = async (id: string) => {
    await locationService.deleteLocation(id)
    setSavedLocations(await locationService.getLocations())
    setToast({ id: crypto.randomUUID(), message: 'Saved location deleted.' })
  }
  const savePerson = async (input: PersonnelInput, id?: string) => {
    if (id) await personnelService.updatePerson(id, input)
    else await personnelService.createPerson(input)
    setPersonnel(await personnelService.getPersonnel())
    setToast({ id: crypto.randomUUID(), message: id ? 'Crew member updated.' : 'Crew member saved.' })
  }
  const deletePerson = async (id: string) => {
    await personnelService.deletePerson(id)
    setPersonnel(await personnelService.getPersonnel())
    setToast({ id: crypto.randomUUID(), message: 'Crew member deleted.' })
  }
  const saveTruck = async (input: SavedTruckInput, id?: string) => {
    if (id) await truckService.updateTruck(id, input)
    else await truckService.createTruck(input)
    setSavedTrucks(await truckService.getTrucks())
    setToast({ id: crypto.randomUUID(), message: id ? 'Truck updated.' : 'Truck saved successfully.' })
  }
  const deleteTruck = async (id: string) => {
    await truckService.deleteTruck(id)
    setSavedTrucks(await truckService.getTrucks())
    setToast({ id: crypto.randomUUID(), message: 'Truck deleted.' })
  }
  const saveFuelLog = async (input: FuelLogInput, id?: string) => {
    if (id) await fuelLogService.updateFuelLog(id, input)
    else await fuelLogService.createFuelLog(input)
    setFuelLogs(await fuelLogService.getFuelLogs())
    setToast({ id: crypto.randomUUID(), message: id ? 'Fuel purchase updated.' : 'Fuel expense added.' })
  }
  const deleteFuelLog = async (id: string) => {
    await fuelLogService.deleteFuelLog(id)
    setFuelLogs(await fuelLogService.getFuelLogs())
    setToast({ id: crypto.randomUUID(), message: 'Fuel purchase deleted.' })
  }
  const saveShuttleRecord = async (input: ShuttleServiceInput, id?: string) => {
    if (id) await shuttleService.updateRecord(id, input)
    else await shuttleService.createRecord(input)
    setShuttleRecords(await shuttleService.getRecords())
    setToast({ id: crypto.randomUUID(), message: id ? 'Shuttle service record updated.' : 'Shuttle service record added.' })
  }
  const deleteShuttleRecord = async (id: string) => {
    await shuttleService.deleteRecord(id)
    setShuttleRecords(await shuttleService.getRecords())
    setToast({ id: crypto.randomUUID(), message: 'Shuttle service record deleted.' })
  }
  const changePin = async (currentPin: string, newPin: string) => {
    await authService.changePin(currentPin, newPin)
    setToast({ id: crypto.randomUUID(), message: 'Access PIN updated successfully.' })
  }
  const initialData: TripInput = modal?.trip ? {
    tripDate: modal.trip.tripDate, truckPlateNumber: modal.trip.truckPlateNumber,
    driverName: modal.trip.driverName, helperName: modal.trip.helperName,
    driverStartTime: modal.trip.driverStartTime ?? '', driverEndTime: modal.trip.driverEndTime ?? '',
    homeProvinceCode: modal.trip.homeProvinceCode ?? '', homeProvince: modal.trip.homeProvince ?? '',
    homeCityCode: modal.trip.homeCityCode ?? '', homeCity: modal.trip.homeCity ?? '',
    homeBarangayCode: modal.trip.homeBarangayCode ?? '', homeBarangay: modal.trip.homeBarangay ?? '', homeAddress: modal.trip.homeAddress ?? '',
    endingProvinceCode: modal.trip.endingProvinceCode ?? '', endingProvince: modal.trip.endingProvince ?? '',
    endingCityCode: modal.trip.endingCityCode ?? '', endingCity: modal.trip.endingCity ?? '',
    endingBarangayCode: modal.trip.endingBarangayCode ?? '', endingBarangay: modal.trip.endingBarangay ?? '', endingAddress: modal.trip.endingAddress ?? '',
    originProvinceCode: modal.trip.originProvinceCode, originProvince: modal.trip.originProvince,
    originCityCode: modal.trip.originCityCode, originCity: modal.trip.originCity,
    originBarangayCode: modal.trip.originBarangayCode ?? '', originBarangay: modal.trip.originBarangay ?? '', originAddress: modal.trip.originAddress,
    destinationProvinceCode: modal.trip.destinationProvinceCode, destinationProvince: modal.trip.destinationProvince,
    destinationCityCode: modal.trip.destinationCityCode, destinationCity: modal.trip.destinationCity,
    destinationBarangayCode: modal.trip.destinationBarangayCode ?? '', destinationBarangay: modal.trip.destinationBarangay ?? '',
    destinationAddress: modal.trip.destinationAddress,
    destination: modal.trip.destination, customerName: modal.trip.customerName,
    revenue: modal.trip.revenue, driverRate: modal.trip.driverRate,
    helperRate: modal.trip.helperRate, gasExpense: modal.trip.gasExpense,
    parkingExpense: modal.trip.parkingExpense, tollExpense: modal.trip.tollExpense,
    foodExpense: modal.trip.foodExpense, otherExpense: modal.trip.otherExpense,
    dropOffs: modal.trip.dropOffs ?? [],
    remarks: modal.trip.remarks,
  } : emptyTrip()

  if (loading) return <div className="loading-state full-page"><div className="spinner" /><p>Preparing your secure dashboard...</p></div>
  if (!authenticated) return authView === 'landing'
    ? <LandingPage onSignIn={() => setAuthView('login')} onCreateAccount={() => setAuthView('signup')} />
    : <PinLogin mode={authView} rememberedCompany={rememberedCompany} onLogin={login} onSignup={signup} onModeChange={setAuthView} onBack={() => setAuthView('landing')} />

  const pageMeta: Record<AppPage, { title: string; description: string }> = {
    dashboard: { title: 'Dashboard', description: 'Operations overview' },
    trips: { title: 'Trips', description: 'Delivery ledger' },
    shuttle: { title: 'Shuttle service', description: 'Daily shuttle tracking' },
    trucks: { title: 'Trucks', description: 'Fleet management' },
    crew: { title: 'Drivers & helpers', description: 'Crew management' },
    locations: { title: 'Locations', description: 'Saved addresses' },
    settings: { title: 'Settings', description: 'Workspace access' },
  }

  return (
    <div className="app-shell">
      <AppSidebar companyName={company?.name ?? 'Company workspace'} activePage={activePage} mobileOpen={sidebarOpen} onNavigate={setActivePage} onClose={() => setSidebarOpen(false)} />
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-page"><button className="icon-button mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div><strong>{pageMeta[activePage].title}</strong><small>{pageMeta[activePage].description}</small></div></div>
          <div className="topbar-actions"><span className="storage-status"><i /> Cloud database</span><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button><button className="secondary-button logout-button" onClick={logout}><LogOut size={16} /> Sign out</button></div>
        </header>
        <main id="top">
          {storageError && <div className="error-banner" role="alert"><span>{storageError}</span><button onClick={() => setStorageError('')}>Dismiss</button></div>}
          {activePage === 'dashboard' ? <DashboardOverview trips={trips} fuelLogs={fuelLogs} shuttleRecords={shuttleRecords} onNewTrip={() => setModal({ mode: 'create' })} onViewTrip={setViewTarget} onViewAllTrips={() => setActivePage('trips')} /> : activePage === 'trips' ? <>
            <section className="page-heading trips-page-heading">
              <div><span className="eyebrow">TRIP RECORDS</span><h1>Delivery ledger</h1><p>Search, filter, review, and manage every logistics trip.</p></div>
              <button className="primary-button new-trip" onClick={() => setModal({ mode: 'create' })}><Plus size={19} /> New Trip</button>
            </section>
            <section className="records-panel">
              <div className="records-heading"><div><h2>All trips</h2><p>{monthFilteredTrips.length ? `${monthFilteredTrips.length} ${month ? 'trips in the selected month' : `saved ${monthFilteredTrips.length === 1 ? 'trip' : 'trips'} in your ledger`}` : month ? 'No trips in the selected month' : 'Your delivery ledger will appear here'}</p></div></div>
              <SearchBar value={search} onChange={updateSearch} month={month} onMonthChange={updateMonth} onExport={() => exportTripsToCsv(visibleTrips)} onPrint={() => window.print()} resultCount={visibleTrips.length} disabled={!visibleTrips.length} />
              <TripTable trips={visibleTrips} hasTrips={trips.length > 0} onNew={() => setModal({ mode: 'create' })} onView={setViewTarget} onEdit={(trip) => setModal({ mode: 'edit', trip })} onDuplicate={(trip) => setModal({ mode: 'duplicate', trip })} onDelete={setDeleteTarget} />
              {!!visibleTrips.length && <div className="table-footer">Showing <strong>{visibleTrips.length}</strong> of <strong>{monthFilteredTrips.length}</strong> trips</div>}
            </section>
          </> : activePage === 'shuttle' ? <ShuttleServicePage records={shuttleRecords} trucks={savedTrucks} locations={savedLocations} personnel={personnel} onSave={saveShuttleRecord} onDelete={deleteShuttleRecord} /> : activePage === 'trucks' ? <TruckManagementModal trucks={savedTrucks} trips={trips} fuelLogs={fuelLogs} onSave={saveTruck} onDelete={deleteTruck} onSaveFuelLog={saveFuelLog} onDeleteFuelLog={deleteFuelLog} /> : activePage === 'crew' ? <PersonnelManagementModal personnel={personnel} onSave={savePerson} onDelete={deletePerson} /> : activePage === 'locations' ? <LocationManagementModal locations={savedLocations} onSave={saveLocation} onDelete={deleteLocation} /> : company ? <SettingsPage company={company} onChangePin={changePin} /> : null}
        </main>
        <footer className="app-footer"><span>{company?.name ?? 'Company workspace'} · Powered by LogiLedger</span><span>Securely stored in Cloudflare D1</span></footer>
      </div>

      {modal && <TripModal mode={modal.mode} initialData={initialData} savedLocations={savedLocations} personnel={personnel} savedTrucks={savedTrucks} onClose={() => !saving && setModal(null)} onSave={saveTrip} saving={saving} />}
      {viewTarget && <TripDetailsModal trip={viewTarget} trips={trips} onClose={() => setViewTarget(null)} onEdit={(trip) => { setViewTarget(null); setModal({ mode: 'edit', trip }) }} />}
      {deleteTarget && <ConfirmDeleteModal trip={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={deleteTrip} />}
      {toast && <SuccessToast key={toast.id} message={toast.message} onDismiss={() => setToast(null)} />}
    </div>
  )
}

export default App
