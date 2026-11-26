import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api } from "../../shared/api";
import { Field, Empty, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
} from "../../shared/Work";

const initialCriteria = [
  [
    "Responsabilidad y cumplimiento",
    "Cumple sus tareas y los acuerdos del equipo.",
  ],
  ["Comunicación", "Expresa sus ideas y escucha a sus compañeros."],
  ["Colaboración", "Participa y apoya al equipo."],
  ["Calidad del trabajo", "Realiza sus actividades con cuidado."],
  ["Iniciativa y solución de problemas", "Propone ideas y busca soluciones."],
  ["Respeto y actitud profesional", "Respeta opiniones y acepta sugerencias."],
].map(([title, description], i) => ({
  id: `criterio_${i + 1}`,
  title,
  description,
}));

export default function Questionnaires() {
  const state = useAsync(() => api("/coevaluacion/cuestionarios"), []);
  const mutation = useMutation();
  const [title, setTitle] = useState("Trabajo en equipo");
  const [criteria, setCriteria] = useState(initialCriteria);

  function update(index, key, value) {
    setCriteria((current) =>
      current.map((criterion, i) =>
        i === index ? { ...criterion, [key]: value } : criterion,
      ),
    );
  }

  function add() {
    setCriteria((current) => [
      ...current,
      { id: `criterio_${Date.now()}`, title: "", description: "" },
    ]);
  }

  function copyVersion(questionnaire) {
    setTitle(questionnaire.title);
    setCriteria(questionnaire.criteria.map((criterion) => ({ ...criterion })));
    mutation.clear();
    document.getElementById("coev-editor")?.scrollIntoView({ block: "start" });
  }

  async function save(event) {
    event.preventDefault();
    const success = await mutation.run(
      () =>
        api("/coevaluacion/cuestionarios", {
          method: "POST",
          body: { title, criteria },
        }),
      "Nueva versión del cuestionario guardada. Las actividades existentes conservan su versión.",
    );
    if (success) state.refresh();
  }

  return (
    <section className="coev-page">
      <Link className="coev-back" to="/coevaluacion/actividades">
        <ArrowLeft size={16} /> Actividades
      </Link>
      <Heading
        eyebrow="Área académica / Configuración"
        title="Criterios de coevaluación"
      >
        Prepara una versión antes de asignar parejas. Al guardar otra versión,
        las actividades anteriores conservan sus criterios.
      </Heading>
      <div className="coev-admin-grid">
        <form id="coev-editor" className="coev-panel" onSubmit={save}>
          <div className="coev-section-heading">
            <span>01 / Cuestionario</span>
            <h2>Editar criterios</h2>
            <p>
              Los seis criterios iniciales proceden de la propuesta recibida y
              puedes adaptarlos antes de guardar.
            </p>
          </div>
          <Field
            label="Nombre del cuestionario"
            id="coev-title"
            required
            maxLength={150}
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="coev-editor-list">
            {criteria.map((criterion, index) => (
              <div className="coev-editor-item" key={criterion.id}>
                <div className="coev-editor-index">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <button
                    type="button"
                    aria-label={`Eliminar criterio ${index + 1}`}
                    onClick={() =>
                      setCriteria((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    disabled={criteria.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <Field
                  label={`Criterio ${index + 1}`}
                  id={`criterion-title-${index}`}
                  required
                  minLength={3}
                  maxLength={150}
                  value={criterion.title}
                  onChange={(e) => update(index, "title", e.target.value)}
                />
                <Field
                  label="Qué observar"
                  id={`criterion-description-${index}`}
                  required
                  minLength={3}
                  maxLength={300}
                  value={criterion.description}
                  onChange={(e) => update(index, "description", e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="coev-form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={add}
              disabled={criteria.length >= 20}
            >
              <Plus size={16} /> Agregar criterio
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setCriteria(
                  initialCriteria.map((criterion) => ({ ...criterion })),
                )
              }
            >
              Restaurar propuesta inicial
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={mutation.busy}
            >
              {mutation.busy ? "Guardando…" : "Guardar nueva versión"}
            </button>
          </div>
          <MutationState state={mutation} />
        </form>
        <aside className="coev-panel coev-side-list">
          <div className="coev-section-heading">
            <span>02 / Versiones</span>
            <h2>Cuestionarios guardados</h2>
            <p>Una actividad usa la versión que se seleccionó al crearla.</p>
          </div>
          <LoadState state={state} empty="Aún no hay cuestionarios guardados">
            {state.data?.length ? (
              state.data.map((questionnaire) => (
                <article className="coev-version" key={questionnaire.id}>
                  <div>
                    <span className="record-code">
                      Versión {questionnaire.version} ·{" "}
                      {questionnaire.criteria.length} criterios
                    </span>
                    <h3>{questionnaire.title}</h3>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => copyVersion(questionnaire)}
                  >
                    Usar como base
                  </button>
                </article>
              ))
            ) : (
              <Empty title="Aún no hay cuestionarios guardados">
                Guarda la primera versión para preparar una actividad.
              </Empty>
            )}
          </LoadState>
        </aside>
      </div>
    </section>
  );
}
