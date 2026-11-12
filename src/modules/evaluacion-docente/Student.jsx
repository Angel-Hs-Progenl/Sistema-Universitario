import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { api, date } from "../../shared/api";
import { Field, Modal, BusyButton, Empty, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
  Status,
} from "../../shared/Work";

const BASE = "/evaluacion-docente";

export function StudentAssignments() {
  const state = useAsync(() => api(`${BASE}/asignaciones`), []),
    [filter, setFilter] = useState("pendientes");
  const rows = (state.data || []).filter(
    (a) =>
      filter === "todas" ||
      (filter === "enviadas" ? a.submitted : !a.submitted),
  );
  return (
    <>
      <Heading
        eyebrow="Evaluación docente / Estudiante"
        title="Mis evaluaciones"
      >
        Responde las evaluaciones de tus asignaturas dentro del periodo
        habilitado. Cada evaluación admite un solo envío.
      </Heading>
      <div className="work-toolbar" aria-label="Filtrar evaluaciones">
        {[
          ["pendientes", "Por responder"],
          ["enviadas", "Enviadas"],
          ["todas", "Todas"],
        ].map(([id, label]) => (
          <button
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
            {rows.length} {rows.length === 1 ? "evaluación" : "evaluaciones"} en
            esta vista.
          </p>
        )}
      </div>
      <LoadState state={state} empty="No tienes evaluaciones asignadas">
        <div className="work-records">
          {rows.map((a) => (
            <article className="work-record" key={a.id}>
              <div>
                <span className="record-code">
                  {a.period_title} · {a.group_name}
                </span>
                <h2>{a.subject}</h2>
                <p>{a.teacher_name}</p>
                <Status value={a.submitted ? "enviada" : "pendiente"}>
                  {a.submitted
                    ? "Enviada"
                    : a.accepting
                      ? "Por responder"
                      : "Recepción cerrada"}
                </Status>
                <dl className="work-meta">
                  <div>
                    <dt>Apertura</dt>
                    <dd>{date(a.start_date)}</dd>
                  </div>
                  <div>
                    <dt>Cierre</dt>
                    <dd>{date(a.end_date)}</dd>
                  </div>
                </dl>
              </div>
              {a.accepting ? (
                <Link
                  className="button button-primary"
                  to={`${BASE}/estudiante/evaluar/${a.id}`}
                >
                  Responder evaluación <ArrowRight size={16} />
                </Link>
              ) : a.submitted ? (
                <Link
                  className="button button-secondary"
                  to={`${BASE}/estudiante/evaluar/${a.id}`}
                >
                  <Check size={16} /> Consultar envío
                </Link>
              ) : (
                <p className="work-help">
                  Consulta el periodo con tu área académica.
                </p>
              )}
            </article>
          ))}
        </div>
        {!rows.length && (
          <Empty
            title={
              filter === "pendientes"
                ? "No hay evaluaciones por responder"
                : "No hay evaluaciones en esta vista"
            }
          >
            Puedes cambiar el filtro para consultar tus otras evaluaciones.
          </Empty>
        )}
      </LoadState>
    </>
  );
}

export function AnswerEvaluation() {
  const { id } = useParams(),
    navigate = useNavigate();
  const state = useAsync(() => api(`${BASE}/asignaciones/${id}`), [id]);
  const [answers, setAnswers] = useState({}),
    [comment, setComment] = useState(""),
    [confirm, setConfirm] = useState(false),
    [leaving, setLeaving] = useState(false);
  const mutation = useMutation(),
    a = state.data;
  const groups = new Map();
  for (const q of a?.questionnaire?.questions || [])
    groups.set(q.section, [...(groups.get(q.section) || []), q]);
  async function send() {
    if (
      await mutation.run(async () => {
        await api(`${BASE}/asignaciones/${id}/respuesta`, {
          method: "POST",
          body: { answers, comment },
        });
        await state.refresh();
      }, "Evaluación guardada.")
    ) {
      setConfirm(false);
      setAnswers({});
      setComment("");
    }
  }
  function back(e) {
    if (Object.keys(answers).length || comment) {
      e.preventDefault();
      setLeaving(true);
    }
  }
  return (
    <>
      <Heading
        eyebrow="Evaluación docente / Cuestionario"
        title={a?.subject || "Responder evaluación"}
        action={
          <Link className="button button-secondary" to={BASE} onClick={back}>
            Volver a mis evaluaciones
          </Link>
        }
      >
        {a
          ? `${a.teacher_name} · ${a.period_title}`
          : "Consulta de la asignación."}
      </Heading>
      {!confirm && <MutationState state={mutation} />}
      <LoadState state={state}>
        {a &&
          (a.submitted ? (
            <Empty
              title="Evaluación enviada"
              action={
                <Link className="button button-primary" to={BASE}>
                  Volver a mis evaluaciones
                </Link>
              }
            >
              El servidor confirmó la recepción. Las respuestas están cerradas y
              no se muestran al docente de forma individual.
            </Empty>
          ) : !a.accepting ? (
            <Empty title="El periodo no está recibiendo respuestas">
              Vuelve a tus evaluaciones o consulta las fechas con tu área
              académica.
            </Empty>
          ) : (
            <div className="work-split">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.clear();
                  setConfirm(true);
                }}
              >
                <p className="work-note">
                  El reporte del docente reúne resultados del grupo y
                  comentarios revisados, sin tu nombre. Evita escribir datos que
                  te identifiquen.
                </p>
                <ol className="work-steps">
                  <li>
                    <span>01</span> Responde
                  </li>
                  <li>
                    <span>02</span> Revisa
                  </li>
                  <li>
                    <span>03</span> Confirma el envío
                  </li>
                </ol>
                {Array.from(groups, ([section, questions], index) => (
                  <section key={section} className="work-section">
                    <span className="eyebrow">
                      Sección {index + 1} de {groups.size}
                    </span>
                    <h2>{section}</h2>
                    {questions.map((q) => (
                      <fieldset className="work-question" key={q.id}>
                        <legend>
                          {q.text} <span className="required">*</span>
                        </legend>
                        <div className="work-options">
                          {a.questionnaire.options.map((o) => (
                            <label className="work-option" key={o.value}>
                              <input
                                name={q.id}
                                type="radio"
                                value={o.value}
                                required
                                checked={answers[q.id] === o.value}
                                onChange={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: o.value,
                                  }))
                                }
                              />
                              <span>
                                {o.value} · {o.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </section>
                ))}
                <section className="work-section">
                  <Field
                    as="textarea"
                    label="Comentario para mejorar la asignatura"
                    rows={5}
                    maxLength={2000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    hint="Opcional. Describe hechos y propuestas; no incluyas nombres de estudiantes, teléfonos o correos."
                  />
                  <p className="work-help" role="status">
                    {Object.keys(answers).length} de{" "}
                    {a.questionnaire.questions.length} preguntas respondidas.
                  </p>
                  <BusyButton
                    type="submit"
                    className="button button-primary"
                    busy={mutation.busy}
                  >
                    Revisar y enviar <ArrowRight size={16} />
                  </BusyButton>
                </section>
              </form>
              <aside className="work-aside">
                <h2>Antes de enviar</h2>
                <p>
                  Responde a partir de tu experiencia en esta asignatura y
                  periodo.
                </p>
                <p>
                  La escala y las preguntas corresponden a{" "}
                  {a.questionnaire.title}, versión {a.questionnaire.version}.
                </p>
                <p>
                  Podrás revisar tus selecciones antes de confirmar. Al enviar,
                  las respuestas quedan guardadas y cerradas.
                </p>
              </aside>
            </div>
          ))}
      </LoadState>
      {confirm && (
        <Modal
          title="Confirmar envío de evaluación"
          onClose={() => {
            if (!mutation.busy) setConfirm(false);
          }}
        >
          <MutationState state={mutation} />
          <p>
            {a.teacher_name} · {a.subject}
          </p>
          <p>
            Has respondido las {a.questionnaire.questions.length} preguntas.
            Después de confirmar no podrás modificar tus respuestas.
          </p>
          <div className="work-actions">
            <BusyButton
              className="button button-primary"
              busy={mutation.busy}
              busyText="Enviando…"
              onClick={send}
            >
              Enviar evaluación
            </BusyButton>
            <button
              disabled={mutation.busy}
              className="button button-secondary"
              onClick={() => setConfirm(false)}
            >
              Seguir revisando
            </button>
          </div>
        </Modal>
      )}
      {leaving && (
        <Modal
          title="Salir de esta evaluación"
          onClose={() => setLeaving(false)}
        >
          <p>Las respuestas que aún no envías se perderán al salir.</p>
          <div className="work-actions">
            <button
              className="button button-primary"
              onClick={() => navigate(BASE)}
            >
              Salir sin enviar
            </button>
            <button
              className="button button-secondary"
              onClick={() => setLeaving(false)}
            >
              Continuar respondiendo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
