import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Play, CheckCircle2, BarChart2, Plus, Users } from "lucide-react";
import { api, date } from "../../shared/api";
import { Modal, BusyButton, Alert } from "../../shared/ui";
import { Heading, Status, useMutation, MutationState } from "../../shared/Work";
import "./styles.css";

const BASE = "/autoevaluacion";

export default function Admin() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    title: "",
    questionnaire_id: "",
    subject: "",
    group_name: "",
    partial: "",
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Estado para el modal de asignación de estudiantes
  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [alreadyAssignedIds, setAlreadyAssignedIds] = useState(new Set());
  const [assigningBusy, setAssigningBusy] = useState(false);
  const [assignModalError, setAssignModalError] = useState("");

  // Estado para confirmación de cambio de estado (abrir / cerrar)
  const [transitionTarget, setTransitionTarget] = useState(null);
  const [transitionNewStatus, setTransitionNewStatus] = useState("");
  const [transitioningBusy, setTransitioningBusy] = useState(false);

  // Cargar datos iniciales
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [questionnaireData, evaluationData, studentsData] = await Promise.all([
        api(`${BASE}/cuestionarios`),
        api(`${BASE}/evaluaciones`),
        api(`${BASE}/estudiantes`),
      ]);

      setQuestionnaires(questionnaireData);
      setEvaluations(evaluationData);
      setStudents(studentsData);
    } catch (err) {
      setError(err.message || "No fue posible cargar la información.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // Crear una nueva evaluación en borrador
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.questionnaire_id) {
      setError("Selecciona un cuestionario.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError("Completa las fechas de inicio y cierre.");
      return;
    }

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Las fechas ingresadas no son válidas.");
      return;
    }

    if (endDate <= startDate) {
      setError("La fecha de cierre debe ser posterior a la de inicio.");
      return;
    }

    if (endDate <= new Date()) {
      setError("La fecha de cierre debe estar en el futuro.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      questionnaire_id: Number(form.questionnaire_id),
      subject: form.subject.trim(),
      group_name: form.group_name.trim(),
      partial: form.partial.trim(),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    };

    setSaving(true);

    try {
      await api(`${BASE}/evaluaciones`, {
        method: "POST",
        body: payload,
      });

      setMessage("Evaluación creada correctamente en estado borrador.");
      setForm({
        title: "",
        questionnaire_id: "",
        subject: "",
        group_name: "",
        partial: "",
        start_date: "",
        end_date: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "No fue posible crear la evaluación.");
    } finally {
      setSaving(false);
    }
  }

  // Abrir modal para asignar estudiantes
  async function openAssignModal(evaluation) {
    setAssignTarget(evaluation);
    setAssignModalError("");
    setSelectedStudentIds([]);

    try {
      const currentAssignments = await api(`${BASE}/evaluaciones/${evaluation.id}/asignaciones`);
      const existing = new Set(currentAssignments.map((a) => a.student_id));
      setAlreadyAssignedIds(existing);
    } catch (err) {
      setAlreadyAssignedIds(new Set());
    }
  }

  // Alternar selección de un estudiante en el modal
  function toggleStudentSelection(studentId) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  // Seleccionar todos los no asignados
  function selectAllAvailable() {
    const available = students
      .filter((s) => !alreadyAssignedIds.has(s.id))
      .map((s) => s.id);
    setSelectedStudentIds(available);
  }

  // Guardar asignaciones de estudiantes
  async function handleSaveAssignments() {
    if (!assignTarget || selectedStudentIds.length === 0) return;

    setAssigningBusy(true);
    setAssignModalError("");

    try {
      await api(`${BASE}/evaluaciones/${assignTarget.id}/asignaciones`, {
        method: "POST",
        body: { student_ids: selectedStudentIds },
      });

      setMessage(`Se asignaron ${selectedStudentIds.length} estudiantes a "${assignTarget.title}".`);
      setAssignTarget(null);
      setSelectedStudentIds([]);
      await loadData();
    } catch (err) {
      setAssignModalError(err.message || "No fue posible registrar las asignaciones.");
    } finally {
      setAssigningBusy(false);
    }
  }

  // Iniciar confirmación de cambio de estado
  function confirmTransition(evaluation, targetStatus) {
    setTransitionTarget(evaluation);
    setTransitionNewStatus(targetStatus);
  }

  // Ejecutar cambio de estado en el backend
  async function handleExecuteTransition() {
    if (!transitionTarget || !transitionNewStatus) return;

    setTransitioningBusy(true);
    setError("");

    try {
      await api(`${BASE}/evaluaciones/${transitionTarget.id}/estado`, {
        method: "POST",
        body: {
          status: transitionNewStatus,
          version: transitionTarget.version,
        },
      });

      setMessage(`Evaluación "${transitionTarget.title}" marcada como ${transitionNewStatus}.`);
      setTransitionTarget(null);
      setTransitionNewStatus("");
      await loadData();
    } catch (err) {
      setError(err.message || "No fue posible cambiar el estado de la evaluación.");
      setTransitionTarget(null);
    } finally {
      setTransitioningBusy(false);
    }
  }

  return (
    <section className="self-evaluation-page">
      <Heading
        eyebrow="Autoevaluación / Administración"
        title="Administración de autoevaluaciones"
      >
        Configura evaluaciones por asignatura, grupo y parcial, asigna estudiantes y supervisa la participación.
      </Heading>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      {/* FORMULARIO PARA CREAR EVALUACIONES */}
      <div className="self-evaluation-section">
        <h2>Crear nueva evaluación</h2>

        <form onSubmit={handleSubmit}>
          <div className="self-evaluation-field">
            <label htmlFor="evaluation-title">Nombre de la evaluación *</label>
            <input
              id="evaluation-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              minLength={3}
              maxLength={150}
              placeholder="Ej. Autoevaluación del primer parcial"
              required
            />
          </div>

          <div className="self-evaluation-field">
            <label htmlFor="evaluation-questionnaire">Cuestionario *</label>
            <select
              id="evaluation-questionnaire"
              name="questionnaire_id"
              value={form.questionnaire_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un cuestionario</option>
              {questionnaires.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} — Versión {q.version}
                </option>
              ))}
            </select>

            {questionnaires.length === 0 && !loading && (
              <p className="self-evaluation-help">
                Primero debes registrar un cuestionario en la pestaña{" "}
                <Link to={`${BASE}/cuestionarios`}>Cuestionarios</Link>.
              </p>
            )}
          </div>

          <div className="self-evaluation-inline-fields">
            <div className="self-evaluation-field">
              <label htmlFor="evaluation-subject">Materia / Asignatura *</label>
              <input
                id="evaluation-subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                minLength={3}
                maxLength={150}
                placeholder="Ej. Programación web"
                required
              />
            </div>

            <div className="self-evaluation-field">
              <label htmlFor="evaluation-group">Grupo *</label>
              <input
                id="evaluation-group"
                name="group_name"
                type="text"
                value={form.group_name}
                onChange={handleChange}
                maxLength={80}
                placeholder="Ej. 5A"
                required
              />
            </div>

            <div className="self-evaluation-field">
              <label htmlFor="evaluation-partial">Parcial *</label>
              <input
                id="evaluation-partial"
                name="partial"
                type="text"
                value={form.partial}
                onChange={handleChange}
                maxLength={50}
                placeholder="Ej. Primer parcial"
                required
              />
            </div>
          </div>

          <div className="self-evaluation-inline-fields">
            <div className="self-evaluation-field">
              <label htmlFor="evaluation-start">Fecha y hora de inicio *</label>
              <input
                id="evaluation-start"
                name="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="self-evaluation-field">
              <label htmlFor="evaluation-end">Fecha y hora de cierre *</label>
              <input
                id="evaluation-end"
                name="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="button button-primary"
            disabled={saving || loading || questionnaires.length === 0}
          >
            {saving ? "Creando evaluación…" : "Crear evaluación"}
          </button>
        </form>
      </div>

      {/* LISTADO DE EVALUACIONES */}
      <div className="self-evaluation-section">
        <h2>Evaluaciones registradas</h2>

        {loading ? (
          <p className="work-loading">Cargando evaluaciones…</p>
        ) : evaluations.length === 0 ? (
          <p>Aún no hay evaluaciones registradas en el sistema.</p>
        ) : (
          <div className="self-evaluation-admin-list">
            {evaluations.map((ev) => (
              <article className="self-evaluation-admin-card" key={ev.id}>
                <div className="self-evaluation-admin-info">
                  <div className="self-evaluation-admin-header">
                    <span className="record-code">
                      {ev.subject} · {ev.group_name} · {ev.partial}
                    </span>
                    <Status
                      value={
                        ev.status === "abierta"
                          ? "aprobada"
                          : ev.status === "cerrada"
                            ? "concluido"
                            : "borrador"
                      }
                    >
                      {ev.status === "abierta"
                        ? "Abierta"
                        : ev.status === "cerrada"
                          ? "Cerrada"
                          : "Borrador"}
                    </Status>
                  </div>

                  <h3>{ev.title}</h3>

                  <dl className="work-meta">
                    <div>
                      <dt>Asignados</dt>
                      <dd><strong>{ev.assigned_count}</strong></dd>
                    </div>
                    <div>
                      <dt>Respondidos</dt>
                      <dd><strong>{ev.submitted_count}</strong></dd>
                    </div>
                    <div>
                      <dt>Pendientes</dt>
                      <dd><strong>{ev.pending_count}</strong></dd>
                    </div>
                    <div>
                      <dt>Periodo</dt>
                      <dd>{date(ev.start_date, true)} al {date(ev.end_date, true)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="self-evaluation-admin-actions">
                  {/* ACCIONES SEGÚN EL ESTADO */}
                  {ev.status === "borrador" && (
                    <>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => openAssignModal(ev)}
                      >
                        <UserPlus size={16} /> Asignar estudiantes ({ev.assigned_count})
                      </button>

                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => confirmTransition(ev, "abierta")}
                        disabled={ev.assigned_count === 0}
                        title={
                          ev.assigned_count === 0
                            ? "Debes asignar estudiantes antes de abrir la evaluación"
                            : "Abrir recepción de respuestas"
                        }
                      >
                        <Play size={16} /> Abrir evaluación
                      </button>
                    </>
                  )}

                  {ev.status === "abierta" && (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => confirmTransition(ev, "cerrada")}
                    >
                      <CheckCircle2 size={16} /> Cerrar evaluación
                    </button>
                  )}

                  <Link
                    to={`${BASE}/resultados/${ev.id}`}
                    className="button button-secondary"
                  >
                    <BarChart2 size={16} /> Ver resultados
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARA ASIGNAR ESTUDIANTES */}
      {assignTarget && (
        <Modal
          title={`Asignar estudiantes a "${assignTarget.title}"`}
          onClose={() => setAssignTarget(null)}
        >
          <div className="self-evaluation-modal-content">
            <p>
              Selecciona a los estudiantes que deben responder esta autoevaluación ({assignTarget.subject} - {assignTarget.group_name}).
            </p>

            {assignModalError && <Alert type="error">{assignModalError}</Alert>}

            <div className="self-evaluation-student-select-toolbar">
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={selectAllAvailable}
              >
                Seleccionar todos los disponibles
              </button>
              <span className="text-muted">
                {selectedStudentIds.length} seleccionados
              </span>
            </div>

            <div className="self-evaluation-student-checklist">
              {students.map((student) => {
                const isAlreadyAssigned = alreadyAssignedIds.has(student.id);
                const isChecked = selectedStudentIds.includes(student.id);

                return (
                  <label
                    key={student.id}
                    className={`self-evaluation-student-item ${isAlreadyAssigned ? "already-assigned" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isAlreadyAssigned || isChecked}
                      disabled={isAlreadyAssigned}
                      onChange={() => toggleStudentSelection(student.id)}
                    />
                    <div>
                      <strong>{student.name}</strong>
                      <small className="text-muted">{student.email}</small>
                    </div>
                    {isAlreadyAssigned && (
                      <span className="badge badge-validado">Ya asignado</span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="modal-actions">
              <BusyButton
                busy={assigningBusy}
                busyText="Guardando…"
                className="button button-primary"
                disabled={selectedStudentIds.length === 0}
                onClick={handleSaveAssignments}
              >
                Guardar asignaciones ({selectedStudentIds.length})
              </BusyButton>

              <button
                type="button"
                className="button button-secondary"
                disabled={assigningBusy}
                onClick={() => setAssignTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DE CONFIRMACIÓN DE CAMBIO DE ESTADO */}
      {transitionTarget && (
        <Modal
          title={`Confirmar cambio a "${transitionNewStatus}"`}
          onClose={() => setTransitionTarget(null)}
        >
          <div className="self-evaluation-modal-content">
            <p>
              ¿Deseas cambiar el estado de <strong>{transitionTarget.title}</strong> a <strong>{transitionNewStatus}</strong>?
            </p>
            {transitionNewStatus === "abierta" && (
              <p className="self-evaluation-modal-warning">
                Una vez abierta, los estudiantes asignados ({transitionTarget.assigned_count}) podrán ingresar y enviar sus respuestas.
              </p>
            )}
            {transitionNewStatus === "cerrada" && (
              <p className="self-evaluation-modal-warning">
                Al cerrarla, ya no se admitirán nuevas respuestas y la recepción quedará finalizada.
              </p>
            )}
            <div className="modal-actions">
              <BusyButton
                busy={transitioningBusy}
                busyText="Actualizando…"
                className="button button-primary"
                onClick={handleExecuteTransition}
              >
                Confirmar
              </BusyButton>
              <button
                type="button"
                className="button button-secondary"
                disabled={transitioningBusy}
                onClick={() => setTransitionTarget(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
