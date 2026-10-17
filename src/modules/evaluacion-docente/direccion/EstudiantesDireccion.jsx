
import { useState } from "react";

import {
  GraduationCap,
  UserCheck,
  BookOpen,
  Search,
  Plus,
  Pencil,
  Upload,
  X,
  Save
} from "lucide-react";

import {
  CARRERAS_DIRECCION,
  GRUPOS_ESTUDIANTES,
  ESTUDIANTES_DIRECCION,
  ESTUDIANTES_IMPORTACION_DEMO
} from "../../data/direccionMock";

import "./EstudiantesDireccion.css";

const formularioInicial = {
  matricula: "",
  nombre: "",
  correo: "",
  carrera: CARRERAS_DIRECCION[0],
  grupo: "",
  activo: true
};

export default function EstudiantesDireccion() {
  const [estudiantes, setEstudiantes] = useState(
    ESTUDIANTES_DIRECCION
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtroCarrera, setFiltroCarrera] =
    useState("todas");

  const [formAbierto, setFormAbierto] =
    useState(false);

  const [editandoId, setEditandoId] =
    useState(null);

  const [formulario, setFormulario] = useState({
    ...formularioInicial
  });

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const gruposDisponibles = GRUPOS_ESTUDIANTES.filter(
    (grupo) => grupo.carrera === formulario.carrera
  );

  const activos = estudiantes.filter(
    (estudiante) => estudiante.activo
  ).length;

  const gruposRegistrados = new Set(
    estudiantes.map((estudiante) => estudiante.grupo)
  ).size;

  const estudiantesFiltrados = estudiantes.filter(
    (estudiante) => {
      const texto = busqueda.trim().toLowerCase();

      const coincideBusqueda = [
        estudiante.nombre,
        estudiante.matricula,
        estudiante.correo,
        estudiante.grupo
      ].some((valor) =>
        valor.toLowerCase().includes(texto)
      );

      const coincideCarrera =
        filtroCarrera === "todas" ||
        estudiante.carrera === filtroCarrera;

      return coincideBusqueda && coincideCarrera;
    }
  );

  const actualizarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor
    }));

    setError("");
  };

  const cambiarCarrera = (carrera) => {
    setFormulario((anterior) => ({
      ...anterior,
      carrera,
      grupo: ""
    }));
  };

  const abrirNuevo = () => {
    setFormulario({ ...formularioInicial });
    setEditandoId(null);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const abrirEditar = (estudiante) => {
    setFormulario({
      matricula: estudiante.matricula,
      nombre: estudiante.nombre,
      correo: estudiante.correo,
      carrera: estudiante.carrera,
      grupo: estudiante.grupo,
      activo: estudiante.activo
    });

    setEditandoId(estudiante.id);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const cerrarFormulario = () => {
    setFormAbierto(false);
    setEditandoId(null);
    setError("");
  };

  const guardarEstudiante = (e) => {
    e.preventDefault();

    const matricula = formulario.matricula
      .trim()
      .toUpperCase();

    const nombre = formulario.nombre.trim();

    const correo = formulario.correo
      .trim()
      .toLowerCase();

    if (
      !matricula ||
      !nombre ||
      !correo ||
      !formulario.carrera ||
      !formulario.grupo
    ) {
      setError("Completa todos los campos.");
      return;
    }

    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

    if (!correoValido) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    const matriculaRepetida = estudiantes.some(
      (estudiante) =>
        estudiante.matricula.toUpperCase() ===
          matricula &&
        estudiante.id !== editandoId
    );

    if (matriculaRepetida) {
      setError("La matrícula ya está registrada.");
      return;
    }

    const correoRepetido = estudiantes.some(
      (estudiante) =>
        estudiante.correo.toLowerCase() ===
          correo &&
        estudiante.id !== editandoId
    );

    if (correoRepetido) {
      setError("El correo ya está registrado.");
      return;
    }

    const grupoValido = GRUPOS_ESTUDIANTES.some(
      (grupo) =>
        grupo.clave === formulario.grupo &&
        grupo.carrera === formulario.carrera
    );

    if (!grupoValido) {
      setError("Selecciona un grupo válido.");
      return;
    }

    const datos = {
      matricula,
      nombre,
      correo,
      carrera: formulario.carrera,
      grupo: formulario.grupo,
      activo: formulario.activo
    };

    if (editandoId !== null) {
      setEstudiantes((actuales) =>
        actuales.map((estudiante) =>
          estudiante.id === editandoId
            ? { ...estudiante, ...datos }
            : estudiante
        )
      );

      setMensaje(
        "Estudiante actualizado en la demostración."
      );
    } else {
      const nuevoId = Math.max(
        0,
        ...estudiantes.map((estudiante) => estudiante.id)
      ) + 1;

      setEstudiantes((actuales) => [
        ...actuales,
        { id: nuevoId, ...datos }
      ]);

      setMensaje(
        "Estudiante registrado en la demostración."
      );
    }

    cerrarFormulario();
  };

  // Simula una importación desde un padrón de prueba.
  // No guarda información en un servidor.
  const simularImportacion = () => {
    const nuevos = ESTUDIANTES_IMPORTACION_DEMO.filter(
      (registro) =>
        !estudiantes.some(
          (estudiante) =>
            estudiante.matricula === registro.matricula ||
            estudiante.correo === registro.correo
        )
    );

    if (nuevos.length === 0) {
      setMensaje(
        "Los registros de ejemplo ya están importados."
      );
      return;
    }

    const ultimoId = Math.max(
      0,
      ...estudiantes.map((estudiante) => estudiante.id)
    );

    const registros = nuevos.map((registro, index) => ({
      id: ultimoId + index + 1,
      ...registro
    }));

    setEstudiantes((actuales) => [
      ...actuales,
      ...registros
    ]);

    setMensaje(
      `Se importaron ${registros.length} estudiantes ` +
      "de demostración."
    );
  };

  return (
    <div className="ed-page">

      {/* ENCABEZADO */}
      <div className="ed-heading">
        <div>
          <h1>Gestión de estudiantes</h1>
          <p>
            Registra y consulta a los estudiantes
            de la institución.
          </p>
        </div>

        <div className="ed-heading-actions">
          <button
            type="button"
            className="ed-outline-button"
            onClick={simularImportacion}
          >
            <Upload size={18} />
            Simular importación
          </button>

          <button
            type="button"
            className="ed-primary-button"
            onClick={abrirNuevo}
          >
            <Plus size={18} />
            Nuevo estudiante
          </button>
        </div>
      </div>

      <p className="ed-demo">
        Vista de demostración con datos ficticios.
        El registro y la importación son temporales:
        todavía no se utiliza una base de datos.
      </p>

      {/* INDICADORES */}
      <section className="ed-stats">
        <article className="ed-stat">
          <GraduationCap size={24} />
          <span>Estudiantes registrados</span>
          <strong>{estudiantes.length}</strong>
        </article>

        <article className="ed-stat">
          <UserCheck size={24} />
          <span>Estudiantes activos</span>
          <strong>{activos}</strong>
        </article>

        <article className="ed-stat">
          <BookOpen size={24} />
          <span>Grupos registrados</span>
          <strong>{gruposRegistrados}</strong>
        </article>
      </section>

      {/* FORMULARIO */}
      {formAbierto && (
        <section className="ed-panel">

          <div className="ed-panel-heading">
            <div>
              <h2>
                {editandoId !== null
                  ? "Editar estudiante"
                  : "Registrar estudiante"}
              </h2>

              <p>
                Completa los datos del alumno.
              </p>
            </div>

            <button
              type="button"
              className="ed-icon-button"
              onClick={cerrarFormulario}
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>
          </div>

          <form
            className="ed-form"
            onSubmit={guardarEstudiante}
          >
            <div className="ed-form-grid">

              <label className="ed-field">
                <span>Matrícula</span>
                <input
                  type="text"
                  value={formulario.matricula}
                  onChange={(e) =>
                    actualizarCampo(
                      "matricula",
                      e.target.value
                    )
                  }
                  placeholder="Ej. UTO26008"
                  required
                />
              </label>

              <label className="ed-field">
                <span>Nombre completo</span>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    actualizarCampo(
                      "nombre",
                      e.target.value
                    )
                  }
                  placeholder="Nombre del estudiante"
                  required
                />
              </label>

              <label className="ed-field">
                <span>Correo institucional</span>
                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(e) =>
                    actualizarCampo(
                      "correo",
                      e.target.value
                    )
                  }
                  placeholder="correo@institucion.edu.mx"
                  required
                />
              </label>

              <label className="ed-field">
                <span>Carrera</span>
                <select
                  value={formulario.carrera}
                  onChange={(e) =>
                    cambiarCarrera(e.target.value)
                  }
                >
                  {CARRERAS_DIRECCION.map((carrera) => (
                    <option key={carrera} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ed-field">
                <span>Grupo</span>
                <select
                  value={formulario.grupo}
                  onChange={(e) =>
                    actualizarCampo(
                      "grupo",
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Selecciona un grupo
                  </option>

                  {gruposDisponibles.map((grupo) => (
                    <option
                      key={grupo.clave}
                      value={grupo.clave}
                    >
                      {grupo.clave}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ed-field">
                <span>Estado</span>
                <select
                  value={
                    formulario.activo
                      ? "activo"
                      : "inactivo"
                  }
                  onChange={(e) =>
                    actualizarCampo(
                      "activo",
                      e.target.value === "activo"
                    )
                  }
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>

            </div>

            {error && (
              <p className="ed-error" role="alert">
                {error}
              </p>
            )}

            <div className="ed-form-actions">
              <button
                type="button"
                className="ed-outline-button"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="ed-primary-button"
              >
                <Save size={17} />
                Guardar estudiante
              </button>
            </div>
          </form>

        </section>
      )}

      {/* LISTADO */}
      <section className="ed-panel">

        <div className="ed-panel-heading">
          <div>
            <h2>Estudiantes registrados</h2>
            <p>
              Consulta la información académica
              de cada estudiante.
            </p>
          </div>
        </div>

        {mensaje && (
          <p className="ed-success" role="status">
            {mensaje}
          </p>
        )}

        <div className="ed-filters">
          <label className="ed-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Buscar nombre, matrícula o grupo..."
              aria-label="Buscar estudiantes"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
            />
          </label>

          <select
            value={filtroCarrera}
            onChange={(e) =>
              setFiltroCarrera(e.target.value)
            }
            aria-label="Filtrar por carrera"
          >
            <option value="todas">
              Todas las carreras
            </option>

            {CARRERAS_DIRECCION.map((carrera) => (
              <option key={carrera} value={carrera}>
                {carrera}
              </option>
            ))}
          </select>
        </div>

        <div className="ed-table-scroll">
          <table className="ed-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Matrícula</th>
                <th>Carrera</th>
                <th>Grupo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {estudiantesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ed-empty">
                    No se encontraron estudiantes.
                  </td>
                </tr>
              ) : (
                estudiantesFiltrados.map((estudiante) => (
                  <tr key={estudiante.id}>

                    <td>
                      <div className="ed-person">
                        <div className="ed-avatar">
                          {estudiante.nombre
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {estudiante.nombre}
                          </strong>
                          <small>
                            {estudiante.correo}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>{estudiante.matricula}</td>
                    <td>{estudiante.carrera}</td>

                    <td>
                      <span className="ed-group">
                        {estudiante.grupo}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`ed-status ${
                          estudiante.activo
                            ? "ed-status-active"
                            : "ed-status-inactive"
                        }`}
                      >
                        {estudiante.activo
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ed-edit"
                        onClick={() =>
                          abrirEditar(estudiante)
                        }
                      >
                        <Pencil size={16} />
                        Editar
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="ed-footer">
          Mostrando {estudiantesFiltrados.length} de{" "}
          {estudiantes.length} estudiantes.
        </p>
      </section>

    </div>
  );
}
