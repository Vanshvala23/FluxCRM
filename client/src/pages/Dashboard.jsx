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

import {
  KanbanComponent,
  ColumnsDirective,
  ColumnDirective,
} from '@syncfusion/ej2-react-kanban';

import '@syncfusion/ej2-react-kanban/styles/material.css';

const CHART_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
];

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
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load Data
  useEffect(() => {
    const load = async () => {
      try {
        const [
          contacts,
          leads,
          tickets,
          leadStats,
          proposals,
          proposalStats,
          projectsRes,
        ] = await Promise.all([
          api.get('/contacts'),
          api.get('/leads'),
          api.get('/tickets'),
          api.get('/leads/stats'),
          api.get('/proposals'),
          api.get('/proposals/stats'),
          api.get('/projects'),
        ]);

        const leadList = leads.data || [];
        const wonLeads = leadList.filter((l) => l.status === 'won');

        const revenue = wonLeads.reduce(
          (sum, l) => sum + (l.value || 0),
          0
        );

        const projectList = projectsRes.data || [];

        setProjects(projectList);

        setStats({
          contacts: contacts.data?.length || 0,
          leads: leadList.length,
          tickets: tickets.data?.length || 0,
          revenue,
          proposals: proposals.data?.length || 0,
          proposalRevenue: proposalStats.data?.revenueWon || 0,
          projects: projectList.length,
          activeProjects: projectList.filter(p => p.status === 'active').length,
          completedProjects: projectList.filter(p => p.status === 'completed').length,
          overdueProjects: projectList.filter(p =>
            p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'completed'
          ).length,
        });

        setLeadStats(leadStats.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ Map Status
  const mapStatus = (status, dueDate) => {
    if (status === 'completed') return 'completed';
    if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
    if (status === 'active') return 'active';
    return 'todo';
  };

  // ✅ Kanban Data
  const kanbanData = useMemo(() => {
    return projects.map((p) => ({
      Id: p._id,
      Title: p.title,
      Status: mapStatus(p.status, p.dueDate),
      Summary: p.description || '',
    }));
  }, [projects]);

  // ✅ Pie Data
  const pieData = useMemo(() => {
    return leadStats.map((s, i) => ({
      name: s._id,
      value: s.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [leadStats]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <h1 className="text-2xl font-bold">
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
          <div key={label} className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between">
              <p>{label}</p>
              <Icon size={18} />
            </div>
            <h2 className="text-xl font-bold mt-2">
              {loading ? '—' : value}
            </h2>
          </div>
        ))}
      </div>

      {/* ⚠️ Overdue Alert */}
      {stats.overdueProjects > 0 && (
        <div className="bg-red-50 p-4 rounded-xl flex gap-2">
          <AlertCircle className="text-red-600" />
          <p>
            {stats.overdueProjects} overdue projects
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Bar */}
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

        {/* Pie */}
        <div className="bg-white p-4 rounded-xl shadow h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name">
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

      {/* 🚀 KANBAN BOARD */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="font-semibold mb-4">Project Board</h2>

        <KanbanComponent
          keyField="Status"
          dataSource={kanbanData}
          allowDragAndDrop={true}
          cardSettings={{
            contentField: 'Summary',
            headerField: 'Title',
          }}
          dragStop={async (args) => {
            const updated = args.data[0];

            try {
              await api.put(`/projects/${updated.Id}`, {
                status: updated.Status,
              });
            } catch (err) {
              console.error(err);
            }
          }}
        >
          <ColumnsDirective>
            <ColumnDirective headerText="To Do" keyField="todo" />
            <ColumnDirective headerText="In Progress" keyField="active" />
            <ColumnDirective headerText="Completed" keyField="completed" />
            <ColumnDirective headerText="Overdue" keyField="overdue" />
          </ColumnsDirective>
        </KanbanComponent>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="mb-3 font-semibold">Quick Actions</h2>

        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Contacts', to: '/contacts' },
            { label: 'Leads', to: '/leads' },
            { label: 'Tickets', to: '/tickets' },
            { label: 'Projects', to: '/projects' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-indigo-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}