import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  Eye,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync, Badge } from "../../shared/ui";
import { DOCUMENTOS_BECA, ESTADOS_BECA } from "../../../shared/becas";

export default function Solicitudes() {
  const { user } = useAuth();
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [uploadKind, setUploadKind] = useState("kardex");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadErr, setUploadErr] = useState("");

  const { data: applications, loading, error, refresh: refreshList } = useAsync(
    () => api("/becas/solicitudes"),
    []
  );

  const {
    data: appDetail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useAsync(
    () => (selectedAppId ? api(`/becas/solicitudes/${selectedAppId}`) : Promise.resolve(null)),
    [selectedAppId]
  );

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) {
      setUploadErr("Selecciona un archivo PDF o JPG para cargar.");
      return;
    }
    setUploading(true);
    setUploadErr("");
    setUploadMsg("");

    const formData = new FormData();
    formData.append("kind", uploadKind);
    formData.append("file", uploadFile);

    try {
      await api(`/becas/solicitudes/${selectedAppId}/documentos`, {
        method: "POST",
        body: formData,
      });
      setUploadMsg("Documento cargado correctamente.");
      setUploadFile(null);
      refreshDetail();
    } catch (err) {
      setUploadErr(err.message);
    } finally {
      setUploading(false);
    }
  }

  const getStatusBadge = (status) => {
    const badgeColors = {
      recibida: "badge-enviada",
      revision: "badge-revision",
      aprobada: "badge-validado",
      rechazada: "badge-rechazado",
      renovada: "badge-validado",
    };
    return (
      <span className={`badge ${badgeColors[status] || "badge-pendiente"}`}>
        {ESTADOS_BECA[status] || status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
            Seguimiento de mis solicitudes de beca
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Consulta el estado de tu trámite, comentarios del comité y adjunta tus documentos probatorios.
          </p>
        </div>
        <Link to="/becas" className="button button-primary">
          Ver convocatorias abiertas
        </Link>
      </div>

      {loading && <p>Cargando tus solicitudes…</p>}
      {error && <Alert>{error}</Alert>}

      {!loading && (!applications || applications.length === 0) && (
        <div className="empty">
          <h2>No tienes solicitudes registradas</h2>
          <p>Explora las convocatorias vigentes y postúlate a una beca institucional.</p>
          <Link to="/becas" className="button button-primary" style={{ marginTop: "12px" }}>
            Explorar convocatorias
          </Link>
        </div>
      )}

      {applications && applications.length > 0 && (
        <div className="audit-table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                <th style={{ padding: "10px 12px" }}>Folio</th>
                <th style={{ padding: "10px 12px" }}>Convocatoria</th>
                <th style={{ padding: "10px 12px" }}>Modalidad</th>
                <th style={{ padding: "10px 12px" }}>Promedio</th>
                <th style={{ padding: "10px 12px" }}>Estado</th>
                <th style={{ padding: "10px 12px" }}>Fecha de registro</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>{app.folio}</td>
                  <td style={{ padding: "12px" }}>{app.call_title}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {app.modalidad}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontWeight: "600" }}>{app.gpa.toFixed(1)}</td>
                  <td style={{ padding: "12px" }}>{getStatusBadge(app.status)}</td>
                  <td style={{ padding: "12px", fontSize: "0.8125rem" }}>{date(app.created_at)}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <Eye size={16} /> Ver expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalle de Solicitud */}
      {selectedAppId && (
        <Modal
          title={`Expediente: ${appDetail?.folio || "Cargando…"}`}
          onClose={() => {
            setSelectedAppId(null);
            setUploadMsg("");
            setUploadErr("");
          }}
        >
          {detailLoading && <p>Cargando información del expediente…</p>}
          {detailError && <Alert>{detailError}</Alert>}

          {appDetail && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "var(--canvas)",
                  padding: "16px",
                  borderRadius: "var(--radius)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <small style={{ color: "var(--muted)" }}>Convocatoria</small>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "600" }}>{appDetail.call.title}</p>
                </div>
                <div>
                  <small style={{ color: "var(--muted)" }}>Estado de solicitud</small>
                  <div style={{ marginTop: "4px" }}>{getStatusBadge(appDetail.status)}</div>
                </div>
                <div>
                  <small style={{ color: "var(--muted)" }}>Monto asignado</small>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "600", color: "var(--brand)" }}>
                    ${appDetail.call.amount.toLocaleString("es-MX")} MXN
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--muted)" }}>Promedio registrado</small>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "600" }}>{appDetail.gpa.toFixed(1)}</p>
                </div>
              </div>

              {/* Buzón de avisos / Observaciones del comité */}
              {appDetail.committee_notes && (
                <div
                  style={{
                    border: "1px solid var(--gold)",
                    background: "#fefcf6",
                    padding: "12px 16px",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand)" }}>
                    <MessageSquare size={18} />
                    <strong>Observación del Comité Evaluador:</strong>
                  </div>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.875rem", color: "var(--ink)" }}>
                    {appDetail.committee_notes}
                  </p>
                </div>
              )}

              {/* Timeline de Seguimiento */}
              <div>
                <h4 style={{ margin: "0 0 12px 0" }}>Línea de tiempo del trámite</h4>
                <div className="timeline-becas">
                  <div className="timeline-item">
                    <strong>1. Solicitud recibida</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                      Folio {appDetail.folio} registrado en plataforma UTO el {date(appDetail.created_at, true)}.
                    </p>
                  </div>
                  <div className="timeline-item">
                    <strong>2. Validación socioeconómica y académica</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {appDetail.socioeconomic
                        ? `Índice de vulnerabilidad evaluado: ${appDetail.socioeconomic.vulnerability_score} pts.`
                        : "Pendiente de captura del estudio socioeconómico digital."}
                    </p>
                  </div>
                  <div className="timeline-item">
                    <strong>3. Dictaminación por comité</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {appDetail.status === "recibida" && "En espera de turno de sesión de comité."}
                      {appDetail.status === "revision" && "Comité revisando documentos y promedio."}
                      {appDetail.status === "aprobada" && "Beca formalmente autorizada para dispersión."}
                      {appDetail.status === "rechazada" && "Solicitud no aprobada según criterios de la convocatoria."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Carga y Gestión de Documentos */}
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Documentación del expediente</h4>
                <p style={{ margin: "0 0 12px 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                  Sube tus comprobantes en formato PDF o JPG (máximo 5 MB por archivo).
                </p>

                {uploadMsg && <div className="alert success">{uploadMsg}</div>}
                {uploadErr && <Alert>{uploadErr}</Alert>}

                <form onSubmit={handleUpload} style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <select
                    value={uploadKind}
                    onChange={(e) => setUploadKind(e.target.value)}
                    style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}
                  >
                    {DOCUMENTOS_BECA.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.required ? "(Obligatorio)" : "(Opcional)"}
                      </option>
                    ))}
                  </select>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    style={{ padding: "6px" }}
                  />

                  <BusyButton busy={uploading} busyText="Subiendo…" type="submit" className="button button-primary">
                    <Upload size={16} /> Adjuntar archivo
                  </BusyButton>
                </form>

                {/* Lista de documentos ya subidos */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {DOCUMENTOS_BECA.map((tipo) => {
                    const uploaded = appDetail.documents.find((d) => d.kind === tipo.id);
                    return (
                      <div
                        key={tipo.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius)",
                          background: uploaded ? "var(--surface)" : "var(--canvas)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={18} color={uploaded ? "var(--green)" : "var(--muted)"} />
                          <div>
                            <p style={{ margin: 0, fontWeight: "600", fontSize: "0.875rem" }}>
                              {tipo.name}
                            </p>
                            <small style={{ color: "var(--muted)" }}>
                              {uploaded
                                ? `${uploaded.name} (${(uploaded.size / 1024).toFixed(0)} KB)`
                                : tipo.required
                                ? "Pendiente de adjuntar"
                                : "Opcional"}
                            </small>
                          </div>
                        </div>

                        {uploaded && (
                          <a
                            href={`/api/v1/becas/solicitudes/${appDetail.id}/documentos/${uploaded.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="button button-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          >
                            Descargar
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedAppId(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
