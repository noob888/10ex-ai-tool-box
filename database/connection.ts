// Database connection utilities - loosely coupled from main app
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse the database URL (handle both postgresql:// and postgresql+asyncpg://)
    const cleanUrl = databaseUrl.replace('postgresql+asyncpg://', 'postgresql://');
    const url = new URL(cleanUrl);
    
    pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: {
        rejectUnauthorized: false // For RDS, you may need to adjust this
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = getDatabasePool();
    const result = await client.query('SELECT NOW()');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

