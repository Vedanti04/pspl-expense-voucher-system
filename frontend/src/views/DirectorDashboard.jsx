import React, { useState, useEffect } from "react";
import { voucherApi } from "../services/api.js";
import { StatCard } from "../components/StatCard.jsx";
import { FilterBar } from "../components/FilterBar.jsx";
import { VoucherTable } from "../components/VoucherTable.jsx";
import { VoucherDetailModal } from "../components/VoucherDetailModal.jsx";
import { VoucherPrintSlip } from "../components/VoucherPrintSlip.jsx";
import { SignaturePadModal } from "../components/SignaturePadModal.jsx";
import {
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  RefreshCw,
  Layers,
  Inbox
} from "lucide-react";

export function DirectorDashboard() {
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

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
  const [printVoucher, setPrintVoucher] = useState(null);
  const [approvalTargetVoucher, setApprovalTargetVoucher] = useState(null);
  const [notification, setNotification] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const activeFilters = { ...filters };
      if (activeTab === "pending") {
        activeFilters.status = "Pending Approval";
      }

      const [vRes, sRes] = await Promise.all([
        voucherApi.getVouchers(activeFilters),
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
  }, [filters, activeTab]);

  function showNotice(type, text) {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  }

  function handleInitiateApprove(voucher) {
    setApprovalTargetVoucher(voucher);
  }

  async function handleConfirmApproval(sig) {
    if (!approvalTargetVoucher) return;
    try {
      const payload = {};
      if (sig.type === "base64") {
        payload.signatureBase64 = sig.data;
      } else if (sig.file) {
        const fd = new FormData();
        fd.append("signature", sig.file);
        await voucherApi.approveVoucher(approvalTargetVoucher.id, fd);
        showNotice("success", `Voucher ${approvalTargetVoucher.voucherNumber} approved successfully.`);
        setApprovalTargetVoucher(null);
        if (activeVoucher?.id === approvalTargetVoucher.id) setActiveVoucher(null);
        await loadData();
        return;
      }

      const res = await voucherApi.approveVoucher(approvalTargetVoucher.id, payload);
      showNotice("success", `Voucher ${res.voucher?.voucherNumber || approvalTargetVoucher.voucherNumber} approved successfully.`);
      setApprovalTargetVoucher(null);
      if (activeVoucher?.id === approvalTargetVoucher.id) setActiveVoucher(null);
      await loadData();
    } catch (err) {
      showNotice("error", err.message || "Approval failed.");
    }
  }

  async function handleReject(voucher, reason) {
    try {
      const res = await voucherApi.rejectVoucher(voucher.id, reason);
      showNotice("success", `Voucher ${res.voucher.voucherNumber} rejected with remarks.`);
      if (activeVoucher?.id === voucher.id) setActiveVoucher(null);
      await loadData();
    } catch (err) {
      showNotice("error", err.message || "Rejection failed.");
    }
  }

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Director Executive Desk</h2>
          <p className="view-subtitle">
            Review submitted reimbursement claims, authorize approval with your executive signature, or reject with feedback.
          </p>
        </div>
        <button
          type="button"
          className="btn-header-secondary"
          onClick={loadData}
          title="Refresh list"
        >
          <RefreshCw size={14} className={loading ? "spin-animation" : ""} /> Refresh
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="toast-close">×</button>
        </div>
      )}

      {/* 5 KPI Cards (Section 8) */}
      <div className="metrics-grid-five">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApproval}
          icon={Clock}
          subtext="Requires executive action"
          color="amber"
        />
        <StatCard
          title="Approved Today"
          value={stats.approvedToday}
          icon={CheckCircle}
          subtext="Cleared today"
          color="emerald"
        />
        <StatCard
          title="Rejected Today"
          value={stats.rejectedToday}
          icon={XCircle}
          subtext="Returned today"
          color="rose"
        />
        <StatCard
          title="Total Pending Amount"
          value={stats.totalPendingAmount}
          isCurrency={true}
          icon={IndianRupee}
          subtext="In review pipeline"
          color="amber"
        />
        <StatCard
          title="Organization Claims"
          value={stats.totalVouchers}
          icon={Layers}
          subtext="All organization vouchers"
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="view-tabs-bar">
        <button
          type="button"
          className={`tab-item-btn ${activeTab === "pending" ? "active-amber" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <Inbox size={16} /> Pending Approval Queue
          {stats.pendingApproval > 0 && (
            <span className="tab-counter-badge amber">
              {stats.pendingApproval}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`tab-item-btn ${activeTab === "all" ? "active-blue" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <Layers size={16} /> All Organization Vouchers
        </button>
      </div>

      {/* Filters */}
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
        isEmployee={false}
      />

      {/* Table */}
      <div className="table-block-wrapper">
        <div className="table-header-meta-row">
          <span className="table-count-label">
            {activeTab === "pending" ? "Vouchers Requiring Executive Approval" : "All Organization Vouchers"} ({vouchers.length} records)
          </span>
          <span className="table-access-label">Executive Authorization Privileges</span>
        </div>
        <VoucherTable
          vouchers={vouchers}
          currentRole="director"
          onView={(v) => setActiveVoucher(v)}
          onEdit={() => {}}
          onDelete={() => {}}
          onSubmit={() => {}}
          onPrint={(v) => setPrintVoucher(v)}
        />
      </div>

      {/* Modals */}
      <VoucherDetailModal
        voucher={activeVoucher}
        currentRole="director"
        onClose={() => setActiveVoucher(null)}
        onApprove={handleInitiateApprove}
        onReject={handleReject}
        onPrint={(v) => {
          setActiveVoucher(null);
          setPrintVoucher(v);
        }}
      />

      <SignaturePadModal
        isOpen={Boolean(approvalTargetVoucher)}
        onClose={() => setApprovalTargetVoucher(null)}
        onSave={handleConfirmApproval}
        title="Director Signature Authorization"
        requiredRole="Director"
      />

      {printVoucher && (
        <VoucherPrintSlip voucher={printVoucher} onClose={() => setPrintVoucher(null)} />
      )}
    </div>
  );
}