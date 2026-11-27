import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Download, Check, Edit2, Trash2, Power } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { api, date } from "../../shared/api";
import { Field, BusyButton, Modal, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  useMutation,
  money,
  localDateInput,
} from "../../shared/Work";
import { MODALIDADES, CUATRIMESTRES_DEFAULT, CARRERAS_UTO } from "../../../shared/becas";

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
  const [editingCall, setEditingCall] = useState(null);
  const [editPeriodoActual, setEditPeriodoActual] = useState("");
  const [editPeriodoAnterior, setEditPeriodoAnterior] = useState("");
  const [editCuatris, setEditCuatris] = useState([]);
  const [editCarreras, setEditCarreras] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  function openEditModal(c) {
    setEditingCall(c);
    setEditPeriodoActual(c.periodo_actual || "septiembre - diciembre 2026");
    setEditPeriodoAnterior(c.periodo_anterior || "mayo - agosto 2026");
    setEditCuatris(c.cuatrimestres_habilitados && c.cuatrimestres_habilitados.length > 0 ? c.cuatrimestres_habilitados : CUATRIMESTRES_DEFAULT);
    setEditCarreras(c.carreras_habilitadas || []);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api(`/becas/convocatorias/${editingCall.id}`, {
        method: "PUT",
        body: {
          periodo_actual: editPeriodoActual,
          periodo_anterior: editPeriodoAnterior,
          cuatrimestres_habilitados: editCuatris,
          carreras_habilitadas: editCarreras,
        },
      });
      setEditingCall(null);
      await state.refresh();
    } catch (err) {
      alert(err.message || "Error al actualizar la configuración de la convocatoria");
    } finally {
      setSavingEdit(false);
    }
  }

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
          periodo_actual: form.get("periodo_actual") || "septiembre - diciembre 2026",
          periodo_anterior: form.get("periodo_anterior") || "mayo - agosto 2026",
          cuatrimestres_habilitados: form.get("cuatrimestres_habilitados")
            ? form.get("cuatrimestres_habilitados").split(",").map((x) => x.trim()).filter(Boolean)
            : CUATRIMESTRES_DEFAULT,
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
        Captura las bases autorizadas por el área responsable. Los montos, periodos
        y cuatrimestres se configuran por convocatoria.
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
              name="periodo_actual"
              label="Periodo actual a cursar *"
              required
              defaultValue="septiembre - diciembre 2026"
              hint="Ej: septiembre - diciembre 2026"
            />
            <Field
              name="periodo_anterior"
              label="Periodo anterior evaluado *"
              required
              defaultValue="mayo - agosto 2026"
              hint="Ej: mayo - agosto 2026"
            />
            <Field
              name="cuatrimestres_habilitados"
              label="Cuatrimestres para postular (separados por coma)"
              defaultValue="3°, 5°, 6°, 9°"
              hint="Ej: 3°, 5°, 6°, 9°"
            />
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
            Configura el periodo cuatrimestral actual y el cuatrimestre anterior evaluado
            según el calendario académico oficial de la UTO.
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
                  <th>Periodo</th>
                  <th>Cuatrimestres</th>
                  <th>Apertura</th>
                  <th>Cierre</th>
                  <th>Cupo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.data?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.title}
                      <small>{c.code}</small>
                    </td>
                    <td>
                      <strong>{c.periodo_actual || "septiembre - diciembre 2026"}</strong>
                      <br />
                      <small style={{ color: "#666" }}>Evalúa: {c.periodo_anterior || "mayo - agosto 2026"}</small>
                    </td>
                    <td>
                      {(c.cuatrimestres_habilitados || CUATRIMESTRES_DEFAULT).join(", ")}
                    </td>
                    <td>{date(c.start_date)}</td>
                    <td>{date(c.end_date)}</td>
                    <td>{c.slots}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ fontSize: "0.8125rem", padding: "4px 8px" }}
                          onClick={() => openEditModal(c)}
                          title="Editar configuración de periodos y carreras"
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                        {c.results_published ? (
                          <span className="badge badge-validado">
                            <Check size={12} /> Publicados
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="button button-secondary"
                            style={{ fontSize: "0.8125rem", padding: "4px 8px" }}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `¿Publicar resultados oficiales para ${c.title}? Los folios beneficiarios serán visibles para los estudiantes.`
                                )
                              )
                                return;
                              try {
                                await api(
                                  `/becas/convocatorias/${c.id}/publicar-resultados`,
                                  { method: "POST" }
                                );
                                await state.refresh();
                              } catch (err) {
                                alert(err.message || "Error al publicar resultados");
                              }
                            }}
                          >
                            Publicar
                          </button>
                        )}
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{
                            fontSize: "0.8125rem",
                            padding: "4px 8px",
                            color: c.is_active ? "#B8862B" : "#386641",
                          }}
                          onClick={async () => {
                            const newStatus = !c.is_active;
                            if (
                              !window.confirm(
                                `¿Deseas ${newStatus ? "activar" : "suspender"} la recepción para ${c.title}?`
                              )
                            )
                              return;
                            try {
                              await api(`/becas/convocatorias/${c.id}`, {
                                method: "PUT",
                                body: { is_active: newStatus },
                              });
                              await state.refresh();
                            } catch (err) {
                              alert(err.message || "Error al cambiar estado");
                            }
                          }}
                          title={c.is_active ? "Suspender recepción" : "Activar recepción"}
                        >
                          <Power size={12} /> {c.is_active ? "Pausar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ fontSize: "0.8125rem", padding: "4px 8px", color: "#b91c1c" }}
                          onClick={async () => {
                            if (
                              !window.confirm(
                                `¿Confirmas eliminar la convocatoria "${c.title}"? Si ya cuenta con expedientes se suspenderá automáticamente para preservar auditoría.`
                              )
                            )
                              return;
                            try {
                              const res = await api(`/becas/convocatorias/${c.id}`, {
                                method: "DELETE",
                              });
                              alert(res.message || "Convocatoria eliminada con éxito");
                              await state.refresh();
                            } catch (err) {
                              alert(err.message || "Error al eliminar convocatoria");
                            }
                          }}
                          title="Eliminar convocatoria"
                        >
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LoadState>
      </section>

      {editingCall && (
        <Modal
          title={`Configuración de Periodos y Carreras — ${editingCall.title}`}
          onClose={() => setEditingCall(null)}
        >
          <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Field
              label="Periodo actual a cursar *"
              required
              value={editPeriodoActual}
              onChange={(e) => setEditPeriodoActual(e.target.value)}
              hint="Ej: septiembre - diciembre 2026"
            />
            <Field
              label="Periodo anterior evaluado *"
              required
              value={editPeriodoAnterior}
              onChange={(e) => setEditPeriodoAnterior(e.target.value)}
              hint="Ej: mayo - agosto 2026"
            />
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "6px" }}>
                Cuatrimestres autorizados para postular
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {["1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "9°", "10°", "11°"].map((cuatri) => {
                  const checked = editCuatris.includes(cuatri);
                  return (
                    <label key={cuatri} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.875rem" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditCuatris([...editCuatris, cuatri]);
                          } else {
                            setEditCuatris(editCuatris.filter((c) => c !== cuatri));
                          }
                        }}
                      />
                      {cuatri}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "6px" }}>
                Programas Educativos Habilitados (Vacío = Los 14 vigentes)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", padding: "8px", borderRadius: "4px" }}>
                {CARRERAS_UTO.map((carrera) => {
                  const checked = editCarreras.length === 0 || editCarreras.includes(carrera);
                  return (
                    <label key={carrera} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          let current = editCarreras.length === 0 ? [...CARRERAS_UTO] : [...editCarreras];
                          if (e.target.checked) {
                            if (!current.includes(carrera)) current.push(carrera);
                          } else {
                            current = current.filter((c) => c !== carrera);
                          }
                          setEditCarreras(current.length === CARRERAS_UTO.length ? [] : current);
                        }}
                      />
                      {carrera}
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditingCall(null)}
              >
                Cancelar
              </button>
              <BusyButton
                type="submit"
                className="button button-primary"
                busy={savingEdit}
                busyText="Guardando…"
              >
                Guardar Configuración
              </BusyButton>
            </div>
          </form>
        </Modal>
      )}
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
