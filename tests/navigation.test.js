import test from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbsFor,
  homeShortcuts,
  MODULES,
  pageTitleFor,
  moduleLinks,
  notificationDestination,
} from "../shared/navigation.js";

test("Migas jerárquicas conservan regreso al módulo y la página actual", () => {
  assert.deepEqual(breadcrumbsFor("/titulacion/documentos", true), [
    { label: "Inicio", path: "/" },
    { label: "Titulación electrónica", path: "/titulacion" },
    { label: "Documentos" },
  ]);
  assert.equal(breadcrumbsFor("/titulacion/", true).length, 2);
});

test("Los avisos enlazan al módulo y tarea permitidos, sin rutas externas", () => {
  assert.equal(
    notificationDestination({ application_id: 2 }, "estudiante").path,
    "/titulacion/expediente/2",
  );
  assert.equal(
    notificationDestination({ target_path: "/becas/solicitud/3" }, "estudiante")
      .path,
    "/becas/solicitud/3",
  );
  assert.equal(
    notificationDestination({ target_path: "/becas/solicitud/3" }, "auditor"),
    null,
  );
  assert.equal(
    notificationDestination(
      { target_path: "/evaluacion-docente/docente/resultados?periodo=2" },
      "docente",
    ).label,
    "Consultar resultados",
  );
  assert.equal(notificationDestination({ application_id: 2 }, "docente"), null);
  assert.equal(notificationDestination({}, "estudiante"), null);
  for (const target_path of [
    "https://ejemplo.invalid/",
    "//ejemplo.invalid/",
    "/becas/../cuenta",
    "/becas/solicitud/3?url=https://ejemplo.invalid",
  ])
    assert.equal(notificationDestination({ target_path }, "estudiante"), null);
});

test("Los nuevos roles no reciben accesos de otros dominios", () => {
  for (const role of ["docente", "evaluador", "auditor"]) {
    assert.ok(
      homeShortcuts(role).every((item) => !item.path.startsWith("/titulacion")),
    );
  }
  assert.deepEqual(moduleLinks("becas", "vinculacion"), []);
  assert.deepEqual(moduleLinks("becas", "docente"), []);
  assert.deepEqual(moduleLinks("evaluacion-docente", "auditor"), []);
  assert.deepEqual(moduleLinks("becas", "tesoreria"), [
    ["/becas/ordenes-cobro", "Órdenes de cobro"],
  ]);
});

test("Evaluación y Becas conservan contexto en rutas de trabajo", () => {
  assert.equal(
    breadcrumbsFor("/evaluacion-docente/estudiante/evaluar/17", true).at(-1)
      .label,
    "Responder evaluación",
  );
  assert.equal(
    breadcrumbsFor("/becas/solicitud/9", true, "BEC-EJEMPLO").at(-1).label,
    "BEC-EJEMPLO",
  );
  assert.equal(
    pageTitleFor("/evaluacion-docente", true, "docente"),
    "Mis resultados · Evaluación docente · UT de Oriental",
  );
});

test("Las pestañas distinguen tarea y rol sin incluir datos personales", () => {
  assert.equal(
    pageTitleFor("/titulacion", true, "estudiante"),
    "Mi expediente · Titulación · UT de Oriental",
  );
  assert.equal(
    pageTitleFor("/titulacion", true, "tesoreria"),
    "Solicitudes · Titulación · UT de Oriental",
  );
  assert.equal(
    pageTitleFor("/titulacion/documentos", true, "estudiante"),
    "Titulación electrónica · Documentos · UT de Oriental",
  );
  assert.equal(
    pageTitleFor("/", true, "estudiante"),
    "Inicio · UT de Oriental",
  );
  assert.equal(
    pageTitleFor("/recuperar", false),
    "Acceso · Recuperar acceso · UT de Oriental",
  );
});

test("Una ruta desconocida dentro del módulo no se presenta como expediente", () => {
  for (const path of [
    "/titulacion/inexistente",
    "/titulacion/expediente/no-valido",
  ])
    assert.equal(
      breadcrumbsFor(path, true).at(-1).label,
      "Página no encontrada",
    );
  assert.equal(
    breadcrumbsFor("/titulacion/expediente/2", true).at(-1).label,
    "Expediente",
  );
});
test("El folio del expediente procede de datos autorizados, no de inferir el ID", () => {
  const fallback = breadcrumbsFor("/titulacion/expediente/2", true);
  assert.equal(fallback.at(-1).label, "Expediente");
  assert.equal(
    breadcrumbsFor("/titulacion/expediente/2", true, "TIT-2026-000002").at(-1)
      .label,
    "TIT-2026-000002",
  );
});
test("Recuperación y ayuda pública regresan al acceso; roles de personal no enlazan al perfil académico", () => {
  assert.deepEqual(breadcrumbsFor("/recuperar", false), [
    { label: "Acceso", path: "/acceso" },
    { label: "Recuperar acceso" },
  ]);
  assert.equal(breadcrumbsFor("/ayuda", false)[0].path, "/acceso");
  for (const role of ["escolares", "administrador", "tesoreria", "vinculacion"])
    assert.ok(
      homeShortcuts(role).every((x) => x.path !== "/titulacion/perfil"),
    );
  assert.deepEqual(
    MODULES.map((m) => m.id),
    ["titulacion", "becas", "evaluacion-docente"],
  );
});

test("Navegación del módulo de becas resuelve migas y títulos de página", () => {
  assert.deepEqual(breadcrumbsFor("/becas/solicitudes", true), [
    { label: "Inicio", path: "/" },
    { label: "Gestión de becas", path: "/becas" },
    { label: "Mis solicitudes" },
  ]);
  assert.equal(
    pageTitleFor("/becas", true, "estudiante"),
    "Convocatorias · Becas · UT de Oriental",
  );
  assert.equal(
    pageTitleFor("/becas", true, "administrador"),
    "Gestión de becas · Becas · UT de Oriental",
  );
});
