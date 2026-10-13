import { NavLink, Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { ROLES } from "../../../shared/titulacion";
export default function TitleLayout() {
  const { user } = useAuth();
  return (
    <div className="container module-layout">
      <header className="module-header">
        <Link to="/" className="back-home">
          <ArrowLeft size={14} /> Servicios universitarios
        </Link>
        <div className="module-title">
          <span>Titulación electrónica</span>
          <span>{ROLES[user.role]}</span>
        </div>
        <nav className="module-nav" aria-label="Titulación">
          {(user.role === "estudiante"
            ? [
                ["/titulacion", "Resumen"],
                ["/titulacion/perfil", "Datos del egresado"],
                ["/titulacion/documentos", "Documentos"],
                ["/titulacion/seguimiento", "Historial"],
              ]
            : [["/titulacion", "Solicitudes"]]
          ).map(([to, label]) => (
            <NavLink key={to} to={to} end>
              {label}
            </NavLink>
          ))}
          <Link to="/ayuda">Requisitos y ayuda</Link>
        </nav>
      </header>
      <section className="module-content">
        <Outlet />
      </section>
    </div>
  );
}
