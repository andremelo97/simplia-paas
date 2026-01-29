-- Migration: Create core tables for LivoCare
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
  -- Stripe billing integration
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);

COMMENT ON TABLE tenants IS 'Multi-tenant support - each tenant has isolated schema and data';
COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain identifier for tenant (used in URLs and headers)';
COMMENT ON COLUMN tenants.schema_name IS 'PostgreSQL schema name for tenant isolation';
COMMENT ON COLUMN tenants.timezone IS 'IANA timezone identifier (immutable after creation) - controls session timezone for tenant-scoped operations';
COMMENT ON COLUMN tenants.stripe_customer_id IS 'Stripe customer ID for billing integration (cus_xxx)';
COMMENT ON COLUMN tenants.stripe_subscription_id IS 'Stripe subscription ID for plan management (sub_xxx)';

-- User types table (operations < manager < admin hierarchy)
CREATE TABLE IF NOT EXISTS user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0, -- 0=operations, 1=manager, 2=admin
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')
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
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')
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
    platform_role VARCHAR(50) NULL, -- internal_admin for LivoCare team
    last_login TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')
);

COMMENT ON TABLE users IS 'Users table with 1:1 tenant relationship - each user belongs to exactly one tenant';
COMMENT ON COLUMN users.tenant_id_fk IS 'Numeric FK to tenants.id - all tenant references use this field';
COMMENT ON COLUMN users.tenant_name IS 'Denormalized tenant name for query performance';
COMMENT ON COLUMN users.role IS 'Tenant-level role: operations < manager < admin';
COMMENT ON COLUMN users.platform_role IS 'Platform role for LivoCare internal team: internal_admin, support, etc.';

-- =============================================
-- RELATIONSHIP TABLES
-- =============================================

-- Tenant applications (which apps each tenant has licensed)
CREATE TABLE IF NOT EXISTS tenant_applications (
    id SERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT, -- Numeric FK to tenants
    application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, expired, trial
    activated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),
    expires_at TIMESTAMPTZ, -- NULL for perpetual licenses, set for trials
    seats_purchased INTEGER DEFAULT 1, -- Seats purchased in the plan
    seats_used INTEGER DEFAULT 0, -- Current seats used
    trial_used BOOLEAN NOT NULL DEFAULT false, -- Indicates if tenant has used trial for this app
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id_fk, application_id_fk)
);

COMMENT ON TABLE tenant_applications IS 'Licensing - which applications each tenant has licensed';
COMMENT ON COLUMN tenant_applications.tenant_id_fk IS 'Numeric FK to tenants.id - primary tenant reference';
COMMENT ON COLUMN tenant_applications.seats_purchased IS 'Number of seats purchased in the plan';
COMMENT ON COLUMN tenant_applications.seats_used IS 'Currently used seats (tracked by system)';
COMMENT ON COLUMN tenant_applications.expires_at IS 'License expiration date - NULL for perpetual, set for trials';
COMMENT ON COLUMN tenant_applications.trial_used IS 'Indicates if tenant has already used trial period for this app - prevents repeat trials';

-- User application access (granular permissions per user per app)
CREATE TABLE IF NOT EXISTS user_application_access (
    id SERIAL PRIMARY KEY,
    user_id_fk INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT, -- Numeric FK to tenants
    role_in_app VARCHAR(50) DEFAULT 'user', -- user, admin, viewer
    granted_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),
    granted_by_fk INTEGER REFERENCES users(id),
    expires_at TIMESTAMPTZ, -- NULL for permanent access
    active BOOLEAN NOT NULL DEFAULT true,
    -- Pricing snapshots (captured at grant time for billing consistency)
    price_snapshot NUMERIC(10,2),
    currency_snapshot CHAR(3),
    user_type_id_snapshot_fk INTEGER REFERENCES user_types(id),
    granted_cycle TEXT CHECK (granted_cycle IN ('monthly','yearly')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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

  -- Background video (URL to Supabase storage)
  background_video_url TEXT,

  -- Display information
  company_name VARCHAR(255),

  -- Contact information
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  -- One branding config per tenant
  UNIQUE(tenant_id_fk)
);

CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id ON tenant_branding(tenant_id_fk);

COMMENT ON TABLE tenant_branding IS 'Tenant visual identity configuration for public-facing pages (public quotes, reports)';
COMMENT ON COLUMN tenant_branding.primary_color IS 'Main brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.secondary_color IS 'Secondary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.tertiary_color IS 'Tertiary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN tenant_branding.logo_url IS 'URL to tenant logo (Supabase storage path)';
COMMENT ON COLUMN tenant_branding.background_video_url IS 'URL to background video for Hero sections (Supabase storage, MP4 format, max 20MB)';
COMMENT ON COLUMN tenant_branding.company_name IS 'Company display name for public pages';
COMMENT ON COLUMN tenant_branding.email IS 'Contact email for public pages and email footers';

-- =============================================
-- POSTGRESQL TRIGGERS
-- =============================================

-- Note: Tenant branding will be created automatically via application code
-- Trigger approach causes issues with migration runner's statement splitting

-- Note: Automatic updated_at triggers will be added in a future migration
-- For now, applications should manually update the updated_at field when modifying records

-- =============================================
-- TENANT COMMUNICATION SETTINGS
-- =============================================

-- Communication configuration per tenant for sending emails (public quotes, reports, etc.)
CREATE TABLE IF NOT EXISTS tenant_communication_settings (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- SMTP server configuration
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT true,

  -- Authentication
  smtp_username VARCHAR(255) NOT NULL,
  smtp_password TEXT NOT NULL,

  -- Sender information
  smtp_from_email VARCHAR(255) NOT NULL,
  smtp_from_name VARCHAR(255) DEFAULT 'LivoCare.ai',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  -- One config per tenant
  UNIQUE(tenant_id_fk)
);

CREATE INDEX IF NOT EXISTS idx_tenant_communication_settings_tenant ON tenant_communication_settings(tenant_id_fk);

COMMENT ON TABLE tenant_communication_settings IS 'Communication configuration per tenant for sending emails (public quotes, reports, etc.)';
COMMENT ON COLUMN tenant_communication_settings.smtp_host IS 'SMTP server hostname (e.g., smtp.gmail.com)';
COMMENT ON COLUMN tenant_communication_settings.smtp_port IS 'SMTP server port (587 for TLS, 465 for SSL)';
COMMENT ON COLUMN tenant_communication_settings.smtp_secure IS 'Use secure connection (TLS/SSL)';
COMMENT ON COLUMN tenant_communication_settings.smtp_username IS 'SMTP authentication username';
COMMENT ON COLUMN tenant_communication_settings.smtp_password IS 'SMTP authentication password (stored as plain text for now)';
COMMENT ON COLUMN tenant_communication_settings.smtp_from_email IS 'Sender email address';
COMMENT ON COLUMN tenant_communication_settings.smtp_from_name IS 'Sender display name (e.g., "LivoCare.ai")';

-- Email sending log for audit and troubleshooting (generic, used by all apps)
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Email metadata
  app_name VARCHAR(50) NOT NULL, -- 'tq', 'crm', 'automation', etc.
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML or plain text content (with resolved variables)

  -- Delivery status
  status VARCHAR(20) DEFAULT 'sent', -- sent, failed, bounced
  sent_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),
  error_message TEXT,

  -- Flexible metadata for app-specific data (patient_id, quote_id, etc.)
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_email_log_tenant_id ON email_log(tenant_id_fk);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_app_name ON email_log(app_name);

COMMENT ON TABLE email_log IS 'Audit log for all emails sent across applications - generic table used by TQ, CRM, etc.';
COMMENT ON COLUMN email_log.app_name IS 'Application that sent the email (tq, crm, automation)';
COMMENT ON COLUMN email_log.subject IS 'Email subject with resolved variables';
COMMENT ON COLUMN email_log.body IS 'Email body (HTML or plain text) with resolved variables';
COMMENT ON COLUMN email_log.status IS 'Delivery status: sent (successfully sent), failed (SMTP error), bounced (recipient rejected)';
COMMENT ON COLUMN email_log.metadata IS 'Flexible JSONB field for app-specific data (quote_id, patient_id, etc.)';

-- =============================================
-- TRANSCRIPTION QUOTA MANAGEMENT
-- =============================================

-- Transcription plans table (Basic, VIP, etc.)
CREATE TABLE IF NOT EXISTS public.transcription_plans (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  monthly_minutes_limit INTEGER NOT NULL,
  allows_custom_limits BOOLEAN NOT NULL,
  allows_overage BOOLEAN NOT NULL,
  stt_model VARCHAR(50) NOT NULL,
  language_detection_enabled BOOLEAN NOT NULL DEFAULT false,
  cost_per_minute_usd NUMERIC(10, 6) NOT NULL,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_days INTEGER NULL,
  show_cost BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.transcription_plans IS 'Available transcription quota plans';
COMMENT ON COLUMN public.transcription_plans.slug IS 'Unique identifier for the plan (basic, vip)';
COMMENT ON COLUMN public.transcription_plans.monthly_minutes_limit IS 'Default monthly limit in minutes for this plan';
COMMENT ON COLUMN public.transcription_plans.allows_custom_limits IS 'Whether users can customize their monthly limits in Hub';
COMMENT ON COLUMN public.transcription_plans.allows_overage IS 'Whether users can enable overage (usage beyond limits) in Hub';
COMMENT ON COLUMN public.transcription_plans.stt_model IS 'Deepgram STT model to use (nova-3, nova-2, etc.)';
COMMENT ON COLUMN public.transcription_plans.language_detection_enabled IS 'If true, uses detect_language=true (multilingual $0.0052/min). If false, uses language parameter targeting (monolingual $0.0043/min)';
COMMENT ON COLUMN public.transcription_plans.cost_per_minute_usd IS 'Cost per minute in USD (calculated based on stt_model + language_detection_enabled)';
COMMENT ON COLUMN public.transcription_plans.is_trial IS 'Whether this is a trial plan that expires after trial_days';
COMMENT ON COLUMN public.transcription_plans.trial_days IS 'Number of days the trial lasts (only applicable when is_trial = true)';
COMMENT ON COLUMN public.transcription_plans.show_cost IS 'If true, shows cost-related fields in Hub transcription configuration page';

-- Tenant transcription configuration
CREATE TABLE IF NOT EXISTS public.tenant_transcription_config (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id_fk INTEGER NOT NULL REFERENCES transcription_plans(id) ON DELETE RESTRICT,
  custom_monthly_limit INTEGER NULL,
  transcription_language VARCHAR(10) NULL,
  overage_allowed BOOLEAN DEFAULT false,
  plan_activated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id_fk)
);

COMMENT ON TABLE public.tenant_transcription_config IS 'Per-tenant transcription configuration (set by user in Hub)';
COMMENT ON COLUMN public.tenant_transcription_config.plan_id_fk IS 'Transcription plan assigned by internal admin';
COMMENT ON COLUMN public.tenant_transcription_config.custom_monthly_limit IS 'Custom monthly limit set by user in Hub (only if plan.allows_custom_limits = true). NULL uses plan default';
COMMENT ON COLUMN public.tenant_transcription_config.transcription_language IS 'Language for transcription (pt-BR or en-US). NULL = use tenant locale as default';
COMMENT ON COLUMN public.tenant_transcription_config.overage_allowed IS 'Whether tenant can exceed monthly limit (only if plan.allows_custom_limits = true)';
COMMENT ON COLUMN public.tenant_transcription_config.plan_activated_at IS 'When the current plan was activated. Updated when plan changes. Used to calculate trial expiration';

-- Tenant transcription usage tracking (per-transcription granular records)
CREATE TABLE IF NOT EXISTS public.tenant_transcription_usage (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transcription_id UUID,
  audio_duration_seconds INTEGER NOT NULL CHECK (audio_duration_seconds >= 0),
  stt_model VARCHAR(50) NOT NULL,
  detected_language VARCHAR(10) NULL,
  stt_provider_request_id VARCHAR(255),
  cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (cost_usd >= 0),
  usage_date TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN public.tenant_transcription_usage.detected_language IS 'Language detected by Deepgram when language_detection_enabled=true (e.g., "pt", "en", "es"). NULL if using targeted language parameter';

CREATE INDEX idx_tenant_transcription_usage_tenant_id ON public.tenant_transcription_usage(tenant_id_fk);
CREATE INDEX idx_tenant_transcription_usage_usage_date ON public.tenant_transcription_usage(usage_date);
CREATE INDEX idx_tenant_transcription_usage_tenant_date ON public.tenant_transcription_usage(tenant_id_fk, usage_date);

COMMENT ON TABLE public.tenant_transcription_usage IS 'Granular transcription usage tracking per transcription (for cost calculation and overage billing)';
COMMENT ON COLUMN public.tenant_transcription_usage.transcription_id IS 'UUID of transcription record (may be NULL for legacy records)';
COMMENT ON COLUMN public.tenant_transcription_usage.audio_duration_seconds IS 'Audio duration in seconds (source: Deepgram metadata.duration)';
COMMENT ON COLUMN public.tenant_transcription_usage.stt_model IS 'Deepgram model used (nova-3, nova-2, enhanced, etc)';
COMMENT ON COLUMN public.tenant_transcription_usage.stt_provider_request_id IS 'Deepgram request_id for audit trail';
COMMENT ON COLUMN public.tenant_transcription_usage.cost_usd IS 'Calculated cost in USD based on model pricing and duration';
COMMENT ON COLUMN public.tenant_transcription_usage.usage_date IS 'Date when transcription was completed (for monthly aggregation)';

-- =============================================
-- API KEYS MANAGEMENT
-- =============================================

-- API Keys for external integrations (N8N, Zapier, etc.)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                    -- "N8N Production", "Zapier Backup"
  key_hash VARCHAR(255) NOT NULL,                -- bcrypt hash (never store plain text)
  key_prefix VARCHAR(12) NOT NULL,               -- "livo_abc1..." for identification
  scope VARCHAR(50) NOT NULL DEFAULT 'provisioning', -- permission scope
  created_by_fk INTEGER REFERENCES users(id),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                        -- NULL = never expires
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_scope ON public.api_keys(scope);

COMMENT ON TABLE public.api_keys IS 'API Keys for external integrations (N8N, Stripe webhooks, etc.)';
COMMENT ON COLUMN public.api_keys.name IS 'Human-readable name for the key (e.g., "N8N Production")';
COMMENT ON COLUMN public.api_keys.key_hash IS 'bcrypt hash of the API key - never store plain text';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 12 chars of key for identification in UI (e.g., "livo_a1b2...")';
COMMENT ON COLUMN public.api_keys.scope IS 'Permission scope: provisioning, billing, etc.';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Last time this key was used (for audit)';
COMMENT ON COLUMN public.api_keys.expires_at IS 'Expiration date - NULL means never expires';

-- =============================================
-- USER ONBOARDING TRACKING
-- =============================================

-- Onboarding wizard completion tracking (admin-only feature)
-- Separate table allows scalability for new apps without modifying users table
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id SERIAL PRIMARY KEY,
  user_id_fk INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_slug VARCHAR(50) NOT NULL, -- 'hub', 'tq', 'crm', etc.
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN NOT NULL DEFAULT false,
  skipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  UNIQUE(user_id_fk, app_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON public.user_onboarding(user_id_fk);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_app_slug ON public.user_onboarding(app_slug);

COMMENT ON TABLE public.user_onboarding IS 'Onboarding wizard completion tracking per user per app (admin-only feature)';
COMMENT ON COLUMN public.user_onboarding.user_id_fk IS 'User who completed/skipped the onboarding';
COMMENT ON COLUMN public.user_onboarding.app_slug IS 'Application identifier: hub, tq, crm, automation, etc.';
COMMENT ON COLUMN public.user_onboarding.completed IS 'Whether user completed all wizard steps';
COMMENT ON COLUMN public.user_onboarding.skipped IS 'Whether user skipped the wizard';

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

-- COMMENT ON DATABASE simplia_paas IS 'Simplia PaaS - Multi-tenant medical practice management platform';