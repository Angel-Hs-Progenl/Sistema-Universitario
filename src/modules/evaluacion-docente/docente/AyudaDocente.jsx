
import {
  CircleHelp,
  FileText,
  ShieldCheck,
  BookOpen,
  Mail,
  ChevronDown
} from "lucide-react";

import "./AyudaDocente.css";

const PREGUNTAS = [
  {
    pregunta: "¿Cuándo puedo consultar mis resultados?",
    respuesta:
      "Al finalizar el periodo de evaluación, Dirección Académica revisará y autorizará la publicación de tu reporte. Solo entonces podrás consultar tus resultados."
  },
  {
    pregunta: "¿Cómo puedo consultar mi reporte final?",
    respuesta:
      "En el menú lateral, selecciona 'Mi reporte'. Si Dirección Académica ya autorizó su publicación, podrás consultar la información correspondiente a tu evaluación."
  },
  {
    pregunta: "¿Puedo descargar mi reporte en PDF?",
    respuesta:
      "Sí. Cuando tu reporte esté disponible, selecciona 'Guardar como PDF' y elige esa opción en la ventana de impresión del navegador."
  },
  {
    pregunta: "¿Puedo saber quién me evaluó?",
    respuesta:
      "No. Las evaluaciones y comentarios son confidenciales. El sistema no debe mostrar información que permita identificar a los estudiantes."
  },
  {
    pregunta: "¿Qué significa el promedio general?",
    respuesta:
      "Es el resultado global de tu evaluación docente, calculado a partir de las respuestas recibidas y la metodología de evaluación establecida por Dirección Académica."
  },
  {
    pregunta: "¿Qué son las fortalezas y áreas de oportunidad?",
    respuesta:
      "Las fortalezas son los aspectos mejor evaluados. Las áreas de oportunidad son aquellos aspectos en los que puedes mejorar tu desempeño docente."
  },
  {
    pregunta: "¿Qué función tiene el análisis con IA?",
    respuesta:
      "La Inteligencia Artificial ayuda a identificar temas frecuentes, fortalezas y sugerencias en los comentarios. No sustituye las calificaciones ni la revisión de Dirección Académica."
  },
  {
    pregunta: "¿Qué hago si mis resultados no aparecen?",
    respuesta:
      "Verifica que el reporte correspondiente al periodo esté publicado. Si aún no está disponible o consideras que existe un error, consulta con Dirección Académica."
  }
];

export default function AyudaDocente() {
  return (
    <div className="ay-page">

      {/* Encabezado */}
      <div className="ay-heading">
        <div className="ay-heading-icon">
          <CircleHelp size={25} />
        </div>

        <div>
          <h1>Centro de ayuda</h1>
          <p>
            Encuentra respuestas a las preguntas más frecuentes
            sobre la Plataforma de Evaluación Docente.
          </p>
        </div>
      </div>

      {/* Guía rápida */}
      <section className="ay-panel">
        <div className="ay-panel-heading">
          <BookOpen size={21} />
          <div>
            <h2>¿Cómo funciona la plataforma?</h2>
            <p>Conoce el proceso de evaluación docente.</p>
          </div>
        </div>

        <div className="ay-steps">
          <div className="ay-step">
            <span className="ay-step-number">01</span>
            <div>
              <h3>Evaluación</h3>
              <p>
                Los estudiantes responden la evaluación
                correspondiente al periodo académico.
              </p>
            </div>
          </div>

          <div className="ay-step">
            <span className="ay-step-number">02</span>
            <div>
              <h3>Revisión académica</h3>
              <p>
                El sistema procesa los resultados y Dirección
                Académica revisa el reporte.
              </p>
            </div>
          </div>

          <div className="ay-step">
            <span className="ay-step-number">03</span>
            <div>
              <h3>Consulta del reporte</h3>
              <p>
                Una vez autorizado, puedes consultar
                tus resultados y tu reporte final.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="ay-panel">
        <div className="ay-panel-heading">
          <CircleHelp size={21} />
          <div>
            <h2>Preguntas frecuentes</h2>
            <p>
              Selecciona una pregunta para conocer su respuesta.
            </p>
          </div>
        </div>

        <div className="ay-faq-list">
          {PREGUNTAS.map((item, index) => (
            <details
              key={index}
              className="ay-faq-item"
            >
              <summary>
                <span>{item.pregunta}</span>
                <ChevronDown size={19} />
              </summary>

              <p>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Confidencialidad */}
      <section className="ay-privacy">
        <ShieldCheck size={24} />

        <div>
          <h2>Privacidad y confidencialidad</h2>
          <p>
            La información de las evaluaciones es confidencial.
            Los docentes únicamente pueden acceder a sus
            reportes autorizados y no pueden consultar
            la identidad de los estudiantes que participaron.
          </p>
        </div>
      </section>

      {/* Soporte */}
      <section className="ay-panel ay-support">
        <div className="ay-support-icon">
          <Mail size={24} />
        </div>

        <div>
          <h2>¿Necesitas más ayuda?</h2>

          <p>
            Si tienes problemas para acceder a la plataforma,
            consultar tus resultados o descargar tu reporte,
            comunícate con Dirección Académica de tu institución.
          </p>

          <span className="ay-support-label">
            Contacto institucional pendiente de configurar.
          </span>
        </div>

        <FileText className="ay-support-decoration" size={35} />
      </section>

    </div>
  );
}
