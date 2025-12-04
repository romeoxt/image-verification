-- Migration: Add API keys tables
-- Created: 2025-12-04
-- Description: Adds api_keys and api_key_usage tables for authentication and rate limiting

-- =============================================================================
-- TABLE: api_keys
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT ARRAY['verify:read'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count BIGINT NOT NULL DEFAULT 0,
    
    -- Metadata
    created_by TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT api_keys_name_not_empty_check
        CHECK (length(trim(name)) > 0),
    CONSTRAINT api_keys_key_prefix_format_check
        CHECK (key_prefix ~ '^pk_[a-zA-Z0-9]{8}$'),
    CONSTRAINT api_keys_rate_limit_check
        CHECK (rate_limit_per_minute > 0 AND rate_limit_per_day > 0),
    CONSTRAINT api_keys_expires_after_created_check
        CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for api_keys table
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_key_prefix_idx ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS api_keys_is_active_idx ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS api_keys_created_at_idx ON api_keys(created_at DESC);
CREATE INDEX IF NOT EXISTS api_keys_expires_at_idx ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE api_keys IS 'API keys for authentication and rate limiting';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the full API key';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 chars of key (e.g. pk_abc12345) for display';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes (e.g. verify:read, verify:write, admin)';

-- =============================================================================
-- TABLE: api_key_usage
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_key_usage (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT api_key_usage_method_check
        CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    CONSTRAINT api_key_usage_status_code_check
        CHECK (status_code >= 100 AND status_code < 600)
);

-- Indexes for api_key_usage table
CREATE INDEX IF NOT EXISTS api_key_usage_api_key_id_idx ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS api_key_usage_created_at_idx ON api_key_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS api_key_usage_endpoint_idx ON api_key_usage(endpoint);

COMMENT ON TABLE api_key_usage IS 'API key usage logs for rate limiting and analytics';

-- =============================================================================
-- Add api_key_id foreign key to verifications table if not exists
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'verifications_api_key_id_fkey'
        AND table_name = 'verifications'
    ) THEN
        ALTER TABLE verifications 
        ADD CONSTRAINT verifications_api_key_id_fkey 
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;
    END IF;
END$$;

-- Create index on verifications.api_key_id
CREATE INDEX IF NOT EXISTS verifications_api_key_id_idx ON verifications(api_key_id);

-- =============================================================================
-- Create a default API key for development
-- =============================================================================

-- Note: This is a development key only. In production, generate keys properly.
-- Key: pk_dev_test1234567890abcdefghijklmnop (hash below)
-- Only insert if table is empty

INSERT INTO api_keys (
    key_hash,
    key_prefix,
    name,
    description,
    scopes,
    is_active,
    rate_limit_per_minute,
    rate_limit_per_day,
    created_by,
    metadata
)
SELECT
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- Hash of empty string (dev key)
    'pk_dev_t',
    'Development Test Key',
    'Default API key for local development and testing',
    ARRAY['verify:read', 'verify:write', 'device:read', 'device:write'],
    true,
    1000,
    100000,
    'system',
    '{"environment": "development", "auto_generated": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM api_keys LIMIT 1);

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_add_api_keys completed successfully';
    RAISE NOTICE 'API keys table created with % keys', (SELECT COUNT(*) FROM api_keys);
END$$;

