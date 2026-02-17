require('dotenv').config();
const fs = require('fs');
const path = require('path');
const database = require('../db/database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Force UTC timezone for ALL migrations (industry standard)
    await database.query("SET TIME ZONE 'UTC'");
    console.log('✓ Database timezone set to UTC');

    // Create migrations tracking table if it doesn't exist
    await database.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')
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
      // Respects dollar-quoted strings ($tag$...$tag$) and single-quoted strings ('...')
      const statements = [];
      let currentStatement = '';
      let insideDollarQuote = false;
      let dollarQuoteTag = null;
      let insideSingleQuote = false;

      for (let i = 0; i < migrationSQL.length; i++) {
        const char = migrationSQL[i];
        currentStatement += char;

        // Track single-quoted strings (handle '' escape for literal single quotes)
        if (char === "'" && !insideDollarQuote) {
          if (insideSingleQuote) {
            // Check if this is an escaped quote ('') — if next char is also ', stay inside
            if (i + 1 < migrationSQL.length && migrationSQL[i + 1] === "'") {
              currentStatement += "'";
              i++; // Skip the escaped quote
              continue;
            }
            insideSingleQuote = false;
          } else {
            insideSingleQuote = true;
          }
          continue;
        }

        // Detect dollar-quote start/end (e.g., $tag$ or $$)
        if (char === '$' && !insideSingleQuote) {
          let tag = '$';
          let j = i + 1;

          // Extract tag between dollar signs (e.g., $auto_branding$)
          while (j < migrationSQL.length && migrationSQL[j] !== '$') {
            tag += migrationSQL[j];
            j++;
          }

          if (j < migrationSQL.length && migrationSQL[j] === '$') {
            tag += '$'; // Complete tag

            if (!insideDollarQuote) {
              // Starting a dollar-quoted string
              insideDollarQuote = true;
              dollarQuoteTag = tag;
              currentStatement += tag.substring(1); // Already added first $
              i = j; // Skip to end of tag
            } else if (tag === dollarQuoteTag) {
              // Ending the dollar-quoted string
              insideDollarQuote = false;
              dollarQuoteTag = null;
              currentStatement += tag.substring(1); // Already added first $
              i = j; // Skip to end of tag
            }
          }
        }

        // Only split on semicolon if we're NOT inside any quoted string
        if (char === ';' && !insideDollarQuote && !insideSingleQuote) {
          const stmt = currentStatement.trim();
          if (stmt.length > 0) {
            statements.push(stmt);
          }
          currentStatement = '';
        }
      }

      // Add any remaining statement
      const finalStmt = currentStatement.trim();
      if (finalStmt.length > 0) {
        statements.push(finalStmt);
      }
      
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