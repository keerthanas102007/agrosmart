const mysql = require("mysql2");
require("dotenv").config();

// Use connection POOL instead of single connection.
// Pool auto-reconnects when MySQL drops idle connections —
// fixes "Can't add new command when connection is in closed state" error.
const pool = mysql.createPool({
  host:              process.env.DB_HOST,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  port:              process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes("railway.app")
    ? { rejectUnauthorized: false }
    : undefined,
});

// Test on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Connection Error:", err.message);
    console.error("👉 Fix: Open XAMPP Control Panel → Start MySQL");
  } else {
    console.log("✅ MySQL Connected Successfully");
    connection.release();
  }
});

module.exports = pool;
