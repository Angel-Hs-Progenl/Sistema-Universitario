# Datos privados y publicación

No incorporar expedientes reales, bases de datos, adjuntos, respaldos, correos de recuperación, contraseñas, tokens, llaves de firma o configuración privada. `.env.example` solo admite valores sanitizados. Las cuentas demo son ficticias y no deben existir en producción.

`.gitignore` cubre entornos, variantes de `.env`, dependencias, compilaciones, llaves/certificados, bases y sus diarios, uploads, buzones, respaldos, documentos internos y evidencia local. Mantener migraciones y lockfiles versionados. Los originales de `Pdf´s Modulos` permanecen en el equipo.

CR-005 excluye también client_secret*.json, token*.json, oauth-secrets/, estados del navegador, HAR y trazas. El scanner bloquea estas rutas incluso si se agregan forzadamente y reconoce un formato de secreto OAuth de Google. No es un clasificador completo de datos personales.

Solo docs/capturas contiene evidencia seleccionada para publicar, con cuentas y expedientes ficticios revisados visualmente. output/ continúa ignorado. Los recursos de public/brand son públicos por diseño: PNG institucional entregado por el líder, marca propuesta del azor e icono original de Google; su procedencia se documenta. El original duplicado de la raíz se ignora para publicar una sola copia del PNG.

No publicar GOOGLE_CLIENT_SECRET, tokens, códigos OAuth, cookies, capturas de accesos reales o exports de Cloud. El callback usa consultas sensibles: el inicio local desactiva access logs y el servidor institucional debe hacer lo mismo o redactarlos en su proxy. Los errores de base no imprimen parámetros personales. Consultar docs/ACCESO-INSTITUCIONAL.md antes de activar Google o vincular teléfonos reales.

## Antes de subir cambios

```powershell
git add RUTAS_DEL_CAMBIO
python scripts/check_repository.py
python scripts/check_repository.py --history
git diff --cached --stat
```

El primer comando de comprobación examina el contenido del **índice de Git**, que es lo que se va a guardar en el commit. `--history` añade todos los commits alcanzables por las referencias disponibles **localmente**. El control detecta rutas privadas, claves privadas PEM y algunos formatos de credenciales; solo imprime ubicación y categoría. CI ejecuta la comprobación del índice y sus pruebas. No reconoce todos los secretos, datos personales ni formatos: revisar también el diff.

## Si un archivo ya fue subido

Agregarlo a `.gitignore` no lo retira del índice ni del historial. Primero identificar el archivo, su contenido y los commits afectados sin volver a publicarlo. Si hay credenciales reales, revocarlas/rotarlas con su responsable. Retirar una ruta del índice con `git rm --cached -- RUTA` conserva el archivo local, pero no borra versiones anteriores.

Reescribir el historial y forzar pushes afecta clones, ramas y pull requests: acordar el procedimiento con el líder antes de hacerlo. Seguir la [guía oficial de GitHub para retirar información sensible](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository). No se ha reescrito el historial ni eliminado archivos del equipo en esta entrega.

Ante un hallazgo, comunicarlo directamente al líder mediante un canal privado. No abrir una issue pública que copie el secreto o los datos personales. Habilitar secret scanning/push protection en GitHub cuando estén disponibles para el repositorio y plan utilizados.
