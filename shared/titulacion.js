export const ROLES = {
  estudiante: "Estudiante",
  docente: "Docente",
  evaluador: "Comité de Becas",
  auditor: "Auditoría",
  escolares: "Servicios Escolares",
  administrador: "Administrador",
  tesoreria: "Tesorería",
  vinculacion: "Vinculación",
};
export const DOCUMENTS = [
  { id: "acta", name: "Acta de nacimiento", area: "escolares", required: true },
  { id: "curp", name: "Constancia de CURP", area: "escolares", required: true },
  {
    id: "certificado",
    name: "Certificado de estudios",
    area: "escolares",
    required: true,
  },
  {
    id: "servicio",
    name: "Liberación de servicio social",
    area: "escolares",
    required: true,
  },
  {
    id: "noadeudo",
    name: "Constancia de no adeudo",
    area: "escolares",
    required: true,
  },
  {
    id: "pago",
    name: "Comprobante de pago",
    area: "tesoreria",
    required: true,
  },
  {
    id: "titulacion",
    name: "Documento de titulación",
    area: "escolares",
    required: true,
  },
  { id: "foto", name: "Fotografía", area: "escolares", required: false },
];
export const STATES = {
  borrador: "Borrador",
  enviada: "Solicitud enviada",
  revision: "En revisión",
  incompleta: "Documentación incompleta",
  rechazada: "Documentación rechazada",
  validada: "Documentación validada",
  proceso: "En proceso de titulación",
  tramite: "Título en trámite",
  disponible: "Título disponible",
  concluido: "Trámite concluido",
  cancelado: "Cancelado",
};
export const TRANSITIONS = {
  borrador: ["enviada", "cancelado"],
  enviada: ["revision", "cancelado"],
  revision: ["incompleta", "rechazada", "validada", "cancelado"],
  incompleta: ["enviada", "cancelado"],
  rechazada: ["enviada", "cancelado"],
  validada: ["proceso", "cancelado"],
  proceso: ["tramite", "cancelado"],
  tramite: ["disponible", "cancelado"],
  disponible: ["concluido"],
  concluido: [],
  cancelado: [],
};
export const EDITABLE = ["borrador", "incompleta", "rechazada"];
export function canReview(role, kind) {
  const doc = DOCUMENTS.find((d) => d.id === kind);
  return (
    !!doc &&
    (role === doc.area ||
      (role === "administrador" && doc.area === "escolares"))
  );
}
export function readiness(app, docs) {
  return DOCUMENTS.filter(
    (d) =>
      d.required &&
      !docs.some((x) => x.kind === d.id && x.status === "validado"),
  )
    .map((d) => d.name)
    .concat(app.clearance ? [] : ["Liberación de Vinculación"]);
}
export const NEXT = {
  borrador:
    "Completa tus datos y adjunta los documentos para enviar tu solicitud.",
  enviada:
    "Servicios Escolares recibirá tu expediente y comenzará la revisión.",
  revision: "Las áreas responsables están revisando tu documentación.",
  incompleta:
    "Adjunta los documentos pendientes y vuelve a enviar la solicitud.",
  rechazada:
    "Consulta las observaciones, reemplaza los archivos y vuelve a enviar.",
  validada:
    "Tu expediente está completo. Servicios Escolares iniciará la titulación.",
  proceso:
    "Servicios Escolares preparará el trámite ante la autoridad correspondiente.",
  tramite:
    "La institución está gestionando tu título. Recibirás un aviso cuando esté disponible.",
  disponible:
    "Tu título está disponible. Consulta las indicaciones de entrega.",
  concluido: "Tu trámite ha concluido. Conserva tu folio y tus documentos.",
  cancelado: "El trámite fue cancelado. Consulta la observación registrada.",
};
