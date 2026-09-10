import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  X,
  KeyRound,
  Crown,
  Briefcase,
  UserCheck,
  Shield,
  Code,
  GraduationCap,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { api } from "../../services/api";

const DEMO_ACCOUNTS = [
  { label: "Founder", user: "arun_founder", name: "Arun Kumar", icon: Crown, color: "#d97706", bg: "bg-amber-50 text-amber-950 border-amber-200" },
  { label: "CEO", user: "priya_ceo", name: "Priya Sharma", icon: Briefcase, color: "#9333ea", bg: "bg-purple-50 text-purple-950 border-purple-200" },
  { label: "Manager", user: "rahul_manager", name: "Rahul Raj", icon: UserCheck, color: "#2563eb", bg: "bg-blue-50 text-blue-950 border-blue-200" },
  { label: "Team Head", user: "divya_lead", name: "Divya Menon", role: "TEAM_HEAD", icon: Shield, color: "#059669", bg: "bg-emerald-50 text-emerald-950 border-emerald-200" },
  { label: "Employee", user: "rohan_dev", name: "Rohan Das", role: "EMPLOYEE", icon: Code, color: "#475569", bg: "bg-slate-100 text-slate-900 border-slate-300" },
  { label: "Intern", user: "kavya_intern", name: "Kavya Nair", role: "TRAINEE", icon: GraduationCap, color: "#0d9488", bg: "bg-teal-50 text-teal-950 border-teal-200" },
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setErrorMsg("Please enter your Username or Employee ID.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      api.auth.logout();

      const res = await api.auth.login({
        username: username.trim(),
        password: password,
      });

      if (res.success && res.user) {
        navigate("/dashboard");
      } else {
        setErrorMsg(res.message || "Invalid credentials. Please verify your details.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Unable to connect to the authentication server. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (acc) => {
    setUsername(acc.user);
    setPassword("password123");
    setErrorMsg("");
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans relative selection:bg-amber-400 selection:text-slate-950">
      
      {/* Background Subtle Ambient Highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-gradient-to-b from-amber-100/50 via-slate-100/30 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-12 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-12 left-12 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none -z-10" />

      {/* Main Split Card */}
      <div className="w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* ============================================================
            LEFT COLUMN: BRANDING & WELCOME WISH
            ============================================================ */}
        <div 
          className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800"
          style={{ padding: '36px 32px' }}
        >
          {/* Ambient Glow */}
          <div className="absolute top-[-20%] left-[-20%] w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

          {/* Top Brand Monogram */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/25 border border-amber-300 flex-shrink-0">
                J
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight leading-none text-white">
                  JRAM Groups
                </h1>
                <span className="text-amber-400 font-bold text-xs tracking-wide block mt-1">
                  Business OS
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold leading-normal">
              <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
              <span>Enterprise Operating System</span>
            </div>
          </div>

          {/* Center Welcome Greeting */}
          <div className="my-auto py-6 relative z-10">
            <h2 className="text-2xl sm:text-[25px] font-extrabold tracking-tight text-white leading-tight">
              Welcome to your <br />
              <span className="text-amber-400">
                Business Workspace
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Enterprise platform powering customer relationships, projects, operations &amp; finance across JRAM Groups.
            </p>
          </div>

          {/* Bottom Security Badge */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 relative z-10">
            <ShieldCheck size={14} className="text-amber-400 flex-shrink-0" />
            <span>256-Bit Encrypted &bull; Single Role Session Active</span>
          </div>
        </div>


        {/* ============================================================
            RIGHT COLUMN: PERFECTLY EVENLY SPACED LOGIN FORM
            ============================================================ */}
        <div 
          className="lg:col-span-7 bg-white flex flex-col justify-center"
          style={{ padding: '36px 36px' }}
        >
          <div className="w-full max-w-[360px] mx-auto">
            
            {/* 1. Header Block */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-950 text-[11px] font-bold leading-normal mb-2">
                <Sparkles size={12} className="text-amber-600 flex-shrink-0" />
                <span>Personnel Authentication</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Sign In to Workspace
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your Username or Employee ID &amp; Password.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">{errorMsg}</div>
              </div>
            )}

            {/* 2. Form with Even & Consistent Gaps */}
            <form onSubmit={handleSubmit}>
              
              {/* Field 1: Username / Employee ID */}
              <div className="mb-3.5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username / Employee ID
                </label>
                <div className="login-input-wrapper">
                  <User size={17} className="input-left-icon" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. arun_founder or JRAM-EMP-001"
                    autoComplete="username"
                    className="login-input-field"
                    style={{ height: '44px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="login-input-wrapper">
                  <Lock size={17} className="input-left-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="login-input-field"
                    style={{ height: '44px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Field 3: Remember Me & Access Help */}
              <div className="flex items-center justify-between mb-4 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-amber-500 cursor-pointer"
                  />
                  <span>Remember this session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <HelpCircle size={13} className="text-slate-400" />
                  <span>Access Help</span>
                </button>
              </div>

              {/* Field 4: Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn mb-4"
                style={{ height: '46px', fontSize: '14px', marginTop: '0' }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Business OS</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* 3. Quick Test Accounts Accordion */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-amber-800 transition-colors py-0.5 cursor-pointer font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound size={14} className="text-amber-600" />
                  <span>Quick Test Accounts (Click to Auto-fill)</span>
                </span>
                {showDemoDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDemoDrawer && (
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-150">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const IconComp = acc.icon;
                    return (
                      <button
                        key={acc.user}
                        type="button"
                        onClick={() => handleQuickFill(acc)}
                        className={`p-2 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${acc.bg}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <IconComp size={13} style={{ color: acc.color }} />
                          <span className="font-extrabold text-[11px]">
                            {acc.label}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium opacity-80 truncate">{acc.name}</p>
                        <p className="text-[9.5px] font-mono font-bold opacity-90 truncate">{acc.user}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Access / Forgot Password Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Account Access Help</h3>
                <p className="text-xs text-slate-500">JRAM Groups Credential Policy</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-5">
              <p>
                <strong className="text-slate-900">Need Login Credentials?</strong><br />
                User accounts, Employee IDs, and access passwords are created and provisioned directly by the <strong className="text-amber-800">Founder, CEO, or Operations Manager</strong>.
              </p>
              <p>
                <strong className="text-slate-900">Forgot your password?</strong><br />
                Please contact your team lead or administrative department to have your credentials reissued or password reset.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Got it, Return to Sign In
            </button>
          </div>
        </div>
      )}

    </div>
  );
}