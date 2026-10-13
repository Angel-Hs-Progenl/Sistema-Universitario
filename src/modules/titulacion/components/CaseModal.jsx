import { useState } from "react";
import { Upload, Download, Check, X } from "lucide-react";
import { api } from "../../../shared/api";
import { Modal, Alert, BusyButton } from "../../../shared/ui";
import { DOCUMENTS, STATES } from "../../../../shared/titulacion";
export default function CaseModal({ modal, app, onClose, onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { type } = modal,
    titles = {
      upload: `Adjuntar ${modal.kind?.name}`,
      review: `Revisar ${modal.kind?.name}`,
      transition:
        modal.status === "enviada"
          ? "Revisa antes de enviar"
          : STATES[modal.status],
      clearance: "Dictamen de Vinculación",
    };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.target);
      let result;
      if (type === "upload") {
        form.set("kind", modal.kind.id);
        result = await api(`/titulacion/applications/${app.id}/documents`, {
          method: "POST",
          body: form,
        });
      }
      if (type === "review")
        result = await api(`/titulacion/documents/${modal.doc.id}/review`, {
          method: "POST",
          body: Object.fromEntries(form),
        });
      if (type === "clearance")
        result = await api(`/titulacion/applications/${app.id}/clearance`, {
          method: "POST",
          body: {
            approved: form.get("approved") === "true",
            note: form.get("note"),
          },
        });
      if (type === "transition")
        result = await api(`/titulacion/applications/${app.id}/transition`, {
          method: "POST",
          body: {
            ...Object.fromEntries(form),
            status: modal.status,
            version: app.version,
          },
        });
      await onDone(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={titles[type]} onClose={busy ? () => {} : onClose}>
      <form onSubmit={submit}>
        <Alert>{error}</Alert>
        {type === "upload" && (
          <>
            <p>
              Adjunta un archivo legible y completo. Máximo 5 MB, formato PDF o
              JPG.
            </p>
            <label className="upload-zone">
              <Upload size={28} />
              <span>Selecciona tu documento</span>
              <input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg"
                required
              />
            </label>
          </>
        )}
        {type === "review" && (
          <>
            <p>
              Comprueba que el documento sea legible, vigente y corresponda al
              estudiante.
            </p>
            <a
              className="button button-secondary"
              href={`/api/v1/titulacion/documents/${modal.doc.id}/download`}
            >
              <Download size={16} /> Descargar documento
            </a>
            <label className="field">
              Dictamen
              <select name="status" required>
                <option value="validado">Validado</option>
                <option value="rechazado">Requiere corrección</option>
              </select>
            </label>
            <label className="field">
              Observaciones
              <textarea
                name="note"
                maxLength={1000}
                placeholder="Obligatorias si requiere corrección."
                rows={3}
              />
            </label>
          </>
        )}
        {type === "clearance" && (
          <>
            <label className="field">
              Resultado
              <select name="approved">
                <option value="true">
                  Liberar estadías y seguimiento de egresados
                </option>
                <option value="false">Mantener pendiente</option>
              </select>
            </label>
            <label className="field">
              Fundamento u observaciones *
              <textarea
                name="note"
                required
                minLength={5}
                maxLength={1000}
                rows={4}
              />
            </label>
          </>
        )}
        {type === "transition" && (
          <>
            {modal.status === "enviada" ? (
              <>
                <p>
                  Enviarás el expediente de <strong>{app.student.name}</strong>{" "}
                  con folio <strong>{app.folio}</strong>.
                </p>
                <ul className="check-list">
                  {DOCUMENTS.filter((d) => d.required).map((d) => (
                    <li key={d.id}>
                      {app.documents.some((x) => x.kind === d.id) ? (
                        <Check size={16} />
                      ) : (
                        <X size={16} />
                      )}{" "}
                      {d.name}
                    </li>
                  ))}
                </ul>
                <label className="checkbox">
                  <input type="checkbox" required /> Confirmo que revisé mis
                  datos y que la información adjunta es correcta.
                </label>
                <p className="muted">
                  Al enviarlo, los documentos quedarán bloqueados mientras se
                  revisan.
                </p>
              </>
            ) : (
              <p>
                El expediente pasará a <strong>{STATES[modal.status]}</strong>.
                El estudiante recibirá una notificación dentro de la plataforma.
              </p>
            )}
            {modal.status === "tramite" && (
              <label className="field">
                Referencia de gestión institucional *
                <input name="reference" required maxLength={150} />
              </label>
            )}
            {modal.status === "disponible" && (
              <label className="field">
                Indicaciones de entrega *
                <textarea name="delivery" required maxLength={1000} rows={3} />
              </label>
            )}
            {modal.status !== "enviada" && (
              <label className="field">
                Observación{" "}
                {["cancelado", "incompleta", "rechazada", "concluido"].includes(
                  modal.status,
                ) && "*"}
                <textarea
                  name="note"
                  required={[
                    "cancelado",
                    "incompleta",
                    "rechazada",
                    "concluido",
                  ].includes(modal.status)}
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                />
              </label>
            )}
            {["tramite", "disponible"].includes(modal.status) && (
              <Alert type="info">
                Este registro da seguimiento a la gestión institucional. La
                emisión y validación oficial ante SEP se realiza por los canales
                autorizados.
              </Alert>
            )}
          </>
        )}
        <div className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Volver
          </button>
          <BusyButton busy={busy} className="button button-primary">
            {type === "upload"
              ? "Guardar documento"
              : modal.status === "enviada"
                ? "Enviar solicitud"
                : "Confirmar"}
          </BusyButton>
        </div>
      </form>
    </Modal>
  );
}
