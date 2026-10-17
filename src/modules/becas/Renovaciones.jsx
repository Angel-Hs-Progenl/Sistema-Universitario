import { useState } from "react";
import { RefreshCw, CheckCircle, Award, Calendar, AlertCircle } from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";

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
                </tr>
              </thead>
              <tbody>
                {renewals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
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
                        <span className="badge badge-revision">{r.status}</span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.8125rem" }}>{date(r.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
