-- Migration: Create licensing tables for multi-tenant PaaS
-- Description: Implements ServiceNow/Salesforce-inspired licensing system

-- User types table (secretary < doctor < admin hierarchy)
CREATE TABLE IF NOT EXISTS public.user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0, -- 0=secretary, 1=doctor, 2=admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table (products/modules available)
CREATE TABLE IF NOT EXISTS public.applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_per_user DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, deprecated
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant applications (which apps each tenant has licensed)
CREATE TABLE IF NOT EXISTS public.tenant_applications (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    application_id INTEGER NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, expired
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- NULL for perpetual licenses
    max_users INTEGER, -- NULL for unlimited
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, application_id)
);

-- User application access (granular permissions per user per app)
CREATE TABLE IF NOT EXISTS public.user_application_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    tenant_id VARCHAR(100) NOT NULL,
    role_in_app VARCHAR(50) DEFAULT 'user', -- user, admin, viewer
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES public.users(id),
    expires_at TIMESTAMP, -- NULL for permanent access
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, application_id)
);

-- Access logs for audit trail
CREATE TABLE IF NOT EXISTS public.application_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id),
    tenant_id VARCHAR(100),
    application_id INTEGER REFERENCES public.applications(id),
    access_type VARCHAR(50), -- granted, denied, revoked
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    reason VARCHAR(255), -- why access was denied
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant_id ON public.tenant_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_status ON public.tenant_applications(status);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id ON public.user_application_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_tenant_app ON public.user_application_access(tenant_id, application_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_tenant ON public.application_access_logs(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.application_access_logs(created_at);

-- Update users table to include user_type_id
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type_id INTEGER REFERENCES public.user_types(id);
CREATE INDEX IF NOT EXISTS idx_users_user_type_id ON public.users(user_type_id);