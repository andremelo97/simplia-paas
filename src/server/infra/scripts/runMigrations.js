require('dotenv').config();
const fs = require('fs');
const path = require('path');
const database = require('../db/database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations tracking table if it doesn't exist
    await database.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get already executed migrations
    const executedResult = await database.query('SELECT filename FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));
    
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`⏩ Skipping already executed migration: ${file}`);
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by semicolon to handle multiple statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          console.log(`Executing statement ${i + 1}/${statements.length} from ${file}: ${statement.substring(0, 100)}...`);
          await database.query(statement);
        } catch (error) {
          console.error(`Error in statement ${i + 1} from ${file}:`);
          console.error(`Statement: ${statement}`);
          throw error;
        }
      }
      
      // Mark migration as completed
      await database.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      
      console.log(`✓ Completed migration: ${file}`);
    }
    
    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };