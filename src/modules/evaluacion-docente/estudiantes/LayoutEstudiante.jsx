
import { useState, useEffect } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  Menu,
  X,
  GraduationCap,
  ClipboardList,
  History,
  UserRound,
  CircleHelp,
  LogOut,
} from "lucide-react";

import "./LayoutEstudiante.css";

function LayoutEstudiante() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar el menú al cambiar de página
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

 const volverAlPortal = () => {
  setMenuAbierto(false);
  navigate("/");
};

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <div className="layout-estudiante">

      {/* ENCABEZADO PARA CELULARES */}
      <header className="layout-mobile-header">
        <button
          type="button"
          className="layout-menu-toggle"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          aria-controls="menu-estudiante"
        >
          {menuAbierto ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="layout-mobile-brand">
          <span className="layout-mobile-logo">
            <GraduationCap size={22} />
          </span>
          <strong>UTO</strong>
        </div>
      </header>

      {/* FONDO OSCURO AL ABRIR EL MENÚ */}
      {menuAbierto && (
        <button
          type="button"
          className="layout-overlay"
          onClick={cerrarMenu}
          aria-label="Cerrar menú"
        />
      )}

      {/* MENÚ LATERAL */}
      <aside
        id="menu-estudiante"
        className={`layout-sidebar ${
          menuAbierto ? "menu-abierto" : ""
        }`}
      >
        {/* LOGOTIPO */}
        <div className="layout-brand">
          <span className="layout-logo">
            <GraduationCap size={23} />
          </span>

          <strong>UTO</strong>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="layout-nav">

          <NavLink
to="/evaluacion-docente/estudiante"            end
            onClick={cerrarMenu}
            className={({ isActive }) =>
              `layout-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <ClipboardList size={20} />
            <span>Mis evaluaciones</span>
          </NavLink>

          <NavLink
to="/evaluacion-docente/estudiante/mis-evaluaciones"            onClick={cerrarMenu}
            className={({ isActive }) =>
              `layout-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <History size={20} />
            <span>Historial de evaluaciones</span>
          </NavLink>

          <NavLink
to="/evaluacion-docente/estudiante/perfil"            onClick={cerrarMenu}
            className={({ isActive }) =>
              `layout-nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <UserRound size={20} />
            <span>Mi perfil</span>
          </NavLink>

          <button
            type="button"
            className="layout-nav-item"
            onClick={() => setMostrarAyuda(!mostrarAyuda)}
            aria-expanded={mostrarAyuda}
          >
            <CircleHelp size={20} />
            <span>Ayuda</span>
          </button>

          {mostrarAyuda && (
            <div className="layout-help">
              Si tienes problemas para realizar una
              evaluación, comunícate con el área
              responsable de evaluación docente.
            </div>
          )}

        </nav>

        {/* CERRAR SESIÓN */}
       
{/* VOLVER AL PORTAL UNIVERSITARIO */}
<button
  type="button"
  className="layout-logout"
  onClick={volverAlPortal}
>
  <LogOut size={20} />
  <span>Volver al portal</span>
</button>


      </aside>

      {/* CONTENIDO QUE CAMBIA ENTRE PÁGINAS */}
      <main className="layout-contenido">
        <Outlet />
      </main>

    </div>
  );
}

export default LayoutEstudiante;
