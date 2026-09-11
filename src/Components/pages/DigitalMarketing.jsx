import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import {
  Plus, Video, Image, Share2, Film, Layers, CheckCircle2, DollarSign,
  Edit2, Trash2, Calendar, User, Users, FileSpreadsheet, FileText,
  Printer, ArrowUpRight, TrendingUp, Sparkles, AlertCircle, ShieldAlert,
  Clock, CheckCircle, ChevronRight, X, ExternalLink, Search, Filter,
  Tag, Target, Zap, Rocket, Globe, Link2, Eye, Award
} from 'lucide-react';
import { api } from '../../services/api';

const EMPTY_SOCIAL = {
  client: '',
  assigned_employee: '',
  company_base: '',
  page_status: 'Existing Page', // 'Existing Page' | 'Need New Page Start'
  current_followers: '',
  instagram_handle: '',
  facebook_page: '',
  pricing_model: 'Monthly Retainer', // 'Monthly Retainer' | 'Per Deliverable'
  package_name: 'Standard Digital Retainer',
  monthly_payment: '',
  price_per_video: '',
  price_per_post: '',
  videos_planned: 12,
  posters_planned: 20,
  has_run_ads: false,
  meta_ads_manager_id: '',
  payment_status: 'Pending',
  content_status: 'Planning'
};

const EMPTY_ENTRY = {
  id: null,
  date: new Date().toISOString().split('T')[0],
  title: '',
  content_type: 'Video', // 'Video' | 'Poster' | 'Reel' | 'Story'
  is_planned: true, // true: Planned (Quota) | false: Unplanned (Extra/Ad-hoc)
  ads_pushed: false, // true: Paid Ads Pushed | false: Organic
  ad_spend: '',
  ad_campaign_name: '',
  platform: 'Instagram', // 'Instagram' | 'Facebook' | 'YouTube' | 'LinkedIn' | 'Multi-Platform'
  asset_url: '',
  logged_by: '',
  status: 'Published', // 'Published' | 'Under Review' | 'Scheduled'
  notes: ''
};

const COMMON_INDUSTRIES = [
  'Real Estate & Builders',
  'E-Commerce & Retail',
  'Restaurant & F&B',
  'Healthcare & Hospitals',
  'Education & EdTech',
  'Fashion & Jewellery',
  'Tech & IT Services',
  'Fitness & Gym',
  'Automobile & Garage',
  'Professional Services'
];

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (key) => {
  if (!key) return '';
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = -2; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    options.push({
      key,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  }
  return options;
};

// Date utilities for Day / Week / Month filter
const isSameWeek = (dateStr, refDate = new Date()) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d)) return false;

  const day = refDate.getDay();
  const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(refDate);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return d >= monday && d <= sunday;
};

export default function DigitalMarketing() {
  const { user } = useOutletContext() || {};
  const location = useLocation();
  const role = user?.role || 'FOUNDER';

  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'reports'
  const [socialClients, setSocialClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active month for top bar
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  // Modal: New/Edit Client Retainer
  const [clientModal, setClientModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SOCIAL);
  const [autoFilledNotice, setAutoFilledNotice] = useState(false);

  // Modal: Monthly Deliverables Tracker
  const [trackerModal, setTrackerModal] = useState(false);
  const [activeClientForTracking, setActiveClientForTracking] = useState(null);
  const [trackerForm, setTrackerForm] = useState({
    month_key: getCurrentMonthKey(),
    videos_planned: 0,
    videos_completed: 0,
    posters_planned: 0,
    posters_completed: 0,
    reels_count: 0,
    stories_count: 0,
    meta_ads_spent: 0,
    content_status: 'On Track',
    notes: ''
  });

  // Modal: Detailed Project Deliverables & Ads Log Report
  const [activeProjectReport, setActiveProjectReport] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('MONTH'); // 'ALL' | 'DAY' | 'WEEK' | 'MONTH'
  const [filterDay, setFilterDay] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'Video' | 'Poster' | 'Reel' | 'Story'
  const [filterPlan, setFilterPlan] = useState('ALL'); // 'ALL' | 'PLANNED' | 'UNPLANNED'
  const [filterAds, setFilterAds] = useState('ALL'); // 'ALL' | 'ADS' | 'ORGANIC'
  const [searchEntryQuery, setSearchEntryQuery] = useState('');

  // Modal: Add / Edit Deliverable Entry
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY);

  // Staff Reports View: Selected Employee
  const [selectedStaffId, setSelectedStaffId] = useState('ALL');
  // PDF Printable Export Modal for staff
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfStaffData, setPdfStaffData] = useState(null);

  const canManage = ['FOUNDER', 'CEO', 'MANAGER', 'ADMIN'].includes(role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, uRes] = await Promise.all([
        api.marketing.listSocialClients(),
        api.clients.list(),
        api.users.list().catch(() => ({ results: [] }))
      ]);

      const loadedSocialClients = sRes.data || sRes.results || (Array.isArray(sRes) ? sRes : []);
      setSocialClients(loadedSocialClients);
      setClients(cRes.data || cRes.results || (Array.isArray(cRes) ? cRes : []));
      setUsers(uRes.data || uRes.results || (Array.isArray(uRes) ? uRes : []));

      // If location state requested a specific client report
      if (location.state?.clientId) {
        const found = loadedSocialClients.find(s => String(s.client) === String(location.state.clientId) || String(s.client_detail?.id) === String(location.state.clientId));
        if (found) {
          setActiveProjectReport(found);
        }
      }
    } catch (e) {
      console.error('Error fetching marketing data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Permission check
  const canUserUpdateClient = (sc) => {
    if (canManage) return true;
    if (!user) return false;
    const userId = String(user.id);
    const assignedId = sc.assigned_employee ? String(sc.assigned_employee) : (sc.assigned_employee_detail?.id ? String(sc.assigned_employee_detail.id) : null);
    if (assignedId && assignedId === userId) return true;
    if (sc.assigned_team && Array.isArray(sc.assigned_team)) {
      if (sc.assigned_team.some(t => String(t?.id || t) === userId)) return true;
    }
    return false;
  };

  // Auto-fill when selecting client
  const handleClientSelect = (clientId) => {
    const selected = clients.find(c => String(c.id) === String(clientId));
    if (!selected) {
      setForm(prev => ({ ...prev, client: clientId }));
      return;
    }

    const ig = selected.social_media_accounts?.instagram || '';
    const fb = selected.social_media_accounts?.facebook || '';
    const base = selected.industry || selected.business_type || '';
    const assigned = selected.assigned_employees?.[0]?.id || selected.assigned_employees?.[0] || '';

    setForm(prev => ({
      ...prev,
      client: clientId,
      instagram_handle: ig || prev.instagram_handle,
      facebook_page: fb || prev.facebook_page,
      company_base: base || prev.company_base,
      assigned_employee: prev.assigned_employee || assigned
    }));

    setAutoFilledNotice(Boolean(ig || fb || base));
    setTimeout(() => setAutoFilledNotice(false), 3500);
  };

  // Open Edit Client Modal
  const openEditModal = (sc) => {
    setForm({
      id: sc.id,
      client: sc.client || sc.client_detail?.id || '',
      assigned_employee: sc.assigned_employee || sc.assigned_employee_detail?.id || '',
      company_base: sc.company_base || sc.client_detail?.industry || '',
      page_status: sc.page_status || 'Existing Page',
      current_followers: sc.current_followers || '',
      instagram_handle: sc.instagram_handle || '',
      facebook_page: sc.facebook_page || '',
      pricing_model: sc.pricing_model || 'Monthly Retainer',
      package_name: sc.package_name || 'Standard Digital Retainer',
      monthly_payment: sc.monthly_payment || '',
      price_per_video: sc.price_per_video || '',
      price_per_post: sc.price_per_post || '',
      videos_planned: sc.videos_planned || 0,
      posters_planned: sc.posters_planned || 0,
      has_run_ads: Boolean(sc.has_run_ads),
      meta_ads_manager_id: sc.meta_ads_manager_id || '',
      payment_status: sc.payment_status || 'Pending',
      content_status: sc.content_status || 'Planning'
    });
    setClientModal(true);
  };

  // Save Social Media Client Setup
  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      let calculatedPayment = form.monthly_payment;
      if (form.pricing_model === 'Per Deliverable') {
        const vCost = (Number(form.price_per_video) || 0) * (Number(form.videos_planned) || 0);
        const pCost = (Number(form.price_per_post) || 0) * (Number(form.posters_planned) || 0);
        calculatedPayment = vCost + pCost;
      }

      const payload = {
        ...form,
        monthly_payment: calculatedPayment || 0,
        price_per_video: Number(form.price_per_video) || 0,
        price_per_post: Number(form.price_per_post) || 0,
        videos_planned: Number(form.videos_planned) || 0,
        posters_planned: Number(form.posters_planned) || 0,
        assigned_employee: form.assigned_employee || null
      };

      if (form.id) {
        await api.marketing.updateSocialClient(form.id, payload);
      } else {
        const currentM = getCurrentMonthKey();
        payload.monthly_deliverables = {
          [currentM]: {
            month_key: currentM,
            month_label: getMonthLabel(currentM),
            videos_planned: Number(form.videos_planned) || 0,
            videos_completed: 0,
            posters_planned: Number(form.posters_planned) || 0,
            posters_completed: 0,
            reels_count: 0,
            stories_count: 0,
            meta_ads_spent: 0,
            content_status: 'Planning',
            notes: 'Client account onboarded.'
          }
        };
        payload.deliverable_entries = [];
        await api.marketing.createSocialClient(payload);
      }
      setClientModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error saving client retainer');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this social media client retainer?')) {
      try {
        await api.marketing.deleteSocialClient(id);
        if (activeProjectReport?.id === id) setActiveProjectReport(null);
        fetchData();
      } catch (err) {
        alert(err.message || 'Error deleting client');
      }
    }
  };

  // Open Monthly Tracker Modal
  const openMonthlyTracker = (sc, monthKey = selectedMonth) => {
    if (!canUserUpdateClient(sc)) {
      alert(`Permission Denied: Only ${sc.assigned_employee_name || 'Assigned Staff'} or Managers can update deliverables.`);
      return;
    }

    setActiveClientForTracking(sc);
    const existing = sc.monthly_deliverables?.[monthKey] || {};
    setTrackerForm({
      month_key: monthKey,
      videos_planned: existing.videos_planned ?? sc.videos_planned ?? 0,
      videos_completed: existing.videos_completed ?? sc.videos_completed ?? 0,
      posters_planned: existing.posters_planned ?? sc.posters_planned ?? 0,
      posters_completed: existing.posters_completed ?? sc.posters_completed ?? 0,
      reels_count: existing.reels_count ?? sc.reels_count ?? 0,
      stories_count: existing.stories_count ?? sc.stories_count ?? 0,
      meta_ads_spent: existing.meta_ads_spent ?? 0,
      content_status: existing.content_status ?? sc.content_status ?? 'On Track',
      notes: existing.notes || ''
    });
    setTrackerModal(true);
  };

  // Save Monthly Deliverables Form
  const handleSaveMonthlyDeliverables = async (e) => {
    e.preventDefault();
    if (!activeClientForTracking) return;

    try {
      const monthKey = trackerForm.month_key;
      const updatedDeliverables = {
        ...(activeClientForTracking.monthly_deliverables || {}),
        [monthKey]: {
          month_key: monthKey,
          month_label: getMonthLabel(monthKey),
          videos_planned: Number(trackerForm.videos_planned) || 0,
          videos_completed: Number(trackerForm.videos_completed) || 0,
          posters_planned: Number(trackerForm.posters_planned) || 0,
          posters_completed: Number(trackerForm.posters_completed) || 0,
          reels_count: Number(trackerForm.reels_count) || 0,
          stories_count: Number(trackerForm.stories_count) || 0,
          meta_ads_spent: Number(trackerForm.meta_ads_spent) || 0,
          content_status: trackerForm.content_status,
          notes: trackerForm.notes,
          updated_by: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Staff'),
          updated_at: new Date().toISOString()
        }
      };

      const payload = {
        monthly_deliverables: updatedDeliverables
      };

      if (monthKey === getCurrentMonthKey()) {
        payload.videos_completed = Number(trackerForm.videos_completed) || 0;
        payload.posters_completed = Number(trackerForm.posters_completed) || 0;
        payload.reels_count = Number(trackerForm.reels_count) || 0;
        payload.stories_count = Number(trackerForm.stories_count) || 0;
        payload.content_status = trackerForm.content_status;
      }

      await api.marketing.updateSocialClient(activeClientForTracking.id, payload);
      setTrackerModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error updating monthly deliverables');
    }
  };

  // Quick 1-click increment
  const handleQuickIncrement = async (sc, field, delta = 1) => {
    if (!canUserUpdateClient(sc)) {
      alert(`Permission Denied: Only ${sc.assigned_employee_name || 'Assigned Staff'} or Managers can update.`);
      return;
    }
    const monthKey = selectedMonth;
    const existing = sc.monthly_deliverables?.[monthKey] || {};
    const currentVal = existing[field] ?? sc[field] ?? 0;
    const newVal = Math.max(0, currentVal + delta);

    const updatedMonth = {
      ...existing,
      month_key: monthKey,
      month_label: getMonthLabel(monthKey),
      videos_planned: existing.videos_planned ?? sc.videos_planned ?? 0,
      posters_planned: existing.posters_planned ?? sc.posters_planned ?? 0,
      [field]: newVal,
      updated_by: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Staff'),
      updated_at: new Date().toISOString()
    };

    const updatedDeliverables = {
      ...(sc.monthly_deliverables || {}),
      [monthKey]: updatedMonth
    };

    const payload = { monthly_deliverables: updatedDeliverables };
    if (monthKey === getCurrentMonthKey()) {
      payload[field] = newVal;
    }

    try {
      await api.marketing.updateSocialClient(sc.id, payload);
      fetchData();
    } catch (err) {
      console.error('Failed to quick-update', err);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DELIVERABLE ENTRIES LOGIC (PLANNED / UNPLANNED & ADS PUSHED)
  // ─────────────────────────────────────────────────────────────

  // Open Add Entry Modal
  const handleOpenAddEntry = () => {
    if (!activeProjectReport) return;
    if (!canUserUpdateClient(activeProjectReport)) {
      alert(`Permission Denied: Only ${activeProjectReport.assigned_employee_name || 'Assigned Staff'} or Managers can add deliverable entries.`);
      return;
    }

    setEntryForm({
      ...EMPTY_ENTRY,
      date: new Date().toISOString().split('T')[0],
      logged_by: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Staff')
    });
    setEntryModalOpen(true);
  };

  // Open Edit Entry Modal
  const handleOpenEditEntry = (entry) => {
    if (!activeProjectReport) return;
    if (!canUserUpdateClient(activeProjectReport)) {
      alert('Permission Denied: Only assigned staff or managers can edit entries.');
      return;
    }

    setEntryForm({
      ...entry
    });
    setEntryModalOpen(true);
  };

  // Save Deliverable Entry (Add or Edit)
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!activeProjectReport) return;

    try {
      const currentEntries = activeProjectReport.deliverable_entries || [];
      let updatedEntries;

      if (entryForm.id) {
        // Edit
        updatedEntries = currentEntries.map(it => it.id === entryForm.id ? { ...entryForm, updated_at: new Date().toISOString() } : it);
      } else {
        // Add
        const newEntry = {
          ...entryForm,
          id: `ent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          created_at: new Date().toISOString()
        };
        updatedEntries = [newEntry, ...currentEntries];
      }

      // Auto-update monthly count in monthly_deliverables for that entry's month
      const entryMonth = (entryForm.date || '').substring(0, 7) || getCurrentMonthKey();
      const monthEntries = updatedEntries.filter(it => (it.date || '').startsWith(entryMonth));
      const vComp = monthEntries.filter(it => it.content_type === 'Video' || it.content_type === 'Reel').length;
      const pComp = monthEntries.filter(it => it.content_type === 'Poster').length;
      const rComp = monthEntries.filter(it => it.content_type === 'Reel').length;
      const sComp = monthEntries.filter(it => it.content_type === 'Story').length;
      const aSpend = monthEntries.filter(it => it.ads_pushed).reduce((acc, it) => acc + (Number(it.ad_spend) || 0), 0);

      const existingMData = activeProjectReport.monthly_deliverables?.[entryMonth] || {};
      const updatedMonthlyDeliverables = {
        ...(activeProjectReport.monthly_deliverables || {}),
        [entryMonth]: {
          ...existingMData,
          month_key: entryMonth,
          month_label: getMonthLabel(entryMonth),
          videos_completed: vComp,
          posters_completed: pComp,
          reels_count: rComp,
          stories_count: sComp,
          meta_ads_spent: aSpend,
          updated_by: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Staff'),
          updated_at: new Date().toISOString()
        }
      };

      const payload = {
        deliverable_entries: updatedEntries,
        monthly_deliverables: updatedMonthlyDeliverables
      };

      if (entryMonth === getCurrentMonthKey()) {
        payload.videos_completed = vComp;
        payload.posters_completed = pComp;
        payload.reels_count = rComp;
        payload.stories_count = sComp;
      }

      await api.marketing.updateSocialClient(activeProjectReport.id, payload);

      // Update active report in state
      setActiveProjectReport(prev => ({
        ...prev,
        deliverable_entries: updatedEntries,
        monthly_deliverables: updatedMonthlyDeliverables,
        videos_completed: payload.videos_completed ?? prev.videos_completed,
        posters_completed: payload.posters_completed ?? prev.posters_completed
      }));

      setEntryModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error saving deliverable entry');
    }
  };

  // Delete Deliverable Entry
  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this deliverable entry?')) return;
    if (!activeProjectReport) return;

    try {
      const updatedEntries = (activeProjectReport.deliverable_entries || []).filter(it => it.id !== entryId);
      const payload = { deliverable_entries: updatedEntries };

      await api.marketing.updateSocialClient(activeProjectReport.id, payload);
      setActiveProjectReport(prev => ({
        ...prev,
        deliverable_entries: updatedEntries
      }));
      fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting entry');
    }
  };

  // Filtered entries for the active project report
  const filteredProjectEntries = useMemo(() => {
    if (!activeProjectReport) return [];
    const entries = activeProjectReport.deliverable_entries || [];

    return entries.filter(item => {
      // Period filter
      if (periodFilter === 'DAY' && filterDay) {
        if (item.date !== filterDay) return false;
      } else if (periodFilter === 'WEEK') {
        if (!isSameWeek(item.date)) return false;
      } else if (periodFilter === 'MONTH' && selectedMonth) {
        if (!item.date || !item.date.startsWith(selectedMonth)) return false;
      }

      // Type filter
      if (filterType !== 'ALL' && item.content_type !== filterType) return false;

      // Plan filter: Planned vs Unplanned
      if (filterPlan === 'PLANNED' && !item.is_planned) return false;
      if (filterPlan === 'UNPLANNED' && item.is_planned) return false;

      // Ads filter: Ads Pushed vs Organic
      if (filterAds === 'ADS' && !item.ads_pushed) return false;
      if (filterAds === 'ORGANIC' && item.ads_pushed) return false;

      // Search query
      if (searchEntryQuery) {
        const q = searchEntryQuery.toLowerCase();
        const mTitle = (item.title || '').toLowerCase().includes(q);
        const mNotes = (item.notes || '').toLowerCase().includes(q);
        const mCamp = (item.ad_campaign_name || '').toLowerCase().includes(q);
        const mStaff = (item.logged_by || '').toLowerCase().includes(q);
        if (!mTitle && !mNotes && !mCamp && !mStaff) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [activeProjectReport, periodFilter, filterDay, selectedMonth, filterType, filterPlan, filterAds, searchEntryQuery]);

  // Dynamic KPI calculations for active project report
  const projectReportKPIs = useMemo(() => {
    if (!activeProjectReport) return null;
    const mData = activeProjectReport.monthly_deliverables?.[selectedMonth] || {};
    const targetVideos = mData.videos_planned ?? activeProjectReport.videos_planned ?? 0;
    const targetPosters = mData.posters_planned ?? activeProjectReport.posters_planned ?? 0;

    let plannedVideos = 0;
    let unplannedVideos = 0;
    let plannedPosters = 0;
    let unplannedPosters = 0;
    let reelsCount = 0;
    let storiesCount = 0;
    let adsCount = 0;
    let totalAdSpend = 0;

    filteredProjectEntries.forEach(it => {
      if (it.content_type === 'Video' || it.content_type === 'Reel') {
        if (it.is_planned) plannedVideos++;
        else unplannedVideos++;
        if (it.content_type === 'Reel') reelsCount++;
      } else if (it.content_type === 'Poster') {
        if (it.is_planned) plannedPosters++;
        else unplannedPosters++;
      } else if (it.content_type === 'Story') {
        storiesCount++;
      }

      if (it.ads_pushed) {
        adsCount++;
        totalAdSpend += Number(it.ad_spend || 0);
      }
    });

    return {
      targetVideos,
      targetPosters,
      plannedVideos,
      unplannedVideos,
      totalVideos: plannedVideos + unplannedVideos,
      plannedPosters,
      unplannedPosters,
      totalPosters: plannedPosters + unplannedPosters,
      reelsCount,
      storiesCount,
      adsCount,
      totalAdSpend,
      totalOutput: filteredProjectEntries.length
    };
  }, [activeProjectReport, selectedMonth, filteredProjectEntries]);

  // Export Project Report to Excel (.CSV with BOM)
  const handleExportProjectExcel = () => {
    if (!activeProjectReport) return;
    const clientName = activeProjectReport.client_name || 'Client';
    const periodLabel = periodFilter === 'DAY' ? `Date_${filterDay}` : (periodFilter === 'WEEK' ? 'This_Week' : (periodFilter === 'MONTH' ? getMonthLabel(selectedMonth) : 'All_Time'));

    let csv = '\uFEFF';
    csv += `JRAM GROUPS - PROJECT DELIVERABLES & ADS LOG REPORT\n`;
    csv += `Project Client,${clientName}\n`;
    csv += `Company Domain,${activeProjectReport.company_base || 'General'}\n`;
    csv += `Reporting Period,${periodLabel}\n`;
    csv += `Assigned Staff,${activeProjectReport.assigned_employee_name || 'Unassigned'}\n`;
    csv += `Generated On,${new Date().toLocaleString('en-IN')}\n\n`;

    csv += `KPI SUMMARY\n`;
    csv += `Target Videos,${projectReportKPIs?.targetVideos || 0},Planned Videos Done,${projectReportKPIs?.plannedVideos || 0},Unplanned Videos (Extra),${projectReportKPIs?.unplannedVideos || 0}\n`;
    csv += `Target Posters,${projectReportKPIs?.targetPosters || 0},Planned Posters Done,${projectReportKPIs?.plannedPosters || 0},Unplanned Posters (Extra),${projectReportKPIs?.unplannedPosters || 0}\n`;
    csv += `Total Content Output,${projectReportKPIs?.totalOutput || 0},Ads Pushed Count,${projectReportKPIs?.adsCount || 0},Total Ad Spend (INR),${projectReportKPIs?.totalAdSpend || 0}\n\n`;

    csv += `Date,Title / Creative Name,Type,Planning Classification,Ads Pushed?,Ad Spend (INR),Ad Campaign Name,Platform,Asset Link,Logged By,Status,Notes\n`;

    filteredProjectEntries.forEach(it => {
      const row = [
        `"${it.date || ''}"`,
        `"${(it.title || '').replace(/"/g, '""')}"`,
        `"${it.content_type || 'Video'}"`,
        `"${it.is_planned ? 'Planned (Monthly Target)' : 'Unplanned (Extra/Ad-hoc)'}"`,
        `"${it.ads_pushed ? 'Yes, Ads Pushed' : 'No (Organic)'}"`,
        it.ads_pushed ? (it.ad_spend || 0) : 0,
        `"${(it.ad_campaign_name || '').replace(/"/g, '""')}"`,
        `"${it.platform || 'Instagram'}"`,
        `"${it.asset_url || ''}"`,
        `"${it.logged_by || ''}"`,
        `"${it.status || 'Published'}"`,
        `"${(it.notes || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deliverables_Report_${clientName.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper for card month data
  const getClientMonthData = (sc, monthKey = selectedMonth) => {
    const md = sc.monthly_deliverables?.[monthKey];
    if (md) {
      return {
        videos_planned: md.videos_planned ?? sc.videos_planned ?? 0,
        videos_completed: md.videos_completed ?? 0,
        posters_planned: md.posters_planned ?? sc.posters_planned ?? 0,
        posters_completed: md.posters_completed ?? 0,
        reels_count: md.reels_count ?? sc.reels_count ?? 0,
        stories_count: md.stories_count ?? sc.stories_count ?? 0,
        meta_ads_spent: md.meta_ads_spent ?? 0,
        content_status: md.content_status ?? sc.content_status ?? 'On Track',
        notes: md.notes || '',
        updated_by: md.updated_by || '',
        isLogged: true
      };
    }
    const isCurrent = monthKey === getCurrentMonthKey();
    return {
      videos_planned: sc.videos_planned || 0,
      videos_completed: isCurrent ? (sc.videos_completed || 0) : 0,
      posters_planned: sc.posters_planned || 0,
      posters_completed: isCurrent ? (sc.posters_completed || 0) : 0,
      reels_count: isCurrent ? (sc.reels_count || 0) : 0,
      stories_count: isCurrent ? (sc.stories_count || 0) : 0,
      meta_ads_spent: 0,
      content_status: isCurrent ? (sc.content_status || 'Planning') : 'Not Started',
      notes: '',
      updated_by: '',
      isLogged: isCurrent
    };
  };

  // Staff Performance Aggregates
  const staffSummaries = useMemo(() => {
    const staffMap = {};

    users.forEach(u => {
      staffMap[u.id] = {
        user: u,
        name: u.first_name ? `${u.first_name} ${u.last_name || ''}` : (u.name || u.username),
        role: u.role,
        clients: [],
        total_videos_planned: 0,
        total_videos_completed: 0,
        total_posters_planned: 0,
        total_posters_completed: 0,
        total_reels: 0,
        total_stories: 0,
        total_retainer: 0
      };
    });

    staffMap['unassigned'] = {
      user: null,
      name: 'Unassigned Clients',
      role: 'SYSTEM',
      clients: [],
      total_videos_planned: 0,
      total_videos_completed: 0,
      total_posters_planned: 0,
      total_posters_completed: 0,
      total_reels: 0,
      total_stories: 0,
      total_retainer: 0
    };

    socialClients.forEach(sc => {
      const staffId = sc.assigned_employee || sc.assigned_employee_detail?.id || 'unassigned';
      if (!staffMap[staffId]) {
        staffMap[staffId] = {
          user: sc.assigned_employee_detail || null,
          name: sc.assigned_employee_name || 'Staff Member',
          role: 'EMPLOYEE',
          clients: [],
          total_videos_planned: 0,
          total_videos_completed: 0,
          total_posters_planned: 0,
          total_posters_completed: 0,
          total_reels: 0,
          total_stories: 0,
          total_retainer: 0
        };
      }

      const mData = getClientMonthData(sc, selectedMonth);
      staffMap[staffId].clients.push({ sc, mData });
      staffMap[staffId].total_videos_planned += mData.videos_planned;
      staffMap[staffId].total_videos_completed += mData.videos_completed;
      staffMap[staffId].total_posters_planned += mData.posters_planned;
      staffMap[staffId].total_posters_completed += mData.posters_completed;
      staffMap[staffId].total_reels += mData.reels_count;
      staffMap[staffId].total_stories += mData.stories_count;
      staffMap[staffId].total_retainer += Number(sc.monthly_payment || 0);
    });

    return Object.values(staffMap).filter(s => s.clients.length > 0 || (user && String(user.id) === String(s.user?.id)));
  }, [socialClients, users, selectedMonth, user]);

  const activeStaffReport = useMemo(() => {
    if (selectedStaffId === 'ALL') return null;
    return staffSummaries.find(s => String(s.user?.id || 'unassigned') === String(selectedStaffId));
  }, [staffSummaries, selectedStaffId]);

  return (
    <div className="page-container space-y-6">
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
              <Film size={22} className="text-amber-600" />
            </div>
            <div>
              <h1 className="page-heading">Digital Marketing &amp; Social Retainers</h1>
              <p className="page-desc">Track client social accounts, planned vs unplanned deliverables, ads push status, and generate project reports</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Month Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar size={15} className="text-amber-500 mr-2" />
            <select
              className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer pr-2"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'clients' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Client Projects ({socialClients.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Users size={13} className="text-amber-500" />
              Staff Monthly Reports
            </button>
          </div>

          {canManage && (
            <button
              onClick={() => { setForm(EMPTY_SOCIAL); setClientModal(true); }}
              className="btn-warning-custom cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} /> Add Retainer Client
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CLIENT RETAINER CARDS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-semibold text-slate-500">
              Showing deliverables tracking for: <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">{getMonthLabel(selectedMonth)}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Click &ldquo;Project Report &amp; Ads Log&rdquo; to track planned/unplanned deliverables and ad push entries
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs">
              Loading Retainer Accounts &amp; Metrics...
            </div>
          ) : socialClients.length === 0 ? (
            <div className="dashboard-card text-center py-16">
              <Film size={40} className="mx-auto text-amber-300 mb-3 opacity-60" />
              <h3 className="font-extrabold text-slate-800 text-sm">No Social Retainer Clients Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Get started by clicking &ldquo;Add Retainer Client&rdquo; to configure social profiles, deliverables plans, and assign team members.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {socialClients.map(sc => {
                const mData = getClientMonthData(sc, selectedMonth);
                const isAssignedToUser = canUserUpdateClient(sc);
                const videoPct = mData.videos_planned > 0 ? Math.min(100, Math.round((mData.videos_completed / mData.videos_planned) * 100)) : 0;
                const posterPct = mData.posters_planned > 0 ? Math.min(100, Math.round((mData.posters_completed / mData.posters_planned) * 100)) : 0;
                const entriesCount = (sc.deliverable_entries || []).length;
                const adsCount = (sc.deliverable_entries || []).filter(e => e.ads_pushed).length;

                return (
                  <div key={sc.id} className="dashboard-card flex flex-col justify-between hover:border-amber-300 transition-all">
                    <div>
                      {/* Top Row: Client Name, Company Base & Badges */}
                      <div className="flex items-start justify-between border-b pb-3 mb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-base">{sc.client_name}</h3>
                            {sc.company_base && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold">
                                {sc.company_base}
                              </span>
                            )}
                            {sc.page_status === 'Need New Page Start' ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                ✨ New Page Launch
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                                📱 {sc.current_followers ? `${sc.current_followers} followers` : 'Existing Page'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{sc.package_name}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">{sc.pricing_model || 'Monthly Retainer'}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            mData.content_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            mData.content_status === 'Behind Schedule' ? 'bg-rose-100 text-rose-800' :
                            mData.content_status === 'On Track' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {mData.content_status}
                          </span>
                          {canManage && (
                            <>
                              <button
                                onClick={() => openEditModal(sc)}
                                title="Edit Retainer Details"
                                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(sc.id)}
                                title="Delete Client"
                                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Social Handles & Meta Ads Account */}
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 border border-pink-200/80 font-mono text-[11px] flex items-center gap-1">
                          <strong>IG:</strong> {sc.instagram_handle || '@official'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 font-mono text-[11px] flex items-center gap-1">
                          <strong>FB:</strong> {sc.facebook_page || 'fb.com/page'}
                        </span>
                        {sc.meta_ads_manager_id ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[11px] flex items-center gap-1" title="Meta Ads Manager Account ID">
                            <strong>Meta Ads:</strong> {sc.meta_ads_manager_id}
                          </span>
                        ) : sc.has_run_ads ? (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10.5px]">
                            Prior Ads Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10.5px]">
                            No Prior Ads
                          </span>
                        )}
                        {entriesCount > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10.5px]">
                            {entriesCount} Entries ({adsCount} with Ads)
                          </span>
                        )}
                      </div>

                      {/* Assigned Staff Notice */}
                      <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-amber-500" />
                          <span className="text-slate-500 font-medium">Assigned Staff:</span>
                          <span className="font-bold text-slate-900">
                            {sc.assigned_employee_name || 'Unassigned (Manager Only)'}
                          </span>
                        </div>
                        {isAssignedToUser && (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Authorized
                          </span>
                        )}
                      </div>

                      {/* Monthly Deliverables Progress */}
                      <div className="space-y-3 bg-gradient-to-br from-amber-50/40 via-slate-50 to-slate-50 p-4 rounded-2xl border border-amber-200/60 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-xs">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1">
                            <Clock size={13} className="text-amber-600" />
                            {getMonthLabel(selectedMonth)} Deliverables
                          </span>
                          <span className="text-[11px] font-bold text-amber-800">
                            {Math.round((videoPct + posterPct) / 2)}% Overall
                          </span>
                        </div>

                        {/* Videos Progress */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                            <span className="flex items-center gap-1.5">
                              <Video size={14} className="text-amber-500" /> Videos Produced
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-900">{mData.videos_completed} / {mData.videos_planned}</span>
                              <span className="text-[10px] text-amber-700 font-extrabold">({videoPct}%)</span>
                              {isAssignedToUser && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickIncrement(sc, 'videos_completed', 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                                  title="Quick +1 Video Completed"
                                >
                                  +
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${videoPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Posters / Graphics Progress */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                            <span className="flex items-center gap-1.5">
                              <Image size={14} className="text-purple-500" /> Posters / Graphics
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-900">{mData.posters_completed} / {mData.posters_planned}</span>
                              <span className="text-[10px] text-purple-700 font-extrabold">({posterPct}%)</span>
                              {isAssignedToUser && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickIncrement(sc, 'posters_completed', 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                                  title="Quick +1 Poster Completed"
                                >
                                  +
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${posterPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions: Project Report + Quick Tracker */}
                    <div className="pt-3 border-t mt-4 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Retainer</span>
                        <span className="font-black text-emerald-700 text-sm font-mono">
                          ₹{Number(sc.monthly_payment || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* THE REQUESTED REPORT BUTTON */}
                        <button
                          type="button"
                          onClick={() => setActiveProjectReport(sc)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          title="Open Date-wise Deliverables & Ads Push Report for this Project"
                        >
                          <FileText size={14} /> Project Report &amp; Ads Log
                        </button>

                        <button
                          type="button"
                          onClick={() => openMonthlyTracker(sc, selectedMonth)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Update Monthly Total Progress"
                        >
                          <Clock size={12} /> Fast Log
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: MONTHLY STAFF REPORTS & AUDIT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="dashboard-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Monthly Deliverables Report by Staff</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit monthly video &amp; graphic outputs per assigned employee for <span className="font-bold text-amber-600">{getMonthLabel(selectedMonth)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-500">Filter Staff:</span>
                <select
                  className="form-input text-xs font-bold py-1 px-2.5 w-auto"
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                >
                  <option value="ALL">All Staff Members ({staffSummaries.length})</option>
                  {staffSummaries.map(s => (
                    <option key={s.user?.id || 'unassigned'} value={s.user?.id || 'unassigned'}>
                      {s.name} ({s.clients.length} clients)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPdfStaffData(activeStaffReport);
                  setPdfModalOpen(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer size={14} /> Print / PDF
              </button>
            </div>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffSummaries.map(st => {
              const isSelected = selectedStaffId === String(st.user?.id || 'unassigned');
              const vPct = st.total_videos_planned > 0 ? Math.round((st.total_videos_completed / st.total_videos_planned) * 100) : 0;
              const pPct = st.total_posters_planned > 0 ? Math.round((st.total_posters_completed / st.total_posters_planned) * 100) : 0;
              const overallPct = Math.round((vPct + pPct) / 2);

              return (
                <div
                  key={st.user?.id || 'unassigned'}
                  onClick={() => setSelectedStaffId(isSelected ? 'ALL' : String(st.user?.id || 'unassigned'))}
                  className={`dashboard-card cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-amber-500 bg-amber-50/20 shadow-md' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 border-b pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{st.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{st.role}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-extrabold">
                      {st.clients.length} Clients
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Videos</span>
                      <span className="font-mono font-black text-slate-900">{st.total_videos_completed} / {st.total_videos_planned}</span>
                      <span className="text-[10px] text-amber-600 block font-bold">({vPct}%)</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Posters</span>
                      <span className="font-mono font-black text-slate-900">{st.total_posters_completed} / {st.total_posters_planned}</span>
                      <span className="text-[10px] text-purple-600 block font-bold">({pPct}%)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Delivery Completion</span>
                      <span className="font-mono text-amber-700">{overallPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Retainer Managed:</span>
                    <span className="font-black text-emerald-700 font-mono">₹{st.total_retainer.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: PROJECT DELIVERABLES & ADS LOG REPORT (WIDE & EXPANDED) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeProjectReport && (
        <div className="fixed inset-0 z-[1060] bg-slate-950/70 backdrop-blur-xs p-2 sm:p-5 overflow-y-auto flex justify-center items-start">
          <div
            className="my-auto w-full max-w-7xl max-h-[94vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-amber-200 p-4 sm:p-6 transition-all"
          >
            {/* Modal Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-3 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <FileText size={20} />
                  </span>
                  <h2 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                    {activeProjectReport.client_name}
                  </h2>
                  {activeProjectReport.company_base && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                      {activeProjectReport.company_base}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                    <User size={12} className="text-amber-600" />
                    Lead: {activeProjectReport.assigned_employee_name || 'Unassigned'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-black">
                    Retainer: ₹{Number(activeProjectReport.monthly_payment || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Deliverables Log &amp; Meta Ads Push Audit • Active Reporting Month: <span className="font-bold text-amber-700">{getMonthLabel(selectedMonth)}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {canUserUpdateClient(activeProjectReport) && (
                  <button
                    type="button"
                    onClick={handleOpenAddEntry}
                    className="btn-warning-custom text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs px-4 py-2"
                  >
                    <Plus size={15} /> Add Deliverable Entry
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportProjectExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Export this project's date-wise deliverables to Excel CSV"
                >
                  <FileSpreadsheet size={15} /> Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Print / Save PDF"
                >
                  <Printer size={15} /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setActiveProjectReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors ml-1"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* KPI RIBBON (SINGLE HORIZONTAL ROW WITH FULL WIDTH) */}
            {projectReportKPIs && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3 flex-shrink-0">
                {/* Planned Videos */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                    Planned Videos
                  </span>
                  <span className="font-mono font-black text-amber-950 text-base mt-0.5 block">
                    {projectReportKPIs.plannedVideos} / {projectReportKPIs.targetVideos}
                  </span>
                  <span className="text-[9.5px] font-bold text-amber-700">Target Quota</span>
                </div>

                {/* Unplanned Videos */}
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-orange-800 tracking-wider block">
                    Unplanned Videos
                  </span>
                  <span className="font-mono font-black text-orange-950 text-base mt-0.5 block">
                    {projectReportKPIs.unplannedVideos}
                  </span>
                  <span className="text-[9.5px] font-bold text-orange-700">⚡ Extra Output</span>
                </div>

                {/* Planned Posters */}
                <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider block">
                    Planned Posters
                  </span>
                  <span className="font-mono font-black text-purple-950 text-base mt-0.5 block">
                    {projectReportKPIs.plannedPosters} / {projectReportKPIs.targetPosters}
                  </span>
                  <span className="text-[9.5px] font-bold text-purple-700">Target Quota</span>
                </div>

                {/* Unplanned Posters */}
                <div className="p-2.5 bg-fuchsia-50 border border-fuchsia-200 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-fuchsia-800 tracking-wider block">
                    Unplanned Posters
                  </span>
                  <span className="font-mono font-black text-fuchsia-950 text-base mt-0.5 block">
                    {projectReportKPIs.unplannedPosters}
                  </span>
                  <span className="text-[9.5px] font-bold text-fuchsia-700">⚡ Extra Output</span>
                </div>

                {/* Ads Pushed */}
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider block">
                    Ads Pushed
                  </span>
                  <span className="font-mono font-black text-indigo-950 text-base mt-0.5 block">
                    {projectReportKPIs.adsCount} / {projectReportKPIs.totalOutput}
                  </span>
                  <span className="text-[9.5px] font-bold text-indigo-700">Campaign Boosts</span>
                </div>

                {/* Total Ad Spend */}
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                    Total Ad Spend
                  </span>
                  <span className="font-mono font-black text-emerald-950 text-base mt-0.5 block">
                    ₹{projectReportKPIs.totalAdSpend.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-700">Meta Budget</span>
                </div>
              </div>
            )}

            {/* COMPACT FILTERS TOOLBAR */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl mb-3 space-y-2 flex-shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Period Pills */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('MONTH')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'MONTH' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Month Wise ({getMonthLabel(selectedMonth).split(' ')[0]})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('WEEK')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'WEEK' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('DAY')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'DAY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Day Wise
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Entries
                  </button>
                </div>

                {periodFilter === 'DAY' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-600">Date:</span>
                    <input
                      type="date"
                      className="form-input font-mono text-xs py-1 px-2.5"
                      value={filterDay}
                      onChange={e => setFilterDay(e.target.value)}
                    />
                  </div>
                )}

                {/* Sub Filters: Plan, Ads, Type */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-500">Plan:</span>
                    <select
                      className="form-input text-xs py-1 px-2 font-semibold w-auto"
                      value={filterPlan}
                      onChange={e => setFilterPlan(e.target.value)}
                    >
                      <option value="ALL">All (Planned &amp; Unplanned)</option>
                      <option value="PLANNED">🎯 Planned Only</option>
                      <option value="UNPLANNED">⚡ Unplanned Only</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-500">Ads:</span>
                    <select
                      className="form-input text-xs py-1 px-2 font-semibold w-auto"
                      value={filterAds}
                      onChange={e => setFilterAds(e.target.value)}
                    >
                      <option value="ALL">All (Ads &amp; Organic)</option>
                      <option value="ADS">🚀 Ads Pushed Only</option>
                      <option value="ORGANIC">🌿 Organic Only</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-500">Type:</span>
                    <select
                      className="form-input text-xs py-1 px-2 font-semibold w-auto"
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                    >
                      <option value="ALL">All Types</option>
                      <option value="Video">Videos</option>
                      <option value="Poster">Posters</option>
                      <option value="Reel">Reels</option>
                      <option value="Story">Stories</option>
                    </select>
                  </div>

                  {/* Search Box */}
                  <div className="relative w-44">
                    <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="form-input pl-7 py-1 text-xs"
                      value={searchEntryQuery}
                      onChange={e => setSearchEntryQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FULLY VISIBLE PROMINENT DELIVERABLES TABLE */}
            <div className="overflow-y-auto overflow-x-auto flex-1 min-h-[260px] max-h-[52vh] border border-slate-200 rounded-2xl bg-white shadow-2xs">
              {filteredProjectEntries.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <Film size={42} className="mx-auto text-slate-300 mb-2.5" />
                  <h4 className="font-extrabold text-slate-800 text-sm">No Deliverable Entries Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No deliverables recorded for this period. Click &ldquo;Add Deliverable Entry&rdquo; to log your videos, posters, and ad push details.
                  </p>
                  {canUserUpdateClient(activeProjectReport) && (
                    <button
                      type="button"
                      onClick={handleOpenAddEntry}
                      className="mt-3.5 btn-warning-custom text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer px-4 py-2"
                    >
                      <Plus size={14} /> Add Deliverable Entry
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b">
                    <tr>
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5">Title / Deliverable Content</th>
                      <th className="py-3 px-3.5">Content Type</th>
                      <th className="py-3 px-3.5 text-center">Plan Classification</th>
                      <th className="py-3 px-3.5 text-center">Ads Push Status</th>
                      <th className="py-3 px-3.5">Platform &amp; Staff</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjectEntries.map(it => (
                      <tr key={it.id} className="hover:bg-amber-50/20 transition-colors">
                        {/* Date */}
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {new Date(it.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Title & Link */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{it.title}</span>
                            {it.asset_url && (
                              <a
                                href={it.asset_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-600 hover:text-amber-700 inline-flex items-center p-0.5"
                                title="Open Live Content / Asset"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          {it.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">{it.notes}</div>}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold ${
                            it.content_type === 'Video' ? 'bg-amber-100 text-amber-900' :
                            it.content_type === 'Poster' ? 'bg-purple-100 text-purple-900' :
                            it.content_type === 'Reel' ? 'bg-pink-100 text-pink-900' : 'bg-sky-100 text-sky-900'
                          }`}>
                            {it.content_type}
                          </span>
                        </td>

                        {/* Plan: Planned vs Unplanned */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {it.is_planned ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-black inline-flex items-center gap-1">
                              🎯 Planned
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-900 border border-orange-300 text-[11px] font-black inline-flex items-center gap-1 shadow-2xs">
                              ⚡ Unplanned
                            </span>
                          )}
                        </td>

                        {/* Ads Push Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {it.ads_pushed ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-300 text-[11px] font-black flex items-center gap-1">
                                <Rocket size={12} className="text-indigo-600" />
                                Ads Pushed: ₹{Number(it.ad_spend || 0).toLocaleString('en-IN')}
                              </span>
                              {it.ad_campaign_name && (
                                <span className="text-[10px] text-indigo-700 font-semibold mt-0.5 truncate max-w-[180px]">
                                  {it.ad_campaign_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                              🌿 Organic
                            </span>
                          )}
                        </td>

                        {/* Platform & Staff */}
                        <td className="py-3 px-3.5 text-xs whitespace-nowrap">
                          <div className="font-bold text-slate-800">{it.platform || 'Instagram'}</div>
                          <div className="text-[10.5px] text-slate-400">by {it.logged_by || 'Staff'}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold ${
                            it.status === 'Published' ? 'bg-emerald-100 text-emerald-800' :
                            it.status === 'Under Review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {it.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          {canUserUpdateClient(activeProjectReport) && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEntry(it)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer rounded-lg transition-colors"
                                title="Edit Entry"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(it.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-lg transition-colors"
                                title="Delete Entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT DELIVERABLE ENTRY */}
      {/* ───────────────────────────────────────────────────────────── */}
      {entryModalOpen && activeProjectReport && (
        <div className="fixed inset-0 z-[1070] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="modal-content-custom max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {entryForm.id ? 'Edit Deliverable Entry' : 'Add New Deliverable Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeProjectReport.client_name} • Record content piece, plan classification &amp; ads push
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label font-bold text-slate-700">Release Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input font-mono"
                    value={entryForm.date}
                    onChange={e => setEntryForm({ ...entryForm, date: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label font-bold text-slate-700">Deliverable Title / Description *</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Diwali Special Promo Reel, Product Feature Graphic"
                    value={entryForm.title}
                    onChange={e => setEntryForm({ ...entryForm, title: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label font-bold text-slate-700">Content Type *</label>
                <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl text-center">
                  {[
                    { type: 'Video', icon: Video, label: 'Video' },
                    { type: 'Poster', icon: Image, label: 'Poster' },
                    { type: 'Reel', icon: Film, label: 'Reel' },
                    { type: 'Story', icon: Clock, label: 'Story' }
                  ].map(t => {
                    const Icon = t.icon;
                    const isSel = entryForm.content_type === t.type;
                    return (
                      <button
                        type="button"
                        key={t.type}
                        onClick={() => setEntryForm({ ...entryForm, content_type: t.type })}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          isSel ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={14} className={isSel ? 'text-amber-500' : 'text-slate-400'} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PLANNED vs UNPLANNED CLASSIFICATION */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
                <label className="form-label font-bold text-slate-800">
                  Planning Classification *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryForm({ ...entryForm, is_planned: true })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                      entryForm.is_planned ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Target size={15} className="text-emerald-600" />
                    🎯 Planned (Monthly Quota)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryForm({ ...entryForm, is_planned: false })}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                      !entryForm.is_planned ? 'bg-orange-50 text-orange-900 border-orange-300 shadow-2xs' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Zap size={15} className="text-orange-600" />
                    ⚡ Unplanned (Extra / Urgent)
                  </button>
                </div>
              </div>

              {/* ADS PUSHED ENTRY */}
              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="form-label font-bold text-indigo-900 flex items-center gap-1.5">
                    <Rocket size={14} className="text-indigo-600" />
                    Did you push Paid Ads for this content? *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEntryForm({ ...entryForm, ads_pushed: false, ad_spend: '', ad_campaign_name: '' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        !entryForm.ads_pushed ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      🌿 Organic (No Ads)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryForm({ ...entryForm, ads_pushed: true })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        entryForm.ads_pushed ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      🚀 Yes, Ads Pushed
                    </button>
                  </div>
                </div>

                {entryForm.ads_pushed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-indigo-200/60">
                    <div>
                      <label className="form-label font-bold text-indigo-800">Ad Spend / Budget (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="form-input font-mono font-bold border-indigo-300"
                        placeholder="e.g. 1500"
                        value={entryForm.ad_spend}
                        onChange={e => setEntryForm({ ...entryForm, ad_spend: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-indigo-800">Campaign Name / Meta Ad ID</label>
                      <input
                        className="form-input border-indigo-300"
                        placeholder="e.g. Festive Awareness Push, act_98240..."
                        value={entryForm.ad_campaign_name}
                        onChange={e => setEntryForm({ ...entryForm, ad_campaign_name: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Platform, Asset URL & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Platform</label>
                  <select
                    className="form-input font-semibold cursor-pointer"
                    value={entryForm.platform}
                    onChange={e => setEntryForm({ ...entryForm, platform: e.target.value })}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Multi-Platform">Multi-Platform</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input font-bold cursor-pointer"
                    value={entryForm.status}
                    onChange={e => setEntryForm({ ...entryForm, status: e.target.value })}
                  >
                    <option value="Published">Published</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Logged By</label>
                  <input
                    className="form-input"
                    value={entryForm.logged_by}
                    onChange={e => setEntryForm({ ...entryForm, logged_by: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Post URL or Asset Link (Drive / Video)</label>
                <input
                  type="url"
                  className="form-input font-mono"
                  placeholder="https://instagram.com/p/... or Drive link"
                  value={entryForm.asset_url}
                  onChange={e => setEntryForm({ ...entryForm, asset_url: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Client Notes &amp; Highlights</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Client approved reel in 1 round, festive discount coupon generated..."
                  value={entryForm.notes}
                  onChange={e => setEntryForm({ ...entryForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  className="btn-light-custom cursor-pointer"
                  onClick={() => setEntryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-warning-custom cursor-pointer font-bold px-5"
                >
                  {entryForm.id ? 'Update Entry' : 'Save Deliverable Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: NEW / EDIT SOCIAL CLIENT ONBOARDING */}
      {/* ───────────────────────────────────────────────────────────── */}
      {clientModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {form.id ? 'Edit Social Media Client' : 'New Social Media Client'}
                </h3>
                <p className="text-xs text-slate-500">Configure retainer agreement, assigned staff, and marketing parameters</p>
              </div>
              <button onClick={() => setClientModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="form-label font-bold text-slate-800 flex items-center gap-1.5">
                    Select Client *
                  </label>
                  {autoFilledNotice && (
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                      <Sparkles size={12} /> Auto-filled from CRM Client Record!
                    </span>
                  )}
                </div>
                <select
                  required
                  className="form-input font-semibold text-xs cursor-pointer"
                  value={form.client}
                  onChange={e => handleClientSelect(e.target.value)}
                >
                  <option value="">-- Select Client from CRM --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Individual Client'})
                    </option>
                  ))}
                </select>

                <div>
                  <label className="form-label font-bold text-slate-800 flex items-center gap-1.5">
                    <User size={13} className="text-amber-600" />
                    Assign Employee / Account Lead *
                  </label>
                  <select
                    className="form-input font-semibold text-xs cursor-pointer"
                    value={form.assigned_employee}
                    onChange={e => setForm({ ...form, assigned_employee: e.target.value })}
                  >
                    <option value="">-- Select Responsible Staff Member --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name ? `${u.first_name} ${u.last_name || ''}` : (u.name || u.username)} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Base & Page Setup */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[11px]">
                  1. Company Domain &amp; Page Setup
                </h4>

                <div>
                  <label className="form-label">Company Domain / Industry Base</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Real Estate, E-Commerce, Restaurant, Healthcare, Tech..."
                    value={form.company_base}
                    onChange={e => setForm({ ...form, company_base: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {COMMON_INDUSTRIES.slice(0, 6).map(ind => (
                      <button
                        type="button"
                        key={ind}
                        onClick={() => setForm({ ...form, company_base: ind })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                          form.company_base === ind ? 'bg-amber-500 text-white' : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="form-label">Social Media Page Status</label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, page_status: 'Existing Page' })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                          form.page_status === 'Existing Page' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Already Have Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, page_status: 'Need New Page Start', current_followers: '0 (New Page)' })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                          form.page_status === 'Need New Page Start' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Need New Page
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">
                      {form.page_status === 'Existing Page' ? 'Current Followers Count' : 'Follower Starting Base'}
                    </label>
                    <input
                      className="form-input font-mono"
                      placeholder={form.page_status === 'Existing Page' ? 'e.g. 15.4K followers' : '0 (New Account Launch)'}
                      disabled={form.page_status === 'Need New Page Start'}
                      value={form.current_followers}
                      onChange={e => setForm({ ...form, current_followers: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Handles & Meta Ads */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[11px]">
                  2. Social Accounts &amp; Meta Ads Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Instagram Handle</label>
                    <input
                      className="form-input font-mono"
                      placeholder="@official_handle"
                      value={form.instagram_handle}
                      onChange={e => setForm({ ...form, instagram_handle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Facebook Page</label>
                    <input
                      className="form-input font-mono"
                      placeholder="facebook.com/official"
                      value={form.facebook_page}
                      onChange={e => setForm({ ...form, facebook_page: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Have they already run Meta Ads?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, has_run_ads: false, meta_ads_manager_id: '' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          !form.has_run_ads ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, has_run_ads: true })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          form.has_run_ads ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        Yes, Ran Ads
                      </button>
                    </div>
                  </div>

                  {form.has_run_ads && (
                    <div>
                      <label className="form-label font-bold text-indigo-700">Meta Ads Manager ID / Ad Account ID *</label>
                      <input
                        className="form-input font-mono border-indigo-300 focus:border-indigo-500"
                        placeholder="e.g. act_10849201948 or 10849201948"
                        value={form.meta_ads_manager_id}
                        onChange={e => setForm({ ...form, meta_ads_manager_id: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Deliverables Plan */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[11px]">
                  3. Deliverables Agreement &amp; Pricing Model
                </h4>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricing_model: 'Monthly Retainer' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      form.pricing_model === 'Monthly Retainer' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    💳 Monthly Retainer Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricing_model: 'Per Deliverable' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      form.pricing_model === 'Per Deliverable' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    🎬 Per Deliverable Basis (Per Video/Post)
                  </button>
                </div>

                {form.pricing_model === 'Monthly Retainer' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="form-label font-bold text-slate-700">Monthly Retainer Fee (₹) *</label>
                      <input
                        type="number"
                        required
                        className="form-input font-mono font-bold"
                        placeholder="e.g. 50000"
                        value={form.monthly_payment}
                        onChange={e => setForm({ ...form, monthly_payment: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-amber-700">Monthly Planned Videos *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input font-mono font-bold"
                        value={form.videos_planned}
                        onChange={e => setForm({ ...form, videos_planned: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-purple-700">Monthly Planned Posters *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input font-mono font-bold"
                        value={form.posters_planned}
                        onChange={e => setForm({ ...form, posters_planned: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label font-bold text-amber-700">Price Per Video (₹)</label>
                        <input
                          type="number"
                          className="form-input font-mono"
                          placeholder="e.g. 2500"
                          value={form.price_per_video}
                          onChange={e => setForm({ ...form, price_per_video: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label font-bold text-purple-700">Price Per Post / Graphic (₹)</label>
                        <input
                          type="number"
                          className="form-input font-mono"
                          placeholder="e.g. 800"
                          value={form.price_per_post}
                          onChange={e => setForm({ ...form, price_per_post: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Target Videos Planned</label>
                        <input
                          type="number"
                          className="form-input font-mono"
                          value={form.videos_planned}
                          onChange={e => setForm({ ...form, videos_planned: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Target Posters Planned</label>
                        <input
                          type="number"
                          className="form-input font-mono"
                          value={form.posters_planned}
                          onChange={e => setForm({ ...form, posters_planned: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Estimated Monthly Value:</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        ₹{(
                          (Number(form.price_per_video) || 0) * (Number(form.videos_planned) || 0) +
                          (Number(form.price_per_post) || 0) * (Number(form.posters_planned) || 0)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  className="btn-light-custom cursor-pointer"
                  onClick={() => setClientModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-warning-custom cursor-pointer font-bold px-5"
                >
                  {form.id ? 'Update Retainer' : 'Save Social Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: FAST LOG MONTHLY TRACKER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {trackerModal && activeClientForTracking && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom max-w-lg">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Update Monthly Deliverables
                </h3>
                <p className="text-xs text-slate-500">
                  {activeClientForTracking.client_name} • <span className="font-bold text-amber-600">{getMonthLabel(trackerForm.month_key)}</span>
                </p>
              </div>
              <button onClick={() => setTrackerModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyDeliverables} className="space-y-4 text-xs">
              <div>
                <label className="form-label font-bold text-slate-700">Tracking Month</label>
                <select
                  className="form-input font-semibold cursor-pointer"
                  value={trackerForm.month_key}
                  onChange={e => {
                    const newM = e.target.value;
                    const ex = activeClientForTracking.monthly_deliverables?.[newM] || {};
                    setTrackerForm({
                      month_key: newM,
                      videos_planned: ex.videos_planned ?? activeClientForTracking.videos_planned ?? 0,
                      videos_completed: ex.videos_completed ?? 0,
                      posters_planned: ex.posters_planned ?? activeClientForTracking.posters_planned ?? 0,
                      posters_completed: ex.posters_completed ?? 0,
                      reels_count: ex.reels_count ?? activeClientForTracking.reels_count ?? 0,
                      stories_count: ex.stories_count ?? activeClientForTracking.stories_count ?? 0,
                      meta_ads_spent: ex.meta_ads_spent ?? 0,
                      content_status: ex.content_status ?? activeClientForTracking.content_status ?? 'On Track',
                      notes: ex.notes || ''
                    });
                  }}
                >
                  {monthOptions.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label font-bold text-slate-700">Videos Planned</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={trackerForm.videos_planned}
                      onChange={e => setTrackerForm({ ...trackerForm, videos_planned: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label font-bold text-amber-700">Videos Completed *</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTrackerForm({ ...trackerForm, videos_completed: Math.max(0, trackerForm.videos_completed - 1) })}
                        className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        required
                        className="form-input font-mono font-black text-center"
                        value={trackerForm.videos_completed}
                        onChange={e => setTrackerForm({ ...trackerForm, videos_completed: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        onClick={() => setTrackerForm({ ...trackerForm, videos_completed: trackerForm.videos_completed + 1 })}
                        className="w-8 h-8 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label font-bold text-slate-700">Posters Planned</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input font-mono"
                      value={trackerForm.posters_planned}
                      onChange={e => setTrackerForm({ ...trackerForm, posters_planned: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label font-bold text-purple-700">Posters Completed *</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTrackerForm({ ...trackerForm, posters_completed: Math.max(0, trackerForm.posters_completed - 1) })}
                        className="w-8 h-8 rounded bg-slate-200 hover:bg-slate-300 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        required
                        className="form-input font-mono font-black text-center"
                        value={trackerForm.posters_completed}
                        onChange={e => setTrackerForm({ ...trackerForm, posters_completed: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        onClick={() => setTrackerForm({ ...trackerForm, posters_completed: trackerForm.posters_completed + 1 })}
                        className="w-8 h-8 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Reels Count</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input font-mono"
                    value={trackerForm.reels_count}
                    onChange={e => setTrackerForm({ ...trackerForm, reels_count: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">Stories Count</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input font-mono"
                    value={trackerForm.stories_count}
                    onChange={e => setTrackerForm({ ...trackerForm, stories_count: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label">Meta Ads Spend (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input font-mono"
                    placeholder="0"
                    value={trackerForm.meta_ads_spent}
                    onChange={e => setTrackerForm({ ...trackerForm, meta_ads_spent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label font-bold text-slate-700">Monthly Status</label>
                <select
                  className="form-input font-bold cursor-pointer"
                  value={trackerForm.content_status}
                  onChange={e => setTrackerForm({ ...trackerForm, content_status: e.target.value })}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Track">On Track</option>
                  <option value="Behind Schedule">Behind Schedule</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="form-label">Work Log &amp; Client Remarks</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="e.g. 4 reels shot this week, Diwali festive creative poster scheduled..."
                  value={trackerForm.notes}
                  onChange={e => setTrackerForm({ ...trackerForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  className="btn-light-custom cursor-pointer"
                  onClick={() => setTrackerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-warning-custom cursor-pointer font-bold px-5"
                >
                  Save Monthly Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: STAFF PDF / PRINT VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-amber-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-4 mb-4 no-print flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FileText size={18} className="text-amber-600" />
                  Monthly Staff Performance PDF Export
                </h3>
                <p className="text-xs text-slate-500">
                  Month: <span className="font-bold text-slate-800">{getMonthLabel(selectedMonth)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-warning-custom cursor-pointer flex items-center gap-1.5 font-bold"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-6 print:p-0">
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">JRAM GROUPS BUSINESS OS</h1>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Digital Marketing &amp; Social Retainers Performance Audit</p>
                  <p className="text-[11px] text-slate-500 mt-1">Ref Code: JRAM-DM-{selectedMonth}-{pdfStaffData?.name ? pdfStaffData.name.substring(0, 4).toUpperCase() : 'ALL'}</p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">Audit Month: {getMonthLabel(selectedMonth)}</div>
                  <div className="text-slate-500 text-[11px]">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div className="text-slate-600 font-semibold mt-1">Staff: {pdfStaffData?.name || 'All Assigned Teams'}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Accounts</span>
                  <span className="font-black text-slate-900 text-lg">
                    {pdfStaffData ? pdfStaffData.clients.length : socialClients.length}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Videos Delivered</span>
                  <span className="font-black text-amber-900 text-lg">
                    {pdfStaffData ? `${pdfStaffData.total_videos_completed} / ${pdfStaffData.total_videos_planned}` :
                      `${socialClients.reduce((acc, c) => acc + (getClientMonthData(c, selectedMonth).videos_completed || 0), 0)} / ${socialClients.reduce((acc, c) => acc + (getClientMonthData(c, selectedMonth).videos_planned || 0), 0)}`}
                  </span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-800 block">Posters Delivered</span>
                  <span className="font-black text-purple-900 text-lg">
                    {pdfStaffData ? `${pdfStaffData.total_posters_completed} / ${pdfStaffData.total_posters_planned}` :
                      `${socialClients.reduce((acc, c) => acc + (getClientMonthData(c, selectedMonth).posters_completed || 0), 0)} / ${socialClients.reduce((acc, c) => acc + (getClientMonthData(c, selectedMonth).posters_planned || 0), 0)}`}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Retainer Value</span>
                  <span className="font-black text-emerald-900 text-lg font-mono">
                    ₹{(pdfStaffData ? pdfStaffData.total_retainer : socialClients.reduce((acc, c) => acc + Number(c.monthly_payment || 0), 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b text-[10px] uppercase">
                      <th className="py-2 px-2.5 border-r">Client</th>
                      <th className="py-2 px-2.5 border-r">Staff</th>
                      <th className="py-2 px-2.5 border-r">Domain &amp; Handles</th>
                      <th className="py-2 px-2.5 border-r text-center">Videos</th>
                      <th className="py-2 px-2.5 border-r text-center">Posters</th>
                      <th className="py-2 px-2.5 border-r text-right">Retainer</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(pdfStaffData ? pdfStaffData.clients : socialClients.map(sc => ({ sc, mData: getClientMonthData(sc, selectedMonth) }))).map(({ sc, mData }) => (
                      <tr key={sc.id} className="text-[11px]">
                        <td className="py-2 px-2.5 border-r font-bold text-slate-900">
                          {sc.client_name}
                          <span className="block text-[10px] font-normal text-slate-500">{sc.client_detail?.company || ''}</span>
                        </td>
                        <td className="py-2 px-2.5 border-r font-medium text-slate-700">
                          {sc.assigned_employee_name || 'Unassigned'}
                        </td>
                        <td className="py-2 px-2.5 border-r text-[10px] font-mono text-slate-600">
                          <div>{sc.company_base || 'Digital'}</div>
                          <div>IG: {sc.instagram_handle || '—'}</div>
                        </td>
                        <td className="py-2 px-2.5 border-r text-center font-mono font-bold">
                          {mData.videos_completed} / {mData.videos_planned}
                        </td>
                        <td className="py-2 px-2.5 border-r text-center font-mono font-bold">
                          {mData.posters_completed} / {mData.posters_planned}
                        </td>
                        <td className="py-2 px-2.5 border-r text-right font-mono font-bold text-emerald-800">
                          ₹{Number(sc.monthly_payment || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold text-[10px]">
                          {mData.content_status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 border-t flex justify-between text-xs text-slate-600">
                <div>
                  <div className="h-10 border-b border-slate-300 w-44 mb-1" />
                  <p className="font-bold">Prepared By / Staff Signatory</p>
                  <p className="text-[10px] text-slate-400">Digital Marketing Team</p>
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-slate-300 w-44 mb-1 ml-auto" />
                  <p className="font-bold">Approved By</p>
                  <p className="text-[10px] text-slate-400">Founder / Managing Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
