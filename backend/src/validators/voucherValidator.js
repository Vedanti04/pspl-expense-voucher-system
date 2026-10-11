/**
 * Validates voucher submission/update payload strictly against assignment requirements:
 * - Department is mandatory
 * - Expense Title is mandatory
 * - Expense Date is mandatory
 * - Amount is mandatory and > 0
 * - Expense Category is mandatory
 */
export function validateVoucherInput(body) {
  const errors = [];

  const department = typeof body.department === "string" ? body.department.trim() : "";
  const expenseTitle = typeof body.expenseTitle === "string" ? body.expenseTitle.trim() : "";
  const expenseDate = typeof body.expenseDate === "string" ? body.expenseDate.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const amount = Number(body.amount);

  if (!department) {
    errors.push("Department is mandatory.");
  }
  if (!expenseTitle) {
    errors.push("Expense title is mandatory.");
  }
  if (!expenseDate) {
    errors.push("Expense date is mandatory.");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) || Number.isNaN(Date.parse(expenseDate))) {
    errors.push("Expense date must be a valid date in YYYY-MM-DD format.");
  }

  if (!category) {
    errors.push("Expense category is mandatory.");
  }

  if (body.amount === undefined || body.amount === null || String(body.amount).trim() === "") {
    errors.push("Amount is mandatory.");
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be greater than zero.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      department,
      expenseTitle,
      expenseDate,
      category,
      description,
      amount
    }
  };
}
