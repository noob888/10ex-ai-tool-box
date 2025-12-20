// Database migration script
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { getDatabasePool, closeDatabasePool } from '../connection';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

async function runMigrations() {
  console.log('Running database migrations...');
  const pool = getDatabasePool();

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'database/migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await pool.query(migrationSQL);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await closeDatabasePool();
  }
}

// Run if called directly
runMigrations()
  .then(() => {
    console.log('Migrations completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migrations failed:', error);
    process.exit(1);
  });

export { runMigrations };

