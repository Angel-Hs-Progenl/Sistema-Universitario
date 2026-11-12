import { useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../../shared/api";
import { Field, Modal, BusyButton, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
} from "../../shared/Work";

const question = () => ({
  id: "q_" + crypto.randomUUID(),
  text: "",
  type: "escala",
  required: true,
  min_value: 1,
  max_value: 5,
  options: [],
  max_length: null,
});
const option = () => ({ value: "o_" + crypto.randomUUID(), label: "" });
const types = {
  escala: "Escala numérica",
  opcion_unica: "Una opción",
  opcion_multiple: "Varias opciones",
  texto_libre: "Texto libre",
};
export default function Questionnaires() {
  const state = useAsync(() => api("/autoevaluacion/cuestionarios"), []);
  const [editing, setEditing] = useState(false),
    [title, setTitle] = useState(""),
    [questions, setQuestions] = useState([]),
    [preview, setPreview] = useState(null);
  const mutation = useMutation();
  function open(source) {
    mutation.clear();
    setTitle(source?.title || "");
    setQuestions(source ? structuredClone(source.questions) : [question()]);
    setEditing(true);
  }
  function update(id, change) {
    setQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, ...change } : q)),
    );
  }
  function changeType(q, type) {
    update(q.id, {
      type,
      min_value: type === "escala" ? 1 : null,
      max_value: type === "escala" ? 5 : null,
      max_length: type === "texto_libre" ? 500 : null,
      options: type.startsWith("opcion_") ? [option(), option()] : [],
    });
  }
  async function save(e) {
    e.preventDefault();
    await mutation.run(async () => {
      await api("/autoevaluacion/cuestionarios", {
        method: "POST",
        body: { title, questions },
      });
      setEditing(false);
      await state.refresh();
    }, "Cuestionario guardado como una nueva versión. Las evaluaciones existentes conservan su versión.");
  }
  return (
    <>
      <Heading
        eyebrow="Autoevaluación / Instrumentos"
        title="Cuestionarios"
        action={
          <button className="button button-primary" onClick={() => open()}>
            <Plus size={16} /> Crear cuestionario
          </button>
        }
      >
        Define las preguntas de cada parcial. Cada versión guardada conserva su
        contenido.
      </Heading>
      {!editing && <MutationState state={mutation} />}
      <LoadState state={state} empty="Aún no hay cuestionarios">
        <div className="work-records">
          {state.data?.map((q) => (
            <article className="work-record" key={q.id}>
              <div>
                <span className="record-code">
                  Versión {q.version} · {q.questions.length}{" "}
                  {q.questions.length === 1 ? "pregunta" : "preguntas"}
                </span>
                <h2>{q.title}</h2>
              </div>
              <div className="work-actions">
                <button
                  className="button button-secondary"
                  onClick={() => setPreview(q)}
                >
                  Consultar preguntas
                </button>
                <button className="text-link" onClick={() => open(q)}>
                  Preparar nueva versión
                </button>
              </div>
            </article>
          ))}
        </div>
      </LoadState>
      {editing && (
        <Modal
          title="Preparar cuestionario"
          onClose={() => {
            if (!mutation.busy) setEditing(false);
          }}
        >
          <form onSubmit={save}>
            <MutationState state={mutation} />
            <Field
              name="title"
              label="Nombre del cuestionario"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={150}
              required
            />
            <p className="work-help">
              Guardar con el mismo nombre crea la siguiente versión. Las
              evaluaciones ya registradas no cambian.
            </p>
            {questions.map((q, i) => (
              <fieldset className="work-editor-row" key={q.id}>
                <legend>Pregunta {i + 1}</legend>
                <Field
                  id={q.id + "-text"}
                  label="Pregunta"
                  as="textarea"
                  rows={2}
                  required
                  minLength={5}
                  maxLength={500}
                  value={q.text}
                  onChange={(e) => update(q.id, { text: e.target.value })}
                />
                <Field
                  id={q.id + "-type"}
                  label="Tipo de respuesta"
                  as="select"
                  value={q.type}
                  onChange={(e) => changeType(q, e.target.value)}
                >
                  {Object.entries(types).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Field>
                {q.type === "escala" && (
                  <div className="form-grid">
                    <Field
                      id={q.id + "-min"}
                      label="Valor mínimo"
                      type="number"
                      min={1}
                      max={9}
                      required
                      value={q.min_value}
                      onChange={(e) =>
                        update(q.id, { min_value: Number(e.target.value) })
                      }
                    />
                    <Field
                      id={q.id + "-max"}
                      label="Valor máximo"
                      type="number"
                      min={q.min_value + 1}
                      max={10}
                      required
                      value={q.max_value}
                      onChange={(e) =>
                        update(q.id, { max_value: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
                {q.type === "texto_libre" && (
                  <Field
                    id={q.id + "-length"}
                    label="Máximo de caracteres"
                    type="number"
                    min={1}
                    max={2000}
                    required
                    value={q.max_length}
                    onChange={(e) =>
                      update(q.id, { max_length: Number(e.target.value) })
                    }
                  />
                )}
                {q.type.startsWith("opcion_") && (
                  <div>
                    {q.options.map((o, j) => (
                      <div className="self-option-editor" key={o.value}>
                        <Field
                          id={q.id + "-" + o.value}
                          label={"Opción " + (j + 1)}
                          required
                          maxLength={120}
                          value={o.label}
                          onChange={(e) =>
                            update(q.id, {
                              options: q.options.map((v) =>
                                v.value === o.value
                                  ? { ...v, label: e.target.value }
                                  : v,
                              ),
                            })
                          }
                        />
                        <button
                          className="button button-secondary small"
                          type="button"
                          disabled={q.options.length <= 2}
                          aria-label={
                            "Quitar opción " +
                            (j + 1) +
                            " de pregunta " +
                            (i + 1)
                          }
                          onClick={() =>
                            update(q.id, {
                              options: q.options.filter(
                                (v) => v.value !== o.value,
                              ),
                            })
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      className="text-link"
                      type="button"
                      disabled={q.options.length >= 20}
                      onClick={() =>
                        update(q.id, { options: [...q.options, option()] })
                      }
                    >
                      Agregar opción
                    </button>
                  </div>
                )}
                <div className="self-editor-footer">
                  <label className="self-check">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) =>
                        update(q.id, { required: e.target.checked })
                      }
                    />
                    Respuesta obligatoria
                  </label>
                  <button
                    className="text-link"
                    type="button"
                    disabled={questions.length <= 1}
                    onClick={() =>
                      setQuestions((current) =>
                        current.filter((v) => v.id !== q.id),
                      )
                    }
                  >
                    Quitar pregunta {i + 1}
                  </button>
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              className="button button-secondary"
              disabled={questions.length >= 100}
              onClick={() =>
                setQuestions((current) => [...current, question()])
              }
            >
              <Plus size={16} /> Agregar pregunta
            </button>
            <div className="self-editor-footer">
              <BusyButton
                className="button button-primary"
                type="submit"
                busy={mutation.busy}
              >
                Guardar versión
              </BusyButton>
              <button
                type="button"
                className="button button-secondary"
                disabled={mutation.busy}
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {preview && (
        <Modal
          title={preview.title + " · v" + preview.version}
          onClose={() => setPreview(null)}
        >
          {preview.questions.map((q, i) => (
            <section className="work-section" key={q.id}>
              <h3>
                {i + 1}. {q.text}
              </h3>
              <p className="work-help">
                {types[q.type]} · {q.required ? "Obligatoria" : "Opcional"}
                {q.type === "escala"
                  ? " · " + q.min_value + " a " + q.max_value
                  : ""}
              </p>
              {q.options?.length > 0 && (
                <ul>
                  {q.options.map((o) => (
                    <li key={o.value}>{o.label}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <button
            className="button button-secondary"
            onClick={() => setPreview(null)}
          >
            Cerrar cuestionario
          </button>
        </Modal>
      )}
    </>
  );
}
