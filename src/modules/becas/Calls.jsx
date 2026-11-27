import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "../../app/Auth";
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
import { MODALIDADES, DOCUMENTOS_BECA } from "../../../shared/becas";
import FormularioSolicitudUTO from "./FormularioSolicitudUTO";

export default function Calls() {
  const { user } = useAuth();
  const state = useAsync(() => api("/becas/convocatorias"), []);
  const [search, setSearch] = useState(""),
    [modality, setModality] = useState(""),
    [selected, setSelected] = useState(null),
    [applying, setApplying] = useState(null),
    [createdApp, setCreatedApp] = useState(null),
    [viewingResults, setViewingResults] = useState(null);
  const mutation = useMutation();
  const rows = (state.data || []).filter(
    (c) =>
      (!modality || c.modalidad === modality) &&
      `${c.title} ${c.code} ${c.description}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  async function apply(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const answers = Object.fromEntries(
      (applying.custom_questions || []).map((q, i) => [
        q,
        form.get(`question-${i}`),
      ]),
    );
    const ok = await mutation.run(async () => {
      await api("/becas/solicitudes", {
        method: "POST",
        body: {
          call_id: applying.id,
          gpa: Number(form.get("gpa")),
          academic_term: form.get("academic_term"),
          major: form.get("major"),
          custom_answers: answers,
        },
      });
    }, "Solicitud registrada. Consulta el folio y adjunta tus documentos en Mis solicitudes.");
    if (ok) setApplying(null);
  }
  return (
    <>
      <Heading
        eyebrow="Becas / Convocatorias"
        title="Convocatorias de beca"
        action={
          user.role === "estudiante" && (
            <Link to="/becas/solicitudes" className="button button-secondary">
              Mis solicitudes <ArrowRight size={16} />
            </Link>
          )
        }
      >
        Consulta las bases, el periodo de recepción y la documentación antes de
        solicitar un apoyo.
      </Heading>
      {!applying && <MutationState state={mutation} />}
      <div className="work-split">
        <div>
          <div className="work-toolbar">
            <Field
              label="Buscar convocatoria"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o código"
            />
            <Field
              label="Modalidad"
              as="select"
              value={modality}
              onChange={(e) => setModality(e.target.value)}
            >
              <option value="">Todas las modalidades</option>
              {MODALIDADES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Field>
          </div>
          <LoadState state={state} empty="No hay convocatorias registradas">
            <p className="work-help" role="status">
              {rows.length} convocatorias
              {search || modality
                ? " coinciden con los filtros"
                : " registradas"}
              .
            </p>
            {!rows.length && (
              <p>
                Prueba otro nombre o modalidad.{" "}
                <button
                  className="text-link"
                  onClick={() => {
                    setSearch("");
                    setModality("");
                  }}
                >
                  Limpiar filtros
                </button>
              </p>
            )}
            <div className="work-records">
              {rows.map((c) => (
                <article className="work-record" key={c.id}>
                  <div>
                    <span className="record-code">
                      {c.code} ·{" "}
                      {MODALIDADES.find((m) => m.id === c.modalidad)?.name}
                    </span>
                    <h2>{c.title}</h2>
                    <p>{c.description}</p>
                    <Status value={c.accepting ? "publicado" : "pendiente"}>
                      {c.accepting
                        ? "Recibe solicitudes"
                        : "Fuera del periodo de recepción"}
                    </Status>
                    <dl className="work-meta">
                      <div>
                        <dt>Apoyo por convocatoria</dt>
                        <dd>{money(c.amount)}</dd>
                      </div>
                      <div>
                        <dt>Promedio mínimo</dt>
                        <dd>{Number(c.min_gpa).toFixed(1)}</dd>
                      </div>
                      <div>
                        <dt>Cierre</dt>
                        <dd>{date(c.end_date)}</dd>
                      </div>
                    </dl>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      className="button button-secondary"
                      onClick={() => setSelected(c)}
                    >
                      Consultar bases <ArrowRight size={16} />
                    </button>
                    {c.results_published && (
                      <button
                        className="button button-primary"
                        style={{ fontSize: "0.8125rem" }}
                        onClick={() => setViewingResults(c)}
                      >
                        Ver resultados oficiales
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </LoadState>
        </div>
        <aside className="work-aside">
          <h2>Antes de solicitar</h2>
          <ol>
            <li>Lee las bases y verifica el periodo de recepción.</li>
            <li>Guarda tu información socioeconómica.</li>
            <li>Registra una solicitud y adjunta sus documentos.</li>
          </ol>
          <p>
            El registro queda sujeto a revisión y al cupo de la convocatoria.
          </p>
          {user.role === "estudiante" && (
            <Link className="text-link" to="/becas/socioeconomico">
              Revisar mi estudio socioeconómico <ArrowRight size={15} />
            </Link>
          )}
        </aside>
      </div>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <p className="work-help">{selected.code}</p>
          <p>{selected.description}</p>
          <dl className="work-meta">
            <div>
              <dt>Apertura</dt>
              <dd>{date(selected.start_date)}</dd>
            </div>
            <div>
              <dt>Cierre</dt>
              <dd>{date(selected.end_date)}</dd>
            </div>
            <div>
              <dt>Apoyo</dt>
              <dd>{money(selected.amount)}</dd>
            </div>
            <div>
              <dt>Cupo</dt>
              <dd>{selected.slots} apoyos</dd>
            </div>
            <div>
              <dt>Promedio mínimo</dt>
              <dd>{selected.min_gpa}</dd>
            </div>
          </dl>
          <section className="work-section">
            <h3>Documentos para revisión</h3>
            <ul>
              {DOCUMENTOS_BECA.filter((d) => d.required).map((d) => (
                <li key={d.id}>{d.name}</li>
              ))}
            </ul>
          </section>
          <div className="work-actions">
            <button
              className="button button-secondary"
              onClick={() => setSelected(null)}
            >
              Cerrar bases
            </button>
            {user.role === "estudiante" && (
              <button
                disabled={!selected.accepting}
                className="button button-primary"
                onClick={() => {
                  mutation.clear();
                  setApplying(selected);
                  setSelected(null);
                }}
              >
                Solicitar este apoyo
              </button>
            )}
          </div>
        </Modal>
      )}
      {applying && (
        <Modal
          title={`Solicitud Oficial: ${applying.title}`}
          onClose={() => setApplying(null)}
        >
          <FormularioSolicitudUTO
            call={applying}
            user={user}
            onSuccess={(app) => {
              setApplying(null);
              setCreatedApp(app);
              state.refresh();
            }}
            onCancel={() => setApplying(null)}
          />
        </Modal>
      )}
      {createdApp && (
        <Modal title="¡Solicitud Registrada Exitosamente!" onClose={() => setCreatedApp(null)}>
          <div style={{ textAlign: "center", padding: "16px" }}>
            <CheckCircle size={48} color="var(--green)" style={{ margin: "0 auto 12px auto" }} />
            <h3 style={{ margin: "0 0 6px 0", color: "var(--brand)" }}>Folio Oficial: {createdApp.folio}</h3>
            <p style={{ margin: "0 0 16px 0", color: "var(--muted)", fontSize: "0.875rem" }}>
              Tu solicitud y documentación han sido recibidas en el sistema institucional de la Universidad Tecnológica de Oriental.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <Link to="/becas/solicitudes" className="button button-primary">
                Ir al seguimiento de mis solicitudes
              </Link>
              <button type="button" className="button button-secondary" onClick={() => setCreatedApp(null)}>
                Aceptar
              </button>
            </div>
          </div>
        </Modal>
      )}
      {viewingResults && (
        <CallResultsModal
          call={viewingResults}
          onClose={() => setViewingResults(null)}
        />
      )}
    </>
  );
}

function CallResultsModal({ call, onClose }) {
  const { data: results, loading, error } = useAsync(
    () => api(`/becas/convocatorias/${call.id}/resultados`),
    [call.id]
  );

  return (
    <Modal title={`Resultados Oficiales: ${call.title}`} onClose={onClose}>
      <p className="work-help">
        Convocatoria {call.code} · Dictamen institucional del Comité de Becas UTO
      </p>
      {loading && <p>Cargando lista de folios beneficiarios…</p>}
      {error && <p className="alert error">{error}</p>}
      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            Se publican los folios de los aspirantes con dictamen favorable conforme al marco normativo y de protección de datos personales:
          </p>
          <div className="audit-table-wrapper">
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--canvas)", textAlign: "left", fontSize: "0.8125rem" }}>
                  <th style={{ padding: "8px 10px" }}>Folio</th>
                  <th style={{ padding: "8px 10px" }}>Programa educativo</th>
                  <th style={{ padding: "8px 10px" }}>Cuatrimestre</th>
                  <th style={{ padding: "8px 10px" }}>Beca otorgada</th>
                  <th style={{ padding: "8px 10px" }}>% a pagar</th>
                  <th style={{ padding: "8px 10px" }}>Sesión Comité</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "16px", textAlign: "center", color: "var(--muted)" }}>
                      No se registraron folios aprobados en esta convocatoria.
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.folio} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: "700" }}>{r.folio}</td>
                      <td style={{ padding: "8px 10px", fontSize: "0.875rem" }}>{r.major}</td>
                      <td style={{ padding: "8px 10px" }}>{r.academic_term}</td>
                      <td style={{ padding: "8px 10px", color: "var(--green)", fontWeight: "700" }}>
                        {r.discount_percentage}% de beca
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: "600" }}>
                        {r.student_percentage}%
                      </td>
                      <td style={{ padding: "8px 10px", fontSize: "0.8125rem", color: "var(--muted)" }}>
                        {r.dictamen_session}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button className="button button-secondary" onClick={onClose}>
              Cerrar resultados
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
