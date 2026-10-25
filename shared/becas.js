// Los montos y criterios pertenecen a cada convocatoria, no al catálogo.
export const MODALIDADES = [
  { id: "academica", name: "Excelencia académica" },
  { id: "manutencion", name: "Apoyo a la manutención" },
  { id: "transporte", name: "Transporte y movilidad" },
  { id: "alimentacion", name: "Alimentación" },
];

export const ESTADOS_BECA = {
  recibida: "Solicitud recibida",
  revision: "En revisión por comité",
  aprobada: "Beca aprobada",
  rechazada: "Solicitud rechazada",
  renovada: "Beca renovada",
};

export const DOCUMENTOS_BECA = [
  {
    id: "kardex",
    name: "Kárdex o constancia de calificaciones",
    required: true,
    formats: ["application/pdf", "image/jpeg", "image/png"],
  },
  {
    id: "comprobante_ingresos",
    name: "Comprobante de ingresos familiares",
    required: true,
    formats: ["application/pdf", "image/jpeg"],
  },
  {
    id: "comprobante_domicilio",
    name: "Comprobante de domicilio (no mayor a 3 meses)",
    required: true,
    formats: ["application/pdf", "image/jpeg"],
  },
  {
    id: "identificacion",
    name: "Credencial institucional o INE",
    required: true,
    formats: ["application/pdf", "image/jpeg"],
  },
  {
    id: "carta_motivos",
    name: "Carta de exposición de motivos",
    required: false,
    formats: ["application/pdf"],
  },
];

export const ESTADOS_ORDEN_COBRO = {
  programada: "Programada",
  emitida: "Orden emitida",
  dispersada: "Dispersada",
};
