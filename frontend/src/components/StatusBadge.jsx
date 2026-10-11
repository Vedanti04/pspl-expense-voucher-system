import React from "react";

export function StatusBadge({ status }) {
  const normalized = (status || "Draft").toLowerCase().replace(/\s+/g, "-");

  const config = {
    "draft": {
      className: "status-pill-draft",
      label: "Draft"
    },
    "pending-approval": {
      className: "status-pill-pending",
      label: "Pending Approval"
    },
    "approved": {
      className: "status-pill-approved",
      label: "Approved"
    },
    "rejected": {
      className: "status-pill-rejected",
      label: "Rejected"
    }
  };

  const current = config[normalized] || config["draft"];

  return (
    <span className={`status-pill ${current.className}`}>
      <span className="status-dot"></span>
      {current.label}
    </span>
  );
}