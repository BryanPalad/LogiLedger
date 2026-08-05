ALTER TABLE shuttle_services ADD COLUMN driver_name TEXT NOT NULL DEFAULT '';
ALTER TABLE shuttle_services ADD COLUMN revenue_centavos INTEGER NOT NULL DEFAULT 0 CHECK (revenue_centavos >= 0);
ALTER TABLE shuttle_services ADD COLUMN driver_rate_centavos INTEGER NOT NULL DEFAULT 0 CHECK (driver_rate_centavos >= 0);
ALTER TABLE shuttle_services ADD COLUMN gas_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (gas_expense_centavos >= 0);
ALTER TABLE shuttle_services ADD COLUMN toll_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (toll_expense_centavos >= 0);
ALTER TABLE shuttle_services ADD COLUMN parking_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (parking_expense_centavos >= 0);
ALTER TABLE shuttle_services ADD COLUMN other_expense_centavos INTEGER NOT NULL DEFAULT 0 CHECK (other_expense_centavos >= 0);

CREATE INDEX IF NOT EXISTS idx_shuttle_services_company_driver
  ON shuttle_services (company_id, driver_name COLLATE NOCASE);
