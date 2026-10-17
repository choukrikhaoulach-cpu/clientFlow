export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  ...rest
}) {
  const classes = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} disabled={disabled || loading} onClick={onClick} {...rest}>
      {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "currentColor" }} />}
      {children}
    </button>
  );
}
