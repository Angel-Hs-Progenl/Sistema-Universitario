# Contribuir al sistema universitario

Cada mini equipo entrega cambios sobre la misma base, mediante pull request. El líder integra únicamente después de revisar requisitos, contrato de API, comportamiento, diseño y pruebas. Los equipos no suben una aplicación independiente para pegarla después.

## Preparación del repositorio por el líder

1. Crear en GitHub un repositorio vacío, preferentemente privado. No inicializar otro README si vas a subir esta carpeta.
2. Conectar el remoto y subir la base inicial. El líder proporcionará la URL y la rama base a todos.
3. Invitar a los integrantes o equipos con los permisos mínimos necesarios.
4. Configurar protección de `main`: pull requests obligatorios, al menos una aprobación, invalidar aprobaciones si cambia el código, resolver conversaciones y exigir la comprobación `verify` de CI.
5. Restringir pushes directos y no habilitar force push. Estas reglas dependen del plan y configuración de GitHub; comprobar que realmente estén disponibles y aplicadas.
6. Completar `.github/CODEOWNERS` con el usuario real del líder y activar revisión por propietarios cuando el plan lo permita. El archivo entregado contiene instrucciones, aún no impone propietarios.

Consulta la [disponibilidad de ramas protegidas según el plan](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches): un repositorio privado en GitHub Free no ofrece todas esas protecciones. Mantenerlo privado no activa automáticamente una revisión obligatoria. Verifica también la [configuración de CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

Cuando el repositorio vacío esté creado, desde esta carpeta:

```bash
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

No ejecutar esos comandos hasta sustituir la URL por el repositorio correcto. La base local ya tiene su commit inicial; no necesitas reinicializar Git.

## Flujo por equipo

```bash
git clone URL_DEL_REPOSITORIO
git switch -c feat/becas-convocatorias
# implementar, probar y documentar
git add src/modules/becas backend/app/modules/becas docs
git commit -m "feat(becas): registrar convocatorias"
git push -u origin feat/becas-convocatorias
```

Usar `feat/<modulo>-<funcion>`, `fix/<modulo>-<problema>` o `docs/<tema>`. Abrir el PR hacia `main`. Actualizar la rama con la base antes de pedir revisión; resolver los conflictos dentro del PR con ayuda del líder. El líder puede integrar mediante squash para conservar una entrega clara por cambio.

## Acuerdo de integración

- No renombrar carpetas compartidas ni duplicar login, roles, navegación o estilos globales.
- Crear rutas bajo `/api/v1/<modulo>`; no llamar endpoints privados de otro módulo.
- Agregar el módulo al router y al inicio solo cuando sus criterios de aceptación pasen.
- Incluir migración y plan de preservación de datos para cambios de base.
- Los contratos se documentan en OpenAPI y en el README del módulo. No romper clientes existentes sin una transición acordada.
- El líder revisa modificaciones a `src/app`, `src/shared`, `src/styles`, `backend/app/core`, migraciones, dependencias y CI.
- No cambiar de React/FastAPI/PostgreSQL por recomendación de una IA sin aprobación registrada.

## Evidencia de entrega

Cada PR indica requisito y caso de uso, resultado observable, pruebas ejecutadas, limitaciones y capturas a 390 px y 1440 px cuando cambia UI. No pegar datos reales. `npm test`, `npm run build` y pytest deben pasar. Las comprobaciones de GitHub no sustituyen la validación del área usuaria.
