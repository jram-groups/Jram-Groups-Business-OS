import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, Eye, MessageSquare, Mail, Phone, Building, 
  Building2, User, MapPin, CreditCard, Users, Sparkles, Globe, ArrowRight, 
  ChevronRight, ChevronLeft, Check, CheckCircle2, ShieldCheck, X, Share2, Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';
import ClientProfileModal from './ClientProfileModal';
import WhatsAppModal from '../common/WhatsAppModal';
import EmailModal from '../common/EmailModal';

const AVAILABLE_SERVICES = [
  'FullStack Web App',
  'Mobile Application (iOS/Android)',
  'UI/UX Design & Prototyping',
  'Cloud Infrastructure & DevOps',
  'SEO & Digital Marketing',
  'Custom ERP / CRM System',
  'AI & Automation Solutions',
  'Annual Maintenance (AMC)',
  'Branding & Creative Media',
];

const EMPTY_CLIENT = {
  // 1. Primary Contact Profile
  name: '',
  designation: '',
  email: '',
  secondary_email: '',
  phone: '',
  whatsapp: '',
  preferred_communication: 'WhatsApp',

  // 2. Company Details
  company: '',
  brand_name: '',
  business_type: 'Private Limited',
  industry: 'IT & Software Development',
  company_size: '11-50',
  website: '',

  // 3. Address & Location
  address: '',
  city: '',
  state: 'Tamil Nadu',
  postal_code: '',
  country: 'India',
  shipping_address: '',

  // 4. Tax & Invoicing
  gst_vat_number: '',
  pan_number: '',
  currency: 'INR',
  payment_terms: 'Net 30',

  // 5. Secondary SPOC
  secondary_contact_name: '',
  secondary_contact_designation: '',
  secondary_contact_email: '',
  secondary_contact_phone: '',

  // 6. CRM & Services
  client_status: 'Active',
  client_priority: 'Medium',
  lead_source: 'Website Inquiry',
  services_taken: [],
  social_media_accounts: {
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: '',
  },
  notes: '',
};

export default function Clients() {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();
  const role = user?.role || 'FOUNDER';

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [profileModal, setProfileModal] = useState(false);

  // Communications modals
  const [waModal, setWaModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [activeRecipient, setActiveRecipient] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let query = '';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (filterStatus) query += `client_status=${encodeURIComponent(filterStatus)}`;

      const res = await api.clients.list(query);
      const list = res.data || res.results || (Array.isArray(res) ? res : []);
      setClients(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, filterStatus]);

  const openCreateModal = () => {
    setForm(EMPTY_CLIENT);
    setActiveTab('profile');
    setFormModal(true);
  };

  const openEditModal = (client) => {
    setForm({
      ...EMPTY_CLIENT,
      ...client,
      social_media_accounts: {
        ...EMPTY_CLIENT.social_media_accounts,
        ...(client.social_media_accounts || {})
      },
      services_taken: Array.isArray(client.services_taken) ? client.services_taken : []
    });
    setActiveTab('profile');
    setFormModal(true);
  };

  // Direct save client (Only Client)
  const handleSaveClientOnly = async (e) => {
    if (e) e.preventDefault();
    if (!form.name?.trim()) {
      alert('Please fill in Client Full Name.');
      setActiveTab('profile');
      return;
    }
    if (!form.company?.trim()) {
      alert('Please fill in Company Name.');
      setActiveTab('company');
      return;
    }
    if (!form.email?.trim()) {
      alert('Please fill in Client Email.');
      setActiveTab('profile');
      return;
    }
    if (!form.phone?.trim()) {
      alert('Please fill in Phone / WhatsApp Number.');
      setActiveTab('profile');
      return;
    }

    try {
      if (form.id) {
        await api.clients.update(form.id, form);
      } else {
        await api.clients.create(form);
      }
      setFormModal(false);
      fetchClients();
    } catch (err) {
      alert(err.message || 'Error saving client');
    }
  };

  // Proceed to Step 2 (Project Form) WITHOUT SAVING TO DB YET!
  const handleProceedToProject = (e) => {
    if (e) e.preventDefault();
    if (!form.name?.trim()) {
      alert('Please fill in Client Full Name.');
      setActiveTab('profile');
      return;
    }
    if (!form.company?.trim()) {
      alert('Please fill in Company Name.');
      setActiveTab('company');
      return;
    }
    if (!form.email?.trim()) {
      alert('Please fill in Client Email.');
      setActiveTab('profile');
      return;
    }
    if (!form.phone?.trim()) {
      alert('Please fill in Phone / WhatsApp Number.');
      setActiveTab('profile');
      return;
    }

    // Close client modal and navigate to Project page with uncommitted draftClient in state
    setFormModal(false);
    navigate('/projects', {
      state: {
        draftClient: form,
        openWizard: true
      }
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this client record?')) {
      try {
        await api.clients.delete(id);
        fetchClients();
      } catch (err) {
        alert(err.message || 'Error deleting client');
      }
    }
  };

  const open360Profile = (id) => {
    setSelectedClientId(id);
    setProfileModal(true);
  };

  const triggerWhatsApp = (c) => {
    setActiveRecipient({ name: c.name, whatsapp: c.whatsapp || c.phone });
    setWaModal(true);
  };

  const triggerEmail = (c) => {
    setActiveRecipient({ name: c.name, email: c.email });
    setEmailModal(true);
  };

  const toggleService = (svc) => {
    const current = form.services_taken || [];
    if (current.includes(svc)) {
      setForm({ ...form, services_taken: current.filter(s => s !== svc) });
    } else {
      setForm({ ...form, services_taken: [...current, svc] });
    }
  };

  const copyPhoneToWhatsApp = () => {
    setForm({ ...form, whatsapp: form.phone });
  };

  const copyOfficeAddressToShipping = () => {
    const full = [form.address, form.city, form.state, form.postal_code, form.country].filter(Boolean).join(', ');
    setForm({ ...form, shipping_address: full });
  };

  const tabs = [
    { id: 'profile', label: '1. Contact Profile', icon: User },
    { id: 'company', label: '2. Company Info', icon: Building2 },
    { id: 'address', label: '3. Address & Location', icon: MapPin },
    { id: 'tax', label: '4. Tax & Billing', icon: CreditCard },
    { id: 'spoc', label: '5. Secondary SPOC', icon: Users },
    { id: 'crm', label: '6. CRM & Services', icon: Briefcase },
  ];

  const tabIndex = tabs.findIndex(t => t.id === activeTab);
  const prevTab = () => {
    if (tabIndex > 0) setActiveTab(tabs[tabIndex - 1].id);
  };
  const nextTab = () => {
    if (tabIndex < tabs.length - 1) setActiveTab(tabs[tabIndex + 1].id);
  };

  const canCreate = canPerform(role, 'CREATE_CLIENT');
  const canEdit = canPerform(role, 'EDIT_CLIENT');
  const canDelete = canPerform(role, 'DELETE_CLIENT');
  const canViewFinancial = canPerform(role, 'VIEW_FINANCIAL_LEDGER');

  return (
    <div className="page-container">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Client Management &amp; CRM</h1>
          <p className="page-desc">Complete 360° business relationships, profile details, company data, and pipeline onboarding</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="btn-warning-custom self-start sm:self-auto flex-shrink-0 flex items-center gap-2"
          >
            <Plus size={15} /> Add New Client
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="dashboard-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              style={{ paddingLeft: '2.5rem' }}
              className="w-full pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-400 font-medium"
              placeholder="Search clients by name, company, email, or industry..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Clients</option>
            <option value="Prospect">Prospects</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Client &amp; Company</th>
                <th className="col-hide-mobile">Contact Details</th>
                <th className="col-hide-tablet col-hide-mobile">Industry &amp; Entity</th>
                <th>Status</th>
                {canViewFinancial && <th className="col-hide-mobile">Total Revenue</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canViewFinancial ? 6 : 5} className="text-center py-10 text-slate-400 text-xs font-medium">
                    Loading Client Database...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={canViewFinancial ? 6 : 5} className="text-center py-10 text-slate-400 text-xs font-medium">
                    No client records found.
                  </td>
                </tr>
              ) : (
                clients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
                          {c.name ? c.name.split(' ').map(n => n[0]).join('') : 'C'}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-extrabold text-slate-900 cursor-pointer hover:text-amber-600 text-xs truncate flex items-center gap-1.5"
                            onClick={() => open360Profile(c.id)}
                          >
                            <span>{c.name}</span>
                            {c.designation && (
                              <span className="text-[10px] text-slate-400 font-medium">({c.designation})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium truncate">
                            {c.company} {c.city ? `• ${c.city}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="col-hide-mobile">
                      <div className="text-slate-800 text-xs font-medium flex items-center gap-1">
                        <Mail size={11} className="text-slate-400" /> {c.email}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-slate-400" /> {c.phone}
                      </div>
                    </td>
                    <td className="col-hide-tablet col-hide-mobile">
                      <div className="font-semibold text-slate-700 text-[11px] truncate max-w-[180px]">
                        {c.industry || c.business_type}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.business_type}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        c.client_status === 'Active' ? 'text-bg-success' : 
                        c.client_status === 'Prospect' ? 'text-bg-warning' : 'text-bg-secondary'
                      }`}>
                        {c.client_status}
                      </span>
                    </td>
                    {canViewFinancial && (
                      <td className="font-extrabold text-slate-900 text-xs col-hide-mobile">
                        ₹{Number(c.total_revenue || 0).toLocaleString('en-IN')}
                      </td>
                    )}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => open360Profile(c.id)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-amber-400 hover:text-slate-950 transition-all cursor-pointer"
                          title="360° Profile"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => triggerWhatsApp(c)}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                          title="WhatsApp"
                        >
                          <MessageSquare size={13} />
                        </button>
                        <button
                          onClick={() => triggerEmail(c)}
                          className="p-1.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                          title="Email"
                        >
                          <Mail size={13} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Multi-Tab Add / Edit Form Modal */}
      {formModal && (
        <div className="modal-backdrop-custom">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-0 shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    {form.id ? 'Edit Client Profile' : 'Add New Client'}
                    {!form.id && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                        Pipeline Step 1 of 3
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {form.id ? 'Update comprehensive client profile, company, and tax details' : 'Enter complete profile, company, and tax details. Proceed to attach Project next.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-4 overflow-x-auto text-xs font-semibold scrollbar-none">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isSelected = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-3 border-b-2 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                      isSelected
                        ? 'border-amber-500 text-amber-900 bg-white shadow-2xs rounded-t-xl'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-amber-600' : 'text-slate-400'} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: Profile & Contact */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Client Full Name (Primary Contact) *</label>
                      <input
                        required
                        className="form-input"
                        placeholder="e.g. John Doe, Rajesh Kannan"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Designation / Role in Company</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Managing Director, CEO, Procurement Head"
                        value={form.designation || ''}
                        onChange={e => setForm({ ...form, designation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Primary Business Email *</label>
                      <input
                        type="email"
                        required
                        className="form-input font-mono"
                        placeholder="client@company.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Secondary / Alternate Email</label>
                      <input
                        type="email"
                        className="form-input font-mono"
                        placeholder="accounts@company.com"
                        value={form.secondary_email || ''}
                        onChange={e => setForm({ ...form, secondary_email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Primary Phone Number *</label>
                      <input
                        required
                        className="form-input font-mono"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label font-bold text-slate-700 mb-0">WhatsApp Number</label>
                        {form.phone && (
                          <button
                            type="button"
                            onClick={copyPhoneToWhatsApp}
                            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                          >
                            Same as Phone
                          </button>
                        )}
                      </div>
                      <input
                        className="form-input font-mono"
                        placeholder="+91 98765 43210"
                        value={form.whatsapp || ''}
                        onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label font-bold text-slate-700">Preferred Communication Channel</label>
                    <select
                      className="form-input cursor-pointer font-semibold"
                      value={form.preferred_communication || 'WhatsApp'}
                      onChange={e => setForm({ ...form, preferred_communication: e.target.value })}
                    >
                      <option value="WhatsApp">WhatsApp (Direct &amp; Fast)</option>
                      <option value="Email">Email (Official Communications)</option>
                      <option value="Phone">Phone Calls</option>
                      <option value="In-Person">In-Person Meeting</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: Company Details */}
              {activeTab === 'company' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Company Legal Name *</label>
                      <input
                        required
                        className="form-input"
                        placeholder="e.g. Acme Technologies Private Limited"
                        value={form.company}
                        onChange={e => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Brand / Trading Name (If Different)</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Acme Brands"
                        value={form.brand_name || ''}
                        onChange={e => setForm({ ...form, brand_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Business Legal Structure</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.business_type}
                        onChange={e => setForm({ ...form, business_type: e.target.value })}
                      >
                        <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                        <option value="LLP">Limited Liability Partnership (LLP)</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership Firm">Partnership Firm</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="Enterprise">Enterprise / Conglomerate</option>
                        <option value="Startup">Early-Stage Startup</option>
                        <option value="SME">Small &amp; Medium Enterprise (SME)</option>
                        <option value="Trust / NGO">Trust / NGO</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Industry / Sector</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.industry || 'IT & Software Development'}
                        onChange={e => setForm({ ...form, industry: e.target.value })}
                      >
                        <option value="IT & Software Development">IT &amp; Software Development</option>
                        <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                        <option value="Healthcare & Pharma">Healthcare &amp; Pharma</option>
                        <option value="Real Estate & Construction">Real Estate &amp; Construction</option>
                        <option value="Manufacturing & Industrial">Manufacturing &amp; Industrial</option>
                        <option value="Education & EdTech">Education &amp; EdTech</option>
                        <option value="Financial Services & FinTech">Financial Services &amp; FinTech</option>
                        <option value="Marketing, Media & Entertainment">Marketing, Media &amp; Entertainment</option>
                        <option value="Logistics & Supply Chain">Logistics &amp; Supply Chain</option>
                        <option value="Hospitality & Tourism">Hospitality &amp; Tourism</option>
                        <option value="Other">Other Domain</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Company Website URL</label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="url"
                          style={{ paddingLeft: '2.5rem' }}
                          className="form-input font-mono"
                          placeholder="https://company.com"
                          value={form.website || ''}
                          onChange={e => setForm({ ...form, website: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Company Size / Headcount</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.company_size || '11-50'}
                        onChange={e => setForm({ ...form, company_size: e.target.value })}
                      >
                        <option value="1-10">1 - 10 Employees (Micro / Seed)</option>
                        <option value="11-50">11 - 50 Employees (Small Business)</option>
                        <option value="51-200">51 - 200 Employees (Medium Business)</option>
                        <option value="201-500">201 - 500 Employees (Mid-Market)</option>
                        <option value="500+">500+ Employees (Large Enterprise)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Address & Location */}
              {activeTab === 'address' && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label font-bold text-slate-700">Office / Registered Street Address</label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Door / Suite / Building No., Street, Area..."
                      value={form.address || ''}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="form-label font-bold text-slate-700">City</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Chennai"
                        value={form.city || ''}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">State / Province</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Tamil Nadu"
                        value={form.state || ''}
                        onChange={e => setForm({ ...form, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Postal / PIN Code</label>
                      <input
                        className="form-input font-mono"
                        placeholder="600001"
                        value={form.postal_code || ''}
                        onChange={e => setForm({ ...form, postal_code: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Country</label>
                      <input
                        className="form-input"
                        placeholder="India"
                        value={form.country || 'India'}
                        onChange={e => setForm({ ...form, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label font-bold text-slate-700 mb-0">Branch / Delivery / Shipping Address (Optional)</label>
                      <button
                        type="button"
                        onClick={copyOfficeAddressToShipping}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                      >
                        Copy from Office Address
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Enter branch, warehouse, or alternate site address if different from head office..."
                      value={form.shipping_address || ''}
                      onChange={e => setForm({ ...form, shipping_address: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Tax & Invoicing */}
              {activeTab === 'tax' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">GSTIN / VAT / Tax ID Number</label>
                      <input
                        className="form-input font-mono uppercase"
                        placeholder="e.g. 33AAAAA0000A1Z5"
                        value={form.gst_vat_number || ''}
                        onChange={e => setForm({ ...form, gst_vat_number: e.target.value.toUpperCase() })}
                      />
                      <span className="text-[10px] text-slate-400">Used for official GST invoices and tax credits</span>
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">PAN / Business Reg Number</label>
                      <input
                        className="form-input font-mono uppercase"
                        placeholder="e.g. ABCDE1234F"
                        value={form.pan_number || ''}
                        onChange={e => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Billing Currency</label>
                      <select
                        className="form-input cursor-pointer font-semibold font-mono"
                        value={form.currency || 'INR'}
                        onChange={e => setForm({ ...form, currency: e.target.value })}
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - United States Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="AED">AED (د.إ) - UAE Dirham</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="SGD">SGD (S$) - Singapore Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Default Payment Terms</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.payment_terms || 'Net 30'}
                        onChange={e => setForm({ ...form, payment_terms: e.target.value })}
                      >
                        <option value="Immediate / Due on Receipt">Immediate / Due on Receipt</option>
                        <option value="Net 15">Net 15 Days</option>
                        <option value="Net 30">Net 30 Days</option>
                        <option value="Net 45">Net 45 Days</option>
                        <option value="Net 60">Net 60 Days</option>
                        <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                        <option value="Milestone-Based Payments">Milestone-Based Payments</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Secondary SPOC */}
              {activeTab === 'spoc' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    💡 <strong>Secondary Point of Contact (SPOC):</strong> Add an alternate manager, billing contact, or technical coordinator who can be reached if the primary contact is unavailable.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Secondary Contact Name</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Priya Sharma"
                        value={form.secondary_contact_name || ''}
                        onChange={e => setForm({ ...form, secondary_contact_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Role / Designation</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Accounts Manager, Technical Lead"
                        value={form.secondary_contact_designation || ''}
                        onChange={e => setForm({ ...form, secondary_contact_designation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label font-bold text-slate-700">Secondary Contact Email</label>
                      <input
                        type="email"
                        className="form-input font-mono"
                        placeholder="spoc@company.com"
                        value={form.secondary_contact_email || ''}
                        onChange={e => setForm({ ...form, secondary_contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Secondary Contact Phone</label>
                      <input
                        className="form-input font-mono"
                        placeholder="+91 98765 00000"
                        value={form.secondary_contact_phone || ''}
                        onChange={e => setForm({ ...form, secondary_contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CRM & Services */}
              {activeTab === 'crm' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="form-label font-bold text-slate-700">Client Status</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.client_status}
                        onChange={e => setForm({ ...form, client_status: e.target.value })}
                      >
                        <option value="Active">Active Client</option>
                        <option value="Prospect">Prospect / Lead</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Priority Tier</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.client_priority || 'Medium'}
                        onChange={e => setForm({ ...form, client_priority: e.target.value })}
                      >
                        <option value="VIP">🌟 VIP / High Value</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label font-bold text-slate-700">Acquisition / Lead Source</label>
                      <select
                        className="form-input cursor-pointer font-semibold"
                        value={form.lead_source || 'Website Inquiry'}
                        onChange={e => setForm({ ...form, lead_source: e.target.value })}
                      >
                        <option value="Website Inquiry">Website Inquiry</option>
                        <option value="Client Referral">Client Referral</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Cold Call / Outreach">Cold Call / Outreach</option>
                        <option value="Event / Expo">Event / Expo</option>
                        <option value="Partner Network">Partner Network</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Services Taken / Interested Pills */}
                  <div>
                    <label className="form-label font-bold text-slate-700 mb-1.5 block">
                      Services Interested / Taken (Click to Toggle)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_SERVICES.map((s) => {
                        const isSelected = (form.services_taken || []).includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleService(s)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 shadow-2xs border border-amber-500'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                            <span>{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Social Handles */}
                  <div>
                    <label className="form-label font-bold text-slate-700 mb-1 block">Social Media &amp; Profiles</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className="form-input font-mono"
                        placeholder="LinkedIn: https://linkedin.com/company/..."
                        value={form.social_media_accounts?.linkedin || ''}
                        onChange={e => setForm({
                          ...form,
                          social_media_accounts: { ...(form.social_media_accounts || {}), linkedin: e.target.value }
                        })}
                      />
                      <input
                        className="form-input font-mono"
                        placeholder="Twitter / X: @handle"
                        value={form.social_media_accounts?.twitter || ''}
                        onChange={e => setForm({
                          ...form,
                          social_media_accounts: { ...(form.social_media_accounts || {}), twitter: e.target.value }
                        })}
                      />
                      <input
                        className="form-input font-mono"
                        placeholder="Instagram: @handle"
                        value={form.social_media_accounts?.instagram || ''}
                        onChange={e => setForm({
                          ...form,
                          social_media_accounts: { ...(form.social_media_accounts || {}), instagram: e.target.value }
                        })}
                      />
                      <input
                        className="form-input font-mono"
                        placeholder="Facebook: https://facebook.com/..."
                        value={form.social_media_accounts?.facebook || ''}
                        onChange={e => setForm({
                          ...form,
                          social_media_accounts: { ...(form.social_media_accounts || {}), facebook: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="form-label font-bold text-slate-700">Internal Remarks &amp; Special Requirements</label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Special client requirements, SLA notes, project preferences, etc..."
                      value={form.notes || ''}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  className="btn-light-custom flex-1 sm:flex-none cursor-pointer"
                  onClick={() => setFormModal(false)}
                >
                  Cancel
                </button>
                {tabIndex > 0 && (
                  <button
                    type="button"
                    onClick={prevTab}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                {tabIndex < tabs.length - 1 && (
                  <button
                    type="button"
                    onClick={nextTab}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    Next Tab <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {form.id ? (
                  <button
                    type="button"
                    onClick={handleSaveClientOnly}
                    className="btn-warning-custom px-5 py-2 cursor-pointer font-bold"
                  >
                    Save Changes
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveClientOnly}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                      title="Save client to database directly without creating a project"
                    >
                      Save Client Only
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToProject}
                      className="btn-warning-custom px-5 py-2 cursor-pointer font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <span>Next: Project Details</span>
                      <ArrowRight size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 360 Client Profile Modal */}
      <ClientProfileModal
        isOpen={profileModal}
        onClose={() => setProfileModal(false)}
        clientId={selectedClientId}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={waModal}
        onClose={() => setWaModal(false)}
        defaultRecipient={activeRecipient}
      />

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModal}
        onClose={() => setEmailModal(false)}
        defaultEmail={activeRecipient?.email}
      />
    </div>
  );
}

