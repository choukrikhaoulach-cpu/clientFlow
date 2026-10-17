import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, CheckSquare, Pencil, Trash2 } from "lucide-react";
import { listTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import { listProjects } from "../api/projects";
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
import { ListSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatDate } from "../utils/format";

const rowVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.24, delay: Math.min(i, 8) * 0.03, ease: "easeOut" } }),
};

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const EMPTY_FORM = { title: "", project_id: "", description: "", status: "todo", priority: "medium", due_date: "" };

export default function Tasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = usePagination(tasks, 8);

  function load(params) {
    setLoading(true);
    listTasks(params)
      .then(setTasks)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  const filterParams = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    return params;
  };

  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(filterParams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, project_id: projects[0]?.id || "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title,
      project_id: task.project_id,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || "",
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.project_id) {
      setFieldErrors({ project_id: "Select a project." });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, project_id: Number(form.project_id) };
      if (editing) {
        await updateTask(editing.id, payload);
        showToast("Task updated.");
      } else {
        await createTask(payload);
        showToast("Task created.");
      }
      setModalOpen(false);
      load(filterParams());
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(task, e) {
    e.stopPropagation();
    try {
      await updateTask(task.id, { status: task.status === "completed" ? "todo" : "completed" });
      load(filterParams());
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      showToast("Task deleted.");
      setDeleteTarget(null);
      load(filterParams());
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Tasks</div>
          <h1>All tasks</h1>
          <p>Everything on your plate, across every project.</p>
        </div>
        <Button variant="primary" onClick={openCreate} disabled={projects.length === 0}>
          <Plus size={16} /> New task
        </Button>
      </div>

      {projects.length === 0 && !loading && (
        <div className="error-banner" style={{ background: "var(--color-info-light)", color: "var(--color-info)", borderColor: "#bcd7ea" }}>
          Create a project first before adding tasks.
        </div>
      )}

      <div className="card">
        <div className="form-row" style={{ maxWidth: 460, marginBottom: 20 }}>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]} />
          <Select label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} options={[{ value: "", label: "All priorities" }, ...PRIORITY_OPTIONS]} />
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <ListSkeleton rows={5} />
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks found" description="Adjust your filters or add a new task." />
        ) : (
          <>
            <div className="flex flex-col gap-12">
              {pageItems.map((task, i) => (
                <motion.div
                  key={task.id}
                  custom={i}
                  variants={rowVariants}
                  initial="initial"
                  animate="animate"
                  className="flex items-center justify-between"
                  style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}
                >
                  <div className="flex items-center gap-12">
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={(e) => toggleComplete(task, e)}
                      style={{ color: task.status === "completed" ? "var(--color-accent)" : "var(--color-ink-soft)" }}
                    >
                      <CheckSquare size={18} />
                    </button>
                    <div>
                      <div style={{ textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.title}</div>
                      <div className="text-muted text-sm flex gap-8 items-center">
                        <span>{task.project_name}</span>
                        <StatusBadge value={task.priority} />
                        {task.due_date && <span>Due {formatDate(task.due_date)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(task)} aria-label="Edit"><Pencil size={16} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setDeleteTarget(task)} aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </motion.div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
          </>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit task" : "New task"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={fieldErrors.title} />
            <Select label="Project" required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} options={projectOptions} error={fieldErrors.project_id} />
            <div className="form-row">
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
              <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITY_OPTIONS} />
            </div>
            <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>{editing ? "Save changes" : "Add task"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="Delete task" message={`Delete "${deleteTarget.title}"?`} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
