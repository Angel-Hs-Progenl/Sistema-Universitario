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
