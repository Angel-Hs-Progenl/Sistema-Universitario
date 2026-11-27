import React from "react";
import { Printer, Download, X } from "lucide-react";
import { Modal } from "../../shared/ui";

export default function Anexo1Modal({ data, onClose }) {
  if (!data) return null;

  const {
    student = {},
    call = {},
    anexo1_data = {},
    city = "Oriental",
    state = "Puebla",
    date_str = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
  } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal title="Anexo 1 · Carta bajo protesta de decir verdad" onClose={onClose}>
      <div className="anexo1-container printable-area" style={{ color: "var(--ink)", fontSize: "0.875rem", lineHeight: 1.6 }}>
        {/* Encabezado */}
        <div style={{ textAlign: "center", borderBottom: "2px solid var(--brand)", paddingBottom: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--gold)", letterSpacing: "1px" }}>
            UNIVERSIDAD TECNOLÓGICA DE ORIENTAL
          </span>
          <h3 style={{ margin: "4px 0", fontSize: "1.125rem", color: "var(--brand)" }}>
            ANEXO 1: CARTA BAJO PROTESTA DE DECIR VERDAD
          </h3>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
            Beca de Escasos Recursos Económicos · Periodo {call.periodo || "septiembre - diciembre 2026"}
          </p>
        </div>

        {/* Lugar y Fecha */}
        <div style={{ textAlign: "right", marginBottom: "16px", fontSize: "0.8125rem" }}>
          <strong>{city}, {state}</strong>; a {date_str}.
        </div>

        {/* Destinatario */}
        <div style={{ marginBottom: "16px" }}>
          <strong>COMITÉ DE BECAS</strong><br />
          <strong>DE LA UNIVERSIDAD TECNOLÓGICA DE ORIENTAL</strong><br />
          <span>PRESENTE</span>
        </div>

        {/* Cuerpo */}
        <p style={{ textAlign: "justify", marginBottom: "12px" }}>
          La(el) que suscribe <strong>{student.name || "_________________________________"}</strong> estudiante
          del Programa Educativo de <strong>{student.major || "_________________________________"}</strong> del{" "}
          <strong>{student.academic_term || "_____"}</strong> cuatrimestre con matrícula:{" "}
          <strong>{student.matricula || "_______________"}</strong>; en cumplimiento con lo señalado en la
          Convocatoria de Becas Institucionales para el periodo{" "}
          <strong>{call.periodo || "septiembre – diciembre 2026"}</strong> en el apartado segundo, numeral 2.2 inciso e), manifiesto lo siguiente:
        </p>

        <p style={{ textAlign: "justify", marginBottom: "12px", background: "var(--canvas)", padding: "12px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
          Dependo económicamente de la(s) persona(s): <strong>{anexo1_data.depende_de || "____________________"}</strong> (parentesco: <strong>{anexo1_data.parentesco || "Padre/Madre"}</strong>),
          de ocupación <strong>{anexo1_data.ocupacion || "____________________"}</strong> con un ingreso familiar mensual de{" "}
          <strong>${Number(anexo1_data.ingreso_mensual || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</strong>, del cual dependemos{" "}
          <strong>{anexo1_data.personas_dependientes || 1}</strong> personas; los gastos mensuales de mi familia ascienden a{" "}
          <strong>${Number(anexo1_data.gastos_mensuales || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</strong> y en el rubro de transporte pago la cantidad de{" "}
          <strong>${Number(anexo1_data.transporte_diario || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</strong> diario.
        </p>

        <p style={{ textAlign: "justify", marginBottom: "12px" }}>
          De la misma manera, de conformidad con el numeral 2.2 inciso c) de la misma convocatoria, actualmente
          <strong> no soy beneficiaria(o) de ningún tipo de beca externa</strong>.
        </p>

        <p style={{ textAlign: "justify", marginBottom: "16px" }}>
          Declaro bajo protesta de decir verdad que la información antes proporcionada es verídica y correcta, además autorizo al personal de la Universidad Tecnológica de Oriental pueda verificar los datos asentados en la solicitud de Beca de Escasos Recursos Económicos y, en caso de encontrar falsedad en los mismos, será motivo de anulación.
        </p>

        {/* Firma */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ margin: "0 0 45px 0", fontWeight: "600" }}>ATENTAMENTE</p>
          <div style={{ display: "inline-block", borderTop: "1px solid var(--ink)", minWidth: "280px", paddingTop: "6px" }}>
            <strong>{student.name}</strong><br />
            <small style={{ color: "var(--muted)" }}>NOMBRE COMPLETO Y FIRMA AUTÓGRAFA (TINTA AZUL)</small>
          </div>
        </div>

        {/* Leyenda de Protección de Datos */}
        <div style={{ marginTop: "24px", paddingTop: "10px", borderTop: "1px solid var(--line)", fontSize: "0.6875rem", color: "var(--muted)", textAlign: "justify" }}>
          Los datos personales recabados serán protegidos, incorporados y tratados en la base de datos correspondiente, de conformidad con lo dispuesto en los artículos 10 fracciones I y VII, 13 fracciones VIII y IX del Decreto de Creación de la Universidad Tecnológica de Oriental, y la Ley de Protección de Datos Personales en Posesión de Sujetos Obligados del Estado de Puebla.
        </div>

        {/* Indicaciones oficiales */}
        <div style={{ marginTop: "12px", background: "#fbf8ef", border: "1px solid var(--gold)", padding: "10px 14px", borderRadius: "var(--radius)", fontSize: "0.75rem" }}>
          <strong>Instructivo oficial de entrega:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            <li>Imprimir el formato generado.</li>
            <li>Firmar de puño y letra con <strong>tinta azul</strong> (no se acepta firma digital pegada).</li>
            <li>Escanear en formato <strong>PDF</strong> (máximo 10 MB) y adjuntarlo en la sección correspondiente de tu solicitud.</li>
          </ul>
        </div>

        {/* Acciones del Modal */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" className="button button-primary" onClick={handlePrint} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Printer size={16} /> Imprimir / Guardar Anexo 1 en PDF
          </button>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
