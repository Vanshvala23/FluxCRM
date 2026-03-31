import { useEffect, useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../lib/api";

// ✅ Status columns for each module
const MODULES = {
  leads: ["new", "contacted", "won", "lost"],
  projects: ["todo", "in_progress", "review", "completed"],
  tickets: ["open", "in_progress", "resolved", "closed"],
};

export default function CRMKanban({ type = "leads" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = MODULES[type];

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/${type}`);
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;

    const id = active.id;
    const newStatus = over.id;

    const item = data.find((i) => i._id === id);
    if (!item || item.status === newStatus) return;

    // ✅ Optimistic UI
    setData((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, status: newStatus } : i
      )
    );

    try {
      await api.patch(`/${type}/${id}`, { status: newStatus });
    } catch {
      fetchData(); // rollback
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-2">
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const items = data.filter((i) => i.status === col);

            return (
              <SortableContext
                key={col}
                items={items.map((i) => i._id)}
                strategy={verticalListSortingStrategy}
              >
                <Column col={col} items={items} setData={setData} type={type} />
              </SortableContext>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

// 🔹 Column
function Column({ col, items, setData, type }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 min-h-[500px] border">
      <div className="flex justify-between mb-3">
        <h2 className="font-semibold capitalize">
          {col.replace("_", " ")}
        </h2>
        <span className="text-xs">{items.length}</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item._id} item={item} setData={setData} type={type} />
        ))}
      </div>

      <AddCard col={col} setData={setData} type={type} />
    </div>
  );
}

// 🔹 Card
function Card({ item, setData, type }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);

  const save = async () => {
    setEditing(false);

    setData((prev) =>
      prev.map((i) =>
        i._id === item._id ? { ...i, title } : i
      )
    );

    try {
      await api.patch(`/${type}/${item._id}`, { title });
    } catch {
      console.error("Update failed");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-xl shadow-sm border hover:shadow-md cursor-grab"
    >
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          autoFocus
          className="w-full text-sm border rounded px-2 py-1"
        />
      ) : (
        <h3
          onClick={() => setEditing(true)}
          className="text-sm font-medium cursor-pointer"
        >
          {item.title}
        </h3>
      )}

      <p className="text-xs text-gray-500 mt-1">
        ₹{item.value || 0}
      </p>

      <div className="flex justify-between mt-3 text-xs">
        <span className="text-indigo-600">
          {item.priority || "normal"}
        </span>
        <span className="text-gray-400">
          {item.owner || "Unassigned"}
        </span>
      </div>
    </div>
  );
}

// 🔹 Add Card
function AddCard({ col, setData, type }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const add = async () => {
    if (!title) return;

    try {
      const res = await api.post(`/${type}`, {
        title,
        status: col,
      });

      setData((prev) => [...prev, res.data]);
      setTitle("");
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return open ? (
    <div className="mt-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-2 py-1 text-sm rounded"
        placeholder="Enter title"
      />
      <button
        onClick={add}
        className="text-xs text-indigo-600 mt-2"
      >
        Add
      </button>
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="mt-3 text-sm text-gray-500 hover:text-indigo-600"
    >
      + Add
    </button>
  );
}