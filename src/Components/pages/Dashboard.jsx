import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users, UserCheck, BriefcaseBusiness, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Video, ShieldAlert, ArrowUpRight, Plus, CheckSquare, Sparkles,
  ShieldCheck, Layers, Award, Crown, Briefcase, Shield, Code, GraduationCap, ArrowRight, UserPlus,
  BarChart3, ExternalLink
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { api } from "../../services/api";
import { canPerform, getRoleConfig } from "../../services/rbac";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [urgentProjects, setUrgentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'FOUNDER';
  const roleConfig = getRoleConfig(role);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, uRes, tRes] = await Promise.all([
        api.reports.getDashboardStats().catch(() => ({ stats: {} })),
        api.reports.getAnalytics().catch(() => ({ analytics: {} })),
        api.projects.getUrgent().catch(() => ({ data: [] })),
        api.tasks.list().catch(() => ({ data: [] })),
      ]);

      setStats(sRes.stats || {});
      setAnalytics(aRes.analytics || {});
      setUrgentProjects(uRes.data || uRes.results || []);
      setMyTasks((tRes.data || tRes.results || []).slice(0, 5));
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  return (
    <div className="page-container">
      {/* Hero Executive Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Sparkles size={11} className="text-slate-950" />
                {roleConfig.label} Workspace
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Single Active Session
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Welcome back, {user?.first_name || 'Arun'}</span>
              <img
                src="/emojis/waving_hand_3d.png"
                alt="👋"
                className="w-6.5 h-6.5 object-contain inline-block select-none"
              />
            </h1>
            <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-xl">
              {roleConfig.description}
            </p>
          </div>

          {/* Action Buttons with 12px Border Radius and Centered Alignment */}
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0 self-start md:self-center">
            {canPerform(role, 'CREATE_PROJECT') && (
              <button
                onClick={() => navigate('/projects')}
                className="btn-banner-primary"
                style={{ borderRadius: '12px' }}
              >
                <Plus size={16} />
                <span>New Project</span>
              </button>
            )}
            {canPerform(role, 'CREATE_CLIENT') && (
              <button
                onClick={() => navigate('/clients')}
                className="btn-banner-secondary"
                style={{ borderRadius: '12px' }}
              >
                <UserPlus size={16} className="text-amber-400" />
                <span>Add Client</span>
              </button>
            )}
            {['EMPLOYEE', 'TRAINEE'].includes(role) && (
              <button
                onClick={() => navigate('/tasks')}
                className="btn-banner-primary"
                style={{ borderRadius: '12px' }}
              >
                <CheckSquare size={16} />
                <span>Open Task Queue</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Urgent Priority Alert Banner */}
      {!['EMPLOYEE', 'TRAINEE'].includes(role) && urgentProjects.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/90 border border-rose-200/90 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs self-center">
              <ShieldAlert size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Urgent Attention
                </span>
                <span className="font-bold text-xs text-rose-900">
                  {urgentProjects.length} Project(s) Flagged
                </span>
              </div>
              <p className="text-xs text-rose-800 truncate font-medium mt-0.5">
                {urgentProjects.map(p => `${p.name} (${p.client_name || 'Client'})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="btn-banner-rose flex-shrink-0 self-start sm:self-center"
            style={{ borderRadius: '12px' }}
          >
            <span>Review Urgent</span>
            <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Clients */}
        {!['EMPLOYEE', 'TRAINEE'].includes(role) && (
          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Total Clients</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 my-1">{stats?.total_clients || 0}</h3>
            <span className="text-[11px] text-emerald-700 font-bold block">
              {stats?.active_clients || 0} Active Accounts
            </span>
          </div>
        )}

        {/* Revenue */}
        {['FOUNDER', 'CEO'].includes(role) && (
          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign size={14} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 my-1">
              ₹{((stats?.total_revenue || 0) / 1000).toFixed(0)}K
            </h3>
            <span className="text-[11px] text-amber-700 font-bold block">
              ₹{((stats?.pending_payments || 0)/1000).toFixed(0)}K pending
            </span>
          </div>
        )}

        {/* Active Projects */}
        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Projects</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BriefcaseBusiness size={14} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 my-1">{stats?.active_projects || 0}</h3>
          <span className="text-[11px] text-red-600 font-bold block">
            {stats?.urgent_projects || 0} Urgent Flags
          </span>
        </div>

        {/* Completed Projects */}
        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 my-1">{stats?.completed_projects || 0}</h3>
          <span className="text-[11px] text-slate-500 font-semibold block">
            of {stats?.total_projects || 0} total
          </span>
        </div>

        {/* Digital Media */}
        {!['EMPLOYEE', 'TRAINEE'].includes(role) && (
          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Digital Media</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Video size={14} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 my-1">{stats?.videos_completed || 0}</h3>
            <span className="text-[11px] text-teal-700 font-bold block">
              Videos Produced
            </span>
          </div>
        )}

        {/* Tasks Pending */}
        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tasks Pending</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 my-1">{stats?.tasks_pending || 0}</h3>
          <span className="text-[11px] text-emerald-700 font-bold block">
            {stats?.tasks_completed || 0} Completed
          </span>
        </div>
      </div>

      {/* Visual Analytics & Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Revenue Performance Area (8 cols) */}
        {['FOUNDER', 'CEO'].includes(role) ? (
          <div className="lg:col-span-8 dashboard-card flex flex-col justify-between">
            <div className="flex items-start sm:items-center justify-between mb-4 gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue &amp; Cash Flow</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time aggregated financial performance</p>
              </div>
              <span className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg flex-shrink-0">
                +18.7% YoY
              </span>
            </div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.monthly_revenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`}`}
                    width={50}
                  />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 dashboard-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Active Execution Tasks</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tasks currently assigned to your workflow</p>
              </div>
              <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-amber-700 hover:underline">
                View All Tasks &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {myTasks.length === 0 ? (
                <p className="text-slate-400 text-center py-10 text-xs font-medium">No tasks in progress.</p>
              ) : (
                myTasks.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{t.title}</h4>
                      <p className="text-[11px] text-amber-800 font-semibold truncate mt-0.5">{t.project_name || 'General Workspace'}</p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-[11px] text-slate-500 font-mono font-semibold">{t.logged_hours} / {t.estimated_hours} hrs</span>
                      <span className={`badge ${t.status === 'Completed' ? 'text-bg-success' : 'text-bg-warning'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Priority Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 dashboard-card flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">Project Priorities</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live distribution breakdown</p>
          </div>
          <div className="h-44 my-2 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.priority_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(analytics?.priority_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {(analytics?.priority_distribution || []).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="font-medium text-slate-600 truncate text-[11px]">
                  {item.name}: <strong>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Operational Actions Section */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
              <Sparkles size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Role Actions: <span className="text-amber-700">{roleConfig.label}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{roleConfig.accessScope}</p>
            </div>
          </div>
        </div>

        {/* FOUNDER FOCUS */}
        {role === 'FOUNDER' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="action-card bg-amber-50/40 border-amber-200/80">
              <div>
                <div className="action-card-title text-amber-950">
                  <DollarSign size={15} className="text-amber-600" />
                  <span>Full Financial Ledger</span>
                </div>
                <p className="action-card-desc">
                  Total revenue &amp; pending payments: ₹{((stats?.total_revenue || 0) + (stats?.pending_payments || 0)).toLocaleString('en-IN')}.
                </p>
              </div>
              <button onClick={() => navigate('/financial')} className="btn-primary self-start">
                Open Financial Ledger
              </button>
            </div>

            <div className="action-card bg-blue-50/40 border-blue-200/80">
              <div>
                <div className="action-card-title text-blue-950">
                  <Users size={15} className="text-blue-600" />
                  <span>Employee Directory</span>
                </div>
                <p className="action-card-desc">
                  {stats?.total_employees || 0} staff profiles with Fernet encrypted payroll store.
                </p>
              </div>
              <button onClick={() => navigate('/employees')} className="btn-blue self-start">
                Manage Employees
              </button>
            </div>

            <div className="action-card bg-emerald-50/40 border-emerald-200/80 sm:col-span-2 lg:col-span-1">
              <div>
                <div className="action-card-title text-emerald-950">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>System Security &amp; Audit</span>
                </div>
                <p className="action-card-desc">
                  Single Founder security rule strictly enforced at ORM layer.
                </p>
              </div>
              <button onClick={() => navigate('/activity-logs')} className="btn-emerald self-start">
                View Audit Trail
              </button>
            </div>
          </div>
        )}

        {/* CEO FOCUS */}
        {role === 'CEO' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="action-card bg-purple-50/40 border-purple-200/80">
              <div>
                <div className="action-card-title text-purple-950">
                  <DollarSign size={15} className="text-purple-600" />
                  <span>Executive Financial Ledger</span>
                </div>
                <p className="action-card-desc">
                  Verified Organization Revenue: ₹{Number(stats?.total_revenue || 0).toLocaleString('en-IN')}.
                </p>
              </div>
              <button onClick={() => navigate('/financial')} className="btn-purple self-start">
                Open Financial Ledger
              </button>
            </div>

            <div className="action-card bg-blue-50/40 border-blue-200/80">
              <div>
                <div className="action-card-title text-blue-950">
                  <FileText size={15} className="text-blue-600" />
                  <span>Invoices &amp; Quotations</span>
                </div>
                <p className="action-card-desc">
                  Track billing statements, proposals, and client payments.
                </p>
              </div>
              <button onClick={() => navigate('/invoices')} className="btn-blue self-start">
                Review Invoices
              </button>
            </div>

            <div className="action-card bg-amber-50/40 border-amber-200/80 sm:col-span-2 lg:col-span-1">
              <div>
                <div className="action-card-title text-amber-950">
                  <BarChart3 size={15} className="text-amber-600" />
                  <span>Reports &amp; Analytics</span>
                </div>
                <p className="action-card-desc">
                  Analyze monthly performance metrics and conversion rates.
                </p>
              </div>
              <button onClick={() => navigate('/reports')} className="btn-primary self-start">
                View Reports
              </button>
            </div>
          </div>
        )}

        {/* MANAGER FOCUS */}
        {role === 'MANAGER' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="action-card bg-blue-50/40 border-blue-200/80">
              <div>
                <div className="action-card-title text-blue-950">
                  <BriefcaseBusiness size={15} className="text-blue-600" />
                  <span>Project Kanban &amp; Delivery</span>
                </div>
                <p className="action-card-desc">
                  {stats?.active_projects || 0} active projects. <strong>{stats?.urgent_projects || 0} flagged urgent</strong>.
                </p>
              </div>
              <button onClick={() => navigate('/projects')} className="btn-blue self-start">
                Open Kanban Board
              </button>
            </div>

            <div className="action-card bg-teal-50/40 border-teal-200/80">
              <div>
                <div className="action-card-title text-teal-950">
                  <Video size={15} className="text-teal-600" />
                  <span>Social Media Retainers</span>
                </div>
                <p className="action-card-desc">
                  {stats?.social_media_clients || 0} retainer accounts with {stats?.videos_completed || 0} videos produced.
                </p>
              </div>
              <button onClick={() => navigate('/digital-marketing')} className="btn-emerald self-start">
                Manage Retainers
              </button>
            </div>
          </div>
        )}

        {/* TEAM HEAD FOCUS */}
        {role === 'TEAM_HEAD' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="action-card bg-emerald-50/40 border-emerald-200/80">
              <div>
                <div className="action-card-title text-emerald-950">
                  <BriefcaseBusiness size={15} className="text-emerald-600" />
                  <span>Team Project Execution</span>
                </div>
                <p className="action-card-desc">
                  Track project priorities, Kanban milestones, and urgent delivery.
                </p>
              </div>
              <button onClick={() => navigate('/projects')} className="btn-emerald self-start">
                Lead Kanban Workspace
              </button>
            </div>

            <div className="action-card bg-slate-50 border-slate-200">
              <div>
                <div className="action-card-title text-slate-950">
                  <CheckSquare size={15} className="text-amber-600" />
                  <span>Team Tasks &amp; Hours</span>
                </div>
                <p className="action-card-desc">
                  Assign tasks and verify hour logs for developers and interns.
                </p>
              </div>
              <button onClick={() => navigate('/tasks')} className="btn-primary self-start">
                Assign &amp; Review Tasks
              </button>
            </div>
          </div>
        )}

        {/* EMPLOYEE & TRAINEE FOCUS */}
        {['EMPLOYEE', 'TRAINEE'].includes(role) && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-0.5">
                Assigned Execution Queue ({user?.designation || 'Staff'})
              </h4>
              <p className="text-slate-600 text-[11.5px]">
                You have <strong>{stats?.tasks_pending || 0} pending task(s)</strong> assigned to your workflow.
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="btn-primary self-start sm:self-auto"
            >
              <CheckSquare size={14} /> Open Task Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
