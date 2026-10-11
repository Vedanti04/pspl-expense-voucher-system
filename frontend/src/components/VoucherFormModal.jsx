import React, { useState, useEffect } from "react";
import { X, Pen, Check, AlertCircle } from "lucide-react";
import { SignaturePadModal } from "./SignaturePadModal.jsx";

export function VoucherFormModal({
  isOpen,
  onClose,
  onSave,
  voucherToEdit = null,
  currentUser
}) {
  const [formData, setFormData] = useState({
    department: "Engineering",
    expenseTitle: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    category: "Travel",
    description: "",
    amount: ""
  });

  const [signatureData, setSignatureData] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [showSigModal, setShowSigModal] = useState(false);
  const [errors, setErrors] = useState({});

  const departments = [
    "Engineering",
    "Product",
    "Marketing",
    "Finance & Accounts",
    "Sales",
    "Human Resources",
    "Operations",
    "Executive Board"
  ];

  const categories = [
    "Travel",
    "Meals",
    "Accommodation",
    "Software & IT",
    "Office Supplies",
    "Client Meeting",
    "Equipment",
    "Other"
  ];

  useEffect(() => {
    if (voucherToEdit) {
      setFormData({
        department: voucherToEdit.department || "Engineering",
        expenseTitle: voucherToEdit.expenseTitle || "",
        expenseDate: voucherToEdit.expenseDate ? voucherToEdit.expenseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        category: voucherToEdit.category || "Travel",
        description: voucherToEdit.description || "",
        amount: voucherToEdit.amount || ""
      });
      if (voucherToEdit.employeeSignature) {
        setSignaturePreview(voucherToEdit.employeeSignature);
      }
    } else {
      setFormData({
        department: currentUser?.department || "Engineering",
        expenseTitle: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        category: "Travel",
        description: "",
        amount: ""
      });
      setSignatureData(null);
      setSignaturePreview(null);
    }
    setErrors({});
  }, [voucherToEdit, isOpen, currentUser]);

  if (!isOpen) return null;

  function validate() {
    const errs = {};
    if (!formData.department.trim()) errs.department = "Department is mandatory.";
    if (!formData.expenseTitle.trim()) errs.expenseTitle = "Expense title is mandatory.";
    if (!formData.expenseDate) errs.expenseDate = "Expense date is mandatory.";
    if (!formData.category.trim()) errs.category = "Category is mandatory.";

    const amt = Number(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      errs.amount = "Amount must be greater than zero.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      amount: Number(formData.amount),
      signature: signatureData
    });
  }

  function handleSignatureSave(sig) {
    setSignatureData(sig);
    if (sig.type === "base64") {
      setSignaturePreview(sig.data);
    } else if (sig.preview) {
      setSignaturePreview(sig.preview);
    }
  }

  return (
    <>
      <div className="modal-backdrop-layer">
        <div className="modal-window-box max-w-xl">
          {/* Header */}
          <div className="modal-header-section">
            <div>
              <h3 className="modal-heading-title">
                {voucherToEdit ? "Edit Draft Voucher" : "Create Expense Voucher"}
              </h3>
              <p className="modal-sub-label">
                {voucherToEdit
                  ? `Updating draft voucher ${voucherToEdit.voucherNumber}`
                  : "All new expense vouchers are initially created in Draft status."}
              </p>
            </div>
            <button className="btn-modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="modal-body-scroll">
            <div className="form-two-col-grid">
              <div className="form-group">
                <label className="form-label">
                  Department <span className="req-star">*</span>
                </label>
                <select
                  className={`form-input ${errors.department ? "input-error" : ""}`}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.department && <span className="error-hint">{errors.department}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Expense Category <span className="req-star">*</span>
                </label>
                <select
                  className={`form-input ${errors.category ? "input-error" : ""}`}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <span className="error-hint">{errors.category}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Expense Title <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.expenseTitle ? "input-error" : ""}`}
                placeholder="e.g. Flight travel tickets to Bangalore client demo"
                value={formData.expenseTitle}
                onChange={(e) => setFormData({ ...formData, expenseTitle: e.target.value })}
                required
              />
              {errors.expenseTitle && <span className="error-hint">{errors.expenseTitle}</span>}
            </div>

            <div className="form-two-col-grid">
              <div className="form-group">
                <label className="form-label">
                  Expense Incurred Date <span className="req-star">*</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.expenseDate ? "input-error" : ""}`}
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
                {errors.expenseDate && <span className="error-hint">{errors.expenseDate}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Claim Amount (₹) <span className="req-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={`form-input ${errors.amount ? "input-error" : ""}`}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                {errors.amount && <span className="error-hint">{errors.amount}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Description & Justification</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Provide detailed breakdown, project name, or client context..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Signature Box */}
            <div className="sig-attachment-panel">
              <div className="sig-attachment-top">
                <div>
                  <h4 className="sig-attachment-title">Employee Authorization Signature</h4>
                  <p className="sig-attachment-sub">Mandatory before submitting voucher for Director review</p>
                </div>
                <button
                  type="button"
                  className="btn-signature-trigger"
                  onClick={() => setShowSigModal(true)}
                >
                  <Pen size={13} /> {signaturePreview ? "Update Signature" : "Draw or Upload"}
                </button>
              </div>

              {signaturePreview ? (
                <div className="sig-attachment-preview">
                  <img src={signaturePreview} alt="Signature preview" />
                  <span className="sig-attached-label">
                    <Check size={13} /> Signature Attached
                  </span>
                </div>
              ) : (
                <div className="sig-attachment-empty">
                  No signature attached yet. You can sign now or attach it right before submitting.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="modal-footer-section">
              <button type="button" className="btn-modal-action secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-modal-action primary">
                <Check size={15} /> {voucherToEdit ? "Save Changes" : "Save as Draft"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SignaturePadModal
        isOpen={showSigModal}
        onClose={() => setShowSigModal(false)}
        onSave={handleSignatureSave}
        title="Employee Signature Authorization"
        requiredRole="Employee"
      />
    </>
  );
}