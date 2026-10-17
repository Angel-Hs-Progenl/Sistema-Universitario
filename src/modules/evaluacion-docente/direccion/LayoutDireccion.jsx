
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import {
  LayoutDashboard,
  UsersRound,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
  ChartNoAxesCombined,
  FileCheck2,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell
} from "lucide-react";

import "./LayoutDireccion.css";

// Opciones del menú de Dirección Académica
const opciones = [
  {
    nombre: "Dashboard",
    ruta: "/evaluacion-docente/direccion",
    icono: LayoutDashboard,
    exacta: true
  },
  {
    nombre: "Docentes",
    ruta: "/evaluacion-docente/direccion/docentes",
    icono: UsersRound
  },
  {
    nombre: "Estudiantes",
    ruta: "/evaluacion-docente/direccion/estudiantes",
    icono: GraduationCap
  },
  {
    nombre: "Grupos y asignaturas",
    ruta: "/evaluacion-docente/direccion/grupos",
    icono: BookOpen
  },
  {
    nombre: "Periodos académicos",
    ruta: "/evaluacion-docente/direccion/periodos",
    icono: CalendarDays
  },
  {
    nombre: "Cuestionarios",
    ruta: "/evaluacion-docente/direccion/cuestionarios",
    icono: ClipboardList
  },
  {
    nombre: "Resultados",
    ruta: "/evaluacion-docente/direccion/resultados",
    icono: ChartNoAxesCombined
  },
  {
    nombre: "Reportes",
    ruta: "/evaluacion-docente/direccion/reportes",
    icono: FileCheck2
  },
  {
    nombre: "Planes de acción",
    ruta: "/evaluacion-docente/direccion/planes-accion",
    icono: ClipboardCheck
  }
];

export default function LayoutDireccion() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navigate = useNavigate();

  // Regresar al Sistema Universitario sin cerrar sesión
  const volverAlPortal = () => {
    setMenuAbierto(false);
    navigate("/");
  };

  return (
    <div className="dir-layout">

      {/* BOTÓN DE MENÚ PARA CELULARES */}
      <button
        className="dir-mobile-toggle"
        type="button"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label={
          menuAbierto ? "Cerrar menú" : "Abrir menú"
        }
        aria-expanded={menuAbierto}
      >
        {menuAbierto ? (
          <X size={23} />
        ) : (
          <Menu size={23} />
        )}
      </button>

      {/* FONDO OSCURO EN CELULARES */}
      {menuAbierto && (
        <button
          className="dir-overlay"
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* MENÚ LATERAL */}
      <aside
        className={`dir-sidebar ${
          menuAbierto ? "abierto" : ""
        }`}
      >
        <div className="dir-brand">
          <div className="dir-logo">
            <GraduationCap size={24} />
          </div>

          <div className="dir-brand-info">
            <strong>Evaluación Docente</strong>
            <small>Dirección Académica</small>
          </div>
        </div>

        <div className="dir-nav-label">
          MENÚ PRINCIPAL
        </div>

        {/* NAVEGACIÓN */}
        <nav
          className="dir-nav"
          aria-label="Menú de Dirección Académica"
        >
          {opciones.map((opcion) => {
            const Icono = opcion.icono;

            return (
              <NavLink
                key={opcion.ruta}
                to={opcion.ruta}
                end={opcion.exacta}
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) =>
                  `dir-link ${isActive ? "activo" : ""}`
                }
              >
                <Icono
                  size={19}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>{opcion.nombre}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* PARTE INFERIOR DEL MENÚ */}
        <div className="dir-sidebar-bottom">
          <div className="dir-sidebar-role">
            <ShieldCheck size={18} />
            <span>Administrador</span>
          </div>

          {/* VOLVER AL PORTAL */}
          <button
            className="dir-logout"
            type="button"
            onClick={volverAlPortal}
          >
            <LogOut size={19} />
            Volver al portal
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="dir-main">

        {/* BARRA SUPERIOR */}
        <header className="dir-header">
          <div className="dir-header-title">
            <strong>
              Plataforma de Evaluación Docente
            </strong>

            <small>
              Universidad Tecnológica de Oriental
            </small>
          </div>

          <div className="dir-header-actions">
            <span className="dir-header-role">
              Dirección Académica
            </span>

            <div
              className="dir-header-bell"
              title="Notificaciones (próximamente)"
              aria-label="Notificaciones no disponibles"
            >
              <Bell size={19} />
            </div>

            <div
              className="dir-avatar"
              aria-label="Administrador"
            >
              <ShieldCheck size={21} />
            </div>
          </div>
        </header>

        {/* PÁGINA SELECCIONADA */}
        <main className="dir-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
