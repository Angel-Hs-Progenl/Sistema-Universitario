import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  GraduationCap,
  Award,
  ClipboardCheck,
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
          Hola, {user.display_name || user.name.split(" ")[0]}. Selecciona el
          servicio que necesitas.
        </p>
      </header>
      <div className="home-workspace">
        <section className="home-modules" aria-labelledby="modules-title">
          <h2 id="modules-title">Servicios disponibles</h2>
          {MODULES.filter((m) => m.roles.includes(user.role)).map((m) => (
            <article className="home-service" key={m.id}>
              <Link className="home-service-link" to={m.path}>
                <span className="launcher-icon" aria-hidden="true">
                  {m.id === "becas" ? (
                    <Award size={23} />
                  ) : m.id === "evaluacion-docente" ? (
                    <ClipboardCheck size={23} />
                  ) : (
                    <GraduationCap size={23} />
                  )}
                </span>
                <div>
                  <span className="home-service-area">{m.area}</span>
                  <h3>{m.name}</h3>
                  <p>{m.description}</p>
                  <span className="text-link">
                    {m.actions[user.role] || m.actions.default}
                  </span>
                </div>
                <ArrowUpRight size={20} aria-hidden="true" />
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
