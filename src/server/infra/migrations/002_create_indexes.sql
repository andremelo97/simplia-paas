-- Migration: Create performance indexes for LivoCare
-- Description: Comprehensive indexing strategy for optimal query performance
-- Organizes all indexes by purpose: lookups, performance, audit, and business logic

-- =============================================
-- PRIMARY LOOKUP INDEXES
-- =============================================

-- Tenants lookup indexes
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- User lookup indexes  
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- Legacy string index removed: idx_users_tenant_id
CREATE INDEX IF NOT EXISTS idx_users_tenant_id_fk ON users(tenant_id_fk); -- Primary numeric FK index
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type_id_fk ON users(user_type_id_fk);
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role);

-- Application lookup indexes
CREATE INDEX IF NOT EXISTS idx_applications_slug ON applications(slug);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- User types lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_types_slug ON user_types(slug);
CREATE INDEX IF NOT EXISTS idx_user_types_hierarchy ON user_types(hierarchy_level);

-- =============================================
-- PERFORMANCE INDEXES (Multi-column for common queries)
-- =============================================

-- User authentication and tenant context
-- Legacy composite index removed: idx_users_email_tenant
CREATE INDEX IF NOT EXISTS idx_users_email_tenant_fk ON users(email, tenant_id_fk); -- Primary composite
-- Legacy composite index removed: idx_users_tenant_active
CREATE INDEX IF NOT EXISTS idx_users_tenant_fk_active ON users(tenant_id_fk, active); -- Primary composite
-- Legacy composite index removed: idx_users_tenant_status
CREATE INDEX IF NOT EXISTS idx_users_tenant_fk_status ON users(tenant_id_fk, status); -- Primary composite

-- Tenant applications performance
-- Legacy index removed: idx_tenant_applications_tenant_id
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_fk ON tenant_applications(tenant_id_fk);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_status ON tenant_applications(status);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_status ON tenant_applications(tenant_id_fk, status);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_active ON tenant_applications(active);

-- User application access performance
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id_fk ON user_application_access(user_id_fk);
-- Legacy composite index removed: idx_user_app_access_tenant_app
CREATE INDEX IF NOT EXISTS idx_user_app_access_tenant_fk_app ON user_application_access(tenant_id_fk, application_id_fk); -- Primary composite
CREATE INDEX IF NOT EXISTS idx_user_app_access_tenant_fk ON user_application_access(tenant_id_fk); -- Primary FK index
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_app ON user_application_access(user_id_fk, application_id_fk, active);
CREATE INDEX IF NOT EXISTS idx_user_app_access_active ON user_application_access(active);

-- =============================================
-- AUDIT AND LOGGING INDEXES  
-- =============================================

-- Access logs for audit queries
-- Legacy index removed: idx_access_logs_user_tenant
CREATE INDEX IF NOT EXISTS idx_access_logs_tenant_date ON application_access_logs(tenant_id_fk, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON application_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_decision ON application_access_logs(decision);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_app ON application_access_logs(user_id_fk, application_id_fk);

-- =============================================
-- BUSINESS LOGIC INDEXES
-- =============================================

-- Licensing and seat management
CREATE INDEX IF NOT EXISTS idx_tenant_apps_expiry ON tenant_applications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_apps_seats ON tenant_applications(tenant_id_fk, seats_used, user_limit);

-- User access expiry tracking
CREATE INDEX IF NOT EXISTS idx_user_access_expiry ON user_application_access(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_access_granted ON user_application_access(granted_at);

-- =============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================

-- Authorization flow optimization (5-layer check)
CREATE INDEX IF NOT EXISTS idx_auth_flow_tenant_app ON tenant_applications(tenant_id_fk, application_id_fk, status, active, expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_flow_user_app ON user_application_access(user_id_fk, application_id_fk, active, expires_at);

-- Reporting and analytics
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_time ON application_access_logs(tenant_id_fk, created_at DESC, decision);
CREATE INDEX IF NOT EXISTS idx_analytics_app_usage ON application_access_logs(application_id_fk, created_at DESC, decision);

-- =============================================
-- PARTIAL INDEXES (Performance optimization)
-- =============================================

-- Active records only (most common queries)
-- Legacy partial index removed: idx_users_active_only
CREATE INDEX IF NOT EXISTS idx_users_active_fk_only ON users(tenant_id_fk, email) WHERE active = true; -- Primary partial
CREATE INDEX IF NOT EXISTS idx_tenant_apps_active_only ON tenant_applications(tenant_id_fk, application_id_fk) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_access_active_only ON user_application_access(user_id_fk, application_id_fk) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_access_tenant_fk_active ON user_application_access(tenant_id_fk, user_id_fk, application_id_fk) WHERE active = true;

-- Failed access attempts (security monitoring)
CREATE INDEX IF NOT EXISTS idx_access_denied_only ON application_access_logs(tenant_id_fk, created_at DESC, user_id_fk) WHERE decision = 'denied';

-- =============================================
-- TENANT ADDRESSES INDEXES
-- =============================================

-- Primary lookup indexes for addresses
CREATE INDEX IF NOT EXISTS idx_tenant_addresses_tenant_active ON tenant_addresses(tenant_id_fk, active);
CREATE INDEX IF NOT EXISTS idx_tenant_addresses_tenant_type ON tenant_addresses(tenant_id_fk, type);
CREATE INDEX IF NOT EXISTS idx_tenant_addresses_country ON tenant_addresses(country_code);

-- Partial unique constraint: only one primary per tenant+type
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_addresses_primary_per_type 
    ON tenant_addresses(tenant_id_fk, type) 
    WHERE active = true AND is_primary = true;

-- =============================================
-- TENANT CONTACTS INDEXES
-- =============================================

-- Primary lookup indexes for contacts
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_tenant_active ON tenant_contacts(tenant_id_fk, active);
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_tenant_type ON tenant_contacts(tenant_id_fk, type);

-- Email lookup with functional index (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_email_lookup ON tenant_contacts(tenant_id_fk, lower(email)) WHERE email IS NOT NULL;

-- Partial unique constraint: only one primary per tenant+type
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_contacts_primary_per_type 
    ON tenant_contacts(tenant_id_fk, type) 
    WHERE active = true AND is_primary = true;

-- =============================================
-- INDEX COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON INDEX idx_users_email_tenant_fk IS 'Optimizes user authentication queries by email and tenant (numeric FK)';
COMMENT ON INDEX idx_users_tenant_id_fk IS 'Fast lookup of users by tenant using numeric FK';
COMMENT ON INDEX idx_user_app_access_tenant_fk IS 'Fast lookup of user access by tenant using numeric FK';
COMMENT ON INDEX idx_tenant_applications_tenant_status IS 'Optimizes license checking queries in authorization middleware';
COMMENT ON INDEX idx_user_app_access_user_app IS 'Optimizes user permission checks in authorization flow';
COMMENT ON INDEX idx_access_logs_tenant_date IS 'Optimizes audit log queries for compliance reporting';
COMMENT ON INDEX idx_auth_flow_tenant_app IS 'Composite index for 5-layer authorization flow optimization';
COMMENT ON INDEX idx_auth_flow_user_app IS 'User-level authorization flow optimization';
COMMENT ON INDEX idx_access_denied_only IS 'Partial index for security monitoring of failed access attempts';

-- Address and contact index comments
COMMENT ON INDEX idx_tenant_addresses_tenant_active IS 'Fast lookup of active addresses by tenant';
COMMENT ON INDEX idx_tenant_addresses_tenant_type IS 'Optimizes filtering addresses by type within tenant';
COMMENT ON INDEX uq_tenant_addresses_primary_per_type IS 'Ensures only one primary address per type per tenant';
COMMENT ON INDEX idx_tenant_contacts_tenant_active IS 'Fast lookup of active contacts by tenant';
COMMENT ON INDEX idx_tenant_contacts_email_lookup IS 'Case-insensitive email lookup within tenant context';
COMMENT ON INDEX uq_tenant_contacts_primary_per_type IS 'Ensures only one primary contact per type per tenant';

-- =============================================
-- TRANSCRIPTION QUOTA INDEXES
-- =============================================

-- Transcription plans lookup
CREATE INDEX IF NOT EXISTS idx_transcription_plans_active ON public.transcription_plans(active);
CREATE INDEX IF NOT EXISTS idx_transcription_plans_slug ON public.transcription_plans(slug);

-- Tenant transcription config lookup
CREATE INDEX IF NOT EXISTS idx_tenant_transcription_config_tenant ON public.tenant_transcription_config(tenant_id_fk);
CREATE INDEX IF NOT EXISTS idx_tenant_transcription_config_plan ON public.tenant_transcription_config(plan_id_fk);

-- Tenant transcription usage lookup (indexes already created in 001_create_core_tables.sql)
-- idx_tenant_transcription_usage_tenant_id
-- idx_tenant_transcription_usage_usage_date
-- idx_tenant_transcription_usage_tenant_date

COMMENT ON INDEX idx_transcription_plans_active IS 'Fast lookup of active transcription plans';
COMMENT ON INDEX idx_tenant_transcription_config_tenant IS 'Fast lookup of transcription config by tenant';

-- =============================================
-- TENANT CONSISTENCY CONSTRAINTS AND TRIGGERS
-- =============================================

-- Note: Tenant consistency triggers will be added via psql in a separate script
-- due to migration parser limitations with dollar-quoted strings.
-- For now, application-level validation ensures tenant consistency in user_application_access
-- 
-- Key constraint: user_application_access.tenant_id_fk must match users.tenant_id_fk for the given user_id
-- This is enforced at the application layer in all user access operations.