// Al enviar un formulario lo que hace guarda el usuario en AuthContext y se redirige según rol
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

/* ===== Datos editables ===== */
const PERIODO = { nombre: "Sept — Dic 2026", cierre: "12 de diciembre" };

const ROLES = [
  { id: "estudiante", label: "Estudiante", placeholder: "Tu correo institucional", nota: "Tus respuestas son anónimas." },
  { id: "docente", label: "Docente", placeholder: "Tu correo institucional", nota: "Consulta tus resultados y comentarios del periodo." },
  { id: "admin", label: "Dirección", placeholder: "Tu correo institucional", nota: "Reportes y configuración del periodo de evaluación." },
];

/* ===== Iconos ===== */
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

/* ===== Ilustración ===== */
function Ilustracion() {
  const piel = "#f2c4a8";
  const piel2 = "#e2a77e";
  return (
    <svg className="ilustracion" viewBox="0 0 560 430" aria-hidden="true">
      <path
        className="il-blob"
        d="M118 330 C78 220 170 118 292 108 C412 98 506 190 476 300 C456 372 334 402 232 396 C170 392 134 370 118 330 Z"
      />
      <g className="il-blob2">
        <ellipse cx="38" cy="300" rx="38" ry="28" />
        <ellipse cx="84" cy="334" rx="46" ry="34" />
        <ellipse cx="40" cy="354" rx="40" ry="26" />
      </g>
      <path className="il-stem" d="M64 352 L64 262 M64 300 L38 276 M64 312 L92 288" />
      <ellipse className="il-blob2" cx="330" cy="368" rx="210" ry="9" />

      <g className="il-blob3">
        <rect x="196" y="88" width="46" height="38" rx="6" />
        <path d="M212 126 L206 142 L228 126 Z" />
        <rect x="312" y="58" width="48" height="40" rx="6" />
        <path d="M344 98 L352 112 L334 98 Z" />
        <rect x="418" y="38" width="58" height="46" rx="7" />
        <path d="M430 84 L424 100 L448 84 Z" />
      </g>
      <polygon
        fill="#fff"
        points="219,98 221.6,105 229,105.4 223.2,110 225.2,117 219,113 212.8,117 214.8,110 209,105.4 216.4,105"
      />
      <path
        fill="#fff"
        d="M326 82 h5 v11 h-5 z M333 93 V82 l4-10 q3 0 3 3 l-1 5 h8 q3 0 3 3 l-2 8 q-1 3-4 3 z"
      />
      <path d="M434 62 l9 9 l15-17" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

      <g transform="rotate(-5 150 250)">
        <rect className="il-dark" x="78" y="88" width="154" height="304" rx="20" />
        <rect className="il-screen" x="90" y="102" width="130" height="276" rx="12" />
        <rect className="il-dark" x="124" y="88" width="62" height="12" rx="6" />
        <rect className="il-blob" x="100" y="122" width="110" height="14" rx="4" />
        <rect className="il-blob" x="100" y="146" width="80" height="14" rx="4" />
      </g>

      <g>
        <line x1="176" y1="300" x2="160" y2="352" stroke={piel} strokeWidth="8" strokeLinecap="round" />
        <line x1="200" y1="300" x2="214" y2="348" stroke={piel} strokeWidth="8" strokeLinecap="round" />
        <ellipse className="il-red" cx="156" cy="357" rx="10" ry="4" />
        <ellipse className="il-red" cx="217" cy="353" rx="10" ry="4" />
        <path className="il-red" d="M170 236 L202 236 L220 300 L154 300 Z" />
        <path fill="#fff" d="M168 190 Q186 183 204 190 L202 240 L170 240 Z" />
        <line x1="170" y1="198" x2="160" y2="238" stroke={piel} strokeWidth="7" strokeLinecap="round" />
        <line x1="203" y1="198" x2="288" y2="238" stroke={piel} strokeWidth="7" strokeLinecap="round" />
        <ellipse className="il-dark" cx="185" cy="166" rx="16" ry="18" />
        <circle cx="188" cy="172" r="11" fill={piel} />
      </g>

      <g>
        <line className="il-dark-s" x1="310" y1="244" x2="290" y2="340" strokeWidth="20" strokeLinecap="round" />
        <line className="il-dark-s" x1="338" y1="244" x2="364" y2="335" strokeWidth="20" strokeLinecap="round" />
        <rect className="il-dark" x="298" y="232" width="52" height="26" rx="6" />
        <ellipse className="il-acc" cx="284" cy="349" rx="13" ry="5" />
        <ellipse className="il-acc" cx="370" cy="343" rx="13" ry="5" />
        <path className="il-acc" d="M298 174 Q322 165 348 174 L352 242 L296 242 Z" />
        <line className="il-acc-s" x1="300" y1="182" x2="292" y2="238" strokeWidth="9" strokeLinecap="round" />
        <line className="il-acc-s" x1="346" y1="182" x2="394" y2="236" strokeWidth="9" strokeLinecap="round" />
        <circle cx="290" cy="240" r="5.5" fill={piel2} />
        <circle cx="395" cy="238" r="5.5" fill={piel2} />
        <circle className="il-red" cx="322" cy="141" r="17" />
        <circle cx="322" cy="153" r="11" fill={piel2} />
      </g>

      <g>
        <path fill="#f6f0e0" d="M420 194 L454 194 L472 318 L402 318 Z" />
        <path stroke="#e8c872" strokeWidth="2" d="M428 196 L418 316 M438 196 L435 316 M448 196 L453 316" />
        <ellipse className="il-dark" cx="408" cy="322" rx="11" ry="4" />
        <ellipse className="il-dark" cx="468" cy="322" rx="11" ry="4" />
        <path className="il-red" d="M418 160 Q436 154 456 160 L454 198 L420 198 Z" />
        <line x1="420" y1="170" x2="396" y2="238" stroke={piel} strokeWidth="7" strokeLinecap="round" />
        <line x1="454" y1="170" x2="470" y2="130" stroke={piel} strokeWidth="7" strokeLinecap="round" />
        <path className="il-dark" d="M468 120 L502 104 L502 142 L468 132 Z" />
        <rect className="il-dark" x="462" y="122" width="9" height="14" rx="2" />
        <circle className="il-dark" cx="430" cy="112" r="10" />
        <ellipse className="il-dark" cx="436" cy="134" rx="15" ry="16" />
        <circle cx="439" cy="141" r="10" fill={piel} />
      </g>
    </svg>
  );
}

function Login() {
  const [tipo, setTipo] = useState("estudiante");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const rol = ROLES.find((r) => r.id === tipo);

  // Hooks para navegar y acceder al contexto
  const navigate = useNavigate();
  const { login } = useAuth();

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      // Simulación (después va el fetch al backend)
      await new Promise((r) => setTimeout(r, 800));

      // 1. Guarda el usuario en el AuthContext
      login({
        email: email,
        rol: tipo,
      });

      // 2. Navega según el rol
      if (tipo === "estudiante") navigate("/estudiante");
      else if (tipo === "docente") navigate("/docente");
      else if (tipo === "admin") navigate("/direccion");
    } catch {
      setError("Correo o contraseña incorrectos. Revisa que uses tu cuenta @uto.edu.mx.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <section className="login-form-panel">
          <div className="form-container">
            <div className="brand-logo">
              <div className="logo-mark">
                <LogoIcon />
              </div>
              <span className="logo-text">UTO</span>
            </div>

            <h1>Bienvenido de vuelta</h1>

            <div className="role-tabs" role="tablist" aria-label="Tipo de usuario">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={tipo === r.id}
                  className={tipo === r.id ? "active" : ""}
                  onClick={() => setTipo(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button type="button" className="btn-outline">
              <ShieldIcon />
              <span>Acceso con cuenta institucional</span>
            </button>

            <div className="form-divider">
              <span>o inicia con tu correo</span>
            </div>

            <form onSubmit={iniciarSesion}>
              <div className="field">
                <label htmlFor="email" className="sr-only">Correo institucional</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder={rol.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type={verPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setMayusculas(e.getModifierState("CapsLock"))}
                    onBlur={() => setMayusculas(false)}
                    aria-invalid={!!error}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={verPassword}
                  >
                    <EyeIcon off={verPassword} />
                  </button>
                </div>
                {mayusculas && (
                  <p className="aviso" role="status">Bloq Mayús está activado.</p>
                )}
              </div>

              <div className="row-opciones">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                  />
                  <span>Mantener sesión iniciada</span>
                </label>
                <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>

              {error && (
                <div className="error" role="alert">{error}</div>
              )}

              <button type="submit" className="btn-primary" disabled={cargando} aria-busy={cargando}>
                {cargando ? (
                  <span className="cargando" aria-label="Ingresando">
                    <i /><i /><i /><i /><i />
                  </span>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <span className="btn-arrow"><ArrowIcon /></span>
                  </>
                )}
              </button>

              <p className="nota-rol" aria-live="polite">{rol.nota}</p>
            </form>

            <p className="form-footer">
              ¿Problemas para acceder?{" "}
              <a href="mailto:direccion@uto.edu.mx">Contacta a Dirección</a>
            </p>
          </div>
        </section>

        <aside className="login-aside">
          <div className="aviso-periodo">
            <h2>Evaluación docente abierta</h2>
            <p>
              Periodo {PERIODO.nombre}.
              <br />
              Cierra el {PERIODO.cierre}.
            </p>
            <a href="#" className="btn-learn">Más información</a>
          </div>
          <Ilustracion />
        </aside>

        <span className="blob-out" aria-hidden="true" />
      </div>
    </main>
  );
}

export default Login;