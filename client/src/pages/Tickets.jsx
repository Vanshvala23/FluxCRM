import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  Plus, X, Loader2, MessageSquare
} from 'lucide-react';

const statusColors = {
  open: 'bg-blue-100 text-blue-600',
  'in-progress': 'bg-yellow-100 text-yellow-600',
  resolved: 'bg-green-100 text-green-600',
  closed: 'bg-gray-100 text-gray-600',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-indigo-100 text-indigo-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600',
};

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
    setForm(emptyForm);
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tickets.map(t => (
            <div
              key={t._id}
              onClick={() => setSelected(t)}
              className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {t.description}
              </p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <span className={`px-2 py-1 text-xs rounded ${statusColors[t.status]}`}>
                  {t.status}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${priorityColors[t.priority]}`}>
                  {t.priority}
                </span>
                {t.isPublic && (
                  <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">
                    Public
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePublic(t._id);
                }}
                className="mt-3 text-xs text-indigo-600 hover:underline"
              >
                Toggle Public
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail */}
      {selected && (
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-bold">{selected.title}</h2>
            <button onClick={() => setSelected(null)}>
              <X />
            </button>
          </div>

          {/* Replies */}
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {selected.replies?.length ? selected.replies.map((r, i) => (
              <div key={i} className="bg-gray-50 p-2 rounded text-sm">
                <b>{r.sender}:</b> {r.message}
              </div>
            )) : (
              <p className="text-gray-400 text-sm">No replies yet</p>
            )}
          </div>

          {/* Reply Input */}
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
            />
            <button
              onClick={sendReply}
              className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">
                {editing ? 'Edit Ticket' : 'New Ticket'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />

              <textarea
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />

              <button
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex justify-center"
              >
                {saving ? <Loader2 className="animate-spin" /> : 'Save Ticket'}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}