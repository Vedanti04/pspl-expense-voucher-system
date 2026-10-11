/**
 * Generates an auto-incremented, unique corporate voucher number.
 * Format: PSPL-YYYY-00001
 */
export async function generateVoucherNumber(connection) {
  const currentYear = new Date().getFullYear();
  const prefix = `PSPL-${currentYear}-`;

  // Lock row/count for transaction safety
  const [rows] = await connection.query(
    "SELECT voucher_number FROM vouchers WHERE voucher_number LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (rows && rows.length > 0) {
    const lastNum = rows[0].voucher_number;
    const parts = lastNum.split("-");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(5, "0")}`;
}
