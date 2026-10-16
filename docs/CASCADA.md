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

## Registro CR-002 · Experiencia institucional y protección de Git

12 de octubre de 2026. Solicitado y autorizado por el líder en este chat: investigar y corregir el diseño genérico del inicio y titulación, y reforzar exclusiones de datos privados. Alcance: Shell, CSS/tokens, directorio, acceso, tareas/resumen, formularios, dictámenes y guardia de Git. No cambia stack, roles ni esquema de datos. La restricción de reenvío de archivos rechazados corrige el caso de uso TIT-08 ya especificado; no introduce otra modalidad de titulación.

Investigación/decisiones: AUDITORIA-DISENO.md. Impacto en equipos: adoptar navegación horizontal, patrones de tarea y errores, y prompts revisados; no duplicar estilos. Evidencia: pruebas de regresión y revisión de navegador en VALIDACION.md. Aprobación del líder permite esta implementación; aceptación institucional y fases formales siguen pendientes. No se abrió una issue ni se modificó GitHub desde esta entrega.

## Registro CR-003 · Bienvenida, home privado y migas de pan

12 de octubre de 2026. Autorizado por el líder en este chat: home con lo principal, migas de pan y arquitectura visual de aplicación privada. El líder eligió explícitamente imagen/animación grande en la bienvenida. Se separan acceso público y home autenticado; se introduce sidebar global compartido y se conservan pestañas locales. Esta elección actualiza la dirección de entrada de CR-002, incluida la restricción anterior sobre ilustración decorativa en la entrada.

Impacto: Shell, rutas del home/acceso, navegación, estilos compartidos y documentación. Sin cambios de stack, roles, esquema o API. El backend conserva la autorización. Referencias y criterios en ARQUITECTURA-UI.md; pruebas en VALIDACION.md. No se afirma aprobación institucional ni se cambian tarifas o requisitos académicos.

## Registro CR-004 · Dirección visual basada en Laravel

12 de octubre de 2026. Autorizado por el líder en este chat: nueva investigación profunda de Laravel, rediseño de login e interior, textos concretos y reemplazo de la navegación lateral. Se conserva el contenido compacto del home que el líder indicó que le gustó. Este cambio actualiza la elección de sidebar y la ilustración/duración de CR-003.

Impacto: Shell y CSS comunes, ilustración SVG original, encabezados y textos de Titulación, guías para equipos. Sin cambios en API, esquema, roles, estados o requisitos académicos. No se añaden bibliotecas, proveedores externos ni Laravel al backend. Investigación y alternativas gratuitas en ESTUDIO-LARAVEL.md. No se abrió una issue externa; este registro conserva la autorización y el alcance. Aceptación visual del líder e institucional pendientes.

## Registro CR-005 · Azor, Google Workspace y menú de cuenta

13 de octubre de 2026. Solicitado por el líder: marca del azor junto a UT de Oriental, giro desde el logo oficial entregado, acceso con Google institucional/teléfono, menú de perfil, capturas publicables e instrucciones para equipos. El líder confirmó Google Workspace y eligió teléfono vinculado con contraseña del portal; no SMS. El resto del diseño conserva CR-004.

Impacto transversal autorizado: marca/Shell, cuenta y acceso, identidad/sesiones compartidas, migración aditiva 0003, dependencia oficial google-auth, logs, exclusiones de Git y documentación. Google requiere credenciales OAuth institucionales externas a esta entrega. No hay registro automático de usuarios, roles derivados de Google, SMS, cambio de estados académicos o suplencia de áreas. La vinculación de teléfono exige un operador administrador autenticado y confirmación previa de titularidad institucional.

Artefactos: ACCESO-INSTITUCIONAL.md, INSTALACION.md, public/brand, docs/capturas, README y prompts revisados. Pruebas y límites en VALIDACION.md. La autorización del líder permite esta implementación; no sustituye aprobación del logo, procedimiento de vinculación, privacidad o implantación por la universidad.

## Registro CR-006 · Animaciones controladas desde el footer

13 de octubre de 2026. El líder solicita activarlas inicialmente y ofrecer su desactivación en el footer. Se reemplaza la detección automática de prefers-reduced-motion por una preferencia compartida de apariencia, persistida como on/off. El control está disponible sin sesión y dentro del portal; desactiva movimiento sin cambiar tareas, permisos o datos.

Impacto: MotionProvider, hook de movimiento, Shell, CSS y guías. Sin nuevas dependencias ni cambios de backend/modelo. Se conserva el giro estático al desactivar. La solicitud del líder autoriza este cambio; la validación institucional general sigue pendiente.

## Registro CR-007 · Revisión integral y correcciones

13 de octubre de 2026. El líder solicita analizar e investigar diseño, textos, estructura, navegación, accesibilidad y usabilidad. Se conservan bienvenida, paleta, home compacto y navegación horizontal. Alcance técnico: títulos, carga dentro del Shell, errores de campo, filtros/avisos, acciones precisas, reducción de repetición y representación por área.

Se detecta metadata de cuenta innecesaria en el contrato del expediente. Se limita su respuesta y las nuevas instantáneas a identidad académica; se conserva el historial y se añade regresión para cinco roles. Sin cambio de modelo, migración, permisos o decisiones institucionales nuevas.

Investigación, correcciones y pendientes: REVISION-INTEGRAL.md. Requisitos: BASE-01/03/04/05 y TIT-02/03/09/10/11/12/13/15. Autorización del líder para esta revisión técnica en el chat; no equivale a aprobación institucional ni cierre formal de fase.

## Registro CR-008 · Bienvenida multimódulo y azor mensajero

13 de octubre de 2026. El líder aclara que la plataforma abarcará Titulación, evaluación docente, coevaluación/autoevaluación de clase por parcial y Becas. Solicita corregir el titular que limitaba el portal a Titulación y reorganizar la ilustración como un azor entregando documentos, conservando la dirección visual inspirada en Laravel.

Cambio autorizado de presentación: título Servicios de tu universidad, contexto Portal universitario y escena SVG original de azor, documento y bandeja sobre plataforma isométrica. La bienvenida identifica Titulación como disponible y evaluaciones/becas como futuras. Se conserva repetición y desactivación del footer; sin dependencias nuevas.

La necesidad de coevaluación/autoevaluación se registra para análisis posterior, sin inventar cuestionarios, rúbricas, permisos, cálculos o fechas. No se implementan ni habilitan módulos nuevos, ni se modifican las reglas de Titulación, API, modelos o autenticación. Alcance transversal revisado por indicación del líder; aceptación institucional general pendiente.

## Registro CR-009 · Azor y posición del rótulo

13 de octubre de 2026. El líder solicita investigar cómo es un azor y rediseñar únicamente el ave de la bienvenida; indica que le gusta el resto de la ilustración y pide corregir UT DE ORIENTAL. Se consultan SEO/BirdLife y Cornell Lab, con observación de fotografías en la galería pública de Cornell.

Cambio de presentación autorizado: dibujo vectorial original en Goshawk.jsx con alas anchas de extremos redondeados, cola barrada larga, ceja clara, pico curvo, pecho claro barrado y garras articuladas. El rótulo se centra dentro de la cara frontal y sigue su perspectiva. Se conservan plataforma, bandeja, documentos, logo del header, login, paleta y animación compartida. Sin nuevos recursos externos, dependencias, modelos, API o requisitos de negocio.

La interpretación gráfica de la mascota sigue siendo una propuesta; no se declara una especie oficial de la universidad. Fuentes en DISENO.md y evidencia local en VALIDACION.md.
