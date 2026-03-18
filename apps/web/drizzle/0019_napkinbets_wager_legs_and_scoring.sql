-- Migration: Add multi-leg wager support with pluggable scoring engine
-- Adds wager_legs table, scoring columns on wagers, and leg reference on picks

-- Scoring rule and config on wagers
ALTER TABLE napkinbets_wagers ADD COLUMN scoring_rule TEXT NOT NULL DEFAULT 'proportional';
ALTER TABLE napkinbets_wagers ADD COLUMN scoring_config_json TEXT NOT NULL DEFAULT '{}';

-- Wager legs (questions/items within a wager)
CREATE TABLE IF NOT EXISTS napkinbets_wager_legs (
  id TEXT PRIMARY KEY,
  wager_id TEXT NOT NULL REFERENCES napkinbets_wagers(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  leg_type TEXT NOT NULL DEFAULT 'categorical',
  options_json TEXT NOT NULL DEFAULT '[]',
  numeric_unit TEXT,
  numeric_precision INTEGER DEFAULT 0,
  outcome_status TEXT NOT NULL DEFAULT 'pending',
  outcome_option_key TEXT,
  outcome_numeric_value INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Leg reference and numeric value on picks
ALTER TABLE napkinbets_picks ADD COLUMN wager_leg_id TEXT REFERENCES napkinbets_wager_legs(id) ON DELETE SET NULL;
ALTER TABLE napkinbets_picks ADD COLUMN pick_numeric_value INTEGER;
