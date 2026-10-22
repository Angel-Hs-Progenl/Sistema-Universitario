import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../app/Auth";

export default function BecasLayout() {
  const { user } = useAuth();
  const isStudent = user.role === "estudiante";

  const studentLinks = [
    ["/becas", "Convocatorias"],
    ["/becas/solicitudes", "Mis solicitudes"],
    ["/becas/socioeconomico", "Estudio socioeconómico"],
    ["/becas/renovacion", "Renovación"],
  ];

  const staffLinks = [
    ["/becas", "Catálogo"],
    ["/becas/admin-convocatorias", "Convocatorias y reglas"],
    ["/becas/dictamen", "Dictaminación y reglas"],
    ["/becas/ordenes-cobro", "Órdenes de cobro"],
    ["/becas/dashboard", "Tablero y auditoría"],
  ];

  const links = isStudent ? studentLinks : staffLinks;

  return (
    <div className="container module-layout">
      <header className="module-header">
        <div className="module-identity">
          <span>02 /</span>
          <strong>Gestión de becas</strong>
        </div>
        <nav className="module-nav" aria-label="Gestión de becas">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end>
              {label}
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
