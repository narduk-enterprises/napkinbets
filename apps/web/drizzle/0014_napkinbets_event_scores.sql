-- Add score columns to events table
ALTER TABLE napkinbets_events ADD COLUMN home_score TEXT NOT NULL DEFAULT '';
ALTER TABLE napkinbets_events ADD COLUMN away_score TEXT NOT NULL DEFAULT '';

-- Add score and state columns to wagers table
ALTER TABLE napkinbets_wagers ADD COLUMN event_state TEXT NOT NULL DEFAULT '';
ALTER TABLE napkinbets_wagers ADD COLUMN home_score TEXT NOT NULL DEFAULT '';
ALTER TABLE napkinbets_wagers ADD COLUMN away_score TEXT NOT NULL DEFAULT '';
