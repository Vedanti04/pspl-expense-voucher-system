import React, { useState, useEffect } from "react";
import { voucherApi } from "../services/api.js";
import { StatCard } from "../components/StatCard.jsx";
import { FilterBar } from "../components/FilterBar.jsx";
import { VoucherTable } from "../components/VoucherTable.jsx";
import { VoucherDetailModal } from "../components/VoucherDetailModal.jsx";
import { VoucherPrintSlip } from "../components/VoucherPrintSlip.jsx";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

export function AccountsDashboard() {
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("approved");

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
  const [notification, setNotification] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const activeFilters = { ...filters };
      if (activeTab === "approved") {
        activeFilters.status = "Approved";
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

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Accounts & Finance Desk</h2>
          <p className="view-subtitle">
            Monitor approved vouchers across the organization, verify signatures, and generate printable reimbursement slips.
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
          title="Total Vouchers"
          value={stats.totalVouchers}
          icon={FileText}
          subtext="Company-wide claims"
          color="blue"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          icon={Clock}
          subtext="Awaiting Director"
          color="amber"
        />
        <StatCard
          title="Approved Vouchers"
          value={stats.approvedVouchers}
          icon={CheckCircle}
          subtext="Ready for payment"
          color="emerald"
        />
        <StatCard
          title="Rejected Vouchers"
          value={stats.rejectedVouchers}
          icon={XCircle}
          subtext="Declined claims"
          color="rose"
        />
        <StatCard
          title="Total Approved"
          value={stats.totalApprovedAmount}
          isCurrency={true}
          icon={IndianRupee}
          subtext="Payable amount"
          color="emerald"
        />
        <StatCard
          title="Pending Pipeline"
          value={stats.totalPendingAmount}
          isCurrency={true}
          icon={IndianRupee}
          subtext="In review pipeline"
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="view-tabs-bar">
        <button
          type="button"
          className={`tab-item-btn ${activeTab === "approved" ? "active-emerald" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          <CheckCircle size={16} /> Approved for Reimbursement
          <span className="tab-counter-badge emerald">
            {stats.approvedVouchers || 0}
          </span>
        </button>

        <button
          type="button"
          className={`tab-item-btn ${activeTab === "all" ? "active-blue" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <FileText size={16} /> All Organization Vouchers
        </button>
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
        isEmployee={false}
      />

      {/* Table */}
      <div className="table-block-wrapper">
        <div className="table-header-meta-row">
          <span className="table-count-label">
            {activeTab === "approved" ? "Approved Vouchers for Reimbursement" : "All Organization Vouchers"} ({vouchers.length} records)
          </span>
          <span className="table-access-label flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-600" /> Accounts Audit & Print Mode
          </span>
        </div>
        <VoucherTable
          vouchers={vouchers}
          currentRole="accounts"
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
        currentRole="accounts"
        onClose={() => setActiveVoucher(null)}
        onPrint={(v) => {
          setActiveVoucher(null);
          setPrintVoucher(v);
        }}
      />

      {printVoucher && (
        <VoucherPrintSlip voucher={printVoucher} onClose={() => setPrintVoucher(null)} />
      )}
    </div>
  );
}