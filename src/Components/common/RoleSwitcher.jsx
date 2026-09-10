import { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Crown,
  Briefcase,
  Shield,
  Code,
  GraduationCap,
  LogOut,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ROLE_DETAILS } from '../../services/rbac';
import { api } from '../../services/api';

export default function RoleSwitcher({ currentUser, onRoleChanged }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState(null);

  const activeRole = currentUser?.role || 'FOUNDER';
  const activeObj = ROLE_DETAILS.find((r) => r.key === activeRole) || ROLE_DETAILS[0];

  const handleSelectRole = async (roleKey) => {
    if (roleKey === activeRole) {
      setOpen(false);
      return;
    }

    setLoading(true);
    setSwitchingTo(roleKey);

    try {
      // 1. Log out current session
      // 2. Authenticate into new role account
      const res = await api.auth.switchRole(roleKey);
      if (res.success && res.user) {
        onRoleChanged && onRoleChanged(res.user);
      } else {
        alert(res.message || 'Error switching role account');
      }
    } catch (err) {
      alert(err.message || 'Error executing role switch');
    } finally {
      setLoading(false);
      setSwitchingTo(null);
      setOpen(false);
    }
  };

  const getRoleIcon = (key) => {
    switch (key) {
      case 'FOUNDER': return <Crown size={14} className="text-amber-500" />;
      case 'CEO': return <Briefcase size={14} className="text-purple-500" />;
      case 'MANAGER': return <UserCheck size={14} className="text-blue-500" />;
      case 'TEAM_HEAD': return <Shield size={14} className="text-emerald-500" />;
      case 'EMPLOYEE': return <Code size={14} className="text-slate-600" />;
      case 'TRAINEE': return <GraduationCap size={14} className="text-teal-500" />;
      default: return <UserCheck size={14} />;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-bold text-xs transition-all shadow-xs cursor-pointer"
      >
        <span className="p-1 rounded-md bg-amber-400 text-slate-950">
          {getRoleIcon(activeRole)}
        </span>
        <div className="text-left">
          <span className="text-[10px] text-amber-700 block font-semibold leading-none">Active Role</span>
          <span className="font-extrabold text-slate-900 leading-tight">{activeObj.label}</span>
        </div>
        <ChevronDown size={13} className="text-amber-800 ml-0.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2.5 text-xs animate-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10.5px] font-black text-slate-900 uppercase tracking-wider">
                Switch Role Account
              </div>
              <p className="text-[10px] text-slate-400">Single session login enforced</p>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
              RBAC Live
            </span>
          </div>

          <div className="py-2 space-y-1 max-h-[340px] overflow-y-auto">
            {ROLE_DETAILS.map((r) => {
              const isCurrent = r.key === activeRole;
              const isTarget = switchingTo === r.key;
              return (
                <button
                  key={r.key}
                  disabled={loading}
                  onClick={() => handleSelectRole(r.key)}
                  className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white font-bold shadow-md'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isCurrent ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-100'}`}>
                      {getRoleIcon(r.key)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-extrabold text-xs ${isCurrent ? 'text-amber-300' : 'text-slate-900'}`}>
                          {r.label}
                        </span>
                        {r.key === 'FOUNDER' && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                            Master
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                        {r.defaultName} &bull; {r.title}
                      </p>
                      <span className={`text-[9.5px] font-semibold block mt-0.5 ${isCurrent ? 'text-amber-200' : 'text-amber-700'}`}>
                        {r.accessScope}
                      </span>
                    </div>
                  </div>

                  {isTarget ? (
                    <RefreshCw size={14} className="animate-spin text-amber-500 flex-shrink-0 mt-1" />
                  ) : isCurrent ? (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md flex-shrink-0 mt-1">
                      Active
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            Switching logs out current role and loads new role session.
          </div>
        </div>
      )}
    </div>
  );
}
