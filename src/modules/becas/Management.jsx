import { Link } from "react-router-dom";
import { ArrowRight, Download } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { api, date } from "../../shared/api";
import { Field, BusyButton, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
  money,
  localDateInput,
} from "../../shared/Work";
import { MODALIDADES } from "../../../shared/becas";

export function Socioeconomic() {
  const state = useAsync(() => api("/becas/socioeconomico"), []),
    mutation = useMutation();
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await mutation.run(async () => {
      await api("/becas/socioeconomico", {
        method: "POST",
        body: {
          monthly_income: form.get("monthly_income"),
          monthly_expenses: form.get("monthly_expenses"),
          dependents_count: Number(form.get("dependents_count")),
          housing_type: form.get("housing_type"),
          details: { observacion: form.get("note") },
        },
      });
      await state.refresh();
    }, "Estudio socioeconómico guardado. Ya puedes registrar una solicitud.");
  }
  return (
    <>
      <Heading
        eyebrow="Becas / Información del aspirante"
        title="Mi estudio socioeconómico"
      >
        Declara los ingresos, gastos y condiciones de tu hogar para la revisión
        de tu solicitud.
      </Heading>
      <div className="work-split">
        <div>
          <LoadState state={state}>
            {state.data && (
              <form className="work-form" onSubmit={submit}>
                <MutationState state={mutation} />
                <div className="form-grid">
                  <Field
                    name="monthly_income"
                    label="Ingreso mensual del hogar (MXN)"
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step=".01"
                    required
                    defaultValue={state.data.monthly_income}
                    hint="Incluye los ingresos de quienes aportan al hogar."
                  />
                  <Field
                    name="monthly_expenses"
                    label="Gasto mensual del hogar (MXN)"
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step=".01"
                    required
                    defaultValue={state.data.monthly_expenses}
                  />
                  <Field
                    name="dependents_count"
                    label="Personas que dependen de ese ingreso"
                    type="number"
                    min="1"
                    max="20"
                    required
                    defaultValue={state.data.dependents_count}
                  />
                  <Field
                    name="housing_type"
                    label="Tipo de vivienda"
                    as="select"
                    defaultValue={state.data.housing_type}
                  >
                    <option value="propia">Propia</option>
                    <option value="rentada">Rentada</option>
                    <option value="prestada">Prestada</option>
                    <option value="otra">Otra</option>
                  </Field>
                </div>
                <Field
                  name="note"
                  label="Información que deseas agregar"
                  as="textarea"
                  rows={4}
                  maxLength={2000}
                  defaultValue={state.data.details?.observacion || ""}
                  hint="Evita incluir números de cuenta, contraseñas o datos de otras personas."
                />
                <div className="form-footer">
                  <BusyButton
                    type="submit"
                    className="button button-primary"
                    busy={mutation.busy}
                  >
                    Guardar estudio
                  </BusyButton>
                  <Link to="/becas" className="text-link">
                    Consultar convocatorias <ArrowRight size={15} />
                  </Link>
                </div>
              </form>
            )}
          </LoadState>
        </div>
        <aside className="work-aside">
          <h2>Información para revisión</h2>
          <p>
            Estos datos forman parte del estudio de tu solicitud. Guardarlos no
            garantiza el otorgamiento de un apoyo.
          </p>
          <p>
            El área de becas puede pedir documentos para comprobar la
            información declarada.
          </p>
          <Link to="/privacidad" className="text-link">
            Consultar privacidad
          </Link>
        </aside>
      </div>
    </>
  );
}

export function ManageCalls() {
  const state = useAsync(() => api("/becas/convocatorias"), []),
    mutation = useMutation();
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget),
      element = e.currentTarget;
    const ok = await mutation.run(async () => {
      await api("/becas/convocatorias", {
        method: "POST",
        body: {
          title: form.get("title"),
          modalidad: form.get("modalidad"),
          description: form.get("description"),
          min_gpa: Number(form.get("min_gpa")),
          amount: form.get("amount"),
          slots: Number(form.get("slots")),
          start_date: new Date(form.get("start_date")).toISOString(),
          end_date: new Date(form.get("end_date")).toISOString(),
          custom_questions: form
            .get("custom_questions")
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
        },
      });
      await state.refresh();
    }, "Convocatoria guardada. La recepción se habilita durante las fechas registradas.");
    if (ok) element.reset();
  }
  return (
    <>
      <Heading
        eyebrow="Becas / Administración"
        title="Registrar una convocatoria"
        action={
          <Link to="/becas" className="button button-secondary">
            Consultar catálogo
          </Link>
        }
      >
        Captura las bases autorizadas por el área responsable. Los montos y
        criterios se definen por convocatoria.
      </Heading>
      <div className="work-split">
        <form className="work-form" onSubmit={submit}>
          <MutationState state={mutation} />
          <Field
            name="title"
            label="Nombre de la convocatoria"
            required
            minLength={3}
            maxLength={150}
          />
          <Field
            name="modalidad"
            label="Modalidad"
            as="select"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona la modalidad
            </option>
            {MODALIDADES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Field>
          <Field
            name="description"
            label="Bases y condiciones de participación"
            as="textarea"
            rows={5}
            required
            minLength={10}
            maxLength={5000}
          />
          <div className="form-grid">
            <Field
              name="min_gpa"
              label="Promedio mínimo autorizado"
              type="number"
              min="6"
              max="10"
              step=".01"
              required
            />
            <Field
              name="amount"
              label="Monto del apoyo (MXN)"
              type="number"
              min=".01"
              step=".01"
              max="9999999999.99"
              required
            />
            <Field
              name="slots"
              label="Número de apoyos disponibles"
              type="number"
              min="1"
              max="100000"
              required
            />
            <div />
            <Field
              name="start_date"
              label="Apertura de recepción"
              type="datetime-local"
              required
              defaultValue={localDateInput()}
            />
            <Field
              name="end_date"
              label="Cierre de recepción"
              type="datetime-local"
              required
            />
          </div>
          <Field
            name="custom_questions"
            label="Preguntas adicionales"
            as="textarea"
            rows={4}
            hint="Una pregunta por línea. Máximo 20; cada una admite hasta 300 caracteres."
          />
          <div className="form-footer">
            <BusyButton
              type="submit"
              className="button button-primary"
              busy={mutation.busy}
            >
              Guardar convocatoria
            </BusyButton>
          </div>
        </form>
        <aside className="work-aside">
          <h2>Revisa antes de guardar</h2>
          <p>
            Confirma presupuesto, cupo, promedio y fechas con el área
            responsable. No se aplican tarifas ni criterios institucionales
            predeterminados.
          </p>
          <p>
            La convocatoria aparece en el catálogo. Solo recibe solicitudes
            dentro del periodo de apertura y cierre.
          </p>
          <p>
            Las fechas se capturan con la zona horaria de tu dispositivo y se
            conservan en UTC.
          </p>
        </aside>
      </div>
      <section className="work-section">
        <h2>Convocatorias registradas</h2>
        <LoadState state={state} empty="Todavía no hay convocatorias">
          <div
            className="work-table"
            role="region"
            aria-label="Convocatorias registradas"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Convocatoria</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th>Cupo</th>
                </tr>
              </thead>
              <tbody>
                {state.data?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.title}
                      <small>{c.code}</small>
                    </td>
                    <td>{date(c.start_date)}</td>
                    <td>{date(c.end_date)}</td>
                    <td>{c.slots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LoadState>
      </section>
    </>
  );
}

export function ScholarshipActivity() {
  const { user } = useAuth(),
    canReadAudit = ["administrador", "auditor", "escolares"].includes(
      user.role,
    );
  const state = useAsync(
    async () => ({
      stats: await api("/becas/estadisticas"),
      logs: canReadAudit ? await api("/becas/auditoria") : [],
    }),
    [user.role],
  );
  return (
    <>
      <Heading
        eyebrow="Becas / Seguimiento del área"
        title="Actividad de becas"
        action={
          <a
            className="button button-secondary"
            href="/api/v1/becas/reportes/export"
          >
            <Download size={16} /> Exportar CSV
          </a>
        }
      >
        Consulta solicitudes pendientes y movimientos registrados. Los importes
        corresponden a apoyos aprobados, no a pagos bancarios.
      </Heading>
      <LoadState state={state}>
        {state.data && (
          <>
            <dl className="work-summary">
              <div>
                <dt>Solicitudes recibidas</dt>
                <dd>{state.data.stats.received}</dd>
              </div>
              <div>
                <dt>En revisión</dt>
                <dd>{state.data.stats.in_review}</dd>
              </div>
              <div>
                <dt>Apoyos aprobados</dt>
                <dd>{state.data.stats.approved}</dd>
              </div>
              <div>
                <dt>Importe de apoyos aprobados</dt>
                <dd>{money(state.data.stats.total_committed_funds)}</dd>
              </div>
            </dl>
            {user.role !== "auditor" && (
              <p>
                <Link to="/becas/dictamen" className="text-link">
                  Abrir solicitudes para revisión <ArrowRight size={16} />
                </Link>
              </p>
            )}
            {canReadAudit && (
              <section className="work-section">
                <h2>Movimientos registrados</h2>
                <p className="work-help">
                  Últimos 200 movimientos. La bitácora registra la actividad; no
                  es inmutable frente a un administrador de base de datos.
                </p>
                {state.data.logs.length ? (
                  <div
                    className="work-table"
                    role="region"
                    aria-label="Movimientos de becas"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Acción</th>
                          <th>Responsable</th>
                          <th>Registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.data.logs.map((l) => (
                          <tr key={l.id}>
                            <td>{date(l.created_at, true)}</td>
                            <td>{l.action}</td>
                            <td>{l.user_name}</td>
                            <td>{l.target_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>Aún no hay movimientos registrados.</p>
                )}
              </section>
            )}
          </>
        )}
      </LoadState>
    </>
  );
}
