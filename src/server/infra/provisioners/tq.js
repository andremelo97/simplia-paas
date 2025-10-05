/**
 * Transcription & Quote (TQ) App Schema Provisioner
 *
 * This module contains the schema provisioning logic for the TQ application.
 * It creates patient and session tables within a tenant's schema when the TQ app
 * is activated for that tenant.
 *
 * IMPORTANT: This provisioner should only be called when a tenant activates
 * the TQ application, NOT during initial tenant schema creation.
 */

/**
 * Provisions TQ app-specific tables within a tenant schema
 *
 * Creates patient and session tables with:
 * - UUID primary keys for security
 * - Tenant timezone-aware timestamps
 * - Minimal essential fields only
 * - Proper indexes and constraints
 * - Automatic timestamp triggers
 *
 * @param {Object} client - PostgreSQL client connection
 * @param {string} schema - Tenant schema name (e.g., 'tenant_clinic_a')
 * @param {string} timeZone - Tenant timezone (e.g., 'America/Sao_Paulo')
 * @throws {Error} If provisioning fails
 */
async function provisionTQAppSchema(client, schema, timeZone = 'UTC') {
  try {
    await client.query('BEGIN');

    // Switch to the tenant schema for table creation
    await client.query(`SET LOCAL search_path TO ${schema}, public`);

    // Create patient table with essential fields only
    await client.query(`
      CREATE TABLE IF NOT EXISTS patient (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        notes TEXT
      )
    `);

    // Create transcript_status_enum if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transcript_status_enum') THEN
          CREATE TYPE transcript_status_enum AS ENUM ('created','uploading','uploaded','processing','completed','failed');
        END IF;
      END$$;
    `);

    // Create session_status_enum if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status_enum') THEN
          CREATE TYPE session_status_enum AS ENUM ('draft','pending','completed','cancelled');
        END IF;
      END$$;
    `);

    // Create quote_status_enum if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status_enum') THEN
          CREATE TYPE quote_status_enum AS ENUM ('draft','sent','approved','rejected','expired');
        END IF;
      END$$;
    `);

    // Create transcription table for audio processing
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcription (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        audio_url TEXT,
        transcript_status transcript_status_enum NOT NULL DEFAULT 'created',
        deepgram_request_id TEXT,
        confidence_score NUMERIC(5,4),
        processing_duration_seconds INTEGER,
        word_timestamps JSONB,
        transcript TEXT
      )
    `);

    // Create session number sequence for unique incremental numbers
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS session_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MAXVALUE
      CACHE 1
    `);

    // Create quote number sequence for unique incremental numbers
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS quote_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MAXVALUE
      CACHE 1
    `);

    // Create clinical report number sequence for unique incremental numbers
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS clinical_report_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MAXVALUE
      CACHE 1
    `);

    // Create session table (simplified, references transcription)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        number VARCHAR(10) NOT NULL UNIQUE DEFAULT ('SES' || LPAD(nextval('session_number_seq')::text, 6, '0')),
        patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
        transcription_id UUID REFERENCES transcription(id) ON DELETE SET NULL,
        status session_status_enum NOT NULL DEFAULT 'draft'
      )
    `);

    // Create item table (products/services catalog)
    await client.query(`
      CREATE TABLE IF NOT EXISTS item (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        name TEXT NOT NULL,
        description TEXT,
        base_price NUMERIC(10, 2) NOT NULL,
        active BOOLEAN DEFAULT true
      )
    `);

    // Create quote table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        number VARCHAR(10) NOT NULL UNIQUE DEFAULT ('QUO' || LPAD(nextval('quote_number_seq')::text, 6, '0')),
        session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
        content TEXT,
        total NUMERIC(12, 2) DEFAULT 0.00,
        status quote_status_enum NOT NULL DEFAULT 'draft'
      )
    `);

    // Create quote_item table (relationship between quotes and items)
    // name and base_price are copied from item at creation time and become independent
    // This allows users to edit prices in quotes without affecting the catalog
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote_item (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        quote_id UUID NOT NULL REFERENCES quote(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        base_price NUMERIC(10, 2) NOT NULL,
        quantity INTEGER DEFAULT 1,
        discount_amount NUMERIC(10, 2) DEFAULT 0.00,
        final_price NUMERIC(10, 2) NOT NULL
      )
    `);

    // Create template table for AI template filling
    await client.query(`
      CREATE TABLE IF NOT EXISTS template (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0
      )
    `);

    // Create clinical_report table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical_report (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        number VARCHAR(10) NOT NULL UNIQUE DEFAULT ('CLR' || LPAD(nextval('clinical_report_number_seq')::text, 6, '0')),
        session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
        content TEXT NOT NULL
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_patient_email ON patient(email)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_patient_created_at ON patient(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transcription_created_at ON transcription(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transcription_status ON transcription(transcript_status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transcription_deepgram_id ON transcription(deepgram_request_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_patient_id ON session(patient_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_transcription_id ON session(transcription_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_created_at ON session(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_status ON session(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_number ON session(number)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_session_id ON quote(session_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_created_at ON quote(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_status ON quote(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_item_name ON item(name)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_item_active ON item(active)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_item_created_at ON item(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_item_quote_id ON quote_item(quote_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_item_item_id ON quote_item(item_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_item_created_at ON quote_item(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_number ON quote(number)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_template_title ON template(title)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_template_active ON template(active)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_template_created_at ON template(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clinical_report_session_id ON clinical_report(session_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clinical_report_created_at ON clinical_report(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clinical_report_number ON clinical_report(number)
    `);

    // Create update triggers for updated_at timestamps
    // Note: Function will be created in public schema if it doesn't exist
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = (now() AT TIME ZONE '${timeZone}');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_patient_updated_at ON patient
    `);

    await client.query(`
      CREATE TRIGGER update_patient_updated_at
        BEFORE UPDATE ON patient
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_transcription_updated_at ON transcription
    `);

    await client.query(`
      CREATE TRIGGER update_transcription_updated_at
        BEFORE UPDATE ON transcription
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_session_updated_at ON session
    `);

    await client.query(`
      CREATE TRIGGER update_session_updated_at
        BEFORE UPDATE ON session
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_quote_updated_at ON quote
    `);

    await client.query(`
      CREATE TRIGGER update_quote_updated_at
        BEFORE UPDATE ON quote
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_item_updated_at ON item
    `);

    await client.query(`
      CREATE TRIGGER update_item_updated_at
        BEFORE UPDATE ON item
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_quote_item_updated_at ON quote_item
    `);

    await client.query(`
      CREATE TRIGGER update_quote_item_updated_at
        BEFORE UPDATE ON quote_item
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_template_updated_at ON template
    `);

    await client.query(`
      CREATE TRIGGER update_template_updated_at
        BEFORE UPDATE ON template
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_clinical_report_updated_at ON clinical_report
    `);

    await client.query(`
      CREATE TRIGGER update_clinical_report_updated_at
        BEFORE UPDATE ON clinical_report
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Create public_quote_template table for reusable Puck layouts
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_quote_template (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        content JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_public_quote_template_default
        ON public_quote_template(is_default)
        WHERE is_default = true
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_quote_template_active
        ON public_quote_template(active)
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_public_quote_template_updated_at ON public_quote_template
    `);

    await client.query(`
      CREATE TRIGGER update_public_quote_template_updated_at
        BEFORE UPDATE ON public_quote_template
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Create public_quote table for external quote sharing instances
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_quote (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        quote_id UUID NOT NULL REFERENCES quote(id) ON DELETE CASCADE,
        template_id UUID REFERENCES public_quote_template(id) ON DELETE SET NULL,
        access_token VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        views_count INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMPTZ,
        active BOOLEAN DEFAULT true,
        expires_at TIMESTAMPTZ DEFAULT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_quote_access_token ON public_quote(access_token)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_quote_quote_id ON public_quote(quote_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_quote_template_id ON public_quote(template_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_quote_active ON public_quote(active)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_quote_expires_at ON public_quote(expires_at)
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_public_quote_updated_at ON public_quote
    `);

    await client.query(`
      CREATE TRIGGER update_public_quote_updated_at
        BEFORE UPDATE ON public_quote
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query('COMMIT');
    console.log(`TQ app schema provisioned successfully for tenant schema: ${schema}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to provision TQ app schema for ${schema}:`, error);
    throw error;
  }
}

/**
 * Checks if TQ app tables already exist in the tenant schema
 *
 * @param {Object} client - PostgreSQL client connection
 * @param {string} schema - Tenant schema name
 * @returns {boolean} True if TQ tables exist, false otherwise
 */
async function isTQAppProvisioned(client, schema) {
  try {
    const result = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name IN ('patient', 'transcription', 'session', 'item', 'quote', 'quote_item', 'template', 'clinical_report', 'public_quote')
    `, [schema]);

    return parseInt(result.rows[0].table_count) === 9;
  } catch (error) {
    console.error(`Error checking TQ app provisioning status for ${schema}:`, error);
    return false;
  }
}

module.exports = {
  provisionTQAppSchema,
  isTQAppProvisioned
};