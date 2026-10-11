import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pspl_expense_vouchers",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
  decimalNumbers: true
});

/**
 * Initialize database and tables gracefully.
 * Automatically runs schema setup on server startup.
 */
export async function initializeDatabase() {
  // First ensure target database exists
  const tempConnection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  });

  const dbName = process.env.DB_NAME || "pspl_expense_vouchers";
  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempConnection.end();

  // Create Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('employee', 'director', 'accounts') NOT NULL,
      department VARCHAR(120) DEFAULT 'General',
      employee_id VARCHAR(50) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create Vouchers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      voucher_number VARCHAR(50) NOT NULL UNIQUE,
      voucher_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expense_date DATE NOT NULL,
      department VARCHAR(120) NOT NULL,
      expense_title VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      amount DECIMAL(12, 2) NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
      employee_name VARCHAR(120) NOT NULL,
      employee_code VARCHAR(50) DEFAULT NULL,
      employee_signature VARCHAR(255) DEFAULT NULL,
      director_id INT UNSIGNED DEFAULT NULL,
      director_name VARCHAR(120) DEFAULT NULL,
      director_signature VARCHAR(255) DEFAULT NULL,
      status ENUM('Draft', 'Pending Approval', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft',
      approval_date DATETIME DEFAULT NULL,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_vouchers_employee FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_voucher_status (status),
      INDEX idx_voucher_employee (employee_id),
      INDEX idx_voucher_expense_date (expense_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Verify and add optional columns if table already existed without them
  try {
    const [userCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'department'");
    if (userCols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN department VARCHAR(120) DEFAULT 'General'");
    }
  } catch (err) {
    console.warn("Notice checking users.department:", err.message);
  }

  try {
    const [empIdCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'employee_id'");
    if (empIdCols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) DEFAULT NULL");
    }
  } catch (err) {
    console.warn("Notice checking users.employee_id:", err.message);
  }

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM vouchers LIKE 'employee_code'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE vouchers ADD COLUMN employee_code VARCHAR(50) DEFAULT NULL AFTER employee_name");
    }
  } catch (err) {
    console.warn("Notice checking employee_code column:", err.message);
  }

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM vouchers LIKE 'director_id'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE vouchers ADD COLUMN director_id INT UNSIGNED DEFAULT NULL AFTER employee_signature");
    }
    const [nameCols] = await pool.query("SHOW COLUMNS FROM vouchers LIKE 'director_name'");
    if (nameCols.length === 0) {
      await pool.query("ALTER TABLE vouchers ADD COLUMN director_name VARCHAR(120) DEFAULT NULL AFTER director_id");
    }
  } catch (err) {
    console.warn("Notice checking director columns:", err.message);
  }

  console.log("Database initialized successfully.");
}
