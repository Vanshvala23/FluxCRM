import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Plus, Pencil, Trash2, Search, IndianRupee,
  ChevronDown, FileX, Loader2, CheckCircle2, Clock, FilePen
} from "lucide-react";

// ── Status config ───────────────────────────────
const STATUS = {
  draft:   { label: "Draft",   icon: FilePen,      cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  issued:  { label: "Issued",  icon: Clock,        cls: "bg-sky-50 text-sky-600 border border-sky-200" },
  applied: { label: "Applied", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
};

// ── Helpers ─────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── CustomerSelect ───────────────────────────────
function CustomerSelect({ value, onChange }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/contacts")
      .then((res) => setCustomers(res.data.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <select
        style={{ color: "#111827" }}
        className="input pr-8 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" style={{ color: "#6b7280" }}>
          {loading ? "Loading customers…" : "Select customer"}
        </option>
        {customers.map((c) => (
          <option key={c._id} value={c._id} style={{ color: "#111827" }}>
            {c.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── Modal ────────────────────────────────────────
function CreditNoteModal({ note, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer:         note?.customer?._id || note?.customer || "",
    creditNoteDate:   note?.creditNoteDate?.slice(0, 10) || "",
    creditNoteNumber: note?.creditNoteNumber || "",
    currency:         note?.currency || "INR",
    discountType:     note?.discountType || "amount",
    showQuantityAs:   note?.showQuantityAs || "quantity",
    discount:         note?.discount || 0,
    adjustment:       note?.adjustment || 0,
    status:           note?.status || "draft",
  });

  const [items, setItems] = useState(
    note?.items?.length
      ? note.items.map((i) => ({
          item: i.item || i.description || "",
          qty:  i.qty  || i.quantity   || 1,
          rate: i.rate || 0,
        }))
      : [{ item: "", qty: 1, rate: 0 }]
  );

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const total    = subtotal - Number(form.discount) + Number(form.adjustment);

  const setItem = (idx, field, val) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, [field]: field === "qty" || field === "rate" ? Number(val) : val }
          : item
      )
    );
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.customer)          return setError("Please select a customer.");
    if (!form.creditNoteDate)    return setError("Please select a date.");
    if (!form.creditNoteNumber)  return setError("Please enter a credit note number.");
    if (items.some((i) => !i.item)) return setError("All line items must have a description.");

    setError("");
    setSaving(true);

    try {
      const payload = {
        customer:         form.customer,
        creditNoteDate:   form.creditNoteDate,
        creditNoteNumber: form.creditNoteNumber,
        currency:         form.currency,
        discountType:     form.discountType,
        showQuantityAs:   form.showQuantityAs,
        discount:         Number(form.discount),
        adjustment:       Number(form.adjustment),
        status:           form.status,
        subtotal,
        total,
        items: items.map((i) => ({
          item:     i.item,
          quantity: i.qty,
          rate:     i.rate,
          amount:   i.qty * i.rate,
        })),
      };

      if (note) await api.put(`/credit-note/${note._id}`, payload);
      else      await api.post(`/credit-note`, payload);

      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {note ? "Edit Credit Note" : "New Credit Note"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Row 1 — Customer / Date / CN Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label">Customer</label>
                <CustomerSelect
                  value={form.customer}
                  onChange={(v) => setForm({ ...form, customer: v })}
                />
              </div>
              <div>
                <label className="field-label">Date</label>
                <input
                  type="date"
                  className="input w-full"
                  value={form.creditNoteDate}
                  onChange={(e) => setForm({ ...form, creditNoteDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Credit Note #</label>
                <input
                  placeholder="CN-001"
                  className="input w-full"
                  value={form.creditNoteNumber}
                  onChange={(e) => setForm({ ...form, creditNoteNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2 — Status / Currency / Discount Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="field-label">Status</label>
                <div className="relative">
                  <select
                    style={{ color: "#111827" }}
                    className="input appearance-none pr-8 w-full"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {Object.entries(STATUS).map(([k, v]) => (
                      <option key={k} value={k} style={{ color: "#111827" }}>{v.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="field-label">Currency</label>
                <div className="relative">
                  <select
                    style={{ color: "#111827" }}
                    className="input appearance-none pr-8 w-full"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="INR" style={{ color: "#111827" }}>INR — Indian Rupee</option>
                    <option value="USD" style={{ color: "#111827" }}>USD — US Dollar</option>
                    <option value="EUR" style={{ color: "#111827" }}>EUR — Euro</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="field-label">Discount Type</label>
                <div className="relative">
                  <select
                    style={{ color: "#111827" }}
                    className="input appearance-none pr-8 w-full"
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  >
                    <option value="amount"  style={{ color: "#111827" }}>Amount (₹)</option>
                    <option value="percent" style={{ color: "#111827" }}>Percent (%)</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label mb-0">Line Items</label>
                <button
                  type="button"
                  onClick={() => setItems([...items, { item: "", qty: 1, rate: 0 }])}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add item
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-3 py-2 font-medium">Description</th>
                      <th className="text-center px-3 py-2 font-medium w-20">Qty</th>
                      <th className="text-center px-3 py-2 font-medium w-28">Rate (₹)</th>
                      <th className="text-right px-3 py-2 font-medium w-24">Amount</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((itm, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <input
                            className="input-bare w-full"
                            placeholder="Item description"
                            value={itm.item}
                            onChange={(e) => setItem(i, "item", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min="1"
                            className="input-bare w-full text-center"
                            value={itm.qty}
                            onChange={(e) => setItem(i, "qty", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min="0"
                            className="input-bare w-full text-center"
                            value={itm.rate}
                            onChange={(e) => setItem(i, "rate", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-700 font-medium">
                          {fmt(itm.qty * itm.rate)}
                        </td>
                        <td className="pr-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-end">
              <div>
                <label className="field-label">Subtotal</label>
                <div className="input bg-gray-50 text-gray-500 cursor-default">{fmt(subtotal)}</div>
              </div>
              <div>
                <label className="field-label">
                  Discount {form.discountType === "percent" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number" min="0"
                  className="input w-full"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Adjustment (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={form.adjustment}
                  onChange={(e) => setForm({ ...form, adjustment: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Total</label>
                <div className="input bg-blue-50 text-blue-700 font-semibold cursor-default">{fmt(total)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : note ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Badge ────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Main Page ────────────────────────────────────
export default function CreditNotes() {
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [search,    setSearch]    = useState("");

  const fetchNotes = () => {
    setLoading(true);
    api.get("/credit-note", { params: { search } })
      .then((res) => setNotes(res.data.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchNotes, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this credit note?")) return;
    await api.delete(`/credit-note/${id}`);
    fetchNotes();
  };

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (n) => { setEditing(n);   setShowModal(true); };

  return (
    <>
      <style>{`
        .input { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; outline: none; color: #111827; display: block; width: 100%; }
        .input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .input-bare { background: transparent; font-size: 0.875rem; outline: none; padding: 0.25rem 0.25rem; border-radius: 0.25rem; color: #111827; width: 100%; }
        .input-bare:focus { background: #f9fafb; }
        .field-label { display: block; font-size: 0.75rem; font-weight: 500; color: #6b7280; margin-bottom: 0.25rem; }
      `}</style>

      <div className="space-y-5">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Credit Notes</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {notes.length} {notes.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Credit Note
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            style={{ color: "#111827" }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            placeholder="Search by customer or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <FileX className="w-8 h-8" />
            <p className="text-sm">No credit notes found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {notes.map((n) => (
              <div
                key={n._id}
                className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {n.creditNoteNumber || n.reference || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {n.customer?.name || n.customer || "—"}
                    </p>
                  </div>
                  <StatusBadge status={n.status} />
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {fmtDate(n.creditNoteDate || n.date)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900 flex items-center gap-0.5">
                    <IndianRupee className="w-4 h-4" />
                    {Number(n.total || 0).toLocaleString("en-IN")}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(n)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreditNoteModal
          note={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchNotes(); }}
        />
      )}
    </>
  );
}