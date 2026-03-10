import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, X, Loader2, Search, FileSignature,
  DollarSign, Calendar, Check, AlertCircle, Printer,
  ArrowLeft, Package, Wrench, Eye, Send, CheckCircle2,
  Clock, XCircle, ThumbsUp, ThumbsDown, Percent
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const statusColors = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-700',
  viewed:   'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-orange-100 text-orange-600',
};
const statusOptions = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'];

// ── Print ─────────────────────────────────────────────────────────────────────
function printProposal(p) {
  const win = window.open('', '_blank');
  const rows = (p.items || []).map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${item.description||item.name||'—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">$${(item.unitPrice||0).toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${item.discount||0}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${item.tax||0}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600">$${(item.amount||0).toLocaleString()}</td>
    </tr>`).join('');
  win.document.write(`
    <html><head><title>${p.title}</title>
    <style>body{font-family:system-ui,sans-serif;padding:48px;color:#111;max-width:800px;margin:0 auto}
    h1{font-size:24px;font-weight:800;margin:0}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th{background:#f9fafb;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
    .badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600}
    .totals{margin-top:16px;display:flex;justify-content:flex-end}
    .totals table{width:260px}.totals td{padding:4px 12px;font-size:13px}
    .total-row td{font-weight:700;font-size:15px;border-top:2px solid #111;padding-top:8px}
    .footer{margin-top:40px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>PROPOSAL</h1><p style="font-size:18px;color:#374151;margin-top:4px">${p.title}</p></div>
      <span class="badge" style="background:#dcfce7;color:#166534">${p.status?.toUpperCase()}</span>
    </div>
    ${p.description?`<p style="margin-top:16px;color:#4b5563;line-height:1.6">${p.description}</p>`:''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px">
      <div><p style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600">Prepared For</p>
        <p style="font-weight:600;margin-top:4px">${p.contact?.name||'—'}</p></div>
      <div style="text-align:right">
        ${p.validUntil?`<p style="font-size:13px;color:#6b7280">Valid Until: <strong>${p.validUntil}</strong></p>`:''}
        <p style="font-size:13px;color:#6b7280">Currency: <strong>${p.currency||'USD'}</strong></p></div>
    </div>
    ${rows?`<table><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Disc</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>`:''}
    <div class="totals"><table>
      ${p.subtotal?`<tr><td>Subtotal</td><td style="text-align:right">$${(p.subtotal||0).toLocaleString()}</td></tr>`:''}
      ${p.discountPercent>0?`<tr><td>Discount (${p.discountPercent}%)</td><td style="text-align:right">-$${(p.totalDiscount||0).toLocaleString()}</td></tr>`:''}
      ${p.taxPercent>0?`<tr><td>Tax (${p.taxPercent}%)</td><td style="text-align:right">+$${(p.totalTax||0).toLocaleString()}</td></tr>`:''}
      <tr class="total-row"><td>Total</td><td style="text-align:right">$${(p.amount||0).toLocaleString()}</td></tr>
    </table></div>
    ${p.notes?`<div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:6px"><p style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600">Notes</p><p style="margin-top:6px;font-size:13px">${p.notes}</p></div>`:''}
    ${p.terms?`<div style="margin-top:12px;padding:16px;background:#f9fafb;border-radius:6px"><p style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600">Terms</p><p style="margin-top:6px;font-size:13px">${p.terms}</p></div>`:''}
    <div class="footer">Generated from FluxCRM · ${new Date().toLocaleString()}</div>
    </body></html>`);
  win.document.close(); win.print();
}

// ── Item Picker (shared pattern with Invoices) ────────────────────────────────
function ItemPicker({ lines, onChange }) {
  const [catalogue, setCatalogue] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(false);
  const timer                     = useRef(null);

  const fetchCatalogue = (q) => {
    setLoading(true);
    api.get('/items', { params: { search: q || undefined, isActive: 'true', limit: 10 } })
      .then(r => setCatalogue(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCatalogue(''); }, []);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchCatalogue(v), 300);
  };

  const addItem = (ci) => {
    const existing = lines.find(l => l._itemId === ci._id);
    if (existing) {
      onChange(lines.map(l => l._itemId === ci._id ? { ...l, quantity: l.quantity + 1 } : l));
    } else {
      onChange([...lines, {
        _itemId: ci._id, description: ci.description || ci.name,
        quantity: 1, unitPrice: ci.unitPrice,
        tax: ci.taxRate || 0, discount: ci.discountRate || 0,
        _name: ci.name, _type: ci.type,
      }]);
    }
  };

  const addManual = () => {
    onChange([...lines, { _itemId: null, description: '', quantity: 1, unitPrice: 0, tax: 0, discount: 0 }]);
  };

  const updateLine = (idx, field, val) =>
    onChange(lines.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  const removeLine = (idx) => onChange(lines.filter((_, i) => i !== idx));

  const computeAmount = (l) => {
    const base = l.quantity * l.unitPrice;
    const disc = base * ((l.discount || 0) / 100);
    const tax  = (base - disc) * ((l.tax || 0) / 100);
    return Math.round((base - disc + tax) * 100) / 100;
  };

  const lineTotal = lines.reduce((s, l) => s + computeAmount(l), 0);

  return (
    <div className="space-y-3">
      <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add from Catalogue</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 text-sm py-1.5" placeholder="Search items..." value={search} onChange={e => handleSearch(e.target.value)} />
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</div>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {catalogue.map(ci => (
              <button key={ci._id} type="button" onClick={() => addItem(ci)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-100 rounded hover:border-primary-200 hover:bg-primary-50 transition-colors text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${ci.type === 'product' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {ci.type === 'product' ? <Package className="w-3 h-3 text-blue-600" /> : <Wrench className="w-3 h-3 text-purple-600" />}
                  </div>
                  <span className="truncate font-medium text-gray-700">{ci.name}</span>
                </div>
                <span className="text-xs font-semibold text-green-600 flex-shrink-0 ml-2">${ci.unitPrice?.toLocaleString()}</span>
              </button>
            ))}
            {catalogue.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No items found</p>}
          </div>
        )}
        <button type="button" onClick={addManual} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add manual line item
        </button>
      </div>

      {lines.length > 0 && (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-semibold uppercase tracking-wide">Description</th>
                <th className="text-center px-2 py-2 text-gray-500 font-semibold uppercase tracking-wide w-14">Qty</th>
                <th className="text-right px-2 py-2 text-gray-500 font-semibold uppercase tracking-wide w-24">Price</th>
                <th className="text-center px-2 py-2 text-gray-500 font-semibold uppercase tracking-wide w-16">Tax%</th>
                <th className="text-center px-2 py-2 text-gray-500 font-semibold uppercase tracking-wide w-16">Disc%</th>
                <th className="text-right px-3 py-2 text-gray-500 font-semibold uppercase tracking-wide w-20">Amount</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="px-3 py-1.5"><input className="input text-xs py-1 w-full" value={line.description} placeholder="Description" onChange={e => updateLine(idx, 'description', e.target.value)} /></td>
                  <td className="px-2 py-1.5"><input className="input text-xs py-1 w-full text-center" type="number" min="1" value={line.quantity} onChange={e => updateLine(idx, 'quantity', Number(e.target.value))} /></td>
                  <td className="px-2 py-1.5"><input className="input text-xs py-1 w-full text-right" type="number" min="0" step="0.01" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))} /></td>
                  <td className="px-2 py-1.5"><input className="input text-xs py-1 w-full text-center" type="number" min="0" max="100" value={line.tax} onChange={e => updateLine(idx, 'tax', Number(e.target.value))} /></td>
                  <td className="px-2 py-1.5"><input className="input text-xs py-1 w-full text-center" type="number" min="0" max="100" value={line.discount} onChange={e => updateLine(idx, 'discount', Number(e.target.value))} /></td>
                  <td className="px-3 py-1.5 text-right font-semibold text-gray-700">${computeAmount(line).toLocaleString()}</td>
                  <td className="pr-2 py-1.5"><button type="button" onClick={() => removeLine(idx)} className="p-1 text-gray-300 hover:text-red-400 rounded"><X className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex justify-end">
            <p className="text-xs font-bold text-gray-700">Lines Total: <span className="text-green-600">${lineTotal.toFixed(2)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Proposal Modal ────────────────────────────────────────────────────────────
function ProposalModal({ proposal, onClose, onSaved }) {
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads]       = useState([]);

  const [form, setForm] = useState(proposal ? {
    title:           proposal.title           || '',
    description:     proposal.description     || '',
    contact:         proposal.contact?._id    || proposal.contact || '',
    lead:            proposal.lead?._id       || proposal.lead    || '',
    status:          proposal.status          || 'draft',
    currency:        proposal.currency        || 'INR',
    validUntil:      proposal.validUntil      || '',
    taxPercent:      proposal.taxPercent      || 0,
    discountPercent: proposal.discountPercent || 0,
    notes:           proposal.notes           || '',
    terms:           proposal.terms           || '',
  } : {
    title: '', description: '', contact: '', lead: '', status: 'draft',
    currency: 'USD', validUntil: '', taxPercent: 0, discountPercent: 0,
    notes: '', terms: '',
  });

  const [lines, setLines] = useState(() => {
    if (!proposal?.items?.length) return [];
    return proposal.items.map(it => ({
      _itemId:     it.itemRef || null,
      description: it.description || it.name || '',
      quantity:    it.quantity,
      unitPrice:   it.unitPrice,
      tax:         it.tax      || 0,
      discount:    it.discount || 0,
    }));
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('info');

  useEffect(() => {
    api.get('/contacts', { params: { limit: 100 } }).then(r => setContacts(r.data.data || r.data)).catch(() => {});
    api.get('/leads',    { params: { limit: 100 } }).then(r => setLeads(r.data)).catch(() => {});
  }, []);

  // Preview totals
  const lineTotal    = lines.reduce((s, l) => {
    const base = l.quantity * l.unitPrice;
    const disc = base * ((l.discount || 0) / 100);
    const tax  = (base - disc) * ((l.tax || 0) / 100);
    return s + base - disc + tax;
  }, 0);
  const afterGlobDisc = lineTotal * (1 - (form.discountPercent || 0) / 100);
  const grandTotal    = afterGlobDisc * (1 + (form.taxPercent || 0) / 100);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const itemLines = lines.filter(l => l._itemId).map(l => ({
        itemId:      l._itemId,
        quantity:    l.quantity,
        unitPrice:   l.unitPrice,
        taxRate:     l.tax,
        discountRate:l.discount,
        description: l.description,
      }));
      const rawItems = lines.filter(l => !l._itemId).map(l => ({
        name:      l.description,
        quantity:  l.quantity,
        unitPrice: l.unitPrice,
      }));

      const payload = {
        ...form,
        itemLines,
        items: rawItems,
        taxPercent:      Number(form.taxPercent)      || 0,
        discountPercent: Number(form.discountPercent) || 0,
      };

      if (proposal) await api.put(`/proposals/${proposal._id}`, payload);
      else          await api.post('/proposals', payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save proposal');
      setSaving(false);
    }
  };

  const TabBtn = ({ id, label }) => (
    <button type="button" onClick={() => setTab(id)}
      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${tab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-gray-800">{proposal ? 'Edit Proposal' : 'New Proposal'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-gray-100 px-3 flex-shrink-0">
          <TabBtn id="info"     label="Info" />
          <TabBtn id="items"    label="Line Items" />
          <TabBtn id="settings" label="Settings" />
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {error && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {tab === 'info' && (
              <div className="space-y-3">
                <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
                <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Contact *</label>
                    <select className="input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} required>
                      <option value="">Select contact...</option>
                      {contacts.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Linked Lead</label>
                    <select className="input" value={form.lead} onChange={e => setForm({...form, lead: e.target.value})}>
                      <option value="">None</option>
                      {leads.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Valid Until</label><input className="input" type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} /></div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === 'items' && (
              <div className="space-y-4">
                <ItemPicker lines={lines} onChange={setLines} />

                {/* Global tax / discount */}
                <div className="border border-dashed border-gray-200 rounded p-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Global Adjustments (applied on top of line items)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Global Tax (%)</label>
                      <div className="relative">
                        <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input className="input pl-7" type="number" min="0" max="100" step="0.1" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Global Discount (%)</label>
                      <div className="relative">
                        <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input className="input pl-7" type="number" min="0" max="100" step="0.1" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  {/* Grand total preview */}
                  <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded px-4 py-2.5">
                    <span className="text-xs text-green-600 font-semibold uppercase">Grand Total Preview</span>
                    <span className="text-lg font-bold text-green-700">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    {['USD','EUR','GBP','INR','AED','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Notes</label><textarea className="input resize-none" rows={4} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
                <div><label className="label">Terms & Conditions</label><textarea className="input resize-none" rows={4} value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} /></div>
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : (proposal ? 'Save Changes' : 'Create Proposal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Proposal Detail ───────────────────────────────────────────────────────────
function ProposalDetail({ proposal, onClose, onEdit, onDelete, onRefresh }) {
  const [acting, setActing] = useState(false);

  const doAction = async (fn) => {
    setActing(true);
    try { await fn(); onRefresh(); onClose(); }
    finally { setActing(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => printProposal(proposal)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => onEdit(proposal)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(proposal._id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base leading-tight">{proposal.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{proposal.contact?.name || '—'}</p>
              <span className={`badge capitalize mt-1 inline-block ${statusColors[proposal.status]}`}>{proposal.status}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-gray-900">${(proposal.amount || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">{proposal.currency || 'INR'}</p>
            </div>
          </div>

          {proposal.description && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 leading-relaxed">{proposal.description}</p>
          )}

          {/* Quick actions */}
          <div className="space-y-2">
            {proposal.status === 'draft' && (
              <button onClick={() => doAction(() => api.patch(`/proposals/${proposal._id}/send`))} disabled={acting}
                className="btn-primary w-full justify-center text-xs py-2">
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Mark as Sent
              </button>
            )}
            {['sent', 'viewed'].includes(proposal.status) && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => doAction(() => api.patch(`/proposals/${proposal._id}/respond`, { action: 'accepted' }))} disabled={acting}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" /> Accept
                </button>
                <button onClick={() => doAction(() => api.patch(`/proposals/${proposal._id}/respond`, { action: 'rejected' }))} disabled={acting}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Contact',     value: proposal.contact?.name },
              { label: 'Lead',        value: proposal.lead?.title },
              { label: 'Valid Until', value: proposal.validUntil },
              { label: 'Currency',    value: proposal.currency },
              { label: 'Tax',         value: proposal.taxPercent > 0 ? `${proposal.taxPercent}%` : null },
              { label: 'Discount',    value: proposal.discountPercent > 0 ? `${proposal.discountPercent}%` : null },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded p-3">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Line items */}
          {proposal.items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</p>
              <div className="border border-gray-100 rounded overflow-hidden">
                {proposal.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 last:border-0 bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.description || item.name}</p>
                      <p className="text-xs text-gray-400">Qty {item.quantity} × ${item.unitPrice?.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0 ml-3">${(item.amount || (item.quantity * item.unitPrice) || 0).toLocaleString()}</p>
                  </div>
                ))}
                <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
                  {proposal.subtotal > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${proposal.subtotal.toLocaleString()}</span></div>}
                  {proposal.totalDiscount > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Discount ({proposal.discountPercent}%)</span><span>-${proposal.totalDiscount.toLocaleString()}</span></div>}
                  {proposal.totalTax > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Tax ({proposal.taxPercent}%)</span><span>+${proposal.totalTax.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-200 pt-1 mt-1"><span>Total</span><span>${(proposal.amount||0).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-400 space-y-1">
            {proposal.sentAt      && <p>Sent: {new Date(proposal.sentAt).toLocaleString()}</p>}
            {proposal.viewedAt    && <p>Viewed: {new Date(proposal.viewedAt).toLocaleString()}</p>}
            {proposal.respondedAt && <p>Responded: {new Date(proposal.respondedAt).toLocaleString()}</p>}
          </div>

          {proposal.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{proposal.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Proposals() {
  const [proposals, setProposals]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [selected, setSelected]     = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const timer                       = useRef(null);

  const fetchProposals = () => {
    setLoading(true);
    api.get('/proposals', { params: { status: statusFilter || undefined, search: search || undefined, page, limit: 15 } })
      .then(r => { setProposals(r.data.data); setTotal(r.data.total); setTotalPages(r.data.totalPages); })
      .finally(() => setLoading(false));
  };

  const fetchStats = () => { api.get('/proposals/stats').then(r => setStats(r.data)).catch(() => {}); };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetchProposals(); }, 350);
  }, [search, statusFilter]);
  useEffect(() => { fetchProposals(); }, [page]);

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setSelected(null); setShowModal(true); };

  const handleSaved = () => { setShowModal(false); fetchProposals(); fetchStats(); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this proposal?')) return;
    await api.delete(`/proposals/${id}`);
    setSelected(null); fetchProposals(); fetchStats();
  };

  // Stats helpers
  const statByStatus = (s) => stats?.byStatus?.find(b => b._id === s)?.count || 0;
  const wonRevenue   = stats?.revenueWon || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Proposals</h1>
          <p className="text-gray-400 text-xs mt-0.5">{total} total proposals</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> New Proposal</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 border-l-2 border-l-green-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Won Revenue</p>
            <p className="text-xl font-bold text-green-600 mt-1">₹{wonRevenue.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Accepted</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{statByStatus('accepted')}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-blue-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Sent / Viewed</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{statByStatus('sent') + statByStatus('viewed')}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-orange-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Expiring Soon</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{stats.expiringThisWeek || 0}</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search proposals..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['', ...statusOptions].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : proposals.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No proposals found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {proposals.map(p => (
            <div key={p._id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{p.contact?.name || '—'}</p>
                </div>
                <span className={`badge capitalize flex-shrink-0 ml-2 ${statusColors[p.status]}`}>{p.status}</span>
              </div>
              {p.description && <p className="text-xs text-gray-400 line-clamp-1 mb-2">{p.description}</p>}
              {p.validUntil && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Valid until {p.validUntil}
                </p>
              )}
              <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                  <DollarSign className="w-3.5 h-3.5" />{(p.amount || 0).toLocaleString()}
                </div>
                <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

      {selected  && <ProposalDetail proposal={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={handleDelete} onRefresh={() => { fetchProposals(); fetchStats(); setSelected(null); }} />}
      {showModal && <ProposalModal  proposal={editing}  onClose={() => setShowModal(false)} onSaved={handleSaved} />}
    </div>
  );
}