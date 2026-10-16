// Registro compartido: solo publicar módulos implementados y habilitados.
export const MODULES = [
  {
    id: "titulacion",
    path: "/titulacion",
    name: "Titulación electrónica",
    shortName: "Titulación",
    description:
      "Expediente, revisión de documentos y seguimiento del trámite.",
    area: "Servicios Escolares",
    pages: {
      perfil: "Datos del egresado",
      documentos: "Documentos",
      seguimiento: "Historial",
    },
    entityName: "Expediente",
    roles: [
      "estudiante",
      "escolares",
      "administrador",
      "tesoreria",
      "vinculacion",
    ],
  },
];

export function homeShortcuts(role) {
  return role === "estudiante"
    ? [
        { path: "/titulacion", label: "Mi solicitud" },
        { path: "/titulacion/documentos", label: "Mis documentos" },
        { path: "/titulacion/seguimiento", label: "Historial del trámite" },
      ]
    : [
        { path: "/titulacion", label: "Solicitudes de titulación" },
        { path: "/notificaciones", label: "Notificaciones" },
      ];
}

export function breadcrumbsFor(pathname, authenticated, entityLabel) {
  const path = pathname.replace(/\/$/, "") || "/";
  const root = authenticated
    ? { label: "Inicio", path: "/" }
    : { label: "Acceso", path: "/acceso" };
  if (path === "/") return [{ label: "Inicio" }];
  if (path === "/acceso") return [{ label: "Acceso" }];
  const pages = {
    "/recuperar": "Recuperar acceso",
    "/ayuda": "Ayuda",
    "/privacidad": "Privacidad",
    "/notificaciones": "Notificaciones",
    "/cuenta": "Mi cuenta",
  };
  if (pages[path]) return [root, { label: pages[path] }];
  const module = MODULES.find(
    (m) => path === m.path || path.startsWith(`${m.path}/`),
  );
  if (!module) return [root, { label: "Página no encontrada" }];
  if (path === module.path) return [root, { label: module.name }];
  const leaf = module.pages?.[path.slice(module.path.length + 1)];
  const isEntity = /^expediente\/\d+$/.test(path.slice(module.path.length + 1));
  if (!leaf && !isEntity) return [root, { label: "Página no encontrada" }];
  return [
    root,
    { label: module.name, path: module.path },
    { label: leaf || entityLabel || module.entityName || "Detalle" },
  ];
}

export function pageTitleFor(pathname, authenticated, role) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/titulacion")
    return `${role === "estudiante" ? "Mi expediente" : "Solicitudes"} · Titulación · UT de Oriental`;
  const items = breadcrumbsFor(path, authenticated);
  return `${
    items
      .slice(authenticated ? 1 : 0)
      .map((item) => item.label)
      .join(" · ") || "Inicio"
  } · UT de Oriental`;
}
