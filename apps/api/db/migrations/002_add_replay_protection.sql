-- Migration: Add Replay Protection (Sequence Numbers)
-- Purpose: Track photo sequence numbers to prevent replay attacks

-- Add photo_sequence column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS photo_sequence BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN devices.photo_sequence IS 'Counter for photos taken by this device (prevents replay attacks)';

-- Add sequence_number column to verifications table
ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS sequence_number BIGINT;

COMMENT ON COLUMN verifications.sequence_number IS 'Sequence number of photo from device (for replay protection)';

-- Create index for faster sequence lookups
CREATE INDEX IF NOT EXISTS verifications_device_sequence_idx 
ON verifications(device_id, sequence_number DESC);

-- Add constraint to ensure sequence numbers are unique per device
-- First drop if exists, then add (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$ 
BEGIN
    ALTER TABLE verifications
    ADD CONSTRAINT verifications_device_sequence_unique 
    UNIQUE (device_id, sequence_number);
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

