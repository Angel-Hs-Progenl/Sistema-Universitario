# Desarrollo y operación

## Entorno preparado en esta carpeta

Se creó un clúster PostgreSQL de desarrollo **aislado** bajo `data/postgres`, usando los binarios PostgreSQL 16 ya instalados en este equipo. Solo escucha en `127.0.0.1:5434`. Bases: `uto` y `uto_test`; usuario local `uto`. No se modificaron bases institucionales. La autenticación trust del clúster es exclusiva para esta demostración local, no una configuración de despliegue: otros procesos de este equipo pueden conectarse mientras esté encendido.

La configuración local está en `.env`, ignorada por Git. Cada integrante crea su propio PostgreSQL; no debe copiar `data/` ni compartir el clúster por Git. En producción se requiere usuario de aplicación sin privilegios de superusuario, contraseña fuerte/SCRAM, permisos de red y políticas de respaldo.

Para reiniciar la base de este equipo desde la raíz:

```powershell
& 'C:/Program Files/PostgreSQL/16/bin/pg_ctl.exe' -D './data/postgres' -l './data/postgres.log' -o '-h 127.0.0.1 -p 5434 -c shared_buffers=32MB -c max_connections=40' -w start
```

Para detenerla cuando no haya operaciones:

```powershell
./scripts/start-local.ps1 -Stop
& 'C:/Program Files/PostgreSQL/16/bin/pg_ctl.exe' -D './data/postgres' -m fast -w stop
```

Los comandos de arriba son específicos del entorno preparado; para otros equipos se recomienda una instalación PostgreSQL normal o compose.yaml. Los servidores web se inician ocultos con `scripts/start-local.ps1` y sus logs quedan en `data/`. El script registra PID y fecha de inicio para detener únicamente esos procesos.

## Cuentas de desarrollo

Contraseña ficticia para todas: `Demo-UTO-2026!`.

| Cuenta                       | Rol / uso                                           |
| ---------------------------- | --------------------------------------------------- |
| estudiante@demo.uto.local    | Estudiante, borrador con tres archivos de ejemplo   |
| egresado2@demo.uto.local     | Otro estudiante, expediente preparado para revisión |
| escolares@demo.uto.local     | Servicios Escolares                                 |
| tesoreria@demo.uto.local     | Validación exclusiva del comprobante de pago        |
| vinculacion@demo.uto.local   | Liberación de estadías y seguimiento                |
| administrador@demo.uto.local | Administración del flujo académico                  |

El seed no sobrescribe expedientes o contraseñas existentes. CR-005 vincula el teléfono reservado +12025550100 a la cuenta estudiante demo si aún no tiene uno; no reemplaza una vinculación existente. `APP_ENV=production` prohíbe ejecutarlo. El entorno institucional debe crearse vacío y habilitar cuentas autorizadas. Los perfiles, CURP y documentos del seed son ficticios, marcados como ejemplo y sin validez.

Alta de usuario (la contraseña se solicita oculta, no va en argumentos):

```powershell
.venv/Scripts/python.exe backend/manage.py create-user --email cuenta@utdeoriental.edu.mx --name 'Nombre autorizado' --role escolares
```

La pantalla de administración de usuarios y asignación de permisos aún no está implementada. Las altas se hacen mediante CLI con acceso de operador al servidor.

Google Workspace, teléfono vinculado y requisitos de operación se documentan en [ACCESO-INSTITUCIONAL.md](ACCESO-INSTITUCIONAL.md). Un teléfono de contacto no se migra a credencial automáticamente. El menú de cuenta solo cambia el nombre visible; no asigna roles ni cambia datos del expediente.

## Correo y recuperación

Configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_STARTTLS=true` en el entorno. Los enlaces se generan con `APP_ORIGIN`; debe coincidir con la URL pública. En desarrollo sin SMTP quedan en `data/outbox/`. No publicar ese directorio: sus enlaces permiten cambiar contraseñas. En producción, el arranque exige SMTP y HTTPS. El envío SMTP real no se ha verificado con una cuenta institucional.

Los tokens vencen a los 30 minutos, se almacenan por hash y solo se consumen una vez. Cambiar contraseña invalida las sesiones existentes. Las notificaciones de trámite son internas; enviar correos por cada estado requiere una entrega adicional con reintentos y seguimiento.

## Migraciones

```powershell
.venv/Scripts/alembic.exe -c backend/alembic.ini upgrade head
.venv/Scripts/alembic.exe -c backend/alembic.ini revision --autogenerate -m 'descripcion del cambio'
```

Revisar la migración generada antes del PR. No usar downgrade sobre producción sin evaluar pérdida de datos. Las migraciones se aplican una vez, antes de arrancar workers. Nunca borrar tablas para resolver diferencias de esquema.

## Respaldos y restauración

Para consistencia entre base y archivos, detener las operaciones que modifican expedientes o usar una estrategia de instantáneas acordada. Ejecutar `scripts/backup.ps1` indicando la URL PostgreSQL **sin contraseña en los argumentos** y el path de pg_dump; usar un archivo pgpass protegido o solicitud interactiva. El script crea un dump y copia uploads. No copia secretos ni envíos del buzón.

Restaurar en una base **vacía y separada** con `pg_restore --dbname=<base_nueva> <database.dump>` y copiar uploads al DATA_DIR del entorno de recuperación. No usar `--clean` sobre la base activa. Iniciar el entorno recuperado, verificar login, folios, documentos y eventos, y registrar fecha/responsable/resultado.

Retención, cifrado externo, programación, offsite y objetivos RPO/RTO deben definirse con TI. Un archivo de respaldo sin restauración probada no es evidencia de recuperación.

## Preparación pendiente para producción

La versión actual no se presenta como lista para producción. Antes del uso real: aprobación de requisitos y aviso legal, logo/paleta autorizados, TLS y proxy con límite de cuerpo, SMTP probado, SSO/MFA según módulo, rate limit compartido, antivirus/cuotas/conciliación de archivos, base con mínimos privilegios, monitoreo y política de logs sin datos personales, restauración demostrada y pruebas de carga/seguridad/aceptación con las áreas.

Para servir la build React, el servidor web debe redirigir rutas del cliente a index.html y enviar `/api` a FastAPI bajo el mismo origen. Definir CSP para contenido y fuentes del propio origen; las fuentes ya se alojan localmente. El servidor Vite es únicamente de desarrollo. No se ha desplegado ni publicado un sitio.

## Operación de módulos integrados · CR-010

La base local del líder se conserva en 127.0.0.1:5434; no requiere Docker en ese equipo. `./scripts/start-db.ps1` verifica la conexión y puede reutilizar el clúster existente; no lo inicializa ni lo borra. Compose usa 5433 por defecto y admite POSTGRES_PORT. Nunca ejecutar `docker compose down -v` para resolver una migración.

Antes de actualizar, detén la API y frontend y ejecuta `python scripts/database.py migrate` con el Python de .venv. Crea respaldo de base y adjuntos en data/backups y comprueba la revisión de Alembic al terminar. Para una base nueva debe existir primero el usuario/base PostgreSQL. `alembic check` desde un proceso nuevo no debe proponer eliminar tablas ni recrear índices.

Cuentas ficticias adicionales: docente@demo.uto.local (sus asignaturas, informes publicados y planes); evaluador@demo.uto.local (revisión de becas); auditor@demo.uto.local (actividad y bitácora). Contraseña demo común. El seed es idempotente y no reinicia evaluaciones enviadas. El umbral de dos participantes y la escala de sus ejemplos no son criterios oficiales.

Las órdenes de Becas son registros internos programados por Tesorería; no contienen referencias SPEI fabricadas ni confirman pagos. La revisión de comentarios de evaluación es humana y previa a publicación. En producción, Evaluación docente requiere sesión Google institucional; configurar OAuth por el procedimiento de ACCESO-INSTITUCIONAL.md.

La revisión local del 24/10/2026 creó un respaldo previo, restauró una copia en una base separada terminada en _test y verificó huellas de usuarios y tablas de Titulación antes/después de migrar, así como sus 10 adjuntos. No sustituye una política institucional de respaldo/retención, ni autoriza usar el clúster de desarrollo para producción.
