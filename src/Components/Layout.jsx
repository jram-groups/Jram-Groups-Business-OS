import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BriefcaseBusiness, CheckSquare, BarChart3,
  Settings, LogOut, Menu, X, Bell, Search, FileText, Receipt,
  DollarSign, Share2, Shield, Activity, Sparkles, ShieldCheck,
  ChevronDown, PanelLeftClose, PanelLeftOpen, User, TrendingUp, CreditCard, Boxes
} from "lucide-react";


import RoleSwitcher from "./common/RoleSwitcher";
import NotificationDrawer from "./common/NotificationDrawer";
import { hasAccess, getRoleConfig } from "../services/rbac";
import { api } from "../services/api";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop compact/expand state
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false); // Sidebar bottom menu popover state
  const sidebarMenuRef = useRef(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [user, setUser] = useState(() => api.auth.getActiveUser());
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Close mobile sidebar, user menu, and sidebar bottom menu on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setSidebarMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener to close sidebar footer menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(event.target)) {
        setSidebarMenuOpen(false);
      }
    }
    if (sidebarMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarMenuOpen]);

  const handleRoleChanged = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    api.auth.logout();
    navigate("/");
  };

  const toggleSection = (title) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const currentRole = user?.role || "FOUNDER";
  const roleConfig = getRoleConfig(currentRole);

  // Grouped Navigation Definition with RBAC Module Keys
  const navSections = [
    {
      title: "Main Workspace",
      items: [
        { path: "/dashboard", module: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/clients", module: "clients", label: "Clients & CRM", icon: Users },
        { path: "/projects", module: "projects", label: "Projects & Priority", icon: BriefcaseBusiness },
        { path: "/tasks", module: "tasks", label: "Tasks & Hours", icon: CheckSquare },
      ],
    },
    {
      title: "Digital & Social Media",
      items: [
        { path: "/digital-marketing", module: "digital-marketing", label: "Social Media Clients", icon: Share2 },
      ],
    },
    {
      title: "Sales & Finance",
      items: [
        { path: "/quotations", module: "quotations", label: "Quotations", icon: FileText },
        { path: "/invoices", module: "invoices", label: "Invoices", icon: Receipt },
        { path: "/income", module: "income", label: "Income Tracking", icon: TrendingUp },
        { path: "/expenses", module: "expenses", label: "Expense Tracking", icon: CreditCard },
        { path: "/financial", module: "financial", label: "Financial Ledger", icon: DollarSign },
      ],
    },
    {
      title: "Operations & Assets",
      items: [
        { path: "/stock-equipments", module: "stock-equipments", label: "Stock & Equipments", icon: Boxes },
      ],
    },
    {
      title: "People & Administration",
      items: [
        { path: "/employees", module: "employees", label: "Employees & HR", icon: Shield },
        { path: "/reports", module: "reports", label: "Reports & Analytics", icon: BarChart3 },
        { path: "/activity-logs", module: "activity-logs", label: "System Audit Logs", icon: Activity },
      ],
    },

  ];

  return (
    <div className="dashboard-page">
      {/* Mobile / Tablet Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[1049] bg-slate-950/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop expands to 260px or collapses to compact 64px) */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "show" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className={`flex h-full flex-col ${sidebarCollapsed ? "p-2.5 items-center" : "p-4"}`}>

          {/* Logo Header & Expand/Collapse Toggle Button */}
          {!sidebarCollapsed ? (
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                  J
                </div>
                <div className="leading-tight truncate">
                  <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                    JRAM Groups<span className="text-amber-500">.</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Business OS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-all"
                  title="Collapse sidebar"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <PanelLeftClose size={18} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden cursor-pointer flex-shrink-0"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center pb-3 mb-2 border-b border-slate-100">
              <button
                type="button"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-all"
                title="Expand sidebar"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          )}



          {/* Navigation Links — With Row-Wise Gaps, Section Toggles, and Smooth Scroll */}
          <div className="w-full flex-1 sidebar-scroll space-y-4">
            {navSections.map((sec) => {
              const accessibleItems = sec.items.filter((item) => hasAccess(currentRole, item.module));
              if (accessibleItems.length === 0) return null;
              const isCollapsed = collapsedSections[sec.title];

              return (
                <div key={sec.title} className="space-y-1.5">
                  {!sidebarCollapsed && (
                    <div
                      onClick={() => toggleSection(sec.title)}
                      className="flex items-center justify-between px-2.5 py-1 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 select-none group transition-all"
                    >
                      <span>{sec.title}</span>
                      <ChevronDown
                        size={13}
                        className={`text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </div>
                  )}

                  {(!isCollapsed || sidebarCollapsed) && (
                    <nav className="space-y-1">
                      {accessibleItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                          >
                            <Icon size={16} className="flex-shrink-0" />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </NavLink>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer: Single Row with Menu (Profile & Settings popup) on Left and Logout on Right */}
          <div ref={sidebarMenuRef} className="w-full pt-3 mt-2 border-t border-slate-100 relative">
            {/* Popover Menu for Profile & Settings */}
            {sidebarMenuOpen && (
              <div
                className={`absolute z-50 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 ${
                  sidebarCollapsed ? "left-14 bottom-0 w-48" : "left-0 bottom-full mb-2 w-52"
                }`}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                    {roleConfig.label}
                  </span>
                </div>

                <NavLink
                  to="/profile"
                  onClick={() => setSidebarMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-amber-400 font-bold shadow-xs"
                        : "text-slate-700 hover:bg-amber-50 hover:text-amber-900"
                    }`
                  }
                >
                  <User size={15} className="flex-shrink-0" />
                  <span>My Profile</span>
                </NavLink>

                {hasAccess(currentRole, "settings") && (
                  <NavLink
                    to="/settings"
                    onClick={() => setSidebarMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-amber-400 font-bold shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`
                    }
                  >
                    <Settings size={15} className="flex-shrink-0" />
                    <span>Settings</span>
                  </NavLink>
                )}
              </div>
            )}

            {/* Single Row: Left Menu Icon Button, Right Logout Icon Button */}
            <div className={`flex items-center ${sidebarCollapsed ? "flex-col gap-1.5 justify-center" : "justify-between"}`}>
              {/* Left Side: Menu Option Button (Icon Only) */}
              <button
                type="button"
                onClick={() => setSidebarMenuOpen((prev) => !prev)}
                title="Menu (Profile & Settings)"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  sidebarMenuOpen || location.pathname === "/profile" || location.pathname === "/settings"
                    ? "bg-amber-100 text-amber-950 ring-1 ring-amber-300 font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Menu size={18} className="flex-shrink-0" />
              </button>

              {/* Right Side: Logout Option (Icon Only) */}
              <button
                type="button"
                title="Sign Out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
                onClick={() => {
                  setSidebarMenuOpen(false);
                  setShowLogoutModal(true);
                }}
              >
                <LogOut size={18} className="flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`dashboard-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Topbar */}
        <header className="topbar flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          {/* Left: Wide Top Search Bar (3-bar hamburger icon removed) */}
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                style={{ paddingLeft: '2.5rem' }}
                className="w-full pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 font-medium text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
                placeholder="Search workspace, clients, projects, tasks..."
              />
            </div>
          </div>

          {/* Right: Notifications & Modern Dynamic Welcome Wish + User Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Notification Bell Button (Clean & transparent) */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Modern Welcome Greeting & User Profile Card with 3D PNG Emojis & Wider Spacing */}
            <div className="relative">
              <div
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3.5 pl-4 sm:pl-5 border-l border-slate-200 cursor-pointer group transition-all"
                title="Account Menu"
              >
                {(() => {
                  const hour = new Date().getHours();
                  let greetingText = "Good Evening,";
                  let emojiSrc = "/emojis/sunset_3d.png";
                  let emojiAlt = "Evening";

                  if (hour < 12) {
                    greetingText = "Good Morning,";
                    emojiSrc = "/emojis/sunrise_3d.png";
                    emojiAlt = "Morning";
                  } else if (hour < 17) {
                    greetingText = "Good Afternoon,";
                    emojiSrc = "/emojis/sun_3d.png";
                    emojiAlt = "Afternoon";
                  } else if (hour < 21) {
                    greetingText = "Good Evening,";
                    emojiSrc = "/emojis/sunset_3d.png";
                    emojiAlt = "Evening";
                  } else {
                    greetingText = "Good Night,";
                    emojiSrc = "/emojis/moon_3d.png";
                    emojiAlt = "Night";
                  }

                  return (
                    <div className="text-right leading-tight hidden sm:block">
                      <div className="text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors flex items-center justify-end gap-1.5">
                        <img
                          src={emojiSrc}
                          alt={emojiAlt}
                          className="w-6 h-6 object-contain flex-shrink-0 drop-shadow-xs group-hover:scale-115 transition-transform duration-200"
                        />
                        <span>{greetingText}</span>
                      </div>
                      <div className="text-[13px] font-extrabold text-slate-900 truncate max-w-[200px] mt-0.5">
                        {user?.full_name || "Arun Kumar"}
                      </div>
                    </div>
                  );
                })()}

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm shadow-amber-500/20 group-hover:ring-2 group-hover:ring-amber-400 transition-all flex-shrink-0 border border-amber-300/40 overflow-hidden">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user?.full_name || 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    user?.avatar_text || "AK"
                  )}
                </div>
              </div>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[1050]"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-[1051] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0 overflow-hidden">
                        {user?.profile_image ? (
                          <img src={user.profile_image} alt={user?.full_name || 'Avatar'} className="w-full h-full object-cover" />
                        ) : (
                          user?.avatar_text || "AK"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {user?.full_name || 'Arun Kumar'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {user?.email || 'user@jramgroups.com'}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold text-[9px] uppercase">
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 cursor-pointer transition-colors"
                      >
                        <User size={15} className="text-amber-600" />
                        <span>My Profile</span>
                      </button>

                      {hasAccess(currentRole, 'settings') && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                        >
                          <Settings size={15} className="text-slate-500" />
                          <span>System Settings</span>
                        </button>
                      )}
                    </div>

                    <div className="p-1.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <LogOut size={15} className="text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet with Active Context */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet context={{ user, roleConfig, refreshUser: fetchUser, setUser }} />
        </main>
      </div>

      {/* Sign Out Confirmation Modal Alert */}
      {showLogoutModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-content-custom max-w-sm text-center p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <LogOut size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Sign Out</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to end your active session for <strong className="text-slate-800">{user?.full_name || 'Arun Kumar'} ({roleConfig.label})</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary flex-1 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="btn-danger flex-1 py-2 text-xs font-bold cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onCountUpdate={(cnt) => setUnreadCount(cnt)}
      />
    </div>
  );
}
