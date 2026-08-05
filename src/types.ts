export interface DropOffInput {
  id: string
  destinationProvinceCode: string
  destinationProvince: string
  destinationCityCode: string
  destinationCity: string
  destinationBarangayCode: string
  destinationBarangay: string
  destinationAddress: string
}

export interface SavedLocationInput {
  name: string
  provinceCode: string
  province: string
  cityCode: string
  city: string
  barangayCode: string
  barangay: string
  address: string
}

export interface SavedLocation extends SavedLocationInput {
  id: string
  createdAt: string
  updatedAt: string
}

export type PersonnelRole = 'driver' | 'helper'

export interface PersonnelInput {
  role: PersonnelRole
  name: string
  defaultRate: number
  startDate: string
  endDate: string
  isActive: boolean
}

export interface Personnel extends PersonnelInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface SavedTruckInput {
  brand: string
  truckType: string
  plateNumber: string
  color: string
  fuelEfficiencyKmPerLiter: number
}

export interface SavedTruck extends SavedTruckInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface FuelLogInput {
  truckId: string
  purchaseDate: string
  amount: number
  liters: number
  odometerKm: number | null
  notes: string
}

export interface FuelLog extends FuelLogInput {
  id: string
  truckPlateNumber: string
  createdAt: string
  updatedAt: string
}

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

export interface ShuttleService extends ShuttleServiceInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface TripInput {
  tripDate: string
  truckPlateNumber: string
  driverName: string
  helperName: string
  driverStartTime: string
  driverEndTime: string
  homeProvinceCode: string
  homeProvince: string
  homeCityCode: string
  homeCity: string
  homeBarangayCode: string
  homeBarangay: string
  homeAddress: string
  endingProvinceCode: string
  endingProvince: string
  endingCityCode: string
  endingCity: string
  endingBarangayCode: string
  endingBarangay: string
  endingAddress: string
  originProvinceCode: string
  originProvince: string
  originCityCode: string
  originCity: string
  originBarangayCode: string
  originBarangay: string
  originAddress: string
  destinationProvinceCode: string
  destinationProvince: string
  destinationCityCode: string
  destinationCity: string
  destinationBarangayCode: string
  destinationBarangay: string
  destinationAddress: string
  destination: string
  customerName: string
  revenue: number
  driverRate: number
  helperRate: number
  gasExpense: number
  parkingExpense: number
  tollExpense: number
  foodExpense: number
  otherExpense: number
  dropOffs: DropOffInput[]
  remarks: string
}

export interface Trip extends TripInput {
  id: string
  routeDistanceMeters: number | null
  deliveryDistanceMeters: number | null
  routeDurationSeconds: number | null
  routeCalculatedAt: string
  createdAt: string
  updatedAt: string
}

export type TripFormErrors = Partial<Record<keyof TripInput, string>>

export type ModalMode = 'create' | 'edit' | 'duplicate'
