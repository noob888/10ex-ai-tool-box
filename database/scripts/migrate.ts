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

    // Run tool discovery fields migration
    const toolDiscoveryPath = join(process.cwd(), 'database/migrations/004_add_tool_discovery_fields.sql');
    const toolDiscoverySQL = readFileSync(toolDiscoveryPath, 'utf-8');
    await pool.query(toolDiscoverySQL);
    console.log('✓ Tool discovery fields migration completed');

    // Run topic clustering fields migration
    const topicClusteringPath = join(process.cwd(), 'database/migrations/005_add_topic_clustering_fields.sql');
    const topicClusteringSQL = readFileSync(topicClusteringPath, 'utf-8');
    await pool.query(topicClusteringSQL);
    console.log('✓ Topic clustering fields migration completed');

    // Run tool enrichment fields migration
    const toolEnrichmentPath = join(process.cwd(), 'database/migrations/006_add_tool_faqs_and_usecases.sql');
    const toolEnrichmentSQL = readFileSync(toolEnrichmentPath, 'utf-8');
    await pool.query(toolEnrichmentSQL);
    console.log('✓ Tool enrichment fields migration completed');

    // Run agent events table migration
    const agentEventsPath = join(process.cwd(), 'database/migrations/007_add_agent_events_table.sql');
    const agentEventsSQL = readFileSync(agentEventsPath, 'utf-8');
    await pool.query(agentEventsSQL);
    console.log('✓ Agent events table migration completed');

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

