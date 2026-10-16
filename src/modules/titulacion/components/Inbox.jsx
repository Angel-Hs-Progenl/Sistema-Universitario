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
      <section className="panel inbox-panel">
        <div className="inbox-toolbar">
          <div className="inbox-search">
            <label className="toolbar-label" htmlFor="case-search">
              Folio, nombre, matrícula o carrera
            </label>
            <div className="search-field">
              <Search size={18} />
              <input
                id="case-search"
                type="search"
                placeholder="Buscar expediente…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <label className="filter-field">
            <span className="toolbar-label">Estado de la solicitud</span>
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
        <div className="inbox-results">
          <p role="status" aria-atomic="true">
            Mostrando {filtered.length} de {data.length}{" "}
            {data.length === 1 ? "expediente" : "expedientes"}
          </p>
          {(query || status !== "todos") && (
            <button
              type="button"
              className="text-link clear-filters"
              onClick={() => {
                setQuery("");
                setStatus("todos");
                document.getElementById("case-search")?.focus();
              }}
            >
              Limpiar filtros
            </button>
          )}
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
                <th scope="col">Folio / Egresado</th>
                <th scope="col">Carrera</th>
                <th scope="col">Estado</th>
                <th scope="col">Actualización</th>
                <th scope="col">
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
          La consulta incluye hasta los 500 expedientes más recientes. Los
          filtros se aplican a esta lista.
        </div>
      </section>
    </>
  );
}
