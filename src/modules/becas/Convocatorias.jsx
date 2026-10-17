import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, BookOpen, Calendar, Award, DollarSign, CheckCircle2 } from "lucide-react";
import { api, date } from "../../shared/api";
import { useAuth } from "../../app/Auth";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";
import { MODALIDADES } from "../../../shared/becas";

export default function Convocatorias() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [modalidadFilter, setModalidadFilter] = useState("");
  const [selectedCall, setSelectedCall] = useState(null);
  const [applyingCall, setApplyingCall] = useState(null);

  // Form state for applying
  const [gpa, setGpa] = useState("9.0");
  const [term, setTerm] = useState("4to Cuatrimestre");
  const [major, setMajor] = useState("Ingeniería en Tecnologías de la Información");
  const [customAnswers, setCustomAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(null);

  const { data: calls, loading, error, refresh } = useAsync(
    () => api("/becas/convocatorias"),
    []
  );

  const filteredCalls = (calls || []).filter((call) => {
    const matchesSearch =
      call.title.toLowerCase().includes(search.toLowerCase()) ||
      call.code.toLowerCase().includes(search.toLowerCase()) ||
      call.description.toLowerCase().includes(search.toLowerCase());
    const matchesMod = modalidadFilter ? call.modalidad === modalidadFilter : true;
    return matchesSearch && matchesMod;
  });

  async function handleApply(e) {
    e.preventDefault();
    setApplyError("");
    setSaving(true);
    try {
      const res = await api("/becas/solicitudes", {
        method: "POST",
        body: {
          call_id: applyingCall.id,
          gpa: parseFloat(gpa),
          academic_term: term,
          major: major,
          custom_answers: customAnswers,
        },
      });
      setApplySuccess(res);
      setApplyingCall(null);
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="filters-bar">
        <div className="filter-group" style={{ flexGrow: 1, maxWidth: "400px" }}>
          <Search size={18} color="var(--muted)" />
          <input
            type="search"
            placeholder="Buscar por título, código o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "6px 10px" }}
          />
        </div>
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
      </div>

      {applySuccess && (
        <div className="alert success" style={{ marginBottom: "16px" }}>
          <CheckCircle2 size={20} />
          <div>
            <strong>¡Solicitud registrada con éxito!</strong>
            <p style={{ margin: "4px 0 0 0" }}>
              Folio asignado: <strong>{applySuccess.folio}</strong>. Puedes dar seguimiento en{" "}
              <Link to="/becas/solicitudes" style={{ textDecoration: "underline", color: "inherit" }}>
                Mis solicitudes
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {loading && <p>Cargando convocatorias vigentes…</p>}
      {error && <Alert>{error}</Alert>}

      {!loading && filteredCalls.length === 0 && (
        <div className="empty">
          <h2>No se encontraron convocatorias</h2>
          <p>Intenta ajustar los criterios de búsqueda o el filtro de modalidad.</p>
        </div>
      )}

      <div className="calls-grid">
        {filteredCalls.map((call) => (
          <article key={call.id} className="call-card">
            <div>
              <span className="call-card-badge">
                {MODALIDADES.find((m) => m.id === call.modalidad)?.name || call.modalidad}
              </span>
              <h3>{call.title}</h3>
              <p className="call-card-desc">{call.description}</p>
              <div className="call-card-details">
                <span>
                  Promedio mín: <strong>{call.min_gpa.toFixed(1)}</strong>
                </span>
                <span>
                  Apoyo: <strong>${call.amount.toLocaleString("es-MX")}</strong>
                </span>
                <span>
                  Cupo: <strong>{call.slots} plazas</strong>
                </span>
                <span>
                  Cierre: <strong>{date(call.end_date)}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedCall(call)}
                style={{ flex: 1 }}
              >
                Ver bases
              </button>
              {user.role === "estudiante" && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setApplyingCall(call);
                    setApplyError("");
                  }}
                  style={{ flex: 1 }}
                >
                  Postularme
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Modal Bases de Convocatoria */}
      {selectedCall && (
        <Modal title={selectedCall.title} onClose={() => setSelectedCall(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p>
              <strong>Código oficial:</strong> {selectedCall.code}
            </p>
            <p>{selectedCall.description}</p>
            <div
              style={{
                background: "var(--canvas)",
                padding: "12px",
                borderRadius: "var(--radius)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <div>
                <strong>Modalidad:</strong>{" "}
                {MODALIDADES.find((m) => m.id === selectedCall.modalidad)?.name || selectedCall.modalidad}
              </div>
              <div>
                <strong>Promedio mínimo:</strong> {selectedCall.min_gpa.toFixed(1)}
              </div>
              <div>
                <strong>Monto del apoyo:</strong> ${selectedCall.amount.toLocaleString("es-MX")} MXN
              </div>
              <div>
                <strong>Cupo institucional:</strong> {selectedCall.slots} becas
              </div>
              <div>
                <strong>Apertura:</strong> {date(selectedCall.start_date)}
              </div>
              <div>
                <strong>Cierre:</strong> {date(selectedCall.end_date)}
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px 0" }}>Documentación obligatoria:</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.875rem" }}>
                <li>Kárdex o constancia oficial de calificaciones con promedio mínimo de {selectedCall.min_gpa}.</li>
                <li>Comprobante de ingresos familiares reciente o carta patronal bajo protesta de decir verdad.</li>
                <li>Comprobante de domicilio reciente (CFE, agua o constancia de radicación, máx 3 meses).</li>
                <li>Identificación oficial vigente (INE o credencial institucional UTO).</li>
              </ul>
            </div>

            {selectedCall.custom_questions?.length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>Preguntas específicas de la convocatoria:</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.875rem" }}>
                  {selectedCall.custom_questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button type="button" className="button button-secondary" onClick={() => setSelectedCall(null)}>
                Cerrar
              </button>
              {user.role === "estudiante" && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setApplyingCall(selectedCall);
                    setSelectedCall(null);
                  }}
                >
                  Iniciar postulación
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Postulación */}
      {applyingCall && (
        <Modal title={`Postulación: ${applyingCall.title}`} onClose={() => setApplyingCall(null)}>
          <form onSubmit={handleApply} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Alert>{applyError}</Alert>

            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              Verifica tus datos académicos. El sistema registrará tu solicitud y calculará el cumplimiento de las reglas mínimas.
            </p>

            <Field
              label="Promedio general cuatrimestre anterior"
              type="number"
              step="0.1"
              min="6.0"
              max="10.0"
              required
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              hint={`La convocatoria exige un mínimo de ${applyingCall.min_gpa.toFixed(1)}.`}
            />

            <Field
              label="Cuatrimestre actual"
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />

            <Field
              label="Carrera / Programa educativo"
              required
              value={major}
              onChange={(e) => setMajor(e.target.value)}
            />

            {applyingCall.custom_questions?.map((q, idx) => (
              <Field
                key={idx}
                label={q}
                value={customAnswers[q] || ""}
                onChange={(e) =>
                  setCustomAnswers({ ...customAnswers, [q]: e.target.value })
                }
              />
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setApplyingCall(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <BusyButton busy={saving} busyText="Enviando…" type="submit" className="button button-primary">
                Confirmar y enviar solicitud
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
