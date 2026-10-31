import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MySQL Database Connection Pool configuration using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'campusdocs',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Test connectivity against the configured MySQL database
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
    };
  } catch (error) {
    console.error('x Failed to connect to MySQL database:', error.message);
    return {
      connected: false,
      error: error.message,
    };
  }
}

export default pool;
