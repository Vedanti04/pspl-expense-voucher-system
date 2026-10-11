-- Expense Voucher Management System Schema
-- Prachay Securities Private Limited (PSPL)

CREATE DATABASE IF NOT EXISTS pspl_expense_vouchers;
USE pspl_expense_vouchers;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee', 'director', 'accounts') NOT NULL,
  department VARCHAR(120) DEFAULT 'Engineering',
  employee_id VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense Vouchers table
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
  INDEX idx_voucher_expense_date (expense_date),
  INDEX idx_voucher_department (department),
  INDEX idx_voucher_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
