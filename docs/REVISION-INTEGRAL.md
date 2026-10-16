# Revisión integral de la aplicación · CR-007

13 de octubre de 2026. Solicitada por el líder: analizar diseño, textos, estructura, navegación, accesibilidad y usabilidad, investigando referencias profesionales. Revisión local con datos ficticios; no es una certificación WCAG ni aceptación institucional.

## Diagnóstico

La base es coherente: identidad propia, paleta central, inicio privado compacto, navegación horizontal, migas jerárquicas, expediente persistente y permisos por área en FastAPI. Conviene conservarla. Una navegación o tabla reconocibles no convierten por sí mismas un producto en genérico. El problema aparece cuando el contenido, las acciones y los estados podrían intercambiarse entre cualquier rol o servicio.

Los principales problemas encontrados eran de precisión: instrucciones repetidas, botones nombrados como estados, filtros sin anuncio de resultados, título de pestaña idéntico en todas las rutas y avisos que podían confundir un fallo de consulta con ausencia de contenido. Se corrigieron esos puntos. También se detectó que el expediente reutilizaba datos de cuenta innecesarios.

Laravel sigue como referencia de composición para la bienvenida. Para las tareas privadas se contrastó con Primer de GitHub, GOV.UK y W3C: orientación, legibilidad, recuperación de errores y estados verificables. La adaptación es una decisión del proyecto; no se afirma haber inspeccionado código privado de esos productos ni probado su diseño con usuarios de la universidad.

## Recorridos y alcance inspeccionado

| Espacio | Rol / tarea | Inspección |
| --- | --- | --- |
| Acceso | Estudiante y personal: entrar | Google pendiente, correo/teléfono, etiquetas, contraseña visible, errores y acceso rápido móvil al formulario |
| Recuperación | Solicitar enlace / restablecer contraseña | Código, límites y textos; no se cambió una contraseña desde el navegador |
| Inicio | Elegir módulo o acceso directo | Contenido compacto, enlaces por rol y orientación |
| Expediente | Estudiante: preparar, enviar, consultar | Pendientes, distinción adjuntar/enviar, datos, acciones e historial |
| Datos del egresado | Estudiante: corregir datos | Error real de CURP, conservación de valores, foco y asociación del mensaje |
| Documentos | Estudiante: adjuntar/reemplazar/descargar | Lista, nombres de acciones, diálogo, Escape y regreso al disparador; sin reemplazar archivos durante esta revisión |
| Historial | Consultar movimientos | Fechas semánticas y textos acordes con la respuesta de API |
| Solicitudes | Escolares/Administración: buscar y revisar | Búsqueda sin resultados, limpieza, filtros, tabla móvil y acciones de estado |
| Pago | Tesorería: revisar comprobante | Documento exclusivo y ausencia de controles de estado general |
| Liberación | Vinculación: registrar dictamen | Estado y acción juntos, resultado inicial vacío y observación obligatoria |
| Cuenta | Editar nombre visible | Menú y límites entre cuenta y expediente |
| Avisos | Consultar cambios y abrir su expediente | Código de carga/error/vacío, lectura explícita, enlace por solicitud y confirmación del servidor |
| Ayuda, privacidad y 404 | Encontrar requisitos, soporte y regreso | Títulos concretos, pendientes institucionales y rutas desconocidas |

Se revisaron componentes React, registro de navegación, CSS/tokens, cliente API, routers, modelos, migraciones y pruebas existentes. Se operaron cuentas ficticias de los cinco roles. Las transiciones sensibles se ejercitan en la base de pruebas; no se dictaminaron los expedientes demo desde la interfaz.

## Hallazgos corregidos

Alta: riesgo de datos o interpretación del resultado. Media: dificulta una tarea. Baja: precisión y mantenimiento. Son prioridades de esta revisión, no una clasificación institucional.

| ID / prioridad | Evidencia anterior | Corrección y evidencia |
| --- | --- | --- |
| AUD-01 · Alta | details reutilizaba public_user, incluyendo teléfono de acceso, alias y vínculo Google | Respuesta del expediente limitada a id, nombre, correo y perfil académico. Nuevas instantáneas usan ese contrato. Prueba PostgreSQL para cinco roles, lista/detalle e instantánea heredada. La cuenta propia conserva sus preferencias. |
| AUD-02 · Alta | Error inicial de avisos podía mostrar también “Todo al día” | Error sin datos ofrece reintento; no muestra el vacío de éxito. Revisado en código; no se simuló caída de red en el navegador. |
| AUD-03 · Media | Todos los avisos enviaban al expediente activo aunque correspondieran a otra solicitud | Enlace con application_id recibido del servidor. FastAPI mantiene la autorización por expediente. |
| AUD-04 · Media | Título de pestaña idéntico | Título por ruta/tarea y rol en bandeja; sin nombres, correo o datos personales. Prueba de navegación. |
| AUD-05 · Media | Suspense envolvía el router y podía sustituir todo el Shell durante carga | Carga dentro del contenido del Shell. Navegación y migas permanecen montadas. Foco en main comprobado tras navegación interna. |
| AUD-06 · Media | Errores de formato intercambiables; enlaces sin foco explícito | Instrucciones por campo, resumen enfocable y enlace que enfoca el control. CURP comprobada con 422 real y valores conservados. |
| AUD-07 · Media | Ayudas dentro de etiquetas textarea podían alargar el nombre accesible | Field compartido admite input/textarea/select y vincula ayuda/error por identificadores. Comprobado en domicilio y dictamen. |
| AUD-08 · Media | Filtros dependían del placeholder; resultados no anunciables | Etiquetas persistentes, contador role=status, scope en tabla y Limpiar filtros devuelve el foco a la búsqueda. |
| AUD-09 · Baja | Tres totales de bandeja sin acción asociada | Se retiran; el conteo describe resultados filtrados. Límite de 500 y alcance local explícitos. |
| AUD-10 · Media | Botones “Documentación rechazada” o “Trámite concluido” | Verbos: Devolver para corrección, Registrar entrega y concluir, Registrar disponibilidad del título. Estados del dominio conservados. |
| AUD-11 · Baja | Resumen repetía siguiente paso, preparación y confirmación | Preparación concentra tareas cuando es editable; siguiente paso sirve al seguimiento posterior. |
| AUD-12 · Media | Tesorería duplicaba bloques; Vinculación separaba estado/acción y mostraba medidor 0/1 | Pago centrado en el comprobante. Vinculación reúne estado, observación y dictamen sin medidor decorativo. Sin barra de control general para esas áreas. |
| AUD-13 · Baja | “Avanza con claridad”, “Todo al día”, “Guardar perfil” vagos o amplios | Requisitos y ayuda para titulación, Aún no tienes notificaciones, Guardar nombre visible e Iniciar sesión. Ayuda explica cuándo se conserva cada cambio. |
| AUD-14 · Media | Ruta desconocida dentro del módulo podía llamarse expediente | Solo detalle con ID numérico se presenta como expediente; resto muestra Página no encontrada. Prueba de regresión. |
| AUD-15 · Media | Formulario móvil debajo de la ilustración sin acceso rápido | Enlace Ir al inicio de sesión enfoca el formulario; conserva la ilustración grande solicitada. |
| AUD-16 · Baja | Footer pequeño; campos móviles a 14 px | Footer a 12 px, áreas verticales explícitas en enlaces del marco y campos móviles a 16 px. El tamaño por sí solo no prueba accesibilidad. |

No se incorpora backend, biblioteca UI, paleta o autenticación nuevos. Los cambios comunes siguen siendo responsabilidad del líder.

## Aspectos que necesitan otra entrega

| Prioridad | Hallazgo por código / alcance | Próximo trabajo verificable |
| --- | --- | --- |
| Alta, antes de datos reales | OAuth real, SMTP, privacidad, restauración y emisión oficial pendientes | Configuración y aceptación con responsables institucionales. La validación local no equivale a implantación. |
| Media | El perfil ofrece guardar incluso cuando la API lo bloquea por revisión | Exponer/consumir estado autorizado de edición; presentar solo lectura y canal de corrección, conservando rechazo en servidor. |
| Media | Al abandonar un formulario se pierden cambios no guardados | Aviso de cambios pendientes para navegación/recarga, sin impedir salir después de guardar. No persistir expedientes en localStorage. |
| Media | Validación nativa aún produce mensajes del navegador para campos vacíos/longitudes | Unificar presentación en español y probar todos los formularios; mantener validación de FastAPI. |
| Media | Caducidad durante el trabajo puede terminar en error/reintento | Retorno al acceso con destino conservado y tratamiento de cambios/archivos sin guardar; probar aislamiento entre cuentas. |
| Media | Bandeja obtiene hasta 500 expedientes con documentos/eventos; consultas por expediente | Paginación/búsqueda en servidor y representación resumida de lista; medir volumen ficticio. CSV completo y lista filtrada tienen alcances distintos. |
| Media | Historial guarda actor_id pero no muestra autor | Acordar qué identidad corresponde mostrar a cada rol. El texto ya no promete mostrar quién atendió. |
| Baja | Workspace supera 500 líneas; router concentra consultas, serialización y operaciones | Extraer secciones y servicios de dominio dentro de Titulación con pruebas. Conservar monolito modular. |
| Baja | app.css/layout.css contienen reglas históricas superpuestas y selectores sin uso | Consolidar por responsabilidad tras comparar público/privado, móvil e impresión; evitar reemplazo masivo durante revisión visual. |
| Baja | Fuentes incluyen subconjuntos de idiomas no utilizados | Evaluar imports para español y comparar peso/representación. No se midieron Core Web Vitals reales. |

Las instantáneas antiguas pueden conservar metadata de cuenta en la base: la API la filtra al responder y los nuevos envíos dejan de copiarla. No se borraron registros históricos; retención/depuración necesitan decisión operativa autorizada.

## Investigación aplicada

Fuentes primarias consultadas el 13 de octubre de 2026. Orientan decisiones, no establecen una lista universal de elementos “hechos con IA”.

| Fuente | Criterio consultado | Aplicación local |
| --- | --- | --- |
| [Laravel](https://laravel.com/) y [estudio CR-004](ESTUDIO-LARAVEL.md) | Composición de bienvenida, jerarquía y entrada visual | Se conserva la bienvenida que gustó al líder; Laravel no se introduce al stack. |
| [Primer: navegación](https://primer.style/product/ui-patterns/navigation/) | Orientación, elecciones esenciales y continuidad | Header común, migas, pestañas locales y marco estable durante carga. |
| [Primer: formularios](https://primer.style/product/ui-patterns/forms/) | Etiquetas, agrupación, validación y foco | Field común y ayudas vinculadas; agrupación completa de formularios como mejora posterior. |
| [GOV.UK: recuperar errores](https://design-system.service.gov.uk/patterns/validation/) y [resumen](https://design-system.service.gov.uk/components/error-summary/) | Conservar respuestas y dirigir a corrección | Valores conservados tras rechazo y foco en resumen/campo. |
| [W3C: título, 2.4.2](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html) | Identificar tema/propósito incluso en SPA | Títulos distintos por tarea y ruta. |
| [W3C: mensajes de estado, 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | Estado identificable por tecnología de asistencia | Conteos/confirmaciones programáticamente identificados; no se declara prueba de voz. |
| [W3C: reflow, 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Reorganización sin pérdida; excepciones para tablas | Revisión de ancho global y desplazamiento contenido de tabla. Viewport 320 px no sustituye zoom real. |
| [W3C: tamaño de objetivo, 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 24×24 CSS px con excepciones de espaciado, equivalencia y texto en línea | Se amplían enlaces del marco; botones principales conservan al menos 44 px de altura. No todo enlace pequeño implica incumplimiento. |
| [W3C: disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | Botón de mostrar/ocultar con estado expandido | Cuenta usa botón, enlaces normales y Tab; no se impone role=menu con otro contrato de teclado. |

Contraste calculado desde tokens sRGB: guinda/blanco 11.32:1, texto secundario/marfil 5.54:1, secundario/blanco 5.99:1, verde/salvia 5.26:1, error/blanco 7.57:1. Dorado/blanco 3.24:1: sigue reservado a acentos, no texto pequeño. No prueba todas las superposiciones/estados.

CR-006 permanece: movimiento activo inicialmente y control del footer, incluso si el sistema pide reducirlo. Entrada finita y sin bloqueo de tareas. Esta decisión del líder no se cambia silenciosamente durante la auditoría.

## Criterio para aceptar módulos

Resultados y límites en [VALIDACION.md](VALIDACION.md). Cada PR debe responder: qué rol realiza qué tarea, qué dato determina la acción y qué ocurre al cargar, quedar vacío, fallar o no tener permiso. Evidencia móvil/escritorio y un recorrido con teclado, además de la captura estética.

Prueba con usuarios propuesta, todavía no ejecutada: estudiantes preparan borrador, identifican faltantes, guardan un documento y explican la diferencia con enviar; Escolares localiza un folio y lo devuelve con observación; Tesorería encuentra su comprobante; Vinculación registra su liberación en entorno ficticio. Observar éxito, dudas, errores y ayuda requerida. No inventar calificaciones, tiempos o tasas de éxito.

Pendientes: lector de pantalla, zoom real, alto contraste, otros navegadores/dispositivos, carga representativa y aceptación de usuarios. Investigación y pruebas locales ofrecen evidencia revisable; no los sustituyen.
