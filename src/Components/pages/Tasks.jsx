import { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import {
  Plus, Search, CheckSquare, Clock, Edit2, Trash2, UserCheck, AlertCircle,
  Layers, Workflow, Zap, CheckCircle2, ChevronRight, User, Shield, Sparkles,
  ArrowRight, Filter, Calendar, BarChart3, HelpCircle, TrendingUp, Target, Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';
import {
  WORKFLOW_METHODOLOGIES,
  ROLE_ASSIGNMENT_RULES,
  filterAssignableUsers,
  getRoleBadgeClass,
  getRoleDisplayName,
} from '../../services/workflowConstants';

const EMPTY_TASK = {
  title: '',
  project: '',
  description: '',
  methodology: 'SDLC',
  stage: 'Requirements Analysis',
  activity: 'Requirement Gathering',
  assigned_to: '',
  assignee_role: '',
  priority: 'MEDIUM',
  status: 'In Progress',
  due_date: '',
  estimated_hours: 8,
  logged_hours: 0,
};

export default function Tasks() {
  const { user } = useOutletContext() || {};
  const location = useLocation();
  const role = user?.role || 'FOUNDER';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterMethodology, setFilterMethodology] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  // Modals
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_TASK);
  const [founderOverride, setFounderOverride] = useState(false);

  // Quick Log Hours Modal
  const [logHoursModal, setLogHoursModal] = useState(false);
  const [activeLogTask, setActiveLogTask] = useState(null);
  const [hoursToAdd, setHoursToAdd] = useState(1);
  const [logStatusUpdate, setLogStatusUpdate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let q = '';
      if (filterStatus) q += `status=${encodeURIComponent(filterStatus)}&`;
      if (filterProject) q += `project=${encodeURIComponent(filterProject)}&`;
      if (filterMethodology) q += `methodology=${encodeURIComponent(filterMethodology)}&`;

      const [tRes, pRes, uRes] = await Promise.all([
        api.tasks.list(q),
        api.projects.list(),
        api.users.list(),
      ]);

      const loadedTasks = tRes.data || tRes.results || (Array.isArray(tRes) ? tRes : []);
      const loadedProjects = pRes.data || pRes.results || (Array.isArray(pRes) ? pRes : []);
      const loadedUsers = uRes.data || uRes.results || (Array.isArray(uRes) ? uRes : []);

      setTasks(loadedTasks);
      setProjects(loadedProjects);
      setUsers(loadedUsers);

      // Handle navigation state from Projects page (e.g. "Assign Workflow Task" clicked)
      if (location.state?.assignProjectId) {
        const targetProj = loadedProjects.find(p => p.id === location.state.assignProjectId);
        const meth = targetProj?.methodology || 'SDLC';
        const methConfig = WORKFLOW_METHODOLOGIES[meth] || WORKFLOW_METHODOLOGIES.SDLC;
        const defaultStage = methConfig.stages[0]?.name || 'Requirements Analysis';
        const defaultActivity = methConfig.stages[0]?.activities[0] || 'Requirement Gathering';

        setForm({
          ...EMPTY_TASK,
          project: location.state.assignProjectId,
          methodology: meth,
          stage: defaultStage,
          activity: defaultActivity,
          title: `[${defaultActivity}] - ${targetProj?.name || ''}`.trim(),
        });
        setModal(true);
        window.history.replaceState({}, document.title);
      }
    } catch (e) {
      console.error('Error loading task tracker data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterProject, filterMethodology]);

  // Available Assignees based on Current User's Role Hierarchy
  const assignableUsers = filterAssignableUsers(users, role, founderOverride);
  const assignmentRule = ROLE_ASSIGNMENT_RULES[role] || ROLE_ASSIGNMENT_RULES.FOUNDER;

  // Handle Project Selection in Modal: Sync project's default methodology
  const handleProjectChange = (projectId) => {
    const selectedProj = projects.find(p => p.id === projectId);
    const meth = selectedProj?.methodology || form.methodology || 'SDLC';
    const methConfig = WORKFLOW_METHODOLOGIES[meth] || WORKFLOW_METHODOLOGIES.SDLC;
    const defaultStage = methConfig.stages[0]?.name || '';
    const defaultActivity = methConfig.stages[0]?.activities[0] || '';

    setForm(prev => ({
      ...prev,
      project: projectId,
      methodology: meth,
      stage: defaultStage,
      activity: defaultActivity,
      title: defaultActivity ? `[${defaultActivity}] - ${selectedProj?.name || ''}`.trim() : prev.title,
    }));
  };

  // Handle Methodology Tab Switch
  const handleMethodologyChange = (newMeth) => {
    const methConfig = WORKFLOW_METHODOLOGIES[newMeth] || WORKFLOW_METHODOLOGIES.SDLC;
    const defaultStage = methConfig.stages[0]?.name || '';
    const defaultActivity = methConfig.stages[0]?.activities[0] || '';
    const projName = projects.find(p => p.id === form.project)?.name || '';

    setForm(prev => ({
      ...prev,
      methodology: newMeth,
      stage: defaultStage,
      activity: defaultActivity,
      title: defaultActivity ? `[${defaultActivity}] - ${projName}`.trim() : prev.title,
    }));
  };

  // Handle Stage Selection
  const handleStageChange = (newStage) => {
    const methConfig = WORKFLOW_METHODOLOGIES[form.methodology] || WORKFLOW_METHODOLOGIES.SDLC;
    const stageObj = methConfig.stages.find(s => s.name === newStage);
    const defaultActivity = stageObj?.activities[0] || '';
    const projName = projects.find(p => p.id === form.project)?.name || '';

    setForm(prev => ({
      ...prev,
      stage: newStage,
      activity: defaultActivity,
      title: defaultActivity ? `[${defaultActivity}] - ${projName}`.trim() : prev.title,
    }));
  };

  // Handle Activity Selection
  const handleActivityChange = (newActivity) => {
    const projName = projects.find(p => p.id === form.project)?.name || '';
    setForm(prev => ({
      ...prev,
      activity: newActivity,
      title: `[${newActivity}] - ${projName}`.trim(),
    }));
  };

  // Handle Assignee Selection
  const handleAssigneeChange = (userId) => {
    const chosenUser = users.find(u => u.id === userId);
    setForm(prev => ({
      ...prev,
      assigned_to: userId,
      assignee_role: chosenUser?.role || '',
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.project) {
      alert('Please select a project for this workflow assignment.');
      return;
    }
    try {
      const payload = {
        ...form,
        assigned_by: user?.id || null,
      };

      if (form.id) {
        await api.tasks.update(form.id, payload);
      } else {
        await api.tasks.create(payload);
      }
      setModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error saving workflow task');
    }
  };

  // Open Quick Hours Logging Modal
  const openLogHoursModal = (task) => {
    setActiveLogTask(task);
    setHoursToAdd(1);
    setLogStatusUpdate(task.status);
    setLogHoursModal(true);
  };

  const handleSaveQuickHours = async (e) => {
    e.preventDefault();
    if (!activeLogTask) return;
    try {
      const newLoggedHours = Number(activeLogTask.logged_hours || 0) + Number(hoursToAdd || 0);
      const payload = {
        ...activeLogTask,
        logged_hours: newLoggedHours,
        status: logStatusUpdate || activeLogTask.status,
      };
      await api.tasks.update(activeLogTask.id, payload);
      setLogHoursModal(false);
      setActiveLogTask(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error updating execution hours');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.tasks.delete(id);
        fetchData();
      } catch (err) {
        alert(err.message || 'Error deleting task');
      }
    }
  };

  // Filtering on client side for search & assignee
  const filteredTasks = tasks.filter(t => {
    if (search) {
      const s = search.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(s);
      const matchProj = (t.project_name || '').toLowerCase().includes(s);
      const matchActivity = (t.activity || '').toLowerCase().includes(s);
      const matchAssignee = (t.assigned_to_detail?.full_name || '').toLowerCase().includes(s);
      if (!matchTitle && !matchProj && !matchActivity && !matchAssignee) return false;
    }
    if (filterAssignee && t.assigned_to !== filterAssignee) return false;
    return true;
  });

  // Aggregated KPIs
  const totalTasksCount = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending' || t.status === 'Review').length;
  const totalEstHours = tasks.reduce((sum, t) => sum + Number(t.estimated_hours || 0), 0);
  const totalLogHours = tasks.reduce((sum, t) => sum + Number(t.logged_hours || 0), 0);
  const overallEfficiency = totalEstHours > 0 ? Math.round((totalLogHours / totalEstHours) * 100) : 0;

  const canCreate = canPerform(role, 'CREATE_TASK');
  const canDelete = canPerform(role, 'DELETE_TASK');

  const activeMethodologyConfig = WORKFLOW_METHODOLOGIES[form.methodology] || WORKFLOW_METHODOLOGIES.SDLC;

  // Methodology badge helper
  const getMethBadgeClass = (meth) => {
    if (meth === 'Agile') return 'gradient-badge agile';
    if (meth === 'Waterfall') return 'gradient-badge waterfall';
    return 'gradient-badge sdlc';
  };

  // Priority badge with gradient
  const getPriorityStyle = (priority) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    if (p === 'URGENT') return { bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#991b1b', border: '#fca5a5' };
    if (p === 'HIGH') return { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#92400e', border: '#fde68a' };
    if (p === 'MEDIUM') return { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#1e40af', border: '#bfdbfe' };
    return { bg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', color: '#475569', border: '#e2e8f0' };
  };

  // Card accent color by methodology
  const getCardAccent = (meth) => {
    if (meth === 'Agile') return 'linear-gradient(90deg, #10b981, #34d399)';
    if (meth === 'Waterfall') return 'linear-gradient(90deg, #06b6d4, #22d3ee)';
    return 'linear-gradient(90deg, #6366f1, #818cf8)';
  };

  return (
    <div className="page-container" style={{ gap: '20px' }}>
      {/* ────────── PREMIUM HERO HEADER ────────── */}
      <div className="premium-hero-gradient rounded-2xl p-5 sm:p-7 text-white relative z-10" style={{ borderRadius: '20px' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a' }}>
                Workflow Engine
              </span>
              <div className="flex items-center gap-1.5">
                {['SDLC', 'Waterfall', 'Agile'].map((m, i) => (
                  <span key={m} className="text-[10px] font-semibold text-slate-400">
                    {i > 0 && '·'} {m}
                  </span>
                ))}
              </div>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#ffffff' }}>
              Tasks & Execution Hours Tracker
            </h1>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', maxWidth: '550px', lineHeight: 1.5 }}>
              Assign methodology workflow stages, delegate tasks through the executive hierarchy, and log actual execution hours.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => { setForm(EMPTY_TASK); setModal(true); }}
              className="flex items-center gap-2 cursor-pointer self-start lg:self-auto"
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
              <span>New Task Assignment</span>
            </button>
          )}
        </div>

        {/* Delegation Authority Banner */}
        <div className="mt-4 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
              <Shield size={18} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Active Delegation Authority:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getRoleBadgeClass(role)}`}>
                  {getRoleDisplayName(role)}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{assignmentRule.hint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Logged in as:</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24' }}>{user?.full_name || 'Staff User'}</span>
          </div>
        </div>
      </div>

      {/* ────────── KPI METRICS DASHBOARD ────────── */}
      <div className="grid gap-3.5 kpi-grid-responsive stagger-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          { label: 'Total Tasks', value: totalTasksCount, icon: <CheckSquare size={18} />, color: '#475569', colorEnd: '#64748b', iconBg: '#f1f5f9' },
          { label: 'In Progress', value: inProgressCount, icon: <Activity size={18} />, color: '#f59e0b', colorEnd: '#fbbf24', iconBg: '#fef3c7' },
          { label: 'Completed', value: completedCount, icon: <CheckCircle2 size={18} />, color: '#10b981', colorEnd: '#34d399', iconBg: '#d1fae5' },
          { label: 'Est. Execution', value: `${totalEstHours}`, unit: 'hrs', icon: <Target size={18} />, color: '#3b82f6', colorEnd: '#60a5fa', iconBg: '#dbeafe' },
          { label: 'Actual Logged', value: `${totalLogHours}`, unit: 'hrs', badge: `${overallEfficiency}%`, icon: <TrendingUp size={18} />, color: '#6366f1', colorEnd: '#818cf8', iconBg: '#e0e7ff' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="kpi-card-premium"
            style={{ '--kpi-color': kpi.color, '--kpi-color-end': kpi.colorEnd }}
          >
            <div className="flex items-start justify-between mb-2">
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: kpi.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {kpi.label}
              </span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: kpi.iconBg, color: kpi.color }}>
                {kpi.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {kpi.value}
              </span>
              {kpi.unit && <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>{kpi.unit}</span>}
              {kpi.badge && (
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '6px',
                  background: overallEfficiency > 100 ? 'linear-gradient(135deg, #fef2f2, #fee2e2)' : 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                  color: overallEfficiency > 100 ? '#991b1b' : '#4338ca',
                  border: `1px solid ${overallEfficiency > 100 ? '#fca5a5' : '#c7d2fe'}`,
                  marginLeft: '4px'
                }}>
                  {kpi.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ────────── FILTERS & SEARCH BAR ────────── */}
      <div className="glass-card" style={{ padding: '16px 18px' }}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              style={{ paddingLeft: '2.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '9px 14px 9px 38px', fontSize: '12px', fontWeight: 600, width: '100%', outline: 'none', transition: 'all 0.18s ease' }}
              placeholder="Search task, activity, project, or assignee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
            >
              <option value="">All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              value={filterMethodology}
              onChange={e => setFilterMethodology(e.target.value)}
            >
              <option value="">All Methodologies</option>
              <option value="SDLC">SDLC</option>
              <option value="Waterfall">Waterfall</option>
              <option value="Agile">Agile</option>
            </select>

            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
            >
              <option value="">All Team Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({getRoleDisplayName(u.role)})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          {[
            { label: `All Tasks (${tasks.length})`, value: '' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Under Review', value: 'Review' },
            { label: 'Completed', value: 'Completed' },
          ].map(pill => (
            <button
              key={pill.value}
              onClick={() => setFilterStatus(pill.value)}
              className={`filter-pill cursor-pointer ${filterStatus === pill.value ? 'active' : 'inactive'}`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ────────── TASK CARDS GRID ────────── */}
      <div className="grid gap-4 task-grid-responsive stagger-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {loading ? (
          // Skeleton Loading Cards
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: '220px', borderRadius: '18px' }} />
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{ background: '#ffffff', border: '2px dashed #e2e8f0' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <CheckSquare size={24} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>No matching tasks found</p>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
              Click "New Task Assignment" to assign a workflow module.
            </p>
          </div>
        ) : (
          filteredTasks.map(t => {
            const meth = t.methodology || 'SDLC';
            const progressRatio = Number(t.estimated_hours || 0) > 0 ? (Number(t.logged_hours || 0) / Number(t.estimated_hours)) * 100 : 0;
            const progressColor =
              progressRatio > 100 ? 'linear-gradient(90deg, #ef4444, #f87171)' :
              progressRatio >= 75 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
              'linear-gradient(90deg, #10b981, #34d399)';
            const priorityStyle = getPriorityStyle(t.priority);

            const assignedTo = t.assigned_to_detail;
            const assignedBy = t.assigned_by_detail;

            return (
              <div
                key={t.id}
                className="task-card-premium flex flex-col justify-between"
                style={{ '--card-accent': getCardAccent(meth) }}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={getMethBadgeClass(meth)}>{meth}</span>
                      <span className="gradient-badge" style={{
                        background: priorityStyle.bg,
                        color: priorityStyle.color,
                        border: `1px solid ${priorityStyle.border}`
                      }}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setForm({
                            ...t,
                            project: t.project || '',
                            methodology: t.methodology || 'SDLC',
                            stage: t.stage || 'Requirements Analysis',
                            activity: t.activity || '',
                          });
                          setModal(true);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                        title="Edit Task Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-all"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Project */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                      {t.title}
                    </h4>
                    <p style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '3px' }}>
                      {t.project_name || 'General Project'}
                    </p>
                  </div>

                  {/* Stage & Activity Tag */}
                  {(t.stage || t.activity) && (
                    <div className="stage-chip mt-3">
                      <span style={{ fontWeight: 700, color: '#334155' }}>{t.stage || 'Workflow Stage'}</span>
                      <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                      <span style={{ color: '#b45309', fontWeight: 600 }} className="truncate">{t.activity || 'Activity'}</span>
                    </div>
                  )}

                  {/* Description */}
                  {t.description && (
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }} className="line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Team & Progress Footer */}
                <div style={{ paddingTop: '14px', marginTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                  {/* Assignee & Status Row */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                          fontSize: '10px', fontWeight: 800, color: '#475569'
                        }}>
                        {assignedTo?.profile_image ? (
                          <img src={assignedTo.profile_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          assignedTo?.avatar_text || 'UN'
                        )}
                      </div>
                      <div>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1 }}>
                          {assignedTo?.full_name || 'Unassigned'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginTop: '2px', display: 'block' }}>
                          {getRoleDisplayName(assignedTo?.role || t.assignee_role)}
                        </span>
                      </div>
                    </div>

                    <span className="gradient-badge" style={{
                      background: t.status === 'Completed' ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      color: t.status === 'Completed' ? '#047857' : '#92400e',
                      border: `1px solid ${t.status === 'Completed' ? '#a7f3d0' : '#fde68a'}`
                    }}>
                      {t.status}
                    </span>
                  </div>

                  {/* Delegated By Note */}
                  {assignedBy && (
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }} className="flex items-center gap-1">
                      <span>Delegated by:</span>
                      <span style={{ fontWeight: 600, color: '#64748b' }}>{assignedBy.full_name} ({getRoleDisplayName(assignedBy.role)})</span>
                    </div>
                  )}

                  {/* Hours Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, fontFamily: 'monospace' }} className="flex items-center gap-1">
                        <Clock size={11} style={{ color: '#f59e0b' }} />
                        {t.logged_hours} / {t.estimated_hours} hrs
                      </span>
                      <button
                        onClick={() => openLogHoursModal(t)}
                        className="cursor-pointer"
                        style={{
                          fontSize: '10.5px', fontWeight: 800, color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.08)', padding: '3px 10px',
                          borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.15)',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        + Log Hours
                      </button>
                    </div>
                    <div className="progress-bar-animated">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(progressRatio, 100)}%`, background: progressColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ────────── WORKFLOW TASK ASSIGNMENT MODAL ────────── */}
      {modal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom modal-animated max-w-2xl max-h-[92vh] overflow-y-auto sidebar-scroll" style={{ borderRadius: '22px', padding: '28px' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-1" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  {form.id ? 'Edit Workflow Task & Hours' : 'New Project Task Assignment'}
                </h3>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  Select project, configure workflow methodology stage, and assign through role hierarchy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 pt-3 text-xs">
              {/* STEP 1: Related Project */}
              <div>
                <label className="form-label font-bold text-slate-800">
                  Step 1: Select Project *
                </label>
                <select
                  required
                  className="form-input font-semibold"
                  value={form.project}
                  onChange={e => handleProjectChange(e.target.value)}
                >
                  <option value="">-- Choose Project to Assign --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.methodology || 'SDLC'}] — Client: {p.client_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* STEP 2: Workflow Methodology Tabs */}
              <div>
                <label className="form-label font-bold text-slate-800">
                  Step 2: Choose Process / Methodology *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {Object.values(WORKFLOW_METHODOLOGIES).map(m => {
                    const isSelected = form.methodology === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMethodologyChange(m.id)}
                        className="cursor-pointer transition-all"
                        style={{
                          padding: '12px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                          background: isSelected ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : '#ffffff',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center',
                          boxShadow: isSelected ? '0 2px 12px rgba(245, 158, 11, 0.15)' : 'none',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        {m.id === 'SDLC' && <Layers size={20} style={{ color: isSelected ? '#4338ca' : '#94a3b8' }} />}
                        {m.id === 'Waterfall' && <Workflow size={20} style={{ color: isSelected ? '#0e7490' : '#94a3b8' }} />}
                        {m.id === 'Agile' && <Zap size={20} style={{ color: isSelected ? '#047857' : '#94a3b8' }} />}
                        <span style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#0f172a' : '#64748b' }}>{m.shortName}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{m.stages.length} Stages</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Workflow Stage Selection */}
              <div>
                <label className="form-label font-bold text-slate-800 flex items-center justify-between">
                  <span>Step 3: Select Workflow Stage ({form.methodology}) *</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>Choose current engineering phase</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeMethodologyConfig.stages.map(stg => {
                    const isSelected = form.stage === stg.name;
                    return (
                      <button
                        key={stg.name}
                        type="button"
                        onClick={() => handleStageChange(stg.name)}
                        className="cursor-pointer transition-all text-left"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                          background: isSelected ? '#0f172a' : '#f8fafc',
                          color: isSelected ? '#fbbf24' : '#334155',
                          fontSize: '11px', fontWeight: 700,
                          boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.15)' : 'none',
                        }}
                      >
                        <div className="truncate">{stg.name}</div>
                        <div style={{ fontSize: '9.5px', fontWeight: 400, color: isSelected ? '#94a3b8' : '#94a3b8', marginTop: '2px' }}>
                          {stg.activities.length} activities
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: Workflow Activity Selection */}
              <div>
                <label className="form-label font-bold text-slate-800 flex items-center justify-between">
                  <span>Step 4: Select Workflow Activity / Task Component *</span>
                  <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 600 }}>Clicking suggests Task Title</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeMethodologyConfig.stages
                    .find(s => s.name === form.stage)
                    ?.activities.map(act => {
                      const isSelected = form.activity === act;
                      return (
                        <button
                          key={act}
                          type="button"
                          onClick={() => handleActivityChange(act)}
                          className="cursor-pointer transition-all"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontSize: '11.5px', fontWeight: 700,
                            border: isSelected ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                            background: isSelected ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#ffffff',
                            color: isSelected ? '#0f172a' : '#475569',
                            boxShadow: isSelected ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                          }}
                        >
                          {act}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Task Title Field */}
              <div>
                <label className="form-label font-bold text-slate-800">
                  Task Title *
                </label>
                <input
                  required
                  className="form-input text-xs font-semibold"
                  placeholder="e.g. [Database Design] - Schema setup and indexing"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* STEP 5: Cascading Assignee Selection (Hierarchy Enforced) */}
              <div style={{ padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between mb-3">
                  <label className="form-label font-bold text-slate-900" style={{ margin: 0 }}>
                    Step 5: Assign Team Member (Hierarchy Enforced) *
                  </label>
                  {role === 'FOUNDER' && (
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={founderOverride}
                        onChange={e => setFounderOverride(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>Superadmin Override</span>
                    </label>
                  )}
                </div>

                {/* Delegation Authority Banner */}
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '11px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Assigning as:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getRoleBadgeClass(role)}`}>
                      {getRoleDisplayName(role)}
                    </span>
                    <ArrowRight size={12} className="text-slate-400" />
                    <span style={{ fontWeight: 700, color: '#92400e' }}>
                      Eligible: {assignmentRule.allowedTargetRoles.map(getRoleDisplayName).join(', ') || 'Self Execution'}
                    </span>
                  </div>
                </div>

                <select
                  required
                  className="form-input font-semibold bg-white"
                  value={form.assigned_to}
                  onChange={e => handleAssigneeChange(e.target.value)}
                >
                  <option value="">-- Choose Team Member to Assign --</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} [{getRoleDisplayName(u.role)}] — {u.department || 'General'}
                    </option>
                  ))}
                </select>

                {assignableUsers.length === 0 && (
                  <p style={{ fontSize: '11px', color: '#e11d48', fontWeight: 600, marginTop: '8px' }}>
                    No eligible staff members found under your authority tier.
                  </p>
                )}
              </div>

              {/* Priority, Status, Hours, Due Date */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input font-bold"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input font-medium"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input font-mono"
                    value={form.estimated_hours}
                    onChange={e => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="form-label">Target Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.due_date || ''}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Task Description */}
              <div>
                <label className="form-label">Task Scope &amp; Implementation Details</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Key deliverables, technical requirements, or branch references..."
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn-light-custom"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-warning-custom shadow-xs font-extrabold"
                >
                  {form.id ? 'Update Task' : 'Assign Workflow Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────── QUICK LOG HOURS MODAL ────────── */}
      {logHoursModal && activeLogTask && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom modal-animated max-w-md" style={{ borderRadius: '22px', padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              Log Execution Hours
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Recording time on: <strong style={{ color: '#0f172a' }}>{activeLogTask.title}</strong>
            </p>

            <form onSubmit={handleSaveQuickHours} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-3" style={{ fontSize: '12px', color: '#475569' }}>
                  <span>Current Logged Time:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#d97706' }}>
                    {activeLogTask.logged_hours} / {activeLogTask.estimated_hours} hrs
                  </span>
                </div>

                <label className="form-label font-bold">Add Hours Today</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[1, 2, 4, 8].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHoursToAdd(h)}
                      className="cursor-pointer transition-all"
                      style={{
                        padding: '8px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: hoursToAdd === h ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                        background: hoursToAdd === h ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#f8fafc',
                        color: hoursToAdd === h ? '#0f172a' : '#475569',
                        boxShadow: hoursToAdd === h ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                      }}
                    >
                      +{h} hr{h > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="form-input font-mono font-bold"
                  value={hoursToAdd}
                  onChange={e => setHoursToAdd(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="form-label">Update Task Status</label>
                <select
                  className="form-input font-semibold"
                  value={logStatusUpdate}
                  onChange={e => setLogStatusUpdate(e.target.value)}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Submit for Review</option>
                  <option value="Completed">Mark as Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn-light-custom"
                  onClick={() => setLogHoursModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-warning-custom font-extrabold"
                >
                  Save Logged Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
