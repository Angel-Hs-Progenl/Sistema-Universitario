import { useState } from "react";
import { Field, BusyButton } from "../../shared/ui";
import { MutationState } from "../../shared/Work";

export default function QuestionnaireEditor({
  source,
  mutation,
  onSave,
  onCancel,
}) {
  const initialSections = [
    ...new Set(source.questions?.map((q) => q.section) || []),
  ];
  const [sections, setSections] = useState(
    [0, 1, 2].map((i) => initialSections[i] || ""),
  );
  const [options, setOptions] = useState(
    source.options || [
      { value: 1, label: "" },
      { value: 2, label: "" },
    ],
  );
  const [questions, setQuestions] = useState(
    source.questions?.map((q) => ({
      text: q.text,
      weight: q.weight,
      section: initialSections.indexOf(q.section),
    })) || [0, 1, 2].map((section) => ({ section, text: "", weight: "" })),
  );
  const edit = (setter, index, key, value) =>
    setter((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  function submit(e) {
    e.preventDefault();
    onSave({
      title: new FormData(e.currentTarget).get("title"),
      options: options.map((o) => ({ value: Number(o.value), label: o.label })),
      questions: questions.map((q, i) => ({
        id: `q${i + 1}`,
        section: sections[q.section],
        text: q.text,
        weight: Number(q.weight),
      })),
    });
  }
  return (
    <form onSubmit={submit}>
      <MutationState state={mutation} />
      <Field
        name="title"
        label="Nombre del cuestionario"
        defaultValue={source.title || ""}
        minLength={3}
        maxLength={150}
        required
      />
      <section className="work-section" id="options" tabIndex={-1}>
        <h3>Escala de respuesta</h3>
        <p className="work-help">
          Define el valor y la etiqueta que verá el estudiante. Usa valores
          distintos entre 1 y 10.
        </p>
        {options.map((option, i) => (
          <fieldset className="work-editor-row" key={i}>
            <legend>Opción {i + 1}</legend>
            <div className="form-grid">
              <Field
                name={`options.${i}.value`}
                label="Valor"
                type="number"
                min="1"
                max="10"
                step="1"
                required
                value={option.value}
                onChange={(e) => edit(setOptions, i, "value", e.target.value)}
              />
              <Field
                name={`options.${i}.label`}
                label="Etiqueta de respuesta"
                maxLength={80}
                required
                value={option.label}
                onChange={(e) => edit(setOptions, i, "label", e.target.value)}
              />
            </div>
            <button
              type="button"
              className="button button-quiet small"
              disabled={options.length <= 2 || mutation.busy}
              aria-label={`Quitar opción ${i + 1}`}
              onClick={() =>
                setOptions((rows) => rows.filter((_, index) => index !== i))
              }
            >
              Quitar opción
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          className="button button-secondary small"
          disabled={options.length >= 10 || mutation.busy}
          onClick={() =>
            setOptions((rows) => [...rows, { value: "", label: "" }])
          }
        >
          Añadir opción a la escala
        </button>
      </section>
      <section className="work-section">
        <h3>Secciones del cuestionario</h3>
        {sections.map((section, i) => (
          <Field
            key={i}
            name={`section-${i}`}
            label={`Nombre de la sección ${i + 1}`}
            required
            maxLength={100}
            value={section}
            onChange={(e) =>
              setSections((rows) =>
                rows.map((value, index) =>
                  index === i ? e.target.value : value,
                ),
              )
            }
          />
        ))}
      </section>
      <section className="work-section" id="questions" tabIndex={-1}>
        <h3>Preguntas y ponderación</h3>
        <p className="work-help">
          Incluye preguntas en las tres secciones. Un peso mayor aumenta la
          influencia de esa pregunta en el promedio.
        </p>
        {questions.map((q, i) => (
          <fieldset className="work-editor-row" key={i}>
            <legend>Pregunta {i + 1}</legend>
            <Field
              name={`questions.${i}.text`}
              label="Texto de la pregunta"
              as="textarea"
              rows={2}
              minLength={5}
              maxLength={500}
              required
              value={q.text}
              onChange={(e) => edit(setQuestions, i, "text", e.target.value)}
            />
            <div className="form-grid">
              <Field
                name={`questions.${i}.section`}
                label="Sección"
                as="select"
                value={q.section}
                onChange={(e) =>
                  edit(setQuestions, i, "section", Number(e.target.value))
                }
              >
                {sections.map((label, n) => (
                  <option key={n} value={n}>
                    {label || `Sección ${n + 1}`}
                  </option>
                ))}
              </Field>
              <Field
                name={`questions.${i}.weight`}
                label="Peso en el promedio"
                type="number"
                min=".01"
                max="100"
                step="any"
                required
                value={q.weight}
                onChange={(e) =>
                  edit(setQuestions, i, "weight", e.target.value)
                }
              />
            </div>
            <button
              type="button"
              className="button button-quiet small"
              disabled={questions.length <= 3 || mutation.busy}
              aria-label={`Quitar pregunta ${i + 1}`}
              onClick={() =>
                setQuestions((rows) => rows.filter((_, index) => index !== i))
              }
            >
              Quitar pregunta
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          className="button button-secondary small"
          disabled={questions.length >= 100 || mutation.busy}
          onClick={() =>
            setQuestions((rows) => [
              ...rows,
              { section: 0, text: "", weight: "" },
            ])
          }
        >
          Añadir pregunta
        </button>
      </section>
      <p className="work-note">
        Confirma preguntas, escala y ponderación con el área responsable antes
        de abrir un periodo. Una nueva versión conserva las anteriores.
      </p>
      <div className="work-actions">
        <BusyButton
          type="submit"
          className="button button-primary"
          busy={mutation.busy}
        >
          Guardar versión
        </BusyButton>
        <button
          type="button"
          disabled={mutation.busy}
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
