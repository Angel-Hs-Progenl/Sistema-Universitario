import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../../app/Auth";
import { Field, Alert, BusyButton } from "../../shared/ui";
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
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (user.role !== "estudiante")
    return <Alert>El perfil académico corresponde al rol estudiante.</Alert>;
  return (
    <>
      <div className="eyebrow">TU EXPEDIENTE · PASO 01</div>
      <h1>Primero, tus datos.</h1>
      <p className="page-intro">
        Verifica que coincidan con tus documentos oficiales. Los campos con *
        son obligatorios.
      </p>
      <Alert>{error}</Alert>
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
            defaultValue={user.name}
            required
            minLength={3}
            maxLength={150}
            autoComplete="name"
          />
          <Field
            label="Matrícula"
            name="matricula"
            defaultValue={user.profile.matricula}
            required
            pattern="[A-Za-z0-9-]+"
            maxLength={30}
          />
          <Field
            label="CURP"
            name="curp"
            defaultValue={user.profile.curp}
            required
            minLength={18}
            maxLength={18}
            hint="18 caracteres en mayúsculas."
          />
          <Field
            label="Carrera"
            name="carrera"
            defaultValue={user.profile.carrera}
            required
            minLength={3}
            maxLength={150}
          />
          <Field
            label="Generación"
            name="generacion"
            defaultValue={user.profile.generacion}
            placeholder="2022-2026"
            pattern="[0-9]{4}-[0-9]{4}"
            required
          />
          <Field
            label="Teléfono"
            name="telefono"
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
              name="domicilio"
              defaultValue={user.profile.domicilio}
              required
              minLength={10}
              maxLength={400}
              autoComplete="street-address"
              rows={3}
            />
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
