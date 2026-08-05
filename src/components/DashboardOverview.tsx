import { ArrowRight, BusFront, CalendarDays, Filter, MapPin, Plus, RotateCcw, TrendingUp, Truck as TruckIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FuelLog, ShuttleService, Trip } from '../types'
import { formatDate, formatPeso, getEstimatedProfit, getShuttleExpenses, getShuttleProfit, getTotalExpenses, getTotalRevenue } from '../utils/calculations'
import { SummaryCards } from './SummaryCards'

interface Props {
  trips: Trip[]
  fuelLogs: FuelLog[]
  shuttleRecords: ShuttleService[]
  onNewTrip: () => void
  onViewTrip: (trip: Trip) => void
  onViewAllTrips: () => void
}

type PeriodMonths = 3 | 6 | 12
type ActivityType = 'all' | 'delivery' | 'shuttle'

interface MonthStat {
  key: string
  label: string
  fullLabel: string
  revenue: number
  expenses: number
  profit: number
  tripCount: number
  shuttleRunCount: number
}

const getPeriodStats = (trips: Trip[], fuelLogs: FuelLog[], shuttleRecords: ShuttleService[], monthCount: PeriodMonths, anchorTrips: Trip[], anchorFuelLogs: FuelLog[], anchorShuttleRecords: ShuttleService[]): MonthStat[] => {
  const today = new Date()
  const latestTripDate = anchorTrips.reduce((latest, trip) => trip.tripDate > latest ? trip.tripDate : latest, '')
  const latestFuelDate = anchorFuelLogs.reduce((latest, log) => log.purchaseDate > latest ? log.purchaseDate : latest, '')
  const latestShuttleDate = anchorShuttleRecords.reduce((latest, record) => record.serviceDate > latest ? record.serviceDate : latest, '')
  const latestRecordDate = [latestTripDate, latestFuelDate, latestShuttleDate].sort().at(-1) ?? ''
  const latest = latestRecordDate ? new Date(`${latestRecordDate}T00:00:00`) : today
  const anchor = latest > today ? latest : today
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - monthCount + 1 + index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthTrips = trips.filter((trip) => trip.tripDate.startsWith(key))
    const monthFuelLogs = fuelLogs.filter((log) => log.purchaseDate.startsWith(key))
    const monthShuttleRecords = shuttleRecords.filter((record) => record.serviceDate.startsWith(key))
    const revenue = monthTrips.reduce((sum, trip) => sum + getTotalRevenue(trip), 0) + monthShuttleRecords.reduce((sum, record) => sum + record.revenue, 0)
    const expenses = monthTrips.reduce((sum, trip) => sum + getTotalExpenses(trip), 0) + monthFuelLogs.reduce((sum, log) => sum + log.amount, 0) + monthShuttleRecords.reduce((sum, record) => sum + getShuttleExpenses(record), 0)
    return {
      key,
      label: new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(date),
      fullLabel: new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date),
      revenue,
      expenses,
      profit: revenue - expenses,
      tripCount: monthTrips.length,
      shuttleRunCount: monthShuttleRecords.reduce((sum, record) => sum + record.tripCount, 0),
    }
  })
}

const uniqueValues = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
const routeLabel = (trip: Trip) => `${trip.originCity || 'Pickup not specified'} → ${trip.destinationCity || trip.destination || 'Drop-off not specified'}`

export function DashboardOverview({ trips, fuelLogs, shuttleRecords, onNewTrip, onViewTrip, onViewAllTrips }: Props) {
  const [period, setPeriod] = useState<PeriodMonths>(6)
  const [activityType, setActivityType] = useState<ActivityType>('all')
  const [driver, setDriver] = useState('')
  const [truck, setTruck] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const includeDelivery = activityType !== 'shuttle'
  const includeShuttle = activityType !== 'delivery'
  const drivers = useMemo(() => uniqueValues([
    ...(activityType !== 'shuttle' ? trips.map((trip) => trip.driverName) : []),
    ...(activityType !== 'delivery' ? shuttleRecords.map((record) => record.driverName) : []),
  ]), [activityType, shuttleRecords, trips])
  const trucks = useMemo(() => uniqueValues([
    ...(activityType !== 'shuttle' ? trips.map((trip) => trip.truckPlateNumber) : []),
    ...(activityType !== 'delivery' ? shuttleRecords.map((record) => record.truckPlateNumber) : []),
  ]), [activityType, shuttleRecords, trips])
  const entityFilteredTrips = useMemo(() => includeDelivery ? trips.filter((trip) =>
    (!driver || trip.driverName === driver) && (!truck || trip.truckPlateNumber === truck),
  ) : [], [driver, includeDelivery, truck, trips])
  const entityFilteredFuelLogs = useMemo(() => includeDelivery ? fuelLogs.filter((log) => !driver && (!truck || log.truckPlateNumber === truck)) : [], [driver, fuelLogs, includeDelivery, truck])
  const entityFilteredShuttleRecords = useMemo(() => includeShuttle ? shuttleRecords.filter((record) =>
    (!driver || record.driverName === driver) && (!truck || record.truckPlateNumber === truck),
  ) : [], [driver, includeShuttle, shuttleRecords, truck])
  const months = useMemo(() => getPeriodStats(
    entityFilteredTrips, entityFilteredFuelLogs, entityFilteredShuttleRecords, period,
    includeDelivery ? trips : [], includeDelivery ? fuelLogs : [], includeShuttle ? shuttleRecords : [],
  ), [entityFilteredFuelLogs, entityFilteredShuttleRecords, entityFilteredTrips, fuelLogs, includeDelivery, includeShuttle, period, shuttleRecords, trips])
  const periodTrips = useMemo(() => entityFilteredTrips.filter((trip) => months.some((month) => trip.tripDate.startsWith(month.key))), [entityFilteredTrips, months])
  const periodFuelLogs = useMemo(() => entityFilteredFuelLogs.filter((log) => months.some((month) => log.purchaseDate.startsWith(month.key))), [entityFilteredFuelLogs, months])
  const periodShuttleRecords = useMemo(() => entityFilteredShuttleRecords.filter((record) => months.some((month) => record.serviceDate.startsWith(month.key))), [entityFilteredShuttleRecords, months])
  const activeMonth = months.some((month) => month.key === selectedMonth) ? selectedMonth : ''
  const displayTrips = useMemo(() => activeMonth ? periodTrips.filter((trip) => trip.tripDate.startsWith(activeMonth)) : periodTrips, [activeMonth, periodTrips])
  const displayFuelLogs = useMemo(() => activeMonth ? periodFuelLogs.filter((log) => log.purchaseDate.startsWith(activeMonth)) : periodFuelLogs, [activeMonth, periodFuelLogs])
  const displayShuttleRecords = useMemo(() => activeMonth ? periodShuttleRecords.filter((record) => record.serviceDate.startsWith(activeMonth)) : periodShuttleRecords, [activeMonth, periodShuttleRecords])
  const maximum = Math.max(1, ...months.flatMap((month) => [month.revenue, month.expenses]))
  const recentTrips = [...displayTrips].sort((a, b) => b.tripDate.localeCompare(a.tripDate) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const filteredRevenue = displayTrips.reduce((sum, trip) => sum + getTotalRevenue(trip), 0) + displayShuttleRecords.reduce((sum, record) => sum + record.revenue, 0)
  const filteredProfit = displayTrips.reduce((sum, trip) => sum + getEstimatedProfit(trip), 0) + displayShuttleRecords.reduce((sum, record) => sum + getShuttleProfit(record), 0) - displayFuelLogs.reduce((sum, log) => sum + log.amount, 0)
  const shuttleRunCount = displayShuttleRecords.reduce((sum, record) => sum + record.tripCount, 0)
  const activityCount = displayTrips.length + shuttleRunCount
  const selectedMonthStat = months.find((month) => month.key === activeMonth)
  const scopeLabel = selectedMonthStat?.fullLabel ?? `Last ${period} months`
  const filtersActive = period !== 6 || activityType !== 'all' || !!driver || !!truck || !!activeMonth

  const resetFilters = () => { setPeriod(6); setActivityType('all'); setDriver(''); setTruck(''); setSelectedMonth('') }
  const chooseMonth = (key: string) => setSelectedMonth((current) => current === key ? '' : key)

  return <>
    <section className="page-heading dashboard-heading">
      <div><span className="eyebrow">OPERATIONS OVERVIEW</span><h1>Dashboard</h1><p>Monitor financial performance and your latest logistics activity.</p></div>
      <button className="primary-button new-trip" onClick={onNewTrip}><Plus size={19} /> New Trip</button>
    </section>

    <section className="dashboard-filter-bar" aria-label="Dashboard filters">
      <div className="dashboard-filter-title"><Filter size={17} /><div><strong>Statistics filters</strong><small aria-live="polite">{scopeLabel} · {displayTrips.length} delivery {displayTrips.length === 1 ? 'trip' : 'trips'} · {shuttleRunCount} shuttle {shuttleRunCount === 1 ? 'run' : 'runs'} · {displayFuelLogs.length} fuel {displayFuelLogs.length === 1 ? 'entry' : 'entries'}</small></div></div>
      <label><span>Activity type</span><select value={activityType} onChange={(event) => { setActivityType(event.target.value as ActivityType); setDriver(''); setTruck(''); setSelectedMonth('') }}><option value="all">All activity</option><option value="delivery">Delivery trips</option><option value="shuttle">Shuttle service</option></select></label>
      <label><span>Time range</span><select value={period} onChange={(event) => { setPeriod(Number(event.target.value) as PeriodMonths); setSelectedMonth('') }}><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></label>
      <label><span>Driver</span><select value={driver} onChange={(event) => { setDriver(event.target.value); setSelectedMonth('') }}><option value="">All drivers</option>{drivers.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label><span>Truck</span><select value={truck} onChange={(event) => { setTruck(event.target.value); setSelectedMonth('') }}><option value="">All trucks</option>{trucks.map((plate) => <option key={plate} value={plate}>{plate}</option>)}</select></label>
      <button className="dashboard-reset-filter" type="button" onClick={resetFilters} disabled={!filtersActive}><RotateCcw size={15} /> Reset</button>
    </section>

    <SummaryCards trips={displayTrips} fuelLogs={displayFuelLogs} shuttleRecords={displayShuttleRecords} />

    <section className="dashboard-grid">
      <article className="dashboard-panel performance-chart-panel">
        <header className="dashboard-panel-heading"><div><span><TrendingUp size={18} /></span><div><h2>Financial performance</h2><p>Hover for details or select a month to focus the dashboard</p></div></div><div className="chart-legend"><span><i className="revenue" /> Revenue</span><span><i className="expenses" /> Expenses</span></div></header>
        <div className="chart-totals"><div><small>{scopeLabel} revenue</small><strong>{formatPeso(filteredRevenue)}</strong></div><div><small>{scopeLabel} profit</small><strong className={`profit ${filteredProfit < 0 ? 'negative' : ''}`}>{formatPeso(filteredProfit)}</strong></div>{activeMonth && <button type="button" onClick={() => setSelectedMonth('')}>Clear month focus</button>}</div>
        <div className={`bar-chart ${activeMonth ? 'has-selection' : ''}`} role="group" aria-label={`Revenue and expense chart for the last ${period} months`} style={{ gridTemplateColumns: `repeat(${months.length}, minmax(38px, 1fr))` }}>
          <div className="chart-grid-lines"><i /><i /><i /><i /></div>
          {months.map((month) => <button className={`chart-month ${activeMonth === month.key ? 'selected' : ''}`} key={month.key} type="button" aria-pressed={activeMonth === month.key} aria-label={`${month.fullLabel}: ${month.tripCount} delivery trips, ${month.shuttleRunCount} shuttle runs, revenue ${formatPeso(month.revenue)}, expenses ${formatPeso(month.expenses)}, profit ${formatPeso(month.profit)}. Select to focus this month.`} onClick={() => chooseMonth(month.key)}>
            <span className="chart-tooltip"><b>{month.fullLabel}</b><span><em>Delivery trips</em><strong>{month.tripCount}</strong></span><span><em>Shuttle runs</em><strong>{month.shuttleRunCount}</strong></span><span><em>Revenue</em><strong>{formatPeso(month.revenue)}</strong></span><span><em>Expenses</em><strong>{formatPeso(month.expenses)}</strong></span><span><em>Profit</em><strong className={month.profit < 0 ? 'negative' : ''}>{formatPeso(month.profit)}</strong></span><small>Click to {activeMonth === month.key ? 'clear focus' : 'focus month'}</small></span>
            <span className="chart-bars"><i className="revenue" style={{ height: `${month.revenue ? Math.max(5, month.revenue / maximum * 100) : 0}%` }} /><i className="expenses" style={{ height: `${month.expenses ? Math.max(5, month.expenses / maximum * 100) : 0}%` }} /></span>
            <small>{month.label}</small>
          </button>)}
        </div>
      </article>

      <article className="dashboard-panel dashboard-insight-panel">
        <header className="dashboard-panel-heading"><div><span><CalendarDays size={18} /></span><div><h2>At a glance</h2><p>{scopeLabel} activity</p></div></div></header>
        <div className="dashboard-insights">
          <div><span><TruckIcon size={18} /></span><small>Delivery trips</small><strong>{displayTrips.length}</strong></div>
          <div><span><BusFront size={18} /></span><small>Shuttle runs</small><strong>{shuttleRunCount}</strong></div>
          <div><span><TrendingUp size={18} /></span><small>Average profit / activity</small><strong>{formatPeso(activityCount ? filteredProfit / activityCount : 0)}</strong></div>
          <div><span><MapPin size={18} /></span><small>Total recorded distance</small><strong>{new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 }).format(displayTrips.reduce((sum, trip) => sum + (trip.routeDistanceMeters ?? 0), 0) / 1000)} km</strong></div>
        </div>
      </article>
    </section>

    <section className="dashboard-panel recent-trips-panel">
      <header className="dashboard-panel-heading"><div><span><TruckIcon size={18} /></span><div><h2>Recent trips</h2><p>Latest records matching {scopeLabel.toLowerCase()}</p></div></div><button className="text-button dashboard-view-all" onClick={onViewAllTrips}>View all trips <ArrowRight size={15} /></button></header>
      {!recentTrips.length ? <div className="dashboard-empty"><TruckIcon size={25} /><strong>No matching trips</strong><p>{trips.length ? 'Adjust or reset the statistics filters to see other records.' : 'Create your first trip to start seeing dashboard statistics.'}</p>{trips.length ? <button className="secondary-button" onClick={resetFilters}><RotateCcw size={15} /> Reset filters</button> : <button className="primary-button" onClick={onNewTrip}><Plus size={16} /> New Trip</button>}</div> : <div className="recent-trip-list">
        {recentTrips.map((trip) => {
          const profit = getEstimatedProfit(trip)
          return <button key={trip.id} onClick={() => onViewTrip(trip)}>
            <span className="recent-trip-date"><small>Date</small><strong>{formatDate(trip.tripDate)}</strong></span>
            <span className="recent-trip-plate"><small>Truck</small><strong>{trip.truckPlateNumber}</strong></span>
            <span className="recent-trip-route"><small>Route</small><strong>{routeLabel(trip)}</strong><em>{trip.customerName || 'No warehouse / hub'}</em></span>
            <span className="recent-trip-money"><small>Revenue</small><strong>{formatPeso(getTotalRevenue(trip))}</strong></span>
            <span className={`recent-trip-money ${profit < 0 ? 'negative' : ''}`}><small>Est. profit</small><strong>{formatPeso(profit)}</strong></span>
            <ArrowRight size={17} />
          </button>
        })}
      </div>}
    </section>
  </>
}
