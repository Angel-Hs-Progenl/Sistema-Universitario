# Sistema de diseño de servicios universitarios

La experiencia se centra en lo que una persona necesita hacer: encontrar un servicio, preparar un expediente y conocer el siguiente paso. El inicio es un directorio institucional; titulación es un expediente con acciones por contexto y una bandeja para el personal. Las estadísticas aparecen solo cuando ayudan a priorizar solicitudes.

La identidad usa el nombre proporcionado por el líder. El monograma tipográfico UTO es temporal; no se afirma que sea el escudo oficial. La paleta está propuesta por el usuario y pendiente de autorización institucional. No se ha acreditado su pertenencia al manual gráfico de la UT.

## Paleta y contraste

Fuente única: `src/styles/tokens.css`. El equipo no debe volver a declarar la paleta en cada módulo.

| Token  | Color   | Uso                                     |
| ------ | ------- | --------------------------------------- |
| brand  | #6F1738 | Acción principal, identidad y enlaces   |
| gold   | #B8862B | Detalles decorativos y acentos          |
| sage   | #DCE8D5 | Fondos suaves de confirmación y apoyo   |
| green  | #386641 | Confirmaciones, progreso y foco visible |
| canvas | #F7F6F2 | Lienzo general                          |
| ink    | #202124 | Texto principal                         |

Contrastes calculados con luminancia relativa sRGB, redondeados a dos decimales:

| Texto / fondo   | Ratio   | Texto normal AA          |
| --------------- | ------- | ------------------------ |
| Guinda / blanco | 11.32:1 | Pasa                     |
| Verde / salvia  | 5.26:1  | Pasa                     |
| Tinta / marfil  | 14.89:1 | Pasa                     |
| Guinda / marfil | 10.47:1 | Pasa                     |
| Verde / marfil  | 6.17:1  | Pasa                     |
| Dorado / blanco | 3.24:1  | No usar en texto pequeño |
| Tinta / dorado  | 4.97:1  | Pasa                     |

El umbral habitual de WCAG para texto normal es 4.5:1. Pasar estas combinaciones no demuestra conformidad completa del producto. Los tonos adicionales de superficie, borde y observaciones son semánticos centrales, no nuevas paletas libres por equipo.

## Tipografía, espacio y composición

Manrope para títulos operativos y DM Sans para cuerpo, con respaldo Arial/sans-serif. Georgia/Times New Roman del sistema se usa solo como acento serif en el directorio y la orientación de acceso. Las fuentes se incluyen en la build mediante paquetes Fontsource y se sirven localmente; sus licencias se conservan en docs/licencias. No se solicitan fuentes a Google al visitar la aplicación.

Contenido con ancho máximo de 1280 px. Espaciado basado en 4 px. Bordes suaves, radios de 3 px y superficies con poco ruido visual. Evitar gráficas decorativas, métricas ficticias, tarjetas repetidas sin acción, gradientes fuertes y sidebars distintos por módulo. El inicio no usa certificados decorativos ni eslóganes: presenta servicios, destinatarios, requisitos y acceso para retomar.

Puntos de adaptación actuales: 1100, 800 y 640 px. En móvil, navegación global desplegable; navegación del módulo horizontal con desplazamiento propio; formularios en una columna; acciones apiladas; tablas con desplazamiento interno. Comprobar 390 px, 768 px, 1440 px y 200 % de zoom. No recortar texto ni ocultar acciones esenciales para que “quepa”.

## Componentes compartidos

- Shell: franja institucional, marca, navegación, identidad de sesión y pie.
- Badge: estado textual y color semántico; no comunicar estado únicamente por color.
- Field: etiqueta persistente, obligatoriedad, validación nativa y ayuda contextual.
- Alert: errores recuperables y mensajes de confirmación con aria-live mediante roles.
- Modal: diálogo nativo con foco contenido, Escape y devolución del foco al disparador.
- BusyButton: evita doble envío y muestra operación en curso.
- Empty: explica ausencia de contenido y permite continuar.
- Panel, lista de documentos, timeline y tabla: contexto, evidencia y acción visibles juntos.

## Reglas de experiencia

Cada página tiene un encabezado claro; cada formulario puede comunicar error, guardar o conservar contexto. Evitar éxito optimista para acciones que aún no se confirmaron en el servidor. Rechazos incluyen observación; enviar presenta resumen y confirmación; estados sin acción explican qué área continúa.

No afirmar “título emitido”, “correo enviado”, “pago realizado” o “identidad validada” si solo se registró un dato interno. El sistema verifica presencia/formato y dictámenes humanos; no autentica documentos oficiales por sí mismo.

Antes de integrar una pantalla: usar tokens y componentes, comprobar foco/teclado, etiquetas, contraste, mensajes, móvil/escritorio, ausencia de overflow global y claridad del próximo paso. Referencias y justificación están en docs/INVESTIGACION.md.

## Revisión de interfaces con IA

Leer [AUDITORIA-DISENO.md](AUDITORIA-DISENO.md): investigación, diagnóstico de la primera entrega y criterios de aceptación. El resumen muestra tareas y faltantes; documentos y el historial completo tienen vistas propias. La revisión institucional se muestra después del envío, sin confundir adjuntos con dictámenes. La bandeja utiliza el ancho completo. Los errores de perfil enlazan al campo y conservan los valores. Los dictámenes exigen elegir un resultado.
