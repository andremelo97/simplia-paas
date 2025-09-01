-- Migration: Fix admin password hash
-- Description: Updates the admin user password hash to work correctly with bcrypt

-- Update admin password with correct hash for 'admin123'
UPDATE users 
SET password_hash = '$2b$12$3UrVX/pM/rGQ3s1dUaaoyeEeXjC33N1NXxITtp58jQ4DYXpLWmGNa' 
WHERE email = 'admin@simplia.com' AND platform_role = 'internal_admin';

-- Add comment
COMMENT ON TABLE users IS 'User accounts with corrected password hashes';