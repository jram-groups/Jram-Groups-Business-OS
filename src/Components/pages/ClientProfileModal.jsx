import { useState, useEffect } from 'react';
import { 
  X, Building, Phone, Mail, MapPin, Briefcase, DollarSign, MessageSquare, 
  Share2, Layers, CheckCircle2, Clock, Globe, Building2, User, CreditCard, 
  Users, ExternalLink, ShieldCheck, FileText, Tag
} from 'lucide-react';
import { api } from '../../services/api';

export default function ClientProfileModal({ isOpen, onClose, clientId }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      setLoading(true);
      api.clients.getOverview(clientId)
        .then(res => {
          setData(res);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  const client = data?.client || {};
  const projects = data?.projects || [];
  const invoices = data?.invoices || [];
  const quotations = data?.quotations || [];
  const comms = data?.communications || { whatsapp: [], email: [] };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
              {client.name ? client.name.split(' ').map(n => n[0]).join('') : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-lg">{client.name || 'Client Profile'}</h2>
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                  client.client_status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                  client.client_status === 'Prospect' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {client.client_status || 'Active'}
                </span>
                {client.client_priority && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[10px]">
                    {client.client_priority} Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {client.company} {client.designation ? `• ${client.designation}` : ''} {client.industry ? `• ${client.industry}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b mb-4 overflow-x-auto text-xs font-semibold flex-shrink-0">
          {[
            { id: 'overview', label: 'Overview & Info', icon: Building },
            { id: 'projects', label: `Projects (${projects.length})`, icon: Briefcase },
            { id: 'financials', label: `Invoices & Payments (${invoices.length})`, icon: DollarSign },
            { id: 'quotations', label: `Quotations (${quotations.length})`, icon: Layers },
            { id: 'comms', label: 'Communication History', icon: MessageSquare },
            { id: 'social', label: 'Social Accounts', icon: Share2 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-amber-500 text-slate-950 font-bold bg-amber-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto text-xs pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">Loading 360° Client Profile...</div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Primary Contact */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <User size={14} className="text-amber-500" /> Primary Contact Profile
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                          {client.preferred_communication || 'WhatsApp'}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <p><strong>Name:</strong> {client.name} {client.designation ? `(${client.designation})` : ''}</p>
                        <p className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> {client.email}</p>
                        {client.secondary_email && (
                          <p className="flex items-center gap-2 text-slate-500"><Mail size={13} className="text-slate-300" /> Alt: {client.secondary_email}</p>
                        )}
                        <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {client.phone}</p>
                        {client.whatsapp && client.whatsapp !== client.phone && (
                          <p className="flex items-center gap-2 text-emerald-700 font-medium">
                            <MessageSquare size={13} className="text-emerald-500" /> WA: {client.whatsapp}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Company Details */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 size={14} className="text-amber-500" /> Company &amp; Entity
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-700">
                          {client.business_type}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <p><strong>Legal Name:</strong> {client.company}</p>
                        {client.brand_name && <p><strong>Brand:</strong> {client.brand_name}</p>}
                        <p><strong>Industry:</strong> {client.industry || 'IT & Software'}</p>
                        <p><strong>Team Size:</strong> {client.company_size ? `${client.company_size} Employees` : 'N/A'}</p>
                        {client.website && (
                          <p className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Globe size={13} />
                            <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                              {client.website}
                            </a>
                            <ExternalLink size={11} />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 3: Address Details */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-1.5">
                        <MapPin size={14} className="text-amber-500" /> Registered &amp; Shipping Address
                      </h4>
                      <div className="space-y-1.5 text-slate-700">
                        <p className="leading-relaxed">
                          <strong>Office:</strong> {client.address || 'N/A'}
                          {client.city ? `, ${client.city}` : ''}
                          {client.state ? `, ${client.state}` : ''}
                          {client.postal_code ? ` - ${client.postal_code}` : ''}
                          {client.country ? `, ${client.country}` : ''}
                        </p>
                        {client.shipping_address && (
                          <p className="text-slate-500 border-t pt-1 mt-1 leading-relaxed">
                            <strong>Shipping / Branch:</strong> {client.shipping_address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card 4: Tax & Financials */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-1.5">
                        <CreditCard size={14} className="text-amber-500" /> Tax, Invoicing &amp; Revenue
                      </h4>
                      <div className="space-y-1.5 text-slate-700">
                        <p><strong>GSTIN / Tax ID:</strong> <span className="font-mono font-bold text-slate-900">{client.gst_vat_number || 'N/A'}</span></p>
                        <p><strong>PAN Number:</strong> <span className="font-mono">{client.pan_number || 'N/A'}</span></p>
                        <p><strong>Currency:</strong> {client.currency || 'INR'} • <strong>Payment Terms:</strong> {client.payment_terms || 'Net 30'}</p>
                        <p><strong>Total Lifetime Revenue:</strong> <span className="font-extrabold text-emerald-700 font-mono">₹{Number(client.total_revenue || 0).toLocaleString('en-IN')}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Secondary SPOC and Services */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.secondary_contact_name && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-1.5">
                          <Users size={14} className="text-amber-500" /> Secondary Point of Contact (SPOC)
                        </h4>
                        <div className="space-y-1 text-slate-700">
                          <p><strong>Name:</strong> {client.secondary_contact_name} {client.secondary_contact_designation ? `(${client.secondary_contact_designation})` : ''}</p>
                          {client.secondary_contact_email && <p className="font-mono"><Mail size={12} className="inline mr-1 text-slate-400" /> {client.secondary_contact_email}</p>}
                          {client.secondary_contact_phone && <p className="font-mono"><Phone size={12} className="inline mr-1 text-slate-400" /> {client.secondary_contact_phone}</p>}
                        </div>
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 ${!client.secondary_contact_name ? 'md:col-span-2' : ''}`}>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-1.5">
                        <Tag size={14} className="text-amber-500" /> Services &amp; Engagements
                      </h4>
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(client.services_taken && client.services_taken.length > 0) ? (
                            client.services_taken.map((s, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No specific services marked.</span>
                          )}
                        </div>
                        {client.notes && (
                          <p className="text-slate-600 bg-white p-2 rounded-xl border text-[11px] mt-2">
                            <strong>Internal Notes:</strong> {client.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No projects registered for this client yet.</p>
                  ) : (
                    projects.map(p => (
                      <div key={p.id} className="p-3 rounded-xl border bg-slate-50 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{p.name}</h4>
                          <span className={`badge badge-${(p.priority || 'medium').toLowerCase()} mt-1`}>{p.priority} Priority</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-amber-700">{p.status}</span>
                          <p className="text-slate-500 text-[10px]">{p.progress_pct}% Progress</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Financials Tab */}
              {activeTab === 'financials' && (
                <div className="space-y-2">
                  {invoices.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No invoices generated for this client.</p>
                  ) : (
                    invoices.map(inv => (
                      <div key={inv.id} className="p-3 rounded-xl border bg-slate-50 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{inv.reference}</h4>
                          <p className="text-slate-500 text-[10px]">Date: {inv.invoice_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}</p>
                          <span className={`badge ${inv.payment_status === 'Paid' ? 'text-bg-success' : 'text-bg-warning'}`}>
                            {inv.payment_status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Quotations Tab */}
              {activeTab === 'quotations' && (
                <div className="space-y-2">
                  {quotations.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No quotations submitted.</p>
                  ) : (
                    quotations.map(q => (
                      <div key={q.id} className="p-3 rounded-xl border bg-slate-50 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{q.reference}</h4>
                          <p className="text-slate-500 text-[10px]">Valid Until: {q.valid_until}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-700">₹{Number(q.total_amount || 0).toLocaleString('en-IN')}</p>
                          <span className="badge text-bg-primary">{q.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Communication History Tab */}
              {activeTab === 'comms' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-1">WhatsApp & Email Dispatch Audit Logs</h4>
                  <div className="space-y-2">
                    {comms.whatsapp.map(w => (
                      <div key={w.id} className="p-2.5 rounded-xl border bg-emerald-50/50 flex items-center justify-between text-[11px]">
                        <div>
                          <strong className="text-emerald-900">WhatsApp: {w.message_type}</strong>
                          <p className="text-slate-500">Status: {w.status}</p>
                        </div>
                        <span className="text-slate-400">{new Date(w.sent_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {comms.email.map(e => (
                      <div key={e.id} className="p-2.5 rounded-xl border bg-blue-50/50 flex items-center justify-between text-[11px]">
                        <div>
                          <strong className="text-blue-900">Email: {e.subject}</strong>
                          <p className="text-slate-500">Status: {e.status}</p>
                        </div>
                        <span className="text-slate-400">{new Date(e.sent_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Accounts Tab */}
              {activeTab === 'social' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs border-b pb-2">Social Media &amp; Digital Presence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">LinkedIn</span>
                      <span className="text-amber-700 font-mono text-[11px] truncate max-w-[200px]">
                        {client.social_media_accounts?.linkedin ? (
                          <a href={client.social_media_accounts.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
                            {client.social_media_accounts.linkedin}
                          </a>
                        ) : 'Not linked'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Twitter / X</span>
                      <span className="text-amber-700 font-mono text-[11px]">
                        {client.social_media_accounts?.twitter || 'Not linked'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Instagram</span>
                      <span className="text-amber-700 font-mono text-[11px]">
                        {client.social_media_accounts?.instagram || 'Not linked'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Facebook</span>
                      <span className="text-amber-700 font-mono text-[11px] truncate max-w-[200px]">
                        {client.social_media_accounts?.facebook ? (
                          <a href={client.social_media_accounts.facebook} target="_blank" rel="noreferrer" className="hover:underline">
                            {client.social_media_accounts.facebook}
                          </a>
                        ) : 'Not linked'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
