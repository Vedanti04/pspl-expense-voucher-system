import React, { useState } from "react";
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

export function FilterBar({ filters, onFilterChange, onReset, isEmployee = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const departments = ["Engineering", "Product", "Marketing", "Finance & Accounts", "Sales", "Human Resources", "Operations", "Executive Board"];
  const categories = ["Travel", "Meals", "Accommodation", "Software & IT", "Office Supplies", "Client Meeting", "Equipment", "Other"];
  const statuses = ["Draft", "Pending Approval", "Approved", "Rejected"];

  function update(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.department ||
    filters.category ||
    filters.fromDate ||
    filters.toDate ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.sortBy !== "createdAt"
  );

  return (
    <div className="filter-panel">
      {/* Primary Filter Row */}
      <div className="filter-primary-row">
        {/* Search */}
        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder={isEmployee ? "Search by voucher number, expense title, category..." : "Search by voucher #, employee name, department, title..."}
            value={filters.search || ""}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={filters.status || ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Toggle More Filters */}
        <button
          type="button"
          className={`btn-filter-toggle ${isExpanded ? "active" : ""}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SlidersHorizontal size={15} />
          <span>More Filters</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Clear / Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-filter-reset"
            onClick={onReset}
            title="Reset all filters"
          >
            <RotateCcw size={13} /> Clear
          </button>
        )}
      </div>

      {/* Expanded Multi-Filter Row */}
      {isExpanded && (
        <div className="filter-advanced-grid">
          <div className="filter-field-col">
            <label className="field-label">Department</label>
            <select
              className="field-input"
              value={filters.department || ""}
              onChange={(e) => update("department", e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="filter-field-col">
            <label className="field-label">Expense Category</label>
            <select
              className="field-input"
              value={filters.category || ""}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-field-col">
            <label className="field-label">Expense Date Range</label>
            <div className="range-inputs-row">
              <input
                type="date"
                className="field-input"
                title="From Date"
                value={filters.fromDate || ""}
                onChange={(e) => update("fromDate", e.target.value)}
              />
              <span className="range-sep">to</span>
              <input
                type="date"
                className="field-input"
                title="To Date"
                value={filters.toDate || ""}
                onChange={(e) => update("toDate", e.target.value)}
              />
            </div>
          </div>

          <div className="filter-field-col">
            <label className="field-label">Claim Amount Range (₹)</label>
            <div className="range-inputs-row">
              <input
                type="number"
                min="0"
                className="field-input"
                placeholder="Min ₹"
                value={filters.minAmount || ""}
                onChange={(e) => update("minAmount", e.target.value)}
              />
              <span className="range-sep">-</span>
              <input
                type="number"
                min="0"
                className="field-input"
                placeholder="Max ₹"
                value={filters.maxAmount || ""}
                onChange={(e) => update("maxAmount", e.target.value)}
              />
            </div>
          </div>

          {/* Sort Controls */}
          <div className="filter-sort-row">
            <span className="sort-label">Sort results by:</span>
            <div className="sort-controls">
              <select
                className="field-input field-input-compact"
                value={filters.sortBy || "createdAt"}
                onChange={(e) => update("sortBy", e.target.value)}
              >
                <option value="createdAt">Date Created</option>
                <option value="expenseDate">Expense Date</option>
                <option value="amount">Amount</option>
                <option value="voucherNumber">Voucher Number</option>
                <option value="status">Status</option>
              </select>
              <select
                className="field-input field-input-compact"
                value={filters.sortOrder || "DESC"}
                onChange={(e) => update("sortOrder", e.target.value)}
              >
                <option value="DESC">Descending (Newest / Highest)</option>
                <option value="ASC">Ascending (Oldest / Lowest)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}