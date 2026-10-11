import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { LoginPage } from "./views/LoginPage.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { EmployeeDashboard } from "./views/EmployeeDashboard.jsx";
import { DirectorDashboard } from "./views/DirectorDashboard.jsx";
import { AccountsDashboard } from "./views/AccountsDashboard.jsx";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Loading PSPL Expense Desk...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full print:p-0 print:m-0">
        {user.role === "employee" && <EmployeeDashboard />}
        {user.role === "director" && <DirectorDashboard />}
        {user.role === "accounts" && <AccountsDashboard />}
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 print:hidden">
        Prachay Securities Private Limited &bull; Expense Voucher Management System
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}