
import { useState } from "react";

import {
  ChartColumn,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  LockKeyhole
} from "lucide-react";

import {
  PERIODO_ACTUAL,
  REPORTE_AUTORIZADO_DEMO,
  SECCIONES_CON_PROMEDIO,
  PROMEDIO_GENERAL,
  FORTALEZA,
  AREA_OPORTUNIDAD
} from "../../data/docenteMock";

import "./ResultadosDocente.css";

export default function ResultadosDocente() {
  const [filtro, setFiltro] = useState("todas");

  // Los datos ya están calculados en docenteMock.js
  const secciones = SECCIONES_CON_PROMEDIO;
  const promedioGeneral = PROMEDIO_GENERAL;
  const fortaleza = FORTALEZA;
  const oportunidad = AREA_OPORTUNIDAD;

  // Mostrar preguntas de todas las secciones
  // o solamente de la sección seleccionada.
  const preguntasVisibles = secciones
    .filter(
      (seccion) =>
        filtro === "todas" ||
        seccion.id === Number(filtro)
    )
    .flatMap((seccion) =>
      seccion.preguntas.map((pregunta) => ({
        ...pregunta,
        seccion: seccion.nombre
      }))
    );

  return (
    <div className="rd-page">

      {/* ENCABEZADO */}
      <div className="rd-heading">
        <div>
          <h1>Mis resultados</h1>

          <p>
            Consulta tu desempeño docente y conoce tus
            fortalezas y áreas de oportunidad.
          </p>
        </div>

        <span className="rd-periodo">
          {PERIODO_ACTUAL}
        </span>
      </div>

      {/* AVISO */}
      <p className="rd-demo">
        Vista de demostración con calificaciones simuladas.
        Los resultados reales requieren autorización
        de Dirección Académica.
      </p>

      {!REPORTE_AUTORIZADO_DEMO ? (

        /* RESULTADOS NO AUTORIZADOS */
        <section className="rd-bloqueado">
          <LockKeyhole size={35} />

          <h2>Resultados aún no disponibles</h2>

          <p>
            Podrás consultar tus resultados cuando
            Dirección Académica autorice la publicación
            de tu reporte final.
          </p>
        </section>

      ) : (

        <>
          {/* PROMEDIO GENERAL */}
          <section className="rd-resumen">

            <div className="rd-promedio">
              <span>Promedio general</span>

              <strong>
                {promedioGeneral.toFixed(2)}
                <small> / 5</small>
              </strong>

              <p>
                Resultado global de la evaluación
              </p>
            </div>

            <div className="rd-resumen-info">
              <ShieldCheck size={24} />

              <div>
                <strong>
                  Resultados confidenciales
                </strong>

                <p>
                  Los resultados son agregados y no
                  identifican individualmente a
                  los estudiantes.
                </p>
              </div>
            </div>

          </section>

          {/* RESULTADOS POR SECCIÓN */}
          <section className="rd-panel">

            <div className="rd-panel-title">
              <ChartColumn size={20} />

              <div>
                <h2>Resultados por sección</h2>

                <p>
                  Comparación de las tres áreas de evaluación
                </p>
              </div>
            </div>

            <div className="rd-secciones">

              {secciones.map((seccion) => (

                <article
                  key={seccion.id}
                  className="rd-seccion"
                >

                  <span>
                    Sección {seccion.id}
                  </span>

                  <h3>{seccion.nombre}</h3>

                  <strong>
                    {seccion.promedio.toFixed(2)} / 5
                  </strong>

                  <div className="rd-barra">
                    <span
                      style={{
                        width: `${
                          (seccion.promedio / 5) * 100
                        }%`
                      }}
                    />
                  </div>

                </article>

              ))}

            </div>
          </section>

          {/* FORTALEZA Y ÁREA DE OPORTUNIDAD */}
          <section className="rd-destacados">

            <article className="rd-fortaleza">

              <div className="rd-destacado-titulo">
                <TrendingUp size={21} />
                <span>Principal fortaleza</span>
              </div>

              <h3>{fortaleza.nombre}</h3>

              <strong>
                {fortaleza.promedio.toFixed(1)} / 5
              </strong>

              <p>
                Este es el criterio con mejor resultado
                de la evaluación.
              </p>

            </article>

            <article className="rd-oportunidad">

              <div className="rd-destacado-titulo">
                <AlertCircle size={21} />
                <span>Área de oportunidad</span>
              </div>

              <h3>{oportunidad.nombre}</h3>

              <strong>
                {oportunidad.promedio.toFixed(1)} / 5
              </strong>

              <p>
                Este es el criterio con menor puntuación
                y requiere mayor atención.
              </p>

            </article>

          </section>

          {/* RESULTADOS POR PREGUNTA */}
          <section className="rd-panel">

            <div className="rd-tabla-encabezado">

              <div>
                <h2>Resultados por pregunta</h2>

                <p>
                  Calificación promedio de cada criterio
                  evaluado
                </p>
              </div>

              <select
                aria-label="Filtrar por sección"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >

                <option value="todas">
                  Todas las secciones
                </option>

                {secciones.map((seccion) => (
                  <option
                    key={seccion.id}
                    value={seccion.id}
                  >
                    Sección {seccion.id}
                  </option>
                ))}

              </select>

            </div>

            <div className="rd-tabla-scroll">

              <table className="rd-tabla">

                <thead>
                  <tr>
                    <th>Pregunta / Criterio</th>
                    <th>Sección</th>
                    <th>Promedio</th>
                    <th>Resultado</th>
                  </tr>
                </thead>

                <tbody>

                  {preguntasVisibles.map((pregunta) => (

                    <tr key={pregunta.id}>

                      <td>
                        <strong>
                          {pregunta.nombre}
                        </strong>
                      </td>

                      <td>
                        {pregunta.seccion}
                      </td>

                      <td>
                        <strong className="rd-calificacion">
                          {pregunta.promedio.toFixed(1)}
                        </strong>
                      </td>

                      <td>
                        <div className="rd-mini-barra">
                          <span
                            style={{
                              width: `${
                                (pregunta.promedio / 5) * 100
                              }%`
                            }}
                          />
                        </div>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>

        </>

      )}

    </div>
  );
}
