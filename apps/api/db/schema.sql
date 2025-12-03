-- PoPC SaaS Database Schema
-- PostgreSQL 14+
--
-- This schema supports device enrollment, verification tracking,
-- transparency logging, and policy management for the Proof of
-- Physical Capture verification API.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: devices
-- =============================================================================
-- Stores enrolled devices with their public keys and attestation information.
-- Each device must have a unique public key and can be revoked if compromised.

CREATE TABLE devices (
    id TEXT PRIMARY KEY, -- Changed from UUID to match code expecting device_id
    public_key TEXT NOT NULL UNIQUE,
    attestation_type TEXT NOT NULL,
    security_level TEXT,
    cert_expiry TIMESTAMPTZ,
    device_metadata JSONB,
    status TEXT DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,

    -- Device metadata (optional)
    platform TEXT,
    manufacturer TEXT,
    model TEXT,
    os_version TEXT,

    -- Public key fingerprint for quick lookups
    public_key_fingerprint TEXT NOT NULL UNIQUE,

    -- Constraints
    CONSTRAINT devices_attestation_type_check
        CHECK (attestation_type IN (
            'android_key_attestation',
            'apple_devicecheck',
            'apple_app_attest',
            'webauthn',
            'software_key',
            'tpm'
        )),
    CONSTRAINT devices_platform_check
        CHECK (platform IS NULL OR platform IN ('android', 'ios', 'web')),
    CONSTRAINT devices_revoked_after_enrolled_check
        CHECK (revoked_at IS NULL OR revoked_at >= enrolled_at)
);

-- Indexes for devices table
CREATE INDEX devices_public_key_fingerprint_idx ON devices(public_key_fingerprint);
CREATE INDEX devices_enrolled_at_idx ON devices(enrolled_at DESC);
CREATE INDEX devices_revoked_at_idx ON devices(revoked_at) WHERE revoked_at IS NOT NULL;

COMMENT ON TABLE devices IS 'Enrolled devices with hardware attestation';
COMMENT ON COLUMN devices.id IS 'Device ID (e.g. dev_android_...)';
COMMENT ON COLUMN devices.public_key IS 'Base64-encoded DER SubjectPublicKeyInfo';
COMMENT ON COLUMN devices.public_key_fingerprint IS 'SHA-256 fingerprint of public key (hex)';
COMMENT ON COLUMN devices.revoked_at IS 'Timestamp when device was revoked (NULL = active)';

-- =============================================================================
-- TABLE: device_certs
-- =============================================================================
-- Stores certificate chains for enrolled devices. Each device may have multiple
-- certificates in its attestation chain.

CREATE TABLE device_certs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    cert_pem TEXT NOT NULL,
    issuer TEXT NOT NULL,
    subject TEXT,
    not_before TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid',
    fingerprint TEXT NOT NULL,
    is_leaf BOOLEAN NOT NULL DEFAULT false,
    chain_position INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT device_certs_status_check
        CHECK (status IN ('valid', 'expired', 'revoked', 'invalid')),
    CONSTRAINT device_certs_validity_check
        CHECK (not_after > not_before),
    CONSTRAINT device_certs_unique_position UNIQUE (device_id, chain_position)
);

-- Indexes for device_certs table
CREATE INDEX device_certs_device_id_idx ON device_certs(device_id);
CREATE INDEX device_certs_fingerprint_idx ON device_certs(fingerprint);
CREATE INDEX device_certs_not_after_idx ON device_certs(not_after);

COMMENT ON TABLE device_certs IS 'Certificate chains for device attestation';
COMMENT ON COLUMN device_certs.fingerprint IS 'SHA-256 fingerprint of certificate (hex)';
COMMENT ON COLUMN device_certs.is_leaf IS 'True if this is the leaf certificate in the chain';
COMMENT ON COLUMN device_certs.chain_position IS 'Position in chain: 0=leaf, 1=intermediate, etc.';

-- =============================================================================
-- TABLE: policies
-- =============================================================================
-- Stores verification policies that define security requirements.
-- Policies are referenced by name and contain JSON configuration.

CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    json JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT policies_name_format_check
        CHECK (name ~ '^[a-z0-9_-]+$'),
    CONSTRAINT policies_json_not_empty_check
        CHECK (jsonb_typeof(json) = 'object')
);

-- Indexes for policies table
CREATE INDEX policies_name_idx ON policies(name);
CREATE INDEX policies_is_active_idx ON policies(is_active) WHERE is_active = true;

COMMENT ON TABLE policies IS 'Verification policies with JSON configuration';
COMMENT ON COLUMN policies.json IS 'Policy configuration: require_signature, require_hardware_attestation, max_clock_skew_seconds, etc.';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policies_updated_at_trigger
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: verifications
-- =============================================================================
-- Records all verification attempts with their results.
-- Links to the device that captured the media (if verified).

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_sha256 TEXT NOT NULL,
    verdict TEXT NOT NULL,
    reasons_json JSONB NOT NULL,
    device_id TEXT REFERENCES devices(id),
    policy_id UUID REFERENCES policies(id),

    -- Additional verification metadata
    asset_size_bytes BIGINT,
    asset_mime_type TEXT,
    manifest_sha256 TEXT,
    signature_algorithm TEXT,

    -- Transparency log reference
    transparency_log_id BIGINT,

    -- Timestamp information
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Request metadata
    api_key_id UUID,
    request_id TEXT,

    -- Constraints
    CONSTRAINT verifications_asset_sha256_format_check
        CHECK (asset_sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT verifications_manifest_sha256_format_check
        CHECK (manifest_sha256 IS NULL OR manifest_sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT verifications_verdict_check
        CHECK (verdict IN ('verified', 'tampered', 'unsigned', 'invalid', 'revoked')),
    CONSTRAINT verifications_reasons_not_empty_check
        CHECK (jsonb_array_length(reasons_json) > 0),
    CONSTRAINT verifications_device_required_for_verified_check
        CHECK (verdict != 'verified' OR device_id IS NOT NULL)
);

-- Indexes for verifications table
CREATE INDEX verifications_asset_idx ON verifications(asset_sha256);
CREATE INDEX verifications_device_idx ON verifications(device_id);
CREATE INDEX verifications_verdict_idx ON verifications(verdict);
CREATE INDEX verifications_created_at_idx ON verifications(created_at DESC);
CREATE INDEX verifications_policy_id_idx ON verifications(policy_id);
CREATE INDEX verifications_captured_at_idx ON verifications(captured_at) WHERE captured_at IS NOT NULL;

COMMENT ON TABLE verifications IS 'Verification attempt records';
COMMENT ON COLUMN verifications.asset_sha256 IS 'SHA-256 hash of the verified asset (hex)';
COMMENT ON COLUMN verifications.reasons_json IS 'Array of reason strings explaining the verdict';
COMMENT ON COLUMN verifications.device_id IS 'Device that captured the media (NULL for unsigned/tampered)';
COMMENT ON COLUMN verifications.captured_at IS 'Timestamp from C2PA manifest (claimed capture time)';
COMMENT ON COLUMN verifications.created_at IS 'Timestamp when verification was performed';

-- =============================================================================
-- TABLE: transparency_log
-- =============================================================================
-- Append-only transparency log for audit trail.
-- Records all verified captures with Merkle tree leaf data.

CREATE TABLE transparency_log (
    id BIGSERIAL PRIMARY KEY,
    asset_sha256 TEXT NOT NULL,
    device_cert_fingerprint TEXT NOT NULL,
    merkle_leaf TEXT NOT NULL,
    merkle_root TEXT,
    tree_size BIGINT,
    leaf_index BIGINT,

    -- Reference to verification
    verification_id UUID REFERENCES verifications(id),

    -- Timestamp
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT transparency_log_asset_sha256_format_check
        CHECK (asset_sha256 ~ '^[a-f0-9]{64}$'),
    CONSTRAINT transparency_log_device_cert_fingerprint_format_check
        CHECK (device_cert_fingerprint ~ '^[a-f0-9]{64}$'),
    CONSTRAINT transparency_log_merkle_leaf_format_check
        CHECK (merkle_leaf ~ '^[a-f0-9]{64}$'),
    CONSTRAINT transparency_log_merkle_root_format_check
        CHECK (merkle_root IS NULL OR merkle_root ~ '^[a-f0-9]{64}$')
);

-- Indexes for transparency_log table
CREATE INDEX transparency_asset_idx ON transparency_log(asset_sha256);
CREATE INDEX transparency_log_device_cert_idx ON transparency_log(device_cert_fingerprint);
CREATE INDEX transparency_log_inserted_at_idx ON transparency_log(inserted_at DESC);
CREATE INDEX transparency_log_verification_id_idx ON transparency_log(verification_id);

-- Unique constraint: prevent duplicate entries for same asset + device cert
CREATE UNIQUE INDEX transparency_log_unique_entry_idx
    ON transparency_log(asset_sha256, device_cert_fingerprint);

COMMENT ON TABLE transparency_log IS 'Append-only transparency log with Merkle tree';
COMMENT ON COLUMN transparency_log.merkle_leaf IS 'SHA-256 hash for this leaf (hex)';
COMMENT ON COLUMN transparency_log.merkle_root IS 'Merkle root at time of insertion (hex)';
COMMENT ON COLUMN transparency_log.leaf_index IS 'Index of this entry in the Merkle tree';

-- =============================================================================
-- TABLE: revocations
-- =============================================================================
-- Records device revocations with reasons.
-- When a device is revoked, its revoked_at timestamp is also updated.

CREATE TABLE revocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    revoked_by TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT revocations_reason_not_empty_check
        CHECK (length(trim(reason)) > 0)
);

-- Indexes for revocations table
CREATE INDEX revocations_device_id_idx ON revocations(device_id);
CREATE INDEX revocations_created_at_idx ON revocations(created_at DESC);

COMMENT ON TABLE revocations IS 'Device revocation records';
COMMENT ON COLUMN revocations.reason IS 'Human-readable reason for revocation';
COMMENT ON COLUMN revocations.revoked_by IS 'User/system that performed the revocation';
COMMENT ON COLUMN revocations.metadata IS 'Additional revocation metadata (optional)';

-- Trigger to automatically set devices.revoked_at when revocation is created
CREATE OR REPLACE FUNCTION set_device_revoked_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE devices
    SET revoked_at = NEW.created_at
    WHERE id = NEW.device_id AND revoked_at IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revocations_set_device_revoked_at_trigger
    AFTER INSERT ON revocations
    FOR EACH ROW
    EXECUTE FUNCTION set_device_revoked_at();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: Active devices (not revoked)
CREATE VIEW active_devices AS
SELECT
    d.*,
    COUNT(DISTINCT v.id) as verification_count,
    MAX(v.created_at) as last_verification_at
FROM devices d
LEFT JOIN verifications v ON v.device_id = d.id
WHERE d.revoked_at IS NULL
GROUP BY d.id;

COMMENT ON VIEW active_devices IS 'Active (non-revoked) devices with verification stats';

-- View: Recent verifications with device info
CREATE VIEW recent_verifications AS
SELECT
    v.id,
    v.asset_sha256,
    v.verdict,
    v.created_at,
    v.captured_at,
    d.id as device_id,
    d.platform,
    d.manufacturer,
    d.model,
    p.name as policy_name
FROM verifications v
LEFT JOIN devices d ON v.device_id = d.id
LEFT JOIN policies p ON v.policy_id = p.id
ORDER BY v.created_at DESC;

COMMENT ON VIEW recent_verifications IS 'Recent verifications with joined device and policy info';

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Get inclusion proof for transparency log entry
CREATE OR REPLACE FUNCTION get_transparency_inclusion_proof(
    p_asset_sha256 TEXT,
    p_device_cert_fingerprint TEXT
)
RETURNS TABLE (
    log_id BIGINT,
    merkle_leaf TEXT,
    merkle_root TEXT,
    tree_size BIGINT,
    leaf_index BIGINT,
    inserted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tl.id,
        tl.merkle_leaf,
        tl.merkle_root,
        tl.tree_size,
        tl.leaf_index,
        tl.inserted_at
    FROM transparency_log tl
    WHERE tl.asset_sha256 = p_asset_sha256
      AND tl.device_cert_fingerprint = p_device_cert_fingerprint
    ORDER BY tl.inserted_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_transparency_inclusion_proof IS 'Get transparency log inclusion proof for an asset';

-- Function: Check if device is active (not revoked)
CREATE OR REPLACE FUNCTION is_device_active(p_device_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_revoked_at TIMESTAMPTZ;
BEGIN
    SELECT revoked_at INTO v_revoked_at
    FROM devices
    WHERE id = p_device_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    RETURN v_revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_device_active IS 'Check if a device is active (not revoked)';

-- =============================================================================
-- GRANTS (adjust based on your application user)
-- =============================================================================

-- Example grants for application user 'popc_api'
-- Uncomment and adjust if needed:
--
-- GRANT SELECT, INSERT, UPDATE ON devices TO popc_api;
-- GRANT SELECT, INSERT, UPDATE ON device_certs TO popc_api;
-- GRANT SELECT ON policies TO popc_api;
-- GRANT SELECT, INSERT ON verifications TO popc_api;
-- GRANT SELECT, INSERT ON transparency_log TO popc_api;
-- GRANT SELECT, INSERT ON revocations TO popc_api;
-- GRANT SELECT ON active_devices TO popc_api;
-- GRANT SELECT ON recent_verifications TO popc_api;
-- GRANT USAGE ON SEQUENCE transparency_log_id_seq TO popc_api;

-- =============================================================================
-- INITIAL SETUP COMPLETE
-- =============================================================================

-- Verify schema
DO $$
BEGIN
    RAISE NOTICE 'PoPC Database Schema installed successfully';
    RAISE NOTICE 'Tables created: devices, device_certs, policies, verifications, transparency_log, revocations';
    RAISE NOTICE 'Views created: active_devices, recent_verifications';
    RAISE NOTICE 'Functions created: get_transparency_inclusion_proof, is_device_active';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Apply seed data with seed.sql';
END $$;
