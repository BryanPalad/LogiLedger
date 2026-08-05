CREATE TABLE IF NOT EXISTS shuttle_services (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  service_date TEXT NOT NULL,
  truck_id TEXT REFERENCES saved_trucks(id) ON DELETE SET NULL,
  truck_plate_number TEXT NOT NULL COLLATE NOCASE,
  client_company TEXT NOT NULL COLLATE NOCASE,
  service_location TEXT NOT NULL,
  trip_count INTEGER NOT NULL CHECK (trip_count > 0 AND trip_count <= 1000),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shuttle_services_company_date
  ON shuttle_services (company_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_shuttle_services_company_client
  ON shuttle_services (company_id, client_company COLLATE NOCASE);
