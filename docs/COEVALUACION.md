# Coevaluación entre estudiantes · integración propuesta

El líder solicitó integrar el prototipo `Coevaluación/` al portal el 26 de noviembre de 2026. Sus archivos HTML, CSS y JavaScript definían seis criterios editables, escala de 1 a 5, materias, comentarios y un resumen; guardaban todo en `localStorage` y permitían cambiar de rol con un botón. Esta integración conserva esas tareas dentro de la sesión compartida, con datos persistidos y permisos de FastAPI. No convierte sus criterios ni su promedio en una calificación institucional aprobada.

## Roles, tareas y estados

| ID | Criterio verificable de esta integración |
| --- | --- |
| COE-01 | La sesión y el rol del servidor determinan el acceso; no hay selector de rol local. |
| COE-02 | El administrador versiona criterios y prepara actividades con materia, grupo, parcial y fechas. |
| COE-03 | Cada pareja tiene dos cuentas estudiantiles distintas y se asigna antes de abrir. |
| COE-04 | Solo el evaluador asignado puede enviar una respuesta completa una vez y consultar su envío. |
| COE-05 | El seguimiento muestra estado y cantidad de envíos, sin exponer respuestas individuales ni calificación oficial. |

| Rol | Tarea permitida | Respuesta del sistema |
| --- | --- | --- |
| Administrador | Guardar versión de cuestionario; crear actividad por materia, grupo y parcial; asignar parejas distintas; abrir/cerrar recepción; consultar avance de envíos | Solo ve nombres de parejas y si enviaron; no recibe respuestas individuales en su API de seguimiento |
| Estudiante | Ver sus propias asignaciones abiertas/cerradas; responder una vez; consultar su propio envío | La persona evaluada viene de la asignación, no de un nombre escrito por el usuario |
| Otros roles | Ninguna | FastAPI responde 403 |

La actividad pasa `borrador → abierta → cerrada`. Solo el borrador acepta parejas nuevas; abrir exige al menos una. El envío exige periodo vigente, actividad abierta, propiedad de la asignación, todos los criterios y valores enteros de 1 a 5. La fila de actividad se bloquea durante envío y cierre; la base impide duplicar pareja o respuesta. El cuestionario se guarda por versión y las actividades existentes conservan su referencia. Las mutaciones usan la sesión y CSRF compartidos, transacción y evento de cuenta sin respuestas en la bitácora.

La interfaz muestra un promedio descriptivo de la respuesta propia. No genera nota, clasificación, publicación al compañero ni reporte institucional. Los comentarios se guardan para que su autor consulte el envío; su posible uso por otras áreas requiere una regla de privacidad aprobada. No hay datos académicos ni sesiones en `localStorage`.

## Integración y operación

- Cliente: `src/modules/coevaluacion/` y registro en `shared/navigation.js`, dentro del Shell.
- Servidor: `backend/app/modules/coevaluacion/`, router `/api/v1/coevaluacion`.
- Persistencia: migración Alembic `0010_coevaluacion.py`, posterior a `0009`.
- La carpeta `Coevaluación/` conserva la procedencia del prototipo. Sus archivos originales están en el commit `6449fdd`; la página independiente se retiró para evitar un segundo flujo sin permisos.

Antes de operar con datos reales, el área académica debe ratificar quién configura actividades, catálogo de grupos y materias, escala y criterios, reglas de asignación, visibilidad de comentarios/resultados, anonimato, correcciones y conservación. La implementación es una propuesta para validación local, sin aprobación institucional formal.
