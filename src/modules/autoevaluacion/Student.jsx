import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, date } from "../../shared/api";
import {
  Modal,
  BusyButton,
  Empty,
  useAsync,
  Alert,
  Field,
  ErrorSummary,
} from "../../shared/ui";
import {
  Heading,
  LoadState,
  Status,
  useMutation,
  MutationState,
} from "../../shared/Work";
import { AnswerList } from "./answers";

const BASE = "/autoevaluacion";
export default function Student() {
  const state = useAsync(() => api(BASE + "/mis-evaluaciones"), []);
  const [filter, setFilter] = useState("pendientes");
  const rows = (state.data || []).filter(
    (item) =>
      filter === "todas" ||
      (filter === "enviadas" ? item.submitted : !item.submitted),
  );
  return (
    <>
      <Heading
        eyebrow="Autoevaluación / Parciales"
        title="Mis autoevaluaciones"
      >
        Consulta la asignatura, el parcial y la fecha de cierre antes de
        responder.
      </Heading>
      <div className="work-toolbar">
        <Field
          label="Mostrar evaluaciones"
          as="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pendientes">Sin enviar</option>
          <option value="enviadas">Enviadas</option>
          <option value="todas">Todas</option>
        </Field>
        {!state.loading && !state.error && (
          <p role="status">
            {rows.length} {rows.length === 1 ? "evaluación" : "evaluaciones"} en
            esta vista.
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
                <Status value={item.submitted ? "enviada" : "pendiente"}>
                  {item.submitted
                    ? "Enviada"
                    : item.accepting
                      ? "Por responder"
                      : new Date(item.start_date) > new Date() &&
                          item.status === "abierta"
                        ? "Apertura programada"
                        : "Recepción cerrada"}
                </Status>
                <dl className="work-meta">
                  <div>
                    <dt>Apertura</dt>
                    <dd>{date(item.start_date, true)}</dd>
                  </div>
                  <div>
                    <dt>Cierre</dt>
                    <dd>{date(item.end_date, true)}</dd>
                  </div>
                </dl>
              </div>
              <Link
                className={
                  "button " +
                  (item.accepting ? "button-primary" : "button-secondary")
                }
                to={BASE + "/evaluar/" + item.assignment_id}
              >
                {item.submitted
                  ? "Consultar envío"
                  : item.accepting
                    ? "Responder"
                    : "Consultar periodo"}{" "}
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
        {!rows.length && (
          <Empty
            title={
              filter === "enviadas"
                ? "Aún no has enviado una autoevaluación"
                : "No hay evaluaciones en esta vista"
            }
          >
            Cambia el filtro para consultar las demás asignaciones.
          </Empty>
        )}
      </LoadState>
    </>
  );
}
export function AnswerSelfEvaluation() {
  const { id } = useParams();
  return <AnswerForm key={id} id={id} />;
}
function AnswerForm({ id }) {
  const state = useAsync(() => api(BASE + "/asignaciones/" + id), [id]);
  const [answers, setAnswers] = useState({}),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState(null);
  const mutation = useMutation();
  const data = state.data,
    questions = data?.questionnaire.questions || [];
  const accepting = data?.accepting && !data.submitted;
  const answered = questions.filter((q) =>
    Array.isArray(answers[q.id])
      ? answers[q.id].length
      : typeof answers[q.id] === "string"
        ? answers[q.id].trim()
        : answers[q.id] != null,
  ).length;
  function update(q, value) {
    setAnswers((current) => ({ ...current, [q.id]: value }));
    setError(null);
  }
  function review(e) {
    e.preventDefault();
    const missing = questions.filter(
      (q) =>
        q.required &&
        (Array.isArray(answers[q.id])
          ? !answers[q.id].length
          : typeof answers[q.id] === "string"
            ? !answers[q.id].trim()
            : answers[q.id] == null),
    );
    if (missing.length) {
      setError({
        fields: missing.map((q) => ({
          field: "answer-" + q.id,
          message: q.text,
        })),
      });
      return;
    }
    setConfirm(true);
  }
  async function submit() {
    if (
      await mutation.run(async () => {
        await api(BASE + "/asignaciones/" + id + "/respuesta", {
          method: "POST",
          body: { answers },
        });
        setConfirm(false);
        await state.refresh();
      }, "Respuestas registradas.")
    )
      setAnswers({});
  }
  return (
    <>
      <LoadState state={state}>
        {data && (
          <>
            <Heading
              eyebrow={
                data.subject +
                " · Grupo " +
                data.group_name +
                " · " +
                data.partial
              }
              title={data.title}
            >
              {data.submitted
                ? "Enviada el " +
                  date(data.submitted_at, true) +
                  ". Puedes consultar tus respuestas."
                : "Puedes revisar todas tus respuestas antes de confirmar el envío."}
            </Heading>
            {!confirm && <MutationState state={mutation} />}
            <div className="work-split">
              <div>
                {data.submitted ? (
                  <AnswerList
                    questionnaire={data.questionnaire}
                    answers={data.answers}
                  />
                ) : accepting ? (
                  <form className="work-form" onSubmit={review} noValidate>
                    <ErrorSummary
                      error={error}
                      title="Responde las preguntas obligatorias"
                    />
                    {questions.map((q, index) => (
                      <fieldset
                        className="work-question"
                        key={q.id}
                        id={"answer-" + q.id}
                        tabIndex={-1}
                      >
                        <legend>
                          {index + 1}. {q.text}{" "}
                          <span className="self-question-optional">
                            {q.required ? "(obligatoria)" : "(opcional)"}
                          </span>
                        </legend>
                        {q.type === "texto_libre" ? (
                          <Field
                            id={"text-" + q.id}
                            label="Tu respuesta"
                            as="textarea"
                            rows={4}
                            maxLength={q.max_length}
                            value={answers[q.id] || ""}
                            onChange={(e) => update(q, e.target.value)}
                            hint={"Máximo " + q.max_length + " caracteres."}
                          />
                        ) : (
                          <>
                            <p className="work-help">
                              {q.type === "escala"
                                ? "Escala de " +
                                  q.min_value +
                                  " a " +
                                  q.max_value +
                                  ". Elige un valor."
                                : q.type === "opcion_multiple"
                                  ? "Puedes elegir varias opciones."
                                  : "Elige una opción."}
                            </p>
                            <div className="work-options">
                              {(q.type === "escala"
                                ? Array.from(
                                    { length: q.max_value - q.min_value + 1 },
                                    (_, i) => ({
                                      value: q.min_value + i,
                                      label: String(q.min_value + i),
                                    }),
                                  )
                                : q.options
                              ).map((o) => (
                                <label className="work-option" key={o.value}>
                                  <input
                                    type={
                                      q.type === "opcion_multiple"
                                        ? "checkbox"
                                        : "radio"
                                    }
                                    name={"question-" + q.id}
                                    checked={
                                      q.type === "opcion_multiple"
                                        ? (answers[q.id] || []).includes(
                                            o.value,
                                          )
                                        : answers[q.id] === o.value
                                    }
                                    onChange={() =>
                                      update(
                                        q,
                                        q.type === "opcion_multiple"
                                          ? (answers[q.id] || []).includes(
                                              o.value,
                                            )
                                            ? answers[q.id].filter(
                                                (v) => v !== o.value,
                                              )
                                            : [
                                                ...(answers[q.id] || []),
                                                o.value,
                                              ]
                                          : o.value,
                                      )
                                    }
                                  />
                                  {o.label}
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                      </fieldset>
                    ))}
                    <div className="form-footer">
                      <button className="button button-primary" type="submit">
                        Revisar respuestas <ArrowRight size={16} />
                      </button>
                      <span className="work-help" role="status">
                        {answered} de {questions.length} respondidas
                      </span>
                    </div>
                  </form>
                ) : (
                  <Alert type="info">
                    {new Date(data.start_date) > new Date() &&
                    data.status === "abierta"
                      ? "La recepción comienza el " +
                        date(data.start_date, true) +
                        "."
                      : "Esta evaluación ya no admite respuestas."}
                  </Alert>
                )}
              </div>
              <aside className="work-aside">
                <h2>
                  {data.submitted ? "Registro del envío" : "Antes de enviar"}
                </h2>
                <dl className="work-meta">
                  <div>
                    <dt>Cierre de recepción</dt>
                    <dd>{date(data.end_date, true)}</dd>
                  </div>
                  <div>
                    <dt>Cuestionario</dt>
                    <dd>
                      {data.questionnaire.title} · v{data.questionnaire.version}
                    </dd>
                  </div>
                </dl>
                <p>
                  Las respuestas enviadas son definitivas. El personal
                  administrador puede consultar el detalle de esta
                  autoevaluación.
                </p>
                {accepting && (
                  <p>
                    Las respuestas sin enviar se conservan solo mientras
                    permanezcas en esta página.
                  </p>
                )}
                <Link className="text-link" to={BASE + "/mis-evaluaciones"}>
                  Volver a mis autoevaluaciones
                </Link>
              </aside>
            </div>
          </>
        )}
      </LoadState>
      {confirm && (
        <Modal
          title="Revisar y enviar"
          onClose={() => {
            if (!mutation.busy) setConfirm(false);
          }}
        >
          <p>
            {data.title} · {data.partial}
          </p>
          <AnswerList questionnaire={data.questionnaire} answers={answers} />
          <p className="work-note">
            Al confirmar, las respuestas quedarán registradas y ya no podrás
            modificarlas.
          </p>
          <MutationState state={mutation} />
          <div className="work-actions">
            <BusyButton
              className="button button-primary"
              busy={mutation.busy}
              busyText="Enviando…"
              onClick={submit}
            >
              Confirmar envío
            </BusyButton>
            <button
              className="button button-secondary"
              disabled={mutation.busy}
              onClick={() => setConfirm(false)}
            >
              Seguir revisando
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function StudentHistory() {
  const state = useAsync(() => api(BASE + "/mis-respuestas"), []);
  return (
    <>
      <Heading
        eyebrow="Autoevaluación / Envíos"
        title="Historial de autoevaluaciones"
      >
        Consulta el cuestionario y las respuestas que enviaste en cada parcial.
      </Heading>
      <LoadState state={state} empty="Aún no has enviado autoevaluaciones">
        <div className="work-records">
          {state.data?.map((item) => (
            <article className="work-record" key={item.assignment_id}>
              <div>
                <span className="record-code">
                  {item.subject} · Grupo {item.group_name} · {item.partial}
                </span>
                <h2>{item.title}</h2>
                <p>Enviada el {date(item.submitted_at, true)}</p>
              </div>
              <Link
                className="button button-secondary"
                to={BASE + "/evaluar/" + item.assignment_id}
              >
                Consultar respuestas <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </LoadState>
    </>
  );
}
