import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const mockDeals = [
  { id: 1, title: 'Apex Corp Enterprise License', clientName: 'Apex Corporation', value: 850000, stage: 'Proposal', probability: 75, expectedClose: '2026-09-30' },
  { id: 2, title: 'NovaTech Annual SaaS Deal', clientName: 'NovaTech Solutions', value: 250000, stage: 'Negotiation', probability: 85, expectedClose: '2026-08-15' },
  { id: 3, title: 'Horizon Finance Data Suite', clientName: 'Horizon Finance', value: 1500000, stage: 'Discovery', probability: 40, expectedClose: '2026-11-30' },
];

const EMPTY = { title: '', clientName: '', value: 0, stage: 'Discovery', probability: 10, expectedClose: '' };

export default function Deals() {
  const [deals, setDeals] = useState(mockDeals);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const filtered = deals.filter(q =>
    q.title.toLowerCase().includes(filter.toLowerCase()) || q.clientName.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSave = (e) => {
    e.preventDefault();
    if (form.id) setDeals(prev => prev.map(q => q.id === form.id ? form : q));
    else setDeals([...deals, { ...form, id: Date.now() }]);
    setModal(false);
  };

  const fmtAmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;
  
  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Closed Won': return 'text-bg-success';
      case 'Closed Lost': return 'text-bg-danger';
      case 'Negotiation': return 'text-bg-warning';
      default: return 'text-bg-primary';
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-heading">Deals Pipeline</h1>
          <p className="page-desc mb-0">Track active sales opportunities</p>
        </div>
        <button className="btn btn-warning d-flex align-items-center gap-2" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16} /> Add Deal
        </button>
      </div>

      <div className="dashboard-card p-3 p-md-4">
        <div className="d-flex mb-3">
          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-light border-end-0"><Search size={16} /></span>
            <input className="form-control bg-light border-start-0" placeholder="Search deals..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr className="small text-secondary">
                <th>Deal Title</th><th>Client</th><th>Value</th><th>Stage</th><th>Win %</th><th>Expected Close</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id}>
                  <td className="fw-bold">{q.title}</td>
                  <td>{q.clientName}</td>
                  <td className="fw-bold text-success">{fmtAmt(q.value)}</td>
                  <td>
                    <span className={`badge ${getStageBadge(q.stage)}`}>{q.stage}</span>
                  </td>
                  <td className="fw-bold">{q.probability}%</td>
                  <td className="small text-secondary">{q.expectedClose}</td>
                  <td>
                    <button className="btn btn-sm btn-light me-2" onClick={() => { setForm(q); setModal(true); }}><Edit2 size={14} /></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => {if(confirm('Delete?')) setDeals(prev => prev.filter(i => i.id !== q.id))}}><Trash2 size={14} /></button>
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
              <h5 className="mb-0 fw-bold">{form.id ? 'Edit' : 'New'} Deal</h5>
              <X className="cursor-pointer" onClick={() => setModal(false)} />
            </div>
            <form onSubmit={handleSave}>
              <div className="mb-3"><label className="form-label small">Deal Title</label><input required className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="mb-3"><label className="form-label small">Client</label><input required className="form-control" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} /></div>
              <div className="row g-3 mb-3">
                <div className="col"><label className="form-label small">Value (₹)</label><input type="number" required className="form-control" value={form.value} onChange={e => setForm({...form, value: e.target.value})} /></div>
                <div className="col"><label className="form-label small">Probability (%)</label><input type="number" max="100" className="form-control" value={form.probability} onChange={e => setForm({...form, probability: e.target.value})} /></div>
              </div>
              <div className="mb-3"><label className="form-label small">Stage</label><select className="form-select" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}><option>Discovery</option><option>Qualified</option><option>Proposal</option><option>Negotiation</option><option>Closed Won</option><option>Closed Lost</option></select></div>
              <div className="mb-4"><label className="form-label small">Expected Close</label><input type="date" required className="form-control" value={form.expectedClose} onChange={e => setForm({...form, expectedClose: e.target.value})} /></div>
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
