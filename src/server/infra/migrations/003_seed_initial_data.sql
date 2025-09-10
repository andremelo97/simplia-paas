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

-- Create tenant schemas first
CREATE SCHEMA IF NOT EXISTS tenant_default;
CREATE SCHEMA IF NOT EXISTS tenant_test_clinic;

COMMENT ON SCHEMA tenant_default IS 'Default tenant schema for development and admin panel testing';
COMMENT ON SCHEMA tenant_test_clinic IS 'Test clinic schema for automated testing';

-- Insert default tenant for development and testing
INSERT INTO tenants (name, subdomain, schema_name, status) VALUES
('Default Clinic', 'default', 'tenant_default', 'active'),
('Test Clinic', 'test_clinic', 'tenant_test_clinic', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- =============================================
-- INITIAL LICENSING SETUP
-- =============================================

-- License TQ (Transcription Quote) for default tenant
INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, user_limit, seats_used)
SELECT 
  t.id as tenant_id_fk,
  a.id as application_id_fk,
  'active' as status,
  999999 as user_limit,
  0 as seats_used
FROM tenants t, applications a
WHERE t.subdomain = 'default' 
  AND a.slug = 'tq'
ON CONFLICT (tenant_id_fk, application_id_fk) DO NOTHING;

-- License TQ for test clinic (used in automated tests)
INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, user_limit, seats_used)
SELECT
  t.id as tenant_id_fk,
  a.id as application_id_fk,
  'active' as status,
  999999 as user_limit,
  0 as seats_used
FROM tenants t, applications a
WHERE t.subdomain = 'test_clinic' 
  AND a.slug = 'tq'
ON CONFLICT (tenant_id_fk, application_id_fk) DO NOTHING;

-- =============================================
-- SAMPLE ADMIN USER (Development only)
-- =============================================

-- Insert sample admin user for default tenant (password: 1234)
-- Hash generated with bcrypt, salt rounds 12
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  tenant_id_fk,
  tenant_name,
  role, 
  user_type_id_fk, 
  platform_role,
  status
)
SELECT 
  'consultoriasimplia@gmail.com',
  '$2b$12$3UpLycjN/Lsx9rGw0q81V.BLIrXONEE8XO3m7aKMnjQhn9Rq5s6la', -- 1234
  'Admin',
  'User', 
  t.id, -- Primary numeric FK
  t.name, -- Denormalized tenant name
  'admin',
  ut.id,
  'internal_admin',
  'active'
FROM user_types ut, tenants t
WHERE ut.slug = 'admin' AND t.subdomain = 'default'
ON CONFLICT (email) DO NOTHING;

-- Sample manager user for testing
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  tenant_id_fk,
  tenant_name,
  role,
  user_type_id_fk,
  status
)
SELECT 
  'manager@test.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiCS.nQkr4vS', -- admin123
  'Test',
  'Manager',
  t.id, -- Primary numeric FK
  t.name, -- Denormalized tenant name
  'manager',
  ut.id,
  'active'
FROM user_types ut, tenants t
WHERE ut.slug = 'manager' AND t.subdomain = 'default'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- SAMPLE TENANT ADDRESSES
-- =============================================

-- Insert HQ address for default tenant (idempotent)
INSERT INTO tenant_addresses (
  tenant_id_fk,
  type,
  label,
  line1,
  line2,
  city,
  state,
  postal_code,
  country_code,
  is_primary
)
SELECT 
  t.id as tenant_id_fk,
  'HQ' as type,
  'Headquarters São Paulo' as label,
  'Av. Paulista, 1578' as line1,
  'Andar 15, Sala 1503' as line2,
  'São Paulo' as city,
  'SP' as state,
  '01310-200' as postal_code,
  'BR' as country_code,
  true as is_primary
FROM tenants t
WHERE t.subdomain = 'default'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_addresses ta 
    WHERE ta.tenant_id_fk = t.id AND ta.type = 'HQ'
  );

-- =============================================
-- SAMPLE TENANT CONTACTS
-- =============================================

-- Insert admin contact for default tenant (idempotent)
INSERT INTO tenant_contacts (
  tenant_id_fk,
  type,
  full_name,
  email,
  phone,
  title,
  notes,
  is_primary
)
SELECT 
  t.id as tenant_id_fk,
  'ADMIN' as type,
  'João Silva' as full_name,
  'admin@simpliaclinic.com.br' as email,
  '+5511999887766' as phone,
  'Gerente Administrativo' as title,
  'Responsável geral pela administração da clínica' as notes,
  true as is_primary
FROM tenants t
WHERE t.subdomain = 'default'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_contacts tc 
    WHERE tc.tenant_id_fk = t.id AND tc.type = 'ADMIN'
  );

-- Insert billing contact for default tenant (idempotent) - NOT primary since ADMIN is already primary
INSERT INTO tenant_contacts (
  tenant_id_fk,
  type,
  full_name,
  email,
  phone,
  title,
  department,
  notes,
  is_primary
)
SELECT 
  t.id as tenant_id_fk,
  'BILLING' as type,
  'Maria Santos' as full_name,
  'financeiro@simpliaclinic.com.br' as email,
  '+5511988776655' as phone,
  'Coordenadora Financeira' as title,
  'Financeiro' as department,
  'Preferência de contato: email. Horário comercial: 08:00-18:00. Fuso horário: America/Sao_Paulo' as notes,
  false as is_primary
FROM tenants t
WHERE t.subdomain = 'default'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_contacts tc 
    WHERE tc.tenant_id_fk = t.id AND tc.type = 'BILLING'
  );

-- =============================================
-- DATA VALIDATION AND CONSTRAINTS
-- =============================================

-- Legacy tenant_id_fk population removed (numeric-only policy)
-- All tenant references now use numeric tenant_id_fk exclusively

-- Note: Data validation checks will be added in a future migration
-- For now, the FK constraints ensure referential integrity

-- =============================================
-- APPLICATION PRICING MATRIX SEED
-- =============================================

-- Insert default pricing for each application × user type combination
INSERT INTO application_pricing (application_id_fk, user_type_id_fk, price, currency, billing_cycle, valid_from)
SELECT 
  a.id as application_id_fk,
  ut.id as user_type_id_fk,
  CASE 
    WHEN a.slug = 'tq' AND ut.slug = 'operations' THEN 35.00
    WHEN a.slug = 'tq' AND ut.slug = 'manager' THEN 55.00
    WHEN a.slug = 'tq' AND ut.slug = 'admin' THEN 80.00
    WHEN a.slug = 'pm' AND ut.slug = 'operations' THEN 25.00
    WHEN a.slug = 'pm' AND ut.slug = 'manager' THEN 40.00
    WHEN a.slug = 'pm' AND ut.slug = 'admin' THEN 60.00
    WHEN a.slug = 'billing' AND ut.slug = 'operations' THEN 30.00
    WHEN a.slug = 'billing' AND ut.slug = 'manager' THEN 50.00
    WHEN a.slug = 'billing' AND ut.slug = 'admin' THEN 70.00
    WHEN a.slug = 'reports' AND ut.slug = 'operations' THEN 20.00
    WHEN a.slug = 'reports' AND ut.slug = 'manager' THEN 35.00
    WHEN a.slug = 'reports' AND ut.slug = 'admin' THEN 50.00
    ELSE 30.00
  END as price,
  'BRL' as currency,
  'monthly' as billing_cycle,
  NOW() as valid_from
FROM applications a
CROSS JOIN user_types ut
WHERE a.active = TRUE 
  AND ut.active = TRUE
ON CONFLICT (application_id_fk, user_type_id_fk, valid_from) DO NOTHING;

-- Backfill existing grants with pricing snapshots
-- (Skip backfill for now since there are no existing grants in fresh DB)
-- This will be handled by the grant process going forward

-- =============================================
-- SEED DOCUMENTATION
-- =============================================

COMMENT ON TABLE tenants IS 'Seeded with default and test_clinic tenants for development';
COMMENT ON TABLE user_types IS 'Seeded with operations/manager/admin hierarchy';
COMMENT ON TABLE applications IS 'Seeded with tq/pm/billing/reports product catalog';
COMMENT ON TABLE application_pricing IS 'Seeded with pricing matrix for all app × user_type combinations';
COMMENT ON TABLE tenant_applications IS 'Seeded with initial TQ licenses for development tenants';
COMMENT ON TABLE tenant_addresses IS 'Seeded with sample HQ address for default tenant development';
COMMENT ON TABLE tenant_contacts IS 'Seeded with sample admin and billing contacts for default tenant development';