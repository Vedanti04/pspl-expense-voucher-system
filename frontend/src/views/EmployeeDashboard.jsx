import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { voucherApi } from "../services/api.js";
import { StatCard } from "../components/StatCard.jsx";
import { FilterBar } from "../components/FilterBar.jsx";
import { VoucherTable } from "../components/VoucherTable.jsx";
import { VoucherDetailModal } from "../components/VoucherDetailModal.jsx";
import { VoucherFormModal } from "../components/VoucherFormModal.jsx";
import { VoucherPrintSlip } from "../components/VoucherPrintSlip.jsx";
import { SignaturePadModal } from "../components/SignaturePadModal.jsx";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  Plus,
  RefreshCw,
  FolderOpen
} from "lucide-react";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    department: "",
    category: "",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "createdAt",
    sortOrder: "DESC"
  });

  const [activeVoucher, setActiveVoucher] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState(null);
  const [printVoucher, setPrintVoucher] = useState(null);
  const [signatureSubmitVoucher, setSignatureSubmitVoucher] = useState(null);
  const [notification, setNotification] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        voucherApi.getVouchers(filters),
        voucherApi.getStats()
      ]);
      setVouchers(vRes.vouchers || []);
      setStats(sRes || {});
    } catch (err) {
      showNotice("error", err.message || "Failed to load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filters]);

  function showNotice(type, text) {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  }

  async function handleSaveVoucher(formData) {
    try {
      const payload = {
        department: formData.department,
        expenseTitle: formData.expenseTitle,
        expenseDate: formData.expenseDate,
        category: formData.category,
        description: formData.description,
        amount: formData.amount
      };

      if (formData.signature?.type === "base64") {
        payload.signatureBase64 = formData.signature.data;
      }

      let res;
      if (voucherToEdit) {
        res = await voucherApi.updateVoucher(voucherToEdit.id, payload);
        showNotice("success", `Voucher ${res.voucher.voucherNumber} updated successfully.`);
      } else {
        res = await voucherApi.createVoucher(payload);
        showNotice("success", `Voucher ${res.voucher.voucherNumber} created as Draft.`);
      }

      setIsFormOpen(false);
      setVoucherToEdit(null);
      await loadData();
    } catch (err) {
      showNotice("error", err.message || "Failed to save voucher.");
    }
  }

  async function handleDeleteDraft(voucher) {
    if (!window.confirm(`Are you sure you want to delete draft voucher ${voucher.voucherNumber}? This cannot be undone.`)) {
      return;
    }
    try {
      await voucherApi.deleteVoucher(voucher.id);
      showNotice("success", `Draft voucher ${voucher.voucherNumber} deleted.`);
      if (activeVoucher?.id === voucher.id) setActiveVoucher(null);
      await loadData();
    } catch (err) {
      showNotice("error", err.message || "Failed to delete voucher.");
    }
  }

  async function handleSubmitVoucher(voucher) {
    if (!voucher.employeeSignature) {
      setSignatureSubmitVoucher(voucher);
      return;
    }

    try {
      const res = await voucherApi.submitVoucher(voucher.id);
      showNotice("success", `Voucher ${voucher.voucherNumber} submitted for Director approval.`);
      if (activeVoucher?.id === voucher.id) setActiveVoucher(null);
      await loadData();
    } catch (err) {
      showNotice("error", err.message || "Failed to submit voucher.");
    }
  }

  async function handleSignatureAndSubmit(sig) {
    if (!signatureSubmitVoucher) return;
    try {
      const payload = {};
      if (sig.type === "base64") {
        payload.signatureBase64 = sig.data;
      } else if (sig.file) {
        const fd = new FormData();
        fd.append("signature", sig.file);
        await voucherApi.uploadEmployeeSignature(signatureSubmitVoucher.id, fd);
      }

      const res = await voucherApi.submitVoucher(signatureSubmitVoucher.id, payload);
      showNotice("success", `Voucher ${res.voucher?.voucherNumber || signatureSubmitVoucher.voucherNumber} submitted for approval.`);
      setSignatureSubmitVoucher(null);
      if (activeVoucher?.id === signatureSubmitVoucher.id) setActiveVoucher(null);
      await loadData();
    } catch (err) {
      showNotice("error", err.message || "Failed to submit voucher with signature.");
    }
  }

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Employee Expense Desk</h2>
          <p className="view-subtitle">
            Submit reimbursement claims, upload authorization signatures, and track approval status in real-time.
          </p>
        </div>
        <div className="view-actions-row">
          <button
            type="button"
            className="btn-header-secondary"
            onClick={loadData}
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} /> Refresh
          </button>
          <button
            type="button"
            className="btn-header-primary"
            onClick={() => {
              setVoucherToEdit(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={16} /> Create Voucher
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="toast-close">×</button>
        </div>
      )}

      {/* 6 KPI Cards (Section 8) */}
      <div className="metrics-grid-six">
        <StatCard
          title="Total Claims"
          value={stats.totalVouchers}
          icon={FileText}
          subtext="Total vouchers filed"
          color="blue"
        />
        <StatCard
          title="Drafts"
          value={stats.draftVouchers}
          icon={FolderOpen}
          subtext="Editable claims"
          color="indigo"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          icon={Clock}
          subtext="Awaiting Director"
          color="amber"
        />
        <StatCard
          title="Approved"
          value={stats.approvedVouchers}
          icon={CheckCircle}
          subtext="Ready for payment"
          color="emerald"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedVouchers}
          icon={XCircle}
          subtext="Action needed"
          color="rose"
        />
        <StatCard
          title="Total Claimed"
          value={stats.totalAmountClaimed}
          isCurrency={true}
          icon={IndianRupee}
          subtext="Total claim value"
          color="blue"
        />
      </div>

      {/* Filters (Section 7 Bonus) */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() =>
          setFilters({
            search: "",
            status: "",
            department: "",
            category: "",
            fromDate: "",
            toDate: "",
            minAmount: "",
            maxAmount: "",
            sortBy: "createdAt",
            sortOrder: "DESC"
          })
        }
        isEmployee={true}
      />

      {/* Vouchers Table */}
      <div className="table-block-wrapper">
        <div className="table-header-meta-row">
          <span className="table-count-label">My Vouchers ({vouchers.length} records)</span>
          <span className="table-access-label">Role isolation: showing only your vouchers</span>
        </div>
        <VoucherTable
          vouchers={vouchers}
          currentRole="employee"
          onView={(v) => setActiveVoucher(v)}
          onEdit={(v) => {
            setVoucherToEdit(v);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteDraft}
          onSubmit={handleSubmitVoucher}
          onPrint={(v) => setPrintVoucher(v)}
        />
      </div>

      {/* Modals */}
      <VoucherFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setVoucherToEdit(null);
        }}
        onSave={handleSaveVoucher}
        voucherToEdit={voucherToEdit}
        currentUser={user}
      />

      <VoucherDetailModal
        voucher={activeVoucher}
        currentRole="employee"
        onClose={() => setActiveVoucher(null)}
        onEdit={(v) => {
          setActiveVoucher(null);
          setVoucherToEdit(v);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteDraft}
        onSubmit={handleSubmitVoucher}
        onPrint={(v) => {
          setActiveVoucher(null);
          setPrintVoucher(v);
        }}
      />

      <SignaturePadModal
        isOpen={Boolean(signatureSubmitVoucher)}
        onClose={() => setSignatureSubmitVoucher(null)}
        onSave={handleSignatureAndSubmit}
        title="Employee Signature Required"
        requiredRole="Employee"
      />

      {printVoucher && (
        <VoucherPrintSlip voucher={printVoucher} onClose={() => setPrintVoucher(null)} />
      )}
    </div>
  );
}