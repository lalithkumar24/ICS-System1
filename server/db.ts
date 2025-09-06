import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import "dotenv/config"; 

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool for local PostgreSQL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection options for local development
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 10, // Maximum number of connections
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Use node-postgres driver instead of Neon serverless
export const db = drizzle(pool, { schema });

// Test database connection
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now');
    console.log('✅ Database connection successful at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
