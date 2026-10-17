
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  UsersRound,
  ClipboardCheck,
  GraduationCap,
  Star,
  FileCheck2,
  ArrowUpRight,
  ChartNoAxesCombined
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

import {
  Line,
  Bar
} from "react-chartjs-2";

import {
  PERIODO_DIRECCION,
  RESUMEN_DIRECCION,
  PARTICIPACION_DIRECCION,
  PARTICIPACION_SEMANAL,
  SECCIONES_DIRECCION,
  PROMEDIO_INSTITUCIONAL,
  REPORTES_DIRECCION,
  REPORTES_POR_REVISAR
} from "../../data/direccionMock";

import "./DashDireccion.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

// GRÁFICA DE PARTICIPACIÓN
const datosParticipacion = {
  labels: PARTICIPACION_SEMANAL.map(
    (item) => item.semana
  ),
  datasets: [
    {
      label: "Participación",
      data: PARTICIPACION_SEMANAL.map(
        (item) => item.porcentaje
      ),
      borderColor: "#6f1738",
      backgroundColor: "rgba(111, 23, 56, 0.12)",
      borderWidth: 3,
      tension: 0.35,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: "#6f1738",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2
    }
  ]
};

// GRÁFICA DE RESULTADOS POR SECCIÓN
const datosSecciones = {
  labels: SECCIONES_DIRECCION.map(
    (seccion) => `Sección ${seccion.id}`
  ),
  datasets: [
    {
      label: "Promedio",
      data: SECCIONES_DIRECCION.map(
        (seccion) => seccion.promedio
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

const opcionesParticipacion = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context) =>
          `Participación: ${context.parsed.y}%`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (valor) => `${valor}%`
      },
      grid: {
        color: "#efeee9"
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

const opcionesSecciones = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 5,
      ticks: {
        stepSize: 1
      },
      grid: {
        color: "#efeee9"
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

export default function DashDireccion() {
  const [filtroEstado, setFiltroEstado] =
    useState("todos");

  // Indicadores del dashboard
  const indicadores = [
    {
      titulo: "Docentes evaluados",
      valor: RESUMEN_DIRECCION.docentesEvaluados,
      descripcion: "Docentes del periodo",
      icono: UsersRound
    },
    {
      titulo: "Evaluaciones recibidas",
      valor:
        RESUMEN_DIRECCION.evaluacionesRecibidas.toLocaleString(
          "es-MX"
        ),
      descripcion: "Respuestas registradas",
      icono: ClipboardCheck
    },
    {
      titulo: "Participación estudiantil",
      valor: `${PARTICIPACION_DIRECCION}%`,
      descripcion:
        `${RESUMEN_DIRECCION.estudiantesParticipantes}` +
        " estudiantes participantes",
      icono: GraduationCap
    },
    {
      titulo: "Promedio institucional",
      valor: PROMEDIO_INSTITUCIONAL.toFixed(2),
      descripcion: "Escala de 1 a 5",
      icono: Star
    }
  ];

  // Filtrar reportes según su estado
  const reportesFiltrados = REPORTES_DIRECCION.filter(
    (reporte) =>
      filtroEstado === "todos" ||
      reporte.estado === filtroEstado
  );

  return (
    <div className="dad-page">

      {/* ENCABEZADO */}
      <div className="dad-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Resumen general de la evaluación docente
            y seguimiento de resultados institucionales.
          </p>
        </div>

        <span className="dad-periodo">
          {PERIODO_DIRECCION}
        </span>
      </div>

      {/* AVISO DE DEMOSTRACIÓN */}
      <p className="dad-demo">
        Panel de demostración con datos simulados.
        Los indicadores se conectarán posteriormente
        con la base de datos institucional.
      </p>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <section
        className="dad-stats"
        aria-label="Indicadores institucionales"
      >
        {indicadores.map((indicador) => {
          const Icono = indicador.icono;

          return (
            <article
              className="dad-stat"
              key={indicador.titulo}
            >
              <div className="dad-stat-top">
                <span>{indicador.titulo}</span>

                <div className="dad-stat-icon">
                  <Icono size={21} />
                </div>
              </div>

              <strong>{indicador.valor}</strong>

              <p>{indicador.descripcion}</p>
            </article>
          );
        })}
      </section>

      {/* GRÁFICAS */}
      <section className="dad-charts">

        {/* GRÁFICA DE PARTICIPACIÓN */}
        <article className="dad-panel">
          <div className="dad-panel-heading">
            <div>
              <h2>Participación estudiantil</h2>
              <p>
                Avance de participación durante el periodo
              </p>
            </div>

            <ChartNoAxesCombined
              size={21}
              color="#6f1738"
            />
          </div>

          <div className="dad-chart-container">
            <Line
              data={datosParticipacion}
              options={opcionesParticipacion}
            />
          </div>
        </article>

        {/* GRÁFICA DE RESULTADOS */}
        <article className="dad-panel">
          <div className="dad-panel-heading">
            <div>
              <h2>Promedio por sección</h2>
              <p>
                Comparación de las tres áreas de evaluación
              </p>
            </div>

            <Star size={21} color="#6f1738" />
          </div>

          <div className="dad-chart-container">
            <Bar
              data={datosSecciones}
              options={opcionesSecciones}
            />
          </div>
        </article>

      </section>

      {/* REPORTES */}
      <section className="dad-panel">

        {/* ENCABEZADO DE REPORTES */}
        <div className="dad-panel-heading">
          <div>
            <h2>Estado de reportes docentes</h2>
            <p>
              {REPORTES_POR_REVISAR} reportes pendientes
              de revisión o autorización.
            </p>
          </div>

          <Link
            to="/evaluacion-docente/direccion/reportes"
            className="dad-view-all"
          >
            Ver reportes
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* FILTROS DE REPORTES */}
        <div className="dad-toolbar">
          <div className="dad-summary">
            <FileCheck2 size={18} />
            <span>
              {REPORTES_DIRECCION.length} reportes registrados
            </span>
          </div>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            aria-label="Filtrar reportes por estado"
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="Pendiente">
              Pendientes
            </option>

            <option value="En revisión">
              En revisión
            </option>

            <option value="Autorizado">
              Autorizados
            </option>
          </select>
        </div>

        {/* TABLA DE REPORTES */}
        <div className="dad-table-scroll">
          <table className="dad-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Carrera</th>
                <th>Promedio</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {reportesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="dad-empty">
                    No se encontraron reportes
                    con este estado.
                  </td>
                </tr>
              ) : (
                reportesFiltrados.map((reporte) => (
                  <tr key={reporte.id}>
                    <td>
                      <strong>
                        {reporte.docente}
                      </strong>
                    </td>

                    <td>
                      {reporte.carrera}
                    </td>

                    <td>
                      {reporte.promedio.toFixed(2)} / 5
                    </td>

                    <td>
                      <span
                        className={`dad-badge ${
                          reporte.estado === "Autorizado"
                            ? "dad-badge-authorized"
                            : reporte.estado === "En revisión"
                            ? "dad-badge-review"
                            : "dad-badge-pending"
                        }`}
                      >
                        {reporte.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="dad-table-note">
          Las autorizaciones reales se implementarán
          en la pantalla de Reportes de Dirección Académica.
        </p>

      </section>

    </div>
  );
}
