import { useState } from "react";
import {
  FileText, BarChart2, CreditCard, FileCheck,
  Briefcase, DollarSign, Loader2,
} from "lucide-react";
import api from "../lib/api";

const EXPORT_TYPES = [
  { key: "invoices",     label: "Invoices",      Icon: FileText   },
  { key: "estimates",    label: "Estimates",     Icon: BarChart2  },
  { key: "payments",     label: "Payments",      Icon: CreditCard },
  { key: "credit-notes", label: "Credit notes",  Icon: FileCheck  },
  { key: "proposals",    label: "Proposals",     Icon: Briefcase  },
  { key: "expenses",     label: "Expenses",      Icon: DollarSign },
];

const TAGS = ["urgent", "q1", "q2", "q3", "q4", "approved", "pending", "archived"];

export default function BulkPdfExport() {
  const [selectedType, setSelectedType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleReset = () => {
    setSelectedType("");
    setFromDate("");
    setToDate("");
    setSelectedTags([]);
    setDescription("");
    setBanner(null);
  };

  // 🔥 MAIN FIXED FUNCTION
  const handleExport = async () => {
    if (!selectedType) {
      setBanner({ ok: false, msg: "Please select a type to export." });
      return;
    }

    setLoading(true);
    setBanner(null);

    try {
      const response = await api.post(
        "/bulk-pdf/export",
        {
          type: selectedType,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          tags: selectedTags.length ? selectedTags : undefined,
          description: description || undefined,
        },
        {
          responseType: "blob", // 🔥 CRITICAL FIX
        }
      );

      // ✅ Extract filename
      let filename = "export.pdf";
      const disposition = response.headers["content-disposition"];

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // ✅ Create download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setBanner({
        ok: true,
        msg: `✅ PDF downloaded: ${filename}`,
      });

    } catch (err) {
      setBanner({
        ok: false,
        msg:
          err?.response?.data?.message ||
          "Export failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Bulk PDF Export</h1>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 border rounded"
          >
            Reset
          </button>

          <button
            onClick={handleExport}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-3 rounded text-sm ${
            banner.ok
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {banner.msg}
        </div>
      )}

      {/* Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {EXPORT_TYPES.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={`p-3 border rounded flex items-center gap-2 ${
              selectedType === key
                ? "bg-green-100 border-green-500"
                : ""
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 border rounded-full text-sm ${
              selectedTags.includes(tag)
                ? "bg-blue-100 border-blue-500"
                : ""
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Description */}
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded w-full"
      />

    </div>
  );
}