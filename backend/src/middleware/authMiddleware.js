import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

/**
 * Authentication middleware that verifies JWT and attaches user to request.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required. Please log in." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");

    // Fetch fresh user details from database to guarantee validity
    const [rows] = await pool.query(
      "SELECT id, name, email, role, department, employee_id FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid or corrupt authentication token." });
  }
}

/**
 * Role-based access control (RBAC) middleware.
 * @param  {...string} allowedRoles - list of roles permitted to access endpoint
 */
export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${allowedRoles.join(", ")}. Your role is ${req.user.role}.`
      });
    }
    next();
  };
}
