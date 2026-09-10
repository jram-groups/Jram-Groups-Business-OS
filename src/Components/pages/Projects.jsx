import { useState, useEffect } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, ShieldAlert, LayoutGrid, List, 
  CheckCircle2, Clock, Calendar, Users, DollarSign, ChevronDown, ChevronUp,
  Building2, Sparkles, Layers, Briefcase, ArrowRight, X, Workflow, CheckSquare,
  Shield, UserCheck, Zap, TrendingUp, Target, BarChart3, FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';
import {
  WORKFLOW_METHODOLOGIES,
  getRoleBadgeClass,
  getRoleDisplayName,
} from '../../services/workflowConstants';

const EMPTY_PROJECT = {
  name: '',
  client: '',
  description: '',
  service_type: 'FullStack Application',
  methodology: 'SDLC',
  status: 'In Progress',
  priority: 'MEDIUM',
  duration_days: 30,
  estimated_hours: '',
  progress_pct: 0,
  budget: ''
};

export default function Projects() {
  const { user } = useOutletContext() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'FOUNDER';

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [loading, setLoading] = useState(true);

  // Wizard state from Step 1 (Client Form)
  const [draftClient, setDraftClient] = useState(null);
  const [isWizardMode, setIsWizardMode] = useState(false);
  const [savingPipeline, setSavingPipeline] = useState(false);

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Form modal
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_PROJECT);

  useEffect(() => {
    if (location.state?.draftClient && location.state?.openWizard) {
      const dc = location.state.draftClient;
      setDraftClient(dc);
      setIsWizardMode(true);
      setForm({
        ...EMPTY_PROJECT,
        name: `${dc.company} - Main Project`,
        service_type: dc.services_taken?.[0] || 'FullStack Application',
      });
      setModal(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let q = '';
      if (search) q += `search=${encodeURIComponent(search)}&`;
      if (filterPriority) q += `priority=${encodeURIComponent(filterPriority)}&`;
      if (filterStatus) q += `status=${encodeURIComponent(filterStatus)}`;

      const [pRes, cRes] = await Promise.all([
        api.projects.list(q),
        api.clients.list()
      ]);

      setProjects(pRes.data || pRes.results || (Array.isArray(pRes) ? pRes : []));
      setClients(cRes.data || cRes.results || (Array.isArray(cRes) ? cRes : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterPriority, filterStatus]);

  const cleanNumber = (val, fallback = 0) => {
    if (val === '' || val === null || val === undefined) return fallback;
    const parsed = Number(val);
    return isNaN(parsed) ? fallback : parsed;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        budget: cleanNumber(form.budget, 0),
        duration_days: cleanNumber(form.duration_days, 30),
        estimated_hours: cleanNumber(form.estimated_hours, 100),
        progress_pct: cleanNumber(form.progress_pct, 0),
      };
      if (form.id) {
        await api.projects.update(form.id, payload);
      } else {
        await api.projects.create(payload);
      }
      setModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error saving project');
    }
  };

  // 1. Wizard Button 1: CANCEL (Wipes both client and project, 0 DB records)
  const handleWizardCancel = () => {
    setDraftClient(null);
    setIsWizardMode(false);
    setForm(EMPTY_PROJECT);
    setModal(false);
    window.history.replaceState({}, document.title);
  };

  // 2. Wizard Button 2: SAVE (Creates Client in DB, then Project in DB linked)
  const handleWizardSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.name?.trim()) {
      alert('Please enter a Project Name.');
      return;
    }
    setSavingPipeline(true);
    try {
      // Step A: Save Client in DB
      const clientRes = await api.clients.create(draftClient);
      const createdClient = clientRes.data || clientRes;
      const clientId = createdClient.id;

      // Step B: Save Project in DB linked to new Client
      const projectPayload = {
        ...form,
        client: clientId,
        budget: cleanNumber(form.budget, 0),
        duration_days: cleanNumber(form.duration_days, 30),
        estimated_hours: cleanNumber(form.estimated_hours, 100),
        progress_pct: cleanNumber(form.progress_pct, 0),
      };
      await api.projects.create(projectPayload);

      alert(`Success! Client "${createdClient.name} (${createdClient.company})" and Project "${form.name}" saved to database successfully!`);
      
      setDraftClient(null);
      setIsWizardMode(false);
      setForm(EMPTY_PROJECT);
      setModal(false);
      window.history.replaceState({}, document.title);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving client and project');
    } finally {
      setSavingPipeline(false);
    }
  };

  // 3. Wizard Button 3: SAVE AND GO QUOTATION (Saves both to DB, then navigates to /quotations)
  const handleWizardSaveAndGoQuotation = async (e) => {
    if (e) e.preventDefault();
    if (!form.name?.trim()) {
      alert('Please enter a Project Name.');
      return;
    }
    setSavingPipeline(true);
    try {
      // Step A: Save Client in DB
      const clientRes = await api.clients.create(draftClient);
      const createdClient = clientRes.data || clientRes;
      const clientId = createdClient.id;

      // Step B: Save Project in DB
      const projectPayload = {
        ...form,
        client: clientId,
        budget: cleanNumber(form.budget, 0),
        duration_days: cleanNumber(form.duration_days, 30),
        estimated_hours: cleanNumber(form.estimated_hours, 100),
        progress_pct: cleanNumber(form.progress_pct, 0),
      };
      const projectRes = await api.projects.create(projectPayload);
      const createdProject = projectRes.data || projectRes;

      // Reset local modal state
      setDraftClient(null);
      setIsWizardMode(false);
      setForm(EMPTY_PROJECT);
      setModal(false);
      window.history.replaceState({}, document.title);

      // Step C: Locate to Quotation Generator page with client & project pre-filled!
      navigate('/quotations/new', {
        state: {
          selectedClient: createdClient,
          createdProject: createdProject,
        }
      });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving client and project');
      setSavingPipeline(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await api.projects.delete(id);
        fetchData();
      } catch (err) {
        alert(err.message || 'Error deleting project');
      }
    }
  };

  const kanbanStatuses = ['In Progress', 'Planning', 'Assigned', 'Completed'];

  const canCreate = canPerform(role, 'CREATE_PROJECT');
  const canEdit = canPerform(role, 'EDIT_PROJECT');
  const canDelete = canPerform(role, 'DELETE_PROJECT');

  // Aggregated stats
  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + Number(p.progress_pct || 0), 0) / projects.length) : 0;

  // Methodology badge helper
  const getMethBadgeClass = (meth) => {
    if (meth === 'Agile') return 'gradient-badge agile';
    if (meth === 'Waterfall') return 'gradient-badge waterfall';
    return 'gradient-badge sdlc';
  };

  // Priority styling
  const getPriorityBadge = (priority) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    if (p === 'URGENT') return { bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#991b1b', border: '#fca5a5' };
    if (p === 'HIGH') return { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#92400e', border: '#fde68a' };
    if (p === 'MEDIUM') return { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#1e40af', border: '#bfdbfe' };
    return { bg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', color: '#475569', border: '#e2e8f0' };
  };

  // Status styling
  const getStatusStyle = (status) => {
    if (status === 'In Progress') return { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#92400e', border: '#fde68a', dot: '#f59e0b' };
    if (status === 'Planning') return { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' };
    if (status === 'Assigned') return { bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#6d28d9', border: '#c4b5fd', dot: '#8b5cf6' };
    return { bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#047857', border: '#a7f3d0', dot: '#10b981' };
  };

  // Priority left border
  const getPriorityBorder = (priority) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    if (p === 'URGENT') return '#ef4444';
    if (p === 'HIGH') return '#f59e0b';
    if (p === 'MEDIUM') return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="page-container" style={{ gap: '20px' }}>
      {/* ────────── PREMIUM HERO HEADER ────────── */}
      <div className="premium-hero-gradient rounded-2xl p-5 sm:p-7 text-white relative z-10" style={{ borderRadius: '20px' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a' }}>
                Project Command Center
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#ffffff' }}>
              Projects & Priority Matrix
            </h1>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', maxWidth: '550px', lineHeight: 1.5 }}>
              Track project lifecycles, team allocation, budget execution, and delivery milestones.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            {canCreate && (
              <button
                onClick={() => { setForm(EMPTY_PROJECT); setModal(true); }}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#0f172a',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={16} />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
          {[
            { label: 'Total Projects', value: projects.length, icon: <FolderOpen size={16} />, accent: '#fbbf24' },
            { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, icon: <TrendingUp size={16} />, accent: '#f59e0b' },
            { label: 'Total Budget', value: `₹${totalBudget.toLocaleString('en-IN')}`, icon: <DollarSign size={16} />, accent: '#10b981' },
            { label: 'Avg Progress', value: `${avgProgress}%`, icon: <BarChart3 size={16} />, accent: '#6366f1' },
          ].map((stat, idx) => (
            <div key={idx} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: stat.accent }}>{stat.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ────────── CONTROL BAR: SEARCH, FILTERS & VIEW TOGGLE ────────── */}
      <div className="glass-card" style={{ padding: '14px 18px' }}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              style={{ paddingLeft: '2.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '9px 14px 9px 38px', fontSize: '12px', fontWeight: 600, width: '100%', outline: 'none', transition: 'all 0.18s ease' }}
              placeholder="Search projects or clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Priority Filter */}
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Planning">Planning</option>
              <option value="Assigned">Assigned</option>
              <option value="Completed">Completed</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setViewMode('kanban')}
                className="cursor-pointer transition-all flex items-center gap-1.5"
                style={{
                  padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                  color: viewMode === 'kanban' ? '#0f172a' : '#94a3b8',
                  boxShadow: viewMode === 'kanban' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
                title="Kanban Board View"
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="cursor-pointer transition-all flex items-center gap-1.5"
                style={{
                  padding: '6px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                  background: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#94a3b8',
                  boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
                title="Table View"
              >
                <List size={15} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ────────── KANBAN VIEW ────────── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-grid">
          {kanbanStatuses.map((st) => {
            const list = projects.filter(p => p.status === st);
            const statusStyle = getStatusStyle(st);

            return (
              <div key={st} className="kanban-column-premium flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusStyle.dot }} />
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st}</h3>
                  </div>
                  <span className="gradient-badge" style={{
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`
                  }}>
                    {list.length} {list.length === 1 ? 'Project' : 'Projects'}
                  </span>
                </div>

                {list.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-10">
                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: 500 }}>No projects in {st}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[500px] pr-1.5 sidebar-scroll">
                  {list.map((p) => {
                    const isExpanded = !!expandedCards[p.id];
                    const priorityBorder = getPriorityBorder(p.priority);
                    const priorityBadge = getPriorityBadge(p.priority);

                    return (
                      <div
                        key={p.id}
                        className="task-card-premium flex flex-col gap-2.5"
                        style={{ borderLeft: `4px solid ${priorityBorder}`, '--card-accent': `linear-gradient(90deg, ${priorityBorder}, ${priorityBorder}80)` }}
                      >
                        {/* Top Row: Priority & Methodology Badges + Action Icons */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="gradient-badge" style={{
                              background: priorityBadge.bg,
                              color: priorityBadge.color,
                              border: `1px solid ${priorityBadge.border}`
                            }}>
                              {p.priority === 'URGENT' && <ShieldAlert size={10} />}
                              {p.priority} Priority
                            </span>
                            <span className={getMethBadgeClass(p.methodology || 'SDLC')}>
                              {p.methodology || 'SDLC'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {canEdit && (
                              <button onClick={() => { setForm(p); setModal(true); }} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-all" title="Edit project">
                                <Edit2 size={13} />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-all" title="Delete project">
                                <Trash2 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleCard(p.id)}
                              className="text-slate-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition-all"
                              title={isExpanded ? "Collapse details" : "Expand details"}
                            >
                              {isExpanded ? <ChevronUp size={14} style={{ color: '#d97706' }} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Project Title & Client with Icon */}
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>{p.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1" style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                            <Building2 size={12} style={{ color: '#d97706' }} className="flex-shrink-0" />
                            <span className="truncate">{p.client_name}</span>
                          </div>
                        </div>

                        {/* Workflow Stage & Task Stats Badge */}
                        <div className="stage-chip" style={{ justifyContent: 'space-between' }}>
                          <div className="flex items-center gap-1.5 truncate">
                            <Workflow size={12} style={{ color: '#d97706' }} className="flex-shrink-0" />
                            <span className="truncate">{p.workflow_stage || 'Requirements Analysis'}</span>
                          </div>
                          <span className="gradient-badge" style={{
                            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            fontSize: '9px',
                            padding: '2px 8px',
                          }}>
                            {p.tasks_count || (p.tasks?.length || 0)} Tasks ({p.completed_tasks_count || 0} Done)
                          </span>
                        </div>

                        {/* Team Hierarchy Allocation Display */}
                        {p.assigned_employees_detail && p.assigned_employees_detail.length > 0 && (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Team:</span>
                            <div className="avatar-stack">
                              {p.assigned_employees_detail.slice(0, 4).map(emp => (
                                <div
                                  key={emp.id}
                                  title={`${emp.full_name} (${getRoleDisplayName(emp.role)})`}
                                  className="avatar-item"
                                >
                                  {emp.profile_image ? (
                                    <img src={emp.profile_image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    emp.avatar_text || emp.first_name?.[0] || 'U'
                                  )}
                                </div>
                              ))}
                              {p.assigned_employees_detail.length > 4 && (
                                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, paddingLeft: '6px' }}>
                                  +{p.assigned_employees_detail.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Quick Action: Assign Workflow Task Button */}
                        <button
                          type="button"
                          onClick={() => navigate('/tasks', { state: { assignProjectId: p.id } })}
                          className="w-full cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          style={{
                            padding: '7px 12px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                            color: '#92400e', border: '1px solid #fde68a',
                            fontSize: '11px', fontWeight: 800,
                            marginTop: '4px',
                          }}
                        >
                          <Workflow size={12} style={{ color: '#d97706' }} />
                          <span>Assign Workflow Task</span>
                        </button>

                        {/* Collapsed View (Short Card Footer) */}
                        {!isExpanded ? (
                          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>Budget:</span>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>₹{Number(p.budget || 0).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: '#f1f5f9', fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
                                <span>{p.progress_pct}%</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleCard(p.id)}
                                className="cursor-pointer"
                                style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}
                              >
                                Details ↓
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Detailed Expanded View with Workflow Stage Breakdown */
                          <div className="pt-3 flex flex-col gap-3 animate-fade-in" style={{ borderTop: '1px solid #f1f5f9' }}>
                            {/* Milestone Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5" style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                <span>Milestone Progress</span>
                                <span style={{ color: '#0f172a', fontWeight: 800 }}>{p.progress_pct}%</span>
                              </div>
                              <div className="progress-bar-animated">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${p.progress_pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                                />
                              </div>
                            </div>

                            {/* Metrics Grid with Execution Hours */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Total Budget</span>
                                <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', marginTop: '4px', display: 'block' }}>₹{Number(p.budget || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Logged Execution</span>
                                <div className="flex items-center gap-1.5" style={{ marginTop: '4px', fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                                  <Clock size={13} style={{ color: '#d97706' }} />
                                  <span>{p.total_logged_hours || 0} / {p.estimated_hours || 100} hrs</span>
                                </div>
                              </div>
                            </div>

                            {/* Workflow Stages Breakdown */}
                            {p.stage_breakdown && Object.keys(p.stage_breakdown).length > 0 && (
                              <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                  Methodology Stages ({p.methodology || 'SDLC'}):
                                </span>
                                <div className="flex flex-col gap-1.5">
                                  {Object.entries(p.stage_breakdown).map(([stgName, stats]) => (
                                    <div key={stgName} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#ffffff', border: '1px solid #f1f5f9', fontSize: '11px' }}>
                                      <span style={{ fontWeight: 600, color: '#334155' }} className="truncate" title={stgName}>{stgName}</span>
                                      <div className="flex items-center gap-2">
                                        <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{stats.logged_hours}h</span>
                                        <span className="gradient-badge" style={{
                                          background: stats.completed === stats.total ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                                          color: stats.completed === stats.total ? '#047857' : '#92400e',
                                          border: `1px solid ${stats.completed === stats.total ? '#a7f3d0' : '#fde68a'}`,
                                          fontSize: '9px', padding: '1px 6px'
                                        }}>
                                          {stats.completed}/{stats.total}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Team Roster List */}
                            {p.assigned_employees_detail && p.assigned_employees_detail.length > 0 && (
                              <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                  Allocated Team Roster:
                                </span>
                                <div className="flex flex-col gap-1.5">
                                  {p.assigned_employees_detail.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#ffffff', border: '1px solid #f1f5f9', fontSize: '11px' }}>
                                      <div className="flex items-center gap-2">
                                        <div className="avatar-item" style={{ width: '22px', height: '22px', marginLeft: 0, fontSize: '8px' }}>
                                          {emp.avatar_text || emp.first_name?.[0] || 'U'}
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{emp.full_name}</span>
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeClass(emp.role)}`}>
                                        {getRoleDisplayName(emp.role)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Scope Description if available */}
                            {p.description && (
                              <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                                {p.description}
                              </div>
                            )}

                            <div className="text-center pt-1">
                              <button
                                type="button"
                                onClick={() => toggleCard(p.id)}
                                className="cursor-pointer"
                                style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}
                              >
                                Hide Details ↑
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────── TABLE VIEW ────────── */}
      {viewMode === 'table' && (
        <div className="glass-card overflow-hidden" style={{ padding: 0, borderRadius: '18px' }}>
          <div className="table-responsive">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="py-3.5 px-4 text-left">Project Name</th>
                  <th className="py-3.5 px-4 text-left">Client</th>
                  <th className="py-3.5 px-4 text-left">Methodology & Stage</th>
                  <th className="py-3.5 px-4 text-left">Priority</th>
                  <th className="py-3.5 px-4 text-left">Status</th>
                  <th className="py-3.5 px-4 text-left">Budget</th>
                  <th className="py-3.5 px-4 text-left">Progress</th>
                  <th className="py-3.5 px-4 text-left">Delivery Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                          style={{ background: '#fef3c7', color: '#f59e0b' }}>
                          <Briefcase size={24} />
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>No projects found</p>
                        <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>Try adjusting your search query or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => {
                    const priorityBadge = getPriorityBadge(p.priority);
                    const statusStyle = getStatusStyle(p.status);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', border: '1px solid #fde68a', fontWeight: 800 }}>
                              <Briefcase size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{p.name}</div>
                              {p.service_type && (
                                <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>{p.service_type}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>
                            <Building2 size={13} style={{ color: '#d97706' }} className="flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{p.client_name || 'Direct Client'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={getMethBadgeClass(p.methodology || 'SDLC')} style={{ width: 'fit-content' }}>
                              {p.methodology || 'SDLC'}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }} className="truncate max-w-[130px]">
                              {p.workflow_stage || 'Requirements'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="gradient-badge" style={{
                            background: priorityBadge.bg,
                            color: priorityBadge.color,
                            border: `1px solid ${priorityBadge.border}`
                          }}>
                            {p.priority === 'URGENT' && <ShieldAlert size={10} />}
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="gradient-badge" style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            padding: '4px 10px',
                            borderRadius: '99px',
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4" style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>
                          ₹{Number(p.budget || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5 min-w-[110px]">
                            <div className="progress-bar-animated flex-1" style={{ height: '5px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${p.progress_pct || 0}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', fontFamily: 'monospace' }}>{p.progress_pct || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4" style={{ fontSize: '12px', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} style={{ color: '#94a3b8' }} />
                            <span>{p.expected_completion || 'TBD'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => navigate('/tasks', { state: { assignProjectId: p.id } })}
                              className="p-1.5 rounded-lg cursor-pointer transition-all"
                              style={{ color: '#d97706' }}
                              title="Assign Workflow Task"
                            >
                              <Workflow size={14} />
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => { setForm(p); setModal(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
                                title="Edit Project"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all"
                                title="Delete Project"
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

      {/* ────────── MODAL FOR PROJECT CREATE / EDIT / PIPELINE ────────── */}
      {modal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom modal-animated max-w-xl max-h-[92vh] overflow-y-auto" style={{ borderRadius: '22px', padding: '28px' }}>
            <div className="flex items-center justify-between pb-4 mb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }} className="flex items-center gap-2">
                  {isWizardMode ? 'Step 2: Project Specifications' : form.id ? 'Edit Project' : 'Create New Project'}
                  {isWizardMode && (
                    <span className="gradient-badge" style={{
                      background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      fontSize: '9px'
                    }}>
                      Pipeline Step 2 of 3
                    </span>
                  )}
                </h2>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  {isWizardMode ? 'Specify deliverables & budget for the new client before confirming' : 'Set project goals, allocate timeline, and manage delivery status.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (isWizardMode) handleWizardCancel();
                  else setModal(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Onboarding Pipeline Banner */}
            {isWizardMode && draftClient && (
              <div className="p-4 rounded-2xl mb-4 flex items-start gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.1))', border: '1px solid #fde68a' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a', boxShadow: '0 2px 8px rgba(245,158,11,0.25)' }}>
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>Onboarding Target: {draftClient.name}</span>
                    <span className="gradient-badge" style={{
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      color: '#92400e', border: '1px solid #fde68a', fontSize: '9px'
                    }}>
                      {draftClient.company}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    Email: <span style={{ fontFamily: 'monospace' }}>{draftClient.email}</span> • Phone: <span style={{ fontFamily: 'monospace' }}>{draftClient.phone}</span>
                  </p>
                  <p style={{ fontSize: '10px', color: '#92400e', fontWeight: 600, marginTop: '3px' }}>
                    ⚠️ Draft held in memory. Both Client &amp; Project will be stored in DB once you click <strong>Save</strong> or <strong>Save &amp; Go to Quotation</strong>.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={isWizardMode ? handleWizardSave : handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Business OS Modernization"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="form-input text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isWizardMode && draftClient ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Client (From Step 1) *</label>
                    <div className="px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between truncate"
                      style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', color: '#0f172a' }}>
                      <span className="truncate">{draftClient.name} ({draftClient.company})</span>
                      <span className="gradient-badge" style={{ background: 'linear-gradient(135deg, #fde68a, #fbbf24)', color: '#0f172a', border: 'none', fontSize: '8px', padding: '1px 6px' }}>New</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Client *</label>
                    <select
                      required
                      value={form.client}
                      onChange={e => setForm({ ...form, client: e.target.value })}
                      className="form-input font-medium cursor-pointer"
                    >
                      <option value="">Select Client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Type</label>
                  <input
                    type="text"
                    placeholder="e.g. FullStack Web App"
                    value={form.service_type || ''}
                    onChange={e => setForm({ ...form, service_type: e.target.value })}
                    className="form-input text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Process / Workflow Methodology *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['SDLC', 'Waterfall', 'Agile'].map(m => {
                    const isSelected = (form.methodology || 'SDLC') === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm({ ...form, methodology: m })}
                        className="cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          border: isSelected ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                          background: isSelected ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#f8fafc',
                          color: isSelected ? '#0f172a' : '#64748b',
                          boxShadow: isSelected ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                        }}
                      >
                        {m === 'SDLC' && <Layers size={14} />}
                        {m === 'Waterfall' && <Workflow size={14} />}
                        {m === 'Agile' && <Zap size={14} />}
                        <span>{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="form-input font-medium cursor-pointer"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="form-input font-medium cursor-pointer"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Planning">Planning</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    className="form-input font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={form.duration_days || 30}
                    onChange={e => setForm({ ...form, duration_days: e.target.value })}
                    className="form-input font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={form.estimated_hours}
                    placeholder="100"
                    onChange={e => setForm({ ...form, estimated_hours: e.target.value })}
                    className="form-input font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Deliverables Scope</label>
                <textarea
                  rows={2}
                  placeholder="Project scope, objectives, technical requirements, deliverables..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              {/* ACTION BUTTONS: 3 Buttons for Wizard Mode or Standard Buttons */}
              {isWizardMode ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={handleWizardCancel}
                    disabled={savingPipeline}
                    className="px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all w-full sm:w-auto"
                    style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
                    title="Cancel & Discard both client and project. Nothing will be saved to the database."
                  >
                    Cancel &amp; Discard All
                  </button>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleWizardSave}
                      disabled={savingPipeline}
                      className="px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                      style={{ background: '#0f172a', color: '#ffffff' }}
                      title="Store Client and Project in database"
                    >
                      {savingPipeline ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleWizardSaveAndGoQuotation}
                      disabled={savingPipeline}
                      className="btn-warning-custom px-4 py-2 cursor-pointer font-extrabold flex items-center gap-1.5 disabled:opacity-50"
                      style={{ boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)' }}
                      title="Save Client and Project in database, then proceed to Quotation"
                    >
                      <span>{savingPipeline ? 'Processing...' : 'Save & Go to Quotation'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2.5 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="btn-secondary px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2 cursor-pointer"
                  >
                    {form.id ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
