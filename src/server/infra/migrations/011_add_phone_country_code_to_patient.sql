-- Migration: Add phone_country_code column to patient table in all tenant schemas
-- Description: Stores the phone country code (default '55' for Brazil) to support multi-country WhatsApp links
-- Author: Claude
-- Date: 2026-02-21

DO $migration$
DECLARE
  tenant_schema RECORD;
  table_exists BOOLEAN;
BEGIN
  FOR tenant_schema IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    -- Check if patient table exists in this schema
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema.schema_name
        AND table_name = 'patient'
    ) INTO table_exists;

    IF table_exists THEN
      EXECUTE format('
        ALTER TABLE %I.patient
          ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT ''55''
      ', tenant_schema.schema_name);

      RAISE NOTICE 'Added phone_country_code to patient in schema: %', tenant_schema.schema_name;
    ELSE
      RAISE NOTICE 'Skipping schema % — patient table does not exist', tenant_schema.schema_name;
    END IF;
  END LOOP;
END;
$migration$;
