import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, date } from "../../shared/api";
import { useAsync, Empty, Modal, Field } from "../../shared/ui";
import { Heading, LoadState, Status } from "../../shared/Work";
import { AnswerList } from "./answers";

export default function Results() {
  const { id } = useParams();
  return <ResultsPage key={id} id={id} />;
}

function ResultsPage({ id }) {
  const state = useAsync(
    () => api("/autoevaluacion/evaluaciones/" + id + "/resultados"),
    [id],
  );
  const [selected, setSelected] = useState(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("");
  const data = state.data;
  const rows = (data?.responses || []).filter(
    (item) =>
      item.student_name
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (!filter || item.submitted === (filter === "enviadas")),
  );
  return (
    <>
      <LoadState state={state}>
        {data && (
          <>
            <Heading
              eyebrow={
                data.evaluation.subject +
                " · Grupo " +
                data.evaluation.group_name +
                " · " +
                data.evaluation.partial
              }
              title={data.evaluation.title}
              action={
                <Link
                  className="button button-secondary"
                  to="/autoevaluacion/evaluaciones"
                >
                  Volver a evaluaciones
                </Link>
              }
            >
              Revisa quién ha respondido y consulta cada envío registrado.
            </Heading>
            <dl className="work-summary">
              <div>
                <dt>Estudiantes asignados</dt>
                <dd>{data.summary.assigned_count}</dd>
              </div>
              <div>
                <dt>Envíos recibidos</dt>
                <dd>{data.summary.submitted_count}</dd>
              </div>
              <div>
                <dt>Sin enviar</dt>
                <dd>{data.summary.pending_count}</dd>
              </div>
            </dl>
            <div className="work-toolbar">
              <Field
                label="Buscar estudiante"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Field
                label="Estado del envío"
                as="select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="enviadas">Enviadas</option>
                <option value="pendientes">Sin enviar</option>
              </Field>
              <p role="status">{rows.length} estudiantes en esta vista.</p>
            </div>
            {rows.length ? (
              <div
                className="work-table"
                role="region"
                aria-label="Participación de estudiantes"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Estado</th>
                      <th>Fecha de envío</th>
                      <th>
                        <span className="sr-only">Acción</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.assignment_id}>
                        <th scope="row">{item.student_name}</th>
                        <td>
                          <Status
                            value={item.submitted ? "enviada" : "pendiente"}
                          >
                            {item.submitted ? "Enviada" : "Sin enviar"}
                          </Status>
                        </td>
                        <td>
                          {item.submitted_at
                            ? date(item.submitted_at, true)
                            : "—"}
                        </td>
                        <td>
                          {item.submitted && (
                            <button
                              className="button button-secondary small"
                              onClick={() => setSelected(item)}
                            >
                              Consultar respuestas
                              <span className="sr-only">
                                {" "}
                                de {item.student_name}
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title={
                  data.responses.length
                    ? "No hay coincidencias"
                    : "Aún no hay estudiantes asignados"
                }
              >
                Ajusta los filtros o regresa a la evaluación para revisar las
                asignaciones.
              </Empty>
            )}
          </>
        )}
      </LoadState>
      {selected && (
        <Modal
          title={"Respuestas de " + selected.student_name}
          onClose={() => setSelected(null)}
        >
          <p className="work-help">
            Enviadas el {date(selected.submitted_at, true)}
          </p>
          <AnswerList
            questionnaire={data.questionnaire}
            answers={selected.answers}
          />
          <button
            className="button button-secondary"
            onClick={() => setSelected(null)}
          >
            Cerrar respuestas
          </button>
        </Modal>
      )}
    </>
  );
}
