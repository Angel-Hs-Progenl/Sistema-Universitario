import { useState } from "react";
import { UserRound, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/Auth";
import { api } from "../../shared/api";
import { Field, Alert, BusyButton } from "../../shared/ui";
import { ROLES } from "../../../shared/titulacion";

export default function Account() {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const updated = await api("/account", {
        method: "PUT",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setUser(updated);
      setSaved("Nombre visible guardado.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="container account-page">
      <span className="eyebrow">CONFIGURACIÓN DE CUENTA</span>
      <h1>Tu perfil en el portal</h1>
      <p className="page-intro">
        Personaliza el nombre que aparece al abrir tu cuenta. Tus datos
        institucionales se conservan por separado.
      </p>
      <div className="account-settings">
        <section>
          <div className="account-profile-icon">
            <UserRound size={38} strokeWidth={1.3} />
          </div>
          <h2>{user.name}</h2>
          <p>{ROLES[user.role]}</p>
          <dl className="account-data">
            <div>
              <dt>Correo institucional</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Teléfono de acceso</dt>
              <dd>{user.login_phone || "Sin teléfono vinculado"}</dd>
            </div>
            <div>
              <dt>Google Workspace</dt>
              <dd>
                {user.google_linked
                  ? "Cuenta institucional vinculada"
                  : "Sin vincular"}
              </dd>
            </div>
          </dl>
          <p className="muted">
            La vinculación de teléfono y los cambios de correo o rol requieren
            atención del operador autorizado.
          </p>
        </section>
        <form className="panel form-panel" onSubmit={save}>
          <h2>Nombre visible</h2>
          <p className="muted">
            Este nombre es una preferencia del portal; no modifica el nombre de
            tu expediente.
          </p>
          <Alert>{error}</Alert>
          <Alert type="success">{saved}</Alert>
          <Field
            name="display_name"
            label="Cómo quieres aparecer"
            defaultValue={user.display_name || user.name.split(" ")[0]}
            required
            minLength={1}
            maxLength={80}
          />
          <BusyButton busy={busy} className="button button-primary">
            <Save size={16} />
            Guardar perfil
          </BusyButton>
          {user.role === "estudiante" && (
            <Link
              className="text-link account-academic-link"
              to="/titulacion/perfil"
            >
              Revisar datos de mi expediente →
            </Link>
          )}
        </form>
      </div>
    </section>
  );
}
