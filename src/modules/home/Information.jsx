import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowUpRight,
  CircleHelp,
  Mail,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { MODULES, notificationDestination } from "../../../shared/navigation";
import { DOCUMENTS } from "../../../shared/titulacion";
import { api, date } from "../../shared/api";
import { Alert, Empty, BusyButton, Field, useAsync } from "../../shared/ui";
import { useAuth } from "../../app/Auth";
const helpTopics = {
  acceso: {
    title: "Acceso al portal",
    text: "Usa tu cuenta habilitada por la universidad. La contraseña del portal es independiente de la contraseña de tu correo.",
    questions: [
      [
        "¿Cómo obtengo una cuenta?",
        "Consulta los canales oficiales de la universidad para que el responsable habilite tu cuenta y su rol. Google no crea cuentas ni asigna permisos automáticamente.",
      ],
      [
        "¿Puedo entrar con mi teléfono?",
        "Sí, después de que un operador vincule tu número a tu cuenta. Escribir un teléfono en el perfil académico no habilita este acceso. Usa el número vinculado y la contraseña del portal.",
      ],
      [
        "¿Cómo activo Google?",
        "El acceso Google Workspace debe estar configurado por la institución. Cuando esté habilitado, usa una cuenta @utdeoriental.edu.mx autorizada en el portal.",
      ],
    ],
  },
  becas: {
    title: "Solicitudes de beca",
    text: "Consulta las bases y fechas de cada convocatoria antes de registrar tu solicitud.",
    questions: [
      [
        "¿Cómo solicito un apoyo?",
        "Guarda tu estudio socioeconómico, consulta una convocatoria que esté recibiendo solicitudes y registra tus datos. Después abre Mis solicitudes y adjunta los documentos para revisión.",
      ],
      [
        "¿Cómo corrijo un documento?",
        "Consulta la observación del área de becas. Puedes sustituir un documento recibido u observado antes del dictamen; los documentos validados están cerrados.",
      ],
      [
        "¿Una orden de cobro significa que ya recibí el apoyo?",
        "No. Indica una programación interna. Consulta la fecha y las indicaciones del área responsable; el portal no realiza transferencias bancarias.",
      ],
      [
        "¿Cómo renuevo una beca?",
        "Abre Renovaciones y selecciona una beca propia aprobada. Registra tu promedio y nuevo periodo académico; el área revisará la solicitud.",
      ],
    ],
  },
  "evaluacion-docente": {
    title: "Evaluación de tus asignaturas",
    text: "Las evaluaciones disponibles dependen de tus asignaciones y de los periodos habilitados por el área académica.",
    questions: [
      [
        "¿Por qué no aparece una evaluación?",
        "El área responsable debe registrar la asignación y abrir el periodo. Los periodos en preparación no se muestran al estudiante o docente.",
      ],
      [
        "¿Puedo cambiar mis respuestas?",
        "Puedes revisar tus selecciones antes de confirmar el envío. Una vez guardadas por el servidor quedan cerradas y no puedes enviar otra evaluación para esa misma asignación.",
      ],
      [
        "¿Qué recibe el docente?",
        "Resultados agregados y comentarios revisados sin tu nombre ni respuestas individuales. Se requiere el mínimo de participantes configurado. Evita incluir datos que te identifiquen en el comentario.",
      ],
      [
        "¿Cuándo puedo consultar mis resultados como docente?",
        "Cuando el área responsable cierre y publique el periodo y se alcance el mínimo de participantes. Solo podrás consultar tus propios resultados y planes de mejora.",
      ],
    ],
  },
};
export function Help() {
  const { user } = useAuth();
  const [topic, setTopic] = useState(
    user?.role === "docente"
      ? "evaluacion-docente"
      : ["evaluador", "auditor"].includes(user?.role)
        ? "becas"
        : "acceso",
  );
  const module = MODULES.find((m) => m.id === topic);
  return (
    <div className="container information-page">
      <span className="eyebrow">CENTRO DE AYUDA</span>
      <h1>Requisitos y ayuda</h1>
      <p className="page-intro">
        Consulta cómo acceder al portal y completar las tareas de cada servicio.
      </p>
      <div className="work-toolbar">
        <Field
          label="Servicio que deseas consultar"
          as="select"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="acceso">Acceso al portal</option>
          {MODULES.filter((m) => !user || m.roles.includes(user.role)).map(
            (m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ),
          )}
        </Field>
      </div>
      {topic !== "titulacion" ? (
        <section className="work-section">
          <h2>{helpTopics[topic].title}</h2>
          <p>{helpTopics[topic].text}</p>
          {helpTopics[topic].questions.map(([q, a]) => (
            <details className="faq" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <div className="work-section">
            {module && (!user || module.roles.includes(user.role)) && (
              <Link className="button button-primary" to={module.path}>
                Abrir {module.shortName}
                <ArrowUpRight size={16} />
              </Link>
            )}
            <p>
              Para atención de tu caso, consulta los canales publicados en el{" "}
              <a
                href="https://utdeoriental.edu.mx/"
                className="text-link"
                target="_blank"
                rel="noreferrer"
              >
                sitio institucional
              </a>
              .
            </p>
          </div>
        </section>
      ) : (
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
      )}
    </div>
  );
}
export function Privacy() {
  return (
    <article className="container narrow-page">
      <span className="eyebrow">TRATAMIENTO DE INFORMACIÓN</span>
      <h1>Privacidad del portal</h1>
      <Alert type="info">
        Entorno de desarrollo. Antes del uso con datos reales, la universidad
        debe aprobar y publicar su aviso de privacidad integral.
      </Alert>
      <h2>Información que utiliza el servicio</h2>
      <p>
        Datos de identificación, contacto y trayectoria académica; documentos de
        titulación; solicitudes y estudio socioeconómico de becas; asignaciones,
        respuestas y comentarios de evaluación docente; dictámenes e historial
        de cambios.
      </p>
      <h2>Acceso por área</h2>
      <p>
        El estudiante consulta su propio expediente. Servicios Escolares y
        Administración revisan el trámite. Tesorería accede al comprobante de
        pago; Vinculación consulta los datos necesarios para registrar su
        liberación. En Becas, el área revisora consulta los expedientes;
        Tesorería consulta órdenes internas y Auditoría accede a la actividad
        autorizada. En Evaluación, el docente recibe únicamente sus resultados
        agregados publicados y comentarios revisados, con el mínimo de
        participantes configurado.
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
        Avisos sobre tus trámites, apoyos y evaluaciones.
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
            {state.data.map((n) => {
              const destination = notificationDestination(n, user.role);
              return (
                <article
                  key={n.id}
                  className={n.seen ? "notification" : "notification unread"}
                >
                  <time dateTime={n.created_at}>
                    {date(n.created_at, true)}
                  </time>
                  <span className="notification-state">
                    {n.seen ? "Leída" : "Sin leer"}
                  </span>
                  <p>{n.message}</p>
                  {destination && (
                    <Link to={destination.path} className="text-link">
                      {destination.label} ↗
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <Empty title="Aún no tienes notificaciones">
          Aquí aparecerán los avisos de los servicios que tienes habilitados.
        </Empty>
      )}
    </div>
  );
}
