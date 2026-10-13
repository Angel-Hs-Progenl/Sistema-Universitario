# Evidencia de validación inicial

Fecha: 12 de octubre de 2026. Entorno: Windows, Node.js 24, Python 3.12 y PostgreSQL 16 aislado en localhost:5434. Todos los expedientes y archivos utilizados son ficticios. Esta evidencia confirma funcionamiento local; la aceptación de las áreas universitarias sigue pendiente.

## Resultados

| Comprobación                                              | Resultado                                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                | 2 pruebas de contrato aprobadas: catálogo/transiciones cliente-servidor y separación de validación de pago.                                                                                                                                                      |
| `npm run build`                                           | Compilación de producción completada con rutas diferidas y fuentes alojadas en el proyecto.                                                                                                                                                                      |
| pytest con `TEST_DATABASE_URL` PostgreSQL                 | 19 pruebas aprobadas.                                                                                                                                                                                                                                            |
| Alembic `upgrade head` y `check`                          | Migraciones aplicadas; sin cambios de esquema pendientes.                                                                                                                                                                                                        |
| Auditoría de dependencias npm y pip-audit del lock Python | Sin vulnerabilidades conocidas reportadas al ejecutar la consulta. No equivale a auditoría de seguridad de la aplicación.                                                                                                                                        |
| Restauración del respaldo                                 | Dump restaurado en `uto_restore_20261012`, separado de `uto`. Se compararon 6 usuarios, 2 solicitudes, 10 documentos y 3 eventos; coinciden. Los 10 archivos coinciden por SHA-256. Acceso, folio, historial y descarga PDF comprobados desde la API recuperada. |
| Revisión del navegador                                    | Inicio, acceso, guardado del perfil, cierre de sesión, rechazo de envío incompleto, bandeja de Escolares, búsqueda sin resultados y consulta de expediente.                                                                                                      |
| Adaptación                                                | Vistas inspeccionadas a 390, 768 y 1440 px. Se corrigió el desbordamiento del menú de titulación en móvil. La tabla administrativa permite desplazamiento dentro de su contenedor.                                                                               |

## Cobertura relevante del backend

La suite recorre el expediente completo, corrección y reenvío, permisos por área, aislamiento entre estudiantes y borradores ocultos al personal. Comprueba requisitos faltantes, rechazo con motivo, versiones obsoletas, documentos validados que no pueden reemplazarse, PDF/JPG inválidos o demasiado grandes, CSRF/origen, revocación de sesión, recuperación con token de un uso, inyección de fórmulas CSV y límites de intentos.

En PostgreSQL también se verifica que dos creaciones concurrentes produzcan una sola solicitud activa. Las pruebas usan `uto_test`, nunca la base de desarrollo. No deben apuntarse a datos reales.

Las capturas locales quedan en `output/qa/` (excluido de Git). Se revisaron etiquetas, foco del contenido al navegar y diálogo nativo de confirmación. No se ha realizado auditoría WCAG completa ni evaluación con lectores de pantalla o usuarios de la universidad.

## Lo que aún requiere validación

- Requisitos, documentos obligatorios, estados y facultades definitivas con Servicios Escolares, Tesorería y Vinculación.
- Manual institucional, logo, paleta y aviso de privacidad aprobado.
- Emisión/firma/envío oficial del título ante el canal autorizado: la aplicación administra el expediente y registra referencias externas.
- SMTP institucional, SSO/MFA cuando corresponda, antivirus, cuotas y conciliación de archivos.
- Pruebas de carga, revisión de seguridad, monitoreo, retención y recuperación operativa fuera del equipo local.
- Ejecución del workflow en GitHub, protección de main y CODEOWNERS con usuarios reales, después de crear el repositorio remoto.

Starlette emite una advertencia de futura migración del cliente de pruebas HTTP; la suite pasa con el lock actual. No se considera un error de la aplicación.

## Repetición y aceptación

Los comandos están en README.md. Tras cambios, ejecutar las pruebas pertinentes, compilar y adjuntar evidencia de las vistas afectadas. Un cambio en requisitos debe registrarse en CASCADA.md antes de integrarse. La aprobación formal de cada fase corresponde al líder y al área usuaria; este registro no sustituye esa aprobación.

## Revisión CR-002 · Diseño y Git (12 de octubre de 2026)

- Compilación React y dos pruebas de contrato aprobadas después del rediseño.
- 19 pruebas PostgreSQL aprobadas; se amplió el caso de corrección para impedir reenviar un documento rechazado sin reemplazarlo.
- Dos pruebas de la protección de repositorio aprobadas: bloquean archivo privado/credencial sintética sin imprimirla, y aceptan el ejemplo sanitizado/migraciones. Se ejecutan en repositorios temporales.
- Revisión de navegador con cuentas ficticias: entrada, sesión de estudiante, resumen/tareas/faltantes, envío incompleto deshabilitado, error de CURP con foco y enlace al campo, corrección y guardado, selección y reemplazo de PDF y vuelta al resumen. La selección no se presenta como archivo guardado.
- Evidencia local en output/qa/_v2_.png; no contiene expedientes reales y se excluye de Git. Las vistas se revisan a 320, 390, 768 y 1440 px; la navegación/tabla se desplazan dentro de sus regiones, sin desbordamiento global.
- Investigación y criterios para los equipos en AUDITORIA-DISENO.md. No se realizaron pruebas con usuarios institucionales, auditoría WCAG completa, zoom de navegador ni pruebas de lectores de pantalla.
- La revisión de secretos cubre el índice y commits disponibles localmente, no ramas remotas que no se hayan obtenido ni servicios externos. No se reescribió historial ni se rotaron credenciales.

En Servicios Escolares se comprobó búsqueda por folio, expediente, dictamen inicial vacío, observación obligatoria al elegir rechazo y devolución del foco al botón Revisar al cerrar. No se guardó un dictamen de prueba sobre ese expediente.
