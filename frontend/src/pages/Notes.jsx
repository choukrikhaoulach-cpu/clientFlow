import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { listNotes, createNote, updateNote, deleteNote } from "../api/notes";
import { listClients } from "../api/clients";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Select from "../components/Select";
import Button from "../components/Button";
import { CardGridSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatDate } from "../utils/format";

const cardVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.26, delay: Math.min(i, 8) * 0.04, ease: "easeOut" },
  }),
};

const EMPTY_FORM = { title: "", content: "", client_id: "" };

export default function Notes() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
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

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = usePagination(notes, 9);

  function load(searchTerm) {
    setLoading(true);
    listNotes(searchTerm ? { search: searchTerm } : {})
      .then(setNotes)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    listClients().then(setClients).catch(() => {});
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

  function openEdit(note) {
    setEditing(note);
    setForm({ title: note.title, content: note.content || "", client_id: note.client_id || "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, client_id: form.client_id ? Number(form.client_id) : null };
      if (editing) {
        await updateNote(editing.id, payload);
        showToast("Note updated.");
      } else {
        await createNote(payload);
        showToast("Note created.");
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
      await deleteNote(deleteTarget.id);
      showToast("Note deleted.");
      setDeleteTarget(null);
      load(search);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  const clientOptions = [{ value: "", label: "No client" }, ...clients.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Notes</div>
          <h1>All notes</h1>
          <p>Keep track of important details and reminders.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> New note
        </Button>
      </div>

      <div className="form-group" style={{ maxWidth: 320, marginBottom: 20 }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: "var(--color-ink-soft)" }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <CardGridSkeleton cards={6} />
      ) : notes.length === 0 ? (
        <div className="card">
          <EmptyState
            title={search ? "No matching notes" : "No notes yet"}
            description={search ? "Try a different search term." : "Add a note to keep track of anything important."}
            actionLabel={!search ? "New note" : undefined}
            onAction={!search ? openCreate : undefined}
          />
        </div>
      ) : (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {pageItems.map((note, i) => (
              <motion.div
                key={note.id}
                className="card hover-lift"
                custom={i}
                variants={cardVariants}
                initial="initial"
                animate="animate"
              >
                <div className="card-header">
                  <h3 style={{ fontSize: "0.95rem" }}>{note.title}</h3>
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(note)} aria-label="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(note)} aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-sm">{note.content}</p>
                <div className="flex justify-between items-center mt-16 text-sm text-muted">
                  <span>{note.client_name || "No client"}</span>
                  <span>{formatDate(note.updated_at)}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      {modalOpen && (
        <Modal title={editing ? "Edit note" : "New note"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={fieldErrors.title} />
            <Select label="Related client (optional)" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} options={clientOptions} />
            <Textarea label="Content" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>{editing ? "Save changes" : "Add note"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="Delete note" message={`Delete "${deleteTarget.title}"?`} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
