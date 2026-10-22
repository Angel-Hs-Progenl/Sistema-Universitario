
import { NavLink, Outlet } from "react-router-dom";
import "./LayoutDocente.css";

// Opciones de navegación del docente
const opciones = [
  {
    nombre: "Dashboard",
    ruta: "/evaluacion-docente/docente",
    exacta: true,
  },
  {
    nombre: "Mis resultados",
    ruta: "/evaluacion-docente/docente/resultados",
  },
  {
    nombre: "Comentarios",
    ruta: "/evaluacion-docente/docente/comentarios",
  },
  {
    nombre: "Mi reporte",
    ruta: "/evaluacion-docente/docente/reporte",
  },
  {
    nombre: "Mi perfil",
    ruta: "/evaluacion-docente/docente/perfil",
  },
  {
    nombre: "Ayuda",
    ruta: "/evaluacion-docente/docente/ayuda",
  },
];

export default function LayoutDocente() {
  return (
    <div className="container module-layout evaluacion-docente-layout">

      {/* ENCABEZADO COMO GESTIÓN DE BECAS */}
      <header className="module-header">
        <div className="module-identity">
          <span>03 /</span>
          <strong>Evaluación Docente</strong>
        </div>

        <nav
          className="module-nav"
          aria-label="Navegación del docente"
        >
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              end={opcion.exacta ?? false}
            >
              {opcion.nombre}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* CONTENIDO DE LA PÁGINA SELECCIONADA */}
      <section className="module-content docente-contenido">
        <Outlet />
      </section>

    </div>
  );
}
