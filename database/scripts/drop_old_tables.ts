// Script to drop old unprefixed tables
import { config } from 'dotenv';
import { join } from 'path';
import { readFileSync } from 'fs';
import { getDatabasePool, closeDatabasePool } from '../connection';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

async function dropOldTables() {
  console.log('Dropping old unprefixed tables...');
  const pool = getDatabasePool();

  try {
    // Read and execute drop script
    const dropScript = readFileSync(join(process.cwd(), 'database/scripts/drop_old_tables.sql'), 'utf-8');
    await pool.query(dropScript);
    console.log('Old tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping old tables:', error);
    throw error;
  } finally {
    await closeDatabasePool();
  }
}

// Run if called directly
dropOldTables()
  .then(() => {
    console.log('Drop completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Drop failed:', error);
    process.exit(1);
  });

