
import { useState } from "react";

import {
  UsersRound,
  UserCheck,
  Search,
  Plus,
  Pencil,
  BookOpen,
  Mail,
  X,
  Save
} from "lucide-react";

import {
  DIRECCION_DOCENTES,
  CARRERAS_DIRECCION
} from "../../data/direccionMock";

import "./DocentesDireccion.css";

const formularioVacio = {
  nombre: "",
  correo: "",
  carrera: CARRERAS_DIRECCION[0],
  activo: true
};

export default function DocentesDireccion() {
  const [docentes, setDocentes] = useState(
    DIRECCION_DOCENTES
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtroCarrera, setFiltroCarrera] =
    useState("todas");

  const [formAbierto, setFormAbierto] =
    useState(false);

  const [editandoId, setEditandoId] =
    useState(null);

  const [formulario, setFormulario] = useState({
    ...formularioVacio
  });

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const docentesActivos = docentes.filter(
    (docente) => docente.activo
  ).length;

  const docentesAsignados = docentes.filter(
    (docente) => docente.grupos.length > 0
  ).length;

  const docentesFiltrados = docentes.filter(
    (docente) => {
      const texto = busqueda.trim().toLowerCase();

      const coincideBusqueda =
        docente.nombre.toLowerCase().includes(texto) ||
        docente.correo.toLowerCase().includes(texto) ||
        docente.grupos.some((grupo) =>
          grupo.toLowerCase().includes(texto)
        );

      const coincideCarrera =
        filtroCarrera === "todas" ||
        docente.carrera === filtroCarrera;

      return coincideBusqueda && coincideCarrera;
    }
  );

  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor
    }));

    setError("");
  };

  const abrirNuevo = () => {
    setFormulario({ ...formularioVacio });
    setEditandoId(null);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const abrirEditar = (docente) => {
    setFormulario({
      nombre: docente.nombre,
      correo: docente.correo,
      carrera: docente.carrera,
      activo: docente.activo
    });

    setEditandoId(docente.id);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const cerrarFormulario = () => {
    setFormAbierto(false);
    setEditandoId(null);
    setError("");
  };

  const guardarDocente = (e) => {
    e.preventDefault();

    const nombre = formulario.nombre.trim();
    const correo = formulario.correo
      .trim()
      .toLowerCase();

    if (!nombre || !correo || !formulario.carrera) {
      setError("Completa todos los campos.");
      return;
    }

    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

    if (!correoValido) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    const correoRepetido = docentes.some(
      (docente) =>
        docente.correo.toLowerCase() === correo &&
        docente.id !== editandoId
    );

    if (correoRepetido) {
      setError("Ya existe un docente con ese correo.");
      return;
    }

    if (editandoId !== null) {
      setDocentes((actuales) =>
        actuales.map((docente) =>
          docente.id === editandoId
            ? {
                ...docente,
                nombre,
                correo,
                carrera: formulario.carrera,
                activo: formulario.activo
              }
            : docente
        )
      );

      setMensaje("Docente actualizado en la demostración.");
    } else {
      const nuevoId =
        Math.max(0, ...docentes.map((d) => d.id)) + 1;

      const nuevoDocente = {
        id: nuevoId,
        nombre,
        correo,
        carrera: formulario.carrera,
        grupos: [],
        activo: formulario.activo
      };

      setDocentes((actuales) => [
        ...actuales,
        nuevoDocente
      ]);

      setMensaje("Docente registrado en la demostración.");
    }

    cerrarFormulario();
  };

  return (
    <div className="dg-page">

      {/* ENCABEZADO */}
      <div className="dg-heading">
        <div>
          <h1>Gestión de docentes</h1>
          <p>
            Consulta y administra la información
            del personal docente registrado.
          </p>
        </div>

        <button
          type="button"
          className="dg-primary-button"
          onClick={abrirNuevo}
        >
          <Plus size={18} />
          Nuevo docente
        </button>
      </div>

      <p className="dg-demo">
        Vista de demostración. Los cambios se mantienen
        temporalmente en esta pantalla y todavía
        no se guardan en una base de datos.
      </p>

      {/* INDICADORES */}
      <section className="dg-stats">

        <article className="dg-stat">
          <div className="dg-stat-icon">
            <UsersRound size={21} />
          </div>

          <span>Docentes registrados</span>
          <strong>{docentes.length}</strong>
        </article>

        <article className="dg-stat">
          <div className="dg-stat-icon">
            <UserCheck size={21} />
          </div>

          <span>Docentes activos</span>
          <strong>{docentesActivos}</strong>
        </article>

        <article className="dg-stat">
          <div className="dg-stat-icon">
            <BookOpen size={21} />
          </div>

          <span>Con grupos asignados</span>
          <strong>{docentesAsignados}</strong>
        </article>

      </section>

      {/* FORMULARIO PARA REGISTRAR O EDITAR */}
      {formAbierto && (
        <section className="dg-panel">

          <div className="dg-panel-heading">
            <div>
              <h2>
                {editandoId !== null
                  ? "Editar docente"
                  : "Registrar docente"}
              </h2>

              <p>
                Completa los datos académicos
                del profesor.
              </p>
            </div>

            <button
              type="button"
              className="dg-icon-button"
              onClick={cerrarFormulario}
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>
          </div>

          <form
            className="dg-form"
            onSubmit={guardarDocente}
          >
            <div className="dg-form-grid">

              <label className="dg-field">
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
                  placeholder="Nombre del docente"
                  required
                />
              </label>

              <label className="dg-field">
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

              <label className="dg-field">
                <span>Carrera</span>
                <select
                  value={formulario.carrera}
                  onChange={(e) =>
                    actualizarCampo(
                      "carrera",
                      e.target.value
                    )
                  }
                >
                  {CARRERAS_DIRECCION.map((carrera) => (
                    <option
                      key={carrera}
                      value={carrera}
                    >
                      {carrera}
                    </option>
                  ))}
                </select>
              </label>

              <label className="dg-field">
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
              <p className="dg-error" role="alert">
                {error}
              </p>
            )}

            <div className="dg-form-actions">
              <button
                type="button"
                className="dg-secondary-button"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="dg-primary-button"
              >
                <Save size={17} />
                {editandoId !== null
                  ? "Guardar cambios"
                  : "Registrar docente"}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* LISTADO DE DOCENTES */}
      <section className="dg-panel">

        <div className="dg-panel-heading">
          <div>
            <h2>Personal docente</h2>
            <p>
              Busca profesores y consulta
              sus grupos asignados.
            </p>
          </div>
        </div>

        {mensaje && (
          <p
            className="dg-success"
            role="status"
          >
            {mensaje}
          </p>
        )}

        {/* FILTROS */}
        <div className="dg-filters">

          <label className="dg-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Buscar docente, correo o grupo..."
              aria-label="Buscar docentes"
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

        </div>

        {/* TABLA */}
        <div className="dg-table-scroll">
          <table className="dg-table">

            <thead>
              <tr>
                <th>Docente</th>
                <th>Carrera</th>
                <th>Grupos asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {docentesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="dg-empty">
                    No se encontraron docentes.
                  </td>
                </tr>
              ) : (
                docentesFiltrados.map((docente) => (
                  <tr key={docente.id}>

                    <td>
                      <div className="dg-person">
                        <div className="dg-person-avatar">
                          {docente.nombre
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{docente.nombre}</strong>

                          <span>
                            <Mail size={13} />
                            {docente.correo}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {docente.carrera}
                    </td>

                    <td>
                      <div className="dg-group-list">
                        {docente.grupos.length > 0 ? (
                          docente.grupos.map((grupo) => (
                            <span
                              key={grupo}
                              className="dg-group-tag"
                            >
                              {grupo}
                            </span>
                          ))
                        ) : (
                          <span className="dg-muted">
                            Sin asignar
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`dg-status ${
                          docente.activo
                            ? "dg-status-active"
                            : "dg-status-inactive"
                        }`}
                      >
                        {docente.activo
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="dg-edit-button"
                        onClick={() =>
                          abrirEditar(docente)
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

        <p className="dg-table-footer">
          Mostrando {docentesFiltrados.length} de{" "}
          {docentes.length} docentes de demostración.
        </p>

      </section>

      <p className="dg-bottom-note">
        La asignación y modificación de grupos
        se realizará en el módulo
        "Grupos y asignaturas".
      </p>

    </div>
  );
}
