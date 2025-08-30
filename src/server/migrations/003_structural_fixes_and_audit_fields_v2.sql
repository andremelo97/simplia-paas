-- Migration: Correções estruturais críticas + campos de auditoria (v2)
-- Description: Implementa tabela tenants, campos de auditoria completos, correções estruturais

-- Criar tabela tenants (se não existir)
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

-- Inserir tenant padrão
INSERT INTO tenants (name, subdomain, schema_name) 
VALUES ('Default Tenant', 'default', 'public')
ON CONFLICT (subdomain) DO NOTHING;

-- Atualizar applications com slugs padronizados
UPDATE applications SET slug = 'tq' WHERE name = 'Transcription Quote';
UPDATE applications SET slug = 'pm' WHERE name = 'Patient Management';
UPDATE applications SET slug = 'billing' WHERE name = 'Billing System';
UPDATE applications SET slug = 'reports' WHERE name = 'Reporting Dashboard';

-- Completar tenant_applications com campos de controle
ALTER TABLE tenant_applications 
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS user_limit INTEGER DEFAULT 999999,
ADD COLUMN IF NOT EXISTS seats_used INTEGER DEFAULT 0;

-- Atualizar tenant_applications para referenciar tenants corretamente
ALTER TABLE tenant_applications ADD COLUMN IF NOT EXISTS tenant_id_fk INTEGER;

-- Popular tenant_id_fk baseado no tenant_id VARCHAR existente
UPDATE tenant_applications 
SET tenant_id_fk = (SELECT id FROM tenants WHERE subdomain = tenant_applications.tenant_id)
WHERE tenant_id_fk IS NULL;

-- Melhorar application_access_logs com contexto completo
ALTER TABLE application_access_logs
ADD COLUMN IF NOT EXISTS tenant_id_fk INTEGER,
ADD COLUMN IF NOT EXISTS decision VARCHAR(20) NOT NULL DEFAULT 'granted',
ADD COLUMN IF NOT EXISTS reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS api_path VARCHAR(500);

-- Adicionar campos de auditoria em todas as tabelas
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_types ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tenant_applications ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_application_access ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Índices essenciais para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON users(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_users_email_tenant ON users(email, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_status ON tenant_applications(tenant_id_fk, status);
CREATE INDEX IF NOT EXISTS idx_user_application_access_user_app ON user_application_access(user_id, application_id, active);
CREATE INDEX IF NOT EXISTS idx_application_access_logs_tenant_date ON application_access_logs(tenant_id_fk, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_slug ON applications(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);