import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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

export default function Calls() {
  const { user } = useAuth();
  const state = useAsync(() => api("/becas/convocatorias"), []);
  const [search, setSearch] = useState(""),
    [modality, setModality] = useState(""),
    [selected, setSelected] = useState(null),
    [applying, setApplying] = useState(null);
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
                  <button
                    className="button button-secondary"
                    onClick={() => setSelected(c)}
                  >
                    Consultar bases <ArrowRight size={16} />
                  </button>
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
          title="Registrar solicitud de beca"
          onClose={() => {
            if (!mutation.busy) setApplying(null);
          }}
        >
          <p>{applying.title}</p>
          <form onSubmit={apply}>
            <MutationState state={mutation} />
            <Field
              name="gpa"
              label="Promedio del periodo anterior"
              type="number"
              min="6"
              max="10"
              step=".01"
              required
            />
            <Field
              name="academic_term"
              label="Periodo académico actual"
              maxLength={50}
              required
              placeholder="Ej. cuarto cuatrimestre"
            />
            <Field
              name="major"
              label="Programa educativo"
              maxLength={150}
              minLength={3}
              required
              defaultValue={user.profile?.carrera || ""}
            />
            {applying.custom_questions?.map((q, i) => (
              <Field
                name={`question-${i}`}
                key={i}
                label={q}
                as="textarea"
                maxLength={2000}
                required
              />
            ))}
            <p className="work-note">
              Al registrar la solicitud recibirás un folio. Después podrás
              adjuntar los documentos para revisión.
            </p>
            <div className="work-actions">
              <BusyButton
                className="button button-primary"
                type="submit"
                busy={mutation.busy}
              >
                Registrar solicitud
              </BusyButton>
              <button
                type="button"
                className="button button-secondary"
                disabled={mutation.busy}
                onClick={() => setApplying(null)}
              >
                Volver a convocatorias
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
