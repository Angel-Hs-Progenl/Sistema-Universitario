
import { useState } from "react";

import {
  BookOpen,
  UsersRound,
  GraduationCap,
  Search,
  Plus,
  Pencil,
  UserRoundMinus,
  Save,
  X,
  CalendarDays
} from "lucide-react";

import {
  PERIODO_DIRECCION,
  CARRERAS_DIRECCION,
  DIRECCION_DOCENTES,
  GRUPOS_ESTUDIANTES,
  ASIGNACIONES_DIRECCION
} from "../../data/direccionMock";

import "./GruposAsignaturas.css";

const formularioInicial = {
  grupo: GRUPOS_ESTUDIANTES[0]?.clave || "",
  asignatura: "",
  docenteId: ""
};

export default function GruposAsignaturas() {
  const [asignaciones, setAsignaciones] = useState(
    ASIGNACIONES_DIRECCION
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtroCarrera, setFiltroCarrera] =
    useState("todas");
  const [filtroEstado, setFiltroEstado] =
    useState("todos");

  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({
    ...formularioInicial
  });

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerGrupo = (clave) =>
    GRUPOS_ESTUDIANTES.find(
      (grupo) => grupo.clave === clave
    );

  const obtenerDocente = (id) =>
    DIRECCION_DOCENTES.find(
      (docente) => docente.id === id
    );

  const grupoSeleccionado = obtenerGrupo(
    formulario.grupo
  );

  const docentesDisponibles = DIRECCION_DOCENTES.filter(
    (docente) =>
      docente.activo &&
      docente.carrera === grupoSeleccionado?.carrera
  );

  const totalGrupos = new Set(
    asignaciones.map((item) => item.grupo)
  ).size;

  const totalAsignaturas = new Set(
    asignaciones.map((item) =>
      item.asignatura.toLowerCase()
    )
  ).size;

  const totalAsignadas = asignaciones.filter(
    (item) => item.docenteId !== null
  ).length;

  const asignacionesFiltradas = asignaciones.filter(
    (item) => {
      const grupo = obtenerGrupo(item.grupo);
      const docente = obtenerDocente(item.docenteId);
      const texto = busqueda.trim().toLowerCase();

      const valores = [
        item.grupo,
        item.asignatura,
        grupo?.carrera || "",
        docente?.nombre || ""
      ];

      const coincideBusqueda = valores.some(
        (valor) => valor.toLowerCase().includes(texto)
      );

      const coincideCarrera =
        filtroCarrera === "todas" ||
        grupo?.carrera === filtroCarrera;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "asignado" &&
          item.docenteId !== null) ||
        (filtroEstado === "sin-asignar" &&
          item.docenteId === null);

      return (
        coincideBusqueda &&
        coincideCarrera &&
        coincideEstado
      );
    }
  );

  const abrirNuevo = () => {
    setFormulario({ ...formularioInicial });
    setEditandoId(null);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const abrirEditar = (asignacion) => {
    setFormulario({
      grupo: asignacion.grupo,
      asignatura: asignacion.asignatura,
      docenteId:
        asignacion.docenteId === null
          ? ""
          : String(asignacion.docenteId)
    });

    setEditandoId(asignacion.id);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const cerrarFormulario = () => {
    setFormAbierto(false);
    setEditandoId(null);
    setError("");
  };

  const cambiarGrupo = (clave) => {
    setFormulario((actual) => ({
      ...actual,
      grupo: clave,
      docenteId: ""
    }));
    setError("");
  };

  const guardarAsignacion = (e) => {
    e.preventDefault();

    const asignatura = formulario.asignatura.trim();
    const grupo = obtenerGrupo(formulario.grupo);

    if (!grupo || !asignatura) {
      setError("Selecciona el grupo y la asignatura.");
      return;
    }

    const existe = asignaciones.some(
      (item) =>
        item.id !== editandoId &&
        item.grupo === formulario.grupo &&
        item.asignatura.toLowerCase() ===
          asignatura.toLowerCase()
    );

    if (existe) {
      setError(
        "Esta asignatura ya está registrada " +
        "para el grupo seleccionado."
      );
      return;
    }

    const docenteId = formulario.docenteId
      ? Number(formulario.docenteId)
      : null;

    if (docenteId !== null) {
      const docenteValido = docentesDisponibles.some(
        (docente) => docente.id === docenteId
      );

      if (!docenteValido) {
        setError(
          "Selecciona un docente activo " +
          "de la carrera correspondiente."
        );
        return;
      }
    }

    const datos = {
      grupo: formulario.grupo,
      asignatura,
      docenteId
    };

    if (editandoId !== null) {
      setAsignaciones((actuales) =>
        actuales.map((item) =>
          item.id === editandoId
            ? { ...item, ...datos }
            : item
        )
      );

      setMensaje(
        "Asignación actualizada en la demostración."
      );
    } else {
      const nuevoId =
        Math.max(0, ...asignaciones.map((a) => a.id)) + 1;

      setAsignaciones((actuales) => [
        ...actuales,
        { id: nuevoId, ...datos }
      ]);

      setMensaje(
        "Grupo y asignatura registrados en la demostración."
      );
    }

    cerrarFormulario();
  };

  const quitarDocente = (asignacion) => {
    setAsignaciones((actuales) =>
      actuales.map((item) =>
        item.id === asignacion.id
          ? { ...item, docenteId: null }
          : item
      )
    );

    setMensaje(
      `Se quitó la asignación docente de ` +
      `${asignacion.asignatura} (${asignacion.grupo}).`
    );
  };

  return (
    <div className="ga-page">

      {/* ENCABEZADO */}
      <div className="ga-heading">
        <div>
          <h1>Grupos y asignaturas</h1>
          <p>
            Administra las asignaturas impartidas
            y los docentes responsables de cada grupo.
          </p>
        </div>

        <button
          type="button"
          className="ga-primary-button"
          onClick={abrirNuevo}
        >
          <Plus size={18} />
          Nueva asignación
        </button>
      </div>

      <div className="ga-periodo">
        <CalendarDays size={17} />
        <span>Periodo académico: {PERIODO_DIRECCION}</span>
      </div>

      <p className="ga-demo">
        Los cambios son temporales y solo se reflejan
        en esta pantalla. Todavía no están conectados
        con los módulos Docente y Estudiante.
      </p>

      {/* TARJETAS */}
      <section className="ga-stats">

        <article className="ga-stat">
          <span className="ga-stat-icon">
            <UsersRound size={22} />
          </span>
          <p>Grupos diferentes</p>
          <strong>{totalGrupos}</strong>
        </article>

        <article className="ga-stat">
          <span className="ga-stat-icon">
            <BookOpen size={22} />
          </span>
          <p>Asignaturas diferentes</p>
          <strong>{totalAsignaturas}</strong>
        </article>

        <article className="ga-stat">
          <span className="ga-stat-icon">
            <GraduationCap size={22} />
          </span>
          <p>Asignaciones con docente</p>
          <strong>{totalAsignadas}</strong>
        </article>

      </section>

      {/* FORMULARIO */}
      {formAbierto && (
        <section className="ga-panel">
          <div className="ga-panel-heading">
            <div>
              <h2>
                {editandoId !== null
                  ? "Editar asignación"
                  : "Registrar asignación"}
              </h2>
              <p>
                Relaciona un grupo, una asignatura
                y un docente responsable.
              </p>
            </div>

            <button
              type="button"
              className="ga-icon-button"
              onClick={cerrarFormulario}
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={guardarAsignacion}>
            <div className="ga-form-grid">

              <label className="ga-field">
                <span>Grupo</span>
                <select
                  value={formulario.grupo}
                  onChange={(e) =>
                    cambiarGrupo(e.target.value)
                  }
                  required
                >
                  {GRUPOS_ESTUDIANTES.map((grupo) => (
                    <option
                      key={grupo.clave}
                      value={grupo.clave}
                    >
                      {grupo.clave}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ga-field">
                <span>Carrera</span>
                <input
                  type="text"
                  value={grupoSeleccionado?.carrera || ""}
                  readOnly
                />
              </label>

              <label className="ga-field">
                <span>Asignatura</span>
                <input
                  type="text"
                  value={formulario.asignatura}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      asignatura: e.target.value
                    }))
                  }
                  placeholder="Ej. Programación Web"
                  required
                />
              </label>

              <label className="ga-field">
                <span>Docente responsable</span>
                <select
                  value={formulario.docenteId}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      docenteId: e.target.value
                    }))
                  }
                >
                  <option value="">
                    Sin asignar
                  </option>

                  {docentesDisponibles.map((docente) => (
                    <option
                      key={docente.id}
                      value={docente.id}
                    >
                      {docente.nombre}
                    </option>
                  ))}
                </select>
              </label>

            </div>

            <p className="ga-helper">
              Solo aparecen los docentes activos
              que pertenecen a la carrera del grupo.
            </p>

            {error && (
              <p className="ga-error" role="alert">
                {error}
              </p>
            )}

            <div className="ga-form-actions">
              <button
                type="button"
                className="ga-secondary-button"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="ga-primary-button"
              >
                <Save size={17} />
                Guardar asignación
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TABLA */}
      <section className="ga-panel">
        <div className="ga-panel-heading">
          <div>
            <h2>Asignaciones académicas</h2>
            <p>
              Consulta qué docente imparte
              cada asignatura y grupo.
            </p>
          </div>
        </div>

        {mensaje && (
          <p className="ga-success" role="status">
            {mensaje}
          </p>
        )}

        <div className="ga-filters">
          <label className="ga-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar grupo, materia o docente..."
              aria-label="Buscar asignaciones"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
            />
          </label>

          <select
            aria-label="Filtrar por carrera"
            value={filtroCarrera}
            onChange={(e) =>
              setFiltroCarrera(e.target.value)
            }
          >
            <option value="todas">
              Todas las carreras
            </option>

            {CARRERAS_DIRECCION.map((carrera) => (
              <option
                key={carrera}
                value={carrera}
              >
                {carrera}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por asignación"
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
          >
            <option value="todos">
              Todos los estados
            </option>
            <option value="asignado">
              Con docente
            </option>
            <option value="sin-asignar">
              Sin docente
            </option>
          </select>
        </div>

        <div className="ga-table-scroll">
          <table className="ga-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Carrera</th>
                <th>Asignatura</th>
                <th>Docente responsable</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {asignacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ga-empty">
                    No se encontraron asignaciones.
                  </td>
                </tr>
              ) : (
                asignacionesFiltradas.map((item) => {
                  const grupo = obtenerGrupo(item.grupo);
                  const docente = obtenerDocente(
                    item.docenteId
                  );

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="ga-group-tag">
                          {item.grupo}
                        </span>
                      </td>

                      <td>
                        {grupo?.carrera || "Sin carrera"}
                      </td>

                      <td>
                        <strong>{item.asignatura}</strong>
                      </td>

                      <td>
                        {docente?.nombre || "Sin asignar"}
                      </td>

                      <td>
                        <span
                          className={`ga-status ${
                            item.docenteId !== null
                              ? "ga-assigned"
                              : "ga-unassigned"
                          }`}
                        >
                          {item.docenteId !== null
                            ? "Asignado"
                            : "Pendiente"}
                        </span>
                      </td>

                      <td>
                        <div className="ga-actions">
                          <button
                            type="button"
                            className="ga-action-button"
                            onClick={() => abrirEditar(item)}
                          >
                            <Pencil size={15} />
                            Editar
                          </button>

                          {item.docenteId !== null && (
                            <button
                              type="button"
                              className="ga-action-button ga-remove"
                              onClick={() =>
                                quitarDocente(item)
                              }
                              title="Quitar docente responsable"
                            >
                              <UserRoundMinus size={15} />
                              Desasignar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="ga-table-footer">
          Mostrando {asignacionesFiltradas.length} de{" "}
          {asignaciones.length} asignaciones.
        </p>
      </section>
    </div>
  );
}
