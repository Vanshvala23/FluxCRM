import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import {
  Plus, Pencil, Trash2, X, Loader2, Search,
  FileText, IndianRupee, Calendar
} from "lucide-react";

// ── Status ─────────────────────────────────────
const statusColors = {
  draft: "bg-gray-100 text-gray-600",
  issued: "bg-blue-100 text-blue-700",
  applied: "bg-green-100 text-green-700",
};

// ── Modal ──────────────────────────────────────
function CreditNoteModal({ note, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer: note?.customer || "",
    date: note?.date || "",
    reference: note?.reference || "",
    discount: note?.discount || 0,
    adjustment: note?.adjustment || 0,
  });

  const [items, setItems] = useState(note?.items || []);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce(
    (sum, i) => sum + i.qty * i.rate,
    0
  );

  const total =
    subtotal - Number(form.discount) + Number(form.adjustment);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { ...form, items, subtotal, total };

      if (note)
        await api.put(`/credit-note/${note._id}`, payload);
      else
        await api.post(`/credit-note`, payload);

      onSaved();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: "", qty: 1, rate: 0 }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded shadow-lg p-5">
        <h2 className="font-semibold mb-4">
          {note ? "Edit Credit Note" : "New Credit Note"}
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Customer"
              className="input"
              value={form.customer}
              onChange={(e) =>
                setForm({ ...form, customer: e.target.value })
              }
            />
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />
            <input
              placeholder="Reference"
              className="input"
              value={form.reference}
              onChange={(e) =>
                setForm({ ...form, reference: e.target.value })
              }
            />
          </div>

          {/* ITEMS */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Items</h3>

            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                <input
                  className="input"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i].description = e.target.value;
                    setItems(updated);
                  }}
                />
                <input
                  type="number"
                  className="input"
                  value={item.qty}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i].qty = Number(e.target.value);
                    setItems(updated);
                  }}
                />
                <input
                  type="number"
                  className="input"
                  value={item.rate}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i].rate = Number(e.target.value);
                    setItems(updated);
                  }}
                />
                <div className="flex items-center">
                  ₹ {item.qty * item.rate}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 text-sm"
            >
              + Add Item
            </button>
          </div>

          {/* TOTAL */}
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Discount"
              className="input"
              value={form.discount}
              onChange={(e) =>
                setForm({ ...form, discount: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Adjustment"
              className="input"
              value={form.adjustment}
              onChange={(e) =>
                setForm({ ...form, adjustment: e.target.value })
              }
            />
            <div className="font-bold flex items-center">
              ₹ {total}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button className="btn-primary">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────
export default function CreditNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const fetchNotes = () => {
    setLoading(true);
    api.get("/credit-note", { params: { search } })
      .then((res) => setNotes(res.data.data || res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotes();
  }, [search]);

  const handleDelete = async (id) => {
    if (!confirm("Delete credit note?")) return;
    await api.delete(`/credit-note/${id}`);
    fetchNotes();
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="page-title">Credit Notes</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus /> New Credit Note
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-8"
          placeholder="Search..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : notes.length === 0 ? (
        <p>No entries found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {notes.map((n) => (
            <div key={n._id} className="card p-4">
              <div className="flex justify-between">
                <h3>{n.reference}</h3>
                <span className={`badge ${statusColors[n.status]}`}>
                  {n.status}
                </span>
              </div>

              <p className="text-sm text-gray-500">{n.customer}</p>

              <div className="flex justify-between mt-3">
                <span className="flex items-center gap-1">
                  <IndianRupee /> {n.total}
                </span>

                <div className="flex gap-1">
                  <button onClick={() => {
                    setEditing(n);
                    setShowModal(true);
                  }}>
                    <Pencil size={16} />
                  </button>

                  <button onClick={() => handleDelete(n._id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <CreditNoteModal
          note={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchNotes();
          }}
        />
      )}
    </div>
  );
}