import { Clock3 } from "lucide-react";
import { date } from "../../../shared/api";
export default function Timeline({ app }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Historial del trámite</h2>
        <Clock3 size={18} />
      </div>
      <ol className="timeline">
        {app.events.map((e) => (
          <li key={e.id}>
            <span className="timeline-dot" />
            <div>
              <h3>{e.action}</h3>
              {e.note && <p>{e.note}</p>}
              <time>{date(e.created_at, true)}</time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
