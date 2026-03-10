import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import {
  Plus, Search, Pencil, Trash2, X, AlertTriangle,
  ChevronDown, Calendar, Clock, CheckCircle,
  CheckSquare, ListChecks, RefreshCw,
  Circle, PlayCircle, XCircle, DollarSign,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400',    icon: Circle      },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500',    icon: PlayCircle  },
  completed:   { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     icon: XCircle     },
};

const PRIORITY_META = {
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400'   },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600',     dot: 'bg-blue-400'   },
  high:   { label: 'High',   color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700',       dot: 'bg-red-500'    },
};

const EMPTY_FORM = {
  subject: '', description: '', priority: 'medium', status: 'pending',
  startDate: '', dueDate: '', billable: false, hourlyRate: 0,
  estimatedHours: 0, tags: '', visibility: 'private',
  recurrencePattern: 'none',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const isOverdue = (dueDate, status) =>
  dueDate && !['completed', 'cancelled'].includes(status) && new Date(dueDate) < new Date();

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}
    </span>
  );
}

function ProgressBar({ value = 0, size = 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  const color =
    value >= 100 ? 'bg-emerald-500' :
    value >= 60  ? 'bg-blue-500'    :
    value >= 30  ? 'bg-amber-500'   : 'bg-gray-300';
  return (
    <div className={`w-full bg-gray-100 rounded-full ${h} overflow-hidden`}>
      <div className={`${h} rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Avatar({ name = '?', size = 'sm' }) {
  const colors = [
    'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700',
    'bg-violet-100 text-violet-700', 'bg-teal-100 text-teal-700',
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colors[h]}`}>
      {initials}
    </div>
  );
}

// ─── Searchable Select ────────────────────────────────────────────────────────

function SearchableSelect({ value, onChange, options, placeholder = 'Select…', nullable = false }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left bg-white transition-all focus:outline-none
          ${open ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
        {selected
          ? <span className="text-gray-900 font-medium truncate">{selected.label}</span>
          : <span className="text-gray-400">{placeholder}</span>}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900"
                placeholder="Search…" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {nullable && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
                className="w-full text-left px-4 py-2.5 text-sm italic text-gray-400 hover:bg-gray-50">
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
                  {o.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────

function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!task) return EMPTY_FORM;
    return {
      subject:           task.subject || '',
      description:       task.description || '',
      priority:          task.priority || 'medium',
      status:            task.status || 'pending',
      startDate:         task.startDate ? task.startDate.split('T')[0] : '',
      dueDate:           task.dueDate   ? task.dueDate.split('T')[0]   : '',
      billable:          task.billable  || false,
      hourlyRate:        task.hourlyRate || 0,
      estimatedHours:    task.estimatedHours || 0,
      tags:              (task.tags || []).join(', '),
      visibility:        task.visibility || 'private',
      recurrencePattern: task.recurrencePattern || 'none',
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const priorityOptions = Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label }));

  const handleSave = async () => {
    if (!form.subject.trim()) return setError('Task subject is required');
    if (!form.startDate)      return setError('Start date is required');
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        tags:           form.tags.split(',').map(t => t.trim()).filter(Boolean),
        hourlyRate:     Number(form.hourlyRate),
        estimatedHours: Number(form.estimatedHours),
      };
      if (task?._id) {
        await api.put(`/tasks/${task._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div>
            <label className={labelCls}>* Subject</label>
            <input className={inputCls} placeholder="What needs to be done?"
              value={form.subject} onChange={e => set('subject', e.target.value)} />
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>* Status</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {Object.entries(STATUS_META).map(([v, m]) => (
                <button key={v} type="button" onClick={() => set('status', v)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border
                    ${form.status === v
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Priority</label>
              <div className="mt-1">
                <SearchableSelect value={form.priority} onChange={v => set('priority', v)} options={priorityOptions} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Visibility</label>
              <div className="mt-2 flex gap-2">
                {['private', 'public'].map(v => (
                  <button key={v} type="button" onClick={() => set('visibility', v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize
                      ${form.visibility === v
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>* Start Date</label>
              <input type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" className={inputCls} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Estimated Hours</label>
              <input type="number" min="0" className={inputCls} placeholder="0"
                value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hourly Rate</label>
              <input type="number" min="0" className={inputCls} placeholder="0"
                disabled={!form.billable}
                value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} />
            </div>
          </div>

          {/* Billable toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('billable', !form.billable)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.billable ? 'bg-indigo-600' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${form.billable ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-700 font-medium">Billable task</span>
            {form.billable && (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                ${form.hourlyRate || 0}/hr
              </span>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls}>Tags</label>
            <input className={inputCls} placeholder="e.g. design, backend, bug"
              value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Task details..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : (task ? 'Save Changes' : 'Create Task')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ task, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    try { await api.delete(`/tasks/${task._id}`); onDeleted(); }
    catch { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Task?</h3>
        <p className="text-sm text-gray-500 mb-6">
          "<span className="font-medium text-gray-700">{task.subject}</span>" will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
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

// ─── Task Detail Drawer ───────────────────────────────────────────────────────

function TaskDrawer({ task, onClose, onEdit, onRefresh }) {
  const [localChecklist, setLocalChecklist] = useState(task.checklist || []);
  const [localProgress, setLocalProgress]   = useState(task.progress || 0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [completing, setCompleting]         = useState(false);

  useEffect(() => {
    setLocalChecklist(task.checklist || []);
    setLocalProgress(task.progress || 0);
  }, [task]);

  const checkDone  = localChecklist.filter(c => c.completed).length;
  const overdueFlag = isOverdue(task.dueDate, task.status);
  const hoursUsed  = task.estimatedHours > 0
    ? Math.round((task.actualHours / task.estimatedHours) * 100) : 0;

  const toggleCheck = async (itemId, current) => {
    setLocalChecklist(prev => prev.map(c => c._id === itemId ? { ...c, completed: !c.completed } : c));
    try {
      await api.patch(`/tasks/${task._id}/checklist/${itemId}`, { completed: !current });
    } catch {
      setLocalChecklist(prev => prev.map(c => c._id === itemId ? { ...c, completed: current } : c));
    }
  };

  const handleProgressSave = async () => {
    setUpdatingProgress(true);
    try { await api.patch(`/tasks/${task._id}/progress`, { progress: localProgress }); onRefresh(); }
    finally { setUpdatingProgress(false); }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try { await api.post(`/tasks/${task._id}/complete`); onRefresh(); onClose(); }
    finally { setCompleting(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs text-gray-400 font-medium mb-1">#{task._id?.slice(-6).toUpperCase()}</p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{task.subject}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.billable && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    <DollarSign className="w-3 h-3" /> Billable
                  </span>
                )}
                {overdueFlag && (
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
              {localProgress !== task.progress && (
                <button onClick={handleProgressSave} disabled={updatingProgress}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 disabled:opacity-60 transition-colors">
                  {updatingProgress && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Start', value: fmtDate(task.startDate), overdue: false },
              { icon: <Clock className={`w-3.5 h-3.5 ${overdueFlag ? 'text-red-400' : ''}`} />, label: 'Due',
                value: fmtDate(task.dueDate), overdue: overdueFlag },
              { icon: <Clock className="w-3.5 h-3.5" />, label: 'Est. Hours', value: `${task.estimatedHours || 0}h`, overdue: false },
              { icon: <Clock className="w-3.5 h-3.5" />, label: 'Actual Hours',
                value: `${task.actualHours || 0}h${hoursUsed > 0 ? ` (${hoursUsed}%)` : ''}`,
                overdue: hoursUsed > 100 },
            ].map(({ icon, label, value, overdue }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className={`flex items-center gap-2 mb-1 ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                  {icon}
                  <span className={`text-xs font-semibold uppercase tracking-wide ${overdue ? 'text-red-500' : ''}`}>{label}</span>
                </div>
                <p className={`font-semibold text-sm ${overdue ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Assignees */}
          {task.assignees?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assignees</p>
              <div className="space-y-2">
                {task.assignees.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <Avatar name={a.name || a.email || '?'} size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.name || '—'}</p>
                      {a.email && <p className="text-xs text-gray-400">{a.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          {localChecklist.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Checklist</p>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {checkDone}/{localChecklist.length}
                </span>
              </div>
              <ProgressBar value={(checkDone / localChecklist.length) * 100} size="sm" />
              <div className="mt-3 space-y-1.5">
                {localChecklist.map(item => (
                  <div key={item._id} onClick={() => toggleCheck(item._id, item.completed)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                      ${item.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                      {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">#{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
            <p>Created: {fmtDate(task.createdAt)}</p>
            {task.completedAt && <p className="text-emerald-600 font-medium">Completed: {fmtDate(task.completedAt)}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-2">
          {task.status !== 'completed' && (
            <button onClick={handleComplete} disabled={completing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-60">
              {completing
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />}
              Complete
            </button>
          )}
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card (Grid) ─────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, onClick }) {
  const overdueFlag = isOverdue(task.dueDate, task.status);
  const checkDone   = (task.checklist || []).filter(c => c.completed).length;
  const checkTotal  = (task.checklist || []).length;

  return (
    <div onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group relative">
      {/* Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <div className="mb-3 pr-16">
        <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2">
          {task.subject}
        </h3>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {task.billable && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
            <DollarSign className="w-3 h-3" /> Billable
          </span>
        )}
        {overdueFlag && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span className="font-semibold text-gray-700">{task.progress || 0}%</span>
        </div>
        <ProgressBar value={task.progress || 0} size="sm" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {task.assignees?.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map((a, i) => (
                <Avatar key={i} name={a.name || a.email || '?'} size="sm" />
              ))}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          )}
          {checkTotal > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <ListChecks className="w-3 h-3" />{checkDone}/{checkTotal}
            </span>
          )}
        </div>
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${overdueFlag ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            <Calendar className="w-3 h-3" />{fmtDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Tasks() {
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [viewMode, setViewMode]         = useState('grid');
  const [stats, setStats]               = useState(null);
  const [page, setPage]                 = useState(1);
  const [total, setTotal]               = useState(0);
  const LIMIT = 20;

  const [modal, setModal]             = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [drawerTask, setDrawerTask]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterStatus)   params.status   = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (search)         params.search   = search;

      console.log('Fetching tasks with params:', params);

      const [tRes, sRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/tasks/stats/overview').catch(() => ({ data: null })),
      ]);

      console.log('Raw tasks response:', tRes.data);

      const raw = tRes.data;
      // Handle: { data: [...], total } OR [...] directly OR { data: { data: [...], total } }
      let taskList = [];
      let taskTotal = 0;

      if (Array.isArray(raw)) {
        taskList  = raw;
        taskTotal = raw.length;
      } else if (Array.isArray(raw?.data)) {
        taskList  = raw.data;
        taskTotal = raw.total ?? raw.data.length;
      } else if (Array.isArray(raw?.data?.data)) {
        taskList  = raw.data.data;
        taskTotal = raw.data.total ?? raw.data.data.length;
      } else {
        console.warn('Unexpected tasks API shape:', raw);
      }

      console.log('Tasks loaded:', taskList.length, 'of', taskTotal);
      setTasks(taskList);
      setTotal(taskTotal);
      setStats(sRes.data);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') { setPage(1); load(); }
  };

  const refreshDrawer = async () => {
    await load();
    if (drawerTask) {
      try {
        const res = await api.get(`/tasks/${drawerTask._id}`);
        setDrawerTask(res.data);
      } catch {}
    }
  };

  // Status counts from stats endpoint or local tasks
  const statusCounts = Object.keys(STATUS_META).reduce((acc, k) => {
    acc[k] = stats?.byStatus?.find?.(s => s._id === k)?.count
           ?? tasks.filter(t => t.status === k).length;
    return acc;
  }, {});
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage and track all your tasks</p>
          </div>
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: total || tasks.length, color: 'text-gray-900', card: '' },
            { label: 'In Progress', value: statusCounts.in_progress || 0, color: 'text-blue-600', card: '' },
            { label: 'Completed',   value: statusCounts.completed || 0, color: 'text-emerald-600', card: '' },
            { label: 'Overdue',     value: overdueCount,
              color: overdueCount > 0 ? 'text-red-600' : 'text-gray-900',
              card:  overdueCount > 0 ? 'bg-red-50 border-red-200' : '' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.card || 'bg-white border-gray-200'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Status filter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_META).map(([key, { label, dot }]) => (
            <button key={key} onClick={() => { setFilterStatus(filterStatus === key ? '' : key); setPage(1); }}
              className={`rounded-xl px-3 py-3 text-center border transition-all bg-white
                ${filterStatus === key ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
              <p className="text-xl font-bold text-gray-900">{statusCounts[key] || 0}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium mt-0.5 text-gray-600">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Priority + View toggle */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="Search tasks… (press Enter)"
              value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
            />
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[{ value: '', label: 'All' }, ...Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label }))].map(opt => (
              <button key={opt.value} onClick={() => { setFilterPriority(opt.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${filterPriority === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {['grid', 'table'].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                  ${viewMode === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>

          {(filterStatus || filterPriority) && (
            <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setPage(1); }}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}

          <button onClick={load} title="Refresh"
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white border border-gray-200 rounded-2xl">
            <CheckSquare className="w-12 h-12 mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No tasks found</p>
            <p className="text-sm mt-1">Create your first task to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(t => (
              <TaskCard key={t._id} task={t}
                onClick={() => setDrawerTask(t)}
                onEdit={e => { e?.stopPropagation?.(); setModal(t); }}
                onDelete={e => { e?.stopPropagation?.(); setDeleteTarget(t); }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Subject', 'Status', 'Priority', 'Progress', 'Assignees', 'Due', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map(t => {
                    const od = isOverdue(t.dueDate, t.status);
                    return (
                      <tr key={t._id} onClick={() => setDrawerTask(t)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-1">{t.subject}</p>
                          {t.tags?.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {t.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-4"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-4 w-36">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={t.progress || 0} size="sm" />
                            <span className="text-xs font-semibold text-gray-600 w-8 text-right">{t.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {t.assignees?.length > 0 ? (
                            <div className="flex -space-x-1.5">
                              {t.assignees.slice(0, 3).map((a, i) => <Avatar key={i} name={a.name || '?'} size="sm" />)}
                              {t.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                  +{t.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className={`px-4 py-4 text-sm ${od ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {fmtDate(t.dueDate)}
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button onClick={() => setModal(t)} className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(t)} className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
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

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} tasks
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          task={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}

      {drawerTask && (
        <TaskDrawer
          task={drawerTask}
          onClose={() => setDrawerTask(null)}
          onEdit={() => { setModal(drawerTask); setDrawerTask(null); }}
          onRefresh={refreshDrawer}
        />
      )}
    </>
  );
}