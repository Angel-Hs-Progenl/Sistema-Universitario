
import { NavLink, Outlet } from "react-router-dom";
import "./LayoutDireccion.css";

const opciones = [
  {
    nombre: "Dashboard",
    ruta: "/evaluacion-docente/direccion",
    exacta: true
  },
  {
    nombre: "Docentes",
    ruta: "/evaluacion-docente/direccion/docentes"
  },
  {
    nombre: "Estudiantes",
    ruta: "/evaluacion-docente/direccion/estudiantes"
  },
  {
    nombre: "Grupos y asignaturas",
    ruta: "/evaluacion-docente/direccion/grupos"
  },
  {
    nombre: "Periodos académicos",
    ruta: "/evaluacion-docente/direccion/periodos"
  },
  {
    nombre: "Cuestionarios",
    ruta: "/evaluacion-docente/direccion/cuestionarios"
  },
  {
    nombre: "Resultados",
    ruta: "/evaluacion-docente/direccion/resultados"
  },
  {
    nombre: "Reportes",
    ruta: "/evaluacion-docente/direccion/reportes"
  },
  {
    nombre: "Planes de acción",
    ruta: "/evaluacion-docente/direccion/planes-accion"
  }
];

export default function LayoutDireccion() {
  return (
    <div className="container module-layout evaluacion-direccion">

      <header className="module-header">
        <div className="module-identity">
          <span>03 /</span>
          <strong>Evaluación Docente</strong>
        </div>

        <nav
          className="module-nav"
          aria-label="Menú de Dirección Académica"
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

      <section className="module-content">
        <Outlet />
      </section>
    </div>
  );
}
