import { NavLink, Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/Auth";
export default function TitleLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (
    user.role !== "estudiante" &&
    [
      "/titulacion/perfil",
      "/titulacion/documentos",
      "/titulacion/seguimiento",
    ].includes(pathname.replace(/\/$/, ""))
  )
    return <Navigate to="/titulacion" replace />;
  return (
    <div className="container module-layout">
      <header className="module-header">
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
