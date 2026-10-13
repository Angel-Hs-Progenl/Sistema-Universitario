import { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { Field, Alert, BusyButton, ErrorSummary } from "../../shared/ui";
import { api } from "../../shared/api";
export default function Profile() {
  const { user, setUser } = useAuth(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await api("/profile", {
        method: "PUT",
        body: Object.fromEntries(new FormData(e.target)),
      });
      setUser(result);
      setSuccess("Tus datos se guardaron correctamente.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (user.role !== "estudiante")
    return <Alert>El perfil académico corresponde al rol estudiante.</Alert>;
  return (
    <>
      <div className="eyebrow">TITULACIÓN / INFORMACIÓN ACADÉMICA</div>
      <h1>Datos del egresado</h1>
      <p className="page-intro">
        Verifica que coincidan con tus documentos oficiales. Los campos con *
        son obligatorios.
      </p>
      <ErrorSummary error={error} />
      <Alert type="success">{success}</Alert>
      <form onSubmit={save} className="panel form-panel">
        <div className="panel-heading">
          <h2>Información del egresado</h2>
          <ShieldCheck size={20} />
        </div>
        <div className="form-grid">
          <Field
            label="Nombre completo"
            name="name"
            error={error.fields?.find((e) => e.field === "name")?.message}
            defaultValue={user.name}
            required
            minLength={3}
            maxLength={150}
            autoComplete="name"
          />
          <Field
            label="Matrícula"
            name="matricula"
            error={error.fields?.find((e) => e.field === "matricula")?.message}
            defaultValue={user.profile.matricula}
            required
            pattern="[A-Za-z0-9-]+"
            maxLength={30}
          />
          <Field
            label="CURP"
            name="curp"
            error={error.fields?.find((e) => e.field === "curp")?.message}
            defaultValue={user.profile.curp}
            required
            minLength={18}
            maxLength={18}
            hint="18 caracteres en mayúsculas."
          />
          <Field
            label="Carrera"
            name="carrera"
            error={error.fields?.find((e) => e.field === "carrera")?.message}
            defaultValue={user.profile.carrera}
            required
            minLength={3}
            maxLength={150}
          />
          <Field
            label="Generación"
            name="generacion"
            error={error.fields?.find((e) => e.field === "generacion")?.message}
            defaultValue={user.profile.generacion}
            placeholder="2022-2026"
            pattern="[0-9]{4}-[0-9]{4}"
            required
          />
          <Field
            label="Teléfono"
            name="telefono"
            error={error.fields?.find((e) => e.field === "telefono")?.message}
            type="tel"
            defaultValue={user.profile.telefono}
            required
            autoComplete="tel"
            minLength={10}
            maxLength={20}
          />
          <label className="field span-2">
            Domicilio completo *
            <textarea
              id="domicilio"
              name="domicilio"
              aria-invalid={
                error.fields?.some((e) => e.field === "domicilio") || undefined
              }
              aria-describedby={
                error.fields?.some((e) => e.field === "domicilio")
                  ? "domicilio-error"
                  : undefined
              }
              defaultValue={user.profile.domicilio}
              required
              minLength={10}
              maxLength={400}
              autoComplete="street-address"
              rows={3}
            />
            {error.fields?.find((e) => e.field === "domicilio") && (
              <small className="field-error" id="domicilio-error">
                {error.fields.find((e) => e.field === "domicilio").message}
              </small>
            )}
          </label>
        </div>
        <div className="form-footer">
          <span>Correo de tu cuenta: {user.email}</span>
          <BusyButton busy={busy} className="button button-primary">
            <Save size={16} /> Guardar datos
          </BusyButton>
        </div>
      </form>
    </>
  );
}
