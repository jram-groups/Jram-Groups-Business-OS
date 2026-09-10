import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from "react-router-dom";
import Login from "./Components/auth/Login";
import Layout from "./Components/Layout";
import Dashboard from "./Components/pages/Dashboard";
import Clients from "./Components/pages/Clients";
import Projects from "./Components/pages/Projects";
import Tasks from "./Components/pages/Tasks";
import DigitalMarketing from "./Components/pages/DigitalMarketing";
import Quotations from "./Components/pages/Quotations";
import QuotationGenerator from "./Components/pages/QuotationGenerator";
import Invoices from "./Components/pages/Invoices";
import InvoiceGenerator from "./Components/pages/InvoiceGenerator";
import IncomeTracking from "./Components/pages/IncomeTracking";
import ExpenseTracking from "./Components/pages/ExpenseTracking";
import Financial from "./Components/pages/Financial";
import StockEquipments from "./Components/pages/StockEquipments";
import Employees from "./Components/pages/Employees";
import Reports from "./Components/pages/Reports";
import ActivityLogs from "./Components/pages/ActivityLogs";
import Settings from "./Components/pages/Settings";
import Profile from "./Components/pages/Profile";
import AccessDenied from "./Components/common/AccessDenied";
import { hasAccess } from "./services/rbac";
import { api } from "./services/api";

function RouteGuard({ module, element }) {
  const context = useOutletContext();
  const activeUser = context?.user || api.auth.getActiveUser();
  const role = activeUser?.role || 'FOUNDER';

  if (!hasAccess(role, module)) {
    return <AccessDenied moduleName={module.toUpperCase().replace('-', ' ')} userRole={role} />;
  }

  return element;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/quotations/new" element={<RouteGuard module="quotations" element={<QuotationGenerator />} />} />
        <Route path="/quotations/edit/:id" element={<RouteGuard module="quotations" element={<QuotationGenerator />} />} />
        <Route path="/invoices/new" element={<RouteGuard module="invoices" element={<InvoiceGenerator />} />} />
        <Route path="/invoices/edit/:id" element={<RouteGuard module="invoices" element={<InvoiceGenerator />} />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<RouteGuard module="dashboard" element={<Dashboard />} />} />
          <Route path="/clients" element={<RouteGuard module="clients" element={<Clients />} />} />
          <Route path="/projects" element={<RouteGuard module="projects" element={<Projects />} />} />
          <Route path="/tasks" element={<RouteGuard module="tasks" element={<Tasks />} />} />
          <Route path="/digital-marketing" element={<RouteGuard module="digital-marketing" element={<DigitalMarketing />} />} />
          <Route path="/quotations" element={<RouteGuard module="quotations" element={<Quotations />} />} />
          <Route path="/invoices" element={<RouteGuard module="invoices" element={<Invoices />} />} />
          <Route path="/income" element={<RouteGuard module="income" element={<IncomeTracking />} />} />
          <Route path="/expenses" element={<RouteGuard module="expenses" element={<ExpenseTracking />} />} />
          <Route path="/financial" element={<RouteGuard module="financial" element={<Financial />} />} />
          <Route path="/stock-equipments" element={<RouteGuard module="stock-equipments" element={<StockEquipments />} />} />
          <Route path="/employees" element={<RouteGuard module="employees" element={<Employees />} />} />
          <Route path="/reports" element={<RouteGuard module="reports" element={<Reports />} />} />
          <Route path="/activity-logs" element={<RouteGuard module="activity-logs" element={<ActivityLogs />} />} />
          <Route path="/settings" element={<RouteGuard module="settings" element={<Settings />} />} />
          <Route path="/profile" element={<RouteGuard module="profile" element={<Profile />} />} />

          {/* Clean Redirects */}
          <Route path="/inventory" element={<Navigate to="/stock-equipments" replace />} />
          <Route path="/stocks" element={<Navigate to="/stock-equipments" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;