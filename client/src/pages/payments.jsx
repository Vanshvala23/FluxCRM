import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, X, Loader2, Search,
  ArrowLeft, ChevronDown, Eye, CreditCard, Calendar,
  AlertCircle, IndianRupee, FileText,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const MODE_LABELS = {
  bank:        'Bank',
  cash:        'Cash',
  cheque:      'Cheque',
  credit_card: 'Credit Card',
  upi:         'UPI',
  other:       'Other',
};
const PAYMENT_MODES = Object.keys(MODE_LABELS);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtAmt  = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── InvoiceSelect ─────────────────────────────────────────────────────────────
function InvoiceSelect({ value, onChange }) {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/invoices', { params: { limit: 100 } })
      .then(r => setInvoices(r.data.data || r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <select
        style={{ color: '#111827' }}
        className="input pr-8 w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      >
        <option value="" style={{ color: '#6b7280' }}>
          {loading ? 'Loading invoices…' : 'Select invoice'}
        </option>
        {invoices.map(inv => (
          <option key={inv._id} value={inv._id} style={{ color: '#111827' }}>
            {inv.invoiceNumber} — {inv.clientName ?? ''}
            {inv.amountDue > 0 ? ` (Due: ₹${Number(inv.amountDue).toLocaleString()})` : ''}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ payment, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    invoice:       payment?.invoice?._id || payment?.invoice || '',
    amount:        payment?.amount        || '',
    paymentMode:   payment?.paymentMode   || 'bank',
    paymentDate:   payment?.paymentDate?.slice(0, 10) || today,
    transactionId: payment?.transactionId || '',
    note:          payment?.note          || '',
    currency:      payment?.currency      || 'INR',
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.invoice)     return setError('Please select an invoice.');
    if (!form.amount)      return setError('Please enter an amount.');
    if (!form.paymentDate) return setError('Please select a payment date.');
    setError(''); setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (payment) await api.patch(`/payments/${payment._id}`, payload);
      else         await api.post('/payments', payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save payment.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-gray-800">{payment ? 'Edit Payment' : 'Record Payment'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-3">

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="label">Invoice *</label>
              <InvoiceSelect value={form.invoice} onChange={v => setForm({ ...form, invoice: v })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount *</label>
                <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <label className="label">Payment Date *</label>
                <input type="date" className="input" value={form.paymentDate}
                  onChange={e => setForm({ ...form, paymentDate: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Payment Mode</label>
                <select style={{ color: '#111827' }} className="input" value={form.paymentMode}
                  onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m} style={{ color: '#111827' }}>{MODE_LABELS[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select style={{ color: '#111827' }} className="input" value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}>
                  {['INR','USD','EUR','GBP'].map(c => <option key={c} value={c} style={{ color: '#111827' }}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Transaction ID</label>
              <input className="input" placeholder="Optional" value={form.transactionId}
                onChange={e => setForm({ ...form, transactionId: e.target.value })} />
            </div>

            <div>
              <label className="label">Note</label>
              <textarea className="input resize-none" rows={2} placeholder="Optional note…"
                value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : payment ? 'Save Changes' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payment Detail slide-over ─────────────────────────────────────────────────
function PaymentDetail({ payment, onClose, onEdit, onDelete }) {
  const details = [
    { label: 'Payment #',     value: payment.paymentNumber,                                icon: FileText  },
    { label: 'Invoice #',     value: payment.invoiceNumber || '—',                         icon: FileText  },
    { label: 'Customer',      value: payment.customerName  || '—',                         icon: Eye       },
    { label: 'Payment Mode',  value: MODE_LABELS[payment.paymentMode] || payment.paymentMode, icon: CreditCard },
    { label: 'Transaction ID',value: payment.transactionId || '—',                         icon: FileText  },
    { label: 'Date',          value: fmtDate(payment.paymentDate),                         icon: Calendar  },
    { label: 'Currency',      value: payment.currency || '—',                              icon: FileText  },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(payment)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(payment._id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base">{payment.paymentNumber}</h2>
              <p className="text-xs text-gray-500">{payment.customerName || '—'}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Invoice: {payment.invoiceNumber}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-gray-900 flex items-center gap-0.5 justify-end">
                <IndianRupee className="w-4 h-4" />{fmtAmt(payment.amount)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{payment.currency}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3 h-3 text-gray-400" />
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {payment.note && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Note</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 leading-relaxed">{payment.note}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Payments() {
  const [payments,   setPayments]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const timer                       = useRef(null);

  const fetchPayments = () => {
    setLoading(true);
    api.get('/payments', { params: { search: search || undefined, page, limit: 15 } })
      .then(r => {
        setPayments(r.data.data || r.data);
        setTotal(r.data.total ?? 0);
        setTotalPages(r.data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get('/payments/stats').then(r => setStats(r.data)).catch(() => {});
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetchPayments(); }, 350);
  }, [search]);
  useEffect(() => { fetchPayments(); }, [page]);

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setSelected(null); setShowModal(true); };
  const handleSaved  = () => { setShowModal(false); fetchPayments(); fetchStats(); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    setSelected(null); fetchPayments(); fetchStats();
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-gray-400 text-xs mt-0.5">{total} total payments</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Total Collected</p>
            <p className="text-xl font-bold text-gray-800 mt-1">₹{(stats.totalCollected || 0).toLocaleString()}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-blue-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">This Month</p>
            <p className="text-xl font-bold text-blue-600 mt-1">₹{(stats.thisMonth || 0).toLocaleString()}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-green-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Payments</p>
            <p className="text-xl font-bold text-green-600 mt-1">{stats.count || 0}</p>
          </div>
          <div className="card p-4 border-l-2 border-l-purple-400">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Avg Payment</p>
            <p className="text-xl font-bold text-purple-600 mt-1">₹{(stats.avgAmount || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input className="input pl-8 py-1.5 text-sm w-full"
          placeholder="Search invoice, customer, transaction…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No payments found</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Payment #</th>
                <th className="table-th">Invoice #</th>
                <th className="table-th hidden md:table-cell">Payment Mode</th>
                <th className="table-th hidden lg:table-cell">Transaction ID</th>
                <th className="table-th">Customer</th>
                <th className="table-th text-right">Amount</th>
                <th className="table-th hidden md:table-cell">Date</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p, idx) => (
                <tr key={p._id} className="table-row cursor-pointer" onClick={() => setSelected(p)}>
                  <td className="table-td text-gray-400 text-xs">{(page - 1) * 15 + idx + 1}</td>
                  <td className="table-td font-mono text-xs font-medium text-primary-600">{p.paymentNumber}</td>
                  <td className="table-td text-xs text-blue-600 font-medium">{p.invoiceNumber || '—'}</td>
                  <td className="table-td hidden md:table-cell text-gray-500 text-xs">{MODE_LABELS[p.paymentMode] || p.paymentMode}</td>
                  <td className="table-td hidden lg:table-cell text-gray-400 text-xs font-mono">{p.transactionId || '—'}</td>
                  <td className="table-td">
                    <p className="font-medium text-gray-800 truncate max-w-36">{p.customerName || '—'}</p>
                    {p.company && <p className="text-xs text-gray-400 truncate">{p.company}</p>}
                  </td>
                  <td className="table-td text-right">
                    <p className="font-bold text-gray-800 flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-3 h-3" />{fmtAmt(p.amount)}
                    </p>
                  </td>
                  <td className="table-td hidden md:table-cell text-gray-500 text-xs">{fmtDate(p.paymentDate)}</td>
                  <td className="table-td text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {selected  && <PaymentDetail payment={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={handleDelete} />}
      {showModal && <PaymentModal  payment={editing}  onClose={() => setShowModal(false)} onSaved={handleSaved} />}
    </div>
  );
}