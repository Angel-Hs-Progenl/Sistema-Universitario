import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Users, FileCheck } from "lucide-react";
import { api, date } from "../../shared/api";
import { useAsync, Empty, Alert, Modal } from "../../shared/ui";
import { Heading, LoadState, Status } from "../../shared/Work";
import "./styles.css";

const BASE = "/autoevaluacion";

export default function Results() {
  const { id } = useParams();
  const state = useAsync(() => api(`${BASE}/evaluaciones/${id}/resultados`), [id]);
  const [selectedResponse, setSelectedResponse] = useState(null);

  if (state.loading) {
    return (
      <section className="self-evaluation-page">
        <p className="work-loading">Cargando resultados de la autoevaluación…</p>
      </section>
    );
  }

  if (state.error || !state.data) {
    return (
      <section className="self-evaluation-page">
        <Alert>{state.error || "No fue posible cargar los resultados."}</Alert>
        <Link className="button button-secondary" to={`${BASE}/evaluaciones`}>
          Volver a evaluaciones
        </Link>
      </section>
    );
  }

  const { evaluation, summary, responses } = state.data;
  const pct = summary.assigned_count > 0
    ? Math.round((summary.submitted_count / summary.assigned_count) * 100)
    : 0;

  return (
    <section className="self-evaluation-page">
      <div className="self-evaluation-back-nav">
        <Link to={`${BASE}/evaluaciones`} className="self-evaluation-back-link">
          <ArrowLeft size={16} /> Volver al listado de evaluaciones
        </Link>
      </div>

      <Heading
        eyebrow={`${evaluation.subject} · Grupo ${evaluation.group_name} · ${evaluation.partial}`}
        title={`Resultados: ${evaluation.title}`}
      >
        Seguimiento de participación y respuestas registradas por la comunidad estudiantil.
      </Heading>

      {/* TARJETAS DE RESUMEN DE PARTICIPACIÓN */}
      <div className="self-evaluation-metrics-grid">
        <article className="self-evaluation-metric-card">
          <div className="metric-icon metric-icon-assigned">
            <Users size={24} />
          </div>
          <div>
            <span className="metric-label">Asignados</span>
            <span className="metric-value">{summary.assigned_count}</span>
          </div>
        </article>

        <article className="self-evaluation-metric-card">
          <div className="metric-icon metric-icon-submitted">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="metric-label">Respondidos</span>
            <span className="metric-value">{summary.submitted_count}</span>
          </div>
        </article>

        <article className="self-evaluation-metric-card">
          <div className="metric-icon metric-icon-pending">
            <Clock size={24} />
          </div>
          <div>
            <span className="metric-label">Pendientes</span>
            <span className="metric-value">{summary.pending_count}</span>
          </div>
        </article>

        <article className="self-evaluation-metric-card">
          <div className="metric-icon metric-icon-rate">
            <FileCheck size={24} />
          </div>
          <div>
            <span className="metric-label">Tasa de respuesta</span>
            <span className="metric-value">{pct}%</span>
          </div>
        </article>
      </div>

      {/* TABLA DE ESTUDIANTES Y RESPUESTAS */}
      <div className="self-evaluation-section">
        <h2>Participación de estudiantes</h2>

        {responses.length === 0 ? (
          <Empty title="No hay estudiantes asignados">
            Esta evaluación no tiene asignaciones registradas todavía.
          </Empty>
        ) : (
          <div className="self-evaluation-table-wrapper">
            <table className="self-evaluation-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Estado</th>
                  <th>Fecha de envío</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((item) => (
                  <tr key={item.assignment_id}>
                    <td>
                      <strong>{item.student_name}</strong>
                    </td>
                    <td>
                      <Status value={item.submitted ? "enviada" : "pendiente"}>
                        {item.submitted ? "Respondida" : "Pendiente"}
                      </Status>
                    </td>
                    <td>
                      {item.submitted_at ? date(item.submitted_at, true) : "—"}
                    </td>
                    <td className="text-right">
                      {item.submitted ? (
                        <button
                          type="button"
                          className="button button-secondary button-small"
                          onClick={() => setSelectedResponse(item)}
                        >
                          Ver respuestas
                        </button>
                      ) : (
                        <span className="text-muted">Sin respuesta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA CONSULTAR LAS RESPUESTAS INDIVIDUALES */}
      {selectedResponse && (
        <Modal
          title={`Respuestas de ${selectedResponse.student_name}`}
          onClose={() => setSelectedResponse(null)}
        >
          <div className="self-evaluation-modal-content">
            <p className="text-muted">
              Enviado el {date(selectedResponse.submitted_at, true)}
            </p>

            <dl className="self-evaluation-answers-dl">
              {Object.entries(selectedResponse.answers || {}).map(([key, val]) => (
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

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedResponse(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
