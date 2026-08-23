---
order: 7
---

# Internacionalización (i18n) y RTL: diseñar más allá de un solo idioma

**i18n** (*internationalization*, 18 letras entre la i y la n) designa el hecho de diseñar un producto para que **pueda** adaptarse a otros idiomas y regiones sin rediseñarlo; **l10n** (*localization*) designa el trabajo concreto de adaptación a un idioma y una región precisos (traducción, formato de fecha, sentido de lectura). La i18n es un requisito previo de diseño, la l10n es su resultado para cada idioma añadido.

## i18n vs l10n: hacerlo posible, y luego hacerlo realidad

| | i18n | l10n |
|---|---|---|
| Momento | Decidido desde el diseño y la arquitectura del producto | Realizado para cada idioma/región objetivo, posiblemente a posteriori |
| Naturaleza | Estructural: ningún texto fijo en el código, formatos adaptables, maquetación que tolera un texto más largo | Concreto: traducción real, formato de fecha local, moneda local |
| Coste si se olvida | Costoso de corregir después (reestructuración del código y de las maquetas) | Costoso pero aislado (añadir un idioma más) |

Un producto pensado con i18n desde el inicio puede añadir un idioma en l10n casi sin tocar el código; un producto que no lo fue debe reestructurarse primero antes de que sea posible una sola traducción adicional.

## La trampa del texto que cambia de longitud

Una traducción casi nunca ocupa el mismo espacio que el texto original: una palabra inglesa corta puede convertirse en una expresión alemana el doble de larga, un espacio suficiente en español puede no serlo en otro idioma.

> **Trampa:** diseñar una maqueta con contenedores de tamaño fijo, calibrados según la longitud del texto en un solo idioma (a menudo el inglés, el idioma de diseño original). Un texto traducido más largo se desborda, se trunca o rompe la maquetación, y se descubre solo una vez añadida la traducción.
>
> **Buena práctica:** probar la maquetación con un texto artificialmente alargado desde el diseño (una técnica llamada *pseudo-localización*), en lugar de esperar a una traducción real para descubrir el problema; prever contenedores que se adapten al contenido en lugar de un ancho fijo.

## RTL: mucho más que un sentido de lectura invertido

Un idioma **RTL** (*right-to-left*, como el árabe o el hebreo) no se limita a invertir el sentido de lectura del texto: **invierte toda la maquetación**, como si toda la interfaz se reflejara en un espejo.

| Elemento | En LTR (izquierda a derecha) | En RTL (derecha a izquierda) |
|---|---|---|
| Alineación del texto | A la izquierda | A la derecha |
| Icono "atrás" | Flecha hacia la izquierda | Flecha hacia la derecha |
| Orden de la navegación principal | De izquierda a derecha | De derecha a izquierda |
| Barra de progreso | Se rellena hacia la derecha | Se rellena hacia la izquierda |

> **Trampa:** traducir solo el texto y dejar la maquetación idéntica (iconos de navegación, alineación, orden de los elementos). El resultado mezcla un texto que se lee de derecha a izquierda con una interfaz siempre pensada de izquierda a derecha, incoherente y confuso para un usuario RTL.
>
> **Buena práctica:** usar propiedades [CSS](/?c=langages&s=css&p=css) "lógicas" (`margin-inline-start` en lugar de `margin-left`, por ejemplo) que se invierten automáticamente según el sentido de la página, en lugar de propiedades físicas fijas que habría que duplicar manualmente para cada sentido.

Algunos iconos deliberadamente **nunca** se invierten, ni siquiera en RTL: los que representan un objeto del mundo real cuya orientación tiene un sentido universal (un reloj, un símbolo de reproducción ▶ en muchas convenciones) permanecen idénticos, mientras que los iconos puramente direccionales (flechas, chevrones de navegación) sí se invierten.

## Nunca fijar un texto en el código

Un texto escrito directamente en el código (`<button>Confirmar</button>`) solo puede traducirse modificando el propio código, idioma por idioma. La técnica estándar en i18n externaliza cada texto en un archivo de traducción, referenciado por una **clave** en lugar de por su valor:

```json
// es.json
{ "boton_confirmar": "Confirmar" }

// en.json
{ "boton_confirmar": "Confirm" }
```

```javascript
<button>{traducir("boton_confirmar")}</button>
```

Añadir un idioma se convierte entonces en añadir un archivo de claves traducidas, sin tocar el código que las muestra.

## Formatos sensibles a la configuración regional: fechas, números, monedas

Más allá del texto, varios formatos cambian según la región, independientemente del idioma en sí:

| Dato | Ejemplo España (es-ES) | Ejemplo Estados Unidos (en-US) |
|---|---|---|
| Fecha | 20/08/2026 | 08/20/2026 |
| Número decimal | 1.234,56 | 1,234.56 |
| Moneda | 1.234,56 € | $1,234.56 |

> **Trampa:** formatear uno mismo una fecha o un número con una lógica escrita a mano (concatenación de cadenas), válida solo para el formato de una sola región. Un usuario de otra región lee entonces una fecha ambigua o mal formada (`08/20/2026` leído como el día 8 del mes 20 por un lector acostumbrado al formato día/mes).
>
> **Buena práctica:** usar las funciones de formateo sensibles a la configuración regional ya proporcionadas por el lenguaje o la plataforma en lugar de un formateo escrito a mano, para que la fecha, el número o la moneda se muestren automáticamente según la convención esperada por cada región.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La i18n (hacer un producto adaptable) precede a la l10n (adaptarlo concretamente a un idioma). Un texto traducido cambia de longitud, lo que rompe una maquetación de tamaño fijo. El RTL invierte toda la maquetación, no solo el sentido del texto. Todo texto debe externalizarse en un archivo de traducción, nunca fijarse en el código. |
| **Herramientas utilizables** | La pseudo-localización para probar una maquetación con un texto alargado. Las propiedades CSS lógicas (`margin-inline-start`...) para un layout que se invierte automáticamente en RTL. Las funciones de formateo sensibles a la configuración regional para fechas, números y monedas. |
| **Trampas a evitar** | Una maquetación de tamaño fijo calibrada para un solo idioma. Traducir solo el texto sin invertir la maquetación en RTL. Fijar un texto en el código en lugar de en un archivo de traducción. Formatear una fecha o un número a mano en lugar de con las funciones sensibles a la configuración regional. |
| **Buenas prácticas** | Probar con un texto artificialmente alargado desde el diseño. Usar propiedades CSS lógicas para la maquetación. Externalizar todo texto en un archivo de traducción referenciado por clave. Usar las funciones de formateo nativas sensibles a la configuración regional. |
