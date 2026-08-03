CREATE TABLE saved_locations_scoped (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  province_code TEXT NOT NULL,
  province TEXT NOT NULL,
  city_code TEXT NOT NULL,
  city TEXT NOT NULL,
  barangay_code TEXT NOT NULL DEFAULT '',
  barangay TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  company_id TEXT NOT NULL,
  UNIQUE (company_id, name)
);

INSERT INTO saved_locations_scoped SELECT id, name, province_code, province, city_code, city, barangay_code, barangay, address, created_at, updated_at, company_id FROM saved_locations;
DROP TABLE saved_locations;
ALTER TABLE saved_locations_scoped RENAME TO saved_locations;
CREATE INDEX idx_saved_locations_name ON saved_locations (name COLLATE NOCASE);
CREATE INDEX idx_saved_locations_company ON saved_locations (company_id, name COLLATE NOCASE);

CREATE TABLE saved_personnel_scoped (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('driver', 'helper')),
  name TEXT NOT NULL COLLATE NOCASE,
  default_rate_centavos INTEGER NOT NULL DEFAULT 0 CHECK (default_rate_centavos >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  company_id TEXT NOT NULL,
  UNIQUE (company_id, role, name)
);

INSERT INTO saved_personnel_scoped SELECT id, role, name, default_rate_centavos, created_at, updated_at, start_date, end_date, is_active, company_id FROM saved_personnel;
DROP TABLE saved_personnel;
ALTER TABLE saved_personnel_scoped RENAME TO saved_personnel;
CREATE INDEX idx_saved_personnel_role_name ON saved_personnel (role, name COLLATE NOCASE);
CREATE INDEX idx_saved_personnel_company ON saved_personnel (company_id, role, name COLLATE NOCASE);

CREATE TABLE saved_trucks_scoped (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  truck_type TEXT NOT NULL,
  plate_number TEXT NOT NULL COLLATE NOCASE,
  color TEXT NOT NULL,
  fuel_efficiency_km_per_liter REAL NOT NULL CHECK (fuel_efficiency_km_per_liter > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  company_id TEXT NOT NULL,
  UNIQUE (company_id, plate_number)
);

INSERT INTO saved_trucks_scoped SELECT id, brand, truck_type, plate_number, color, fuel_efficiency_km_per_liter, created_at, updated_at, company_id FROM saved_trucks;

CREATE TABLE fuel_logs_scoped (
  id TEXT PRIMARY KEY,
  truck_id TEXT REFERENCES saved_trucks_scoped(id) ON DELETE SET NULL,
  truck_plate_number TEXT NOT NULL COLLATE NOCASE,
  purchase_date TEXT NOT NULL,
  amount_centavos INTEGER NOT NULL CHECK (amount_centavos > 0),
  liters REAL NOT NULL CHECK (liters > 0),
  odometer_km REAL CHECK (odometer_km IS NULL OR odometer_km >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  company_id TEXT NOT NULL
);

INSERT INTO fuel_logs_scoped SELECT id, truck_id, truck_plate_number, purchase_date, amount_centavos, liters, odometer_km, notes, created_at, updated_at, company_id FROM fuel_logs;
DROP TABLE fuel_logs;
DROP TABLE saved_trucks;
ALTER TABLE saved_trucks_scoped RENAME TO saved_trucks;
ALTER TABLE fuel_logs_scoped RENAME TO fuel_logs;
CREATE INDEX idx_saved_trucks_plate_number ON saved_trucks (plate_number COLLATE NOCASE);
CREATE INDEX idx_saved_trucks_company ON saved_trucks (company_id, plate_number COLLATE NOCASE);
CREATE INDEX idx_fuel_logs_purchase_date ON fuel_logs (purchase_date DESC);
CREATE INDEX idx_fuel_logs_truck_id ON fuel_logs (truck_id);
CREATE INDEX idx_fuel_logs_plate_number ON fuel_logs (truck_plate_number COLLATE NOCASE);
CREATE INDEX idx_fuel_logs_company_date ON fuel_logs (company_id, purchase_date DESC);
