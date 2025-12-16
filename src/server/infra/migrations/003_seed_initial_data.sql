-- Migration: Seed minimal initial data for LivoCare
-- Description: Seeds only essential data for system operation
-- Includes: user types, applications, default tenant, and admin user

-- =============================================
-- USER TYPES HIERARCHY (Required for system)
-- =============================================

INSERT INTO user_types (name, slug, base_price, description, hierarchy_level) VALUES
('Operations', 'operations', 25.00, 'Basic operational user with limited access to core features', 0),
('Manager', 'manager', 75.00, 'Management level user with elevated permissions', 1),
('Administrator', 'admin', 150.00, 'Full system access with administrative capabilities', 2)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- APPLICATION CATALOG (Required for system)
-- =============================================

INSERT INTO applications (name, slug, description, price_per_user, status, version) VALUES
('Transcription Quote', 'tq', 'Medical transcription quotation system with AI-powered analysis', 50.00, 'active', '1.0.0'),
('Patient Management', 'pm', 'Comprehensive patient records and appointment scheduling', 30.00, 'active', '1.0.0')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- DEFAULT TENANT SETUP (Minimal)
-- =============================================

-- Create default tenant schema
CREATE SCHEMA IF NOT EXISTS tenant_livocare;
COMMENT ON SCHEMA tenant_livocare IS 'LivoCare demo tenant schema for development';

-- Insert default tenant only
INSERT INTO tenants (name, subdomain, schema_name, timezone, status) VALUES
('LivoCare Demo', 'livocare', 'tenant_livocare', 'America/Sao_Paulo', 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- =============================================
-- APPLICATION PRICING MATRIX (Required)
-- =============================================

-- Insert default pricing for each application × user type combination
INSERT INTO application_pricing (application_id_fk, user_type_id_fk, price, currency, billing_cycle, active)
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
    ELSE 30.00
  END as price,
  'BRL' as currency,
  'monthly' as billing_cycle,
  TRUE as active
FROM applications a
CROSS JOIN user_types ut
WHERE a.active = TRUE
  AND ut.active = TRUE;

-- =============================================
-- ADMIN USERS
-- =============================================

-- Insert admin user for default tenant (password: 1234)
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
  'admin@livocare.ai',
  '$2b$12$l26tp49Wuu8h8PuntYj94Oim8YgdacdK2ADMqlggnZMEmHQAg98OW',
  'Admin',
  'LivoCare',
  t.id, -- Primary numeric FK
  t.name, -- Denormalized tenant name
  'admin',
  ut.id,
  'internal_admin',
  'active'
FROM user_types ut, tenants t
WHERE ut.slug = 'admin' AND t.subdomain = 'livocare'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- TRANSCRIPTION PLANS (Required for TQ app)
-- =============================================

-- Insert default transcription plans (Starter, Basic, and VIP)
-- Two strategies available:
--   1. Monolingual (language_detection_enabled=false): Nova-3 with language parameter (pt-BR/en-US) - $0.0043/min
--   2. Multilingual (language_detection_enabled=true): Nova-3 with detect_language=true - $0.0052/min
INSERT INTO public.transcription_plans (slug, name, monthly_minutes_limit, allows_custom_limits, allows_overage, stt_model, language_detection_enabled, cost_per_minute_usd, active, description)
VALUES
  (
    'starter',
    'Starter Plan',
    1200,
    false,
    false,
    'nova-3',
    false,
    0.0043,
    true,
    'Entry-level transcription plan with 1200 minutes (20 hours) monthly quota. Uses Nova-3 Monolingual with language targeting (pt-BR or en-US). Fixed limit, no customization, no overage.'
  ),
  (
    'basic',
    'Basic Plan',
    2400,
    false,
    false,
    'nova-3',
    false,
    0.0043,
    true,
    'Standard transcription plan with 2400 minutes (40 hours) monthly quota. Uses Nova-3 Monolingual with language targeting (pt-BR or en-US). Fixed limit, no customization, no overage.'
  ),
  (
    'vip',
    'VIP Plan',
    2400,
    true,
    true,
    'nova-3',
    false,
    0.0043,
    true,
    'Premium transcription plan with customizable monthly quota. Uses Nova-3 Monolingual with language targeting (pt-BR or en-US). Allows custom limits and overage.'
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DOCUMENTATION
-- =============================================

COMMENT ON TABLE tenants IS 'Seeded with minimal default tenant for clean testing';
COMMENT ON TABLE user_types IS 'Seeded with operations/manager/admin hierarchy';
COMMENT ON TABLE applications IS 'Seeded with tq/pm/billing/reports product catalog';
COMMENT ON TABLE application_pricing IS 'Seeded with pricing matrix for all app × user_type combinations';