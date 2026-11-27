import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer } from "lucide-react";
import { Alert, Modal } from "../../shared/ui";
import letterhead from "./assets/membrete-uto.png";
import "./anexo1-print.css";

const money = (value) => value == null || value === ""
  ? "________"
  : Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 });

function Anexo1Document({ data, print = false }) {
  const {
    student = {},
    call = {},
    anexo1_data = {},
    city = "Oriental",
    state = "Puebla",
    date_str = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
  } = data;
  const periodo = call.periodo || "periodo no indicado";

  return (
    <div className={`anexo1-document${print ? " anexo1-document-print" : ""}`}>
      <header className="anexo1-heading">
        <h2>ANEXO 1: CARTA BAJO PROTESTA DE DECIR VERDAD</h2>
        <p>Beca de Escasos Recursos Económicos · Periodo {periodo}</p>
      </header>

      <p className="anexo1-date"><strong>{city}, {state}</strong>; a {date_str}.</p>

      <p className="anexo1-recipient">
        <strong>COMITÉ DE BECAS<br />DE LA UNIVERSIDAD TECNOLÓGICA DE ORIENTAL</strong><br />
        PRESENTE
      </p>

      <p>
        La(el) que suscribe <strong>{student.name || "_________________________________"}</strong> estudiante
        del Programa Educativo de <strong>{student.major || "_________________________________"}</strong>, que cursa{" "}
        <strong>{student.academic_term || "_____"}</strong>, con matrícula:{" "}
        <strong>{student.matricula || "_______________"}</strong>; en cumplimiento con lo señalado en la
        Convocatoria de Becas Institucionales para el periodo <strong>{periodo}</strong> en el apartado
        segundo, numeral 2.2 inciso e), manifiesto lo siguiente:
      </p>

      <p className="anexo1-economic-data">
        Dependo económicamente de la(s) persona(s): <strong>{anexo1_data.depende_de || "____________________"}</strong> (parentesco: <strong>{anexo1_data.parentesco || "________"}</strong>),
        de ocupación <strong>{anexo1_data.ocupacion || "____________________"}</strong> con un ingreso familiar mensual de{" "}
        <strong>${money(anexo1_data.ingreso_mensual)} MXN</strong>, del cual dependemos{" "}
        <strong>{anexo1_data.personas_dependientes ?? "_____"}</strong> personas; los gastos mensuales de mi familia ascienden a{" "}
        <strong>${money(anexo1_data.gastos_mensuales)} MXN</strong> y en el rubro de transporte pago la cantidad de{" "}
        <strong>${money(anexo1_data.transporte_diario)} MXN</strong> diario.
      </p>

      <p>
        De la misma manera, de conformidad con el numeral 2.2 inciso c) de la misma convocatoria, actualmente
        {anexo1_data.no_beca_externa === true
          ? <strong> no soy beneficiaria(o) de ningún tipo de beca externa</strong>
          : <strong> debo revisar mi declaración sobre becas externas antes de firmar este formato</strong>}.
      </p>

      <p>
        Declaro bajo protesta de decir verdad que la información antes proporcionada es verídica y correcta,
        y autorizo al personal de la Universidad Tecnológica de Oriental a verificar los datos asentados
        en la solicitud de Beca de Escasos Recursos Económicos y, en caso de encontrar falsedad en los mismos,
        será motivo de anulación.
      </p>

      <div className="anexo1-signature">
        <p>ATENTAMENTE</p>
        <div>
          <strong>{student.name}</strong><br />
          <small>NOMBRE COMPLETO Y FIRMA AUTÓGRAFA (TINTA AZUL)</small>
        </div>
      </div>

      <p className="anexo1-privacy">
        Los datos personales recabados serán protegidos, incorporados y tratados en la base de datos correspondiente,
        de conformidad con lo dispuesto en los artículos 10 fracciones I y VII, 13 fracciones VIII y IX del Decreto
        de Creación de la Universidad Tecnológica de Oriental, y la Ley de Protección de Datos Personales en
        Posesión de Sujetos Obligados del Estado de Puebla.
      </p>

      {!print && (
        <div className="anexo1-instructions">
          <strong>Indicaciones de entrega:</strong>
          <ul>
            <li>Imprimir el formato generado.</li>
            <li>Firmar de puño y letra con <strong>tinta azul</strong> (no se acepta firma digital pegada).</li>
            <li>Escanear en formato <strong>PDF</strong> (máximo 10 MB) y adjuntarlo en la sección correspondiente de tu solicitud.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Anexo1Modal({ data, onClose }) {
  const [printError, setPrintError] = useState("");
  const [downloading, setDownloading] = useState(false);
  if (!data) return null;

  async function handleDownload() {
    setPrintError("");
    setDownloading(true);
    try {
      const response = await fetch(`/api/v1/becas/solicitudes/${data.application_id}/anexo1.pdf`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(typeof error.detail === "string" ? error.detail : "No se pudo descargar el Anexo 1.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `anexo1-beca-${data.application_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      setPrintError(error.message || "No se pudo descargar el Anexo 1.");
    } finally {
      setDownloading(false);
    }
  }

  async function handlePrint() {
    setPrintError("");
    try {
      await document.querySelector(".anexo1-print-membrete").decode();
      await document.fonts.ready;
      window.print();
    } catch {
      setPrintError("No se pudo cargar el membrete. Vuelve a intentarlo.");
    }
  }

  return (
    <>
      <Modal title="Anexo 1 · Carta bajo protesta de decir verdad" onClose={onClose}>
        <Anexo1Document data={data} />
        {printError && <Alert>{printError}</Alert>}
        <div className="anexo1-actions">
          {data.application_id ? (
            <button type="button" className="button button-primary" onClick={handleDownload} disabled={downloading}>
              <Download size={16} /> {downloading ? "Preparando PDF…" : "Descargar Anexo 1 en PDF"}
            </button>
          ) : (
            <button type="button" className="button button-primary" onClick={handlePrint}>
              <Printer size={16} /> Imprimir / Guardar vista previa en PDF
            </button>
          )}
          <button type="button" className="button button-secondary" onClick={onClose}>Cerrar</button>
        </div>
        <p className="anexo1-print-hint">
          {data.application_id
            ? "El archivo descargado ya tiene tamaño Carta y el membrete cubre toda la hoja. Ábrelo para imprimirlo."
            : "Para esta vista previa, elige tamaño Carta, márgenes Ninguno y desactiva encabezados y pies si aparecen."}
        </p>
      </Modal>
      {!data.application_id && createPortal(
        <article className="anexo1-print-sheet" aria-label="Anexo 1 para imprimir">
          <img className="anexo1-print-membrete" src={letterhead} alt="" />
          <Anexo1Document data={data} print />
        </article>,
        document.body,
      )}
    </>
  );
}
