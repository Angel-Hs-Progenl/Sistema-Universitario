# Servicios universitarios de la UT de Oriental

Base compartida del proyecto integrador de la Universidad Tecnológica de Oriental. React y JavaScript en el cliente; FastAPI, Python, SQLAlchemy y PostgreSQL en el servidor. El inicio privado ofrece únicamente Titulación electrónica. La bienvenida reúne ilustración y acceso; los enlaces internos conservan su destino al iniciar sesión. Evaluación docente y Becas tienen requisitos identificados y se incorporarán después de aprobar su alcance.

Esta entrega es una versión funcional para desarrollo y validación institucional: utiliza sesiones reales, base de datos, archivos protegidos, permisos por área e historial. No está homologada para producción ni conectada al registro oficial de títulos de SEP. No introducir expedientes reales hasta cerrar los pendientes de seguridad, operación y privacidad.

## Empezar

Requisitos: Node.js 24 LTS, Python 3.12 y PostgreSQL 16. Instala PostgreSQL localmente o utiliza `docker compose up -d db` después de definir `POSTGRES_PASSWORD` en `.env`.

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock.txt
Copy-Item .env.example .env
```

Configura `DATABASE_URL` en `.env` con una base vacía destinada al proyecto. No uses una base institucional existente.

```powershell
.\.venv\Scripts\alembic.exe -c backend/alembic.ini upgrade head
.\.venv\Scripts\python.exe backend/manage.py seed-demo
.\scripts\start-local.ps1
```

Abre [la aplicación local](http://127.0.0.1:5173/) y [la documentación de la API](http://127.0.0.1:8000/api/docs).

El seed es opcional, idempotente y exclusivo de desarrollo. Cuenta estudiante: `estudiante@demo.uto.local`; contraseña ficticia: `Demo-UTO-2026!`. En [operación](docs/OPERACION.md) están los demás roles y la forma de crear cuentas propias.

Para detener los dos servidores: `./scripts/start-local.ps1 -Stop`. También puedes iniciar el frontend con `npm run dev` y el backend con `.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000` en terminales separadas.

## Qué funciona

- Inicio de servicios, acceso y recuperación de contraseña con token de un solo uso.
- Perfil académico, folio único y un expediente activo por estudiante.
- Carga y reemplazo de PDF/JPG de hasta 5 MB; descarga autorizada.
- Envío, revisión, rechazo con observación, corrección y reenvío.
- Validación académica por Escolares, pago por Tesorería y liberación por Vinculación.
- Once estados con transiciones controladas, historial persistente y avisos internos.
- Bandeja administrativa con búsqueda, filtros y exportación CSV.
- Vistas adaptables, navegación por teclado y componentes compartidos.

La recuperación sin SMTP escribe los enlaces en `data/outbox/` solamente en desarrollo. No afirma haber enviado un correo. Los títulos oficiales se gestionan externamente; aquí se registran referencia e indicaciones de entrega.

## Guías para los equipos

| Documento                                                | Uso                                                      |
| -------------------------------------------------------- | -------------------------------------------------------- |
| [Lectura de documentos y requisitos](docs/REQUISITOS.md) | Alcance por módulo y trazabilidad de la entrega          |
| [Arquitectura](docs/ARQUITECTURA.md)                     | Estructura, integración y decisiones técnicas            |
| [Sistema de diseño](docs/DISENO.md)                      | Paleta, contraste, componentes y UX                      |
| [Cascada y control de cambios](docs/CASCADA.md)          | Fases, entregables, responsables y puertas de aprobación |
| [Prompts compartidos](docs/PROMPTS.md)                   | Instrucciones listas para entregar a una IA              |
| [Trabajo en GitHub](CONTRIBUTING.md)                     | Ramas, pull requests, revisión e integración             |
| [Operación](docs/OPERACION.md)                           | Inicio, cuentas, migraciones, respaldos y pendientes     |
| [Investigación](docs/INVESTIGACION.md)                   | Fuentes y decisiones respaldadas                         |
| [Validación](docs/VALIDACION.md)                         | Pruebas ejecutadas y límites de verificación             |

## Comprobar cambios

```powershell
npm test
npm run build
.\.venv\Scripts\python.exe -m pytest backend/tests -q
```

Por defecto pytest usa SQLite desechable para facilitar pruebas rápidas; **la aplicación usa PostgreSQL**. Para pruebas representativas define `TEST_DATABASE_URL` con una base desechable terminada en `_test`. Se borran los registros de esa base durante la suite. CI utiliza PostgreSQL.

```powershell
$env:TEST_DATABASE_URL='postgresql+psycopg://usuario:clave@127.0.0.1:5432/uto_test'
.\.venv\Scripts\python.exe -m pytest backend/tests -q
```

## Repositorio

El código está preparado para un único repositorio. El líder revisa las contribuciones antes de integrarlas. El remoto origin está conectado al [repositorio de GitHub](https://github.com/Angel-Hs-Progenl/Sistema-Universitario); el líder publicó la base inicial. Las invitaciones, protecciones y revisión por propietarios se administran en GitHub.

Nombre sugerido: `uto-servicios-universitarios`. Sin licencia de distribución hasta que el equipo y la institución acuerden la titularidad. Los documentos originales, `.env`, bases de datos, archivos subidos, buzones y respaldos están excluidos de Git.

## Diseño y protección del repositorio

La [auditoría de diseño](docs/AUDITORIA-DISENO.md) documenta investigación y cambios aplicados al directorio, expediente y formularios. Consulta [SECURITY.md](SECURITY.md) antes de publicar. Tras preparar cambios con git add, ejecuta `python scripts/check_repository.py`; `--history` incluye los commits disponibles localmente. El control evita algunos formatos de secretos y rutas privadas; también se requiere revisión humana. `.gitignore` no elimina archivos ya versionados ni su historial.

La [arquitectura de interfaz](docs/ARQUITECTURA-UI.md) define bienvenida pública, home compacto, navegación global y migas de pan. Los equipos deben reutilizar ese marco al integrar módulos.

La revisión CR-004 utiliza navegación superior compartida y una bienvenida SVG por capas. El [estudio de Laravel](docs/ESTUDIO-LARAVEL.md) detalla observaciones, decisiones, textos y alternativas gratuitas de animación. Se implementa con CSS/SVG local, sin un servicio de animaciones.
