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
    // Run initial schema migration
    const initialMigrationPath = join(process.cwd(), 'database/migrations/001_initial_schema.sql');
    const initialMigrationSQL = readFileSync(initialMigrationPath, 'utf-8');
    await pool.query(initialMigrationSQL);
    console.log('✓ Initial schema migration completed');

    // Run news table migration
    const newsMigrationPath = join(process.cwd(), 'database/migrations/002_add_news_table.sql');
    const newsMigrationSQL = readFileSync(newsMigrationPath, 'utf-8');
    await pool.query(newsMigrationSQL);
    console.log('✓ News table migration completed');

    // Run SEO pages table migration
    const seoPagesPath = join(process.cwd(), 'database/migrations/003_add_seo_pages_table.sql');
    const seoPagesSQL = readFileSync(seoPagesPath, 'utf-8');
    await pool.query(seoPagesSQL);
    console.log('✓ SEO pages table migration completed');

    console.log('All migrations completed successfully!');
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

