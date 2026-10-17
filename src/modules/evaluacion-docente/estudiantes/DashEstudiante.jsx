import { useNavigate } from "react-router-dom";
import "./DashEstudiante.css";

/* ===== Datos simulados (después vienen del backend) ===== */
// `avance` (0–100) es opcional: úsalo solo si el sistema guarda evaluaciones a medias.
const ESTUDIANTE_MOCK = {
  nombre: "Miguel",
  apellido: "Merino",
  email: "miguel@uto.edu.mx",
  matricula: "2023030456",
  carrera: "TSU en TI",
  grupo: "A-301",
};

const DOCENTES_MOCK = [
  { id: 1, docente: "Juan Pérez López", asignatura: "Programación Web", grupo: "A-301", evaluado: false, avatar: "JP" },
  { id: 2, docente: "María López Ramírez", asignatura: "Base de Datos", grupo: "A-301", evaluado: true, avatar: "ML" },
  { id: 3, docente: "Carlos Ramírez Sánchez", asignatura: "Redes de Computadoras", grupo: "A-301", evaluado: false, avance: 60, avatar: "CR" },
  { id: 4, docente: "Laura Fernández Cruz", asignatura: "Inglés Técnico", grupo: "A-301", evaluado: false, avatar: "LF" },
  { id: 5, docente: "Roberto Díaz Morales", asignatura: "Matemáticas Discretas", grupo: "A-301", evaluado: true, avatar: "RD" },
];

const PERIODO = {
  nombre: "Sept — Dic 2026",
  cierre: new Date("2026-12-12T23:59:59"),
  cierreTexto: "12 de diciembre",
};

const avanceDe = (d) => (d.evaluado ? 100 : d.avance ?? 0);
const estadoDe = (d) => (d.evaluado ? "evaluado" : avanceDe(d) > 0 ? "curso" : "pendiente");

const ETIQUETA = {
  evaluado: "Evaluado",
  curso: "En curso",
  pendiente: "Sin iniciar",
};

/* ===== Iconos ===== */
const Svg = ({ children, sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Icons = {
  logo: (
    <Svg sw={2}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </Svg>
  ),
  evaluaciones: (
    <Svg>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </Svg>
  ),
  user: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
    </Svg>
  ),
  ayuda: (
    <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </Svg>
  ),
  logout: (
    <Svg>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </Svg>
  ),
  check: (
    <Svg sw={2.8}>
      <path d="m5 13 4.5 4.5L19 7" />
    </Svg>
  ),
  arrow: (
    <Svg sw={2}>
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  ),
  shield: (
    <Svg>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  ),
  calendar: (
    <Svg>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  ),
};

/* ===== Marca de estado: número, anillo o check ===== */
const R = 20;
const C = 2 * Math.PI * R;

function Marca({ estado, valor, n }) {
  if (estado === "curso") {
    return (
      <span className="v3-mark curso" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle className="v3-ring-track" cx="24" cy="24" r={R} />
          <circle
            className="v3-ring-fill"
            cx="24"
            cy="24"
            r={R}
            style={{ "--c": C }}
            strokeDasharray={`${(C * valor) / 100} ${C}`}
            transform="rotate(-90 24 24)"
          />
        </svg>
        <span className="v3-mark-label">{valor}%</span>
      </span>
    );
  }

  return (
    <span className={`v3-mark ${estado}`} aria-hidden="true">
      <span className="v3-mark-label">{estado === "evaluado" ? Icons.check : n}</span>
    </span>
  );
}

/* ===== Componente principal ===== */
function DashEstudianteV3() {
  
const navigate = useNavigate();

const volverAlPortal = () => {
  navigate("/");
};

const evaluar = (id) => {
  navigate(`/evaluacion-docente/estudiante/evaluar/${id}`);
};

  const total = DOCENTES_MOCK.length;
  const evaluados = DOCENTES_MOCK.filter((d) => d.evaluado).length;
  const pendientes = total - evaluados;
  const enProceso = DOCENTES_MOCK.filter((d) => estadoDe(d) === "curso").length;
  const sinIniciar = pendientes - enProceso;
  const terminado = pendientes === 0;
  const progreso = Math.round((evaluados / total) * 100);

  // Primero retomamos lo que quedó a medias; si no, el primer pendiente
  const siguiente =
    DOCENTES_MOCK.find((d) => estadoDe(d) === "curso") ??
    DOCENTES_MOCK.find((d) => !d.evaluado);

  const ahora = new Date();
  const cerrado = ahora > PERIODO.cierre;
  const dias = Math.max(0, Math.ceil((PERIODO.cierre - ahora) / 86400000));
  const puedeEvaluar = !terminado && !cerrado;
  const retomar = siguiente && estadoDe(siguiente) === "curso";

  const iniciales = `${ESTUDIANTE_MOCK.nombre[0]}${ESTUDIANTE_MOCK.apellido[0]}`;

  return (
<div className="v3-page v3-page-embedded">
        {/* ============ SIDEBAR ============ */}

      {/* ============ CONTENIDO ============ */}
      <main className="v3-main">
        <div className="v3-wrap">
          <header className="v3-topbar">
            <div className="v3-mobile-brand">
              <span className="v3-logo">{Icons.logo}</span>
              <span className="v3-brand-text">UTO</span>
            </div>

            <div className="v3-title">
              <h1>Mis evaluaciones</h1>
              <p>
                Hola, {ESTUDIANTE_MOCK.nombre} · Periodo {PERIODO.nombre}
              </p>
            </div>

            <div className="v3-user">
              <div className="v3-user-info">
                <strong>
                  {ESTUDIANTE_MOCK.nombre} {ESTUDIANTE_MOCK.apellido}
                </strong>
                <span>
                  {ESTUDIANTE_MOCK.carrera} · {ESTUDIANTE_MOCK.grupo}
                </span>
              </div>
              <span className="v3-avatar" aria-hidden="true">
                {iniciales}
              </span>
             
<button
  type="button"
  className="v3-logout-mobile"
  onClick={volverAlPortal}
  aria-label="Volver al portal universitario"
>
  {Icons.logout}
</button>

            </div>
          </header>

          {/* ----- Bloque superior: acción + resumen ----- */}
          <section className="v3-top">
            <article className="v3-hero">
              {terminado ? (
                <>
                  <span className="v3-hero-done">{Icons.check}</span>
                  <h2>¡Listo! Terminaste todas tus evaluaciones</h2>
                  <p>Gracias por ayudarnos a mejorar.</p>
                </>
              ) : cerrado ? (
                <>
                  <span className="v3-hero-label">Periodo cerrado</span>
                  <h2>El periodo de evaluación ya terminó</h2>
                  <p>Si crees que es un error, contacta a Dirección.</p>
                </>
              ) : (
                <>
                  <span className="v3-hero-label">
                    {retomar ? "Retoma donde te quedaste" : "Tu siguiente evaluación"}
                  </span>
                  <h2>{siguiente.docente}</h2>
                  <p>
                    {siguiente.asignatura} · {siguiente.grupo}
                  </p>

                  {retomar && (
                    <div className="v3-hero-prog">
                      <div className="v3-bar v3-bar-light">
                        <i style={{ width: `${avanceDe(siguiente)}%` }} />
                      </div>
                      <span>{avanceDe(siguiente)}% completado</span>
                    </div>
                  )}

                  <button type="button" className="v3-cta" onClick={() => evaluar(siguiente.id)}>
                    {retomar ? "Continuar evaluación" : "Comenzar evaluación"}
                    <span className="v3-cta-icon">{Icons.arrow}</span>
                  </button>
                </>
              )}

              <p className="v3-anon">
                <span className="v3-anon-icon">{Icons.shield}</span>
                Tus respuestas son anónimas. Tus docentes no verán quién las envió.
              </p>
            </article>

            <div className="v3-side">
              <article className="v3-stat">
                <span className="v3-stat-label">Tu avance</span>
                <strong className="v3-stat-value">
                  {evaluados}
                  <small> de {total} evaluadas</small>
                </strong>
                <div className="v3-stat-prog">
                  <div
                    className="v3-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progreso}
                    aria-label="Progreso general"
                  >
                    <i style={{ width: `${progreso}%` }} />
                  </div>
                  <span>{progreso}%</span>
                </div>
                <p className="v3-stat-foot">
                  {terminado
                    ? "Completaste todas"
                    : `${enProceso} en curso · ${sinIniciar} sin iniciar`}
                </p>
              </article>

              <article className="v3-stat">
                <span className="v3-stat-label">
                  <span className="v3-stat-icon">{Icons.calendar}</span>
                  Cierre del periodo
                </span>
                <strong className="v3-stat-value">
                  {cerrado ? "Cerrado" : dias}
                  {!cerrado && <small> {dias === 1 ? "día" : "días"}</small>}
                </strong>
                <p className="v3-stat-foot">{PERIODO.cierreTexto}</p>
              </article>
            </div>
          </section>

          {/* ----- Lista de docentes (filas a lo ancho: nombres completos) ----- */}
          <section className="v3-card">
            <div className="v3-card-head">
              <h2>Tus docentes</h2>
              <span>{total} en este periodo</span>
            </div>

            <ul className="v3-list">
              {DOCENTES_MOCK.map((d, i) => {
                const estado = estadoDe(d);
                const esSiguiente = puedeEvaluar && siguiente?.id === d.id;

                return (
                  <li
                    key={d.id}
                    className={`v3-row ${estado}${esSiguiente ? " next" : ""}`}
                  >
                    <Marca estado={estado} valor={avanceDe(d)} n={i + 1} />

                    <div className="v3-info">
                      <strong>{d.docente}</strong>
                      <span>
                        {d.asignatura} · {d.grupo}
                      </span>
                    </div>

                    <div className="v3-actions">
                      {esSiguiente && <span className="v3-tag">Siguiente</span>}
                      <span className={`v3-chip ${estado}`}>{ETIQUETA[estado]}</span>
                      {!d.evaluado && (
                        <button
                          type="button"
                          className="v3-btn"
                          onClick={() => evaluar(d.id)}
                          disabled={cerrado}
                        >
                          {estado === "curso" ? "Continuar" : "Evaluar"}
                          <span className="v3-btn-icon">{Icons.arrow}</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>


    </div>
  );
}

export default DashEstudianteV3;
