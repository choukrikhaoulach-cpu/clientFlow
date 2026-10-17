export default function Select({ label, error, id, options = [], className = "", ...rest }) {
  const inputId = id || rest.name;
  return (
    <div className="form-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <select id={inputId} className={`input ${error ? "error" : ""} ${className}`} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
