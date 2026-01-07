-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Stores dashboard users for authentication and authorization.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'viewer'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT users_email_format_check
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'user', 'viewer'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed initial admin user if not exists (password: admin123)
-- Hash is bcrypt for 'admin123'
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@popc.dev',
    '$2a$10$X7X.7.X7X.7.X7X.7.X7X.7.X7X.7.X7X.7.X7X.7.X7X.7.X7X', -- Placeholder, need real hash
    'Admin User',
    'admin'
) ON CONFLICT (email) DO NOTHING;

