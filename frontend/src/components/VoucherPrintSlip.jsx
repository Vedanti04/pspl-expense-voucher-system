import React from "react";
import { Printer, X } from "lucide-react";
import { getFileUrl } from "../services/api.js";

export function VoucherPrintSlip({ voucher, onClose }) {
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

  function handlePrint() {
    window.print();
  }

  return (
    <div className="modal-backdrop print:p-0 print:bg-white">
      <div className="modal-card max-w-3xl max-h-[95vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:m-0">
        {/* Actions bar - hidden during print */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 print:hidden">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Printable Expense Voucher Slip
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-primary text-xs flex items-center gap-1.5"
              onClick={handlePrint}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button type="button" className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper Voucher Slip */}
        <div className="p-8 bg-white border border-slate-300 rounded-lg text-slate-800 font-sans print:border-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                  Prachay Securities Private Limited
                </h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                  Official Expense Reimbursement Voucher
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">
                  {voucher.voucherNumber}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Generated: {formatDate(voucher.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 uppercase block font-semibold">Employee Details</span>
              <strong className="text-slate-800 text-base">{voucher.employeeName}</strong>
              <div className="text-xs text-slate-600 mt-0.5">
                {voucher.employeeCode ? `ID: ${voucher.employeeCode} | ` : ""}
                Dept: {voucher.department}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase block font-semibold">Voucher Status</span>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                {voucher.status}
              </span>
              <div className="text-xs text-slate-500 mt-1">
                Expense Date: {formatDate(voucher.expenseDate)}
              </div>
            </div>
          </div>

          {/* Expense Itemization Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Expense Itemization
            </h3>
            <table className="w-full text-left text-sm border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 text-xs font-bold uppercase text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Item / Particulars</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Claim Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-3">
                    <strong className="text-slate-800 block">{voucher.expenseTitle}</strong>
                    {voucher.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-normal">{voucher.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap">{voucher.category}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap text-base">
                    {formatCurrency(voucher.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
                <tr>
                  <td colSpan="2" className="py-2.5 px-3 text-right text-xs uppercase text-slate-700">
                    Total Reimbursement Amount:
                  </td>
                  <td className="py-2.5 px-3 text-right text-base text-slate-900">
                    {formatCurrency(voucher.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Approvals Section */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-dashed border-slate-300 mt-8">
            {/* Employee Signature Block */}
            <div className="text-center p-3 border border-slate-200 rounded bg-slate-50">
              <span className="text-xs uppercase font-bold text-slate-500 block mb-2">
                Employee Signature & Submission
              </span>
              <div className="h-20 flex items-center justify-center">
                {voucher.employeeSignature ? (
                  <img
                    src={getFileUrl(voucher.employeeSignature)}
                    alt="Employee Signature"
                    className="max-h-16 max-w-[180px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">No signature on file</span>
                )}
              </div>
              <div className="border-t border-slate-300 pt-1 mt-1">
                <span className="text-xs font-semibold text-slate-800 block">{voucher.employeeName}</span>
                <span className="text-[11px] text-slate-500">Date: {formatDate(voucher.createdAt)}</span>
              </div>
            </div>

            {/* Director Approval Signature Block */}
            <div className="text-center p-3 border border-slate-200 rounded bg-slate-50">
              <span className="text-xs uppercase font-bold text-slate-500 block mb-2">
                Director Approval Authorization
              </span>
              <div className="h-20 flex items-center justify-center">
                {voucher.directorSignature ? (
                  <img
                    src={getFileUrl(voucher.directorSignature)}
                    alt="Director Signature"
                    className="max-h-16 max-w-[180px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    {voucher.status === "Approved" ? "Approved" : "Pending Director Signature"}
                  </span>
                )}
              </div>
              <div className="border-t border-slate-300 pt-1 mt-1">
                <span className="text-xs font-semibold text-slate-800 block">
                  {voucher.directorName || "Authorized Signatory (Director)"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {voucher.approvalDate ? `Date: ${formatDateTime(voucher.approvalDate)}` : "Awaiting Approval"}
                </span>
              </div>
            </div>
          </div>

          {/* Accounts Reimbursement Seal */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
            <span>Accounts Department Verification: Checked & Reconciled</span>
            <span>Document ID: PSPL-VCH-AUTH-{voucher.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}