import { Link } from "react-router-dom";
import { DOCUMENTS, EDITABLE } from "../../../../shared/titulacion";

export default function StudentTasks({ app }) {
  const missing = DOCUMENTS.filter(
    (d) =>
      d.required &&
      !app.documents.some((x) => x.kind === d.id && x.status !== "rechazado"),
  );
  const fields = [
    "matricula",
    "curp",
    "carrera",
    "generacion",
    "telefono",
    "domicilio",
  ];
  const profileComplete =
    fields.every((k) => app.student.profile[k]?.trim()) &&
    app.student.name?.trim();
  const editable = EDITABLE.includes(app.status);
  return (
    <section className="student-tasks" aria-labelledby="tasks-heading">
      <h2 id="tasks-heading">
        {editable ? "Preparación de la solicitud" : "Resumen del expediente"}
      </h2>
      <div className="task-row">
        <span>01</span>
        <div>
          <h3>
            <Link to="/titulacion/perfil">Revisar datos del egresado</Link>
          </h3>
          <p>
            {editable
              ? "Comprueba que coincidan con tus documentos oficiales."
              : "Los datos enviados se conservan en tu expediente."}
          </p>
        </div>
        <small>{profileComplete ? "Datos registrados" : "Por completar"}</small>
      </div>
      <div className="task-row">
        <span>02</span>
        <div>
          <h3>
            <Link to="/titulacion/documentos">Integrar documentos</Link>
          </h3>
          <p>
            {missing.length
              ? `Pendientes: ${missing.map((d) => d.name).join(", ")}.`
              : "Los siete documentos obligatorios están adjuntos."}
          </p>
        </div>
        <small>{7 - missing.length} de 7 listos para enviar</small>
      </div>
      <div className="task-row">
        <span>03</span>
        <div>
          <h3>
            {editable
              ? "Revisar y enviar la solicitud"
              : "Consultar revisión y seguimiento"}
          </h3>
          <p>
            {editable
              ? "Usa la confirmación al final del resumen. Adjuntar un archivo no envía el expediente."
              : "Las observaciones de cada área aparecen en documentos y en el historial."}
          </p>
        </div>
        <small>
          {editable
            ? missing.length || !profileComplete
              ? "Preparación pendiente"
              : "Lista para revisar"
            : "Solicitud enviada"}
        </small>
      </div>
    </section>
  );
}
