# Investigación y decisiones de producto

Consulta realizada el 12 de octubre de 2026. Se priorizaron fuentes oficiales de diseño, accesibilidad, seguridad y tecnología. Estas referencias orientan decisiones de implementación; no sustituyen los procedimientos de la UT de Oriental ni acreditan cumplimiento legal.

## Experiencia de software profesional

[GitHub Primer sobre navegación](https://primer.style/product/ui-patterns/navigation/) recomienda navegación por teclado, jerarquía legible y enlaces para saltar bloques. Aplicación: Shell único, ubicación visible dentro del módulo y enlace para saltar al contenido. Se adopta la coherencia de un producto integrado, sin copiar la apariencia o marca de GitHub.

[Primer sobre composición](https://primer.style/product/getting-started/foundations/layout/) sirve como referencia para distribuir información y mantener experiencias adaptables. Aplicación: límite de ancho, densidad moderada, acciones cerca de los registros y componentes consistentes entre equipos.

[GOV.UK para completar varias tareas](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) ayuda a mostrar tareas, orden y estado en trámites largos que pueden completarse en varias sesiones. Aplicación: perfil, documentos y seguimiento identificables, con siguiente paso explícito. [Revisión de respuestas](https://design-system.service.gov.uk/patterns/check-answers/) orienta la confirmación previa al envío. Inferencia de diseño: un expediente resulta más adecuado para este flujo que un tablero cargado de métricas generales.

## Accesibilidad y paleta

[WCAG 2.2, contraste mínimo](https://www.w3.org/TR/wcag/#contrast-minimum) establece 4.5:1 para texto normal y 3:1 para texto grande, con excepciones. Aplicación: se calcularon las parejas de color del proyecto; dorado sobre blanco queda reservado a decoración o usos que satisfagan el criterio aplicable. El objetivo de diseño es AA, pendiente de auditoría completa y pruebas con usuarios.

## Gestión del título frente a emisión oficial

El [estándar publicado por la SEP en el DOF](https://sidof.segob.gob.mx/notas/docFuente/5519300) describe XML/XSD para títulos y firma electrónica avanzada de los responsables autorizados. Aplicación: el expediente administrativo no se presenta como un título oficial emitido. No se implementa un botón que genere un PDF y lo llame título electrónico.

La [consulta de instituciones con títulos registrados de SEP](https://siurp.sep.gob.mx/mvc/consultaInstituciones/irAConsultaPorEntidad.htm) muestra que el registro oficial pertenece a un proceso institucional. Antes de integrar generación/firma/envío, la universidad deberá proporcionar su procedimiento vigente, catálogos, responsables y canal autorizado. No se infiere de la investigación que la UT tenga una habilitación o integración específica.

Se verificó el [sitio institucional de la UT de Oriental](https://utdeoriental.edu.mx/), que publica Servicios Escolares y Vinculación. Ese dominio se usa para los enlaces de atención. No se confirmó un manual gráfico; no se inventaron tarifas o plazos ni se asumió que la paleta propuesta fuera oficial.

La [página institucional de estadías](https://utdeoriental.edu.mx/direccion-vinculacion-2/estadias-profesionales/) incluye seguimiento de egresados y cierre de estadías, coherente con el rol de Vinculación del PDF. Presenta cifras distintas de duración/horas en sus secciones; por eso no se incorporan automáticamente como reglas de liberación. Vinculación debe confirmar la norma vigente. La [sección de reglamentos](https://utdeoriental.edu.mx/utdeoriental/reglamentos/) identifica reglamentos de titulación y seguimiento, cuyo contenido vigente debe proporcionar la institución para homologar el módulo.

## Seguridad

[OWASP sobre almacenamiento de contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) recomienda hashes lentos con sal y parámetros resistentes a ataques. Aplicación: scrypt con parámetros explícitos, sin guardar contraseñas reversibles.

[OWASP sobre carga de archivos](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) orienta listas permitidas, límites, nombres internos y almacenamiento separado del contenido público. Aplicación: PDF/JPG de 5 MB, UUID, firma inicial y descargas autorizadas. La versión aún necesita antivirus y políticas operativas antes de expedientes reales.

## Stack confirmado

[React sobre construcción desde cero](https://react.dev/learn/build-a-react-app-from-scratch) documenta Vite y necesidades como enrutamiento. Aplicación: React + Vite + React Router para la aplicación interna; no se requiere SSR para este flujo.

[SQLAlchemy sobre PostgreSQL y psycopg](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.psycopg) respalda el dialecto elegido. Aplicación: ORM y migraciones versionadas con PostgreSQL, en lugar de archivos JSON como base funcional.

[FastAPI sobre despliegue](https://fastapi.tiangolo.com/deployment/concepts/) enumera HTTPS, arranque, reinicios y migraciones entre las responsabilidades de operación. Aplicación: separar desarrollo local de implantación institucional y no declarar producción por el mero hecho de levantar un servidor.

## Alcance de esta investigación

No se conocen aún proveedor SSO, infraestructura, formatos definitivos, manual de marca ni procedimientos de titulación de la universidad. Las recomendaciones sobre diseño y arquitectura son propuestas técnicas revisables. Las tarifas, obligaciones legales específicas y emisión oficial requieren validación con sus responsables; no se han supuesto como hechos.

## Investigación adicional de interfaces con IA

[AUDITORIA-DISENO.md](AUDITORIA-DISENO.md) desarrolla la revisión de NN/G y Microsoft Research, los patrones de GOV.UK, Primer y Carbon, sus límites y los cambios aplicados. La lista de antipatrones está ligada a tareas universitarias y a criterios de aceptación; no se considera una prohibición universal de estilos.

## Aplicación privada y bienvenida

[ARQUITECTURA-UI.md](ARQUITECTURA-UI.md) desarrolla la investigación de layouts de Laravel, navegación de Primer/GitHub, patrón accesible W3C, separación de acceso público de BBVA y motion de Samsung. Se adaptan patrones, sin cambiar el stack o copiar identidad. No se estudiaron cuentas privadas de bancos.

## Laravel: inspección visual y movimiento · CR-004

[ESTUDIO-LARAVEL.md](ESTUDIO-LARAVEL.md) registra inspección directa del DOM, tipografía computada, captura y grupos SVG del sitio público, además de opciones gratuitas CSS/SVG, Motion, Rombo, Anime.js y LottieFiles. Distingue observaciones e inferencias. La adaptación implementada utiliza encabezado horizontal, composición abierta, textos por tarea y entrada finita sin nuevas dependencias.
