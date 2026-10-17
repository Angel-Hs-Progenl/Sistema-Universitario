export const MODALIDADES = [
  {
    id: "academica",
    name: "Excelencia Académica",
    description: "Para estudiantes con promedio sobresaliente de 9.0 o superior.",
    minGpa: 9.0,
    defaultAmount: 4500,
  },
  {
    id: "manutencion",
    name: "Apoyo a la Manutención",
    description: "Apoyo económico a estudiantes en situación de vulnerabilidad económica.",
    minGpa: 8.0,
    defaultAmount: 3600,
  },
  {
    id: "transporte",
    name: "Subsidio de Transporte y Movilidad",
    description: "Para estudiantes que se trasladan diariamente desde municipios alejados a Oriental.",
    minGpa: 8.0,
    defaultAmount: 2400,
  },
  {
    id: "alimentacion",
    name: "Beca de Comedor y Alimentación",
    description: "Subsidio para acceso al comedor universitario por vulnerabilidad alimentaria.",
    minGpa: 7.5,
    defaultAmount: 1800,
  },
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

export function calculateVulnerabilityScore({
  monthlyIncome = 0,
  monthlyExpenses = 0,
  dependentsCount = 1,
  housingType = "propia",
}) {
  const perCapita = monthlyIncome / Math.max(1, dependentsCount);
  let score = 50;

  if (perCapita <= 2000) score += 30;
  else if (perCapita <= 3500) score += 20;
  else if (perCapita <= 5000) score += 10;
  else score -= 10;

  if (housingType === "rentada") score += 10;
  else if (housingType === "prestada") score += 5;

  if (monthlyExpenses > monthlyIncome) score += 10;

  return Math.min(100, Math.max(10, Math.round(score)));
}

export function evaluateApplicantRules(applicant, call) {
  const issues = [];
  if (applicant.gpa < call.minGpa) {
    issues.push(`Promedio actual (${applicant.gpa.toFixed(1)}) inferior al mínimo requerido (${call.minGpa.toFixed(1)}).`);
  }
  return {
    meetsRequirements: issues.length === 0,
    issues,
  };
}
