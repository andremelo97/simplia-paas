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

    // Create quote table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
        content TEXT,
        total NUMERIC(12, 2) DEFAULT 0.00,
        status quote_status_enum NOT NULL DEFAULT 'draft'
      )
    `);

    // Create quote_item table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote_item (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '${timeZone}'),
        quote_id UUID NOT NULL REFERENCES quote(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        base_price NUMERIC(10, 2) NOT NULL,
        discount_amount NUMERIC(10, 2) DEFAULT 0.00,
        final_price NUMERIC(10, 2) NOT NULL,
        quantity INTEGER DEFAULT 1
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
      CREATE INDEX IF NOT EXISTS idx_quote_item_quote_id ON quote_item(quote_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quote_item_created_at ON quote_item(created_at)
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
      DROP TRIGGER IF EXISTS update_quote_item_updated_at ON quote_item
    `);

    await client.query(`
      CREATE TRIGGER update_quote_item_updated_at
        BEFORE UPDATE ON quote_item
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
        AND table_name IN ('patient', 'transcription', 'session', 'quote', 'quote_item')
    `, [schema]);

    return parseInt(result.rows[0].table_count) === 5;
  } catch (error) {
    console.error(`Error checking TQ app provisioning status for ${schema}:`, error);
    return false;
  }
}

module.exports = {
  provisionTQAppSchema,
  isTQAppProvisioned
};