import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pspl_expense_vouchers",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: false,
  decimalNumbers: true
});

export async function initializeDatabase() {
  // DB_NAME must exist first; this creates the application's tables.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('employee','director','accounts') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      voucher_number VARCHAR(40) NOT NULL UNIQUE,
      voucher_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expense_date DATE NOT NULL,
      department VARCHAR(120) NOT NULL,
      expense_title VARCHAR(180) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      amount DECIMAL(12,2) NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
      employee_name VARCHAR(120) NOT NULL,
      employee_signature VARCHAR(255) DEFAULT NULL,
      director_signature VARCHAR(255) DEFAULT NULL,
      status ENUM('Draft','Pending Approval','Approved','Rejected') NOT NULL DEFAULT 'Draft',
      approval_date DATETIME DEFAULT NULL,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_voucher_employee FOREIGN KEY (employee_id) REFERENCES users(id),
      INDEX idx_voucher_status (status),
      INDEX idx_voucher_employee (employee_id),
      INDEX idx_voucher_expense_date (expense_date)
    ) ENGINE=InnoDB
  `);
}
