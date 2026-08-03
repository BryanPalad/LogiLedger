CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Existing records belong to the original Z&L workspace. Its current APP_PIN
-- secret remains valid until the owner changes the authentication model later.
INSERT OR IGNORE INTO companies (id, name, pin_hash, pin_salt, created_at, updated_at)
VALUES ('z-l-palm-line-logistic', 'Z&L Palm Line Logistic', 'legacy-env', '', datetime('now'), datetime('now'));

ALTER TABLE trips ADD COLUMN company_id TEXT NOT NULL DEFAULT 'z-l-palm-line-logistic';
ALTER TABLE saved_locations ADD COLUMN company_id TEXT NOT NULL DEFAULT 'z-l-palm-line-logistic';
ALTER TABLE saved_personnel ADD COLUMN company_id TEXT NOT NULL DEFAULT 'z-l-palm-line-logistic';
ALTER TABLE saved_trucks ADD COLUMN company_id TEXT NOT NULL DEFAULT 'z-l-palm-line-logistic';
ALTER TABLE fuel_logs ADD COLUMN company_id TEXT NOT NULL DEFAULT 'z-l-palm-line-logistic';

CREATE INDEX IF NOT EXISTS idx_trips_company_date ON trips (company_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_saved_locations_company ON saved_locations (company_id, name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_saved_personnel_company ON saved_personnel (company_id, role, name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_saved_trucks_company ON saved_trucks (company_id, plate_number COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_company_date ON fuel_logs (company_id, purchase_date DESC);
