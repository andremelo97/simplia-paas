-- Migration: Seed minimal initial data for LivoCare
-- Description: Seeds only essential data for system operation
-- Includes: user types, applications, default tenant, and admin user

-- =============================================
-- USER TYPES HIERARCHY (Required for system)
-- License prices: Operations R$10, Manager R$20, Admin R$50
-- =============================================

INSERT INTO user_types (name, slug, base_price, description, hierarchy_level) VALUES
('Operations', 'operations', 10.00, 'Basic operational user with limited access to core features', 0),
('Manager', 'manager', 20.00, 'Management level user with elevated permissions', 1),
('Administrator', 'admin', 50.00, 'Full system access with administrative capabilities', 2)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- APPLICATION CATALOG (Required for system)
-- Only TQ app for now
-- =============================================

INSERT INTO applications (name, slug, description, price_per_user, status, version) VALUES
('Transcription Quote', 'tq', 'Medical transcription quotation system with AI-powered analysis', 50.00, 'active', '1.0.0')
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
-- TQ License prices: Operations R$10, Manager R$20, Admin R$50
-- =============================================

-- Insert default pricing for TQ × user type combination
INSERT INTO application_pricing (application_id_fk, user_type_id_fk, price, currency, billing_cycle, active)
SELECT
  a.id as application_id_fk,
  ut.id as user_type_id_fk,
  CASE
    WHEN ut.slug = 'operations' THEN 10.00
    WHEN ut.slug = 'manager' THEN 20.00
    WHEN ut.slug = 'admin' THEN 50.00
    ELSE 10.00
  END as price,
  'BRL' as currency,
  'monthly' as billing_cycle,
  TRUE as active
FROM applications a
CROSS JOIN user_types ut
WHERE a.slug = 'tq'
  AND a.active = TRUE
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

-- TQ Pricing Plans (Validation Phase - Single Plan):
--   Trial: 20h/7dias (Grátis) - 1 Admin - Free trial, no credit card
--   Early Access: 60h/mês (R$ 119) - 1 Admin, multilingual, allows overage
--
-- Transcription strategy:
--   Multilingual (language_detection_enabled=true): Nova-3 with detect_language=true - $0.0052/min
INSERT INTO public.transcription_plans (slug, name, monthly_minutes_limit, allows_custom_limits, allows_overage, stt_model, language_detection_enabled, cost_per_minute_usd, is_trial, trial_days, show_cost, active, description)
VALUES
  (
    'trial',
    'Trial',
    1200,
    false,
    false,
    'nova-3',
    true,
    0.0052,
    true,
    7,
    false,
    true,
    '• 20 horas de transcrição (durante 7 dias)
• 1 licença Admin inclusa
• Transcrição multilíngue (PT-BR e EN-US)
• Acesso a todas as funcionalidades
• Sem cartão de crédito
• Sem compromisso'
  ),
  (
    'early-access',
    'Early Access',
    3600,
    false,
    true,
    'nova-3',
    true,
    0.0052,
    false,
    NULL,
    false,
    true,
    '• 60 horas de transcrição/mês (~3h/dia)
• 1 licença Admin inclusa
• Transcrição multilíngue (PT-BR e EN-US)
• Suporte completo (criação/alteração de templates)
• Permite exceder limite mensal
• Cancelamento a qualquer momento'
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DOCUMENTATION
-- =============================================

COMMENT ON TABLE tenants IS 'Seeded with minimal default tenant for clean testing';
COMMENT ON TABLE user_types IS 'Seeded with operations (R$10) / manager (R$20) / admin (R$50) hierarchy';
COMMENT ON TABLE applications IS 'Seeded with TQ app only';
COMMENT ON TABLE application_pricing IS 'Seeded with TQ pricing matrix for all user_type combinations';
COMMENT ON TABLE transcription_plans IS 'Seeded with Trial (20h/7dias) and Early Access (60h/mês R$119) plans';