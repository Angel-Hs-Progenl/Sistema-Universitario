import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search, RefreshCw, ChevronRight } from "lucide-react";
import { date } from "../../../shared/api";
import { Alert, Badge, Empty } from "../../../shared/ui";
import { STATES, ROLES } from "../../../../shared/titulacion";
import PageHeading from "./PageHeading";
export default function Inbox({ data, error, refresh, role }) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("todos");
  const filtered = data.filter(
    (a) =>
      (status === "todos" || a.status === status) &&
      `${a.folio} ${a.student.name} ${a.student.profile.matricula} ${a.student.profile.carrera}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const open = data.filter(
      (a) => !["concluido", "cancelado"].includes(a.status),
    ),
    review = data.filter((a) => ["enviada", "revision"].includes(a.status));
  return (
    <>
      <PageHeading
        eyebrow={`${ROLES[role].toUpperCase()} · TITULACIÓN`}
        title={
          role === "tesoreria"
            ? "Comprobantes por revisar"
            : role === "vinculacion"
              ? "Liberaciones de egresados"
              : "Expedientes de titulación"
        }
        action={
          ["escolares", "administrador"].includes(role) && (
            <a
              className="button button-secondary"
              href="/api/v1/titulacion/reports/export"
            >
              <Download size={16} /> Exportar CSV
            </a>
          )
        }
      >
        {role === "tesoreria"
          ? "Consulta el comprobante de cada expediente y registra el dictamen de pago."
          : role === "vinculacion"
            ? "Consulta los expedientes disponibles para tu área y registra la liberación de estadías y seguimiento."
            : "Localiza un expediente, revisa sus documentos y registra el siguiente movimiento."}
      </PageHeading>
      <Alert>{error}</Alert>
      <div className="inbox-summary">
        <div>
          <strong>{open.length}</strong>
          <span>Trámites activos</span>
        </div>
        <div>
          <strong>{review.length}</strong>
          <span>Recibidos o en revisión</span>
        </div>
        <div>
          <strong>{data.filter((a) => a.status === "concluido").length}</strong>
          <span>Concluidos</span>
        </div>
      </div>
      <section className="panel inbox-panel">
        <div className="inbox-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar solicitudes"
              placeholder="Buscar folio, nombre o matrícula…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="filter-field">
            <span className="sr-only">Filtrar por estado</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="todos">Todos los estados</option>
              {Object.entries(STATES)
                .filter(([s]) => s !== "borrador")
                .map(([s, l]) => (
                  <option key={s} value={s}>
                    {l}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="icon-button"
            onClick={refresh}
            aria-label="Actualizar solicitudes"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <p className="table-hint">
          Desplaza la tabla para consultar todas las columnas.
        </p>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Solicitudes de titulación, tabla desplazable"
        >
          <table>
            <caption className="sr-only">
              Solicitudes de titulación electrónica
            </caption>
            <thead>
              <tr>
                <th>Folio / Egresado</th>
                <th>Carrera</th>
                <th>Estado</th>
                <th>Actualización</th>
                <th>
                  <span className="sr-only">Acción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link
                      className="table-folio"
                      to={`/titulacion/expediente/${a.id}`}
                    >
                      {a.folio}
                    </Link>
                    <strong className="table-name">{a.student.name}</strong>
                    <small>{a.student.profile.matricula}</small>
                  </td>
                  <td>{a.student.profile.carrera}</td>
                  <td>
                    <Badge status={a.status} />
                  </td>
                  <td>{date(a.updated_at)}</td>
                  <td>
                    <Link
                      className="icon-button"
                      to={`/titulacion/expediente/${a.id}`}
                      aria-label={`Abrir ${a.folio}`}
                    >
                      <ChevronRight size={19} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <Empty title="No hay solicitudes que mostrar">
            {query || status !== "todos"
              ? "Prueba con otra búsqueda o cambia el filtro."
              : "Las solicitudes aparecerán aquí cuando los estudiantes las envíen."}
          </Empty>
        )}
        <div className="table-footer">
          {filtered.length} solicitudes · Consulta limitada a los 500
          expedientes más recientes.
        </div>
      </section>
    </>
  );
}
