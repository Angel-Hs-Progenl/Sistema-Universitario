import Timeline from "./components/Timeline";
import Inbox from "./components/Inbox";
import CaseModal from "./components/CaseModal";
import PageHeading from "./components/PageHeading";
import StudentTasks from "./components/StudentTasks";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  RefreshCw,
  Download,
  Upload,
  FileText,
  CircleCheck,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../app/Auth";
import { useBreadcrumbEntity } from "../../app/Navigation";
import { api, date } from "../../shared/api";
import { Badge, Alert, BusyButton, useAsync } from "../../shared/ui";
import {
  DOCUMENTS,
  TRANSITIONS,
  EDITABLE,
  NEXT,
  canReview,
} from "../../../shared/titulacion";

const transitionActions = {
  enviada: "Revisar y enviar",
  revision: "Iniciar revisión",
  incompleta: "Solicitar documentos faltantes",
  rechazada: "Devolver para corrección",
  validada: "Validar expediente",
  proceso: "Iniciar gestión de titulación",
  tramite: "Registrar título en trámite",
  disponible: "Registrar disponibilidad del título",
  concluido: "Registrar entrega y concluir",
  cancelado: "Cancelar solicitud",
};

export default function Workspace() {
  const { user } = useAuth(),
    navigate = useNavigate(),
    location = useLocation(),
    { id } = useParams();
  const student = user.role === "estudiante",
    view = location.pathname.split("/").at(-1);
  const state = useAsync(
    () =>
      api(id ? `/titulacion/applications/${id}` : "/titulacion/applications"),
    [id, user.id],
  );
  const [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState("");
  useBreadcrumbEntity(id ? state.data?.folio : null);
  async function create() {
    setBusy(true);
    state.setError("");
    try {
      await api("/titulacion/applications", { method: "POST" });
      if (id) {
        navigate("/titulacion");
        return;
      }
      await state.refresh();
    } catch (e) {
      state.setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function changed(result) {
    if (id) state.setData(result);
    else
      state.setData((list) =>
        list.map((entry) => (entry.id === result.id ? result : entry)),
      );
    setNotice(
      modal.type === "upload"
        ? "Documento guardado en el expediente."
        : modal.type === "review" || modal.type === "clearance"
          ? "Dictamen registrado en el historial."
          : "Estado de la solicitud actualizado.",
    );
  }
  if (state.loading)
    return (
      <div role="status" className="page-loading">
        Cargando expedientes…
      </div>
    );
  if (state.error && !state.data)
    return (
      <>
        <Alert>{state.error}</Alert>
        <button className="button button-secondary" onClick={state.refresh}>
          Reintentar
        </button>
      </>
    );
  if (!student && !id) return <Inbox {...state} role={user.role} />;
  const app = id
    ? state.data
    : state.data?.find((a) => a.status !== "cancelado") || state.data?.[0];
  if (!app)
    return (
      <>
        <PageHeading
          eyebrow="TITULACIÓN ELECTRÓNICA"
          title="Iniciar solicitud de titulación"
        >
          Prepara tu expediente y comienza tu trámite desde aquí.
        </PageHeading>
        <Alert>{state.error}</Alert>
        <div className="start-card">
          <div className="start-icon">
            <FileText size={45} strokeWidth={1} />
          </div>
          <span className="eyebrow">PREPARACIÓN DEL EXPEDIENTE</span>
          <h2>Reúne tus datos y documentos</h2>
          <p>
            Necesitarás tus datos académicos y 7 documentos. Puedes guardar tu
            avance y continuar después.
          </p>
          <BusyButton
            busy={busy}
            className="button button-primary"
            onClick={create}
          >
            <Plus size={18} /> Crear mi solicitud
          </BusyButton>
          <Link to="/ayuda" className="text-link">
            Consultar requisitos <ArrowRight size={15} />
          </Link>
        </div>
      </>
    );
  const documents = app.documents,
    valid = documents.filter(
      (d) =>
        d.status === "validado" &&
        DOCUMENTS.find((k) => k.id === d.kind)?.required,
    ).length;
  const requiredTotal = DOCUMENTS.filter((doc) => doc.required).length;
  const docsOnly = view === "documentos",
    timelineOnly = view === "seguimiento";
  return (
    <>
      <PageHeading
        eyebrow={
          student
            ? "TITULACIÓN / SERVICIOS ESCOLARES"
            : `EXPEDIENTE · ${app.folio}`
        }
        title={
          docsOnly
            ? "Documentos para revisión"
            : timelineOnly
              ? "Movimientos del trámite"
              : student
                ? "Mi titulación"
                : app.student.name
        }
        action={
          <button
            className="icon-button"
            aria-label="Actualizar expediente"
            onClick={state.refresh}
          >
            <RefreshCw size={18} />
          </button>
        }
      >
        {student
          ? docsOnly
            ? "Adjunta archivos legibles y consulta las observaciones de cada área."
            : timelineOnly
              ? "Consulta las fechas, los cambios de estado y las observaciones registradas."
              : EDITABLE.includes(app.status)
                ? "Completa tu expediente antes de enviarlo a Servicios Escolares."
                : "Consulta el estado de tu solicitud y las indicaciones de Servicios Escolares."
          : `${app.student.profile.matricula || "Sin matrícula"} · ${app.student.profile.carrera || "Sin carrera"}`}
      </PageHeading>
      <Alert>{state.error}</Alert>
      <Alert type="success">{notice}</Alert>
      <div className="case-banner">
        <div>
          <span className="overline">FOLIO DE SOLICITUD</span>
          <strong>{app.folio}</strong>
          <span>Iniciada el {date(app.created_at)}</span>
        </div>
        <div>
          <Badge status={app.status} />
          <span>Actualizada el {date(app.updated_at)}</span>
        </div>
      </div>
      {!docsOnly &&
        ((student && !EDITABLE.includes(app.status)) || app.delivery) && (
          <div className="next-step">
            <span className="next-step-icon">
              <ArrowRight size={21} />
            </span>
            <div>
              <strong>
                {student ? "Tu siguiente paso" : "Orientación para el egresado"}
              </strong>
              <p>{NEXT[app.status]}</p>
              {student && EDITABLE.includes(app.status) && (
                <Link className="text-link" to="/titulacion/documentos">
                  Revisar documentos pendientes <ArrowRight size={14} />
                </Link>
              )}
              {app.delivery && (
                <p className="delivery-note">
                  Indicaciones de entrega: {app.delivery}
                </p>
              )}
            </div>
          </div>
        )}
      {timelineOnly ? (
        <Timeline app={app} />
      ) : (
        <>
          {student && !docsOnly && EDITABLE.includes(app.status) && (
            <StudentTasks app={app} />
          )}
          {!docsOnly && (
            <div
              className={`case-overview ${(student && EDITABLE.includes(app.status)) || user.role === "tesoreria" ? "preparation-overview" : ""}`}
            >
              <section className="panel">
                <div className="panel-heading">
                  <h2>
                    {student ? "Datos registrados" : "Datos del egresado"}
                  </h2>
                  {student && EDITABLE.includes(app.status) && (
                    <Link to="/titulacion/perfil" className="text-link">
                      Editar ↗
                    </Link>
                  )}
                </div>
                <dl className="data-list">
                  <div>
                    <dt>Nombre</dt>
                    <dd>{app.student.name}</dd>
                  </div>
                  <div>
                    <dt>Matrícula</dt>
                    <dd>{app.student.profile.matricula || "Por completar"}</dd>
                  </div>
                  <div>
                    <dt>Carrera</dt>
                    <dd>{app.student.profile.carrera || "Por completar"}</dd>
                  </div>
                  <div>
                    <dt>Generación</dt>
                    <dd>{app.student.profile.generacion || "Por completar"}</dd>
                  </div>
                  {!student &&
                    !["tesoreria", "vinculacion"].includes(user.role) && (
                      <>
                        <div>
                          <dt>CURP</dt>
                          <dd>{app.student.profile.curp || "Por completar"}</dd>
                        </div>
                        <div>
                          <dt>Correo</dt>
                          <dd>{app.student.email}</dd>
                        </div>
                        <div>
                          <dt>Teléfono</dt>
                          <dd>
                            {app.student.profile.telefono || "Por completar"}
                          </dd>
                        </div>
                        <div>
                          <dt>Domicilio</dt>
                          <dd>
                            {app.student.profile.domicilio || "Por completar"}
                          </dd>
                        </div>
                      </>
                    )}
                </dl>
              </section>
              {user.role !== "tesoreria" &&
                (!student || !EDITABLE.includes(app.status)) && (
                  <section className="progress-panel">
                    <div className="panel-heading">
                      <h2>
                        {user.role === "vinculacion"
                          ? "Liberación de Vinculación"
                          : "Revisión institucional"}
                      </h2>
                      <ShieldCheck size={19} />
                    </div>
                    {user.role !== "vinculacion" && (
                      <>
                        <div className="progress-number">
                          {valid}
                          <span> / {requiredTotal}</span>
                        </div>
                        <p>documentos obligatorios validados</p>
                        <progress
                          max={requiredTotal}
                          value={valid}
                          aria-label={`${valid} de ${requiredTotal} documentos obligatorios validados`}
                        />
                      </>
                    )}
                    <div className="clearance-status">
                      <span>
                        {app.clearance ? (
                          <CircleCheck size={18} />
                        ) : (
                          <Clock3 size={18} />
                        )}
                      </span>
                      <div>
                        <strong>Vinculación</strong>
                        <p>
                          {app.clearance
                            ? "Estadías y seguimiento liberados"
                            : "Liberación pendiente"}
                        </p>
                        {app.clearance_note && (
                          <small>{app.clearance_note}</small>
                        )}
                      </div>
                    </div>
                    {user.role === "vinculacion" &&
                      app.status === "revision" && (
                        <div className="clearance-action">
                          <p>
                            Registra el fundamento de la liberación de estadías
                            y seguimiento de egresados.
                          </p>
                          <button
                            className="button button-primary"
                            onClick={() => setModal({ type: "clearance" })}
                          >
                            Registrar dictamen
                          </button>
                        </div>
                      )}
                  </section>
                )}
            </div>
          )}
          {user.role !== "vinculacion" && (!student || docsOnly || id) && (
            <section className="panel documents-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {user.role === "tesoreria"
                      ? "Validación de pago"
                      : "Documentación del expediente"}
                  </h2>
                  <p>
                    PDF o JPG · Máximo 5 MB por archivo
                    {student && " · Adjuntar no envía la solicitud"}
                  </p>
                </div>
                <span className="count-pill">
                  {user.role === "tesoreria"
                    ? documents.length
                    : `${documents.filter((d) => DOCUMENTS.find((k) => k.id === d.kind)?.required).length} de 7 obligatorios`}
                </span>
              </div>
              <div className="document-list">
                {DOCUMENTS.filter(
                  (d) => user.role !== "tesoreria" || d.id === "pago",
                ).map((kind) => {
                  const doc = documents.find((d) => d.kind === kind.id);
                  return (
                    <div className="document-row" key={kind.id}>
                      <span
                        className={`doc-icon ${doc?.status === "validado" ? "validated" : ""}`}
                      >
                        <FileText size={20} />
                      </span>
                      <div className="doc-description">
                        <h3>
                          {kind.name}{" "}
                          {!kind.required && <small>Opcional</small>}
                        </h3>
                        <p>
                          {doc
                            ? `${doc.name} · ${(doc.size / 1024).toFixed(0)} KB`
                            : kind.area === "tesoreria"
                              ? "Validación por Tesorería"
                              : "Sin archivo adjunto"}
                        </p>
                        {doc?.note && (
                          <p className="doc-note">Observación: {doc.note}</p>
                        )}
                      </div>
                      <div className="doc-actions">
                        <Badge status={doc?.status || "pendiente"} />
                        {doc && (
                          <a
                            className="icon-button"
                            href={`/api/v1/titulacion/documents/${doc.id}/download`}
                            aria-label={`Descargar ${kind.name}`}
                          >
                            <Download size={17} />
                          </a>
                        )}
                        {student &&
                          EDITABLE.includes(app.status) &&
                          doc?.status !== "validado" && (
                            <button
                              className="button button-secondary small"
                              onClick={() => setModal({ type: "upload", kind })}
                            >
                              <Upload size={14} />
                              {doc ? "Reemplazar" : "Adjuntar"}
                              <span className="sr-only"> {kind.name}</span>
                            </button>
                          )}
                        {!student &&
                          doc &&
                          canReview(user.role, kind.id) &&
                          app.status === "revision" && (
                            <button
                              className="button button-secondary small"
                              onClick={() =>
                                setModal({ type: "review", doc, kind })
                              }
                            >
                              <span className="sr-only">{kind.name}: </span>
                              Revisar
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {student && docsOnly && (
            <Link className="button button-primary" to="/titulacion">
              Continuar al resumen <ArrowRight size={16} />
            </Link>
          )}
          {!docsOnly && (
            <>
              {(student ||
                ["escolares", "administrador"].includes(user.role)) && (
                <div className="case-action-bar">
                  <div>
                    <strong>
                      {student
                        ? EDITABLE.includes(app.status)
                          ? "Revisa antes de enviar"
                          : app.status === "cancelado"
                            ? "Solicitud cancelada"
                            : "Solicitud registrada"
                        : "Control del expediente"}
                    </strong>
                    <p>
                      {student
                        ? EDITABLE.includes(app.status)
                          ? "Verifica tus datos y documentos antes de enviar."
                          : "Consulta el estado y las observaciones en el historial."
                        : "Cada cambio quedará registrado en el historial."}
                    </p>
                  </div>
                  <div className="action-buttons">
                    {student && app.status === "cancelado" && (
                      <BusyButton
                        busy={busy}
                        className="button button-primary"
                        onClick={create}
                      >
                        Crear nueva solicitud
                      </BusyButton>
                    )}
                    {(TRANSITIONS[app.status] || [])
                      .filter((s) =>
                        student
                          ? EDITABLE.includes(app.status) &&
                            ["enviada", "cancelado"].includes(s)
                          : ["escolares", "administrador"].includes(
                              user.role,
                            ) && s !== "enviada",
                      )
                      .map((s) => (
                        <button
                          key={s}
                          className={`button ${s === "cancelado" ? "button-quiet" : s === "incompleta" || s === "rechazada" ? "button-secondary" : "button-primary"}`}
                          onClick={() =>
                            setModal({ type: "transition", status: s })
                          }
                        >
                          {transitionActions[s]}
                          {s !== "cancelado" && <ArrowRight size={15} />}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <Timeline app={app} limit={student && !id ? 3 : undefined} />
            </>
          )}
        </>
      )}
      {modal && (
        <CaseModal
          key={modal.type + (modal.status || "")}
          modal={modal}
          app={app}
          onClose={() => setModal(null)}
          onDone={async (result) => {
            await changed(result);
            setModal(null);
          }}
        />
      )}
    </>
  );
}
