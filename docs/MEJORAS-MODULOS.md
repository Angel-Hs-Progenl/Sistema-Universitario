# Revisión de módulos · CR-011

11 de noviembre de 2026. Requisitos transversales BASE-01/03/05; Becas BEC-02/03/04/05; alcance recibido de Autoevaluación. Autorización del líder en el chat para diseño, funcionalidad e integración. No equivale a aprobación institucional ni despliegue de producción.

## Hallazgos y cambios

| Hallazgo | Resultado implementado |
| --- | --- |
| CSS de Autoevaluación redefinía utilidades globales y añadía colores ajenos | Solo composición local; tokens y controles del sistema compartido |
| Formularios largos antes de cualquier evaluación registrada | Listado y filtros primero; preparación de evaluaciones, cuestionarios y convocatorias en Modal |
| Escalas como botones dentro de radiogroup; etiquetas sin asociación | Radios/checkboxes nativos dentro de fieldset/legend; Field con etiqueta asociada |
| Confirmación sin mostrar respuestas | Revisión de preguntas y respuestas con etiquetas, aviso de envío definitivo y retorno de foco |
| Historial/resultados mostraban identificadores técnicos | Consulta del envío mediante el instrumento versionado y texto de cada opción |
| Una selección múltiple obligatoria admitía una lista vacía en API | Validación de servidor independiente del navegador, con regresión de persistencia |
| Google descartaba destinos de Autoevaluación | `safe_next` conserva el módulo y sigue rechazando destinos externos |
| Elegir Autoevaluación en Ayuda producía contenido inexistente | Tema de ayuda propio y privacidad con acceso individual explicado |
| Becas permitía empezar una segunda solicitud desde bases | Acceso directo a solicitud propia y al estudio previo; el servidor conserva unicidad |
| Registro de beca dejaba al estudiante en el catálogo | Abre el folio creado y sus documentos |
| Documentos solo accesibles desde un selector general | Acción de adjuntar/reemplazar junto al requisito, respetando documentos validados |

Se conserva la composición de bienvenida, la marca del azor, el encabezado compartido, las migas, los colores y el control de movimiento CR-006. No se agregan dependencias.

## Contrato de Autoevaluación recibido

- Rutas UI: `/autoevaluacion`, `/mis-evaluaciones`, `/evaluar/:id`, `/historial`, `/evaluaciones`, `/cuestionarios`, `/resultados/:id` bajo ese prefijo.
- API: `/api/v1/autoevaluacion`. Se reutilizan usuario, cookie HttpOnly, CSRF, permisos y base compartida. No existe otra sesión ni localStorage de respuestas.
- Estudiante: solo asignaciones propias, visibles después del borrador; respuestas definitivas durante fechas y recepción habilitada; consulta de sus envíos.
- Administrador: instrumentos versionados, evaluaciones por asignatura/grupo/parcial, asignaciones en borrador, apertura/cierre y respuestas individuales. Los demás roles están excluidos en FastAPI.
- Tipos recibidos: escala 1–10 configurable, una opción, varias opciones y texto. No son preguntas o escalas oficialmente aprobadas.
- La evaluación se bloquea en el servidor para serializar envío/cierre; una restricción única evita dos envíos por asignación.
- No se traslada el anonimato de Evaluación docente a Autoevaluación: la interfaz explica que el administrador consulta respuestas individuales.

La migración recibida `61dbabf45860` sigue a `0007`. No se cambia el modelo en esta revisión ni se modifica el historial de migraciones. El respaldo previo y la migración se ejecutan mediante `scripts/database.py migrate`. No usar `create_all` ni borrar tablas.

## Guía de entrega para equipos

Partir de ModuleLayout y los componentes de Work/ui; definir tarea, acción principal, estados y recuperación. Usar listas de registros o tablas según la comparación necesaria. Abrir la captura de datos desde una acción explícita cuando la tarea principal sea consultar/gestionar registros. Una estadística debe ayudar a decidir; no añadir tarjetas para llenar espacio.

Verificar permisos de API, navegación y Ayuda al registrar un módulo, incluidas rutas posteriores al acceso Google. Cada instrumento conserva sus etiquetas/versiones para leer envíos antiguos. Los identificadores técnicos no sustituyen preguntas ni opciones en la interfaz.

## Pendientes institucionales

Ratificar responsables, asignaciones, preguntas, escalas, visibilidad, procedimiento de corrección y conservación. La implementación no calcula notas oficiales ni ofrece coevaluación, anonimato, reapertura, integración académica o notificaciones de asignación que no estén implementadas. El Word de Becas se consulta como referencia privada; no se copia al repositorio. MFA, reportes institucionales e integraciones de pago conservan los pendientes registrados en REQUISITOS.md.

Resultados de comprobación y capturas ficticias en [VALIDACION.md](VALIDACION.md) y [capturas](capturas/README.md).
