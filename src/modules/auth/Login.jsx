import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
  Navigate,
} from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import WelcomeArt from "./WelcomeArt";
import { useAuth } from "../../app/Auth";
import { Alert, Field, BusyButton } from "../../shared/ui";
import { api } from "../../shared/api";
export default function Login() {
  const { login, user } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.target));
      await login(values);
      navigate(location.state?.from || "/", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (user) return <Navigate to={location.state?.from || "/"} replace />;
  return (
    <div className="container auth-layout">
      <aside className="auth-story">
        <span className="section-index">
          UNIVERSIDAD TECNOLÓGICA DE ORIENTAL
        </span>
        <h2>Servicios universitarios</h2>
        <p>Tu espacio para realizar y dar seguimiento a tus trámites.</p>
        <WelcomeArt />
        <span className="welcome-caption">Oriental, Puebla</span>
      </aside>
      <section className="auth-form">
        <span className="eyebrow">ACCESO A TU ESPACIO</span>
        <h1>Iniciar sesión</h1>
        <p>Usa la cuenta que te proporcionó la institución.</p>
        <Alert>{error}</Alert>
        <form onSubmit={submit}>
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="tu.correo@ejemplo.mx"
            autoComplete="username"
            required
            maxLength={254}
          />
          <div className="password-field">
            <Field
              label="Contraseña"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={128}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Link to="/recuperar" className="text-link forgot">
            Olvidé mi contraseña
          </Link>
          <BusyButton
            className="button button-primary full"
            busy={busy}
            busyText="Ingresando…"
          >
            Iniciar sesión <ArrowRight size={18} />
          </BusyButton>
        </form>
        <div className="auth-help">
          ¿Aún no tienes acceso?{" "}
          <Link to="/ayuda">Consulta con Servicios Escolares</Link>.
        </div>
        {import.meta.env.DEV && (
          <details className="demo-help">
            <summary>Cuentas del entorno de desarrollo</summary>
            <p>Solo datos ficticios. Ejecuta el seed para habilitarlas.</p>
            <code>estudiante@demo.uto.local</code>
            <code>escolares@demo.uto.local</code>
            <code>tesoreria@demo.uto.local</code>
            <code>vinculacion@demo.uto.local</code>
            <code>administrador@demo.uto.local</code>
            <p>
              Contraseña: <code>Demo-UTO-2026!</code>
            </p>
          </details>
        )}
      </section>
    </div>
  );
}
export function Recover() {
  const [params] = useSearchParams(),
    token = params.get("token"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.target));
      if (token && values.password !== values.confirm)
        throw new Error("Las contraseñas no coinciden.");
      const result = await api(
        token ? "/auth/reset-password" : "/auth/forgot-password",
        {
          method: "POST",
          body: token ? { token, password: values.password } : values,
        },
      );
      setMessage(result.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="container narrow-page">
      <Link to="/acceso" className="text-link">
        ← Volver al acceso
      </Link>
      <h1>{token ? "Elige una nueva contraseña" : "Recupera tu acceso"}</h1>
      <p>
        {token
          ? "Usa al menos 12 caracteres."
          : "Te enviaremos instrucciones al correo de tu cuenta."}
      </p>
      <Alert>{error}</Alert>
      {message ? (
        <>
          <Alert type="success">{message}</Alert>
          <Link className="button button-primary" to="/acceso">
            Ir al inicio de sesión
          </Link>
        </>
      ) : (
        <form className="panel form-panel" onSubmit={submit}>
          {token ? (
            <>
              <Field
                name="password"
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
              <Field
                name="confirm"
                label="Confirma tu contraseña"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </>
          ) : (
            <Field
              name="email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              required
            />
          )}
          <BusyButton busy={busy} className="button button-primary">
            {token ? "Guardar contraseña" : "Enviar instrucciones"}
          </BusyButton>
        </form>
      )}
    </section>
  );
}
