import test from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbsFor,
  homeShortcuts,
  MODULES,
  pageTitleFor,
} from "../shared/navigation.js";

test("Migas jerárquicas conservan regreso al módulo y la página actual", () => {
  assert.deepEqual(breadcrumbsFor("/titulacion/documentos", true), [
    { label: "Inicio", path: "/" },
    { label: "Titulación electrónica", path: "/titulacion" },
    { label: "Documentos" },
  ]);
  assert.equal(breadcrumbsFor("/titulacion/", true).length, 2);
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
  assert.equal(MODULES.length, 1);
});
