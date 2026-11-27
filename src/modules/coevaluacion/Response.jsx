import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, date } from "../../shared/api";
import { Field, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
} from "../../shared/Work";

const labels = [
  "Necesita mejorar",
  "En desarrollo",
  "Adecuado",
  "Muy bien",
  "Excelente",
];

export default function Response() {
  const { id } = useParams();
  const state = useAsync(() => api(`/coevaluacion/asignaciones/${id}`), [id]);
  const mutation = useMutation();
  const [scores, setScores] = useState({});
  const [strength, setStrength] = useState("");
  const [improvement, setImprovement] = useState("");
  const [formError, setFormError] = useState("");
  const item = state.data;
  const criteria = item?.questionnaire.criteria || [];
  const shownScores = item?.response?.scores || scores;
  const values = Object.values(shownScores);
  const average =
    values.length === criteria.length && values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  const percentage = average === null ? null : Math.round((average / 5) * 100);
  const valuation =
    average === null
      ? "Pendiente"
      : average >= 4.5
        ? "Excelente"
        : average >= 3.5
          ? "Muy bien"
          : average >= 2.5
            ? "Adecuado"
            : average >= 1.5
              ? "En desarrollo"
              : "Necesita mejorar";

  async function submit(event) {
    event.preventDefault();
    if (Object.keys(scores).length !== criteria.length) {
      setFormError("Responde todos los criterios antes de enviar.");
      return;
    }
    setFormError("");
    const success = await mutation.run(
      () =>
        api(`/coevaluacion/asignaciones/${id}/respuesta`, {
          method: "POST",
          body: { scores, strength, improvement },
        }),
      "Coevaluación enviada. Tu respuesta quedó registrada.",
    );
    if (success) state.refresh();
  }

  return (
    <section className="coev-page">
      <Link className="coev-back" to="/coevaluacion/mis-asignaciones">
        <ArrowLeft size={16} /> Mis coevaluaciones
      </Link>
      <LoadState state={state}>
        {item && (
          <>
            <Heading
              eyebrow={`${item.subject} / ${item.group_name} / ${item.partial}`}
              title={item.title}
            >
              Evalúas el trabajo de <strong>{item.peer_name}</strong>. Lee cada
              criterio y selecciona un valor del 1 al 5.
            </Heading>
            {item.submitted && (
              <div className="coev-confirmed" role="status">
                <CheckCircle2 size={20} /> Respuesta enviada el{" "}
                {date(item.response.submitted_at, true)}. Puedes consultarla
                aquí.
              </div>
            )}
            {!item.accepting && !item.submitted && (
              <div className="alert" role="status">
                {item.availability === "programada"
                  ? `La recepción inicia el ${date(item.start_date, true)}.`
                  : "La recepción de esta coevaluación está cerrada."}
              </div>
            )}
            <form className="coev-response-grid" onSubmit={submit}>
              <div className="coev-response-main">
                <div className="coev-section-heading">
                  <span>01 / Criterios</span>
                  <h2>Trabajo en equipo</h2>
                  <p>
                    Elige la descripción que mejor corresponde a cada criterio.
                  </p>
                </div>
                {criteria.map((criterion, index) => (
                  <fieldset
                    className="coev-criterion"
                    key={criterion.id}
                    disabled={!item.accepting}
                  >
                    <legend>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {criterion.title}
                    </legend>
                    <p>{criterion.description}</p>
                    <div
                      className="coev-scale"
                      aria-label={`Valoración de ${criterion.title}`}
                    >
                      {labels.map((label, i) => (
                        <label
                          key={label}
                          className={
                            shownScores[criterion.id] === i + 1
                              ? "selected"
                              : ""
                          }
                        >
                          <input
                            type="radio"
                            name={criterion.id}
                            value={i + 1}
                            checked={shownScores[criterion.id] === i + 1}
                            onChange={() =>
                              setScores((current) => ({
                                ...current,
                                [criterion.id]: i + 1,
                              }))
                            }
                          />
                          <strong>{i + 1}</strong>
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="coev-section-heading">
                  <span>02 / Comentarios</span>
                  <h2>Retroalimentación concreta</h2>
                  <p>
                    Describe hechos observables. Estos comentarios quedan
                    asociados a esta respuesta.
                  </p>
                </div>
                <div className="coev-comment-fields">
                  <Field
                    as="textarea"
                    label="Fortalezas"
                    id="strength"
                    maxLength={1000}
                    rows={4}
                    value={item.response?.strength ?? strength}
                    onChange={(e) => setStrength(e.target.value)}
                    disabled={!item.accepting}
                    hint="¿Qué aportó al trabajo del equipo?"
                  />
                  <Field
                    as="textarea"
                    label="Aspectos por mejorar"
                    id="improvement"
                    maxLength={1000}
                    rows={4}
                    value={item.response?.improvement ?? improvement}
                    onChange={(e) => setImprovement(e.target.value)}
                    disabled={!item.accepting}
                    hint="¿Qué acción concreta ayudaría en la siguiente actividad?"
                  />
                </div>
                {formError && (
                  <p className="field-error" role="alert">
                    {formError}
                  </p>
                )}
                <MutationState state={mutation} />
                {item.accepting && (
                  <button
                    className="button button-primary"
                    disabled={mutation.busy}
                    type="submit"
                  >
                    {mutation.busy ? "Enviando…" : "Enviar coevaluación"}
                  </button>
                )}
              </div>
              <aside className="coev-summary" aria-label="Resumen de respuesta">
                <span className="coev-context-label">
                  Resumen de esta respuesta
                </span>
                <h2>{item.peer_name}</h2>
                <p>
                  {values.length} de {criteria.length} criterios respondidos
                </p>
                <div className="coev-score">
                  <strong>{average === null ? "—" : average.toFixed(2)}</strong>
                  <span>de 5 · promedio descriptivo</span>
                </div>
                <p>
                  {percentage === null
                    ? "Completa los criterios para ver el resumen."
                    : `${percentage}% de la escala · ${valuation}`}
                </p>
                <p className="work-help">
                  El promedio aparece al completar todos los criterios y no se
                  usa como nota académica.
                </p>
              </aside>
            </form>
          </>
        )}
      </LoadState>
    </section>
  );
}
