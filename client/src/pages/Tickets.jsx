import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, Ticket as TicketIcon, X, Loader2, MessageSquare } from 'lucide-react';

const statusOptions = ['open', 'in-progress', 'resolved', 'closed'];
const priorityOptions = ['low', 'medium', 'high', 'critical'];
const priorityColors = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};
const statusColors = {
  open: 'bg-green-100 text-green-700', 'in-progress': 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-blue-100 text-blue-700', closed: 'bg-gray-100 text-gray-600',
};
const emptyForm = { title: '', description: '', status: 'open', priority: 'medium' };

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    api.get('/tickets', { params: { status: filter || undefined } }).then(r => setTickets(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, status: t.status, priority: t.priority });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/tickets/${editing._id}`, form);
      else await api.post('/tickets', form);
      setShowModal(false); fetchTickets();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    await api.delete(`/tickets/${id}`); fetchTickets();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tickets.length} total tickets</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
        {statusOptions.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
        ) : tickets.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <TicketIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tickets found</p>
          </div>
        ) : tickets.map((t) => (
          <div key={t._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <span className={`badge capitalize ${statusColors[t.status]}`}>{t.status}</span>
                  <span className={`badge capitalize ${priorityColors[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
                {t.comments?.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <MessageSquare className="w-3 h-3" /> {t.comments.length} comment{t.comments.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(t._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Ticket' : 'New Ticket'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}