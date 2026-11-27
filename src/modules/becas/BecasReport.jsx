import { createPortal } from "react-dom";
import { MODALIDADES } from "../../../shared/becas";
import letterhead from "./assets/membrete-uto.png";
import "./becas-report.css";

const number = (value) => Number(value || 0).toLocaleString("es-MX");

export default function BecasReport({ stats }) {
  if (!stats) return null;

  const generatedAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return createPortal(
    <article className="becas-report-sheet" aria-label="Resumen interno de actividad de becas">
      <img className="becas-report-membrete" src={letterhead} alt="" />
      <div className="becas-report-content">
        <div className="becas-report-heading">
          <p>Gestión de becas · Consulta interna</p>
          <h1>Resumen de actividad</h1>
          <span>Generado el {generatedAt}</span>
        </div>

        <section aria-labelledby="becas-report-status-title">
          <h2 id="becas-report-status-title">Estado de solicitudes</h2>
          <div className="becas-report-metrics">
            <div><strong>{number(stats.total_applications)}</strong><span>Solicitudes registradas</span></div>
            <div><strong>{number(stats.approved)}</strong><span>Aprobadas</span></div>
            <div><strong>{number(stats.in_review)}</strong><span>En revisión</span></div>
            <div><strong>{number(stats.received)}</strong><span>Recibidas</span></div>
            <div><strong>{number(stats.rejected)}</strong><span>Rechazadas</span></div>
            <div><strong>{number(stats.approval_rate)}%</strong><span>Tasa de aprobación</span></div>
          </div>
        </section>

        <section aria-labelledby="becas-report-modalities-title">
          <h2 id="becas-report-modalities-title">Solicitudes por modalidad</h2>
          <table>
            <thead><tr><th scope="col">Modalidad</th><th scope="col">Solicitudes</th></tr></thead>
            <tbody>
              {MODALIDADES.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{number(stats.by_modality?.[item.id])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="becas-report-note">
          Resumen estadístico generado con los datos visibles para este rol. No contiene un padrón nominal,
          no acredita la asignación individual de una beca y no constituye una constancia oficial.
        </p>
      </div>
    </article>,
    document.body,
  );
}
