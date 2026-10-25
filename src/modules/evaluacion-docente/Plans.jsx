import { useState } from "react";
import { useAuth } from "../../app/Auth";
import { api, date } from "../../shared/api";
import { Field, Modal, BusyButton, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
  Status,
} from "../../shared/Work";

const BASE = "/evaluacion-docente";

export default function Plans() {
  const { user } = useAuth(),
    admin = user.role === "administrador";
  const state = useAsync(() => api(`${BASE}/planes`), []);
  const periods = useAsync(
    () => (admin ? api(`${BASE}/periodos`) : Promise.resolve([])),
    [admin],
  );
  const people = useAsync(
    () => (admin ? api(`${BASE}/personas`) : Promise.resolve([])),
    [admin],
  );
  const [dialog, setDialog] = useState(null),
    mutation = useMutation();
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (
      await mutation.run(
        async () => {
          if (admin)
            await api(`${BASE}/planes`, {
              method: "POST",
              body: {
                period_id: Number(form.get("period_id")),
                teacher_id: form.get("teacher_id"),
                action: form.get("action"),
                due_date: new Date(form.get("due_date")).toISOString(),
              },
            });
          else
            await api(`${BASE}/planes/${dialog.id}/avance`, {
              method: "POST",
              body: {
                evidence: form.get("evidence"),
                status: form.get("status"),
                version: dialog.version,
              },
            });
          await state.refresh();
        },
        admin ? "Plan de mejora guardado." : "Avance guardado.",
      )
    )
      setDialog(null);
  }
  const published = (periods.data || []).filter(
    (p) => p.status === "publicado",
  );
  return (
    <>
      <Heading
        eyebrow="Evaluación docente / Seguimiento"
        title={admin ? "Planes de mejora" : "Mi plan de mejora"}
        action={
          admin && (
            <button
              className="button button-primary"
              onClick={() => {
                mutation.clear();
                setDialog({});
              }}
            >
              Registrar plan
            </button>
          )
        }
      >
        {admin
          ? "Acuerda acciones a partir de resultados publicados y suficientes para su consulta."
          : "Consulta las acciones acordadas y registra el avance de su cumplimiento."}
      </Heading>
      {!dialog && <MutationState state={mutation} />}
      <LoadState state={state} empty="No hay planes de mejora registrados">
        <div className="work-records">
          {state.data?.map((p) => (
            <article className="work-record" key={p.id}>
              <div>
                <span className="record-code">
                  {p.period_title}
                  {admin && ` · ${p.teacher_name}`}
                </span>
                <h2>{p.action}</h2>
                <Status value={p.status}>
                  {p.status === "pendiente"
                    ? "Pendiente"
                    : p.status === "en_proceso"
                      ? "En proceso"
                      : "Concluido"}
                </Status>
                <dl className="work-meta">
                  <div>
                    <dt>Fecha acordada</dt>
                    <dd>{date(p.due_date)}</dd>
                  </div>
                </dl>
                {p.evidence && <p>{p.evidence}</p>}
              </div>
              {!admin && p.status !== "concluido" && (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    mutation.clear();
                    setDialog(p);
                  }}
                >
                  Registrar avance
                </button>
              )}
            </article>
          ))}
        </div>
      </LoadState>
      {dialog && (
        <Modal
          title={
            admin ? "Registrar plan de mejora" : "Registrar avance del plan"
          }
          onClose={() => {
            if (!mutation.busy) setDialog(null);
          }}
        >
          <form onSubmit={submit}>
            <MutationState state={mutation} />
            {admin ? (
              <LoadState state={periods}>
                <LoadState state={people}>
                  <Field
                    label="Periodo publicado"
                    name="period_id"
                    as="select"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona el periodo
                    </option>
                    {published.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Field>
                  <Field
                    label="Docente"
                    name="teacher_id"
                    as="select"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona la cuenta
                    </option>
                    {people.data
                      ?.filter((p) => p.role === "docente")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </Field>
                  <Field
                    label="Acción acordada"
                    name="action"
                    as="textarea"
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                  <Field
                    label="Fecha acordada"
                    name="due_date"
                    type="datetime-local"
                    required
                  />
                  <p className="work-help">
                    Solo se admiten planes para docentes con resultados
                    publicados que alcancen el mínimo de participantes.
                  </p>
                </LoadState>
              </LoadState>
            ) : (
              <>
                <p>{dialog.action}</p>
                <Field
                  label="Avance y evidencia de cumplimiento"
                  name="evidence"
                  as="textarea"
                  rows={5}
                  required
                  minLength={3}
                  maxLength={4000}
                  defaultValue={dialog.evidence}
                />
                <Field
                  label="Estado del avance"
                  name="status"
                  as="select"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona el estado
                  </option>
                  <option value="en_proceso">En proceso</option>
                  <option value="concluido">Concluido</option>
                </Field>
              </>
            )}
            <div className="work-actions">
              <BusyButton
                type="submit"
                className="button button-primary"
                busy={mutation.busy}
                disabled={admin && !published.length}
              >
                Guardar {admin ? "plan" : "avance"}
              </BusyButton>
              <button
                type="button"
                disabled={mutation.busy}
                onClick={() => setDialog(null)}
                className="button button-secondary"
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
