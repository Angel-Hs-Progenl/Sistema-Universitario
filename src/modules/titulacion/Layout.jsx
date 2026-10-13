import { NavLink, Outlet, Link } from "react-router-dom";
import {
  GraduationCap,
  LayoutList,
  Files,
  Route,
  UserRound,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../app/Auth";
export default function TitleLayout() {
  const { user } = useAuth();
  const student = user.role === "estudiante";
  return (
    <div className="container module-layout">
      <aside className="module-sidebar">
        <Link to="/" className="back-home">
          <ArrowLeft size={14} /> Todos los servicios
        </Link>
        <div className="module-name">
          <GraduationCap size={26} />
          <strong>
            Titulación
            <br />
            electrónica
          </strong>
        </div>
        <nav aria-label="Titulación">
          {(student
            ? [
                ["/titulacion", "Mi solicitud", LayoutList],
                ["/titulacion/perfil", "Mi perfil", UserRound],
                ["/titulacion/documentos", "Mis documentos", Files],
                ["/titulacion/seguimiento", "Seguimiento", Route],
              ]
            : [["/titulacion", "Solicitudes", LayoutList]]
          ).map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/notificaciones">
            <Bell size={18} />
            Notificaciones
          </NavLink>
        </nav>
        <div className="sidebar-help">
          <strong>Estamos para ayudarte</strong>
          <p>Consulta los requisitos y las preguntas frecuentes.</p>
          <Link to="/ayuda">Centro de ayuda ↗</Link>
        </div>
      </aside>
      <section className="module-content">
        <Outlet />
      </section>
    </div>
  );
}
