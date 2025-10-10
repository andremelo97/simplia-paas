const { Pool } = require('pg');

class Database {
  constructor() {
    this.config = {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: String(process.env.DATABASE_PASSWORD),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(this.config);
    this.setupPoolEvents();
  }

  setupPoolEvents() {
    this.pool.on('connect', async (client) => {
      // Force UTC timezone for ALL connections to ensure data integrity
      // This guarantees timestamps are stored in UTC regardless of server timezone
      await client.query("SET TIME ZONE 'UTC'");
      console.log('Database client connected with UTC timezone');
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  async getClient() {
    return await this.pool.connect();
  }

  async query(text, params = []) {
    const start = Date.now();
    const client = await this.getClient();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executed', { text, duration, rows: result.rowCount });
      return result;
    } finally {
      client.release();
    }
  }

  async withTenant(tenantContext, callback) {
    const client = await this.getClient();
    
    try {
      // Set search path to tenant schema, falling back to public
      await client.query(`SET search_path TO ${tenantContext.schema}, public`);
      console.log(`Switched to tenant schema: ${tenantContext.schema}`);
      
      return await callback(client);
    } finally {
      // Reset search path to default
      await client.query('SET search_path TO public');
      client.release();
    }
  }

  async queryWithTenant(tenantContext, text, params = []) {
    return this.withTenant(tenantContext, async (client) => {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      console.log('Tenant query executed', {
        tenant: tenantContext.tenantId,
        schema: tenantContext.schema,
        text,
        duration,
        rows: result.rowCount
      });
      return result;
    });
  }

  /**
   * Creates an empty tenant schema (no app-specific tables)
   *
   * This function only creates the PostgreSQL schema itself.
   * App-specific tables (like TQ's patient/session) should be created
   * separately through their respective provisioner modules when
   * the app is activated for the tenant.
   *
   * @param {string} schemaName - The schema name (e.g., 'tenant_clinic_a')
   */
  async createSchema(schemaName) {
    const client = await this.getClient();

    try {
      // Create schema if it doesn't exist - that's all we do here
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      console.log(`Empty tenant schema created: ${schemaName}`);
    } finally {
      client.release();
    }
  }

  async schemaExists(schemaName) {
    const result = await this.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    );
    return result.rows.length > 0;
  }

  async close() {
    await this.pool.end();
    console.log('Database pool closed');
  }

  getPool() {
    return this.pool;
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;