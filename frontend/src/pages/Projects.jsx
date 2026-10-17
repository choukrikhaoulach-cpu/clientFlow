import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { listProjects, createProject, updateProject, deleteProject } from "../api/projects";
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
import StatusBadge from "../components/StatusBadge";
import { TableSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatCurrency, formatDate } from "../utils/format";

const rowVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.24, delay: Math.min(i, 8) * 0.03, ease: "easeOut" } }),
};

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

const EMPTY_FORM = { name: "", client_id: "", description: "", status: "planning", deadline: "", budget: "" };

export default function Projects() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = usePagination(projects, 8);

  function load(status) {
    setLoading(true);
    listProjects(status ? { status } : {})
      .then(setProjects)
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
    setForm({ ...EMPTY_FORM, client_id: clients[0]?.id || "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(project, e) {
    e.stopPropagation();
    setEditing(project);
    setForm({
      name: project.name,
      client_id: project.client_id,
      description: project.description || "",
      status: project.status,
      deadline: project.deadline || "",
      budget: project.budget || "",
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.client_id) {
      setFieldErrors({ client_id: "Select a client." });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, client_id: Number(form.client_id), budget: Number(form.budget) || 0 };
      if (editing) {
        await updateProject(editing.id, payload);
        showToast("Project updated.");
      } else {
        await createProject(payload);
        showToast("Project created.");
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
      await deleteProject(deleteTarget.id);
      showToast("Project deleted.");
      setDeleteTarget(null);
      load(statusFilter);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Projects</div>
          <h1>All projects</h1>
          <p>Track progress across every engagement.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={clients.length === 0}>
          <Plus size={16} /> New project
        </Button>
      </div>

      {clients.length === 0 && !loading && (
        <div className="error-banner" style={{ background: "var(--color-info-light)", color: "var(--color-info)", borderColor: "#bcd7ea" }}>
          Add a client first before creating a project.
        </div>
      )}

      <div className="card">
        <div className="form-group" style={{ maxWidth: 220, marginBottom: 20 }}>
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]}
          />
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <TableSkeleton columns={7} rows={6} />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create a project to start tracking tasks and deadlines."
            actionLabel={clients.length ? "New project" : undefined}
            onAction={clients.length ? openCreate : undefined}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th><th>Budget</th><th>Deadline</th><th></th></tr>
                </thead>
                <tbody>
                  {pageItems.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      className="row-link"
                      custom={i}
                      variants={rowVariants}
                      initial="initial"
                      animate="animate"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td data-label="Project">{p.name}</td>
                      <td data-label="Client">{p.client_name}</td>
                      <td data-label="Status"><StatusBadge value={p.status} /></td>
                      <td data-label="Progress" className="num">{p.completed_task_count}/{p.task_count}</td>
                      <td data-label="Budget" className="num">{formatCurrency(p.budget)}</td>
                      <td data-label="Deadline">{formatDate(p.deadline)}</td>
                      <td data-label="Actions">
                        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-icon" onClick={(e) => openEdit(p, e)} aria-label="Edit">
                            <Pencil size={16} />
                          </button>
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
        <Modal title={editing ? "Edit project" : "New project"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <Input label="Project name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={fieldErrors.name} />
            <Select
              label="Client"
              required
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              options={clientOptions}
              error={fieldErrors.client_id}
            />
            <div className="form-row">
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
              <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <Input label="Budget (USD)" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>{editing ? "Save changes" : "Create project"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete "${deleteTarget.name}"? This will also remove its tasks.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
