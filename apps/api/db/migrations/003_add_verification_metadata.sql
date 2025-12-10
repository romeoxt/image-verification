-- Migration: Add Metadata column to Verifications
-- Purpose: Store full C2PA assertions (sensors, location) for AI training

ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN verifications.metadata IS 'Full C2PA assertions/metadata including sensors and location for AI training';

