import React from "react";

export function StatCard({ title, value, subtext, icon: Icon, isCurrency = false, color = "blue" }) {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0)
    : Number(value || 0).toLocaleString("en-IN");

  return (
    <div className={`metric-card card-accent-${color}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className={`metric-icon-wrap icon-theme-${color}`}>
            <Icon size={17} />
          </div>
        )}
      </div>
      <div className="metric-value">{formattedValue}</div>
      {subtext && <div className="metric-subtext">{subtext}</div>}
    </div>
  );
}