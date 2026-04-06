import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";

import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";

import {
  Users,
  TrendingUp,
  Ticket,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    contacts: 0,
    leads: 0,
    tickets: 0,
  });

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [contacts, leads, tickets, projects] = await Promise.all([
        api.get("/contacts"),
        api.get("/leads"),
        api.get("/tickets"),
        api.get("/projects"),
      ]);

      setStats({
        contacts: contacts.data.length,
        leads: leads.data.length,
        tickets: tickets.data.length,
      });

      setProjects(projects.data || []);
    };

    load();
  }, []);

  const statCards = [
    {
      label: "Total Customers",
      value: stats.contacts,
      change: "+40%",
      icon: Users,
      color: "success",
    },
    {
      label: "Members",
      value: stats.leads,
      change: "-10%",
      icon: TrendingUp,
      color: "danger",
    },
    {
      label: "Active Now",
      value: stats.tickets,
      change: "+20%",
      icon: Ticket,
      color: "success",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6 hidden md:block">
        <h1 className="text-xl font-bold mb-6">Untitled UI</h1>

        <nav className="space-y-3 text-sm">
          <p className="font-medium text-black">Dashboard</p>
          <p className="text-gray-500">Projects</p>
          <p className="text-gray-500">Tasks</p>
          <p className="text-gray-500">Users</p>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, {user?.name}
          </h2>
          <p className="text-gray-500">
            Here's what's happening today 🚀
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} shadow="sm">
              <CardBody>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <h2 className="text-2xl font-bold">{s.value}</h2>
                    <p className="text-sm mt-1 text-green-600">
                      {s.change} vs last month
                    </p>
                  </div>
                  <s.icon className="w-6 h-6 text-gray-400" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Projects Table */}
        <Card shadow="sm">
          <CardHeader>
            <h3 className="font-semibold">Projects</h3>
          </CardHeader>

          <CardBody>
            <Table aria-label="Projects Table">
              <TableHeader>
                <TableColumn>Name</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Users</TableColumn>
                <TableColumn>About</TableColumn>
              </TableHeader>

              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">
                      {p.name}
                    </TableCell>

                    <TableCell>
                      <Chip
                        color={
                          p.status === "completed"
                            ? "success"
                            : p.status === "active"
                            ? "primary"
                            : "warning"
                        }
                        size="sm"
                      >
                        {p.status}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      {p.users?.length || 0}
                    </TableCell>

                    <TableCell className="text-gray-500">
                      {p.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

      </main>
    </div>
  );
}