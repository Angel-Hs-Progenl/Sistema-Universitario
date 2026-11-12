import { useState } from "react";
import { Link } from "react-router-dom";
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

export function PaymentOrders() {
  const { user } = useAuth(),
    canCreate = user.role === "tesoreria";
  const state = useAsync(() => api("/becas/ordenes-cobro"), []);
  const beneficiaries = useAsync(
    () => (canCreate ? api("/becas/beneficiarios") : Promise.resolve([])),
    [canCreate],
  );
  const [dialog, setDialog] = useState(false),
    mutation = useMutation();
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (
      await mutation.run(async () => {
        await api("/becas/ordenes-cobro/generar", {
          method: "POST",
          body: {
            application_id: Number(form.get("application")),
            period: form.get("period"),
            scheduled_date: new Date(form.get("date")).toISOString(),
          },
        });
        await state.refresh();
      }, "Orden interna programada.")
    )
      setDialog(false);
  }
  return (
    <>
      <Heading
        eyebrow="Becas / Órdenes internas"
        title={
          user.role === "estudiante"
            ? "Mis órdenes de cobro"
            : "Órdenes de cobro"
        }
        action={
          canCreate && (
            <button
              className="button button-primary"
              onClick={() => {
                mutation.clear();
                setDialog(true);
              }}
            >
              Programar una orden
            </button>
          )
        }
      >
        Consulta la fecha y el importe programados para cada apoyo aprobado. Una
        orden interna no confirma una transferencia bancaria.
      </Heading>
      {!dialog && <MutationState state={mutation} />}
      <LoadState state={state} empty="No hay órdenes de cobro registradas">
        <div
          className="work-table"
          role="region"
          aria-label="Órdenes de cobro"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Beneficiario</th>
                <th>Periodo</th>
                <th>Fecha programada</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {state.data?.map((o) => (
                <tr key={o.id}>
                  <td>
                    {o.folio_orden}
                    <small>{o.application_folio}</small>
                  </td>
                  <td>
                    {o.student_name}
                    <small>{o.call_title}</small>
                  </td>
                  <td>{o.period}</td>
                  <td>{date(o.scheduled_date)}</td>
                  <td>{money(o.amount)}</td>
                  <td>
                    <Status value={o.status}>
                      {o.status === "programada" ? "Programada" : o.status}
                    </Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>
      {dialog && (
        <Modal
          title="Programar orden interna"
          onClose={() => {
            if (!mutation.busy) setDialog(false);
          }}
        >
          <LoadState
            state={beneficiaries}
            empty="No hay becas aprobadas para programar"
          >
            <form onSubmit={submit}>
              <MutationState state={mutation} />
              <Field
                as="select"
                name="application"
                id="application_id"
                label="Solicitud aprobada"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona una solicitud
                </option>
                {beneficiaries.data?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.folio} · {a.student_name}
                  </option>
                ))}
              </Field>
              <Field
                name="period"
                label="Periodo del apoyo"
                minLength={2}
                maxLength={50}
                required
              />
              <Field
                name="date"
                id="scheduled_date"
                label="Fecha programada"
                type="datetime-local"
                required
              />
              <p className="work-note">
                El importe se toma de la convocatoria. No se enviará dinero ni
                se generará una referencia bancaria.
              </p>
              <div className="work-actions">
                <BusyButton
                  className="button button-primary"
                  type="submit"
                  busy={mutation.busy}
                >
                  Guardar orden
                </BusyButton>
                <button
                  type="button"
                  disabled={mutation.busy}
                  className="button button-secondary"
                  onClick={() => setDialog(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </LoadState>
        </Modal>
      )}
    </>
  );
}

export function Renewals() {
  const { user } = useAuth(),
    student = user.role === "estudiante";
  const state = useAsync(() => api("/becas/renovaciones"), []);
  const applications = useAsync(
    () => (student ? api("/becas/solicitudes") : Promise.resolve([])),
    [student],
  );
  const [dialog, setDialog] = useState(null),
    mutation = useMutation();
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (
      await mutation.run(
        async () => {
          if (student)
            await api("/becas/renovaciones", {
              method: "POST",
              body: {
                original_application_id: Number(form.get("application")),
                current_gpa: Number(form.get("gpa")),
                academic_term: form.get("term"),
                notes: form.get("note"),
              },
            });
          else
            await api(`/becas/renovaciones/${dialog.id}/dictamen`, {
              method: "POST",
              body: { decision: form.get("decision"), note: form.get("note") },
            });
          await state.refresh();
        },
        student
          ? "Renovación registrada para revisión."
          : "Dictamen de renovación guardado.",
      )
    )
      setDialog(null);
  }
  const approved = (applications.data || []).filter((a) =>
    ["aprobada", "renovada"].includes(a.status),
  );
  return (
    <>
      <Heading
        eyebrow="Becas / Continuidad del apoyo"
        title={student ? "Mis renovaciones" : "Revisar renovaciones"}
        action={
          student && (
            <button
              className="button button-primary"
              onClick={() => {
                mutation.clear();
                setDialog({});
              }}
            >
              Solicitar renovación
            </button>
          )
        }
      >
        La renovación se revisa a partir de una beca aprobada y del promedio del
        nuevo periodo.
      </Heading>
      {!dialog && <MutationState state={mutation} />}
      <LoadState state={state} empty="No hay renovaciones registradas">
        <div className="work-records">
          {state.data?.map((r) => (
            <article key={r.id} className="work-record">
              <div>
                <span className="record-code">{r.application_folio}</span>
                <h2>{r.call_title}</h2>
                <p>
                  {student
                    ? r.academic_term
                    : `${r.student_name} · ${r.academic_term}`}{" "}
                  · Promedio {r.current_gpa}
                </p>
                <Status value={r.status}>
                  {r.status === "solicitada"
                    ? "Pendiente de revisión"
                    : r.status === "aprobada"
                      ? "Renovación aprobada"
                      : "Renovación rechazada"}
                </Status>
                {r.notes && <p>{r.notes}</p>}
              </div>
              {!student && r.status === "solicitada" && (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    mutation.clear();
                    setDialog(r);
                  }}
                >
                  Revisar renovación
                </button>
              )}
            </article>
          ))}
        </div>
      </LoadState>
      {dialog && (
        <Modal
          title={student ? "Solicitar renovación" : "Dictaminar renovación"}
          onClose={() => {
            if (!mutation.busy) setDialog(null);
          }}
        >
          <form onSubmit={submit}>
            <MutationState state={mutation} />
            {student ? (
              <LoadState state={applications}>
                {approved.length ? (
                  <>
                    <Field
                      name="application"
                      label="Beca aprobada"
                      as="select"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecciona una beca
                      </option>
                      {approved.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.folio} · {a.call_title}
                        </option>
                      ))}
                    </Field>
                    <Field
                      name="gpa"
                      label="Promedio del nuevo periodo"
                      type="number"
                      min="6"
                      max="10"
                      step=".01"
                      required
                    />
                    <Field
                      name="term"
                      label="Nuevo periodo académico"
                      required
                      minLength={2}
                      maxLength={50}
                    />
                  </>
                ) : (
                  <p>
                    Necesitas una beca aprobada.{" "}
                    <Link className="text-link" to="/becas/solicitudes">
                      Consultar mis solicitudes
                    </Link>
                  </p>
                )}
              </LoadState>
            ) : (
              <>
                <p>
                  {dialog.student_name} · {dialog.application_folio}
                </p>
                <Field
                  name="decision"
                  label="Resultado de la revisión"
                  as="select"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona un resultado
                  </option>
                  <option value="aprobada">Aprobar renovación</option>
                  <option value="rechazada">Rechazar renovación</option>
                </Field>
              </>
            )}
            <Field
              name="note"
              label={
                student
                  ? "Información adicional"
                  : "Observación para el estudiante"
              }
              as="textarea"
              required={!student}
              minLength={student ? 0 : 3}
              maxLength={2000}
            />
            <div className="work-actions">
              <BusyButton
                type="submit"
                className="button button-primary"
                busy={mutation.busy}
                disabled={student && !approved.length}
              >
                {student ? "Registrar renovación" : "Guardar dictamen"}
              </BusyButton>
              <button
                className="button button-secondary"
                type="button"
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
