-- Migration: Create core tables for Simplia PaaS
-- Description: Creates all core tables with proper relationships, audit fields, and structure
-- Replaces and consolidates: 000_create_users_table.sql + 001_create_licensing_tables.sql + 003_structural_fixes_v2.sql + 004_platform_role.sql

-- =============================================
-- CORE TABLES
-- =============================================

-- Tenants table (multi-tenancy support)
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  schema_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenants IS 'Multi-tenant support - each tenant has isolated schema and data';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain identifier for tenant (used in URLs and headers)';
COMMENT ON COLUMN tenants.schema_name IS 'PostgreSQL schema name for tenant isolation';

-- User types table (operations < manager < admin hierarchy)
CREATE TABLE IF NOT EXISTS user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0, -- 0=operations, 1=manager, 2=admin
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_types IS 'User type hierarchy for pricing and permissions';
COMMENT ON COLUMN user_types.hierarchy_level IS '0=operations, 1=manager, 2=admin - higher levels inherit lower permissions';

-- Applications table (products/modules available)
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_per_user DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, deprecated
    version VARCHAR(20) DEFAULT '1.0.0',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE applications IS 'Product catalog - applications available for licensing';
COMMENT ON COLUMN applications.slug IS 'Short identifier used in API routes and JWT tokens';

-- Users table (cross-tenant authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    tenant_id VARCHAR(100) NOT NULL, -- References tenants.subdomain
    role VARCHAR(50) DEFAULT 'operations', -- operations, manager, admin
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    user_type_id INTEGER REFERENCES user_types(id),
    platform_role VARCHAR(50) NULL, -- internal_admin for Simplia team
    last_login TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Users table stored in public schema for cross-tenant authentication';
COMMENT ON COLUMN users.tenant_id IS 'References tenants.subdomain (not FK to avoid circular dependency)';
COMMENT ON COLUMN users.role IS 'Tenant-level role: operations < manager < admin';
COMMENT ON COLUMN users.platform_role IS 'Platform role for Simplia internal team: internal_admin, support, etc.';

-- =============================================
-- RELATIONSHIP TABLES
-- =============================================

-- Tenant applications (which apps each tenant has licensed)
CREATE TABLE IF NOT EXISTS tenant_applications (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL, -- References tenants.subdomain
    tenant_id_fk INTEGER REFERENCES tenants(id), -- Proper FK reference
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, expired
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- NULL for perpetual licenses
    expiry_date DATE, -- Date-only expiry for business logic
    max_users INTEGER, -- NULL for unlimited
    user_limit INTEGER DEFAULT 999999, -- Seat limit per application
    seats_used INTEGER DEFAULT 0, -- Current seats used
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, application_id)
);

COMMENT ON TABLE tenant_applications IS 'Licensing - which applications each tenant has licensed';
COMMENT ON COLUMN tenant_applications.tenant_id IS 'String reference to tenants.subdomain (legacy)';
COMMENT ON COLUMN tenant_applications.tenant_id_fk IS 'Proper FK reference to tenants.id';
COMMENT ON COLUMN tenant_applications.user_limit IS 'Maximum concurrent users for this app';
COMMENT ON COLUMN tenant_applications.seats_used IS 'Currently used seats (tracked by system)';

-- User application access (granular permissions per user per app)
CREATE TABLE IF NOT EXISTS user_application_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    tenant_id VARCHAR(100) NOT NULL,
    role_in_app VARCHAR(50) DEFAULT 'user', -- user, admin, viewer
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP, -- NULL for permanent access
    is_active BOOLEAN DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, application_id)
);

COMMENT ON TABLE user_application_access IS 'Granular user permissions per application';
COMMENT ON COLUMN user_application_access.role_in_app IS 'Role within specific application context';

-- Access logs for audit trail
CREATE TABLE IF NOT EXISTS application_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tenant_id VARCHAR(100), -- References tenants.subdomain
    tenant_id_fk INTEGER REFERENCES tenants(id), -- Proper FK reference
    application_id INTEGER REFERENCES applications(id),
    access_type VARCHAR(50), -- granted, denied, revoked (legacy field)
    decision VARCHAR(20) NOT NULL DEFAULT 'granted', -- granted, denied
    reason VARCHAR(255), -- why access was denied
    api_path VARCHAR(500), -- API endpoint accessed
    endpoint VARCHAR(255), -- Legacy endpoint field
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE application_access_logs IS 'Comprehensive audit trail for all access attempts';
COMMENT ON COLUMN application_access_logs.decision IS 'granted or denied - primary access decision';
COMMENT ON COLUMN application_access_logs.reason IS 'Detailed reason for denied access';
COMMENT ON COLUMN application_access_logs.api_path IS 'Full API path for access tracking';

-- =============================================
-- POSTGRESQL TRIGGERS FOR UPDATED_AT (Manual updates for now)
-- =============================================

-- Note: Automatic updated_at triggers will be added in a future migration
-- For now, applications should manually update the updated_at field when modifying records

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON DATABASE simplia_paas IS 'Simplia PaaS - Multi-tenant medical practice management platform';