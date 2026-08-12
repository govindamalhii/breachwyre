const mysql = require('mysql2/promise');

/**
 * MySQL Database Connection Pool Configuration
 * Using mysql2/promise to support async/await patterns out of the box.
 *
 * SSL Support: When DB_SSL=true is set (required for cloud providers like Aiven),
 * TLS is enabled automatically. rejectUnauthorized:false allows self-signed
 * CA certificates used by managed cloud MySQL services.
 */

// Build SSL config — enabled for cloud providers (Aiven, PlanetScale, etc.)
const sslConfig = process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false;

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'breachwyre_db',
    port:     parseInt(process.env.DB_PORT || '3306', 10),

    // SSL — required for Aiven, Railway, and most cloud MySQL providers
    ssl: sslConfig,

    // Pool configuration
    waitForConnections: true,
    connectionLimit:    10,    // Max concurrent DB connections
    queueLimit:         0,     // No limit on queued connection requests
    connectTimeout:     30000, // 30s timeout for cloud connections (higher latency)
});

/**
 * Test connection on startup — logs success or failure without crashing.
 * Called from server.js during initialization.
 */
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('[DB] ✅ MySQL connected successfully to:', process.env.DB_HOST || 'localhost');
        conn.release();
    } catch (err) {
        console.error('[DB] ❌ MySQL connection failed:', err.message);
        console.error('[DB] Check your DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, and DB_SSL env vars.');
    }
}

module.exports = { pool, testConnection };
