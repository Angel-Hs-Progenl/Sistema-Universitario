
import { useMemo, useState } from "react";
import {
  Bar
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

import {
  BarChart3,
  UsersRound,
  ClipboardCheck,
  TrendingUp,
  GraduationCap,
  FilterX,
  Download,
  ShieldCheck
} from "lucide-react";

import {
  PERIODO_DIRECCION,
  MIN_RESPUESTAS_RESULTADOS,
  RESULTADOS_INSTITUCIONALES_DEMO
} from "../../data/direccionMock";

import "./ResultadosDireccion.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const SECCIONES = [
  {
    clave: "desempeno",
    nombre: "Desempeño docente",
    corto: "Desempeño"
  },
  {
    clave: "metodologia",
    nombre: "Metodología y desarrollo de la clase",
    corto: "Metodología"
  },
  {
    clave: "comunicacion",
    nombre: "Atención, comunicación y ambiente",
    corto: "Comunicación"
  }
];

const COLORES = [
  "#6f1738",
  "#a65b78",
  "#b8862b"
];

const formatoNumero = (valor) =>
  valor.toLocaleString("es-MX");

const formatoPromedio = (valor) =>
  valor === null ? "—" : valor.toFixed(2);

const promedioRegistro = (registro) => {
  const valores = SECCIONES.map(
    (seccion) => registro.secciones[seccion.clave]
  );

  return (
    valores.reduce((suma, valor) => suma + valor, 0) /
    valores.length
  );
};

// Promedia considerando cuántas respuestas recibió
// cada asignatura y grupo.
function promedioPonderado(registros, clave = null) {
  const total = registros.reduce(
    (suma, registro) => suma + registro.respuestas,
    0
  );

  if (total === 0) return null;

  const suma = registros.reduce((acumulado, registro) => {
    const valor = clave
      ? registro.secciones[clave]
      : promedioRegistro(registro);

    return acumulado + valor * registro.respuestas;
  }, 0);

  return suma / total;
}

function opcionesGrafica(horizontal = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const valor = horizontal
              ? context.parsed.x
              : context.parsed.y;

            return `Promedio: ${Number(valor).toFixed(2)} / 5`;
          }
        }
      }
    },
    scales: {
      x: {
        min: horizontal ? 0 : undefined,
        max: horizontal ? 5 : undefined,
        grid: {
          display: horizontal,
          color: "#efeee9"
        },
        ticks: {
          color: "#62645f"
        }
      },
      y: {
        min: horizontal ? undefined : 0,
        max: horizontal ? undefined : 5,
        grid: {
          display: !horizontal,
          color: "#efeee9"
        },
        ticks: {
          color: "#62645f"
        }
      }
    }
  };
}

const OPCIONES_SECCIONES = opcionesGrafica();
const OPCIONES_DOCENTES = opcionesGrafica(true);

const UNICO = (valores) =>
  [...new Set(valores)].sort((a, b) =>
    a.localeCompare(b, "es")
  );

export default function ResultadosDireccion() {
  const [filtros, setFiltros] = useState({
    periodo: PERIODO_DIRECCION,
    carrera: "todos",
    docente: "todos",
    grupo: "todos"
  });

  const opcionesPeriodo = UNICO(
    RESULTADOS_INSTITUCIONALES_DEMO.map(
      (registro) => registro.periodo
    )
  );

  const opcionesCarrera = UNICO(
    RESULTADOS_INSTITUCIONALES_DEMO.map(
      (registro) => registro.carrera
    )
  );

  const opcionesDocente = UNICO(
    RESULTADOS_INSTITUCIONALES_DEMO.map(
      (registro) => registro.docente
    )
  );

  const opcionesGrupo = UNICO(
    RESULTADOS_INSTITUCIONALES_DEMO.map(
      (registro) => registro.grupo
    )
  );

  const actualizarFiltro = (campo, valor) => {
    setFiltros((anteriores) => ({
      ...anteriores,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      periodo: PERIODO_DIRECCION,
      carrera: "todos",
      docente: "todos",
      grupo: "todos"
    });
  };

  const registros = useMemo(
    () =>
      RESULTADOS_INSTITUCIONALES_DEMO.filter(
        (registro) =>
          (filtros.periodo === "todos" ||
            registro.periodo === filtros.periodo) &&
          (filtros.carrera === "todos" ||
            registro.carrera === filtros.carrera) &&
          (filtros.docente === "todos" ||
            registro.docente === filtros.docente) &&
          (filtros.grupo === "todos" ||
            registro.grupo === filtros.grupo)
      ),
    [filtros]
  );

  const publicables = useMemo(
    () =>
      registros.filter(
        (registro) =>
          registro.respuestas >= MIN_RESPUESTAS_RESULTADOS
      ),
    [registros]
  );

  const evaluaciones = registros.reduce(
    (total, registro) => total + registro.respuestas,
    0
  );

  const inscritos = registros.reduce(
    (total, registro) => total + registro.inscritos,
    0
  );

  // Tasa por asignación, no porcentaje de estudiantes
  // únicos de la institución.
  const tasaRespuestas =
    inscritos > 0
      ? Math.round((evaluaciones / inscritos) * 100)
      : 0;

  const promedioSeleccion = promedioPonderado(
    publicables
  );

  const docentesEvaluados = new Set(
    publicables.map((registro) => registro.docente)
  ).size;

  const resultadosSecciones = SECCIONES.map(
    (seccion) => ({
      ...seccion,
      promedio: promedioPonderado(
        publicables,
        seccion.clave
      )
    })
  );

  const resultadosDocentes = useMemo(() => {
    const nombres = UNICO(
      publicables.map((registro) => registro.docente)
    );

    return nombres
      .map((nombre) => {
        const delDocente = publicables.filter(
          (registro) => registro.docente === nombre
        );

        return {
          nombre,
          promedio: promedioPonderado(delDocente),
          respuestas: delDocente.reduce(
            (total, registro) =>
              total + registro.respuestas,
            0
          )
        };
      })
      .sort((a, b) => b.promedio - a.promedio);
  }, [publicables]);

  const datosSecciones = {
    labels: resultadosSecciones.map(
      (seccion) => seccion.corto
    ),
    datasets: [
      {
        label: "Promedio",
        data: resultadosSecciones.map(
          (seccion) => seccion.promedio
        ),
        backgroundColor: COLORES,
        borderRadius: 7,
        maxBarThickness: 62
      }
    ]
  };

  const datosDocentes = {
    labels: resultadosDocentes.map(
      (docente) => docente.nombre
    ),
    datasets: [
      {
        label: "Promedio",
        data: resultadosDocentes.map(
          (docente) => docente.promedio
        ),
        backgroundColor: "#6f1738",
        borderRadius: 7,
        maxBarThickness: 46
      }
    ]
  };

  const mayorSeccion = [...resultadosSecciones]
    .filter((seccion) => seccion.promedio !== null)
    .sort((a, b) => b.promedio - a.promedio)[0];

  const menorSeccion = [...resultadosSecciones]
    .filter((seccion) => seccion.promedio !== null)
    .sort((a, b) => a.promedio - b.promedio)[0];

  const exportarCSV = () => {
    const encabezados = [
      "Periodo",
      "Docente",
      "Carrera",
      "Asignatura",
      "Grupo",
      "Inscritos",
      "Respuestas",
      "Promedio",
      "Estado"
    ];

    const filas = registros.map((registro) => {
      const disponible =
        registro.respuestas >= MIN_RESPUESTAS_RESULTADOS;

      return [
        registro.periodo,
        registro.docente,
        registro.carrera,
        registro.asignatura,
        registro.grupo,
        registro.inscritos,
        registro.respuestas,
        disponible
          ? promedioRegistro(registro).toFixed(2)
          : "",
        disponible ? "Con resultado" : "Sin muestra suficiente"
      ];
    });

    // Escapa caracteres para generar un CSV compatible
    // con Excel y evita interpretar texto como fórmulas.
    const escapar = (valor) => {
      let texto = String(valor ?? "");

      if (/^[=+\-@\t\r]/.test(texto)) {
        texto = "'" + texto;
      }

      return `"${texto.replaceAll('"', '""')}"`;
    };

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(escapar).join(","))
      .join("\r\n");

    const archivo = new Blob(
      ["\uFEFF", contenido],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "resultados-docentes-demo.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="ri-page">

      {/* ENCABEZADO */}
      <header className="ri-heading">
        <div>
          <h1>Resultados institucionales</h1>
          <p>
            Consulta y compara los resultados de
            evaluación docente por periodo, carrera,
            profesor y grupo.
          </p>
        </div>

        <button
          type="button"
          className="ri-primary-button"
          onClick={exportarCSV}
          disabled={registros.length === 0}
        >
          <Download size={18} />
          Descargar CSV
        </button>
      </header>

      <p className="ri-demo">
        Datos simulados para probar la interfaz.
        Los cálculos corresponden únicamente a los
        registros de ejemplo incluidos en esta pantalla,
        no a toda la institución.
      </p>

      {/* FILTROS */}
      <section className="ri-panel">
        <div className="ri-panel-header">
          <div>
            <h2>Filtros de consulta</h2>
            <p>
              Selecciona los criterios que deseas analizar.
            </p>
          </div>

          <button
            type="button"
            className="ri-clear-button"
            onClick={limpiarFiltros}
          >
            <FilterX size={17} />
            Limpiar filtros
          </button>
        </div>

        <div className="ri-filters">
          <label className="ri-field">
            <span>Periodo académico</span>
            <select
              value={filtros.periodo}
              onChange={(e) =>
                actualizarFiltro("periodo", e.target.value)
              }
            >
              <option value="todos">Todos los periodos</option>
              {opcionesPeriodo.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </label>

          <label className="ri-field">
            <span>Carrera</span>
            <select
              value={filtros.carrera}
              onChange={(e) =>
                actualizarFiltro("carrera", e.target.value)
              }
            >
              <option value="todos">Todas las carreras</option>
              {opcionesCarrera.map((carrera) => (
                <option key={carrera} value={carrera}>
                  {carrera}
                </option>
              ))}
            </select>
          </label>

          <label className="ri-field">
            <span>Docente</span>
            <select
              value={filtros.docente}
              onChange={(e) =>
                actualizarFiltro("docente", e.target.value)
              }
            >
              <option value="todos">Todos los docentes</option>
              {opcionesDocente.map((docente) => (
                <option key={docente} value={docente}>
                  {docente}
                </option>
              ))}
            </select>
          </label>

          <label className="ri-field">
            <span>Grupo</span>
            <select
              value={filtros.grupo}
              onChange={(e) =>
                actualizarFiltro("grupo", e.target.value)
              }
            >
              <option value="todos">Todos los grupos</option>
              {opcionesGrupo.map((grupo) => (
                <option key={grupo} value={grupo}>
                  {grupo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* INDICADORES */}
      <section className="ri-stats">
        {[
          {
            titulo: "Docentes con resultados",
            valor: docentesEvaluados,
            descripcion: "Con muestra suficiente",
            icono: UsersRound
          },
          {
            titulo: "Evaluaciones recibidas",
            valor: formatoNumero(evaluaciones),
            descripcion: "En la selección",
            icono: ClipboardCheck
          },
          {
            titulo: "Tasa de respuestas",
            valor: `${tasaRespuestas}%`,
            descripcion: "Por asignación académica",
            icono: GraduationCap
          },
          {
            titulo: "Promedio de la selección",
            valor: formatoPromedio(promedioSeleccion),
            descripcion: "Escala de 1 a 5",
            icono: TrendingUp
          }
        ].map((indicador) => {
          const Icono = indicador.icono;

          return (
            <article className="ri-stat" key={indicador.titulo}>
              <div className="ri-stat-top">
                <span>{indicador.titulo}</span>
                <div className="ri-stat-icon">
                  <Icono size={21} />
                </div>
              </div>

              <strong>{indicador.valor}</strong>
              <p>{indicador.descripcion}</p>
            </article>
          );
        })}
      </section>

      {/* GRÁFICAS */}
      <section className="ri-charts">
        <article className="ri-panel">
          <div className="ri-panel-header">
            <div>
              <h2>Promedio por sección</h2>
              <p>
                Comparación de las tres áreas evaluadas
              </p>
            </div>
            <BarChart3 size={20} color="#6f1738" />
          </div>

          {publicables.length > 0 ? (
            <div className="ri-chart">
              <Bar
                data={datosSecciones}
                options={OPCIONES_SECCIONES}
              />
            </div>
          ) : (
            <p className="ri-no-data">
              No hay resultados suficientes para graficar.
            </p>
          )}
        </article>

        <article className="ri-panel">
          <div className="ri-panel-header">
            <div>
              <h2>Comparación entre docentes</h2>
              <p>
                Promedio general según los filtros
              </p>
            </div>
            <UsersRound size={20} color="#6f1738" />
          </div>

          {resultadosDocentes.length > 0 ? (
            <div className="ri-chart">
              <Bar
                data={datosDocentes}
                options={OPCIONES_DOCENTES}
              />
            </div>
          ) : (
            <p className="ri-no-data">
              No hay docentes con resultados disponibles.
            </p>
          )}
        </article>
      </section>

      {/* ANÁLISIS BÁSICO */}
      <section className="ri-insights">
        <article className="ri-insight">
          <span>Sección con mayor promedio</span>
          <strong>
            {mayorSeccion?.nombre || "Sin información"}
          </strong>
          <p>
            {formatoPromedio(
              mayorSeccion?.promedio ?? null
            )} / 5
          </p>
        </article>

        <article className="ri-insight">
          <span>Sección con menor promedio</span>
          <strong>
            {menorSeccion?.nombre || "Sin información"}
          </strong>
          <p>
            {formatoPromedio(
              menorSeccion?.promedio ?? null
            )} / 5
          </p>
        </article>
      </section>

      {/* TABLA */}
      <section className="ri-panel">
        <div className="ri-panel-header">
          <div>
            <h2>Concentrado de evaluaciones</h2>
            <p>
              {registros.length} asignaciones encontradas
            </p>
          </div>
        </div>

        <div className="ri-table-scroll">
          <table className="ri-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Carrera</th>
                <th>Asignatura y grupo</th>
                <th>Respuestas</th>
                <th>Promedio</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ri-empty">
                    No se encontraron resultados
                    con estos filtros.
                  </td>
                </tr>
              ) : (
                registros.map((registro) => {
                  const publicable =
                    registro.respuestas >=
                    MIN_RESPUESTAS_RESULTADOS;

                  return (
                    <tr key={registro.id}>
                      <td>
                        <strong>{registro.docente}</strong>
                        <small>{registro.periodo}</small>
                      </td>

                      <td>{registro.carrera}</td>

                      <td>
                        <strong>{registro.asignatura}</strong>
                        <small>{registro.grupo}</small>
                      </td>

                      <td>
                        {registro.respuestas} de{" "}
                        {registro.inscritos}
                      </td>

                      <td>
                        {publicable
                          ? `${promedioRegistro(registro).toFixed(2)} / 5`
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={
                            publicable
                              ? "ri-badge ri-available"
                              : "ri-badge ri-limited"
                          }
                        >
                          {publicable
                            ? "Disponible"
                            : "Muestra insuficiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ri-privacy">
          <ShieldCheck size={19} />
          <p>
            Los promedios de grupos con menos de{" "}
            {MIN_RESPUESTAS_RESULTADOS} respuestas
            se ocultan en esta demostración.
            No se muestran identidades ni respuestas
            individuales de estudiantes.
          </p>
        </div>
      </section>

      <p className="ri-footer-note">
        Los promedios mostrados se ponderan por número
        de respuestas. La tasa de respuestas mide
        evaluaciones por asignación, no estudiantes
        únicos. Las reglas definitivas de privacidad
        y cálculo deberán aplicarse desde el backend.
      </p>
    </div>
  );
}
