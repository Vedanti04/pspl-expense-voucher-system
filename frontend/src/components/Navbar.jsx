import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut, Shield, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const roleColors = {
    employee: "role-pill-blue",
    director: "role-pill-purple",
    accounts: "role-pill-emerald"
  };

  const pillClass = roleColors[user?.role] || "role-pill-blue";

  return (
    <header className="app-navbar print:hidden">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="navbar-logo">
            <span>P</span>
          </div>
          <div className="navbar-title-wrap">
            <div className="navbar-company-row">
              <span className="navbar-company-name">PRACHAY SECURITIES</span>
              <span className="navbar-badge">EXPENSE DESK</span>
            </div>
            <span className="navbar-sub">Voucher Approval & Reimbursement Portal</span>
          </div>
        </div>

        {/* User Session Info */}
        <div className="navbar-user-section">
          <div className="user-profile-meta">
            <span className="user-display-name">{user?.name}</span>
            <span className="user-dept">
              {user?.department || "Corporate"} {user?.employee_id ? `• ${user.employee_id}` : ""}
            </span>
          </div>

          <span className={`role-badge ${pillClass}`}>
            {user?.role}
          </span>

          <div className="user-avatar-circle" title={user?.name}>
            {getInitials(user?.name)}
          </div>

          <button
            type="button"
            className="btn-logout"
            title="Sign Out"
            onClick={logout}
          >
            <LogOut size={16} />
            <span className="hidden-mobile">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}