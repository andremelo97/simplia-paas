-- Migration: Add platform role for internal admin access
-- Description: Adds platform_role column for Simplia internal team access control

-- Add platform_role column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS platform_role VARCHAR(50) NULL;

-- Create index for platform role queries
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role);

-- Seed initial admin user with platform role (optional - for development)
-- UPDATE users 
-- SET platform_role = 'internal_admin' 
-- WHERE email = 'admin@simplia.com';

-- Add comment for documentation
COMMENT ON COLUMN users.platform_role IS 'Platform role for Simplia internal team: internal_admin, support, etc.';