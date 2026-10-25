# Prompts comunes para trabajar con IA

CR-007: consulta docs/REVISION-INTEGRAL.md antes de diseñar una vista. Conserva títulos de pestaña y carga dentro del Shell, etiquetas visibles, ayudas/errores vinculados con Field y foco con ErrorSummary. No confundas fallo de consulta con resultado vacío, ni escribas botones como si fueran estados. Cada dato o bloque debe servir a la tarea de su rol; justifica métricas y elimina información repetida. No expongas metadata de acceso dentro de contratos académicos.

CR-006: las animaciones están activas inicialmente y se controlan desde el footer. Reutiliza MotionProvider/useMotionPreference/useReducedMotion. No añadas detección automática del sistema operativo o un almacenamiento distinto por módulo; el usuario puede desactivar todo el movimiento con la preferencia común. localStorage solo contiene on/off de apariencia; nunca sesiones o expedientes.

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

## Integrar navegación de un módulo

```text
Lee docs/ARQUITECTURA-UI.md. Reutiliza Shell, Protected y Breadcrumbs.
Registra solo módulos funcionales en shared/navigation.js con rutas, roles
y nombres de páginas aprobados. Mantén encabezado horizontal compartido y pestañas
locales; no dupliques login, encabezado o migas. Para entidades dinámicas usa
el nombre/folio de la respuesta autorizada, nunca uno deducido de la URL.
Conserva el home compacto: módulo y accesos directos por rol. Las imágenes
grandes están en la bienvenida y no desplazan acciones dentro del sistema.
Comprueba acceso sin sesión, retorno al enlace tras login, teclado/Escape,
migas a sus ancestros, estado actual y adaptación a 320/390/768/1440 px.
```

## Dirección visual CR-004

```text
Lee docs/ESTUDIO-LARAVEL.md y docs/DISENO.md. Conserva el home compacto.
Reutiliza el Shell horizontal; no agregues una sidebar global ni otra sesión.
Usa composición abierta, divisiones finas, títulos DM Sans de peso moderado
y textos que indiquen la tarea real según rol/estado. No copies SVG o marca
de Laravel. No conviertas formularios o tablas en una landing publicitaria.
El movimiento de trabajo es breve y de opacidad; no anima datos ficticios.
Respeta prefers-reduced-motion. Reutiliza layout.css/tokens.css y los
componentes de formulario, error, modal y permisos existentes.
```

## Identidad y acceso comunes · CR-005

```text
Lee docs/ACCESO-INSTITUCIONAL.md y docs/INSTALACION.md. Reutiliza Brand,
AccountMenu y la sesión de AuthProvider. Los módulos no definen otros logos,
logins, menús de cuenta, cookies, roles o vinculaciones de Google/teléfono.
El azor es la marca propuesta del portal; el PNG oficial no se modifica.
La paleta permanece en tokens.css; los recursos originales del proveedor
de acceso no definen nuevos colores para las pantallas del módulo.
No uses el teléfono de contacto del perfil como credencial automática.
No deduzcas roles de correos, matrículas o claims de Google. Usa current_user
y verifica permisos en FastAPI. No simules Google habilitado sin OAuth real.
Para evidencia usa solo cuentas ficticias; los screenshots seleccionados
van a docs/capturas. No publiques .env, tokens, HAR o estados del navegador.
```

## Integrar cambios sobre CR-010

```text
Trabaja en el monolito existente. Lee INTEGRACION-MODULOS.md, ARQUITECTURA.md, DISENO.md y los requisitos de tu dominio. Reutiliza Shell, ModuleLayout, Work, ui.jsx, api.js y los tokens; declara rutas en tu módulo y navegación por tarea/rol en shared/navigation.js.
No crees otro login, sidebar, paleta ni perfiles fijos en JSX. Usa datos de API y prueba carga, vacío, error y confirmación; nunca anuncies guardado sin una respuesta exitosa. Mantén tablas dentro de su región desplazable y formularios en una columna en móvil. Usa Modal/BusyButton/Field/ErrorSummary; evita alert/confirm y console.log de respuestas o expedientes.
Verifica permisos en FastAPI, propietario, estado y versión. Registrar un rol exige migración y pruebas negativas en TODOS los módulos. Registrar un modelo exige incluirlo en Alembic y pasar alembic check desde un proceso nuevo. No uses create_all ni borres datos para migrar.
Datos de demostración solo ficticios y marcados como ejemplo, en demo.py/fixtures; nunca en una carpeta data dentro del código. Conserva .gitignore de expedientes y secretos. Cambios de reglas institucionales necesitan revisión del líder y CASCADA.md. Entrega evidencia móvil/escritorio y pruebas relevantes sobre PostgreSQL separado; no llames producción a una prueba local.
```
