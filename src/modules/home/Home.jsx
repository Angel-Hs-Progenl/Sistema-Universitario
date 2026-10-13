import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../app/Auth";

export default function Home() {
  const { user } = useAuth();
  const staff = user && user.role !== "estudiante";
  return (
    <div className="container service-home">
      <header className="directory-heading">
        <div>
          <p className="eyebrow">
            Universidad Tecnológica de Oriental / Servicios en línea
          </p>
          <h1>
            Servicios
            <br />
            <em>universitarios.</em>
          </h1>
          <p className="directory-intro">
            Solicitudes, documentos y seguimiento.
            <br />
            Elige el trámite que necesitas realizar.
          </p>
        </div>
        <aside className="home-access" aria-label="Acceso al servicio">
          <span className="section-index">TU ESPACIO EN LA UNIVERSIDAD</span>
          <h2>
            {user
              ? `Hola, ${user.name.split(" ")[0]}.`
              : "¿Ya tienes una solicitud?"}
          </h2>
          <p>
            {staff
              ? "Consulta los expedientes y las validaciones que corresponden a tu área."
              : "Retoma tu expediente y consulta las observaciones de las áreas responsables."}
          </p>
          <Link
            className="button button-primary"
            to={user ? "/titulacion" : "/acceso"}
          >
            {user
              ? staff
                ? "Abrir bandeja de solicitudes"
                : "Continuar mi trámite"
              : "Ingresar a mi cuenta"}
            <ArrowRight size={18} />
          </Link>
          {!user && (
            <Link className="text-link" to="/recuperar">
              Recuperar acceso
            </Link>
          )}
        </aside>
      </header>
      <div className="directory-grid">
        <section aria-labelledby="service-directory-title">
          <div className="section-heading">
            <h2 id="service-directory-title">Directorio de servicios</h2>
            <span>01 servicio habilitado</span>
          </div>
          <article className="directory-service">
            <div className="service-category">
              <span>01</span>
              <p>Servicios Escolares</p>
            </div>
            <div className="service-body">
              <div className="service-title">
                <span className="overline">TRÁMITE ACADÉMICO</span>
                <span className="service-availability">Habilitado</span>
              </div>
              <h3>
                <Link to="/titulacion">
                  Titulación electrónica <ArrowUpRight size={27} />
                </Link>
              </h3>
              <p>
                Integra tu expediente de egreso y sigue la revisión de tus
                documentos hasta la conclusión del trámite.
              </p>
              <dl className="service-facts">
                <div>
                  <dt>Dirigido a</dt>
                  <dd>Egresados</dd>
                </div>
                <div>
                  <dt>Participan</dt>
                  <dd>Escolares, Tesorería y Vinculación</dd>
                </div>
              </dl>
              <div className="service-entry">
                <Link to="/titulacion" className="button button-primary">
                  {staff ? "Consultar solicitudes" : "Ir a titulación"}
                  <ArrowRight size={18} />
                </Link>
                <Link to="/ayuda" className="text-link">
                  Consultar requisitos
                </Link>
              </div>
            </div>
          </article>
          <p className="directory-note">
            Los servicios se incorporarán al directorio conforme sean
            habilitados por la universidad.
          </p>
          <section className="process-guide" aria-labelledby="process-title">
            <h2 id="process-title">Cómo realizar tu trámite</h2>
            <ol>
              {[
                ["Prepara", "Reúne tus datos académicos y documentos."],
                ["Envía", "Revisa la información y confirma tu solicitud."],
                [
                  "Da seguimiento",
                  "Atiende observaciones y consulta el estado.",
                ],
              ].map(([title, description], i) => (
                <li key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </section>
        <aside className="directory-aside">
          <span className="section-index">ANTES DE EMPEZAR</span>
          <h2>Prepara tu expediente</h2>
          <ul>
            <li>Ten a la mano tu matrícula y CURP.</li>
            <li>Revisa que tus documentos estén completos y sean legibles.</li>
            <li>Usa archivos PDF o JPG de hasta 5 MB.</li>
          </ul>
          <p>Puedes guardar tu avance y continuar en otra sesión.</p>
          <div className="contact-directory">
            <h3>Atención de Servicios Escolares</h3>
            <p>
              Consulta requisitos específicos, modalidades y canales de atención
              en el sitio de la universidad.
            </p>
            <a
              className="text-link"
              href="https://utdeoriental.edu.mx/servicios-escolares/"
              target="_blank"
              rel="noreferrer"
            >
              Consultar atención institucional <ArrowUpRight size={15} />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
