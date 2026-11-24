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
  CreditCard,
  Building2,
  Award,
  Printer,
  Bell,
  ExternalLink,
  Check,
} from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync, Badge } from "../../shared/ui";
import { DOCUMENTOS_BECA, ESTADOS_BECA } from "../../../shared/becas";

export default function Solicitudes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("solicitudes");
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [uploadKind, setUploadKind] = useState("kardex");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadErr, setUploadErr] = useState("");

  // Bank data form state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAppId, setBankAppId] = useState(null);
  const [bankName, setBankName] = useState("");
  const [bankClabe, setBankClabe] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState("");
  const [bankErr, setBankErr] = useState("");

  // Constancia state
  const [constanciaData, setConstanciaData] = useState(null);
  const [constanciaLoading, setConstanciaLoading] = useState(false);
  const [constanciaError, setConstanciaError] = useState("");
  const [concluding, setConcluding] = useState(false);

  const { data: banks } = useAsync(() => api("/becas/bancos"), []);

  const { data: applications, loading, error, refresh: refreshList } = useAsync(
    () => api("/becas/solicitudes"),
    []
  );

  const { data: notifications, loading: notifsLoading, refresh: refreshNotifs } = useAsync(
    () => api("/becas/notificaciones"),
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

  async function handleBankSave(e) {
    e.preventDefault();
    setSavingBank(true);
    setBankErr("");
    setBankMsg("");
    try {
      const res = await api(`/becas/solicitudes/${bankAppId}/datos-bancarios`, {
        method: "PUT",
        body: { bank_name: bankName, bank_clabe: bankClabe, bank_account_holder: bankHolder },
      });
      setBankMsg(`Datos guardados correctamente. Banco detectado: ${res.bank_name}`);
      refreshList();
      setTimeout(() => {
        setShowBankModal(false);
        setBankMsg("");
      }, 1800);
    } catch (err) {
      setBankErr(err.message);
    } finally {
      setSavingBank(false);
    }
  }

  async function viewConstancia(appId) {
    setConstanciaLoading(true);
    setConstanciaError("");
    setConstanciaData(null);
    try {
      const data = await api(`/becas/solicitudes/${appId}/constancia`);
      setConstanciaData(data);
    } catch (err) {
      setConstanciaError(err.message || "No se pudo obtener la constancia oficial.");
    } finally {
      setConstanciaLoading(false);
    }
  }

  async function handleConclude(appId) {
    if (
      !window.confirm(
        "¿Confirmas la conclusión formal de este expediente de beca? Esta acción registra el cierre administrativo del ciclo."
      )
    )
      return;
    setConcluding(true);
    try {
      await api(`/becas/solicitudes/${appId}/concluir`, { method: "POST" });
      refreshList();
      if (selectedAppId === appId) refreshDetail();
    } catch (err) {
      alert(err.message || "Error al concluir expediente");
    } finally {
      setConcluding(false);
    }
  }

  const getStatusBadge = (status) => {
    const badgeColors = {
      recibida: "badge-enviada",
      revision: "badge-revision",
      aprobada: "badge-validado",
      rechazada: "badge-rechazado",
      renovada: "badge-validado",
      concluido: "badge-validado",
      concluida: "badge-validado",
    };
    const labels = {
      ...ESTADOS_BECA,
      concluido: "Expediente concluido",
      concluida: "Expediente concluido",
    };
    return (
      <span className={`badge ${badgeColors[status] || "badge-pendiente"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const isStaff = ["administrador", "escolares"].includes(user?.role);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
            Seguimiento de mis solicitudes de beca
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Consulta el estado de tu trámite, constancias oficiales emitidas y avisos institucionales.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="tabs" style={{ display: "inline-flex", background: "var(--canvas)", padding: "3px", borderRadius: "var(--radius)" }}>
            <button
              type="button"
              className={`button ${activeTab === "solicitudes" ? "button-primary" : "button-ghost"}`}
              style={{ fontSize: "0.8125rem", padding: "6px 12px" }}
              onClick={() => setActiveTab("solicitudes")}
            >
              Mis Solicitudes ({applications?.length || 0})
            </button>
            <button
              type="button"
              className={`button ${activeTab === "notificaciones" ? "button-primary" : "button-ghost"}`}
              style={{ fontSize: "0.8125rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => setActiveTab("notificaciones")}
            >
              <Bell size={14} /> Buzón ({notifications?.length || 0})
            </button>
          </div>
          <Link to="/becas" className="button button-primary">
            Ver convocatorias abiertas
          </Link>
        </div>
      </div>

      {/* TAB 1: SOLICITUDES */}
      {activeTab === "solicitudes" && (
        <>
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
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          display: "flex",
                          gap: "6px",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        {["aprobada", "renovada", "concluido"].includes(app.status) && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.8125rem", color: "var(--brand)" }}
                            onClick={() => viewConstancia(app.id)}
                          >
                            <Award size={14} /> Constancia
                          </button>
                        )}
                        {app.status === "aprobada" && !app.bank_clabe && (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.8125rem" }}
                            onClick={() => {
                              setBankAppId(app.id);
                              setBankName("");
                              setBankClabe("");
                              setBankHolder("");
                              setBankErr("");
                              setBankMsg("");
                              setShowBankModal(true);
                            }}
                          >
                            <CreditCard size={14} /> Registrar CLABE
                          </button>
                        )}
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
        </>
      )}

      {/* TAB 2: BUZÓN DE NOTIFICACIONES */}
      {activeTab === "notificaciones" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifsLoading && <p>Cargando notificaciones institucionales…</p>}
          {!notifsLoading && (!notifications || notifications.length === 0) && (
            <div className="empty">
              <Bell size={32} style={{ color: "var(--muted)", marginBottom: "8px" }} />
              <h2>No tienes avisos pendientes</h2>
              <p>Las actualizaciones de dictamen, publicación de resultados y órdenes de cobro aparecerán aquí.</p>
            </div>
          )}
          {notifications &&
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: "16px",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--canvas)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand)",
                    flexShrink: 0,
                  }}
                >
                  <Bell size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: "700" }}>{n.title}</h3>
                    <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{date(n.date, true)}</small>
                  </div>
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", color: "var(--ink)" }}>{n.message}</p>
                  <span
                    className={`badge ${
                      n.type === "resultado"
                        ? "badge-validado"
                        : n.type === "pago"
                        ? "badge-enviada"
                        : "badge-revision"
                    }`}
                    style={{ fontSize: "0.6875rem" }}
                  >
                    {n.type === "resultado"
                      ? "Resultados oficiales"
                      : n.type === "pago"
                      ? "Orden de pago"
                      : "Trámite institucional"}
                  </span>
                </div>
              </div>
            ))}
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
                {appDetail.student_percentage && (
                  <div>
                    <small style={{ color: "var(--muted)" }}>Esquema de beca (dictamen)</small>
                    <p style={{ margin: "2px 0 0 0", fontWeight: "700", color: "var(--brand)" }}>
                      Pagas {appDetail.student_percentage}% (Beca: {appDetail.discount_percentage}%)
                    </p>
                  </div>
                )}
              </div>

              {/* Botón de constancia si aprobada/renovada/concluido */}
              {["aprobada", "renovada", "concluido"].includes(appDetail.status) && (
                <div
                  style={{
                    background: "var(--surface)",
                    padding: "12px 16px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--gold)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Award size={20} color="var(--gold)" />
                    <div>
                      <strong style={{ fontSize: "0.875rem" }}>Constancia Oficial de Beca UTO</strong>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                        Documento oficial con sello digital SHA-256 y línea de captura del Estado de Puebla.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ fontSize: "0.8125rem" }}
                    onClick={() => viewConstancia(appDetail.id)}
                  >
                    Ver Constancia
                  </button>
                </div>
              )}

              {/* Datos bancarios registrados */}
              {appDetail.bank_clabe && (
                <div
                  style={{
                    background: "var(--canvas)",
                    padding: "12px 16px",
                    borderRadius: "var(--radius)",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    border: "1px solid var(--line)",
                  }}
                >
                  <Building2 size={18} color="var(--green)" />
                  <div>
                    <small style={{ color: "var(--muted)" }}>Datos bancarios registrados para dispersión</small>
                    <p style={{ margin: "2px 0 0 0", fontWeight: "600" }}>
                      {appDetail.bank_name} — CLABE: {appDetail.bank_clabe}
                    </p>
                    <small style={{ color: "var(--muted)" }}>Titular: {appDetail.bank_account_holder}</small>
                  </div>
                </div>
              )}

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
                      {appDetail.status === "renovada" && "Beca renovada formalmente para el cuatrimestre."}
                      {appDetail.status === "concluido" && "Ciclo de beca formalmente concluido."}
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

                <form
                  onSubmit={handleUpload}
                  style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}
                >
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

              {/* Botones de acción inferior */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <div>
                  {isStaff && ["aprobada", "renovada"].includes(appDetail.status) && (
                    <BusyButton
                      type="button"
                      className="button button-secondary"
                      style={{ color: "var(--ink)", borderColor: "var(--brand)" }}
                      busy={concluding}
                      busyText="Concluyendo…"
                      onClick={() => handleConclude(appDetail.id)}
                    >
                      <CheckCircle size={16} /> Concluir formalmente expediente
                    </BusyButton>
                  )}
                </div>
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

      {/* Modal de Constancia Oficial */}
      {(constanciaData || constanciaLoading || constanciaError) && (
        <Modal
          title="Constancia Oficial de Asignación de Beca"
          onClose={() => {
            setConstanciaData(null);
            setConstanciaError("");
          }}
        >
          {constanciaLoading && <p>Generando constancia oficial con validación institucional…</p>}
          {constanciaError && <Alert>{constanciaError}</Alert>}
          {constanciaData && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Encabezado Institucional */}
              <div
                style={{
                  border: "2px solid var(--brand)",
                  borderRadius: "var(--radius)",
                  padding: "20px",
                  background: "var(--surface)",
                  position: "relative",
                }}
              >
                <div style={{ textAlign: "center", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, color: "var(--brand)", fontSize: "1.125rem", letterSpacing: "0.02em" }}>
                    {constanciaData.institution}
                  </h3>
                  <p style={{ margin: "2px 0", fontSize: "0.8125rem", color: "var(--muted)", fontWeight: "600" }}>
                    SECRETARÍA DE EDUCACIÓN PÚBLICA DEL ESTADO DE PUEBLA
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--gold)", fontWeight: "700" }}>
                    DIRECCIÓN DE SERVICIOS ESCOLARES Y COMITÉ TÉCNICO DE BECAS
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", fontSize: "0.8125rem" }}>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Folio Constancia: </span>
                    <strong style={{ color: "var(--brand)" }}>{constanciaData.folio_constancia}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Expediente: </span>
                    <strong>{constanciaData.application_folio}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Fecha de Emisión: </span>
                    <strong>{date(constanciaData.issued_at, true)}</strong>
                  </div>
                </div>

                <div style={{ background: "var(--canvas)", padding: "14px", borderRadius: "var(--radius)", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 6px 0", fontSize: "0.875rem" }}>
                    Se hace constar que el(la) estudiante:
                  </p>
                  <p style={{ margin: "0 0 6px 0", fontSize: "1.0625rem", fontWeight: "700", color: "var(--brand)" }}>
                    {constanciaData.student_name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
                    Matrícula: <strong>{constanciaData.student_id}</strong> | Carrera: <strong>{constanciaData.major}</strong> | Cuatrimestre: <strong>{constanciaData.term}</strong>
                  </p>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem" }}>
                    Ha sido dictaminado(a) como <strong>BENEFICIARIO(A)</strong> de la convocatoria:
                  </p>
                  <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "var(--ink)" }}>
                    {constanciaData.call_title} ({constanciaData.modalidad})
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                    {constanciaData.committee_agreement}
                  </p>
                </div>

                {/* Desglose de porcentaje y cuota */}
                <div
                  style={{
                    background: "var(--canvas)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius)",
                    padding: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.875rem" }}>
                    <div>
                      <span style={{ color: "var(--muted)" }}>Porcentaje de apoyo (Beca UTO):</span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "1.125rem", fontWeight: "700", color: "var(--green)" }}>
                        {constanciaData.discount_percentage}% de exención
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)" }}>Aportación estudiante:</span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "1.125rem", fontWeight: "700", color: "var(--brand)" }}>
                        {constanciaData.student_percentage}% de la cuota
                      </p>
                    </div>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px dashed var(--line)", margin: "10px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                    <span>Cuota de reinscripción base: ${constanciaData.base_tuition.toLocaleString("es-MX")} MXN</span>
                    <strong style={{ color: "var(--brand)" }}>
                      Total a pagar en Tesorería / Línea: ${constanciaData.discounted_cost.toLocaleString("es-MX")} MXN
                    </strong>
                  </div>
                </div>

                {/* Portal del Gobierno de Puebla */}
                <div
                  style={{
                    background: "#fdf8ee",
                    border: "1px solid var(--gold)",
                    borderRadius: "var(--radius)",
                    padding: "12px 14px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <small style={{ color: "#7a5814", fontWeight: "700" }}>
                        LÍNEA DE CAPTURA - GOBIERNO DEL ESTADO DE PUEBLA
                      </small>
                      <p style={{ margin: "2px 0 0 0", fontFamily: "monospace", fontSize: "1rem", fontWeight: "700", letterSpacing: "1px" }}>
                        {constanciaData.capture_line}
                      </p>
                    </div>
                    <a
                      href={constanciaData.puebla_payment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="button button-primary"
                      style={{ fontSize: "0.75rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      Pagar en Portal de Puebla <ExternalLink size={12} />
                    </a>
                  </div>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.75rem", color: "#7a5814" }}>
                    Pago institucional en línea avalado por la Secretaría de Planeación y Finanzas del Estado de Puebla.
                  </p>
                </div>

                {/* Sello de Validación */}
                <div style={{ fontSize: "0.6875rem", color: "var(--muted)", wordBreak: "break-all", background: "var(--canvas)", padding: "8px 10px", borderRadius: "var(--radius)" }}>
                  <strong>SELLO DIGITAL INSTITUCIONAL SHA-256:</strong>
                  <br />
                  <span style={{ fontFamily: "monospace" }}>{constanciaData.sha256_hash}</span>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> Imprimir Constancia
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setConstanciaData(null);
                    setConstanciaError("");
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal de Datos Bancarios */}
      {showBankModal && (
        <Modal title="Datos Bancarios para Dispersión" onClose={() => setShowBankModal(false)}>
          <form onSubmit={handleBankSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
              Estos datos serán usados por Tesorería para la dispersión de tu beca vía SPEI. Captura exactamente la CLABE de 18 dígitos que recibes en tu estado de cuenta.
            </p>
            {bankMsg && <div className="alert success">{bankMsg}</div>}
            {bankErr && <Alert>{bankErr}</Alert>}
            <div className="field">
              <label>Banco *</label>
              <select
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}
              >
                <option value="">Selecciona tu banco…</option>
                {(banks || []).map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <Field
              label="CLABE Interbancaria (18 dígitos) *"
              required
              maxLength={18}
              value={bankClabe}
              onChange={(e) => setBankClabe(e.target.value.replace(/\D/g, ""))}
              placeholder="18 dígitos numéricos"
              hint="La misma que usas para recibir transferencias SPEI."
            />
            <Field
              label="Nombre del titular de la cuenta *"
              required
              value={bankHolder}
              onChange={(e) => setBankHolder(e.target.value)}
              placeholder="Tal como aparece en tu estado de cuenta"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowBankModal(false)}
              >
                Cancelar
              </button>
              <BusyButton
                busy={savingBank}
                busyText="Guardando…"
                type="submit"
                className="button button-primary"
              >
                <CreditCard size={16} /> Guardar datos bancarios
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}