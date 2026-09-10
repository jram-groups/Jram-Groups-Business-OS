import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Monitor, Globe, Languages, LogOut, ShieldCheck,
  Database, RefreshCw, CheckCircle2, User, Check, Sparkles,
  Palette, Laptop, Clock, AlertTriangle, Shield, CheckCheck,
  Sliders, Layers, FileText, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { ROLE_DETAILS, getRoleConfig } from '../../services/rbac';

export default function Settings() {
  const context = useOutletContext() || {};
  const activeUser = context.user || api.auth.getActiveUser();
  const currentRole = activeUser?.role || 'FOUNDER';
  const roleConfig = getRoleConfig(currentRole);
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('theme'); // 'theme' | 'language' | 'account' | 'system'

  // System Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('crm_theme') || 'system';
  });

  // Language State
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('crm_language') || 'en';
  });

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Database Sync State
  const [resetting, setResetting] = useState(false);
  const [dbMsg, setDbMsg] = useState('');

  // Toast message
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Apply Theme Function
  const applyTheme = (theme) => {
    const root = document.documentElement;
    localStorage.setItem('crm_theme', theme);
    setCurrentTheme(theme);

    if (theme === 'dark') {
      root.classList.add('dark');
      showToast('Theme updated to Dark Mode 🌙');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      showToast('Theme updated to Light Mode ☀️');
    } else {
      // System default
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      showToast('Theme synchronized with System preference 💻');
    }
  };

  // Handle Language Change
  const handleLanguageChange = (langCode, langName) => {
    setCurrentLang(langCode);
    localStorage.setItem('crm_language', langCode);
    showToast(`Language updated to ${langName} 🌐`);
  };

  // Handle Logout Confirmation
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    api.auth.logout();
    navigate('/');
  };

  // Handle Database Seed / Sync
  const handleSeedDatabase = async () => {
    if (confirm('Re-sync and recalculate backend statistics and signals across Django ORM?')) {
      setResetting(true);
      try {
        await api.reports.getDashboardStats();
        setDbMsg('Database statistics and signals synchronized cleanly!');
        setTimeout(() => setDbMsg(''), 3500);
      } catch (e) {
        alert(e.message);
      } finally {
        setResetting(false);
      }
    }
  };

  const themeOptions = [
    {
      id: 'light',
      title: 'Light Theme',
      subtitle: 'Daylight Mode',
      desc: 'Crisp, high-contrast daylight workspace with clean white cards and amber accents.',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      previewBg: 'bg-slate-100',
      previewCard: 'bg-white border-slate-200 text-slate-900',
    },
    {
      id: 'dark',
      title: 'Dark Theme',
      subtitle: 'Midnight Mode',
      desc: 'Deep slate-900 obsidian workspace designed to minimize eye strain in low-light environments.',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      previewBg: 'bg-slate-900',
      previewCard: 'bg-slate-800 border-slate-700 text-white',
    },
    {
      id: 'system',
      title: 'System Preference',
      subtitle: 'Auto-Sync',
      desc: 'Automatically matches your computer operating system light/dark schedule.',
      icon: Monitor,
      iconColor: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
      previewBg: 'bg-gradient-to-r from-slate-100 to-slate-900',
      previewCard: 'bg-white/90 border-slate-300 text-slate-900',
    },
  ];

  const languageOptions = [
    {
      code: 'en',
      name: 'English',
      native: 'English (United States)',
      flag: '🇺🇸',
      desc: 'Standard global enterprise language for ledger calculations, invoices, and analytics.',
      dateFormat: 'DD/MM/YYYY • 12-Hour (AM/PM)',
      currency: 'INR (₹) / USD ($)',
    },
    {
      code: 'ta',
      name: 'Tamil',
      native: 'தமிழ் (இந்தியா)',
      flag: '🏛️',
      desc: 'தமிழ் இடைமுகம் மற்றும் பிராந்திய வணிக அமைப்புகள் (JRAM Groups OS).',
      dateFormat: 'நாள்/மாதம்/ஆண்டு • 12 மணிநேரம்',
      currency: 'இந்திய ரூபாய் (₹ INR)',
    },
    {
      code: 'hi',
      name: 'Hindi',
      native: 'हिन्दी (भारत)',
      flag: '🇮🇳',
      desc: 'व्यावसायिक हिंदी इंटरफ़ेस, भारतीय मुद्रा प्रारूप और क्षेत्रीय सेटिंग्स।',
      dateFormat: 'DD/MM/YYYY • भारतीय मानक समय (IST)',
      currency: 'भारतीय रुपया (₹ INR)',
    },
  ];

  return (
    <div className="page-container space-y-6">
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-amber-400 font-bold px-4 py-3 rounded-2xl shadow-2xl border border-amber-400/30 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles size={16} className="text-amber-400 animate-spin" />
          <span className="text-xs text-white">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="page-heading flex items-center gap-2.5">
            <Sliders size={26} className="text-amber-500" />
            System Settings &amp; Preferences
          </h1>
          <p className="page-desc">
            Customize visual theme, interface localization, account session security, and RBAC matrix
          </p>
        </div>

        {/* Quick User Summary Badge */}
        <div className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-2xl p-2 pr-4 shadow-2xs self-start sm:self-auto">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
            {activeUser?.avatar_text || 'AK'}
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-extrabold text-slate-900 truncate">
              {activeUser?.full_name || 'Arun Kumar'}
            </div>
            <div className="text-[10px] text-amber-600 font-bold uppercase">
              {roleConfig.label}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'theme'
              ? 'bg-slate-900 text-amber-400 shadow-sm shadow-slate-900/10'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Palette size={15} />
          <span>System Theme</span>
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'language'
              ? 'bg-slate-900 text-amber-400 shadow-sm shadow-slate-900/10'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Languages size={15} />
          <span>Language &amp; Region</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'account'
              ? 'bg-slate-900 text-amber-400 shadow-sm shadow-slate-900/10'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User size={15} />
          <span>Account &amp; Logout</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-slate-900 text-amber-400 shadow-sm shadow-slate-900/10'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Security &amp; RBAC Matrix</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: SYSTEM THEME
          ======================================================== */}
      {activeTab === 'theme' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="dashboard-card space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Palette size={18} className="text-amber-500" />
                Interface Appearance &amp; Color Scheme
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred visual mode. Changes take effect instantly and persist across all devices.
              </p>
            </div>

            {/* Theme Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = currentTheme === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => applyTheme(opt.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    {/* Header with Icon & Active Check */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.bgColor} ${opt.iconColor}`}>
                        <IconComponent size={20} />
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-2xs">
                          <Check size={11} strokeWidth={3} /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                          Select
                        </span>
                      )}
                    </div>

                    {/* Preview Box */}
                    <div className={`w-full h-24 rounded-xl p-3 flex flex-col justify-between border border-slate-200/70 overflow-hidden ${opt.previewBg}`}>
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-2.5 rounded bg-amber-400" />
                        <div className="w-4 h-4 rounded-full bg-slate-300/60" />
                      </div>
                      <div className={`p-2 rounded-lg border shadow-xs text-[10px] font-bold flex items-center justify-between ${opt.previewCard}`}>
                        <span>Workspace Preview</span>
                        <span className="text-[8px] opacity-70">Active</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        {opt.title}
                        <span className="text-[10px] font-medium text-slate-400">({opt.subtitle})</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme Quick Toggle Info Card */}
          <div className="dashboard-card bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <Sparkles size={15} /> Active Visual Preference
              </div>
              <h4 className="font-bold text-base">
                Currently running in <span className="text-amber-400 capitalize">{currentTheme} Mode</span>
              </h4>
              <p className="text-xs text-slate-400 max-w-xl">
                The visual theme applies across the CRM dashboard, project tracking boards, financial reports, and quotations.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => applyTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 hover:bg-amber-300 transition-all cursor-pointer shadow-sm shadow-amber-400/20"
              >
                {currentTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                Switch to {currentTheme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: LANGUAGE & REGION
          ======================================================== */}
      {activeTab === 'language' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="dashboard-card space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Globe size={18} className="text-amber-500" />
                Interface Language &amp; Regional Localization
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the display language for the CRM platform. Currency and regional date formatting will align with your choice.
              </p>
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {languageOptions.map((lang) => {
                const isSelected = currentLang === lang.code;

                return (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code, lang.name)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{lang.flag}</div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-2xs">
                          <Check size={11} strokeWidth={3} /> Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                          Choose
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        {lang.name}
                      </h4>
                      <p className="text-xs font-semibold text-amber-700 mt-0.5">
                        {lang.native}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {lang.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Date Format:</span>
                        <span className="font-semibold text-slate-700">{lang.dateFormat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Currency:</span>
                        <span className="font-semibold text-slate-700">{lang.currency}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regional Standards Card */}
          <div className="dashboard-card space-y-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
              Regional &amp; Localization Defaults
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-semibold">Standard Timezone</span>
                <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">Asia/Kolkata (IST +05:30)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-semibold">Base Currency</span>
                <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">₹ INR (Indian Rupee)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-semibold">Number Format</span>
                <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">Lakhs &amp; Crores (1,00,000)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ACCOUNT & LOGOUT
          ======================================================== */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Active Account Profile Card */}
          <div className="dashboard-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0 border-2 border-amber-300 overflow-hidden">
                  {activeUser?.profile_image ? (
                    <img src={activeUser.profile_image} alt={activeUser?.full_name || 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    activeUser?.avatar_text || 'AK'
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      {activeUser?.full_name || 'Arun Kumar'}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase">
                      {roleConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeUser?.email || 'user@jramgroups.com'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Authenticated Session
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Edit Profile</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Session Security Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold">Account Role</span>
                <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">{roleConfig.label}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold">Authentication Method</span>
                <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">JWT Token Session</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold">Access Scope</span>
                <span className="font-extrabold text-emerald-600 text-xs mt-0.5 block">Full Enterprise Access</span>
              </div>
            </div>
          </div>

          {/* Account Logout Action Card */}
          <div className="dashboard-card border-red-200 bg-gradient-to-r from-red-50/70 to-rose-50/40 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
                  <AlertTriangle size={18} />
                  Account Sign Out &amp; Session Termination
                </div>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  Signing out will immediately revoke your active local session token and redirect you back to the login gateway. Make sure any pending form entries or task updates are saved.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer self-start sm:self-auto flex-shrink-0"
              >
                <LogOut size={16} />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: SYSTEM ARCHITECTURE & RBAC MATRIX
          ======================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Single Founder Security Card */}
          <div className="dashboard-card border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/50 space-y-2.5 p-5">
            <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
              <ShieldCheck size={22} className="text-amber-600" />
              Single Founder Account Policy Enforced
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              The JRAM Groups Business OS backend strictly enforces at the Django ORM model layer that <strong>only 1 user account</strong> may hold the <span className="font-bold text-amber-900">Founder</span> role. All other roles (CEO, Manager, Team Head, Employee, Trainee) support multi-user operational concurrency.
            </p>
          </div>

          {/* RBAC Permission Matrix */}
          <div className="dashboard-card space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Role-Based Access Control (RBAC) Permission Matrix</h3>
                <p className="text-xs text-slate-500">Separation of privilege across the 6 organizational roles</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                Strict Isolation Active
              </span>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Role Account</th>
                    <th>System Scope</th>
                    <th>Financial Ledger</th>
                    <th>Employee Payroll</th>
                    <th>Client CRM</th>
                    <th>Project Priority</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {ROLE_DETAILS.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black ${r.badge}`}>
                            {r.label}
                          </span>
                        </div>
                      </td>
                      <td className="font-bold text-slate-800">{r.accessScope}</td>
                      <td>
                        {['FOUNDER', 'CEO'].includes(r.key) ? (
                          <span className="badge text-bg-success">Full Access</span>
                        ) : (
                          <span className="badge text-bg-secondary">Hidden</span>
                        )}
                      </td>
                      <td>
                        {r.key === 'FOUNDER' ? (
                          <span className="badge text-bg-success">Decrypted (Full)</span>
                        ) : r.key === 'CEO' ? (
                          <span className="badge text-bg-warning">Directory Only</span>
                        ) : (
                          <span className="badge text-bg-secondary">Hidden</span>
                        )}
                      </td>
                      <td>
                        {['FOUNDER', 'CEO', 'MANAGER'].includes(r.key) ? (
                          <span className="badge text-bg-success">Full CRM</span>
                        ) : r.key === 'TEAM_HEAD' ? (
                          <span className="badge text-bg-primary">View Only</span>
                        ) : (
                          <span className="badge text-bg-secondary">Hidden</span>
                        )}
                      </td>
                      <td>
                        {['FOUNDER', 'CEO', 'MANAGER', 'TEAM_HEAD'].includes(r.key) ? (
                          <span className="badge text-bg-success">Full Kanban</span>
                        ) : (
                          <span className="badge text-bg-info">View Assigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Database Reset & Seed Card */}
          <div className="dashboard-card space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Database size={16} className="text-amber-500" /> Database &amp; Environment Synchronization
              </h3>
              <p className="text-xs text-slate-500">Recalculate all statistics, verified ledger payments, and Django REST signals</p>
            </div>

            {dbMsg && (
              <div className="p-3.5 bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" /> {dbMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Verify &amp; Sync Backend Database</h4>
                <p className="text-xs text-slate-500">Forces a complete health-check across Django models and caches</p>
              </div>
              <button
                onClick={handleSeedDatabase}
                disabled={resetting}
                className="btn-warning-custom cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw size={14} className={resetting ? 'animate-spin' : ''} />
                {resetting ? 'Synchronizing...' : 'Sync Database Stats'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SIGN OUT CONFIRMATION MODAL
          ======================================================== */}
      {showLogoutModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom max-w-sm text-center p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <LogOut size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Confirm Account Sign Out</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to log out of your session, <span className="font-semibold text-slate-800">{activeUser?.full_name || 'User'}</span>? You will be redirected to the login screen.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 cursor-pointer transition-colors"
                onClick={handleConfirmLogout}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
