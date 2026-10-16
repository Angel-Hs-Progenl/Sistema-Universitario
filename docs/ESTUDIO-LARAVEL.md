# Estudio de Laravel y dirección de interfaz · CR-004

Actualización CR-008: se conserva la dirección de composición de este estudio, con una escena vectorial original de azor mensajero en lugar de los tres planos. La bienvenida representa todo el portal universitario. El movimiento vigente se controla por CR-006 desde el footer; las descripciones históricas siguientes no sustituyen esa preferencia. No se incorporan nuevos recursos o bibliotecas de Laravel.

12 de octubre de 2026. Solicitado por el líder: profundizar en Laravel, rediseñar acceso e interior, sustituir la navegación lateral y mejorar textos. El home conserva su contenido compacto. Es una propuesta implementada, pendiente de revisión visual del líder y validación institucional.

## Qué se comprobó directamente

Se abrió [laravel.com](https://laravel.com/) en navegador y se inspeccionaron captura, DOM y estilos computados públicos. La portada observada combina encabezado horizontal, titular ligero, acciones y un dibujo isométrico SVG. A 1440 px, el titular declara InstrumentSans, 72 px, peso 400 y tracking -3.6 px. Se observaron las clases `motion-preset-blur-up`, duración 1000, retardos 200/400, transiciones de grupos SVG, `motion-safe` y `animate-float`. El HTML referencia bundles app/inertia y clases de utilidades. Esto evidencia técnicas del cliente, pero no identifica por sí solo su implementación completa, versión del backend o dependencias exactas. La correspondencia del nombre de presets con [Rombo](https://rombo.co/tailwind/) es una inferencia; no se verificó su package.json.

La [documentación oficial de starter kits](https://laravel.com/framework/docs/13.x/starter-kits) ofrece alternativas de layout para aplicación y acceso. La portada comercial y una aplicación de expedientes tienen tareas distintas: la adaptación al sistema es una decisión nuestra. No se copian SVG, marca, textos ni tipografía de Laravel.

## Diagnóstico de la entrega anterior

La ilustración del portal y una tarjeta blanca no bastaban para cambiar el carácter del sistema. Seguían presentes una sidebar convencional, títulos con peso uniforme, cajas dentro de cajas, reiteración del contexto y descripciones intercambiables entre vistas. El diseño debía cambiar su composición, además de sus colores.

La sidebar no es un antipatrón por sí misma. En este alcance hay un único módulo y pocos destinos: una navegación superior deja mayor ancho de lectura, responde a la preferencia del líder y evita reservar una columna fija. Si el número de módulos crece, habrá que revisar su agrupación con evidencia de uso, sin duplicar navegación en cada equipo.

## Traducción al proyecto

| Aspecto | Implementación acordada para esta revisión |
| --- | --- |
| Composición | Encabezado global horizontal; migas debajo; identidad del módulo y navegación local en un mismo renglón amplio. En pantallas menores, menú dialog y pestañas con desplazamiento propio. |
| Tipografía | DM Sans ya incluida: títulos de trabajo 30–46 px, peso 450; bienvenida 40–76 px. Manrope se conserva para componentes existentes. No se añade descarga de fuentes. |
| Superficies | Marfil compartido, divisiones finas, documentos en filas, revisión en tabla y datos en listas. El home conserva selector compacto y accesos. Los diálogos mantienen su superficie diferenciada. |
| Bienvenida | Dibujo SVG original con tres planos: datos, documentos y seguimiento. Su apariencia conceptual no es evidencia de validación ni título oficial. Formulario sin tarjeta flotante. |
| Movimiento | Texto 800 ms con retardo corto; planos 1300 ms con retardos 100/240/380; trazado 1300 ms + 400. Última animación termina a 1.7 s. Sin bucles, parallax, sonido o bloqueo del formulario. Botón Repetir; reduced-motion estático. |
| Trabajo | Entrada de opacidad de 300 ms; contenido disponible desde el montaje. No animar estados o avances ficticios. |
| Textos | Login: Accede a tu cuenta. Resumen: Mi titulación. Documentos: Documentos para revisión. Historial: Movimientos del trámite. La descripción cambia por vista, estado y área. |

Los números de la ilustración y la preparación representan pasos de interfaz, no los once estados del dominio. Adjuntar sigue sin equivaler a enviar; recibir sigue sin equivaler a validar. Los estados, roles y reglas de FastAPI no cambian.

## Animaciones gratuitas: opciones estudiadas

| Opción | Qué aporta / condiciones verificadas | Decisión |
| --- | --- | --- |
| CSS + SVG | Animaciones locales sin cuenta, API remota ni cuota. La [Web Animations API del navegador](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) sería otra opción para secuencias con controles complejos. | CSS y SVG cubren este storyboard. Es lo implementado; cero dependencias nuevas. |
| [Motion](https://motion.dev/docs/quick-start) | Motor JS/React; núcleo bajo [MIT](https://github.com/motiondivision/motion/blob/main/LICENSE.md). Motion+ y ciertos ejemplos/herramientas se ofrecen aparte. Su [guía de accesibilidad](https://motion.dev/docs/react-accessibility) explica reducedMotion y reemplazo de transformaciones. | Alternativa si aparecen transiciones de layout o interacción compleja. No instalado en esta revisión. |
| [Rombo / tailwindcss-motion](https://rombo.co/tailwind/) | Biblioteca de clases/presets, declarada open source MIT por su sitio. Requiere integración con Tailwind. | Referencia para entradas escalonadas; no introducir Tailwind solo para estos efectos. |
| [Anime.js](https://animejs.com/documentation/) | Timelines, SVG y WAAPI; [licencia MIT](https://github.com/juliangarnier/anime/blob/master/LICENSE.md). | Alternativa para storyboard con sincronización más compleja; no instalado. |
| [LottieFiles](https://lottiefiles.com/page/license) | Su Simple License permite determinados usos de archivos públicos bajo sus condiciones. No equivale a gratuidad de todo el catálogo, editor o plan; cada recurso debe revisarse. | No descargar un paquete genérico ni depender de un CDN. Si se adopta un recurso, guardar archivo, procedencia y licencia tras revisarlos. |

Una API remota no es necesaria para una animación de entrada. Bibliotecas de animación y catálogos de ilustraciones son cosas diferentes. La implementación elegida se sirve con el propio frontend; no transmite expedientes a un proveedor de efectos.

La preferencia de movimiento se observa con el hook compartido useReducedMotion. Si el dispositivo pide reducirlo, se muestra “Movimiento reducido” en lugar de un control Repetir sin efecto. CSS también deshabilita las animaciones: el hook informa y la media query gobierna su representación.

## Contrato editorial para los equipos

Nombrar la entidad o acción concreta; eliminar saludos y eslóganes repetidos dentro del trabajo. Una descripción debe decir qué se puede hacer en esa vista. Adaptarla al rol y al estado. No prometer aprobación automática, plazos, integración bancaria, emisión SEP o asignación de expedientes que no existen. Evitar diminutivos, inglés de plantilla y títulos como “Dashboard”, “Overview” o “Bienvenido a tu experiencia”.

Antes de integrar una vista, comprobar: contexto por migas, acción principal visible, origen real del estado, permisos preservados, recuperación de errores, lectura a 320 px y teclado. La semejanza visual con una referencia no certifica usabilidad. La aceptación final requiere revisión del líder y usuarios institucionales.
