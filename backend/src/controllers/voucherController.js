import { pool } from "../config/db.js";
import { generateVoucherNumber } from "../utils/voucherNumber.js";
import { validateVoucherInput } from "../validators/voucherValidator.js";
import { saveBase64Signature } from "../middleware/uploadMiddleware.js";

const SELECT_FIELDS = `
  v.id,
  v.voucher_number AS voucherNumber,
  v.voucher_date AS voucherDate,
  v.expense_date AS expenseDate,
  v.department,
  v.expense_title AS expenseTitle,
  v.category,
  v.description,
  v.amount,
  v.employee_id AS employeeId,
  v.employee_name AS employeeName,
  v.employee_code AS employeeCode,
  v.employee_signature AS employeeSignature,
  v.director_id AS directorId,
  v.director_name AS directorName,
  v.director_signature AS directorSignature,
  v.status,
  v.approval_date AS approvalDate,
  v.rejection_reason AS rejectionReason,
  v.created_at AS createdAt,
  v.updated_at AS updatedAt
`;

/**
 * Get all vouchers with role isolation, search, filtering, and sorting.
 */
export async function getVouchers(req, res, next) {
  try {
    const {
      search = "",
      status = "",
      department = "",
      category = "",
      fromDate = "",
      toDate = "",
      minAmount = "",
      maxAmount = "",
      sortBy = "createdAt",
      sortOrder = "DESC"
    } = req.query;

    let sql = `SELECT ${SELECT_FIELDS} FROM vouchers v WHERE 1=1`;
    const params = [];

    // Role-based visibility isolation:
    // Employees ONLY see their own vouchers.
    // Directors and Accounts can view all vouchers across the company.
    if (req.user.role === "employee") {
      sql += " AND v.employee_id = ?";
      params.push(req.user.id);
    }

    // Filters
    if (status) {
      sql += " AND v.status = ?";
      params.push(status);
    }
    if (department) {
      sql += " AND v.department = ?";
      params.push(department);
    }
    if (category) {
      sql += " AND v.category = ?";
      params.push(category);
    }
    if (fromDate) {
      sql += " AND v.expense_date >= ?";
      params.push(fromDate);
    }
    if (toDate) {
      sql += " AND v.expense_date <= ?";
      params.push(toDate);
    }
    if (minAmount !== "" && !isNaN(Number(minAmount))) {
      sql += " AND v.amount >= ?";
      params.push(Number(minAmount));
    }
    if (maxAmount !== "" && !isNaN(Number(maxAmount))) {
      sql += " AND v.amount <= ?";
      params.push(Number(maxAmount));
    }

    // General text search
    if (search && search.trim()) {
      const term = `%${search.trim().slice(0, 100)}%`;
      sql += " AND (v.voucher_number LIKE ? OR v.employee_name LIKE ? OR v.department LIKE ? OR v.expense_title LIKE ?)";
      params.push(term, term, term, term);
    }

    // Sorting
    const allowedSortFields = {
      createdAt: "v.created_at",
      expenseDate: "v.expense_date",
      amount: "v.amount",
      voucherNumber: "v.voucher_number",
      status: "v.status"
    };

    const sortColumn = allowedSortFields[sortBy] || "v.created_at";
    const order = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";
    sql += ` ORDER BY ${sortColumn} ${order}`;

    const [vouchers] = await pool.query(sql, params);
    res.json({ vouchers });
  } catch (err) {
    next(err);
  }
}

/**
 * Get role-tailored dashboard statistics.
 */
export async function getDashboardStats(req, res, next) {
  try {
    let whereClause = "";
    const params = [];

    if (req.user.role === "employee") {
      whereClause = " WHERE employee_id = ?";
      params.push(req.user.id);
    }

    const [summaryRows] = await pool.query(`
      SELECT
        COUNT(*) AS totalVouchers,
        COALESCE(SUM(status = 'Draft'), 0) AS draftVouchers,
        COALESCE(SUM(status = 'Pending Approval'), 0) AS pendingApproval,
        COALESCE(SUM(status = 'Approved'), 0) AS approvedVouchers,
        COALESCE(SUM(status = 'Rejected'), 0) AS rejectedVouchers,
        COALESCE(SUM(amount), 0) AS totalAmountClaimed,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN amount ELSE 0 END), 0) AS totalApprovedAmount,
        COALESCE(SUM(CASE WHEN status = 'Pending Approval' THEN amount ELSE 0 END), 0) AS totalPendingAmount,
        COALESCE(SUM(status = 'Approved' AND DATE(approval_date) = CURDATE()), 0) AS approvedToday,
        COALESCE(SUM(status = 'Rejected' AND DATE(updated_at) = CURDATE()), 0) AS rejectedToday
      FROM vouchers
      ${whereClause}
    `, params);

    const stats = {};
    for (const [key, value] of Object.entries(summaryRows[0])) {
      stats[key] = Number(value || 0);
    }

    // Fetch recent activity / recent vouchers
    let recentSql = `SELECT ${SELECT_FIELDS} FROM vouchers v`;
    const recentParams = [];
    if (req.user.role === "employee") {
      recentSql += " WHERE v.employee_id = ?";
      recentParams.push(req.user.id);
    } else if (req.user.role === "accounts") {
      recentSql += " WHERE v.status = 'Approved'";
    }
    recentSql += " ORDER BY v.updated_at DESC LIMIT 5";

    const [recentVouchers] = await pool.query(recentSql, recentParams);
    stats.recentActivity = recentVouchers;

    res.json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single voucher by ID.
 * Strict RBAC: Employees can ONLY view their own vouchers.
 */
export async function getVoucherById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [id]);
    const voucher = rows[0];

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    if (req.user.role === "employee" && Number(voucher.employeeId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied. You can only view your own expense vouchers." });
    }

    res.json({ voucher });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new voucher. Initial status is always 'Draft'.
 */
export async function createVoucher(req, res, next) {
  let connection;
  try {
    const { isValid, errors, sanitized } = validateVoucherInput(req.body);
    if (!isValid) {
      return res.status(400).json({ message: errors.join(" ") });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const voucherNumber = await generateVoucherNumber(connection);
    const employeeCode = req.user.employee_id || req.body.employeeCode || null;

    let signaturePath = null;
    if (req.file) {
      signaturePath = `/uploads/signatures/${req.file.filename}`;
    } else if (req.body.signatureBase64) {
      signaturePath = saveBase64Signature(req.body.signatureBase64, "emp-sig");
    }

    const [result] = await connection.query(`
      INSERT INTO vouchers (
        voucher_number,
        department,
        expense_title,
        expense_date,
        category,
        description,
        amount,
        employee_id,
        employee_name,
        employee_code,
        employee_signature,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')
    `, [
      voucherNumber,
      sanitized.department,
      sanitized.expenseTitle,
      sanitized.expenseDate,
      sanitized.category,
      sanitized.description,
      sanitized.amount,
      req.user.id,
      req.user.name,
      employeeCode,
      signaturePath
    ]);

    await connection.commit();

    const [createdRows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [result.insertId]);
    res.status(201).json({
      message: "Voucher created successfully as Draft.",
      voucher: createdRows[0]
    });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Update an existing voucher. Only Draft status vouchers can be updated.
 */
export async function updateVoucher(req, res, next) {
  try {
    const { id } = req.params;
    const { isValid, errors, sanitized } = validateVoucherInput(req.body);
    if (!isValid) {
      return res.status(400).json({ message: errors.join(" ") });
    }

    // Check existing voucher status & ownership
    const [existing] = await pool.query("SELECT id, employee_id, status FROM vouchers WHERE id = ?", [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    const currentVoucher = existing[0];
    if (Number(currentVoucher.employee_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied. You can only edit your own vouchers." });
    }

    if (currentVoucher.status !== "Draft") {
      return res.status(400).json({
        message: `Voucher cannot be edited because it is in '${currentVoucher.status}' status. Only Draft vouchers can be edited.`
      });
    }

    let signatureUpdateClause = "";
    const updateParams = [
      sanitized.department,
      sanitized.expenseTitle,
      sanitized.expenseDate,
      sanitized.category,
      sanitized.description,
      sanitized.amount
    ];

    if (req.file) {
      signatureUpdateClause = ", employee_signature = ?";
      updateParams.push(`/uploads/signatures/${req.file.filename}`);
    } else if (req.body.signatureBase64) {
      const sigPath = saveBase64Signature(req.body.signatureBase64, "emp-sig");
      if (sigPath) {
        signatureUpdateClause = ", employee_signature = ?";
        updateParams.push(sigPath);
      }
    }

    updateParams.push(id, req.user.id);

    await pool.query(`
      UPDATE vouchers
      SET department = ?,
          expense_title = ?,
          expense_date = ?,
          category = ?,
          description = ?,
          amount = ?
          ${signatureUpdateClause}
      WHERE id = ? AND employee_id = ? AND status = 'Draft'
    `, updateParams);

    const [rows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [id]);
    res.json({
      message: "Voucher updated successfully.",
      voucher: rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a draft voucher.
 */
export async function deleteVoucher(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT id, employee_id, status FROM vouchers WHERE id = ?", [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    const current = existing[0];
    if (Number(current.employee_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied. You can only delete your own vouchers." });
    }

    if (current.status !== "Draft") {
      return res.status(400).json({
        message: `Cannot delete voucher. Only Draft vouchers can be deleted, but current status is '${current.status}'.`
      });
    }

    await pool.query("DELETE FROM vouchers WHERE id = ? AND employee_id = ? AND status = 'Draft'", [id, req.user.id]);
    res.json({ message: "Draft voucher deleted successfully." });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload or attach signature to draft voucher.
 */
export async function uploadEmployeeSignature(req, res, next) {
  try {
    const { id } = req.params;
    let signaturePath = null;

    if (req.file) {
      signaturePath = `/uploads/signatures/${req.file.filename}`;
    } else if (req.body.signatureBase64) {
      signaturePath = saveBase64Signature(req.body.signatureBase64, "emp-sig");
    }

    if (!signaturePath) {
      return res.status(400).json({ message: "Signature image or canvas drawing is required." });
    }

    const [result] = await pool.query(
      "UPDATE vouchers SET employee_signature = ? WHERE id = ? AND employee_id = ? AND status = 'Draft'",
      [signaturePath, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Voucher not found or no longer in Draft status." });
    }

    const [rows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [id]);
    res.json({
      message: "Employee signature attached successfully.",
      voucher: rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit voucher for Director approval.
 * Enforces rule: employee signature is mandatory before submission!
 */
export async function submitVoucher(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT id, status, employee_signature FROM vouchers WHERE id = ? AND employee_id = ?",
      [id, req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    const voucher = rows[0];

    if (voucher.status !== "Draft") {
      return res.status(400).json({
        message: `Only draft vouchers can be submitted. Current status is '${voucher.status}'.`
      });
    }

    // Check if signature is already attached OR provided with submission payload
    let signaturePath = voucher.employee_signature;
    if (!signaturePath) {
      if (req.file) {
        signaturePath = `/uploads/signatures/${req.file.filename}`;
      } else if (req.body?.signatureBase64) {
        signaturePath = saveBase64Signature(req.body.signatureBase64, "emp-sig");
      }
    }

    if (!signaturePath) {
      return res.status(400).json({
        message: "Employee signature is mandatory before submission. Please sign or upload your signature."
      });
    }

    await pool.query(
      "UPDATE vouchers SET status = 'Pending Approval', employee_signature = ? WHERE id = ? AND employee_id = ?",
      [signaturePath, id, req.user.id]
    );

    const [updatedRows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [id]);
    res.json({
      message: "Voucher successfully submitted for Director approval.",
      voucher: updatedRows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Approve voucher (Director only).
 * Enforces rule: Director signature is mandatory before approval!
 */
export async function approveVoucher(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT id, status FROM vouchers WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    const voucher = rows[0];
    if (voucher.status !== "Pending Approval") {
      return res.status(400).json({
        message: `Only vouchers in 'Pending Approval' status can be approved. Current status is '${voucher.status}'.`
      });
    }

    let directorSignaturePath = null;
    if (req.file) {
      directorSignaturePath = `/uploads/signatures/${req.file.filename}`;
    } else if (req.body?.signatureBase64) {
      directorSignaturePath = saveBase64Signature(req.body.signatureBase64, "dir-sig");
    }

    if (!directorSignaturePath) {
      return res.status(400).json({
        message: "Director signature is mandatory before approval. Please upload or draw your signature."
      });
    }

    await pool.query(`
      UPDATE vouchers
      SET status = 'Approved',
          director_id = ?,
          director_name = ?,
          director_signature = ?,
          approval_date = NOW(),
          rejection_reason = NULL
      WHERE id = ? AND status = 'Pending Approval'
    `, [req.user.id, req.user.name, directorSignaturePath, id]);

    const [updatedRows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [id]);
    res.json({
      message: "Voucher approved successfully.",
      voucher: updatedRows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reject voucher (Director only).
 * Enforces rule: Rejection Reason is mandatory if a voucher is rejected!
 */
export async function rejectVoucher(req, res, next) {
  try {
    const { id } = req.params;
    const reason = String(req.body.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is mandatory when rejecting a voucher." });
    }

    const [rows] = await pool.query("SELECT id, status FROM vouchers WHERE id = ?", [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Voucher not found." });
    }

    const voucher = rows[0];
    if (voucher.status !== "Pending Approval") {
      return res.status(400).json({
        message: `Only vouchers in 'Pending Approval' status can be rejected. Current status is '${voucher.status}'.`
      });
    }

    await pool.query(`
      UPDATE vouchers
      SET status = 'Rejected',
          director_id = ?,
          director_name = ?,
          rejection_reason = ?
      WHERE id = ? AND status = 'Pending Approval'
    `, [req.user.id, req.user.name, reason, id]);

    const [updatedRows] = await pool.query(`SELECT ${SELECT_FIELDS} FROM vouchers v WHERE v.id = ?`, [id]);
    res.json({
      message: "Voucher rejected with reason.",
      voucher: updatedRows[0]
    });
  } catch (err) {
    next(err);
  }
}
