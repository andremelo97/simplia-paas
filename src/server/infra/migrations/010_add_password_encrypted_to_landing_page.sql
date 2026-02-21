-- Migration: Add password_encrypted column to landing_page table
-- Description: Stores AES-256-GCM encrypted password alongside bcrypt hash
--              Hash is used for verification, encrypted is used for display/resend
-- Author: Claude
-- Date: 2026-02-21

DO $migration$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    -- Add password_encrypted column if it doesn't exist
    EXECUTE format('
      ALTER TABLE %I.landing_page
        ADD COLUMN IF NOT EXISTS password_encrypted TEXT
    ', tenant_schema.schema_name);

    RAISE NOTICE 'Added password_encrypted to landing_page in schema: %', tenant_schema.schema_name;
  END LOOP;
END;
$migration$;
