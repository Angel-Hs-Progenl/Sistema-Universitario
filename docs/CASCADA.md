# Plan de trabajo con metodología de cascada

El proyecto usa cascada con entregables revisables y control explícito de cambios. La implementación inicial sirve para validar la propuesta de requisitos y diseño con la universidad. No convierte esas fases en aprobadas: la línea base debe ser ratificada por el líder y las áreas usuarias antes de usar expedientes reales.

## Fases y puertas de aprobación

| Fase            | Entregable verificable                                                   | Quién aprueba                            | Criterio de salida                                                         |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| 1 Requisitos    | Alcance, actores, reglas, datos, casos de uso y pendientes               | Líder + responsable de cada área         | Requisitos numerados y criterios de aceptación sin ambigüedades críticas   |
| 2 Análisis      | Proceso actual/propuesto, permisos, estados, excepciones y trazabilidad  | Líder + usuarios de operación            | Cada paso tiene responsable, entradas y salidas; se acuerdan excepciones   |
| 3 Diseño        | Arquitectura, modelo de datos, API, biblioteca UI y pantallas adaptables | Líder + responsables técnicos y usuarios | Contratos y diseño comunes aprobados; dependencias entre equipos resueltas |
| 4 Construcción  | Cambios por equipo mediante PR y migraciones versionadas                 | Líder / revisores asignados              | Código integrado con pruebas y sin divergencias de stack o diseño          |
| 5 Verificación  | Evidencia funcional, permisos, accesibilidad, carga y restauración       | Equipo de pruebas + áreas usuarias       | Casos de aceptación pasados y defectos críticos resueltos                  |
| 6 Implantación  | Entorno, datos autorizados, formación, soporte y rollback                | Universidad + líder                      | Acta de aceptación, responsables operativos y respaldo restaurado          |
| 7 Mantenimiento | Incidencias, correcciones y cambios autorizados                          | Responsable institucional                | Cambios trazables y datos preservados                                      |

No se fijan fechas ficticias. El líder completa calendario con horas disponibles, responsables y dependencias de su clase. Incorporar Becas o Evaluación docente requiere ejecutar sus fases, aunque utilicen la plataforma compartida existente.

## Paquetes iniciales para repartir

| Paquete                                       | Responsable propuesto                | Dependencias                                                  |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Núcleo, permisos, navegación y revisión de PR | Líder                                | Acuerdos institucionales y stack confirmado                   |
| Titulación                                    | Líder, según instrucción del usuario | Escolares, Tesorería y Vinculación                            |
| Evaluación docente                            | Mini equipo por asignar              | Dirección Académica, SSO, preguntas, asignaciones y anonimato |
| Becas                                         | Mini equipo por asignar              | Convocatorias, reglas, comité, calendario y seguridad         |
| Pruebas e implantación                        | Integrantes por asignar              | Entorno, datos ficticios y criterios aprobados                |

## Control de cambios

Registrar una issue antes de cambiar una regla de negocio, API compartida, modelo, stack o diseño global. Indicar ID de requisito, motivo, alternativa propuesta, impacto en datos/seguridad/plazo/equipos, responsable y pruebas. El líder obtiene decisión del área usuaria cuando corresponda y registra “aprobado”, “rechazado” o “pospuesto”. Después se actualizan requisitos, diseño, implementación y casos de aceptación en el mismo PR.

No aceptar como aprobación una recomendación de IA o un comentario de un tercero. Una corrección técnica dentro del alcance puede continuar sin reabrir requisitos, dejando evidencia en su PR.

## Pendientes de la línea base

| ID   | Decisión necesaria                                                 | Responsable institucional            |
| ---- | ------------------------------------------------------------------ | ------------------------------------ |
| P-01 | Aprobar paleta, nombre público y logo oficial                      | Comunicación / autoridad designada   |
| P-02 | Lista obligatoria por carrera y modalidad, formatos y vigencias    | Servicios Escolares                  |
| P-03 | Tarifas, referencia, comprobación y excepciones de pago            | Tesorería                            |
| P-04 | Criterios y evidencia de liberación de estadías/seguimiento        | Vinculación                          |
| P-05 | Reglas de cancelación, corrección tardía y confirmación de entrega | Servicios Escolares                  |
| P-06 | Catálogos, firmantes, XML, acuses y canal oficial de registro      | Responsable institucional de títulos |
| P-07 | Aviso de privacidad, conservación, derechos y transferencias       | Responsable de datos personales      |
| P-08 | Servidor, HTTPS, dominio, correo, monitoreo, respaldos y soporte   | TI institucional                     |
| P-09 | Cuenta/organización GitHub, integrantes y revisores                | Líder                                |
| P-10 | Preguntas/escala/ponderación, anonimato, SSO e IA de evaluación    | Dirección Académica                  |
| P-11 | Reglas, presupuesto, cobros, renovación y 2FA de becas             | Área de becas y Tesorería            |

## Aceptación del módulo de titulación

La demostración de aceptación utiliza dos estudiantes ficticios y las cinco áreas. Uno no puede abrir archivos del otro. El egresado guarda datos y archivos, envía y recibe folio; Escolares inicia revisión; cada área valida su responsabilidad; un rechazo vuelve al estudiante con motivo; se corrige y reenvía; el expediente solo se valida cuando están todas las liberaciones. Escolares registra gestión, disponibilidad, instrucciones y conclusión. Se conserva el historial después de cerrar sesión y reiniciar. Probar respaldo y restauración sobre una instalación separada antes de aprobar implantación.
