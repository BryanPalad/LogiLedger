export interface ShuttleServiceInput {
  serviceDate: string
  truckId: string
  truckPlateNumber: string
  clientCompany: string
  serviceLocation: string
  tripCount: number
  driverName: string
  revenue: number
  driverRate: number
  gasExpense: number
  tollExpense: number
  parkingExpense: number
  otherExpense: number
  notes: string
}

export interface ShuttleServiceRow {
  id: string
  service_date: string
  truck_id: string | null
  truck_plate_number: string
  client_company: string
  service_location: string
  trip_count: number
  driver_name: string
  revenue_centavos: number
  driver_rate_centavos: number
  gas_expense_centavos: number
  toll_expense_centavos: number
  parking_expense_centavos: number
  other_expense_centavos: number
  notes: string
  created_at: string
  updated_at: string
}

export const validateShuttleService = (value: unknown): ShuttleServiceInput => {
  if (!value || typeof value !== 'object') throw new Error('Invalid shuttle service data.')
  const input = value as Record<string, unknown>
  const serviceDate = String(input.serviceDate ?? '').trim()
  const truckId = String(input.truckId ?? '').trim()
  const truckPlateNumber = String(input.truckPlateNumber ?? '').trim().toUpperCase().replace(/\s+/g, ' ')
  const clientCompany = String(input.clientCompany ?? '').trim().replace(/\s+/g, ' ')
  const serviceLocation = String(input.serviceLocation ?? '').trim().replace(/\s+/g, ' ')
  const tripCount = Number(input.tripCount)
  const driverName = String(input.driverName ?? '').trim().replace(/\s+/g, ' ')
  const money = (field: string, label: string) => {
    const amount = Number(input[field])
    if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000) throw new Error(`${label} must be a valid non-negative amount.`)
    return Math.round(amount * 100) / 100
  }
  const revenue = money('revenue', 'Shuttle revenue')
  const driverRate = money('driverRate', 'Driver rate')
  const gasExpense = money('gasExpense', 'Gas expense')
  const tollExpense = money('tollExpense', 'Toll expense')
  const parkingExpense = money('parkingExpense', 'Parking expense')
  const otherExpense = money('otherExpense', 'Other expense')
  const notes = String(input.notes ?? '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) throw new Error('A valid service date is required.')
  if (truckId.length > 100) throw new Error('Invalid saved truck selection.')
  if (!truckPlateNumber) throw new Error('Truck plate number is required.')
  if (truckPlateNumber.length > 20) throw new Error('Truck plate number must be 20 characters or fewer.')
  if (!clientCompany) throw new Error('Client company is required.')
  if (clientCompany.length > 100) throw new Error('Client company must be 100 characters or fewer.')
  if (!serviceLocation) throw new Error('Shuttle location or route is required.')
  if (serviceLocation.length > 200) throw new Error('Shuttle location or route must be 200 characters or fewer.')
  if (!Number.isInteger(tripCount) || tripCount < 1 || tripCount > 1000) throw new Error('Number of shuttle runs must be between 1 and 1,000.')
  if (!driverName) throw new Error('Driver name is required.')
  if (driverName.length > 100) throw new Error('Driver name must be 100 characters or fewer.')
  if (notes.length > 500) throw new Error('Notes must be 500 characters or fewer.')

  return { serviceDate, truckId, truckPlateNumber, clientCompany, serviceLocation, tripCount, driverName, revenue, driverRate, gasExpense, tollExpense, parkingExpense, otherExpense, notes }
}

export const rowToShuttleService = (row: ShuttleServiceRow) => ({
  id: row.id,
  serviceDate: row.service_date,
  truckId: row.truck_id ?? '',
  truckPlateNumber: row.truck_plate_number,
  clientCompany: row.client_company,
  serviceLocation: row.service_location,
  tripCount: Number(row.trip_count),
  driverName: row.driver_name,
  revenue: Number(row.revenue_centavos) / 100,
  driverRate: Number(row.driver_rate_centavos) / 100,
  gasExpense: Number(row.gas_expense_centavos) / 100,
  tollExpense: Number(row.toll_expense_centavos) / 100,
  parkingExpense: Number(row.parking_expense_centavos) / 100,
  otherExpense: Number(row.other_expense_centavos) / 100,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
