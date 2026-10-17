import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { getClient } from "../api/clients";
import { getErrorMessage } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getClient(id)
      .then(setClient)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!client) return null;

  return (
    <div>
      <button className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => navigate("/clients")}>
        <ArrowLeft size={16} /> Back to clients
      </button>

      <div className="page-header">
        <div>
          <div className="eyebrow">Client</div>
          <h1>{client.name}</h1>
          {client.company && <p>{client.company}</p>}
        </div>
      </div>

      <div className="grid-2 mb-16">
        <div className="card">
          <div className="card-header">
            <h3>Contact information</h3>
          </div>
          <div className="flex flex-col gap-12 text-sm">
            {client.company && (
              <div className="flex items-center gap-8"><Building2 size={16} className="text-muted" /> {client.company}</div>
            )}
            {client.email && (
              <div className="flex items-center gap-8"><Mail size={16} className="text-muted" /> {client.email}</div>
            )}
            {client.phone && (
              <div className="flex items-center gap-8"><Phone size={16} className="text-muted" /> {client.phone}</div>
            )}
            {client.address && (
              <div className="flex items-center gap-8"><MapPin size={16} className="text-muted" /> {client.address}</div>
            )}
            {client.notes && (
              <div className="mt-8">
                <div className="text-muted text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>Notes</div>
                <p>{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="stat-card">
            <div className="label">Total revenue collected</div>
            <div className="value num accent">{formatCurrency(client.total_revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="label">Projects &amp; invoices</div>
            <div className="value num">{client.projects.length} / {client.invoices.length}</div>
          </div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="card-header">
          <h3>Projects</h3>
          <Link to="/projects" className="text-sm">Manage projects</Link>
        </div>
        {client.projects.length === 0 ? (
          <EmptyState title="No projects yet" description="Create a project for this client from the Projects page." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Status</th><th>Budget</th><th>Deadline</th></tr>
              </thead>
              <tbody>
                {client.projects.map((p) => (
                  <tr key={p.id} className="row-link" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td data-label="Name">{p.name}</td>
                    <td data-label="Status"><StatusBadge value={p.status} /></td>
                    <td data-label="Budget" className="num">{formatCurrency(p.budget)}</td>
                    <td data-label="Deadline">{formatDate(p.deadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-16">
        <div className="card-header">
          <h3>Invoices</h3>
          <Link to="/invoices" className="text-sm">Manage invoices</Link>
        </div>
        {client.invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Create an invoice for this client from the Invoices page." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Invoice</th><th>Status</th><th>Total</th><th>Due</th></tr>
              </thead>
              <tbody>
                {client.invoices.map((inv) => (
                  <tr key={inv.id} className="row-link" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td data-label="Invoice" className="num">{inv.invoice_number}</td>
                    <td data-label="Status"><StatusBadge value={inv.status} /></td>
                    <td data-label="Total" className="num">{formatCurrency(inv.total)}</td>
                    <td data-label="Due">{formatDate(inv.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Notes</h3>
          <Link to="/notes" className="text-sm">Manage notes</Link>
        </div>
        {client.notes_list.length === 0 ? (
          <EmptyState title="No notes yet" description="Notes attached to this client will appear here." />
        ) : (
          <div className="flex flex-col gap-12">
            {client.notes_list.map((note) => (
              <div key={note.id} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>{note.title}</div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
