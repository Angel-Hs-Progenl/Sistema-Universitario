# Clonar, instalar y desarrollar un módulo

Esta guía es para los mini equipos de la UT de Oriental. Cada equipo trabaja sobre esta base y envía un pull request al líder. La versión de referencia es la que el líder haya integrado en el repositorio; comprobar que el README incluya los cambios acordados antes de desarrollar.

## Requisitos del equipo

- Git y acceso al repositorio de la clase.
- Node.js 24 LTS con npm.
- Python 3.12 con pip y venv.
- PostgreSQL 16 local, o Docker con Compose para levantar solo la base.

No se necesita una cuenta de Google Cloud para desarrollar módulos: las cuentas ficticias usan la sesión local del portal. Nunca copiar el `.env`, la base o los expedientes de otra persona.

## Instalación en Windows / PowerShell

```powershell
git clone https://github.com/Angel-Hs-Progenl/Sistema-Universitario.git
cd Sistema-Universitario
npm ci
py -3.12 -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
Copy-Item .env.example .env
```

Editar `.env` localmente. Si usas una instalación PostgreSQL, crear una base vacía y un usuario para desarrollo; completar DATABASE_URL con sus credenciales. La URL debe usar `postgresql+psycopg`. Nunca utilizar una base institucional existente para las pruebas.

Si usas Compose, agregar `POSTGRES_PASSWORD` a `.env` y utilizar esa misma contraseña en DATABASE_URL para el usuario `uto`, base `uto`, host `127.0.0.1` y puerto `5432`. La contraseña se elige localmente y no se publica. Luego:

```powershell
docker compose up -d db
docker compose ps
.venv/Scripts/alembic.exe -c backend/alembic.ini upgrade head
.venv/Scripts/python.exe backend/manage.py seed-demo
./scripts/start-local.ps1
```

Esperar que PostgreSQL esté healthy antes de migrar. Si no usas Docker, omitir los dos primeros comandos. Abrir http://127.0.0.1:5173/. La API se consulta en http://127.0.0.1:8000/api/docs.

El script inicia frontend y API ocultos y registra sus procesos, incluidos los launchers de Python de Windows. Para detenerlos: `./scripts/start-local.ps1 -Stop`. PostgreSQL se administra por separado. No ejecutar dos instancias en los mismos puertos; un puerto ocupado se informa y no se mata otro proceso automáticamente.

Si una política de PowerShell impide ejecutar el script, usar dos terminales:

```powershell
# Terminal 1, desde la raíz
.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --no-access-log
```

```powershell
# Terminal 2, desde la raíz
npm run dev
```

No necesitas activar el entorno virtual si usas sus ejecutables explícitos.

## Linux / macOS

Tras clonar e instalar Node/Python/PostgreSQL:

```bash
npm ci
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock.txt
cp .env.example .env
# completar .env y levantar PostgreSQL
.venv/bin/alembic -c backend/alembic.ini upgrade head
.venv/bin/python backend/manage.py seed-demo
.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --no-access-log
```

En otra terminal, `npm run dev`. El script PowerShell está pensado para Windows; los comandos anteriores son la alternativa manual, no una instalación verificada en macOS/Linux durante esta entrega.

## Cuentas ficticias

Contraseña para todas: `Demo-UTO-2026!`. Estudiante: `estudiante@demo.uto.local`; Escolares: `escolares@demo.uto.local`; Tesorería: `tesoreria@demo.uto.local`; Vinculación: `vinculacion@demo.uto.local`; administración: `administrador@demo.uto.local`. Otro estudiante: `egresado2@demo.uto.local`.

El número reservado `+12025550100` está vinculado por el seed a estudiante. No usar números reales para capturas o pruebas. Un teléfono escrito en el perfil académico **no** habilita acceso por teléfono. Google no se simula: se configura por separado con la universidad.

## Estructura fácil de seguir

```text
src/modules/<modulo>/           Pantallas y componentes del equipo
backend/app/modules/<modulo>/  Router, esquemas, modelos y reglas del equipo
src/app/                       Sesión, router, header y menú de cuenta comunes
src/shared/                    API, marca, formularios, diálogos y utilidades
src/styles/                    Paleta y estilos comunes
backend/app/core/              Identidad, sesiones, permisos, DB y Google
backend/migrations/            Migraciones Alembic
shared/navigation.js           Registro de módulos y migas
docs/                          Requisitos, arquitectura, diseño y evidencias
```

Es un **monolito modular**: un frontend, una API y una base compartidos, separados por dominio. Consulta ARQUITECTURA.md antes de modificar el núcleo. Las carpetas compartidas y migraciones requieren revisión del líder.

## Empezar una entrega

```bash
git switch main
git pull --ff-only
git switch -c feat/becas-convocatorias
```

El nombre del módulo es un ejemplo; el líder asigna el alcance. Leer AGENTS.md, REQUISITOS.md, ARQUITECTURA.md, DISENO.md, CASCADA.md y PROMPTS.md. Crear rutas bajo `/<modulo>` y `/api/v1/<modulo>`. No registrar un módulo vacío en el home; integrar navegación únicamente cuando sus criterios funcionen.

Reutilizar `Protected`, Shell, AccountMenu, Brand, Breadcrumbs, `shared/api.js`, `shared/ui.jsx` y los tokens. No generar otro login, otro header o una paleta por equipo. La API verifica todos los permisos y la propiedad de registros.

## Colores y prompts

| Token | Color | Uso |
| --- | --- | --- |
| brand | #6F1738 | Identidad y acción principal |
| gold | #B8862B | Acentos; no texto pequeño sobre blanco |
| sage | #DCE8D5 | Superficies de apoyo |
| green | #386641 | Confirmación y foco |
| canvas | #F7F6F2 | Lienzo |
| ink | #202124 | Texto |

La fuente de verdad es `src/styles/tokens.css`. Los colores del logo oficial y del botón de Google son recursos de sus titulares, no nuevas paletas de módulo. Copiar los bloques de PROMPTS.md y completar tarea, rol, requisito, API y criterio de aceptación antes de pedir código a una IA.

## Verificar y entregar

```powershell
npm test
npm run build
.venv/Scripts/python.exe -m pytest backend/tests -q
.venv/Scripts/python.exe scripts/test_check_repository.py
```

Pytest usa SQLite temporal si no hay TEST_DATABASE_URL; la aplicación utiliza PostgreSQL. Para comprobar bloqueos/concurrencia usar una base separada y desechable cuyo nombre termine en `_test`; la suite vacía sus tablas. Nunca apuntar TEST_DATABASE_URL a una base con expedientes.

Preparar solamente los archivos de la entrega, revisar el diff, ejecutar `python scripts/check_repository.py --history` y hacer commit. Subir la rama y abrir PR hacia main. Incluir requisito, descripción, pruebas, límites y capturas con datos ficticios a 390/1440 px. El líder revisa e integra; no hacer push directo a main.

## Errores habituales

- No conecta PostgreSQL: comprobar servicio/healthcheck, puerto y DATABASE_URL; no cambiar a otra base para ocultar el fallo.
- Falta una columna: actualizar la rama y ejecutar Alembic; no borrar tablas ni usar create_all.
- 8000/5173 ocupado: detener tu instancia anterior; no matar procesos de otro proyecto.
- Google deshabilitado: falta configurar OAuth institucional. Seguir desarrollando con cuentas ficticias.
- `.env` o documentos en Git: revisar SECURITY.md; .gitignore no elimina archivos ya versionados.
