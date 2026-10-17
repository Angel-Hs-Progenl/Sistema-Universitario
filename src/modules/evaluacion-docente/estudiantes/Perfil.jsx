
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

/* ===== Datos de ejemplo ===== */
const ESTUDIANTE_MOCK = {
  nombre: "Miguel",
  apellido: "Merino",
  email: "miguel@uto.edu.mx",
  matricula: "2023030456",
  carrera: "TSU en TI",
  grupo: "A-301",
  cuatrimestre: "5to",
  turno: "Matutino",
  tutor: "Mtra. Ana Ruiz Mendoza",
};

/* ===== Iconos ===== */
const Svg = ({ children, sw = 1.8 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
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

  user: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
    </Svg>
  ),
};

/* ===== Componente principal ===== */
function Perfil() {
  const navigate = useNavigate();

  const iniciales =
    `${ESTUDIANTE_MOCK.nombre[0]}${ESTUDIANTE_MOCK.apellido[0]}`;

  const datos = [
    {
      label: "Nombre completo",
      value:
        `${ESTUDIANTE_MOCK.nombre} ${ESTUDIANTE_MOCK.apellido}`,
    },
    {
      label: "Matrícula",
      value: ESTUDIANTE_MOCK.matricula,
    },
    {
      label: "Correo institucional",
      value: ESTUDIANTE_MOCK.email,
    },
    {
      label: "Carrera",
      value: ESTUDIANTE_MOCK.carrera,
    },
    {
      label: "Grupo",
      value: ESTUDIANTE_MOCK.grupo,
    },
    {
      label: "Cuatrimestre",
      value: ESTUDIANTE_MOCK.cuatrimestre,
    },
    {
      label: "Turno",
      value: ESTUDIANTE_MOCK.turno,
    },
    {
      label: "Tutor asignado",
      value: ESTUDIANTE_MOCK.tutor,
    },
  ];

  return (
    <div className="pf-page pf-page-embedded">
      <div className="pf-main">
        <div className="pf-wrap">

          {/* ENCABEZADO */}
          <header className="pf-header">
            <button
              type="button"
              className="pf-back"
              onClick={() =>
                navigate("/evaluacion-docente/estudiante")
              }
            >
              <span className="pf-back-icon">
                {Icons.arrowLeft}
              </span>
              Volver
            </button>

            <h1>Mi perfil</h1>
            <p>
              Información institucional registrada
              en el sistema
            </p>
          </header>

          {/* TARJETA DEL PERFIL */}
          <section className="pf-card">

            <div className="pf-card-head">
              <div className="pf-avatar">
                {iniciales}
              </div>

              <div className="pf-avatar-info">
                <h2>
                  {ESTUDIANTE_MOCK.nombre}{" "}
                  {ESTUDIANTE_MOCK.apellido}
                </h2>

                <span>
                  {ESTUDIANTE_MOCK.carrera}
                </span>

                <span className="pf-avatar-matricula">
                  Matrícula {ESTUDIANTE_MOCK.matricula}
                </span>
              </div>
            </div>

            {/* DATOS DEL ESTUDIANTE */}
            <dl className="pf-data">
              {datos.map((d) => (
                <div
                  key={d.label}
                  className="pf-data-row"
                >
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>

            {/* NOTA INFORMATIVA */}
            <div className="pf-note">
              <span className="pf-note-icon">
                {Icons.user}
              </span>

              <div>
                <strong>
                  ¿Necesitas actualizar tus datos?
                </strong>

                <p>
                  Contacta a Dirección Académica:{" "}
                  <a href="mailto:direccion@uto.edu.mx">
                    direccion@uto.edu.mx
                  </a>
                </p>
              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
