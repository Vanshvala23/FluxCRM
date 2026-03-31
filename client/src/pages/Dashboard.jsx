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
  Clock,
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
  LineChart,
  Line,
} from 'recharts';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CHART_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
];

function getGreeting(name) {
  const hour = new Date().getHours();
  let greeting = 'Hello';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  return `${greeting}, ${name || 'User'} 👋`;
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-bold text-gray-900">
          {payload[0]?.value ?? 0}
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-2">
        <p className="text-xs text-gray-500 font-medium capitalize">
          {payload[0]?.name}
        </p>
        <p
          className="text-lg font-bold"
          style={{ color: payload[0]?.payload?.fill }}
        >
          {payload[0]?.value ?? 0}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    contacts: 0,
    leads: 0,
    tickets: 0,
    revenue: 0,
    proposals: 0,
    proposalRevenue: 0,
    projects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
  });

  const [leadStats, setLeadStats] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [greeting, setGreeting] = useState(getGreeting(user?.name));

  // ✅ Greeting updater
  useEffect(() => {
    const updateGreeting = () =>
      setGreeting(getGreeting(user?.name?.split(' ')[0]));
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ✅ Safe dashboard loader
  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
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
          api.get('/projects/stats'),
        ]);

        if (!mounted) return;

        const [
          contacts,
          leads,
          tickets,
          lStats,
          proposals,
          pStats,
          activities,
          projects,
          prStats,
        ] = results.map((r) =>
          r.status === 'fulfilled' ? r.value : { data: [] }
        );

        const leadsList = leads.data || [];
        const wonLeads = leadsList.filter((l) => l.status === 'won');

        const revenue = wonLeads.reduce(
          (sum, l) => sum + (l?.value || 0),
          0
        );

        const proposalList = Array.isArray(proposals.data)
          ? proposals.data
          : proposals.data?.data || [];

        const projectList = Array.isArray(projects.data)
          ? projects.data
          : projects.data?.data || [];

        const projectsData = prStats.data || {};
        
        // Calculate project statistics
        const activeProjects = projectList.filter(p => p.status === 'active').length;
        const completedProjects = projectList.filter(p => p.status === 'completed').length;
        const overdueProjects = projectList.filter(p => 
          p.dueDate && new Date(p.dueDate) < new Date() && !['completed', 'cancelled'].includes(p.status)
        ).length;

        // Build project status distribution for chart
        const statusCounts = {};
        projectList.forEach(p => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        
        const projectChartData = Object.entries(statusCounts).map(([status, count]) => ({
          _id: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          count: count,
        }));

        setStats({
          contacts: contacts.data?.length || 0,
          leads: leadsList.length,
          tickets: tickets.data?.length || 0,
          revenue,
          proposals: proposalList.length,
          proposalRevenue: pStats.data?.revenueWon || 0,
          projects: projectList.length,
          activeProjects: activeProjects,
          completedProjects: completedProjects,
          overdueProjects: overdueProjects,
        });

        setLeadStats(lStats.data || []);
        setProjectStats(projectChartData);

        const ev = (activities.data || []).map((a) => ({
          id: a._id || Math.random(),
          title: a.title || 'Activity',
          start: new Date(a.date || Date.now()),
          end: new Date(a.date || Date.now()),
        }));

        setEvents(ev);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ calendar handlers
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

  const statCards = [
    {
      label: 'Total Contacts',
      value: stats.contacts,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      change: '+12%',
    },
    {
      label: 'Active Leads',
      value: stats.leads,
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600',
      change: '+8%',
    },
    {
      label: 'Open Tickets',
      value: stats.tickets,
      icon: Ticket,
      color: 'bg-amber-50 text-amber-600',
      change: '-3%',
      link:'/tickets',
    },
    {
      label: 'Revenue Won',
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-green-50 text-green-600',
      change: '+24%',
    },
    {
      label: 'Total Proposals',
      value: stats.proposals,
      icon: FileText,
      color: 'bg-sky-50 text-sky-600',
      change: '+10%',
    },
    {
      label: 'Proposal Revenue',
      value: `₹${stats.proposalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-teal-50 text-teal-600',
      change: '+15%',
    },
    {
      label: 'Total Projects',
      value: stats.projects,
      icon: FolderKanban,
      color: 'bg-indigo-50 text-indigo-600',
      change: '+6%',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
      change: '+4%',
    },
  ];

  const pieData = useMemo(
    () =>
      (leadStats || []).map((s, i) => ({
        name: s._id,
        value: s.count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [leadStats]
  );

  const projectPieData = useMemo(
    () =>
      (projectStats || []).map((s, i) => ({
        name: s._id,
        value: s.count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [projectStats]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
        <p className="text-gray-500 mt-1">
          Your business snapshot for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, change }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1 truncate">
                  {loading ? '—' : value}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">
                {change}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Project Status Alert - Show if there are overdue projects */}
      {stats.overdueProjects > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Projects at Risk</h3>
              <p className="text-sm text-red-700 mt-1">
                {stats.overdueProjects} project{stats.overdueProjects !== 1 ? 's' : ''} {stats.overdueProjects !== 1 ? 'are' : 'is'} overdue. 
                <Link to="/projects" className="font-semibold underline ml-1">View projects →</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Performance Bar chart */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Lead Performance
            </h2>
            <Link
              to="/leads"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          <div className="h-64">
            {leadStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadStats || []} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count">
                    {(leadStats || []).map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No lead data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Lead Distribution Pie chart */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            Lead Distribution
          </h2>

          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Bar chart */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Project Status Overview
            </h2>
            <Link
              to="/projects"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          <div className="h-64">
            {projectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStats} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count">
                    {(projectStats || []).map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No project data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Distribution Pie chart */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            Project Distribution
          </h2>

          <div className="h-64">
            {projectPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {projectPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 xl:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">
            Activity Calendar
          </h2>
          <div className="h-[420px]">
            <Calendar
              selectable
              popup
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              style={{ height: '100%' }}
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
  <div className="flex justify-between mb-3">
    <h2 className="font-semibold">Recent Tickets</h2>
    <Link to="/tickets" className="text-indigo-600 text-sm">
      View all →
    </Link>
  </div>

  {recentTickets.length === 0 ? (
    <p className="text-gray-400 text-sm">No tickets</p>
  ) : (
    <div className="space-y-2">
      {recentTickets.map(t => (
        <div key={t._id} className="flex justify-between text-sm">
          <span>{t.title}</span>
          <span className="text-gray-400">{t.status}</span>
        </div>
      ))}
    </div>
  )}
</div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>

          <div className="space-y-3">
            {[
              { label: 'Add Contact', to: '/contacts', icon: Users },
              { label: 'New Lead', to: '/leads', icon: TrendingUp },
              { label: 'Create Ticket', to: '/tickets', icon: Ticket },
              { label: 'New Proposal', to: '/proposals', icon: FileText },
              { label: 'New Project', to: '/projects', icon: FolderKanban },
            ].map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 border border-gray-200 transition-all"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}