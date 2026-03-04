import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Search, Pencil, Trash2, X, FileText, AlertTriangle,
  ChevronDown, Calendar, User, Users, Tag, TrendingUp,
  Clock, CheckCircle, PauseCircle, XCircle, PlayCircle,
  BarChart2, DollarSign, Layers, MoreHorizontal, Target,
  IndianRupee, ChevronRight,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  planning:  { label: 'Planning',   color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    icon: Clock       },
  active:    { label: 'Active',     color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',    icon: PlayCircle  },
  on_hold:   { label: 'On Hold',    color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500',   icon: PauseCircle },
  completed: { label: 'Completed',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled',  color: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     icon: XCircle     },
};

const PRIORITY_META = {
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400'    },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600',       dot: 'bg-blue-400'    },
  high:   { label: 'High',   color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500'  },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700',         dot: 'bg-red-500'     },
};

const EMPTY_FORM = {
  name: '', description: '', status: 'planning', priority: 'medium',
  client: '', manager: '', members: [],
  startDate: '', dueDate: '',
  budget: 0, spent: 0, currency: 'INR',
  progress: 0, tags: '', notes: '',
};

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const personName = (u) => {
  if (!u) return '—';
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return n || u.name || u.email || '—';
};
const contactName = (c) => {
  if (!c) return '—';
  const n = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return n || c.name || c.email || '—';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.planning;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function ProgressBar({ value = 0, size = 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  const color = value >= 100 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : value >= 30 ? 'bg-amber-500' : 'bg-gray-300';
  return (
    <div className={`w-full bg-gray-100 rounded-full ${h} overflow-hidden`}>
      <div className={`${h} rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

// ─── Searchable Select ────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder = 'Select…', nullable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sub || '').toLowerCase().includes(query.toLowerCase())
  );
  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all focus:outline-none bg-white
          ${open ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
        {selected ? (
          <span className="flex flex-col min-w-0">
            <span className="text-gray-900 font-medium truncate">{selected.label}</span>
            {selected.sub && <span className="text-xs text-gray-400 truncate">{selected.sub}</span>}
          </span>
        ) : <span className="text-gray-400">{placeholder}</span>}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900 placeholder-gray-400"
                placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {nullable && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors italic ${!value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-400 hover:bg-gray-50'}`}>
                None
              </button>
            )}
            {filtered.length === 0
              ? <p className="px-4 py-3 text-sm text-gray-400 text-center">No results</p>
              : filtered.map(o => (
                <button key={o.value} type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${o.value === value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}>
                  <span className="block font-medium truncate">{o.label}</span>
                  {o.sub && <span className="block text-xs text-gray-400 truncate">{o.sub}</span>}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-select for members ─────────────────────────────────────────────────

function MultiSelect({ values = [], onChange, options, placeholder = 'Select members…' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggle = (val) => {
    onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val]);
  };

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const selectedOptions = options.filter(o => values.includes(o.value));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all bg-white min-h-[42px]
          ${open ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedOptions.map(o => (
              <span key={o.value} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {o.label}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
                  className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        ) : <span className="text-gray-400">{placeholder}</span>}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900 placeholder-gray-400"
                placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map(o => (
              <button key={o.value} type="button" onClick={() => toggle(o.value)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center gap-3">
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${values.includes(o.value) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                  {values.includes(o.value) && <CheckCircle className="w-3 h-3 text-white" />}
                </span>
                <span className="text-gray-900 font-medium truncate">{o.label}</span>
                {o.sub && <span className="text-xs text-gray-400 truncate ml-auto">{o.sub}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Project Form Modal ───────────────────────────────────────────────────────

function ProjectModal({ project, contacts, users, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!project) return EMPTY_FORM;
    return {
      name:        project.name || '',
      description: project.description || '',
      status:      project.status || 'planning',
      priority:    project.priority || 'medium',
      client:      project.client?._id || project.client || '',
      manager:     project.manager?._id || project.manager || '',
      members:     (project.members || []).map(m => m._id || m),
      startDate:   project.startDate ? project.startDate.split('T')[0] : '',
      dueDate:     project.dueDate   ? project.dueDate.split('T')[0]   : '',
      budget:      project.budget   || 0,
      spent:       project.spent    || 0,
      currency:    project.currency || 'INR',
      progress:    project.progress || 0,
      tags:        (project.tags || []).join(', '),
      notes:       project.notes || '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const contactOptions = contacts.map(c => ({ value: c._id, label: contactName(c), sub: c.email }));
  const userOptions    = users.map(u => ({ value: u._id, label: personName(u), sub: u.email }));
  const currencyOptions = [
    { value: 'INR', label: 'INR (₹)' }, { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' },
  ];
  const statusOptions   = Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }));
  const priorityOptions = Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label }));

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Project name is required');
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        tags:    form.tags.split(',').map(t => t.trim()).filter(Boolean),
        budget:  Number(form.budget),
        spent:   Number(form.spent),
        progress: Number(form.progress),
        members: form.members,
        client:  form.client  || undefined,
        manager: form.manager || undefined,
      };
      if (project?._id) {
        await api.put(`/projects/${project._id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

  const sym = CURRENCY_SYMBOLS[form.currency] || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Name + Description */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Project Name *</label>
              <input className={inputCls} placeholder="e.g. Website Redesign Q3"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Project overview..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <div className="mt-1">
                <SearchableSelect value={form.status} onChange={v => set('status', v)} options={statusOptions} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <div className="mt-1">
                <SearchableSelect value={form.priority} onChange={v => set('priority', v)} options={priorityOptions} />
              </div>
            </div>
          </div>

          {/* Client + Manager */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Client</label>
              <div className="mt-1">
                <SearchableSelect value={form.client} onChange={v => set('client', v)}
                  options={contactOptions} placeholder="Select client…" nullable />
              </div>
            </div>
            <div>
              <label className={labelCls}>Project Manager</label>
              <div className="mt-1">
                <SearchableSelect value={form.manager} onChange={v => set('manager', v)}
                  options={userOptions} placeholder="Select manager…" nullable />
              </div>
            </div>
          </div>

          {/* Members */}
          <div>
            <label className={labelCls}>Team Members</label>
            <div className="mt-1">
              <MultiSelect values={form.members} onChange={v => set('members', v)}
                options={userOptions} placeholder="Add team members…" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" className={inputCls} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Currency</label>
              <div className="mt-1">
                <SearchableSelect value={form.currency} onChange={v => set('currency', v)} options={currencyOptions} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Budget ({sym})</label>
              <input type="number" min="0" className={inputCls} placeholder="0"
                value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Spent ({sym})</label>
              <input type="number" min="0" className={inputCls} placeholder="0"
                value={form.spent} onChange={e => set('spent', e.target.value)} />
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className={labelCls}>Progress — {form.progress}%</label>
            <div className="mt-2 space-y-2">
              <input type="range" min="0" max="100" className="w-full accent-indigo-600"
                value={form.progress} onChange={e => set('progress', Number(e.target.value))} />
              <ProgressBar value={form.progress} />
            </div>
          </div>

          {/* Tags + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tags (comma-separated)</label>
              <input className={inputCls} placeholder="design, frontend, mvp"
                value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Internal notes..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ project, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    try { await api.delete(`/projects/${project._id}`); onDeleted(); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Project?</h3>
        <p className="text-sm text-gray-500 mb-6">
          "<span className="font-medium text-gray-700">{project.name}</span>" will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handle} disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Detail Drawer ────────────────────────────────────────────────────

function ProjectDrawer({ project, onClose, onEdit, onProgressUpdate }) {
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [localProgress, setLocalProgress] = useState(project.progress || 0);
  const sym = CURRENCY_SYMBOLS[project.currency] || '₹';
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const isOverBudget = project.spent > project.budget && project.budget > 0;
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && !['completed', 'cancelled'].includes(project.status);

  const handleProgressSave = async () => {
    setUpdatingProgress(true);
    try {
      await api.patch(`/projects/${project._id}/progress`, { progress: localProgress });
      onProgressUpdate();
    } finally {
      setUpdatingProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs text-gray-400 font-medium mb-1">#{project._id?.slice(-6).toUpperCase()}</p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{project.name}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                    <AlertTriangle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Progress */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
              <span className="text-sm font-bold text-gray-900">{localProgress}%</span>
            </div>
            <ProgressBar value={localProgress} />
            <div className="mt-3 flex items-center gap-3">
              <input type="range" min="0" max="100" className="flex-1 accent-indigo-600"
                value={localProgress} onChange={e => setLocalProgress(Number(e.target.value))} />
              {localProgress !== project.progress && (
                <button onClick={handleProgressSave} disabled={updatingProgress}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  {updatingProgress ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Key info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Client</span>
              </div>
              <p className="font-semibold text-gray-900">{contactName(project.client)}</p>
              {project.client?.email && <p className="text-xs text-gray-400">{project.client.email}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Manager</span>
              </div>
              <p className="font-semibold text-gray-900">{personName(project.manager)}</p>
              {project.manager?.email && <p className="text-xs text-gray-400">{project.manager.email}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Start</span>
              </div>
              <p className="font-semibold text-gray-900">{fmtDate(project.startDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-400' : ''}`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${isOverdue ? 'text-red-500' : ''}`}>Due</span>
              </div>
              <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>{fmtDate(project.dueDate)}</p>
            </div>
          </div>

          {/* Budget */}
          {project.budget > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Budget</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-semibold text-gray-900">{sym}{fmt(project.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Spent</span>
                  <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>{sym}{fmt(project.spent)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Remaining</span>
                  <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                    {isOverBudget ? '-' : ''}{sym}{fmt(Math.abs(project.budget - project.spent))}
                  </span>
                </div>
                <div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden`}>
                    <div className={`h-2 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                  </div>
                  <p className={`text-xs mt-1 text-right font-medium ${isOverBudget ? 'text-red-500' : 'text-gray-400'}`}>
                    {budgetPct}% used{isOverBudget ? ' — Over budget!' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          {project.members?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Team Members</p>
              <div className="space-y-2">
                {project.members.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                      {personName(m).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{personName(m)}</p>
                      {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-gray-700">{project.description}</p>
            </div>
          )}

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-gray-700 bg-amber-50 rounded-xl px-4 py-3">{project.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Created: {fmtDate(project.createdAt)}</p>
            {project.completedAt && <p className="text-emerald-600">Completed: {fmtDate(project.completedAt)}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card (Grid View) ─────────────────────────────────────────────────

function ProjectCard({ project, onEdit, onDelete, onClick }) {
  const sym = CURRENCY_SYMBOLS[project.currency] || '₹';
  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && !['completed', 'cancelled'].includes(project.status);
  const isOverBudget = project.spent > project.budget && project.budget > 0;

  return (
    <div onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group relative">
      {/* Action buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Header */}
      <div className="mb-3 pr-16">
        <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-700 transition-colors line-clamp-1">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <StatusBadge status={project.status} />
        <PriorityBadge priority={project.priority} />
        {isOverdue && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span><span className="font-semibold text-gray-700">{project.progress || 0}%</span>
        </div>
        <ProgressBar value={project.progress || 0} size="sm" />
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {project.client && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />{contactName(project.client)}
            </span>
          )}
          {project.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              <Calendar className="w-3 h-3" />{fmtDate(project.dueDate)}
            </span>
          )}
        </div>
        {project.budget > 0 && (
          <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-gray-500'}`}>
            {sym}{fmt(project.budget)}
          </span>
        )}
      </div>

      {/* Members avatars */}
      {project.members?.length > 0 && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
          <div className="flex -space-x-1.5">
            {project.members.slice(0, 4).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700">
                {personName(m).charAt(0).toUpperCase()}
              </div>
            ))}
            {project.members.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 ml-1">{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Projects() {
  const [projects, setProjects]   = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [viewMode, setViewMode]   = useState('grid'); // 'grid' | 'table'
  const [stats, setStats]         = useState(null);

  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [drawerProject, setDrawerProject] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus)   params.status   = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (search)         params.search   = search;

      const [pRes, cRes, uRes, sRes] = await Promise.all([
        api.get('/projects', { params }),
        api.get('/contacts'),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/projects/stats').catch(() => ({ data: null })),
      ]);

      setProjects(pRes.data?.data || pRes.data || []);
      setContacts((cRes.data || []).map(c => ({
        ...c,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || c.name || c.email || '—',
      })));
      setUsers((uRes.data || []).map(u => ({
        ...u,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.name || u.email || '—',
      })));
      setStats(sRes.data);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus, filterPriority]);

  const handleSearch = (e) => { if (e.key === 'Enter') load(); };

  const refreshDrawer = async () => {
    await load();
    if (drawerProject) {
      try {
        const res = await api.get(`/projects/${drawerProject._id}`);
        setDrawerProject(res.data);
      } catch {}
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage all your client projects</p>
          </div>
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects || 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Avg Progress</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.avgProgress || 0}%</p>
            </div>
            <div className={`border rounded-xl px-4 py-3 ${stats.overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${stats.overdue > 0 ? 'text-red-500' : 'text-gray-400'}`}>Overdue</p>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.overdue || 0}</p>
            </div>
            <div className={`border rounded-xl px-4 py-3 ${stats.overBudget > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${stats.overBudget > 0 ? 'text-amber-600' : 'text-gray-400'}`}>Over Budget</p>
              <p className={`text-2xl font-bold ${stats.overBudget > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{stats.overBudget || 0}</p>
            </div>
          </div>
        )}

        {/* Status filter cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Object.entries(STATUS_META).map(([key, { label, dot }]) => {
            const count = stats?.byStatus?.[key] || 0;
            return (
              <button key={key} onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
                className={`rounded-xl px-3 py-3 text-center border transition-all bg-white
                  ${filterStatus === key ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium mt-0.5 text-gray-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Priority filter + View toggle */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="Search projects… (press Enter)"
              value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
            />
          </div>

          {/* Priority filter */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ value: '', label: 'All' }, ...Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label }))].map(opt => (
              <button key={opt.value} onClick={() => setFilterPriority(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${filterPriority === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Grid
            </button>
            <button onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Table
            </button>
          </div>

          {(filterStatus || filterPriority) && (
            <button onClick={() => { setFilterStatus(''); setFilterPriority(''); }}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white border border-gray-200 rounded-2xl">
            <Layers className="w-12 h-12 mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No projects found</p>
            <p className="text-sm mt-1">Create your first project to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          // ── Grid view ──
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard key={p._id} project={p}
                onClick={() => setDrawerProject(p)}
                onEdit={e => { e?.stopPropagation?.(); setModal(p); }}
                onDelete={e => { e?.stopPropagation?.(); setDeleteTarget(p); }}
              />
            ))}
          </div>
        ) : (
          // ── Table view ──
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map(p => {
                    const isOverdue = p.dueDate && new Date(p.dueDate) < new Date() && !['completed', 'cancelled'].includes(p.status);
                    return (
                      <tr key={p._id} onClick={() => setDrawerProject(p)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{p.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">#{p._id?.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-medium">{contactName(p.client)}</td>
                        <td className="px-4 py-4"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-4"><PriorityBadge priority={p.priority} /></td>
                        <td className="px-4 py-4 w-36">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={p.progress || 0} size="sm" />
                            <span className="text-xs font-semibold text-gray-600 w-8 text-right">{p.progress || 0}%</span>
                          </div>
                        </td>
                        <td className={`px-4 py-4 text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {fmtDate(p.dueDate)}
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button onClick={() => setModal(p)} className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ProjectModal
          project={modal === 'create' ? null : modal}
          contacts={contacts}
          users={users}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}

      {drawerProject && (
        <ProjectDrawer
          project={drawerProject}
          onClose={() => setDrawerProject(null)}
          onEdit={() => { setModal(drawerProject); setDrawerProject(null); }}
          onProgressUpdate={refreshDrawer}
        />
      )}
    </>
  );
}