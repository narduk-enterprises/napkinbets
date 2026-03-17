-- napkinbets event odds cache (Polymarket)
CREATE TABLE IF NOT EXISTS napkinbets_event_odds (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES napkinbets_events(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'polymarket',
  polymarket_event_slug TEXT,
  polymarket_url TEXT,
  moneyline_json TEXT,
  spread_json TEXT,
  total_json TEXT,
  extra_markets_json TEXT NOT NULL DEFAULT '[]',
  volume INTEGER,
  price_change_24h INTEGER,
  comment_count INTEGER,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_napkinbets_event_odds_event_id ON napkinbets_event_odds(event_id);
CREATE INDEX IF NOT EXISTS idx_napkinbets_event_odds_expires_at ON napkinbets_event_odds(expires_at);
