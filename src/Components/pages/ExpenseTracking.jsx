import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CreditCard, TrendingDown, ArrowDownRight, Plus, Search, Filter, RefreshCw,
  FileSpreadsheet, Printer, Sparkles, CheckCircle2, Clock, Landmark,
  Smartphone, Wallet, Receipt, Trash2, Edit3, X, ChevronDown,
  Building2, Calendar, AlertCircle, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';

const EXPENSE_CATEGORY_COLORS = {
  'Salaries & Payroll': '#6366f1',
  'Cloud & Hosting': '#3b82f6',
  'Software & Subscriptions': '#8b5cf6',
  'Office Rent': '#f59e0b',
  'Utilities & Internet': '#06b6d4',
  'Marketing & Ad Spend': '#ec4899',
  'Hardware & Equipment': '#10b981',
  'Vendor & Freelancers': '#f97316',
  'Travel & Refreshments': '#14b8a6',
  'Miscellaneous': '#64748b',
};

const EXPENSE_CATEGORIES = [
  'Salaries & Payroll',
  'Cloud & Hosting',
  'Software & Subscriptions',
  'Office Rent',
  'Utilities & Internet',
  'Marketing & Ad Spend',
  'Hardware & Equipment',
  'Vendor & Freelancers',
  'Travel & Refreshments',
  'Miscellaneous',
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Credit Card',
  'UPI / QR',
  'Cash',
  'Online Gateway',
];

export default function ExpenseTracking() {
  const { user } = useOutletContext() || {};
  const role = user?.role || 'FOUNDER';

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cloud & Hosting',
    vendor_name: '',
    amount: '',
    tax_amount: '0.00',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'Paid',
    receipt_reference: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const res = await api.finance.getExpenses().catch(() => ({ data: [] }));
      const list = res.data || res.results || (Array.isArray(res) ? res : []);
      setExpenses(list);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((exp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = (exp.reference || '').toLowerCase().includes(q);
        const matchesTitle = (exp.title || '').toLowerCase().includes(q);
        const matchesVendor = (exp.vendor_name || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesVendor) return false;
      }
      // Category
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      // Method
      if (methodFilter !== 'all' && exp.payment_method !== methodFilter) return false;
      // Status
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      // Date
      if (dateFilter === 'today' && exp.payment_date !== todayStr) return false;
      if (dateFilter === 'month') {
        const d = new Date(exp.payment_date);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [expenses, searchQuery, categoryFilter, methodFilter, statusFilter, dateFilter]);

  // Calculations
  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.payment_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Daily Burn Rate (assuming 30 days month)
  const dailyBurnRate = Math.round(thisMonthExpenses / 30);

  // Top Expense Category
  const topCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], amount: sorted[0][1] } : { name: 'Salaries', amount: 0 };
  }, [expenses]);

  // Chart Data: Category Breakdown Donut
  const categoryPieData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Miscellaneous';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: EXPENSE_CATEGORY_COLORS[name] || '#94a3b8',
    }));
  }, [expenses]);

  // Chart Data: Monthly Outflow Trajectory
  const monthlyExpenseChart = useMemo(() => {
    return [
      { month: 'Apr', amount: 195000 },
      { month: 'May', amount: 220000 },
      { month: 'Jun', amount: 265000 },
      { month: 'Jul', amount: 310000 },
      { month: 'Aug', amount: 335000 },
      { month: 'Sep', amount: thisMonthExpenses > 0 ? thisMonthExpenses : 357700 },
    ];
  }, [thisMonthExpenses]);

  // Open Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Cloud & Hosting',
      vendor_name: '',
      amount: '',
      tax_amount: '0.00',
      payment_method: 'Bank Transfer',
      payment_date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      receipt_reference: '',
      notes: '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Cloud & Hosting',
      vendor_name: item.vendor_name || '',
      amount: item.amount || '',
      tax_amount: item.tax_amount || '0.00',
      payment_method: item.payment_method || 'Bank Transfer',
      payment_date: item.payment_date || new Date().toISOString().split('T')[0],
      status: item.status || 'Paid',
      receipt_reference: item.receipt_reference || '',
      notes: item.notes || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      setErrorMsg('Please provide an expense title and amount.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount || 0),
      };

      if (editingItem) {
        await api.finance.updateExpense(editingItem.id, payload);
      } else {
        await api.finance.createExpense(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving expense record');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.finance.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert('Failed to delete expense entry: ' + err.message);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No records to export for this filter selection.');
      return;
    }
    const headers = ['Reference', 'Title', 'Category', 'Vendor / Payee', 'Amount (INR)', 'Tax / GST', 'Payment Method', 'Date', 'Status'];
    const rows = filteredExpenses.map((e) => [
      `"${e.reference || ''}"`,
      `"${e.title || ''}"`,
      `"${e.category || ''}"`,
      `"${e.vendor_name || ''}"`,
      Number(e.amount || 0),
      Number(e.tax_amount || 0),
      `"${e.payment_method || ''}"`,
      `"${e.payment_date || ''}"`,
      `"${e.status || 'Paid'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Expense_Disbursements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodIcon = (m = '') => {
    const s = m.toLowerCase();
    if (s.includes('bank') || s.includes('neft')) return Landmark;
    if (s.includes('card')) return CreditCard;
    if (s.includes('upi') || s.includes('qr')) return Smartphone;
    if (s.includes('cash')) return Receipt;
    return Wallet;
  };

  return (
    <div className="page-container space-y-5">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-500 text-white font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} />
              Operational Outflows
            </span>
            <span className="text-[11px] font-medium text-slate-400">Expense Control Hub</span>
          </div>
          <h1 className="page-heading">Expense Tracking &amp; Outflows</h1>
          <p className="page-desc">
            Track operational disbursements, cloud hosting, SaaS subscriptions, team salaries, hardware purchases, and office overheads
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer shadow-xs"
            style={{ borderRadius: '12px', padding: '8px 14px' }}
            title="Refresh Ledger"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-rose-600' : 'text-slate-500'} />
            <span className="text-xs font-bold">{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-banner-secondary"
            style={{ borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary hidden sm:flex items-center gap-1.5"
            style={{ borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {canPerform(role, 'CREATE_EXPENSE') && (
            <button
              type="button"
              onClick={openCreateModal}
              className="btn-banner-primary flex items-center gap-1.5"
              style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}
            >
              <Plus size={16} />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Outflow */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Total Disbursements</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight my-1">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[10.5px] text-rose-600 font-bold">
            <ArrowDownRight size={13} /> {expenses.length} Cleared Bills &amp; Vouchers
          </div>
        </div>

        {/* This Month's Outflow */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">This Month's Burn</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
            ₹{thisMonthExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[10.5px] text-slate-500 font-semibold">
            September 2026 Operating Costs
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Top Spend Center</span>
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
              Primary
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 tracking-tight my-1 truncate">
            {topCategory.name}
          </div>
          <div className="text-[11px] font-bold text-indigo-700">
            ₹{topCategory.amount.toLocaleString('en-IN')} ({(totalExpenses > 0 ? (topCategory.amount / totalExpenses) * 100 : 0).toFixed(0)}% of total)
          </div>
        </div>

        {/* Daily Burn Rate */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Daily Burn Velocity</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-800 tracking-tight my-1">
            ₹{dailyBurnRate.toLocaleString('en-IN')} /day
          </div>
          <div className="text-[10.5px] text-slate-500 font-semibold">
            Operational Run-Rate
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Outflow Trajectory Chart */}
        <div className="dashboard-card p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operating Cost Trajectory</h3>
              <p className="text-[11px] text-slate-400">Monthly company expenditure and overheads</p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">
              Under Budget
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenseChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Expenditure']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="dashboard-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-sm font-bold text-slate-900">Expenditure by Category</h3>
            <p className="text-[11px] text-slate-400">Proportional budget breakdown</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
            {categoryPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-slate-600 font-medium text-[11px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 text-[11px] flex-shrink-0">
                  ₹{Number(item.value).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ref, title, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending Approval</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="today">Today</option>
          </select>
        </div>
      </div>

      {/* 5. Expense Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Disbursement &amp; Expense Ledger
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-black">
              {filteredExpenses.length} Records
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Total Displayed: ₹{filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Voucher Ref</th>
                <th className="py-2.5 px-4">Title &amp; Payee / Vendor</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-rose-500" size={20} />
                    Loading expense vouchers...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="mx-auto mb-2 text-slate-300" size={28} />
                    <p className="font-semibold text-slate-600">No expense records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting filters or record a new expense.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const MethodIcon = getMethodIcon(exp.payment_method);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ref */}
                      <td className="py-3 px-4 font-mono font-bold text-rose-600 text-[11.5px] whitespace-nowrap">
                        {exp.reference}
                      </td>

                      {/* Title & Vendor */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{exp.title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Building2 size={11} className="text-slate-400" />
                          <span className="font-medium text-slate-600">{exp.vendor_name || 'Direct Payout'}</span>
                          {exp.receipt_reference && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9.5px] font-mono">
                              {exp.receipt_reference}
                            </span>
                          )}
                          {exp.notes && <span className="text-slate-300">•</span>}
                          {exp.notes && <span className="text-slate-400 truncate max-w-[180px]">{exp.notes}</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold inline-block"
                          style={{
                            backgroundColor: `${EXPENSE_CATEGORY_COLORS[exp.category] || '#94a3b8'}15`,
                            color: EXPENSE_CATEGORY_COLORS[exp.category] || '#64748b',
                            border: `1px solid ${EXPENSE_CATEGORY_COLORS[exp.category] || '#94a3b8'}30`
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MethodIcon size={13} className="text-slate-500" />
                          <span>{exp.payment_method || 'Bank Transfer'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {exp.payment_date}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-rose-700 text-sm">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </div>
                        {Number(exp.tax_amount) > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Incl. ₹{Number(exp.tax_amount).toLocaleString('en-IN')} GST
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center gap-1 ${
                          exp.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <CheckCircle2 size={10} />
                          {exp.status || 'Paid'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canPerform(role, 'EDIT_EXPENSE') && (
                            <button
                              type="button"
                              onClick={() => openEditModal(exp)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="Edit expense"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {canPerform(role, 'DELETE_EXPENSE') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(exp.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete expense"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal: Add / Edit Expense */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? 'Edit Expense Record' : 'Record Operating Expense'}
                </h3>
                <p className="text-[11px] text-slate-400">Log business disbursement and attach vendor invoice details</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Infrastructure Billing"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Vendor & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vendor / Payee Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services India"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 28500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-rose-700 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tax / GST (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date Paid *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status & Receipt Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Disbursement Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="Paid">Paid &amp; Settled</option>
                    <option value="Pending">Pending Approval / Payout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Invoice / Receipt Ref No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-INV-992140"
                    value={formData.receipt_reference}
                    onChange={(e) => setFormData({ ...formData, receipt_reference: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Notes / Voucher Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose, account allocation, or approval notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Voucher' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
