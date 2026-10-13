import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  GraduationCap,
  CircleHelp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./Auth";
import { ROLES } from "../../shared/titulacion";
import { MODULES } from "../../shared/navigation";
import { Alert } from "../shared/ui";
import { Breadcrumbs } from "./Navigation";

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="UT de Oriental, inicio">
      <span className="brand-mark" aria-hidden="true">
        UT<span>O</span>
      </span>
      <span>
        <strong>UT de Oriental</strong>
        <small>Sistema universitario</small>
      </span>
    </Link>
  );
}
function AppNavigation({ role, onNavigate }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="app-navigation"
      onClick={onNavigate}
    >
      <span className="nav-group-label">Mi espacio</span>
      <NavLink to="/" end>
        <Home size={17} />
        Inicio
      </NavLink>
      <span className="nav-group-label">Servicios</span>
      {MODULES.filter((m) => m.roles.includes(role)).map((m) => (
        <NavLink key={m.id} to={m.path}>
          <GraduationCap size={18} />
          {m.name}
        </NavLink>
      ))}
      <span className="nav-group-label">Consulta</span>
      <NavLink to="/notificaciones">
        <Bell size={17} />
        Notificaciones
      </NavLink>
      <NavLink to="/ayuda">
        <CircleHelp size={17} />
        Ayuda y requisitos
      </NavLink>
    </nav>
  );
}
function NavigationDrawer({ role, onClose }) {
  const ref = useRef(null),
    previous = useRef(document.activeElement);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="navigation-drawer"
      aria-labelledby="navigation-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="drawer-heading">
        <h2 id="navigation-title">Navegación</h2>
        <button
          className="icon-button"
          aria-label="Cerrar menú"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <AppNavigation role={role} onNavigate={onClose} />
    </dialog>
  );
}
export default function Shell() {
  const { user, logout } = useAuth(),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(""),
    [exiting, setExiting] = useState(false),
    location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.getElementById("main")?.focus({ preventScroll: true });
    setError("");
  }, [location.pathname]);
  async function exit() {
    setExiting(true);
    try {
      await logout();
    } catch (e) {
      setError(e.message);
    } finally {
      setExiting(false);
    }
  }
  const footer = (
    <footer className="app-footer">
      <span>UT de Oriental · {new Date().getFullYear()}</span>
      <div>
        <Link to="/privacidad">Privacidad</Link>
        <Link to="/ayuda">Ayuda</Link>
      </div>
    </footer>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      {user ? (
        <div className="app-frame">
          <aside className="app-sidebar">
            <div className="sidebar-brand">
              <Brand />
            </div>
            <AppNavigation role={user.role} />
            <div className="sidebar-institution">
              <span>
                Universidad Tecnológica
                <br />
                de Oriental
              </span>
              <a
                href="https://utdeoriental.edu.mx/"
                target="_blank"
                rel="noreferrer"
              >
                Sitio institucional
                <ArrowUpRight size={13} />
              </a>
            </div>
          </aside>
          <div className="app-column">
            <header className="app-topbar">
              <button
                className="icon-button app-menu-toggle"
                aria-label="Abrir menú"
                aria-haspopup="dialog"
                aria-expanded={menu}
                onClick={() => setMenu(true)}
              >
                <Menu size={19} />
              </button>
              <Breadcrumbs />
              <div className="session-controls">
                <div className="session-person">
                  <span className="avatar" aria-hidden="true">
                    {user.name.at(0)}
                  </span>
                  <span>
                    <strong>{user.name.split(" ")[0]}</strong>
                    <small>{ROLES[user.role]}</small>
                  </span>
                </div>
                <button
                  className="icon-button"
                  aria-label="Cerrar sesión"
                  disabled={exiting}
                  onClick={exit}
                >
                  <LogOut size={17} />
                </button>
              </div>
            </header>
            <main
              id="main"
              tabIndex={-1}
              className="app-main"
              key={location.pathname}
            >
              <Alert>{error}</Alert>
              <Outlet />
            </main>
            {footer}
          </div>
          {menu && (
            <NavigationDrawer role={user.role} onClose={() => setMenu(false)} />
          )}
        </div>
      ) : (
        <div className="public-frame">
          <header className="public-header">
            <Brand />
            <a
              href="https://utdeoriental.edu.mx/"
              target="_blank"
              rel="noreferrer"
            >
              Sitio institucional
              <ArrowUpRight size={14} />
            </a>
          </header>
          <div className="public-breadcrumbs">
            <Breadcrumbs />
          </div>
          <main id="main" tabIndex={-1} key={location.pathname}>
            <Outlet />
          </main>
          {footer}
        </div>
      )}
    </>
  );
}
