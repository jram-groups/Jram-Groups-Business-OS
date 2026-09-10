import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  DollarSign, TrendingUp, ArrowUpRight, Plus, Search, Filter, RefreshCw,
  FileSpreadsheet, Printer, Sparkles, CheckCircle2, Clock, Landmark,
  Smartphone, CreditCard, Wallet, Receipt, Trash2, Edit3, X, ChevronDown,
  Building2, Calendar, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';

const CATEGORY_COLORS = {
  'Client Invoice': '#10b981',
  'Marketing Retainer': '#8b5cf6',
  'Software Development': '#3b82f6',
  'Consultation & Advisory': '#f59e0b',
  'AMC & Maintenance': '#06b6d4',
  'Other Revenue': '#ec4899',
};

const CATEGORIES = [
  'Client Invoice',
  'Marketing Retainer',
  'Software Development',
  'Consultation & Advisory',
  'AMC & Maintenance',
  'Other Revenue',
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI / QR',
  'Credit Card',
  'Online Gateway',
  'Cheque',
  'Cash',
];

export default function IncomeTracking() {
  const { user } = useOutletContext() || {};
  const role = user?.role || 'FOUNDER';

  const [incomes, setIncomes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all | month | week | today

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Client Invoice',
    client: '',
    amount: '',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'Received',
    reference: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const [incRes, cliRes] = await Promise.all([
        api.finance.getIncome().catch(() => ({ data: [] })),
        api.clients.list().catch(() => ({ data: [] })),
      ]);
      const incList = incRes.data || incRes.results || (Array.isArray(incRes) ? incRes : []);
      const cliList = cliRes.data || cliRes.results || (Array.isArray(cliRes) ? cliRes : []);
      setIncomes(incList);
      setClients(cliList);
    } catch (e) {
      console.error('Failed to load income data:', e);
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

  // Filtered Incomes
  const filteredIncomes = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return incomes.filter((inc) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = (inc.reference || '').toLowerCase().includes(q);
        const matchesTitle = (inc.title || '').toLowerCase().includes(q);
        const matchesClient = (inc.client_name || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesClient) return false;
      }
      // Category
      if (categoryFilter !== 'all' && inc.category !== categoryFilter) return false;
      // Method
      if (methodFilter !== 'all' && inc.payment_method !== methodFilter) return false;
      // Date
      if (dateFilter === 'today' && inc.payment_date !== todayStr) return false;
      if (dateFilter === 'month') {
        const d = new Date(inc.payment_date);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [incomes, searchQuery, categoryFilter, methodFilter, dateFilter]);

  // Financial KPI calculations
  const totalIncome = useMemo(() => {
    return incomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }, [incomes]);

  const thisMonthIncome = useMemo(() => {
    const now = new Date();
    return incomes
      .filter((i) => {
        const d = new Date(i.payment_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  }, [incomes]);

  const monthlyTarget = 1000000; // ₹10,00,000 Target
  const targetAchieved = Math.min(100, (thisMonthIncome / monthlyTarget) * 100).toFixed(1);

  const avgTransaction = incomes.length > 0 ? Math.round(totalIncome / incomes.length) : 0;

  // Chart Data: Monthly Inflow Trajectory
  const monthlyInflowChart = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const sample = [
      { month: 'Apr', amount: 320000 },
      { month: 'May', amount: 410000 },
      { month: 'Jun', amount: 530000 },
      { month: 'Jul', amount: 620000 },
      { month: 'Aug', amount: 710000 },
      { month: 'Sep', amount: thisMonthIncome > 0 ? thisMonthIncome : 895000 },
    ];
    return sample;
  }, [thisMonthIncome]);

  // Chart Data: Category Breakdown
  const categoryPieData = useMemo(() => {
    const map = {};
    incomes.forEach((i) => {
      const cat = i.category || 'Other Revenue';
      map[cat] = (map[cat] || 0) + (Number(i.amount) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#94a3b8',
    }));
  }, [incomes]);

  // Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Client Invoice',
      client: clients[0]?.id || '',
      amount: '',
      payment_method: 'Bank Transfer',
      payment_date: new Date().toISOString().split('T')[0],
      status: 'Received',
      reference: '',
      notes: '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Client Invoice',
      client: item.client || '',
      amount: item.amount || '',
      payment_method: item.payment_method || 'Bank Transfer',
      payment_date: item.payment_date || new Date().toISOString().split('T')[0],
      status: item.status || 'Received',
      reference: item.reference || '',
      notes: item.notes || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  // Submit Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      setErrorMsg('Please enter a title and income amount.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        client: formData.client || null,
      };

      if (editingItem) {
        await api.finance.updateIncome(editingItem.id, payload);
      } else {
        await api.finance.createIncome(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving income record');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Income
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income record?')) return;
    try {
      await api.finance.deleteIncome(id);
      setIncomes((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Failed to delete income entry: ' + err.message);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredIncomes.length === 0) {
      alert('No records to export for this filter selection.');
      return;
    }
    const headers = ['Reference', 'Title', 'Client', 'Category', 'Amount (INR)', 'Payment Method', 'Date', 'Status'];
    const rows = filteredIncomes.map((i) => [
      `"${i.reference || ''}"`,
      `"${i.title || ''}"`,
      `"${i.client_name || 'Direct'}"`,
      `"${i.category || ''}"`,
      Number(i.amount || 0),
      `"${i.payment_method || ''}"`,
      `"${i.payment_date || ''}"`,
      `"${i.status || 'Received'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Income_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodIcon = (m = '') => {
    const s = m.toLowerCase();
    if (s.includes('bank') || s.includes('neft')) return Landmark;
    if (s.includes('upi') || s.includes('qr')) return Smartphone;
    if (s.includes('card')) return CreditCard;
    if (s.includes('cash')) return DollarSign;
    return Wallet;
  };

  return (
    <div className="page-container space-y-5">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} className="text-slate-950" />
              Revenue Inflow Engine
            </span>
            <span className="text-[11px] font-medium text-slate-400">Live Inflow Tracking</span>
          </div>
          <h1 className="page-heading">Income Tracking &amp; Inflows</h1>
          <p className="page-desc">
            Monitor all incoming revenue streams including client milestones, monthly marketing retainers, AMC, and consulting contracts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer shadow-xs"
            style={{ borderRadius: '12px', padding: '8px 14px' }}
            title="Refresh Inflow Ledger"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
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

          {canPerform(role, 'CREATE_INCOME') && (
            <button
              type="button"
              onClick={openCreateModal}
              className="btn-banner-primary flex items-center gap-1.5"
              style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}
            >
              <Plus size={16} />
              <span>Record Income</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Inflow Realized */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Total Income Realized</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight my-1">
            ₹{totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[10.5px] text-emerald-600 font-bold">
            <ArrowUpRight size={13} /> {incomes.length} Cleared Transactions
          </div>
        </div>

        {/* Current Month Inflow */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">This Month Inflow</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
            ₹{thisMonthIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-[10.5px] text-slate-500 font-semibold">
            September 2026 Collection
          </div>
        </div>

        {/* Monthly Target Progress */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Monthly Target</span>
            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
              ₹10.0L Goal
            </span>
          </div>
          <div className="flex items-baseline justify-between my-1">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{targetAchieved}%</div>
            <span className="text-[11px] text-emerald-700 font-black">Active Run-Rate</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${targetAchieved}%` }}
            />
          </div>
        </div>

        {/* Average Transaction Value */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Avg Transaction Size</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Landmark size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight my-1">
            ₹{avgTransaction.toLocaleString('en-IN')}
          </div>
          <div className="text-[10.5px] text-slate-500 font-semibold">
            High Ticket B2B Engagements
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Inflow Trajectory Chart */}
        <div className="dashboard-card p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Inflow Trajectory</h3>
              <p className="text-[11px] text-slate-400">Monthly collection growth curve across all streams</p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
              +28.4% YoY
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyInflowChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Income Inflow']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#incomeArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="dashboard-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-sm font-bold text-slate-900">Income by Stream</h3>
            <p className="text-[11px] text-slate-400">Distribution across revenue categories</p>
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
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total']}
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
            placeholder="Search by ref, title, client..."
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
            {CATEGORIES.map((c) => (
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

      {/* 5. Income Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Verified Inflow Ledger
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-black">
              {filteredIncomes.length} Records
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Total Displayed: ₹{filteredIncomes.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Income Title &amp; Client</th>
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
                    <RefreshCw className="animate-spin mx-auto mb-2 text-amber-500" size={20} />
                    Loading verified income records...
                  </td>
                </tr>
              ) : filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="mx-auto mb-2 text-slate-300" size={28} />
                    <p className="font-semibold text-slate-600">No income records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or record a new transaction.</p>
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((inc) => {
                  const MethodIcon = getMethodIcon(inc.payment_method);
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ref */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 text-[11.5px] whitespace-nowrap">
                        {inc.reference}
                      </td>

                      {/* Title & Client */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inc.title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Building2 size={11} className="text-slate-400" />
                          <span>{inc.client_name || 'Direct / Non-Invoice'}</span>
                          {inc.notes && <span className="text-slate-300">•</span>}
                          {inc.notes && <span className="text-slate-400 truncate max-w-[200px]">{inc.notes}</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold inline-block"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[inc.category] || '#94a3b8'}15`,
                            color: CATEGORY_COLORS[inc.category] || '#64748b',
                            border: `1px solid ${CATEGORY_COLORS[inc.category] || '#94a3b8'}30`
                          }}
                        >
                          {inc.category}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MethodIcon size={13} className="text-slate-500" />
                          <span>{inc.payment_method || 'Bank Transfer'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {inc.payment_date}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm whitespace-nowrap">
                        ₹{Number(inc.amount).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center gap-1 ${
                          inc.status === 'Received'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inc.status === 'Recurring'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <CheckCircle2 size={10} />
                          {inc.status || 'Received'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canPerform(role, 'EDIT_INCOME') && (
                            <button
                              type="button"
                              onClick={() => openEditModal(inc)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="Edit record"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {canPerform(role, 'DELETE_INCOME') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(inc.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete record"
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

      {/* 6. Modal: Add / Edit Income */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? 'Edit Income Transaction' : 'Record New Income Inflow'}
                </h3>
                <p className="text-[11px] text-slate-400">Log incoming revenue directly to the business ledger</p>
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
                  Income Title / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise ERP Milestone 2 Payout"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-700 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date Received *
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

              {/* Category & Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Income Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Client (Optional)
                  </label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="">Direct / General Inflow</option>
                    {clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>{cli.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Method & Status */}
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
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="Received">Received &amp; Cleared</option>
                    <option value="Recurring">Recurring Retainer</option>
                    <option value="Pending">Pending Clearance</option>
                  </select>
                </div>
              </div>

              {/* Reference & Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reference / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-99212 or leave blank to auto-generate"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Notes / Audit Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional bank details, invoice link, or terms"
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
                  {submitting ? 'Saving...' : editingItem ? 'Update Inflow' : 'Record Inflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
