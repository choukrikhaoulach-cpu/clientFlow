import { motion } from "framer-motion";
import Button from "./Button";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        className="modal"
        style={{ maxWidth: 420 }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
