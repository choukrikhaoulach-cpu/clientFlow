import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { listInvoices, createInvoice, updateInvoice, deleteInvoice } from "../api/invoices";
import { listClients } from "../api/clients";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import Select from "../components/Select";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import InvoiceFormModal from "../components/InvoiceFormModal";
import { TableSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatCurrency, formatDate } from "../utils/format";

const rowVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.24, delay: Math.min(i, 8) * 0.03, ease: "easeOut" } }),
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Invoices() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = usePagination(invoices, 8);

  function load(status) {
    setLoading(true);
    listInvoices(status ? { status } : {})
      .then(setInvoices)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    listClients().then(setClients).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openCreate() {
    setEditing(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(invoice, e) {
    e.stopPropagation();
    setEditing(invoice);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSave(payload) {
    setSaving(true);
    try {
      if (editing) {
        await updateInvoice(editing.id, payload);
        showToast("Invoice updated.");
      } else {
        await createInvoice(payload);
        showToast("Invoice created.");
      }
      setModalOpen(false);
      load(statusFilter);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget.id);
      showToast("Invoice deleted.");
      setDeleteTarget(null);
      load(statusFilter);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Invoices</div>
          <h1>All invoices</h1>
          <p>Create, send and track payment for your invoices.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={clients.length === 0}>
          <Plus size={16} /> New invoice
        </Button>
      </div>

      {clients.length === 0 && !loading && (
        <div className="error-banner" style={{ background: "var(--color-info-light)", color: "var(--color-info)", borderColor: "#bcd7ea" }}>
          Add a client first before creating an invoice.
        </div>
      )}

      <div className="card">
        <div className="form-group" style={{ maxWidth: 220, marginBottom: 20 }}>
          <Select label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]} />
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <TableSkeleton columns={7} rows={6} />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Create your first invoice to start getting paid."
            actionLabel={clients.length ? "New invoice" : undefined}
            onAction={clients.length ? openCreate : undefined}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th>Total</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {pageItems.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      className="row-link"
                      custom={i}
                      variants={rowVariants}
                      initial="initial"
                      animate="animate"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td data-label="Invoice" className="num">{inv.invoice_number}</td>
                      <td data-label="Client">{inv.client_name}</td>
                      <td data-label="Issued">{formatDate(inv.issue_date)}</td>
                      <td data-label="Due">{formatDate(inv.due_date)}</td>
                      <td data-label="Total" className="num">{formatCurrency(inv.total)}</td>
                      <td data-label="Status"><StatusBadge value={inv.status} /></td>
                      <td data-label="Actions">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(inv);
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
          </>
        )}
      </div>

      {modalOpen && (
        <InvoiceFormModal
          clients={clients}
          invoice={editing}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          saving={saving}
          fieldErrors={fieldErrors}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete invoice"
          message={`Delete invoice ${deleteTarget.invoice_number}? This will also remove its payment records.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
