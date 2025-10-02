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
  timezone VARCHAR(100) NOT NULL, -- IANA timezone (e.g., 'America/Sao_Paulo', 'Australia/Brisbane')
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenants IS 'Multi-tenant support - each tenant has isolated schema and data';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain identifier for tenant (used in URLs and headers)';
COMMENT ON COLUMN tenants.schema_name IS 'PostgreSQL schema name for tenant isolation';
COMMENT ON COLUMN tenants.timezone IS 'IANA timezone identifier (immutable after creation) - controls session timezone for tenant-scoped operations';

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

-- Users table (1:1 tenant relationship)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT, -- Numeric FK to tenants
    tenant_name VARCHAR(255), -- Denormalized tenant name for query performance
    role VARCHAR(50) DEFAULT 'operations', -- operations, manager, admin
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    user_type_id_fk INTEGER NOT NULL REFERENCES user_types(id),
    platform_role VARCHAR(50) NULL, -- internal_admin for Simplia team
    last_login TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Users table with 1:1 tenant relationship - each user belongs to exactly one tenant';
COMMENT ON COLUMN users.tenant_id_fk IS 'Numeric FK to tenants.id - all tenant references use this field';
COMMENT ON COLUMN users.tenant_name IS 'Denormalized tenant name for query performance';
COMMENT ON COLUMN users.role IS 'Tenant-level role: operations < manager < admin';
COMMENT ON COLUMN users.platform_role IS 'Platform role for Simplia internal team: internal_admin, support, etc.';

-- =============================================
-- RELATIONSHIP TABLES
-- =============================================

-- Tenant applications (which apps each tenant has licensed)
CREATE TABLE IF NOT EXISTS tenant_applications (
    id SERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT, -- Numeric FK to tenants
    application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
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
    UNIQUE(tenant_id_fk, application_id_fk)
);

COMMENT ON TABLE tenant_applications IS 'Licensing - which applications each tenant has licensed';
COMMENT ON COLUMN tenant_applications.tenant_id_fk IS 'Numeric FK to tenants.id - primary tenant reference';
COMMENT ON COLUMN tenant_applications.user_limit IS 'Maximum concurrent users for this app';
COMMENT ON COLUMN tenant_applications.seats_used IS 'Currently used seats (tracked by system)';

-- User application access (granular permissions per user per app)
CREATE TABLE IF NOT EXISTS user_application_access (
    id SERIAL PRIMARY KEY,
    user_id_fk INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT, -- Numeric FK to tenants
    role_in_app VARCHAR(50) DEFAULT 'user', -- user, admin, viewer
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by_fk INTEGER REFERENCES users(id),
    expires_at TIMESTAMP, -- NULL for permanent access
    active BOOLEAN NOT NULL DEFAULT true,
    -- Pricing snapshots (captured at grant time for billing consistency)
    price_snapshot NUMERIC(10,2),
    currency_snapshot CHAR(3),
    user_type_id_snapshot_fk INTEGER REFERENCES user_types(id),
    granted_cycle TEXT CHECK (granted_cycle IN ('monthly','yearly')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id_fk, user_id_fk, application_id_fk) -- Unique per tenant (1:1 compatible, NxN ready)
);

COMMENT ON TABLE user_application_access IS 'Granular user permissions per application with tenant context';
COMMENT ON COLUMN user_application_access.tenant_id_fk IS 'Numeric FK to tenants.id - must match user''s tenant_id_fk';
COMMENT ON COLUMN user_application_access.role_in_app IS 'Role within specific application context';
COMMENT ON COLUMN user_application_access.price_snapshot IS 'Price captured at grant time for billing consistency';
COMMENT ON COLUMN user_application_access.currency_snapshot IS 'Currency captured at grant time';
COMMENT ON COLUMN user_application_access.user_type_id_snapshot_fk IS 'User type captured at grant time';
COMMENT ON COLUMN user_application_access.granted_cycle IS 'Billing cycle captured at grant time';

-- Access logs for audit trail
CREATE TABLE IF NOT EXISTS application_access_logs (
    id SERIAL PRIMARY KEY,
    user_id_fk INTEGER REFERENCES users(id),
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id), -- Numeric FK to tenants
    application_id_fk INTEGER REFERENCES applications(id),
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
COMMENT ON COLUMN application_access_logs.tenant_id_fk IS 'Numeric FK to tenants.id - tenant context for audit';
COMMENT ON COLUMN application_access_logs.decision IS 'granted or denied - primary access decision';
COMMENT ON COLUMN application_access_logs.reason IS 'Detailed reason for denied access';
COMMENT ON COLUMN application_access_logs.api_path IS 'Full API path for access tracking';

-- Tenant addresses (institutional addresses)
CREATE TABLE IF NOT EXISTS tenant_addresses (
    id BIGSERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('HQ','BILLING','SHIPPING','BRANCH','OTHER')),
    label TEXT NULL, -- free label (e.g., 'Headquarters São Paulo')
    line1 TEXT NOT NULL,
    line2 TEXT NULL,
    city TEXT NULL,
    state TEXT NULL,
    postal_code TEXT NULL,
    country_code CHAR(2) NOT NULL, -- ISO-3166-1 alpha-2 (store UPPER)
    is_primary BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tenant_addresses IS 'Institutional addresses for tenants (HQ, billing, shipping, branch offices, etc.)';
COMMENT ON COLUMN tenant_addresses.tenant_id_fk IS 'Foreign key reference to tenants table';
COMMENT ON COLUMN tenant_addresses.type IS 'Address type: HQ=headquarters, BILLING=billing address, SHIPPING=shipping, BRANCH=branch office, OTHER=custom';
COMMENT ON COLUMN tenant_addresses.label IS 'Optional custom label for the address (e.g., "Main Office Downtown")';
COMMENT ON COLUMN tenant_addresses.line1 IS 'Primary address line (street, number)';
COMMENT ON COLUMN tenant_addresses.line2 IS 'Secondary address line (suite, apartment, floor)';
COMMENT ON COLUMN tenant_addresses.country_code IS 'ISO-3166-1 alpha-2 country code (stored in uppercase)';
COMMENT ON COLUMN tenant_addresses.is_primary IS 'Whether this is the primary address for this type (max 1 per tenant+type)';

-- Tenant contacts (contact persons)
CREATE TABLE IF NOT EXISTS tenant_contacts (
    id BIGSERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ADMIN','BILLING','TECH','LEGAL','OTHER')),
    full_name TEXT NOT NULL,
    email TEXT NULL, -- normalize to lower-case in application
    phone TEXT NULL, -- Phone number in any format
    title TEXT NULL, -- job title
    department TEXT NULL, -- department/area
    notes TEXT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tenant_contacts IS 'Contact persons for tenants (admin, billing, technical, legal contacts, etc.)';
COMMENT ON COLUMN tenant_contacts.tenant_id_fk IS 'Foreign key reference to tenants table';
COMMENT ON COLUMN tenant_contacts.type IS 'Contact type: ADMIN=administrative, BILLING=billing contact, TECH=technical, LEGAL=legal contact, OTHER=custom';
COMMENT ON COLUMN tenant_contacts.full_name IS 'Full name of the contact person';
COMMENT ON COLUMN tenant_contacts.email IS 'Email address (normalized to lowercase in application layer)';
COMMENT ON COLUMN tenant_contacts.phone IS 'Phone number in any format (stored as-is)';
COMMENT ON COLUMN tenant_contacts.title IS 'Job title or position';
COMMENT ON COLUMN tenant_contacts.department IS 'Department or business area';
COMMENT ON COLUMN tenant_contacts.is_primary IS 'Whether this is the primary contact for this type (max 1 per tenant+type)';

-- =============================================
-- APPLICATION PRICING MATRIX
-- =============================================

-- Application pricing matrix (App × UserType - simple active/inactive model)
CREATE TABLE IF NOT EXISTS application_pricing (
  id BIGSERIAL PRIMARY KEY,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_type_id_fk INTEGER NOT NULL REFERENCES user_types(id),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE application_pricing IS 'Pricing matrix for App × UserType - allows multiple pricing entries';
COMMENT ON COLUMN application_pricing.active IS 'Whether this pricing entry is currently active (manual control)';
COMMENT ON COLUMN application_pricing.billing_cycle IS 'monthly or yearly billing cycle';

-- =============================================
-- VIEWS FOR SEAT AGGREGATION
-- =============================================

-- View to count seats by tenant, application, and user type
CREATE OR REPLACE VIEW v_tenant_app_seats_by_type AS
SELECT
  uaa.tenant_id_fk,
  uaa.application_id_fk,
  COALESCE(uaa.user_type_id_snapshot_fk, u.user_type_id_fk) AS user_type_id,
  COUNT(*)::INT AS seats_count,
  SUM(COALESCE(uaa.price_snapshot, 0))::NUMERIC(10,2) AS total_price
FROM user_application_access uaa
JOIN users u ON u.id = uaa.user_id_fk
WHERE uaa.active = TRUE
GROUP BY 1,2,3;

COMMENT ON VIEW v_tenant_app_seats_by_type IS 'Aggregates active seats by tenant, app and user type with pricing';

-- =============================================
-- TIMEZONE IMMUTABILITY ENFORCEMENT
-- =============================================

-- Note: Timezone immutability is enforced at application level in the PUT route
-- Database-level triggers will be added in a future migration

-- =============================================
-- TENANT CONSISTENCY TRIGGERS
-- =============================================

-- Note: Additional tenant consistency triggers will be added in a future migration
-- For now, application-level validation ensures data integrity

-- =============================================
-- PLATFORM LOGIN AUDIT TABLE (Global scope)
-- =============================================

-- Global audit table for platform admin login attempts
-- Used by internal admin authentication system for security monitoring
CREATE TABLE IF NOT EXISTS platform_login_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id_fk INTEGER REFERENCES users(id), -- NULLable - failed logins may not have valid user
  email VARCHAR(255) NOT NULL, -- Always capture attempted email
  ip_address INET, -- Capture client IP for security analysis
  user_agent TEXT, -- Browser/client identification
  success BOOLEAN NOT NULL DEFAULT FALSE, -- Login success/failure flag
  reason TEXT, -- Error reason for failed attempts (e.g., 'invalid_password', 'platform_role_required')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries by email and time-based lookups
CREATE INDEX IF NOT EXISTS idx_platform_login_audit_email_created ON platform_login_audit(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_login_audit_success_created ON platform_login_audit(success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_login_audit_user_created ON platform_login_audit(user_id_fk, created_at DESC) WHERE user_id_fk IS NOT NULL;

-- =============================================
-- TENANT BRANDING CONFIGURATION
-- =============================================

-- Tenant visual identity configuration for public-facing pages (quotes, reports)
CREATE TABLE IF NOT EXISTS tenant_branding (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Colors (hex format with validation)
  primary_color VARCHAR(7) NOT NULL DEFAULT '#B725B7'
    CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#E91E63'
    CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  tertiary_color VARCHAR(7) NOT NULL DEFAULT '#5ED6CE'
    CHECK (tertiary_color ~ '^#[0-9A-Fa-f]{6}$'),

  -- Images (URLs to Supabase storage)
  logo_url TEXT,
  favicon_url TEXT,

  -- Display information
  company_name VARCHAR(255),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- One branding config per tenant
  UNIQUE(tenant_id_fk)
);

CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id ON tenant_branding(tenant_id_fk);

COMMENT ON TABLE tenant_branding IS 'Tenant visual identity configuration for public-facing pages (public quotes, reports)';
COMMENT ON COLUMN tenant_branding.primary_color IS 'Main brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.secondary_color IS 'Secondary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.tertiary_color IS 'Tertiary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.logo_url IS 'URL to tenant logo (Supabase storage path)';
COMMENT ON COLUMN tenant_branding.favicon_url IS 'URL to tenant favicon (Supabase storage path)';
COMMENT ON COLUMN tenant_branding.company_name IS 'Company display name for public pages';

-- =============================================
-- POSTGRESQL TRIGGERS
-- =============================================

-- Note: Tenant branding will be created automatically via application code
-- Trigger approach causes issues with migration runner's statement splitting

-- Note: Automatic updated_at triggers will be added in a future migration
-- For now, applications should manually update the updated_at field when modifying records

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

-- COMMENT ON DATABASE simplia_paas IS 'Simplia PaaS - Multi-tenant medical practice management platform';