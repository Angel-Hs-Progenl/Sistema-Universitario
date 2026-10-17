
import {
  UserRound,
  Mail,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  IdCard
} from "lucide-react";

import {
  DOCENTE
} from "../../data/docenteMock";

import "./PerfilDocente.css";

export default function PerfilDocente() {

  // Obtener las iniciales del docente
  const iniciales = DOCENTE.nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");

  return (
    <div className="pd-page">

      {/* ENCABEZADO */}
      <div className="pd-heading">
        <h1>Mi perfil</h1>

        <p>
          Consulta tu información personal y académica
          registrada en la plataforma.
        </p>
      </div>

      {/* TARJETA DEL DOCENTE */}
      <section className="pd-profile-card">

        <div className="pd-profile-banner" />

        <div className="pd-profile-content">

          <div className="pd-avatar">
            {iniciales}
          </div>

          <div className="pd-profile-info">
            <h2>{DOCENTE.nombre}</h2>

            <p>{DOCENTE.departamento}</p>

            <span className="pd-role">
              <ShieldCheck size={15} />
              {DOCENTE.rol}
            </span>
          </div>

        </div>
      </section>

      {/* INFORMACIÓN PERSONAL Y ACADÉMICA */}
      <section className="pd-panel">

        <div className="pd-panel-heading">
          <UserRound size={21} />

          <div>
            <h2>Información del docente</h2>

            <p>
              Datos registrados en el sistema.
            </p>
          </div>
        </div>

        <div className="pd-info-grid">

          {/* NOMBRE */}
          <div className="pd-info-item">
            <IdCard size={20} />

            <div>
              <span>Nombre completo</span>
              <strong>{DOCENTE.nombre}</strong>
            </div>
          </div>

          {/* CORREO */}
          <div className="pd-info-item">
            <Mail size={20} />

            <div>
              <span>Correo institucional</span>
              <strong>{DOCENTE.correo}</strong>
            </div>
          </div>

          {/* DEPARTAMENTO */}
          <div className="pd-info-item">
            <GraduationCap size={20} />

            <div>
              <span>Departamento académico</span>
              <strong>{DOCENTE.departamento}</strong>
            </div>
          </div>

          {/* CARRERA */}
          <div className="pd-info-item">
            <GraduationCap size={20} />

            <div>
              <span>Carrera</span>
              <strong>{DOCENTE.carrera}</strong>
            </div>
          </div>

          {/* PERIODO */}
          <div className="pd-info-item">
            <CalendarDays size={20} />

            <div>
              <span>Periodo académico</span>
              <strong>{DOCENTE.periodo}</strong>
            </div>
          </div>

          {/* ROL */}
          <div className="pd-info-item">
            <ShieldCheck size={20} />

            <div>
              <span>Rol en la plataforma</span>
              <strong>{DOCENTE.rol}</strong>
            </div>
          </div>

        </div>
      </section>

      {/* AVISO */}
      <p className="pd-note">
        Vista de demostración con datos simulados.
        La información académica será administrada
        por Dirección Académica.
      </p>

    </div>
  );
}
