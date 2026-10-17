import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Settings, Calendar, DollarSign, Award, Users } from "lucide-react";
import { api, date } from "../../shared/api";
import { Modal, Field, BusyButton, Alert, useAsync } from "../../shared/ui";
import { MODALIDADES } from "../../../shared/becas";

export default function AdminConvocatorias() {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [modalidad, setModalidad] = useState("academica");
  const [description, setDescription] = useState("");
  const [minGpa, setMinGpa] = useState("8.5");
  const [amount, setAmount] = useState("3500");
  const [slots, setSlots] = useState("40");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [questions, setQuestions] = useState([
    "¿Participas en algún proyecto institucional o comunitario?",
  ]);
  const [newQuestionText, setNewQuestionText] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: calls, loading, error, refresh } = useAsync(
    () => api("/becas/convocatorias"),
    []
  );

  function addQuestion() {
    if (newQuestionText.trim()) {
      setQuestions([...questions, newQuestionText.trim()]);
      setNewQuestionText("");
    }
  }

  function removeQuestion(index) {
    setQuestions(questions.filter((_, idx) => idx !== index));
  }

  async function handleCreateCall(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api("/becas/convocatorias", {
        method: "POST",
        body: {
          title,
          modalidad,
          description,
          min_gpa: parseFloat(minGpa),
          amount: parseFloat(amount),
          slots: parseInt(slots, 10),
          start_date: `${startDate}T00:00:00Z`,
          end_date: `${endDate}T23:59:59Z`,
          custom_questions: questions,
        },
      });

      setSuccessMsg(`Convocatoria ${res.code} publicada con éxito.`);
      setShowModal(false);
      // Reset form
      setTitle("");
      setDescription("");
      refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.25rem", color: "var(--brand)" }}>
            Administración y Diseño de Convocatorias
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
            Configuración de reglas institucionales, cupos, fechas y formularios dinámicos con preguntas personalizadas.
          </p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            setShowModal(true);
            setErrorMsg("");
            setSuccessMsg("");
          }}
        >
          <Plus size={16} /> Nueva convocatoria
        </button>
      </div>

      {successMsg && (
        <div className="alert success" style={{ marginBottom: "16px" }}>
          <CheckCircle2 size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {loading && <p>Cargando convocatorias…</p>}
      {error && <Alert>{error}</Alert>}

      {calls && (
        <div className="audit-table-wrapper">
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                <th style={{ padding: "10px 12px" }}>Código</th>
                <th style={{ padding: "10px 12px" }}>Título</th>
                <th style={{ padding: "10px 12px" }}>Modalidad</th>
                <th style={{ padding: "10px 12px" }}>Promedio mín.</th>
                <th style={{ padding: "10px 12px" }}>Monto</th>
                <th style={{ padding: "10px 12px" }}>Cupo</th>
                <th style={{ padding: "10px 12px" }}>Periodo</th>
                <th style={{ padding: "10px 12px" }}>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: "700" }}>{call.code}</td>
                  <td style={{ padding: "12px", fontWeight: "600" }}>{call.title}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {MODALIDADES.find((m) => m.id === call.modalidad)?.name || call.modalidad}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontWeight: "600" }}>{call.min_gpa.toFixed(1)}</td>
                  <td style={{ padding: "12px", color: "var(--brand)", fontWeight: "600" }}>
                    ${call.amount.toLocaleString("es-MX")}
                  </td>
                  <td style={{ padding: "12px" }}>{call.slots} plazas</td>
                  <td style={{ padding: "12px", fontSize: "0.8125rem" }}>
                    {date(call.start_date)} - {date(call.end_date)}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span className="badge badge-validado">Activa</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Creador de Convocatorias y Gestor de Formularios */}
      {showModal && (
        <Modal title="Nueva Convocatoria de Becas UTO" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateCall} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Alert>{errorMsg}</Alert>

            <Field
              label="Título de la convocatoria"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Beca de Movilidad y Transporte Otoño 2026"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="field">
                <label htmlFor="modalidadSelect">Modalidad de beca</label>
                <select
                  id="modalidadSelect"
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  style={{ padding: "8px" }}
                >
                  {MODALIDADES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="Promedio mínimo requerido"
                type="number"
                step="0.1"
                min="6.0"
                max="10.0"
                required
                value={minGpa}
                onChange={(e) => setMinGpa(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field
                label="Monto del apoyo ($ MXN)"
                type="number"
                min="500"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Field
                label="Cupo disponible (plazas)"
                type="number"
                min="1"
                required
                value={slots}
                onChange={(e) => setSlots(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field
                label="Fecha de apertura"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Field
                label="Fecha de cierre"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Field
              as="textarea"
              rows={2}
              label="Descripción institucional y objetivos de la beca"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica a quién está dirigida y el propósito del apoyo institucional…"
            />

            {/* Gestor de Formularios: Preguntas Personalizadas */}
            <div
              style={{
                border: "1px solid var(--line)",
                padding: "16px",
                borderRadius: "var(--radius)",
                background: "var(--canvas)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "var(--brand)" }}>
                <Settings size={18} />
                <h4 style={{ margin: 0, fontSize: "0.9375rem" }}>
                  Gestor de Formularios: Preguntas personalizadas
                </h4>
              </div>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
                Diseña reactivos específicos que los aspirantes deberán contestar al postularse a esta convocatoria.
              </p>

              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Escribe una pregunta para el formulario de postulación…"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  style={{ flexGrow: 1, padding: "8px" }}
                />
                <button type="button" className="button button-secondary" onClick={addQuestion}>
                  Agregar pregunta
                </button>
              </div>

              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.875rem" }}>
                {questions.map((q, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", padding: "2px 6px" }}
                        aria-label="Eliminar pregunta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <BusyButton busy={saving} busyText="Publicando…" type="submit" className="button button-primary">
                Publicar convocatoria
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
