import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, FolderKanban, FileClock, Wallet, Plus } from "lucide-react";
import { getDashboardStats } from "../api/dashboard";
import { getErrorMessage } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import useCountUp from "../hooks/useCountUp";
import { formatCurrency, formatDate, timeAgo, MONTH_NAMES } from "../utils/format";

const cardVariants = {
  initial: { opacity: 0, y: 14 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AnimatedNumber({ value, formatter }) {
  const animated = useCountUp(value);
  return <>{formatter ? formatter(animated) : Math.round(animated)}</>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    getDashboardStats()
      .then((data) => mounted && setStats(data))
      .catch((err) => mounted && setError(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!stats) return null;

  const chartData = stats.monthly_revenue.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    revenue: m.total,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Dashboard</h1>
          <p>A snapshot of your business right now.</p>
        </div>
        <div className="flex gap-8">
          <Link to="/clients" className="btn btn-secondary">
            <Plus size={16} /> New client
          </Link>
          <Link to="/invoices" className="btn btn-primary">
            <Plus size={16} /> New invoice
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <motion.div className="stat-card" custom={0} variants={cardVariants} initial="initial" animate="animate">
          <div className="label">
            Total clients <Users size={16} />
          </div>
          <div className="value num">
            <AnimatedNumber value={stats.total_clients} />
          </div>
        </motion.div>
        <motion.div className="stat-card" custom={1} variants={cardVariants} initial="initial" animate="animate">
          <div className="label">
            Active projects <FolderKanban size={16} />
          </div>
          <div className="value num">
            <AnimatedNumber value={stats.active_projects} />
          </div>
        </motion.div>
        <motion.div className="stat-card" custom={2} variants={cardVariants} initial="initial" animate="animate">
          <div className="label">
            Pending invoices <FileClock size={16} />
          </div>
          <div className="value num warning">
            <AnimatedNumber value={stats.pending_invoices} />
          </div>
        </motion.div>
        <motion.div className="stat-card" custom={3} variants={cardVariants} initial="initial" animate="animate">
          <div className="label">
            Total revenue <Wallet size={16} />
          </div>
          <div className="value num accent">
            <AnimatedNumber value={stats.paid_amount} formatter={formatCurrency} />
          </div>
        </motion.div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Monthly revenue</h3>
            <span className="text-sm text-muted">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e5ee" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#4b4f5e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#4b4f5e" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#1f9d74" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent activity</h3>
          </div>
          {stats.recent_activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Actions you take will show up here." />
          ) : (
            <div className="flex flex-col gap-12">
              {stats.recent_activity.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span>{item.message}</span>
                  <span className="text-muted">{timeAgo(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 mt-16">
        <div className="card">
          <div className="card-header">
            <h3>Recent invoices</h3>
            <Link to="/invoices" className="text-sm">View all</Link>
          </div>
          {stats.recent_invoices.length === 0 ? (
            <EmptyState title="No invoices yet" description="Create your first invoice to see it here." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_invoices.map((inv) => (
                    <tr key={inv.id} className="row-link" onClick={() => (window.location.href = `/invoices/${inv.id}`)}>
                      <td data-label="Invoice" className="num">{inv.invoice_number}</td>
                      <td data-label="Client">{inv.client_name}</td>
                      <td data-label="Total" className="num">{formatCurrency(inv.total)}</td>
                      <td data-label="Status"><StatusBadge value={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Upcoming tasks</h3>
            <Link to="/tasks" className="text-sm">View all</Link>
          </div>
          {stats.upcoming_tasks.length === 0 ? (
            <EmptyState title="No upcoming tasks" description="You're all caught up." />
          ) : (
            <div className="flex flex-col gap-12">
              {stats.upcoming_tasks.map((task) => (
                <div key={task.id} className="flex justify-between items-center text-sm">
                  <div>
                    <div>{task.title}</div>
                    <div className="text-muted text-sm">{task.project_name}</div>
                  </div>
                  <span className="text-muted">{formatDate(task.due_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
