# Investigación y revisión de interfaces generadas con IA

12 de octubre de 2026. El líder solicitó corregir la apariencia genérica del inicio y titulación. Se distingue entre evidencia publicada, diagnóstico de esta aplicación y decisiones del proyecto. La investigación no sustituye pruebas con usuarios de la UT.

## Evidencia y aplicación

**Especificación frente a acabado visual.** La [evaluación de prototipos con IA de Nielsen Norman Group](https://www.nngroup.com/articles/ai-prototyping/) comparó herramientas y niveles de especificación en un proyecto real. Los resultados mejoraron al detallar componentes, lenguaje visual y estados, pero todavía requerían evaluación. Su alcance es situado: no demuestra que todas las herramientas fallen igual. Aplicación: cada pantalla debe tener rol, tarea, datos, acción principal y estados verificables; “profesional” y “moderno” no son especificaciones.

**Jerarquía y ruido.** [NN/G sobre prompts vagos](https://www.nngroup.com/articles/vague-prototyping/) identifica información repetida, secuencias confusas y contenedores grandes de poca utilidad. Aplicación: cada bloque de la UT justifica qué decisión facilita. No se prohíben las tarjetas: se usan cuando agrupan una unidad con responsabilidad y acción. Un expediente necesita principalmente listas, metadatos, formularios, observaciones y estados.

**Homogeneización.** [Interrogating Design Homogenization in Web Vibe Coding, Microsoft Research](https://www.microsoft.com/en-us/research/publication/interrogating-design-homogenization-in-web-vibe-coding/) analiza riesgos de homogeneización y propone decisiones/revisión deliberadas. Es un marco conceptual, no una certificación de estilos. Inferencia del proyecto: conservar una paleta no basta; también hay que definir composición, lenguaje y densidad. Buscar originalidad tampoco justifica inventar controles difíciles de aprender.

**Entrada al servicio.** [GOV.UK, Start using a service](https://design-system.service.gov.uk/patterns/start-using-a-service/) orienta a explicar para qué sirve, permitir iniciar/retomar y preparar lo necesario. Sus reglas de publicación corresponden al gobierno británico; se toma el principio, sin copiar la marca. Aplicación: directorio, destinatarios, áreas y requisitos. Se retira el eslogan y certificado decorativo como centro visual. La [página real de Servicios Escolares](https://utdeoriental.edu.mx/servicios-escolares/) se enlaza para atención, sin inventar tarifas, tiempos ni modalidades.

**Trámites de varias sesiones.** [GOV.UK, Complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) recomienda tareas agrupadas y estados para transacciones largas. Aplicación: revisar datos, integrar documentos y enviar. Los faltantes se nombran; adjuntos no equivale a validaciones. La revisión institucional aparece después del envío, evitando un contador de cero validaciones durante preparación.

**Navegación.** [Primer, Navigation](https://primer.style/product/ui-patterns/navigation/) prioriza orientación, regreso y continuidad. Aplicación: encabezado único, regreso al directorio, navegación horizontal del módulo y vuelta al resumen después de cargar. El historial completo tiene su vista; el resumen muestra actividad reciente. Dialog mantiene foco y Escape con el control nativo.

**Trabajo del personal.** [Carbon, Data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) relaciona encabezado, búsqueda, filtros y acciones, con espacio para datos. Aplicación: bandeja a todo el ancho, folios legibles y búsqueda junto al filtro. En móvil la tabla se desplaza dentro de una región accesible con teclado. No se simulan gráficas de productividad. La paginación del servidor sigue pendiente para superar 500 expedientes recientes.

**Errores accionables.** [GOV.UK, Error summary](https://design-system.service.gov.uk/components/error-summary/) une resumen, errores de campo y traslado de foco. Aplicación: mensajes de perfil en español, enlaces al campo, aria-invalid y ayuda mediante aria-describedby. Se conservan los valores. Sigue activa la validación nativa y el servidor conserva la autoridad. No se declara implementación íntegra del sistema GOV.UK.

**Archivos.** [GOV.UK, File upload](https://design-system.service.gov.uk/components/file-upload/) hace explícitos selección y estados. Aplicación: control nativo, nombre/tamaño seleccionado, instrucción para guardar, límite previo y validación independiente en FastAPI. No se dibuja una zona de arrastre que carece de esa función.

**Objetivos táctiles.** [W3C, criterio 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) explica el mínimo AA de 24 por 24 píxeles CSS o sus excepciones/espaciado. Se adoptan normalmente controles de 40–44 px, foco visible y estados escritos. Medir botones no demuestra conformidad WCAG; faltan auditoría completa, tecnologías de asistencia y usuarios reales.

## Diagnóstico y correcciones

| Problema de la entrega anterior               | Efecto aquí                               | Cambio aplicado                                            |
| --------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Eslogan y certificado ilustrado               | Entrada promocional y servicio desplazado | Directorio y acceso para retomar, sin ilustración ficticia |
| “Cada documento cuenta” y otros títulos vagos | Función poco identificable                | Nombres directos de las vistas                             |
| Sidebar amplio con pocas vistas               | Quitaba espacio a tabla y documentos      | Navegación horizontal común                                |
| Ocho documentos también en resumen            | Recorrido largo y contenido duplicado     | Tareas con faltantes y vista dedicada de documentos        |
| Validaciones antes del envío                  | Confundía preparación con dictamen        | Métrica institucional en su fase                           |
| Perfil completo repetido                      | Información secundaria dominaba           | Identificación académica breve en resumen                  |
| Dictamen aprobado por defecto                 | Riesgo de confirmación involuntaria       | Elección explícita obligatoria                             |
| Envío con faltantes                           | Error demasiado tardío                    | Lista previa y envío deshabilitado con explicación         |
| Reenvío con archivo rechazado sin reemplazo   | Corrección no garantizada                 | Regla en servidor y prueba de regresión                    |
| Error técnico en inglés                       | Difícil localizar el dato                 | Resumen en español y error de campo                        |
| Seleccionar confundido con adjuntar           | Resultado de carga ambiguo                | Archivo/tamaño y acción de guardado explícitos             |

Son decisiones de este proyecto informadas por referencias; no reglas universales contra determinados estilos.

## Dirección visual común

Portal y expediente institucional: marfil de fondo, blanco de trabajo, guinda para identidad/acción, dorado para separadores y numeración grande, verde para confirmación/apoyo. Radios de 3 px y líneas; sin sombras de tarjetas, gradientes, fondos borrosos ni ilustraciones de títulos. Serif del sistema solo como acento de entrada; tipografía sans en trabajo. El monograma UTO es temporal, pendiente de marca oficial.

Cada vista tiene una prioridad: elegir, preparar, adjuntar, revisar, corregir o consultar. El tamaño de un bloque responde a esa prioridad. Solo datos persistidos o cálculos verificables; sin estadísticas, sellos ni certificaciones inventadas.

## Qué no pedir ni aceptar de una IA

- “Un dashboard moderno/profesional” sin rol, tarea, datos y estados.
- Copiar GitHub o Apple como sustituto de investigar necesidades de la UT.
- Tarjetas, iconos, porcentajes o gráficas sin decisión o acción asociada.
- Otro login, encabezado, sidebar global o paleta en cada módulo.
- Ocultar información esencial en móvil para mejorar una captura.
- Botones solo visuales, cargas falsas, éxito anticipado o aprobación predeterminada.
- Llamar validado a recibido, emitido a una referencia o correo enviado a un aviso interno.
- Entregar una captura sin demostrar el recorrido y sus errores.

## Criterios de aceptación para los equipos

Declarar rol/tarea/acción, reutilizar componentes y demostrar carga, vacío, datos, error, permisos y confirmación. Revisar 320/390/768/1440 px sin desplazamiento global; operar formularios y diálogos con teclado; conservar valores tras errores; comprobar etiquetas, contraste, estados escritos y objetivos táctiles. Adjuntar evidencia ficticia.

Prueba de usabilidad pendiente con las áreas: localizar titulación; retomar; explicar adjuntar frente a enviar; corregir un campo; encontrar un documento observado; buscar un folio y dictaminar como Escolares. Registrar éxito, dudas, errores y tiempo observado. No se han inventado resultados de usuarios.
