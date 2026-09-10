import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Video, Image, Share2, Film, Layers, CheckCircle2, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { canPerform } from '../../services/rbac';

const EMPTY_SOCIAL = {
  client: '',
  instagram_handle: '',
  facebook_page: '',
  package_name: '',
  monthly_payment: '',
  payment_status: 'Pending',
  videos_planned: 0,
  videos_completed: 0,
  posters_planned: 0,
  posters_completed: 0,
  reels_count: 0,
  posts_count: 0,
  stories_count: 0,
  campaigns_count: 0,
  content_status: 'Planning'
};

export default function DigitalMarketing() {
  const { user } = useOutletContext() || {};
  const role = user?.role || 'FOUNDER';

  const [socialClients, setSocialClients] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SOCIAL);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        api.marketing.listSocialClients(),
        api.clients.list()
      ]);

      setSocialClients(sRes.data || sRes.results || (Array.isArray(sRes) ? sRes : []));
      setClients(cRes.data || cRes.results || (Array.isArray(cRes) ? cRes : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.marketing.updateSocialClient(form.id, form);
      } else {
        await api.marketing.createSocialClient(form);
      }
      setModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error saving social media client');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete social media client retainer?')) {
      try {
        await api.marketing.deleteSocialClient(id);
        fetchData();
      } catch (err) {
        alert(err.message || 'Error deleting client');
      }
    }
  };

  const canManage = ['FOUNDER', 'CEO', 'MANAGER'].includes(role);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Digital Marketing &amp; Social Retainers</h1>
          <p className="page-desc">Track client social accounts, planned vs completed videos, posters, reels, and monthly retainers</p>
        </div>
        {canManage && (
          <button onClick={() => { setForm(EMPTY_SOCIAL); setModal(true); }} className="btn-warning-custom">
            <Plus size={15} /> Add Retainer Client
          </button>
        )}
      </div>

      {/* Grid of Social Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium text-xs">Loading Social Accounts...</div>
        ) : socialClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium text-xs">No social media client retainers found.</div>
        ) : (
          socialClients.map(sc => (
            <div key={sc.id} className="dashboard-card space-y-4 relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between border-b pb-3 mb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{sc.client_name}</h3>
                    <p className="text-xs font-semibold text-amber-700">{sc.package_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge text-bg-success">{sc.payment_status}</span>
                    {canManage && (
                      <>
                        <button onClick={() => { setForm(sc); setModal(true); }} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(sc.id)} className="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Handles */}
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className="px-3 py-1 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 font-semibold text-[11px]">
                    IG: {sc.instagram_handle || '@official'}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                    FB: {sc.facebook_page || 'fb.com/page'}
                  </span>
                </div>

                {/* Content Deliverables Progress Bars */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5"><Video size={14} className="text-amber-500" /> Videos Produced</span>
                      <span className="font-mono">{sc.videos_completed} / {sc.videos_planned}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${sc.videos_planned > 0 ? (sc.videos_completed / sc.videos_planned) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5"><Image size={14} className="text-purple-500" /> Posters / Graphics</span>
                      <span className="font-mono">{sc.posters_completed} / {sc.posters_planned}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${sc.posters_planned > 0 ? (sc.posters_completed / sc.posters_planned) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reels</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{sc.reels_count || 0}</p>
                </div>
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Posts</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{sc.posts_count || 0}</p>
                </div>
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stories</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{sc.stories_count || 0}</p>
                </div>
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retainer</p>
                  <p className="font-black text-emerald-700 text-sm mt-0.5">₹{(sc.monthly_payment || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Social Client Modal */}
      {modal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom">
            <h3 className="font-extrabold text-slate-900 text-base mb-4 border-b pb-2">
              {form.id ? 'Edit Social Client' : 'New Social Media Client'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Select Client *</label>
                <select required className="form-input font-semibold" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}>
                  <option value="">-- Select Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Instagram Handle</label>
                  <input className="form-input" value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Facebook Page</label>
                  <input className="form-input" value={form.facebook_page} onChange={e => setForm({ ...form, facebook_page: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Videos Planned</label>
                  <input type="number" className="form-input font-mono" value={form.videos_planned} onChange={e => setForm({ ...form, videos_planned: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="form-label">Videos Completed</label>
                  <input type="number" className="form-input font-mono" value={form.videos_completed} onChange={e => setForm({ ...form, videos_completed: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Posters Planned</label>
                  <input type="number" className="form-input font-mono" value={form.posters_planned} onChange={e => setForm({ ...form, posters_planned: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="form-label">Posters Completed</label>
                  <input type="number" className="form-input font-mono" value={form.posters_completed} onChange={e => setForm({ ...form, posters_completed: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button type="button" className="btn-light-custom" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn-warning-custom">Save Social Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
