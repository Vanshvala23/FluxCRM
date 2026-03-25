import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import {
  LayoutDashboard, Users, TrendingUp, Ticket, FileText,
  LogOut, Menu, X, Zap, ChevronRight, Bell,
  Search, Settings, User, Shield, ChevronDown,
  Check, Trash2, Info, AlertCircle, CheckCircle, CheckSquare,
  FileSignature, Package, Loader2, RefreshCw, FolderKanban,
} from 'lucide-react';

// ── Nav structure ─────────────────────────────────────────────────────────────
const navGroups = [
  {
    key: 'dashboard',
    label: null,
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    key: 'customer',
    label: 'Customer',
    items: [
      { path: '/contacts',  label: 'Contacts', icon: Users      },
      { path: '/leads',     label: 'Leads',    icon: TrendingUp },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    items: [
      { path: '/proposals', label: 'Proposals', icon: FileSignature },
      { path: '/invoices',  label: 'Invoices',  icon: FileText     },
      {path:'/credit-note',label:'Credit Notes',icon:FileText},
      { path: '/items',     label: 'Items',     icon: Package      },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    items: [
      { path: '/tickets', label: 'Tickets', icon: Ticket },
    ],
  },
  {
    key: 'projects',
    label: 'Projects',
    items: [
      { path: '/projects', label: 'Projects', icon: FolderKanban },
      { path: '/tasks',    label: 'Tasks',    icon: CheckSquare  },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function buildNotifications(contacts, leads, tickets, proposals,creditNotes) {
  const items = [];

  // Recent contacts
  contacts.slice(0, 3).forEach(c => {
    items.push({
      id:    `contact-${c._id}`,
      type:  'info',
      title: 'New contact added',
      desc:  `${c.firstName} ${c.lastName}${c.company ? ` from ${c.company}` : ''}`,
      time:  c.createdAt,
      link:  '/contacts',
    });
  });

  // Won leads
  leads.filter(l => l.status === 'won').slice(0, 2).forEach(l => {
    items.push({
      id:    `lead-won-${l._id}`,
      type:  'success',
      title: 'Lead won! 🎉',
      desc:  `"${l.title}" — $${(l.value || 0).toLocaleString()}`,
      time:  l.updatedAt,
      link:  '/leads',
    });
  });

  // New leads
  leads.filter(l => l.status === 'new').slice(0, 2).forEach(l => {
    items.push({
      id:    `lead-new-${l._id}`,
      type:  'info',
      title: 'New lead created',
      desc:  `"${l.title}" assigned to pipeline`,
      time:  l.createdAt,
      link:  '/leads',
    });
  });

  // Open / critical tickets
  tickets.filter(t => t.status === 'open').slice(0, 3).forEach(t => {
    const isCritical = t.priority === 'critical' || t.priority === 'high';
    items.push({
      id:    `ticket-${t._id}`,
      type:  isCritical ? 'warning' : 'info',
      title: isCritical ? '🚨 Urgent ticket open' : 'Open ticket',
      desc:  t.title,
      time:  t.createdAt,
      link:  '/tickets',
    });
  });

  // Accepted / rejected proposals
  const proposalList = Array.isArray(proposals) ? proposals : (proposals?.data || []);

  proposalList.filter(p => p.status === 'accepted').slice(0, 2).forEach(p => {
    items.push({
      id:    `proposal-accepted-${p._id}`,
      type:  'success',
      title: 'Proposal accepted! 🎉',
      desc:  `"${p.title}" — $${(p.amount || 0).toLocaleString()}`,
      time:  p.respondedAt || p.updatedAt,
      link:  '/proposals',
    });
  });

  proposalList.filter(p => p.status === 'rejected').slice(0, 1).forEach(p => {
    items.push({
      id:    `proposal-rejected-${p._id}`,
      type:  'warning',
      title: 'Proposal rejected',
      desc:  `"${p.title}"`,
      time:  p.respondedAt || p.updatedAt,
      link:  '/proposals',
    });
  });

  // Expiring proposals (within 3 days)
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  proposalList
    .filter(p => ['sent', 'viewed'].includes(p.status) && p.validUntil && new Date(p.validUntil) <= soon)
    .slice(0, 2)
    .forEach(p => {
      items.push({
        id:    `proposal-expiring-${p._id}`,
        type:  'warning',
        title: 'Proposal expiring soon ⏰',
        desc:  `"${p.title}" expires ${new Date(p.validUntil).toLocaleDateString()}`,
        time:  p.updatedAt,
        link:  '/proposals',
      });
    });
    // Credit Notes (recent)
creditNotes?.slice(0, 3).forEach(cn => {
  items.push({
    id:    `credit-${cn._id}`,
    type:  'info',
    title: 'New credit note created',
    desc:  `${cn.reference || 'CN'} — ₹${(cn.total || 0).toLocaleString()}`,
    time:  cn.createdAt,
    link:  '/credit-note',
  });
});

// Applied credit notes
creditNotes?.filter(cn => cn.status === 'applied').slice(0, 2).forEach(cn => {
  items.push({
    id:    `credit-applied-${cn._id}`,
    type:  'success',
    title: 'Credit applied',
    desc:  `₹${(cn.total || 0).toLocaleString()} applied to invoice`,
    time:  cn.updatedAt,
    link:  '/credit-notes',
  });
});

  return items
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 12);
}

const notifIcon  = { info: Info, success: CheckCircle, warning: AlertCircle };
const notifColor = {
  info:    'text-blue-500  bg-blue-50',
  success: 'text-green-500 bg-green-50',
  warning: 'text-amber-500 bg-amber-50',
};

// ── Notifications Dropdown ────────────────────────────────────────────────────
function NotificationsDropdown() {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [readIds, setReadIds]             = useState(new Set());
  const [dismissed, setDismissed]         = useState(new Set());
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false));

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, leadsRes, ticketsRes, proposalsRes,creditNoteRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/leads'),
        api.get('/tickets'),
        api.get('/proposals'),
        api.get('/credit-notes'),
      ]);
      setNotifications(buildNotifications(
        contactsRes.data,
        leadsRes.data,
        ticketsRes.data,
        proposalsRes.data,
        creditNoteRes.data,
      ));
    } catch {
      // silently fail — no toast, no console noise
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + refresh every 60 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const visible  = notifications.filter(n => !dismissed.has(n.id));
  const unread   = visible.filter(n => !readIds.has(n.id)).length;

  const markRead    = (id)  => setReadIds(s => new Set([...s, id]));
  const markAllRead = ()    => setReadIds(new Set(visible.map(n => n.id)));
  const dismiss     = (id, e) => { e.stopPropagation(); setDismissed(s => new Set([...s, id])); };
  const clearAll    = ()    => setDismissed(new Set(notifications.map(n => n.id)));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
              {unread > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && visible.length === 0 ? (
              <div className="py-10 flex items-center justify-center text-gray-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : visible.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p>No notifications</p>
              </div>
            ) : (
              visible.map(n => {
                const isRead = readIds.has(n.id);
                const Icon   = notifIcon[n.type];
                return (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!isRead ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${notifColor[n.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!isRead ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => dismiss(n.id, e)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{n.desc}</p>
                      <p className="text-[11px] text-gray-300 mt-0.5">{timeAgo(n.time)}</p>
                    </div>
                    {!isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
              <span className="text-xs text-gray-300">{visible.length} total</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── User Dropdown ─────────────────────────────────────────────────────────────
function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [open, setOpen]   = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats]     = useState(null);
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get('/auth/me'),
      api.get('/contacts'),
      api.get('/leads'),
      api.get('/tickets'),
      api.get('/proposals'),
      api.get('/invoices/stats'),
      api.get('/credit-notes'),
    ]).then(([me, contacts, leads, tickets, proposals, invoiceStats]) => {
      setProfile(me.data);
      const proposalList = Array.isArray(proposals.data)
        ? proposals.data
        : (proposals.data?.data || []);
      setStats({
        contacts:  Array.isArray(contacts.data) ? contacts.data.length : (contacts.data?.total ?? 0),
        leads:     Array.isArray(leads.data)    ? leads.data.length    : (leads.data?.length ?? 0),
        tickets:   (Array.isArray(tickets.data) ? tickets.data : []).filter(t => t.status === 'open').length,
        proposals: proposalList.length,
        invoices:  invoiceStats.data?.total ?? 0,
        creditNotes: Array.isArray(creditNotes.data)
    ? creditNotes.data.length
    : (creditNotes.data?.total ?? 0),
      });
    }).catch(() => {});
  }, [open]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const displayUser  = profile || user;

  const statItems = [
    { label: 'Contacts',  key: 'contacts',  link: '/contacts'  },
    { label: 'Leads',     key: 'leads',     link: '/leads'     },
    { label: 'Tickets',   key: 'tickets',   link: '/tickets'   },
    { label: 'Proposals', key: 'proposals', link: '/proposals' },
    { label: 'Invoices',  key: 'invoices',  link: '/invoices'  },
    { label: 'Credit Notes', key: 'creditNotes', link: '/credit-notes' },
  ];

  const menuItems = [
    { icon: User,     label: 'My Profile', action: () => setOpen(false) },
    { icon: Settings, label: 'Settings',   action: () => setOpen(false) },
    { icon: Shield,   label: 'Security',   action: () => setOpen(false) },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded px-2 py-1.5 transition-colors"
      >
        <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {displayUser?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-700 leading-none">{displayUser?.name}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{displayUser?.role}</p>
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-64 bg-white rounded shadow-lg border border-gray-200 z-50">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {displayUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{displayUser?.name}</p>
                <p className="text-xs text-gray-400 truncate">{displayUser?.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-primary-100 text-primary-700 font-semibold px-1.5 py-0.5 rounded capitalize">
                  {displayUser?.role}
                </span>
              </div>
            </div>

            {/* Live stats — 5 columns, 5 items */}
            {stats ? (
              <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-gray-100">
                {statItems.map(s => (
                  <Link
                    key={s.key}
                    to={s.link}
                    onClick={() => setOpen(false)}
                    className="text-center hover:bg-gray-50 rounded p-1 transition-colors"
                  >
                    <p className="text-base font-bold text-gray-800">{stats[s.key]}</p>
                    <p className="text-[9px] text-gray-400 leading-tight">{s.label}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1a1f2e' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #2e3447' }}>
        <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">FluxCRM</span>
          <p className="text-xs" style={{ color: '#8b92a5' }}>Business Suite</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.key} className="mb-2">
            {group.label && (
              <p
                className="px-4 py-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#8b92a5' }}
              >
                {group.label}
              </p>
            )}
            {group.items.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path || location.pathname.startsWith(path + '/');
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150"
                  style={{
                    color:           active ? '#ffffff'    : '#8b92a5',
                    backgroundColor: active ? '#2d3348'    : 'transparent',
                    borderLeft:      active ? '3px solid #e51d1d' : '3px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#2d3348';
                      e.currentTarget.style.color           = '#ffffff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color           = '#8b92a5';
                    }
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: '#e51d1d' }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0">
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 flex flex-col">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 text-white opacity-60 hover:opacity-100"
            >
              <X className="w-5 h-5" />
            </button>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 mr-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 w-48 focus:w-64 transition-all"
              placeholder="Search..."
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <NotificationsDropdown />
            <UserDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}