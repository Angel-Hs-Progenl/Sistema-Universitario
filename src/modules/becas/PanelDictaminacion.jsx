import { useState } from "react";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Filter,
  Eye,
  Sliders,
  DollarSign,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { api, date } from "../../shared/api";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";
import { ESTADOS_BECA, MODALIDADES } from "../../../shared/becas";

export default function PanelDictaminacion() {
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [modalidadFilter, setModalidadFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Rule engine run state
  const [ruleResult, setRuleResult] = useState(null);
  const [runningRules, setRunningRules] = useState(false);

  // Dictamen form state
  const [decision, setDecision] = useState("aprobada");
  const [committeeNotes, setCommitteeNotes] = useState("");
  const [score, setScore] = useState("80");
  const [studentPercentage, setStudentPercentage] = useState("53");
  const [savingDictamen, setSavingDictamen] = useState(false);
  const [dictamenSuccess, setDictamenSuccess] = useState("");
  const [dictamenError, setDictamenError] = useState("");

  // Acta formal state
  const [dictamenSession, setDictamenSession] = useState("");
  const [dictamenAgreement, setDictamenAgreement] = useState("");
  const [dictamenDateStr, setDictamenDateStr] = useState("");
  const [savingFormal, setSavingFormal] = useState(false);
  const [formalMsg, setFormalMsg] = useState("");
  const [formalErr, setFormalErr] = useState("");

  // Socioeconomic validation state
  const [socioStatus, setSocioStatus] = useState("validado");
  const [socioNotes, setSocioNotes] = useState("");
  const [socioScoreVal, setSocioScoreVal] = useState("");
  const [savingSocio, setSavingSocio] = useState(false);
  const [socioMsg, setSocioMsg] = useState("");
  const [socioErr, setSocioErr] = useState("");

  const {
    data: applications,
    loading,
    error,
    refresh: refreshApps,
  } = useAsync(
    () =>
      api(
        `/becas/solicitudes?${new URLSearchParams({
          ...(modalidadFilter ? { modalidad: modalidadFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        }).toString()}`
      ),
    [modalidadFilter, statusFilter]
  );

  const {
    data: appDetail,
    loading: detailLoading,
    refresh: refreshDetail,
  } = useAsync(
    () => (selectedAppId ? api(`/becas/solicitudes/${selectedAppId}`) : Promise.resolve(null)),
    [selectedAppId]
  );

  function executeAutoFilter() {
    setRunningRules(true);
    setRuleResult(null);

    // Simulate batch rules evaluation based on current applications
    setTimeout(() => {
      if (!applications) {
        setRunningRules(false);
        return;
      }
      let eligible = 0;
      let discarded = 0;
      const issuesList = [];

      applications.forEach((app) => {
        // Assume default min gpa 8.0 or based on modality
        const minGpa = app.modalidad === "academica" ? 9.0 : 8.0;
        if (app.gpa < minGpa) {
          discarded++;
          issuesList.push({
            folio: app.folio,
            student: app.applicant.name,
            reason: `Promedio ${app.gpa.toFixed(1)} inferior al mínimo requerido de ${minGpa.toFixed(1)}.`,
          });
        } else {
          eligible++;
        }
      });

      setRuleResult({
        total: applications.length,
        eligible,
        discarded,
        issuesList,
      });
      setRunningRules(false);
    }, 400);
  }

  async function handleSocioValidate(e) {
    e.preventDefault();
    if (!appDetail?.applicant?.id) return;
    setSavingSocio(true);
    setSocioErr("");
    setSocioMsg("");
    try {
      await api("/becas/socioeconomico/validar", {
        method: "POST",
        body: {
          user_id: appDetail.applicant.id,
          validation_status: socioStatus,
          validation_notes: socioNotes,
          verified_score: socioScoreVal ? parseFloat(socioScoreVal) : undefined,
        },
      });
      setSocioMsg("Validación socioeconómica registrada exitosamente.");
      refreshDetail();
    } catch (err) {
      setSocioErr(err.message);
    } finally {
      setSavingSocio(false);
    }
  }

  async function handleFormalSubmit(e) {
    e.preventDefault();
    setSavingFormal(true);
    setFormalErr("");
    setFormalMsg("");
    try {
      await api(`/becas/solicitudes/${selectedAppId}/dictamen-formal`, {
        method: "POST",
        body: {
          dictamen_session: dictamenSession,
          dictamen_agreement: dictamenAgreement,
          dictamen_date: dictamenDateStr || undefined,
        },
      });
      setFormalMsg("Acta formal registrada correctamente.");
      refreshDetail();
    } catch (err) {
      setFormalErr(err.message);
    } finally {
      setSavingFormal(false);
    }
  }

  async function handleDictamenSubmit(e) {
    e.preventDefault();
    setSavingDictamen(true);
    setDictamenError("");
    setDictamenSuccess("");

    try {
      await api(`/becas/solicitudes/${selectedAppId}/dictamen`, {
        method: "POST",
        body: {
          decision,
          committee_notes: committeeNotes,
          score: parseFloat(score) || undefined,
          student_percentage: decision === "aprobada" ? parseFloat(studentPercentage) : undefined,
        },
      });
      setDictamenSuccess("Dictamen emitido y guardado exitosamente.");
      refreshApps();
      refreshDetail();
      setTimeout(() => setSelectedAppId(null), 1200);
    } catch (err) {
      setDictamenError(err.message);
    } finally {
      setSavingDictamen(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
            Panel de Dictaminación y Motor de Reglas
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Revisión colegiada de expedientes, filtros automáticos por promedio mínimo y emisión de dictamen.
          </p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={executeAutoFilter}
          disabled={runningRules}
        >
          <Sparkles size={16} /> {runningRules ? "Evaluando reglas…" : "Ejecutar motor de reglas"}
        </button>
      </div>

      {/* Caja de resultados del motor de reglas */}
      {ruleResult && (
        <div className="rules-banner">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "var(--brand)" }}>
              <Sliders size={18} />
              <span>Resultado del filtrado automático:</span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem" }}>
              Analizadas <strong>{ruleResult.total}</strong> solicitudes: <strong>{ruleResult.eligible}</strong> cumplen con el promedio mínimo requerido y <strong>{ruleResult.discarded}</strong> fueron identificadas para descarte por no cubrir el promedio base.
            </p>
          </div>
          {ruleResult.discarded > 0 && (
            <span style={{ background: "var(--error)", color: "white", padding: "4px 8px", borderRadius: "var(--radius)", fontSize: "0.75rem", fontWeight: "700" }}>
              {ruleResult.discarded} Descartadas por reglas
            </span>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filter-group">
          <Filter size={18} color="var(--muted)" />
          <select
            value={modalidadFilter}
            onChange={(e) => setModalidadFilter(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            <option value="">Todas las modalidades</option>
            {MODALIDADES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            <option value="">Todos los estados</option>
            <option value="recibida">Recibida</option>
            <option value="revision">En revisión</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
      </div>

      {loading && <p>Cargando solicitudes para dictamen…</p>}
      {error && <Alert>{error}</Alert>}

      {applications && (
        <div className="audit-table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                <th style={{ padding: "10px 12px" }}>Folio</th>
                <th style={{ padding: "10px 12px" }}>Aspirante</th>
                <th style={{ padding: "10px 12px" }}>Convocatoria</th>
                <th style={{ padding: "10px 12px" }}>Promedio</th>
                <th style={{ padding: "10px 12px" }}>Vulnerabilidad</th>
                <th style={{ padding: "10px 12px" }}>Estado</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Dictaminar</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>{app.folio}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: "600" }}>{app.applicant.name}</div>
                    <small style={{ color: "var(--muted)" }}>{app.applicant.email}</small>
                  </td>
                  <td style={{ padding: "12px" }}>{app.call_title}</td>
                  <td style={{ padding: "12px", fontWeight: "700" }}>{app.gpa.toFixed(1)}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ fontWeight: "600", color: "var(--brand)" }}>
                      {app.socioeconomic_score} pts
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      className={`badge ${
                        app.status === "aprobada"
                          ? "badge-validado"
                          : app.status === "rechazada"
                          ? "badge-rechazado"
                          : "badge-revision"
                      }`}
                    >
                      {ESTADOS_BECA[app.status] || app.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        setSelectedAppId(app.id);
                        setCommitteeNotes(app.committee_notes || "");
                        setDecision(app.status === "recibida" ? "aprobada" : app.status);
                        setDictamenSuccess("");
                        setDictamenError("");
                      }}
                    >
                      Evaluar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Dictamen y Voto Colegiado */}
      {selectedAppId && (
        <Modal
          title={`Dictamen de Expediente: ${appDetail?.folio || "Cargando…"}`}
          onClose={() => setSelectedAppId(null)}
        >
          {detailLoading && <p>Cargando detalles del aspirante…</p>}
          {appDetail && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "var(--canvas)",
                  padding: "16px",
                  borderRadius: "var(--radius)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <small style={{ color: "var(--muted)" }}>Estudiante</small>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "700" }}>{appDetail.applicant.name}</p>
                  <small>{appDetail.applicant.email}</small>
                </div>
                <div>
                  <small style={{ color: "var(--muted)" }}>Convocatoria</small>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "600" }}>{appDetail.call.title}</p>
                  <small>Promedio mín. requerido: {appDetail.call.min_gpa.toFixed(1)}</small>
                </div>
                <div>
                  <small style={{ color: "var(--muted)" }}>Promedio del aspirante</small>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: appDetail.gpa >= appDetail.call.min_gpa ? "var(--green)" : "var(--error)",
                    }}
                  >
                    {appDetail.gpa.toFixed(1)}
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--muted)" }}>Vulnerabilidad declarada</small>
                  <p style={{ margin: "2px 0 0 0", fontSize: "1.25rem", fontWeight: "700", color: "var(--brand)" }}>
                    {appDetail.socioeconomic_score} pts
                  </p>
                </div>
              </div>

              {/* Documentos probatorios del aspirante */}
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Documentos adjuntos al expediente:</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {appDetail.documents.length === 0 && (
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                      El aspirante no ha subido comprobantes aún.
                    </p>
                  )}
                  {appDetail.documents.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        border: "1px solid var(--line)",
                        borderRadius: "var(--radius)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={16} color="var(--brand)" />
                        <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>{d.name}</span>
                      </div>
                      <a
                        href={`/api/v1/becas/solicitudes/${appDetail.id}/documentos/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="button button-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      >
                        Revisar archivo
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estudio Socioeconómico y Validación */}
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: "16px",
                  background: "var(--surface)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <h4 style={{ margin: 0, color: "var(--brand)" }}>Estudio Socioeconómico del Aspirante</h4>
                  {appDetail.socioeconomic && (
                    <span className={`badge ${appDetail.socioeconomic.validation_status === "validado" ? "badge-validado" : appDetail.socioeconomic.validation_status === "observado" ? "badge-rechazado" : "badge-pendiente"}`}>
                      {appDetail.socioeconomic.validation_status === "validado" ? "Perfil Validado" : appDetail.socioeconomic.validation_status === "observado" ? "Con Observaciones" : "Pendiente de Validación"}
                    </span>
                  )}
                </div>

                {appDetail.socioeconomic ? (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "14px", background: "var(--canvas)", padding: "12px", borderRadius: "var(--radius)" }}>
                      <div>
                        <small style={{ color: "var(--muted)" }}>Ingreso Familiar</small>
                        <p style={{ margin: "2px 0 0 0", fontWeight: "700" }}>${appDetail.socioeconomic.monthly_income?.toLocaleString("es-MX")} MXN</p>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)" }}>Gastos Familiares</small>
                        <p style={{ margin: "2px 0 0 0", fontWeight: "700" }}>${appDetail.socioeconomic.monthly_expenses?.toLocaleString("es-MX")} MXN</p>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)" }}>Dependientes</small>
                        <p style={{ margin: "2px 0 0 0", fontWeight: "700" }}>{appDetail.socioeconomic.dependents_count} personas</p>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)" }}>Tipo de Vivienda</small>
                        <p style={{ margin: "2px 0 0 0", fontWeight: "700", textTransform: "capitalize" }}>{appDetail.socioeconomic.housing_type}</p>
                      </div>
                      <div>
                        <small style={{ color: "var(--muted)" }}>Score Vulnerabilidad</small>
                        <p style={{ margin: "2px 0 0 0", fontWeight: "700", color: "var(--brand)" }}>{appDetail.socioeconomic.verified_score || appDetail.socioeconomic.vulnerability_score} pts</p>
                      </div>
                    </div>

                    {appDetail.socioeconomic.validation_notes && (
                      <p style={{ margin: "0 0 12px 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                        <strong>Notas previas de Trabajo Social:</strong> {appDetail.socioeconomic.validation_notes}
                      </p>
                    )}

                    <form onSubmit={handleSocioValidate} style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px dashed var(--line)", paddingTop: "12px" }}>
                      <strong style={{ fontSize: "0.875rem" }}>Validar estudio socioeconómico (Trabajo Social):</strong>
                      {socioMsg && <div className="alert success">{socioMsg}</div>}
                      {socioErr && <Alert>{socioErr}</Alert>}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className="field">
                          <label>Dictamen socioeconómico</label>
                          <select value={socioStatus} onChange={(e) => setSocioStatus(e.target.value)} style={{ padding: "8px" }}>
                            <option value="validado">Validar perfil (Conforme)</option>
                            <option value="observado">Marcar con observaciones (Inconforme)</option>
                          </select>
                        </div>
                        <Field
                          label="Puntaje ratificado (opcional)"
                          type="number"
                          min="10"
                          max="100"
                          placeholder={String(appDetail.socioeconomic.vulnerability_score || 50)}
                          value={socioScoreVal}
                          onChange={(e) => setSocioScoreVal(e.target.value)}
                        />
                      </div>
                      <Field
                        as="textarea"
                        rows={2}
                        label="Observaciones de Trabajo Social"
                        placeholder="Comentarios sobre comprobantes de ingresos, dependientes o situación de vulnerabilidad…"
                        value={socioNotes}
                        onChange={(e) => setSocioNotes(e.target.value)}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <BusyButton busy={savingSocio} busyText="Validando…" type="submit" className="button button-secondary" style={{ fontSize: "0.8125rem" }}>
                          Guardar validación socioeconómica
                        </BusyButton>
                      </div>
                    </form>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
                    El aspirante aún no completa su estudio socioeconómico digital en plataforma.
                  </p>
                )}
              </div>

              {/* Formulario de Dictamen */}
              <form onSubmit={handleDictamenSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ margin: "8px 0 0 0", color: "var(--brand)" }}>Resolución del Comité Evaluador</h4>
                {dictamenSuccess && <div className="alert success">{dictamenSuccess}</div>}
                {dictamenError && <Alert>{dictamenError}</Alert>}

                <div className="field">
                  <label htmlFor="decisionSelect">Decisión de dictaminación</label>
                  <select
                    id="decisionSelect"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    style={{ padding: "8px", fontWeight: "600" }}
                  >
                    <option value="aprobada">Aprobar Beca (Favorable)</option>
                    <option value="rechazada">Rechazar Solicitud (No Favorable)</option>
                    <option value="revision">Mantener En Revisión / Solicitar corrección</option>
                  </select>
                </div>

                {decision === "aprobada" && (
                  <div
                    style={{
                      background: "var(--canvas)",
                      border: "1px solid var(--gold)",
                      padding: "12px",
                      borderRadius: "var(--radius)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Field
                        label="Porcentaje que pagará el estudiante (%) *"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        required
                        value={studentPercentage}
                        onChange={(e) => setStudentPercentage(e.target.value)}
                        hint="Ej. 53% o 65% según necesidad económica."
                      />
                      <div>
                        <small style={{ color: "var(--muted)" }}>Beca institucional asignada</small>
                        <p style={{ margin: "6px 0 0 0", fontSize: "1.25rem", fontWeight: "700", color: "var(--green)" }}>
                          {100 - (parseFloat(studentPercentage) || 0)}% de Beca
                        </p>
                        <small style={{ color: "var(--muted)" }}>Descuento sobre cuota ordinaria</small>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--ink)" }}>
                      💡 De una cuota de <strong>$1,850.00 MXN</strong>, el estudiante pagará <strong>${((1850 * (parseFloat(studentPercentage) || 0)) / 100).toFixed(2)} MXN</strong> con referencia generada por Tesorería para <em>Pagos en Línea del Gobierno de Puebla</em>.
                    </p>
                  </div>
                )}

                <Field
                  label="Puntaje socioeconómico ratificado por el comité"
                  type="number"
                  min="10"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />

                <Field
                  as="textarea"
                  rows={3}
                  label="Observaciones y fundamentación del dictamen (serán notificadas al aspirante)"
                  required
                  value={committeeNotes}
                  onChange={(e) => setCommitteeNotes(e.target.value)}
                  placeholder="Fundamentar el dictamen de acuerdo con el cumplimiento de promedio y los criterios de la convocatoria institucional…"
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedAppId(null)}
                    disabled={savingDictamen}
                  >
                    Cerrar
                  </button>
                  <BusyButton
                    busy={savingDictamen}
                    busyText="Registrando dictamen…"
                    type="submit"
                    className="button button-primary"
                  >
                    Emitir dictamen oficial
                  </BusyButton>
                </div>
              </form>

              {/* Acta Formal de Sesión */}
              {appDetail.status === "aprobada" && (
                <div
                  style={{
                    borderTop: "2px solid var(--line)",
                    paddingTop: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--brand)" }}>
                    <ClipboardList size={18} />
                    <h4 style={{ margin: 0 }}>Registro de Acta Formal de Sesión</h4>
                  </div>
                  {appDetail.dictamen_session && (
                    <div
                      style={{
                        background: "var(--canvas)",
                        padding: "10px 14px",
                        borderRadius: "var(--radius)",
                        marginBottom: "12px",
                        fontSize: "0.875rem",
                      }}
                    >
                      <strong>Sesión registrada:</strong> {appDetail.dictamen_session}
                      {appDetail.dictamen_agreement && (
                        <span style={{ marginLeft: "12px" }}>
                          | <strong>Acuerdo:</strong> {appDetail.dictamen_agreement}
                        </span>
                      )}
                    </div>
                  )}
                  <form onSubmit={handleFormalSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {formalMsg && <div className="alert success">{formalMsg}</div>}
                    {formalErr && <Alert>{formalErr}</Alert>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Field
                        label="Número o nombre de sesión"
                        required
                        value={dictamenSession}
                        onChange={(e) => setDictamenSession(e.target.value)}
                        placeholder="Ej. Sesión Ordinaria 03/2026"
                        hint="Identificador del acta de sesión de Comité."
                      />
                      <Field
                        label="Número de acuerdo"
                        required
                        value={dictamenAgreement}
                        onChange={(e) => setDictamenAgreement(e.target.value)}
                        placeholder="Ej. Acuerdo 12-B"
                      />
                    </div>
                    <Field
                      label="Fecha de sesión"
                      type="date"
                      value={dictamenDateStr}
                      onChange={(e) => setDictamenDateStr(e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <BusyButton
                        busy={savingFormal}
                        busyText="Guardando acta…"
                        type="submit"
                        className="button button-primary"
                      >
                        <ClipboardList size={16} /> Registrar acta formal
                      </BusyButton>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
