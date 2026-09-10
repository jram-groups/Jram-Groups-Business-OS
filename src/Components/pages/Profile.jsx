import { useState, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User, Mail, Phone, Building2, Briefcase, Camera, Trash2,
  CheckCircle2, AlertCircle, Lock, Shield, Sparkles, KeyRound,
  Eye, EyeOff, Save, RefreshCw, ShieldCheck, Check, ArrowUpRight,
  Crown, Database, Activity, Laptop, Smartphone, Clock, RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { getRoleConfig, ROLE_DETAILS } from '../../services/rbac';

export default function Profile() {
  const context = useOutletContext() || {};
  const activeUser = context.user || api.auth.getActiveUser();
  const refreshUser = context.refreshUser || (() => { });
  const setUser = context.setUser || (() => { });

  const currentRole = activeUser?.role || 'FOUNDER';
  const roleConfig = getRoleConfig(currentRole);

  // Tabs: 'personal' | 'role' | 'security'
  const [activeTab, setActiveTab] = useState('personal');

  // Form State
  const [formData, setFormData] = useState({
    first_name: activeUser?.first_name || '',
    last_name: activeUser?.last_name || '',
    email: activeUser?.email || '',
    phone: activeUser?.phone || '',
    department: activeUser?.department || 'Executive Office',
    designation: activeUser?.designation || 'Staff',
    bio: activeUser?.bio || '',
  });

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(activeUser?.profile_image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  // Password Change State
  const [passData, setPassData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // UI Alerts
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Compute Default Name Letter Monogram Initials
  const nameInitials = useMemo(() => {
    const f = (formData.first_name || activeUser?.first_name || 'A').trim();
    const l = (formData.last_name || activeUser?.last_name || '').trim();
    return `${f[0] || 'A'}${l[0] || ''}`.toUpperCase();
  }, [formData.first_name, formData.last_name, activeUser]);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setSelectedFile(file);
    setRemoveImage(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    showToast('info', 'New photo selected. Click "Save Profile Changes" to commit changes to db.sqlite3.');
  };

  // Revert to default monogram letter avatar
  const handleUseNameLetters = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('info', 'Reverted to default monogram letter avatar. Click "Save Profile Changes" to apply.');
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('user_id', activeUser?.id || '');
      data.append('role', currentRole);
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('department', formData.department);
      data.append('designation', formData.designation);
      data.append('bio', formData.bio);

      if (selectedFile) {
        data.append('profile_image', selectedFile);
      } else if (removeImage) {
        data.append('remove_image', 'true');
      }

      const res = await api.auth.updateProfile(data);

      if (res.success && res.user) {
        setUser(res.user);
        setPreviewUrl(res.user.profile_image || null);
        setSelectedFile(null);
        setRemoveImage(false);
        refreshUser();
        showToast('success', 'Profile & avatar successfully saved in db.sqlite3!');
      } else {
        showToast('error', res.message || 'Failed to update profile.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error updating profile in database.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passData.new_password) {
      showToast('error', 'Please enter a new password.');
      return;
    }
    if (passData.new_password !== passData.confirm_password) {
      showToast('error', 'New passwords do not match. Please verify.');
      return;
    }
    if (passData.new_password.length < 4) {
      showToast('error', 'Password must be at least 4 characters.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.auth.changePassword({
        current_password: passData.current_password,
        new_password: passData.new_password,
      });

      if (res.success) {
        showToast('success', 'Password successfully updated and encrypted in db.sqlite3!');
        setPassData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        showToast('error', res.message || 'Password update failed.');
      }
    } catch (err) {
      showToast('error', err.message || 'Error changing password.');
    } finally {
      setPassLoading(false);
    }
  };

  const isCustomPhotoActive = Boolean(previewUrl && !removeImage);

  return (
    <div className="page-container max-w-7xl mx-auto space-y-6" style={{ paddingTop: '52px' }}>
      {/* Toast Alert Feedback */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md border transition-all animate-in fade-in slide-in-from-top-3 ${feedback.type === 'success'
            ? 'bg-emerald-50/95 text-emerald-900 border-emerald-200/80 shadow-emerald-500/10'
            : feedback.type === 'error'
              ? 'bg-rose-50/95 text-rose-900 border-rose-200/80 shadow-rose-500/10'
              : 'bg-amber-50/95 text-amber-950 border-amber-200/80 shadow-amber-500/10'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
            ) : (
              <Sparkles size={18} className="text-amber-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Redesigned Luxury Hero Header Card with 3D Pop-Out Half-Body Executive */}
      <div className="dashboard-card relative p-6 sm:p-8 bg-gradient-to-br from-white via-amber-50/25 to-slate-50 border border-slate-200/90 shadow-sm rounded-3xl">
        {/* Inner Clipped Decorative Background Lighting */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-400/15 via-amber-200/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl" />
        </div>

        {/* Right Side: 3D Pop-Out Half-Body Executive Character Breaking Out of Div */}
        <div className="hidden lg:flex flex-col items-center absolute right-6 xl:right-7 bottom-0 z-20 pointer-events-none select-none">
          {/* 3D Depth Portal / Halo Glow Behind the Character */}
          <div className="absolute -inset-6 bg-gradient-to-t from-amber-400/25 via-amber-300/10 to-transparent rounded-full blur-2xl -bottom-2" />

          {/* 3D Perspective Backdrop Glass Disc */}
          <div
            style={{ transform: 'perspective(600px) rotateY(-15deg) rotateX(4deg)' }}
            className="absolute bottom-1 w-30 xl:w-55 h-60 rounded-3xl bg-gradient-to-tr from-amber-300/25 via-white/55 to-amber-100/20 border border-amber-300/50 shadow-lg backdrop-blur-xs"
          />

          {/* 3D Half-Body Character Popping Out of Card */}
          <img
            src="/executive_half_3d_transparent.png"
            alt="Executive Director 3D"
            className="mt-3 h-64 xl:h-[250px] w-auto object-contain relative z-10 filter drop-shadow-[0_20px_25px_rgba(15,23,42,0.35)] drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)] transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out"
          />

          {/* Floating 3D Foreground Glass Badge */}
          <div className="absolute bottom-3 z-30 p-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-400/60 shadow-xl flex items-center gap-1.5 text-white transform -translate-y-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider uppercase text-amber-300">Founder & CEO</span>
          </div>
        </div>

        {/* Main Hero Information (Left & Center) */}
        <div className="relative z-10 max-w-3xl">
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300/70 text-amber-950 text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs">
              <Crown size={13} className="text-amber-600" />
              <span>JRAM Groups Executive Profile</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Session</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <Database size={12} className="text-slate-500" />
              <span>SQLite Persistent</span>
            </span>
          </div>

          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar Section: Custom Photo OR Default Monogram Name Letters */}
            <div className="relative flex-shrink-0 group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-900 shadow-md ring-4 ring-amber-100/90 overflow-hidden flex items-center justify-center border border-amber-300/60 relative">
                {isCustomPhotoActive ? (
                  <img
                    src={previewUrl}
                    alt={activeUser?.full_name || 'Profile Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Default Luxury Monogram Name Letters */
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-3xl sm:text-4xl flex items-center justify-center tracking-wider shadow-inner select-none">
                    {nameInitials}
                  </div>
                )}

                {/* Quick Camera Hover Overlay */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  title="Click to change photo"
                >
                  <Camera size={20} className="text-amber-400 mb-0.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Change</span>
                </div>
              </div>

              {/* Floating Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 border border-amber-300"
                title="Upload custom image"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* User Title & Badges */}
            <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formData.first_name || activeUser?.first_name} {formData.last_name || activeUser?.last_name}
                </h1>
                <span className={`p-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-2xs ${roleConfig.badge}`}>
                  {roleConfig.label}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 font-semibold flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span>{formData.designation || 'Staff'}</span>
                <span className="text-slate-300">&bull;</span>
                <span>{formData.department || 'Executive Office'}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
                  @{activeUser?.username}
                </span>
              </p>

              {/* Action Buttons: Upload Photo / Revert to Default Name Letters */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary text-xs cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5"
                >
                  <Camera size={14} />
                  <span>{isCustomPhotoActive ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {isCustomPhotoActive ? (
                  <button
                    type="button"
                    onClick={handleUseNameLetters}
                    className="btn-secondary text-xs text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5"
                    title="Remove custom photo and use default monogram name letters"
                  >
                    <RotateCcw size={14} className="text-amber-600" />
                    <span>Default Name Letter</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-amber-800/80 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-lg">
                    Default Name Letter Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Modern Segmented Pill Toggle Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 gap-1 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`p-2 rounded-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap ${activeTab === 'personal'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
          >
            <User size={14} className={activeTab === 'personal' ? 'text-amber-500' : 'text-slate-400'} />
            <span>Personal Profile</span>
            {activeTab === 'personal' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('role')}
            className={`p-2 rounded-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap ${activeTab === 'role'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
          >
            <Shield size={14} className={activeTab === 'role' ? 'text-amber-500' : 'text-slate-400'} />
            <span>Role &amp; Permissions</span>
            {activeTab === 'role' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`p-2 rounded-3 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none whitespace-nowrap ${activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
          >
            <KeyRound size={14} className={activeTab === 'security' ? 'text-amber-500' : 'text-slate-400'} />
            <span>Security &amp; Password</span>
            {activeTab === 'security' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11.5px] font-bold text-slate-400 pr-2">
          <span>Active View: <strong className="text-slate-700 capitalize">{activeTab}</strong></span>
          <span>&bull;</span>
          <span className="text-emerald-700 font-extrabold flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            db.sqlite3 Connected
          </span>
        </div>
      </div>

      {/* Highlights Grid (4 Key Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highlight 1: Role Authority */}
        <div className="stat-card border border-slate-200/90 hover:border-amber-300 transition-all p-4 rounded-2xl bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Authority</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Crown size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base font-black text-slate-900">{roleConfig.label}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{roleConfig.accessScope}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10.5px] font-bold text-amber-600">
            <span>{roleConfig.allowedModules.length} Modules Accessible</span>
          </div>
        </div>

        {/* Highlight 2: Account Security */}
        <div className="stat-card border border-slate-200/90 hover:border-emerald-300 transition-all p-4 rounded-2xl bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Security Architecture</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base font-black text-emerald-800">RBAC Tier 1 Enforced</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">PBKDF2 SHA-256 Auth</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10.5px] font-bold text-emerald-600">
            <span>Encrypted SQLite Vault</span>
          </div>
        </div>

        {/* Highlight 3: Organization Unit */}
        <div className="stat-card border border-slate-200/90 hover:border-blue-300 transition-all p-4 rounded-2xl bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Organization Unit</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base font-black text-slate-900 truncate">{formData.department || 'Executive Office'}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{formData.designation || 'Staff'}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10.5px] font-bold text-blue-600">
            <span>JRAM Groups Enterprise OS</span>
          </div>
        </div>

        {/* Highlight 4: Persistence Health */}
        <div className="stat-card border border-slate-200/90 hover:border-purple-300 transition-all p-4 rounded-2xl bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Database Connection</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base font-black text-slate-900">db.sqlite3 Live</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Django ORM Signal Linked</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10.5px] font-bold text-purple-600">
            <span>Synchronized Storage</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Personal Profile Details Form */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSubmitProfile} className="space-y-6">
          <div className="dashboard-card p-6 sm:p-8 border border-slate-200/90 bg-white rounded-2xl shadow-sm space-y-6">
            {/* Form Header */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-base tracking-tight">Personal Profile &amp; Contact Info</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage your executive profile, contact reachability, and corporate biography.</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
                <Database size={12} className="text-amber-600" />
                <span>Stored in db.sqlite3</span>
              </span>
            </div>

            {/* Form Fields Grid with High Visibility, Crisp Borders, and Clear Alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {/* First Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  First Name <span className="text-amber-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    placeholder="e.g. Arun"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Last Name
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    placeholder="e.g. Kumar"
                  />
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Corporate Email <span className="text-amber-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    placeholder="name@jramgroups.com"
                    required
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Contact Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Department / Business Unit
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Building2 size={16} />
                  </div>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    placeholder="e.g. Executive Office, Operations, Engineering"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Job Title / Official Designation
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Briefcase size={16} />
                  </div>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    placeholder="e.g. Founder & Group Director"
                  />
                </div>
              </div>

              {/* Username (Locked System Identifier) */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Account Handle (Immutable)
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Lock size={15} />
                  </div>
                  <input
                    type="text"
                    value={activeUser?.username || ''}
                    disabled
                    style={{ paddingLeft: '2.6rem', paddingRight: '6.5rem' }}
                    className="w-full h-11 bg-slate-100/90 border border-slate-300 rounded-xl text-xs sm:text-[13px] font-mono font-extrabold text-slate-600 cursor-not-allowed select-all shadow-2xs"
                  />
                  <span className="absolute right-3 p-1 rounded-md bg-slate-200/90 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-300/70">
                    SYSTEM ID
                  </span>
                </div>
              </div>

              {/* Organizational Access Level */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Organizational Access Level
                </label>
                <div className="w-full h-11 px-4 bg-slate-50/90 border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <Shield size={16} className="text-amber-600 flex-shrink-0" />
                    <span className="text-xs sm:text-[13px] font-black text-slate-900 truncate">
                      {roleConfig.title || roleConfig.label}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-md text-[10.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 border border-amber-500/40 flex-shrink-0">
                    {roleConfig.label}
                  </span>
                </div>
              </div>

              {/* Professional Bio */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Professional Biography &amp; Executive Summary
                </label>
                <div className="relative">
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full p-2 mb-2 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-semibold text-slate-900 shadow-2xs transition-all outline-none leading-relaxed"
                    placeholder="Share a concise description of your leadership focus, project governance, or core engineering disciplines..."
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span>All profile updates persist immediately to <strong className="text-slate-800">db.sqlite3</strong></span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-7 py-2.5 text-xs font-bold cursor-pointer self-stretch sm:self-auto flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving to SQLite...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Role & System Authorization Matrix */}
      {activeTab === 'role' && (
        <div className="space-y-6">
          <div className="dashboard-card p-6 sm:p-7 space-y-6 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Role-Based Access Control (RBAC) Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Current privileges and security boundaries assigned to your account profile.</p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-xl shadow-2xs self-start sm:self-auto ${roleConfig.badge}`}>
                {roleConfig.label}
              </span>
            </div>

            {/* Role Overview Box */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Crown size={18} className="text-amber-600" />
                <span>{roleConfig.title} &mdash; {roleConfig.accessScope}</span>
              </div>
              <p className="text-xs mb-0 text-slate-700 leading-relaxed">
                {roleConfig.description}
              </p>
            </div>

            {/* Allowed Modules Badges */}
            <div className="space-y-3 mt-4">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Authorized Operating System Modules ({roleConfig.allowedModules.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {roleConfig.allowedModules.map((mod) => (
                  <div
                    key={mod}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300/80 transition-all flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {mod.replace('-', ' ')}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px]">
                      <Check size={12} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Separation Summary Table */}
            <div className="space-y-3 pt-2 mt-4">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Separation of Privilege Tiers
              </h4>
              <div className="table-responsive rounded-xl border border-slate-200/80 overflow-hidden">
                <table className="table mb-0 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Access Scope</th>
                      <th className="py-2.5 px-3">Financial Ledger</th>
                      <th className="py-2.5 px-3">Staff Directory</th>
                      <th className="py-2.5 px-3">Active Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ROLE_DETAILS.map((r) => {
                      const isCurrent = r.key === currentRole;
                      return (
                        <tr key={r.key} className={isCurrent ? 'bg-amber-50/60 font-bold' : ''}>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.badge}`}>
                              {r.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{r.accessScope}</td>
                          <td className="py-2.5 px-3">
                            {['FOUNDER', 'CEO'].includes(r.key) ? (
                              <span className="text-emerald-700 font-bold">Verified Access</span>
                            ) : (
                              <span className="text-slate-400 font-semibold">Restricted</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {r.key === 'FOUNDER' ? (
                              <span className="text-amber-700 font-bold">Encrypted Payroll</span>
                            ) : ['CEO', 'MANAGER'].includes(r.key) ? (
                              <span className="text-slate-700 font-semibold">Directory Only</span>
                            ) : (
                              <span className="text-slate-400 font-semibold">Hidden</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {isCurrent ? (
                              <span className="text-emerald-700 font-black flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Current Session
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Credentials */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <form onSubmit={handlePasswordChange} className="dashboard-card p-6 sm:p-7 space-y-6 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Change Master Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your authentication credentials. Hashed using standard Django PBKDF2 SHA-256 algorithm and stored in SQLite.
                </p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl self-start sm:self-auto">
                Encrypted Vault
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 max-w-2xl">
              {/* Current Password */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Current Password <span className="text-amber-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passData.current_password}
                    onChange={(e) => setPassData({ ...passData, current_password: e.target.value })}
                    placeholder="Enter current password (default: password123)"
                    style={{ paddingLeft: '2.6rem', paddingRight: '2.8rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    title={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  New Password <span className="text-amber-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passData.new_password}
                    onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                    placeholder="At least 4 characters"
                    style={{ paddingLeft: '2.6rem', paddingRight: '2.8rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    title={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-amber-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
                    <CheckCircle2 size={16} />
                  </div>
                  <input
                    type="password"
                    value={passData.confirm_password}
                    onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                    placeholder="Re-enter new password"
                    style={{ paddingLeft: '2.6rem' }}
                    className="w-full h-11 bg-white border border-slate-300 hover:border-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs sm:text-[13px] font-bold text-slate-900 shadow-2xs transition-all outline-none pr-4"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Password hash writes directly into <code className="font-mono font-bold text-slate-700">db.sqlite3</code>
              </span>
              <button
                type="submit"
                disabled={passLoading}
                className="btn-primary px-7 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {passLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Updating in SQLite...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Session & Device Information */}
          <div className="dashboard-card p-6 sm:p-7 mt-3 space-y-4 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Laptop size={16} className="text-amber-500" />
                Active Session &amp; System Device
              </h3>
              <span className="text-[10.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 p-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Current Machine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300/80 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Frontend Host</span>
                <div className="font-mono font-bold text-slate-800">http://localhost:5173</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300/80 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Backend API Host</span>
                <div className="font-mono font-bold text-slate-800">http://localhost:8000/api</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300/80 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Storage Engine</span>
                <div className="font-mono font-bold text-amber-800">SQLite (db.sqlite3)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
