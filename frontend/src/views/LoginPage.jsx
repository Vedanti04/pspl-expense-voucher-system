import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { ShieldCheck, UserCheck, Briefcase, FileCheck, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("employee@pspl.demo");
  const [password, setPassword] = useState("Employee123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    {
      role: "Employee",
      name: "Aarav Sharma",
      email: "employee@pspl.demo",
      password: "Employee123!",
      icon: UserCheck,
      badgeColor: "role-badge-blue",
      tag: "Submit & Track Claims",
      desc: "Full Employee draft creation, signature upload & claim submission"
    },
    {
      role: "Director",
      name: "Vikram Malhotra",
      email: "director@pspl.demo",
      password: "Director123!",
      icon: ShieldCheck,
      badgeColor: "role-badge-purple",
      tag: "Approval Authority",
      desc: "Review organization claims, sign & approve, or reject with reason"
    },
    {
      role: "Accounts Team",
      name: "Priya Sundaram",
      email: "accounts@pspl.demo",
      password: "Accounts123!",
      icon: Briefcase,
      badgeColor: "role-badge-emerald",
      tag: "Audit & Reimburse",
      desc: "Monitor all approved claims, verify signatures, print voucher slips"
    }
  ];

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleQuickLogin(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setIsSubmitting(true);
    login(account.email, account.password).catch((err) => {
      setError(err.message || "Login failed");
      setIsSubmitting(false);
    });
  }

  return (
    <div className="login-page-wrapper">
      {/* Background Decor */}
      <div className="login-bg-glow"></div>

      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-badge">
            <FileCheck size={14} className="text-blue-500" />
            <span>PRACHAY SECURITIES PRIVATE LIMITED</span>
          </div>
          <h1 className="login-title">Expense Voucher Desk</h1>
          <p className="login-subtitle">
            Enterprise workflow system for employee expense submissions, executive approvals, and accounts reimbursement processing.
          </p>
        </div>

        {/* Login Card */}
        <div className="login-box">
          <div className="login-box-header">
            <h2>Sign In</h2>
            <p>Access your role-specific dashboard with authorized credentials.</p>
          </div>

          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-container">
                <Mail size={17} className="input-leading-icon" />
                <input
                  type="email"
                  required
                  className="form-input with-icon"
                  placeholder="name@pspl.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-container">
                <Lock size={17} className="input-leading-icon" />
                <input
                  type="password"
                  required
                  className="form-input with-icon"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-login-submit"
            >
              {isSubmitting ? "Authenticating..." : "Sign In to Workspace"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="demo-section">
            <div className="demo-header">
              <div className="demo-title-row">
                <Sparkles size={14} className="text-amber-500" />
                <span>1-CLICK QUICK DEMO EVALUATION</span>
              </div>
              <span className="demo-hint">Click role to auto-login</span>
            </div>

            <div className="demo-card-list">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                const isSelected = email === account.email;
                return (
                  <button
                    key={account.role}
                    type="button"
                    className={`demo-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleQuickLogin(account)}
                  >
                    <div className="demo-item-left">
                      <div className={`demo-avatar ${account.badgeColor}`}>
                        <Icon size={17} />
                      </div>
                      <div className="demo-text">
                        <div className="demo-name-row">
                          <span className="demo-name">{account.name}</span>
                          <span className={`demo-pill ${account.badgeColor}`}>{account.role}</span>
                        </div>
                        <span className="demo-email">{account.email}</span>
                      </div>
                    </div>
                    <div className="demo-action">
                      <span className="demo-tag">{account.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Prachay Securities Private Limited &bull; Full Stack Placement Evaluation</p>
        </div>
      </div>
    </div>
  );
}