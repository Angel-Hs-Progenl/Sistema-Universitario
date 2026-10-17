import { useNavigate } from "react-router-dom";
import "./MisEvaluaciones.css";

/* ===== Datos mock (después del backend) ===== */
const EVALUACIONES_MOCK = [
  {
    id: 1,
    docente: "María López Ramírez",
    asignatura: "Base de Datos",
    grupo: "A-301",
    avatar: "ML",
    fecha: "12 de octubre, 2026",
    promedio: 4.5,
  },
  {
    id: 2,
    docente: "Roberto Díaz Morales",
    asignatura: "Matemáticas Discretas",
    grupo: "A-301",
    avatar: "RD",
    fecha: "10 de octubre, 2026",
    promedio: 3.8,
  },
];

/* ===== Iconos ===== */
const Svg = ({ children, sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const Icons = {
  arrowLeft: (
    <Svg sw={2}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Svg>
  ),
  check: (
    <Svg sw={2.6}>
      <path d="m5 13 4.5 4.5L19 7" />
    </Svg>
  ),
  calendar: (
    <Svg>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  ),
  star: (
    <Svg>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </Svg>
  ),
  empty: (
    <Svg>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </Svg>
  ),
};

function colorPromedio(p) {
  if (p >= 4.5) return "excelente";
  if (p >= 4.0) return "bueno";
  if (p >= 3.5) return "regular";
  return "bajo";
}

function MisEvaluaciones() {
  const navigate = useNavigate();

  const total = EVALUACIONES_MOCK.length;
  const promedio =
    total > 0
      ? EVALUACIONES_MOCK.reduce((acc, e) => acc + e.promedio, 0) / total
      : 0;

  return (
<div className="me-page me-page-embedded">
        
      {/* ============ MAIN ============ */}
      <main className="me-main">
        <div className="me-wrap">
          {/* Header */}
          <header className="me-header">
<button
  type="button"
  className="me-back"
  onClick={() => navigate("/evaluacion-docente/estudiante")}
>              <span className="me-back-icon">{Icons.arrowLeft}</span>
              Volver
            </button>

            <h1>Mis evaluaciones enviadas</h1>
            <p>Historial de evaluaciones que has completado</p>
          </header>

          {/* Resumen */}
          <section className="me-summary">
            <div className="me-summary-card">
              <span className="me-summary-icon me-summary-icon-purple">
                {Icons.empty}
              </span>
              <div>
                <span className="me-summary-label">Total enviadas</span>
                <strong className="me-summary-value">{total}</strong>
              </div>
            </div>

            <div className="me-summary-card">
              <span className="me-summary-icon me-summary-icon-gold">
                {Icons.star}
              </span>
              <div>
                <span className="me-summary-label">Promedio que diste</span>
                <strong className="me-summary-value">
                  {promedio.toFixed(2)}
                  <small>/ 5.00</small>
                </strong>
              </div>
            </div>
          </section>

          {/* Lista */}
          <section className="me-list">
            {EVALUACIONES_MOCK.length === 0 ? (
              <div className="me-empty">
                <div className="me-empty-icon">{Icons.empty}</div>
                <h2>Aún no has enviado evaluaciones</h2>
                <p>Cuando completes una evaluación aparecerá aquí.</p>
              </div>
            ) : (
              EVALUACIONES_MOCK.map((ev) => (
                <article key={ev.id} className="me-card">
                  <div className="me-card-avatar">{ev.avatar}</div>

                  <div className="me-card-info">
                    <strong>{ev.docente}</strong>
                    <span>
                      {ev.asignatura} · Grupo {ev.grupo}
                    </span>
                    <span className="me-card-date">
                      <span className="me-card-date-icon">{Icons.calendar}</span>
                      Enviada el {ev.fecha}
                    </span>
                  </div>

                  <div className="me-card-action">
                    <span className="me-card-label">Tu promedio</span>
                    <span className={`me-card-score ${colorPromedio(ev.promedio)}`}>
                      {ev.promedio.toFixed(2)}
                    </span>
                  </div>

                  <div className="me-card-badge">
                    <span className="me-card-check">{Icons.check}</span>
                    Completada
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MisEvaluaciones;