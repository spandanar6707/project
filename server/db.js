import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Enterprise MySQL Connection Pool Configuration
 * Designed to handle high concurrency with zero connection leaks
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'campusdocs',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  // High-Concurrency Connection Pooling Settings:
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '25', 10),
  maxIdle: parseInt(process.env.DB_MAX_IDLE || '10', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '200', 10),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Transaction Helper:
 * Guarantees atomic multi-step operations (e.g. creating bulk applications).
 * Automatically handles START TRANSACTION, COMMIT, ROLLBACK, and releases the connection.
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('Error during transaction rollback:', rollbackErr);
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Query Helper with Automatic Connection Lifecycle:
 * Uses pool.query() to borrow, execute, and immediately return connection to pool.
 */
export async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Get Connection Pool Metrics & Health:
 */
export function getPoolMetrics() {
  const poolInternal = pool.pool;
  return {
    totalConnections: poolInternal?._allConnections?.length || 0,
    freeConnections: poolInternal?._freeConnections?.length || 0,
    queueSize: poolInternal?._connectionQueue?.length || 0,
    maxLimit: parseInt(process.env.DB_POOL_LIMIT || '25', 10),
  };
}

/**
 * Connectivity Diagnostics & Verification
 */
export async function testConnection() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const database = process.env.DB_NAME || 'campusdocs';
  const user = process.env.DB_USER || 'root';

  console.log(`Connecting to MySQL database [${database}] on ${host}:${port} as ${user}...`);

  try {
    const connection = await pool.getConnection();
    console.log('✓ Successfully established connection with MySQL database.');

    const [ping] = await connection.query('SELECT 1 + 1 AS ping;');
    console.log('✓ Ping query succeeded:', ping[0]);

    const [tables] = await connection.query('SHOW TABLES;');
    const tableNames = tables.map((t) => Object.values(t)[0]);
    console.log(`✓ Tables found in [${database}] (${tableNames.length}):`, tableNames.join(', '));

    connection.release();
    return {
      connected: true,
      database,
      tables: tableNames,
      metrics: getPoolMetrics(),
    };
  } catch (error) {
    console.error('x Failed to connect to MySQL database:', error.message);
    return {
      connected: false,
      error: error.message,
    };
  }
}

export async function closePool() {
  await pool.end();
}

export default pool;
