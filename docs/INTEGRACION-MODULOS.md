# Integración de Becas y Evaluación docente · CR-010

24 de octubre de 2026. El líder autoriza corregir el pull, integrar los módulos, unificar el diseño y resolver la operación de la base. Esta revisión técnica no equivale a aprobación de requisitos, criterios académicos, bases de becas ni implantación institucional.

## Una aplicación

Se conserva React/JavaScript, FastAPI/Python, SQLAlchemy y PostgreSQL. Una identidad y cookie de sesión; un Shell con encabezado horizontal, migas y menú de cuenta; una paleta y una preferencia de movimiento en el footer.

Las rutas de cada dominio se declaran en `src/modules/<modulo>/routes.jsx`. El archivo `src/app/App.jsx` las integra y mantiene Titulación, acceso, cuenta y páginas comunes. `shared/navigation.js` define módulos, accesos por rol, navegación local y títulos. `RoleRoute` organiza el acceso del cliente; la API comprueba roles, propiedad y estado en todas las operaciones.

`src/shared/ModuleLayout.jsx`, `Work.jsx`, `ui.jsx` y `api.js` contienen patrones compartidos. `src/styles/modules.css` usa exclusivamente tokens centrales y compone listados, expedientes, tablas, cuestionarios e informes; no incluye otra paleta. Los diseños anteriores con datos mock, login propio y CSS global por rol se sustituyen por estas vistas conectadas, conservando los destinos de navegación pertinentes. No se recuperan archivos mock desde carpetas `data`: esa exclusión continúa protegiendo datos privados.

## Matriz aplicada en el servidor

Los permisos de Titulación permanecen limitados a sus cinco roles. Docente, Evaluador y Auditor no pueden consultar sus expedientes, documentos ni catálogos.

| Tarea de Becas                     | Estudiante                                      | Escolares / Evaluador / Administrador | Tesorería | Auditor                                      |
| ---------------------------------- | ----------------------------------------------- | ------------------------------------- | --------- | -------------------------------------------- |
| Consultar convocatorias            | Sí                                              | Sí                                    | Sí        | Sí                                           |
| Registrar solicitud y estudio      | Solo propios                                    | No                                    | No        | No                                           |
| Consultar expediente y documentos  | Solo propios                                    | Sí                                    | No        | No                                           |
| Adjuntar o sustituir documentos    | Solo propios y antes del dictamen; no validados | No                                    | No        | No                                           |
| Revisar documentos y dictaminar    | No                                              | Sí                                    | No        | No                                           |
| Consultar órdenes internas         | Solo propias                                    | Sí                                    | Sí        | Sí, con identidad del beneficiario reservada |
| Programar orden interna            | No                                              | No                                    | Sí        | No                                           |
| Solicitar renovación               | Solo beca propia aprobada                       | No                                    | No        | No                                           |
| Revisar renovación                 | No                                              | Sí                                    | No        | No                                           |
| Consultar actividad y exportar CSV | No                                              | Sí                                    | No        | Sí                                           |
| Consultar bitácora                 | No                                              | Escolares / Administrador             | No        | Sí                                           |

Vinculación y Docente no tienen acceso a Becas. La consulta financiera no concede acceso al estudio socioeconómico. La asignación institucional final de responsables del módulo debe ratificarse; esta matriz restringe técnicamente la integración recibida. Administrador no programa órdenes en nombre de Tesorería.

| Tarea de Evaluación docente                     | Estudiante                                           | Docente                                                    | Administrador, operador de coordinación                  |
| ----------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Consultar asignaciones                          | Solo propias                                         | Sus asignaturas, sin filas ni participación por estudiante | Preparación y participación, sin respuestas individuales |
| Enviar respuestas                               | Solo asignación propia, una vez y dentro del periodo | No                                                         | No                                                       |
| Configurar cuestionario, periodo y asignaciones | No                                                   | No                                                         | Sí                                                       |
| Revisar comentarios antes de publicar           | No                                                   | No                                                         | Sí, sin identidad estudiantil en esa respuesta de API    |
| Consultar resultados                            | No                                                   | Solo propios, publicados y con umbral suficiente           | Agregados, con el mismo umbral de participantes          |
| Registrar plan de mejora                        | No                                                   | No                                                         | Sí, con resultados publicados y suficientes              |
| Registrar avance de un plan                     | No                                                   | Solo propio                                                | No                                                       |

No se creó un rol institucional de Dirección sin acuerdo. Las funciones de coordinación se habilitan al rol existente Administrador para la validación técnica; la universidad debe ratificar responsables y procedimiento antes de operar. En producción, todo el módulo exige una sesión iniciada con Google institucional; una sesión con contraseña, aunque la cuenta tenga Google vinculado, no basta. El acceso local de las cuentas demo es exclusivo de desarrollo.

## Becas: recorrer y comprobar

1. Estudiante guarda su estudio socioeconómico, consulta bases y registra una solicitud durante las fechas de recepción.
2. Recibe folio y adjunta documentos. El servidor comprueba catálogo, extensión, encabezado real del archivo y tamaño de 1 byte a 5 MB. La comprobación no sustituye análisis antivirus ni autenticación del documento.
3. El área revisora descarga evidencia, valida cada documento o indica qué corregir. Las sustituciones conservan el archivo anterior si falla la transacción; el archivo anterior se retira después de confirmar.
4. El dictamen exige la versión vigente. Aprobar requiere los documentos de la lista inicial validados, promedio suficiente y cupo. El bloqueo de la convocatoria evita asignar el último lugar dos veces.
5. Tesorería registra una orden interna por solicitud y periodo. No hay transferencia, referencia SPEI inventada ni integración bancaria simulada.
6. El estudiante solicita renovación; el área registra el resultado y la observación. Las restricciones SQL impiden solicitudes, órdenes o renovaciones duplicadas para sus respectivas claves.

Los montos son `Numeric(12,2)` y las entradas económicas usan Decimal. Los CSV neutralizan fórmulas y omiten información personal y socioeconómica. La bitácora conserva movimientos; no es inmutable frente al administrador de la base.

La lista de documentos y el cálculo orientativo de vulnerabilidad recibidos del equipo siguen siendo propuestas por ratificar, no reglas oficiales. Los montos y promedios se capturan por convocatoria; las cantidades del seed son ejemplos. No se aplica un rechazo o asignación automática mediante el puntaje orientativo.

## Evaluación docente: recorrer y comprobar

1. Coordinación guarda un cuestionario con tres secciones, escala y pesos explícitos. Una nueva versión no modifica las respuestas anteriores.
2. Prepara un periodo con fechas y mínimo de participantes; sus borradores se reservan a coordinación. Registra las asignaciones estudiante-docente-asignatura-grupo y abre recepción.
3. El estudiante responde todas las preguntas y confirma el envío. El servidor valida propietario, periodo, escala y respuesta única. La UI muestra éxito únicamente tras recibir confirmación del servidor. Las respuestas no se escriben en consola ni localStorage.
4. Coordinación cierra recepción y revisa los comentarios. Puede redactar una versión sin datos identificables o excluir un comentario. No se permite publicar con comentarios pendientes de revisión.
5. Publica el periodo. Cada docente consulta solo su informe, sin identidad estudiantil, respuestas individuales, fechas de envío o participación por estudiante. El mínimo se cuenta con estudiantes distintos, incluso si hay más de una asignatura por persona. Los grupos insuficientes no muestran promedios ni comentarios.
6. Se exportan datos agregados en CSV y se dispone de impresión del informe mediante el navegador. Las gráficas representan promedios persistidos; no incluyen resultados ficticios en las pantallas operativas.
7. Coordinación registra un plan; el docente documenta su avance con control de versión. Administrador no registra avances en su nombre.

El cálculo descriptivo es la media por pregunta y una media ponderada con los pesos configurados, redondeada únicamente para presentación. No asigna niveles institucionales, fortalezas o juicios automáticos. Fórmula, escala, preguntas, umbral de privacidad y política de conservación necesitan ratificación académica.

## Esquema y conservación

- `0004` es la migración de Becas recibida; no se reescribió.
- `0005` admite Docente, identifica el método de sesión, agrega claves únicas de Becas y convierte importes a Numeric. Si hay duplicados heredados se detiene para conciliarlos, sin borrar registros.
- `0007` agrega destinos internos explícitos a las notificaciones. Los avisos heredados conservan su texto y no se redirigen a otro módulo.
- `0006` crea cuestionarios, periodos, asignaciones, respuestas y planes de evaluación. Los modelos de todos los módulos se registran explícitamente en Alembic.
- Los nombres y tipos de índices del ORM coinciden con las migraciones ya existentes; `alembic check` debe terminar sin operaciones nuevas. No ejecutar `create_all` en arranque ni aceptar migraciones que eliminen tablas sin justificación revisada.
- `scripts/database.py migrate` comprueba conexión, respalda base y adjuntos, aplica migraciones y verifica versión. Los respaldos quedan en `data/backups`, excluidos de Git. Detener mutaciones durante el respaldo para obtener una copia consistente entre base y archivos.

## Diseño y lenguaje

La tarea determina la composición: convocatorias en filas con bases y fechas; solicitudes en bandeja; expediente con documentos y datos laterales; cuestionario con grupos de radio y revisión previa; informes con promedios, escala y comentarios revisados. Se retiran porcentajes de entrega, fases completadas, dashboards decorativos, perfiles ficticios incrustados en JSX y botones de éxito simulado.

Los estados de carga, vacío, error y confirmación usan los componentes compartidos. Las tablas desplazan dentro de su región; los formularios pasan a una columna en móvil. Se reutiliza el diálogo nativo con Escape, foco contenido y retorno al control. La animación sigue bajo el control del footer CR-006.

## Pendientes institucionales y externos

La integración técnica no incorpora SPEI, e.firma/SAT, padrón estatal, MFA institucional, proveedor de IA o emisión oficial de títulos. No se presentan como operaciones realizadas. Google requiere configurar OAuth con la universidad; no se usaron credenciales reales. El reporte PDF/XLSX con formato institucional, las clasificaciones de desempeño, importaciones masivas y la asistencia IA sobre comentarios necesitan especificación y aceptación; CSV e impresión sí funcionan en esta revisión.

Antes de usar datos reales siguen pendientes privacidad y retención, catálogo y bases oficiales, responsables y permisos definitivos, aceptación con usuarios, HTTPS/SMTP y operación/recuperación institucional. Los resultados de esta entrega son validaciones locales, no una declaración de producción.

La ayuda permite elegir un servicio de acuerdo con el rol, y la página de privacidad describe los datos de los tres módulos. Los avisos usan destinos internos conocidos, filtrados por módulo y tarea; no se deduce su destino a partir del texto ni se acepta una URL externa.
