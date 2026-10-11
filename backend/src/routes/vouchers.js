import { Router } from "express";
import { pool } from "../db.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.use(authenticate);

function cleanVoucher(body) {
  const amount = Number(body.amount);
  const expenseDate = String(body.expenseDate || "");
  if (!body.department?.trim()) throw Object.assign(new Error("Department is required"), { status: 400 });
  if (!body.expenseTitle?.trim()) throw Object.assign(new Error("Expense title is required"), { status: 400 });
  if (!expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) || Number.isNaN(Date.parse(expenseDate))) throw Object.assign(new Error("Valid expense date is required"), { status: 400 });
  if (!body.category?.trim()) throw Object.assign(new Error("Expense category is required"), { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error("Amount must be greater than zero"), { status: 400 });
  return [body.department.trim(), body.expenseTitle.trim(), expenseDate, body.category.trim(), String(body.description || "").trim(), amount];
}
const selectFields = `v.id, v.voucher_number AS voucherNumber, v.voucher_date AS voucherDate,
 v.expense_date AS expenseDate, v.department, v.expense_title AS expenseTitle,
 v.category, v.description, v.amount, v.employee_id AS employeeId,
 v.employee_name AS employeeName, v.employee_signature AS employeeSignature,
 v.director_signature AS directorSignature, v.status, v.approval_date AS approvalDate,
 v.rejection_reason AS rejectionReason, v.created_at AS createdAt, v.updated_at AS updatedAt`;

router.get("/", async (req, res, next) => {
  try {
    const { search = "", status = "", department = "", category = "", from = "", to = "" } = req.query;
    let sql = `SELECT ${selectFields} FROM vouchers v WHERE 1=1`;
    const params = [];
    if (req.user.role === "employee") { sql += " AND v.employee_id = ?"; params.push(req.user.id); }
    if (status) { sql += " AND v.status = ?"; params.push(status); }
    if (department) { sql += " AND v.department = ?"; params.push(department); }
    if (category) { sql += " AND v.category = ?"; params.push(category); }
    if (from) { sql += " AND v.expense_date >= ?"; params.push(from); }
    if (to) { sql += " AND v.expense_date <= ?"; params.push(to); }
    if (search) {
      const like = `%${String(search).slice(0, 100)}%`;
      sql += " AND (v.voucher_number LIKE ? OR v.employee_name LIKE ? OR v.department LIKE ? OR v.expense_title LIKE ?)";
      params.push(like, like, like, like);
    }
    sql += " ORDER BY v.created_at DESC";
    const [vouchers] = await pool.query(sql, params);
    res.json({ vouchers });
  } catch (error) { next(error); }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    let where = ""; const params = [];
    if (req.user.role === "employee") { where = " WHERE employee_id = ?"; params.push(req.user.id); }
    const [rows] = await pool.query(`SELECT
      COUNT(*) AS total,
      SUM(status='Draft') AS drafts,
      SUM(status='Pending Approval') AS pending,
      SUM(status='Approved') AS approved,
      SUM(status='Rejected') AS rejected,
      COALESCE(SUM(amount),0) AS totalClaimed,
      COALESCE(SUM(CASE WHEN status='Approved' THEN amount ELSE 0 END),0) AS totalApproved,
      SUM(status='Approved' AND DATE(approval_date)=CURDATE()) AS approvedToday,
      SUM(status='Rejected' AND DATE(updated_at)=CURDATE()) AS rejectedToday,
      COALESCE(SUM(CASE WHEN status='Pending Approval' THEN amount ELSE 0 END),0) AS pendingAmount
      FROM vouchers${where}`, params);
    const result = {};
    for (const [key, value] of Object.entries(rows[0])) result[key] = Number(value || 0);
    res.json(result);
  } catch (error) { next(error); }
});

router.post("/", allowRoles("employee"), async (req, res, next) => {
  try {
    const [department, title, expenseDate, category, description, amount] = cleanVoucher(req.body);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [countRows] = await connection.query("SELECT COUNT(*) AS total FROM vouchers FOR UPDATE");
      const voucherNumber = `PSPL-${new Date().getFullYear()}-${String(Number(countRows[0].total) + 1).padStart(5, "0")}`;
      const [result] = await connection.query(
        `INSERT INTO vouchers (voucher_number, department, expense_title, expense_date, category, description, amount, employee_id, employee_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`,
        [voucherNumber, department, title, expenseDate, category, description, amount, req.user.id, req.user.name]
      );
      await connection.commit();
      const [rows] = await pool.query(`SELECT ${selectFields} FROM vouchers v WHERE v.id = ?`, [result.insertId]);
      res.status(201).json({ voucher: rows[0] });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT ${selectFields} FROM vouchers v WHERE v.id = ?`, [req.params.id]);
    const voucher = rows[0];
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    if (req.user.role === "employee" && Number(voucher.employeeId) !== Number(req.user.id)) return res.status(403).json({ message: "You can only view your own vouchers" });
    res.json({ voucher });
  } catch (error) { next(error); }
});

router.put("/:id", allowRoles("employee"), async (req, res, next) => {
  try {
    const values = cleanVoucher(req.body);
    const [result] = await pool.query(
      `UPDATE vouchers SET department=?, expense_title=?, expense_date=?, category=?, description=?, amount=?
       WHERE id=? AND employee_id=? AND status='Draft'`,
      [...values, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(400).json({ message: "Voucher not found or no longer an editable draft" });
    const [rows] = await pool.query(`SELECT ${selectFields} FROM vouchers v WHERE v.id=?`, [req.params.id]);
    res.json({ voucher: rows[0] });
  } catch (error) { next(error); }
});

router.delete("/:id", allowRoles("employee"), async (req, res, next) => {
  try {
    const [result] = await pool.query("DELETE FROM vouchers WHERE id=? AND employee_id=? AND status='Draft'", [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(400).json({ message: "Voucher not found or no longer an editable draft" });
    res.json({ message: "Draft deleted" });
  } catch (error) { next(error); }
});

router.post("/:id/employee-signature", allowRoles("employee"), upload.single("signature"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Signature image is required" });
    const [result] = await pool.query(
      "UPDATE vouchers SET employee_signature=? WHERE id=? AND employee_id=? AND status='Draft'",
      [`/uploads/${req.file.filename}`, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(400).json({ message: "Voucher not found or no longer editable" });
    const [rows] = await pool.query(`SELECT ${selectFields} FROM vouchers v WHERE v.id=?`, [req.params.id]);
    res.json({ voucher: rows[0] });
  } catch (error) { next(error); }
});

router.post("/:id/submit", allowRoles("employee"), async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "UPDATE vouchers SET status='Pending Approval' WHERE id=? AND employee_id=? AND status='Draft' AND employee_signature IS NOT NULL",
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.query("SELECT status, employee_signature FROM vouchers WHERE id=? AND employee_id=?", [req.params.id, req.user.id]);
      if (!rows.length) return res.status(404).json({ message: "Voucher not found" });
      if (rows[0].status !== "Draft") return res.status(400).json({ message: "Only draft vouchers can be submitted" });
      return res.status(400).json({ message: "Upload employee signature before submission" });
    }
    res.json({ message: "Voucher submitted for approval" });
  } catch (error) { next(error); }
});

router.post("/:id/approve", allowRoles("director"), upload.single("signature"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Director signature is required" });
    const [result] = await pool.query(
      "UPDATE vouchers SET director_signature=?, status='Approved', approval_date=NOW(), rejection_reason=NULL WHERE id=? AND status='Pending Approval'",
      [`/uploads/${req.file.filename}`, req.params.id]
    );
    if (!result.affectedRows) return res.status(400).json({ message: "Voucher not found or not pending approval" });
    const [rows] = await pool.query(`SELECT ${selectFields} FROM vouchers v WHERE v.id=?`, [req.params.id]);
    res.json({ voucher: rows[0] });
  } catch (error) { next(error); }
});

router.post("/:id/reject", allowRoles("director"), async (req, res, next) => {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Rejection reason is required" });
    const [result] = await pool.query(
      "UPDATE vouchers SET status='Rejected', rejection_reason=? WHERE id=? AND status='Pending Approval'",
      [reason, req.params.id]
    );
    if (!result.affectedRows) return res.status(400).json({ message: "Voucher not found or not pending approval" });
    const [rows] = await pool.query(`SELECT ${selectFields} FROM vouchers v WHERE v.id=?`, [req.params.id]);
    res.json({ voucher: rows[0] });
  } catch (error) { next(error); }
});
export default router;
