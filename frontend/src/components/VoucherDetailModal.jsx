import React, { useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import { getFileUrl } from "../services/api.js";
import {
  X,
  FileText,
  User,
  CheckCircle2,
  Printer,
  Edit3,
  Trash2,
  Send,
  AlertTriangle,
  XCircle,
  Calendar,
  IndianRupee,
  Building
} from "lucide-react";

export function VoucherDetailModal({
  voucher,
  currentRole,
  onClose,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onReject,
  onPrint
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!voucher) return null;

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const isDraft = voucher.status === "Draft";
  const isPending = voucher.status === "Pending Approval";
  const isApproved = voucher.status === "Approved";
  const isRejected = voucher.status === "Rejected";

  function handleRejectSubmit(e) {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    onReject(voucher, rejectReason.trim());
  }

  return (
    <div className="modal-backdrop-layer">
      <div className="modal-window-box max-w-2xl">
        {/* Modal Header */}
        <div className="modal-header-section">
          <div>
            <div className="modal-header-meta">
              <span className="vch-code-pill">{voucher.voucherNumber}</span>
              <StatusBadge status={voucher.status} />
            </div>
            <h3 className="modal-heading-title">{voucher.expenseTitle}</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroll">
          {/* Rejection Alert */}
          {isRejected && voucher.rejectionReason && (
            <div className="rejection-notice-box">
              <AlertTriangle className="rejection-icon" size={18} />
              <div className="rejection-text-wrap">
                <strong>Director Rejection Feedback:</strong>
                <p>{voucher.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Key Details Grid */}
          <div className="voucher-metrics-grid">
            <div className="metric-cell">
              <span className="cell-label">Claimed Amount</span>
              <span className="cell-value-highlight">{formatCurrency(voucher.amount)}</span>
            </div>
            <div className="metric-cell">
              <span className="cell-label">Expense Incurred Date</span>
              <span className="cell-value">{formatDate(voucher.expenseDate)}</span>
            </div>
            <div className="metric-cell">
              <span className="cell-label">Department</span>
              <span className="cell-value">{voucher.department}</span>
            </div>
            <div className="metric-cell">
              <span className="cell-label">Expense Category</span>
              <span className="cell-value">{voucher.category}</span>
            </div>
          </div>

          {/* Description */}
          <div className="detail-section-block">
            <h4 className="detail-section-title">
              <FileText size={14} /> Description & Business Justification
            </h4>
            <div className="description-content-box">
              {voucher.description || <span className="text-muted italic">No specific description provided.</span>}
            </div>
          </div>

          {/* Two-Column Signatures */}
          <div className="signatures-duo-grid">
            {/* Employee Block */}
            <div className="sig-column-card">
              <div className="sig-column-header">
                <User size={14} className="text-blue-600" />
                <span>Employee Submission</span>
              </div>
              <div className="sig-column-info">
                <strong>{voucher.employeeName}</strong>
                {voucher.employeeCode && <span>ID: {voucher.employeeCode}</span>}
                <span className="text-time">Created: {formatDateTime(voucher.createdAt)}</span>
              </div>
              <div className="sig-image-box">
                <span className="sig-box-label">Employee Signature:</span>
                {voucher.employeeSignature ? (
                  <div className="sig-preview-frame">
                    <img src={getFileUrl(voucher.employeeSignature)} alt="Employee Signature" />
                  </div>
                ) : (
                  <div className="sig-pending-badge">Signature not attached yet</div>
                )}
              </div>
            </div>

            {/* Director Block */}
            <div className="sig-column-card">
              <div className="sig-column-header">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Executive Review</span>
              </div>
              <div className="sig-column-info">
                <strong>{voucher.directorName || "Director (Executive Approver)"}</strong>
                <span className="text-time">
                  {voucher.approvalDate ? `Approved on: ${formatDateTime(voucher.approvalDate)}` : isRejected ? "Claim Rejected" : "Awaiting Decision"}
                </span>
              </div>
              <div className="sig-image-box">
                <span className="sig-box-label">Director Signature:</span>
                {voucher.directorSignature ? (
                  <div className="sig-preview-frame">
                    <img src={getFileUrl(voucher.directorSignature)} alt="Director Signature" />
                  </div>
                ) : (
                  <div className="sig-pending-badge">
                    {isPending ? "Required upon Director approval" : "No Director signature"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Form inside modal */}
          {rejectMode && (
            <form onSubmit={handleRejectSubmit} className="reject-form-panel">
              <h4 className="reject-form-heading">Enter Specific Reason for Rejection</h4>
              <p className="reject-form-sub">
                Corporate policy requires a constructive explanation so the employee can correct or re-submit their claim.
              </p>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Specify the reason why this voucher cannot be approved (e.g. missing receipts, non-compliant travel category)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
              <div className="reject-form-actions">
                <button type="button" className="btn-secondary-sm" onClick={() => setRejectMode(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-danger-sm flex items-center gap-1.5">
                  <XCircle size={14} /> Confirm Rejection
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer-section">
          {/* Left Actions */}
          <div className="footer-left-actions">
            {(isApproved || currentRole === "accounts") && onPrint && (
              <button
                type="button"
                className="btn-print-action"
                onClick={() => onPrint(voucher)}
              >
                <Printer size={15} /> Print Official Slip
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="footer-right-actions">
            {currentRole === "employee" && isDraft && (
              <>
                <button
                  type="button"
                  className="btn-modal-action edit"
                  onClick={() => onEdit(voucher)}
                >
                  <Edit3 size={14} /> Edit Draft
                </button>
                <button
                  type="button"
                  className="btn-modal-action delete"
                  onClick={() => onDelete(voucher)}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  type="button"
                  className="btn-modal-action submit"
                  onClick={() => onSubmit(voucher)}
                >
                  <Send size={14} /> Submit for Approval
                </button>
              </>
            )}

            {currentRole === "director" && isPending && !rejectMode && (
              <>
                <button
                  type="button"
                  className="btn-modal-action reject"
                  onClick={() => setRejectMode(true)}
                >
                  <XCircle size={14} /> Reject Voucher
                </button>
                <button
                  type="button"
                  className="btn-modal-action approve"
                  onClick={() => onApprove(voucher)}
                >
                  <CheckCircle2 size={14} /> Authorize & Approve
                </button>
              </>
            )}

            <button type="button" className="btn-modal-action secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}