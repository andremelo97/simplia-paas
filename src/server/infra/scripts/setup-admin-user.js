require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function setupAdminUser() {
  // Use production database by default, test database if specified
  const database = process.env.SETUP_TEST_DB ? 
    (process.env.TEST_DATABASE_NAME || 'livocare_test') :
    (process.env.DATABASE_NAME || 'livocare');
    
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: database,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    // Verificar se o usuário admin já existe
    const existingUser = await pool.query(
      'SELECT id, platform_role FROM users WHERE email = $1',
      ['admin@livocare.ai']
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      
      // Se já tem platform_role, não precisa fazer nada
      if (user.platform_role === 'internal_admin') {
        console.log('✓ Admin user already exists with internal_admin role');
        return;
      }
      
      // Atualizar usuário existente para ter platform_role
      await pool.query(
        'UPDATE users SET platform_role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['internal_admin', user.id]
      );
      
      console.log('✓ Updated existing user with internal_admin platform role');
      console.log('  Email: admin@livocare.ai');
      return;
    }
    
    // Verificar se existe o tenant default
    const defaultTenant = await pool.query(
      'SELECT subdomain FROM tenants WHERE subdomain = $1',
      ['default']
    );
    
    if (defaultTenant.rows.length === 0) {
      console.log('⚠️  Default tenant not found, creating...');
      await pool.query(`
        INSERT INTO tenants (name, subdomain, schema_name)
        VALUES ('Default Tenant', 'default', 'tenant_default')
      `);
    }

    // Criar schema do tenant default se não existir
    await pool.query('CREATE SCHEMA IF NOT EXISTS tenant_default');
    
    // Hash da senha '1234'
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash('1234', saltRounds);
    
    // Inserir o usuário admin
    await pool.query(`
      INSERT INTO users (
        email, 
        password_hash, 
        first_name,
        last_name,
        role, 
        tenant_id,
        platform_role,
        active,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, [
      'admin@livocare.ai',
      hashedPassword,
      'Admin',
      'User',
      'admin',
      'default',
      'internal_admin',
      true
    ]);
    
    console.log('✓ Admin user created successfully');
    console.log('  Email: admin@livocare.ai');
    console.log('  Password: 1234');
    
  } catch (error) {
    // Se o erro é que o usuário já existe, ignore
    if (error.code === '23505') {
      console.log('✓ Admin user already exists');
      return;
    }
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupAdminUser();
}

module.exports = { setupAdminUser };