import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const mockLeads = [
  { id: 1, name: 'Riya Sharma', email: 'riya@gmail.com', company: 'Freelance', status: 'New', score: 85, assignedTo: 'Arjun K' },
  { id: 2, name: 'Vikram Bhat', email: 'vbhat@techstartup.in', company: 'TechStartup Inc', status: 'Contacted', score: 72, assignedTo: 'Priya M' },
  { id: 3, name: 'Ananya Joshi', email: 'ananya.j@retail.com', company: 'Retail Giant', status: 'Qualified', score: 91, assignedTo: 'Arjun K' },
];

const EMPTY = { name: '', email: '', company: '', status: 'New', score: 50, assignedTo: '' };

export default function Leads() {
  const [leads, setLeads] = useState(mockLeads);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const filtered = leads.filter(q =>
    q.name.toLowerCase().includes(filter.toLowerCase()) || q.company.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSave = (e) => {
    e.preventDefault();
    if (form.id) setLeads(prev => prev.map(q => q.id === form.id ? form : q));
    else setLeads([...leads, { ...form, id: Date.now() }]);
    setModal(false);
  };

  const SCORE_COLOR = (s) => s >= 80 ? 'text-bg-success' : s >= 60 ? 'text-bg-warning' : 'text-bg-danger';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-heading">Leads</h1>
          <p className="page-desc mb-0">Manage prospect pipeline</p>
        </div>
        <button className="btn btn-warning d-flex align-items-center gap-2" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div className="dashboard-card p-3 p-md-4">
        <div className="d-flex mb-3">
          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-light border-end-0"><Search size={16} /></span>
            <input className="form-control bg-light border-start-0" placeholder="Search leads..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr className="small text-secondary">
                <th>Lead</th><th>Company</th><th>Status</th><th>Score</th><th>Assigned To</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id}>
                  <td>
                    <div className="fw-bold">{q.name}</div>
                    <div className="small text-secondary">{q.email}</div>
                  </td>
                  <td>{q.company}</td>
                  <td>
                    <span className={`badge ${q.status === 'New' ? 'text-bg-info' : q.status === 'Qualified' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${SCORE_COLOR(q.score)}`}>{q.score}/100</span>
                  </td>
                  <td className="small">{q.assignedTo}</td>
                  <td>
                    <button className="btn btn-sm btn-light me-2" onClick={() => { setForm(q); setModal(true); }}><Edit2 size={14} /></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => {if(confirm('Delete?')) setLeads(prev => prev.filter(i => i.id !== q.id))}}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-white rounded p-4" style={{ width: '100%', maxWidth: 500 }}>
            <div className="d-flex justify-content-between mb-4">
              <h5 className="mb-0 fw-bold">{form.id ? 'Edit' : 'New'} Lead</h5>
              <X className="cursor-pointer" onClick={() => setModal(false)} />
            </div>
            <form onSubmit={handleSave}>
              <div className="mb-3"><label className="form-label small">Name</label><input required className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="mb-3"><label className="form-label small">Email</label><input type="email" required className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="mb-3"><label className="form-label small">Company</label><input required className="form-control" value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
              <div className="row g-3 mb-3">
                <div className="col"><label className="form-label small">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>New</option><option>Contacted</option><option>Qualified</option></select></div>
                <div className="col"><label className="form-label small">Score</label><input type="number" className="form-control" value={form.score} onChange={e => setForm({...form, score: e.target.value})} /></div>
              </div>
              <div className="mb-4"><label className="form-label small">Assigned To</label><input className="form-control" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} /></div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-warning">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
