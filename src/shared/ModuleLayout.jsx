import { NavLink, Outlet } from "react-router-dom";
export default function ModuleLayout({ number, title, links }) {
  return (
    <div className="container module-layout service-work">
      <header className="module-header">
        <div className="module-identity">
          <span>{number} /</span>
          <strong>{title}</strong>
        </div>
        <nav className="module-nav" aria-label={title}>
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
