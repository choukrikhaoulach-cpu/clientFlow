import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, CheckSquare } from "lucide-react";
import { getProject } from "../api/projects";
import { createTask, updateTask, deleteTask } from "../api/tasks";
import { getErrorMessage, getFieldErrors } from "../api/client";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Select from "../components/Select";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const EMPTY_TASK = { title: "", description: "", status: "todo", priority: "medium", due_date: "" };

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    getProject(id)
      .then(setProject)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openCreate() {
    setEditingTask(null);
    setForm(EMPTY_TASK);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setForm({
      title: task.title,
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
    setSaving(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, form);
        showToast("Task updated.");
      } else {
        await createTask({ ...form, project_id: Number(id) });
        showToast("Task created.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(task) {
    try {
      await updateTask(task.id, { status: task.status === "completed" ? "todo" : "completed" });
      load();
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
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!project) return null;

  const progress = project.tasks.length
    ? Math.round((project.tasks.filter((t) => t.status === "completed").length / project.tasks.length) * 100)
    : 0;

  return (
    <div>
      <button className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => navigate("/projects")}>
        <ArrowLeft size={16} /> Back to projects
      </button>

      <div className="page-header">
        <div>
          <div className="eyebrow">Project</div>
          <h1>{project.name}</h1>
          <p>
            For <Link to={`/clients/${project.client_id}`}>{project.client_name}</Link>
          </p>
        </div>
        <StatusBadge value={project.status} />
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card">
          <div className="label">Budget</div>
          <div className="value num">{formatCurrency(project.budget)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Deadline</div>
          <div className="value" style={{ fontSize: "1.1rem" }}>{formatDate(project.deadline)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Task progress</div>
          <div className="value num accent">{progress}%</div>
        </div>
      </div>

      {project.description && (
        <div className="card mb-16">
          <div className="card-header"><h3>Description</h3></div>
          <p>{project.description}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Tasks</h3>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={14} /> Add task
          </Button>
        </div>

        {project.tasks.length === 0 ? (
          <EmptyState title="No tasks yet" description="Break this project down into tasks." actionLabel="Add task" onAction={openCreate} />
        ) : (
          <div className="flex flex-col gap-12">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}
              >
                <div className="flex items-center gap-12">
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => toggleComplete(task)}
                    aria-label="Toggle complete"
                    style={{ color: task.status === "completed" ? "var(--color-accent)" : "var(--color-ink-soft)" }}
                  >
                    <CheckSquare size={18} />
                  </button>
                  <div>
                    <div style={{ textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.title}</div>
                    <div className="text-muted text-sm flex gap-8">
                      <StatusBadge value={task.priority} />
                      {task.due_date && <span>Due {formatDate(task.due_date)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-8">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(task)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingTask ? "Edit task" : "Add task"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={fieldErrors.title} />
            <div className="form-row">
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={TASK_STATUS_OPTIONS} />
              <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITY_OPTIONS} />
            </div>
            <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={saving}>{editingTask ? "Save changes" : "Add task"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete "${deleteTarget.title}"?`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
