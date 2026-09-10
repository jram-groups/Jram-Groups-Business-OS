// ============================================================
// JRAM GROUPS — WORKFLOW METHODOLOGY & ASSIGNMENT HIERARCHY
// ============================================================

export const WORKFLOW_METHODOLOGIES = {
  SDLC: {
    id: 'SDLC',
    name: 'SDLC (Software Development Life Cycle)',
    shortName: 'SDLC',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerGradient: 'from-indigo-600 to-blue-700',
    accentColor: '#4f46e5',
    stages: [
      {
        name: 'Requirements Analysis',
        activities: [
          'Requirement Gathering',
          'Requirement Documentation',
          'Requirement Validation',
        ],
      },
      {
        name: 'System Design',
        activities: [
          'System Architecture',
          'Database Design',
          'User Interface Design',
        ],
      },
      {
        name: 'Implementation (Coding)',
        activities: [
          'Module Development',
          'Source Code',
          'Code Integration',
        ],
      },
      {
        name: 'Testing',
        activities: [
          'Unit Testing',
          'Integration Testing',
          'System Testing',
          'Bug Fixing',
        ],
      },
      {
        name: 'Deployment',
        activities: [
          'Software Installation',
          'System Configuration',
          'User Release',
        ],
      },
      {
        name: 'Maintenance',
        activities: [
          'Bug Fixes',
          'Performance Improvement',
          'Software Updates',
        ],
      },
    ],
  },
  Waterfall: {
    id: 'Waterfall',
    name: 'Waterfall Methodology',
    shortName: 'Waterfall',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    headerGradient: 'from-cyan-600 to-teal-700',
    accentColor: '#0891b2',
    stages: [
      {
        name: 'Requirements Analysis',
        activities: [
          'Requirement Gathering',
          'Requirement Documentation',
          'Requirement Validation',
        ],
      },
      {
        name: 'System Design',
        activities: [
          'System Architecture',
          'Database Design',
          'UI Design',
        ],
      },
      {
        name: 'Implementation (Coding)',
        activities: [
          'Module Development',
          'Source Code',
          'Code Integration',
        ],
      },
      {
        name: 'Testing',
        activities: [
          'Unit Testing',
          'Integration Testing',
          'System Testing',
          'Bug Fixing',
        ],
      },
      {
        name: 'Deployment',
        activities: [
          'Software Installation',
          'Configuration',
          'User Release',
        ],
      },
      {
        name: 'Maintenance',
        activities: [
          'Bug Fixes',
          'Performance Improvements',
          'Software Updates',
        ],
      },
    ],
  },
  Agile: {
    id: 'Agile',
    name: 'Agile Framework',
    shortName: 'Agile',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    headerGradient: 'from-emerald-600 to-teal-700',
    accentColor: '#059669',
    stages: [
      {
        name: 'Planning',
        activities: [
          'Project Vision',
          'Sprint Planning',
          'Resource Planning',
        ],
      },
      {
        name: 'Requirements Analysis',
        activities: [
          'User Stories',
          'Product Backlog',
          'Requirement Prioritization',
        ],
      },
      {
        name: 'Design',
        activities: [
          'UI/UX Design',
          'System Architecture',
          'Prototype Development',
        ],
      },
      {
        name: 'Implementation',
        activities: [
          'Sprint Development',
          'Coding',
          'Code Integration',
        ],
      },
      {
        name: 'Testing',
        activities: [
          'Continuous Testing',
          'Unit Testing',
          'Bug Fixing',
        ],
      },
      {
        name: 'Review & Feedback',
        activities: [
          'Sprint Review',
          'Customer Feedback',
          'Requirement Changes',
        ],
      },
      {
        name: 'Deployment',
        activities: [
          'Release Planning',
          'Software Deployment',
          'Product Release',
        ],
      },
      {
        name: 'Maintenance',
        activities: [
          'Updates',
          'Performance Improvement',
          'Continuous Support',
        ],
      },
    ],
  },
};

/**
 * Assignment Hierarchy Definition
 * Founder -> CEO, Manager
 * CEO -> Manager (Project based)
 * Manager -> Team Head
 * Team Head -> Employee, Intern/Trainee
 * Employee & Trainee -> Execution & logging hours only
 */
export const ROLE_ASSIGNMENT_RULES = {
  FOUNDER: {
    roleName: 'Founder',
    allowedTargetRoles: ['CEO', 'MANAGER'],
    label: 'Founder Delegation',
    hint: 'Founder can assign projects and strategic modules to CEO and General Manager.',
  },
  CEO: {
    roleName: 'CEO',
    allowedTargetRoles: ['MANAGER'],
    label: 'Executive Assignment',
    hint: 'CEO delegates project milestones and operational delivery to General Manager.',
  },
  MANAGER: {
    roleName: 'Manager',
    allowedTargetRoles: ['TEAM_HEAD'],
    label: 'Managerial Allocation',
    hint: 'Manager assigns project engineering tracks to Team Head.',
  },
  TEAM_HEAD: {
    roleName: 'Team Head',
    allowedTargetRoles: ['EMPLOYEE', 'TRAINEE'],
    label: 'Team Lead Distribution',
    hint: 'Team Head distributes development modules to Employees and small modules to Interns/Trainees.',
  },
  EMPLOYEE: {
    roleName: 'Employee',
    allowedTargetRoles: [],
    label: 'Staff Member',
    hint: 'Staff members execute assigned modules and record daily execution hours.',
  },
  TRAINEE: {
    roleName: 'Trainee / Intern',
    allowedTargetRoles: [],
    label: 'Intern / Trainee',
    hint: 'Interns execute assigned tasks and record learning hours.',
  },
};

/**
 * Filter users based on hierarchy rules for current logged-in role
 */
export function filterAssignableUsers(users = [], currentRole = 'FOUNDER', allowOverride = false) {
  if (!Array.isArray(users)) return [];
  const upperRole = (currentRole || 'FOUNDER').toUpperCase();
  const rule = ROLE_ASSIGNMENT_RULES[upperRole];

  if (!rule || rule.allowedTargetRoles.length === 0) {
    if (allowOverride && upperRole === 'FOUNDER') return users;
    return [];
  }

  if (allowOverride && upperRole === 'FOUNDER') {
    return users;
  }

  return users.filter((u) => rule.allowedTargetRoles.includes(u.role));
}

/**
 * Role badge styling helper
 */
export function getRoleBadgeClass(role) {
  switch (role) {
    case 'FOUNDER':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'CEO':
      return 'bg-purple-100 text-purple-900 border-purple-300';
    case 'MANAGER':
      return 'bg-blue-100 text-blue-900 border-blue-300';
    case 'TEAM_HEAD':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'EMPLOYEE':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case 'TRAINEE':
      return 'bg-teal-100 text-teal-900 border-teal-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getRoleDisplayName(role) {
  switch (role) {
    case 'FOUNDER':
      return 'Founder';
    case 'CEO':
      return 'CEO';
    case 'MANAGER':
      return 'Manager';
    case 'TEAM_HEAD':
      return 'Team Head';
    case 'EMPLOYEE':
      return 'Employee';
    case 'TRAINEE':
      return 'Intern / Trainee';
    default:
      return role || 'Staff';
  }
}
