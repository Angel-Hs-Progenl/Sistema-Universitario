
import { Link } from "react-router-dom";

import {
  BookOpen,
  ClipboardCheck,
  Star,
  Users,
  ArrowUpRight,
  FileText,
  ShieldCheck,
  LockKeyhole
} from "lucide-react";

import {
  DOCENTE,
  GRUPOS,
  PERIODO_ACTUAL,
  REPORTE_AUTORIZADO_DEMO,
  PROMEDIO_GENERAL,
  TOTAL_RESPUESTAS,
  EVALUACIONES_CONSIDERADAS,
  PARTICIPACION
} from "../../data/docenteMock";

import "./DashDocente.css";

export default function DashDocente() {

  // Autorización simulada desde docenteMock.js
  const reporteDisponible = REPORTE_AUTORIZADO_DEMO;

  // Indicadores del Dashboard
  const estadisticas = [
    {
      nombre: "Promedio general",
      valor: reporteDisponible
        ? `${PROMEDIO_GENERAL.toFixed(2)}/5`
        : "—",
      detalle: reporteDisponible
        ? "Resultado del periodo"
        : "Pendiente de publicación",
      icono: Star
    },
    {
      nombre: "Evaluaciones consideradas",
      valor: reporteDisponible
        ? EVALUACIONES_CONSIDERADAS
        : "—",
      detalle: reporteDisponible
        ? `${TOTAL_RESPUESTAS} respuestas recibidas`
        : "Pendiente de publicación",
      icono: ClipboardCheck
    },
    {
      nombre: "Grupos asignados",
      valor: GRUPOS.length,
      detalle: "Periodo académico actual",
      icono: BookOpen
    },
    {
      nombre: "Participación",
      valor: reporteDisponible
        ? `${PARTICIPACION}%`
        : "—",
      detalle: reporteDisponible
        ? "Participación general"
        : "Pendiente de publicación",
      icono: Users
    }
  ];

  return (
    <div className="dd-dashboard">

      {/* ENCABEZADO */}
      <div className="dd-heading">
        <div>
          <h1>Dashboard del Docente</h1>

          <p>
            Bienvenido, Prof. {DOCENTE.nombre}.
            Consulta el resumen de tu evaluación docente.
          </p>
        </div>

        <span className="dd-periodo">
          {PERIODO_ACTUAL}
        </span>
      </div>

      {/* AVISO DE DEMOSTRACIÓN */}
      <p className="dd-demo">
        Vista de demostración con datos simulados.
        La publicación real debe ser autorizada
        por Dirección Académica.
      </p>

      {/* INDICADORES */}
      <section
        className="dd-stats"
        aria-label="Indicadores del docente"
      >
        {estadisticas.map((dato) => {
          const Icono = dato.icono;

          return (
            <article
              className="dd-stat"
              key={dato.nombre}
            >
              <div className="dd-stat-header">
                <span>{dato.nombre}</span>

                <span className="dd-stat-icon">
                  <Icono size={20} />
                </span>
              </div>

              <strong>{dato.valor}</strong>

              <p className="dd-stat-detail">
                {dato.detalle}
              </p>
            </article>
          );
        })}
      </section>

      {/* GRUPOS ASIGNADOS */}
      <section className="dd-panel">
        <div className="dd-panel-heading">
          <div>
            <h2>Mis grupos asignados</h2>
            <p>
              Asignaturas y grupos correspondientes
              al periodo académico actual.
            </p>
          </div>
        </div>

        <div className="dd-grupos">
          {GRUPOS.map((grupo) => (
            <div
              className="dd-grupo-item"
              key={grupo.id}
            >
              <div className="dd-grupo-icono">
                <BookOpen size={20} />
              </div>

              <div className="dd-grupo-info">
                <strong>{grupo.asignatura}</strong>
                <span>{grupo.carrera}</span>
              </div>

              <span className="dd-grupo-clave">
                {grupo.grupo}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ESTADO DEL REPORTE */}
      <section className="dd-panel">
        <div className="dd-panel-heading">
          <div>
            <h2>Estado de mi evaluación</h2>
            <p>
              Consulta la disponibilidad de tu reporte final.
            </p>
          </div>

          {reporteDisponible ? (
            <ShieldCheck
              size={23}
              color="#386641"
            />
          ) : (
            <LockKeyhole
              size={23}
              color="#6f1738"
            />
          )}
        </div>

        <div className="dd-status-content">

          {reporteDisponible ? (
            <>
              <span className="dd-status dd-status--available">
                Reporte disponible
              </span>

              <p className="dd-description">
                Tu reporte de demostración está disponible.
                Puedes consultar tus resultados,
                comentarios y el documento final.
              </p>

              <Link
                className="dd-action-link"
                to="/evaluacion-docente/docente/reporte"
              >
                Consultar mi reporte
                <ArrowUpRight size={17} />
              </Link>
            </>
          ) : (
            <>
              <span className="dd-status dd-status--pending">
                Pendiente de autorización
              </span>

              <p className="dd-description">
                Los resultados se mostrarán cuando
                Dirección Académica autorice la
                publicación de tu reporte final.
              </p>
            </>
          )}

        </div>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className="dd-panel">
        <div className="dd-panel-heading">
          <div>
            <h2>Accesos rápidos</h2>
            <p>
              Navega a los apartados principales del módulo.
            </p>
          </div>
        </div>

        <div className="dd-quick-links">

          {reporteDisponible && (
            <>
              <Link
                to="/evaluacion-docente/docente/resultados"
                className="dd-quick-link"
              >
                <div>
                  <Star size={20} />
                  <span>Mis resultados</span>
                </div>

                <ArrowUpRight size={18} />
              </Link>

              <Link
                to="/evaluacion-docente/docente/comentarios"
                className="dd-quick-link"
              >
                <div>
                  <ClipboardCheck size={20} />
                  <span>Comentarios recibidos</span>
                </div>

                <ArrowUpRight size={18} />
              </Link>
            </>
          )}

          <Link
            to="/evaluacion-docente/docente/ayuda"
            className="dd-quick-link"
          >
            <div>
              <FileText size={20} />
              <span>Centro de ayuda</span>
            </div>

            <ArrowUpRight size={18} />
          </Link>

        </div>
      </section>

    </div>
  );
}
