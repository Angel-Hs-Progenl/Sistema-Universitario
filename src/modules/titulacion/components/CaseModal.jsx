import { useState } from "react";
import { Upload, Download, Check, X } from "lucide-react";
import { api } from "../../../shared/api";
import { Modal, Alert, BusyButton, ErrorSummary } from "../../../shared/ui";
import { DOCUMENTS, STATES } from "../../../../shared/titulacion";
export default function CaseModal({ modal, app, onClose, onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selectedFile, setSelectedFile] = useState(null),
    [decision, setDecision] = useState("");
  const missing = DOCUMENTS.filter(
    (d) =>
      d.required &&
      !app.documents.some((x) => x.kind === d.id && x.status !== "rechazado"),
  );
  const { type } = modal,
    titles = {
      upload: `${app.documents.some((d) => d.kind === modal.kind?.id) ? "Reemplazar" : "Adjuntar"} ${modal.kind?.name}`,
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
        const file = form.get("file");
        if (!file.size || file.size > 5 * 1024 * 1024)
          throw new Error(
            "El archivo debe pesar entre 1 byte y 5 MB. Selecciona otro archivo.",
          );
        if (!/\.(pdf|jpe?g)$/i.test(file.name))
          throw new Error("Selecciona un archivo PDF o JPG.");
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
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={titles[type]} onClose={busy ? () => {} : onClose}>
      <form onSubmit={submit}>
        <ErrorSummary error={error} />
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
                id="file"
                accept=".pdf,.jpg,.jpeg"
                onChange={(e) => {
                  setSelectedFile(e.target.files[0] || null);
                  setError("");
                }}
                required
              />
              {selectedFile && (
                <span className="upload-selection" role="status">
                  Seleccionado: {selectedFile.name} ·{" "}
                  {selectedFile.size < 1024 * 1024
                    ? `${Math.max(1, Math.ceil(selectedFile.size / 1024))} KB`
                    : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                  . Pulsa Guardar documento para adjuntarlo.
                </span>
              )}
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
              <select
                id="status"
                name="status"
                required
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option value="" disabled>
                  Seleccionar dictamen
                </option>
                <option value="validado">Validado</option>
                <option value="rechazado">Requiere corrección</option>
              </select>
            </label>
            <label className="field">
              Observaciones
              <textarea
                id="note"
                name="note"
                required={decision === "rechazado"}
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
              <select id="approved" name="approved" required defaultValue="">
                <option value="" disabled>
                  Seleccionar resultado
                </option>
                <option value="true">
                  Liberar estadías y seguimiento de egresados
                </option>
                <option value="false">Mantener pendiente</option>
              </select>
            </label>
            <label className="field">
              Fundamento u observaciones *
              <textarea
                id="note"
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
                      {app.documents.some(
                        (x) => x.kind === d.id && x.status !== "rechazado",
                      ) ? (
                        <Check size={16} />
                      ) : (
                        <X className="missing" size={16} />
                      )}{" "}
                      {d.name}
                      <span
                        className={
                          app.documents.some(
                            (x) => x.kind === d.id && x.status !== "rechazado",
                          )
                            ? "check-status"
                            : "check-status missing"
                        }
                      >
                        {app.documents.some(
                          (x) => x.kind === d.id && x.status !== "rechazado",
                        )
                          ? "Adjunto"
                          : "Pendiente"}
                      </span>
                    </li>
                  ))}
                </ul>
                {missing.length > 0 && (
                  <Alert type="info">
                    Falta adjuntar o corregir {missing.length} documento(s).
                    Cierra esta ventana y completa la sección Documentos antes
                    de enviar.
                  </Alert>
                )}
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
                <input
                  id="reference"
                  name="reference"
                  required
                  maxLength={150}
                />
              </label>
            )}
            {modal.status === "disponible" && (
              <label className="field">
                Indicaciones de entrega *
                <textarea
                  id="delivery"
                  name="delivery"
                  required
                  maxLength={1000}
                  rows={3}
                />
              </label>
            )}
            {modal.status !== "enviada" && (
              <label className="field">
                Observación{" "}
                {["cancelado", "incompleta", "rechazada", "concluido"].includes(
                  modal.status,
                ) && "*"}
                <textarea
                  id="note"
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
          <BusyButton
            busy={busy}
            disabled={modal.status === "enviada" && missing.length > 0}
            className="button button-primary"
          >
            {type === "upload"
              ? "Guardar documento"
              : modal.status === "enviada"
                ? "Enviar solicitud"
                : type === "review"
                  ? "Guardar dictamen"
                  : type === "clearance"
                    ? "Registrar dictamen"
                    : "Confirmar cambio de estado"}
          </BusyButton>
        </div>
      </form>
    </Modal>
  );
}
