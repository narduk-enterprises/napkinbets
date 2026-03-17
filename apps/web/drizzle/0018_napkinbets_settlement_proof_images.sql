ALTER TABLE napkinbets_settlements ADD COLUMN proof_image_url TEXT;
ALTER TABLE napkinbets_settlements ADD COLUMN recipient_acknowledged INTEGER NOT NULL DEFAULT 0;
ALTER TABLE napkinbets_settlements ADD COLUMN recipient_acknowledged_at TEXT;
ALTER TABLE napkinbets_settlements ADD COLUMN recipient_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
