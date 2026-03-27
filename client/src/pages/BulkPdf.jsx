import { useState } from "react";
import {
  FileText, BarChart2, CreditCard, FileCheck,
  Briefcase, DollarSign, Loader2,
} from "lucide-react";
import api from "../lib/api";

const EXPORT_TYPES = [
  { key: "invoices",     label: "Invoices",      Icon: FileText   },
  { key: "estimates",    label: "Estimates",      Icon: BarChart2  },
  { key: "payments",     label: "Payments",       Icon: CreditCard },
  { key: "credit-notes", label: "Credit notes",   Icon: FileCheck  },
  { key: "proposals",    label: "Proposals",      Icon: Briefcase  },
  { key: "expenses",     label: "Expenses",       Icon: DollarSign },
];

const TAGS = ["urgent", "q1", "q2", "q3", "q4", "approved", "pending", "archived"];

export default function BulkPdfExport() {
  const [selectedType, setSelectedType] = useState("");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [description,  setDescription]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [banner,       setBanner]       = useState(null);

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleReset = () => {
    setSelectedType(""); setFromDate(""); setToDate("");
    setSelectedTags([]); setDescription(""); setBanner(null);
  };

  const handleExport = async () => {
    if (!selectedType) {
      setBanner({ ok: false, msg: "Please select a type to export." });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      const { data } = await api.post("/bulk-pdf/export", {
        type:        selectedType,
        fromDate:    fromDate    || undefined,
        toDate:      toDate      || undefined,
        tags:        selectedTags.length ? selectedTags : undefined,
        description: description || undefined,
      });
      setBanner({
        ok:  true,
        msg: `Exported ${data.recordCount ?? "?"} records as "${data.originalName}"`,
      });
    } catch (err) {
      setBanner({
        ok:  false,
        msg: err?.response?.data?.message || "Export failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .bpe-type-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #fff; color: #374151;
          font-size: 0.8125rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s; width: 100%; text-align: left;
        }
        .bpe-type-btn:hover { background: #f9fafb; }
        .bpe-type-btn.active {
          border: 1.5px solid #16a34a;
          background: #f0fdf4; color: #16a34a;
        }
        .bpe-tag {
          padding: 4px 12px; border-radius: 9999px;
          border: 1px solid #e5e7eb; background: #fff;
          color: #6b7280; font-size: 0.75rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .bpe-tag:hover { background: #f9fafb; }
        .bpe-tag.active {
          border: 1.5px solid #3b82f6;
          background: #eff6ff; color: #2563eb;
        }
        .bpe-section {
          background: #fff; border: 1px solid #e5e7eb;
          border-radius: 1rem; padding: 1.25rem;
        }
        .bpe-section-title {
          font-size: 0.6875rem; font-weight: 500; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;
        }
        .field-label { display: block; font-size: 0.75rem; font-weight: 500; color: #6b7280; margin-bottom: 0.25rem; }
        .input { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; outline: none; color: #111827; display: block; width: 100%; box-sizing: border-box; }
        .input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
      `}</style>

      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bulk PDF export</h1>
            <p className="text-sm text-gray-400 mt-0.5">Generate and store merged PDFs from your records</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? "Generating…" : "Export & save PDF"}
            </button>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div className={`text-sm px-4 py-3 rounded-xl border ${
            banner.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {banner.msg}
          </div>
        )}

        {/* Select Type */}
        <div className="bpe-section">
          <div className="bpe-section-title">Select type</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXPORT_TYPES.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`bpe-type-btn ${selectedType === key ? "active" : ""}`}
                onClick={() => setSelectedType(key)}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
                {selectedType === key && (
                  <span className="ml-auto">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 8l3.5 3.5L13 4.5"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="bpe-section">
          <div className="bpe-section-title">Date range</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">From date</label>
              <input
                type="date" className="input"
                value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">To date</label>
              <input
                type="date" className="input"
                value={toDate} onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bpe-section">
          <div className="bpe-section-title">Include tags</div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                className={`bpe-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {selectedTags.includes(tag) ? "✓ " : ""}{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bpe-section">
          <div className="bpe-section-title">Description</div>
          <input
            type="text" className="input"
            placeholder="e.g. Q1 Invoices batch"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

      </div>
    </>
  );
}