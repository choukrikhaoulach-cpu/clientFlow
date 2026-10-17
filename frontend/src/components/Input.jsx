export default function Input({ label, error, hint, id, className = "", ...rest }) {
  const inputId = id || rest.name;
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={`input ${error ? "error" : ""} ${className}`} {...rest} />
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
