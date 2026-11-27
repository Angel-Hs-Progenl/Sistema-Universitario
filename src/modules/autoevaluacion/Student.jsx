import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock3, AlertCircle, FileText } from "lucide-react";
import { api, date } from "../../shared/api";
import { Modal, BusyButton, Empty, useAsync, Alert } from "../../shared/ui";
import { Heading, LoadState, Status, useMutation, MutationState } from "../../shared/Work";
import "./styles.css";

const BASE = "/autoevaluacion";

/**
 * Vista principal de Mis autoevaluaciones para el estudiante.
 * Muestra las evaluaciones asignadas con filtros y acceso para responderlas o consultar el envío.
 */
export default function Student() {
  const state = useAsync(() => api(`${BASE}/mis-evaluaciones`), []);
  const [filter, setFilter] = useState("pendientes");

  const rows = (state.data || []).filter((item) => {
    if (filter === "todas") return true;
    if (filter === "enviadas") return item.submitted;
    // pendientes por responder
    return !item.submitted && item.accepting;
  });

  return (
    <section className="self-evaluation-page">
      <Heading
        eyebrow="Autoevaluación / Estudiante"
        title="Mis autoevaluaciones"
      >
        Reflexiona sobre tu desempeño académico y responde las evaluaciones asignadas dentro del periodo habilitado.
      </Heading>

      <div className="work-toolbar" aria-label="Filtrar evaluaciones">
        {[
          ["pendientes", "Por responder"],
          ["enviadas", "Enviadas"],
          ["todas", "Todas"],
        ].map(([id, label]) => (
          <button
            type="button"
            className={`button ${filter === id ? "button-primary" : "button-secondary"}`}
            aria-pressed={filter === id}
            key={id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}

        {!state.loading && (
          <p role="status">
            {rows.length} {rows.length === 1 ? "evaluación" : "evaluaciones"} en esta vista.
          </p>
        )}
      </div>

      <LoadState state={state} empty="No tienes autoevaluaciones asignadas">
        <div className="work-records">
          {rows.map((item) => (
            <article className="work-record" key={item.assignment_id}>
              <div>
                <span className="record-code">
                  {item.subject} · Grupo {item.group_name} · {item.partial}
                </span>
                <h2>{item.title}</h2>

                <Status value={item.submitted ? "enviada" : item.accepting ? "pendiente" : "rechazada"}>
                  {item.submitted
                    ? "Enviada"
                    : item.accepting
                      ? "Por responder"
                      : "Recepción cerrada"}
                </Status>

                <dl className="work-meta">
                  <div>
                    <dt>Inicio</dt>
                    <dd>{date(item.start_date, true)}</dd>
                  </div>
                  <div>
                    <dt>Cierre</dt>
                    <dd>{date(item.end_date, true)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                {item.accepting && !item.submitted ? (
                  <Link
                    className="button button-primary"
                    to={`${BASE}/evaluar/${item.assignment_id}`}
                  >
                    Responder autoevaluación <ArrowRight size={16} />
                  </Link>
                ) : item.submitted ? (
                  <Link
                    className="button button-secondary"
                    to={`${BASE}/evaluar/${item.assignment_id}`}
                  >
                    <Check size={16} /> Consultar envío
                  </Link>
                ) : (
                  <p className="work-help">El periodo de recepción ha finalizado.</p>
                )}
              </div>
            </article>
          ))}
        </div>

        {!rows.length && (
          <Empty
            title={
              filter === "pendientes"
                ? "No tienes autoevaluaciones pendientes por responder"
                : "No hay autoevaluaciones en esta categoría"
            }
          >
            Puedes cambiar el filtro para consultar tus autoevaluaciones enviadas o pasadas.
          </Empty>
        )}
      </LoadState>
    </section>
  );
}

/**
 * Pantalla para responder la autoevaluación seleccionada o consultar las respuestas si ya fue enviada.
 */
export function AnswerSelfEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useAsync(() => api(`${BASE}/asignaciones/${id}`), [id]);

  const [answers, setAnswers] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const mutation = useMutation();

  const data = state.data;
  const questionnaire = data?.questionnaire;
  const questions = questionnaire?.questions || [];

  // Actualiza la respuesta para una pregunta específica
  function handleAnswerChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setFormError("");
  }

  // Alterna una opción para preguntas de tipo opcion_multiple
  function handleMultipleChoiceToggle(questionId, optionValue) {
    setAnswers((prev) => {
      const currentList = prev[questionId] || [];
      const updatedList = currentList.includes(optionValue)
        ? currentList.filter((v) => v !== optionValue)
        : [...currentList, optionValue];
      return {
        ...prev,
        [questionId]: updatedList,
      };
    });
    setFormError("");
  }

  // Valida que todas las preguntas obligatorias hayan sido respondidas
  function validate() {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.required) {
        const answer = answers[q.id];
        if (answer === undefined || answer === null || answer === "") {
          return `Por favor responde la pregunta ${i + 1}: "${q.text}".`;
        }
        if (Array.isArray(answer) && answer.length === 0) {
          return `Por favor selecciona al menos una opción en la pregunta ${i + 1}.`;
        }
      }
    }
    return "";
  }

  // Prepara el envío mostrando el diálogo de confirmación
  function handleSubmitClick(e) {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }
    setFormError("");
    setShowConfirm(true);
  }

  // Envía las respuestas al servidor
  async function submitResponses() {
    const success = await mutation.run(async () => {
      await api(`${BASE}/asignaciones/${id}/respuesta`, {
        method: "POST",
        body: { answers },
      });
      await state.refresh();
    }, "Autoevaluación enviada correctamente.");

    if (success) {
      setShowConfirm(false);
    }
  }

  if (state.loading) {
    return (
      <section className="self-evaluation-page">
        <p className="work-loading">Cargando autoevaluación…</p>
      </section>
    );
  }

  if (state.error || !data) {
    return (
      <section className="self-evaluation-page">
        <Alert>{state.error || "No fue posible cargar la autoevaluación solicitada."}</Alert>
        <Link className="button button-secondary" to={`${BASE}/mis-evaluaciones`}>
          Volver a mis autoevaluaciones
        </Link>
      </section>
    );
  }

  const isSubmitted = data.submitted;
  const isAccepting = data.accepting && !isSubmitted;
  const submittedAnswers = data.answers || {};

  return (
    <section className="self-evaluation-page">
      <Heading
        eyebrow={`${data.subject} · Grupo ${data.group_name} · ${data.partial}`}
        title={data.title}
      >
        {isSubmitted
          ? "Esta autoevaluación ya fue enviada y se encuentra registrada de forma definitiva."
          : isAccepting
            ? "Lee cada pregunta con atención y reflexiona honestamente sobre tu desempeño durante este periodo."
            : "El periodo de recepción de esta autoevaluación ha finalizado."}
      </Heading>

      <MutationState state={mutation} />

      {isSubmitted && (
        <div className="self-evaluation-notice" role="status">
          <Check size={20} className="self-evaluation-check-icon" />
          <div>
            <strong>Autoevaluación completada</strong>
            <p>
              Enviaste tus respuestas el {date(data.submitted_at, true)}. A continuación puedes consultar el detalle de lo que registraste.
            </p>
          </div>
        </div>
      )}

      {!isAccepting && !isSubmitted && (
        <Alert type="info">
          Esta autoevaluación no admite respuestas en este momento. La fecha límite de cierre fue el {date(data.end_date, true)}.
        </Alert>
      )}

      {/* LISTADO DE PREGUNTAS (RESPONDIENDO O EN MODO LECTURA) */}
      <form onSubmit={handleSubmitClick}>
        <div className="self-evaluation-questions-list">
          {questions.map((question, index) => {
            const currentAnswer = isSubmitted
              ? submittedAnswers[question.id]
              : answers[question.id];

            return (
              <article
                className={`self-evaluation-card ${isSubmitted ? "card-read-only" : ""}`}
                key={question.id}
              >
                <header className="self-evaluation-card-header">
                  <span className="self-evaluation-card-number">Pregunta {index + 1}</span>
                  {question.required && !isSubmitted && (
                    <span className="self-evaluation-badge-required">Obligatoria</span>
                  )}
                </header>

                <h3 className="self-evaluation-card-title">{question.text}</h3>

                {/* TIPO: ESCALA NUMÉRICA */}
                {question.type === "escala" && (
                  <div className="self-evaluation-scale-container">
                    <p className="self-evaluation-scale-help">
                      Selecciona un valor del {question.min_value} al {question.max_value}:
                    </p>
                    <div className="self-evaluation-scale-row" role="radiogroup" aria-label={question.text}>
                      {Array.from(
                        { length: question.max_value - question.min_value + 1 },
                        (_, i) => question.min_value + i
                      ).map((score) => {
                        const selected = currentAnswer === score;
                        return isSubmitted ? (
                          <div
                            key={score}
                            className={`self-evaluation-scale-pill ${selected ? "pill-selected" : "pill-disabled"}`}
                          >
                            {score}
                          </div>
                        ) : (
                          <button
                            type="button"
                            key={score}
                            className={`self-evaluation-scale-button ${selected ? "selected" : ""}`}
                            aria-pressed={selected}
                            onClick={() => handleAnswerChange(question.id, score)}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TIPO: OPCIÓN ÚNICA */}
                {question.type === "opcion_unica" && (
                  <div className="self-evaluation-options-list" role="radiogroup" aria-label={question.text}>
                    {question.options.map((option) => {
                      const selected = currentAnswer === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`self-evaluation-option-label ${selected ? "option-selected" : ""} ${isSubmitted ? "option-disabled" : ""}`}
                        >
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            value={option.value}
                            checked={selected}
                            disabled={isSubmitted}
                            onChange={() => handleAnswerChange(question.id, option.value)}
                            required={question.required && !isSubmitted}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* TIPO: OPCIÓN MÚLTIPLE */}
                {question.type === "opcion_multiple" && (
                  <div className="self-evaluation-options-list">
                    {question.options.map((option) => {
                      const selected = Array.isArray(currentAnswer) && currentAnswer.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className={`self-evaluation-option-label ${selected ? "option-selected" : ""} ${isSubmitted ? "option-disabled" : ""}`}
                        >
                          <input
                            type="checkbox"
                            value={option.value}
                            checked={selected}
                            disabled={isSubmitted}
                            onChange={() => handleMultipleChoiceToggle(question.id, option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* TIPO: TEXTO LIBRE */}
                {question.type === "texto_libre" && (
                  <div className="self-evaluation-text-container">
                    {isSubmitted ? (
                      <div className="self-evaluation-submitted-text">
                        {currentAnswer ? (
                          <p>{currentAnswer}</p>
                        ) : (
                          <p className="text-muted">Sin respuesta registrada.</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <textarea
                          rows={4}
                          maxLength={question.max_length || 2000}
                          value={currentAnswer || ""}
                          placeholder="Escribe tu reflexión o respuesta aquí…"
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          required={question.required}
                        />
                        <div className="self-evaluation-char-counter">
                          {(currentAnswer || "").length} / {question.max_length || 2000} caracteres
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {formError && (
          <div className="self-evaluation-error-box" role="alert">
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <div className="self-evaluation-form-actions">
          {isAccepting && (
            <button type="submit" className="button button-primary">
              Enviar autoevaluación definitiva
            </button>
          )}

          <Link className="button button-secondary" to={`${BASE}/mis-evaluaciones`}>
            Volver al listado
          </Link>
        </div>
      </form>

      {/* MODAL DE CONFIRMACIÓN DE ENVÍO DEFINITIVO */}
      {showConfirm && (
        <Modal
          title="Confirmar envío definitivo"
          onClose={() => setShowConfirm(false)}
        >
          <div className="self-evaluation-modal-content">
            <p>
              Estás por registrar tus respuestas para <strong>{data.title}</strong>.
            </p>
            <p className="self-evaluation-modal-warning">
              Por razones de integridad académica, <strong>las respuestas no podrán ser editadas ni reenviadas</strong> una vez confirmadas.
            </p>
            <div className="modal-actions">
              <BusyButton
                busy={mutation.busy}
                busyText="Enviando…"
                className="button button-primary"
                onClick={submitResponses}
              >
                Confirmar y enviar
              </BusyButton>
              <button
                type="button"
                className="button button-secondary"
                disabled={mutation.busy}
                onClick={() => setShowConfirm(false)}
              >
                Volver a revisar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

/**
 * Vista de historial de respuestas enviadas por el estudiante.
 */
export function StudentHistory() {
  const state = useAsync(() => api(`${BASE}/mis-respuestas`), []);
  const [expandedId, setExpandedId] = useState(null);

  const list = state.data || [];

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <section className="self-evaluation-page">
      <Heading
        eyebrow="Autoevaluación / Estudiante"
        title="Historial de autoevaluaciones"
      >
        Consulta el registro histórico de todas las autoevaluaciones que has completado.
      </Heading>

      <LoadState state={state} empty="Aún no has enviado ninguna autoevaluación">
        <div className="self-evaluation-history-list">
          {list.map((item) => {
            const isExpanded = expandedId === item.assignment_id;
            const answers = item.answers || {};
            const answerCount = Object.keys(answers).length;

            return (
              <article className="self-evaluation-history-card" key={item.assignment_id}>
                <div className="self-evaluation-history-summary">
                  <div>
                    <span className="record-code">
                      {item.subject} · {item.group_name} · {item.partial}
                    </span>
                    <h2>{item.title}</h2>
                    <p className="work-meta-item">
                      <Clock3 size={15} /> Enviado el {date(item.submitted_at, true)}
                    </p>
                  </div>

                  <div className="self-evaluation-history-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => toggleExpand(item.assignment_id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "Ocultar respuestas" : `Ver respuestas (${answerCount})`}
                    </button>
                    <Link
                      className="button button-primary"
                      to={`${BASE}/evaluar/${item.assignment_id}`}
                    >
                      Consultar en detalle
                    </Link>
                  </div>
                </div>

                {isExpanded && (
                  <div className="self-evaluation-history-details">
                    <h3>Respuestas registradas:</h3>
                    <dl className="self-evaluation-answers-dl">
                      {Object.entries(answers).map(([key, val]) => (
                        <div key={key} className="self-evaluation-answer-item">
                          <dt>{key}:</dt>
                          <dd>
                            {Array.isArray(val)
                              ? val.join(", ")
                              : typeof val === "object"
                                ? JSON.stringify(val)
                                : String(val)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!list.length && (
          <Empty title="Sin autoevaluaciones en tu historial">
            Tus autoevaluaciones completadas se archivarán aquí una vez que las envíes.
          </Empty>
        )}
      </LoadState>
    </section>
  );
}
