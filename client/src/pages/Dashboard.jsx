import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

import {
  Users,
  TrendingUp,
  Ticket,
  IndianRupee,
  ArrowUpRight,
  FileText,
  FolderKanban,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

import KanbanBoard from '@acrool/react-kanban';
import '@acrool/react-kanban/dist/index.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

function getGreeting(name) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({});
  const [leadStats, setLeadStats] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [kanbanBoard, setKanbanBoard] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Load Data
  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/contacts'),
          api.get('/leads'),
          api.get('/tickets'),
          api.get('/leads/stats'),
          api.get('/proposals'),
          api.get('/proposals/stats'),
          api.get('/activities'),
          api.get('/projects'),
        ]);

        const [
          contacts,
          leads,
          tickets,
          lStats,
          proposals,
          pStats,
          activities,
          projects,
        ] = results.map((r) =>
          r.status === 'fulfilled' ? r.value : { data: [] }
        );

        const leadList = leads.data || [];
        const wonLeads = leadList.filter((l) => l.status === 'won');

        const revenue = wonLeads.reduce(
          (sum, l) => sum + (l.value || 0),
          0
        );

        const projectList = Array.isArray(projects.data)
          ? projects.data
          : projects.data?.data || [];

        setProjectsList(projectList);

        setStats({
          contacts: contacts.data?.length || 0,
          leads: leadList.length,
          tickets: tickets.data?.length || 0,
          revenue,
          proposals: proposals.data?.length || 0,
          proposalRevenue: pStats.data?.revenueWon || 0,
          projects: projectList.length,
          activeProjects: projectList.filter(p => p.status === 'active').length,
          completedProjects: projectList.filter(p => p.status === 'completed').length,
          overdueProjects: projectList.filter(p =>
            p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'completed'
          ).length,
        });

        setLeadStats(lStats.data || []);

        const ev = (activities.data || []).map((a) => ({
          id: a._id || Math.random(),
          title: a.title || 'Activity',
          start: new Date(a.date || Date.now()),
          end: new Date(a.date || Date.now()),
        }));

        setEvents(ev);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 🧠 Status Mapping
  const mapStatus = (status, dueDate) => {
    if (status === 'completed') return 'completed';
    if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
    if (status === 'active') return 'active';
    return 'todo';
  };

  // 📊 Build Kanban Board
  const board = useMemo(() => {
    const columns = {
      todo: { id: 'todo', title: 'To Do', cards: [] },
      active: { id: 'active', title: 'In Progress', cards: [] },
      completed: { id: 'completed', title: 'Completed', cards: [] },
      overdue: { id: 'overdue', title: 'Overdue', cards: [] },
    };

    projectsList.forEach((p) => {
      const status = mapStatus(p.status, p.dueDate);

      columns[status].cards.push({
        id: p._id,
        title: p.title,
        description: p.description || '',
        dueDate: p.dueDate,
      });
    });

    return { columns: Object.values(columns) };
  }, [projectsList]);

  useEffect(() => {
    setKanbanBoard(board);
  }, [board]);

  // 🔥 Drag Handler
  const handleCardMove = async (card, source, destination) => {
    if (!destination) return;

    try {
      await api.put(`/projects/${card.id}`, {
        status: destination.toColumnId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 📅 Calendar
  const handleSelectSlot = ({ start, end }) => {
    const title = window.prompt('Enter event title');
    if (!title) return;
    setEvents((prev) => [...prev, { id: Date.now(), title, start, end }]);
  };

  const handleSelectEvent = (event) => {
    if (window.confirm(`Delete event "${event.title}"?`)) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    }
  };

  // 📊 Pie Data
  const pieData = useMemo(() => {
    return (leadStats || []).map((s, i) => ({
      name: s._id,
      value: s.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [leadStats]);

  return (
    <div className="space-y-8 px-4 lg:px-6">

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">
        {getGreeting(user?.name?.split(' ')[0] || 'User')} 👋
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contacts', value: stats.contacts, icon: Users },
          { label: 'Leads', value: stats.leads, icon: TrendingUp },
          { label: 'Tickets', value: stats.tickets, icon: Ticket },
          { label: 'Revenue', value: `₹${stats.revenue}`, icon: IndianRupee },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition">
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">{label}</p>
              <Icon size={18} />
            </div>
            <h2 className="text-xl font-bold mt-2">
              {loading ? '—' : value}
            </h2>
          </div>
        ))}
      </div>

      {/* Alert */}
      {stats.overdueProjects > 0 && (
        <div className="bg-red-50 p-4 rounded-xl flex gap-2">
          <AlertCircle className="text-red-600" />
          <p>{stats.overdueProjects} overdue projects</p>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow h-64">
          <ResponsiveContainer>
            <BarChart data={leadStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {leadStats.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🚀 Kanban */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h2 className="font-semibold mb-4">Project Board</h2>

        {kanbanBoard && (
          <KanbanBoard
            initialBoard={kanbanBoard}
            onCardDragEnd={handleCardMove}
            renderCard={(card) => {
              const isOverdue =
                card.dueDate && new Date(card.dueDate) < new Date();

              return (
                <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md">
                  <p className="font-semibold text-sm">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {card.description}
                  </p>

                  {card.dueDate && (
                    <p className={`text-xs mt-2 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                      Due: {new Date(card.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white p-4 rounded-xl shadow h-[420px]">
        <Calendar
          selectable
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>

    </div>
  );
}