-- ============================================================
-- TipTop.report — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  bio             TEXT,
  avatar_url      TEXT,
  trade_category  TEXT NOT NULL,
  overall_rating  NUMERIC(3, 2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  is_public       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT workers_auth_user_unique UNIQUE (auth_user_id)
);

-- QR Tokens
CREATE TABLE IF NOT EXISTS qr_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'My QR Code',
  scan_count  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id             UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  qr_token_id           UUID NOT NULL REFERENCES qr_tokens(id),
  employer_id           UUID,
  rating                INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment               TEXT,
  reviewer_name         TEXT,
  reviewer_fingerprint  TEXT NOT NULL,
  is_verified           BOOLEAN DEFAULT TRUE,
  is_flagged            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Badges (definitions)
CREATE TABLE IF NOT EXISTS badges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  tier            TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  category        TEXT NOT NULL CHECK (category IN ('volume', 'rating', 'streak', 'specialty', 'course')),
  criteria_json   JSONB NOT NULL DEFAULT '{}',
  icon_url        TEXT,
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Worker badge awards
CREATE TABLE IF NOT EXISTS worker_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at  TIMESTAMPTZ DEFAULT NOW(),
  awarded_by  TEXT NOT NULL DEFAULT 'system' CHECK (awarded_by IN ('system', 'employer', 'admin')),
  UNIQUE(worker_id, badge_id)
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  industry      TEXT,
  logo_url      TEXT,
  website       TEXT,
  is_certified  BOOLEAN DEFAULT FALSE,
  plan_tier     TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workers_slug ON workers(slug);
CREATE INDEX IF NOT EXISTS idx_workers_auth_user ON workers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_worker ON qr_tokens(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker ON reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_qr_token ON reviews(qr_token_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_worker_badges_worker ON worker_badges(worker_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;

-- Workers policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON workers FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Workers can view their own profile regardless of visibility"
  ON workers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Workers can update their own profile"
  ON workers FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Authenticated users can create their own worker profile"
  ON workers FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- QR Token policies
CREATE POLICY "QR tokens are publicly readable by id"
  ON qr_tokens FOR SELECT
  USING (TRUE);

CREATE POLICY "Workers can manage their own QR tokens"
  ON qr_tokens FOR ALL
  USING (
    worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  );

-- Review policies
CREATE POLICY "Reviews on public workers are viewable"
  ON reviews FOR SELECT
  USING (
    worker_id IN (SELECT id FROM workers WHERE is_public = TRUE)
  );

CREATE POLICY "Workers can see all their own reviews"
  ON reviews FOR SELECT
  USING (
    worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Anyone can submit a review (via valid token)"
  ON reviews FOR INSERT
  WITH CHECK (TRUE);

-- NOTE: No UPDATE or DELETE policies on reviews — they are immutable

-- Badge policies
CREATE POLICY "Badges are publicly readable"
  ON badges FOR SELECT
  USING (TRUE);

-- Worker badge policies
CREATE POLICY "Worker badges are publicly readable"
  ON worker_badges FOR SELECT
  USING (TRUE);

-- Company policies
CREATE POLICY "Public company profiles are viewable"
  ON companies FOR SELECT
  USING (TRUE);

CREATE POLICY "Companies can manage their own profile"
  ON companies FOR ALL
  USING (auth.uid() = auth_user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update worker rating after review insert
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workers
  SET
    overall_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE worker_id = NEW.worker_id
        AND is_flagged = FALSE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE worker_id = NEW.worker_id
        AND is_flagged = FALSE
    ),
    updated_at = NOW()
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_worker_rating
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_rating();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SEED: Badge Definitions
-- ============================================================

INSERT INTO badges (name, tier, category, criteria_json, description) VALUES

-- Volume badges
('First Review',     'bronze',   'volume',  '{"type":"review_count","threshold":1}',    'Received your very first customer review'),
('10 Reviews',       'bronze',   'volume',  '{"type":"review_count","threshold":10}',   'Collected 10 verified reviews'),
('50 Reviews',       'silver',   'volume',  '{"type":"review_count","threshold":50}',   'Built a solid portfolio with 50 reviews'),
('100 Reviews',      'gold',     'volume',  '{"type":"review_count","threshold":100}',  'Reached 100 verified reviews — a true pro'),
('500 Reviews',      'platinum', 'volume',  '{"type":"review_count","threshold":500}',  'An elite professional with 500+ reviews'),

-- Rating badges
('Rising Star',      'bronze',   'rating',  '{"type":"rating_threshold","threshold":4.5,"min_reviews":5}',   '4.5+ stars with at least 5 reviews'),
('Top Rated',        'silver',   'rating',  '{"type":"rating_threshold","threshold":4.7,"min_reviews":20}',  '4.7+ stars with at least 20 reviews'),
('Elite Pro',        'gold',     'rating',  '{"type":"rating_threshold","threshold":4.9,"min_reviews":50}',  '4.9+ stars with at least 50 reviews'),

-- Streak badges
('Consistent Pro',   'silver',   'streak',  '{"type":"streak","threshold":30,"consecutive":false}',  'No rating below 4.0 in last 30 reviews'),
('5-Star Streak',    'gold',     'streak',  '{"type":"streak","threshold":10,"consecutive":true}',   '10 consecutive 5-star reviews'),

-- Specialty
('TipTop Certified', 'platinum', 'specialty', '{"type":"manual"}', 'Verified and certified by the TipTop team')

ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
-- Run: SELECT * FROM badges; to verify seed data loaded correctly
