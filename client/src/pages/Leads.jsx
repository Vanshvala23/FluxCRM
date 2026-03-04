import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, TrendingUp, X, Loader2, IndianRupee,
  Building2, Mail, User, Tag, FileText, Printer,
  Calendar, ChevronRight, ArrowLeft, UserPlus, FileSignature,
  Activity, Bell, Paperclip, CheckSquare,
  Clock, Upload, Check, AlertCircle, Download, Eye,
  MessageSquare, ChevronDown
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const statusOptions = ['new', 'contacted', 'qualified', 'proposal','accepted','rejected'];
const statusColors  = {
  new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700', proposal: 'bg-orange-100 text-orange-700',
  accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
};
const priorityColors = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};
const proposalStatusColors = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700', declined: 'bg-red-100 text-red-700',
};
const emptyForm = {
  title: '', contactName: '', contactEmail: '', company: '',
  source: '', status: 'new', value: '', notes: ''
};

// ── Print ─────────────────────────────────────────────────────────────────────
function printLead(lead) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Lead — ${lead.title}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:40px;color:#111}
      h1{font-size:22px;margin-bottom:4px}
      .badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;background:#e0e7ff;color:#4338ca}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
      .field label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
      .field p{font-size:14px;margin:2px 0 0}
      .notes{margin-top:20px;padding:14px;background:#f9fafb;border-radius:6px}
      .footer{margin-top:36px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
    </style></head><body>
    <h1>${lead.title}</h1>
    <span class="badge">${lead.status}</span>
    <div class="grid">
      <div class="field"><label>Contact</label><p>${lead.contactName||'—'}</p></div>
      <div class="field"><label>Email</label><p>${lead.contactEmail||'—'}</p></div>
      <div class="field"><label>Company</label><p>${lead.company||'—'}</p></div>
      <div class="field"><label>Source</label><p>${lead.source||'—'}</p></div>
      <div class="field"><label>Deal Value</label><p>$${(lead.value||0).toLocaleString()}</p></div>
      <div class="field"><label>Created</label><p>${new Date(lead.createdAt).toLocaleDateString()}</p></div>
    </div>
    ${lead.notes?`<div class="notes"><label style="font-size:11px;color:#6b7280;text-transform:uppercase">Notes</label><p style="margin-top:6px">${lead.notes}</p></div>`:''}
    <div class="footer">Printed from FluxCRM — ${new Date().toLocaleString()}</div>
    </body></html>`);
  win.document.close(); win.print();
}

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count > 0 && (
        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Convert to Contact modal ──────────────────────────────────────────────────
function ConvertModal({ lead, onClose, onConverted }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [form, setForm]     = useState({
    firstName: lead.contactName?.split(' ')[0] || '',
    lastName:  lead.contactName?.split(' ').slice(1).join(' ') || '',
    email:     lead.contactEmail || '',
    phone:     '',
    company:   lead.company || '',
    jobTitle:  '',
  });

  const handleConvert = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/contacts', form);
      setDone(true);
      setTimeout(() => { onConverted(); onClose(); }, 1200);
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-gray-800">Convert to Contact</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">Contact created!</p>
          </div>
        ) : (
          <form onSubmit={handleConvert}>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required /></div>
                <div><label className="label">Last Name</label><input className="input" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} /></div>
              </div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
                <div><label className="label">Company</label><input className="input" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} /></div>
              </div>
              <div><label className="label">Job Title</label><input className="input" value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} /></div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Converting...</> : 'Convert'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Activities tab ────────────────────────────────────────────────────────────
function ActivitiesTab({ leadId }) {
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem(`flux_activities_${leadId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm]     = useState({ type: 'call', note: '', date: new Date().toISOString().slice(0,10) });
  const [adding, setAdding] = useState(false);

  const save = (items) => { setActivities(items); localStorage.setItem(`flux_activities_${leadId}`, JSON.stringify(items)); };
  const add  = () => {
    if (!form.note.trim()) return;
    save([{ id: Date.now(), ...form, createdAt: new Date().toISOString() }, ...activities]);
    setForm({ type: 'call', note: '', date: new Date().toISOString().slice(0,10) });
    setAdding(false);
  };

  const typeIcon  = { call: '📞', email: '✉️', meeting: '🤝', note: '📝' };
  const typeLabel = { call: 'Call', email: 'Email', meeting: 'Meeting', note: 'Note' };

  return (
    <div className="p-4 space-y-3">
      {!adding ? (
        <button onClick={() => setAdding(true)} className="btn-primary w-full justify-center"><Plus className="w-3.5 h-3.5" /> Log Activity</button>
      ) : (
        <div className="border border-gray-200 rounded p-3 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {Object.entries(typeLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} placeholder="What happened?" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} /></div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={add} className="btn-primary flex-1 justify-center">Save</button>
          </div>
        </div>
      )}
      {activities.length === 0 ? (
        <p className="text-center text-gray-400 text-xs py-6">No activities logged yet</p>
      ) : activities.map(a => (
        <div key={a.id} className="flex gap-3 p-3 bg-white border border-gray-100 rounded">
          <span className="text-lg flex-shrink-0">{typeIcon[a.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase">{typeLabel[a.type]}</span>
              <span className="text-xs text-gray-400">{a.date}</span>
            </div>
            <p className="text-sm text-gray-700 mt-0.5">{a.note}</p>
          </div>
          <button onClick={() => save(activities.filter(x => x.id !== a.id))} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

// ── Reminders tab ─────────────────────────────────────────────────────────────
function RemindersTab({ leadId }) {
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem(`flux_reminders_${leadId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm]     = useState({ title: '', date: '', time: '09:00', priority: 'medium' });
  const [adding, setAdding] = useState(false);

  const save   = (items) => { setReminders(items); localStorage.setItem(`flux_reminders_${leadId}`, JSON.stringify(items)); };
  const add    = () => {
    if (!form.title.trim() || !form.date) return;
    save([{ id: Date.now(), ...form, done: false }, ...reminders]);
    setForm({ title: '', date: '', time: '09:00', priority: 'medium' });
    setAdding(false);
  };
  const toggle = (id) => save(reminders.map(r => r.id === id ? { ...r, done: !r.done } : r));

  return (
    <div className="p-4 space-y-3">
      {!adding ? (
        <button onClick={() => setAdding(true)} className="btn-primary w-full justify-center"><Plus className="w-3.5 h-3.5" /> Add Reminder</button>
      ) : (
        <div className="border border-gray-200 rounded p-3 space-y-3 bg-gray-50">
          <div><label className="label">Title *</label><input className="input" placeholder="e.g. Follow up call" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
            <div><label className="label">Time</label><input className="input" type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} /></div>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
              {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={add} className="btn-primary flex-1 justify-center">Save</button>
          </div>
        </div>
      )}
      {reminders.length === 0 ? (
        <p className="text-center text-gray-400 text-xs py-6">No reminders set</p>
      ) : reminders.map(r => (
        <div key={r.id} className={`flex items-start gap-3 p-3 border rounded ${r.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
          <button onClick={() => toggle(r.id)} className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${r.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
            {r.done && <Check className="w-2.5 h-2.5 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${r.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{r.date} at {r.time}</span>
              <span className={`badge text-[10px] capitalize ${priorityColors[r.priority]}`}>{r.priority}</span>
            </div>
          </div>
          <button onClick={() => save(reminders.filter(x => x.id !== r.id))} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

// ── Tasks tab ─────────────────────────────────────────────────────────────────
function TasksTab({ leadId }) {
  const [tasks, setTasks]   = useState(() => {
    const saved = localStorage.getItem(`flux_tasks_${leadId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm]     = useState({ title: '', dueDate: '', assignee: '', priority: 'medium' });
  const [adding, setAdding] = useState(false);

  const save   = (items) => { setTasks(items); localStorage.setItem(`flux_tasks_${leadId}`, JSON.stringify(items)); };
  const add    = () => {
    if (!form.title.trim()) return;
    save([{ id: Date.now(), ...form, done: false }, ...tasks]);
    setForm({ title: '', dueDate: '', assignee: '', priority: 'medium' });
    setAdding(false);
  };
  const toggle = (id) => save(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const done   = tasks.filter(t => t.done).length;

  return (
    <div className="p-4 space-y-3">
      {tasks.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
          <span>{done}/{tasks.length} tasks completed</span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${tasks.length ? (done/tasks.length)*100 : 0}%` }} />
          </div>
        </div>
      )}
      {!adding ? (
        <button onClick={() => setAdding(true)} className="btn-primary w-full justify-center"><Plus className="w-3.5 h-3.5" /> Add Task</button>
      ) : (
        <div className="border border-gray-200 rounded p-3 space-y-3 bg-gray-50">
          <div><label className="label">Task Title *</label><input className="input" placeholder="e.g. Send proposal" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} /></div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Assignee</label><input className="input" placeholder="Name or email" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})} /></div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={add} className="btn-primary flex-1 justify-center">Save</button>
          </div>
        </div>
      )}
      {tasks.length === 0 ? (
        <p className="text-center text-gray-400 text-xs py-6">No tasks yet</p>
      ) : tasks.map(t => (
        <div key={t.id} className={`flex items-start gap-3 p-3 border rounded ${t.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
          <button onClick={() => toggle(t.id)} className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${t.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
            {t.done && <Check className="w-2.5 h-2.5 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${t.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {t.dueDate && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3"/>{t.dueDate}</span>}
              {t.assignee && <span className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3"/>{t.assignee}</span>}
              <span className={`badge text-[10px] capitalize ${priorityColors[t.priority]}`}>{t.priority}</span>
            </div>
          </div>
          <button onClick={() => save(tasks.filter(x => x.id !== t.id))} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

// ── Attachments tab ───────────────────────────────────────────────────────────
function AttachmentsTab({ leadId }) {
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem(`flux_files_${leadId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef(null);

  const save        = (items) => { setFiles(items); localStorage.setItem(`flux_files_${leadId}`, JSON.stringify(items)); };
  const handleFiles = (e) => {
    const newItems = Array.from(e.target.files).map(f => ({
      id: Date.now() + Math.random(), name: f.name, size: f.size,
      type: f.type, uploadedAt: new Date().toISOString(),
    }));
    save([...files, ...newItems]);
    e.target.value = '';
  };
  const fmtSize  = (b) => b > 1024*1024 ? `${(b/1024/1024).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;
  const fileIcon = (type) => {
    if (type.startsWith('image')) return '🖼️';
    if (type.includes('pdf'))     return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel'))   return '📊';
    return '📎';
  };

  return (
    <div className="p-4 space-y-3">
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFiles} />
      <button onClick={() => inputRef.current?.click()} className="btn-primary w-full justify-center">
        <Upload className="w-3.5 h-3.5" /> Upload Files
      </button>
      {files.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded p-8 text-center text-gray-400 cursor-pointer hover:border-primary-300 transition-colors" onClick={() => inputRef.current?.click()}>
          <Paperclip className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Click or drag files here</p>
        </div>
      ) : files.map(f => (
        <div key={f.id} className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded hover:bg-gray-50 group">
          <span className="text-lg flex-shrink-0">{fileIcon(f.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
            <p className="text-xs text-gray-400">{fmtSize(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 text-gray-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
            <button className="p-1 text-gray-400 hover:text-green-600"><Download className="w-3.5 h-3.5" /></button>
            <button onClick={() => save(files.filter(x => x.id !== f.id))} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Proposals tab — reads real API ────────────────────────────────────────────
function ProposalsTab({ lead }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/proposals', { params: { leadId: lead._id } })
      .then(r => setProposals(r.data))
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, [lead._id]);

  const printProposal = (p) => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${p.subject}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:40px;color:#111}
        h1{font-size:20px;margin-bottom:4px}
        .meta{color:#6b7280;font-size:13px;margin-bottom:20px}
        .badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;background:#e0e7ff;color:#4338ca}
        .body{margin-top:20px;white-space:pre-wrap;font-size:14px;line-height:1.7}
        .footer{margin-top:36px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
      </style></head><body>
      <h1>${p.subject}</h1>
      <div class="meta">
        Valid until: <strong>${p.validUntil || 'N/A'}</strong> &nbsp;·&nbsp;
        Status: <span class="badge">${p.status}</span>
      </div>
      ${p.body ? `<div class="body">${p.body}</div>` : ''}
      <div class="footer">Printed from FluxCRM — ${new Date().toLocaleString()}</div>
      </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">
          {loading ? 'Loading...' : `${proposals.length} proposal${proposals.length !== 1 ? 's' : ''} linked`}
        </p>
        <span className="text-xs text-gray-400 italic">Manage in Proposals page</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading proposals...
        </div>
      )}

      {/* Empty */}
      {!loading && proposals.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-medium">No proposals linked to this lead</p>
          <p className="text-xs mt-1">Create one from the Proposals page</p>
        </div>
      )}

      {/* List */}
      {!loading && proposals.length > 0 && proposals.map(p => (
        <div key={p._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{p.subject}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {p.validUntil && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Valid until {p.validUntil}
                  </span>
                )}
                {p.createdAt && (
                  <span className="text-xs text-gray-400">
                    · Created {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <span className={`badge capitalize ${proposalStatusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
              {p.status}
            </span>
            <button
              title="Print"
              onClick={() => printProposal(p)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600">
          To create or edit proposals, go to the <strong>Proposals</strong> page and link them to this lead.
        </p>
      </div>
    </div>
  );
}

// ── Notes tab ─────────────────────────────────────────────────────────────────
function NotesTab({ leadId, initialNotes }) {
  const key = `flux_notes_${leadId}`;
  const [notes, setNotes] = useState(() => localStorage.getItem(key) || initialNotes || '');
  const [saved, setSaved] = useState(false);

  const save = () => { localStorage.setItem(key, notes); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-4 space-y-3">
      <textarea className="input resize-none w-full" rows={10} placeholder="Write notes about this lead..." value={notes} onChange={e => setNotes(e.target.value)} />
      <button onClick={save} className="btn-primary w-full justify-center">
        {saved ? <><Check className="w-3.5 h-3.5"/>Saved!</> : 'Save Notes'}
      </button>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function LeadDetail({ lead, onClose, onEdit, onDelete, onConverted }) {
  const [activeTab, setActiveTab]           = useState('overview');
  const [showConvert, setShowConvert]       = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [currentLead, setCurrentLead]       = useState(lead);

  const updateStatus = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.put(`/leads/${lead._id}`, { ...currentLead, status: newStatus });
      setCurrentLead(prev => ({ ...prev, status: newStatus }));
    } finally { setStatusUpdating(false); }
  };

  const tabs = [
    { id: 'overview',     label: 'Overview',    icon: Eye },
    { id: 'activities',   label: 'Activities',  icon: Activity,     count: JSON.parse(localStorage.getItem(`flux_activities_${lead._id}`) || '[]').length },
    { id: 'tasks',        label: 'Tasks',        icon: CheckSquare,  count: JSON.parse(localStorage.getItem(`flux_tasks_${lead._id}`) || '[]').length },
    { id: 'reminders',    label: 'Reminders',   icon: Bell,         count: JSON.parse(localStorage.getItem(`flux_reminders_${lead._id}`) || '[]').filter(r=>!r.done).length },
    { id: 'proposals',    label: 'Proposals',   icon: FileSignature },
    { id: 'attachments',  label: 'Attachments', icon: Paperclip,    count: JSON.parse(localStorage.getItem(`flux_files_${lead._id}`) || '[]').length },
    { id: 'notes',        label: 'Notes',       icon: MessageSquare },
  ];

  // lucide Eye import fix — use a local alias
  function Eye(props) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col">

        {/* Action bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowConvert(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Convert
            </button>
            <button onClick={() => printLead(currentLead)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => onEdit(currentLead)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(lead._id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Lead header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base leading-tight">{currentLead.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{currentLead.contactName}{currentLead.company ? ` · ${currentLead.company}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-base font-bold text-green-600">₹{(currentLead.value||0).toLocaleString()}</span>
              <div className="relative">
                <select
                  value={currentLead.status}
                  onChange={e => updateStatus(e.target.value)}
                  disabled={statusUpdating}
                  className={`badge capitalize cursor-pointer appearance-none pr-5 ${statusColors[currentLead.status]} border-0 outline-none`}
                  style={{ backgroundImage: 'none' }}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
              </div>
            </div>
          </div>

          {/* Pipeline bar */}
          <div className="mt-3">
            <div className="flex gap-0.5">
              {statusOptions.map((s, i) => {
                const ci = statusOptions.indexOf(currentLead.status);
                return (
                  <button key={s} title={s} onClick={() => updateStatus(s)}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${i <= ci ? 'bg-primary-500' : 'bg-gray-200 hover:bg-gray-300'}`} />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {statusOptions.map(s => (
                <span key={s} className={`text-[10px] capitalize ${s===currentLead.status?'text-primary-600 font-semibold':'text-gray-400'}`}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto px-2 bg-white flex-shrink-0">
          {tabs.map(t => (
            <Tab key={t.id} active={activeTab===t.id} onClick={() => setActiveTab(t.id)}
              icon={t.icon} label={t.label} count={t.count||0} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-100 rounded p-3 text-center">
                  <p className="text-[10px] text-green-600 uppercase font-semibold">Value</p>
                  <p className="text-lg font-bold text-green-700 mt-0.5">₹{(currentLead.value||0).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded p-3 text-center">
                  <p className="text-[10px] text-blue-600 uppercase font-semibold">Status</p>
                  <p className="text-sm font-bold text-blue-700 mt-0.5 capitalize">{currentLead.status}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Source</p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5">{currentLead.source||'—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User,      label: 'Contact', value: currentLead.contactName },
                  { icon: Mail,      label: 'Email',   value: currentLead.contactEmail },
                  { icon: Building2, label: 'Company', value: currentLead.company },
                  { icon: Tag,       label: 'Source',  value: currentLead.source },
                  { icon: Calendar,  label: 'Created', value: currentLead.createdAt ? new Date(currentLead.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : null },
                  { icon: Calendar,  label: 'Updated', value: currentLead.updatedAt ? new Date(currentLead.updatedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : null },
                ].map(({icon:Icon,label,value}) => (
                  <div key={label} className="bg-gray-50 rounded p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3 h-3 text-gray-400"/>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{label}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{value||'—'}</p>
                  </div>
                ))}
              </div>
              {currentLead.notes && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400"/>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {currentLead.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'activities'  && <ActivitiesTab  leadId={lead._id} />}
          {activeTab === 'tasks'       && <TasksTab       leadId={lead._id} />}
          {activeTab === 'reminders'   && <RemindersTab   leadId={lead._id} />}
          {activeTab === 'proposals'   && <ProposalsTab   lead={currentLead} />}
          {activeTab === 'attachments' && <AttachmentsTab leadId={lead._id} />}
          {activeTab === 'notes'       && <NotesTab       leadId={lead._id} initialNotes={currentLead.notes} />}
        </div>
      </div>

      {showConvert && (
        <ConvertModal lead={currentLead} onClose={() => setShowConvert(false)} onConverted={onConverted} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Leads() {
  const [leads, setLeads]               = useState([]);
  const [filter, setFilter]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    api.get('/leads', { params: { status: filter || undefined } })
      .then(r => setLeads(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [filter]);

  const openNew  = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (l) => {
    setEditing(l);
    setForm({ title:l.title, contactName:l.contactName, contactEmail:l.contactEmail||'',
      company:l.company||'', source:l.source||'', status:l.status, value:l.value||'', notes:l.notes||'' });
    setSelectedLead(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value) };
      if (editing) await api.put(`/leads/${editing._id}`, payload);
      else await api.post('/leads', payload);
      setShowModal(false); fetchLeads();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.delete(`/leads/${id}`);
    setSelectedLead(null); fetchLeads();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-gray-400 text-xs mt-0.5">{leads.length} total leads</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Add Lead</button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${!filter ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All ({leads.length})
        </button>
        {statusOptions.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${filter===s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_,i) => <div key={i} className="h-36 bg-gray-100 rounded animate-pulse"/>)}
        </div>
      ) : leads.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30"/>
          <p className="text-sm font-medium">No leads found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {leads.map(l => (
            <div key={l._id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLead(l)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate text-sm">{l.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{l.contactName}</p>
                </div>
                <span className={`badge ml-2 capitalize flex-shrink-0 ${statusColors[l.status]}`}>{l.status}</span>
              </div>
              {l.company && <p className="text-xs text-gray-500 mb-0.5">🏢 {l.company}</p>}
              {l.source  && <p className="text-xs text-gray-500 mb-0.5">📌 {l.source}</p>}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                  <IndianRupee className="w-3.5 h-3.5"/>{(l.value||0).toLocaleString()}
                </div>
                <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={() => handleDelete(l._id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)}
          onEdit={openEdit} onDelete={handleDelete} onConverted={fetchLeads} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}/>
          <div className="relative bg-white rounded shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editing ? 'Edit Lead' : 'New Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
                <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Contact Name *</label><input className="input" value={form.contactName} onChange={e=>setForm({...form,contactName:e.target.value})} required/></div>
                  <div><label className="label">Contact Email</label><input className="input" type="email" value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Company</label><input className="input" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></div>
                  <div><label className="label">Source</label><input className="input" placeholder="Website, Referral..." value={form.source} onChange={e=>setForm({...form,source:e.target.value})}/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                      {statusOptions.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Value (₹)</label><input className="input" type="number" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></div>
                </div>
                <div><label className="label">Notes</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
              </div>
              <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Saving...</> : (editing ? 'Save Changes' : 'Create Lead')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}