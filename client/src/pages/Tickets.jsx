import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, Ticket as TicketIcon,
  X, Loader2, MessageSquare
} from 'lucide-react';

const statusOptions = ['open', 'in-progress', 'resolved', 'closed'];
const priorityOptions = ['low', 'medium', 'high', 'critical'];

const emptyForm = {
  title: '',
  description: '',
  status: 'open',
  priority: 'medium'
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const res = await api.get('/tickets');
    setTickets(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (editing) await api.put(`/tickets/${editing._id}`, form);
    else await api.post('/tickets', form);

    setShowModal(false);
    fetchTickets();
    setSaving(false);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    await api.post(`/tickets/${selected._id}/reply`, { message: reply });
    setReply('');
    fetchTickets();
  };

  const togglePublic = async (id) => {
    await api.put(`/tickets/${id}/toggle-public`);
    fetchTickets();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex gap-2">
          <Plus /> New
        </button>
      </div>

      {/* List */}
      {loading ? 'Loading...' : tickets.map(t => (
        <div key={t._id} className="card cursor-pointer" onClick={() => setSelected(t)}>
          <h3 className="font-semibold">{t.title}</h3>
          <p className="text-sm text-gray-500">{t.description}</p>

          <div className="flex gap-2 mt-2 text-xs">
            <span>{t.status}</span>
            <span>{t.priority}</span>
            {t.isPublic && <span className="text-green-600">Public</span>}
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={(e) => { e.stopPropagation(); togglePublic(t._id); }}>
              Toggle Public
            </button>
          </div>
        </div>
      ))}

      {/* Ticket Detail + Reply */}
      {selected && (
        <div className="card">
          <h2 className="font-bold">{selected.title}</h2>

          <div className="space-y-2 mt-3">
            {selected.replies?.map((r, i) => (
              <div key={i} className="text-sm">
                <b>{r.sender}:</b> {r.message}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply..."
            />
            <button onClick={sendReply} className="btn-primary">Send</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl w-full max-w-md">
            <form onSubmit={handleSave} className="space-y-3">
              <input className="input" placeholder="Title"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
              <textarea className="input"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />

              <button className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}