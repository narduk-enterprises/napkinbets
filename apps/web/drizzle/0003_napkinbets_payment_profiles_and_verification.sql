CREATE TABLE IF NOT EXISTS napkinbets_user_payment_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_label TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_public_on_boards INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS napkinbets_user_payment_profiles_user_id_idx
  ON napkinbets_user_payment_profiles(user_id);

ALTER TABLE napkinbets_settlements ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'submitted';
ALTER TABLE napkinbets_settlements ADD COLUMN verified_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE napkinbets_settlements ADD COLUMN verified_at TEXT;
