import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool, initializeDatabase } from "./src/config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  console.log("Seeding database with demo users and realistic vouchers...");
  await initializeDatabase();

  // Create a sample SVG/PNG placeholder signature if not present
  const sigDir = path.join(__dirname, "uploads", "signatures");
  fs.mkdirSync(sigDir, { recursive: true });

  const sampleSigPath = path.join(sigDir, "sample-sig.png");
  if (!fs.existsSync(sampleSigPath)) {
    // 1x1 transparent PNG fallback buffer
    const dummyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    fs.writeFileSync(sampleSigPath, dummyPng);
  }

  // 1. Seed Users
  const users = [
    {
      name: "Aarav Sharma",
      email: "employee@pspl.demo",
      password: "Employee123!",
      role: "employee",
      department: "Engineering",
      employee_id: "EMP-1042"
    },
    {
      name: "Neha Patel",
      email: "employee2@pspl.demo",
      password: "Employee123!",
      role: "employee",
      department: "Marketing",
      employee_id: "EMP-1088"
    },
    {
      name: "Vikram Malhotra",
      email: "director@pspl.demo",
      password: "Director123!",
      role: "director",
      department: "Executive Board",
      employee_id: "DIR-0001"
    },
    {
      name: "Priya Sundaram",
      email: "accounts@pspl.demo",
      password: "Accounts123!",
      role: "accounts",
      department: "Finance & Accounts",
      employee_id: "ACC-2005"
    }
  ];

  const userIds = {};

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, employee_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         department = VALUES(department),
         employee_id = VALUES(employee_id)`,
      [u.name, u.email, passwordHash, u.role, u.department, u.employee_id]
    );

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [u.email]);
    userIds[u.email] = rows[0].id;
  }

  console.log("Demo user accounts verified:");
  console.log(" - Employee: employee@pspl.demo / Employee123!");
  console.log(" - Employee 2: employee2@pspl.demo / Employee123!");
  console.log(" - Director: director@pspl.demo / Director123!");
  console.log(" - Accounts: accounts@pspl.demo / Accounts123!");

  // 2. Clear existing demo vouchers if needed or keep existing
  const [existingVouchers] = await pool.query("SELECT COUNT(*) AS total FROM vouchers");
  if (existingVouchers[0].total === 0) {
    console.log("Populating initial realistic vouchers across all lifecycle states...");
    const emp1Id = userIds["employee@pspl.demo"];
    const dirId = userIds["director@pspl.demo"];

    const sampleVouchers = [
      {
        voucher_number: "PSPL-2026-00001",
        expense_date: "2026-04-10",
        department: "Engineering",
        expense_title: "Cloud Infrastructure & Benchmark Servers",
        category: "Software & IT",
        description: "Monthly compute charges for high-performance test clustering.",
        amount: 14500.00,
        employee_id: emp1Id,
        employee_name: "Aarav Sharma",
        employee_code: "EMP-1042",
        employee_signature: "/uploads/signatures/sample-sig.png",
        director_id: dirId,
        director_name: "Vikram Malhotra",
        director_signature: "/uploads/signatures/sample-sig.png",
        status: "Approved",
        approval_date: new Date()
      },
      {
        voucher_number: "PSPL-2026-00002",
        expense_date: "2026-04-12",
        department: "Engineering",
        expense_title: "Client Site Visit - Delhi Financial Center",
        category: "Travel",
        description: "Flight tickets and local taxi for client deployment sprint.",
        amount: 8750.00,
        employee_id: emp1Id,
        employee_name: "Aarav Sharma",
        employee_code: "EMP-1042",
        employee_signature: "/uploads/signatures/sample-sig.png",
        status: "Pending Approval"
      },
      {
        voucher_number: "PSPL-2026-00003",
        expense_date: "2026-04-14",
        department: "Engineering",
        expense_title: "Quarterly Team Project Dinner",
        category: "Meals",
        description: "Dinner celebration for project milestone delivery.",
        amount: 4200.00,
        employee_id: emp1Id,
        employee_name: "Aarav Sharma",
        employee_code: "EMP-1042",
        status: "Draft"
      },
      {
        voucher_number: "PSPL-2026-00004",
        expense_date: "2026-04-05",
        department: "Engineering",
        expense_title: "Non-Compliant Hardware Purchase",
        category: "Equipment",
        description: "Personal wireless keyboard without prior purchase authorization.",
        amount: 3200.00,
        employee_id: emp1Id,
        employee_name: "Aarav Sharma",
        employee_code: "EMP-1042",
        employee_signature: "/uploads/signatures/sample-sig.png",
        director_id: dirId,
        director_name: "Vikram Malhotra",
        status: "Rejected",
        rejection_reason: "Equipment must be ordered through central procurement department as per IT policy."
      }
    ];

    for (const v of sampleVouchers) {
      await pool.query(`
        INSERT INTO vouchers (
          voucher_number, expense_date, department, expense_title, category,
          description, amount, employee_id, employee_name, employee_code,
          employee_signature, director_id, director_name, director_signature,
          status, approval_date, rejection_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        v.voucher_number, v.expense_date, v.department, v.expense_title, v.category,
        v.description, v.amount, v.employee_id, v.employee_name, v.employee_code,
        v.employee_signature || null, v.director_id || null, v.director_name || null,
        v.director_signature || null, v.status, v.approval_date || null, v.rejection_reason || null
      ]);
    }
    console.log("Sample vouchers seeded successfully.");
  }

  await pool.end();
  console.log("Database seeding completed.");
}

runSeed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
