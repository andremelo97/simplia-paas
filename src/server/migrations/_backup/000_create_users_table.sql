-- Migration: Create users table
-- Description: Base users table for multi-tenant authentication system

-- Users table (stored in public schema for cross-tenant authentication)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    tenant_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);