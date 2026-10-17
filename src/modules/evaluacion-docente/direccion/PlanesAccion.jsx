
import { useState } from "react";

import {
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  ListTodo,
  Plus,
  Search,
  Pencil,
  Save,
  X,
  CalendarDays,
  FileText,
  ShieldCheck
} from "lucide-react";

import {
  PERIODO_DIRECCION,
  REPORTES_DIRECCION,
  ESTADOS_PLAN_ACCION,
  PLANES_ACCION_DIRECCION
} from "../../data/direccionMock";

import "./PlanesAccion.css";

const formularioVacio = {
  reporteId: "",
  areaOportunidad: "",
  accion: "",
  responsable: "",
  fechaImplementacion: "",
  fechaSeguimiento: "",
  evidencia: "",
  observaciones: "",
  estado: "Pendiente"
};

function mostrarFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const [anio, mes, dia] = fecha.split("-").map(Number);

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(anio, mes - 1, dia));
}

function claseEstado(estado) {
  if (estado === "Completado") {
    return "pa-completado";
  }

  if (estado === "En proceso") {
    return "pa-proceso";
  }

  return "pa-pendiente";
}

export default function PlanesAccion() {
  const [planes, setPlanes] = useState(
    PLANES_ACCION_DIRECCION
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroDocente, setFiltroDocente] = useState("todos");

  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({
    ...formularioVacio
  });

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerReporte = (reporteId) =>
    REPORTES_DIRECCION.find(
      (reporte) => reporte.id === Number(reporteId)
    );

  const totalPendientes = planes.filter(
    (plan) => plan.estado === "Pendiente"
  ).length;

  const totalProceso = planes.filter(
    (plan) => plan.estado === "En proceso"
  ).length;

  const totalCompletados = planes.filter(
    (plan) => plan.estado === "Completado"
  ).length;

  const planesFiltrados = planes.filter((plan) => {
    const reporte = obtenerReporte(plan.reporteId);
    const texto = busqueda.trim().toLowerCase();

    const coincideBusqueda = [
      reporte?.docente || "",
      reporte?.carrera || "",
      plan.areaOportunidad,
      plan.accion,
      plan.responsable
    ].some((valor) =>
      valor.toLowerCase().includes(texto)
    );

    const coincideEstado =
      filtroEstado === "todos" ||
      plan.estado === filtroEstado;

    const coincideDocente =
      filtroDocente === "todos" ||
      Number(plan.reporteId) === Number(filtroDocente);

    return (
      coincideBusqueda &&
      coincideEstado &&
      coincideDocente
    );
  });

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor
    }));

    setError("");
  };

  const cambiarDocente = (reporteId) => {
    const reporte = obtenerReporte(reporteId);

    setFormulario((actual) => ({
      ...actual,
      reporteId,
      responsable: reporte?.docente || ""
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

  const abrirEditar = (plan) => {
    setFormulario({
      reporteId: String(plan.reporteId),
      areaOportunidad: plan.areaOportunidad,
      accion: plan.accion,
      responsable: plan.responsable,
      fechaImplementacion: plan.fechaImplementacion,
      fechaSeguimiento: plan.fechaSeguimiento,
      evidencia: plan.evidencia,
      observaciones: plan.observaciones,
      estado: plan.estado
    });

    setEditandoId(plan.id);
    setError("");
    setMensaje("");
    setFormAbierto(true);
  };

  const cerrarFormulario = () => {
    setFormAbierto(false);
    setEditandoId(null);
    setError("");
  };

  const guardarPlan = (e) => {
    e.preventDefault();

    const reporteId = Number(formulario.reporteId);
    const reporte = obtenerReporte(reporteId);

    const areaOportunidad =
      formulario.areaOportunidad.trim();

    const accion = formulario.accion.trim();
    const responsable = formulario.responsable.trim();
    const evidencia = formulario.evidencia.trim();
    const observaciones = formulario.observaciones.trim();

    if (
      !reporte ||
      !areaOportunidad ||
      !accion ||
      !responsable ||
      !formulario.fechaImplementacion ||
      !formulario.fechaSeguimiento
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    if (
      formulario.fechaSeguimiento <
      formulario.fechaImplementacion
    ) {
      setError(
        "La fecha de seguimiento no puede ser " +
        "anterior a la fecha de implementación."
      );
      return;
    }

    if (
      formulario.estado === "Completado" &&
      !evidencia
    ) {
      setError(
        "Para completar un plan debes registrar " +
        "la evidencia de cumplimiento."
      );
      return;
    }

    const duplicado = planes.some(
      (plan) =>
        plan.id !== editandoId &&
        plan.reporteId === reporteId &&
        plan.areaOportunidad.toLowerCase() ===
          areaOportunidad.toLowerCase()
    );

    if (duplicado) {
      setError(
        "Ya existe un plan para esta área de " +
        "oportunidad del docente."
      );
      return;
    }

    const datos = {
      reporteId,
      periodo: PERIODO_DIRECCION,
      areaOportunidad,
      accion,
      responsable,
      fechaImplementacion: formulario.fechaImplementacion,
      fechaSeguimiento: formulario.fechaSeguimiento,
      evidencia,
      observaciones,
      estado: formulario.estado
    };

    if (editandoId !== null) {
      setPlanes((actuales) =>
        actuales.map((plan) =>
          plan.id === editandoId
            ? { ...plan, ...datos }
            : plan
        )
      );

      setMensaje(
        "Plan de acción actualizado en la demostración."
      );
    } else {
      const nuevoId =
        Math.max(0, ...planes.map((plan) => plan.id)) + 1;

      setPlanes((actuales) => [
        ...actuales,
        { id: nuevoId, ...datos }
      ]);

      setMensaje(
        "Plan de acción registrado en la demostración."
      );
    }

    cerrarFormulario();
  };

  return (
    <div className="pa-page">

      {/* ENCABEZADO */}
      <div className="pa-heading">
        <div>
          <h1>Planes de acción</h1>
          <p>
            Registra acciones de mejora y da seguimiento
            a los compromisos del personal docente.
          </p>
        </div>

        <button
          type="button"
          className="pa-primary-button"
          onClick={abrirNuevo}
        >
          <Plus size={18} />
          Nuevo plan
        </button>
      </div>

      <div className="pa-periodo">
        <CalendarDays size={17} />
        Periodo: {PERIODO_DIRECCION}
      </div>

      <p className="pa-demo">
        Módulo de demostración. Los planes y cambios
        de estado son temporales y todavía no se
        guardan en la base de datos.
      </p>

      {/* INDICADORES */}
      <section className="pa-stats">
        {[
          {
            titulo: "Planes registrados",
            valor: planes.length,
            icono: ClipboardCheck
          },
          {
            titulo: "Pendientes",
            valor: totalPendientes,
            icono: Clock3
          },
          {
            titulo: "En proceso",
            valor: totalProceso,
            icono: ListTodo
          },
          {
            titulo: "Completados",
            valor: totalCompletados,
            icono: CheckCircle2
          }
        ].map((indicador) => {
          const Icono = indicador.icono;

          return (
            <article
              key={indicador.titulo}
              className="pa-stat"
            >
              <div className="pa-stat-icon">
                <Icono size={21} />
              </div>

              <span>{indicador.titulo}</span>
              <strong>{indicador.valor}</strong>
            </article>
          );
        })}
      </section>

      {/* FORMULARIO */}
      {formAbierto && (
        <section className="pa-panel">
          <div className="pa-panel-heading">
            <div>
              <h2>
                {editandoId !== null
                  ? "Editar plan de acción"
                  : "Registrar plan de acción"}
              </h2>
              <p>
                Define el área de mejora, las acciones,
                los responsables y el seguimiento.
              </p>
            </div>

            <button
              type="button"
              className="pa-icon-button"
              aria-label="Cerrar formulario"
              onClick={cerrarFormulario}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={guardarPlan}>
            <div className="pa-form-grid">

              <label className="pa-field">
                <span>Docente *</span>
                <select
                  value={formulario.reporteId}
                  onChange={(e) =>
                    cambiarDocente(e.target.value)
                  }
                  required
                >
                  <option value="">
                    Selecciona un docente
                  </option>

                  {REPORTES_DIRECCION.map((reporte) => (
                    <option
                      key={reporte.id}
                      value={reporte.id}
                    >
                      {reporte.docente}
                    </option>
                  ))}
                </select>
              </label>

              <label className="pa-field">
                <span>Responsable *</span>
                <input
                  type="text"
                  value={formulario.responsable}
                  onChange={(e) =>
                    cambiarCampo(
                      "responsable",
                      e.target.value
                    )
                  }
                  placeholder="Nombre del responsable"
                  required
                />
              </label>

              <label className="pa-field pa-full">
                <span>Área de oportunidad *</span>
                <input
                  type="text"
                  value={formulario.areaOportunidad}
                  onChange={(e) =>
                    cambiarCampo(
                      "areaOportunidad",
                      e.target.value
                    )
                  }
                  placeholder="Ej. Retroalimentación de tareas"
                  required
                />
              </label>

              <label className="pa-field pa-full">
                <span>Acción de mejora *</span>
                <textarea
                  rows={4}
                  value={formulario.accion}
                  onChange={(e) =>
                    cambiarCampo("accion", e.target.value)
                  }
                  placeholder="Describe las actividades que deberán realizarse..."
                  required
                />
              </label>

              <label className="pa-field">
                <span>Fecha de implementación *</span>
                <input
                  type="date"
                  value={formulario.fechaImplementacion}
                  onChange={(e) =>
                    cambiarCampo(
                      "fechaImplementacion",
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <label className="pa-field">
                <span>Fecha de seguimiento *</span>
                <input
                  type="date"
                  min={
                    formulario.fechaImplementacion ||
                    undefined
                  }
                  value={formulario.fechaSeguimiento}
                  onChange={(e) =>
                    cambiarCampo(
                      "fechaSeguimiento",
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <label className="pa-field">
                <span>Estado del plan *</span>
                <select
                  value={formulario.estado}
                  onChange={(e) =>
                    cambiarCampo(
                      "estado",
                      e.target.value
                    )
                  }
                >
                  {ESTADOS_PLAN_ACCION.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </label>

              <label className="pa-field">
                <span>Evidencia de cumplimiento</span>
                <input
                  type="text"
                  value={formulario.evidencia}
                  onChange={(e) =>
                    cambiarCampo(
                      "evidencia",
                      e.target.value
                    )
                  }
                  placeholder="Ej. Planeación actualizada, acta, enlace..."
                />
              </label>

              <label className="pa-field pa-full">
                <span>Observaciones de seguimiento</span>
                <textarea
                  rows={3}
                  value={formulario.observaciones}
                  onChange={(e) =>
                    cambiarCampo(
                      "observaciones",
                      e.target.value
                    )
                  }
                  placeholder="Anota los avances y acuerdos..."
                />
              </label>

            </div>

            <p className="pa-helper">
              Los campos marcados con * son obligatorios.
              Para cambiar un plan a Completado, debes
              registrar una evidencia.
            </p>

            {error && (
              <p className="pa-error" role="alert">
                {error}
              </p>
            )}

            <div className="pa-form-actions">
              <button
                type="button"
                className="pa-secondary-button"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="pa-primary-button"
              >
                <Save size={17} />
                Guardar plan
              </button>
            </div>
          </form>
        </section>
      )}

      {/* LISTADO */}
      <section className="pa-panel">
        <div className="pa-panel-heading">
          <div>
            <h2>Seguimiento de planes</h2>
            <p>
              Consulta los compromisos de mejora
              registrados para los docentes.
            </p>
          </div>
        </div>

        {mensaje && (
          <p className="pa-success" role="status">
            {mensaje}
          </p>
        )}

        <div className="pa-filters">
          <label className="pa-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar docente, acción o área..."
              aria-label="Buscar planes"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
            />
          </label>

          <select
            value={filtroDocente}
            onChange={(e) =>
              setFiltroDocente(e.target.value)
            }
            aria-label="Filtrar por docente"
          >
            <option value="todos">
              Todos los docentes
            </option>

            {REPORTES_DIRECCION.map((reporte) => (
              <option
                key={reporte.id}
                value={reporte.id}
              >
                {reporte.docente}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            aria-label="Filtrar por estado"
          >
            <option value="todos">
              Todos los estados
            </option>

            {ESTADOS_PLAN_ACCION.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div className="pa-table-scroll">
          <table className="pa-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Área de oportunidad</th>
                <th>Responsable</th>
                <th>Implementación</th>
                <th>Seguimiento</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {planesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pa-empty">
                    No se encontraron planes de acción.
                  </td>
                </tr>
              ) : (
                planesFiltrados.map((plan) => {
                  const reporte = obtenerReporte(
                    plan.reporteId
                  );

                  return (
                    <tr key={plan.id}>
                      <td>
                        <strong>
                          {reporte?.docente || "Sin docente"}
                        </strong>
                        <small>
                          {reporte?.carrera || ""}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {plan.areaOportunidad}
                        </strong>
                        <small className="pa-action-preview">
                          {plan.accion}
                        </small>
                      </td>

                      <td>{plan.responsable}</td>

                      <td>
                        {mostrarFecha(
                          plan.fechaImplementacion
                        )}
                      </td>

                      <td>
                        {mostrarFecha(
                          plan.fechaSeguimiento
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            `pa-status ${claseEstado(plan.estado)}`
                          }
                        >
                          {plan.estado}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="pa-edit-button"
                          onClick={() => abrirEditar(plan)}
                        >
                          <Pencil size={16} />
                          {plan.estado === "Pendiente"
                            ? "Editar"
                            : "Seguimiento"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="pa-table-footer">
          Mostrando {planesFiltrados.length} de{" "}
          {planes.length} planes.
        </p>
      </section>

      {/* INFORMACIÓN DEL SEGUIMIENTO */}
      <section className="pa-info-panel">
        <FileText size={21} />

        <div>
          <h3>Control de evidencias y seguimiento</h3>
          <p>
            Para documentar los avances, abre un plan
            mediante el botón Editar o Seguimiento.
            Podrás actualizar su estado, registrar
            la evidencia y añadir observaciones.
          </p>
        </div>
      </section>

      <div className="pa-privacy">
        <ShieldCheck size={19} />
        <p>
          Los planes de acción forman parte del
          seguimiento académico. En la versión final,
          los cambios deberán quedar registrados con
          fecha y usuario responsable en la base de datos.
        </p>
      </div>

    </div>
  );
}
