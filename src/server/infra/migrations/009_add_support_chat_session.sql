-- Migration: Add support_chat_session table to all tenant schemas
-- Description: Creates chat history table for the Support AI Agent feature
-- Author: Claude
-- Date: 2026-02-20

DO $migration$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    -- Create support_chat_session table
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.support_chat_session (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id_fk INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        messages JSONB DEFAULT ''[]''::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )', tenant_schema.schema_name);

    -- Create unique index (1 session per user)
    EXECUTE format('
      CREATE UNIQUE INDEX IF NOT EXISTS idx_support_chat_session_user
        ON %I.support_chat_session(user_id_fk)
    ', tenant_schema.schema_name);

    -- Create updated_at trigger (function already exists in tenant schemas)
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_support_chat_session_updated_at ON %I.support_chat_session
    ', tenant_schema.schema_name);

    EXECUTE format('
      CREATE TRIGGER update_support_chat_session_updated_at
        BEFORE UPDATE ON %I.support_chat_session
        FOR EACH ROW
        EXECUTE FUNCTION %I.update_updated_at_column()
    ', tenant_schema.schema_name, tenant_schema.schema_name);

    RAISE NOTICE 'Created support_chat_session table in schema: %', tenant_schema.schema_name;
  END LOOP;
END;
$migration$;
