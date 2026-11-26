import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { api, date } from "../../shared/api";
import { Empty, Field, useAsync } from "../../shared/ui";
import {
  Heading,
  LoadState,
  MutationState,
  Status,
  localDateInput,
  useMutation,
} from "../../shared/Work";

const initialForm = {
  title: "",
  questionnaire_id: "",
  subject: "",
  group_name: "",
  partial: "",
  start_date: localDateInput(),
  end_date: localDateInput(7),
};

export default function Admin() {
  const activities = useAsync(() => api("/coevaluacion/actividades"), []);
  const questionnaires = useAsync(() => api("/coevaluacion/cuestionarios"), []);
  const students = useAsync(() => api("/coevaluacion/estudiantes"), []);
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState("");
  const [pair, setPair] = useState({ evaluator_id: "", peer_id: "" });
  const assignments = useAsync(
    () =>
      selectedId
        ? api(`/coevaluacion/actividades/${selectedId}/asignaciones`)
        : Promise.resolve([]),
    [selectedId],
  );
  const createState = useMutation();
  const pairState = useMutation();
  const transitionState = useMutation();
  const selected = activities.data?.find(
    (activity) => String(activity.id) === String(selectedId),
  );

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function create(event) {
    event.preventDefault();
    const success = await createState.run(async () => {
      const result = await api("/coevaluacion/actividades", {
        method: "POST",
        body: {
          ...form,
          questionnaire_id: Number(form.questionnaire_id),
          start_date: new Date(form.start_date).toISOString(),
          end_date: new Date(form.end_date).toISOString(),
        },
      });
      setSelectedId(String(result.id));
      setForm(initialForm);
      await activities.refresh();
    }, "Actividad creada en borrador. Asigna parejas antes de abrirla.");
    if (success) pairState.clear();
  }

  async function addPair(event) {
    event.preventDefault();
    if (pair.evaluator_id === pair.peer_id) {
      pairState.run(() =>
        Promise.reject(new Error("Selecciona dos estudiantes distintos.")),
      );
      return;
    }
    const success = await pairState.run(async () => {
      await api(`/coevaluacion/actividades/${selectedId}/asignaciones`, {
        method: "POST",
        body: { pairs: [pair] },
      });
      setPair({ evaluator_id: "", peer_id: "" });
      await Promise.all([assignments.refresh(), activities.refresh()]);
    }, "Pareja asignada.");
    if (success) transitionState.clear();
  }

  async function transition() {
    const status = selected.status === "borrador" ? "abierta" : "cerrada";
    await transitionState.run(
      async () => {
        await api(`/coevaluacion/actividades/${selected.id}/estado`, {
          method: "POST",
          body: { status, version: selected.version },
        });
        await activities.refresh();
      },
      status === "abierta" ? "Recepción abierta." : "Recepción cerrada.",
    );
  }

  return (
    <section className="coev-page">
      <Heading
        eyebrow="Área académica / Coordinación"
        title="Preparar coevaluaciones"
        action={
          <Link
            className="button button-secondary"
            to="/coevaluacion/cuestionarios"
          >
            Editar criterios <ArrowRight size={16} />
          </Link>
        }
      >
        Crea una actividad por materia, grupo y parcial; asigna quién evalúa a
        quién y abre la recepción cuando esté lista.
      </Heading>
      <div className="coev-context">
        <div>
          <span className="coev-context-label">Secuencia de trabajo</span>
          <strong>Cuestionario → actividad → parejas → apertura</strong>
        </div>
        <p>
          Las respuestas son individuales y definitivas. El seguimiento muestra
          envíos, sin publicar una calificación académica.
        </p>
      </div>
      <div className="coev-admin-grid">
        <form className="coev-panel" onSubmit={create}>
          <div className="coev-section-heading">
            <span>01 / Preparación</span>
            <h2>Nueva actividad</h2>
            <p>
              La actividad comienza en borrador y no aparece al estudiante hasta
              abrirse.
            </p>
          </div>
          <Field
            label="Nombre de la actividad"
            required
            minLength={3}
            maxLength={150}
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
          />
          <Field
            as="select"
            label="Cuestionario"
            required
            value={form.questionnaire_id}
            onChange={(e) => change("questionnaire_id", e.target.value)}
          >
            <option value="">Selecciona una versión</option>
            {questionnaires.data?.map((row) => (
              <option value={row.id} key={row.id}>
                {row.title} · versión {row.version}
              </option>
            ))}
          </Field>
          {!questionnaires.loading && !questionnaires.data?.length && (
            <p className="work-help">
              Primero{" "}
              <Link to="/coevaluacion/cuestionarios">
                guarda un cuestionario
              </Link>
              .
            </p>
          )}
          {questionnaires.error && (
            <p className="field-error" role="alert">
              {questionnaires.error}
            </p>
          )}
          <div className="coev-form-row">
            <Field
              label="Materia"
              required
              minLength={3}
              maxLength={150}
              value={form.subject}
              onChange={(e) => change("subject", e.target.value)}
            />
            <Field
              label="Grupo"
              required
              maxLength={80}
              value={form.group_name}
              onChange={(e) => change("group_name", e.target.value)}
            />
          </div>
          <Field
            label="Parcial"
            required
            maxLength={50}
            value={form.partial}
            onChange={(e) => change("partial", e.target.value)}
          />
          <div className="coev-form-row">
            <Field
              label="Abre el"
              type="datetime-local"
              required
              value={form.start_date}
              onChange={(e) => change("start_date", e.target.value)}
            />
            <Field
              label="Cierra el"
              type="datetime-local"
              required
              value={form.end_date}
              onChange={(e) => change("end_date", e.target.value)}
            />
          </div>
          <MutationState state={createState} />
          <button
            className="button button-primary"
            type="submit"
            disabled={createState.busy || !questionnaires.data?.length}
          >
            <Plus size={16} /> Crear actividad
          </button>
        </form>
        <div className="coev-panel">
          <div className="coev-section-heading">
            <span>02 / Seguimiento</span>
            <h2>Actividades</h2>
            <p>
              Selecciona un borrador para asignar parejas, o consulta cuántas
              respuestas llegaron.
            </p>
          </div>
          <LoadState state={activities} empty="Aún no hay actividades">
            {activities.data?.length ? (
              <div className="coev-activity-list">
                {activities.data.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={`coev-activity ${selectedId === String(row.id) ? "active" : ""}`}
                    onClick={() => setSelectedId(String(row.id))}
                    aria-pressed={selectedId === String(row.id)}
                  >
                    <span className="record-code">
                      {row.subject} · {row.group_name} · {row.partial}
                    </span>
                    <strong>{row.title}</strong>
                    <span>
                      <Status value={row.status}>{row.status}</Status>{" "}
                      <small>
                        {row.submitted_count} de {row.assigned_count} envíos
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <Empty title="Aún no hay actividades">
                Crea una para preparar las primeras parejas.
              </Empty>
            )}
          </LoadState>
        </div>
      </div>
      {selected && (
        <section
          className="coev-panel coev-selected"
          aria-label="Actividad seleccionada"
        >
          <div className="coev-selected-heading">
            <div>
              <span className="coev-context-label">
                03 / Asignaciones y apertura
              </span>
              <h2>{selected.title}</h2>
              <p>
                {selected.subject} · {selected.group_name} · {selected.partial}{" "}
                · cierre {date(selected.end_date, true)}
              </p>
            </div>
            <Status value={selected.status}>{selected.status}</Status>
          </div>
          <div className="coev-selected-grid">
            <div>
              {selected.status === "borrador" && (
                <form onSubmit={addPair} className="coev-pair-form">
                  <h3>Asignar una pareja</h3>
                  <p className="work-help">
                    Selecciona una cuenta para responder y otra para recibir la
                    valoración.
                  </p>
                  <div className="coev-form-row">
                    <Field
                      as="select"
                      label="Quién responde"
                      required
                      value={pair.evaluator_id}
                      onChange={(e) =>
                        setPair((current) => ({
                          ...current,
                          evaluator_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona estudiante</option>
                      {students.data?.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name} · {row.email}
                        </option>
                      ))}
                    </Field>
                    <Field
                      as="select"
                      label="A quién evalúa"
                      required
                      value={pair.peer_id}
                      onChange={(e) =>
                        setPair((current) => ({
                          ...current,
                          peer_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona estudiante</option>
                      {students.data?.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name} · {row.email}
                        </option>
                      ))}
                    </Field>
                  </div>
                  {students.error && (
                    <p className="field-error" role="alert">
                      {students.error}
                    </p>
                  )}
                  <MutationState state={pairState} />
                  <button
                    className="button button-secondary"
                    disabled={pairState.busy || !students.data?.length}
                    type="submit"
                  >
                    {pairState.busy ? "Asignando…" : "Agregar pareja"}
                  </button>
                </form>
              )}
              <MutationState state={transitionState} />
              {selected.status !== "cerrada" && (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={transition}
                  disabled={
                    transitionState.busy ||
                    (selected.status === "borrador" && !selected.assigned_count)
                  }
                >
                  {transitionState.busy
                    ? "Guardando…"
                    : selected.status === "borrador"
                      ? "Abrir recepción"
                      : "Cerrar recepción"}
                </button>
              )}
            </div>
            <div>
              <h3>Estado de las parejas</h3>
              <LoadState state={assignments} empty="No hay parejas asignadas">
                <ul className="coev-pair-list">
                  {assignments.data?.map((row) => (
                    <li key={row.id}>
                      <span>
                        <strong>{row.evaluator_name}</strong> evalúa a{" "}
                        {row.peer_name}
                      </span>
                      <Status value={row.submitted ? "enviada" : "pendiente"}>
                        {row.submitted ? "Enviada" : "Pendiente"}
                      </Status>
                    </li>
                  ))}
                </ul>
              </LoadState>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
