import { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  ShieldAlert,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Calendar,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';

export default function NotificationDrawer({ isOpen, onClose, onCountUpdate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.list();
      const list = res.data || res.results || (Array.isArray(res) ? res : []);
      setNotifications(list);
      const unread = list.filter((n) => !n.read_state).length;
      onCountUpdate && onCountUpdate(unread);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleExpand = (id, e) => {
    e && e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCardClick = async (n) => {
    // Toggle expand state
    handleToggleExpand(n.id);
    // Mark read if unread
    if (!n.read_state) {
      try {
        await api.notifications.markRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read_state: true } : item))
        );
        const remainingUnread = notifications.filter((item) => item.id !== n.id && !item.read_state).length;
        onCountUpdate && onCountUpdate(remainingUnread);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read_state).length;
  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read_state) : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'urgent_project':
        return {
          icon: ShieldAlert,
          bg: 'bg-red-50 text-red-600 border-red-200',
          badgeBg: 'bg-red-100 text-red-700',
          badgeText: 'Urgent Alert'
        };
      case 'task_assigned':
        return {
          icon: FolderGit2,
          bg: 'bg-blue-50 text-blue-600 border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-700',
          badgeText: 'Task Update'
        };
      case 'client_lead':
        return {
          icon: Sparkles,
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          badgeBg: 'bg-purple-100 text-purple-700',
          badgeText: 'New Client'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          badgeBg: 'bg-amber-100 text-amber-800',
          badgeText: 'System Alert'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[1060] overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 select-none">

        {/* ============================================================
            1. HEADER SECTION
            ============================================================ */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs flex-shrink-0 border border-amber-300">
                <Bell size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                    Notification Center
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  Real-time alerts &amp; workflow updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Tabs & Quick Action Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filter === 'unread'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================
            2. NOTIFICATIONS LIST (COMPACT SHORT CARDS + EXPANDABLE)
            ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5">
          {loading ? (
            <div className="flex flex-col gap-3.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">All caught up!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
                {filter === 'unread'
                  ? 'No unread notifications right now.'
                  : 'No active workflow alerts or notifications in your inbox.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => {
              const config = getNotificationIcon(n.notification_type);
              const IconComp = config.icon;
              const isExpanded = expandedIds.has(n.id);
              const isUnread = !n.read_state;

              return (
                <div
                  key={n.id}
                  onClick={() => handleCardClick(n)}
                  className={`w-full flex-shrink-0 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    isUnread
                      ? 'bg-amber-50/40 border-amber-300/90 shadow-2xs hover:border-amber-400 hover:bg-amber-50/70'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  {/* Short / Compact Header Row with Centered Left Icon & Centered Right Arrow */}
                  <div className="p-3 sm:p-3.5 flex items-center gap-3">
                    {/* Compact Icon Squircle (Vertically Centered) */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${config.bg}`}
                    >
                      <IconComp size={16} />
                    </div>

                    {/* Short Card Summary */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${config.badgeBg}`}>
                          {config.badgeText}
                        </span>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium flex-shrink-0">
                          <Clock size={10} />
                          <span>
                            {new Date(n.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Title (Compact with clean truncation to prevent button push) */}
                      <div
                        className={`text-xs font-bold tracking-tight truncate ${
                          isUnread ? 'text-slate-950 font-extrabold' : 'text-slate-800'
                        }`}
                      >
                        {n.title}
                      </div>

                      {/* Collapsed 1-Line Preview Teaser */}
                      {!isExpanded && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-tight">
                          {n.message}
                        </p>
                      )}
                    </div>

                    {/* Expand/Collapse Toggle Button (Guaranteed Visible & Centered) */}
                    <div
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 flex items-center justify-center cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand full details'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* ============================================================
                      EXPANDED FULL DETAIL WITH BALANCED, EVEN PADDING & ALIGNMENT
                      ============================================================ */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50/90 border-t border-slate-100 animate-in fade-in duration-150">
                      {/* Inner message card with even padding */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                        <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                          {n.message}
                        </p>
                      </div>

                      {/* Aligned Footer Row */}
                      <div className="mt-2.5 px-0.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                          <Calendar size={11} className="text-slate-400" />
                          <span>
                            {new Date(n.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} &bull; {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpand(n.id);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-[10.5px] font-bold transition-colors cursor-pointer"
                        >
                          Collapse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ============================================================
            3. FOOTER INFO BAR
            ============================================================ */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center flex-shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">
            JRAM Groups &bull; Instant Notification Stream Active
          </p>
        </div>

      </div>
    </div>
  );
}
