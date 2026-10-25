import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Download, Upload, Check } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { useBreadcrumbEntity } from "../../app/Navigation";
import { api, date } from "../../shared/api";
import { Field, Modal, BusyButton, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
  Status,
  money,
} from "../../shared/Work";
import { DOCUMENTOS_BECA, ESTADOS_BECA } from "../../../shared/becas";

export function Applications({ review = false }) {
  const state = useAsync(() => api("/becas/solicitudes"), []);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const rows = (state.data || []).filter(
    (a) =>
      (!status || a.status === status) &&
      `${a.folio} ${a.call_title} ${review ? a.applicant.name : ""}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow={review ? "Becas / Revisión" : "Becas / Seguimiento"}
        title={review ? "Solicitudes para revisión" : "Mis solicitudes de beca"}
        action={
          !review && (
            <Link to="/becas" className="button button-primary">
              Consultar convocatorias <ArrowRight size={16} />
            </Link>
          )
        }
      >
        {review
          ? "Consulta la evidencia, revisa cada documento y registra el dictamen del expediente."
          : "Adjunta tus documentos y consulta las observaciones del área de becas."}
      </Heading>
      <div className="work-toolbar">
        <Field
          label={
            review
              ? "Buscar folio, estudiante o convocatoria"
              : "Buscar folio o convocatoria"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
        />
        <Field
          label="Estado de la solicitud"
          as="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_BECA).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Field>
      </div>
      <LoadState
        state={state}
        empty={
          review
            ? "No hay solicitudes por revisar"
            : "Aún no has registrado una solicitud"
        }
        action={
          !review && (
            <Link to="/becas" className="button button-primary">
              Ver convocatorias
            </Link>
          )
        }
      >
        <p role="status" className="work-help">
          {rows.length} solicitudes en esta vista.
        </p>
        {rows.length > 0 && (
          <div
            className="work-table"
            role="region"
            aria-label="Solicitudes de beca"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Expediente</th>
                  {review && <th>Estudiante</th>}
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th>
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.folio}</strong>
                      <small>{a.call_title}</small>
                    </td>
                    {review && (
                      <td>
                        {a.applicant.name}
                        <small>{a.academic_term}</small>
                      </td>
                    )}
                    <td>
                      <Status value={a.status}>{ESTADOS_BECA[a.status]}</Status>
                    </td>
                    <td>{date(a.created_at)}</td>
                    <td>
                      <Link
                        className="button button-secondary small"
                        to={`/becas/solicitud/${a.id}`}
                      >
                        {review ? "Revisar expediente" : "Abrir solicitud"}
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!rows.length && (
          <p>
            No hay coincidencias.{" "}
            <button
              className="text-link"
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
            >
              Limpiar filtros
            </button>
          </p>
        )}
      </LoadState>
    </>
  );
}

export function ScholarshipCase() {
  const { id } = useParams(),
    { user } = useAuth();
  const state = useAsync(() => api(`/becas/solicitudes/${id}`), [id]);
  const [dialog, setDialog] = useState(null);
  const mutation = useMutation();
  const a = state.data,
    student = user.role === "estudiante";
  useBreadcrumbEntity(a?.folio);
  const editable = a && ["recibida", "revision"].includes(a.status);
  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await mutation.run(
      async () => {
        if (dialog.type === "upload")
          await api(`/becas/solicitudes/${id}/documentos`, {
            method: "POST",
            body: form,
          });
        if (dialog.type === "review")
          await api(
            `/becas/solicitudes/${id}/documentos/${dialog.document.id}/revision`,
            {
              method: "POST",
              body: {
                status: form.get("status"),
                note: form.get("note"),
                version: a.version,
              },
            },
          );
        if (dialog.type === "decision")
          await api(`/becas/solicitudes/${id}/dictamen`, {
            method: "POST",
            body: {
              decision: form.get("decision"),
              committee_notes: form.get("note"),
              version: a.version,
            },
          });
        await state.refresh();
      },
      dialog.type === "upload"
        ? "Documento guardado para revisión."
        : "Revisión guardada.",
    );
    if (ok) setDialog(null);
  }
  const open = (data) => {
    mutation.clear();
    setDialog(data);
  };
  return (
    <>
      <Heading
        eyebrow="Becas / Expediente"
        title={a?.folio || "Solicitud de beca"}
        action={
          <Link
            className="button button-secondary"
            to={student ? "/becas/solicitudes" : "/becas/dictamen"}
          >
            Volver a solicitudes
          </Link>
        }
      >
        {a
          ? `${a.applicant.name} · ${a.call.title}`
          : "Consulta de la solicitud y sus documentos."}
      </Heading>
      {!dialog && <MutationState state={mutation} />}
      <LoadState state={state}>
        {a && (
          <>
            <dl className="work-summary">
              <div>
                <dt>Estado</dt>
                <dd>
                  <Status value={a.status}>{ESTADOS_BECA[a.status]}</Status>
                </dd>
              </div>
              <div>
                <dt>Promedio declarado</dt>
                <dd>{a.gpa}</dd>
              </div>
              <div>
                <dt>Apoyo de la convocatoria</dt>
                <dd>{money(a.call.amount)}</dd>
              </div>
            </dl>
            {a.committee_notes && (
              <p className="work-note">
                <strong>Observación del área de becas</strong>
                <br />
                {a.committee_notes}
              </p>
            )}
            <div className="work-split">
              <section>
                <div className="work-section">
                  <div className="work-actions">
                    <h2>Documentos para revisión</h2>
                    {student && editable && (
                      <button
                        className="button button-primary"
                        onClick={() => open({ type: "upload" })}
                      >
                        <Upload size={16} /> Adjuntar documento
                      </button>
                    )}
                  </div>
                  <p className="work-help">
                    PDF o JPG hasta 5 MB; PNG solo donde el formato esté
                    permitido. Un archivo recibido todavía requiere revisión.
                  </p>
                </div>
                <div className="work-records">
                  {DOCUMENTOS_BECA.map((d) => {
                    const doc = a.documents.find((x) => x.kind === d.id);
                    return (
                      <article className="work-record" key={d.id}>
                        <div>
                          <h3>{d.name}</h3>
                          <p>
                            {doc
                              ? doc.name
                              : d.required
                                ? "Pendiente de adjuntar"
                                : "Opcional"}
                          </p>
                          {doc && (
                            <Status value={doc.status}>
                              {doc.status === "rechazado"
                                ? "Requiere corrección"
                                : doc.status === "validado"
                                  ? "Validado"
                                  : "Recibido"}
                            </Status>
                          )}
                          {doc?.note && <p className="work-note">{doc.note}</p>}
                        </div>
                        {doc && (
                          <div className="work-actions">
                            <a
                              className="button button-secondary small"
                              href={`/api/v1/becas/solicitudes/${id}/documentos/${doc.id}`}
                            >
                              <Download size={15} /> Descargar
                            </a>
                            {!student && editable && (
                              <button
                                className="button button-secondary small"
                                onClick={() =>
                                  open({ type: "review", document: doc })
                                }
                              >
                                <Check size={15} /> Revisar
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                {!student && editable && (
                  <div className="work-section">
                    <button
                      className="button button-primary"
                      onClick={() => open({ type: "decision" })}
                    >
                      Registrar dictamen
                    </button>
                    <p className="work-help">
                      La aprobación requiere documentos validados, promedio
                      suficiente y cupo disponible.
                    </p>
                  </div>
                )}
              </section>
              <aside className="work-aside">
                <h2>Datos de la solicitud</h2>
                <dl className="work-meta">
                  <div>
                    <dt>Programa educativo</dt>
                    <dd>{a.major}</dd>
                  </div>
                  <div>
                    <dt>Periodo</dt>
                    <dd>{a.academic_term}</dd>
                  </div>
                  <div>
                    <dt>Fecha de registro</dt>
                    <dd>{date(a.created_at)}</dd>
                  </div>
                </dl>
                {a.socioeconomic && (
                  <section className="work-section">
                    <h2>Información socioeconómica</h2>
                    <dl className="work-meta">
                      <div>
                        <dt>Ingreso mensual declarado</dt>
                        <dd>{money(a.socioeconomic.monthly_income)}</dd>
                      </div>
                      <div>
                        <dt>Gasto mensual declarado</dt>
                        <dd>{money(a.socioeconomic.monthly_expenses)}</dd>
                      </div>
                      <div>
                        <dt>Integrantes dependientes</dt>
                        <dd>{a.socioeconomic.dependents_count}</dd>
                      </div>
                    </dl>
                  </section>
                )}
                {Object.entries(a.custom_answers).map(([q, answer]) => (
                  <section key={q} className="work-section">
                    <h3>{q}</h3>
                    <p>{answer}</p>
                  </section>
                ))}
                <p>
                  Solo el área autorizada puede consultar y revisar este
                  expediente.
                </p>
              </aside>
            </div>
          </>
        )}
      </LoadState>
      {dialog && (
        <Modal
          title={
            dialog.type === "upload"
              ? "Adjuntar documento"
              : dialog.type === "review"
                ? "Revisar documento"
                : "Registrar dictamen"
          }
          onClose={() => {
            if (!mutation.busy) setDialog(null);
          }}
        >
          <form onSubmit={save}>
            <MutationState state={mutation} />
            {dialog.type === "upload" ? (
              <>
                <Field as="select" name="kind" label="Documento" required>
                  <option value="">Selecciona un documento</option>
                  {DOCUMENTOS_BECA.filter(
                    (d) =>
                      a.documents.find((x) => x.kind === d.id)?.status !==
                      "validado",
                  ).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Field>
                <Field
                  name="file"
                  type="file"
                  label="Archivo"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  hint="El archivo se guarda al confirmar. Su contenido debe coincidir con el formato permitido."
                />
              </>
            ) : (
              <>
                {dialog.document && <p>{dialog.document.name}</p>}
                <Field
                  name={dialog.type === "review" ? "status" : "decision"}
                  as="select"
                  label="Resultado"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona un resultado
                  </option>
                  {dialog.type === "review" ? (
                    <>
                      <option value="validado">Documento válido</option>
                      <option value="rechazado">Requiere corrección</option>
                    </>
                  ) : (
                    <>
                      <option value="revision">
                        Solicitar revisión o corrección
                      </option>
                      <option value="aprobada">Aprobar solicitud</option>
                      <option value="rechazada">Rechazar solicitud</option>
                    </>
                  )}
                </Field>
                <Field
                  name="note"
                  label="Observación para el estudiante"
                  as="textarea"
                  minLength={3}
                  maxLength={2000}
                  required
                />
              </>
            )}
            <div className="work-actions">
              <BusyButton
                type="submit"
                className="button button-primary"
                busy={mutation.busy}
              >
                Guardar {dialog.type === "upload" ? "documento" : "revisión"}
              </BusyButton>
              <button
                type="button"
                className="button button-secondary"
                disabled={mutation.busy}
                onClick={() => setDialog(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
