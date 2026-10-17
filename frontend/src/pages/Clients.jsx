import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { listClients, createClient, updateClient, deleteClient } from "../api/clients";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import { TableSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

const rowVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.24, delay: Math.min(i, 8) * 0.03, ease: "easeOut" } }),
};

const EMPTY_FORM = { name: "", company: "", email: "", phone: "", address: "", notes: "" };

export default function Clients() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = usePagination(clients, 8);

  function load(searchTerm) {
    setLoading(true);
    listClients(searchTerm ? { search: searchTerm } : {})
      .then(setClients)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(client, e) {
    e.stopPropagation();
    setEditing(client);
    setForm({
      name: client.name || "",
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateClient(editing.id, form);
        showToast("Client updated.");
      } else {
        await createClient(form);
        showToast("Client added.");
      }
      setModalOpen(false);
      load(search);
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
      await deleteClient(deleteTarget.id);
      showToast("Client deleted.");
      setDeleteTarget(null);
      load(search);
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
          <div className="eyebrow">Clients</div>
          <h1>All clients</h1>
          <p>Manage the people and companies you work with.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> Add client
        </Button>
      </div>

      <div className="card">
        <div className="form-group" style={{ maxWidth: 320, marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: "var(--color-ink-soft)" }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : clients.length === 0 ? (
          <EmptyState
            title={search ? "No matching clients" : "No clients yet"}
            description={search ? "Try a different search term." : "Add your first client to get started."}
            actionLabel={!search ? "Add client" : undefined}
            onAction={!search ? openCreate : undefined}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((client, i) => (
                    <motion.tr
                      key={client.id}
                      className="row-link"
                      custom={i}
                      variants={rowVariants}
                      initial="initial"
                      animate="animate"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td data-label="Name">{client.name}</td>
                      <td data-label="Company">{client.company || "—"}</td>
                      <td data-label="Email">{client.email || "—"}</td>
                      <td data-label="Phone">{client.phone || "—"}</td>
                      <td data-label="Actions">
                        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-icon" onClick={(e) => openEdit(client, e)} aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(client);
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
        <Modal title={editing ? "Edit client" : "Add client"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={fieldErrors.name} />
            <div className="form-row">
              <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={fieldErrors.email} />
            </div>
            <div className="form-row">
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>{editing ? "Save changes" : "Add client"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete client"
          message={`Delete ${deleteTarget.name}? This will also remove their projects, invoices and notes.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
