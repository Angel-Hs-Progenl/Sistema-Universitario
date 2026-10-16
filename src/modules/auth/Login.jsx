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
import {
  Alert,
  Field,
  BusyButton,
  ErrorSummary,
  useAsync,
} from "../../shared/ui";
import { api } from "../../shared/api";
export default function Login() {
  const { login, user } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  const [method, setMethod] = useState("email");
  const options = useAsync(() => api("/auth/options"), []);
  const [params] = useSearchParams();
  const oauthErrors = {
    expired: "El intento de Google venció. Inicia de nuevo desde este portal.",
    cancelled: "Se canceló el acceso con Google. Puedes volver a intentarlo.",
    unavailable: "Google está pendiente de configuración institucional.",
    denied:
      "No se pudo autorizar esa cuenta. Usa Google Workspace de la universidad y una cuenta habilitada en el portal.",
  };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.target));
      await login(values);
      navigate(location.state?.from || "/", { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (user) return <Navigate to={location.state?.from || "/"} replace />;
  return (
    <div className="container auth-layout auth-conversational">
      <aside className="auth-story">
        <a
          className="auth-jump text-link"
          href="#portal-access"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById("portal-access")?.focus();
          }}
        >
          Ir al inicio de sesión <ArrowRight size={16} />
        </a>
        <span className="section-index">
          PORTAL UNIVERSITARIO / UT DE ORIENTAL
        </span>
        <h2>
          Servicios de tu
          <br />
          <span>universidad.</span>
        </h2>
        <p>
          Un espacio para tus trámites, evaluaciones y solicitudes de apoyo.
        </p>
        <p className="welcome-availability">
          Por ahora, Titulación electrónica. Evaluaciones y becas se
          incorporarán por etapas.
        </p>
        <WelcomeArt />
      </aside>
      <section
        className="auth-form"
        id="portal-access"
        tabIndex={-1}
        aria-labelledby="access-title"
      >
        <img
          className="login-azor"
          src="/brand/azor.svg"
          alt=""
          width="38"
          height="38"
        />
        <h1 id="access-title">Continúa en tu portal</h1>
        <p>Para estudiantes y personal de la UT de Oriental.</p>
        <ErrorSummary error={error} title="No se pudo iniciar sesión" />
        <Alert>{oauthErrors[params.get("oauth_error")]}</Alert>
        {options.data?.google_enabled ? (
          <a
            className="google-signin"
            href={`/api/v1/auth/google/start?next=${encodeURIComponent(location.state?.from || "/")}`}
          >
            <img src="/brand/google-g.png" alt="" width="20" height="20" />
            Continuar con Google
          </a>
        ) : (
          <button type="button" className="google-signin" disabled>
            <img src="/brand/google-g.png" alt="" width="20" height="20" />
            {options.loading ? "Consultando acceso…" : "Continuar con Google"}
          </button>
        )}
        <p className="auth-domain">Solo cuentas @utdeoriental.edu.mx</p>
        {!options.loading && !options.data?.google_enabled && (
          <p className="auth-availability">
            {options.error
              ? "No se pudo consultar Google. Puedes entrar con tu cuenta del portal."
              : "Google se habilitará al configurar el acceso institucional."}
          </p>
        )}
        <div className="auth-divider">
          <span>o usa tu cuenta del portal</span>
        </div>
        <div
          className="login-methods"
          role="group"
          aria-label="Forma de acceso"
        >
          <button
            type="button"
            aria-pressed={method === "email"}
            onClick={() => {
              setMethod("email");
              setError("");
            }}
          >
            Correo institucional
          </button>
          <button
            type="button"
            aria-pressed={method === "phone"}
            onClick={() => {
              setMethod("phone");
              setError("");
            }}
          >
            Teléfono vinculado
          </button>
        </div>
        <form onSubmit={submit}>
          <Field
            key={method}
            label={
              method === "email" ? "Correo institucional" : "Teléfono vinculado"
            }
            name="identifier"
            error={error.fields?.find((e) => e.field === "identifier")?.message}
            type={method === "email" ? "email" : "tel"}
            placeholder={
              method === "email"
                ? "Tu cuenta @utdeoriental.edu.mx"
                : "10 dígitos o +código de país"
            }
            hint={
              method === "phone"
                ? "Debe estar vinculado por el operador a tu cuenta institucional."
                : undefined
            }
            autoComplete="username"
            required
            maxLength={254}
          />
          <div className="password-field">
            <Field
              label="Contraseña del portal"
              name="password"
              error={error.fields?.find((e) => e.field === "password")?.message}
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
          ¿Necesitas una cuenta?{" "}
          <Link to="/ayuda">Consulta a Servicios Escolares</Link>.
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
          : "Solicita un enlace para restablecer la contraseña del portal. Usa el correo de tu cuenta institucional."}
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
