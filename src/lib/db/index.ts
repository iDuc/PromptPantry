import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Connection for queries with better pooling settings for Supabase
const client = postgres(connectionString, {
  prepare: false,
  // Connection pool settings
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Retry on connection errors
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

export * from './schema';
