import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, KeyRound } from 'lucide-react';
import { getRoleConfig } from '../../services/rbac';

export default function AccessDenied({ moduleName, userRole }) {
  const navigate = useNavigate();
  const config = getRoleConfig(userRole);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="dashboard-card max-w-lg w-full text-center p-8 space-y-5 border-amber-200 shadow-xl bg-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={34} />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
            <KeyRound size={13} className="text-amber-600" />
            RBAC Access Restricted
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Restricted Module: {moduleName}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Your current logged-in role (<strong className="text-slate-800">{config.label}</strong>) does not have authorization to view this section.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <p className="font-bold text-slate-800">Role Scope: {config.accessScope}</p>
          <p className="text-[11px] text-slate-500">{config.description}</p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="btn-light-custom"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-warning-custom"
          >
            <LayoutDashboard size={14} /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
