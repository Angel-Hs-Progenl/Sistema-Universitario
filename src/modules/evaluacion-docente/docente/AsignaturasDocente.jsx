
import { useState } from "react";
import { BookOpen, Search, Users } from "lucide-react";
import "./AsignaturasDocente.css";

// Datos simulados; después vendrán de la base de datos.
const ASIGNATURAS = [
  {
    id: 1,
    nombre: "Programación Web",
    grupo: "A-301",
    carrera: "Tecnologías de la Información",
    estudiantes: 35,
    periodo: "Sept–Dic 2026",
  },
  {
    id: 2,
    nombre: "Programación Web",
    grupo: "B-301",
    carrera: "Tecnologías de la Información",
    estudiantes: 30,
    periodo: "Sept–Dic 2026",
  },
  {
    id: 3,
    nombre: "Bases de Datos",
    grupo: "A-501",
    carrera: "Tecnologías de la Información",
    estudiantes: 32,
    periodo: "Sept–Dic 2026",
  },
];

export default function AsignaturasDocente() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const nombres = [...new Set(
    ASIGNATURAS.map((asignatura) => asignatura.nombre)
  )];

  const filtradas = ASIGNATURAS.filter((asignatura) => {
    const coincideBusqueda =
      asignatura.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      asignatura.grupo.toLowerCase().includes(busqueda.toLowerCase()) ||
      asignatura.carrera.toLowerCase().includes(busqueda.toLowerCase());

    const coincideFiltro =
      filtro === "todas" || asignatura.nombre === filtro;

    return coincideBusqueda && coincideFiltro;
  });

  const totalEstudiantes = ASIGNATURAS.reduce(
    (total, asignatura) => total + asignatura.estudiantes,
    0
  );

  return (
    <div className="ad-page">
      <div className="ad-heading">
        <div>
          <h1>Mis asignaturas</h1>
          <p>
            Consulta las asignaturas y grupos que tienes asignados
            durante el periodo académico.
          </p>
        </div>

        <span className="ad-periodo">Sept–Dic 2026</span>
      </div>

      {/* Indicadores */}
      <section className="ad-stats">
        <article className="ad-stat">
          <div className="ad-stat-top">
            <span>Asignaturas</span>
            <BookOpen size={20} />
          </div>
          <strong>{nombres.length}</strong>
          <small>Materias diferentes</small>
        </article>

        <article className="ad-stat">
          <div className="ad-stat-top">
            <span>Grupos asignados</span>
            <Users size={20} />
          </div>
          <strong>{ASIGNATURAS.length}</strong>
          <small>Grupos registrados</small>
        </article>

        <article className="ad-stat">
          <div className="ad-stat-top">
            <span>Estudiantes inscritos</span>
            <Users size={20} />
          </div>
          <strong>{totalEstudiantes}</strong>
          <small>Total de inscripciones en mis grupos</small>
        </article>
      </section>

      {/* Tabla */}
      <section className="ad-panel">
        <div className="ad-panel-header">
          <div>
            <h2>Listado de asignaturas</h2>
            <p>Información académica del periodo actual</p>
          </div>
        </div>

        <div className="ad-filtros">
          <label className="ad-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar materia, carrera o grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>

          <select
            aria-label="Filtrar por asignatura"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="todas">Todas las asignaturas</option>
            {nombres.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Asignatura</th>
                <th>Grupo</th>
                <th>Carrera</th>
                <th>Estudiantes</th>
                <th>Periodo</th>
              </tr>
            </thead>

            <tbody>
              {filtradas.map((asignatura) => (
                <tr key={asignatura.id}>
                  <td>
                    <strong>{asignatura.nombre}</strong>
                  </td>
                  <td>
                    <span className="ad-grupo">
                      {asignatura.grupo}
                    </span>
                  </td>
                  <td>{asignatura.carrera}</td>
                  <td>{asignatura.estudiantes}</td>
                  <td>{asignatura.periodo}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtradas.length === 0 && (
            <p className="ad-empty">
              No se encontraron asignaturas con esos filtros.
            </p>
          )}
        </div>

        <p className="ad-footer">
          Mostrando {filtradas.length} de {ASIGNATURAS.length} grupos.
        </p>
      </section>
    </div>
  );
}
