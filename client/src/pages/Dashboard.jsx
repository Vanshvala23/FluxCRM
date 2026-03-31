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
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CHART_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444',
  '#3b82f6','#ec4899','#8b5cf6','#14b8a6',
];

function getGreeting(name) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name || 'User'} 👋`;
  if (hour < 17) return `Good afternoon, ${name || 'User'} 👋`;
  return `Good evening, ${name || 'User'} 👋`;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({});
  const [leadStats, setLeadStats] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]); // ✅ FIX
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(getGreeting(user?.name));

  // Greeting updater
  useEffect(() => {
    const i = setInterval(() => {
      setGreeting(getGreeting(user?.name?.split(' ')[0]));
    }, 60000);
    return () => clearInterval(i);
  }, [user]);

  // Load data
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/contacts'),
          api.get('/leads'),
          api.get('/tickets'),
          api.get('/leads/stats'),
          api.get('/projects'),
        ]);

        if (!mounted) return;

        const [contacts, leads, tickets, lStats, projects] =
          results.map(r => r.status === 'fulfilled' ? r.value : { data: [] });

        const leadsList = leads.data || [];
        const projectList = projects.data || [];
        const ticketList = tickets.data || [];

        // ✅ recent tickets
        setRecentTickets(ticketList.slice(0, 5));

        // revenue
        const revenue = leadsList
          .filter(l => l.status === 'won')
          .reduce((s, l) => s + (l.value || 0), 0);

        // project stats
        const statusCounts = {};
        projectList.forEach(p => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });

        const projectChart = Object.entries(statusCounts).map(([k, v]) => ({
          _id: k,
          count: v,
        }));

        setStats({
          contacts: contacts.data?.length || 0,
          leads: leadsList.length,
          tickets: ticketList.length,
          revenue,
          projects: projectList.length,
        });

        setLeadStats(lStats.data || []);
        setProjectStats(projectChart);

      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  const pieData = useMemo(
    () => (leadStats || []).map((s, i) => ({
      name: s._id,
      value: s.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })),
    [leadStats]
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">{greeting}</h1>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contacts', value: stats.contacts, icon: Users },
          { label: 'Leads', value: stats.leads, icon: TrendingUp },
          { label: 'Tickets', value: stats.tickets, icon: Ticket, link:'/tickets' },
          { label: 'Revenue', value: `₹${(stats.revenue||0).toLocaleString()}`, icon: IndianRupee },
        ].map(({ label, value, icon: Icon, link }) => {
          const card = (
            <div className="bg-white p-4 rounded-xl border hover:shadow">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold">{loading ? '—' : value}</p>
              <Icon className="w-5 h-5 mt-2 text-indigo-500" />
            </div>
          );

          return link ? <Link to={link} key={label}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border">
          <h2 className="mb-3 font-semibold">Lead Stats</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={leadStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl border">
          <h2 className="mb-3 font-semibold">Lead Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* CALENDAR */}
        <div className="bg-white p-4 rounded-xl border xl:col-span-2">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 400 }}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* RECENT TICKETS */}
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex justify-between mb-2">
              <h2 className="font-semibold">Recent Tickets</h2>
              <Link to="/tickets" className="text-indigo-600 text-sm">
                View →
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <p className="text-gray-400 text-sm">No tickets</p>
            ) : (
              recentTickets.map(t => (
                <div key={t._id} className="flex justify-between text-sm py-1">
                  <span>{t.title}</span>
                  <span className="text-gray-400">{t.status}</span>
                </div>
              ))
            )}
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white p-4 rounded-xl border">
            <h2 className="font-semibold mb-3">Quick Actions</h2>

            {[
              { label: 'Contacts', to: '/contacts', icon: Users },
              { label: 'Leads', to: '/leads', icon: TrendingUp },
              { label: 'Tickets', to: '/tickets', icon: Ticket },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="flex gap-2 py-2 hover:text-indigo-600">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}