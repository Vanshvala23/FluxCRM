import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, X, Loader2, Search, FileText,
  DollarSign, Calendar, Check, AlertCircle, Printer,
  ArrowLeft, ChevronDown, Package, Wrench, Eye,
  CreditCard, Clock, Ban, Send, CheckCircle2
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const statusColors = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-orange-100 text-orange-600',
};
const statusIcons = {
  draft: Clock, sent: Send, paid: CheckCircle2, overdue: AlertCircle, cancelled: Ban,
};

// ── Print ─────────────────────────────────────────────────────────────────────
function printInvoice(inv) {
  const win = window.open('', '_blank');
  const rows = (inv.items || []).map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${item.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">$${(item.unitPrice||0).toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${item.discount||0}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${item.tax||0}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600">₹${(item.amount||0).toLocaleString()}</td>
    </tr>`).join('');
  win.document.write(`
    <html><head><title>${inv.invoiceNumber}</title>
    <style>body{font-family:system-ui,sans-serif;padding:48px;color:#111;max-width:800px;margin:0 auto}
    h1{font-size:28px;font-weight:800;margin:0}.meta{color:#6b7280;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th{background:#f9fafb;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
    .totals{margin-top:16px;display:flex;justify-content:flex-end}
    .totals table{width:260px}.totals td{padding:4px 12px;font-size:14px}
    .total-row td{font-weight:700;font-size:16px;border-top:2px solid #111;padding-top:8px}
    .badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600;background:#dcfce7;color:#166534}
    .footer{margin-top:40px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>INVOICE</h1><p class="meta" style="margin-top:4px">${inv.invoiceNumber}</p></div>
      <span class="badge" style="${inv.status==='paid'?'':'background:#fef9c3;color:#854d0e'}">${inv.status.toUpperCase()}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:32px">
      <div><p style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600">Bill To</p>
        <p style="font-weight:600;margin-top:4px">${inv.clientName}</p>
        <p class="meta">${inv.clientEmail||''}</p><p class="meta">${inv.clientCompany||''}</p>
        <p class="meta" style="white-space:pre-line">${inv.clientAddress||''}</p></div>
      <div style="text-align:right">
        <p class="meta">Issue Date: <strong>${inv.issueDate}</strong></p>
        <p class="meta">Due Date: <strong>${inv.dueDate}</strong></p>
        <p class="meta">Currency: <strong>${inv.currency||'USD'}</strong></p></div>
    </div>
    <table><thead><tr>
      <th>Description</th><th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th><th style="text-align:right">Disc</th>
      <th style="text-align:right">Tax</th><th style="text-align:right">Amount</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="totals"><table>
      <tr><td>Subtotal</td><td style="text-align:right">₹${(inv.subtotal||0).toLocaleString()}</td></tr>
      <tr><td>Discount</td><td style="text-align:right">-₹${(inv.totalDiscount||0).toLocaleString()}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">+₹${(inv.totalTax||0).toLocaleString()}</td></tr>
      <tr class="total-row"><td>Total</td><td style="text-align:right">₹${(inv.total||0).toLocaleString()}</td></tr>
      ${inv.amountPaid>0?`<tr><td style="color:#16a34a">Paid</td><td style="text-align:right;color:#16a34a">-₹${(inv.amountPaid||0).toLocaleString()}</td></tr>`:''}
      ${inv.amountDue>0?`<tr><td style="font-weight:700">Balance Due</td><td style="text-align:right;font-weight:700;color:#dc2626">₹${(inv.amountDue||0).toLocaleString()}</td></tr>`:''}
    </table></div>
    ${inv.notes?`<div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:6px"><p style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600">Notes</p><p style="margin-top:6px;font-size:13px">${inv.notes}</p></div>`:''}
    ${inv.terms?`<div style="margin-top:12px;padding:16px;background:#f9fafb;border-radius:6px"><p style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600">Terms</p><p style="margin-top:6px;font-size:13px">${inv.terms}</p></div>`:''}
    <div class="footer">Generated from FluxCRM · ${new Date().toLocaleString()}</div>
    </body></html>`);
  win.document.close(); win.print();
}

// ── Item picker for line items ─────────────────────────────────────────────────
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

  const addItem = (catalogueItem) => {
    const existing = lines.find(l => l._itemId === catalogueItem._id);
    if (existing) {
      onChange(lines.map(l => l._itemId === catalogueItem._id ? { ...l, quantity: l.quantity + 1 } : l));
    } else {
      onChange([...lines, {
        _itemId:     catalogueItem._id,
        description: catalogueItem.description || catalogueItem.name,
        quantity:    1,
        unitPrice:   catalogueItem.unitPrice,
        tax:         catalogueItem.taxRate    || 0,
        discount:    catalogueItem.discountRate || 0,
        _name:       catalogueItem.name,
        _type:       catalogueItem.type,
      }]);
    }
  };

  const addManual = () => {
    onChange([...lines, { _itemId: null, description: '', quantity: 1, unitPrice: 0, tax: 0, discount: 0 }]);
  };

  const updateLine = (idx, field, val) => {
    onChange(lines.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const removeLine = (idx) => onChange(lines.filter((_, i) => i !== idx));

  const computeAmount = (l) => {
    const base = l.quantity * l.unitPrice;
    const disc = base * ((l.discount || 0) / 100);
    const tax  = (base - disc) * ((l.tax || 0) / 100);
    return Math.round((base - disc + tax) * 100) / 100;
  };

  const totals = lines.reduce((acc, l) => {
    const base = l.quantity * l.unitPrice;
    const disc = base * ((l.discount || 0) / 100);
    const tax  = (base - disc) * ((l.tax || 0) / 100);
    acc.subtotal += base;
    acc.discount += disc;
    acc.tax      += tax;
    acc.total    += base - disc + tax;
    return acc;
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 });

  return (
    <div className="space-y-3">
      {/* Catalogue search */}
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
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-100 rounded hover:border-primary-200 hover:bg-primary-50 transition-colors text-left group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${ci.type === 'product' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {ci.type === 'product' ? <Package className="w-3 h-3 text-blue-600" /> : <Wrench className="w-3 h-3 text-purple-600" />}
                  </div>
                  <span className="truncate font-medium text-gray-700">{ci.name}</span>
                  {ci.sku && <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{ci.sku}</span>}
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

      {/* Line items table */}
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
                  <td className="px-3 py-1.5">
                    <input className="input text-xs py-1 w-full" value={line.description} placeholder="Description" onChange={e => updateLine(idx, 'description', e.target.value)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className="input text-xs py-1 w-full text-center" type="number" min="1" value={line.quantity} onChange={e => updateLine(idx, 'quantity', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className="input text-xs py-1 w-full text-right" type="number" min="0" step="0.01" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className="input text-xs py-1 w-full text-center" type="number" min="0" max="100" value={line.tax} onChange={e => updateLine(idx, 'tax', Number(e.target.value))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className="input text-xs py-1 w-full text-center" type="number" min="0" max="100" value={line.discount} onChange={e => updateLine(idx, 'discount', Number(e.target.value))} />
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold text-gray-700">
                    ₹{computeAmount(line).toLocaleString()}
                  </td>
                  <td className="pr-2 py-1.5">
                    <button type="button" onClick={() => removeLine(idx)} className="p-1 text-gray-300 hover:text-red-400 rounded"><X className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex justify-end">
            <div className="w-56 space-y-0.5 text-xs">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Discount</span><span>-₹{totals.discount.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>+₹{totals.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-300 pt-1 mt-1"><span>Total</span><span>₹{totals.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ invoice, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [form, setForm] = useState(invoice ? {
    clientName:    invoice.clientName    || '',
    clientEmail:   invoice.clientEmail   || '',
    clientPhone:   invoice.clientPhone   || '',
    clientCompany: invoice.clientCompany || '',
    clientAddress: invoice.clientAddress || '',
    issueDate:     invoice.issueDate     || today,
    dueDate:       invoice.dueDate       || due30,
    currency:      invoice.currency      || 'USD',
    paymentMethod: invoice.paymentMethod || 'bank_transfer',
    notes:         invoice.notes         || '',
    terms:         invoice.terms         || '',
    amountPaid:    invoice.amountPaid    || 0,
    status:        invoice.status        || 'draft',
  } : {
    clientName: '', clientEmail: '', clientPhone: '', clientCompany: '',
    clientAddress: '', issueDate: today, dueDate: due30, currency: 'USD',
    paymentMethod: 'bank_transfer', notes: '', terms: '', amountPaid: 0, status: 'draft',
  });

  const [lines, setLines] = useState(() => {
    if (!invoice?.items?.length) return [];
    return invoice.items.map(it => ({
      _itemId:     it.itemRef || null,
      description: it.description,
      quantity:    it.quantity,
      unitPrice:   it.unitPrice,
      tax:         it.tax         || 0,
      discount:    it.discount    || 0,
    }));
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState('client'); // client | items | settings

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      // Split lines into catalogue refs vs manual items
      const itemLines = lines.filter(l => l._itemId).map(l => ({
        itemId:      l._itemId,
        quantity:    l.quantity,
        unitPrice:   l.unitPrice,
        taxRate:     l.tax,
        discountRate:l.discount,
        description: l.description,
      }));
      const rawItems = lines.filter(l => !l._itemId).map(l => ({
        description: l.description,
        quantity:    l.quantity,
        unitPrice:   l.unitPrice,
        tax:         l.tax,
        discount:    l.discount,
      }));

      const payload = { ...form, itemLines, items: rawItems };
      if (invoice) await api.put(`/invoices/${invoice._id}`, payload);
      else         await api.post('/invoices', payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save invoice');
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
            <FileText className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-gray-800">{invoice ? `Edit ${invoice.invoiceNumber}` : 'New Invoice'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-3 flex-shrink-0">
          <TabBtn id="client"   label="Client Info" />
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

            {tab === 'client' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Client Name *</label><input className="input" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} required /></div>
                  <div><label className="label">Company</label><input className="input" value={form.clientCompany} onChange={e => setForm({...form, clientCompany: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Email</label><input className="input" type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} /></div>
                  <div><label className="label">Phone</label><input className="input" value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})} /></div>
                </div>
                <div><label className="label">Address</label><textarea className="input resize-none" rows={2} value={form.clientAddress} onChange={e => setForm({...form, clientAddress: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Issue Date *</label><input className="input" type="date" value={form.issueDate} onChange={e => setForm({...form, issueDate: e.target.value})} required /></div>
                  <div><label className="label">Due Date *</label><input className="input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required /></div>
                </div>
              </div>
            )}

            {tab === 'items' && (
              <ItemPicker lines={lines} onChange={setLines} />
            )}

            {tab === 'settings' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {['draft','sent','paid','overdue','cancelled'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                      {['USD','EUR','GBP','INR','AED','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select className="input" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                      {['cash','bank_transfer','credit_card','cheque','other'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Amount Paid (₹)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: Number(e.target.value)})} />
                </div>
                <div><label className="label">Notes</label><textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
                <div><label className="label">Payment Terms</label><textarea className="input resize-none" rows={2} value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} /></div>
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : (invoice ? 'Save Changes' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invoice Detail ────────────────────────────────────────────────────────────
function InvoiceDetail({ invoice, onClose, onEdit, onDelete, onRefresh }) {
  const [marking, setMarking] = useState(false);

  const handleMarkPaid = async () => {
    setMarking(true);
    try { await api.patch(`/invoices/${invoice._id}/pay`); onRefresh(); onClose(); }
    finally { setMarking(false); }
  };

  const handleStatus = async (status) => {
    await api.patch(`/invoices/${invoice._id}/status`, { status });
    onRefresh(); onClose();
  };

  const StatusIcon = statusIcons[invoice.status] || FileText;
  const paidPct = invoice.total > 0 ? Math.min(100, Math.round((invoice.amountPaid / invoice.total) * 100)) : 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => printInvoice(invoice)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => onEdit(invoice)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(invoice._id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base">{invoice.invoiceNumber}</h2>
              <p className="text-xs text-gray-500">{invoice.clientName} {invoice.clientCompany ? `· ${invoice.clientCompany}` : ''}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge capitalize ${statusColors[invoice.status]}`}>{invoice.status}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-gray-900">₹{(invoice.total || 0).toLocaleString()}</p>
              {invoice.amountDue > 0 && <p className="text-xs text-red-500 font-medium">Due: ₹{invoice.amountDue.toLocaleString()}</p>}
            </div>
          </div>

          {/* Payment progress */}
          {invoice.total > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Payment Progress</span><span>{paidPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Paid: ₹{(invoice.amountPaid || 0).toLocaleString()}</span>
                <span>Total: ₹{(invoice.total || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Quick actions */}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <div className="flex gap-2">
              <button onClick={handleMarkPaid} disabled={marking} className="btn-primary flex-1 justify-center text-xs py-2">
                {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Mark as Paid
              </button>
              {invoice.status === 'draft' && (
                <button onClick={() => handleStatus('sent')} className="btn-secondary flex-1 justify-center text-xs py-2">
                  <Send className="w-3.5 h-3.5" /> Mark Sent
                </button>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Issue Date', value: invoice.issueDate, icon: Calendar },
              { label: 'Due Date',   value: invoice.dueDate,   icon: Calendar },
              { label: 'Email',      value: invoice.clientEmail, icon: Eye },
              { label: 'Payment',    value: invoice.paymentMethod?.replace('_',' '), icon: CreditCard },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded p-3">
                <div className="flex items-center gap-1.5 mb-0.5"><Icon className="w-3 h-3 text-gray-400" /><p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p></div>
                <p className="text-sm font-medium text-gray-800 truncate">{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Line items */}
          {invoice.items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</p>
              <div className="border border-gray-100 rounded overflow-hidden">
                {invoice.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 last:border-0 bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.description}</p>
                      <p className="text-xs text-gray-400">Qty {item.quantity} × ₹{item.unitPrice?.toLocaleString()}{item.tax > 0 ? ` · Tax ${item.tax}%` : ''}{item.discount > 0 ? ` · Disc ${item.discount}%` : ''}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0 ml-3">₹{(item.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
                {/* Totals */}
                <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>₹{(invoice.subtotal||0).toLocaleString()}</span></div>
                  {invoice.totalDiscount > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Discount</span><span>-${invoice.totalDiscount.toLocaleString()}</span></div>}
                  {invoice.totalTax > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Tax</span><span>+${invoice.totalTax.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-200 pt-1"><span>Total</span><span>₹{(invoice.total||0).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          )}

          {invoice.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Invoices() {
  const [invoices, setInvoices]     = useState([]);
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

  const fetchInvoices = () => {
    setLoading(true);
    api.get('/invoices', { params: { status: statusFilter || undefined, clientName: search || undefined, page, limit: 15 } })
      .then(r => { setInvoices(r.data.data); setTotal(r.data.total); setTotalPages(r.data.pages); })
      .finally(() => setLoading(false));
  };

  const fetchStats = () => { api.get('/invoices/stats').then(r => setStats(r.data)).catch(() => {}); };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetchInvoices(); }, 350);
  }, [search, statusFilter]);
  useEffect(() => { fetchInvoices(); }, [page]);

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (inv) => { setEditing(inv); setSelected(null); setShowModal(true); };

  const handleSaved = () => { setShowModal(false); fetchInvoices(); fetchStats(); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    setSelected(null); fetchInvoices(); fetchStats();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-gray-400 text-xs mt-0.5">{total} total invoices</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> New Invoice</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold text-gray-800 mt-1">₹{(stats.totalRevenue||0).toLocaleString()}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-red-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Outstanding</p>
            <p className="text-xl font-bold text-red-600 mt-1">₹{(stats.totalOutstanding||0).toLocaleString()}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-green-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Paid</p>
            <p className="text-xl font-bold text-green-600 mt-1">{stats.byStatus?.paid || 0}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-orange-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Overdue</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{stats.byStatus?.overdue || 0}</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search client name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No invoices found</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Invoice #</th>
                <th className="table-th">Client</th>
                <th className="table-th hidden md:table-cell">Due Date</th>
                <th className="table-th text-right">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(inv => {
                const StatusIcon = statusIcons[inv.status] || FileText;
                return (
                  <tr key={inv._id} className="table-row cursor-pointer" onClick={() => setSelected(inv)}>
                    <td className="table-td font-mono text-xs font-medium text-primary-600">{inv.invoiceNumber}</td>
                    <td className="table-td">
                      <p className="font-medium text-gray-800 truncate max-w-36">{inv.clientName}</p>
                      {inv.clientCompany && <p className="text-xs text-gray-400 truncate">{inv.clientCompany}</p>}
                    </td>
                    <td className="table-td hidden md:table-cell text-gray-500 text-xs">{inv.dueDate}</td>
                    <td className="table-td text-right">
                      <p className="font-bold text-gray-800">₹{(inv.total||0).toLocaleString()}</p>
                      {inv.amountDue > 0 && <p className="text-[10px] text-red-500">Due: ₹{inv.amountDue.toLocaleString()}</p>}
                    </td>
                    <td className="table-td">
                      <span className={`badge capitalize ${statusColors[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="table-td text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => printInvoice(inv)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"><Printer className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(inv)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(inv._id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

      {selected  && <InvoiceDetail invoice={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={handleDelete} onRefresh={() => { fetchInvoices(); fetchStats(); setSelected(null); }} />}
      {showModal && <InvoiceModal  invoice={editing}  onClose={() => setShowModal(false)} onSaved={handleSaved} />}
    </div>
  );
}