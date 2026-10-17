
import { useState } from "react";

import {
  CalendarDays,
  CalendarCheck2,
  Clock3,
  LockKeyhole,
  Plus,
  Search,
  Pencil,
  Play,
  Save,
  X,
  CheckCircle2
} from "lucide-react";

import {
  PERIODOS_DIRECCION
} from "../../data/direccionMock";

import "./PeriodosDireccion.css";

const formularioVacio = {
  nombre: "",
  fechaInicio: "",
  fechaFin: "",
  descripcion: ""
};

const etiquetasEstado = {
  abierto: "Abierto",
  programado: "Programado",
  cerrado: "Cerrado"
};

function obtenerFechaActual() {
  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function mostrarFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const [anio, mes, dia] = fecha.split("-").map(Number);

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(anio, mes - 1, dia));
}

export default function PeriodosDireccion() {
  const [periodos, setPeriodos] = useState(
    PERIODOS_DIRECCION
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [formulario, setFormulario] = useState({
    ...formularioVacio
  });

  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null);

  const totalAbiertos = periodos.filter(
    (periodo) => periodo.estado === "abierto"
  ).length;

  const totalProgramados = periodos.filter(
    (periodo) => periodo.estado === "programado"
  ).length;

  const totalCerrados = periodos.filter(
    (periodo) => periodo.estado === "cerrado"
  ).length;

  const periodoActivo = periodos.find(
    (periodo) => periodo.estado === "abierto"
  );

  const periodosFiltrados = periodos.filter((periodo) => {
    const texto = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      periodo.nombre.toLowerCase().includes(texto) ||
      periodo.descripcion.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "todos" ||
      periodo.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

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
    setAviso(null);
    setFormAbierto(true);
  };

  const abrirEditar = (periodo) => {
    if (periodo.estado !== "programado") {
      setAviso({
        tipo: "error",
        texto:
          "Solo puedes modificar periodos programados. " +
          "Los periodos abiertos o cerrados están bloqueados " +
          "para proteger su historial."
      });
      return;
    }

    setFormulario({
      nombre: periodo.nombre,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      descripcion: periodo.descripcion
    });

    setEditandoId(periodo.id);
    setError("");
    setAviso(null);
    setFormAbierto(true);
  };

  const cerrarFormulario = () => {
    setFormAbierto(false);
    setEditandoId(null);
    setError("");
  };

  const guardarPeriodo = (e) => {
    e.preventDefault();

    const nombre = formulario.nombre.trim();
    const descripcion = formulario.descripcion.trim();
    const fechaInicio = formulario.fechaInicio;
    const fechaFin = formulario.fechaFin;

    if (!nombre || !fechaInicio || !fechaFin) {
      setError("Completa el nombre y las fechas.");
      return;
    }

    if (fechaFin < fechaInicio) {
      setError(
        "La fecha de cierre no puede ser anterior " +
        "a la fecha de inicio."
      );
      return;
    }

    const nombreRepetido = periodos.some(
      (periodo) =>
        periodo.nombre.toLowerCase() ===
          nombre.toLowerCase() &&
        periodo.id !== editandoId
    );

    if (nombreRepetido) {
      setError("Ya existe un periodo con ese nombre.");
      return;
    }

    const datos = {
      nombre,
      fechaInicio,
      fechaFin,
      descripcion
    };

    if (editandoId !== null) {
      setPeriodos((actuales) =>
        actuales.map((periodo) =>
          periodo.id === editandoId &&
          periodo.estado === "programado"
            ? { ...periodo, ...datos }
            : periodo
        )
      );

      setAviso({
        tipo: "exito",
        texto: "Periodo actualizado correctamente en la demostración."
      });
    } else {
      const nuevoId =
        Math.max(0, ...periodos.map((p) => p.id)) + 1;

      setPeriodos((actuales) => [
        ...actuales,
        {
          id: nuevoId,
          ...datos,
          estado: "programado"
        }
      ]);

      setAviso({
        tipo: "exito",
        texto: "Nuevo periodo registrado como Programado."
      });
    }

    cerrarFormulario();
  };

  const abrirEvaluaciones = (periodo) => {
    const hoy = obtenerFechaActual();

    if (periodo.estado !== "programado") return;

    if (totalAbiertos > 0) {
      setAviso({
        tipo: "error",
        texto:
          "Ya existe un periodo abierto. Debes cerrar " +
          "el periodo actual antes de abrir otro."
      });
      return;
    }

    if (
      hoy < periodo.fechaInicio ||
      hoy > periodo.fechaFin
    ) {
      setAviso({
        tipo: "error",
        texto:
          "Solo puedes abrir este periodo cuando " +
          "la fecha actual esté dentro de su rango."
      });
      return;
    }

    setPeriodos((actuales) =>
      actuales.map((item) =>
        item.id === periodo.id
          ? { ...item, estado: "abierto" }
          : item
      )
    );

    setAviso({
      tipo: "exito",
      texto: `Se abrió el periodo "${periodo.nombre}".`
    });
  };

  const cerrarEvaluaciones = (periodo) => {
    if (periodo.estado !== "abierto") return;

    setPeriodos((actuales) =>
      actuales.map((item) =>
        item.id === periodo.id
          ? { ...item, estado: "cerrado" }
          : item
      )
    );

    setAviso({
      tipo: "exito",
      texto: `Se cerró el periodo "${periodo.nombre}".`
    });
  };

  return (
    <div className="pd-page">

      {/* ENCABEZADO */}
      <div className="pd-heading">
        <div>
          <h1>Periodos académicos</h1>
          <p>
            Organiza las fechas y controla la apertura
            de las evaluaciones docentes.
          </p>
        </div>

        <button
          type="button"
          className="pd-primary-button"
          onClick={abrirNuevo}
        >
          <Plus size={18} />
          Nuevo periodo
        </button>
      </div>

      <p className="pd-demo">
        Módulo de demostración: los cambios son temporales.
        Todavía no se sincronizan con el resto de la plataforma.
      </p>

      {/* INDICADORES */}
      <section className="pd-stats">
        <article className="pd-stat">
          <div className="pd-stat-icon">
            <CalendarDays size={21} />
          </div>
          <span>Total de periodos</span>
          <strong>{periodos.length}</strong>
        </article>

        <article className="pd-stat">
          <div className="pd-stat-icon">
            <CalendarCheck2 size={21} />
          </div>
          <span>Periodos abiertos</span>
          <strong>{totalAbiertos}</strong>
        </article>

        <article className="pd-stat">
          <div className="pd-stat-icon">
            <Clock3 size={21} />
          </div>
          <span>Programados</span>
          <strong>{totalProgramados}</strong>
        </article>

        <article className="pd-stat">
          <div className="pd-stat-icon">
            <LockKeyhole size={21} />
          </div>
          <span>Cerrados</span>
          <strong>{totalCerrados}</strong>
        </article>
      </section>

      {/* PERIODO ACTIVO */}
      <section className="pd-active-panel">
        <div className="pd-active-icon">
          <CalendarCheck2 size={24} />
        </div>

        <div>
          <span className="pd-active-label">
            PERIODO DE EVALUACIÓN ACTIVO
          </span>

          <h2>
            {periodoActivo
              ? periodoActivo.nombre
              : "No hay un periodo abierto"}
          </h2>

          <p>
            {periodoActivo
              ? `${mostrarFecha(periodoActivo.fechaInicio)} – ` +
                mostrarFecha(periodoActivo.fechaFin)
              : "Abre un periodo programado para habilitar " +
                "las evaluaciones en esta demostración."}
          </p>
        </div>

        {periodoActivo && (
          <span className="pd-status pd-status-abierto">
            Abierto
          </span>
        )}
      </section>

      {/* AVISOS */}
      {aviso && (
        <div
          className={
            aviso.tipo === "error"
              ? "pd-alert pd-alert-error"
              : "pd-alert pd-alert-success"
          }
          role={aviso.tipo === "error" ? "alert" : "status"}
        >
          <CheckCircle2 size={18} />
          <span>{aviso.texto}</span>

          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setAviso(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* FORMULARIO */}
      {formAbierto && (
        <section className="pd-panel">
          <div className="pd-panel-heading">
            <div>
              <h2>
                {editandoId !== null
                  ? "Editar periodo académico"
                  : "Registrar periodo académico"}
              </h2>
              <p>
                Define el nombre y las fechas
                de evaluación.
              </p>
            </div>

            <button
              type="button"
              className="pd-icon-button"
              onClick={cerrarFormulario}
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={guardarPeriodo}>
            <div className="pd-form-grid">
              <label className="pd-field pd-field-full">
                <span>Nombre del periodo</span>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    actualizarCampo(
                      "nombre",
                      e.target.value
                    )
                  }
                  placeholder="Ej. Mayo – Agosto 2027"
                  required
                />
              </label>

              <label className="pd-field">
                <span>Fecha de inicio</span>
                <input
                  type="date"
                  value={formulario.fechaInicio}
                  onChange={(e) =>
                    actualizarCampo(
                      "fechaInicio",
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <label className="pd-field">
                <span>Fecha de cierre</span>
                <input
                  type="date"
                  min={formulario.fechaInicio || undefined}
                  value={formulario.fechaFin}
                  onChange={(e) =>
                    actualizarCampo(
                      "fechaFin",
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <label className="pd-field pd-field-full">
                <span>Descripción (opcional)</span>
                <textarea
                  rows={3}
                  value={formulario.descripcion}
                  onChange={(e) =>
                    actualizarCampo(
                      "descripcion",
                      e.target.value
                    )
                  }
                  placeholder="Describe el periodo..."
                />
              </label>
            </div>

            {error && (
              <p className="pd-form-error" role="alert">
                {error}
              </p>
            )}

            <div className="pd-form-actions">
              <button
                type="button"
                className="pd-secondary-button"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="pd-primary-button"
              >
                <Save size={17} />
                Guardar periodo
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TABLA DE PERIODOS */}
      <section className="pd-panel">
        <div className="pd-panel-heading">
          <div>
            <h2>Historial de periodos</h2>
            <p>
              Consulta, programa, abre o cierra
              los periodos académicos.
            </p>
          </div>
        </div>

        <div className="pd-filters">
          <label className="pd-search">
            <Search size={18} />
            <input
              type="search"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar periodo..."
              aria-label="Buscar periodos"
            />
          </label>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="abierto">Abiertos</option>
            <option value="programado">Programados</option>
            <option value="cerrado">Cerrados</option>
          </select>
        </div>

        <div className="pd-table-scroll">
          <table className="pd-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Fecha de inicio</th>
                <th>Fecha de cierre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {periodosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pd-empty">
                    No se encontraron periodos.
                  </td>
                </tr>
              ) : (
                periodosFiltrados.map((periodo) => (
                  <tr key={periodo.id}>
                    <td>
                      <div className="pd-period-cell">
                        <strong>{periodo.nombre}</strong>
                        <small>
                          {periodo.descripcion ||
                            "Sin descripción"}
                        </small>
                      </div>
                    </td>

                    <td>
                      {mostrarFecha(periodo.fechaInicio)}
                    </td>

                    <td>
                      {mostrarFecha(periodo.fechaFin)}
                    </td>

                    <td>
                      <span
                        className={
                          `pd-status pd-status-${periodo.estado}`
                        }
                      >
                        {etiquetasEstado[periodo.estado]}
                      </span>
                    </td>

                    <td>
                      <div className="pd-actions">
                        {periodo.estado === "programado" && (
                          <>
                            <button
                              type="button"
                              className="pd-table-button"
                              onClick={() =>
                                abrirEditar(periodo)
                              }
                            >
                              <Pencil size={15} />
                              Editar
                            </button>

                            <button
                              type="button"
                              className="pd-table-button pd-open"
                              onClick={() =>
                                abrirEvaluaciones(periodo)
                              }
                            >
                              <Play size={15} />
                              Abrir
                            </button>
                          </>
                        )}

                        {periodo.estado === "abierto" && (
                          <button
                            type="button"
                            className="pd-table-button pd-close"
                            onClick={() =>
                              cerrarEvaluaciones(periodo)
                            }
                          >
                            <LockKeyhole size={15} />
                            Cerrar
                          </button>
                        )}

                        {periodo.estado === "cerrado" && (
                          <span className="pd-history-label">
                            Histórico
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="pd-footer">
          Mostrando {periodosFiltrados.length} de{" "}
          {periodos.length} periodos.
        </p>
      </section>
    </div>
  );
}
