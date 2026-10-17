import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { listPayments, createPayment, deletePayment } from "../api/payments";
import { listInvoices } from "../api/invoices";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import { TableSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatCurrency, formatDate, labelize } from "../utils/format";

const rowVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.24, delay: Math.min(i, 8) * 0.03, ease: "easeOut" } }),
};

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "cash", label: "Cash" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export default function Payments() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ invoice_id: "", amount: "", method: "bank_transfer", payment_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = usePagination(payments, 8);

  function load() {
    setLoading(true);
    listPayments()
      .then(setPayments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    listInvoices().then(setInvoices).catch(() => {});
  }, []);

  function openCreate() {
    setForm({ invoice_id: invoices[0]?.id || "", amount: "", method: "bank_transfer", payment_date: new Date().toISOString().slice(0, 10), notes: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.invoice_id) {
      setFieldErrors({ invoice_id: "Select an invoice." });
      return;
    }
    setSaving(true);
    try {
      await createPayment({ ...form, invoice_id: Number(form.invoice_id), amount: Number(form.amount) });
      showToast("Payment recorded.");
      setModalOpen(false);
      load();
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
      await deletePayment(deleteTarget.id);
      showToast("Payment deleted.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  const invoiceOptions = invoices.map((i) => ({ value: i.id, label: `${i.invoice_number} — ${i.client_name}` }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Payments</div>
          <h1>Payment history</h1>
          <p>Every payment recorded against your invoices.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={invoices.length === 0}>
          <Plus size={16} /> Record payment
        </Button>
      </div>

      {invoices.length === 0 && !loading && (
        <div className="error-banner" style={{ background: "var(--color-info-light)", color: "var(--color-info)", borderColor: "#bcd7ea" }}>
          Create an invoice first before recording a payment.
        </div>
      )}

      <div className="card">
        <ErrorMessage message={error} />
        {loading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments recorded" description="Payments you record will appear here." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Invoice</th><th>Method</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {pageItems.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      className="row-link"
                      custom={i}
                      variants={rowVariants}
                      initial="initial"
                      animate="animate"
                      onClick={() => navigate(`/invoices/${p.invoice_id}`)}
                    >
                      <td data-label="Date">{formatDate(p.payment_date)}</td>
                      <td data-label="Invoice" className="num">{p.invoice_number}</td>
                      <td data-label="Method">{labelize(p.method)}</td>
                      <td data-label="Amount" className="num">{formatCurrency(p.amount)}</td>
                      <td data-label="Actions">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(p);
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
        <Modal title="Record payment" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <Select label="Invoice" required value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} options={invoiceOptions} error={fieldErrors.invoice_id} />
            <Input label="Amount" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={fieldErrors.amount} />
            <div className="form-row">
              <Select label="Method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} options={PAYMENT_METHODS} />
              <Input label="Payment date" type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>Record payment</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="Delete payment" message={`Remove this ${formatCurrency(deleteTarget.amount)} payment?`} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
