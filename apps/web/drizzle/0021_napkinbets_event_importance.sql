-- Add importance scoring columns to events table
ALTER TABLE napkinbets_events ADD COLUMN importance_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE napkinbets_events ADD COLUMN importance_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE napkinbets_events ADD COLUMN importance_scored_at TEXT;
