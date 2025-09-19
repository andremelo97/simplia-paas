const { Pool } = require('pg');

async function debugPricing() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'simplia_paas_test',
    user: 'simplia',
    password: '1234',
  });

  try {
    console.log('🔍 Debugging pricing configuration...');

    // Check applications
    const apps = await pool.query('SELECT id, name, slug FROM applications WHERE id = 1');
    console.log('📱 Applications:', apps.rows);

    // Check user types
    const userTypes = await pool.query('SELECT * FROM user_types WHERE id = 1');
    console.log('👥 User Types:', userTypes.rows);

    // Check ALL pricing for app 1
    const allPricing = await pool.query(`
      SELECT ap.*, a.name as app_name, ut.name as user_type_name, ut.slug as user_type_slug
      FROM application_pricing ap
      JOIN applications a ON ap.application_id_fk = a.id
      JOIN user_types ut ON ap.user_type_id_fk = ut.id
      WHERE ap.application_id_fk = 1
    `);
    console.log('💰 All Pricing for app 1:', allPricing.rows);

    // Check specific pricing for user_type 1 (operations)
    const pricing = await pool.query(`
      SELECT ap.*, a.name as app_name, ut.*
      FROM application_pricing ap
      JOIN applications a ON ap.application_id_fk = a.id
      JOIN user_types ut ON ap.user_type_id_fk = ut.id
      WHERE ap.application_id_fk = 1 AND ap.user_type_id_fk = 1
    `);
    console.log('💰 Pricing:', pricing.rows);

    // Check with current date
    const now = new Date();
    const currentPricing = await pool.query(`
      SELECT *
      FROM application_pricing
      WHERE application_id_fk = $1
        AND user_type_id_fk = $2
        AND active = TRUE
        AND valid_from <= $3
        AND (valid_to IS NULL OR valid_to > $3)
      ORDER BY valid_from DESC
      LIMIT 1
    `, [1, 1, now]);
    console.log('⏰ Current Pricing Query Result:', currentPricing.rows);
    console.log('📅 Current timestamp:', now);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugPricing();