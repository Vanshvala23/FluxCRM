import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import {
  Users,
  TrendingUp,
  Ticket,
  IndianRupee,
  FolderKanban,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    contacts: 0,
    leads: 0,
    tickets: 0,
    revenue: 0,
  });

  const [projects, setProjects] = useState([]);
  const [leadStats, setLeadStats] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [contacts, leads, tickets, projects, leadStats] =
          await Promise.all([
            api.get('/contacts'),
            api.get('/leads'),
            api.get('/tickets'),
            api.get('/projects'),
            api.get('/leads/stats'),
          ]);

        const leadsList = leads.data || [];
        const revenue = leadsList
          .filter((l) => l.status === 'won')
          .reduce((s, l) => s + (l.value || 0), 0);

        setStats({
          contacts: contacts.data.length,
          leads: leadsList.length,
          tickets: tickets.data.length,
          revenue,
        });

        setProjects(projects.data || []);
        setLeadStats(leadStats.data || []);
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, []);

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.contacts,
      change: '+40%',
      color: 'text-green-600',
      icon: Users,
    },
    {
      label: 'Members',
      value: stats.leads,
      change: '-10%',
      color: 'text-red-500',
      icon: TrendingUp,
    },
    {
      label: 'Active Now',
      value: stats.tickets,
      change: '+20%',
      color: 'text-green-600',
      icon: Ticket,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-5 hidden md:block">
        <h2 className="font-bold text-lg mb-6">Untitled UI</h2>

        <nav className="space-y-3 text-sm">
          <Link className="block font-medium text-gray-700">Dashboard</Link>
          <Link className="block text-gray-500">Projects</Link>
          <Link className="block text-gray-500">Tasks</Link>
          <Link className="block text-gray-500">Users</Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-500">Here’s your dashboard overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="bg-white p-5 rounded-xl shadow-sm border"
            >
              <p className="text-sm text-gray-500">{c.label}</p>
              <h2 className="text-2xl font-bold mt-1">{c.value}</h2>
              <p className={`text-sm mt-1 ${c.color}`}>
                {c.change} vs last month
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white p-5 rounded-xl border">
          <h2 className="font-semibold mb-4">Lead Performance</h2>

          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={leadStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex justify-between">
            <h2 className="font-semibold">Projects</h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th>Status</th>
                <th>Users</th>
                <th>About</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((p) => (
                <tr key={p._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                      {p.status}
                    </span>
                  </td>
                  <td>{p.users?.length || 0}</td>
                  <td className="text-gray-500">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}