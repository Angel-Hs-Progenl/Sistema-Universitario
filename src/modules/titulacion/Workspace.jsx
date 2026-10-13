import Timeline from "./components/Timeline";
import Inbox from "./components/Inbox";
import CaseModal from "./components/CaseModal";
import PageHeading from "./components/PageHeading";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
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
import { api, date } from "../../shared/api";
import { Badge, Alert, BusyButton, useAsync } from "../../shared/ui";
import {
  DOCUMENTS,
  STATES,
  TRANSITIONS,
  EDITABLE,
  NEXT,
  canReview,
} from "../../../shared/titulacion";

export default function Workspace() {
  const { user } = useAuth(),
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
    [modal, setModal] = useState(null);
  async function create() {
    setBusy(true);
    state.setError("");
    try {
      await api("/titulacion/applications", { method: "POST" });
      await state.refresh();
    } catch (e) {
      state.setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function changed(result) {
    if (id) state.setData(result);
    else await state.refresh();
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
          title="Un paso más cerca de tu título."
        >
          Prepara tu expediente y comienza tu trámite desde aquí.
        </PageHeading>
        <Alert>{state.error}</Alert>
        <div className="start-card">
          <div className="start-icon">
            <FileText size={45} strokeWidth={1} />
          </div>
          <span className="eyebrow">TU TRÁMITE, PASO A PASO</span>
          <h2>
            Vamos a preparar
            <br />
            tu solicitud.
          </h2>
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
  const areaTotal = ["tesoreria", "vinculacion"].includes(user.role) ? 1 : 7;
  const areaValid =
    user.role === "vinculacion" ? (app.clearance ? 1 : 0) : valid;
  const docsOnly = view === "documentos",
    timelineOnly = view === "seguimiento";
  return (
    <>
      {id && (
        <Link to="/titulacion" className="back-home">
          <ArrowLeft size={15} /> Volver a solicitudes
        </Link>
      )}
      <PageHeading
        eyebrow={
          student ? "TU EXPEDIENTE DIGITAL" : `EXPEDIENTE · ${app.folio}`
        }
        title={
          docsOnly
            ? "Cada documento cuenta."
            : timelineOnly
              ? "Tu avance, con claridad."
              : student
                ? "Mi solicitud de titulación"
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
          ? "Revisa tu expediente y conoce qué sigue en tu trámite."
          : `${app.student.profile.matricula || "Sin matrícula"} · ${app.student.profile.carrera || "Sin carrera"}`}
      </PageHeading>
      <Alert>{state.error}</Alert>
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
      {!docsOnly && (
        <div className="next-step">
          <span className="next-step-icon">
            <ArrowRight size={21} />
          </span>
          <div>
            <strong>
              {student ? "Tu siguiente paso" : "Orientación para el egresado"}
            </strong>
            <p>{NEXT[app.status]}</p>
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
          {!docsOnly && (
            <div className="case-overview">
              <section className="panel">
                <div className="panel-heading">
                  <h2>{student ? "Tu información" : "Datos del egresado"}</h2>
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
                  {!["tesoreria", "vinculacion"].includes(user.role) && (
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
              <section className="progress-panel">
                <div className="panel-heading">
                  <h2>
                    {user.role === "tesoreria"
                      ? "Validación de pago"
                      : user.role === "vinculacion"
                        ? "Liberación de Vinculación"
                        : "Integración del expediente"}
                  </h2>
                  <ShieldCheck size={19} />
                </div>
                <div className="progress-number">
                  {areaValid}
                  <span> / {areaTotal}</span>
                </div>
                <p>
                  {user.role === "vinculacion"
                    ? "liberación registrada"
                    : user.role === "tesoreria"
                      ? "comprobante validado"
                      : "documentos obligatorios validados"}
                </p>
                <progress
                  max={areaTotal}
                  value={areaValid}
                  aria-label={`${areaValid} de ${areaTotal} validaciones ${areaTotal === 1 ? "de tu área" : "del expediente"}`}
                />
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
                    {app.clearance_note && <small>{app.clearance_note}</small>}
                  </div>
                </div>
              </section>
            </div>
          )}
          {user.role !== "vinculacion" && (
            <section className="panel documents-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {user.role === "tesoreria"
                      ? "Validación de pago"
                      : "Documentación del expediente"}
                  </h2>
                  <p>PDF o JPG · Máximo 5 MB por archivo</p>
                </div>
                <span className="count-pill">
                  {user.role === "tesoreria"
                    ? documents.length
                    : `${documents.length} / 8`}
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
          {!student &&
            user.role === "vinculacion" &&
            app.status === "revision" && (
              <section className="panel form-panel">
                <h2>Validación de Vinculación</h2>
                <p>
                  Confirma la conclusión de estadías y el seguimiento de
                  egresados. Registra el fundamento de la liberación.
                </p>
                <button
                  className="button button-primary"
                  onClick={() => setModal({ type: "clearance" })}
                >
                  Registrar dictamen
                </button>
              </section>
            )}
          {!docsOnly && (
            <>
              <div className="case-action-bar">
                <div>
                  <strong>
                    {student
                      ? "Tu expediente queda guardado"
                      : "Control del expediente"}
                  </strong>
                  <p>
                    {student
                      ? "Verifica tus datos y documentos antes de enviar."
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
                        : ["escolares", "administrador"].includes(user.role) &&
                          s !== "enviada",
                    )
                    .map((s) => (
                      <button
                        key={s}
                        className={`button ${s === "cancelado" ? "button-quiet" : s === "incompleta" || s === "rechazada" ? "button-secondary" : "button-primary"}`}
                        onClick={() =>
                          setModal({ type: "transition", status: s })
                        }
                      >
                        {s === "enviada"
                          ? "Revisar y enviar"
                          : s === "revision"
                            ? "Iniciar revisión"
                            : s === "validada"
                              ? "Validar expediente"
                              : s === "cancelado"
                                ? "Cancelar solicitud"
                                : STATES[s]}
                        {s !== "cancelado" && <ArrowRight size={15} />}
                      </button>
                    ))}
                </div>
              </div>
              <Timeline app={app} />
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
