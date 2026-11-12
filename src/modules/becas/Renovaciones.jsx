import { useState } from "react";
import { RefreshCw, CheckCircle, Award, Calendar, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";

const RENEWAL_STATUS_BADGE = {
  solicitada: { cls: "badge-revision", label: "Solicitada" },
  aprobada_renovacion: { cls: "badge-validado", label: "Aprobada" },
  rechazada_renovacion: { cls: "badge-rechazado", label: "Rechazada" },
};

export default function Renovaciones() {
  const { user } = useAuth();
  const [selectedOriginalApp, setSelectedOriginalApp] = useState("");
  const [currentGpa, setCurrentGpa] = useState("9.2");
  const [academicTerm, setAcademicTerm] = useState("5to Cuatrimestre");
  const [notes, setNotes] = useState("Mantuve regularidad académica y promedio superior a 9.0.");
  const [confirmed, setConfirmed] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Staff resolve state
  const [resolveRenewalId, setResolveRenewalId] = useState(null);
  const [resolveDecision, setResolveDecision] = useState("aprobada_renovacion");
  const [resolveNotes, setResolveNotes] = useState("");
  const [savingResolve, setSavingResolve] = useState(false);
  const [resolveMsg, setResolveMsg] = useState("");
  const [resolveErr, setResolveErr] = useState("");

  const { data: renewals, loading: loadingRenewals, refresh: refreshRenewals } = useAsync(
    () => api("/becas/renovaciones"),
    []
  );

  const { data: myApps } = useAsync(
    () => api("/becas/solicitudes"),
    []
  );

  const approvedApps = (myApps || []).filter(
    (app) => app.status === "aprobada" || app.status === "renovada"
  );

  const pendingRenewals = (renewals || []).filter((r) => r.status === "solicitada");

  async function handleResolve(e) {
    e.preventDefault();
    setSavingResolve(true);
    setResolveErr("");
    setResolveMsg("");
    try {
      await api(`/becas/renovaciones/${resolveRenewalId}/resolver`, {
        method: "POST",
        body: { decision: resolveDecision, resolution_notes: resolveNotes },
      });
      setResolveMsg("Resolución registrada correctamente.");
      refreshRenewals();
      setTimeout(() => { setResolveRenewalId(null); setResolveMsg(""); }, 1500);
    } catch (err) {
      setResolveErr(err.message);
    } finally {
      setSavingResolve(false);
    }
  }

  async function handleRenewal(e) {
    e.preventDefault();
    if (!confirmed) {
      setErrorMsg("Debes confirmar la declaración bajo protesta para continuar.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api("/becas/renovaciones", {
        method: "POST",
        body: {
          original_application_id: parseInt(selectedOriginalApp, 10),
          current_gpa: parseFloat(currentGpa),
          academic_term: academicTerm,
          notes,
        },
      });
      setSuccessMsg("Tu solicitud de renovación ha sido enviada al Comité de Becas.");
      setSelectedOriginalApp("");
      setConfirmed(false);
      refreshRenewals();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
          Renovación Simplificada de Becas
        </h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
          Proceso ágil para becarios activos: extiende tu apoyo cuatrimestral confirmando tu promedio y continuidad sin reiniciar todo tu expediente.
        </p>
      </header>

      {successMsg && (
        <div className="alert success" style={{ marginBottom: "16px" }}>
          <CheckCircle size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {user.role === "estudiante" && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            padding: "20px",
            borderRadius: "var(--radius)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--brand)" }}>
            <RefreshCw size={20} />
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Solicitar extensión de beca</h3>
          </div>

          {approvedApps.length === 0 ? (
            <div style={{ background: "var(--canvas)", padding: "16px", borderRadius: "var(--radius)" }}>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>
                Actualmente no tienes becas con estatus <strong>Aprobada</strong> que sean candidatas a renovación inmediata. Si acabas de postularte, espera a la publicación de resultados.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRenewal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Alert>{errorMsg}</Alert>

              <div className="field">
                <label htmlFor="selectApp">Beca activa a renovar *</label>
                <select
                  id="selectApp"
                  required
                  value={selectedOriginalApp}
                  onChange={(e) => setSelectedOriginalApp(e.target.value)}
                  style={{ padding: "8px" }}
                >
                  <option value="">Selecciona tu beca aprobada…</option>
                  {approvedApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.folio} - {a.call_title} (${a.amount?.toLocaleString("es-MX")} MXN)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field
                  label="Promedio obtenido en el cuatrimestre que concluye"
                  type="number"
                  step="0.1"
                  min="6.0"
                  max="10.0"
                  required
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(e.target.value)}
                  hint="Debe ser igual o superior al promedio mínimo de la convocatoria original."
                />

                <Field
                  label="Cuatrimestre al que te reinscribes"
                  required
                  value={academicTerm}
                  onChange={(e) => setAcademicTerm(e.target.value)}
                />
              </div>

              <Field
                as="textarea"
                rows={2}
                label="Notas sobre tu avance o cumplimiento de compromisos"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  background: "var(--canvas)",
                  padding: "12px",
                  borderRadius: "var(--radius)",
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                <span>
                  Declaro bajo protesta de decir verdad que continúo inscrito como alumno regular en la UT de Oriental y que mi situación socioeconómica no ha sufrido alteraciones sustanciales que extingan la necesidad del apoyo.
                </span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <BusyButton busy={saving} busyText="Enviando renovación…" type="submit" className="button button-primary">
                  Enviar solicitud de renovación
                </BusyButton>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Historial de renovaciones */}
      <section>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1.125rem", color: "var(--brand)" }}>
          Historial de renovaciones
        </h3>

        {loadingRenewals && <p>Cargando renovaciones…</p>}

        {renewals && (
          <div className="audit-table-wrapper">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                  <th style={{ padding: "10px 12px" }}>Beca origen</th>
                  <th style={{ padding: "10px 12px" }}>Estudiante</th>
                  <th style={{ padding: "10px 12px" }}>Convocatoria</th>
                  <th style={{ padding: "10px 12px" }}>Promedio reportado</th>
                  <th style={{ padding: "10px 12px" }}>Cuatrimestre</th>
                  <th style={{ padding: "10px 12px" }}>Estado</th>
                  <th style={{ padding: "10px 12px" }}>Fecha</th>
                  {user.role !== "estudiante" && <th style={{ padding: "10px 12px", textAlign: "right" }}>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {renewals.length === 0 ? (
                  <tr>
                    <td colSpan={user.role !== "estudiante" ? 8 : 7} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                      No se han registrado solicitudes de renovación en este periodo.
                    </td>
                  </tr>
                ) : (
                  renewals.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px", fontWeight: "700" }}>{r.application_folio}</td>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{r.student_name}</td>
                      <td style={{ padding: "12px", fontSize: "0.875rem" }}>{r.call_title}</td>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{r.current_gpa.toFixed(1)}</td>
                      <td style={{ padding: "12px" }}>{r.academic_term}</td>
                      <td style={{ padding: "12px" }}>
                        <span className={`badge ${RENEWAL_STATUS_BADGE[r.status]?.cls || "badge-revision"}`}>
                          {RENEWAL_STATUS_BADGE[r.status]?.label || r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.8125rem" }}>{date(r.created_at)}</td>
                      {user.role !== "estudiante" && (
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          {r.status === "solicitada" && (
                            <button
                              type="button"
                              className="button button-primary"
                              style={{ fontSize: "0.8125rem" }}
                              onClick={() => {
                                setResolveRenewalId(r.id);
                                setResolveDecision("aprobada_renovacion");
                                setResolveNotes("");
                                setResolveMsg("");
                                setResolveErr("");
                              }}
                            >
                              Resolver
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Resolución de Renovación (staff) */}
      {resolveRenewalId && (
        <Modal title="Resolver Solicitud de Renovación" onClose={() => setResolveRenewalId(null)}>
          <form onSubmit={handleResolve} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
              Emite la resolución de esta solicitud de renovación. La decisión quedará registrada y el estudiante podrá consultarla en su expediente.
            </p>
            {resolveMsg && <div className="alert success">{resolveMsg}</div>}
            {resolveErr && <Alert>{resolveErr}</Alert>}
            <div className="field">
              <label>Decisión *</label>
              <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 14px", border: `2px solid ${resolveDecision === "aprobada_renovacion" ? "var(--green)" : "var(--line)"}`, borderRadius: "var(--radius)", background: resolveDecision === "aprobada_renovacion" ? "#f0faf0" : "var(--surface)" }}>
                  <input
                    type="radio"
                    name="resolveDecision"
                    value="aprobada_renovacion"
                    checked={resolveDecision === "aprobada_renovacion"}
                    onChange={(e) => setResolveDecision(e.target.value)}
                  />
                  <ThumbsUp size={16} color="var(--green)" /> Aprobar renovación
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "8px 14px", border: `2px solid ${resolveDecision === "rechazada_renovacion" ? "var(--error)" : "var(--line)"}`, borderRadius: "var(--radius)", background: resolveDecision === "rechazada_renovacion" ? "#fff5f5" : "var(--surface)" }}>
                  <input
                    type="radio"
                    name="resolveDecision"
                    value="rechazada_renovacion"
                    checked={resolveDecision === "rechazada_renovacion"}
                    onChange={(e) => setResolveDecision(e.target.value)}
                  />
                  <ThumbsDown size={16} color="var(--error)" /> Rechazar renovación
                </label>
              </div>
            </div>
            <Field
              as="textarea"
              rows={3}
              label="Justificación de la resolución *"
              required
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Fundamentar la decisión con base en los criterios de la convocatoria…"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" className="button button-secondary" onClick={() => setResolveRenewalId(null)}>
                Cancelar
              </button>
              <BusyButton
                busy={savingResolve}
                busyText="Registrando resolución…"
                type="submit"
                className="button button-primary"
              >
                Emitir resolución
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
