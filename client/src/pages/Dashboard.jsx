// 🔥 FULL FIXED DASHBOARD WITH PERFEX-STYLE KANBAN INTEGRATION

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import CRMKanban from '../components/CRMKanban';

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

const CHART_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
];

function getGreeting(name) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name} 👋`;
  if (hour < 17) return `Good afternoon, ${name} 👋`;
  return `Good evening, ${name} 👋`;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState({ contacts: 0, leads: 0, tickets: 0, revenue: 0 });
  const [leadStats, setLeadStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [contacts, leads, tickets, lStats] = await Promise.all([
        api.get('/contacts'),
        api.get('/leads'),
        api.get('/tickets'),
        api.get('/leads/stats'),
      ]);

      const leadsList = leads.data || [];
      const revenue = leadsList
        .filter((l) => l.status === 'won')
        .reduce((sum, l) => sum + (l.value || 0), 0);

      setStats({
        contacts: contacts.data.length,
        leads: leadsList.length,
        tickets: tickets.data.length,
        revenue,
      });

      setLeadStats(lStats.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pieData = useMemo(
    () =>
      leadStats.map((s, i) => ({
        name: s._id,
        value: s.count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [leadStats]
  );

  return (
    <div className="space-y-6 p-4">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting(user?.name?.split(' ')[0] || 'User')}
        </h1>
      </div>

      {/* TOGGLE */}
      <div className="flex gap-2">
        {['dashboard', 'leads', 'projects', 'tickets'].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-2 rounded-xl text-sm ${
              view === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {view === 'dashboard' && (
        <>
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Contacts', value: stats.contacts, icon: Users },
              { label: 'Leads', value: stats.leads, icon: TrendingUp },
              { label: 'Tickets', value: stats.tickets, icon: Ticket },
              { label: 'Revenue', value: `₹${stats.revenue}`, icon: IndianRupee },
            ].map((s) => (
              <div key={s.label} className="bg-white p-4 rounded-xl border">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold">{loading ? '-' : s.value}</p>
              </div>
            ))}
          </div>

          {/* CHART */}
          <div className="bg-white p-4 rounded-xl border">
            <h2 className="font-semibold mb-4">Leads Overview</h2>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
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
          </div>

          {/* PIE */}
          <div className="bg-white p-4 rounded-xl border">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={80}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* KANBAN VIEWS */}
      {view === 'leads' && <CRMKanban type="leads" />}
      {view === 'projects' && <CRMKanban type="projects" />}
      {view === 'tickets' && <CRMKanban type="tickets" />}

    </div>
  );
}
