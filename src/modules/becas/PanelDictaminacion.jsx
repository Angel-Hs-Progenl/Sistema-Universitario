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
  const [savingDictamen, setSavingDictamen] = useState(false);
  const [dictamenSuccess, setDictamenSuccess] = useState("");
  const [dictamenError, setDictamenError] = useState("");

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
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
