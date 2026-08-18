export function FormField({ label, children, hint }) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
      {hint && <span className="form-field__hint">{hint}</span>}
    </label>
  )
}

export function FormRow({ children }) {
  return <div className="form-row">{children}</div>
}
