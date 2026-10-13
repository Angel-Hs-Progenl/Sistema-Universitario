import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, Bell, LogOut, Menu, X } from "lucide-react";
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
      <NavLink to="/" end>
        Inicio
      </NavLink>
      {MODULES.filter((m) => m.roles.includes(role)).map((m) => (
        <NavLink key={m.id} to={m.path}>
          {m.shortName || m.name}
        </NavLink>
      ))}
      <NavLink to="/notificaciones">
        <Bell size={15} />
        Notificaciones
      </NavLink>
      <NavLink to="/ayuda">Requisitos y ayuda</NavLink>
    </nav>
  );
}
function NavigationDrawer({ user, onClose }) {
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
      <p className="drawer-account">
        {user.name} · {ROLES[user.role]}
      </p>
      <AppNavigation role={user.role} onNavigate={onClose} />
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
          <header className="workspace-header">
            <div className="workspace-header-inner">
              <Brand />
              <AppNavigation role={user.role} />
              <button
                className="icon-button app-menu-toggle"
                aria-label="Abrir menú"
                aria-haspopup="dialog"
                aria-expanded={menu}
                onClick={() => setMenu(true)}
              >
                <Menu size={19} />
              </button>
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
            </div>
          </header>
          <div className="app-column">
            <div className="workspace-context">
              <Breadcrumbs />
              <span className="workspace-context-label">
                Universidad Tecnológica de Oriental
              </span>
            </div>
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
            <NavigationDrawer user={user} onClose={() => setMenu(false)} />
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
