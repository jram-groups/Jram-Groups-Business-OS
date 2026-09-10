import React, { useState, useEffect, Fragment } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, Printer, MessageSquare, Mail, ArrowRight, 
  FileText, X, Sparkles, ChevronDown, ChevronUp, ExternalLink, Building2, 
  User, Phone, MapPin, Receipt, ShieldCheck, CheckCircle2, Calendar, 
  DollarSign, FileSpreadsheet, Eye, TrendingUp, Send, Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';
import PDFPreviewModal from '../common/PDFPreviewModal';
import WhatsAppModal from '../common/WhatsAppModal';
import EmailModal from '../common/EmailModal';

const parseJsonField = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const formatCurrency = (val, cur = '₹') => {
  return `${cur}${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

export default function Quotations() {
  const { user } = useOutletContext() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'FOUNDER';

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Accordion Expand State
  const [expandedRowId, setExpandedRowId] = useState(null);
  const toggleExpand = (id) => setExpandedRowId(prev => (prev === id ? null : id));

  // PDF Preview & Comms Modals
  const [pdfModal, setPdfModal] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [waModal, setWaModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [activeRecipient, setActiveRecipient] = useState(null);

  // Forward to Quotation Generator if coming from Project Pipeline
  useEffect(() => {
    if (location.state?.selectedClient) {
      navigate('/quotations/new', { state: location.state });
    }
  }, [location.state, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let q = '';
      if (search) q += `search=${encodeURIComponent(search)}`;

      const [qRes, cRes] = await Promise.all([
        api.finance.getQuotations(q),
        api.clients.list()
      ]);

      setQuotations(qRes.data || qRes.results || (Array.isArray(qRes) ? qRes : []));
      setClients(cRes.data || cRes.results || (Array.isArray(cRes) ? cRes : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleConvert = async (id) => {
    if (confirm('Convert this quotation to an official Invoice?')) {
      try {
        await api.finance.convertQuotationToInvoice(id);
        alert('Quotation converted to Invoice successfully!');
        fetchData();
      } catch (err) {
        alert(err.message || 'Error converting quotation');
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete quotation? This will remove all quotation records permanently.')) {
      try {
        await api.finance.deleteQuotation(id);
        if (expandedRowId === id) setExpandedRowId(null);
        fetchData();
      } catch (err) {
        alert(err.message || 'Error deleting quotation');
      }
    }
  };

  const openPdf = (q) => {
    setActiveDoc(q);
    setPdfModal(true);
  };

  const triggerWa = (q) => {
    const clientDetails = parseJsonField(q.client_details);
    const phone = clientDetails?.phone || q.client_detail?.phone || q.client_detail?.whatsapp || '';
    const name = clientDetails?.name || q.client_name || '';
    setActiveRecipient({ name, whatsapp: phone, phone });
    setWaModal(true);
  };

  const triggerEmail = (q) => {
    const clientDetails = parseJsonField(q.client_details);
    const email = clientDetails?.email || q.client_detail?.email || '';
    const name = clientDetails?.name || q.client_name || '';
    setActiveRecipient({ name, email });
    setEmailModal(true);
  };

  const canCreate = canPerform(role, 'CREATE_QUOTATION');
  const canConvert = canPerform(role, 'CONVERT_TO_INVOICE');
  const canDelete = canPerform(role, 'DELETE_QUOTATION');

  // KPI Aggregation
  const totalValue = quotations.reduce((s, q) => s + Number(q.total_amount || 0), 0);
  const acceptedCount = quotations.filter(q => q.status === 'Accepted').length;
  const sentCount = quotations.filter(q => q.status === 'Sent').length;
  const draftCount = quotations.filter(q => q.status === 'Draft').length;
  const conversionRate = quotations.length > 0 ? Math.round((acceptedCount / quotations.length) * 100) : 0;

  return (
    <div className="page-container" style={{ gap: '20px' }}>
      {/* ────────── PREMIUM HERO HEADER ────────── */}
      <div className="premium-hero-gradient rounded-2xl p-5 sm:p-7 text-white relative z-10" style={{ borderRadius: '20px' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a' }}>
                Proposals & Commercial
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                Live A4 Document Editor
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2, color: '#ffffff' }}>
              Quotation & Proposals
            </h1>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', maxWidth: '550px', lineHeight: 1.5 }}>
              Build branded commercial quotations, live A4 document editor, PDF exports, and one-click invoice conversion.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => navigate('/quotations/new')}
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
              <span>New Quotation</span>
            </button>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
          {[
            { label: 'Total Proposals', value: quotations.length, icon: <FileText size={16} />, accent: '#fbbf24' },
            { label: 'Total Value', value: formatCurrency(totalValue), icon: <DollarSign size={16} />, accent: '#10b981' },
            { label: 'Accepted', value: acceptedCount, icon: <CheckCircle2 size={16} />, accent: '#34d399' },
            { label: 'Conversion', value: `${conversionRate}%`, icon: <TrendingUp size={16} />, accent: '#6366f1' },
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

      {/* ────────── SEARCH & FILTER BAR ────────── */}
      <div className="glass-card" style={{ padding: '14px 18px' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              style={{ paddingLeft: '2.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '9px 14px 9px 38px', fontSize: '12px', fontWeight: 600, width: '100%', outline: 'none', transition: 'all 0.18s ease' }}
              placeholder="Search quotation reference, client name, subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.background = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="flex items-center gap-3.5 text-xs font-semibold text-slate-600">
            {[
              { label: 'Accepted', count: acceptedCount, color: '#10b981' },
              { label: 'Sent', count: sentCount, color: '#f59e0b' },
              { label: 'Draft', count: draftCount, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span style={{ fontWeight: 600, color: '#475569' }}>{s.label}:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────── QUOTATION TABLE ────────── */}
      <div className="glass-card p-0 overflow-hidden" style={{ padding: 0, borderRadius: '18px' }}>
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th className="py-3.5 px-3.5 text-left whitespace-nowrap text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Quote #</th>
                <th className="py-3.5 px-3 text-left text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Client & Company</th>
                <th className="py-3.5 px-3 text-left hidden md:table-cell text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Subject / Project</th>
                <th className="py-3.5 px-3 text-left whitespace-nowrap text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Total Value</th>
                <th className="py-3.5 px-2 text-center text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Status</th>
                <th className="py-3.5 px-3 text-left hidden lg:table-cell whitespace-nowrap text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Valid Until</th>
                <th className="py-3.5 px-3.5 text-right whitespace-nowrap text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">Actions & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-14">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fef3c7' }}>
                        <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Loading quotations from database...</span>
                    </div>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-14">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                        <FileText size={24} />
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>No quotations created yet</p>
                      <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>Click "New Quotation" to launch the live A4 quotation generator.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map(q => {
                  const isExpanded = expandedRowId === q.id;
                  const cur = q.currency || '₹';
                  const companyDetails = parseJsonField(q.company_details, {});
                  const clientDetails = parseJsonField(q.client_details, {});
                  const sigDetails = parseJsonField(q.signature_details, {});
                  const itemsList = Array.isArray(q.items) ? q.items : parseJsonField(q.items, []);
                  const itemCount = itemsList.length;

                  const statusStyle = q.status === 'Accepted'
                    ? { bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#047857', border: '#a7f3d0', dot: '#10b981' }
                    : q.status === 'Sent'
                    ? { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#92400e', border: '#fde68a', dot: '#f59e0b' }
                    : { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' };

                  return (
                    <Fragment key={q.id}>
                      {/* ══ SHORT BAR ══ */}
                      <tr
                        className={`transition-all text-xs ${isExpanded ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50/70'}`}
                        style={{ borderLeft: isExpanded ? '3px solid #f59e0b' : '3px solid transparent' }}
                      >
                        {/* Reference */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '11px', color: '#0f172a', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              {q.reference}
                            </span>
                            {q.quotation_date && (
                              <span className="text-[10px] text-slate-400 hidden xl:inline">
                                {formatDate(q.quotation_date)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Client & Company */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', fontWeight: 800, fontSize: '10px', border: '1px solid #fde68a' }}>
                              {(clientDetails?.name || q.client_name || 'C').charAt(0)}
                            </div>
                            <div>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px', display: 'block', lineHeight: 1.2 }}>
                                {clientDetails?.name || q.client_name || 'Client'}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                                {clientDetails?.company || q.client_detail?.company || 'Enterprise'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Subject / Project */}
                        <td className="py-3.5 px-3 hidden md:table-cell">
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }} className="line-clamp-1 max-w-[160px]" title={q.subject || 'Standard Proposal'}>
                            {q.subject || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Commercial Scope</span>}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-baseline gap-1.5">
                            <span style={{ fontWeight: 900, color: '#047857', fontFamily: 'monospace', fontSize: '12px' }}>
                              {formatCurrency(q.total_amount, cur)}
                            </span>
                            {itemCount > 0 && (
                              <span style={{ fontSize: '9.5px', padding: '2px 6px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontWeight: 700, border: '1px solid #e2e8f0' }}>
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="gradient-badge" style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            padding: '3px 10px',
                            borderRadius: '99px',
                          }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusStyle.dot, marginRight: '4px' }} />
                            {q.status || 'Sent'}
                          </span>
                        </td>

                        {/* Valid Until */}
                        <td className="py-3.5 px-3 hidden lg:table-cell whitespace-nowrap">
                          <div className="flex items-center gap-1.5" style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                            <Calendar size={12} style={{ color: '#94a3b8' }} />
                            {formatDate(q.valid_until)}
                          </div>
                        </td>

                        {/* Actions & Expand Button */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => navigate(`/quotations/edit/${q.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer" title="Edit in Live Generator">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => openPdf(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer" title="Print / PDF Preview">
                              <Printer size={13} />
                            </button>
                            <button onClick={() => triggerWa(q)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer" title="Share on WhatsApp">
                              <MessageSquare size={13} />
                            </button>
                            <button onClick={() => triggerEmail(q)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all cursor-pointer" title="Send Email">
                              <Mail size={13} />
                            </button>
                            {canConvert && (
                              <button onClick={() => handleConvert(q.id)} className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', border: '1px solid #fde68a' }} title="Convert to Invoice">
                                <ArrowRight size={11} /> Invoice
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer" title="Delete Quotation">
                                <Trash2 size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(q.id)}
                              className="ml-1 px-2.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              style={{
                                background: isExpanded ? '#0f172a' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                color: isExpanded ? '#fbbf24' : '#92400e',
                                border: isExpanded ? '1px solid #1e293b' : '1px solid #fde68a',
                                boxShadow: isExpanded ? '0 2px 8px rgba(15, 23, 42, 0.15)' : 'none',
                              }}
                              title={isExpanded ? 'Collapse Full Details' : 'Expand Entire Quotation Details'}
                            >
                              <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ══ EXPANDED DETAILS ══ */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="p-0">
                            <div className="p-5 sm:p-6 space-y-5 animate-fade-in" style={{ background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.15) 0%, rgba(255, 255, 255, 1) 30%, rgba(254, 243, 199, 0.08) 100%)', borderTop: '2px solid #fde68a', borderBottom: '2px solid #fde68a' }}>

                              {/* Expanded Toolbar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: '#0f172a', color: '#fbbf24', boxShadow: '0 2px 6px rgba(15,23,42,0.2)' }}>
                                    {companyDetails?.name ? companyDetails.name.charAt(0) : 'J'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', fontFamily: 'monospace' }}>Quotation #{q.reference}</h3>
                                      <span className="gradient-badge" style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: '9px' }}>{q.status}</span>
                                    </div>
                                    <p style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                                      Subject: <strong style={{ color: '#0f172a' }}>{q.subject || 'Commercial Proposal'}</strong>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button onClick={() => navigate(`/quotations/edit/${q.id}`)} className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0f172a', boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>
                                    <Edit2 size={13} /> Open Live Editor
                                  </button>
                                  <button onClick={() => openPdf(q)} className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all" style={{ background: '#0f172a', color: '#ffffff' }}>
                                    <Printer size={13} /> Print A4
                                  </button>
                                  {canConvert && (
                                    <button onClick={() => handleConvert(q.id)} className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all" style={{ background: '#059669', color: '#ffffff' }}>
                                      <ArrowRight size={13} /> Generate Invoice
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Company & Client Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                  <div className="flex items-center gap-2 pb-2 mb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <Building2 size={14} style={{ color: '#d97706' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>From (Company)</span>
                                  </div>
                                  <div style={{ fontSize: '12px' }} className="space-y-1">
                                    <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{companyDetails?.name || 'Jram Groups'}</p>
                                    <p style={{ color: '#64748b', fontWeight: 500 }}>{companyDetails?.tagline || 'IT Solutions & Services'}</p>
                                    {companyDetails?.address && <p className="flex items-start gap-1 pt-1" style={{ color: '#475569' }}><MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />{companyDetails.address}</p>}
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-slate-600 pt-1" style={{ fontSize: '11px' }}>
                                      {companyDetails?.phone && <span>📞 {companyDetails.phone}</span>}
                                      {companyDetails?.email && <span>✉️ {companyDetails.email}</span>}
                                      {companyDetails?.website && <span>🌐 {companyDetails.website}</span>}
                                    </div>
                                    {companyDetails?.gst && (
                                      <p style={{ fontSize: '10.5px', fontFamily: 'monospace', fontWeight: 700, background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde68a', color: '#92400e', display: 'inline-block', marginTop: '4px' }}>
                                        GST: {companyDetails.gst}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="p-4 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                  <div className="flex items-center gap-2 pb-2 mb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <User size={14} style={{ color: '#d97706' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bill To (Client)</span>
                                  </div>
                                  <div style={{ fontSize: '12px' }} className="space-y-1">
                                    <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{clientDetails?.company || q.client_detail?.company || clientDetails?.name || q.client_name || 'Client Corp'}</p>
                                    <p style={{ fontWeight: 700, color: '#475569' }}>Contact: {clientDetails?.name || q.client_name || '—'}</p>
                                    {(clientDetails?.address || q.client_detail?.address) && <p className="flex items-start gap-1 pt-1" style={{ color: '#475569' }}><MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />{clientDetails?.address || q.client_detail?.address}</p>}
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-slate-600 pt-1" style={{ fontSize: '11px' }}>
                                      {(clientDetails?.phone || q.client_detail?.phone) && <span>📞 {clientDetails?.phone || q.client_detail?.phone}</span>}
                                      {(clientDetails?.email || q.client_detail?.email) && <span>✉️ {clientDetails?.email || q.client_detail?.email}</span>}
                                    </div>
                                    {(clientDetails?.gst || q.client_detail?.gst_vat_number) && (
                                      <p style={{ fontSize: '10.5px', fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#334155', display: 'inline-block', marginTop: '4px' }}>
                                        Client GST: {clientDetails?.gst || q.client_detail?.gst_vat_number}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Items Table */}
                              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
                                <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }} className="flex items-center gap-1.5">
                                    <FileSpreadsheet size={13} /> Itemized Scope
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}>{itemsList.length} line items</span>
                                </div>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                                      <th className="py-2.5 px-3 text-left w-10 text-[10px] uppercase text-slate-400 font-bold">#</th>
                                      <th className="py-2.5 px-3 text-left text-[10px] uppercase text-slate-400 font-bold">Item / Service</th>
                                      <th className="py-2.5 px-3 text-left text-[10px] uppercase text-slate-400 font-bold">Description</th>
                                      <th className="py-2.5 px-3 text-center w-16 text-[10px] uppercase text-slate-400 font-bold">Qty</th>
                                      <th className="py-2.5 px-3 text-right w-28 text-[10px] uppercase text-slate-400 font-bold">Unit Price</th>
                                      <th className="py-2.5 px-3 text-right w-32 text-[10px] uppercase text-slate-400 font-bold">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {itemsList.length === 0 ? (
                                      <tr><td colSpan="6" className="py-4 text-center text-slate-400">Commercial Service Package — Total: {formatCurrency(q.total_amount, cur)}</td></tr>
                                    ) : (
                                      itemsList.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                          <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.name || '—'}</td>
                                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.desc || '—'}</td>
                                          <td className="py-2.5 px-3 text-center font-mono font-bold">{item.qty}</td>
                                          <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.price, cur)}</td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total, cur)}</td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Financial Totals */}
                              <div className="flex flex-col sm:flex-row justify-end">
                                <div className="w-full sm:w-80 rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                                  <div className="p-3 flex justify-between text-xs text-slate-600" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <span>Subtotal:</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(q.subtotal || q.total_amount, cur)}</span>
                                  </div>
                                  {(Number(q.discount) > 0 || Number(q.discount_rate) > 0) && (
                                    <div className="p-3 flex justify-between text-xs" style={{ borderBottom: '1px solid #f1f5f9', background: '#ecfdf5', color: '#047857' }}>
                                      <span>Discount {q.discount_rate ? `(${q.discount_rate}%)` : ''}:</span>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>-{formatCurrency(q.discount, cur)}</span>
                                    </div>
                                  )}
                                  {(Number(q.tax) > 0 || Number(q.tax_rate) > 0) && (
                                    <div className="p-3 flex justify-between text-xs text-slate-700" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <span>Tax / GST {q.tax_rate ? `(${q.tax_rate}%)` : ''}:</span>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>+{formatCurrency(q.tax, cur)}</span>
                                    </div>
                                  )}
                                  <div className="p-3.5 flex justify-between items-center text-xs" style={{ background: '#0f172a', color: '#ffffff' }}>
                                    <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total:</span>
                                    <span style={{ fontWeight: 900, fontSize: '14px', fontFamily: 'monospace', color: '#fbbf24' }}>{formatCurrency(q.total_amount, cur)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Notes & Terms */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.notes && (
                                  <div className="p-4 rounded-2xl" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
                                    <h4 style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Notes & Payment Guidelines</h4>
                                    <p style={{ fontSize: '11.5px', color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{q.notes}</p>
                                  </div>
                                )}
                                {q.terms && (
                                  <div className="p-4 rounded-2xl" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
                                    <h4 style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Terms & Commercial Conditions</h4>
                                    <p style={{ fontSize: '11.5px', color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{q.terms}</p>
                                  </div>
                                )}
                              </div>

                              {/* Signatures */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                                <div className="p-3 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                  <p style={{ fontSize: '9.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Client Acceptance Signature</p>
                                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>{sigDetails?.sig_cl_name || clientDetails?.name || q.client_name || 'Client Representative'}</p>
                                  <p style={{ fontSize: '11px', color: '#64748b' }}>{sigDetails?.sig_cl_role || 'Authorized Signatory'}</p>
                                </div>
                                <div className="p-3 rounded-xl text-right" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                  <p style={{ fontSize: '9.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>For Jram Groups — Authorized Signatory</p>
                                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px' }}>{sigDetails?.sig_co_name || companyDetails?.founder || 'Mr. J. Ramkumar'}</p>
                                  <p style={{ fontSize: '11px', color: '#64748b' }}>{sigDetails?.sig_co_role || 'Founder & CEO, Jram Groups'}</p>
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '11px', color: '#64748b' }} className="flex items-center gap-2">
                                  <Calendar size={12} className="text-slate-400" />
                                  <span>Date: <strong style={{ color: '#0f172a' }}>{formatDate(q.quotation_date)}</strong></span>
                                  <span>•</span>
                                  <span>Valid Until: <strong style={{ color: '#0f172a' }}>{formatDate(q.valid_until)}</strong></span>
                                </div>
                                <button onClick={() => toggleExpand(q.id)} className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all" style={{ color: '#64748b' }}>
                                  Close <ChevronUp size={14} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF & Comms Modals */}
      <PDFPreviewModal isOpen={pdfModal} onClose={() => setPdfModal(false)} docType="quotation" data={activeDoc} />
      <WhatsAppModal isOpen={waModal} onClose={() => setWaModal(false)} defaultRecipient={activeRecipient} defaultType="Quotation" />
      <EmailModal isOpen={emailModal} onClose={() => setEmailModal(false)} defaultEmail={activeRecipient?.email} defaultSubject="Quotation Proposal from JRAM Groups" />
    </div>
  );
}
