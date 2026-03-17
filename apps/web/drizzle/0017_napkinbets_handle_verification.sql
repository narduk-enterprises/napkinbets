-- Add handle verification columns to payment profiles
ALTER TABLE napkinbets_user_payment_profiles ADD COLUMN handle_verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE napkinbets_user_payment_profiles ADD COLUMN handle_verified_at TEXT;
