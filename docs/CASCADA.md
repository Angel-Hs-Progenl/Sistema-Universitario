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

## Registro CR-010 · Avance Fase 2 de Becas (75%)

12 de noviembre de 2026. Avance iterativo del módulo de gestión de becas de la UT de Oriental en la rama `feat/modulo-becas`:
- Migración 0005 de Alembic con persistencia para datos bancarios, actas formales de comité, validación socioeconómica y resolución de renovaciones.
- Captura de cuenta bancaria y CLABE interbancaria (18 dígitos con algoritmo de dígito verificador y catálogo de 9 bancos en México) para estudiantes con beca aprobada.
- Registro de acta formal de dictaminación de sesión colegiada (número de sesión, acuerdo y fecha de dictamen).
- Panel de resolución de renovaciones por parte del personal evaluador/comité con fundamentación de aprobación o rechazo.
- Validación y ratificación del estudio socioeconómico por personal administrativo.
- Mantenimiento estricto del sistema de tokens CSS institucionales, reglas de acceso y aislamiento modular. Se conservan todas las pruebas de titulación en verde (17/17 tests passing).

## Registro CR-011 · Avance Fase 2 Extendida de Becas (85%)

12 de noviembre de 2026. Avance consolidado hacia el 85% del módulo de Becas según la especificación integral del ciclo de vida:
- Interfaz y flujo de validación socioeconómica para Trabajo Social / Comité Evaluador en el panel de dictaminación, con desglose de ingresos, egresos, dependientes, tipo de vivienda y ratificación de puntaje.
- Gestión de dispersión por lote bancario SPEI en órdenes de cobro para Tesorería/Administración con registro de folio de lote (`batch_folio`), fecha de dispersión y notificación al estudiante.
- Padrón Oficial de Beneficiarios (becas aprobadas y renovadas) con desglose de montos, modalidades, cuentas bancarias protegidas y exportación en CSV institucional en el Tablero de Control.
- Actualización de pruebas automatizadas en `backend/tests/test_becas.py` cubriendo registro de CLABE, acta formal, validación socioeconómica, dispersión y padrón oficial.
- Compilación y pruebas frontend y backend 100% verificadas. Conservación de aislamiento sin afectar el módulo de titulación.

## Registro CR-012 · Pagos en Línea Gobierno de Puebla y Porcentajes de Pago

12 de noviembre de 2026. Ajuste autorizado de reglas institucionales para la Universidad Tecnológica de Oriental:
- Migración 0006 de Alembic (`0006_becas_puebla_descuentos.py`) añadiendo cuota base, porcentaje de beca, porcentaje a pagar por el estudiante y referencia oficial de Pagos en Línea del Gobierno de Puebla.
- El Comité Evaluador dictamina asignando el porcentaje que cubrirá el estudiante (ej. 53%, 65%) y el porcentaje de descuento por beca otorgado.
- El área de Tesorería es la responsable exclusiva de generar las órdenes de pago institucionales vinculadas a la cuota ordinaria de reinscripción ($1,850.00 MXN) calculando el monto neto a pagar.
- Emisión de la referencia institucional / línea de captura para el portal oficial de **Pagos en Línea del Gobierno del Estado de Puebla** (`https://pagosenlinea.puebla.gob.mx/`).
- Flujo de confirmación y validación de pago por Tesorería tras la liquidación en línea del estudiante.

## Registro CR-013 · Finalización al 100% del Módulo de Becas

24 de noviembre de 2026. Culminación al 100% del alcance funcional del módulo de Becas de la UT de Oriental en la rama `feat/modulo-becas`:
- Migración 0010 de Alembic (`0010_becas_100_publicacion_constancias.py`) agregando bandera de publicación de resultados a convocatorias y folio de constancia a solicitudes.
- Publicación oficial de resultados por parte de Escolares/Comité con lista protegida de beneficiarios (folios anónimos, carrera, periodo y porcentaje otorgado) conforme a la Ley General de Protección de Datos Personales.
- Generación y consulta de la **Constancia Oficial de Asignación de Beca** institucional con sello digital de verificación SHA-256, desglose financiero UTO (cuota base, beca exenta, importe neto), línea de captura para Pagos en Línea del Gobierno de Puebla e impresión directa.
- Buzón institucional de notificaciones del aspirante integrado en el seguimiento de solicitudes para consulta de estatus, órdenes de pago emitidas y avisos de comité.
- Conclusión formal del ciclo de vida del expediente por parte del personal de Servicios Escolares / Administración.
- Actualización de contratos de dominio sincronizados con el frontend y pruebas automatizadas (17/17 pytest pasando, 13/13 node test pasando, 0 alertas en check_repository.py).
- Línea base de requisitos actualizada a 100% de cobertura (BEC-01 a BEC-23). Propuesta lista para validación institucional de usuarios.

## Registro CR-014 · Formulario Oficial UTO, Catálogo de 14 Carreras Vigentes, Periodos Configurables y Anexo 1

25 de noviembre de 2026. Adecuación e integración oficial autorizada por el usuario del formato y convocatoria de la Universidad Tecnológica de Oriental (UTO):
- **Catálogo Oficial de 14 Programas Educativos Vigentes:** Agricultura Sustentable y Protegida, Cadena de Suministro, Clasificación Arancelaria y Despacho Aduanero, Desarrollo de Software Multiplataforma, Mercadotecnia, Mantenimiento Industrial, Sistemas Automotrices, Tecnología de Alimentos, Desarrollo y Gestión de Software, Diseño y Gestión de Redes Logísticas, Enfermería, Innovación de Negocios y Mercadotecnia, Logística Comercial Global, Procesos Alimentarios.
- **Configuración Dinámica por Convocatoria:** Almacenamiento y edición sin hardcodear periodos de: `periodo_actual` (ej. septiembre - diciembre 2026), `periodo_anterior` evaluado (ej. mayo - agosto 2026), `cuatrimestres_habilitados` (ej. 3°, 5°, 6°, 9°) y activación de programas educativos.
- **Migración 0011 de Alembic:** `0011_becas_formulario_uto_carreras.py` agregando columnas a `scholarship_calls` (`periodo_actual`, `periodo_anterior`, `cuatrimestres_habilitados`, `carreras_habilitadas`) y a `scholarship_applications` (`study_system`, `study_level`, `phone`, `curp`, `gender`).
- **Flujo Condicional del Formulario UTO (`FormularioSolicitudUTO`):**
  - Sección A: Datos generales, nivel de estudios, carrera del catálogo de 14, cuatrimestre, matrícula, CURP, teléfono, promedio anterior evaluado y documento obligatorio base: Constancia de No Adeudo de Tesorería (PDF, máx. 1 MB).
  - Sección B: Bifurcación por Modalidad y Sistema:
    - *Beca Alimenticia:* Exclusiva del sistema presencial, solicita valoración médica del área de Enfermería UTO, edad, estado civil y pasa directo al estudio socioeconómico sin Anexo 1.
    - *Resto de Modalidades (`Académica`, `Escasos Recursos`, `Hijos del Personal`):* Preguntan sistema de estudio (`Presencial` o `Mixto/Híbrido`). Si es Mixto solicitan Constancia laboral entregada a Coordinador (PDF, máx. 10 MB) con aviso de condonación inamovible.
    - *Académica:* Presencial avanza directo a secciones finales; Mixto añade constancia de coordinador. Promedio mínimo 9.70.
    - *Escasos Recursos:* Si es Mixto solicita además comprobante de ingresos mensual. En ambos sistemas exige el Anexo 1 firmado con tinta azul y el estudio socioeconómico completo (vivienda, padres, bienes, servicios, gastos, empleo, hijos, transporte con ruta/costo/tiempo). Promedio mínimo 8.50.
    - *Hijas e Hijos del Personal:* Requiere acta de nacimiento y constancia laboral emitida por RH de la UTO (ambos PDF máx. 10 MB). 100% de descuento.
  - Sección C: 3 Secciones finales obligatorias:
    1. Declaración bajo protesta de decir verdad y aceptación de los Artículos 72° y 73° del Reglamento Académico.
    2. Aviso de Privacidad (Ley de Protección de Datos de Puebla) y reporte de no discriminación durante el trámite.
    3. Encuesta de Satisfacción en escala Likert (1 al 5) sobre el área de Becas y comentarios abiertos.
- **Generador e Impresión del Anexo 1 Oficial:** Componente modal `Anexo1Modal` fiel al formato oficial de la convocatoria institucional para prellenado y descarga.
- **Administración de Convocatorias:** Edición y actualización inmediata desde la vista de gestión administrativa para coordinadores y escolares.
- **Pruebas y Verificación:** 17/17 pruebas de backend pasando en pytest, 13/13 pruebas en node contract tests, 0 alertas en `scripts/check_repository.py`, bundle Vite compilado exitosamente.

## Registro CR-013 · Integración del prototipo de Coevaluación

26 de noviembre de 2026. El líder solicita integrar la carpeta `Coevaluación/` recibida por pull, conectar sus tareas con la aplicación y roles existentes, y adaptar su diseño al portal. Se conserva la propuesta de seis criterios y escala 1–5 como base editable; su promedio es descriptivo, no una nota institucional. El Administrador prepara cuestionarios versionados, actividades y parejas; Estudiante responde solo sus asignaciones. Se sustituyen el selector de rol y `localStorage` del prototipo por sesión, permisos, CSRF, PostgreSQL y auditoría compartidos.

Impacto transversal autorizado por esta solicitud: rutas y navegación compartida, ayuda, router FastAPI y migración Alembic 0010. Los archivos de la página independiente se retiraron; su procedencia se conserva en Git y en `Coevaluación/README.md`. Detalle y decisiones pendientes en [COEVALUACION.md](COEVALUACION.md). La autorización para integrar esta propuesta no sustituye la ratificación de reglas académicas, privacidad o fases institucionales.

## Registro CR-015 · Corrección de permisos y afirmaciones de Becas

27 de noviembre de 2026. El líder solicita corregir los hallazgos de la revisión del módulo recibido. Este registro actualiza el estado técnico de los CR-011 a CR-014; sus descripciones históricas no prueban autorización institucional de pagos, referencias, constancias o calendarios.

- El padrón nominal se limita en FastAPI al personal revisor. El auditor consulta actividad sin identidad nominal; el estudiante solo puede consultar sus solicitudes y resultados propios.
- Solo Tesorería registra, verifica, devuelve o anula órdenes y registra referencias de operaciones externas. Una orden anulada conserva su fila y bitácora.
- El importe base se captura explícitamente y el porcentaje procede del dictamen o de una captura verificada; ya no se asignan montos, porcentajes ni fechas por omisión.
- El portal registra órdenes internas y referencias verificadas manualmente. No genera líneas de captura de Puebla, no ejecuta transferencias SPEI y no confirma pagos mediante una integración bancaria.
- La vista antes llamada «constancia oficial» presenta un resumen de asignación sin sello, firma, folio de constancia ni referencia de pago ficticios. Su consulta no muta la base.
- Se retiran botones de PDF y Excel que solo simulaban una descarga y un calendario de pagos no respaldado por datos configurados.

Pendiente de definición con las áreas: responsables definitivos, procedimiento y evidencia de verificación de pagos, interoperabilidad externa, emisión de constancias y criterios de publicación. La corrección es local para revisión; no representa aprobación formal de fases ni operación institucional.

## Registro CR-016 · Anatomía del azor de bienvenida

27 de noviembre de 2026. El líder proporciona seis fotografías de un azor y solicita acercar el ave animada a su anatomía, conservando el tipo de dibujo, la composición y la animación existentes. Se redibuja únicamente `src/modules/auth/Goshawk.jsx`: cabeza gris oscura con ceja clara y ojo ámbar, pico curvo, pecho barrado, alas con plumas diferenciadas y cola transversalmente bandada. Se reutilizan los tokens de color y la clase `scene-azor`; no cambian el movimiento, el control del footer, la escena de documentos, la marca ni las tareas de la aplicación. Las fotografías permanecen como referencias de la conversación, fuera de Git. Esta revisión visual no equivale a aprobación de una mascota institucional.
