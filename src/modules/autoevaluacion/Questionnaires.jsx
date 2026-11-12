

import { useEffect, useState } from "react";
import { api } from "../../shared/api";

const createQuestion = () => ({
  id: `pregunta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  type: "escala",
  text: "",
  required: true,
  options: [],
  min_value: 1,
  max_value: 5,
  max_length: null,
});

const createOption = (index) => ({
  value: `opcion_${index + 1}`,
  label: "",
});

export default function Questionnaires() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([createQuestion()]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Consultar los cuestionarios guardados.
  async function loadQuestionnaires() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/autoevaluacion/cuestionarios");
      setQuestionnaires(data);
    } catch (err) {
      setError(err.message || "No fue posible cargar los cuestionarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  // Actualizar una propiedad de una pregunta.
  function updateQuestion(index, changes) {
    setQuestions((current) =>
      current.map((question, i) =>
        i === index ? { ...question, ...changes } : question
      )
    );
  }

  // Cambiar el tipo de pregunta y limpiar sus propiedades anteriores.
  function changeQuestionType(index, type) {
    const base = {
      type,
      options: [],
      min_value: null,
      max_value: null,
      max_length: null,
    };

    if (type === "escala") {
      base.min_value = 1;
      base.max_value = 5;
    }

    if (type === "opcion_unica" || type === "opcion_multiple") {
      base.options = [createOption(0), createOption(1)];
    }

    if (type === "texto_libre") {
      base.max_length = 500;
    }

    updateQuestion(index, base);
  }

  function addQuestion() {
    if (questions.length >= 100) {
      setError("Un cuestionario puede tener máximo 100 preguntas.");
      return;
    }

    setError("");
    setQuestions((current) => [...current, createQuestion()]);
  }

  function removeQuestion(index) {
    setQuestions((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function addOption(questionIndex) {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;
        if (question.options.length >= 20) return question;

        return {
          ...question,
          options: [
            ...question.options,
            createOption(question.options.length),
          ],
        };
      })
    );
  }

  function updateOption(questionIndex, optionIndex, changes) {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        return {
          ...question,
          options: question.options.map((option, j) =>
            j === optionIndex ? { ...option, ...changes } : option
          ),
        };
      })
    );
  }

  function removeOption(questionIndex, optionIndex) {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        return {
          ...question,
          options: question.options.filter((_, j) => j !== optionIndex),
        };
      })
    );
  }

  // Validaciones básicas antes de enviar los datos.
  function validateForm() {
    if (title.trim().length < 3) {
      return "El título debe tener al menos 3 caracteres.";
    }

    if (questions.length < 1) {
      return "Agrega al menos una pregunta.";
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (question.text.trim().length < 5) {
        return `La pregunta ${i + 1} debe tener al menos 5 caracteres.`;
      }

      if (
        question.type === "escala" &&
        !(
          question.min_value >= 1 &&
          question.min_value < question.max_value &&
          question.max_value <= 10
        )
      ) {
        return `Revisa los valores de la escala de la pregunta ${i + 1}.`;
      }

      if (
        question.type === "texto_libre" &&
        !(question.max_length >= 1 && question.max_length <= 2000)
      ) {
        return `La longitud máxima de la pregunta ${i + 1} debe estar entre 1 y 2000.`;
      }

      if (
        question.type === "opcion_unica" ||
        question.type === "opcion_multiple"
      ) {
        if (
          question.options.length < 2 ||
          question.options.length > 20
        ) {
          return `La pregunta ${i + 1} necesita entre 2 y 20 opciones.`;
        }

        const values = question.options.map((option) =>
          option.value.trim()
        );

        if (
          values.some((value) => !/^[a-zA-Z0-9_-]+$/.test(value)) ||
          new Set(values).size !== values.length
        ) {
          return `Los valores de las opciones de la pregunta ${i + 1} deben ser válidos y únicos.`;
        }

        if (
          question.options.some(
            (option) =>
              !option.label.trim() || option.label.trim().length > 120
          )
        ) {
          return `Completa las etiquetas de las opciones de la pregunta ${i + 1}.`;
        }
      }
    }

    const ids = questions.map((question) => question.id);

    if (new Set(ids).size !== ids.length) {
      return "Los identificadores de las preguntas deben ser únicos.";
    }

    return "";
  }

  // Guardar el cuestionario en el backend.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: title.trim(),
      questions: questions.map((question) => ({
        ...question,
        text: question.text.trim(),
        options: question.options.map((option) => ({
          value: option.value.trim(),
          label: option.label.trim(),
        })),
      })),
    };

    setSaving(true);

    try {
      await api("/autoevaluacion/cuestionarios", {
        method: "POST",
        body: payload,
      });

      setTitle("");
      setQuestions([createQuestion()]);
      setMessage("Cuestionario guardado correctamente.");

      await loadQuestionnaires();
    } catch (err) {
      setError(err.message || "No fue posible guardar el cuestionario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="self-evaluation-page">
      <header className="self-evaluation-heading">
        <h1>Administración de autoevaluación</h1>
        <p>
          Crea cuestionarios y administra las preguntas que responderá
          la comunidad estudiantil.
        </p>
      </header>

      <div className="self-evaluation-section">
        <h2>Crear cuestionario</h2>

        <form onSubmit={handleSubmit}>
          <div className="self-evaluation-field">
            <label htmlFor="questionnaire-title">
              Nombre del cuestionario
            </label>
            <input
              id="questionnaire-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={150}
              placeholder="Ej. Autoevaluación del primer parcial"
              required
            />
          </div>

          <div className="self-evaluation-questions">
            {questions.map((question, index) => (
              <article className="self-evaluation-question" key={question.id}>
                <div className="self-evaluation-question-heading">
                  <h3>Pregunta {index + 1}</h3>

                  <button
                    type="button"
                    className="self-evaluation-remove"
                    onClick={() => removeQuestion(index)}
                    disabled={questions.length === 1}
                  >
                    Eliminar
                  </button>
                </div>

                <div className="self-evaluation-field">
                  <label>Enunciado</label>
                  <textarea
                    value={question.text}
                    onChange={(event) =>
                      updateQuestion(index, { text: event.target.value })
                    }
                    minLength={5}
                    maxLength={500}
                    rows={3}
                    placeholder="Escribe aquí la pregunta..."
                    required
                  />
                </div>

                <div className="self-evaluation-field">
                  <label>Tipo de respuesta</label>
                  <select
                    value={question.type}
                    onChange={(event) =>
                      changeQuestionType(index, event.target.value)
                    }
                  >
                    <option value="escala">Escala numérica</option>
                    <option value="opcion_unica">Opción única</option>
                    <option value="opcion_multiple">Opción múltiple</option>
                    <option value="texto_libre">Texto libre</option>
                  </select>
                </div>

                {question.type === "escala" && (
                  <div className="self-evaluation-inline-fields">
                    <div className="self-evaluation-field">
                      <label>Valor mínimo</label>
                      <input
                        type="number"
                        min="1"
                        max="9"
                        value={question.min_value}
                        onChange={(event) =>
                          updateQuestion(index, {
                            min_value: Number(event.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="self-evaluation-field">
                      <label>Valor máximo</label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={question.max_value}
                        onChange={(event) =>
                          updateQuestion(index, {
                            max_value: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {(question.type === "opcion_unica" ||
                  question.type === "opcion_multiple") && (
                  <div className="self-evaluation-options">
                    <h4>Opciones de respuesta</h4>

                    {question.options.map((option, optionIndex) => (
                      <div
                        className="self-evaluation-option"
                        key={optionIndex}
                      >
                        <input
                          aria-label={`Valor de opción ${optionIndex + 1}`}
                          value={option.value}
                          maxLength={60}
                          onChange={(event) =>
                            updateOption(index, optionIndex, {
                              value: event.target.value,
                            })
                          }
                          placeholder="Valor: opcion_1"
                        />

                        <input
                          aria-label={`Etiqueta de opción ${optionIndex + 1}`}
                          value={option.label}
                          maxLength={120}
                          onChange={(event) =>
                            updateOption(index, optionIndex, {
                              label: event.target.value,
                            })
                          }
                          placeholder="Texto visible: Sí"
                        />

                        <button
                          type="button"
                          className="self-evaluation-remove"
                          disabled={question.options.length <= 2}
                          onClick={() =>
                            removeOption(index, optionIndex)
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="self-evaluation-secondary"
                      onClick={() => addOption(index)}
                      disabled={question.options.length >= 20}
                    >
                      + Agregar opción
                    </button>
                  </div>
                )}

                {question.type === "texto_libre" && (
                  <div className="self-evaluation-field">
                    <label>Longitud máxima de respuesta</label>
                    <input
                      type="number"
                      min="1"
                      max="2000"
                      value={question.max_length}
                      onChange={(event) =>
                        updateQuestion(index, {
                          max_length: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                )}

                <label className="self-evaluation-required">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) =>
                      updateQuestion(index, {
                        required: event.target.checked,
                      })
                    }
                  />
                  Pregunta obligatoria
                </label>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="self-evaluation-secondary"
            onClick={addQuestion}
            disabled={questions.length >= 100}
          >
            + Agregar pregunta
          </button>

          {error && (
            <p className="self-evaluation-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="self-evaluation-success" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="self-evaluation-primary"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cuestionario"}
          </button>
        </form>
      </div>

      <div className="self-evaluation-section">
        <h2>Cuestionarios registrados</h2>

        {loading ? (
          <p>Cargando cuestionarios...</p>
        ) : questionnaires.length === 0 ? (
          <p>Aún no hay cuestionarios registrados.</p>
        ) : (
          <div className="self-evaluation-list">
            {questionnaires.map((questionnaire) => (
              <article
                className="self-evaluation-list-item"
                key={questionnaire.id}
              >
                <div>
                  <h3>{questionnaire.title}</h3>
                  <p>
                    Versión {questionnaire.version} ·{" "}
                    {questionnaire.questions.length} preguntas
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
