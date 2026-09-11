const API_BASE_URL = 'http://localhost:8000/api';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const defaultHeaders = {
    'Accept': 'application/json',
  };
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object' && !isFormData) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.detail || `HTTP Error ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

const STORAGE_KEY = 'crm_active_user';

export const api = {
  // Auth & Roles
  auth: {
    getActiveUser: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    },
    setActiveUser: (user) => {
      try {
        if (user) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error(e);
      }
    },
    login: async (credentials) => {
      const res = await fetchAPI('/auth/login/', {
        method: 'POST',
        body: credentials,
      });
      if (res.success && res.user) {
        api.auth.setActiveUser(res.user);
      }
      return res;
    },
    getMe: async () => {
      const active = api.auth.getActiveUser();
      const query = active ? `?role=${active.role}&userId=${active.id}` : '';
      const res = await fetchAPI(`/auth/me/${query}`);
      if (res.success && res.user) {
        api.auth.setActiveUser(res.user);
      }
      return res;
    },
    switchRole: async (role) => {
      // 1. Cleanly clear previous session
      api.auth.setActiveUser(null);
      // 2. Switch to new role account on backend
      const res = await fetchAPI('/auth/switch-role/', { method: 'POST', body: { role } });
      if (res.success && res.user) {
        // 3. Establish new active role session
        api.auth.setActiveUser(res.user);
      }
      return res;
    },
    getProfile: async () => {
      const active = api.auth.getActiveUser();
      const query = active ? `?role=${active.role}&userId=${active.id}` : '';
      const res = await fetchAPI(`/auth/profile/${query}`);
      if (res.success && res.user) {
        api.auth.setActiveUser(res.user);
      }
      return res;
    },
    updateProfile: async (formDataOrData) => {
      const active = api.auth.getActiveUser();
      const query = active ? `?role=${active.role}&userId=${active.id}` : '';
      const res = await fetchAPI(`/auth/profile/${query}`, {
        method: 'POST',
        body: formDataOrData,
      });
      if (res.success && res.user) {
        api.auth.setActiveUser(res.user);
      }
      return res;
    },
    changePassword: async (data) => {
      const active = api.auth.getActiveUser();
      const payload = {
        ...data,
        role: active?.role,
        userId: active?.id,
      };
      return fetchAPI('/auth/change-password/', {
        method: 'POST',
        body: payload,
      });
    },
    logout: () => {
      api.auth.setActiveUser(null);
    },
  },

  // Users & Staff
  users: {
    list: (params = '') => fetchAPI(`/users/${params ? `?${params}` : ''}`),
  },

  // Clients
  clients: {
    list: (params = '') => fetchAPI(`/clients/${params ? `?${params}` : ''}`),
    getOverview: (id) => fetchAPI(`/clients/${id}/overview/`),
    create: (data) => fetchAPI('/clients/', { method: 'POST', body: data }),
    update: (id, data) => fetchAPI(`/clients/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => fetchAPI(`/clients/${id}/`, { method: 'DELETE' }),
  },

  // Projects
  projects: {
    list: (params = '') => fetchAPI(`/projects/${params ? `?${params}` : ''}`),
    getUrgent: () => fetchAPI('/projects/urgent/'),
    create: (data) => fetchAPI('/projects/', { method: 'POST', body: data }),
    update: (id, data) => fetchAPI(`/projects/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => fetchAPI(`/projects/${id}/`, { method: 'DELETE' }),
  },

  // Tasks
  tasks: {
    list: (params = '') => fetchAPI(`/projects/tasks/${params ? `?${params}` : ''}`),
    getMyTasks: () => fetchAPI('/projects/tasks/my_tasks/'),
    create: (data) => fetchAPI('/projects/tasks/', { method: 'POST', body: data }),
    update: (id, data) => fetchAPI(`/projects/tasks/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => fetchAPI(`/projects/tasks/${id}/`, { method: 'DELETE' }),
  },

  // Employees
  employees: {
    list: (params = '') => fetchAPI(`/employees/${params ? `?${params}` : ''}`),
    getDetails: (id) => fetchAPI(`/employees/${id}/details/`),
    create: (data) => fetchAPI('/employees/', { method: 'POST', body: data }),
    update: (id, data) => fetchAPI(`/employees/${id}/`, { method: 'PUT', body: data }),
    delete: (id) => fetchAPI(`/employees/${id}/`, { method: 'DELETE' }),

    // Payroll & Salary Tracking
    getPayroll: (params = '') => fetchAPI(`/employees/payroll/${params ? `?${params}` : ''}`),
    createPayroll: (data) => fetchAPI('/employees/payroll/', { method: 'POST', body: data }),
    generatePayrollBatch: (data) => fetchAPI('/employees/payroll/generate_batch/', { method: 'POST', body: data }),
    markPayrollPaid: (id, data = {}) => fetchAPI(`/employees/payroll/${id}/mark_paid/`, { method: 'POST', body: data }),

    // Attendance Tracking & Reports
    getAttendance: (params = '') => fetchAPI(`/employees/attendance/${params ? `?${params}` : ''}`),
    markAttendance: (data) => fetchAPI('/employees/attendance/mark_daily/', { method: 'POST', body: data }),
    getAttendanceReport: (params = '') => fetchAPI(`/employees/attendance/monthly_report/${params ? `?${params}` : ''}`),
  },


  // Finance
  finance: {
    getQuotations: (params = '') => fetchAPI(`/finance/quotations/${params ? `?${params}` : ''}`),
    getQuotation: (id) => fetchAPI(`/finance/quotations/${id}/`),
    createQuotation: (data) => fetchAPI('/finance/quotations/', { method: 'POST', body: data }),
    updateQuotation: (id, data) => fetchAPI(`/finance/quotations/${id}/`, { method: 'PUT', body: data }),
    deleteQuotation: (id) => fetchAPI(`/finance/quotations/${id}/`, { method: 'DELETE' }),
    convertQuotationToInvoice: (id) => fetchAPI(`/finance/quotations/${id}/convert_to_invoice/`, { method: 'POST' }),

    getInvoices: (params = '') => fetchAPI(`/finance/invoices/${params ? `?${params}` : ''}`),
    getInvoice: (id) => fetchAPI(`/finance/invoices/${id}/`),
    createInvoice: (data) => fetchAPI('/finance/invoices/', { method: 'POST', body: data }),
    updateInvoice: (id, data) => fetchAPI(`/finance/invoices/${id}/`, { method: 'PUT', body: data }),
    deleteInvoice: (id) => fetchAPI(`/finance/invoices/${id}/`, { method: 'DELETE' }),
    markInvoicePaid: (id, paymentMethod = 'Bank Transfer') => fetchAPI(`/finance/invoices/${id}/mark_paid/`, { method: 'POST', body: { payment_method: paymentMethod } }),

    getPayments: (params = '') => fetchAPI(`/finance/payments/${params ? `?${params}` : ''}`),

    // Income Tracking
    getIncome: (params = '') => fetchAPI(`/finance/income/${params ? `?${params}` : ''}`),
    getIncomeStats: () => fetchAPI('/finance/income/stats/'),
    createIncome: (data) => fetchAPI('/finance/income/', { method: 'POST', body: data }),
    updateIncome: (id, data) => fetchAPI(`/finance/income/${id}/`, { method: 'PUT', body: data }),
    deleteIncome: (id) => fetchAPI(`/finance/income/${id}/`, { method: 'DELETE' }),

    // Expense Tracking
    getExpenses: (params = '') => fetchAPI(`/finance/expenses/${params ? `?${params}` : ''}`),
    getExpenseStats: () => fetchAPI('/finance/expenses/stats/'),
    createExpense: (data) => fetchAPI('/finance/expenses/', { method: 'POST', body: data }),
    updateExpense: (id, data) => fetchAPI(`/finance/expenses/${id}/`, { method: 'PUT', body: data }),
    deleteExpense: (id) => fetchAPI(`/finance/expenses/${id}/`, { method: 'DELETE' }),
  },

  // Stock & Equipments (Inventory & Assets)
  inventory: {
    getAssets: (params = '') => fetchAPI(`/inventory/assets/${params ? `?${params}` : ''}`),
    getAssetStats: () => fetchAPI('/inventory/assets/stats/'),
    createAsset: (data) => fetchAPI('/inventory/assets/', { method: 'POST', body: data }),
    updateAsset: (id, data) => fetchAPI(`/inventory/assets/${id}/`, { method: 'PUT', body: data }),
    deleteAsset: (id) => fetchAPI(`/inventory/assets/${id}/`, { method: 'DELETE' }),
    assignAsset: (id, data) => fetchAPI(`/inventory/assets/${id}/assign/`, { method: 'POST', body: data }),

    getStock: (params = '') => fetchAPI(`/inventory/stock/${params ? `?${params}` : ''}`),
    getStockStats: () => fetchAPI('/inventory/stock/stats/'),
    createStock: (data) => fetchAPI('/inventory/stock/', { method: 'POST', body: data }),
    updateStock: (id, data) => fetchAPI(`/inventory/stock/${id}/`, { method: 'PUT', body: data }),
    deleteStock: (id) => fetchAPI(`/inventory/stock/${id}/`, { method: 'DELETE' }),
    adjustStock: (id, data) => fetchAPI(`/inventory/stock/${id}/adjust_stock/`, { method: 'POST', body: data }),
  },


  // Digital Marketing
  marketing: {
    listSocialClients: (params = '') => fetchAPI(`/marketing/social-clients/${params ? `?${params}` : ''}`),
    createSocialClient: (data) => fetchAPI('/marketing/social-clients/', { method: 'POST', body: data }),
    updateSocialClient: (id, data) => fetchAPI(`/marketing/social-clients/${id}/`, { method: 'PATCH', body: data }),
    deleteSocialClient: (id) => fetchAPI(`/marketing/social-clients/${id}/`, { method: 'DELETE' }),
  },

  // Communications
  communications: {
    sendWhatsApp: (data) => fetchAPI('/communications/send-whatsapp/', { method: 'POST', body: data }),
    sendEmail: (data) => fetchAPI('/communications/send-email/', { method: 'POST', body: data }),
    getWhatsAppLogs: () => fetchAPI('/communications/whatsapp-logs/'),
    getEmailLogs: () => fetchAPI('/communications/email-logs/'),
  },

  // Notifications
  notifications: {
    list: () => fetchAPI('/notifications/'),
    markAllRead: () => fetchAPI('/notifications/mark_all_read/', { method: 'POST' }),
    markRead: (id) => fetchAPI(`/notifications/${id}/mark_read/`, { method: 'POST' }),
  },

  // Reports & Dashboard
  reports: {
    getDashboardStats: () => fetchAPI('/reports/dashboard-stats/'),
    getAnalytics: () => fetchAPI('/reports/analytics/'),
    getMasterReport: () => fetchAPI('/reports/master-report/'),
  },

  // Audit Logs
  audit: {
    list: (params = '') => fetchAPI(`/audit/${params ? `?${params}` : ''}`),
  },
};
