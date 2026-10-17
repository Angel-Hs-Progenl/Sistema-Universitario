
import {
  FileText,
  Download,
  ShieldCheck,
  LockKeyhole,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  ClipboardList
} from "lucide-react";

import {
  DOCENTE,
  SECCIONES_CON_PROMEDIO,
  COMENTARIOS_PUBLICABLES,
  REPORTE_AUTORIZADO_DEMO,
  PROMEDIO_GENERAL,
  FORTALEZA,
  AREA_OPORTUNIDAD,
  TOTAL_RESPUESTAS
} from "../../data/docenteMock";

import "./ReporteDocente.css";

export default function ReporteDocente() {
  // Datos compartidos con el resto del módulo docente
  const secciones = SECCIONES_CON_PROMEDIO;
  const promedioGeneral = PROMEDIO_GENERAL;
  const fortaleza = FORTALEZA;
  const oportunidad = AREA_OPORTUNIDAD;
  const comentarios = COMENTARIOS_PUBLICABLES;

  // Guardar desde la ventana de impresión del navegador
  const imprimir = () => {
    window.print();
  };

  const camposPlanAccion = [
    "Área de oportunidad",
    "Acción de mejora",
    "Responsable",
    "Fecha de implementación",
    "Fecha de seguimiento",
    "Evidencia esperada",
    "Estatus"
  ];

  return (
    <div className="rp-page">

      {/* ENCABEZADO DE LA PÁGINA */}
      <div className="rp-top">
        <div>
          <h1>Mi reporte final</h1>

          <p>
            Consulta tu reporte individual
            de evaluación docente.
          </p>
        </div>

        {REPORTE_AUTORIZADO_DEMO && (
          <button
            className="rp-download"
            type="button"
            onClick={imprimir}
          >
            <Download size={18} />
            Guardar como PDF
          </button>
        )}
      </div>

      {/* AVISO DE DEMOSTRACIÓN */}
      <p className="rp-demo">
        Demostración con datos simulados.
        La publicación real requiere autorización
        de Dirección Académica.
      </p>

      {!REPORTE_AUTORIZADO_DEMO ? (

        /* REPORTE BLOQUEADO */
        <section className="rp-locked">
          <LockKeyhole size={42} />

          <h2>Reporte pendiente de autorización</h2>

          <p>
            Tu reporte final estará disponible cuando
            Dirección Académica autorice su publicación.
          </p>
        </section>

      ) : (

        /* DOCUMENTO DEL REPORTE */
        <article className="rp-document">

          {/* ENCABEZADO INSTITUCIONAL */}
          <header className="rp-document-header">
            <div className="rp-brand">
              <div className="rp-logo">UTO</div>

              <div>
                <strong>
                  Universidad Tecnológica de Oriental
                </strong>

                <span>
                  Evaluación del desempeño docente
                </span>
              </div>
            </div>

            <span className="rp-report-tag">
              <FileText size={16} />
              Reporte individual
            </span>
          </header>

          <div className="rp-document-title">
            <h2>
              Reporte final de evaluación docente
            </h2>

            <p>Periodo {DOCENTE.periodo}</p>
          </div>

          {/* 01. DATOS GENERALES */}
          <section className="rp-section">
            <h3>01. Datos generales</h3>

            <div className="rp-info-grid">

              <div>
                <span>Nombre del docente</span>
                <strong>{DOCENTE.nombre}</strong>
              </div>

              <div>
                <span>Departamento</span>
                <strong>{DOCENTE.departamento}</strong>
              </div>

              <div>
                <span>Carrera</span>
                <strong>{DOCENTE.carrera}</strong>
              </div>

              <div>
                <span>Evaluaciones consideradas</span>
                <strong>{DOCENTE.evaluaciones}</strong>
              </div>

              <div>
                <span>Respuestas recibidas</span>
                <strong>{TOTAL_RESPUESTAS}</strong>
              </div>

              <div className="rp-info-wide">
                <span>Asignaturas</span>

                <strong>
                  {DOCENTE.asignaturas.join(", ")}
                </strong>
              </div>

            </div>
          </section>

          {/* 02. RESULTADO GENERAL */}
          <section className="rp-section">
            <h3>02. Resultado general</h3>

            <div className="rp-score">
              <div>
                <span>
                  Promedio general obtenido
                </span>

                <strong>
                  {promedioGeneral.toFixed(2)}
                  <small> / 5.00</small>
                </strong>

                <p>
                  Escala de evaluación de 1 a 5
                </p>
              </div>

              <ShieldCheck size={38} />
            </div>
          </section>

          {/* 03. RESULTADOS POR SECCIÓN */}
          <section className="rp-section">
            <h3>03. Resultados por sección</h3>

            <div className="rp-sections">
              {secciones.map((seccion) => (
                <div
                  key={seccion.id}
                  className="rp-section-score"
                >
                  <div className="rp-section-score-top">
                    <span>
                      Sección {seccion.id}: {seccion.nombre}
                    </span>

                    <strong>
                      {seccion.promedio.toFixed(2)}
                    </strong>
                  </div>

                  <div className="rp-bar">
                    <span
                      style={{
                        width: `${
                          (seccion.promedio / 5) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 04. RESULTADOS POR PREGUNTA */}
          <section className="rp-section">
            <h3>04. Resultados por pregunta</h3>

            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Sección</th>
                    <th>Pregunta / Criterio</th>
                    <th>Promedio</th>
                  </tr>
                </thead>

                <tbody>
                  {secciones.flatMap((seccion) =>
                    seccion.preguntas.map((pregunta) => (
                      <tr key={pregunta.id}>
                        <td>
                          Sección {seccion.id}
                        </td>

                        <td>{pregunta.nombre}</td>

                        <td>
                          <strong>
                            {pregunta.promedio.toFixed(1)}
                          </strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 05. FORTALEZAS Y ÁREAS DE OPORTUNIDAD */}
          <section className="rp-section">
            <h3>
              05. Fortalezas y áreas de oportunidad
            </h3>

            <div className="rp-highlights">

              <div className="rp-highlight rp-positive">
                <TrendingUp size={21} />

                <span>Principal fortaleza</span>

                <strong>
                  {fortaleza.nombre}
                </strong>

                <b>
                  {fortaleza.promedio.toFixed(1)} / 5
                </b>
              </div>

              <div className="rp-highlight rp-improve">
                <AlertTriangle size={21} />

                <span>
                  Principal área de oportunidad
                </span>

                <strong>
                  {oportunidad.nombre}
                </strong>

                <b>
                  {oportunidad.promedio.toFixed(1)} / 5
                </b>
              </div>

            </div>
          </section>

          {/* 06. COMENTARIOS DE LOS ESTUDIANTES */}
          <section className="rp-section">
            <h3>
              06. Comentarios de los estudiantes
            </h3>

            <div className="rp-comments">
              {comentarios.length === 0 ? (
                <p>
                  No hay comentarios disponibles
                  para este periodo.
                </p>
              ) : (
                comentarios.map((comentario) => (
                  <div
                    className="rp-comment"
                    key={comentario.id}
                  >
                    <MessageSquare size={17} />

                    <p>
                      {comentario.texto}
                    </p>
                  </div>
                ))
              )}
            </div>

            <p className="rp-privacy">
              Los comentarios se muestran sin nombres
              de estudiantes y únicamente cuando
              cumplen las condiciones de publicación
              configuradas para esta demostración.
            </p>
          </section>

          {/* 07. ANÁLISIS GENERAL */}
          <section className="rp-section">
            <h3>07. Análisis general</h3>

            <div className="rp-analysis">

              <p>
                El docente obtuvo un promedio general
                de{" "}
                <strong>
                  {promedioGeneral.toFixed(2)} / 5
                </strong>.
                El criterio mejor evaluado fue{" "}
                <strong>{fortaleza.nombre}</strong>,
                con una calificación de{" "}
                <strong>
                  {fortaleza.promedio.toFixed(1)}
                </strong>.
              </p>

              <p>
                Por otra parte, el criterio{" "}
                <strong>{oportunidad.nombre}</strong>{" "}
                presentó el promedio más bajo,
                con una calificación de{" "}
                <strong>
                  {oportunidad.promedio.toFixed(1)}
                </strong>.
                Se recomienda considerar este resultado
                durante la retroalimentación académica
                y la elaboración del plan de acción.
              </p>

            </div>

            <p className="rp-privacy">
              Este resumen se genera mediante cálculos
              sobre los datos simulados. No es todavía
              un análisis realizado con Inteligencia
              Artificial.
            </p>
          </section>

          {/* 08. RETROALIMENTACIÓN DE DIRECCIÓN */}
          <section className="rp-section">
            <h3>
              08. Retroalimentación de Dirección Académica
            </h3>

            <div className="rp-pending">
              <ClipboardList size={21} />

              <p>
                Pendiente de registro por
                Dirección Académica.
              </p>
            </div>
          </section>

          {/* 09. PLAN DE ACCIÓN */}
          <section className="rp-section">
            <h3>09. Plan de acción</h3>

            <div className="rp-table-wrap">
              <table className="rp-table">
                <tbody>
                  {camposPlanAccion.map((campo) => (
                    <tr key={campo}>
                      <th scope="row">
                        {campo}
                      </th>

                      <td>
                        Pendiente de registro
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PIE DEL REPORTE */}
          <footer className="rp-footer">
            <span>
              Evaluación Docente UTO
            </span>

            <span>
              Reporte individual · Confidencial
            </span>
          </footer>

        </article>
      )}

    </div>
  );
}
