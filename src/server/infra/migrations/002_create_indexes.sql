-- Migration: Create performance indexes for Simplia PaaS
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
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type_id ON users(user_type_id);
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
CREATE INDEX IF NOT EXISTS idx_users_email_tenant ON users(email, tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON users(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_users_tenant_status ON users(tenant_id, status);

-- Tenant applications performance
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_id ON tenant_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_fk ON tenant_applications(tenant_id_fk);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_status ON tenant_applications(status);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_status ON tenant_applications(tenant_id_fk, status);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_active ON tenant_applications(active);

-- User application access performance
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id ON user_application_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_tenant_app ON user_application_access(tenant_id, application_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_app ON user_application_access(user_id, application_id, active);
CREATE INDEX IF NOT EXISTS idx_user_app_access_active ON user_application_access(active);

-- =============================================
-- AUDIT AND LOGGING INDEXES  
-- =============================================

-- Access logs for audit queries
CREATE INDEX IF NOT EXISTS idx_access_logs_user_tenant ON application_access_logs(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_tenant_date ON application_access_logs(tenant_id_fk, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON application_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_decision ON application_access_logs(decision);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_app ON application_access_logs(user_id, application_id);

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
CREATE INDEX IF NOT EXISTS idx_auth_flow_tenant_app ON tenant_applications(tenant_id_fk, application_id, status, active, expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_flow_user_app ON user_application_access(user_id, application_id, is_active, expires_at);

-- Reporting and analytics
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_time ON application_access_logs(tenant_id_fk, created_at DESC, decision);
CREATE INDEX IF NOT EXISTS idx_analytics_app_usage ON application_access_logs(application_id, created_at DESC, decision);

-- =============================================
-- PARTIAL INDEXES (Performance optimization)
-- =============================================

-- Active records only (most common queries)
CREATE INDEX IF NOT EXISTS idx_users_active_only ON users(tenant_id, email) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_tenant_apps_active_only ON tenant_applications(tenant_id_fk, application_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_access_active_only ON user_application_access(user_id, application_id) WHERE active = true AND is_active = true;

-- Failed access attempts (security monitoring)
CREATE INDEX IF NOT EXISTS idx_access_denied_only ON application_access_logs(tenant_id_fk, created_at DESC, user_id) WHERE decision = 'denied';

-- =============================================
-- TENANT ADDRESSES INDEXES
-- =============================================

-- Primary lookup indexes for addresses
CREATE INDEX IF NOT EXISTS idx_tenant_addresses_tenant_active ON tenant_addresses(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_tenant_addresses_tenant_type ON tenant_addresses(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_tenant_addresses_country ON tenant_addresses(country_code);

-- Partial unique constraint: only one primary per tenant+type
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_addresses_primary_per_type 
    ON tenant_addresses(tenant_id, type) 
    WHERE active = true AND is_primary = true;

-- =============================================
-- TENANT CONTACTS INDEXES
-- =============================================

-- Primary lookup indexes for contacts
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_tenant_active ON tenant_contacts(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_tenant_type ON tenant_contacts(tenant_id, type);

-- Email lookup with functional index (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_email_lookup ON tenant_contacts(tenant_id, lower(email)) WHERE email IS NOT NULL;

-- Partial unique constraint: only one primary per tenant+type
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_contacts_primary_per_type 
    ON tenant_contacts(tenant_id, type) 
    WHERE active = true AND is_primary = true;

-- =============================================
-- INDEX COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON INDEX idx_users_email_tenant IS 'Optimizes user authentication queries by email and tenant';
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