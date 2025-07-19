import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// Use WebSocket connection for transaction support
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);