import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ArrowUpRight, Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "./Auth";
import { ROLES } from "../../shared/titulacion";
import { Alert } from "../shared/ui";
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="UT de Oriental, inicio">
      <span className="brand-mark" aria-hidden="true">
        UT<span>O</span>
      </span>
      <span>
        <strong>UT de Oriental</strong>
        <small>Universidad Tecnológica</small>
      </span>
    </Link>
  );
}
export default function Shell() {
  const { user, logout } = useAuth(),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(""),
    navigate = useNavigate(),
    location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [location.pathname]);
  async function exit() {
    try {
      await logout();
      navigate("/");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <div className="institution-bar">
        <div className="container">
          <span>Universidad Tecnológica de Oriental</span>
          <a
            href="https://utdeoriental.edu.mx/"
            target="_blank"
            rel="noreferrer"
          >
            Sitio institucional <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <nav
            aria-label="Navegación principal"
            className={menu ? "header-nav open" : "header-nav"}
            onClick={() => setMenu(false)}
          >
            <NavLink to="/" end>
              Servicios
            </NavLink>
            <NavLink to="/titulacion">Titulación</NavLink>
            <NavLink to="/ayuda">Ayuda</NavLink>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link
                  to="/notificaciones"
                  className="icon-button"
                  aria-label="Notificaciones"
                >
                  <Bell size={19} />
                </Link>
                <div className="user-info">
                  <strong>{user.name.split(" ")[0]}</strong>
                  <small>{ROLES[user.role]}</small>
                </div>
                <button
                  className="icon-button"
                  aria-label="Cerrar sesión"
                  onClick={exit}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link
                to="/acceso"
                className="button button-primary small"
                aria-label="Iniciar sesión"
              >
                <span className="login-label">Iniciar sesión</span>
                <span className="login-label-short" aria-hidden="true">
                  Acceder
                </span>{" "}
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} key={location.pathname}>
        <Alert>{error}</Alert>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>UT de Oriental</strong>
            <span>Servicios universitarios en línea</span>
          </div>
          <div>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/ayuda">Ayuda y contacto</Link>
            <span>Oriental, Puebla · {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
