# Google Workspace, teléfono y perfil

CR-005, 13 de octubre de 2026. El líder confirmó Google Workspace y eligió teléfono vinculado + contraseña del portal. Se amplía el núcleo compartido; no se crea un segundo sistema de usuarios, roles o sesiones.

## Métodos disponibles

**Google:** flujo OpenID Connect implementado, pendiente de las credenciales OAuth de la universidad y de su prueba real. El botón permanece deshabilitado e informa la configuración pendiente cuando faltan esas variables. No se muestran accesos ficticios como Google autorizado.

**Correo y contraseña del portal:** las cuentas institucionales se habilitan previamente por CLI. La contraseña pertenece a esta aplicación; nunca se pide la contraseña de Google. En producción solo se admiten usuarios cuyo correo pertenece exactamente a `utdeoriental.edu.mx`. Las cuentas demo/test se reservan a entornos no productivos.

**Teléfono y contraseña del portal:** el número debe estar vinculado explícitamente a una cuenta por un operador autorizado. No usa SMS. Un dato de contacto guardado por el estudiante no prueba titularidad y no modifica la credencial de acceso. Se aceptan 10 dígitos de México, normalizados con +52, o formato internacional con + y código de país.

## Configuración real de Google

1. El responsable de Google Workspace/Cloud de la universidad registra la aplicación y su pantalla de consentimiento, con la política institucional que corresponda. No se crea una aplicación Cloud o se aceptan términos desde esta entrega.
2. Crear un cliente OAuth de tipo aplicación web. Para el desarrollo local documentado, autorizar exactamente `http://127.0.0.1:5173/api/v1/auth/google/callback`. Para el despliegue, usar HTTPS y el APP_ORIGIN real; no mezclar localhost con 127.0.0.1.
3. Guardar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en el `.env` local o gestor de secretos del servidor. `.env.example` contiene variables vacías, nunca credenciales. Reiniciar la API después de configurarlas.
4. Habilitar previamente los usuarios y sus roles en el portal. Google no asigna permisos ni registra automáticamente a cualquier persona del dominio.
5. Probar con las cuentas autorizadas por la universidad: acceso válido, correo externo, usuario no habilitado, cancelación, vuelta al enlace privado y cierre de sesión. No publicar tokens, códigos OAuth o HAR de esas pruebas.

La documentación de [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect) distingue el selector de dominio de la comprobación del claim hd. Aquí `hd=utdeoriental.edu.mx` se envía como ayuda visual, pero el servidor exige hd exacto, email institucional, email_verified=true y nonce correcto. La biblioteca oficial verifica firma, audiencia, emisor y vencimiento. También se usan PKCE S256, state de un solo uso, vencimiento de cinco minutos y vínculo con el navegador.

La identidad externa se conserva por su sub estable. La primera vinculación solo se permite a un correo prehabilitado y verificado por Google. Un sub ya vinculado no se reemplaza automáticamente por otro. Cambios de correo/identidad institucional requieren operación y revisión; no reutilizar cuentas de egresados para otras personas.

Se solicitan únicamente openid/email: no Drive, contactos o documentos. No se almacenan access tokens ni refresh tokens. Se conserva la sesión existente de ocho horas con cookie HttpOnly/SameSite Strict y CSRF. El intento OAuth usa una cookie temporal HttpOnly/SameSite Lax porque el regreso desde Google es una navegación externa; se elimina al completar/cancelar el intento.

## Vincular un teléfono

Antes de operar, confirmar titularidad y autorización por el procedimiento de la universidad; esta versión no automatiza esa comprobación. La herramienta exige cuenta administradora y su contraseña del portal. Se ejecuta en el servidor autorizado:

```powershell
.venv/Scripts/python.exe backend/manage.py link-phone --actor administrador@utdeoriental.edu.mx --email cuenta@utdeoriental.edu.mx --phone +CODIGO_NUMERO_AUTORIZADO
```

El número del comando es un marcador que debe sustituirse localmente. No copiar números reales a issues, chats, capturas o scripts versionados. Para retirar la vinculación, usar `--remove` en lugar de `--phone`. El comando no imprime el número y solicita la contraseña sin mostrarla. Considerar también el historial local del shell al operar con datos reales.

La base impone unicidad del número. Cambio, evento de auditoría y revocación de sesiones se confirman en una transacción; un número duplicado revierte toda la operación. La auditoría registra cuenta afectada, actor, acción y fecha. Una cuenta administradora no obtiene permisos para validar pagos o liberaciones por operar esta herramienta.

## Perfil y menú de cuenta

El avatar es un icono local de perfil, sin descarga de fotografías de Google ni subida de imágenes personales. Por clic se abre una lista con identidad, rol, Editar perfil y Cerrar sesión; el estudiante tiene además acceso a sus datos de titulación. Escape cierra y devuelve el foco; también cierra al salir con teclado o hacer clic fuera.

Editar perfil cambia únicamente el nombre visible. Correo, rol, teléfono vinculado y nombre legal del expediente no se alteran mediante ese formulario. La actualización exige sesión/CSRF y se audita. No se expone una acción de “cambiar rol” o “vincular teléfono” sin un procedimiento autorizado.

## Migración y operación

Alembic 0003 añade campos de vinculación y nombre visible, oauth_attempts y account_events. Es aditiva; no borra ni migra el teléfono del perfil automáticamente. Antes de actualizar un entorno institucional, respaldar y probar la migración en una copia autorizada. No usar downgrade como reparación: elimina estos campos y eventos.

Los logs SQL ocultan parámetros y el manejador HTTP no imprime detalles de excepciones que puedan incluir datos privados. El inicio local desactiva access logs de Uvicorn para evitar códigos OAuth en URLs. En el proxy/servidor de producción también se deben omitir las consultas del callback. Tokens, exports OAuth, estados del navegador, HAR y trazas se excluyen de Git.

Pendientes de implantación: cliente OAuth real y aceptación institucional, revisión del procedimiento de vinculación/reciclaje de números, límites de intentos compartidos entre workers, retención de auditoría, HTTPS/SMTP y pruebas externas de seguridad. Las pruebas locales usan tokens firmados y certificados efímeros de prueba, más respuestas de proveedor simuladas para los escenarios; no equivalen a un acceso real a Google Workspace.
