import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import {
  Plus, Search, Pencil, Trash2, Mail, Phone, Building2,
  X, Loader2, Upload, Download, FileText, CheckCircle2,
  AlertCircle, SkipForward, ChevronDown, Users,
} from 'lucide-react';

const emptyForm = {
  firstName: '', lastName: '', email: '',
  phone: '', company: '', jobTitle: '', notes: '',
};

const STATUS_STYLES = {
  active:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactive: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  lead:     'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  archived: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
};


const ROW_ICON = {
  will_import: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
  imported:    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  duplicate:   <SkipForward  className="w-3.5 h-3.5 text-amber-500" />,
  invalid:     <AlertCircle  className="w-3.5 h-3.5 text-red-500" />,
};

const ROW_LABEL_STYLE = {
  will_import: 'text-blue-600 bg-blue-50',
  imported:    'text-emerald-600 bg-emerald-50',
  duplicate:   'text-amber-600 bg-amber-50',
  invalid:     'text-red-600 bg-red-50',
};

export default function Contacts() {
  const [contacts, setContacts]     = useState([]);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(true);

  // Create / Edit modal
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting]   = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef(null);

  const fetchContacts = () => {
    setLoading(true);
    api.get('/contacts', { params: { search, status: statusFilter || undefined } })
      .then(r => setContacts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContacts(); }, [search, statusFilter]);

  const openNew  = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      firstName: c.firstName, lastName: c.lastName, email: c.email,
      phone: c.phone || '', company: c.company || '',
      jobTitle: c.jobTitle || '', notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/contacts/${editing._id}`, form);
      else         await api.post('/contacts', form);
      setShowModal(false); fetchContacts();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await api.delete(`/contacts/${id}`); fetchContacts();
  };

  // ── Import helpers ────────────────────────────────────────────────────────

  const resetImport = () => {
    setImportFile(null); setImportResult(null);
    setImporting(false); setSimulating(false);
  };

  const closeImport = () => { setShowImport(false); resetImport(); };

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) { alert('Please select a .csv file'); return; }
    setImportFile(f); setImportResult(null);
  };

  const downloadSample = async () => {
    const res = await api.get('/contacts/import/sample', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'contacts_sample.csv'; a.click();
  };

  const runImport = async (simulate) => {
    if (!importFile) return;
    simulate ? setSimulating(true) : setImporting(true);
    try {
      const fd = new FormData(); fd.append('file', importFile);
      const res = await api.post(`/contacts/import?simulate=${simulate}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      if (!simulate) fetchContacts();
    } finally { setSimulating(false); setImporting(false); }
  };

  const statBubble = (label, val, color) => (
    <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl ${color}`}>
      <span className="text-xl font-bold leading-none">{val}</span>
      <span className="text-xs mt-0.5 opacity-70 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" /> Contacts
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{contacts.length} total contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetImport(); setShowImport(true); }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search contacts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input pr-8 appearance-none cursor-pointer text-sm"
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-14 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No contacts found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Phone', 'Company', 'Title', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 shrink-0" />{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.phone
                        ? <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" />{c.phone}</div>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.company || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.jobTitle || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[c.status] ?? STATUS_STYLES.inactive}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          Create / Edit Modal
      ══════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Contact' : 'New Contact'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input className="input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Job Title</label>
                <input className="input" value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Import Modal
      ══════════════════════════════════════════════ */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeImport} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 flex flex-col gap-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Upload className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Import Contacts</h2>
                  <p className="text-xs text-gray-400">Upload a CSV file to import contacts in bulk</p>
                </div>
              </div>
              <button onClick={closeImport} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sample download */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4 text-gray-400" />
                Need the correct format?
              </div>
              <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download sample CSV
              </button>
            </div>

            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                ${importFile ? 'border-emerald-300 bg-emerald-50' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
            >
              <input
                ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => pickFile(e.target.files?.[0] ?? null)}
              />
              {importFile ? (
                <div className="flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="font-medium text-emerald-700 text-sm">{importFile.name}</p>
                  <p className="text-xs text-emerald-500">{(importFile.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <Upload className="w-8 h-8 opacity-40" />
                  <p className="text-sm font-medium">Drop your CSV here, or click to browse</p>
                  <p className="text-xs">Supports UTF-8 encoded .csv files only</p>
                </div>
              )}
            </div>

            {/* Required fields note */}
            <p className="text-xs text-gray-400 -mt-2">
              Required columns: <span className="font-mono text-gray-600">firstName, lastName, email</span>
              {' '}— optional: phone, company, jobTitle, notes, status
            </p>

            {/* Import result */}
            {importResult && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Summary */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  {importResult.simulate
                    ? <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">DRY RUN</span>
                    : <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">IMPORTED</span>}
                  <span className="text-xs text-gray-500">{importResult.totalRows} rows processed</span>
                </div>
                <div className="flex gap-2 p-3">
                  {statBubble('Imported', importResult.imported, 'bg-emerald-50 text-emerald-700')}
                  {statBubble('Skipped',  importResult.skipped,  'bg-amber-50 text-amber-700')}
                  {statBubble('Failed',   importResult.failed,   'bg-red-50 text-red-700')}
                </div>

                {/* Per-row log */}
                {importResult.rows.length > 0 && (
                  <div className="border-t border-gray-100 max-h-44 overflow-y-auto divide-y divide-gray-50">
                    {importResult.rows.map((row) => (
                      <div key={row.row} className="flex items-center gap-2.5 px-4 py-2 text-xs">
                        <span className="text-gray-400 font-mono w-8 shrink-0">#{row.row}</span>
                        {ROW_ICON[row.status]}
                        <span className="text-gray-700 font-medium flex-1 truncate">{row.email}</span>
                        <span className={`px-1.5 py-0.5 rounded font-medium capitalize shrink-0 ${ROW_LABEL_STYLE[row.status]}`}>
                          {row.status.replace('_', ' ')}
                        </span>
                        {row.reason && <span className="text-gray-400 truncate max-w-[120px]">{row.reason}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={closeImport} className="btn-secondary flex-1 text-sm">
                Close
              </button>
              <button
                type="button"
                disabled={!importFile || simulating || importing}
                onClick={() => runImport(true)}
                className="flex-1 text-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium text-gray-700 disabled:opacity-40 transition-colors"
              >
                {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Simulate
              </button>
              <button
                type="button"
                disabled={!importFile || importing || simulating}
                onClick={() => runImport(false)}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}