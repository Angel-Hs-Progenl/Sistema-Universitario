import React, { useState } from "react";
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  Heart,
  UserCheck,
  Info,
} from "lucide-react";
import { api } from "../../shared/api";
import { Field, BusyButton, Alert } from "../../shared/ui";
import {
  CARRERAS_UTO,
  NIVELES_ESTUDIO,
  CUATRIMESTRES_DEFAULT,
  SISTEMAS_ESTUDIO,
} from "../../../shared/becas";
import Anexo1Modal from "./Anexo1Modal";

export default function FormularioSolicitudUTO({ call, user, onSuccess, onCancel }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAnexoModal, setShowAnexoModal] = useState(false);

  // A. Datos Generales
  const nameParts = (user?.name || "").trim().split(" ");
  const [paterno, setPaterno] = useState(nameParts[1] || "");
  const [materno, setMaterno] = useState(nameParts.slice(2).join(" ") || "");
  const [nombres, setNombres] = useState(nameParts[0] || "");
  const [gender, setGender] = useState("Mujer");
  const [studyLevel, setStudyLevel] = useState("Técnico Superior Universitario");
  const [major, setMajor] = useState(user?.profile?.carrera || CARRERAS_UTO[0]);
  const [matricula, setMatricula] = useState(user?.profile?.matricula || user?.email?.split("@")[0]?.toUpperCase() || "");
  const [curp, setCurp] = useState(user?.profile?.curp || "");
  const [phone, setPhone] = useState(user?.profile?.telefono || "");
  const [gpa, setGpa] = useState("");
  const [academicTerm, setAcademicTerm] = useState(CUATRIMESTRES_DEFAULT[0]);

  // B. Sistema y Bifurcación
  const isAlimenticia = call.modalidad === "alimenticia";
  const [studySystem, setStudySystem] = useState("presencial");

  // Documentos base y específicos (Archivos File)
  const [fileNoAdeudo, setFileNoAdeudo] = useState(null);
  const [fileKardex, setFileKardex] = useState(null);
  const [fileConstanciaCoord, setFileConstanciaCoord] = useState(null);
  const [fileAnexo1, setFileAnexo1] = useState(null);
  const [fileIngresos, setFileIngresos] = useState(null);
  const [fileDiscapacidad, setFileDiscapacidad] = useState(null);
  const [fileIndigena, setFileIndigena] = useState(null);
  const [fileValoracionMedica, setFileValoracionMedica] = useState(null);
  const [fileActaNacimiento, setFileActaNacimiento] = useState(null);
  const [fileConstanciaRH, setFileConstanciaRH] = useState(null);

  // Estudio Socioeconómico Completo
  const [edad, setEdad] = useState("20");
  const [estadoCivil, setEstadoCivil] = useState("Soltero(a)");
  const [hasDiscapacidad, setHasDiscapacidad] = useState("No");
  const [tipoDiscapacidad, setTipoDiscapacidad] = useState("");
  const [hasIndigena, setHasIndigena] = useState("No");
  const [grupoIndigena, setGrupoIndigena] = useState("");
  const [lenguaIndigena, setLenguaIndigena] = useState("");

  const [domicilioCalle, setDomicilioCalle] = useState("");
  const [domicilioColonia, setDomicilioColonia] = useState("");
  const [domicilioMunicipio, setDomicilioMunicipio] = useState("Oriental");
  const [domicilioEstado, setDomicilioEstado] = useState("Puebla");
  const [domicilioCP, setDomicilioCP] = useState("75020");
  const [domicilioReferencia, setDomicilioReferencia] = useState("");

  // Padres / Tutores
  const [padreNombre, setPadreNombre] = useState("");
  const [padreVive, setPadreVive] = useState("Sí");
  const [padreEstudios, setPadreEstudios] = useState("Secundaria");
  const [madreNombre, setMadreNombre] = useState("");
  const [madreVive, setMadreVive] = useState("Sí");
  const [madreEstudios, setMadreEstudios] = useState("Secundaria");

  // Datos Socioeconómicos / Anexo 1
  const [dependeDe, setDependeDe] = useState("Padres");
  const [dependeParentesco, setDependeParentesco] = useState("Padre / Madre");
  const [dependeOcupacion, setDependeOcupacion] = useState("Empleado(a)");
  const [ingresoMensual, setIngresoMensual] = useState("4500");
  const [numDependientes, setNumDependientes] = useState("4");
  const [tipoVivienda, setTipoVivienda] = useState("Propia");
  const [techoMaterial, setTechoMaterial] = useState("Concreto / Losa");
  const [pisoMaterial, setPisoMaterial] = useState("Cemento firme / Mosaico");
  const [cuartosDormir, setCuartosDormir] = useState("2");
  const [combustibleCocinar, setCombustibleCocinar] = useState("Gas LP");
  const [bienesHogar, setBienesHogar] = useState(["Refrigerador", "Estufa", "Internet"]);
  const [serviciosCasa, setServiciosCasa] = useState(["Agua potable", "Luz eléctrica", "Drenaje"]);
  const [rubrosGastos, setRubrosGastos] = useState(["Alimentación", "Luz", "Gas", "Transporte"]);
  const [totalGastos, setTotalGastos] = useState("4200");
  const [enfermedadesFamilia, setEnfermedadesFamilia] = useState("Ninguna");

  // Empleo, Hijos, Becas externas
  const [trabajaActualmente, setTrabajaActualmente] = useState("No");
  const [trabajoDetalles, setTrabajoDetalles] = useState("");
  const [tieneHijos, setTieneHijos] = useState("No");
  const [hijosDetalles, setHijosDetalles] = useState("");
  const [tieneBecaExterna, setTieneBecaExterna] = useState("No");
  const [becaExternaDetalles, setBecaExternaDetalles] = useState("");

  // Transporte
  const [transporteRuta, setTransporteRuta] = useState("Ruta Oriental - Centro");
  const [transporteDiario, setTransporteDiario] = useState("30");
  const [transporteTiempoMin, setTransporteTiempoMin] = useState("35");
  const [transporteComentarios, setTransporteComentarios] = useState("");

  // C. 3 Secciones Finales Obligatorias
  const [aceptoReglamento, setAceptoReglamento] = useState(false);
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);
  const [tratoDiscriminatorio, setTratoDiscriminatorio] = useState("No");
  const [tratoDetalles, setTratoDetalles] = useState("");

  // Encuesta de Satisfacción (Escala 1 a 5)
  const [satisfaccion1, setSatisfaccion1] = useState("5");
  const [satisfaccion2, setSatisfaccion2] = useState("5");
  const [satisfaccion3, setSatisfaccion3] = useState("5");
  const [satisfaccion4, setSatisfaccion4] = useState("5");
  const [satisfaccion5, setSatisfaccion5] = useState("5");
  const [satisfaccionComentarios, setSatisfaccionComentarios] = useState("");

  // Filtro de carreras habilitadas por la convocatoria si aplica
  const activeCareers =
    call.carreras_habilitadas && call.carreras_habilitadas.length > 0
      ? call.carreras_habilitadas
      : CARRERAS_UTO;

  // Cuatrimestres configurados por la convocatoria
  const activeTerms =
    call.cuatrimestres_habilitados && call.cuatrimestres_habilitados.length > 0
      ? call.cuatrimestres_habilitados
      : CUATRIMESTRES_DEFAULT;

  // Validaciones del formulario según modalidad
  function validateForm() {
    const numericGpa = Number(gpa);
    if (!numericGpa || numericGpa < 6.0 || numericGpa > 10.0) {
      return "Captura un promedio válido entre 6.00 y 10.00.";
    }

    if (call.modalidad === "academica" && numericGpa < 9.70) {
      return "La Beca Académica requiere un promedio mínimo de 9.70 en el cuatrimestre anterior evaluado.";
    }

    if (call.modalidad === "escasos_recursos" && numericGpa < 8.50) {
      return "La Beca de Escasos Recursos Económicos requiere un promedio mínimo de 8.50.";
    }

    if (!fileNoAdeudo) {
      return "Es obligatorio adjuntar la Constancia de No Adeudo de Tesorería en formato PDF (máximo 1 MB).";
    }

    if (call.modalidad === "academica" && !fileKardex) {
      return "Es obligatorio adjuntar tu Kárdex oficial de calificaciones.";
    }

    if (studySystem === "mixto" && !fileConstanciaCoord) {
      return "Los estudiantes de sistema Mixto (Híbrido) deben adjuntar la Constancia laboral entregada a su Coordinador.";
    }

    if (call.modalidad === "escasos_recursos") {
      if (!fileAnexo1) {
        return "Es obligatorio adjuntar el Anexo 1 (Carta bajo protesta de decir verdad) debidamente firmada con tinta azul.";
      }
      if (studySystem === "mixto" && !fileIngresos) {
        return "En modalidad Mixta de Escasos Recursos es obligatorio adjuntar el comprobante mensual de ingresos (nómina o constancia).";
      }
    }

    if (call.modalidad === "alimenticia" && !fileValoracionMedica) {
      return "Es obligatorio adjuntar la Valoración médica expedida por el área de Enfermería de la UTO.";
    }

    if (call.modalidad === "hijos_personal") {
      if (!fileActaNacimiento || !fileConstanciaRH) {
        return "Debes adjuntar el Acta de nacimiento y la Constancia laboral emitida por Recursos Humanos de la UTO.";
      }
    }

    if (!aceptoReglamento) {
      return "Debes aceptar la protesta de decir verdad y la reglamentación institucional de la Universidad.";
    }

    if (!aceptoPrivacidad) {
      return "Debes aceptar el Aviso de Privacidad institucional.";
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const valError = validateForm();
    if (valError) {
      setError(valError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Estructura de respuestas y estudio socioeconómico en custom_answers
      const customAnswers = {
        apellido_paterno: paterno,
        apellido_materno: materno,
        nombres: nombres,
        sexo: gender,
        nivel_estudios: studyLevel,
        telefono_celular: phone,
        curp: curp,
        sistema_estudio: isAlimenticia ? "presencial" : studySystem,
        cuatrimestre_cursar: academicTerm,
        promedio_evaluado: Number(gpa),
        edad: edad,
        estado_civil: estadoCivil,
        discapacidad: {
          tiene: hasDiscapacidad === "Sí",
          tipo: tipoDiscapacidad,
        },
        origen_indigena: {
          pertenece: hasIndigena === "Sí",
          grupo: grupoIndigena,
          lengua: lenguaIndigena,
        },
        domicilio: {
          calle: domicilioCalle,
          colonia: domicilioColonia,
          municipio: domicilioMunicipio,
          estado: domicilioEstado,
          cp: domicilioCP,
          referencia: domicilioReferencia,
        },
        padres: {
          padre: { nombre: padreNombre, vive: padreVive === "Sí", estudios: padreEstudios },
          madre: { nombre: madreNombre, vive: madreVive === "Sí", estudios: madreEstudios },
        },
        anexo1: {
          depende_de: dependeDe,
          parentesco: dependeParentesco,
          ocupacion: dependeOcupacion,
          ingreso_familiar_mensual: Number(ingresoMensual),
          dependientes_conteo: Number(numDependientes),
          gastos_familiares_mensuales: Number(totalGastos),
          transporte_diario: Number(transporteDiario),
        },
        vivienda: {
          tipo: tipoVivienda,
          techo: techoMaterial,
          piso: pisoMaterial,
          cuartos_dormir: cuartosDormir,
          combustible: combustibleCocinar,
          bienes: bienesHogar,
          servicios: serviciosCasa,
          rubros_gastos: rubrosGastos,
          enfermedades: enfermedadesFamilia,
        },
        empleo: { trabaja: trabajaActualmente === "Sí", detalles: trabajoDetalles },
        hijos: { tiene: tieneHijos === "Sí", detalles: hijosDetalles },
        beca_externa: { tiene: tieneBecaExterna === "Sí", detalles: becaExternaDetalles },
        transporte: {
          ruta: transporteRuta,
          costo_diario: Number(transporteDiario),
          tiempo_minutos: Number(transporteTiempoMin),
          comentarios: transporteComentarios,
        },
        declaraciones: {
          acepta_protesta_reglamento: aceptoReglamento,
          acepta_aviso_privacidad: aceptoPrivacidad,
          trato_discriminatorio: { recibio: tratoDiscriminatorio === "Sí", detalles: tratoDetalles },
        },
        encuesta_satisfaccion: {
          difusion_bases: Number(satisfaccion1),
          proceso_registro: Number(satisfaccion2),
          tiempos_atencion: Number(satisfaccion3),
          trato_respetuoso: Number(satisfaccion4),
          satisfaccion_general: Number(satisfaccion5),
          comentarios: satisfaccionComentarios,
        },
      };

      // 2. Crear solicitud en el backend
      const resApp = await api("/becas/solicitudes", {
        method: "POST",
        body: {
          call_id: call.id,
          gpa: Number(gpa),
          academic_term: academicTerm,
          major: major,
          study_system: isAlimenticia ? "presencial" : studySystem,
          study_level: studyLevel,
          phone: phone,
          curp: curp,
          gender: gender,
          custom_answers: customAnswers,
        },
      });

      const appId = resApp.id;

      // 3. Cargar archivos adjuntos obligatorios y condicionales
      const uploadMap = [
        { file: fileNoAdeudo, kind: "no_adeudo" },
        { file: fileKardex, kind: "kardex" },
        { file: fileConstanciaCoord, kind: "constancia_laboral_coordinador" },
        { file: fileAnexo1, kind: "anexo1_protesta" },
        { file: fileIngresos, kind: "comprobante_ingresos" },
        { file: fileDiscapacidad, kind: "constancia_discapacidad" },
        { file: fileIndigena, kind: "constancia_indigena" },
        { file: fileValoracionMedica, kind: "valoracion_medica" },
        { file: fileActaNacimiento, kind: "acta_nacimiento" },
        { file: fileConstanciaRH, kind: "constancia_laboral_rh" },
      ];

      for (const item of uploadMap) {
        if (item.file) {
          const fd = new FormData();
          fd.append("kind", item.kind);
          fd.append("file", item.file);
          await api(`/becas/solicitudes/${appId}/documentos`, {
            method: "POST",
            body: fd,
          });
        }
      }

      onSuccess(resApp);
    } catch (err) {
      setError(err.message || "Ocurrió un error al registrar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  // Prellenado para generar el Anexo 1
  const anexo1PreviewData = {
    student: {
      name: `${nombres} ${paterno} ${materno}`.trim() || user?.name,
      matricula: matricula,
      major: major,
      academic_term: academicTerm,
      curp: curp,
    },
    call: {
      periodo: call.periodo_actual || "septiembre - diciembre 2026",
      title: call.title,
    },
    anexo1_data: {
      depende_de: dependeDe,
      parentesco: dependeParentesco,
      ocupacion: dependeOcupacion,
      ingreso_mensual: Number(ingresoMensual) || 0,
      personas_dependientes: Number(numDependientes) || 1,
      gastos_mensuales: Number(totalGastos) || 0,
      transporte_diario: Number(transporteDiario) || 0,
    },
  };

  const showSocioeconomicSection = call.modalidad === "escasos_recursos" || call.modalidad === "alimenticia";

  return (
    <div className="work-form-container" style={{ maxHeight: "80vh", overflowY: "auto", paddingRight: "8px" }}>
      <div style={{ background: "var(--canvas)", padding: "14px 18px", borderRadius: "var(--radius)", marginBottom: "16px", borderLeft: "4px solid var(--brand)" }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--brand)" }}>
          Formulario Oficial de Solicitud de Beca Institucional UTO
        </h3>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
          Convocatoria: <strong>{call.title}</strong> · Periodo: <strong>{call.periodo_actual || "septiembre - diciembre 2026"}</strong> (Evaluando: {call.periodo_anterior || "mayo - agosto 2026"})
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* ============================================================ */}
        {/* SECCIÓN A: DATOS GENERALES Y DOCUMENTO BASE                 */}
        {/* ============================================================ */}
        <section className="work-section" style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px", borderRadius: "var(--radius)" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--brand)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "var(--brand)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>A</span>
            Datos Generales del Estudiante
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <Field label="Apellido Paterno *" required value={paterno} onChange={(e) => setPaterno(e.target.value)} />
            <Field label="Apellido Materno" value={materno} onChange={(e) => setMaterno(e.target.value)} />
            <Field label="Nombre(s) *" required value={nombres} onChange={(e) => setNombres(e.target.value)} />
            <div className="field">
              <label>Sexo *</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)", width: "100%" }}>
                <option value="Mujer">Mujer</option>
                <option value="Hombre">Hombre</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "12px" }}>
            <div className="field">
              <label>Nivel de Estudios *</label>
              <select value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)", width: "100%" }}>
                {NIVELES_ESTUDIO.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Programa Educativo (Carrera) *</label>
              <select value={major} onChange={(e) => setMajor(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)", width: "100%" }}>
                {activeCareers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Field label="Matrícula *" required value={matricula} onChange={(e) => setMatricula(e.target.value.toUpperCase())} />
            <Field label="CURP *" required maxLength={18} value={curp} onChange={(e) => setCurp(e.target.value.toUpperCase())} />
            <Field label="Teléfono Celular (10 dígitos) *" required maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "12px" }}>
            <Field
              label={`Promedio cuatrimestre anterior (${call.periodo_anterior || "anterior"}) *`}
              type="number"
              step="0.01"
              min="6.00"
              max="10.00"
              required
              placeholder="Ej. 9.75"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              hint={
                call.modalidad === "academica"
                  ? "Mínimo 9.70 para Beca Académica (10.00 para exención total)"
                  : call.modalidad === "escasos_recursos"
                  ? "Mínimo 8.50 para Escasos Recursos Económicos"
                  : "Promedio del periodo inmediato anterior"
              }
            />
            <div className="field">
              <label>Cuatrimestre a cursar *</label>
              <select value={academicTerm} onChange={(e) => setAcademicTerm(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)", width: "100%" }}>
                {activeTerms.map((t) => (
                  <option key={t} value={t}>{t} Cuatrimestre</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documento Base Obligatorio: No Adeudo */}
          <div style={{ marginTop: "16px", padding: "12px", background: "var(--canvas)", border: "1px dashed var(--line)", borderRadius: "var(--radius)" }}>
            <label style={{ display: "block", fontWeight: "700", marginBottom: "4px", fontSize: "0.875rem" }}>
              Constancia de No Adeudo de Tesorería (Obligatorio en todas las modalidades) *
            </label>
            <p style={{ margin: "0 0 8px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              Emitida por el área de Tesorería de la Universidad. Formato <strong>PDF únicamente (máximo 1 MB)</strong>.
            </p>
            <input
              type="file"
              accept=".pdf"
              required
              onChange={(e) => setFileNoAdeudo(e.target.files[0])}
              style={{ fontSize: "0.8125rem" }}
            />
            {fileNoAdeudo && (
              <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>
                ✓ {fileNoAdeudo.name} ({(fileNoAdeudo.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECCIÓN B: MODALIDAD Y SISTEMA                               */}
        {/* ============================================================ */}
        <section className="work-section" style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px", borderRadius: "var(--radius)" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--brand)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "var(--brand)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>B</span>
            Modalidad Institucional y Sistema de Estudios
          </h4>

          {isAlimenticia ? (
            <div style={{ background: "#edf5ed", border: "1px solid #c2e2c2", padding: "12px", borderRadius: "var(--radius)", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--green)", fontWeight: "700" }}>
                <Info size={18} />
                <span>Beca Alimenticia: Sistema Presencial Escolarizado de Tiempo Completo</span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--ink)" }}>
                Esta modalidad no admite sistema mixto. Otorga 1 platillo diario de lunes a viernes en cafetería universitaria con asistencia mínima obligatoria del 90%.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontWeight: "700", marginBottom: "6px" }}>Sistema a estudiar *</label>
              <div style={{ display: "flex", gap: "16px" }}>
                {SISTEMAS_ESTUDIO.map((s) => (
                  <label key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="study_system"
                      value={s.id}
                      checked={studySystem === s.id}
                      onChange={(e) => setStudySystem(e.target.value)}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>

              {studySystem === "mixto" && (
                <div style={{ marginTop: "12px", background: "#fef9ec", border: "1px solid var(--gold)", padding: "12px 14px", borderRadius: "var(--radius)" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.8125rem", color: "#7a5814", fontWeight: "600" }}>
                    Aviso importante para modalidad mixta:
                  </p>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.75rem", color: "var(--ink)" }}>
                    El porcentaje de condonación se calculará de acuerdo a la documentación laboral y socioeconómica entregada. Una vez publicados los resultados, no se permite cambio de modalidad ni de sistema.
                  </p>
                  <label style={{ display: "block", fontWeight: "700", fontSize: "0.8125rem", marginBottom: "4px" }}>
                    Constancia laboral entregada a su Coordinador (PDF, máx. 10 MB) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => setFileConstanciaCoord(e.target.files[0])}
                    style={{ fontSize: "0.8125rem" }}
                  />
                  {fileConstanciaCoord && (
                    <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>
                      ✓ {fileConstanciaCoord.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTACIÓN ESPECÍFICA POR MODALIDAD */}
          {call.modalidad === "academica" && (
            <div style={{ background: "var(--canvas)", padding: "14px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
              <label style={{ display: "block", fontWeight: "700", marginBottom: "4px" }}>
                Kárdex oficial o constancia de calificaciones (Promedio ≥ 9.70) *
              </label>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                Formato PDF oficial expedido por Servicios Escolares (máx. 10 MB).
              </p>
              <input type="file" accept=".pdf" required onChange={(e) => setFileKardex(e.target.files[0])} style={{ fontSize: "0.8125rem" }} />
              {fileKardex && <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>✓ {fileKardex.name}</span>}
            </div>
          )}

          {call.modalidad === "alimenticia" && (
            <div style={{ background: "var(--canvas)", padding: "14px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
              <label style={{ display: "block", fontWeight: "700", marginBottom: "4px" }}>
                Valoración médica por el área de Enfermería de la UTO *
              </label>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                Expedida por la enfermería universitaria en formato PDF (máx. 10 MB).
              </p>
              <input type="file" accept=".pdf" required onChange={(e) => setFileValoracionMedica(e.target.files[0])} style={{ fontSize: "0.8125rem" }} />
              {fileValoracionMedica && <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>✓ {fileValoracionMedica.name}</span>}
            </div>
          )}

          {call.modalidad === "hijos_personal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--canvas)", padding: "14px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
              <div>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "4px" }}>
                  Acta de nacimiento del estudiante (PDF, máx. 10 MB) *
                </label>
                <input type="file" accept=".pdf" required onChange={(e) => setFileActaNacimiento(e.target.files[0])} style={{ fontSize: "0.8125rem" }} />
                {fileActaNacimiento && <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>✓ {fileActaNacimiento.name}</span>}
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "4px" }}>
                  Constancia laboral emitida por Recursos Humanos UTO (PDF, máx. 10 MB) *
                </label>
                <p style={{ margin: "0 0 6px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                  Debe especificar nombre completo del trabajador, número de empleado y puesto.
                </p>
                <input type="file" accept=".pdf" required onChange={(e) => setFileConstanciaRH(e.target.files[0])} style={{ fontSize: "0.8125rem" }} />
                {fileConstanciaRH && <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>✓ {fileConstanciaRH.name}</span>}
              </div>
            </div>
          )}

          {call.modalidad === "escasos_recursos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", background: "var(--canvas)", padding: "14px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
              {/* Botón de Generar Anexo 1 */}
              <div style={{ background: "#fef8ee", border: "1px solid var(--gold)", padding: "12px 14px", borderRadius: "var(--radius)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <strong style={{ color: "#7a5814", fontSize: "0.875rem" }}>Generador de Anexo 1 (Carta bajo protesta de decir verdad)</strong>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                    Descarga o imprime el formato oficial prellenado con tus datos para firmarlo con tinta azul.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAnexoModal(true)}
                  style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Printer size={15} /> Ver / Imprimir Anexo 1
                </button>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "4px" }}>
                  Anexo 1 - Carta bajo protesta firmada con tinta azul (PDF, máx. 10 MB) *
                </label>
                <input type="file" accept=".pdf" required onChange={(e) => setFileAnexo1(e.target.files[0])} style={{ fontSize: "0.8125rem" }} />
                {fileAnexo1 && <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>✓ {fileAnexo1.name}</span>}
              </div>

              {studySystem === "mixto" && (
                <div>
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "4px" }}>
                    Comprobante de ingresos mensual (Nómina o constancia laboral, PDF máx. 10 MB) *
                  </label>
                  <input type="file" accept=".pdf" required onChange={(e) => setFileIngresos(e.target.files[0])} style={{ fontSize: "0.8125rem" }} />
                  {fileIngresos && <span style={{ marginLeft: "8px", color: "var(--green)", fontSize: "0.75rem", fontWeight: "600" }}>✓ {fileIngresos.name}</span>}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* SECCIÓN SOCIOECONÓMICA (ESCASOS RECURSOS Y ALIMENTICIA)     */}
        {/* ============================================================ */}
        {showSocioeconomicSection && (
          <section className="work-section" style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px", borderRadius: "var(--radius)" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "var(--brand)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ background: "var(--brand)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>C</span>
              Estudio Socioeconómico y Criterios de Priorización
            </h4>

            {/* Edad y Estado Civil */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "14px" }}>
              <Field label="Edad *" type="number" min="15" max="80" required value={edad} onChange={(e) => setEdad(e.target.value)} />
              <div className="field">
                <label>Estado Civil *</label>
                <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)", width: "100%" }}>
                  <option value="Soltero(a)">Soltero(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Unión Libre">Unión Libre</option>
                  <option value="Viudo(a)">Viudo(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Priorización: Discapacidad y Etnia Indígena */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px", background: "var(--canvas)", padding: "14px", borderRadius: "var(--radius)" }}>
              <div>
                <label style={{ fontWeight: "700", display: "block", marginBottom: "6px" }}>¿Padece alguna discapacidad acreditada?</label>
                <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                  <label><input type="radio" name="discap" value="No" checked={hasDiscapacidad === "No"} onChange={() => setHasDiscapacidad("No")} /> No</label>
                  <label><input type="radio" name="discap" value="Sí" checked={hasDiscapacidad === "Sí"} onChange={() => setHasDiscapacidad("Sí")} /> Sí</label>
                </div>
                {hasDiscapacidad === "Sí" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Field label="Tipo de discapacidad *" required placeholder="Motriz, visual, auditiva..." value={tipoDiscapacidad} onChange={(e) => setTipoDiscapacidad(e.target.value)} />
                    <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>Certificado médico DIF o Salud Pública (PDF, máx. 10 MB) *</label>
                    <input type="file" accept=".pdf" required onChange={(e) => setFileDiscapacidad(e.target.files[0])} style={{ fontSize: "0.75rem" }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontWeight: "700", display: "block", marginBottom: "6px" }}>¿Pertenece a comunidad indígena / habla lengua originaria?</label>
                <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                  <label><input type="radio" name="indig" value="No" checked={hasIndigena === "No"} onChange={() => setHasIndigena("No")} /> No</label>
                  <label><input type="radio" name="indig" value="Sí" checked={hasIndigena === "Sí"} onChange={() => setHasIndigena("Sí")} /> Sí</label>
                </div>
                {hasIndigena === "Sí" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Field label="Comunidad o pueblo originario *" required placeholder="Náhuatl, Otomí, Totonaco..." value={grupoIndigena} onChange={(e) => setGrupoIndigena(e.target.value)} />
                    <Field label="Lengua indígena hablada" placeholder="Lengua originaria" value={lenguaIndigena} onChange={(e) => setLenguaIndigena(e.target.value)} />
                    <label style={{ fontSize: "0.75rem", fontWeight: "700" }}>Constancia de autoridad comunitaria (PDF, máx. 10 MB) *</label>
                    <input type="file" accept=".pdf" required onChange={(e) => setFileIndigena(e.target.files[0])} style={{ fontSize: "0.75rem" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Domicilio */}
            <h5 style={{ margin: "14px 0 8px 0" }}>Domicilio del estudiante</h5>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "14px" }}>
              <Field label="Calle y Número *" required value={domicilioCalle} onChange={(e) => setDomicilioCalle(e.target.value)} />
              <Field label="Colonia / Barrio *" required value={domicilioColonia} onChange={(e) => setDomicilioColonia(e.target.value)} />
              <Field label="Municipio *" required value={domicilioMunicipio} onChange={(e) => setDomicilioMunicipio(e.target.value)} />
              <Field label="Código Postal *" required maxLength={5} value={domicilioCP} onChange={(e) => setDomicilioCP(e.target.value)} />
              <Field label="Referencia cercana *" required placeholder="Frente a tienda, entre calles..." value={domicilioReferencia} onChange={(e) => setDomicilioReferencia(e.target.value)} />
            </div>

            {/* Datos de los Padres */}
            <h5 style={{ margin: "14px 0 8px 0" }}>Información familiar</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div style={{ background: "var(--canvas)", padding: "10px", borderRadius: "var(--radius)" }}>
                <Field label="Nombre del Padre o Tutor" value={padreNombre} onChange={(e) => setPadreNombre(e.target.value)} />
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <label><input type="radio" name="pvive" value="Sí" checked={padreVive === "Sí"} onChange={() => setPadreVive("Sí")} /> Vive</label>
                  <label><input type="radio" name="pvive" value="No" checked={padreVive === "No"} onChange={() => setPadreVive("No")} /> Finado</label>
                </div>
              </div>
              <div style={{ background: "var(--canvas)", padding: "10px", borderRadius: "var(--radius)" }}>
                <Field label="Nombre de la Madre o Tutora" value={madreNombre} onChange={(e) => setMadreNombre(e.target.value)} />
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <label><input type="radio" name="mvive" value="Sí" checked={madreVive === "Sí"} onChange={() => setMadreVive("Sí")} /> Vive</label>
                  <label><input type="radio" name="mvive" value="No" checked={madreVive === "No"} onChange={() => setMadreVive("No")} /> Finada</label>
                </div>
              </div>
            </div>

            {/* Economía del Hogar (Campos Anexo 1) */}
            <h5 style={{ margin: "14px 0 8px 0" }}>Economía del hogar y dependencia</h5>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "14px" }}>
              <Field label="¿De quién dependes económicamente? *" required value={dependeDe} onChange={(e) => setDependeDe(e.target.value)} />
              <Field label="Parentesco con la persona *" required value={dependeParentesco} onChange={(e) => setDependeParentesco(e.target.value)} />
              <Field label="Ocupación de la persona *" required value={dependeOcupacion} onChange={(e) => setDependeOcupacion(e.target.value)} />
              <Field label="Ingreso familiar mensual (MXN) *" type="number" min="0" required value={ingresoMensual} onChange={(e) => setIngresoMensual(e.target.value)} />
              <Field label="Total de dependientes (incluyéndote) *" type="number" min="1" max="25" required value={numDependientes} onChange={(e) => setNumDependientes(e.target.value)} />
              <Field label="Total de gastos mensuales (MXN) *" type="number" min="0" required value={totalGastos} onChange={(e) => setTotalGastos(e.target.value)} />
              <Field label="Gasto diario en transporte (MXN) *" type="number" min="0" required value={transporteDiario} onChange={(e) => setTransporteDiario(e.target.value)} />
              <div className="field">
                <label>Tipo de vivienda *</label>
                <select value={tipoVivienda} onChange={(e) => setTipoVivienda(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius)", border: "1px solid var(--line)", width: "100%" }}>
                  <option value="Propia">Propia</option>
                  <option value="Rentada">Rentada</option>
                  <option value="Prestada">Prestada</option>
                  <option value="Propia pagándose">Propia pagándose</option>
                </select>
              </div>
            </div>

            {/* Transporte */}
            <h5 style={{ margin: "14px 0 8px 0" }}>Ruta de transporte universitario</h5>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <Field label="Ruta(s) utilizada(s) o NA *" required value={transporteRuta} onChange={(e) => setTransporteRuta(e.target.value)} />
              <Field label="Tiempo de traslado (minutos) *" type="number" min="1" required value={transporteTiempoMin} onChange={(e) => setTransporteTiempoMin(e.target.value)} />
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* SECCIÓN D: 3 SECCIONES FINALES OBLIGATORIAS (TODAS)         */}
        {/* ============================================================ */}
        <section className="work-section" style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "16px", borderRadius: "var(--radius)" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "var(--brand)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "var(--brand)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>D</span>
            Declaraciones Institucionales y Encuesta de Calidad
          </h4>

          {/* 1. Declaración y Reglamento */}
          <div style={{ background: "var(--canvas)", padding: "12px 14px", borderRadius: "var(--radius)", marginBottom: "14px", border: "1px solid var(--line)" }}>
            <h5 style={{ margin: "0 0 6px 0", fontSize: "0.875rem" }}>1. Declaración bajo protesta y Reglamento Académico</h5>
            <p style={{ margin: "0 0 8px 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Declaro bajo protesta de decir verdad que toda la información asentada es verídica y verificable. Acepto sujetarme a los Artículos 72° y 73° del Reglamento Académico de Estudiantes y autorizo a la Universidad Tecnológica de Oriental la verificación de datos.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "0.8125rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                required
                checked={aceptoReglamento}
                onChange={(e) => setAceptoReglamento(e.target.checked)}
              />
              <span>Acepto de conformidad los términos, declaraciones y reglamentación institucional (Acepto).</span>
            </label>
          </div>

          {/* 2. Privacidad y No Discriminación */}
          <div style={{ background: "var(--canvas)", padding: "12px 14px", borderRadius: "var(--radius)", marginBottom: "14px", border: "1px solid var(--line)" }}>
            <h5 style={{ margin: "0 0 6px 0", fontSize: "0.875rem" }}>2. Aviso de Privacidad y Protocolo de No Discriminación</h5>
            <p style={{ margin: "0 0 8px 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              Conforme a la Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del Estado de Puebla, sus datos serán resguardados con estricta confidencialidad.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "0.8125rem", cursor: "pointer", marginBottom: "10px" }}>
              <input
                type="checkbox"
                required
                checked={aceptoPrivacidad}
                onChange={(e) => setAceptoPrivacidad(e.target.checked)}
              />
              <span>He leído y acepto el Aviso de Privacidad institucional (Acepto).</span>
            </label>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: "8px" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", marginBottom: "4px" }}>
                ¿Durante el proceso de convocatoria o atención recibiste algún trato discriminatorio? *
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label><input type="radio" name="discrim" value="No" checked={tratoDiscriminatorio === "No"} onChange={() => setTratoDiscriminatorio("No")} /> No recibí trato discriminatorio</label>
                <label><input type="radio" name="discrim" value="Sí" checked={tratoDiscriminatorio === "Sí"} onChange={() => setTratoDiscriminatorio("Sí")} /> Sí</label>
              </div>
              {tratoDiscriminatorio === "Sí" && (
                <Field label="Describe brevemente la situación presentada" as="textarea" rows={2} value={tratoDetalles} onChange={(e) => setTratoDetalles(e.target.value)} />
              )}
            </div>
          </div>

          {/* 3. Encuesta de Satisfacción (Likert 1 a 5) */}
          <div style={{ background: "var(--canvas)", padding: "12px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
            <h5 style={{ margin: "0 0 4px 0", fontSize: "0.875rem" }}>3. Encuesta de Calidad en el Servicio de Becas</h5>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              Evalúa del 1 (Muy insatisfecho) al 5 (Totalmente satisfecho) la atención brindada por el área de Becas.
            </p>

            {[
              { label: "1. Claridad en la difusión y bases de la convocatoria:", val: satisfaccion1, set: setSatisfaccion1 },
              { label: "2. Facilidad y accesibilidad del proceso de registro:", val: satisfaccion2, set: setSatisfaccion2 },
              { label: "3. Tiempos de atención y respuesta por parte del personal de Becas:", val: satisfaccion3, set: setSatisfaccion3 },
              { label: "4. Trato respetuoso y orientación brindada por el área responsable:", val: satisfaccion4, set: setSatisfaccion4 },
              { label: "5. Satisfacción general con el servicio de becas institucionales:", val: satisfaccion5, set: setSatisfaccion5 },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: idx < 4 ? "1px dashed var(--line)" : "none", fontSize: "0.8125rem", flexWrap: "wrap" }}>
                <span>{item.label}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["1", "2", "3", "4", "5"].map((num) => (
                    <label key={num} style={{ display: "inline-flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`sat-${idx}`}
                        value={num}
                        checked={item.val === num}
                        onChange={(e) => item.set(e.target.value)}
                      />
                      <span>{num}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginTop: "10px" }}>
              <Field
                label="Comentarios o sugerencias para el área de Becas (Opcional)"
                as="textarea"
                rows={2}
                value={satisfaccionComentarios}
                onChange={(e) => setSatisfaccionComentarios(e.target.value)}
                placeholder="Escribe tus observaciones..."
              />
            </div>
          </div>
        </section>

        {/* ACCIONES DEL FORMULARIO */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <button type="button" className="button button-secondary" disabled={submitting} onClick={onCancel}>
            Cancelar y Volver
          </button>
          <BusyButton
            type="submit"
            className="button button-primary"
            busy={submitting}
            busyText="Registrando solicitud y documentos…"
          >
            <CheckCircle size={16} /> Enviar Solicitud Oficial
          </BusyButton>
        </div>
      </form>

      {/* Modal de Anexo 1 */}
      {showAnexoModal && (
        <Anexo1Modal
          data={anexo1PreviewData}
          onClose={() => setShowAnexoModal(false)}
        />
      )}
    </div>
  );
}
