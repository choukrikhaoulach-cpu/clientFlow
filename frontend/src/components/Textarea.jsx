export default function Textarea({ label, error, id, className = "", ...rest }) {
  const inputId = id || rest.name;
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <textarea id={inputId} className={`input ${error ? "error" : ""} ${className}`} {...rest} />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
