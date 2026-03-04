import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Search, Pencil, Trash2, Mail, Phone, Building2, X, Loader2 } from 'lucide-react';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', notes: '' };

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchContacts = () => {
    setLoading(true);
    api.get('/contacts', { params: { search } }).then(r => setContacts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchContacts(); }, [search]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone || '', company: c.company || '', jobTitle: c.jobTitle || '', notes: c.notes || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/contacts/${editing._id}`, form);
      else await api.post('/contacts', form);
      setShowModal(false); fetchContacts();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await api.delete(`/contacts/${id}`); fetchContacts();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{contacts.length} total contacts</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No contacts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Phone', 'Company', 'Title', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                          {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.phone ? <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.company || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{c.jobTitle || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Contact' : 'New Contact'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name</label><input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                <div><label className="label">Last Name</label><input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
              </div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
              </div>
              <div><label className="label">Job Title</label><input className="input" value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} /></div>
              <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}