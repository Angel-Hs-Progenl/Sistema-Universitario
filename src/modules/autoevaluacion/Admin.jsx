import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { api, date } from "../../shared/api";
import { useAsync, Field, Modal, BusyButton, Empty } from "../../shared/ui";
import {
  Heading,
  LoadState,
  Status,
  useMutation,
  MutationState,
} from "../../shared/Work";

const BASE = "/autoevaluacion";
export default function Admin() {
  const state = useAsync(async () => {
    const [evaluations, questionnaires, students] = await Promise.all([
      api(BASE + "/evaluaciones"),
      api(BASE + "/cuestionarios"),
      api(BASE + "/estudiantes"),
    ]);
    return { evaluations, questionnaires, students };
  }, []);
  const [dialog, setDialog] = useState(null),
    [filter, setFilter] = useState(""),
    [search, setSearch] = useState(""),
    [studentSearch, setStudentSearch] = useState(""),
    [selected, setSelected] = useState([]);
  const mutation = useMutation();
  const assignments = useAsync(
    () =>
      dialog?.type === "assign"
        ? api(BASE + "/evaluaciones/" + dialog.item.id + "/asignaciones")
        : Promise.resolve([]),
    [dialog?.type, dialog?.item?.id],
  );
  const assigned = new Set((assignments.data || []).map((a) => a.student_id));
  const students = (state.data?.students || []).filter((s) =>
    (s.name + " " + s.email)
      .toLocaleLowerCase()
      .includes(studentSearch.toLocaleLowerCase()),
  );
  const rows = (state.data?.evaluations || []).filter(
    (e) =>
      (!filter || e.status === filter) &&
      (e.title + " " + e.subject + " " + e.group_name + " " + e.partial)
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  function open(value) {
    mutation.clear();
    setSelected([]);
    setStudentSearch("");
    setDialog(value);
  }
  function close() {
    if (!mutation.busy) setDialog(null);
  }
  async function create(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save(async () => {
      await api(BASE + "/evaluaciones", {
        method: "POST",
        body: {
          title: form.get("title"),
          questionnaire_id: Number(form.get("questionnaire_id")),
          subject: form.get("subject"),
          group_name: form.get("group_name"),
          partial: form.get("partial"),
          start_date: new Date(form.get("start_date")).toISOString(),
          end_date: new Date(form.get("end_date")).toISOString(),
        },
      });
    }, "Evaluación creada en borrador. Asigna estudiantes antes de abrirla.");
  }
  async function save(action, notice) {
    await mutation.run(async () => {
      await action();
      setDialog(null);
      await state.refresh();
    }, notice);
  }
  return (
    <>
      <Heading
        eyebrow="Autoevaluación / Coordinación"
        title="Evaluaciones por parcial"
        action={
          <button
            className="button button-primary"
            disabled={!state.data?.questionnaires.length}
            onClick={() => open({ type: "create" })}
          >
            <Plus size={16} /> Preparar evaluación
          </button>
        }
      >
        Prepara el periodo, asigna estudiantes y abre la recepción cuando esté
        listo.
      </Heading>
      {!dialog && <MutationState state={mutation} />}
      <LoadState state={state}>
        {state.data && (
          <>
            {!state.data.questionnaires.length && (
              <p className="work-note">
                Para preparar una evaluación, primero{" "}
                <Link className="text-link" to={BASE + "/cuestionarios"}>
                  crea un cuestionario
                </Link>
                .
              </p>
            )}
            <div className="work-toolbar">
              <Field
                label="Buscar evaluación, asignatura o grupo"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Field
                label="Estado de recepción"
                as="select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="borrador">Borrador</option>
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
              </Field>
              <p role="status">{rows.length} evaluaciones en esta vista.</p>
            </div>
            <div className="work-records">
              {rows.map((item) => (
                <article
                  className="work-record self-evaluation-record"
                  key={item.id}
                >
                  <div>
                    <span className="record-code">
                      {item.subject} · Grupo {item.group_name} · {item.partial}
                    </span>
                    <h2>{item.title}</h2>
                    <Status
                      value={
                        item.status === "abierta" ? "publicado" : "pendiente"
                      }
                    >
                      {item.status === "abierta"
                        ? "Recepción abierta"
                        : item.status === "cerrada"
                          ? "Recepción cerrada"
                          : "Borrador"}
                    </Status>
                    <dl className="work-meta">
                      <div>
                        <dt>Apertura</dt>
                        <dd>{date(item.start_date, true)}</dd>
                      </div>
                      <div>
                        <dt>Cierre</dt>
                        <dd>{date(item.end_date, true)}</dd>
                      </div>
                      <div>
                        <dt>Participación</dt>
                        <dd>
                          {item.submitted_count} de {item.assigned_count} envíos
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="work-actions">
                    {item.status === "borrador" && (
                      <>
                        <button
                          className="button button-secondary"
                          onClick={() => open({ type: "assign", item })}
                        >
                          Asignar estudiantes
                        </button>
                        <button
                          className="button button-primary"
                          disabled={!item.assigned_count}
                          onClick={() =>
                            open({
                              type: "transition",
                              item,
                              status: "abierta",
                            })
                          }
                        >
                          Abrir recepción
                        </button>
                        {!item.assigned_count && (
                          <p className="work-help">
                            Asigna al menos un estudiante para abrir.
                          </p>
                        )}
                      </>
                    )}
                    {item.status === "abierta" && (
                      <button
                        className="button button-secondary"
                        onClick={() =>
                          open({ type: "transition", item, status: "cerrada" })
                        }
                      >
                        Cerrar recepción
                      </button>
                    )}
                    <Link
                      className="text-link"
                      to={BASE + "/resultados/" + item.id}
                    >
                      Participación y respuestas <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {!rows.length && (
              <Empty
                title={
                  state.data.evaluations.length
                    ? "No hay coincidencias"
                    : "Aún no hay evaluaciones por parcial"
                }
              >
                {state.data.evaluations.length
                  ? "Prueba otra asignatura o estado."
                  : "Prepara una evaluación con su cuestionario, grupo y fechas de recepción."}
              </Empty>
            )}
          </>
        )}
      </LoadState>
      {dialog?.type === "create" && (
        <Modal title="Preparar evaluación" onClose={close}>
          <form onSubmit={create}>
            <MutationState state={mutation} />
            <Field
              name="title"
              label="Nombre de la evaluación"
              required
              minLength={3}
              maxLength={150}
            />
            <Field
              name="questionnaire_id"
              label="Cuestionario"
              as="select"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona una versión
              </option>
              {state.data.questionnaires.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} · v{q.version}
                </option>
              ))}
            </Field>
            <Field
              name="subject"
              label="Asignatura"
              required
              minLength={3}
              maxLength={150}
            />
            <div className="form-grid">
              <Field name="group_name" label="Grupo" required maxLength={80} />
              <Field name="partial" label="Parcial" required maxLength={50} />
            </div>
            <div className="form-grid">
              <Field
                name="start_date"
                label="Apertura"
                type="datetime-local"
                required
              />
              <Field
                name="end_date"
                label="Cierre"
                type="datetime-local"
                required
              />
            </div>
            <p className="work-help">
              Fechas en la zona horaria de tu navegador. Se creará un borrador
              que los estudiantes aún no verán.
            </p>
            <div className="work-actions">
              <BusyButton
                className="button button-primary"
                type="submit"
                busy={mutation.busy}
              >
                Crear borrador
              </BusyButton>
              <button
                className="button button-secondary"
                type="button"
                onClick={close}
                disabled={mutation.busy}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog?.type === "assign" && (
        <Modal title="Asignar estudiantes" onClose={close}>
          <p>
            {dialog.item.title} · Grupo {dialog.item.group_name}
          </p>
          <MutationState state={mutation} />
          <LoadState state={assignments}>
            <Field
              label="Buscar estudiante por nombre o correo"
              type="search"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            <p className="work-help" role="status">
              {selected.length} seleccionados · {assigned.size} ya asignados
            </p>
            <div className="self-student-list">
              {students.map((s) => (
                <label className="self-student-choice" key={s.id}>
                  <input
                    type="checkbox"
                    disabled={assigned.has(s.id) || mutation.busy}
                    checked={assigned.has(s.id) || selected.includes(s.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, s.id]
                          : current.filter((id) => id !== s.id),
                      )
                    }
                  />
                  <span>
                    {s.name}
                    <small>
                      {s.email}
                      {assigned.has(s.id) ? " · Ya asignado" : ""}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {!students.length && (
              <p>No hay estudiantes que coincidan con la búsqueda.</p>
            )}
            <div className="work-actions">
              <BusyButton
                className="button button-primary"
                busy={mutation.busy}
                disabled={!selected.length || selected.length > 500}
                onClick={() =>
                  save(
                    () =>
                      api(
                        BASE +
                          "/evaluaciones/" +
                          dialog.item.id +
                          "/asignaciones",
                        { method: "POST", body: { student_ids: selected } },
                      ),
                    "Estudiantes asignados.",
                  )
                }
              >
                Guardar asignaciones
              </BusyButton>
              <button
                className="button button-secondary"
                disabled={mutation.busy}
                onClick={close}
              >
                Cancelar
              </button>
            </div>
          </LoadState>
        </Modal>
      )}
      {dialog?.type === "transition" && (
        <Modal
          title={
            dialog.status === "abierta" ? "Abrir recepción" : "Cerrar recepción"
          }
          onClose={close}
        >
          <p>
            <strong>{dialog.item.title}</strong>
          </p>
          <p>
            {dialog.status === "abierta"
              ? "Los estudiantes asignados podrán responder durante el periodo configurado."
              : "Se dejarán de aceptar respuestas. Este cambio no permite reabrir la evaluación."}
          </p>
          <MutationState state={mutation} />
          <div className="work-actions">
            <BusyButton
              className="button button-primary"
              busy={mutation.busy}
              onClick={() =>
                save(
                  () =>
                    api(BASE + "/evaluaciones/" + dialog.item.id + "/estado", {
                      method: "POST",
                      body: {
                        status: dialog.status,
                        version: dialog.item.version,
                      },
                    }),
                  "Estado de recepción actualizado.",
                )
              }
            >
              Confirmar {dialog.status === "abierta" ? "apertura" : "cierre"}
            </BusyButton>
            <button
              className="button button-secondary"
              disabled={mutation.busy}
              onClick={close}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
