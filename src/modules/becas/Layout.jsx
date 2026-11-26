import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../app/Auth";

export default function BecasLayout() {
  const { user } = useAuth();
  const role = user?.role || "estudiante";

  let links = [];

  if (role === "estudiante") {
    links = [
      ["/becas", "Convocatorias"],
      ["/becas/solicitudes", "Mis solicitudes"],
      ["/becas/socioeconomico", "Estudio socioeconómico"],
      ["/becas/renovacion", "Renovación"],
    ];
  } else if (role === "escolares") {
    links = [
      ["/becas", "Catálogo"],
      ["/becas/admin-convocatorias", "Convocatorias y reglas"],
      ["/becas/dashboard", "Padrón y estadísticas"],
    ];
  } else if (role === "evaluador") {
    links = [
      ["/becas", "Catálogo"],
      ["/becas/dictamen", "Panel de Dictaminación"],
      ["/becas/renovacion", "Resolución de Renovaciones"],
    ];
  } else if (role === "tesoreria") {
    links = [
      ["/becas/ordenes-cobro", "Órdenes de cobro y pagos"],
    ];
  } else if (role === "auditor") {
    links = [
      ["/becas/dashboard", "Tablero y auditoría"],
    ];
  } else {
    // administrador u otros roles directivos
    links = [
      ["/becas", "Catálogo"],
      ["/becas/admin-convocatorias", "Convocatorias y reglas"],
      ["/becas/dictamen", "Dictaminación"],
      ["/becas/ordenes-cobro", "Órdenes de cobro"],
      ["/becas/renovacion", "Renovaciones"],
      ["/becas/dashboard", "Tablero y auditoría"],
    ];
  }

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
