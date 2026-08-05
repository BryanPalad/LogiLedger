import { Banknote, Building2, BusFront, CalendarDays, CircleDollarSign, MapPin, Pencil, Plus, Repeat2, Save, Search, TrendingUp, Trash2, Truck, UserRound } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import type { Personnel, SavedLocation, SavedTruck, ShuttleService, ShuttleServiceInput } from '../types'
import { formatPeso, getShuttleExpenses, getShuttleProfit } from '../utils/calculations'

interface Props {
  records: ShuttleService[]
  trucks: SavedTruck[]
  locations: SavedLocation[]
  personnel: Personnel[]
  onSave: (input: ShuttleServiceInput, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const today = () => new Date().toISOString().slice(0, 10)
const emptyRecord = (): ShuttleServiceInput => ({
  serviceDate: today(), truckId: '', truckPlateNumber: '', clientCompany: '', serviceLocation: '', tripCount: 1,
  driverName: '', revenue: 0, driverRate: 0, gasExpense: 0, tollExpense: 0, parkingExpense: 0, otherExpense: 0, notes: '',
})
const formatDate = (value: string) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
const locationText = (location: SavedLocation) => [location.name, location.address, location.barangay, location.city, location.province].filter(Boolean).join(', ')

export function ShuttleServicePage({ records, trucks, locations, personnel, onSave, onDelete }: Props) {
  const [form, setForm] = useState<ShuttleServiceInput>(emptyRecord)
  const [editingId, setEditingId] = useState<string>()
  const [deletingId, setDeletingId] = useState<string>()
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((record) => (!month || record.serviceDate.startsWith(month)) && (!query || [
      record.clientCompany, record.serviceLocation, record.truckPlateNumber, record.driverName, record.notes,
    ].some((value) => value.toLowerCase().includes(query))))
  }, [month, records, search])
  const totals = useMemo(() => ({
    days: new Set(visibleRecords.map((record) => record.serviceDate)).size,
    runs: visibleRecords.reduce((sum, record) => sum + record.tripCount, 0),
    clients: new Set(visibleRecords.map((record) => record.clientCompany.toLowerCase())).size,
    trucks: new Set(visibleRecords.map((record) => record.truckPlateNumber.toLowerCase())).size,
    revenue: visibleRecords.reduce((sum, record) => sum + record.revenue, 0),
    expenses: visibleRecords.reduce((sum, record) => sum + getShuttleExpenses(record), 0),
  }), [visibleRecords])
  const clientCompanies = useMemo(() => [...new Set(records.map((record) => record.clientCompany))].sort((a, b) => a.localeCompare(b)), [records])
  const drivers = useMemo(() => personnel.filter((person) => person.role === 'driver' && person.isActive), [personnel])

  const reset = () => { setForm(emptyRecord()); setEditingId(undefined); setDeletingId(undefined); setError('') }
  const selectTruck = (id: string) => {
    const truck = trucks.find((item) => item.id === id)
    setForm((current) => ({ ...current, truckId: id, truckPlateNumber: truck?.plateNumber ?? current.truckPlateNumber }))
  }
  const selectDriver = (id: string) => {
    const driver = drivers.find((item) => item.id === id)
    if (driver) setForm((current) => ({ ...current, driverName: driver.name, driverRate: driver.defaultRate }))
  }
  const edit = (record: ShuttleService) => {
    setForm({
      serviceDate: record.serviceDate, truckId: record.truckId, truckPlateNumber: record.truckPlateNumber,
      clientCompany: record.clientCompany, serviceLocation: record.serviceLocation, tripCount: record.tripCount, notes: record.notes,
      driverName: record.driverName, revenue: record.revenue, driverRate: record.driverRate, gasExpense: record.gasExpense,
      tollExpense: record.tollExpense, parkingExpense: record.parkingExpense, otherExpense: record.otherExpense,
    })
    setEditingId(record.id); setDeletingId(undefined); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.serviceDate || !form.truckPlateNumber.trim() || !form.clientCompany.trim() || !form.serviceLocation.trim() || !form.driverName.trim() || form.tripCount < 1) {
      setError('Date, truck plate, client company, location, driver, and at least one shuttle run are required.'); return
    }
    setSaving(true); setError('')
    try { await onSave(form, editingId); reset() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the shuttle service record.') }
    finally { setSaving(false) }
  }
  const moneyInput = (field: 'revenue' | 'driverRate' | 'gasExpense' | 'tollExpense' | 'parkingExpense' | 'otherExpense', label: string) => <label className="field"><span>{label}</span><div className="money-input"><i>₱</i><input type="number" min="0" step="0.01" value={String(form[field])} onChange={(event) => setForm((current) => ({ ...current, [field]: Math.max(0, Number(event.target.value)) }))} /></div></label>
  const remove = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); return }
    setSaving(true); setError('')
    try { await onDelete(id); if (editingId === id) reset(); setDeletingId(undefined) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete the shuttle service record.') }
    finally { setSaving(false) }
  }

  return <section className="shuttle-page" aria-labelledby="shuttle-page-title">
    <header className="management-page-heading shuttle-page-heading"><div><span className="eyebrow">SHUTTLE OPERATIONS</span><h1 id="shuttle-page-title">Shuttle service</h1><p>Track daily shuttle runs separately from delivery trips.</p></div></header>

    <div className="shuttle-summary-grid" aria-label="Filtered shuttle service totals">
      <article><span><CalendarDays size={19} /></span><div><small>Service days</small><strong>{totals.days}</strong></div></article>
      <article><span><Repeat2 size={19} /></span><div><small>Total shuttle runs</small><strong>{totals.runs}</strong></div></article>
      <article><span><Building2 size={19} /></span><div><small>Client companies</small><strong>{totals.clients}</strong></div></article>
      <article><span><Truck size={19} /></span><div><small>Trucks used</small><strong>{totals.trucks}</strong></div></article>
    </div>
    <div className="shuttle-financial-summary" aria-label="Filtered shuttle financial totals">
      <article><span><CircleDollarSign size={18} /></span><div><small>Shuttle revenue</small><strong>{formatPeso(totals.revenue)}</strong></div></article>
      <article><span><Banknote size={18} /></span><div><small>Shuttle expenses</small><strong>{formatPeso(totals.expenses)}</strong></div></article>
      <article><span><TrendingUp size={18} /></span><div><small>Estimated shuttle profit</small><strong className={totals.revenue - totals.expenses < 0 ? 'negative' : ''}>{formatPeso(totals.revenue - totals.expenses)}</strong></div></article>
    </div>

    <div className="shuttle-layout">
      <form className="shuttle-editor" onSubmit={submit} noValidate>
        <div className="location-editor-heading"><div><h3>{editingId ? 'Edit daily shuttle record' : 'Add daily shuttle record'}</h3><p>One record represents one truck, client, and route for a service day.</p></div>{editingId && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div>
        {error && <div className="location-manager-error" role="alert">{error}</div>}
        <div className="form-grid">
          <label className="field"><span>Service date<b>*</b></span><input type="date" value={form.serviceDate} onChange={(event) => setForm((current) => ({ ...current, serviceDate: event.target.value }))} /></label>
          <label className="field"><span>Number of shuttle runs<b>*</b></span><input type="number" min="1" max="1000" value={form.tripCount} onChange={(event) => setForm((current) => ({ ...current, tripCount: Number(event.target.value) }))} /></label>
          <label className="field full"><span>Saved truck <em>Optional</em></span><select value={form.truckId} onChange={(event) => selectTruck(event.target.value)}><option value="">Enter a truck manually</option>{trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.plateNumber} · {truck.brand} {truck.truckType}</option>)}</select></label>
          <label className="field full"><span>Truck plate number<b>*</b></span><input value={form.truckPlateNumber} maxLength={20} onChange={(event) => setForm((current) => ({ ...current, truckId: '', truckPlateNumber: event.target.value.toUpperCase() }))} placeholder="e.g. NLG 1819" /></label>
          <label className="field full saved-crew-picker"><span>Saved driver <em>Optional</em></span><select value="" onChange={(event) => selectDriver(event.target.value)} disabled={!drivers.length}><option value="">{drivers.length ? 'Select driver to autofill' : 'No active saved drivers'}</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} — {formatPeso(driver.defaultRate)}</option>)}</select><small>Fills the driver name and standard rate. Manual entry remains available.</small></label>
          <label className="field full"><span>Driver name<b>*</b></span><input value={form.driverName} maxLength={100} onChange={(event) => setForm((current) => ({ ...current, driverName: event.target.value }))} placeholder="Driver assigned to this shuttle service" /></label>
          <label className="field full"><span>Client company<b>*</b></span><input list="shuttle-client-companies" value={form.clientCompany} maxLength={100} onChange={(event) => setForm((current) => ({ ...current, clientCompany: event.target.value }))} placeholder="Company using the shuttle" /><datalist id="shuttle-client-companies">{clientCompanies.map((company) => <option key={company} value={company} />)}</datalist></label>
          <label className="field full"><span>Shuttle location / route<b>*</b></span><input list="shuttle-locations" value={form.serviceLocation} maxLength={200} onChange={(event) => setForm((current) => ({ ...current, serviceLocation: event.target.value }))} placeholder="e.g. Calamba Plant ↔ Employee Terminal" /><datalist id="shuttle-locations">{locations.map((location) => <option key={location.id} value={locationText(location)} />)}</datalist></label>
          <div className="shuttle-form-section full"><strong>Revenue &amp; expenses</strong><small>Included in the main financial dashboard.</small></div>
          {moneyInput('revenue', 'Revenue from client')}{moneyInput('driverRate', 'Driver rate')}
          {moneyInput('gasExpense', 'Gas expense')}{moneyInput('tollExpense', 'Toll expense')}
          {moneyInput('parkingExpense', 'Parking expense')}{moneyInput('otherExpense', 'Other expense')}
          <div className="shuttle-live-total full"><span><small>Total expenses</small><strong>{formatPeso(getShuttleExpenses(form))}</strong></span><span><small>Estimated profit</small><strong className={getShuttleProfit(form) < 0 ? 'negative' : ''}>{formatPeso(getShuttleProfit(form))}</strong></span></div>
          <label className="field full"><span>Notes <em>Optional</em></span><textarea rows={3} maxLength={500} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Shift, schedule, passengers, or other details" /></label>
        </div>
        <button className="primary-button shuttle-save-button" disabled={saving}>{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add shuttle record'}</button>
      </form>

      <section className="shuttle-records" aria-label="Shuttle service records">
        <div className="shuttle-records-heading"><div><h3>Daily shuttle records</h3><p>{visibleRecords.length} matching {visibleRecords.length === 1 ? 'record' : 'records'}</p></div><div className="shuttle-filters"><label><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, route, driver…" /></label><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Filter shuttle records by month" />{(search || month) && <button type="button" onClick={() => { setSearch(''); setMonth('') }}>Reset</button>}</div></div>
        {!visibleRecords.length && <div className="shuttle-empty"><BusFront size={25} /><strong>{records.length ? 'No matching shuttle records' : 'No shuttle service recorded yet'}</strong><span>{records.length ? 'Try changing the search or month filter.' : 'Add the first daily service record using the form.'}</span></div>}
        <div className="shuttle-record-list">
          {visibleRecords.map((record) => <article key={record.id}>
            <div className="shuttle-record-date"><small>SERVICE DATE</small><strong>{formatDate(record.serviceDate)}</strong><span>{record.tripCount} {record.tripCount === 1 ? 'run' : 'runs'}</span></div>
            <div className="shuttle-record-main"><strong>{record.clientCompany}</strong><span><MapPin size={13} /> {record.serviceLocation}</span><span><UserRound size={13} /> {record.driverName}</span>{record.notes && <p>{record.notes}</p>}</div>
            <div className="shuttle-record-truck"><small>TRUCK</small><strong>{record.truckPlateNumber}</strong></div>
            <div className="shuttle-record-finance"><small>REVENUE / PROFIT</small><strong>{formatPeso(record.revenue)}</strong><span className={getShuttleProfit(record) < 0 ? 'negative' : ''}>{formatPeso(getShuttleProfit(record))}</span></div>
            <div className="saved-location-actions"><button type="button" onClick={() => edit(record)} disabled={saving} aria-label={`Edit ${record.clientCompany} shuttle record`}><Pencil size={15} /></button><button type="button" className={deletingId === record.id ? 'confirming' : ''} onClick={() => remove(record.id)} disabled={saving} aria-label={deletingId === record.id ? 'Confirm deleting shuttle record' : 'Delete shuttle record'}><Trash2 size={15} />{deletingId === record.id && <small>Confirm</small>}</button></div>
          </article>)}
        </div>
      </section>
    </div>
  </section>
}
