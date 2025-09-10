-- Migration: Create metrics performance indexes
-- Description: Indexes optimized for dashboard metrics queries with time-based filtering

-- =============================================
-- METRICS TIME-BASED INDEXES
-- =============================================

-- Tenants metrics: active + created_at for growth metrics
CREATE INDEX IF NOT EXISTS idx_tenants_active_created ON tenants(active, created_at DESC) WHERE active = true;

-- Users metrics: active + created_at for growth metrics  
CREATE INDEX IF NOT EXISTS idx_users_active_created ON users(active, created_at DESC) WHERE active = true;

-- Applications metrics: active status (already covered by existing idx_applications_status)
-- No additional index needed - simple COUNT(*) with single condition

-- Tenant Applications metrics: status + expires_at for active license counts
CREATE INDEX IF NOT EXISTS idx_tenant_apps_status_expiry ON tenant_applications(status, expires_at DESC) WHERE status = 'active';

-- =============================================
-- METRICS COMPOSITE INDEXES
-- =============================================

-- Optimized composite for tenant growth queries
CREATE INDEX IF NOT EXISTS idx_tenants_metrics ON tenants(active, created_at DESC, id) WHERE active = true;

-- Optimized composite for user growth queries  
CREATE INDEX IF NOT EXISTS idx_users_metrics ON users(active, created_at DESC, id) WHERE active = true;

-- =============================================
-- ANALYTICS INDEXES (for future dashboard enhancements)
-- =============================================

-- License expiration monitoring (simple index without date_trunc)
CREATE INDEX IF NOT EXISTS idx_tenant_apps_expiring ON tenant_applications(expires_at ASC, status, tenant_id_fk) 
  WHERE status = 'active' AND expires_at IS NOT NULL;

COMMENT ON INDEX idx_tenants_active_created IS 'Optimizes metrics queries for tenant growth over time';
COMMENT ON INDEX idx_users_active_created IS 'Optimizes metrics queries for user growth over time';
COMMENT ON INDEX idx_tenant_apps_status_expiry IS 'Optimizes active license counts and expiration tracking';