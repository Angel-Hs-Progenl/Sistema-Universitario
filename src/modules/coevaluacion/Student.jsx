import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { api, date } from "../../shared/api";
import { Empty, useAsync } from "../../shared/ui";
import { Heading, LoadState, Status } from "../../shared/Work";

export default function Student() {
  const state = useAsync(() => api("/coevaluacion/mis-asignaciones"), []);
  const [filter, setFilter] = useState("pendientes");
  const rows = (state.data || []).filter((row) =>
    filter === "todas"
      ? true
      : filter === "enviadas"
        ? row.submitted
        : row.accepting,
  );

  return (
    <section className="coev-page">
      <Heading
        eyebrow="Área académica / Estudiante"
        title="Coevaluaciones asignadas"
      >
        Valora el trabajo de la persona asignada en cada materia. Tu respuesta
        se guarda al enviarla y no se puede editar después.
      </Heading>
      <div className="coev-context">
        <div>
          <span className="coev-context-label">Tu tarea</span>
          <strong>Revisar una colaboración concreta</strong>
        </div>
        <p>
          La persona y los criterios aparecen en cada asignación. La escala
          describe esta actividad; no representa una calificación oficial.
        </p>
      </div>
      <div className="work-toolbar" aria-label="Filtrar coevaluaciones">
        {[
          ["pendientes", "Por responder"],
          ["enviadas", "Enviadas"],
          ["todas", "Todas"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`button ${filter === id ? "button-primary" : "button-secondary"}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
        {!state.loading && (
          <p role="status">
            {rows.length} {rows.length === 1 ? "asignación" : "asignaciones"} en
            esta vista.
          </p>
        )}
      </div>
      <LoadState state={state} empty="Aún no tienes coevaluaciones asignadas">
        {rows.length ? (
          <div className="coev-list">
            {rows.map((row) => (
              <article className="coev-assignment" key={row.assignment_id}>
                <div className="coev-assignment-main">
                  <span className="record-code">
                    {row.subject} · {row.group_name} · {row.partial}
                  </span>
                  <h2>{row.title}</h2>
                  <p>
                    Compañero asignado: <strong>{row.peer_name}</strong>
                  </p>
                  <Status value={row.submitted ? "enviada" : "pendiente"}>
                    {row.submitted
                      ? "Enviada"
                      : row.accepting
                        ? "Por responder"
                        : row.availability === "programada"
                          ? "Aún no inicia"
                          : "Recepción cerrada"}
                  </Status>
                </div>
                <div className="coev-assignment-action">
                  <p className="work-help">
                    Cierre: {date(row.end_date, true)}
                  </p>
                  {row.accepting ? (
                    <Link
                      className="button button-primary"
                      to={`/coevaluacion/responder/${row.assignment_id}`}
                    >
                      Responder <ArrowRight size={16} />
                    </Link>
                  ) : row.submitted ? (
                    <Link
                      className="button button-secondary"
                      to={`/coevaluacion/responder/${row.assignment_id}`}
                    >
                      <CheckCircle2 size={16} /> Consultar envío
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No hay asignaciones en este filtro">
            Cambia el filtro para consultar las demás coevaluaciones.
          </Empty>
        )}
      </LoadState>
    </section>
  );
}
