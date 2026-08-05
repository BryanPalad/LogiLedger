ALTER TABLE companies ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

-- Authentication attempt keys changed from per-workspace to per-client in this
-- release. The old short-lived counters are no longer used.
DELETE FROM auth_attempts;
