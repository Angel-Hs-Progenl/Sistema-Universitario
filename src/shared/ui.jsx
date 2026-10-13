import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  X,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  FileText,
  Clock3,
  CircleHelp,
} from "lucide-react";
import { STATES } from "../../shared/titulacion";
export { ArrowRight, GraduationCap, ShieldCheck, FileText, Clock3, CircleHelp };
export function Badge({ status }) {
  const labels = {
    ...STATES,
    validado: "Validado",
    recibido: "Recibido",
    rechazado: "Requiere corrección",
    pendiente: "Pendiente",
  };
  return (
    <span className={`badge badge-${status}`}>
      {["validado", "validada", "concluido", "disponible"].includes(status) && (
        <Check size={12} />
      )}{" "}
      {labels[status] || status}
    </span>
  );
}
export function Alert({ children, type = "error" }) {
  return children ? (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`alert ${type}`}
    >
      <AlertCircle size={18} />
      <div>{children}</div>
    </div>
  ) : null;
}
export function Field({ label, hint, error, ...props }) {
  const id = props.name || props.id;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {props.required && <span className="required"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          [hint && `${id}-hint`, error && `${id}-error`]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...props}
      />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
export function ErrorSummary({ error }) {
  const ref = useRef(null);
  useEffect(() => {
    if (error) ref.current?.focus();
  }, [error]);
  if (!error) return null;
  return (
    <div className="error-summary" ref={ref} tabIndex={-1} role="alert">
      <h2>No se pudo completar la operación</h2>
      {error.fields?.length ? (
        <ul>
          {error.fields.map((e) => (
            <li key={e.field}>
              <a href={`#${e.field}`}>{e.message}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p>{error.message || error}</p>
      )}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const dialog = useRef(null),
    previous = useRef(document.activeElement);
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => {
      el.close();
      previous.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FileText size={30} />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function BusyButton({
  busy,
  children,
  busyText = "Guardando…",
  ...props
}) {
  return (
    <button {...props} disabled={busy || props.disabled}>
      {busy ? busyText : children}
    </button>
  );
}
export function useAsync(load, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function refresh() {
    setError("");
    setLoading(true);
    try {
      setData(await load());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, deps);
  return { data, setData, error, setError, loading, refresh };
}
