-- Migration: Fix admin password hash
-- Description: Updates the admin user password hash to work correctly with bcrypt

-- Update admin password with correct hash for '1234'
UPDATE users 
SET password_hash = '$2b$12$3UpLycjN/Lsx9rGw0q81V.BLIrXONEE8XO3m7aKMnjQhn9Rq5s6la' 
WHERE email = 'consultoriasimplia@gmail.com' AND platform_role = 'internal_admin';

-- Add comment
COMMENT ON TABLE users IS 'User accounts with corrected password hashes';