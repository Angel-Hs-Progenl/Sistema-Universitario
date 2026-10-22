import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EvaluarDocente.css";

/* ===== Datos mock ===== */
const DOCENTES_MOCK = [
  { id: 1, docente: "Juan Pérez López", asignatura: "Programación Web", grupo: "A-301", evaluado: false, avatar: "JP" },
  { id: 2, docente: "María López Ramírez", asignatura: "Base de Datos", grupo: "A-301", evaluado: true, avatar: "ML" },
  { id: 3, docente: "Carlos Ramírez Sánchez", asignatura: "Redes de Computadoras", grupo: "A-301", evaluado: false, avance: 60, avatar: "CR" },
  { id: 4, docente: "Laura Fernández Cruz", asignatura: "Inglés Técnico", grupo: "A-301", evaluado: false, avatar: "LF" },
  { id: 5, docente: "Roberto Díaz Morales", asignatura: "Matemáticas Discretas", grupo: "A-301", evaluado: true, avatar: "RD" },
];

const ENCUESTA_MOCK = {
  secciones: [
    {
      id: 1,
      nombre: "Desempeño docente",
      descripcion: "Evalúa el dominio del tema y la práctica docente.",
      preguntas: [
        { id: 101, texto: "El docente domina los temas de la asignatura." },
        { id: 102, texto: "Cumple con el horario establecido de clases." },
        { id: 103, texto: "Presenta el programa de la asignatura al inicio del curso." },
        { id: 104, texto: "Evalúa de forma justa y coherente con lo visto en clase." },
      ],
    },
    {
      id: 2,
      nombre: "Metodología y desarrollo de la clase",
      descripcion: "Cómo enseña y estructura las clases.",
      preguntas: [
        { id: 201, texto: "Explica los temas con claridad." },
        { id: 202, texto: "Utiliza ejemplos prácticos para reforzar el aprendizaje." },
        { id: 203, texto: "Fomenta la participación de los estudiantes." },
        { id: 204, texto: "Relaciona la teoría con la práctica profesional." },
        { id: 205, texto: "Los materiales y recursos didácticos son adecuados." },
      ],
    },
    {
      id: 3,
      nombre: "Atención, comunicación y ambiente",
      descripcion: "Trato al estudiante y clima en el aula.",
      preguntas: [
        { id: 301, texto: "Muestra disposición para resolver dudas." },
        { id: 302, texto: "Trata a los estudiantes con respeto." },
        { id: 303, texto: "Genera un ambiente de confianza en el aula." },
        { id: 304, texto: "Da retroalimentación oportuna de las actividades." },
      ],
    },
  ],
};

const PERIODO = "Sept — Dic 2026";

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
  arrow: (
    <Svg sw={2}>
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  ),
  check: (
    <Svg sw={2.6}>
      <path d="m5 13 4.5 4.5L19 7" />
    </Svg>
  ),
  alert: (
    <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </Svg>
  ),
  shield: (
    <Svg>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  ),
  message: (
    <Svg>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </Svg>
  ),
  chevron: (
    <Svg sw={2}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  ),
};

/* ===== Componente ===== */
function EvaluarDocente() {
  const parametros = useParams();
  // Compatible con rutas que utilicen :id o :docenteId.
  const docenteId = parametros.docenteId ?? parametros.id;
  const navigate = useNavigate();

  const docente = useMemo(
    () => DOCENTES_MOCK.find((d) => d.id === Number(docenteId)),
    [docenteId]
  );

  const [respuestas, setRespuestas] = useState({});
  const [comentario, setComentario] = useState("");
  const [errores, setErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);

  if (!docente) {
    return (
      <div className="ef-page">
        <div className="ef-empty">
          <h2>Docente no encontrado</h2>
          <button className="ef-btn ef-btn-primary" onClick={() => navigate("/evaluacion-docente/estudiante")}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (docente.evaluado) {
    return (
      <div className="ef-page">
        <div className="ef-empty">
          <div className="ef-empty-icon">{Icons.check}</div>
          <h2>Ya evaluaste a este docente</h2>
          <p>Solo se permite una evaluación por docente.</p>
          <button className="ef-btn ef-btn-primary" onClick={() => navigate("/evaluacion-docente/estudiante")}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const totalPreguntas = ENCUESTA_MOCK.secciones.reduce((a, s) => a + s.preguntas.length, 0);
  const respondidas = Object.keys(respuestas).length;
  const progreso = Math.round((respondidas / totalPreguntas) * 100);

  const seleccionar = (preguntaId, valor) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
    setErrores((prev) => prev.filter((id) => id !== preguntaId));
  };

  const enviar = (e) => {
    e.preventDefault();

    const faltantes = [];
    ENCUESTA_MOCK.secciones.forEach((s) => {
      s.preguntas.forEach((p) => {
        if (!respuestas[p.id]) faltantes.push(p.id);
      });
    });

    if (faltantes.length > 0) {
      setErrores(faltantes);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setEnviando(true);
    setTimeout(() => {
      console.log("Evaluación enviada:", { docente: docente.docente, respuestas, comentario });
      alert(`¡Gracias! Tu evaluación de ${docente.docente} fue registrada.`);
      navigate("/evaluacion-docente/estudiante");
    }, 800);
  };

  const cancelar = () => {
    if (respondidas > 0 || comentario) {
      if (!window.confirm("¿Seguro que quieres salir? Perderás tus respuestas.")) {
        return;
      }
    }
    navigate("/evaluacion-docente/estudiante");
  };

  return (
    <div className="ef-page">
      {/* ============ HEADER ============ */}
      <header className="ef-header">
        <div className="ef-header-inner">
          <div className="ef-header-left">
            <button className="ef-back" onClick={cancelar}>
              <span className="ef-back-icon">{Icons.arrowLeft}</span>
            </button>

            <div className="ef-header-info">
              <div className="ef-breadcrumb">
                <span>Evaluaciones</span>
                <span className="ef-breadcrumb-sep">/</span>
                <span className="ef-breadcrumb-active">{docente.docente}</span>
              </div>
              <div className="ef-header-meta">
                <span>ID: {String(docente.id).padStart(4, "0")}</span>
                <span>·</span>
                <span>{totalPreguntas} preguntas</span>
                <span>·</span>
                <span>Período {PERIODO}</span>
              </div>
            </div>
          </div>

          <div className="ef-header-right">
            <div className="ef-progress-mini">
              <span>{respondidas} / {totalPreguntas}</span>
              <div className="ef-progress-bar-mini">
                <i style={{ width: `${progreso}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main className="ef-main">
        <div className="ef-wrap">
          {/* Info superior */}
          <div className="ef-info">
            <h1>Encuesta de Evaluación Docente</h1>
            <p>
              Selecciona una opción del <strong>1 al 5</strong> en cada pregunta. Tus respuestas son{" "}
              <strong>anónimas y confidenciales</strong>.
            </p>
          </div>

          {/* Errores */}
          {errores.length > 0 && (
            <div className="ef-error-box">
              <span className="ef-error-icon">{Icons.alert}</span>
              <div>
                <strong>Faltan {errores.length} preguntas por responder</strong>
                <p>Marca una opción en cada pregunta antes de enviar.</p>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={enviar}>
            {/* Docente evaluado */}
            <div className="ef-target">
              <div className="ef-target-avatar">{docente.avatar}</div>
              <div className="ef-target-info">
                <span className="ef-target-label">EVALUANDO A</span>
                <strong>{docente.docente}</strong>
                <span>{docente.asignatura} · Grupo {docente.grupo}</span>
              </div>
            </div>

            {/* Secciones */}
            {ENCUESTA_MOCK.secciones.map((seccion, idx) => (
              <section key={seccion.id} className="ef-seccion">
                <header className="ef-seccion-head">
                  <div className="ef-seccion-num">{String(idx + 1).padStart(2, "0")}</div>
                  <div>
                    <h2>{seccion.nombre}</h2>
                    <p>{seccion.descripcion}</p>
                  </div>
                </header>

                <div className="ef-preguntas">
                  {seccion.preguntas.map((pregunta, pIdx) => {
                    const tieneError = errores.includes(pregunta.id);
                    return (
                      <div
                        key={pregunta.id}
                        className={`ef-pregunta ${tieneError ? "error" : ""}`}
                      >
                        <div className="ef-pregunta-head">
                          <span className="ef-pregunta-num">
                            {idx + 1}.{pIdx + 1}
                          </span>
                          <span className="ef-pregunta-type">Obligatoria</span>
                        </div>

                        <p className="ef-pregunta-texto">{pregunta.texto}</p>

                        <div className="ef-escala">
                          {[1, 2, 3, 4, 5].map((valor) => (
                            <button
                              key={valor}
                              type="button"
                              className={`ef-opcion ${
                                respuestas[pregunta.id] === valor ? "activo" : ""
                              }`}
                              onClick={() => seleccionar(pregunta.id, valor)}
                            >
                              <span className="ef-opcion-num">{valor}</span>
                              <span className="ef-opcion-label">
                                {valor === 1 && "Muy deficiente"}
                                {valor === 2 && "Deficiente"}
                                {valor === 3 && "Regular"}
                                {valor === 4 && "Bueno"}
                                {valor === 5 && "Excelente"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Comentarios */}
            <section className="ef-seccion">
              <header className="ef-seccion-head">
                <div className="ef-seccion-num">
                  <span className="ef-seccion-icon">{Icons.message}</span>
                </div>
                <div>
                  <h2>Comentarios (opcional)</h2>
                  <p>Puedes escribir sugerencias o aspectos importantes. Es anónimo.</p>
                </div>
              </header>

              <textarea
                className="ef-textarea"
                placeholder="Escribe aquí tus comentarios..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <div className="ef-textarea-counter">
                {comentario.length} / 1000 caracteres
              </div>
            </section>

            {/* Aviso anonimato */}
            <div className="ef-anon">
              <span className="ef-anon-icon">{Icons.shield}</span>
              <p>Tus respuestas son anónimas. El docente no sabrá quién lo evaluó.</p>
            </div>

            {/* Acciones */}
            <div className="ef-acciones">
              <button
                type="button"
                className="ef-btn ef-btn-secondary"
                onClick={cancelar}
                disabled={enviando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="ef-btn ef-btn-primary"
                disabled={enviando}
              >
                {enviando ? (
                  "Enviando..."
                ) : (
                  <>
                    Enviar evaluación
                    <span className="ef-btn-icon">{Icons.check}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EvaluarDocente;