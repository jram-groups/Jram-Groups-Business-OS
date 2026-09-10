// ============================================================
// JRAM GROUPS — ROLE-BASED ACCESS CONTROL (RBAC) ENGINE
// ============================================================

export const ROLES = {
  FOUNDER: 'FOUNDER',
  CEO: 'CEO',
  MANAGER: 'MANAGER',
  TEAM_HEAD: 'TEAM_HEAD',
  EMPLOYEE: 'EMPLOYEE',
  TRAINEE: 'TRAINEE',
};

export const ROLE_DETAILS = [
  {
    key: ROLES.FOUNDER,
    label: 'Founder',
    title: 'Founder & Group Director',
    badge: 'bg-amber-500 text-slate-950 font-black shadow-xs',
    badgeLight: 'bg-amber-100 text-amber-900 border-amber-300',
    color: 'amber',
    iconName: 'Crown',
    defaultUser: 'arun_founder',
    defaultName: 'Arun Kumar',
    accessScope: 'Full Master Access',
    description: 'Unrestricted master control across all business units, financial ledger, encrypted payroll, and audit logs.',
    allowedModules: [
      'dashboard', 'clients', 'projects', 'tasks', 'digital-marketing',
      'quotations', 'invoices', 'income', 'expenses', 'financial',
      'stock-equipments', 'inventory', 'employees', 'reports',
      'activity-logs', 'settings', 'profile'
    ],
  },
  {
    key: ROLES.CEO,
    label: 'CEO',
    title: 'Chief Executive Officer',
    badge: 'bg-purple-600 text-white font-black shadow-xs',
    badgeLight: 'bg-purple-100 text-purple-900 border-purple-300',
    color: 'purple',
    iconName: 'Briefcase',
    defaultUser: 'priya_ceo',
    defaultName: 'Priya Sharma',
    accessScope: 'Executive Strategic Access',
    description: 'Complete visibility into clients, projects, marketing, finances, invoices, and analytics. Audit logs & system settings are hidden.',
    allowedModules: [
      'dashboard', 'clients', 'projects', 'tasks', 'digital-marketing',
      'quotations', 'invoices', 'income', 'expenses', 'financial',
      'stock-equipments', 'inventory', 'employees', 'reports', 'profile'
    ],
  },
  {
    key: ROLES.MANAGER,
    label: 'Manager',
    title: 'General Manager',
    badge: 'bg-blue-600 text-white font-black shadow-xs',
    badgeLight: 'bg-blue-100 text-blue-900 border-blue-300',
    color: 'blue',
    iconName: 'UserCheck',
    defaultUser: 'rahul_manager',
    defaultName: 'Rahul Raj',
    accessScope: 'Operations & CRM Access',
    description: 'Manage clients, project Kanban, team tasks, marketing retainers, quotations, and invoice lists. Financial ledger, employees, and settings are hidden.',
    allowedModules: [
      'dashboard', 'clients', 'projects', 'tasks', 'digital-marketing',
      'quotations', 'invoices', 'income', 'expenses',
      'stock-equipments', 'inventory', 'profile'
    ],
  },
  {
    key: ROLES.TEAM_HEAD,
    label: 'Team Head',
    title: 'Tech Lead / Team Head',
    badge: 'bg-emerald-600 text-white font-black shadow-xs',
    badgeLight: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    color: 'emerald',
    iconName: 'Shield',
    defaultUser: 'divya_head',
    defaultName: 'Divya Menon',
    accessScope: 'Team & Delivery Lead',
    description: 'Track project milestones, assign and review tasks, log hours, and manage digital marketing content. Billing and financial tools are hidden.',
    allowedModules: [
      'dashboard', 'clients', 'projects', 'tasks', 'digital-marketing',
      'stock-equipments', 'inventory', 'profile'
    ],
  },
  {
    key: ROLES.EMPLOYEE,
    label: 'Employee',
    title: 'Senior Developer / Staff',
    badge: 'bg-slate-800 text-amber-300 font-black shadow-xs',
    badgeLight: 'bg-slate-100 text-slate-900 border-slate-300',
    color: 'slate',
    iconName: 'Code',
    defaultUser: 'rohan_dev',
    defaultName: 'Rohan Das',
    accessScope: 'Staff Task Workspace',
    description: 'View assigned projects, manage personal tasks, log working hours, and update delivery status.',
    allowedModules: [
      'dashboard', 'projects', 'tasks', 'profile'
    ],
  },
  {
    key: ROLES.TRAINEE,
    label: 'Trainee / Intern',
    title: 'Marketing & Dev Intern',
    badge: 'bg-teal-600 text-white font-black shadow-xs',
    badgeLight: 'bg-teal-100 text-teal-900 border-teal-300',
    color: 'teal',
    iconName: 'GraduationCap',
    defaultUser: 'kavya_intern',
    defaultName: 'Kavya Nair',
    accessScope: 'Assigned Tasks Only',
    description: 'Focused learning workspace for reviewing assigned tasks and logging completed execution hours.',
    allowedModules: [
      'dashboard', 'tasks', 'profile'
    ],
  },
];

/**
 * Check whether a given role can access a specific module/path
 */
export function hasAccess(role, moduleName) {
  const cleanModule = (moduleName || '').replace(/^\//, '').toLowerCase();
  if (cleanModule === 'profile') return true; // All authenticated users can access their profile
  if (!role) role = ROLES.FOUNDER;
  const config = ROLE_DETAILS.find((r) => r.key === role) || ROLE_DETAILS[0];
  return config.allowedModules.includes(cleanModule);
}

/**
 * Check if the role is allowed to perform administrative/mutation actions
 */
export function canPerform(role, action) {
  if (!role) role = ROLES.FOUNDER;
  
  switch (action) {
    case 'CREATE_CLIENT':
    case 'EDIT_CLIENT':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER].includes(role);
    case 'DELETE_CLIENT':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);

    case 'CREATE_PROJECT':
    case 'EDIT_PROJECT':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER, ROLES.TEAM_HEAD].includes(role);
    case 'DELETE_PROJECT':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);

    case 'CREATE_TASK':
    case 'DELETE_TASK':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER, ROLES.TEAM_HEAD].includes(role);
    case 'UPDATE_TASK_STATUS':
    case 'LOG_HOURS':
      return true; // All roles can log hours and update task progress

    case 'CREATE_QUOTATION':
    case 'EDIT_QUOTATION':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER].includes(role);
    case 'DELETE_QUOTATION':
    case 'CONVERT_TO_INVOICE':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);

    case 'CREATE_INVOICE':
    case 'EDIT_INVOICE':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER].includes(role);
    case 'MARK_INVOICE_PAID':
    case 'DELETE_INVOICE':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);

    case 'VIEW_FINANCIAL_LEDGER':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);

    case 'CREATE_INCOME':
    case 'EDIT_INCOME':
    case 'CREATE_EXPENSE':
    case 'EDIT_EXPENSE':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER].includes(role);
    case 'DELETE_INCOME':
    case 'DELETE_EXPENSE':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);

    case 'MANAGE_ASSETS':
    case 'ASSIGN_EQUIPMENT':
    case 'MANAGE_STOCK':
      return [ROLES.FOUNDER, ROLES.CEO, ROLES.MANAGER, ROLES.TEAM_HEAD].includes(role);
    case 'DELETE_ASSET':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);


    case 'VIEW_EMPLOYEE_DIRECTORY':
      return [ROLES.FOUNDER, ROLES.CEO].includes(role);
    case 'VIEW_ENCRYPTED_SALARY':
    case 'CREATE_EMPLOYEE':
    case 'DELETE_EMPLOYEE':
      return [ROLES.FOUNDER].includes(role);

    case 'MANAGE_SETTINGS':
    case 'VIEW_AUDIT_LOGS':
      return [ROLES.FOUNDER].includes(role);

    default:
      return false;
  }
}

/**
 * Retrieve metadata for a specific role
 */
export function getRoleConfig(role) {
  return ROLE_DETAILS.find((r) => r.key === (role || ROLES.FOUNDER)) || ROLE_DETAILS[0];
}
