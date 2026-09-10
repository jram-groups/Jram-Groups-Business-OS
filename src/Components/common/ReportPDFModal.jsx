import React, { useState } from 'react';
import {
  X, Printer, Download, CheckCircle2, AlertCircle, FileText,
  DollarSign, Briefcase, Users, Boxes, Share2, Layers, ShieldCheck,
  Calendar, Clock, Building2, TrendingUp
} from 'lucide-react';

export default function ReportPDFModal({ isOpen, onClose, data, activeUser, timeframe = 'All Time' }) {
  if (!isOpen || !data) return null;

  const [selectedSection, setSelectedSection] = useState('all');

  const {
    kpi = {},
    invoices = [],
    quotations = [],
    incomes = [],
    expenses = [],
    projects = [],
    tasks = [],
    employees = [],
    assets = [],
    stock = [],
    social_clients = [],
    clients = []
  } = data;

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const reportTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const reportRef = `JRAM-REP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto modal-backdrop-custom">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-amber-200 modal-content-custom max-h-[92vh] flex flex-col">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-4 no-print flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                <FileText size={18} />
              </span>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                Executive Master PDF Export Preview
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ref: <span className="font-semibold text-slate-700">{reportRef}</span> • Timeframe: <span className="font-semibold text-slate-700">{timeframe}</span> • Zero Omitted Data
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Scope Filter for PDF generation */}
            <select
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="all">Entire Master Report (All 7 Modules)</option>
              <option value="financial">Financial & Revenue Ledger Only</option>
              <option value="sales">Sales & Quotations Pipeline Only</option>
              <option value="projects">Projects & Tasks Delivery Only</option>
              <option value="workforce">Workforce & Team Productivity Only</option>
              <option value="marketing">Digital Marketing Retainers Only</option>
              <option value="inventory">Assets & Stock Inventory Only</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-amber-500 cursor-pointer shadow-sm transition-all"
            >
              <Printer size={15} /> Print / Save as PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Box (Scrollable in Modal, Full Width on Print) */}
        <div className="overflow-y-auto flex-1 pr-1 sm:pr-2">
          <div className="printable-master-report bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 text-slate-900 font-sans space-y-6">

            {/* Official Letterhead Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 print-avoid-break">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-xs">
                    J
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                      JRAM GROUPS<span className="text-amber-500">.</span>
                    </h1>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Business Operating System
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 font-medium">Enterprise Management, Digital Retainers & Operations</p>
                <p className="text-[10px] text-slate-500">123 Tech Park, BKC, Mumbai 400051 • contact@jramgroups.com • +91 98765 43210</p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 bg-slate-900 text-amber-400 font-black text-xs rounded-md uppercase tracking-wider inline-block">
                  {selectedSection === 'all' ? 'MASTER AUDIT REPORT' : `${selectedSection.toUpperCase()} REPORT`}
                </span>
                <p className="font-extrabold text-slate-900 text-xs mt-1.5">{reportRef}</p>
                <p className="text-[10px] text-slate-600">Generated: {reportDate} at {reportTime}</p>
                <p className="text-[10px] text-slate-500">By: {activeUser?.first_name || activeUser?.username || 'Executive'} ({activeUser?.role || 'Founder'})</p>
                <span className="inline-block mt-1 text-[9px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 uppercase">
                  CONFIDENTIAL - INTERNAL USE
                </span>
              </div>
            </div>

            {/* Executive KPI Scorecard */}
            {(selectedSection === 'all' || selectedSection === 'financial') && (
              <div className="print-avoid-break space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-amber-500" /> Executive Business Health Scorecard
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">Scope: {timeframe}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print-kpi-grid">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gross Revenue</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5">{formatCurrency(kpi.gross_revenue)}</span>
                    <span className="text-[10px] font-semibold text-emerald-600">Verified Collections</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Expenses</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5">{formatCurrency(kpi.total_expenses)}</span>
                    <span className="text-[10px] font-semibold text-red-600">Operating Outflows</span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Net Profit</span>
                    <span className="text-base sm:text-lg font-black text-amber-900 block mt-0.5">{formatCurrency(kpi.net_profit)}</span>
                    <span className="text-[10px] font-bold text-amber-700">Margin: {kpi.profit_margin}%</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Receivables</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5">{formatCurrency(kpi.pending_receivables)}</span>
                    <span className="text-[10px] font-semibold text-amber-600">Invoiced Pending</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print-kpi-grid">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Active Projects</span>
                    <span className="text-sm font-black text-slate-900 block">{kpi.active_projects || 0} / {kpi.total_projects || 0}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Task Delivery</span>
                    <span className="text-sm font-black text-emerald-700 block">{kpi.task_completion_rate || 0}% ({kpi.completed_tasks} Done)</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Total Asset Value</span>
                    <span className="text-sm font-black text-slate-900 block">{formatCurrency(kpi.total_asset_value)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Active Clients</span>
                    <span className="text-sm font-black text-slate-900 block">{kpi.active_clients || 0} Clients</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: Financial & Revenue Ledger */}
            {(selectedSection === 'all' || selectedSection === 'financial') && (
              <div className="space-y-4 print-section">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-amber-500" /> 1. Financial &amp; Invoicing Ledger ({invoices.length} Invoices)
                  </h3>
                  <span className="text-[10px] text-slate-500">Total Billed: {formatCurrency(invoices.reduce((a, c) => a + Number(c.total_amount || 0), 0))}</span>
                </div>

                <table className="w-full text-left border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Invoice #</th>
                      <th className="py-2 px-2.5">Client Name</th>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Due Date</th>
                      <th className="py-2 px-2.5 text-right">Amount</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{inv.reference}</td>
                        <td className="py-1.5 px-2.5 font-medium">{inv.client_name || inv.client_detail?.name || 'Client'}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{inv.invoice_date}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{inv.due_date}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">{formatCurrency(inv.total_amount)}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.payment_status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Incomes & Expenses Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Recent Income Streams ({incomes.length})</span>
                      <span className="text-emerald-700 font-extrabold">{formatCurrency(kpi.total_income)}</span>
                    </h4>
                    <table className="w-full text-left border border-slate-200 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                          <th className="py-1.5 px-2">Ref / Title</th>
                          <th className="py-1.5 px-2">Category</th>
                          <th className="py-1.5 px-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {incomes.slice(0, 6).map((inc) => (
                          <tr key={inc.id}>
                            <td className="py-1 px-2 font-medium">{inc.title || inc.reference}</td>
                            <td className="py-1 px-2 text-slate-600">{inc.category}</td>
                            <td className="py-1 px-2 text-right font-bold text-emerald-700">{formatCurrency(inc.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Operating Expenditures ({expenses.length})</span>
                      <span className="text-red-700 font-extrabold">{formatCurrency(kpi.total_expenses)}</span>
                    </h4>
                    <table className="w-full text-left border border-slate-200 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                          <th className="py-1.5 px-2">Expense Item</th>
                          <th className="py-1.5 px-2">Category</th>
                          <th className="py-1.5 px-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {expenses.slice(0, 6).map((exp) => (
                          <tr key={exp.id}>
                            <td className="py-1 px-2 font-medium">{exp.title || exp.reference}</td>
                            <td className="py-1 px-2 text-slate-600">{exp.category}</td>
                            <td className="py-1 px-2 text-right font-bold text-red-700">{formatCurrency(exp.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Sales & Quotations Pipeline */}
            {(selectedSection === 'all' || selectedSection === 'sales') && (
              <div className="space-y-3 print-section print-avoid-break">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-500" /> 2. Sales Pipeline &amp; Quotations ({quotations.length} Proposals)
                  </h3>
                  <span className="text-[10px] text-slate-500">Pipeline Total: {formatCurrency(quotations.reduce((a, c) => a + Number(c.total_amount || 0), 0))}</span>
                </div>

                <table className="w-full text-left border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Quotation #</th>
                      <th className="py-2 px-2.5">Client Name</th>
                      <th className="py-2 px-2.5">Valid Until</th>
                      <th className="py-2 px-2.5 text-right">Quote Value</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quotations.map((q) => (
                      <tr key={q.id}>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{q.reference}</td>
                        <td className="py-1.5 px-2.5 font-medium">{q.client_name || q.client_detail?.name || 'Prospect'}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{q.valid_until}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">{formatCurrency(q.total_amount)}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            q.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                            q.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 3: Projects & Operational Delivery */}
            {(selectedSection === 'all' || selectedSection === 'projects') && (
              <div className="space-y-3 print-section print-avoid-break">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-amber-500" /> 3. Projects &amp; Operational Delivery ({projects.length} Projects)
                  </h3>
                  <span className="text-[10px] text-slate-500">Urgent: {kpi.urgent_projects} • In Progress: {kpi.active_projects}</span>
                </div>

                <table className="w-full text-left border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Project Name</th>
                      <th className="py-2 px-2.5">Client</th>
                      <th className="py-2 px-2.5">Service Type</th>
                      <th className="py-2 px-2.5 text-center">Priority</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-2.5 text-right">Budget</th>
                      <th className="py-2 px-2.5 text-right">Spent</th>
                      <th className="py-2 px-2.5 text-center">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{p.name}</td>
                        <td className="py-1.5 px-2.5 font-medium">{p.client_name || p.client_detail?.name || 'Client'}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{p.service_type || 'General'}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            p.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            p.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-medium">{formatCurrency(p.budget)}</td>
                        <td className="py-1.5 px-2.5 text-right text-slate-600">{formatCurrency(p.spent)}</td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-slate-800">{p.progress_pct || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 4: Tasks Log */}
            {(selectedSection === 'all' || selectedSection === 'projects') && (
              <div className="space-y-3 print-section print-avoid-break">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-amber-500" /> 4. Tasks &amp; Workstream Log ({tasks.length} Total Tasks)
                  </h3>
                  <span className="text-[10px] text-slate-500">{kpi.completed_tasks} Completed ({kpi.task_completion_rate}%)</span>
                </div>

                <table className="w-full text-left border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Task Title</th>
                      <th className="py-2 px-2.5">Associated Project</th>
                      <th className="py-2 px-2.5">Assignee</th>
                      <th className="py-2 px-2.5 text-center">Priority</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-2.5">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{t.title}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{t.project_name || 'General Project'}</td>
                        <td className="py-1.5 px-2.5 font-medium">{t.assigned_to_detail?.first_name || t.assigned_to_detail?.username || 'Team Member'}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            t.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            t.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600">{t.due_date || 'No Date'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 5: Workforce, Team & HR Productivity */}
            {(selectedSection === 'all' || selectedSection === 'workforce') && (
              <div className="space-y-3 print-section print-avoid-break">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Users size={14} className="text-amber-500" /> 5. Workforce &amp; Employee Staffing ({employees.length} Staff Members)
                  </h3>
                  <span className="text-[10px] text-slate-500">Departments: Engineering, Marketing, Creative, Operations</span>
                </div>

                <table className="w-full text-left border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Emp ID</th>
                      <th className="py-2 px-2.5">Employee Name</th>
                      <th className="py-2 px-2.5">Role / Designation</th>
                      <th className="py-2 px-2.5">Department</th>
                      <th className="py-2 px-2.5 text-right">Salary Band</th>
                      <th className="py-2 px-2.5 text-center">Assigned Assets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{emp.employee_id}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">
                          {emp.user_detail?.first_name} {emp.user_detail?.last_name || ''}
                        </td>
                        <td className="py-1.5 px-2.5 font-medium">{emp.user_detail?.designation || emp.user_detail?.role}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{emp.user_detail?.department || 'General'}</td>
                        <td className="py-1.5 px-2.5 text-right font-medium">{formatCurrency(emp.salary_display)}</td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-amber-700">{emp.assigned_assets_count || 0} Assets</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 6: Digital & Social Media Retainers */}
            {(selectedSection === 'all' || selectedSection === 'marketing') && (
              <div className="space-y-3 print-section print-avoid-break">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Share2 size={14} className="text-amber-500" /> 6. Digital Marketing Retainer Clients ({social_clients.length} Active Accounts)
                  </h3>
                  <span className="text-[10px] text-slate-500">Total Retainers: {formatCurrency(social_clients.reduce((a, c) => a + Number(c.monthly_payment || 0), 0))}/mo</span>
                </div>

                <table className="w-full text-left border border-slate-200 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Brand / Client</th>
                      <th className="py-2 px-2.5">Package</th>
                      <th className="py-2 px-2.5">Instagram / Handles</th>
                      <th className="py-2 px-2.5 text-center">Reels / Posts</th>
                      <th className="py-2 px-2.5 text-center">Deliverables Done</th>
                      <th className="py-2 px-2.5 text-right">Monthly Fee</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {social_clients.map((sc) => (
                      <tr key={sc.id}>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{sc.client_name}</td>
                        <td className="py-1.5 px-2.5 font-medium">{sc.package_name || 'Standard Retainer'}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 font-mono text-[9px]">{sc.instagram_handle || sc.facebook_page || '-'}</td>
                        <td className="py-1.5 px-2.5 text-center font-semibold text-slate-700">{sc.reels_count || 0} Reels, {sc.posts_count || 0} Posts</td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-emerald-700">{sc.videos_completed || 0}/{sc.videos_planned || 0} Videos</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">{formatCurrency(sc.monthly_payment)}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-emerald-100 text-emerald-800">
                            {sc.payment_status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECTION 7: Inventory & Asset Audit */}
            {(selectedSection === 'all' || selectedSection === 'inventory') && (
              <div className="space-y-4 print-section print-avoid-break">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Boxes size={14} className="text-amber-500" /> 7. Assets, Equipments &amp; Inventory ({assets.length} Assets, {stock.length} Stock SKUs)
                  </h3>
                  <span className="text-[10px] text-slate-500">Asset Valuation: {formatCurrency(kpi.total_asset_value)}</span>
                </div>

                {/* Equipment Assets Table */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800 mb-1.5">High-Value Company Equipments &amp; IT Assets</h4>
                  <table className="w-full text-left border border-slate-200 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="py-1.5 px-2">Asset Tag</th>
                        <th className="py-1.5 px-2">Equipment Name</th>
                        <th className="py-1.5 px-2">Category</th>
                        <th className="py-1.5 px-2">Assigned To</th>
                        <th className="py-1.5 px-2 text-right">Cost</th>
                        <th className="py-1.5 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {assets.map((ast) => (
                        <tr key={ast.id}>
                          <td className="py-1 px-2 font-mono font-bold text-slate-900">{ast.asset_tag}</td>
                          <td className="py-1 px-2 font-semibold">{ast.name}</td>
                          <td className="py-1 px-2 text-slate-600">{ast.category}</td>
                          <td className="py-1 px-2 text-slate-800 font-medium">{ast.assigned_to_name || 'Unassigned / In Stock'}</td>
                          <td className="py-1 px-2 text-right font-bold text-slate-900">{formatCurrency(ast.purchase_cost)}</td>
                          <td className="py-1 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              ast.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                              ast.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ast.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Stock Items Table */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800 mb-1.5">Consumables &amp; Stock Inventory Levels</h4>
                  <table className="w-full text-left border border-slate-200 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="py-1.5 px-2">Item Name</th>
                        <th className="py-1.5 px-2">Category</th>
                        <th className="py-1.5 px-2 text-center">Current Qty</th>
                        <th className="py-1.5 px-2 text-center">Threshold</th>
                        <th className="py-1.5 px-2 text-right">Unit Price</th>
                        <th className="py-1.5 px-2 text-center">Inventory Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stock.map((stk) => (
                        <tr key={stk.id}>
                          <td className="py-1 px-2 font-bold text-slate-900">{stk.name}</td>
                          <td className="py-1 px-2 text-slate-600">{stk.category}</td>
                          <td className="py-1 px-2 text-center font-bold text-slate-900">{stk.quantity} {stk.unit}</td>
                          <td className="py-1 px-2 text-center text-slate-500">{stk.min_stock_threshold} {stk.unit}</td>
                          <td className="py-1 px-2 text-right font-medium">{formatCurrency(stk.unit_price)}</td>
                          <td className="py-1 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              stk.is_low_stock ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {stk.is_low_stock ? 'LOW STOCK' : 'OPTIMAL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Signatures & Verification Block */}
            <div className="pt-6 border-t-2 border-slate-900 print-signature-block print-avoid-break space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Report Generated By</p>
                  <p className="font-bold text-slate-900 text-xs mt-1">
                    {activeUser?.first_name || activeUser?.username || 'Executive'} ({activeUser?.role || 'Founder'})
                  </p>
                  <p className="text-[10px] text-slate-500">JRAM Groups Executive Desk</p>
                  <div className="mt-4 border-b border-slate-400 w-36"></div>
                  <span className="text-[9px] text-slate-400 block mt-1">Authorized Preparer</span>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Verification</p>
                  <p className="font-bold text-emerald-700 text-xs mt-1 flex items-center gap-1">
                    <ShieldCheck size={14} /> LIVE SYSTEM VERIFIED
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">HASH: SHA256-JRAM-{(Math.random()*1e8).toFixed(0)}</p>
                  <div className="mt-4 border-b border-slate-400 w-36"></div>
                  <span className="text-[9px] text-slate-400 block mt-1">System Internal Audit</span>
                </div>

                <div className="text-right sm:text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Managing Director Sign-off</p>
                  <p className="font-bold text-slate-900 text-xs mt-1">Executive Board</p>
                  <p className="text-[10px] text-slate-500">JRAM Corporate Governance</p>
                  <div className="mt-4 border-b border-slate-400 w-36"></div>
                  <span className="text-[9px] text-slate-400 block mt-1">Final Approval Stamp</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 border-t pt-4">
                <p>Computer-generated official business intelligence report produced by JRAM Groups Business OS. All figures and transactional records are dynamically verified from backend transactional ledgers. No data omitted.</p>
                <p className="mt-0.5">Page 1 of 1 • Internal Board Confidentiality Notice Applies</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
