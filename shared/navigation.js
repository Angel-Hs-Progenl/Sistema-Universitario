
/*
 * Registro compartido de módulos del Sistema Universitario.
 * Solo publicar módulos implementados y habilitados.
 */

export const MODULES = [
  // =====================================
  // MÓDULO DE TITULACIÓN
  // =====================================
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

  // =====================================
  // MÓDULO DE BECAS
  // =====================================
  {
    id: "becas",
    path: "/becas",
    name: "Gestión de becas",
    shortName: "Becas",
    description:
      "Convocatorias, estudio socioeconómico, dictamen, órdenes de cobro y renovación.",
    area: "Becas y Apoyos Institucionales",
    pages: {
      solicitudes: "Mis solicitudes",
      socioeconomico: "Estudio socioeconómico",
      renovacion: "Renovación",
      "admin-convocatorias": "Convocatorias y reglas",
      dictamen: "Dictamen y selección",
      "ordenes-cobro": "Órdenes de cobro",
      dashboard: "Tablero y auditoría",
    },
    entityName: "Solicitud",
    roles: [
      "estudiante",
      "escolares",
      "administrador",
      "evaluador",
      "auditor",
      "tesoreria",
      "vinculacion",
    ],
  },

  // =====================================
  // MÓDULO DE EVALUACIÓN DOCENTE
  // =====================================
  {
    id: "evaluacion-docente",
    path: "/evaluacion-docente",
    name: "Evaluación Docente",
    shortName: "Evaluación",
    description:
      "Evalúa a tus docentes, consulta resultados y administra las evaluaciones académicas.",
    area: "Servicios Académicos",
    pages: {
      // Estudiante
      estudiante: "Panel del estudiante",
      "estudiante/mis-evaluaciones": "Mis evaluaciones",
      "estudiante/perfil": "Perfil del estudiante",

      // Docente
      docente: "Panel del docente",
      "docente/resultados": "Resultados",
      "docente/comentarios": "Comentarios",
      "docente/reporte": "Reporte docente",
      "docente/perfil": "Perfil del docente",
      "docente/ayuda": "Ayuda",
      "docente/asignaturas": "Mis asignaturas",

      // Dirección Académica
      direccion: "Dirección Académica",
      "direccion/docentes": "Docentes",
      "direccion/estudiantes": "Estudiantes",
      "direccion/grupos": "Grupos y asignaturas",
      "direccion/periodos": "Periodos académicos",
      "direccion/cuestionarios": "Cuestionarios",
      "direccion/resultados": "Resultados institucionales",
      "direccion/reportes": "Reportes",
      "direccion/planes-accion": "Planes de acción",
    },
    roles: [
      "estudiante",
      "docente",
      "administrador",
    ],
  },
];

// =====================================
// ACCESOS RÁPIDOS DEL PORTAL
// =====================================

export function homeShortcuts(role) {
  return role === "estudiante"
    ? [
        {
          path: "/titulacion",
          label: "Mi solicitud de titulación",
        },
        {
          path: "/becas",
          label: "Convocatorias de becas",
        },
        {
          path: "/becas/solicitudes",
          label: "Mis solicitudes de beca",
        },
        {
          path: "/becas/socioeconomico",
          label: "Estudio socioeconómico",
        },
      ]
    : [
        {
          path: "/titulacion",
          label: "Solicitudes de titulación",
        },
        {
          path: "/becas/dictamen",
          label: "Dictamen de becas",
        },
        {
          path: "/becas/dashboard",
          label: "Tablero y auditoría de becas",
        },
        {
          path: "/notificaciones",
          label: "Notificaciones",
        },
      ];
}

// =====================================
// NAVEGACIÓN Y MIGAS DE PAN
// =====================================

export function breadcrumbsFor(
  pathname,
  authenticated,
  entityLabel
) {
  const path = pathname.replace(/\/$/, "") || "/";

  const root = authenticated
    ? { label: "Inicio", path: "/" }
    : { label: "Acceso", path: "/acceso" };

  if (path === "/") {
    return [{ label: "Inicio" }];
  }

  if (path === "/acceso") {
    return [{ label: "Acceso" }];
  }

  const pages = {
    "/recuperar": "Recuperar acceso",
    "/ayuda": "Ayuda",
    "/privacidad": "Privacidad",
    "/notificaciones": "Notificaciones",
    "/cuenta": "Mi cuenta",
  };

  if (pages[path]) {
    return [root, { label: pages[path] }];
  }

  const module = MODULES.find(
    (m) =>
      path === m.path ||
      path.startsWith(`${m.path}/`)
  );

  if (!module) {
    return [
      root,
      { label: "Página no encontrada" },
    ];
  }

  if (path === module.path) {
    return [
      root,
      { label: module.name },
    ];
  }

  const subruta = path.slice(
    module.path.length + 1
  );

  const leaf = module.pages?.[subruta];

  const isEntity =
    /^(?:expediente|solicitud)\/\d+$/.test(
      subruta
    );

  if (!leaf && !isEntity) {
    return [
      root,
      { label: "Página no encontrada" },
    ];
  }

  return [
    root,
    {
      label: module.name,
      path: module.path,
    },
    {
      label:
        leaf ||
        entityLabel ||
        module.entityName ||
        "Detalle",
    },
  ];
}

// =====================================
// TÍTULOS DE LAS PÁGINAS
// =====================================

export function pageTitleFor(
  pathname,
  authenticated,
  role
) {
  const path =
    pathname.replace(/\/$/, "") || "/";

  if (path === "/titulacion") {
    return `${
      role === "estudiante"
        ? "Mi expediente"
        : "Solicitudes"
    } · Titulación · UT de Oriental`;
  }

  if (path === "/becas") {
    return `${
      role === "estudiante"
        ? "Convocatorias"
        : "Gestión de becas"
    } · Becas · UT de Oriental`;
  }

  const items = breadcrumbsFor(
    path,
    authenticated
  );

  return `${
    items
      .slice(authenticated ? 1 : 0)
      .map((item) => item.label)
      .join(" · ") || "Inicio"
  } · UT de Oriental`;
}
