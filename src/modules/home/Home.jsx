import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../app/Auth";
import { MODULES, homeShortcuts } from "../../../shared/navigation";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="container private-home">
      <header className="home-heading">
        <h1>Inicio</h1>
        <p>
          Hola, {user.name.split(" ")[0]}. Selecciona el servicio que necesitas.
        </p>
      </header>
      <div className="home-workspace">
        <section className="home-modules" aria-labelledby="modules-title">
          <h2 id="modules-title">Servicios disponibles</h2>
          {MODULES.filter((m) => m.roles.includes(user.role)).map((m) => (
            <article className="module-launcher" key={m.id}>
              <div className="launcher-heading">
                <span className="launcher-icon">
                  <GraduationCap size={23} />
                </span>
                <span>{m.area}</span>
              </div>
              <h3>
                <Link to={m.path}>
                  {m.name}
                  <ArrowUpRight size={20} />
                </Link>
              </h3>
              <p>{m.description}</p>
              <Link to={m.path} className="button button-primary">
                {user.role === "estudiante"
                  ? "Abrir mi expediente"
                  : "Abrir solicitudes"}
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </section>
        <section className="home-shortcuts" aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title">Accesos directos</h2>
          <ul>
            {homeShortcuts(user.role).map((item) => (
              <li key={item.path}>
                <Link to={item.path}>
                  {item.label}
                  <ChevronRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
