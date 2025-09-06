-- ==============================================
-- PRICING RANGE OVERLAP PREVENTION
-- ==============================================
-- 
-- This migration implements PostgreSQL range types and exclusion constraints
-- to prevent overlapping price periods for the same business key.
--
-- Interval convention: [valid_from, valid_to) - inclusive start, exclusive end
-- Timezone: All timestamps normalized to UTC
-- Precision: Truncated to seconds for consistency
--
-- Business key: (application_id, user_type_id, billing_cycle, currency)
-- ==============================================

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create exclusion constraint to prevent overlapping periods
-- Uses GiST index with tstzrange for timestamp with time zone ranges
ALTER TABLE application_pricing
ADD CONSTRAINT application_pricing_no_overlap
EXCLUDE USING gist (
  application_id WITH =,
  user_type_id   WITH =,
  billing_cycle  WITH =,
  currency       WITH =,
  tstzrange(valid_from, valid_to, '[)') WITH &&
);

-- Add index for efficient overlap queries (fallback checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_pricing_overlap_check
ON application_pricing USING gist (
  application_id,
  user_type_id,
  billing_cycle,
  currency,
  tstzrange(valid_from, valid_to, '[)')
);

-- Comments for documentation
COMMENT ON CONSTRAINT application_pricing_no_overlap ON application_pricing IS
  'Prevents overlapping price periods for same application+usertype+cycle+currency using tsrange [valid_from, valid_to)';

-- Verification query to check existing data for overlaps
-- Run this before enabling constraint on existing data:
--
-- SELECT 
--   a1.id as id1, a2.id as id2,
--   a1.application_id, a1.user_type_id, a1.billing_cycle, a1.currency,
--   a1.valid_range, a2.valid_range
-- FROM application_pricing a1
-- JOIN application_pricing a2 ON (
--   a1.application_id = a2.application_id AND
--   a1.user_type_id = a2.user_type_id AND
--   a1.billing_cycle = a2.billing_cycle AND
--   a1.currency = a2.currency AND
--   a1.id < a2.id AND
--   a1.valid_range && a2.valid_range
-- )
-- ORDER BY a1.application_id, a1.user_type_id, a1.valid_from;