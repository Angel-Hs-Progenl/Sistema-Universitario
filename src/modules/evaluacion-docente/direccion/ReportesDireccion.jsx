
import { useState } from "react";
import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

import {
  FileCheck2,
  Search,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Printer,
  Save,
  ShieldCheck,
  AlertCircle,
  MessageSquareText
} from "lucide-react";

import {
  PERIODO_DIRECCION,
  REPORTES_DIRECCION,
  RESULTADOS_INSTITUCIONALES_DEMO,
  MIN_RESPUESTAS_RESULTADOS,
  CUESTIONARIO_DIRECCION
} from "../../data/direccionMock";

import {
  COMENTARIOS_PUBLICABLES
} from "../../data/docenteMock";

import "./ReportesDireccion.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const SECCIONES = [
  { clave: "desempeno", nombre: "Desempeño docente" },
  {
    clave: "metodologia",
    nombre: "Metodología y desarrollo de la clase"
  },
  {
    clave: "comunicacion",
    nombre: "Atención, comunicación y ambiente"
  }
];

const promedioPonderado = (registros, clave) => {
  const total = registros.reduce(
    (suma, item) => suma + item.respuestas,
    0
  );

  if (total === 0) return null;

  return (
    registros.reduce(
      (suma, item) =>
        suma + item.secciones[clave] * item.respuestas,
      0
    ) / total
  );
};

const textoPromedio = (numero) =>
  numero === null ? "Sin datos" : numero.toFixed(2);

function construirReportes() {
  const grupos = new Map();

  for (const resultado of RESULTADOS_INSTITUCIONALES_DEMO) {
    const id = `${resultado.periodo}|${resultado.docente}`;

    if (!grupos.has(id)) {
      const estadoInicial =
        resultado.periodo === PERIODO_DIRECCION
          ? REPORTES_DIRECCION.find(
              (item) => item.docente === resultado.docente
            )?.estado || "Pendiente"
          : "Pendiente";

      grupos.set(id, {
        id,
        periodo: resultado.periodo,
        docente: resultado.docente,
        carrera: resultado.carrera,
        estado: estadoInicial,
        retroalimentacion: "",
        asignaciones: []
      });
    }

    grupos.get(id).asignaciones.push(resultado);
  }

  return Array.from(grupos.values());
}

function calcularResumen(reporte) {
  const validos = reporte.asignaciones.filter(
    (item) => item.respuestas >= MIN_RESPUESTAS_RESULTADOS
  );

  const secciones = SECCIONES.map((seccion) => ({
    ...seccion,
    promedio: promedioPonderado(validos, seccion.clave)
  }));

  const disponibles = secciones.filter(
    (seccion) => seccion.promedio !== null
  );

  const promedio =
    disponibles.length > 0
      ? disponibles.reduce(
          (total, item) => total + item.promedio,
          0
        ) / disponibles.length
      : null;

  const ordenadas = [...disponibles].sort(
    (a, b) => b.promedio - a.promedio
  );

  return {
    validos,
    secciones,
    promedio,
    fortaleza: ordenadas[0] || null,
    oportunidad: ordenadas[ordenadas.length - 1] || null,
    respuestas: reporte.asignaciones.reduce(
      (total, item) => total + item.respuestas,
      0
    ),
    respuestasConsideradas: validos.reduce(
      (total, item) => total + item.respuestas,
      0
    )
  };
}

export default function ReportesDireccion() {
  const [reportes, setReportes] = useState(
    construirReportes
  );

  const [seleccionId, setSeleccionId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState(
    PERIODO_DIRECCION
  );
  const [mensaje, setMensaje] = useState("");

  const periodos = [
    ...new Set(reportes.map((item) => item.periodo))
  ];

  const seleccion = reportes.find(
    (item) => item.id === seleccionId
  );

  const reportesFiltrados = reportes.filter((item) => {
    const texto = busqueda.trim().toLowerCase();

    return (
      (
        item.docente.toLowerCase().includes(texto) ||
        item.carrera.toLowerCase().includes(texto)
      ) &&
      (
        estadoFiltro === "todos" ||
        item.estado === estadoFiltro
      ) &&
      (
        periodoFiltro === "todos" ||
        item.periodo === periodoFiltro
      )
    );
  });

  const pendientes = reportes.filter(
    (item) => item.estado === "Pendiente"
  ).length;

  const revision = reportes.filter(
    (item) => item.estado === "En revisión"
  ).length;

  const autorizados = reportes.filter(
    (item) => item.estado === "Autorizado"
  ).length;

  const abrirReporte = (id) => {
    setSeleccionId(id);
    setMensaje("");
  };

  const volver = () => {
    setSeleccionId(null);
    setMensaje("");
  };

  const actualizarRetroalimentacion = (texto) => {
    setReportes((actuales) =>
      actuales.map((item) =>
        item.id === seleccionId
          ? { ...item, retroalimentacion: texto }
          : item
      )
    );
    setMensaje("");
  };

  const cambiarEstado = (estado) => {
    if (!seleccion) return;

    const resumen = calcularResumen(seleccion);

    if (estado === "Autorizado") {
      if (resumen.validos.length === 0) {
        setMensaje(
          "No puedes autorizar un reporte sin resultados " +
          "que cumplan el mínimo de respuestas."
        );
        return;
      }

      if (!seleccion.retroalimentacion.trim()) {
        setMensaje(
          "Primero escribe la retroalimentación " +
          "de Dirección Académica."
        );
        return;
      }
    }

    setReportes((actuales) =>
      actuales.map((item) =>
        item.id === seleccionId
          ? { ...item, estado }
          : item
      )
    );

    setMensaje(
      estado === "Autorizado"
        ? "Reporte autorizado en la demostración. " +
          "Todavía no se publica en el módulo Docente."
        : `Estado actualizado a "${estado}" en la demostración.`
    );
  };

  const obtenerComentarios = (reporte) => {
    // Estos comentarios son del mock independiente del
    // módulo Docente. Solo existen para Juan Pérez.
    if (
      reporte.docente !== "Juan Pérez" ||
      reporte.periodo !== PERIODO_DIRECCION
    ) {
      return [];
    }

    return COMENTARIOS_PUBLICABLES;
  };

  if (seleccion) {
    const resumen = calcularResumen(seleccion);
    const comentarios = obtenerComentarios(seleccion);

    const datosGrafica = {
      labels: resumen.secciones.map(
        (_, index) => `Sección ${index + 1}`
      ),
      datasets: [
        {
          label: "Promedio",
          data: resumen.secciones.map(
            (item) => item.promedio
          ),
          backgroundColor: [
            "#6f1738",
            "#a65b78",
            "#b8862b"
          ],
          borderRadius: 7,
          maxBarThickness: 65
        }
      ]
    };

    const opcionesGrafica = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: { stepSize: 1 }
        },
        x: {
          grid: { display: false }
        }
      }
    };

    return (
      <div className="rr-page">

        <div className="rr-heading rr-screen-only">
          <div>
            <button
              type="button"
              className="rr-back"
              onClick={volver}
            >
              <ArrowLeft size={17} />
              Volver a los reportes
            </button>

            <h1>Revisión de reporte docente</h1>
            <p>
              Consulta y autoriza los resultados
              del profesor seleccionado.
            </p>
          </div>

          <button
            type="button"
            className="rr-primary-button"
            onClick={() => window.print()}
          >
            <Printer size={18} />
            Imprimir / Guardar PDF
          </button>
        </div>

        {mensaje && (
          <p className="rr-alert rr-screen-only" role="status">
            <AlertCircle size={18} />
            {mensaje}
          </p>
        )}

        <article className="rr-report">
          <div className="rr-report-brand">
            <div>
              <span>UNIVERSIDAD TECNOLÓGICA DE ORIENTAL</span>
              <h2>Reporte individual de evaluación docente</h2>
              <p>Dirección Académica</p>
            </div>

            <span
              className={`rr-status ${
                seleccion.estado === "Autorizado"
                  ? "rr-approved"
                  : seleccion.estado === "En revisión"
                  ? "rr-review"
                  : "rr-pending"
              }`}
            >
              {seleccion.estado}
            </span>
          </div>

          {/* 1. INFORMACIÓN GENERAL */}
          <section className="rr-section">
            <h3>1. Información general</h3>

            <div className="rr-info-grid">
              <div>
                <span>Docente</span>
                <strong>{seleccion.docente}</strong>
              </div>
              <div>
                <span>Carrera</span>
                <strong>{seleccion.carrera}</strong>
              </div>
              <div>
                <span>Periodo</span>
                <strong>{seleccion.periodo}</strong>
              </div>
              <div>
                <span>Evaluaciones recibidas</span>
                <strong>{resumen.respuestas}</strong>
              </div>
              <div>
                <span>Evaluaciones consideradas</span>
                <strong>
                  {resumen.respuestasConsideradas}
                </strong>
              </div>
              <div>
                <span>Asignaturas y grupos</span>
                <strong>
                  {seleccion.asignaciones
                    .map(
                      (item) =>
                        `${item.asignatura} (${item.grupo})`
                    )
                    .join(", ")}
                </strong>
              </div>
            </div>
          </section>

          {/* 2. PROMEDIO GENERAL */}
          <section className="rr-section">
            <h3>2. Resultado general</h3>

            <div className="rr-score-box">
              <div>
                <span>Promedio general de la selección</span>
                <strong>
                  {textoPromedio(resumen.promedio)}
                </strong>
                <small>Escala de 1 a 5</small>
              </div>

              <p>
                Resultados calculados a partir de grupos
                con al menos{" "}
                {MIN_RESPUESTAS_RESULTADOS} respuestas.
              </p>
            </div>
          </section>

          {/* 3. RESULTADOS POR SECCIÓN */}
          <section className="rr-section">
            <h3>3. Resultados por sección</h3>

            {resumen.validos.length > 0 ? (
              <>
                <div className="rr-chart">
                  <Bar
                    data={datosGrafica}
                    options={opcionesGrafica}
                  />
                </div>

                <table className="rr-table">
                  <thead>
                    <tr>
                      <th>Sección</th>
                      <th>Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.secciones.map((item) => (
                      <tr key={item.clave}>
                        <td>{item.nombre}</td>
                        <td>
                          {textoPromedio(item.promedio)} / 5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="rr-muted">
                No hay resultados con muestra suficiente.
              </p>
            )}
          </section>

          {/* 4. CRITERIOS */}
          <section className="rr-section">
            <h3>4. Detalle de preguntas y criterios</h3>

            <table className="rr-table">
              <thead>
                <tr>
                  <th>Sección</th>
                  <th>Criterio</th>
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {CUESTIONARIO_DIRECCION.flatMap(
                  (seccion, indice) =>
                    seccion.preguntas.map((pregunta) => (
                      <tr key={`${seccion.id}-${pregunta.id}`}>
                        <td>Sección {indice + 1}</td>
                        <td>{pregunta.texto}</td>
                        <td>Pendiente de datos</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>

            <p className="rr-muted">
              Las puntuaciones por pregunta se mostrarán
              cuando el cuestionario y los resultados
              estén conectados a la misma fuente de datos.
            </p>
          </section>

          {/* 5. FORTALEZAS Y OPORTUNIDADES */}
          <section className="rr-section">
            <h3>5. Fortalezas y áreas de oportunidad</h3>

            <div className="rr-two-columns">
              <div className="rr-insight">
                <span>Sección mejor valorada</span>
                <strong>
                  {resumen.fortaleza?.nombre ||
                    "Sin información"}
                </strong>
                <p>
                  {textoPromedio(
                    resumen.fortaleza?.promedio ?? null
                  )} / 5
                </p>
              </div>

              <div className="rr-insight">
                <span>Sección con menor promedio</span>
                <strong>
                  {resumen.oportunidad?.nombre ||
                    "Sin información"}
                </strong>
                <p>
                  {textoPromedio(
                    resumen.oportunidad?.promedio ?? null
                  )} / 5
                </p>
              </div>
            </div>
          </section>

          {/* 6. COMENTARIOS */}
          <section className="rr-section">
            <h3>6. Comentarios anónimos</h3>

            {comentarios.length > 0 ? (
              <>
                {comentarios.map((comentario) => (
                  <div
                    className="rr-comment"
                    key={comentario.id}
                  >
                    <MessageSquareText size={17} />
                    <div>
                      <span>
                        {comentario.tipo === "fortaleza"
                          ? "Fortaleza"
                          : "Sugerencia"}
                      </span>
                      <p>{comentario.texto}</p>
                    </div>
                  </div>
                ))}

                <p className="rr-muted">
                  Comentarios ficticios del módulo Docente,
                  incluidos únicamente como ejemplo.
                </p>
              </>
            ) : (
              <p className="rr-muted">
                No hay comentarios consolidados disponibles
                para este docente y periodo en el mock.
              </p>
            )}
          </section>

          {/* 7. ANÁLISIS */}
          <section className="rr-section">
            <h3>7. Análisis general</h3>

            {resumen.promedio !== null ? (
              <p className="rr-paragraph">
                El promedio general de este reporte es{" "}
                <strong>
                  {resumen.promedio.toFixed(2)} de 5
                </strong>.
                La sección con mayor valoración es{" "}
                <strong>
                  {resumen.fortaleza.nombre}
                </strong>,
                mientras que la sección con menor
                promedio es{" "}
                <strong>
                  {resumen.oportunidad.nombre}
                </strong>.
                Estas observaciones se generan mediante
                reglas de cálculo y no representan
                un análisis de inteligencia artificial.
              </p>
            ) : (
              <p className="rr-muted">
                No es posible generar una conclusión
                sin resultados suficientes.
              </p>
            )}
          </section>

          {/* 8. RETROALIMENTACIÓN */}
          <section className="rr-section">
            <h3>8. Retroalimentación de Dirección Académica</h3>

            <textarea
              className="rr-feedback rr-screen-only"
              rows={5}
              value={seleccion.retroalimentacion}
              onChange={(e) =>
                actualizarRetroalimentacion(e.target.value)
              }
              placeholder="Escribe las observaciones, recomendaciones y acuerdos para este docente..."
              disabled={seleccion.estado === "Autorizado"}
              aria-label="Retroalimentación académica"
            />

            <div className="rr-feedback-print">
              {seleccion.retroalimentacion ||
                "Pendiente de retroalimentación."}
            </div>

            <p className="rr-muted rr-screen-only">
              La retroalimentación se conserva solo
              mientras esta pantalla permanezca abierta.
              Todavía no se guarda en una base de datos.
            </p>
          </section>

          {/* 9. PLAN DE ACCIÓN */}
          <section className="rr-section">
            <h3>9. Plan de acción y seguimiento</h3>

            <p className="rr-muted">
              Registro pendiente de completar en el módulo
              Planes de acción de Dirección Académica.
            </p>

            <div className="rr-plan-grid">
              {[
                "Área de oportunidad",
                "Acción de mejora",
                "Responsable",
                "Fecha de implementación",
                "Fecha de seguimiento",
                "Evidencia",
                "Estado"
              ].map((campo) => (
                <div key={campo}>
                  <span>{campo}</span>
                  <strong>Pendiente</strong>
                </div>
              ))}
            </div>
          </section>

          {/* AVISO DE PRIVACIDAD */}
          <div className="rr-privacy">
            <ShieldCheck size={19} />
            <p>
              Reporte de demostración. No incluye
              identidades de estudiantes ni respuestas
              individuales. La autorización real
              dependerá de los permisos del backend.
            </p>
          </div>

        </article>

        {/* ACCIONES DE DIRECCIÓN */}
        <div className="rr-actions rr-screen-only">

          {seleccion.estado === "Pendiente" && (
            <button
              type="button"
              className="rr-secondary-button"
              onClick={() => cambiarEstado("En revisión")}
            >
              <Clock3 size={17} />
              Marcar en revisión
            </button>
          )}

          {seleccion.estado !== "Autorizado" ? (
            <button
              type="button"
              className="rr-primary-button"
              onClick={() => cambiarEstado("Autorizado")}
            >
              <CheckCircle2 size={18} />
              Autorizar publicación
            </button>
          ) : (
            <button
              type="button"
              className="rr-secondary-button"
              onClick={() => cambiarEstado("En revisión")}
            >
              <Save size={17} />
              Devolver a revisión
            </button>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="rr-page">

      <header className="rr-heading">
        <div>
          <h1>Reportes y autorizaciones</h1>
          <p>
            Revisa los resultados individuales
            y controla su autorización de publicación.
          </p>
        </div>
      </header>

      <p className="rr-demo">
        Las autorizaciones son simuladas y no se sincronizan
        todavía con el Dashboard ni con el módulo Docente.
      </p>

      {/* INDICADORES */}
      <section className="rr-stats">
        {[
          {
            titulo: "Reportes generados",
            valor: reportes.length,
            icono: FileCheck2
          },
          {
            titulo: "Pendientes",
            valor: pendientes,
            icono: Clock3
          },
          {
            titulo: "En revisión",
            valor: revision,
            icono: ClipboardCheck
          },
          {
            titulo: "Autorizados",
            valor: autorizados,
            icono: CheckCircle2
          }
        ].map((item) => {
          const Icono = item.icono;

          return (
            <article className="rr-stat" key={item.titulo}>
              <div className="rr-stat-icon">
                <Icono size={21} />
              </div>
              <span>{item.titulo}</span>
              <strong>{item.valor}</strong>
            </article>
          );
        })}
      </section>

      {/* LISTADO */}
      <section className="rr-panel rr-list">
        <div className="rr-panel-heading">
          <h2>Reportes individuales</h2>
          <p>
            Selecciona un docente para consultar
            su reporte completo.
          </p>
        </div>

        <div className="rr-filters">
          <label className="rr-search">
            <Search size={18} />
            <input
              type="search"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar docente o carrera..."
              aria-label="Buscar reportes"
            />
          </label>

          <select
            value={periodoFiltro}
            onChange={(e) =>
              setPeriodoFiltro(e.target.value)
            }
            aria-label="Filtrar por periodo"
          >
            <option value="todos">
              Todos los periodos
            </option>

            {periodos.map((periodo) => (
              <option key={periodo} value={periodo}>
                {periodo}
              </option>
            ))}
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) =>
              setEstadoFiltro(e.target.value)
            }
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="En revisión">En revisión</option>
            <option value="Autorizado">Autorizados</option>
          </select>
        </div>

        <div className="rr-table-scroll">
          <table className="rr-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Carrera</th>
                <th>Periodo</th>
                <th>Promedio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {reportesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rr-empty">
                    No se encontraron reportes.
                  </td>
                </tr>
              ) : (
                reportesFiltrados.map((reporte) => {
                  const resumen = calcularResumen(reporte);

                  return (
                    <tr key={reporte.id}>
                      <td>
                        <strong>{reporte.docente}</strong>
                      </td>

                      <td>{reporte.carrera}</td>
                      <td>{reporte.periodo}</td>

                      <td>
                        {textoPromedio(resumen.promedio)}
                      </td>

                      <td>
                        <span
                          className={`rr-status ${
                            reporte.estado === "Autorizado"
                              ? "rr-approved"
                              : reporte.estado === "En revisión"
                              ? "rr-review"
                              : "rr-pending"
                          }`}
                        >
                          {reporte.estado}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="rr-view-button"
                          onClick={() =>
                            abrirReporte(reporte.id)
                          }
                        >
                          <Eye size={16} />
                          Revisar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
