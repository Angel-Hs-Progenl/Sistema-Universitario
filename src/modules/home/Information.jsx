import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowUpRight,
  CircleHelp,
  Mail,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { DOCUMENTS } from "../../../shared/titulacion";
import { api, date } from "../../shared/api";
import { Alert, Empty, BusyButton, useAsync } from "../../shared/ui";
import { useAuth } from "../../app/Auth";
export function Help() {
  return (
    <div className="container information-page">
      <span className="eyebrow">CENTRO DE AYUDA</span>
      <h1>Requisitos y ayuda para titulación</h1>
      <p className="page-intro">
        Lo que necesitas saber para preparar tu solicitud de titulación.
      </p>
      <div className="information-grid">
        <section className="panel form-panel">
          <h2>Antes de empezar</h2>
          <p>
            Ten a la mano tu matrícula, CURP, carrera, generación y datos de
            contacto. Comprueba que tus datos coincidan con los documentos.
          </p>
          <h3>Documentos de tu expediente</h3>
          <ul className="requirements-list">
            {DOCUMENTS.map((d) => (
              <li key={d.id}>
                <FileText size={16} />
                {d.name}
                {!d.required && <span>Opcional</span>}
              </li>
            ))}
          </ul>
          <p className="muted">
            Se aceptan PDF y JPG de hasta 5 MB. Esta lista inicial debe ser
            ratificada por Servicios Escolares; las fotografías son opcionales
            en esta versión.
          </p>
          <Link to="/titulacion" className="button button-primary">
            Ir a titulación <ArrowUpRight size={16} />
          </Link>
        </section>
        <section>
          <h2>Preguntas frecuentes</h2>
          {[
            [
              "¿Puedo continuar después?",
              "Sí. Pulsa Guardar datos o Guardar documento para conservar cada cambio. Al regresar con tu misma cuenta podrás continuar con el borrador. Seleccionar un archivo o escribir en un campo no lo guarda.",
            ],
            [
              "¿Quién revisa mis documentos?",
              "Servicios Escolares revisa el expediente académico; Tesorería valida el comprobante de pago y Vinculación libera estadías y seguimiento de egresados.",
            ],
            [
              "¿Qué hago si un documento requiere corrección?",
              "Consulta la observación. Cuando la solicitud se devuelva para corrección, reemplaza el archivo correspondiente y vuelve a enviar tu expediente.",
            ],
            [
              "¿Esta plataforma emite mi título oficial?",
              "La plataforma organiza y da seguimiento a tu trámite. La emisión del título electrónico, su firma y registro ante SEP requieren los procesos y personas autorizadas de la institución.",
            ],
            [
              "¿Cuánto cuesta y cuánto tarda?",
              "Los importes, plazos y modalidades deberán ser confirmados por la UT de Oriental. Esta versión no establece tarifas ni fechas de entrega.",
            ],
            [
              "¿Cómo obtengo una cuenta?",
              "La institución debe habilitar tu acceso. Consulta a Servicios Escolares mediante los canales publicados en el sitio institucional.",
            ],
          ].map(([q, a]) => (
            <details className="faq" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <div className="help-contact">
            <CircleHelp size={23} />
            <h3>¿Necesitas atención personal?</h3>
            <p>Consulta los canales oficiales de la UT de Oriental.</p>
            <a
              className="text-link"
              href="https://utdeoriental.edu.mx/"
              target="_blank"
              rel="noreferrer"
            >
              Sitio institucional <ArrowUpRight size={15} />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
export function Privacy() {
  return (
    <article className="container narrow-page">
      <span className="eyebrow">TRATAMIENTO DE INFORMACIÓN</span>
      <h1>Privacidad de tu expediente</h1>
      <Alert type="info">
        Entorno de desarrollo. Antes del uso con datos reales, la universidad
        debe aprobar y publicar su aviso de privacidad integral.
      </Alert>
      <h2>Información que utiliza el servicio</h2>
      <p>
        Datos de identificación, contacto y trayectoria académica; documentos de
        titulación; dictámenes, observaciones e historial de cambios.
      </p>
      <h2>Acceso por área</h2>
      <p>
        El estudiante consulta su propio expediente. Servicios Escolares y
        Administración revisan el trámite. Tesorería accede al comprobante de
        pago; Vinculación consulta los datos necesarios para registrar su
        liberación.
      </p>
      <h2>Pendiente de aprobación institucional</h2>
      <p>
        Responsable del tratamiento, fundamento, periodos de conservación,
        transferencias, derechos ARCO y canal de atención. Esta página
        informativa no sustituye el aviso legal de la institución.
      </p>
      <Link className="text-link" to="/ayuda">
        Consultar canales institucionales ↗
      </Link>
    </article>
  );
}
export function Notifications() {
  const { user } = useAuth();
  const state = useAsync(() => api("/notifications"));
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function mark() {
    setBusy(true);
    setNotice("");
    state.setError("");
    try {
      await api("/notifications/read", { method: "POST" });
      state.setData((items) => items.map((item) => ({ ...item, seen: true })));
      setNotice("Notificaciones marcadas como leídas.");
    } catch (e) {
      state.setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container narrow-page">
      <span className="eyebrow">AVISOS DEL PORTAL</span>
      <h1>Notificaciones</h1>
      <p className="page-intro">
        Cambios de estado y observaciones registrados en tus solicitudes.
      </p>
      <Alert>{state.error}</Alert>
      <Alert type="success">{notice}</Alert>
      {state.loading ? (
        <p role="status">Cargando avisos…</p>
      ) : !state.data && state.error ? (
        <button className="button button-secondary" onClick={state.refresh}>
          Volver a consultar notificaciones
        </button>
      ) : state.data?.length ? (
        <>
          {state.data.some((n) => !n.seen) && (
            <BusyButton
              busy={busy}
              busyText="Marcando como leídas…"
              className="button button-secondary"
              onClick={mark}
            >
              Marcar todas como leídas
            </BusyButton>
          )}
          <div className="notification-list">
            {state.data.map((n) => (
              <article
                key={n.id}
                className={n.seen ? "notification" : "notification unread"}
              >
                <time dateTime={n.created_at}>{date(n.created_at, true)}</time>
                <span className="notification-state">
                  {n.seen ? "Leída" : "Sin leer"}
                </span>
                <p>{n.message}</p>
                <Link
                  to={
                    n.application_id
                      ? `/titulacion/expediente/${n.application_id}`
                      : "/titulacion"
                  }
                  className="text-link"
                >
                  {user.role === "estudiante"
                    ? "Consultar expediente"
                    : "Abrir expediente"}{" "}
                  ↗
                </Link>
              </article>
            ))}
          </div>
        </>
      ) : (
        <Empty title="Aún no tienes notificaciones">
          Aquí aparecerán los cambios de estado y las observaciones de tus
          solicitudes.
        </Empty>
      )}
    </div>
  );
}
