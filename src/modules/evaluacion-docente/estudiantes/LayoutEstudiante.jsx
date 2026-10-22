
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CircleHelp, ArrowLeft } from "lucide-react";

import "./LayoutEstudiante.css";

const opciones = [
  {
    nombre: "Mis evaluaciones",
    ruta: "/evaluacion-docente/estudiante",
    exacta: true,
  },
  {
    nombre: "Historial de evaluaciones",
    ruta: "/evaluacion-docente/estudiante/mis-evaluaciones",
  },
  {
    nombre: "Mi perfil",
    ruta: "/evaluacion-docente/estudiante/perfil",
  },
];

export default function LayoutEstudiante() {
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="container module-layout evaluacion-estudiante">

      {/* ENCABEZADO COMO EL MÓDULO DE BECAS */}
      <header className="module-header">
        <div className="module-identity">
          <span>03 /</span>
          <strong>Evaluación Docente</strong>
        </div>

        <nav
          className="module-nav"
          aria-label="Navegación de estudiante"
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

      {/* ACCIONES DEL ESTUDIANTE */}
      <div className="estudiante-acciones">
        <span className="estudiante-rol">
          Portal de Estudiante
        </span>

        <div className="estudiante-acciones-botones">
          <button
            type="button"
            className="estudiante-accion"
            onClick={() => setMostrarAyuda(!mostrarAyuda)}
            aria-expanded={mostrarAyuda}
          >
            <CircleHelp size={17} />
            Ayuda
          </button>

          <button
            type="button"
            className="estudiante-accion"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={17} />
            Volver al portal
          </button>
        </div>
      </div>

      {mostrarAyuda && (
        <div className="estudiante-ayuda">
          Si tienes problemas para realizar una evaluación,
          comunícate con el área responsable de evaluación
          docente.
        </div>
      )}

      {/* CONTENIDO DE LAS PÁGINAS */}
      <section className="module-content estudiante-contenido">
        <Outlet />
      </section>
    </div>
  );
}
