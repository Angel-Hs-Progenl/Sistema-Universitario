import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, Printer } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { api } from "../../shared/api";
import { Field, Modal, BusyButton, Empty, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
  Status,
} from "../../shared/Work";

const BASE = "/evaluacion-docente";

export function Results() {
  const { user } = useAuth(),
    admin = user.role === "administrador",
    [params] = useSearchParams();
  const periods = useAsync(() => api(`${BASE}/periodos`), []),
    [selection, setSelection] = useState("");
  const id = selection || params.get("periodo") || periods.data?.[0]?.id || "";
  const period = periods.data?.find((p) => String(p.id) === String(id));
  const visible = period && (admin || period.status === "publicado");
  const state = useAsync(
    () =>
      visible ? api(`${BASE}/resultados?period_id=${id}`) : Promise.resolve([]),
    [id, visible],
  );
  return (
    <>
      <Heading
        eyebrow={
          admin
            ? "Evaluación docente / Coordinación"
            : "Evaluación docente / Docente"
        }
        title={admin ? "Resultados por periodo" : "Mis resultados"}
        action={
          visible && (
            <div className="work-actions no-print">
              <a
                className="button button-secondary"
                href={`/api/v1${BASE}/reportes.csv?period_id=${id}`}
              >
                <Download size={16} /> Exportar CSV
              </a>
              <button
                className="button button-secondary"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Imprimir informe
              </button>
            </div>
          )
        }
      >
        {admin
          ? "Consulta resultados agregados y verifica el umbral de privacidad antes de publicar."
          : "Consulta tus resultados y los comentarios revisados después de su publicación."}
      </Heading>
      <LoadState state={periods} empty="No hay periodos asignados">
        <div className="work-toolbar no-print">
          <Field
            as="select"
            label="Periodo de evaluación"
            value={id}
            onChange={(e) => setSelection(e.target.value)}
          >
            {periods.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Field>
          {period && (
            <Status value={period.status}>
              {period.status === "publicado"
                ? "Publicado"
                : "Pendiente de publicación"}
            </Status>
          )}
        </div>
        {!visible ? (
          <Empty title="Resultados pendientes de publicación">
            El área responsable debe cerrar la recepción, revisar los
            comentarios y publicar el periodo.
          </Empty>
        ) : (
          <LoadState
            state={state}
            empty="No hay resultados registrados para este periodo"
          >
            {state.data?.map((report) => (
              <article className="work-report" key={report.teacher_id}>
                <span className="eyebrow">
                  {report.period_title} ·{" "}
                  {report.published ? "Publicado" : "Vista interna"}
                </span>
                <h2>{report.teacher_name}</h2>
                {report.available ? (
                  <>
                    <dl className="work-meta">
                      <div>
                        <dt>Promedio ponderado</dt>
                        <dd>
                          <span className="result-average">
                            {report.average.toFixed(2)}
                          </span>{" "}
                          / {Math.max(...report.scale.map((o) => o.value))}
                        </dd>
                      </div>
                      <div>
                        <dt>Evaluaciones recibidas</dt>
                        <dd>{report.response_count}</dd>
                      </div>
                      <div>
                        <dt>Participantes</dt>
                        <dd>{report.participant_count}</dd>
                      </div>
                    </dl>
                    <div
                      className="work-bars"
                      aria-label="Promedios por sección"
                    >
                      {report.sections.map((s) => (
                        <div key={s.name} className="work-bar">
                          <div>
                            <span>{s.name}</span>
                            <strong>{s.average.toFixed(2)}</strong>
                          </div>
                          <div className="work-bar-track" aria-hidden="true">
                            <span
                              style={{
                                width: `${(100 * s.average) / Math.max(...report.scale.map((o) => o.value))}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <details>
                      <summary className="text-link">
                        Consultar resultados por pregunta
                      </summary>
                      <div
                        className="work-table"
                        role="region"
                        aria-label={`Resultados de ${report.teacher_name}`}
                        tabIndex={0}
                      >
                        <table>
                          <thead>
                            <tr>
                              <th>Sección y pregunta</th>
                              <th>Peso</th>
                              <th>Promedio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.questions.map((q) => (
                              <tr key={q.id}>
                                <td>
                                  {q.text}
                                  <small>{q.section}</small>
                                </td>
                                <td>{q.weight}</td>
                                <td>{q.average.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                    <p className="work-help">{report.calculation}</p>
                    <section className="work-section">
                      <h3>Comentarios revisados</h3>
                      {report.comments.length ? (
                        report.comments.map((comment, i) => (
                          <blockquote className="work-comment" key={i}>
                            {comment}
                          </blockquote>
                        ))
                      ) : (
                        <p className="work-help">
                          No hay comentarios publicados para este informe.
                        </p>
                      )}
                    </section>
                  </>
                ) : (
                  <p className="work-note">{report.reason}</p>
                )}
              </article>
            ))}
          </LoadState>
        )}
      </LoadState>
    </>
  );
}

export function TeacherSubjects() {
  const state = useAsync(() => api(`${BASE}/asignaciones`), []);
  return (
    <>
      <Heading eyebrow="Evaluación docente / Docente" title="Mis asignaturas">
        Asignaturas y grupos incluidos en tus periodos de evaluación. La
        participación individual de estudiantes permanece reservada.
      </Heading>
      <LoadState state={state} empty="No hay asignaturas asignadas">
        <div className="work-records">
          {state.data?.map((a, i) => (
            <article className="work-record" key={`${a.period_id}-${i}`}>
              <div>
                <span className="record-code">
                  {a.period_title} · {a.group_name}
                </span>
                <h2>{a.subject}</h2>
              </div>
              <Link
                className="button button-secondary"
                to={`${BASE}/docente/resultados?periodo=${a.period_id}`}
              >
                Consultar resultados del periodo
              </Link>
            </article>
          ))}
        </div>
      </LoadState>
    </>
  );
}

export function ModerateComments() {
  const periods = useAsync(() => api(`${BASE}/periodos`), []),
    [selection, setSelection] = useState("");
  const id = selection || periods.data?.[0]?.id || "",
    period = periods.data?.find((p) => String(p.id) === String(id));
  const state = useAsync(
    () =>
      id ? api(`${BASE}/comentarios?period_id=${id}`) : Promise.resolve([]),
    [id],
  );
  const [selected, setSelected] = useState(null),
    mutation = useMutation();
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (
      await mutation.run(async () => {
        await api(`${BASE}/comentarios/${selected.id}/revision`, {
          method: "POST",
          body: { public_comment: form.get("public_comment") },
        });
        await state.refresh();
      }, "Revisión del comentario guardada.")
    )
      setSelected(null);
  }
  return (
    <>
      <Heading
        eyebrow="Evaluación docente / Revisión previa"
        title="Comentarios para publicación"
        action={
          <Link
            className="button button-secondary"
            to={`${BASE}/direccion/periodos`}
          >
            Volver a periodos
          </Link>
        }
      >
        Retira nombres, contactos y referencias que identifiquen a estudiantes
        antes de publicar los comentarios al docente.
      </Heading>
      {!selected && <MutationState state={mutation} />}
      <LoadState state={periods} empty="No hay periodos registrados">
        <div className="work-toolbar">
          <Field
            label="Periodo"
            as="select"
            value={id}
            onChange={(e) => setSelection(e.target.value)}
          >
            {periods.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Field>
        </div>
        <LoadState state={state} empty="No hay comentarios en este periodo">
          <div className="work-records">
            {state.data?.map((c) => (
              <article className="work-record" key={c.id}>
                <div>
                  <Status value={c.reviewed ? "validado" : "pendiente"}>
                    {c.reviewed ? "Revisado" : "Pendiente de revisión"}
                  </Status>
                  <p>{c.comment}</p>
                  {c.reviewed && (
                    <p className="work-help">
                      Versión para publicar:{" "}
                      {c.public_comment || "Excluido del informe"}
                    </p>
                  )}
                </div>
                {period?.status !== "publicado" && (
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      mutation.clear();
                      setSelected(c);
                    }}
                  >
                    Revisar comentario
                  </button>
                )}
              </article>
            ))}
          </div>
        </LoadState>
      </LoadState>
      {selected && (
        <Modal
          title="Revisar comentario"
          onClose={() => {
            if (!mutation.busy) setSelected(null);
          }}
        >
          <form onSubmit={submit}>
            <MutationState state={mutation} />
            <p className="work-help">Original reservado al área revisora</p>
            <blockquote className="work-comment">{selected.comment}</blockquote>
            <Field
              name="public_comment"
              label="Texto para el informe del docente"
              as="textarea"
              rows={6}
              maxLength={2000}
              defaultValue={
                selected.reviewed ? selected.public_comment : selected.comment
              }
              hint="Retira datos identificables. Deja este campo vacío para excluir el comentario del informe."
            />
            <div className="work-actions">
              <BusyButton
                type="submit"
                busy={mutation.busy}
                className="button button-primary"
              >
                Guardar revisión
              </BusyButton>
              <button
                type="button"
                disabled={mutation.busy}
                className="button button-secondary"
                onClick={() => setSelected(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
