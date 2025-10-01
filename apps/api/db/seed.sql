-- PoPC SaaS Database Seed Data
-- Run this after schema.sql to populate initial data

-- =============================================================================
-- POLICIES
-- =============================================================================

-- Insert default policy
INSERT INTO policies (name, json, description, is_active)
VALUES (
    'default',
    '{
        "require_signature": true,
        "require_hardware_attestation": true,
        "require_transparency_entry": true,
        "max_clock_skew_seconds": 300,
        "allowed_attestation_types": [
            "android_key_attestation",
            "apple_devicecheck",
            "apple_app_attest",
            "webauthn",
            "tpm"
        ],
        "min_security_level": "trusted_execution_environment",
        "allow_software_keys": false,
        "require_verified_boot": false,
        "max_certificate_age_days": 365
    }'::jsonb,
    'Default verification policy - requires hardware attestation and signature',
    true
) ON CONFLICT (name) DO UPDATE
SET
    json = EXCLUDED.json,
    description = EXCLUDED.description,
    updated_at = now();

-- Insert strict policy
INSERT INTO policies (name, json, description, is_active)
VALUES (
    'strict',
    '{
        "require_signature": true,
        "require_hardware_attestation": true,
        "require_transparency_entry": true,
        "max_clock_skew_seconds": 60,
        "allowed_attestation_types": [
            "android_key_attestation",
            "apple_app_attest"
        ],
        "min_security_level": "strongbox",
        "allow_software_keys": false,
        "require_verified_boot": true,
        "max_certificate_age_days": 180,
        "require_device_metadata": true,
        "block_rooted_devices": true
    }'::jsonb,
    'Strict policy - StrongBox/Secure Enclave only, verified boot required',
    true
) ON CONFLICT (name) DO UPDATE
SET
    json = EXCLUDED.json,
    description = EXCLUDED.description,
    updated_at = now();

-- Insert permissive policy (for testing/development)
INSERT INTO policies (name, json, description, is_active)
VALUES (
    'permissive',
    '{
        "require_signature": true,
        "require_hardware_attestation": false,
        "require_transparency_entry": false,
        "max_clock_skew_seconds": 3600,
        "allowed_attestation_types": [
            "android_key_attestation",
            "apple_devicecheck",
            "apple_app_attest",
            "webauthn",
            "tpm"
        ],
        "min_security_level": "software",
        "allow_software_keys": true,
        "require_verified_boot": false,
        "max_certificate_age_days": 730
    }'::jsonb,
    'Permissive policy - allows software keys, suitable for development/testing',
    true
) ON CONFLICT (name) DO UPDATE
SET
    json = EXCLUDED.json,
    description = EXCLUDED.description,
    updated_at = now();

-- Insert legal/court-admissible policy
INSERT INTO policies (name, json, description, is_active)
VALUES (
    'legal_admissible',
    '{
        "require_signature": true,
        "require_hardware_attestation": true,
        "require_transparency_entry": true,
        "max_clock_skew_seconds": 300,
        "allowed_attestation_types": [
            "android_key_attestation",
            "apple_app_attest"
        ],
        "min_security_level": "strongbox",
        "allow_software_keys": false,
        "require_verified_boot": true,
        "max_certificate_age_days": 365,
        "require_device_metadata": true,
        "require_timestamp_token": true,
        "require_evidence_package": true,
        "require_chain_of_custody": true,
        "block_rooted_devices": true
    }'::jsonb,
    'Legal/court-admissible policy - strictest requirements for legal evidence',
    true
) ON CONFLICT (name) DO UPDATE
SET
    json = EXCLUDED.json,
    description = EXCLUDED.description,
    updated_at = now();

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count FROM policies;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PoPC Database Seed Data Applied';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies inserted/updated:';
    RAISE NOTICE '  - default: Standard verification with hardware attestation';
    RAISE NOTICE '  - strict: StrongBox/Secure Enclave only, verified boot';
    RAISE NOTICE '  - permissive: Allows software keys (dev/test)';
    RAISE NOTICE '  - legal_admissible: Court-admissible evidence requirements';
    RAISE NOTICE '';
    RAISE NOTICE 'Total policies in database: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Schema is ready for use!';
    RAISE NOTICE '';
END $$;

-- Display policies
SELECT
    name,
    description,
    is_active,
    created_at
FROM policies
ORDER BY name;
