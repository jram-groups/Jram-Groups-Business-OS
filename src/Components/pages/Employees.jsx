import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users, Plus, Search, Shield, Lock, Eye, EyeOff, Edit2, Trash2,
  UserCheck, Award, Crown, Calendar, DollarSign, FileText, CheckCircle2,
  Clock, ArrowUpRight, X, Printer, FileSpreadsheet, Building2, Phone,
  Mail, AlertCircle, Laptop, Briefcase, RefreshCw, ChevronRight,
  ExternalLink, Check, Sparkles, Filter, ChevronDown, Wrench, Download,
  LayoutDashboard, CheckSquare, Share2, Receipt, TrendingUp, CreditCard,
  Boxes, BarChart3, Activity, Settings, GraduationCap, MapPin,
  ShieldCheck, Tag, Info, UserPlus, CheckCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { canPerform, getRoleConfig, ROLE_DETAILS } from '../../services/rbac';

export const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Master analytics & executive KPIs' },
  { key: 'clients', label: 'Clients & CRM', icon: Users, desc: 'Client pipeline, WhatsApp & Email' },
  { key: 'projects', label: 'Projects & Priority', icon: Briefcase, desc: 'Kanban boards & sprint milestones' },
  { key: 'tasks', label: 'Tasks & Hours', icon: CheckSquare, desc: 'Task execution & logged hours' },
  { key: 'digital-marketing', label: 'Social Media Clients', icon: Share2, desc: 'Marketing retainers & content' },
  { key: 'quotations', label: 'Quotations', icon: FileText, desc: 'Proforma estimates & proposals' },
  { key: 'invoices', label: 'Invoices', icon: Receipt, desc: 'Tax invoices & billing statuses' },
  { key: 'income', label: 'Income Tracking', icon: TrendingUp, desc: 'Client deposits & revenue inflow' },
  { key: 'expenses', label: 'Expense Tracking', icon: CreditCard, desc: 'Overhead & software subscriptions' },
  { key: 'financial', label: 'Financial Ledger', icon: DollarSign, desc: 'P&L, balance sheets & tax logs' },
  { key: 'stock-equipments', label: 'Stock & Equipments', icon: Boxes, desc: 'Asset registry & IT inventory' },
  { key: 'employees', label: 'Employees & Payroll', icon: Users, desc: 'HR directory & payroll batches' },
  { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, desc: 'Executive business intelligence' },
  { key: 'activity-logs', label: 'Activity Logs', icon: Activity, desc: 'System-wide audit trail logs' },
  { key: 'settings', label: 'System Settings', icon: Settings, desc: 'Theme, localization & RBAC' },
];

export const ROLE_PRESETS = [
  {
    key: 'TRAINEE',
    label: 'Intern / Trainee',
    icon: GraduationCap,
    color: 'teal',
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
    desc: 'Assigned tasks, learning workspace & hours logging',
    defaultModules: ['dashboard', 'tasks', 'profile'],
  },
  {
    key: 'EMPLOYEE',
    label: 'Employee',
    icon: Laptop,
    color: 'slate',
    badge: 'bg-slate-100 text-slate-900 border-slate-300',
    desc: 'Task execution, sprint projects & delivery updates',
    defaultModules: ['dashboard', 'projects', 'tasks', 'profile'],
  },
  {
    key: 'TEAM_HEAD',
    label: 'Team Head',
    icon: Shield,
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    desc: 'Milestone tracking, team review, CRM & marketing',
    defaultModules: ['dashboard', 'clients', 'projects', 'tasks', 'digital-marketing', 'stock-equipments', 'inventory', 'profile'],
  },
  {
    key: 'MANAGER',
    label: 'Manager',
    icon: UserCheck,
    color: 'blue',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    desc: 'Client CRM, quotes, invoices, tasks & operations',
    defaultModules: ['dashboard', 'clients', 'projects', 'tasks', 'digital-marketing', 'quotations', 'invoices', 'income', 'expenses', 'stock-equipments', 'inventory', 'profile'],
  },
  {
    key: 'CEO',
    label: 'CEO',
    icon: Crown,
    color: 'purple',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: 'Executive strategy, full finances, payroll & analytics',
    defaultModules: ['dashboard', 'clients', 'projects', 'tasks', 'digital-marketing', 'quotations', 'invoices', 'income', 'expenses', 'financial', 'stock-equipments', 'inventory', 'employees', 'reports', 'profile'],
  },
];

export const POPULAR_SKILLS = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Django',
  'TailwindCSS', 'Figma (UI/UX)', 'Digital Marketing', 'SEO Optimization',
  'PostgreSQL', 'Video Editing', 'Graphic Design', 'Project Management',
  'Content Writing', 'Sales Pitching'
];

const EMPTY_EMP = {
  user: {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: 'password123',
    role: 'EMPLOYEE',
    department: 'Engineering & Tech',
    designation: 'Software Engineer',
    phone: '',
  },
  employee_id: '',
  dob: '',
  phone_secondary: '',
  official_email: '',
  address: '',
  current_address: '',
  aadhar_number: '',
  pan_number: '',
  work_commitment: '1 Year Commitment',
  experience_years: '1 - 2 Years',
  skills: ['React', 'JavaScript'],
  custom_permissions: ['dashboard', 'projects', 'tasks', 'profile'],
  joining_date: new Date().toISOString().split('T')[0],
  salary_display: '75000',
};

function calculateTenure(joiningDateStr) {
  if (!joiningDateStr) return 'Recently Joined';
  const join = new Date(joiningDateStr);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return 'Joined this month';
  if (years === 0) return `${months} mo${months === 1 ? '' : 's'} tenure`;
  return `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months} mo${months === 1 ? '' : 's'}` : ''} tenure`;
}

export default function Employees() {
  const { user: currentUser } = useOutletContext() || {};
  const currentRole = currentUser?.role || 'FOUNDER';

  // Active Main Tab: 'directory' | 'attendance' | 'payroll' | 'report'
  const [activeTab, setActiveTab] = useState('directory');

  const [employees, setEmployees] = useState([]);
  const [showSalary, setShowSalary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Add Employee Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EMP);
  const [newSkillText, setNewSkillText] = useState('');
  const [sameAsPermAddress, setSameAsPermAddress] = useState(false);

  // Employee Full Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empDetails, setEmpDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalSubTab, setModalSubTab] = useState('overview'); // 'overview' | 'salary' | 'attendance' | 'assets' | 'projects'

  // Daily Attendance Tab State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Payroll Tab State
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState('September 2026');
  const [payrollBatchRunning, setPayrollBatchRunning] = useState(false);

  // Pay Slip Modal
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [activePayslip, setActivePayslip] = useState(null);

  // Attendance Report Tab State
  const [reportData, setReportData] = useState([]);
  const [reportMonth, setReportMonth] = useState(9);
  const [reportYear, setReportYear] = useState(2026);

  const fetchEmployees = async () => {
    try {
      const res = await api.employees.list();
      const list = res.data || res.results || (Array.isArray(res) ? res : []);
      setEmployees(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await api.employees.getPayroll(`?month=${payrollMonth}`);
      setPayrollRecords(res.data || res.results || (Array.isArray(res) ? res : []));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceForDate = async (targetDate) => {
    try {
      const res = await api.employees.getAttendance(`?date=${targetDate}`);
      const list = res.data || res.results || (Array.isArray(res) ? res : []);
      const map = {};
      list.forEach((a) => {
        map[a.employee] = a.status;
      });
      setDailyAttendanceMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      const res = await api.employees.getAttendanceReport(`?month=${reportMonth}&year=${reportYear}`);
      setReportData(res.report || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'payroll') fetchPayroll();
    if (activeTab === 'attendance') fetchAttendanceForDate(attendanceDate);
    if (activeTab === 'report') fetchAttendanceReport();
  }, [activeTab, payrollMonth, attendanceDate, reportMonth, reportYear]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
    if (activeTab === 'payroll') fetchPayroll();
    if (activeTab === 'attendance') fetchAttendanceForDate(attendanceDate);
    if (activeTab === 'report') fetchAttendanceReport();
  };

  // Open Details Modal
  const handleOpenDetails = async (emp) => {
    setSelectedEmp(emp);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setModalSubTab('overview');
    try {
      const res = await api.employees.getDetails(emp.id);
      setEmpDetails(res);
    } catch (e) {
      console.error('Error fetching employee full details:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Save Daily Attendance
  const handleSaveAttendance = async () => {
    setAttendanceSaving(true);
    try {
      const records = employees.map((emp) => ({
        employee_id: emp.id,
        status: dailyAttendanceMap[emp.id] || 'Present',
        notes: '',
      }));
      await api.employees.markAttendance({
        date: attendanceDate,
        records,
      });
      alert(`Attendance for ${attendanceDate} saved successfully!`);
      fetchAttendanceForDate(attendanceDate);
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Generate Payroll Batch
  const handleGeneratePayrollBatch = async () => {
    setPayrollBatchRunning(true);
    try {
      await api.employees.generatePayrollBatch({
        month: payrollMonth,
        year: 2026,
        month_number: 9,
      });
      fetchPayroll();
      alert(`Payroll batch for ${payrollMonth} generated!`);
    } catch (e) {
      alert('Failed to generate payroll batch: ' + e.message);
    } finally {
      setPayrollBatchRunning(false);
    }
  };

  // Mark Payroll Paid
  const handleMarkPayrollPaid = async (payrollId, empName) => {
    if (!window.confirm(`Disburse and mark payroll as PAID for ${empName}? This will sync to Expense Tracking.`)) return;
    try {
      await api.employees.markPayrollPaid(payrollId, {
        payment_method: 'Bank Transfer',
      });
      fetchPayroll();
      alert(`Salary marked as Paid and synchronized to Financial Ledger!`);
    } catch (e) {
      alert('Error marking payroll paid: ' + e.message);
    }
  };

  // View Pay Slip
  const handleOpenPayslip = (slip) => {
    setActivePayslip(slip);
    setPayslipModalOpen(true);
  };

  // Toggle Salary Visibility
  const toggleSalaryVisibility = (id, e) => {
    if (e) e.stopPropagation();
    setShowSalary((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Select Role Preset
  const handleSelectRolePreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        role: preset.key,
      },
      custom_permissions: [...preset.defaultModules],
    }));
  };

  // Toggle Module Permission
  const handleToggleModule = (moduleKey) => {
    setForm((prev) => {
      const current = prev.custom_permissions || [];
      const exists = current.includes(moduleKey);
      const updated = exists
        ? current.filter((k) => k !== moduleKey)
        : [...current, moduleKey];
      return {
        ...prev,
        custom_permissions: updated,
      };
    });
  };

  // Toggle Skill Tag
  const handleToggleSkill = (skill) => {
    setForm((prev) => {
      const current = prev.skills || [];
      const exists = current.includes(skill);
      const updated = exists
        ? current.filter((s) => s !== skill)
        : [...current, skill];
      return { ...prev, skills: updated };
    });
  };

  // Add Custom Skill
  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (!form.skills?.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), trimmed],
      }));
    }
    setNewSkillText('');
  };

  // Save New Employee
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        user: {
          ...form.user,
          email: form.user.email || form.official_email || `${form.user.username}@jramgroups.com`,
          phone: form.user.phone,
        }
      };
      await api.employees.create(payload);
      setAddModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Error onboarding employee');
    }
  };

  // Delete Employee Profile
  const handleDelete = async (id, isFounder, e) => {
    if (e) e.stopPropagation();
    if (isFounder) {
      alert('Security Protection: Founder master account cannot be deleted.');
      return;
    }
    if (confirm('Are you sure you want to remove this employee profile?')) {
      try {
        await api.employees.delete(id);
        fetchEmployees();
      } catch (err) {
        alert(err.message || 'Error deleting employee');
      }
    }
  };

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const u = emp.user_detail || {};
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (u.full_name || '').toLowerCase().includes(q);
        const matchesCode = (emp.employee_id || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesDesig = (u.designation || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEmail && !matchesDesig) return false;
      }
      if (deptFilter !== 'all' && u.department !== deptFilter) return false;
      return true;
    });
  }, [employees, searchQuery, deptFilter]);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.user_detail?.department).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  // Permissions
  const canCreateEmp = canPerform(currentRole, 'CREATE_EMPLOYEE');
  const canDeleteEmp = canPerform(currentRole, 'DELETE_EMPLOYEE');
  const canViewSalary = canPerform(currentRole, 'VIEW_ENCRYPTED_SALARY');

  // CSV Export for Attendance Report
  const handleExportAttendanceReportCSV = () => {
    if (reportData.length === 0) {
      alert('No attendance records to export.');
      return;
    }
    const headers = ['Employee ID', 'Name', 'Designation', 'Department', 'Total Days', 'Present', 'WFH', 'Half Day', 'Leaves', 'Absent', 'Attendance Rate %'];
    const rows = reportData.map((r) => [
      `"${r.employee_code || ''}"`,
      `"${r.name || ''}"`,
      `"${r.designation || ''}"`,
      `"${r.department || ''}"`,
      r.total_days,
      r.present,
      r.wfh,
      r.half_day,
      r.on_leave,
      r.absent,
      `"${r.attendance_rate}%"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Attendance_Report_Month_${reportMonth}_${reportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container space-y-5">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} />
              People Operations
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Staff Directory, Fernet Payroll &amp; Attendance
            </span>
          </div>
          <h1 className="page-heading">Employees &amp; HR Command</h1>
          <p className="page-desc">
            Manage staff profiles, track joining dates &amp; tenure, monitor biometric daily attendance, and calculate encrypted monthly payroll
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer shadow-xs"
            style={{ borderRadius: '12px', padding: '8px 14px' }}
            title="Refresh HR data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : 'text-slate-500'} />
            <span className="text-xs font-bold">{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {canCreateEmp && (
            <button
              type="button"
              onClick={() => {
                setForm({
                  ...EMPTY_EMP,
                  employee_id: `JRAM-EMP-${String(employees.length + 1).padStart(3, '0')}`,
                });
                setSameAsPermAddress(false);
                setNewSkillText('');
                setAddModalOpen(true);
              }}
              className="btn-banner-primary flex items-center gap-1.5"
              style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}
            >
              <Plus size={16} />
              <span>Onboard Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main HR Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'directory'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Users size={14} />
          <span>Staff Directory &amp; Profiles</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'directory' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
            {employees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'attendance'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Clock size={14} />
          <span>Daily Attendance Tracker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'payroll'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <DollarSign size={14} />
          <span>Salary &amp; Payroll Tracking</span>
          {canViewSalary && (
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-black">
              Encrypted
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'report'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <FileSpreadsheet size={14} />
          <span>Monthly Attendance Report</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* ============================================================
          TAB 1: STAFF DIRECTORY & PROFILES (CARD GRID)
          ============================================================ */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Department Filters */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, designation, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of Employees */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
                <RefreshCw className="animate-spin mx-auto mb-2 text-amber-500" size={24} />
                Loading Employee Directory...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
                No matching staff profiles found.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const userObj = emp.user_detail || {};
                const isFounder = userObj.role === 'FOUNDER';
                const roleConf = getRoleConfig(userObj.role);
                const tenure = calculateTenure(emp.joining_date);

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleOpenDetails(emp)}
                    className="dashboard-card space-y-3.5 relative flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="profile-avatar text-sm font-black flex-shrink-0 group-hover:scale-105 transition-transform">
                            {userObj.avatar_text || 'AK'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                              <span className="truncate group-hover:text-amber-800 transition-colors">
                                {userObj.full_name || 'Employee'}
                              </span>
                              {isFounder && (
                                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black flex-shrink-0 flex items-center gap-0.5">
                                  <Crown size={10} /> FOUNDER
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-amber-800 font-semibold truncate">
                              {userObj.designation || 'Staff'} &bull; {userObj.department}
                            </p>
                          </div>
                        </div>

                        {/* Delete Profile button (Founder protected) */}
                        {canDeleteEmp && !isFounder && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(emp.id, isFounder, e)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0 transition-all cursor-pointer"
                            title="Delete Profile"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Info Pills Box */}
                      <div className="text-xs space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500 font-medium">Employee ID</span>
                          <span className="font-extrabold text-slate-900 font-mono text-right">{emp.employee_id}</span>
                        </div>

                        {/* Joining Date & Tenure */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            Joined
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-slate-800">
                              {emp.joining_date || '01 Jan 2024'}
                            </span>
                            <span className="block text-[9.5px] font-extrabold text-emerald-700">
                              {tenure}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500 font-medium">Contact</span>
                          <span className="font-medium text-slate-700 text-right truncate max-w-[60%]">
                            {userObj.email}
                          </span>
                        </div>

                        {/* Role & Assigned Assets */}
                        <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-200/60">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${roleConf.badge}`}>
                            {roleConf.label}
                          </span>
                          <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            <Laptop size={11} className="text-slate-400" />
                            {emp.assigned_assets_count || 0} Assets
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Monthly Payroll Display */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Lock size={13} className="text-amber-500" />
                        <span>Monthly Payroll</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {canViewSalary ? (
                          <>
                            <span className="font-extrabold text-slate-900 font-mono">
                              {showSalary[emp.id]
                                ? `₹${Number(emp.salary_display || 0).toLocaleString('en-IN')}`
                                : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleSalaryVisibility(emp.id, e)}
                              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                              title={showSalary[emp.id] ? 'Hide' : 'Decrypt Salary'}
                            >
                              {showSalary[emp.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Founder Encrypted</span>
                        )}
                        <span className="text-[11px] text-amber-700 font-bold ml-1 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Details <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: DAILY ATTENDANCE TRACKER
          ============================================================ */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Attendance Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Mark Team Attendance</h3>
                <p className="text-[11px] text-slate-400">1-click status logging for team presence</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar size={14} className="text-slate-400" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={attendanceSaving}
                className="btn-banner-primary"
                style={{ borderRadius: '12px', padding: '7px 18px', fontSize: '12px' }}
              >
                <Check size={14} />
                <span>{attendanceSaving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Role &amp; Department</th>
                    <th className="py-2.5 px-4 text-center">Status for {attendanceDate}</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {employees.map((emp) => {
                    const u = emp.user_detail || {};
                    const currentStatus = dailyAttendanceMap[emp.id] || 'Present';

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center">
                              {u.avatar_text || 'AK'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{emp.employee_id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div className="font-semibold text-slate-800">{u.designation}</div>
                          <div className="text-[10.5px] text-slate-400">{u.department}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {['Present', 'Work From Home', 'Half Day', 'On Leave', 'Absent'].map((st) => {
                              const isSelected = currentStatus === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setDailyAttendanceMap((prev) => ({
                                      ...prev,
                                      [emp.id]: st,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${isSelected
                                    ? st === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'Work From Home'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : st === 'Half Day'
                                          ? 'bg-purple-600 text-white shadow-xs'
                                          : st === 'On Leave'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200/70'
                                    }`}
                                >
                                  {st === 'Work From Home' ? 'WFH' : st}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(emp)}
                            className="text-amber-700 hover:text-amber-900 font-bold text-xs"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: PAYROLL & SALARY TRACKING
          ============================================================ */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="stat-card p-4">
              <span className="text-xs font-bold text-slate-600">Total Monthly Payroll</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
                ₹{payrollRecords.reduce((s, p) => s + Number(p.net_salary || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10.5px] text-slate-400 font-semibold">{payrollMonth} Gross Outflow</span>
            </div>

            <div className="stat-card p-4">
              <span className="text-xs font-bold text-slate-600">Disbursed / Settled</span>
              <div className="text-2xl font-black text-emerald-700 tracking-tight my-1">
                ₹{payrollRecords.filter((p) => p.payment_status === 'Paid').reduce((s, p) => s + Number(p.net_salary || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10.5px] text-emerald-600 font-bold">Bank Cleared</span>
            </div>

            <div className="stat-card p-4">
              <span className="text-xs font-bold text-slate-600">Pending Payout</span>
              <div className="text-2xl font-black text-amber-700 tracking-tight my-1">
                ₹{payrollRecords.filter((p) => p.payment_status !== 'Paid').reduce((s, p) => s + Number(p.net_salary || 0), 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10.5px] text-amber-600 font-bold">Awaiting Disbursement</span>
            </div>

            <div className="stat-card p-4">
              <span className="text-xs font-bold text-slate-600">Pay Slips Generated</span>
              <div className="text-2xl font-black text-purple-700 tracking-tight my-1">
                {payrollRecords.length} Slips
              </div>
              <span className="text-[10.5px] text-slate-400 font-semibold">Active Staff Vouchers</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Payroll Cycle:</span>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 text-xs font-bold rounded-xl border border-slate-200 text-slate-800 cursor-pointer focus:outline-hidden"
              >
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
              </select>
            </div>

            {canPerform(currentRole, 'VIEW_ENCRYPTED_SALARY') && (
              <button
                type="button"
                onClick={handleGeneratePayrollBatch}
                disabled={payrollBatchRunning}
                className="btn-banner-primary"
                style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}
              >
                <Plus size={15} />
                <span>{payrollBatchRunning ? 'Calculating...' : 'Run Monthly Payroll Batch'}</span>
              </button>
            )}
          </div>

          {/* Payroll Slips Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Pay Slip #</th>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4 text-right">Basic Pay (50%)</th>
                    <th className="py-2.5 px-4 text-right">HRA (30%)</th>
                    <th className="py-2.5 px-4 text-right">Allowances</th>
                    <th className="py-2.5 px-4 text-right">Deductions</th>
                    <th className="py-2.5 px-4 text-right">Net Take-Home</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {payrollRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <FileText className="mx-auto mb-2 text-slate-300" size={28} />
                        <p className="font-semibold text-slate-600">No payroll records for {payrollMonth}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click "Run Monthly Payroll Batch" to generate.</p>
                      </td>
                    </tr>
                  ) : (
                    payrollRecords.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {slip.payslip_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{slip.employee_name}</div>
                          <div className="text-[10px] text-slate-400">{slip.designation} &bull; {slip.employee_id_code}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          ₹{Number(slip.basic_salary).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          ₹{Number(slip.hra).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          ₹{Number(slip.allowances).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-rose-600">
                          -₹{Number(slip.deductions).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                          ₹{Number(slip.net_salary).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center gap-1 ${slip.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            <CheckCircle2 size={10} />
                            {slip.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {slip.payment_status !== 'Paid' && canPerform(currentRole, 'VIEW_ENCRYPTED_SALARY') && (
                              <button
                                type="button"
                                onClick={() => handleMarkPayrollPaid(slip.id, slip.employee_name)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                              >
                                Disburse
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPayslip(slip)}
                              className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                            >
                              Pay Slip
                            </button>
                          </div>
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

      {/* ============================================================
          TAB 4: MONTHLY ATTENDANCE REPORT
          ============================================================ */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Month:</span>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 text-xs font-bold rounded-xl border border-slate-200 text-slate-800 cursor-pointer focus:outline-hidden"
              >
                <option value={9}>September (Month 09)</option>
                <option value={8}>August (Month 08)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportAttendanceReportCSV}
              className="btn-banner-secondary"
              style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px' }}
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Export Attendance CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Role &amp; Dept</th>
                    <th className="py-2.5 px-4 text-center">Total Working Days</th>
                    <th className="py-2.5 px-4 text-center">Present</th>
                    <th className="py-2.5 px-4 text-center">WFH</th>
                    <th className="py-2.5 px-4 text-center">Half Day</th>
                    <th className="py-2.5 px-4 text-center">Leaves</th>
                    <th className="py-2.5 px-4 text-center">Absent</th>
                    <th className="py-2.5 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {reportData.map((row) => (
                    <tr key={row.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{row.employee_code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{row.designation}</div>
                        <div className="text-[10.5px] text-slate-400">{row.department}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{row.total_days}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.present}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-700">{row.wfh}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-700">{row.half_day}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">{row.on_leave}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">{row.absent}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${row.attendance_rate >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                          }`}>
                          {row.attendance_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 1: FULL EMPLOYEE DETAILS MODAL (CLICK CARD -> DETAILS SHOWN)
          ============================================================ */}
      {detailsModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header with Avatar */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                  {selectedEmp.user_detail?.avatar_text || 'AK'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">
                      {selectedEmp.user_detail?.full_name}
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-[10px] rounded-full">
                      {selectedEmp.user_detail?.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedEmp.user_detail?.designation} &bull; {selectedEmp.user_detail?.department} &bull; {selectedEmp.employee_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Bio' },
                { id: 'salary', label: 'Salary & Pay Slips' },
                { id: 'attendance', label: 'Attendance History' },
                { id: 'assets', label: 'Assigned Equipment' },
                { id: 'projects', label: 'Projects & Tasks' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalSubTab(tab.id)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all whitespace-nowrap ${modalSubTab === tab.id
                    ? 'border-amber-500 text-amber-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {detailsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-amber-500" size={24} />
                  Loading staff details...
                </div>
              ) : (
                <>
                  {/* SUB-TAB 1: OVERVIEW & BIO */}
                  {modalSubTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Joining Date & Tenure Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                              Date of Joining &amp; Tenure
                            </div>
                            <div className="text-sm font-black text-slate-900 mt-0.5">
                              {selectedEmp.joining_date || '01 Jan 2024'}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                          {calculateTenure(selectedEmp.joining_date)}
                        </span>
                      </div>

                      {/* Personal & Official Details Grid */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">Official Email</span>
                          <p className="font-bold text-slate-900 truncate">{selectedEmp.user_detail?.email}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">Primary Phone</span>
                          <p className="font-bold text-slate-900">{selectedEmp.user_detail?.phone || '+91 98765 00000'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">Emergency Contact</span>
                          <p className="font-bold text-slate-900">{empDetails?.profile?.emergency_contact || 'None listed'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">Blood Group</span>
                          <p className="font-bold text-slate-900">{empDetails?.profile?.blood_group || 'O+'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">PAN Number</span>
                          <p className="font-bold text-slate-900 font-mono">{empDetails?.profile?.pan_number || 'ABCPA1234K'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                          <span className="text-[10.5px] text-slate-400 font-medium">Bank A/C &amp; IFSC</span>
                          <p className="font-bold text-slate-900 font-mono text-[11px]">
                            {empDetails?.profile?.bank_account_number || '•••• •••• 9182'} ({empDetails?.profile?.bank_ifsc_code || 'HDFC0000240'})
                          </p>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      {empDetails?.profile?.skills && empDetails.profile.skills.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-slate-700 block mb-1.5">Core Competencies &amp; Skills</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {empDetails.profile.skills.map((s, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 2: SALARY & PAYROLL BREAKDOWN */}
                  {modalSubTab === 'salary' && (
                    <div className="space-y-4">
                      {canViewSalary ? (
                        <>
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                Monthly Gross Compensation (CTC)
                              </span>
                              <div className="text-2xl font-black text-emerald-800 mt-0.5">
                                ₹{Number(empDetails?.salary_breakdown?.ctc || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-emerald-700 font-bold block">Net In-Hand Take Home</span>
                              <span className="text-lg font-black text-slate-900">
                                ₹{Number(empDetails?.salary_breakdown?.net_take_home || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Calculation Breakdown Table */}
                          <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs">
                              Indian Statutory Salary Component Breakdown
                            </div>
                            <div className="p-4 space-y-2.5">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Basic Pay (50% of CTC)</span>
                                <span className="font-bold text-slate-900">₹{Number(empDetails?.salary_breakdown?.basic_salary || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">House Rent Allowance - HRA (30% of CTC)</span>
                                <span className="font-bold text-slate-900">₹{Number(empDetails?.salary_breakdown?.hra || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Special Allowances (20% of CTC)</span>
                                <span className="font-bold text-slate-900">₹{Number(empDetails?.salary_breakdown?.special_allowances || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-rose-600 pt-2 border-t border-slate-100">
                                <span>Provident Fund (PF) Deduction</span>
                                <span className="font-bold">-₹{Number(empDetails?.salary_breakdown?.pf_deduction || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-rose-600">
                                <span>Professional Tax (PT) Deduction</span>
                                <span className="font-bold">-₹{Number(empDetails?.salary_breakdown?.pt_deduction || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                                <span>Calculated Net Salary</span>
                                <span className="text-emerald-700">₹{Number(empDetails?.salary_breakdown?.net_take_home || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Recent Pay Slips */}
                          {empDetails?.payroll_history && empDetails.payroll_history.length > 0 && (
                            <div>
                              <span className="text-xs font-bold text-slate-700 block mb-2">Recent Disbursed Pay Slips</span>
                              <div className="space-y-1.5">
                                {empDetails.payroll_history.map((slip) => (
                                  <div key={slip.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-slate-900">{slip.month}</span>
                                      <span className="block text-[10px] text-slate-400 font-mono">{slip.payslip_number}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-emerald-700">₹{Number(slip.net_salary).toLocaleString('en-IN')}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPayslip(slip)}
                                        className="btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                      >
                                        View Slip
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-12 text-center text-slate-400">
                          <Lock size={32} className="mx-auto mb-2 text-amber-500" />
                          <p className="font-bold text-slate-700">Salary Information Encrypted</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Only the Founder and Executive Leadership can decrypt compensation details.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 3: ATTENDANCE HISTORY */}
                  {modalSubTab === 'attendance' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Recent Biometric Attendance Records</span>
                      {empDetails?.recent_attendance && empDetails.recent_attendance.length > 0 ? (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase">
                                <th className="py-2 px-3">Date</th>
                                <th className="py-2 px-3">Status</th>
                                <th className="py-2 px-3">Check In / Out</th>
                                <th className="py-2 px-3">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {empDetails.recent_attendance.map((att) => (
                                <tr key={att.id}>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">{att.date}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${att.status === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : att.status === 'Work From Home'
                                        ? 'bg-blue-100 text-blue-800'
                                        : att.status === 'On Leave'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}>
                                      {att.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                    {att.check_in || '09:15'} - {att.check_out || '18:30'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">
                                    {att.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400">No recent attendance records.</div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 4: ASSIGNED COMPANY ASSETS (FROM INVENTORY) */}
                  {modalSubTab === 'assets' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Company Hardware &amp; Media Equipment Deployed</span>
                      {empDetails?.assigned_assets && empDetails.assigned_assets.length > 0 ? (
                        <div className="space-y-2">
                          {empDetails.assigned_assets.map((asset) => (
                            <div key={asset.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                                  <Laptop size={16} />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{asset.name}</div>
                                  <div className="text-[10.5px] text-slate-400">
                                    Tag: <span className="font-mono text-amber-700">{asset.asset_tag}</span> &bull; S/N: {asset.serial_number || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-slate-900">₹{Number(asset.purchase_cost).toLocaleString('en-IN')}</span>
                                <span className="block text-[10px] text-emerald-600 font-bold">In Use &bull; {asset.location}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400">
                          <Laptop size={28} className="mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-600">No hardware assets currently assigned</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Assets can be assigned from the Stock &amp; Equipments page.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 5: ACTIVE PROJECTS */}
                  {modalSubTab === 'projects' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Assigned Active Projects</span>
                      {empDetails?.assigned_projects && empDetails.assigned_projects.length > 0 ? (
                        <div className="space-y-2">
                          {empDetails.assigned_projects.map((proj) => (
                            <div key={proj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900">{proj.name}</span>
                                <span className="block text-[10px] text-slate-400">{proj.service_type} &bull; Stage: {proj.workflow_stage}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900">
                                {proj.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400">No active project assignments.</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-400">JRAM Groups Business OS &bull; HR Profile</span>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="btn-secondary text-xs font-bold px-4 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: PRINTABLE CORPORATE PAY SLIP MODAL
          ============================================================ */}
      {payslipModalOpen && activePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pay Slip Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    J
                  </div>
                  <span className="font-black tracking-tight text-sm">JRAM Groups Business OS</span>
                </div>
                <h3 className="font-extrabold text-base text-amber-300">
                  Salary Pay Slip &bull; {activePayslip.month}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Voucher: {activePayslip.payslip_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayslipModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pay Slip Details Box */}
            <div className="p-6 space-y-4 text-xs">
              {/* Employee Meta */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Employee Name</span>
                  <span className="font-bold text-slate-900">{activePayslip.employee_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Designation</span>
                  <span className="font-bold text-slate-900">{activePayslip.designation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Employee ID</span>
                  <span className="font-bold font-mono text-slate-900">{activePayslip.employee_id_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Disbursement Status</span>
                  <span className="font-bold text-emerald-700">{activePayslip.payment_status}</span>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 text-[10.5px] font-bold text-slate-600">
                      <th className="py-2 px-3">Earnings Component</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-2 px-3">Basic Pay (50%)</td>
                      <td className="py-2 px-3 text-right font-medium">₹{Number(activePayslip.basic_salary).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">House Rent Allowance (HRA 30%)</td>
                      <td className="py-2 px-3 text-right font-medium">₹{Number(activePayslip.hra).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Special Executive Allowances (20%)</td>
                      <td className="py-2 px-3 text-right font-medium">₹{Number(activePayslip.allowances).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-rose-50/50 text-rose-700">
                      <td className="py-2 px-3">Statutory Deductions (PF &amp; PT)</td>
                      <td className="py-2 px-3 text-right font-bold">-₹{Number(activePayslip.deductions).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-emerald-50 text-emerald-900 font-black">
                      <td className="py-2.5 px-3 text-sm">Net Take-Home Disbursed</td>
                      <td className="py-2.5 px-3 text-right text-sm font-black">
                        ₹{Number(activePayslip.net_salary).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed border-t pt-2">
                This is an authorized computer-generated payroll voucher issued under JRAM Groups Corporate Human Resources.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayslipModalOpen(false)}
                  className="btn-secondary px-4 py-1.5 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-banner-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print Pay Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: ONBOARD NEW EMPLOYEE (80% WIDTH & COMPLETE 16 FIELDS)
          ============================================================ */}
      {addModalOpen && (
        <div className="modal-backdrop-custom fixed inset-0 z-[1060] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] shadow-2xl border border-slate-200/90 w-[84vw] max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center shadow-md shadow-amber-500/20">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2.5">
                    New Employee Onboarding
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-100/80 text-amber-950 border border-amber-300/60">
                      {form.employee_id || 'AUTO-ID'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete candidate personal records, statutory IDs, employment contract, and granular access controls
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body with Organized Section Cards & Generous Breathing Space */}
            <form onSubmit={handleSaveEmployee} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-7 text-xs bg-slate-50/40">
              {/* 1. Personal & Contact Information Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs flex-shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      1. Personal &amp; Contact Details
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Legal candidate name, username login credentials, contact phones, and addresses
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      required
                      className="form-input"
                      placeholder="e.g. Arun"
                      value={form.user.first_name}
                      onChange={(e) => {
                        const fn = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          user: {
                            ...prev.user,
                            first_name: fn,
                            username: prev.user.username || `${fn.toLowerCase()}_${(prev.user.last_name || '').toLowerCase()}`.replace(/[^a-z0-9_]/g, '')
                          }
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Last Name *</label>
                    <input
                      required
                      className="form-input"
                      placeholder="e.g. Kumar"
                      value={form.user.last_name}
                      onChange={(e) => {
                        const ln = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          user: {
                            ...prev.user,
                            last_name: ln,
                            username: prev.user.username || `${(prev.user.first_name || '').toLowerCase()}_${ln.toLowerCase()}`.replace(/[^a-z0-9_]/g, '')
                          }
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label">Username *</label>
                    <input
                      required
                      className="form-input font-mono"
                      placeholder="e.g. arun_kumar"
                      value={form.user.username}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          user: { ...form.user, username: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">Date of Birth (DOB) *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Primary Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={form.user.phone}
                      onChange={(e) => setForm({ ...form, user: { ...form.user, phone: e.target.value } })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Alternate Number / Emergency Contact</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98765 00000"
                      value={form.phone_secondary}
                      onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">Official Mail ID (Company Work Email)</label>
                    <input
                      type="email"
                      className="form-input font-mono"
                      placeholder="arun@jramgroups.com"
                      value={form.official_email}
                      onChange={(e) => setForm({ ...form, official_email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Personal / Account Login Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input font-mono"
                      placeholder="arun.personal@gmail.com"
                      value={form.user.email}
                      onChange={(e) => setForm({ ...form, user: { ...form.user, email: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">Permanent Address *</label>
                    <textarea
                      required
                      rows={3}
                      className="form-input"
                      placeholder="Door No, Street Name, City, State, Pincode"
                      value={form.address}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          address: val,
                          current_address: sameAsPermAddress ? val : prev.current_address
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="form-label mb-0">Current Residential Address *</label>
                      <label className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5 cursor-pointer select-none bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                        <input
                          type="checkbox"
                          checked={sameAsPermAddress}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAsPermAddress(checked);
                            if (checked) {
                              setForm((prev) => ({ ...prev, current_address: prev.address }));
                            }
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        Same as permanent
                      </label>
                    </div>
                    <textarea
                      required
                      rows={3}
                      className="form-input"
                      placeholder="Current living address"
                      value={form.current_address}
                      disabled={sameAsPermAddress}
                      onChange={(e) => setForm({ ...form, current_address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Identity & Statutory Verification Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs flex-shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      2. Statutory &amp; Identity Verification
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Government issued Aadhaar Card and PAN tax compliance records
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">Aadhaar Card Number</label>
                    <input
                      maxLength={16}
                      className="form-input font-mono"
                      placeholder="12-digit Aadhaar (e.g. 5432 1098 7654)"
                      value={form.aadhar_number}
                      onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">PAN Card Number</label>
                    <input
                      maxLength={10}
                      className="form-input font-mono uppercase"
                      placeholder="10-digit PAN (e.g. ABCDE1234F)"
                      value={form.pan_number}
                      onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Professional & Employment Details Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs flex-shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      3. Employment &amp; Compensation Details
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Department, designation, tenure commitment, experience, and monthly CTC
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">Department *</label>
                    <select
                      required
                      className="form-input font-bold"
                      value={form.user.department}
                      onChange={(e) => setForm({ ...form, user: { ...form.user, department: e.target.value } })}
                    >
                      <option value="Engineering & Tech">Engineering &amp; Tech</option>
                      <option value="Digital Marketing">Digital Marketing &amp; Media</option>
                      <option value="Sales & CRM">Sales &amp; Business Development</option>
                      <option value="UI/UX Design">UI/UX &amp; Creative Design</option>
                      <option value="Accounts & Finance">Accounts &amp; Finance</option>
                      <option value="Operations & Assets">Operations &amp; Logistics</option>
                      <option value="Human Resources">Human Resources (HR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Designation *</label>
                    <input
                      required
                      className="form-input"
                      placeholder="e.g. Software Engineer"
                      value={form.user.designation}
                      onChange={(e) => setForm({ ...form, user: { ...form.user, designation: e.target.value } })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Joining Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={form.joining_date}
                      onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  <div>
                    <label className="form-label">Work Commitment (Tenure Duration) *</label>
                    <select
                      required
                      className="form-input font-bold"
                      value={form.work_commitment}
                      onChange={(e) => setForm({ ...form, work_commitment: e.target.value })}
                    >
                      <option value="1 Year Commitment">1 Year Commitment</option>
                      <option value="2 Years Commitment">2 Years Commitment</option>
                      <option value="3 Years Commitment">3 Years Commitment</option>
                      <option value="Permanent (Long-Term)">Permanent (Long-Term)</option>
                      <option value="6 Months Probation / Intern">6 Months Probation / Intern</option>
                      <option value="Contractual (Project Based)">Contractual (Project Based)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Experience in Years *</label>
                    <select
                      required
                      className="form-input font-bold"
                      value={form.experience_years}
                      onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                    >
                      <option value="Fresher / Entry Level">Fresher / Entry Level</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 - 5 Years">3 - 5 Years</option>
                      <option value="5 - 8 Years">5 - 8 Years</option>
                      <option value="8+ Years (Lead / Principal)">8+ Years (Lead / Principal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Monthly CTC (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        required
                        style={{ paddingLeft: '2rem' }}
                        className="form-input font-mono font-bold"
                        placeholder="75000"
                        value={form.salary_display}
                        onChange={(e) => setForm({ ...form, salary_display: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Skills Card (Multiple Select) */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs flex-shrink-0">
                      <Tag size={16} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                        4. Skills &amp; Competencies (Multiple Select)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click chips to toggle competencies or enter custom skills below
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60 shadow-2xs">
                    {form.skills?.length || 0} Skills Selected
                  </span>
                </div>

                {/* Active Skills Chips */}
                <div className="min-h-[46px] p-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-wrap items-center gap-2">
                  {form.skills && form.skills.length > 0 ? (
                    form.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 font-bold text-[11.5px] shadow-2xs group border border-amber-300/70"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSkill(s)}
                          className="text-amber-800 hover:text-red-600 rounded-full hover:bg-amber-200 p-0.5 transition-colors cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic px-1">
                      No skills selected yet. Click pills below or type custom skill.
                    </span>
                  )}
                </div>

                {/* Popular Skills Multi-Select Pills */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">Popular Technologies &amp; Skill Competencies:</span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.map((skill) => {
                      const isSelected = form.skills?.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                          <span>{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Skill Input */}
                <div className="flex items-center gap-2.5 max-w-md pt-1">
                  <input
                    className="form-input text-xs"
                    placeholder="Type custom skill (e.g. Docker, Sales) &amp; click Add..."
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSkill(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="btn-secondary whitespace-nowrap text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    + Add Skill
                  </button>
                </div>
              </div>

              {/* 5. Access Control Card: Role Preset Cards & Page Permissions */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs flex-shrink-0">
                      <Lock size={16} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                        5. Access Control: Role Preset Cards &amp; Page Permissions
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click any role card to automatically populate default permissions, or customize page access checkboxes below
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-900 text-amber-400 self-start sm:self-auto shadow-xs border border-slate-800">
                    {form.custom_permissions?.length || 0} / {ALL_MODULES.length} Pages Allowed
                  </span>
                </div>

                {/* 5 Role Preset Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {ROLE_PRESETS.map((preset) => {
                    const IconComponent = preset.icon;
                    const isSelected = form.user.role === preset.key;

                    return (
                      <div
                        key={preset.key}
                        onClick={() => handleSelectRolePreset(preset)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 group ${isSelected
                            ? 'border-amber-500 bg-amber-50/50 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-700'}`}>
                            <IconComponent size={18} />
                          </div>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xs">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-bold text-slate-400 group-hover:text-slate-600">Select</span>
                          )}
                        </div>

                        <div>
                          <h5 className="font-black text-slate-900 text-xs">
                            {preset.label}
                          </h5>
                          <p className="text-[10.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {preset.desc}
                          </p>
                        </div>

                        <div className="text-[10px] font-extrabold text-amber-900 pt-2 border-t border-slate-100">
                          {preset.defaultModules.length} default pages
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Granular Page Controls / Checkboxes */}
                <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                    <div>
                      <h5 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Page Controls &amp; Granular Module Access</span>
                        <span className="text-[10px] font-medium text-slate-400">(Overrides role defaults)</span>
                      </h5>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Check or uncheck individual pages to give access regardless of role
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, custom_permissions: ALL_MODULES.map((m) => m.key) }))}
                        className="text-[10.5px] font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, custom_permissions: [] }))}
                        className="text-[10.5px] font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-red-50 transition-all cursor-pointer shadow-2xs"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ALL_MODULES.map((mod) => {
                      const ModIcon = mod.icon;
                      const isAllowed = form.custom_permissions?.includes(mod.key);

                      return (
                        <div
                          key={mod.key}
                          onClick={() => handleToggleModule(mod.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${isAllowed
                              ? 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-300/40 text-slate-900'
                              : 'bg-white/60 border-slate-200/70 text-slate-400 hover:bg-white hover:border-slate-300'
                            }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isAllowed ? 'bg-amber-400 text-slate-950 font-black shadow-2xs' : 'bg-slate-100 text-slate-500'}`}>
                            <ModIcon size={14} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold leading-tight truncate">
                              {mod.label}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {mod.desc}
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={Boolean(isAllowed)}
                            onChange={() => { }}
                            className="rounded text-amber-500 focus:ring-amber-400 flex-shrink-0 pointer-events-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="px-8 py-4.5 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 mt-6 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 z-10 shadow-lg">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">Selected Role:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-extrabold text-[10.5px] uppercase border border-amber-200">
                    {form.user.role}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-emerald-600">
                    {form.custom_permissions?.length || 0} Pages Allowed
                  </span>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    className="btn-light-custom"
                    onClick={() => setAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-warning-custom flex items-center gap-2 shadow-md shadow-amber-500/20">
                    <UserPlus size={15} />
                    <span>Onboard &amp; Create Account</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

