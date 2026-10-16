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

## Revisión CR-003 · Bienvenida y espacio privado

- Cinco pruebas npm aprobadas: dos contratos existentes y tres pruebas de jerarquía/rutas, folio recibido y accesos por rol. Compilación de producción aprobada.
- Navegador: la raíz sin sesión lleva al acceso; el login normal lleva a Inicio; un enlace privado a documentos conserva el destino tras autenticar; las migas regresan a Inicio y al módulo; un expediente autorizado muestra el folio real.
- Home revisado a 320, 390, 768 y 1440 px sin desbordamiento global. Documentos y bienvenida revisados en móvil. La imagen mantiene proporción y no sustituye el formulario.
- Menú móvil nativo: foco contenido, Escape, cierre y foco de vuelta a Abrir menú comprobados.
- Se detectó y corrigió la conservación del destino de una cuenta anterior al salir. El logout carga un documento nuevo y el siguiente login vuelve a Inicio. Se comprobó con Servicios Escolares. Las rutas exclusivas del estudiante redirigen al personal a su bandeja.
- Capturas con datos ficticios: output/qa/bienvenida-v3.png, inicio-privado-v3.png, bienvenida-v3-movil.png y expediente-migas-v3.png. Están excluidas de Git.
- No cambió la API ni el esquema. La suite PostgreSQL de 19 pruebas consta en CR-002; no se declara una nueva ejecución para cambios exclusivamente del cliente.
- La ilustración es SVG propio, con entrada finita de hasta 1.1 s y regla prefers-reduced-motion. No se realizó auditoría completa de accesibilidad, lector de pantalla, zoom de navegador ni prueba de aceptación con usuarios.

En la bandeja del personal a 320 px se detectó que texto oculto de la tabla escapaba del contenedor. Se estableció el contenedor de posicionamiento de table-scroll: el ancho global quedó en 305 px para un viewport de 320, mientras la tabla de 650 px se desplaza dentro de una región de 239 px.

## Revisión CR-004 · Laravel, acceso y navegación superior

- Cinco pruebas npm aprobadas y compilación del frontend aprobada. No cambió backend, API, catálogo de estados ni esquema. La ejecución de 19 pruebas PostgreSQL de CR-002 sigue siendo evidencia histórica, no una nueva ejecución de esta revisión.
- Inspección directa del sitio público de Laravel: captura, DOM y estilos computados. Observaciones e inferencias separadas en ESTUDIO-LARAVEL.md, con comparación de opciones gratuitas. Ninguna dependencia nueva.
- Acceso real con las cuentas ficticias de estudiante y Servicios Escolares; ambos llegan al home compacto. Se abrió el expediente, documentos y perfil académico; cerrar sesión regresa al acceso con formulario vacío.
- Login, resumen y bandeja revisados a 320/390/768/1440 px: scrollWidth global igual a clientWidth. A 320, tabla de 650 px dentro de región de 281 px; página de 305 px. Perfil y acciones de documentos comprobados a 320.
- Menú móvil nativo: foco inicial en Cerrar menú, Escape y regreso al botón Abrir menú. Diálogo de dictamen abierto/cerrado, elección inicial vacía y foco devuelto al documento; no se guardó un dictamen ni se modificaron expedientes.
- Búsqueda sin coincidencias muestra estado vacío; limpiar restaura la fila. Filtro de concluidos oculta el expediente en revisión; Todos los estados lo restaura. Expediente autorizado muestra TIT-2026-000002 en las migas.
- El navegador de verificación devuelve prefers-reduced-motion=true. Se verificó CSS animationName=none y el texto Movimiento reducido, sin botón de repetición ineficaz. La secuencia normal de 1.7 s está implementada y revisada en CSS, pero no se afirma haber observado su reproducción en este navegador con la preferencia desactivada.
- Capturas locales con datos ficticios: output/qa/login-v4.png, expediente-v4.png, bandeja-v4.png y perfil-v4-movil.png. Se excluyen de Git. Pendientes: aceptación visual del líder, usuarios institucionales, zoom y auditoría completa de accesibilidad.

## Revisión CR-005 · Identidad y acceso institucional

13 de octubre de 2026. Migración aditiva 0003 aplicada en PostgreSQL local. Conservados seis usuarios ficticios, dos expedientes y diez documentos. El PNG servido y el original entregado tienen el mismo SHA-256. No se borraron ni reinicializaron los expedientes.

- Suite completa PostgreSQL: 41 pruebas aprobadas. Incluye las 19 previas y 22 nuevas de identidad: teléfono explícito, normalización, dominio productivo, privilegios de operador, unicidad y rollback, revocación de sesiones, nombre visible/CSRF, auditoría y redacción de errores.
- Google: firma real de tokens de prueba con claves/certificados efímeros en memoria; rechazo de audiencia, emisor, vencimiento y firma incorrectos. Flujo con respuestas de proveedor simuladas: state/cookie/PKCE/nonce, expiración, reutilización, dominio, correo verificado, cuenta no habilitada, sub incompatible y rol preservado. No se contacta Google ni se envían SMS en la suite. Se aíslan credenciales OAuth/SMTP del entorno de desarrollo.
- Frontend: cinco pruebas npm y compilación aprobadas. Dependencias Python sin conflictos según pip check. Tres pruebas de protección de Git aprobadas, incluidas exportaciones OAuth, estado de navegador y HAR.
- Navegador: acceso real con teléfono reservado +12025550100 y contraseña demo; llegada a Inicio. Guardado/persistencia del nombre visible sin cambiar el nombre académico; menú por clic, Escape con devolución del foco y logout. Google deshabilitado con explicación porque no existen credenciales institucionales configuradas.
- Login y cuenta a 320/390/768/1440 px sin desbordamiento global. Se corrigió el ancho del desplegable a 320 para mantener su borde dentro del viewport. Capturas seleccionadas en docs/capturas, todas con datos ficticios, enlazadas desde README; output continúa ignorado.
- Marca: se observó primero la cara oficial (opacidad 1/azor 0) tras recargar y luego la cara del azor (oficial 0/azor 1). El navegador pide movimiento reducido: se comprobó el intercambio estático. El giro normal está implementado en CSS; no se afirma reproducción observada con esa preferencia desactivada.
- Inicio/detención de servidores Windows comprobado: se corrigió el manejo DateTime de ConvertFrom-Json y el seguimiento de procesos hijos. Tras detener, ambos puertos quedaron libres; al iniciar, sus procesos propietarios quedaron registrados.

Limitaciones: Google Workspace real pendiente de cliente OAuth y validación institucional; logo y procedimiento de vinculación pendientes de aprobación. No se realizó prueba de producción, de carga, lector de pantalla, zoom o auditoría WCAG completa. Las capturas no prueban seguridad por sí mismas.

## Revisión CR-006 · Control de animaciones

13 de octubre de 2026. Cinco pruebas del frontend y compilación aprobadas. Sin cambios en backend o esquema; no se repitió la suite PostgreSQL.

- Navegador: sin preferencia guardada, las animaciones están activas y el footer ofrece Desactivar animaciones. Se comprobó animationName=layer-enter aun cuando el navegador solicita movimiento reducido, conforme al cambio autorizado CR-006.
- Desactivar aplica animationName=none inmediatamente; cambia el botón a Activar animaciones y muestra Animaciones desactivadas en la bienvenida. La elección se conserva al recargar y al navegar a Ayuda. Reactivar devuelve la preferencia a on.
- Footer revisado a 320, 390, 768 y 1440 px: scrollWidth igual a clientWidth, sin desbordamiento global. La preferencia almacena únicamente on/off; no contiene sesiones ni expedientes.
- Evidencia local en output/qa/animaciones-footer.png, excluida de Git. No se realizó una nueva auditoría completa de accesibilidad ni aceptación institucional.

## Revisión CR-007 · Auditoría integral

13 de octubre de 2026. Investigación, hallazgos y pendientes en REVISION-INTEGRAL.md. Se conservan arquitectura modular, paleta, bienvenida y preferencia de animaciones CR-006.

- Siete pruebas npm aprobadas, formato Prettier y compilación final aprobados. Nuevas regresiones de títulos por tarea/rol y rutas desconocidas.
- Suite completa PostgreSQL en uto_test: 42 pruebas aprobadas. La nueva regresión comprueba lista/detalle para cinco roles, minimización de identidad académica, nuevas instantáneas e instantánea heredada; la cuenta propia conserva sus preferencias. Tras el ajuste final del fallback CSV, dos pruebas relevantes de privacidad/exportación repetidas y aprobadas.
- Tres pruebas del guard de repositorio aprobadas. El primer intento no pudo escribir los repositorios temporales dentro del sandbox; se repitieron con permisos adecuados, sin modificar las pruebas. Sigue la advertencia histórica de Starlette sobre su cliente de pruebas.
- Navegador con los cinco roles ficticios: acceso/cierre, inicio, documentos, historial, cuenta, ayuda/privacidad/404, bandeja y expediente. Tesorería solo ofrece revisar su comprobante; Vinculación reúne estado y dictamen; Administración no ofrece dictamen de pago/liberación. No se guardaron dictámenes ni se cambiaron estados de los expedientes demo.
- Perfil: envío de CURP inválida rechazado por FastAPI; foco en resumen, enlace enfoca curp, aria-invalid=true y ayuda/error vinculados. Los valores del formulario permanecen visibles. Dictamen inicia sin selección y elegir corrección hace obligatoria la observación con ayuda vinculada. Escape cierra y devuelve foco al disparador.
- Navegación interna comprobada con foco en main y título específico. Menú móvil: Escape y foco de regreso a Abrir menú. Login fallido por teléfono ficticio muestra mensaje y enfoca el resumen; acceso rápido móvil enfoca portal-access.
- A 320 px: inicio, resumen, documentos, historial, cuenta, avisos, ayuda, privacidad y ruta desconocida con un h1 y sin desbordamiento global. Resumen/documentos/perfil/cuenta/ayuda revisados también a 390/768/1440. Bandeja a 320/390/768/1440 sin overflow global; a 320 la tabla de 650 px se desplaza dentro de 281 px. Campos móviles a 16 px.
- Se calculó contraste de tokens: secundario/marfil 5.54:1, secundario/blanco 5.99:1, error/blanco 7.57:1. No equivale a medir todos los estados o certificar accesibilidad.
- Capturas revisadas para publicar: docs/capturas/solicitudes.png y expediente.png, con datos ficticios. Evidencia adicional en output/qa, ignorada. No se publica el índice temporal usado para revisar los archivos actuales.

- Detalle directo del estudiante comprobado: conserva los documentos y el historial completo del expediente solicitado; las migas regresan al módulo.
- Control sobre un índice temporal de los archivos actuales: 108 blobs, cero hallazgos. El índice real del usuario permanece sin preparar. El control no detecta todos los datos personales; se revisaron también diff y capturas.

Límites: error inicial de avisos y enlaces por solicitud revisados en código; no se simuló caída de red ni se probó lector de pantalla. Quedan pendientes zoom real, alto contraste, otros navegadores, carga representativa, usabilidad con usuarios y aceptación institucional. No cambió el esquema ni se borraron instantáneas históricas o expedientes. No se realizaron commit o push.

## Revisión CR-008 · Bienvenida de servicios universitarios

13 de octubre de 2026. Siete pruebas npm, compilación y formato Prettier aprobados. Cambio de presentación: sin nuevas dependencias, backend, modelos o permisos; no se repitió la suite PostgreSQL en esta revisión.

- Titular Servicios de tu universidad, contexto Portal universitario y mensaje para trámites/evaluaciones/apoyos. Una nota distingue Titulación disponible de las próximas etapas. No se añadieron módulos o accesos ficticios al inicio privado.
- Ilustración SVG original de azor entregando un documento en una bandeja, sobre una base isométrica. Usa tokens existentes, sin recursos remotos, sellos o datos personales. El SVG es decorativo, con aria-hidden en el contenedor y focusable=false.
- Navegador: Repetir inicia azor-arrive y document-delivery, con desplazamiento inicial de la hoja; desactivar en el footer elimina ambas animaciones y deja la composición final visible. La elección se conserva al recargar. Se reactivó al terminar. Entrada finita de hasta 1.95 s; el formulario no depende de su finalización.
- Bienvenida a 320/390/768/1440 px: clientWidth y scrollWidth iguales, con un h1 y formulario presente. El acceso rápido móvil enfoca portal-access. Se restauró el tamaño normal del navegador tras las comprobaciones.
- Capturas anónimas revisadas: docs/capturas/acceso.png y acceso-movil.png actualizadas para README. Copias locales en output/qa/bienvenida-cr008*.png, ignoradas.

La coevaluación/autoevaluación por parcial queda registrada como necesidad futura del líder; faltan especificaciones académicas y desarrollo. No se cambiaron reglas institucionales ni se declara aceptación o producción. Los cambios de esta revisión permanecen sin commit ni push.

## Revisión CR-009 · Anatomía del azor y rótulo

13 de octubre de 2026. Siete pruebas npm, compilación y formato Prettier aprobados. Solo cambia la ilustración del ave y la posición del rótulo; no se repitió la suite de backend al no cambiar su código.

- Investigación: fichas de SEO/BirdLife y Cornell Lab; fotografías observadas en la galería pública de Cornell. Fuentes en DISENO.md. No se descargaron ni incorporaron fotografías o ilustraciones ajenas al repositorio.
- Azor vectorial original separado en Goshawk.jsx: alas más anchas y de contorno redondeado, cola larga barrada, pecho claro barrado, ceja clara, cabeza compacta, pico curvo y garras articuladas. Se conserva la interpretación de color con tokens y la animación compartida.
- UT DE ORIENTAL centrado en la cara frontal de la plataforma: sus extremos quedan aproximadamente en x=219 y x=328 del viewBox, dentro de la cara x=150..397. Los bordes superior/inferior del rótulo quedan a 5.13 y 22.87 unidades de la línea superior, dentro de los 28 de altura de la cara. Comprobación por límites renderizados, pendiente y escala SVG, además de inspección visual.
- Navegador: 320/390/768/1440 px sin desbordamiento global. Desactivar animaciones produce animationName=none y opacidad 1 del ave; se reactivaron al terminar. Se restauró el tamaño normal del navegador.
- Capturas anónimas revisadas de escritorio/móvil actualizadas en docs/capturas/acceso.png y acceso-movil.png. Copias locales en output/qa/azor-cr009*.png, ignoradas. El resto de la composición, documentos, bandeja, login y logo del header se conserva.

Propuesta gráfica pendiente de revisión del líder; no se declara identidad zoológica oficial de la mascota, aceptación institucional ni validación de producción. Sin commit o push.
