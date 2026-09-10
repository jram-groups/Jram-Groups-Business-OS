import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Boxes, Laptop, Monitor, Camera, Mic, Network, Package, Plus, Search,
  Filter, RefreshCw, FileSpreadsheet, Printer, Sparkles, CheckCircle2,
  AlertTriangle, ArrowRightLeft, UserCheck, ShieldAlert, Edit3, Trash2,
  X, ChevronDown, Building2, Calendar, AlertCircle, Wrench, Shield, Check
} from 'lucide-react';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';

const ASSET_CATEGORIES = [
  'Laptops & Workstations',
  'Monitors & Displays',
  'Studio & Media Cameras',
  'Audio & Lighting Gear',
  'Networking & Servers',
  'Office Appliances & Furniture',
  'Other Equipment',
];

const STOCK_CATEGORIES = [
  'Keyboards & Mice',
  'Cables & Adapters',
  'Storage & Memory',
  'Office Supplies & Stationery',
  'Branded Swag & Merch',
  'Consumables & Miscellaneous',
];

const ASSET_STATUSES = [
  'In Use',
  'Available',
  'Under Maintenance',
  'Retired / Damaged',
];

export default function StockEquipments() {
  const { user } = useOutletContext() || {};
  const role = user?.role || 'FOUNDER';

  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'stock'
  const [assets, setAssets] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState('all');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');

  // Asset Modal State
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    asset_tag: '',
    name: '',
    category: 'Laptops & Workstations',
    brand_model: '',
    serial_number: '',
    assigned_to: '',
    status: 'Available',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: '',
    warranty_expiry: '',
    location: 'HQ Tech Lab',
    notes: '',
  });

  // Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Stock Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockForm, setStockForm] = useState({
    sku: '',
    name: '',
    category: 'Keyboards & Mice',
    quantity: '',
    min_stock_threshold: '5',
    unit_cost: '',
    location: 'Main Supply Cabinet',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const [astRes, stkRes, empRes] = await Promise.all([
        api.inventory.getAssets().catch(() => ({ data: [] })),
        api.inventory.getStock().catch(() => ({ data: [] })),
        api.employees.list().catch(() => ({ data: [] })),
      ]);

      const astList = astRes.data || astRes.results || (Array.isArray(astRes) ? astRes : []);
      const stkList = stkRes.data || stkRes.results || (Array.isArray(stkRes) ? stkRes : []);
      const empList = empRes.data || empRes.results || (Array.isArray(empRes) ? empRes : []);

      setAssets(astList);
      setStockItems(stkList);
      setEmployees(empList);
    } catch (e) {
      console.error('Failed to load inventory data:', e);
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

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = (a.asset_tag || '').toLowerCase().includes(q);
        const matchesName = (a.name || '').toLowerCase().includes(q);
        const matchesUser = (a.assigned_to_name || '').toLowerCase().includes(q);
        const matchesSerial = (a.serial_number || '').toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesUser && !matchesSerial) return false;
      }
      if (assetCategoryFilter !== 'all' && a.category !== assetCategoryFilter) return false;
      if (assetStatusFilter !== 'all' && a.status !== assetStatusFilter) return false;
      return true;
    });
  }, [assets, searchQuery, assetCategoryFilter, assetStatusFilter]);

  // Filtered Stock Items
  const filteredStock = useMemo(() => {
    return stockItems.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSku = (s.sku || '').toLowerCase().includes(q);
        const matchesName = (s.name || '').toLowerCase().includes(q);
        const matchesLoc = (s.location || '').toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesLoc) return false;
      }
      if (stockCategoryFilter !== 'all' && s.category !== stockCategoryFilter) return false;
      return true;
    });
  }, [stockItems, searchQuery, stockCategoryFilter]);

  // Summary Metrics
  const totalAssetValuation = useMemo(() => {
    const fixedVal = assets.reduce((s, a) => s + (Number(a.purchase_cost) || 0), 0);
    const stockVal = stockItems.reduce((s, st) => s + (Number(st.quantity || 0) * Number(st.unit_cost || 0)), 0);
    return fixedVal + stockVal;
  }, [assets, stockItems]);

  const activeInUseCount = assets.filter((a) => a.status === 'In Use').length;
  const availableCount = assets.filter((a) => a.status === 'Available').length;
  const lowStockCount = stockItems.filter((s) => Number(s.quantity) <= Number(s.min_stock_threshold)).length;

  // Asset CRUD
  const openCreateAssetModal = () => {
    setEditingAsset(null);
    setAssetForm({
      asset_tag: '',
      name: '',
      category: 'Laptops & Workstations',
      brand_model: '',
      serial_number: '',
      assigned_to: '',
      status: 'Available',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '',
      warranty_expiry: '',
      location: 'HQ Tech Lab',
      notes: '',
    });
    setErrorMsg('');
    setAssetModalOpen(true);
  };

  const openEditAssetModal = (item) => {
    setEditingAsset(item);
    setAssetForm({
      asset_tag: item.asset_tag || '',
      name: item.name || '',
      category: item.category || 'Laptops & Workstations',
      brand_model: item.brand_model || '',
      serial_number: item.serial_number || '',
      assigned_to: item.assigned_to || '',
      status: item.status || 'Available',
      purchase_date: item.purchase_date || '',
      purchase_cost: item.purchase_cost || '',
      warranty_expiry: item.warranty_expiry || '',
      location: item.location || 'HQ Tech Lab',
      notes: item.notes || '',
    });
    setErrorMsg('');
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!assetForm.name) {
      setErrorMsg('Please specify an asset name.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        ...assetForm,
        purchase_cost: parseFloat(assetForm.purchase_cost || 0),
        assigned_to: assetForm.assigned_to || null,
        warranty_expiry: assetForm.warranty_expiry || null,
      };

      if (editingAsset) {
        await api.inventory.updateAsset(editingAsset.id, payload);
      } else {
        await api.inventory.createAsset(payload);
      }
      setAssetModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving equipment asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to retire and remove this equipment asset?')) return;
    try {
      await api.inventory.deleteAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Failed to delete asset: ' + err.message);
    }
  };

  // Quick Assign / Transfer Handlers
  const openAssignModal = (asset) => {
    setAssigningAsset(asset);
    setAssignUserId(asset.assigned_to || '');
    setAssignNotes('');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningAsset) return;
    setSubmitting(true);
    try {
      await api.inventory.assignAsset(assigningAsset.id, {
        user_id: assignUserId || null,
        notes: assignNotes,
      });
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to assign equipment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Stock Item CRUD
  const openCreateStockModal = () => {
    setEditingStock(null);
    setStockForm({
      sku: '',
      name: '',
      category: 'Keyboards & Mice',
      quantity: '',
      min_stock_threshold: '5',
      unit_cost: '',
      location: 'Main Supply Cabinet',
      notes: '',
    });
    setErrorMsg('');
    setStockModalOpen(true);
  };

  const openEditStockModal = (item) => {
    setEditingStock(item);
    setStockForm({
      sku: item.sku || '',
      name: item.name || '',
      category: item.category || 'Keyboards & Mice',
      quantity: item.quantity || '',
      min_stock_threshold: item.min_stock_threshold || '5',
      unit_cost: item.unit_cost || '',
      location: item.location || 'Main Supply Cabinet',
      notes: item.notes || '',
    });
    setErrorMsg('');
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockForm.name || !stockForm.quantity) {
      setErrorMsg('Please specify stock item name and quantity.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        ...stockForm,
        quantity: parseInt(stockForm.quantity, 10),
        min_stock_threshold: parseInt(stockForm.min_stock_threshold || 5, 10),
        unit_cost: parseFloat(stockForm.unit_cost || 0),
      };

      if (editingStock) {
        await api.inventory.updateStock(editingStock.id, payload);
      } else {
        await api.inventory.createStock(payload);
      }
      setStockModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving stock item');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Stock Adjustment (+1 / -1)
  const handleStockAdjustment = async (id, delta) => {
    try {
      const res = await api.inventory.adjustStock(id, { delta });
      if (res.item) {
        setStockItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, quantity: res.item.quantity } : it))
        );
      }
    } catch (err) {
      alert('Error updating stock level: ' + err.message);
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) return;
    try {
      await api.inventory.deleteStock(id);
      setStockItems((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Failed to delete stock item: ' + err.message);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (activeTab === 'assets') {
      const headers = ['Asset Tag', 'Name', 'Category', 'Brand & Model', 'Serial Number', 'Assigned Staff', 'Status', 'Valuation (INR)', 'Location'];
      const rows = filteredAssets.map((a) => [
        `"${a.asset_tag || ''}"`,
        `"${a.name || ''}"`,
        `"${a.category || ''}"`,
        `"${a.brand_model || ''}"`,
        `"${a.serial_number || ''}"`,
        `"${a.assigned_to_name || 'In Lab'}"`,
        `"${a.status || ''}"`,
        Number(a.purchase_cost || 0),
        `"${a.location || ''}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `Asset_Register_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['SKU', 'Item Name', 'Category', 'Current Qty', 'Min Threshold', 'Unit Cost (INR)', 'Total Valuation', 'Location'];
      const rows = filteredStock.map((s) => [
        `"${s.sku || ''}"`,
        `"${s.name || ''}"`,
        `"${s.category || ''}"`,
        s.quantity,
        s.min_stock_threshold,
        Number(s.unit_cost || 0),
        Number(s.quantity * s.unit_cost || 0),
        `"${s.location || ''}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `Consumables_Stock_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getAssetCategoryIcon = (c = '') => {
    const s = c.toLowerCase();
    if (s.includes('laptop') || s.includes('workstation')) return Laptop;
    if (s.includes('monitor') || s.includes('display')) return Monitor;
    if (s.includes('camera')) return Camera;
    if (s.includes('audio') || s.includes('mic')) return Mic;
    if (s.includes('network') || s.includes('server')) return Network;
    return Boxes;
  };

  return (
    <div className="page-container space-y-5">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} />
              Operations &amp; Equipment
            </span>
            <span className="text-[11px] font-medium text-slate-400">Fixed Assets &amp; Consumables Inventory</span>
          </div>
          <h1 className="page-heading">Stock &amp; Equipments</h1>
          <p className="page-desc">
            Manage hardware assets, staff equipment handovers, studio cameras, displays, and replenishable IT supplies with automatic low-stock alerts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer shadow-xs"
            style={{ borderRadius: '12px', padding: '8px 14px' }}
            title="Refresh Inventory"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : 'text-slate-500'} />
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
            <span>Print Register</span>
          </button>

          {canPerform(role, 'MANAGE_ASSETS') && (
            <button
              type="button"
              onClick={activeTab === 'assets' ? openCreateAssetModal : openCreateStockModal}
              className="btn-banner-primary flex items-center gap-1.5"
              style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}
            >
              <Plus size={16} />
              <span>{activeTab === 'assets' ? 'Add Equipment' : 'Add Stock Item'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive Asset KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Valuation */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Total Asset Valuation</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
            ₹{totalAssetValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[10.5px] text-slate-500 font-semibold">
            {assets.length} Fixed Devices + {stockItems.length} Consumable SKUs
          </div>
        </div>

        {/* Active In-Use Equipment */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Assigned In-Use</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight my-1">
            {activeInUseCount} Devices
          </div>
          <div className="text-[10.5px] text-emerald-600 font-bold">
            Deployed with Group Staff
          </div>
        </div>

        {/* Available in Lab */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Available in Stock</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight my-1">
            {availableCount} Assets
          </div>
          <div className="text-[10.5px] text-slate-500 font-semibold">
            Ready for Next Hire Onboarding
          </div>
        </div>

        {/* Low Stock Threshold Alerts */}
        <div className="stat-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Low Stock Reorders</span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight my-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {lowStockCount} Item{lowStockCount === 1 ? '' : 's'}
          </div>
          <div className="text-[10.5px] font-bold text-rose-600">
            {lowStockCount > 0 ? 'Action Required: Reorder needed' : 'All Supplies Healthy'}
          </div>
        </div>
      </div>

      {/* 3. Dual-Tab Switcher & Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'assets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop size={14} />
          <span>Equipments &amp; Fixed Assets</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'assets' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
            {assets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === 'stock'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package size={14} />
          <span>Consumables &amp; Supplies</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'stock' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
            {stockItems.length}
          </span>
          {lowStockCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'assets' ? "Search tag, name, user, serial no..." : "Search SKU, item name, location..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {activeTab === 'assets' ? (
            <>
              {/* Asset Category */}
              <select
                value={assetCategoryFilter}
                onChange={(e) => setAssetCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Equipment Types</option>
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={assetStatusFilter}
                onChange={(e) => setAssetStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                {ASSET_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          ) : (
            /* Stock Category */
            <select
              value={stockCategoryFilter}
              onChange={(e) => setStockCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Supply Categories</option>
              {STOCK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 5. TAB CONTENT */}
      {activeTab === 'assets' ? (
        /* ======================== EQUIPMENTS & ASSETS TABLE ======================== */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Fixed Equipment Register
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-black">
                {filteredAssets.length} Devices
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Valuation: ₹{filteredAssets.reduce((s, a) => s + Number(a.purchase_cost || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Asset Tag</th>
                  <th className="py-2.5 px-4">Equipment &amp; Specs</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Assigned Staff</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Purchase Cost</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      <RefreshCw className="animate-spin mx-auto mb-2 text-amber-500" size={20} />
                      Loading equipment registry...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <Laptop className="mx-auto mb-2 text-slate-300" size={28} />
                      <p className="font-semibold text-slate-600">No equipment matching filters</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or add a new equipment asset.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const CatIcon = getAssetCategoryIcon(asset.category);
                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Tag */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-700 text-[11.5px] whitespace-nowrap">
                          {asset.asset_tag}
                        </td>

                        {/* Name & Serial */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{asset.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-medium">{asset.brand_model || 'Standard OEM'}</span>
                            {asset.serial_number && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="font-mono text-slate-400 text-[10px]">S/N: {asset.serial_number}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <CatIcon size={14} className="text-slate-400" />
                            <span className="text-[11px]">{asset.category}</span>
                          </div>
                        </td>

                        {/* Assigned Staff */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {asset.assigned_to_name ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                                {asset.assigned_to_avatar || 'AK'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-[11.5px]">{asset.assigned_to_name}</div>
                                <div className="text-[9.5px] text-slate-400">{asset.assigned_to_role || 'Staff'}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10.5px] font-semibold">
                              Unassigned / In Lab
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center gap-1 ${
                            asset.status === 'In Use'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : asset.status === 'Available'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : asset.status === 'Under Maintenance'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {asset.status === 'In Use' && <CheckCircle2 size={10} />}
                            {asset.status === 'Under Maintenance' && <Wrench size={10} />}
                            {asset.status}
                          </span>
                        </td>

                        {/* Valuation */}
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-xs whitespace-nowrap">
                          ₹{Number(asset.purchase_cost).toLocaleString('en-IN')}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {asset.location || 'Main Office'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canPerform(role, 'ASSIGN_EQUIPMENT') && (
                              <button
                                type="button"
                                onClick={() => openAssignModal(asset)}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                                title="Assign or Transfer Equipment"
                              >
                                <ArrowRightLeft size={14} />
                              </button>
                            )}
                            {canPerform(role, 'MANAGE_ASSETS') && (
                              <button
                                type="button"
                                onClick={() => openEditAssetModal(asset)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                                title="Edit equipment"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                            {canPerform(role, 'DELETE_ASSET') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Retire asset"
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
      ) : (
        /* ======================== CONSUMABLE STOCK TABLE ======================== */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Consumable Supplies &amp; IT Inventory
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-black">
                {filteredStock.length} SKUs
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Valuation: ₹{filteredStock.reduce((s, st) => s + (Number(st.quantity || 0) * Number(st.unit_cost || 0)), 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Item Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-center">In-Stock Quantity</th>
                  <th className="py-2.5 px-4 text-center">Min Threshold</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost</th>
                  <th className="py-2.5 px-4 text-right">Total Valuation</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      <RefreshCw className="animate-spin mx-auto mb-2 text-amber-500" size={20} />
                      Loading consumable inventory...
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <Package className="mx-auto mb-2 text-slate-300" size={28} />
                      <p className="font-semibold text-slate-600">No stock supplies found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or add a new consumable item.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const isLow = Number(item.quantity) <= Number(item.min_stock_threshold);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* SKU */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-700 text-[11.5px] whitespace-nowrap">
                          {item.sku}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.notes && <div className="text-[10.5px] text-slate-400 mt-0.5">{item.notes}</div>}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {item.category}
                        </td>

                        {/* Quantity with quick +/- */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleStockAdjustment(item.id, -1)}
                              disabled={item.quantity <= 0}
                              className="w-5 h-5 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 font-black text-xs flex items-center justify-center cursor-pointer shadow-2xs disabled:opacity-30"
                              title="Deduct 1"
                            >
                              -
                            </button>
                            <span className={`px-2 font-black text-xs ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStockAdjustment(item.id, 1)}
                              className="w-5 h-5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-600 font-black text-xs flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Add 1"
                            >
                              +
                            </button>
                          </div>
                          {isLow && (
                            <span className="block mt-1 text-[9.5px] font-black text-rose-600">
                              Low Stock!
                            </span>
                          )}
                        </td>

                        {/* Min Threshold */}
                        <td className="py-3 px-4 text-center text-slate-500 font-bold whitespace-nowrap">
                          {item.min_stock_threshold}
                        </td>

                        {/* Unit Cost */}
                        <td className="py-3 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">
                          ₹{Number(item.unit_cost).toLocaleString('en-IN')}
                        </td>

                        {/* Total Valuation */}
                        <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                          ₹{(Number(item.quantity) * Number(item.unit_cost)).toLocaleString('en-IN')}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {item.location || 'Storage'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canPerform(role, 'MANAGE_STOCK') && (
                              <button
                                type="button"
                                onClick={() => openEditStockModal(item)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                                title="Edit stock item"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                            {canPerform(role, 'MANAGE_STOCK') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStock(item.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Delete stock item"
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
      )}

      {/* 6. MODAL: Add / Edit Equipment Asset */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingAsset ? 'Edit Equipment Asset' : 'Register New Equipment Asset'}
                </h3>
                <p className="text-[11px] text-slate-400">Add hardware or media device to the company registry</p>
              </div>
              <button
                type="button"
                onClick={() => setAssetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssetSubmit} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tag & Name */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Asset Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EQP-MAC-01"
                    value={assetForm.asset_tag}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro 16 M3 Max"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category & Brand/Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Equipment Category
                  </label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Brand &amp; Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple / Dell / Sony"
                    value={assetForm.brand_model}
                    onChange={(e) => setAssetForm({ ...assetForm, brand_model: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Serial & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Serial Number (S/N)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C02XYZ99120"
                    value={assetForm.serial_number}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Purchase Valuation (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 249900"
                    value={assetForm.purchase_cost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchase_cost: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status & Assigned Staff */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {ASSET_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assigned Staff
                  </label>
                  <select
                    value={assetForm.assigned_to}
                    onChange={(e) => setAssetForm({ ...assetForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    <option value="">Unassigned (In Lab)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || emp.username} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Warranty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Location / Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Executive Suite / Tech Lab"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={assetForm.warranty_expiry}
                    onChange={(e) => setAssetForm({ ...assetForm, warranty_expiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : editingAsset ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Quick Assign / Transfer Equipment */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Assign / Handover Equipment
                </h3>
                <p className="text-[11px] text-slate-400">
                  {assigningAsset?.asset_tag} — {assigningAsset?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Assign To Staff Member
                </label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                >
                  <option value="">Unassign / Return to Tech Lab</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.username} ({emp.role} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Handover Notes / Condition Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Issued with charger and USB adapter"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Updating...' : 'Confirm Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: Add / Edit Consumable Stock Item */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingStock ? 'Edit Stock Item' : 'Add Consumable Supply'}
                </h3>
                <p className="text-[11px] text-slate-400">Manage replenishable accessories and office inventory</p>
              </div>
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SKU & Name */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STK-KEY-01"
                    value={stockForm.sku}
                    onChange={(e) => setStockForm({ ...stockForm, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supply Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Logitech MX Master 3S Mouse"
                    value={stockForm.name}
                    onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supply Category
                  </label>
                  <select
                    value={stockForm.category}
                    onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
                  >
                    {STOCK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Supply Cabinet - Shelf A1"
                    value={stockForm.location}
                    onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quantity, Min Threshold, Unit Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quantity In-Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Min Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={stockForm.min_stock_threshold}
                    onChange={(e) => setStockForm({ ...stockForm, min_stock_threshold: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit Cost (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1499"
                    value={stockForm.unit_cost}
                    onChange={(e) => setStockForm({ ...stockForm, unit_cost: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Notes / Supplier Link
                </label>
                <textarea
                  rows={2}
                  placeholder="Vendor name, purchase URL, or replenishment instructions"
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : editingStock ? 'Update Stock' : 'Add Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
