-- Seed data for local development
-- Run: pnpm run db:seed (after db:migrate)

INSERT OR IGNORE INTO users (id, email, password_hash, name, is_admin, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@example.com', NULL, 'Demo User', 0, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000002', 'admin@nard.uk', 'e9b7cf6bc7fb3d2e95c57c17b1c94fdb:ad7a4ddabb6b3f00bf6007f7c76af606d3167227ef27aece897d6a572c1e87c5', 'Admin User', 1, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000003', 'pat@nard.uk', '1371392b2a86dc0ef182949e8f7bb14a:69f16020394e3e4e6660f3b4864c52a46d3640da2b8806f0e4fff7c9b9373b80', 'Pat', 0, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000004', 'logan@nard.uk', '1371392b2a86dc0ef182949e8f7bb14a:69f16020394e3e4e6660f3b4864c52a46d3640da2b8806f0e4fff7c9b9373b80', 'Logan', 0, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO todos (user_id, title, completed, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Set up local development', 1, '2025-01-01T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000001', 'Run database migrations', 1, '2025-01-01T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000001', 'Seed the database', 0, '2025-01-01T00:00:00.000Z'),
  ('00000000-0000-0000-0000-000000000002', 'Review admin dashboard', 0, '2025-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO napkinbets_friendships (id, requester_user_id, addressee_user_id, status, responded_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-f00000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'accepted', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');

-- ─── One-on-One Bets: Logan vs Pat ─────────────────────────────────────
-- Uses real games from the dev DB ingested via ESPN.

-- ▸ BET 1 — Finished & Paid (Yankees 3, Rays 2 — Logan picked NYY, won)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, event_state, home_team_name, away_team_name, home_score, away_score, created_at, updated_at)
VALUES (
  'seed-bet-0001', '00000000-0000-0000-0000-000000000004', 'yankees-rays-spring-1', 'Yankees vs Rays', 'One-on-one bet for NYY @ TB spring training.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'baseball', 'mlb', 'pro', 'settled', 'Logan', '["Yankees","Rays"]', 1000, 'Venmo', '@logan-v', 'Friendly bets only. Venmo settlement happens manually after the official result posts.', 'Group chat', 'espn', 'espn:mlb:401833245', 'NYY @ TB', '2026-03-17T17:05Z', 'Final', 'post', 'Tampa Bay Rays', 'New York Yankees', '2', '3', '2026-03-17T10:00:00.000Z', '2026-03-17T20:00:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0001', 'seed-bet-0001', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Yankees', 'accepted', 'confirmed', '2026-03-17T10:00:00.000Z', '2026-03-17T20:00:00.000Z'),
  ('seed-part-0002', 'seed-bet-0001', '00000000-0000-0000-0000-000000000003', 'Pat', '', 'Rays', 'accepted', 'confirmed', '2026-03-17T10:05:00.000Z', '2026-03-17T20:00:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0001', 'seed-bet-0001', 'seed-part-0001', 'Yankees', 'side', 'Yankees', 0, 0, 'won', 0, '2026-03-17T10:00:00.000Z'),
  ('seed-pick-0002', 'seed-bet-0001', 'seed-part-0002', 'Rays', 'side', 'Rays', 0, 0, 'lost', 1, '2026-03-17T10:05:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0001', 'seed-bet-0001', 'Winner', 1000, 0);

INSERT OR IGNORE INTO napkinbets_settlements (id, wager_id, participant_id, amount_cents, method, handle, confirmation_code, note, verification_status, verified_by_user_id, verified_at, recorded_at, proof_image_url)
VALUES ('seed-settle-0001', 'seed-bet-0001', 'seed-part-0001', 1000, 'Venmo', '@logan-v', 'VNM-8842', 'GG easy money', 'confirmed', '00000000-0000-0000-0000-000000000003', '2026-03-17T20:30:00.000Z', '2026-03-17T20:15:00.000Z', 'seed/venmo-1.png');


-- ▸ BET 2 — Finished & Unpaid (Astros 10, Pirates 2 — Pat picked HOU, won, hasn't been paid)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, event_state, home_team_name, away_team_name, home_score, away_score, created_at, updated_at)
VALUES (
  'seed-bet-0002', '00000000-0000-0000-0000-000000000003', 'astros-pirates-spring-1', 'Astros vs Pirates', 'One-on-one bet for HOU @ PIT spring training.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'baseball', 'mlb', 'pro', 'settled', 'Pat', '["Astros","Pirates"]', 2000, 'Venmo', '@pat-nb', 'Friendly bets only. Venmo settlement happens manually after the official result posts.', 'Group chat', 'espn', 'espn:mlb:401833243', 'HOU @ PIT', '2026-03-17T17:05Z', 'Final', 'post', 'Pittsburgh Pirates', 'Houston Astros', '2', '10', '2026-03-17T09:00:00.000Z', '2026-03-17T19:30:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0003', 'seed-bet-0002', '00000000-0000-0000-0000-000000000003', 'Pat', '', 'Astros', 'accepted', 'pending', '2026-03-17T09:00:00.000Z', '2026-03-17T19:30:00.000Z'),
  ('seed-part-0004', 'seed-bet-0002', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Pirates', 'accepted', 'pending', '2026-03-17T09:10:00.000Z', '2026-03-17T19:30:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0003', 'seed-bet-0002', 'seed-part-0003', 'Astros', 'side', 'Astros', 0, 0, 'won', 0, '2026-03-17T09:00:00.000Z'),
  ('seed-pick-0004', 'seed-bet-0002', 'seed-part-0004', 'Pirates', 'side', 'Pirates', 0, 0, 'lost', 1, '2026-03-17T09:10:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0002', 'seed-bet-0002', 'Winner', 2000, 0);

INSERT OR IGNORE INTO napkinbets_settlements (id, wager_id, participant_id, amount_cents, method, handle, confirmation_code, note, verification_status, recorded_at, proof_image_url)
VALUES ('seed-settle-0002', 'seed-bet-0002', 'seed-part-0004', 2000, 'Venmo', '@pat-nb', 'VNM-9999', 'Sent, check your venmo brother', 'submitted', '2026-03-17T19:45:00.000Z', 'seed/venmo-2.png');


-- ▸ BET 3 — Finished, Settlement Submitted but Pending Verification (Red Sox 4, Braves 3 — Logan picked BOS, won)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, event_state, home_team_name, away_team_name, home_score, away_score, created_at, updated_at)
VALUES (
  'seed-bet-0003', '00000000-0000-0000-0000-000000000004', 'redsox-braves-spring-1', 'Red Sox vs Braves', 'One-on-one bet for ATL @ BOS spring training.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'baseball', 'mlb', 'pro', 'settled', 'Logan', '["Red Sox","Braves"]', 500, 'Venmo', '@logan-v', 'Friendly bets only. Venmo settlement happens manually after the official result posts.', 'Watch party', 'espn', 'espn:mlb:401833234', 'ATL @ BOS', '2026-03-17T17:05Z', 'Final', 'post', 'Boston Red Sox', 'Atlanta Braves', '4', '3', '2026-03-17T11:00:00.000Z', '2026-03-17T19:45:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0005', 'seed-bet-0003', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Red Sox', 'accepted', 'pending', '2026-03-17T11:00:00.000Z', '2026-03-17T19:45:00.000Z'),
  ('seed-part-0006', 'seed-bet-0003', '00000000-0000-0000-0000-000000000003', 'Pat', '', 'Braves', 'accepted', 'pending', '2026-03-17T11:10:00.000Z', '2026-03-17T19:45:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0005', 'seed-bet-0003', 'seed-part-0005', 'Red Sox', 'side', 'Red Sox', 0, 0, 'won', 0, '2026-03-17T11:00:00.000Z'),
  ('seed-pick-0006', 'seed-bet-0003', 'seed-part-0006', 'Braves', 'side', 'Braves', 0, 0, 'lost', 1, '2026-03-17T11:10:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0003', 'seed-bet-0003', 'Winner', 500, 0);

-- Unsent (No settlement row inserted for Bet 3)


-- ▸ BET 4 — About to Start, Both Picked (Thunder @ Magic tonight — Pat picked OKC, Logan picked ORL)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, home_team_name, away_team_name, created_at, updated_at)
VALUES (
  'seed-bet-0004', '00000000-0000-0000-0000-000000000003', 'thunder-magic-tonight', 'Thunder vs Magic', 'One-on-one bet for OKC @ ORL.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'basketball', 'nba', 'pro', 'locked', 'Pat', '["Thunder","Magic"]', 1500, 'Venmo', '@pat-nb', 'Friendly bets only. Venmo settlement happens manually after the official result posts.', 'Group chat', 'espn', 'espn:nba:401810847', 'OKC @ ORL', '2026-03-17T23:00Z', 'Scheduled', 'Orlando Magic', 'Oklahoma City Thunder', '2026-03-17T15:00:00.000Z', '2026-03-17T15:30:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0007', 'seed-bet-0004', '00000000-0000-0000-0000-000000000003', 'Pat', '', 'Thunder', 'accepted', 'pending', '2026-03-17T15:00:00.000Z', '2026-03-17T15:00:00.000Z'),
  ('seed-part-0008', 'seed-bet-0004', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Magic', 'accepted', 'pending', '2026-03-17T15:20:00.000Z', '2026-03-17T15:20:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0007', 'seed-bet-0004', 'seed-part-0007', 'Thunder', 'side', 'Thunder', 0, 0, 'pending', 0, '2026-03-17T15:00:00.000Z'),
  ('seed-pick-0008', 'seed-bet-0004', 'seed-part-0008', 'Magic', 'side', 'Magic', 0, 0, 'pending', 1, '2026-03-17T15:20:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0004', 'seed-bet-0004', 'Winner', 1500, 0);


-- ▸ BET 5 — About to Start, Opponent Hasn't Joined Yet (Bruins @ Canadiens tonight — Logan created, Pat invited)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, home_team_name, away_team_name, created_at, updated_at)
VALUES (
  'seed-bet-0005', '00000000-0000-0000-0000-000000000004', 'bruins-canadiens-tonight', 'Bruins vs Canadiens', 'One-on-one bet for BOS @ MTL.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'hockey', 'nhl', 'pro', 'open', 'Logan', '["Bruins","Canadiens"]', 1000, 'Venmo', '@logan-v', 'Friendly bets only. Venmo settlement happens manually after the official result posts.', 'Sports bar', 'espn', 'espn:nhl:401803420', 'BOS @ MTL', '2026-03-17T23:00Z', 'Scheduled', 'Montreal Canadiens', 'Boston Bruins', '2026-03-17T16:00:00.000Z', '2026-03-17T16:00:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0009', 'seed-bet-0005', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Bruins', 'accepted', 'pending', '2026-03-17T16:00:00.000Z', '2026-03-17T16:00:00.000Z'),
  ('seed-part-0010', 'seed-bet-0005', '00000000-0000-0000-0000-000000000003', 'Pat', '', NULL, 'invited', 'pending', '2026-03-17T16:00:00.000Z', '2026-03-17T16:00:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0009', 'seed-bet-0005', 'seed-part-0009', 'Bruins', 'side', 'Bruins', 0, 0, 'pending', 0, '2026-03-17T16:00:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0005', 'seed-bet-0005', 'Winner', 1000, 0);


-- ▸ BET 6 — In Progress / Live (Austin Peay @ Ole Miss college baseball — Pat picked Ole Miss, Logan picked Austin Peay)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, event_state, home_team_name, away_team_name, home_score, away_score, created_at, updated_at)
VALUES (
  'seed-bet-0006', '00000000-0000-0000-0000-000000000003', 'ole-miss-austin-peay-live', 'Ole Miss vs Austin Peay', 'One-on-one bet for APSU @ MISS college baseball.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'baseball', 'college-baseball', 'college', 'locked', 'Pat', '["Ole Miss","Austin Peay"]', 500, 'Cash App', '$pat-cash', 'Friendly bets only. Cash App settlement happens manually after the official result posts.', 'Group chat', 'espn', 'espn:college-baseball:401847528', 'APSU @ MISS', '2026-03-17T21:00Z', 'In Progress', 'in', 'Ole Miss Rebels', 'Austin Peay Governors', '5', '2', '2026-03-17T14:00:00.000Z', '2026-03-17T16:00:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0011', 'seed-bet-0006', '00000000-0000-0000-0000-000000000003', 'Pat', '', 'Ole Miss', 'accepted', 'pending', '2026-03-17T14:00:00.000Z', '2026-03-17T14:00:00.000Z'),
  ('seed-part-0012', 'seed-bet-0006', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Austin Peay', 'accepted', 'pending', '2026-03-17T14:15:00.000Z', '2026-03-17T14:15:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0011', 'seed-bet-0006', 'seed-part-0011', 'Ole Miss', 'side', 'Ole Miss', 0, 0, 'pending', 0, '2026-03-17T14:00:00.000Z'),
  ('seed-pick-0012', 'seed-bet-0006', 'seed-part-0012', 'Austin Peay', 'side', 'Austin Peay', 0, 0, 'pending', 1, '2026-03-17T14:15:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0006', 'seed-bet-0006', 'Winner', 500, 0);


-- ▸ BET 7 — Finished, Settlement Rejected (Nationals 1, Cardinals 0 — Pat picked WSH, won, Logan's payment proof was rejected)
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, event_state, home_team_name, away_team_name, home_score, away_score, created_at, updated_at)
VALUES (
  'seed-bet-0007', '00000000-0000-0000-0000-000000000004', 'nationals-cardinals-spring-1', 'Nationals vs Cardinals', 'One-on-one bet for STL @ WSH spring training.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'baseball', 'mlb', 'pro', 'settled', 'Logan', '["Nationals","Cardinals"]', 1500, 'Zelle', 'logan@email.com', 'Friendly bets only. Zelle settlement happens manually after the official result posts.', 'Group chat', 'espn', 'espn:mlb:401833246', 'STL @ WSH', '2026-03-17T17:05Z', 'Final', 'post', 'Washington Nationals', 'St. Louis Cardinals', '1', '0', '2026-03-17T10:30:00.000Z', '2026-03-17T19:30:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0013', 'seed-bet-0007', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Cardinals', 'accepted', 'pending', '2026-03-17T10:30:00.000Z', '2026-03-17T19:30:00.000Z'),
  ('seed-part-0014', 'seed-bet-0007', '00000000-0000-0000-0000-000000000003', 'Pat', '', 'Nationals', 'accepted', 'pending', '2026-03-17T10:45:00.000Z', '2026-03-17T19:30:00.000Z');

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0013', 'seed-bet-0007', 'seed-part-0013', 'Cardinals', 'side', 'Cardinals', 0, 0, 'lost', 0, '2026-03-17T10:30:00.000Z'),
  ('seed-pick-0014', 'seed-bet-0007', 'seed-part-0014', 'Nationals', 'side', 'Nationals', 0, 0, 'won', 1, '2026-03-17T10:45:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0007', 'seed-bet-0007', 'Winner', 1500, 0);

INSERT OR IGNORE INTO napkinbets_settlements (id, wager_id, participant_id, amount_cents, method, handle, confirmation_code, note, verification_status, rejected_by_user_id, rejected_at, rejection_note, recorded_at, proof_image_url)
VALUES ('seed-settle-0007', 'seed-bet-0007', 'seed-part-0014', 1500, 'Zelle', 'logan@email.com', 'ZEL-3301', 'Sent via Zelle', 'rejected', '00000000-0000-0000-0000-000000000003', '2026-03-17T20:00:00.000Z', 'Wrong amount — sent $10 instead of $15. Please resend the correct amount.', '2026-03-17T19:40:00.000Z', 'seed/venmo-rejected.png');


-- ▸ BET 8 — Invitation Declined (Hurricanes @ Blue Jackets — Logan created, Pat declined, wager back to open)
-- Note: when a participant declines, their row is deleted. Only Logan remains.
INSERT OR IGNORE INTO napkinbets_wagers (id, owner_user_id, slug, title, description, napkin_type, board_type, category, format, sport, league, context_key, status, creator_name, side_options_json, entry_fee_cents, payment_service, payment_handle, terms, venue_name, event_source, event_id, event_title, event_starts_at, event_status, home_team_name, away_team_name, created_at, updated_at)
VALUES (
  'seed-bet-0008', '00000000-0000-0000-0000-000000000004', 'hurricanes-bluejackets-tonight', 'Hurricanes vs Blue Jackets', 'One-on-one bet for CAR @ CBJ.', 'simple-bet', 'event-backed', 'sports', 'head-to-head', 'hockey', 'nhl', 'pro', 'open', 'Logan', '["Hurricanes","Blue Jackets"]', 2000, 'Venmo', '@logan-v', 'Friendly bets only. Venmo settlement happens manually after the official result posts.', 'Group chat', 'espn', 'espn:nhl:401803421', 'CAR @ CBJ', '2026-03-17T23:00Z', 'Scheduled', 'Columbus Blue Jackets', 'Carolina Hurricanes', '2026-03-17T14:30:00.000Z', '2026-03-17T15:00:00.000Z'
);

INSERT OR IGNORE INTO napkinbets_participants (id, wager_id, user_id, display_name, avatar_url, side_label, join_status, payment_status, created_at, updated_at)
VALUES
  ('seed-part-0015', 'seed-bet-0008', '00000000-0000-0000-0000-000000000004', 'Logan', '', 'Hurricanes', 'accepted', 'pending', '2026-03-17T14:30:00.000Z', '2026-03-17T14:30:00.000Z');
-- Pat's participant row was deleted when they declined

INSERT OR IGNORE INTO napkinbets_picks (id, wager_id, participant_id, pick_label, pick_type, pick_value, confidence, live_score, outcome, sort_order, created_at)
VALUES
  ('seed-pick-0015', 'seed-bet-0008', 'seed-part-0015', 'Hurricanes', 'side', 'Hurricanes', 0, 0, 'pending', 0, '2026-03-17T14:30:00.000Z');

INSERT OR IGNORE INTO napkinbets_pots (id, wager_id, label, amount_cents, sort_order)
VALUES ('seed-pot-0008', 'seed-bet-0008', 'Winner', 2000, 0);
