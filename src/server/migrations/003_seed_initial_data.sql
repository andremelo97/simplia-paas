-- Migration: Seed initial data for Simplia PaaS
-- Description: Seeds essential data for system operation
-- Includes: user types, applications, default tenant, and initial licenses

-- =============================================
-- USER TYPES HIERARCHY
-- =============================================

INSERT INTO user_types (name, slug, base_price, description, hierarchy_level) VALUES
('Operations', 'operations', 25.00, 'Basic operational user with limited access to core features - handles day-to-day operations', 0),
('Manager', 'manager', 75.00, 'Management level user with elevated permissions - can oversee operations and manage workflows', 1),
('Administrator', 'admin', 150.00, 'Full system access with administrative capabilities - can manage users, system settings, and all features', 2)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- APPLICATION CATALOG
-- =============================================

INSERT INTO applications (name, slug, description, price_per_user, status, version) VALUES
('Transcription Quote', 'tq', 'Medical transcription quotation system with AI-powered analysis and workflow management', 50.00, 'active', '1.0.0'),
('Patient Management', 'pm', 'Comprehensive patient records, appointment scheduling, and clinical workflow management', 30.00, 'active', '1.0.0'),
('Billing System', 'billing', 'Advanced billing, insurance claims processing, and revenue cycle management', 40.00, 'active', '1.0.0'),
('Reporting Dashboard', 'reports', 'Analytics, reporting tools, and business intelligence for medical practices', 25.00, 'active', '1.0.0')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- DEFAULT TENANT SETUP
-- =============================================

-- Insert default tenant for development and testing
INSERT INTO tenants (name, subdomain, schema_name, status) VALUES
('Default Clinic', 'default', 'public', 'active'),
('Test Clinic', 'test_clinic', 'tenant_test_clinic', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- =============================================
-- INITIAL LICENSING SETUP
-- =============================================

-- License TQ (Transcription Quote) for default tenant
INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used)
SELECT 
  'default' as tenant_id,
  t.id as tenant_id_fk,
  a.id as application_id,
  'active' as status,
  999999 as user_limit,
  0 as seats_used
FROM tenants t, applications a
WHERE t.subdomain = 'default' 
  AND a.slug = 'tq'
ON CONFLICT (tenant_id, application_id) DO NOTHING;

-- License TQ for test clinic (used in automated tests)
INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used)
SELECT 
  'test_clinic' as tenant_id,
  t.id as tenant_id_fk,
  a.id as application_id,
  'active' as status,
  999999 as user_limit,
  0 as seats_used
FROM tenants t, applications a
WHERE t.subdomain = 'test_clinic' 
  AND a.slug = 'tq'
ON CONFLICT (tenant_id, application_id) DO NOTHING;

-- =============================================
-- SAMPLE ADMIN USER (Development only)
-- =============================================

-- Insert sample admin user for default tenant (password: admin123)
-- Hash generated with bcrypt, salt rounds 12
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  tenant_id, 
  role, 
  user_type_id, 
  platform_role,
  status
)
SELECT 
  'admin@simplia.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiCS.nQkr4vS', -- admin123
  'System',
  'Administrator', 
  'default',
  'admin',
  ut.id,
  'internal_admin',
  'active'
FROM user_types ut 
WHERE ut.slug = 'admin'
ON CONFLICT (email) DO NOTHING;

-- Sample manager user for testing
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  tenant_id,
  role,
  user_type_id,
  status
)
SELECT 
  'manager@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiCS.nQkr4vS', -- admin123
  'Test',
  'Manager',
  'default',
  'manager',
  ut.id,
  'active'
FROM user_types ut
WHERE ut.slug = 'manager'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- DATA VALIDATION AND CONSTRAINTS
-- =============================================

-- Note: Data validation can be added later with proper plpgsql blocks
-- For now, seeding is based on INSERT...ON CONFLICT which handles errors gracefully

-- =============================================
-- SEED DOCUMENTATION
-- =============================================

COMMENT ON TABLE tenants IS 'Seeded with default and test_clinic tenants for development';
COMMENT ON TABLE user_types IS 'Seeded with operations/manager/admin hierarchy';
COMMENT ON TABLE applications IS 'Seeded with tq/pm/billing/reports product catalog';
COMMENT ON TABLE tenant_applications IS 'Seeded with initial TQ licenses for development tenants';