import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import {
  Plus, Pencil, Trash2, X, Loader2, Search, Package,
  Wrench, Tag, Percent, Hash, ToggleLeft,
  ToggleRight, FileText, FileSignature, AlertCircle
} from 'lucide-react';

// ── Currency helpers ──────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹',
  AED: 'د.إ', CAD: 'CA$', AUD: 'A$',
};
const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

function sym(currency) {
  return CURRENCY_SYMBOLS[currency] || currency || '$';
}

function formatPrice(amount, currency) {
  const s      = sym(currency);
  const numFmt = Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  // RTL currencies (AED) shown as "100 د.إ", others as "$100"
  return currency === 'AED' ? `${numFmt} ${s}` : `${s}${numFmt}`;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const typeColors = {
  product: 'bg-blue-100 text-blue-700',
  service: 'bg-purple-100 text-purple-700',
};

const emptyForm = {
  name: '', description: '', sku: '', type: 'service',
  unitPrice: '', currency: 'USD', taxRate: '', discountRate: '',
  category: '', unit: '', isActive: true,
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'bg-white' }) {
  return (
    <div className={`${color} border border-gray-100 rounded p-4`}>
      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Currency Select ───────────────────────────────────────────────────────────
function CurrencySelect({ value, onChange }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      {CURRENCIES.map(c => (
        <option key={c} value={c}>{c} {CURRENCY_SYMBOLS[c]}</option>
      ))}
    </select>
  );
}

// ── Price Input ───────────────────────────────────────────────────────────────
function PriceInput({ value, currency, onChange }) {
  const symbol = sym(currency);
  const isRtl  = currency === 'AED';

  return (
    <div className="relative">
      {!isRtl && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
          {symbol}
        </span>
      )}
      <input
        className={`input ${!isRtl ? 'pl-7' : 'pr-14'}`}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      />
      {isRtl && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none pointer-events-none">
          {symbol}
        </span>
      )}
    </div>
  );
}

// ── Item Modal ────────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(
    item
      ? {
          name:         item.name,
          description:  item.description  || '',
          sku:          item.sku          || '',
          type:         item.type         || 'service',
          unitPrice:    item.unitPrice     ?? '',
          currency:     item.currency      || 'USD',
          taxRate:      item.taxRate       ?? '',
          discountRate: item.discountRate  ?? '',
          category:     item.category     || '',
          unit:         item.unit         || '',
          isActive:     item.isActive      ?? true,
        }
      : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        unitPrice:    Number(form.unitPrice),
        taxRate:      Number(form.taxRate)      || 0,
        discountRate: Number(form.discountRate) || 0,
      };
      if (item) await api.put(`/items/${item._id}`, payload);
      else      await api.post('/items', payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save item');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-gray-800">{item ? 'Edit Item' : 'New Item'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Name + Type */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="service">Service</option>
                  <option value="product">Product</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            {/* SKU + Category + Unit */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">SKU / Code</label>
                <input className="input" placeholder="WD-001" value={form.sku} onChange={e => set('sku', e.target.value)} />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" placeholder="Consulting" value={form.category} onChange={e => set('category', e.target.value)} />
              </div>
              <div>
                <label className="label">Unit</label>
                <input className="input" placeholder="hour / piece" value={form.unit} onChange={e => set('unit', e.target.value)} />
              </div>
            </div>

            {/* Price + Currency — currency first so symbol updates reactively */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Currency</label>
                <CurrencySelect value={form.currency} onChange={v => set('currency', v)} />
              </div>
              <div className="col-span-2">
                <label className="label">Unit Price *</label>
                <PriceInput
                  value={form.unitPrice}
                  currency={form.currency}
                  onChange={v => set('unitPrice', v)}
                />
              </div>
            </div>

            {/* Tax + Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Default Tax Rate (%)</label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input className="input pl-7" type="number" min="0" max="100" step="0.1" placeholder="0"
                    value={form.taxRate} onChange={e => set('taxRate', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Default Discount (%)</label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input className="input pl-7" type="number" min="0" max="100" step="0.1" placeholder="0"
                    value={form.discountRate} onChange={e => set('discountRate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium text-gray-700">Active</p>
                <p className="text-xs text-gray-400">Inactive items won't appear in invoice/proposal pickers</p>
              </div>
              <button type="button" onClick={() => set('isActive', !form.isActive)}>
                {form.isActive
                  ? <ToggleRight className="w-8 h-8 text-primary-600" />
                  : <ToggleLeft  className="w-8 h-8 text-gray-300" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>
                : (item ? 'Save Changes' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Item Detail slide-over ────────────────────────────────────────────────────
function ItemDetail({ item, onClose, onEdit, onDelete, onToggle }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
            ← Back
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle(item)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors
                ${item.isActive
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  : 'bg-green-50 hover:bg-green-100 text-green-700'}`}
            >
              {item.isActive
                ? <ToggleLeft  className="w-3.5 h-3.5" />
                : <ToggleRight className="w-3.5 h-3.5" />}
              {item.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => onEdit(item)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(item._id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded flex items-center justify-center flex-shrink-0
              ${item.type === 'product' ? 'bg-blue-100' : 'bg-purple-100'}`}>
              {item.type === 'product'
                ? <Package className="w-5 h-5 text-blue-600" />
                : <Wrench  className="w-5 h-5 text-purple-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base">{item.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`badge capitalize ${typeColors[item.type]}`}>{item.type}</span>
                {item.isActive
                  ? <span className="badge bg-green-100 text-green-700">Active</span>
                  : <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                {item.sku && <span className="text-xs text-gray-400 font-mono">{item.sku}</span>}
              </div>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded p-3">{item.description}</p>
          )}

          {/* Pricing summary — shows correct symbol */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-100 rounded p-3 text-center">
              <p className="text-[10px] text-green-600 uppercase font-semibold">Price</p>
              <p className="text-lg font-bold text-green-700 mt-0.5 leading-tight">
                {formatPrice(item.unitPrice, item.currency)}
              </p>
              {item.unit && <p className="text-[10px] text-green-500">per {item.unit}</p>}
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded p-3 text-center">
              <p className="text-[10px] text-orange-600 uppercase font-semibold">Tax</p>
              <p className="text-lg font-bold text-orange-700 mt-0.5">{item.taxRate || 0}%</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded p-3 text-center">
              <p className="text-[10px] text-blue-600 uppercase font-semibold">Discount</p>
              <p className="text-lg font-bold text-blue-700 mt-0.5">{item.discountRate || 0}%</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Category', value: item.category,                        icon: Tag          },
              { label: 'Unit',     value: item.unit,                            icon: Hash         },
              { label: 'Currency', value: item.currency ? `${item.currency} ${sym(item.currency)}` : null, icon: Hash },
              { label: 'SKU',      value: item.sku,                             icon: Hash         },
            ].filter(f => f.value).map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3 h-3 text-gray-400" />
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                </div>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Usage */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 border border-gray-100 rounded bg-white">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Invoices</p>
                  <p className="text-sm font-bold text-gray-700">{item.usedInInvoices?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border border-gray-100 rounded bg-white">
                <FileSignature className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Proposals</p>
                  <p className="text-sm font-bold text-gray-700">{item.usedInProposals?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Items() {
  const [items,        setItems]        = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const searchTimer = useRef(null);

  const fetchItems = () => {
    setLoading(true);
    api.get('/items', {
      params: {
        search:   search       || undefined,
        type:     typeFilter   || undefined,
        isActive: activeFilter || undefined,
        page,
        limit: 18,
      }
    }).then(r => {
      setItems(r.data.data);
      setTotal(r.data.total);
      setTotalPages(r.data.pages);
    }).finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get('/items/stats').then(r => setStats(r.data)).catch(() => {});
  };

  useEffect(() => { fetchStats(); }, []);

  // Debounce search / filter changes
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchItems(); }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, typeFilter, activeFilter]);

  useEffect(() => { fetchItems(); }, [page]);

  const openNew  = ()     => { setEditing(null);  setShowModal(true); };
  const openEdit = (item) => { setEditing(item);  setSelected(null); setShowModal(true); };

  const handleSaved = () => { setShowModal(false); fetchItems(); fetchStats(); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item? It will be removed from the catalogue.')) return;
    await api.delete(`/items/${id}`);
    setSelected(null);
    fetchItems(); fetchStats();
  };

  const handleToggle = async (item) => {
    await api.patch(`/items/${item._id}/toggle`);
    fetchItems(); fetchStats();
    if (selected?._id === item._id) setSelected(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Items</h1>
          <p className="text-gray-400 text-xs mt-0.5">{total} items in catalogue</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Add Item</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Items" value={stats.total}              sub={`${stats.active} active`} />
          <StatCard label="Products"    value={stats.byType?.product || 0} color="bg-blue-50"   />
          <StatCard label="Services"    value={stats.byType?.service || 0} color="bg-purple-50" />
          <StatCard label="Inactive"    value={stats.inactive        || 0} color="bg-gray-50"   />
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Search name, SKU, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto text-sm py-1.5" value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="product">Product</option>
          <option value="service">Service</option>
        </select>
        <select className="input w-auto text-sm py-1.5" value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No items found</p>
          <p className="text-xs mt-1">Add your first product or service to the catalogue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(item => (
            <div
              key={item._id}
              onClick={() => setSelected(item)}
              className={`card p-4 cursor-pointer hover:shadow-md transition-all ${!item.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0
                    ${item.type === 'product' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {item.type === 'product'
                      ? <Package className="w-4 h-4 text-blue-600" />
                      : <Wrench  className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                    {item.sku && <p className="text-[10px] text-gray-400 font-mono">{item.sku}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span className={`badge capitalize text-[10px] ${typeColors[item.type]}`}>{item.type}</span>
                  {!item.isActive && <span className="badge bg-gray-100 text-gray-500 text-[10px]">Off</span>}
                </div>
              </div>

              {item.description && (
                <p className="text-xs text-gray-400 mb-2 line-clamp-1">{item.description}</p>
              )}

              <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                {/* Price with correct currency symbol */}
                <p className="text-green-600 font-bold text-sm">
                  {formatPrice(item.unitPrice, item.currency)}
                  {item.unit && <span className="text-[10px] text-gray-400 font-normal ml-0.5">/{item.unit}</span>}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {item.taxRate      > 0 && <span>Tax {item.taxRate}%</span>}
                  {item.discountRate > 0 && <span>Disc {item.discountRate}%</span>}
                </div>

                <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(item)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item._id)}
                    className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">{total} items · Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

      {selected && (
        <ItemDetail
          item={selected}
          onClose={() => setSelected(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}

      {showModal && (
        <ItemModal
          item={editing}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}