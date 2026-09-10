import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3, Calendar, Filter, Download, TrendingUp, Users,
  CheckCircle2, DollarSign, Briefcase, FileText, Receipt,
  Boxes, Share2, ShieldCheck, RefreshCw, Search, ArrowUpRight,
  Target, AlertTriangle, ChevronRight, Layers, Eye, Printer, Sparkles,
  ArrowDownRight, CheckCircle, Clock, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../services/api';
import ReportPDFModal from '../common/ReportPDFModal';

export default function Reports() {
  const { user } = useOutletContext() || {};
  const [timeframe, setTimeframe] = useState('Monthly');
  const [activeTab, setActiveTab] = useState('master');
  const [searchQuery, setSearchQuery] = useState('');
  const [masterData, setMasterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const fetchReportsData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.reports.getMasterReport();
      if (res.success) {
        setMasterData(res);
      }
    } catch (e) {
      console.warn('Master report endpoint fallback:', e);
      try {
        const [dashRes, anaRes, invRes, quoRes, incRes, expRes, prjRes, tskRes, empRes, astRes, stkRes, mktRes] = await Promise.all([
          api.reports.getDashboardStats().catch(() => ({ stats: {} })),
          api.reports.getAnalytics().catch(() => ({ analytics: {} })),
          api.finance.getInvoices().catch(() => ({ data: [] })),
          api.finance.getQuotations().catch(() => ({ data: [] })),
          api.finance.getIncome().catch(() => ({ data: [] })),
          api.finance.getExpenses().catch(() => ({ data: [] })),
          api.projects.list().catch(() => ({ data: [] })),
          api.tasks.list().catch(() => ({ data: [] })),
          api.employees.list().catch(() => ({ data: [] })),
          api.inventory.getAssets().catch(() => ({ data: [] })),
          api.inventory.getStock().catch(() => ({ data: [] })),
          api.marketing.listSocialClients().catch(() => ({ data: [] })),
        ]);

        setMasterData({
          success: true,
          kpi: dashRes.stats || {},
          monthly_revenue: anaRes.analytics?.monthly_revenue || [],
          invoices: invRes.data || invRes.results || (Array.isArray(invRes) ? invRes : []),
          quotations: quoRes.data || quoRes.results || (Array.isArray(quoRes) ? quoRes : []),
          incomes: incRes.data || incRes.results || (Array.isArray(incRes) ? incRes : []),
          expenses: expRes.data || expRes.results || (Array.isArray(expRes) ? expRes : []),
          projects: prjRes.data || prjRes.results || (Array.isArray(prjRes) ? prjRes : []),
          tasks: tskRes.data || tskRes.results || (Array.isArray(tskRes) ? tskRes : []),
          employees: empRes.data || empRes.results || (Array.isArray(empRes) ? empRes : []),
          assets: astRes.data || astRes.results || (Array.isArray(astRes) ? astRes : []),
          stock: stkRes.data || stkRes.results || (Array.isArray(stkRes) ? stkRes : []),
          social_clients: mktRes.data || mktRes.results || (Array.isArray(mktRes) ? mktRes : []),
        });
      } catch (err2) {
        console.error('Fallback fetching also failed:', err2);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [timeframe]);

  const kpi = masterData?.kpi || {};
  const invoices = masterData?.invoices || [];
  const quotations = masterData?.quotations || [];
  const incomes = masterData?.incomes || [];
  const expenses = masterData?.expenses || [];
  const projects = masterData?.projects || [];
  const tasks = masterData?.tasks || [];
  const employees = masterData?.employees || [];
  const assets = masterData?.assets || [];
  const stock = masterData?.stock || [];
  const social_clients = masterData?.social_clients || [];
  const monthlyRevenue = masterData?.monthly_revenue || [];

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const acceptedQuotationsCount = quotations.filter(q => (q.status || '').toLowerCase() === 'accepted').length;
  const winRate = quotations.length > 0 ? ((acceptedQuotationsCount / quotations.length) * 100).toFixed(1) : '0.0';

  const tabs = [
    { id: 'master', label: 'Master Rollup', icon: Layers, count: null },
    { id: 'financial', label: 'Financial & Revenue', icon: DollarSign, count: invoices.length },
    { id: 'sales', label: 'Sales & Quotes', icon: FileText, count: quotations.length },
    { id: 'projects', label: 'Projects & Delivery', icon: Briefcase, count: projects.length },
    { id: 'tasks', label: 'Tasks & Hours', icon: CheckCircle2, count: tasks.length },
    { id: 'workforce', label: 'Workforce & HR', icon: Users, count: employees.length },
    { id: 'marketing', label: 'Digital Retainers', icon: Share2, count: social_clients.length },
    { id: 'inventory', label: 'Assets & Stock', icon: Boxes, count: assets.length + stock.length },
  ];

  const filterList = (list, textAccessor) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => textAccessor(item).toLowerCase().includes(q));
  };

  const filteredInvoices = useMemo(() => filterList(invoices, inv => `${inv.reference} ${inv.client_name || ''} ${inv.payment_status || ''}`), [invoices, searchQuery]);
  const filteredQuotations = useMemo(() => filterList(quotations, q => `${q.reference} ${q.client_name || ''} ${q.status || ''}`), [quotations, searchQuery]);
  const filteredIncomes = useMemo(() => filterList(incomes, inc => `${inc.reference} ${inc.title || ''} ${inc.category || ''}`), [incomes, searchQuery]);
  const filteredExpenses = useMemo(() => filterList(expenses, exp => `${exp.reference} ${exp.title || ''} ${exp.category || ''}`), [expenses, searchQuery]);
  const filteredProjects = useMemo(() => filterList(projects, p => `${p.name} ${p.client_name || ''} ${p.status || ''} ${p.priority || ''}`), [projects, searchQuery]);
  const filteredTasks = useMemo(() => filterList(tasks, t => `${t.title} ${t.project_name || ''} ${t.status || ''}`), [tasks, searchQuery]);
  const filteredEmployees = useMemo(() => filterList(employees, e => `${e.employee_id} ${e.user_detail?.first_name || ''} ${e.user_detail?.last_name || ''} ${e.user_detail?.department || ''}`), [employees, searchQuery]);
  const filteredSocialClients = useMemo(() => filterList(social_clients, sc => `${sc.client_name} ${sc.package_name || ''} ${sc.instagram_handle || ''}`), [social_clients, searchQuery]);
  const filteredAssets = useMemo(() => filterList(assets, a => `${a.asset_tag} ${a.name} ${a.category || ''}`), [assets, searchQuery]);
  const filteredStock = useMemo(() => filterList(stock, s => `${s.name} ${s.category || ''}`), [stock, searchQuery]);

  return (
    <div className="page-container space-y-6 max-w-full">
      {/* 1. TOP HEADER & EXECUTIVE ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} className="text-slate-950" />
              Business Intelligence
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Live Verified Data
            </span>
          </div>
          <h1 className="page-heading">
            Reports &amp; Organization Analytics
          </h1>
          <p className="page-desc">
            Executive revenue reports, project completion rates, employee workloads, and conversion metrics
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
          <select
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer shadow-xs focus:outline-none hover:border-amber-400 transition-colors"
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
          >
            <option value="Daily">Daily Report</option>
            <option value="Weekly">Weekly Report</option>
            <option value="Monthly">Monthly Report</option>
            <option value="Yearly">Yearly Report</option>
            <option value="All Time">All-Time Master</option>
          </select>

          <button
            type="button"
            onClick={() => fetchReportsData(true)}
            disabled={refreshing || loading}
            className="btn-banner-secondary flex items-center gap-1.5 cursor-pointer shadow-xs"
            style={{ borderRadius: '12px', padding: '9px 14px' }}
            title="Refresh All Datasets"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : 'text-slate-300'} />
            <span className="text-xs font-bold">{refreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="btn-banner-primary flex items-center gap-1.5 cursor-pointer shadow-xs"
            style={{ borderRadius: '12px', padding: '9px 16px', fontSize: '12px' }}
          >
            <Printer size={15} />
            <span>Export Master PDF</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI SCORECARDS (Spacious 4-Column Grid, 2 Rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(kpi.gross_revenue)}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <ShieldCheck size={13} /> Verified Collections
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Income Total</span>
            <span className="font-bold text-slate-700">{formatCurrency(kpi.total_income)}</span>
          </div>
        </div>

        {/* Card 2: Operating Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <Receipt size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(kpi.total_expenses)}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-red-600 mt-1">
              <ArrowDownRight size={13} /> Operational Outflow
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Expenses Recorded</span>
            <span className="font-bold text-slate-700">{expenses.length} Records</span>
          </div>
        </div>

        {/* Card 3: Net Profit & Margin */}
        <div className="bg-gradient-to-br from-amber-50 via-amber-100/50 to-white rounded-2xl border border-amber-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 tracking-tight">{formatCurrency(kpi.net_profit)}</div>
            <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md mt-1">
              Margin: {kpi.profit_margin || 0}%
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span>Cashflow Health</span>
            <span className="font-bold text-emerald-700">{Number(kpi.net_profit || 0) >= 0 ? 'Surplus Balance' : 'Operating Deficit'}</span>
          </div>
        </div>

        {/* Card 4: Pending Receivables */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Receivables</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(kpi.pending_receivables)}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-1">
              <Clock size={13} /> Unsettled Invoices
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Invoices</span>
            <span className="font-bold text-slate-700">{invoices.length} Invoices</span>
          </div>
        </div>

        {/* Card 5: Projects Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Velocity</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Briefcase size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpi.active_projects || 0} <span className="text-sm font-semibold text-slate-400">/ {kpi.total_projects || 0} Active</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> {kpi.urgent_projects || 0} Urgent Projects
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Completed</span>
            <span className="font-bold text-emerald-700">{kpi.completed_projects || 0} Projects</span>
          </div>
        </div>

        {/* Card 6: Task Delivery Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Team Delivery</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{kpi.task_completion_rate || 0}%</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <CheckCircle size={13} /> {kpi.completed_tasks || 0} of {kpi.total_tasks || 0} Tasks Done
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pending Workstream</span>
            <span className="font-bold text-slate-700">{kpi.pending_tasks || 0} Tasks</span>
          </div>
        </div>

        {/* Card 7: Workforce Capacity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workforce Strength</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {kpi.total_employees || 0} <span className="text-sm font-semibold text-slate-400">Staff Members</span>
            </div>
            <div className="text-[11px] font-semibold text-purple-700 mt-1">
              Active Organization Staff
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Clients</span>
            <span className="font-bold text-slate-700">{kpi.active_clients || 0} Clients</span>
          </div>
        </div>

        {/* Card 8: Assets & Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Asset Valuation</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Boxes size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(kpi.total_asset_value)}</div>
            <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${kpi.low_stock_items > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              <AlertTriangle size={13} /> {kpi.low_stock_items || 0} Low Stock Alert
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Equipments</span>
            <span className="font-bold text-slate-700">{kpi.total_assets || 0} Items</span>
          </div>
        </div>
      </div>

      {/* 3. VISUAL ANALYTICS & CONVERSION FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Chart 1: Revenue vs Cost Trajectory */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 lg:col-span-2 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Cash Flow Trajectory</h3>
              <p className="text-xs text-slate-500">Monthly billing inflows vs operational disbursements</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold flex-shrink-0">
              <span className="flex items-center gap-1.5 text-amber-600 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Inflows
              </span>
              <span className="flex items-center gap-1.5 text-red-600 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Outflows
              </span>
            </div>
          </div>
          <div className="h-72 w-full flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  width={60}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#inflowGrad)" strokeWidth={3} name="Inflows" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#outflowGrad)" strokeWidth={2} name="Outflows" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel: Proposal Win & Conversion Ratio */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                  Conversion
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {winRate}% Win Rate
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Conversion Funnel</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Quotation to invoice acceptance performance
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="space-y-4 my-auto py-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{winRate}%</span>
                <span className="text-[11px] text-slate-400 font-semibold block">Win Efficiency</span>
              </div>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex-shrink-0">
                {acceptedQuotationsCount} of {quotations.length} Converted
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, Number(winRate)))}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Quotations Total</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">
                  {formatCurrency(quotations.reduce((a, c) => a + Number(c.total_amount || 0), 0))}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{quotations.length} Proposals</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Invoiced Total</span>
                <span className="text-xs font-black text-emerald-900 mt-0.5 block">
                  {formatCurrency(invoices.reduce((a, c) => a + Number(c.total_amount || 0), 0))}
                </span>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">{invoices.length} Invoices</span>
              </div>
            </div>
          </div>


          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sales Funnel Status</span>
            <span className="font-bold text-emerald-700">Healthy Pipeline</span>
          </div>
        </div>
      </div>

      {/* 4. TABS NAVIGATION & SEARCH CONTROLS */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none px-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${isActive
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[260px] px-1 md:px-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search report records..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-8 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-400 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 5. DATA TABLES (ENHANCED SPACING, CLEAR CELL GAP, ELEGANT HOVER) */}

      {/* TAB: MASTER ROLLUP */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          {/* Section: Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Invoices &amp; Receivables Ledger</h3>
                  <p className="text-[11px] text-slate-500">Active billed statements &amp; payment settlements</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                Total: {formatCurrency(invoices.reduce((a, c) => a + Number(c.total_amount || 0), 0))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Date Issued</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No invoice records found. Invoices created in the Sales module will appear here.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900">{inv.reference}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{inv.client_name || inv.client_detail?.name || 'Valued Client'}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.invoice_date}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.due_date}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(inv.total_amount)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider ${inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              inv.payment_status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                            {inv.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Projects Delivery */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Projects Delivery Portfolio</h3>
                  <p className="text-[11px] text-slate-500">Live development milestones &amp; completion benchmarks</p>
                </div>
              </div>
              <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200/60">
                {kpi.urgent_projects || 0} Urgent Projects
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Project Title</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Service Domain</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Budget</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No projects created yet. New client projects will automatically synchronize here.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(prj => (
                      <tr key={prj.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900">{prj.name}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{prj.client_name || prj.client_detail?.name || 'Client'}</td>
                        <td className="py-3 px-4 text-slate-500">{prj.service_type || 'General'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${prj.priority === 'Urgent' ? 'bg-red-100 text-red-800 border border-red-200' :
                              prj.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                            {prj.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${prj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              prj.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                            {prj.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(prj.budget)}</td>
                        <td className="py-3 px-4 text-center font-extrabold text-slate-900">{prj.progress_pct || 0}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Workforce & Assets Rollup Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workforce */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users size={14} />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Team Staffing &amp; Roster</h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500">{employees.length} Staff Members</span>
              </div>
              <div className="space-y-2.5">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/50 hover:bg-slate-100/60 transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {emp.user_detail?.first_name} {emp.user_detail?.last_name || ''}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {emp.user_detail?.department || 'Engineering'} • {emp.user_detail?.designation || 'Software Dev'}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(emp.salary_display)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Boxes size={14} />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">High-Value Assets &amp; Hardware</h4>
                </div>
                <span className="text-[11px] font-bold text-indigo-600">{formatCurrency(kpi.total_asset_value)}</span>
              </div>
              <div className="space-y-2.5">
                {assets.slice(0, 5).map(ast => (
                  <div key={ast.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/50 hover:bg-slate-100/60 transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{ast.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Tag: {ast.asset_tag} • {ast.category}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(ast.purchase_cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FINANCIAL & REVENUE */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Full Invoices Master Ledger ({filteredInvoices.length})</h3>
              <span className="text-xs font-black text-slate-900">Total: {formatCurrency(invoices.reduce((a, c) => a + Number(c.total_amount || 0), 0))}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Tax (GST)</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No invoice statements recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900">{inv.reference}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{inv.client_name || inv.client_detail?.name || 'Client'}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.invoice_date}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.due_date}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(inv.tax)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(inv.total_amount)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider ${inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              inv.payment_status === 'Overdue' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                            {inv.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Income Streams ({filteredIncomes.length})</h4>
                <span className="text-xs font-black text-emerald-700">{formatCurrency(kpi.total_income)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Title / Ref</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIncomes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 text-xs font-semibold">
                          No income transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredIncomes.map(inc => (
                        <tr key={inc.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{inc.title || inc.reference}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inc.category}</td>
                          <td className="py-2.5 px-3 text-slate-500">{inc.payment_method}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">{formatCurrency(inc.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Operational Expenditures ({filteredExpenses.length})</h4>
                <span className="text-xs font-black text-red-700">{formatCurrency(kpi.total_expenses)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Title / Vendor</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 text-xs font-semibold">
                          No operational expenses recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{exp.title || exp.reference}</td>
                          <td className="py-2.5 px-3 text-slate-600">{exp.category}</td>
                          <td className="py-2.5 px-3 text-slate-500">{exp.payment_method}</td>
                          <td className="py-2.5 px-3 text-right font-black text-red-700">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SALES & QUOTATIONS */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Quotations &amp; Proposals Pipeline ({filteredQuotations.length})</h3>
            <span className="text-xs font-black text-slate-900">Total Value: {formatCurrency(quotations.reduce((a, c) => a + Number(c.total_amount || 0), 0))}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No commercial proposals recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map(q => (
                    <tr key={q.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{q.reference}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{q.client_name || q.client_detail?.name || 'Prospect'}</td>
                      <td className="py-3 px-4 text-slate-500">{q.valid_until}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(q.subtotal)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(q.total_amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase tracking-wider ${q.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            q.status === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PROJECTS & DELIVERY */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Projects Delivery Matrix ({filteredProjects.length})</h3>
            <span className="text-xs font-black text-slate-900">Total Projects: {projects.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Budget</th>
                  <th className="py-3 px-4 text-right">Spent</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No project delivery records found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(prj => (
                    <tr key={prj.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{prj.name}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{prj.client_name || prj.client_detail?.name || 'Client'}</td>
                      <td className="py-3 px-4 text-slate-500">{prj.service_type || 'General'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${prj.priority === 'Urgent' ? 'bg-red-100 text-red-800 border border-red-200' :
                            prj.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {prj.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${prj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            prj.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {prj.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(prj.budget)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(prj.spent)}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900">{prj.progress_pct || 0}%</td>
                      <td className="py-3 px-4 text-slate-500">{prj.expected_completion || 'TBD'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TASKS & PRODUCTIVITY */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Workstream Tasks Log ({filteredTasks.length})</h3>
            <span className="text-xs font-black text-emerald-700">{kpi.completed_tasks || 0} Tasks Completed</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No workstream tasks logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{t.title}</td>
                      <td className="py-3 px-4 text-slate-600">{t.project_name || 'General Project'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{t.assigned_to_detail?.first_name || t.assigned_to_detail?.username || 'Staff'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${t.priority === 'Urgent' ? 'bg-red-100 text-red-800 border border-red-200' :
                            t.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            t.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{t.due_date || 'No Date'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: WORKFORCE & HR */}
      {activeTab === 'workforce' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Employee Staffing &amp; Department Roster ({filteredEmployees.length})</h3>
            <span className="text-xs font-black text-slate-900">{employees.length} Staff on Payroll</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Salary Band</th>
                  <th className="py-3 px-4 text-center">Assigned Assets</th>
                  <th className="py-3 px-4">Joining Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No employee profiles found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-slate-900">{emp.employee_id}</td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {emp.user_detail?.first_name} {emp.user_detail?.last_name || ''}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">{emp.user_detail?.designation || emp.user_detail?.role}</td>
                      <td className="py-3 px-4 text-slate-500">{emp.user_detail?.department || 'General'}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(emp.salary_display)}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-amber-700">{emp.assigned_assets_count || 0} Items</td>
                      <td className="py-3 px-4 text-slate-500">{emp.joining_date || 'Active'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DIGITAL MARKETING */}
      {activeTab === 'marketing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Digital Marketing Retainer Accounts ({filteredSocialClients.length})</h3>
            <span className="text-xs font-black text-slate-900">
              Retainers: {formatCurrency(social_clients.reduce((a, c) => a + Number(c.monthly_payment || 0), 0))}/mo
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Brand Client</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Handles</th>
                  <th className="py-3 px-4 text-center">Deliverables Done</th>
                  <th className="py-3 px-4 text-right">Monthly Fee</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredSocialClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No active digital marketing retainers recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredSocialClients.map(sc => (
                    <tr key={sc.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{sc.client_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{sc.package_name || 'Social Retainer'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{sc.instagram_handle || sc.facebook_page || '-'}</td>
                      <td className="py-3 px-4 text-center font-black text-emerald-700">{sc.videos_completed || 0}/{sc.videos_planned || 0} Videos</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(sc.monthly_payment)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {sc.payment_status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ASSETS & STOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">IT Hardware &amp; Company Equipment ({filteredAssets.length})</h3>
              <span className="text-xs font-black text-slate-900">{formatCurrency(kpi.total_asset_value)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Asset Tag</th>
                    <th className="py-3 px-4">Equipment Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Serial #</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4 text-right">Purchase Cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No equipment assets registered in inventory.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map(ast => (
                      <tr key={ast.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-900">{ast.asset_tag}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{ast.name}</td>
                        <td className="py-3 px-4 text-slate-500">{ast.category}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{ast.serial_number || '-'}</td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">{ast.assigned_to_name || 'Inventory Stock'}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(ast.purchase_cost)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${ast.status === 'In Use' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              ast.status === 'Available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                            {ast.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Stock &amp; Consumables Inventory ({filteredStock.length})</h3>
              <span className="text-xs font-black text-amber-600">{kpi.low_stock_items || 0} Low Stock Alerts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Current Qty</th>
                    <th className="py-3 px-4 text-center">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No consumable supplies or stock registered yet.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map(stk => (
                      <tr key={stk.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900">{stk.name}</td>
                        <td className="py-3 px-4 text-slate-500">{stk.category}</td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">{stk.quantity} {stk.unit}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{stk.min_stock_threshold} {stk.unit}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(stk.unit_price)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] ${stk.is_low_stock ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                            {stk.is_low_stock ? 'LOW STOCK' : 'OPTIMAL'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MASTER PDF PREVIEW MODAL */}
      <ReportPDFModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        data={masterData}
        activeUser={user}
        timeframe={timeframe}
      />
    </div>
  );
}
