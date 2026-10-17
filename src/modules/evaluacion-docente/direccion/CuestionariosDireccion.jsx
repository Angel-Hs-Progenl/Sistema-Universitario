
import { useState } from "react";

import {
  ClipboardList,
  Layers3,
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  CheckCircle2,
  CircleOff
} from "lucide-react";

import {
  CUESTIONARIO_DIRECCION,
  ESCALA_EVALUACION
} from "../../data/direccionMock";

import "./CuestionariosDireccion.css";

function copiarCuestionario() {
  return CUESTIONARIO_DIRECCION.map((seccion) => ({
    ...seccion,
    preguntas: seccion.preguntas.map((pregunta) => ({
      ...pregunta
    }))
  }));
}

export default function CuestionariosDireccion() {
  const [secciones, setSecciones] = useState(
    copiarCuestionario
  );

  const [formPregunta, setFormPregunta] = useState(null);
  const [seccionEditando, setSeccionEditando] = useState(null);
  const [nombreSeccion, setNombreSeccion] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const totalPreguntas = secciones.reduce(
    (total, seccion) => total + seccion.preguntas.length,
    0
  );

  const totalActivas = secciones.reduce(
    (total, seccion) =>
      total +
      seccion.preguntas.filter((pregunta) => pregunta.activa)
        .length,
    0
  );

  const mostrarExito = (texto) => {
    setMensaje(texto);
    setError("");
  };

  const mostrarError = (texto) => {
    setError(texto);
    setMensaje("");
  };

  const nuevaPregunta = (seccionId) => {
    setFormPregunta({
      seccionId,
      preguntaId: null,
      texto: ""
    });

    setError("");
    setMensaje("");
  };

  const editarPregunta = (seccionId, pregunta) => {
    setFormPregunta({
      seccionId,
      preguntaId: pregunta.id,
      texto: pregunta.texto
    });

    setError("");
    setMensaje("");
  };

  const guardarPregunta = (e) => {
    e.preventDefault();

    if (!formPregunta) return;

    const texto = formPregunta.texto.trim();

    if (!texto) {
      mostrarError("Escribe el texto de la pregunta.");
      return;
    }

    const seccion = secciones.find(
      (item) => item.id === formPregunta.seccionId
    );

    if (!seccion) {
      mostrarError("No se encontró la sección seleccionada.");
      return;
    }

    const preguntaRepetida = seccion.preguntas.some(
      (pregunta) =>
        pregunta.texto.toLowerCase() === texto.toLowerCase() &&
        pregunta.id !== formPregunta.preguntaId
    );

    if (preguntaRepetida) {
      mostrarError("Esta pregunta ya existe en la sección.");
      return;
    }

    if (formPregunta.preguntaId !== null) {
      setSecciones((actuales) =>
        actuales.map((item) =>
          item.id === formPregunta.seccionId
            ? {
                ...item,
                preguntas: item.preguntas.map((pregunta) =>
                  pregunta.id === formPregunta.preguntaId
                    ? { ...pregunta, texto }
                    : pregunta
                )
              }
            : item
        )
      );

      mostrarExito("Pregunta actualizada en la demostración.");
    } else {
      const ids = secciones.flatMap((item) =>
        item.preguntas.map((pregunta) => pregunta.id)
      );

      const nuevoId = Math.max(0, ...ids) + 1;

      setSecciones((actuales) =>
        actuales.map((item) =>
          item.id === formPregunta.seccionId
            ? {
                ...item,
                preguntas: [
                  ...item.preguntas,
                  {
                    id: nuevoId,
                    texto,
                    activa: true
                  }
                ]
              }
            : item
        )
      );

      mostrarExito("Pregunta agregada en la demostración.");
    }

    setFormPregunta(null);
  };

  const cambiarEstadoPregunta = (seccionId, preguntaId) => {
    setSecciones((actuales) =>
      actuales.map((seccion) =>
        seccion.id === seccionId
          ? {
              ...seccion,
              preguntas: seccion.preguntas.map((pregunta) =>
                pregunta.id === preguntaId
                  ? { ...pregunta, activa: !pregunta.activa }
                  : pregunta
              )
            }
          : seccion
      )
    );

    mostrarExito("Estado de la pregunta actualizado.");
  };

  const eliminarPregunta = (seccionId, preguntaId) => {
    const confirmado = window.confirm(
      "¿Deseas eliminar esta pregunta de la demostración?"
    );

    if (!confirmado) return;

    setSecciones((actuales) =>
      actuales.map((seccion) =>
        seccion.id === seccionId
          ? {
              ...seccion,
              preguntas: seccion.preguntas.filter(
                (pregunta) => pregunta.id !== preguntaId
              )
            }
          : seccion
      )
    );

    if (formPregunta?.preguntaId === preguntaId) {
      setFormPregunta(null);
    }

    mostrarExito("Pregunta eliminada de la demostración.");
  };

  const moverPregunta = (seccionId, indice, direccion) => {
    setSecciones((actuales) =>
      actuales.map((seccion) => {
        if (seccion.id !== seccionId) return seccion;

        const preguntas = [...seccion.preguntas];
        const destino = indice + direccion;

        if (destino < 0 || destino >= preguntas.length) {
          return seccion;
        }

        [preguntas[indice], preguntas[destino]] = [
          preguntas[destino],
          preguntas[indice]
        ];

        return { ...seccion, preguntas };
      })
    );

    mostrarExito("Orden de las preguntas actualizado.");
  };

  const editarNombreSeccion = (seccion) => {
    setSeccionEditando(seccion.id);
    setNombreSeccion(seccion.nombre);
    setFormPregunta(null);
    setError("");
  };

  const guardarNombreSeccion = (e) => {
    e.preventDefault();

    const nombre = nombreSeccion.trim();

    if (!nombre) {
      mostrarError("El nombre de la sección es obligatorio.");
      return;
    }

    const repetida = secciones.some(
      (seccion) =>
        seccion.id !== seccionEditando &&
        seccion.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (repetida) {
      mostrarError("Ya existe una sección con ese nombre.");
      return;
    }

    setSecciones((actuales) =>
      actuales.map((seccion) =>
        seccion.id === seccionEditando
          ? { ...seccion, nombre }
          : seccion
      )
    );

    setSeccionEditando(null);
    mostrarExito("Nombre de la sección actualizado.");
  };

  return (
    <div className="cd-page">

      {/* ENCABEZADO */}
      <header className="cd-heading">
        <div>
          <h1>Gestión de cuestionarios</h1>
          <p>
            Administra las secciones y preguntas
            de la evaluación docente.
          </p>
        </div>

        <span className="cd-heading-label">
          Evaluación docente · Escala 1–5
        </span>
      </header>

      <p className="cd-demo">
        Configuración de demostración. Los cambios
        son temporales y aún no se publican en el
        formulario de evaluación del estudiante.
      </p>

      {/* INDICADORES */}
      <section className="cd-stats">
        <article className="cd-stat">
          <div className="cd-stat-icon">
            <Layers3 size={21} />
          </div>
          <span>Secciones</span>
          <strong>{secciones.length}</strong>
        </article>

        <article className="cd-stat">
          <div className="cd-stat-icon">
            <ClipboardList size={21} />
          </div>
          <span>Preguntas registradas</span>
          <strong>{totalPreguntas}</strong>
        </article>

        <article className="cd-stat">
          <div className="cd-stat-icon">
            <ListChecks size={21} />
          </div>
          <span>Preguntas activas</span>
          <strong>{totalActivas}</strong>
        </article>
      </section>

      {/* MENSAJES */}
      {error && (
        <p className="cd-message cd-error" role="alert">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="cd-message cd-success" role="status">
          {mensaje}
        </p>
      )}

      {/* ESCALA */}
      <section className="cd-panel">
        <div className="cd-panel-top">
          <div>
            <h2>Escala de evaluación</h2>
            <p>
              Cada pregunta activa se responderá
              mediante una valoración del 1 al 5.
            </p>
          </div>
        </div>

        <div className="cd-scale">
          {ESCALA_EVALUACION.map((nivel) => (
            <div className="cd-scale-item" key={nivel.valor}>
              <strong>{nivel.valor}</strong>
              <span>{nivel.etiqueta}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULARIO DE PREGUNTA */}
      {formPregunta && (
        <section className="cd-panel" id="cd-editor-pregunta">
          <div className="cd-panel-top">
            <div>
              <h2>
                {formPregunta.preguntaId !== null
                  ? "Editar pregunta"
                  : "Nueva pregunta"}
              </h2>
              <p>
                Escribe el criterio que evaluará el estudiante.
              </p>
            </div>

            <button
              type="button"
              className="cd-icon-button"
              aria-label="Cerrar formulario"
              onClick={() => setFormPregunta(null)}
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={guardarPregunta} className="cd-form">
            <label>
              <span>Sección</span>
              <select
                value={formPregunta.seccionId}
                disabled={formPregunta.preguntaId !== null}
                onChange={(e) =>
                  setFormPregunta((actual) => ({
                    ...actual,
                    seccionId: Number(e.target.value)
                  }))
                }
              >
                {secciones.map((seccion) => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Texto de la pregunta</span>
              <textarea
                rows={3}
                value={formPregunta.texto}
                onChange={(e) =>
                  setFormPregunta((actual) => ({
                    ...actual,
                    texto: e.target.value
                  }))
                }
                placeholder="Escribe el criterio de evaluación..."
                required
              />
            </label>

            <div className="cd-form-actions">
              <button
                type="button"
                className="cd-secondary-button"
                onClick={() => setFormPregunta(null)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="cd-primary-button"
              >
                <Save size={17} />
                Guardar pregunta
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SECCIONES DEL CUESTIONARIO */}
      {secciones.map((seccion, indiceSeccion) => (
        <section className="cd-panel" key={seccion.id}>
          <div className="cd-section-header">
            <div className="cd-section-number">
              {indiceSeccion + 1}
            </div>

            <div className="cd-section-title">
              <span>
                SECCIÓN {indiceSeccion + 1}
              </span>

              {seccionEditando === seccion.id ? (
                <form
                  className="cd-section-edit"
                  onSubmit={guardarNombreSeccion}
                >
                  <input
                    type="text"
                    value={nombreSeccion}
                    onChange={(e) =>
                      setNombreSeccion(e.target.value)
                    }
                    aria-label="Nombre de la sección"
                    required
                  />

                  <button
                    type="submit"
                    className="cd-small-button"
                    aria-label="Guardar nombre"
                  >
                    <Save size={16} />
                  </button>

                  <button
                    type="button"
                    className="cd-small-button"
                    aria-label="Cancelar edición"
                    onClick={() => {
                      setSeccionEditando(null);
                      setError("");
                    }}
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <h2>{seccion.nombre}</h2>
              )}

              <p>
                {seccion.preguntas.length} preguntas ·{" "}
                {seccion.preguntas.filter(
                  (pregunta) => pregunta.activa
                ).length} activas
              </p>
            </div>

            {seccionEditando !== seccion.id && (
              <button
                type="button"
                className="cd-secondary-button"
                onClick={() => editarNombreSeccion(seccion)}
              >
                <Pencil size={16} />
                Editar sección
              </button>
            )}
          </div>

          {/* PREGUNTAS */}
          <div className="cd-questions">
            {seccion.preguntas.length === 0 ? (
              <p className="cd-empty">
                Esta sección todavía no tiene preguntas.
              </p>
            ) : (
              seccion.preguntas.map((pregunta, indice) => (
                <div
                  className="cd-question"
                  key={pregunta.id}
                >
                  <div className="cd-question-index">
                    {indice + 1}
                  </div>

                  <div className="cd-question-content">
                    <strong>{pregunta.texto}</strong>

                    <div className="cd-question-meta">
                      <span
                        className={
                          pregunta.activa
                            ? "cd-status cd-status-active"
                            : "cd-status cd-status-inactive"
                        }
                      >
                        {pregunta.activa
                          ? <CheckCircle2 size={13} />
                          : <CircleOff size={13} />}
                        {pregunta.activa
                          ? "Activa"
                          : "Inactiva"}
                      </span>

                      <span>Escala del 1 al 5</span>
                    </div>
                  </div>

                  <div className="cd-question-actions">
                    <button
                      type="button"
                      className="cd-icon-button"
                      title="Subir pregunta"
                      aria-label="Subir pregunta"
                      disabled={indice === 0}
                      onClick={() =>
                        moverPregunta(seccion.id, indice, -1)
                      }
                    >
                      <ArrowUp size={17} />
                    </button>

                    <button
                      type="button"
                      className="cd-icon-button"
                      title="Bajar pregunta"
                      aria-label="Bajar pregunta"
                      disabled={
                        indice === seccion.preguntas.length - 1
                      }
                      onClick={() =>
                        moverPregunta(seccion.id, indice, 1)
                      }
                    >
                      <ArrowDown size={17} />
                    </button>

                    <button
                      type="button"
                      className="cd-icon-button"
                      title="Editar pregunta"
                      aria-label="Editar pregunta"
                      onClick={() =>
                        editarPregunta(seccion.id, pregunta)
                      }
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      className="cd-toggle-button"
                      onClick={() =>
                        cambiarEstadoPregunta(
                          seccion.id,
                          pregunta.id
                        )
                      }
                    >
                      {pregunta.activa
                        ? "Desactivar"
                        : "Activar"}
                    </button>

                    <button
                      type="button"
                      className="cd-icon-button cd-danger-button"
                      title="Eliminar pregunta"
                      aria-label="Eliminar pregunta"
                      onClick={() =>
                        eliminarPregunta(
                          seccion.id,
                          pregunta.id
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            className="cd-add-button"
            onClick={() => nuevaPregunta(seccion.id)}
          >
            <Plus size={18} />
            Agregar pregunta a esta sección
          </button>
        </section>
      ))}

      <p className="cd-footer-note">
        Las tres secciones se mantienen fijas para esta
        versión del proyecto. El cuestionario definitivo
        deberá validarse con Dirección Académica antes
        de habilitar evaluaciones reales.
      </p>
    </div>
  );
}
