# Instrucciones comunes del proyecto

- CR-006: movimiento activado inicialmente por indicación del líder, con control compartido en el footer. Reutilizar MotionProvider/useMotionPreference/useReducedMotion. Solo se permite localStorage para esta preferencia on/off de apariencia; no para sesiones o expedientes.

Lee README.md, docs/ARQUITECTURA.md, docs/DISENO.md y la especificación del módulo antes de modificar código. El líder controla el alcance y autoriza los cambios de requisitos; no inventes decisiones institucionales.

- Stack obligatorio: React, JavaScript, HTML/CSS, FastAPI, Python, SQLAlchemy y PostgreSQL. No introducir otro backend, base de datos o sistema de autenticación.
- Arquitectura: monolito modular con frontend por dominio y routers FastAPI por módulo. Identidad, sesiones, roles, notificaciones y diseño son compartidos.
- Cada equipo trabaja en `src/modules/<modulo>/` y `backend/app/modules/<modulo>/`. Cambios transversales requieren revisión del líder.
- Reutiliza `src/styles/tokens.css`, `src/shared/ui.jsx`, `src/shared/api.js` y el Shell. No hardcodear nuevos colores ni crear otro encabezado o sidebar global.
- Paleta: #6F1738, #B8862B, #DCE8D5, #386641, #F7F6F2, #202124. Dorado para acentos, nunca texto pequeño sobre blanco.
- Todo permiso se verifica en FastAPI. La UI no es una barrera de seguridad. Estudiante solo ve su expediente; Tesorería solo valida pagos; Vinculación solo registra su liberación. Administrador no suplanta a esas áreas.
- No usar localStorage para sesiones o expedientes. Cookies HttpOnly, CSRF, validación, transacciones y auditoría son obligatorios en las mutaciones sensibles.
- No introducir datos personales reales en seeds, ejemplos, tests, logs, prompts o Git. No subir los documentos fuente de la carpeta Pdf´s Modulos.
- No simular integraciones como reales. La emisión oficial del título requiere XML firmado y procesos institucionales autorizados; no generar sellos o claves ficticias como válidas.
- Todo cambio de modelo necesita migración Alembic. No ejecutar create_all en el arranque. Nunca borrar datos para resolver una migración.
- Mantener accesibilidad, adaptación móvil, estados de carga/vacío/error y nombres de acciones precisos.
- Cada PR referencia un requisito, muestra evidencia de UI si aplica y ejecuta pruebas relevantes. No modificar tests para ocultar fallos.
- Metodología de cascada: respeta la línea base y registra cambios en docs/CASCADA.md. Esta versión es una propuesta inicial implementada, pendiente de aprobación institucional; no declares fases formalmente aprobadas.
- Al finalizar, reporta qué cambió, cómo lo verificaste y qué falta; no llames producción a una validación local.

- Diseño: leer docs/ESTUDIO-LARAVEL.md y docs/AUDITORIA-DISENO.md (histórico). Definir rol/tarea/acción/estados; evitar eslóganes dentro del trabajo, métricas decorativas, información repetida y contenedores sin propósito. CR-004 sustituye la sidebar por encabezado horizontal compartido; conservar pestañas locales y migas según docs/ARQUITECTURA-UI.md.
- Antes de publicar: revisar SECURITY.md y el diff; preparar el índice y ejecutar python scripts/check_repository.py. El control no detecta todos los datos personales; .gitignore no limpia historial.

- CR-003: el home requiere sesión y contiene solo módulos habilitados/accesos por rol. La bienvenida incorpora la ilustración grande solicitada por el líder. Usar shared/navigation.js y Navigation.jsx; no crear otra navegación global.

- CR-005: reutilizar shared/Brand.jsx y app/AccountMenu.jsx. Google Workspace solo autoriza dominio institucional verificado y usuarios habilitados; no asigna roles. Teléfono de acceso requiere vinculación explícita de operador, independiente del perfil académico. Leer docs/ACCESO-INSTITUCIONAL.md; no simular OAuth o SMS. Solo capturas ficticias revisadas en docs/capturas pueden publicarse.
