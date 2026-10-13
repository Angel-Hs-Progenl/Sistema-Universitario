import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  FileCheck2,
  Route,
  LockKeyhole,
  BookOpen,
  Check,
} from "lucide-react";
import { useAuth } from "../../app/Auth";
function AcademicArt() {
  return (
    <div className="academic-art" aria-hidden="true">
      <div className="art-ring ring-one" />
      <div className="art-ring ring-two" />
      <div className="art-cross cross-one">+</div>
      <div className="art-cross cross-two">+</div>
      <div className="art-certificate">
        <div className="cert-top">
          <span>UT / ORIENTAL</span>
          <GraduationCap size={25} />
        </div>
        <span className="cert-label">UN NUEVO CAPÍTULO</span>
        <div className="cert-title">
          El futuro lleva
          <br />
          tu nombre.
        </div>
        <div className="cert-rule" />
        <div className="cert-lines">
          <i />
          <i />
          <i />
        </div>
        <div className="cert-seal">
          <GraduationCap size={30} />
        </div>
        <div className="cert-signature" />
        <span className="cert-bottom">CONOCIMIENTO QUE TRANSFORMA</span>
      </div>
      <div className="art-caption">
        <span className="dot" /> Cada paso cuenta.
      </div>
    </div>
  );
}
export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> TU COMUNIDAD. TUS SERVICIOS.
            </div>
            <h1>
              Menos trámites.
              <br />
              Más <em>futuro.</em>
            </h1>
            <p>
              Un solo espacio para avanzar en tu vida universitaria. Gestiona
              tus solicitudes y conoce el siguiente paso, estés donde estés.
            </p>
            <a className="button button-primary" href="#servicios">
              Explorar servicios <ArrowRight size={18} />
            </a>
            <div className="hero-footnote">
              <LockKeyhole size={15} /> Tu información, en tu espacio
              universitario.
            </div>
          </div>
          <AcademicArt />
        </div>
      </section>
      <section id="servicios" className="container services-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">HECHO PARA ACOMPAÑARTE</span>
            <h2>¿Qué necesitas hacer hoy?</h2>
          </div>
          <span className="available-label">
            <span className="dot" /> 1 servicio disponible
          </span>
        </div>
        <Link className="service-feature" to="/titulacion">
          <div className="service-number">
            01 <span>/ SERVICIOS ESCOLARES</span>
          </div>
          <div className="service-main">
            <div className="service-icon">
              <GraduationCap size={32} strokeWidth={1.5} />
            </div>
            <div>
              <div className="service-heading">
                <h3>Titulación electrónica</h3>
                <span className="badge badge-validado">Disponible</span>
              </div>
              <p>
                Tu siguiente gran paso empieza aquí. Integra tu expediente,
                envía tu solicitud y sigue el proceso hasta la entrega de tu
                título.
              </p>
              <div className="service-tags">
                <span>
                  <FileCheck2 size={14} /> Expediente digital
                </span>
                <span>
                  <Route size={14} /> Seguimiento del trámite
                </span>
              </div>
            </div>
            <span className="service-arrow">
              <ArrowUpRight size={27} />
            </span>
          </div>
          <div className="service-bottom">
            <span>Para egresados y áreas de atención</span>
            <strong>
              {user ? "Ir a mi espacio" : "Conocer el servicio"}{" "}
              <ArrowRight size={16} />
            </strong>
          </div>
        </Link>
      </section>
      <section className="container how-section">
        <div>
          <span className="eyebrow">CLARO, EN CADA PASO</span>
          <h2>
            De tu solicitud
            <br />
            al siguiente logro.
          </h2>
          <Link className="text-link" to="/ayuda">
            Conoce cómo funciona <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="how-steps">
          {[
            [
              "01",
              "Prepara tu expediente",
              "Consulta los requisitos y reúne tus documentos.",
            ],
            [
              "02",
              "Hazlo desde aquí",
              "Envía tu solicitud sin perder de vista ningún detalle.",
            ],
            [
              "03",
              "Sigue tu avance",
              "Consulta observaciones, estados y próximos pasos.",
            ],
          ].map(([n, t, p]) => (
            <div className="how-step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="container support-strip">
        <BookOpen size={25} />
        <div>
          <h3>¿Es tu primera vez aquí?</h3>
          <p>Te ayudamos a preparar tu solicitud y entender el proceso.</p>
        </div>
        <Link to="/ayuda" className="button button-secondary">
          Visitar el centro de ayuda <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
