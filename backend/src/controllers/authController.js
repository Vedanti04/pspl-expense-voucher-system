import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

/**
 * Handle user login with email and password.
 */
export async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, role, department, employee_id, password_hash FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const payload = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret", {
      expiresIn: "12h"
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get profile of currently authenticated user.
 */
export async function getMe(req, res) {
  res.json({ user: req.user });
}
