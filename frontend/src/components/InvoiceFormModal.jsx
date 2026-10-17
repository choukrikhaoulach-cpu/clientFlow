import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "./Modal";
import Input from "./Input";
import Select from "./Select";
import Textarea from "./Textarea";
import Button from "./Button";
import { formatCurrency } from "../utils/format";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

let itemKey = 0;
function blankItem() {
  return { key: ++itemKey, description: "", quantity: 1, unit_price: 0 };
}

export default function InvoiceFormModal({ clients, invoice, onSave, onClose, saving, fieldErrors }) {
  const [clientId, setClientId] = useState(invoice?.client_id || clients[0]?.id || "");
  const [status, setStatus] = useState(invoice?.status || "draft");
  const [issueDate, setIssueDate] = useState(invoice?.issue_date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(invoice?.due_date || "");
  const [taxRate, setTaxRate] = useState(invoice ? (invoice.subtotal ? Math.round((invoice.tax / invoice.subtotal) * 10000) / 100 : 0) : 0);
  const [notes, setNotes] = useState(invoice?.notes || "");
  const [items, setItems] = useState(
    invoice?.items?.length
      ? invoice.items.map((i) => ({ key: ++itemKey, description: i.description, quantity: i.quantity, unit_price: i.unit_price }))
      : [blankItem()]
  );

  function updateItem(key, field, value) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((current) => [...current, blankItem()]);
  }

  function removeItem(key) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.key !== key) : current));
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + tax;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      client_id: Number(clientId),
      status,
      issue_date: issueDate,
      due_date: dueDate || null,
      tax_rate: Number(taxRate) || 0,
      notes,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      })),
    });
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal title={invoice ? `Edit ${invoice.invoice_number}` : "New invoice"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <Select label="Client" required value={clientId} onChange={(e) => setClientId(e.target.value)} options={clientOptions} error={fieldErrors.client_id} />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        </div>
        <div className="form-row">
          <Input label="Issue date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <label>Line items</label>
        {fieldErrors.items && <div className="field-error mb-16">{fieldErrors.items}</div>}
        <div className="flex flex-col gap-8 mb-16">
          {items.map((item) => (
            <div key={item.key} className="flex gap-8" style={{ alignItems: "flex-start" }}>
              <input
                className="input"
                placeholder="Description"
                style={{ flex: 3 }}
                value={item.description}
                onChange={(e) => updateItem(item.key, "description", e.target.value)}
              />
              <input
                className="input num"
                type="number"
                min="0"
                step="0.01"
                placeholder="Qty"
                style={{ flex: 1 }}
                value={item.quantity}
                onChange={(e) => updateItem(item.key, "quantity", e.target.value)}
              />
              <input
                className="input num"
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price"
                style={{ flex: 1 }}
                value={item.unit_price}
                onChange={(e) => updateItem(item.key, "unit_price", e.target.value)}
              />
              <div className="input num" style={{ flex: 1, background: "var(--color-paper)", border: "none", display: "flex", alignItems: "center" }}>
                {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItem(item.key)} aria-label="Remove item">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          <Plus size={14} /> Add line item
        </Button>

        <div className="form-row mt-16">
          <Input label="Tax rate (%)" type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          <div />
        </div>

        <div className="invoice-totals" style={{ marginRight: 0, width: "100%", maxWidth: 280, marginLeft: "auto" }}>
          <div className="row"><span>Subtotal</span><span className="num">{formatCurrency(subtotal)}</span></div>
          <div className="row"><span>Tax</span><span className="num">{formatCurrency(tax)}</span></div>
          <div className="row total"><span>Total</span><span className="num">{formatCurrency(total)}</span></div>
        </div>

        <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>{invoice ? "Save changes" : "Create invoice"}</Button>
        </div>
      </form>
    </Modal>
  );
}
