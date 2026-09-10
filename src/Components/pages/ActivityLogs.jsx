import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Search, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../../services/api';

export default function ActivityLogs() {
  const { user } = useOutletContext() || {};
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.audit.list(search ? `search=${encodeURIComponent(search)}` : '');
      setLogs(res.data || res.results || (Array.isArray(res) ? res : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="page-container">
      <div>
        <h1 className="page-heading">System Audit &amp; Activity Log</h1>
        <p className="page-desc">Complete immutable audit trail of system changes, project priority updates, financial transactions, and dispatches</p>
      </div>

      <div className="dashboard-card p-5">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            style={{ paddingLeft: '2.5rem' }}
            className="w-full pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-amber-400"
            placeholder="Search audit trail by user, action, or module..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User &amp; Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-400 text-xs font-medium">Loading Audit Logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-400 text-xs font-medium">No activity logs recorded.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-xs text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div className="font-extrabold text-slate-900 text-xs">{log.user_name}</div>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">{log.user_role}</span>
                    </td>
                    <td>
                      <span className="font-bold text-amber-700 text-xs">{log.action}</span>
                    </td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold text-[11px]">{log.module}</span>
                    </td>
                    <td className="text-xs text-slate-600 max-w-md">
                      {log.record_title && <strong className="text-slate-800">{log.record_title}: </strong>}
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
