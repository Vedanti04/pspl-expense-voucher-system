import React from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import { Eye, Edit3, Trash2, Send, Printer, FileText } from "lucide-react";

export function VoucherTable({
  vouchers,
  currentRole,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onPrint
}) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="table-empty-card">
        <div className="empty-icon-circle">
          <FileText size={28} className="text-slate-400" />
        </div>
        <h3>No Expense Vouchers Found</h3>
        <p>
          {currentRole === "employee"
            ? "You don't have any expense claims matching the current filters. Click '+ Create Voucher' above to draft a new claim."
            : "No expense vouchers match the selected criteria across the organization."}
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive-card">
      <table className="corporate-table">
        <thead>
          <tr>
            <th className="col-vch">Voucher Number</th>
            <th className="col-desc">Expense Particulars</th>
            {currentRole !== "employee" && <th className="col-emp">Submitted By</th>}
            <th className="col-date">Expense Date</th>
            <th className="col-amt text-right">Amount</th>
            <th className="col-status text-center">Current Status</th>
            <th className="col-actions text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => {
            const isDraft = v.status === "Draft";
            const isApproved = v.status === "Approved";
            const canEmployeeEdit = currentRole === "employee" && isDraft;

            return (
              <tr key={v.id} className="table-row">
                <td className="col-vch">
                  <div className="vch-number-code">{v.voucherNumber}</div>
                  <div className="vch-department-tag">{v.department}</div>
                </td>

                <td className="col-desc">
                  <div className="vch-title" title={v.expenseTitle}>
                    {v.expenseTitle}
                  </div>
                  <span className="vch-category-pill">{v.category}</span>
                </td>

                {currentRole !== "employee" && (
                  <td className="col-emp">
                    <div className="emp-name">{v.employeeName}</div>
                    {v.employeeCode && (
                      <div className="emp-badge-id">ID: {v.employeeCode}</div>
                    )}
                  </td>
                )}

                <td className="col-date">
                  <span className="date-text">{formatDate(v.expenseDate)}</span>
                </td>

                <td className="col-amt text-right">
                  <span className="amount-text">{formatCurrency(v.amount)}</span>
                </td>

                <td className="col-status text-center">
                  <StatusBadge status={v.status} />
                </td>

                <td className="col-actions text-right">
                  <div className="actions-cluster">
                    <button
                      type="button"
                      className="btn-action-icon view"
                      title="View Voucher Details"
                      onClick={() => onView(v)}
                    >
                      <Eye size={15} />
                    </button>

                    {canEmployeeEdit && (
                      <>
                        <button
                          type="button"
                          className="btn-action-icon edit"
                          title="Edit Draft"
                          onClick={() => onEdit(v)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon submit"
                          title="Submit for Approval"
                          onClick={() => onSubmit(v)}
                        >
                          <Send size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon delete"
                          title="Delete Draft"
                          onClick={() => onDelete(v)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    {(isApproved || currentRole === "accounts") && onPrint && (
                      <button
                        type="button"
                        className="btn-action-icon print"
                        title="Print Official Slip"
                        onClick={() => onPrint(v)}
                      >
                        <Printer size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}