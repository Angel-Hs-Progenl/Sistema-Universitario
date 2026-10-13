import test from "node:test";
import assert from "node:assert/strict";
import {
  breadcrumbsFor,
  homeShortcuts,
  MODULES,
} from "../shared/navigation.js";

test("Migas jerárquicas conservan regreso al módulo y la página actual", () => {
  assert.deepEqual(breadcrumbsFor("/titulacion/documentos", true), [
    { label: "Inicio", path: "/" },
    { label: "Titulación electrónica", path: "/titulacion" },
    { label: "Documentos" },
  ]);
  assert.equal(breadcrumbsFor("/titulacion/", true).length, 2);
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
