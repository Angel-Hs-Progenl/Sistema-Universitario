import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { date } from "../../../shared/api";
export default function Timeline({ app, limit }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{limit ? "Actividad reciente" : "Historial del trámite"}</h2>
        {limit ? (
          <Link className="text-link" to="/titulacion/seguimiento">
            Ver historial completo
          </Link>
        ) : (
          <Clock3 size={18} />
        )}
      </div>
      <ol className="timeline">
        {(limit ? app.events.slice(0, limit) : app.events).map((e) => (
          <li key={e.id}>
            <span className="timeline-dot" />
            <div>
              <h3>{e.action}</h3>
              {e.note && <p>{e.note}</p>}
              <time dateTime={e.created_at}>{date(e.created_at, true)}</time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
