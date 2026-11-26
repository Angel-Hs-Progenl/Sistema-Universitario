// Catálogo oficial de la Universidad Tecnológica de Oriental (UTO)

export const CARRERAS_UTO = [
  "Agricultura Sustentable y Protegida",
  "Cadena de Suministro",
  "Clasificación Arancelaria y Despacho Aduanero",
  "Desarrollo de Software Multiplataforma",
  "Mercadotecnia",
  "Mantenimiento Industrial",
  "Sistemas Automotrices",
  "Tecnología de Alimentos",
  "Desarrollo y Gestión de Software",
  "Diseño y Gestión de Redes Logísticas",
  "Enfermería",
  "Innovación de Negocios y Mercadotecnia",
  "Logística Comercial Global",
  "Procesos Alimentarios",
];

export const NIVELES_ESTUDIO = [
  "Técnico Superior Universitario",
  "Licenciatura / Ingeniería",
];

export const CUATRIMESTRES_DEFAULT = ["3°", "5°", "6°", "9°"];

export const SISTEMAS_ESTUDIO = [
  { id: "presencial", name: "Presencial" },
  { id: "mixto", name: "Mixto (Híbrido)" },
];

export const MODALIDADES = [
  { id: "academica", name: "Beca Académica" },
  { id: "escasos_recursos", name: "Beca Escasos Recursos Económicos" },
  { id: "alimenticia", name: "Beca Alimenticia" },
  { id: "hijos_personal", name: "Beca Hijas e Hijos del Personal de la Universidad" },
];

export const ESTADOS_BECA = {
  recibida: "Solicitud recibida",
  revision: "En revisión por comité",
  aprobada: "Beca aprobada",
  rechazada: "Solicitud rechazada",
  renovada: "Beca renovada",
};

export const RENEWAL_ESTADOS = {
  solicitada: "Solicitada",
  aprobada_renovacion: "Aprobada",
  rechazada_renovacion: "Rechazada",
};

export const VALIDATION_ESTADOS = {
  pendiente: "Pendiente de validación",
  validado: "Validado",
  observado: "Con observaciones",
};

export const DOCUMENTOS_BECA = [
  {
    id: "no_adeudo",
    name: "Constancia de No Adeudo emitida por Tesorería",
    required: true,
    formats: ["application/pdf"],
    max_size_mb: 1,
  },
  {
    id: "kardex",
    name: "Kárdex o constancia de calificaciones",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "anexo1_protesta",
    name: "Anexo 1 - Carta bajo protesta de decir verdad (Firma tinta azul)",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "comprobante_ingresos",
    name: "Comprobante de ingresos mensual (Nómina o constancia laboral)",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "constancia_laboral_coordinador",
    name: "Constancia laboral entregada a Coordinador (Sistema Mixto/Híbrido)",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "valoracion_medica",
    name: "Valoración médica emitida por el área de Enfermería UTO",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "acta_nacimiento",
    name: "Acta de nacimiento del estudiante",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "constancia_laboral_rh",
    name: "Constancia laboral emitida por Recursos Humanos UTO",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "constancia_discapacidad",
    name: "Certificado médico de discapacidad emitido por DIF o Salud Pública",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
  {
    id: "constancia_indigena",
    name: "Constancia oficial de pueblo originario o comunidad indígena",
    required: false,
    formats: ["application/pdf"],
    max_size_mb: 10,
  },
];

export const ESTADOS_ORDEN_COBRO = {
  programada: "Programada",
  emitida: "Orden emitida",
  dispersada: "Dispersada",
};
