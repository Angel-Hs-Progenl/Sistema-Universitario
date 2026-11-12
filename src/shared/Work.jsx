import { useState } from "react";
import { Alert, ErrorSummary, Empty } from "./ui";

export function Heading({ eyebrow, title, children, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {children && <p className="page-intro">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadState({ state, children, empty, action }) {
  if (state.loading)
    return (
      <p role="status" className="work-loading">
        Cargando información…
      </p>
    );
  if (state.error)
    return (
      <>
        <Alert>{state.error}</Alert>
        <button className="button button-secondary" onClick={state.refresh}>
          Volver a intentar
        </button>
      </>
    );
  if (empty && (!state.data || state.data.length === 0))
    return (
      <Empty title={empty} action={action}>
        Los registros aparecerán aquí cuando estén disponibles.
      </Empty>
    );
  return children;
}

export function useMutation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [notice, setNotice] = useState("");
  async function run(action, success = "Cambios guardados.") {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await action();
      setNotice(success);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    notice,
    run,
    clear: () => {
      setError(null);
      setNotice("");
    },
  };
}

export function MutationState({ state }) {
  return (
    <>
      <ErrorSummary error={state.error} />
      <Alert type="success">{state.notice}</Alert>
    </>
  );
}

export function Status({ value, children }) {
  const good = [
    "aprobada",
    "renovada",
    "validado",
    "publicado",
    "concluido",
    "enviada",
  ].includes(value);
  return (
    <span
      className={`badge ${good ? "badge-validado" : value === "rechazada" || value === "rechazado" ? "badge-rechazado" : "badge-pendiente"}`}
    >
      {children || value}
    </span>
  );
}

export const money = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(value),
  );
export const localDateInput = (days = 0) => {
  const value = new Date(Date.now() + days * 86400000);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
