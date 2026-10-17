import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Pencil, Plus, Trash2 } from "lucide-react";
import { getInvoice, updateInvoice } from "../api/invoices";
import { listClients } from "../api/clients";
import { createPayment, deletePayment } from "../api/payments";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";
import InvoiceFormModal from "../components/InvoiceFormModal";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import { formatCurrency, formatDate, labelize } from "../utils/format";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "bank_transfer", payment_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);

  function load() {
    setLoading(true);
    getInvoice(id)
      .then(setInvoice)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    listClients().then(setClients).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleEditSave(payload) {
    setEditSaving(true);
    try {
      await updateInvoice(id, payload);
      showToast("Invoice updated.");
      setEditOpen(false);
      load();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setEditSaving(false);
    }
  }

  function openPaymentModal() {
    const remaining = Math.max((invoice.total - invoice.paid_amount).toFixed(2), 0);
    setPaymentForm({ amount: remaining || invoice.total, method: "bank_transfer", payment_date: new Date().toISOString().slice(0, 10), notes: "" });
    setPaymentErrors({});
    setPaymentOpen(true);
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    setPaymentSaving(true);
    try {
      await createPayment({ invoice_id: Number(id), ...paymentForm, amount: Number(paymentForm.amount) });
      showToast("Payment recorded.");
      setPaymentOpen(false);
      load();
    } catch (err) {
      setPaymentErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function handleDeletePayment() {
    try {
      await deletePayment(deletePaymentTarget.id);
      showToast("Payment removed.");
      setDeletePaymentTarget(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!invoice) return null;

  const balanceDue = Math.max(invoice.total - invoice.paid_amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center no-print" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => navigate("/invoices")}>
          <ArrowLeft size={16} /> Back to invoices
        </button>
        <div className="flex gap-8">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} /> Edit
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save as PDF
          </Button>
          <Button variant="primary" onClick={openPaymentModal}>
            <Plus size={16} /> Record payment
          </Button>
        </div>
      </div>

      <div className="invoice-doc">
        <div className="invoice-doc-header">
          <div>
            <div className="invoice-doc-title">{invoice.invoice_number}</div>
            <div style={{ marginTop: 6 }}><StatusBadge value={invoice.status} /></div>
          </div>
          <div className="invoice-doc-meta">
            <div><strong>Issued:</strong> {formatDate(invoice.issue_date)}</div>
            <div><strong>Due:</strong> {formatDate(invoice.due_date)}</div>
          </div>
        </div>

        <div className="invoice-parties">
          <div>
            <div className="label">Billed to</div>
            <div style={{ fontWeight: 600 }}>{invoice.client_name}</div>
            {invoice.client_company && <div>{invoice.client_company}</div>}
            {invoice.client_email && <div>{invoice.client_email}</div>}
            {invoice.client_address && <div>{invoice.client_address}</div>}
          </div>
          <div>
            <div className="label">Balance due</div>
            <div className="num" style={{ fontSize: "1.4rem", fontWeight: 700, color: balanceDue > 0 ? "var(--color-danger)" : "var(--color-accent)" }}>
              {formatCurrency(balanceDue)}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Description">{item.description}</td>
                  <td data-label="Qty" className="num">{item.quantity}</td>
                  <td data-label="Unit price" className="num">{formatCurrency(item.unit_price)}</td>
                  <td data-label="Total" className="num">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-totals">
          <div className="row"><span>Subtotal</span><span className="num">{formatCurrency(invoice.subtotal)}</span></div>
          <div className="row"><span>Tax</span><span className="num">{formatCurrency(invoice.tax)}</span></div>
          <div className="row total"><span>Total</span><span className="num">{formatCurrency(invoice.total)}</span></div>
        </div>

        {invoice.notes && (
          <div className="mt-16">
            <div className="label" style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-ink-soft)", fontWeight: 600 }}>Notes</div>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="card mt-16 no-print">
        <div className="card-header"><h3>Payment history</h3></div>
        {invoice.payments.length === 0 ? (
          <p className="text-muted">No payments recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Method</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Date">{formatDate(p.payment_date)}</td>
                    <td data-label="Method">{labelize(p.method)}</td>
                    <td data-label="Amount" className="num">{formatCurrency(p.amount)}</td>
                    <td data-label="Actions">
                      <button className="btn btn-ghost btn-icon" onClick={() => setDeletePaymentTarget(p)} aria-label="Delete payment">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editOpen && (
        <InvoiceFormModal
          clients={clients}
          invoice={invoice}
          onSave={handleEditSave}
          onClose={() => setEditOpen(false)}
          saving={editSaving}
          fieldErrors={fieldErrors}
        />
      )}

      {paymentOpen && (
        <Modal title="Record payment" onClose={() => setPaymentOpen(false)}>
          <form onSubmit={handleRecordPayment}>
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              error={paymentErrors.amount}
            />
            <div className="form-row">
              <Select label="Method" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} options={PAYMENT_METHODS} />
              <Input label="Payment date" type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <Input label="Notes (optional)" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={paymentSaving}>Record payment</Button>
            </div>
          </form>
        </Modal>
      )}

      {deletePaymentTarget && (
        <ConfirmDialog
          title="Remove payment"
          message={`Remove this ${formatCurrency(deletePaymentTarget.amount)} payment?`}
          onConfirm={handleDeletePayment}
          onCancel={() => setDeletePaymentTarget(null)}
        />
      )}
    </div>
  );
}
