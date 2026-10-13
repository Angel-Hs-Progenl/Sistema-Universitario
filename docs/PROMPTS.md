# Prompts comunes para trabajar con IA

Estos prompts son instrucciones de colaboración para los equipos; no crean un skill ni reemplazan el control del líder. Copia el bloque común y el bloque de la tarea. Da a la IA acceso a los archivos citados; no pegues expedientes reales ni secretos. Pide evidencia observable y revisa los resultados antes del PR.

## Bloque obligatorio para cualquier módulo

```text
Trabajamos en Servicios universitarios de la Universidad Tecnológica de Oriental.
Lee AGENTS.md, README.md, docs/REQUISITOS.md, docs/ARQUITECTURA.md,
docs/DISENO.md, docs/AUDITORIA-DISENO.md, docs/CASCADA.md y CONTRIBUTING.md antes de editar.

Stack obligatorio: frontend React + JavaScript + HTML/CSS; backend FastAPI
+ Python; SQLAlchemy + PostgreSQL; migraciones Alembic. Monolito modular.
Implementa dentro de src/modules/<modulo> y backend/app/modules/<modulo>.
Reutiliza identidad, sesiones, roles, notificaciones, Shell, API y componentes.
No crees otro login, dashboard global, backend, paleta o base independiente.

Paleta central: #6F1738 #B8862B #DCE8D5 #386641 #F7F6F2 #202124.
Usa src/styles/tokens.css. El dorado es un acento, no texto pequeño sobre blanco.
La UI debe adaptarse a móvil y escritorio, tener etiquetas y foco visibles,
estados de carga/vacío/error, y explicar siempre el próximo paso del usuario.

No inventes requisitos, autoridades, tarifas, plazos ni integraciones oficiales.
Distingue requisitos aprobados, supuestos y pendientes. Los cambios de alcance
se registran y aprueban conforme a la metodología de cascada del proyecto.
Cada mutación valida permisos en servidor y guarda auditoría cuando corresponde.
No uses localStorage para expedientes o tokens, ni datos reales en ejemplos.

Antes de implementar, identifica el requisito y el contrato afectado. Entrega
el cambio funcional, pruebas relevantes, migración si aplica, evidencia móvil
y escritorio, y limitaciones. No declares éxito si solo cambió la apariencia.
```

## Crear una pantalla

```text
Implementa la pantalla <nombre> del módulo <modulo> para el rol <rol>.
Requisito: <ID y descripción>.
Usuario necesita: <tarea concreta>.
Entrada/salida de API: <contrato existente o propuesta a revisar>.
Estados: <cargando, vacío, con datos, error, sin permisos, confirmación>.
Acción principal: <verbo y resultado>.

Usa los componentes actuales y el estilo de titulación como referencia.
No copies toda la página ni sus reglas de negocio. Integra las rutas con el
router compartido. Comprueba 320, 390, 768 y 1440 px; evita overflow global.
Conserva foco y teclado. Si hay una acción irreversible, muestra el resumen
y confirma en el contexto de la aplicación. No añadas métricas ficticias.
```

## Implementar un caso de uso del backend

```text
Implementa <caso de uso>, requisito <ID>, en el módulo <modulo>.
Reglas: <lista aprobada>.
Roles autorizados y límites de propiedad: <definir>.
Datos de entrada y validaciones: <definir>.
Efectos persistidos y notificaciones: <definir>.

Usa APIRouter bajo /api/v1/<modulo>, get_db y current_user compartidos.
Aplica autorización por rol y registro, no solo en el frontend. Usa esquemas
Pydantic, ORM parametrizado, transacción y manejo de conflictos. Añade una
migración Alembic revisable para cambios de modelo. Prueba éxito, permisos,
validación, duplicados, aislamiento y concurrencia cuando sean relevantes.
No modifiques tablas privadas de otros módulos; propone un contrato primero.
```

## Equipo de evaluación docente

```text
Trabaja sobre EVD-<ID> de docs/REQUISITOS.md. El Word original define tres
secciones configurables y una escala ejemplificada; no fija preguntas finales.
No guardes contraseñas del correo institucional. El SSO debe configurarse con
el proveedor autorizado. Evita evaluaciones duplicadas por asignación.
Mantén los reportes al docente sin identidad del estudiante. Acordar el umbral
de anonimato antes de entregar resultados de grupos pequeños. La IA solo puede
resumir evidencia existente, con revisión humana y sin inventar comentarios.
No implementes decisiones pendientes como si ya estuvieran aprobadas.
```

## Equipo de becas

```text
Trabaja sobre BEC-<ID> de docs/REQUISITOS.md. Las reglas y formularios deben
versionarse por convocatoria y conservar la evidencia de cada solicitud.
El dictamen corresponde a personas autorizadas; la IA no decide elegibilidad.
No inventes criterios socioeconómicos, montos, presupuestos o pagos bancarios.
Respeta acceso mínimo a comprobantes y registra auditoría. El documento exige
2FA: acuerda su implementación compartida antes de habilitar datos reales.
```

## Revisión previa al PR

```text
Revisa el diff contra AGENTS.md y el requisito <ID>. Verifica: coherencia con
React/FastAPI/PostgreSQL, diseño común, permisos en cada endpoint, aislamiento
de datos, manejo de errores, migraciones, ausencia de secretos y datos reales,
adaptación móvil, teclado y pruebas relevantes.
Reporta defectos concretos con archivo, línea, efecto y caso reproducible.
Separa defectos de preferencias. No marques un módulo como terminado si sus
criterios no se pueden demostrar. Actualiza la documentación si cambió un contrato.
```

## Revisión de diseño antes de entregar

```text
Revisa esta pantalla usando docs/AUDITORIA-DISENO.md. Explica el rol, tarea,
acción principal y origen de cada dato. Identifica contenido repetido,
contenedores con poca utilidad, títulos vagos y controles que no funcionan.
Mantén el lenguaje institucional, las líneas/radios/tipografías del sistema,
y el estado escrito. No agregues slogans, certificados ilustrados, tarjetas
de métricas, gradientes ni otro sidebar global. No copies una marca externa.

Comprueba el recorrido: inicio, carga, vacío, error, corrección, permisos y
confirmación. Muestra en móvil y escritorio qué puede hacer la persona y
qué falta. No des por validado un archivo adjunto. Exige elección explícita
del dictamen. Señala evidencia comprobada y pendientes; no inventes pruebas.
Antes de subir, revisa el diff y ejecuta scripts/check_repository.py sobre
el índice preparado. No pegues datos privados en prompts, capturas ni Git.
```
