import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Search, Printer, Pencil, Trash2, Send, Eye,
  CheckCircle, XCircle, ChevronDown, X, FileText,
  IndianRupee, Calendar, User, Layers, AlertTriangle,
  MoreHorizontal, TrendingUp, Clock,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  draft:    { label: 'Draft',    color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400'    },
  sent:     { label: 'Sent',     color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'    },
  viewed:   { label: 'Viewed',   color: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500'  },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',         dot: 'bg-red-500'     },
  expired:  { label: 'Expired',  color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500'   },
};

const EMPTY_FORM = {
  title: '', description: '', contact: '', lead: '',
  currency: 'INR', validUntil: '', taxPercent: 0,
  discountPercent: 0, notes: '', terms: '',
  items: [{ name: '', description: '', quantity: 1, unitPrice: 0 }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

function computeTotals(items = [], taxPercent = 0, discountPercent = 0) {
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const discount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (taxPercent / 100);
  return { subtotal, discount, tax, total: afterDiscount + tax };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── Searchable Select ────────────────────────────────────────────────────────
// Replaces native <select> with a custom dropdown that has proper black text,
// search filtering, and clear option.

function SearchableSelect({ value, onChange, options, placeholder = 'Select…', nullable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sub || '').toLowerCase().includes(query.toLowerCase())
  );

  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300
          ${open ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}
          bg-white`}
      >
        {selected ? (
          <span className="flex flex-col min-w-0">
            <span className="text-gray-900 font-medium truncate">{selected.label}</span>
            {selected.sub && <span className="text-xs text-gray-400 truncate">{selected.sub}</span>}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900 placeholder-gray-400"
                placeholder="Search…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {nullable && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2
                  ${!value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <span className="italic">None</span>
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">No results</p>
            ) : filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${o.value === value
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-900 hover:bg-gray-50'}`}
              >
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

// ─── Print View ───────────────────────────────────────────────────────────────

function PrintView({ proposal }) {
  const { subtotal, discount, tax, total } = computeTotals(
    proposal.items, proposal.taxPercent, proposal.discountPercent
  );

  return (
    <div id="print-area" className="hidden print:block p-10 font-sans text-gray-900 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
          <p className="text-gray-500 mt-1">Proposal #{proposal._id?.slice(-6).toUpperCase()}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Valid until: {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : '—'}</p>
          <StatusBadge status={proposal.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="font-semibold text-gray-700 mb-1">Client</p>
          <p>{proposal.contact?.name || '—'}</p>
          <p className="text-gray-500">{proposal.contact?.email}</p>
        </div>
        {proposal.lead && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">Related Lead</p>
            <p>{proposal.lead?.title}</p>
          </div>
        )}
      </div>

      {proposal.description && (
        <p className="text-sm text-gray-600 mb-6">{proposal.description}</p>
      )}

      <table className="w-full text-sm mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 pr-4 font-semibold">Item</th>
            <th className="text-right py-2 px-2 font-semibold">Qty</th>
            <th className="text-right py-2 px-2 font-semibold">Unit Price</th>
            <th className="text-right py-2 pl-2 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {(proposal.items || []).map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 pr-4">
                <p className="font-medium">{item.name}</p>
                {item.description && <p className="text-gray-400 text-xs">{item.description}</p>}
              </td>
              <td className="text-right py-2 px-2">{item.quantity}</td>
              <td className="text-right py-2 px-2">₹{fmt(item.unitPrice)}</td>
              <td className="text-right py-2 pl-2">₹{fmt(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-56 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{fmt(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-red-500"><span>Discount ({proposal.discountPercent}%)</span><span>-₹{fmt(discount)}</span></div>}
        {tax > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax ({proposal.taxPercent}%)</span><span>₹{fmt(tax)}</span></div>}
        <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2 mt-2">
          <span>Total</span><span>₹{fmt(total)}</span>
        </div>
      </div>

      {proposal.notes && (
        <div className="mt-8 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Notes</p>
          <p className="text-gray-600">{proposal.notes}</p>
        </div>
      )}
      {proposal.terms && (
        <div className="mt-4 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Terms & Conditions</p>
          <p className="text-gray-600">{proposal.terms}</p>
        </div>
      )}
    </div>
  );
}

// ─── Line Item Editor ─────────────────────────────────────────────────────────

function ItemsEditor({ items, onChange }) {
  const update = (i, field, val) => {
    const updated = items.map((item, idx) =>
      idx === i ? { ...item, [field]: field === 'name' || field === 'description' ? val : Number(val) } : item
    );
    onChange(updated);
  };

  const addRow = () => onChange([...items, { name: '', description: '', quantity: 1, unitPrice: 0 }]);
  const removeRow = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      {/* Header row */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-3 mb-1">
        <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</span>
        <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Qty</span>
        <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Unit Price</span>
        <span className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Total</span>
        <span className="col-span-1" />
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-xl p-3">
            <div className="col-span-5">
              <input
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 placeholder-gray-400"
                placeholder="Item name *"
                value={item.name}
                onChange={(e) => update(i, 'name', e.target.value)}
              />
              <input
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 mt-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-600 placeholder-gray-400"
                placeholder="Description (optional)"
                value={item.description}
                onChange={(e) => update(i, 'description', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <input type="number" min="1"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => update(i, 'quantity', e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <input type="number" min="0"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
                placeholder="Unit price"
                value={item.unitPrice}
                onChange={(e) => update(i, 'unitPrice', e.target.value)}
              />
            </div>
            <div className="col-span-1 flex items-center justify-center pt-1.5">
              <span className="text-xs text-gray-700 font-semibold">₹{fmt(item.quantity * item.unitPrice)}</span>
            </div>
            <div className="col-span-1 flex items-center justify-center pt-1">
              <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addRow}
        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
        <Plus className="w-4 h-4" /> Add line item
      </button>
    </div>
  );
}

// ─── Proposal Form Modal ──────────────────────────────────────────────────────

function ProposalModal({ proposal, contacts, leads, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!proposal) return EMPTY_FORM;
    return {
      title: proposal.title || '',
      description: proposal.description || '',
      contact: proposal.contact?._id || proposal.contact || '',
      lead: proposal.lead?._id || proposal.lead || '',
      currency: proposal.currency || 'INR',
      validUntil: proposal.validUntil ? proposal.validUntil.split('T')[0] : '',
      taxPercent: proposal.taxPercent || 0,
      discountPercent: proposal.discountPercent || 0,
      notes: proposal.notes || '',
      terms: proposal.terms || '',
      items: proposal.items?.length ? proposal.items : [{ name: '', description: '', quantity: 1, unitPrice: 0 }],
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const { subtotal, discount, tax, total } = computeTotals(form.items, form.taxPercent, form.discountPercent);

  // Build option arrays for SearchableSelect
  const contactOptions = contacts.map(c => ({
    value: c._id,
    label: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
    sub: c.email,
  }));

  const leadOptions = leads.map(l => ({
    value: l._id,
    label: l.title,
    sub: l.status ? `Status: ${l.status}` : undefined,
  }));

  const currencyOptions = [
    { value: 'INR', label: 'INR (₹)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required');
    if (!form.contact) return setError('Contact is required');
    setSaving(true);
    setError('');
    try {
      if (proposal?._id) {
        await api.put(`/proposals/${proposal._id}`, form);
      } else {
        await api.post('/proposals', form);
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Input class shared across all text inputs inside modal
  const inputCls = 'mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white';
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {proposal ? 'Edit Proposal' : 'New Proposal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title + Description */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls}
                placeholder="e.g. Web Redesign Proposal for Acme Corp"
                value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={2} className={`${inputCls} resize-none`}
                placeholder="Brief overview of this proposal..."
                value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>

          {/* Contact + Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Contact *</label>
              <div className="mt-1">
                <SearchableSelect
                  value={form.contact}
                  onChange={(val) => set('contact', val)}
                  options={contactOptions}
                  placeholder="Select contact…"
                />
              </div>
              {contactOptions.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> No contacts found. Add contacts first.
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Related Lead</label>
              <div className="mt-1">
                <SearchableSelect
                  value={form.lead}
                  onChange={(val) => set('lead', val)}
                  options={leadOptions}
                  placeholder="Select lead (optional)…"
                  nullable
                />
              </div>
            </div>
          </div>

          {/* Currency + Valid Until */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Currency</label>
              <div className="mt-1">
                <SearchableSelect
                  value={form.currency}
                  onChange={(val) => set('currency', val)}
                  options={currencyOptions}
                  placeholder="Select currency…"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Valid Until</label>
              <input type="date" className={inputCls}
                value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className={`${labelCls} mb-2 block`}>Line Items</label>
            <ItemsEditor items={form.items} onChange={(items) => set('items', items)} />
          </div>

          {/* Tax + Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Discount %</label>
              <input type="number" min="0" max="100" className={inputCls}
                value={form.discountPercent} onChange={(e) => set('discountPercent', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Tax %</label>
              <input type="number" min="0" max="100" className={inputCls}
                value={form.taxPercent} onChange={(e) => set('taxPercent', Number(e.target.value))} />
            </div>
          </div>

          {/* Totals preview */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="text-gray-900 font-medium">₹{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-red-500"><span>Discount ({form.discountPercent}%)</span><span>-₹{fmt(discount)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax ({form.taxPercent}%)</span><span className="text-gray-900 font-medium">₹{fmt(tax)}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
              <span>Total</span><span>₹{fmt(total)}</span>
            </div>
          </div>

          {/* Notes + Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={3} className={`${inputCls} resize-none`}
                placeholder="Internal or client-facing notes..."
                value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Terms & Conditions</label>
              <textarea rows={3} className={`${inputCls} resize-none`}
                placeholder="Payment terms, delivery, etc."
                value={form.terms} onChange={(e) => set('terms', e.target.value)} />
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
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : 'Save Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ proposal, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/proposals/${proposal._id}`);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Proposal?</h3>
        <p className="text-sm text-gray-500 mb-6">
          "<span className="font-medium text-gray-700">{proposal.title}</span>" will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Proposal Detail Drawer ───────────────────────────────────────────────────

function ProposalDrawer({ proposal, onClose, onEdit, onPrint, onAction, actionLoading }) {
  const { subtotal, discount, tax, total } = computeTotals(
    proposal.items, proposal.taxPercent, proposal.discountPercent
  );

  const actions = [];
  if (proposal.status === 'draft') actions.push({ label: 'Mark as Sent', icon: Send, action: 'send', color: 'text-blue-600 hover:bg-blue-50' });
  if (['sent', 'viewed'].includes(proposal.status)) {
    actions.push({ label: 'Accept', icon: CheckCircle, action: 'accept', color: 'text-emerald-600 hover:bg-emerald-50' });
    actions.push({ label: 'Reject', icon: XCircle, action: 'reject', color: 'text-red-600 hover:bg-red-50' });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">#{proposal._id?.slice(-6).toUpperCase()}</p>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{proposal.title}</h2>
            <div className="mt-2"><StatusBadge status={proposal.status} /></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Contact</span>
              </div>
              <p className="font-semibold text-gray-900">{proposal.contact?.name || '—'}</p>
              <p className="text-gray-500 text-xs">{proposal.contact?.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Valid Until</span>
              </div>
              <p className="font-semibold text-gray-900">
                {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            {proposal.lead && (
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Lead</span>
                </div>
                <p className="font-semibold text-gray-900">{proposal.lead?.title}</p>
              </div>
            )}
          </div>

          {proposal.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-gray-700">{proposal.description}</p>
            </div>
          )}

          {proposal.items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Line Items</p>
              <div className="space-y-2">
                {proposal.items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{item.quantity} × ₹{fmt(item.unitPrice)}</p>
                    </div>
                    <span className="font-semibold text-gray-900">₹{fmt(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="text-gray-900">₹{fmt(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-red-500"><span>Discount ({proposal.discountPercent}%)</span><span>-₹{fmt(discount)}</span></div>}
                {tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax ({proposal.taxPercent}%)</span><span className="text-gray-900">₹{fmt(tax)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
                  <span>Total</span><span>₹{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Timeline</p>
            <div className="space-y-2 text-xs text-gray-500">
              {[
                { label: 'Created',   date: proposal.createdAt   },
                { label: 'Sent',      date: proposal.sentAt      },
                { label: 'Viewed',    date: proposal.viewedAt    },
                { label: 'Responded', date: proposal.respondedAt },
              ].filter(t => t.date).map(({ label, date }) => (
                <div key={label} className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-300" />
                  <span className="font-medium text-gray-600">{label}:</span>
                  <span>{new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>

          {proposal.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</p>
              <p className="text-sm text-gray-700 bg-amber-50 rounded-xl px-4 py-3">{proposal.notes}</p>
            </div>
          )}
          {proposal.terms && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Terms & Conditions</p>
              <p className="text-sm text-gray-700">{proposal.terms}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex flex-wrap gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={onPrint} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          {actions.map(({ label, icon: Icon, action, color }) => (
            <button key={action} onClick={() => onAction(action)} disabled={actionLoading === action}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl transition-colors ${color} disabled:opacity-60`}>
              {actionLoading === action
                ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                : <Icon className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [leads, setLeads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [drawerProposal, setDrawerProposal] = useState(null);
  const [actionLoading, setActionLoading]   = useState('');
  const [printProposal, setPrintProposal]   = useState(null);

  // Load proposals + reference data
  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const [pRes, cRes, lRes] = await Promise.all([
        api.get('/proposals', { params }),
        api.get('/contacts'),
        api.get('/leads'),
      ]);

      setProposals(pRes.data?.data || pRes.data || []);

      // Contacts: normalise name field (some APIs return firstName/lastName separately)
      const rawContacts = cRes.data || [];
      setContacts(rawContacts.map(c => ({
        ...c,
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || '—',
      })));

      setLeads(lRes.data || []);
    } catch (e) {
      console.error('Failed to load proposals page:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleSearch = (e) => { if (e.key === 'Enter') load(); };

  const handleAction = async (action) => {
    if (!drawerProposal) return;
    setActionLoading(action);
    try {
      await api.patch(`/proposals/${drawerProposal._id}/${action}`);
      await load();
      const res = await api.get(`/proposals/${drawerProposal._id}`);
      setDrawerProposal(res.data);
    } finally {
      setActionLoading('');
    }
  };

  const handlePrint = (proposal) => {
    setPrintProposal(proposal);
    setTimeout(() => window.print(), 200);
  };

  const counts = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = proposals.filter((p) => p.status === s).length;
    return acc;
  }, {});

  return (
    <>
      {printProposal && <PrintView proposal={printProposal} />}

      <div className="space-y-6 print:hidden">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage and track all client proposals</p>
          </div>
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Proposal
          </button>
        </div>

        {/* Status filter cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.entries(STATUS_META).map(([key, { label, dot }]) => (
            <button key={key}
              onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
              className={`rounded-xl px-3 py-3 text-center border transition-all bg-white
                ${filterStatus === key ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
              <p className="text-xl font-bold text-gray-900">{counts[key] || 0}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium mt-0.5 text-gray-600">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="Search proposals… (press Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" /> Clear filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FileText className="w-12 h-12 mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">No proposals found</p>
              <p className="text-sm mt-1">Create your first proposal to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposal</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valid Until</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proposals.map((p) => (
                    <tr key={p._id}
                      onClick={() => setDrawerProposal(p)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{p.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">#{p._id?.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-700">{p.contact?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{p.contact?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-900">₹{fmt(p.amount)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-sm">
                        {p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button onClick={() => setModal(p)} title="Edit"
                            className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handlePrint(p)} title="Print"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)} title="Delete"
                            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {modal && (
        <ProposalModal
          proposal={modal === 'create' ? null : modal}
          contacts={contacts}
          leads={leads}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          proposal={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}

      {drawerProposal && (
        <ProposalDrawer
          proposal={drawerProposal}
          onClose={() => setDrawerProposal(null)}
          onEdit={() => { setModal(drawerProposal); setDrawerProposal(null); }}
          onPrint={() => handlePrint(drawerProposal)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}
    </>
  );
}