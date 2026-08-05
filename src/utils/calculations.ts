import type { ShuttleServiceInput, TripInput } from '../types'

export const getOtherExpenses = (trip: TripInput) =>
  trip.parkingExpense + trip.tollExpense + trip.foodExpense + trip.otherExpense

export const getTotalExpenses = (trip: TripInput) =>
  trip.driverRate + trip.helperRate + trip.gasExpense + getOtherExpenses(trip)

export const getTotalRevenue = (trip: TripInput) => trip.revenue

export const getEstimatedProfit = (trip: TripInput) => getTotalRevenue(trip) - getTotalExpenses(trip)

export const getShuttleExpenses = (record: ShuttleServiceInput) =>
  record.driverRate + record.gasExpense + record.tollExpense + record.parkingExpense + record.otherExpense

export const getShuttleProfit = (record: ShuttleServiceInput) => record.revenue - getShuttleExpenses(record)

const timeToMinutes = (time: string) => {
  if (!/^\d{2}:\d{2}$/.test(time)) return null
  const [hours, minutes] = time.split(':').map(Number)
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null
}

export const getDriverMinutes = (trip: Pick<TripInput, 'driverStartTime' | 'driverEndTime'>) => {
  const start = timeToMinutes(trip.driverStartTime)
  const end = timeToMinutes(trip.driverEndTime)
  if (start == null || end == null) return null
  return end >= start ? end - start : 24 * 60 - start + end
}

export const getDriverDailyMinutes = (trip: TripInput, trips: TripInput[]) => {
  const driver = trip.driverName.trim().toLocaleLowerCase()
  return trips
    .filter((candidate) => candidate.tripDate === trip.tripDate && candidate.driverName.trim().toLocaleLowerCase() === driver)
    .reduce((total, candidate) => total + (getDriverMinutes(candidate) ?? 0), 0)
}

export const formatDriverHours = (minutes: number | null | undefined) => {
  if (minutes == null || !Number.isFinite(minutes)) return '—'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours} hr${hours === 1 ? '' : 's'}${remainder ? ` ${remainder} min` : ''}`
}

export const formatPeso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0)

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )

export const formatDistance = (meters: number | null | undefined) =>
  Number.isFinite(meters) ? `${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 }).format(Number(meters) / 1000)} km` : '—'

export const formatDuration = (seconds: number | null | undefined) => {
  if (!Number.isFinite(seconds)) return '—'
  const totalMinutes = Math.max(1, Math.round(Number(seconds) / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours} hr${hours === 1 ? '' : 's'}${minutes ? ` ${minutes} min` : ''}` : `${minutes} min`
}
