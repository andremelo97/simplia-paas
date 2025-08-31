-- Migration: Fix default tenant schema and create tenant_default schema
-- Description: Corrects the default tenant to use tenant_default schema instead of public

-- Create the tenant_default schema
CREATE SCHEMA IF NOT EXISTS tenant_default;

-- Update the default tenant to use proper schema name
UPDATE tenants 
SET schema_name = 'tenant_default' 
WHERE subdomain = 'default' AND schema_name = 'public';

-- Add comment
COMMENT ON SCHEMA tenant_default IS 'Default tenant schema for development and admin panel testing';