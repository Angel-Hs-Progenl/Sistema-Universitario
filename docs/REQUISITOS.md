# Línea base inicial de requisitos

Fecha de elaboración: 12 de octubre de 2026. Responsable de aprobación: líder del proyecto y representantes de las áreas usuarias de la UT de Oriental, por confirmar. Estado: propuesta inicial implementada para validación; no equivale a aprobación institucional.

## Fuentes recibidas

Se leyeron completos los tres archivos de `Pdf´s Modulos/`: `TITULO ELECTRÓNICO PROYECTO.pdf` (3 páginas), `PROYECTO INTEGRADOR.docx` y `Sistema de gestión de becas.docx`, incluyendo la tabla del documento de evaluación. Las tres páginas del PDF se revisaron visualmente; los Word se analizaron por texto y tablas, sin modificación de sus originales. El nombre “PROYECTO INTEGRADOR” corresponde al módulo de **evaluación docente**, no a una especificación integral de toda la plataforma.

Los documentos originales no se incorporan a Git. Las descripciones siguientes conservan necesidades funcionales; los supuestos añadidos se identifican por separado.

## Mapa del sistema

| Área                   | Alcance                                                                      | Entrega actual                               |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| Plataforma compartida  | Inicio, identidad, sesión, permisos, diseño, notificaciones, navegación      | Implementada para validación local           |
| Titulación electrónica | Expediente y seguimiento desde borrador hasta conclusión                     | Implementada; emisión oficial externa        |
| Evaluación docente     | Encuestas configurables, asignaciones, cálculo, reportes y planes de mejora  | Requisitos identificados; sin implementación |
| Becas                  | Convocatorias, perfil socioeconómico, solicitud, dictamen, cobro, renovación | Requisitos identificados; sin implementación |
| Módulos futuros        | Por acordar con sus responsables                                             | Fuera de alcance hasta aprobarlos            |

## Titulación electrónica

El objetivo de esta versión es permitir que el egresado integre y envíe su expediente; que cada área valide su parte; y que Servicios Escolares registre el avance institucional, con trazabilidad. La generación, firma y envío oficial del título a SEP requiere una especificación e integración adicional.

| ID     | Necesidad y criterio de aceptación                                                        | Implementación / decisión                                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TIT-01 | Iniciar y cerrar sesión; recuperación de acceso                                           | Sesión de 8 h, cookie HttpOnly, contraseña con scrypt; token de recuperación válido 30 min y de un solo uso. SMTP configurable y buzón local explícito en desarrollo |
| TIT-02 | Respetar Estudiante, Escolares, Administrador, Tesorería y Vinculación                    | Autorización en cada operación del servidor; el estudiante solo consulta lo suyo; administración no suplanta validaciones de otras áreas                             |
| TIT-03 | Guardar matrícula, CURP, nombre, carrera, generación, correo, teléfono y domicilio        | Perfil validado por esquema; correo ligado a cuenta. CURP se verifica por formato, sin consulta a RENAPO                                                             |
| TIT-04 | Subir acta, CURP, certificado, servicio social, no adeudo, pago y documento de titulación | Siete obligatorios iniciales; fotografía opcional. **Supuesto por confirmar:** el PDF presenta documentos “por ejemplo”, no una lista institucional definitiva       |
| TIT-05 | Mostrar estado individual y observaciones                                                 | Pendiente sin archivo; recibido, validado o rechazado con archivo. Rechazar exige observación                                                                        |
| TIT-06 | Validar extensión y tamaño; nombres de almacenamiento automáticos                         | PDF/JPG hasta 5 MB, firma inicial de contenido comprobada, UUID en disco y descarga autenticada. Límite de 5 MB propuesto por el equipo                              |
| TIT-07 | Folio único por trámite                                                                   | `TIT-año-secuencia`, generado con ID de base; no se calcula en el navegador. Un expediente no cancelado por egresado                                                 |
| TIT-08 | Enviar y corregir                                                                         | Envío exige perfil y siete archivos. Corrección permite reemplazar no validados y reenviar; revisión bloquea perfil y archivos                                       |
| TIT-09 | Tesorería solo valida pagos                                                               | Solo visualiza comprobante de pago y datos mínimos; no modifica expediente académico ni estado general                                                               |
| TIT-10 | Vinculación valida estadías y seguimiento de egresados                                    | Dictamen con observación; necesario junto con los siete documentos validados para aprobar expediente                                                                 |
| TIT-11 | Servicios Escolares consulta solicitudes, documentos y avance                             | Bandeja, búsqueda por folio/nombre/matrícula/carrera, filtro por estado y expediente. Límite actual: 500 recientes                                                   |
| TIT-12 | Conservar estados, fechas y siguiente paso                                                | Once estados del PDF, máquina de estados y versión de concurrencia. Instrucciones visibles por estado                                                                |
| TIT-13 | Notificar cambios y conservar actividad                                                   | Notificaciones internas e historial de eventos en la misma transacción que el cambio. Correo de estado aún no implementado                                           |
| TIT-14 | Copias de seguridad                                                                       | Script pg_dump + archivos, procedimiento de restauración y verificación. Automatización/retención por definir                                                        |
| TIT-15 | Proteger sesiones, contraseñas, archivos y permisos                                       | Hash lento con sal, tokens almacenados como hash, CSRF, origen permitido, consultas ORM y rutas de archivo no públicas. Antivirus y hardening operativo pendientes   |
| TIT-16 | Reportes y usuarios administrativos                                                       | Exportación CSV; altas por CLI de operador. Pantalla de gestión de usuarios, importación masiva y reportes PDF administrativos pendientes                            |

El menú del PDF se organiza en vistas funcionales: “alumnos” se consulta dentro del expediente; documentos, validación y pagos se presentan por rol en ese mismo contexto. No se crean diez pantallas vacías para repetir el menú. Se conserva la responsabilidad de cada área.

## Estados y reglas

| Estado                   | Siguientes estados permitidos                                                        | Condición                                                         |
| ------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Borrador                 | Solicitud enviada, Cancelado                                                         | Estudiante prepara y confirma; cancelación con motivo             |
| Solicitud enviada        | En revisión, Cancelado                                                               | Escolares recibe expediente                                       |
| En revisión              | Documentación incompleta, Documentación rechazada, Documentación validada, Cancelado | Dictámenes por área; validación exige todos los requisitos        |
| Documentación incompleta | Solicitud enviada, Cancelado                                                         | Estudiante adjunta y reenvía                                      |
| Documentación rechazada  | Solicitud enviada, Cancelado                                                         | Estudiante atiende observaciones y reenvía                        |
| Documentación validada   | En proceso de titulación, Cancelado                                                  | Escolares inicia gestión                                          |
| En proceso de titulación | Título en trámite, Cancelado                                                         | Referencia institucional obligatoria para pasar a trámite         |
| Título en trámite        | Título disponible, Cancelado                                                         | Disponibilidad registrada por Escolares e indicaciones de entrega |
| Título disponible        | Trámite concluido                                                                    | Escolares registra entrega / cierre con observación               |
| Trámite concluido        | Ninguno                                                                              | Conservación y consulta                                           |
| Cancelado                | Ninguno                                                                              | Se permite iniciar otro expediente con nuevo folio                |

**Supuestos de negocio por aprobar:** quién puede cancelar en cada etapa; un solo trámite no cancelado por persona; validaciones aplicables a cada modalidad; cómo atender correcciones después de validar; quién confirma la entrega. Un cambio aprobado debe modificar dominio, pruebas y documentación juntos.

## Evaluación docente para el equipo responsable

El documento exige autenticación institucional sin almacenar contraseñas del correo; asignaciones estudiante-docente-asignatura por periodo; una evaluación por asignación; bloqueo tras envío salvo autorización. Preguntas, tres secciones, escala y rangos deben poder configurarse. Los nombres y escala del Word son ejemplos pendientes de Dirección Académica.

Requisitos identificados: EVD-01 acceso y asignaciones; EVD-02 cuestionario versionado; EVD-03 una respuesta por asignación; EVD-04 comentarios sin identidad en el reporte del docente; EVD-05 promedios por pregunta, sección y docente; EVD-06 fortalezas y oportunidades con rangos configurables; EVD-07 IA de apoyo sobre comentarios sin inventar evidencia; EVD-08 gráficas; EVD-09 reporte individual PDF y concentrados Excel; EVD-10 retroalimentación y plan de acción; EVD-11 panel y filtros de Dirección; EVD-12 publicación controlada del reporte al docente.

Antes de desarrollar: acordar fórmula y ponderaciones, anonimato y tamaño mínimo de grupo, tratamiento de faltantes, periodos, importación de asignaciones, proveedor institucional de identidad, revisión humana de IA y retención de respuestas. No reutilizar la autenticación local como sustituto del SSO exigido para este módulo.

## Becas para el equipo responsable

Requisitos identificados: BEC-01 perfil personal/académico/socioeconómico; BEC-02 búsqueda y convocatorias; BEC-03 solicitud con documentos y seguimiento; BEC-04 estudio socioeconómico y comprobantes; BEC-05 formularios configurables; BEC-06 reglas mínimas por convocatoria; BEC-07 comité y dictamen manual; BEC-08 calendario de órdenes de cobro; BEC-09 renovación; BEC-10 exportación y estadísticas; BEC-11 roles administrador/evaluador/auditor/estudiante y 2FA; BEC-12 auditoría de cambios.

Antes de desarrollar: acordar criterios, presupuesto, modalidad de selección, apelación, doble postulación, comprobantes, reglas de renovación y quién autoriza órdenes. El texto no define una integración bancaria. La decisión de elegibilidad debe tener evidencia y responsable humano; no delegarla a una IA sin especificación y autorización institucional.

## Requisitos transversales

| ID      | Criterio                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| BASE-01 | Una identidad, navegación y biblioteca de UI para toda la plataforma                                              |
| BASE-02 | React/JS + FastAPI/Python + PostgreSQL; monolito modular                                                          |
| BASE-03 | UI adaptable y operable con teclado; estado visible por texto además de color                                     |
| BASE-04 | No exponer secretos, contraseñas, expedientes o archivos internos en Git                                          |
| BASE-05 | Migraciones versionadas y pruebas de permisos/aislamiento; cambios sujetos a revisión                             |
| BASE-06 | Operación real requiere restauración probada, aviso de privacidad, responsables, soporte y validación del cliente |
