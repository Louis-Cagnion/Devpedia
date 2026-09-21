---
order: 14
---

# SSR vs CSR: ¿dónde se construye el HTML?

El [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) de una página puede construirse en dos lugares fundamentalmente distintos: en el **servidor**, antes de enviar la respuesta ([SSR](https://developer.mozilla.org/es/docs/Glossary/SSR), *Server-Side Rendering*), o en el **navegador**, mediante JavaScript ejecutado tras recibir una página mínima ([CSR](https://developer.mozilla.org/es/docs/Glossary/CSR), *Client-Side Rendering*). La elección cambia radicalmente lo que el navegador recibe primero, y lo que un motor de búsqueda ve al visitar la página.

## CSR: el servidor envía una cáscara vacía

Con el CSR, típico de una aplicación de una sola página (SPA), el servidor responde con un [HTML](/?c=infrastructure&p=api-et-http) prácticamente vacío y un script de JavaScript voluminoso; es ese script, una vez descargado y ejecutado, el que construye todo el contenido de la página en el [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements):

```text
Servidor -> <html><body><div id="app"></div><script src="app.js"></script></body></html>

Navegador:
1. Recibe el HTML casi vacio -> nada se muestra
2. Descarga y ejecuta app.js
3. app.js construye el contenido en el DOM, a menudo tras llamar a una API
4. La pagina se vuelve visible e interactiva
```

El contenido real solo aparece después de la descarga **y** la ejecución del JavaScript, un retraso que depende directamente del tamaño del script y de la potencia del dispositivo que lo ejecuta.

## SSR: el servidor ya envía el HTML relleno

Con el SSR, el servidor ejecuta él mismo el código de renderizado en cada petición (o al construir el sitio, según la implementación), y devuelve un [HTML](/?c=infrastructure&p=api-et-http) ya relleno de contenido:

```text
Servidor -> ejecuta el renderizado -> <html><body><h1>Bienvenida Alicia</h1>...</body></html>

Navegador:
1. Recibe un HTML ya completo -> visualizacion inmediata del contenido
2. Descarga y ejecuta el JavaScript restante (hidratacion, ver mas abajo)
3. La pagina se vuelve interactiva
```

El contenido se muestra desde la recepción de la respuesta, incluso antes de que el JavaScript termine de cargarse.

## Comparación

| | CSR | SSR |
|---|---|---|
| Primera visualización del contenido | Tras descarga + ejecución del JS | Inmediata, en el HTML recibido |
| Carga en el servidor | Baja (sirve archivos estáticos + una API) | Más alta (ejecuta el renderizado en cada petición, o al construir) |
| Posicionamiento (SEO) | Un rastreador que no ejecuta JS solo ve una página vacía | El contenido está directamente presente en el HTML recibido |
| Interactividad tras cargar | Idéntica | Idéntica, tras la hidratación |

## La hidratación: reconectar el JavaScript a un HTML ya presente

Tras un renderizado SSR, la página mostrada aún es solo [HTML](/?c=infrastructure&p=api-et-http) estático: todavía no hay ningún manejador de eventos adjunto. La **hidratación** es el paso en el que el JavaScript se ejecuta para reconectar ese HTML existente a los [eventos](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements) que lo hacen interactivo, sin reconstruir el contenido ya mostrado.

> **Trampa:** un renderizado SSR que produce un HTML ligeramente distinto del que el JavaScript produciría al reconstruirlo él mismo (una fecha formateada de forma diferente según la zona horaria del servidor, un dato que cambió entre el renderizado del servidor y la hidratación del lado del cliente). El framework detecta la discrepancia y puede ignorarla silenciosamente, o descartar todo el renderizado del servidor para reconstruir la página por completo del lado del cliente, perdiendo la mayor parte del beneficio del SSR.
>
> **Buena práctica:** asegurarse de que el renderizado produzca exactamente el mismo resultado en el servidor y en el cliente, a partir de los mismos datos; inyectar explícitamente en la página los datos usados para el renderizado del servidor, para que el JavaScript de hidratación los reutilice tal cual en lugar de recalcularlos de forma distinta.

## Dónde se transmiten concretamente esos datos: `__NEXT_DATA__`

La buena práctica anterior ("transmitir explícitamente esos datos al cliente en lugar de recalcularlos") toma una forma concreta en Next.js: los datos usados para el renderizado del servidor se serializan en JSON y se inyectan directamente en la página, en una etiqueta dedicada:

```html
<script id="__NEXT_DATA__" type="application/json">
  {"props": {"pageProps": {"titulo": "Bienvenida Alicia", "notas": [15, 12, 18]}}}
</script>
```

El JavaScript de hidratación lee ese JSON al arrancar en lugar de recalcular los mismos datos de otra forma (una nueva llamada a la API, un nuevo cálculo): esto es lo que garantiza que el renderizado del cliente obtenga exactamente el mismo resultado que el del servidor, sin la trampa descrita más arriba.

Esta etiqueta sigue siendo legible por cualquiera, no solo por el JavaScript de la propia página:

```javascript
JSON.parse(document.getElementById("__NEXT_DATA__").textContent)
```

Un script de terceros (una herramienta de extracción de datos, por ejemplo) puede así recuperar directamente los datos estructurados de la página sin tener que analizar el HTML renderizado: mucho más estable, ya que la forma de los datos cambia con mucha menos frecuencia que la apariencia visual de la página.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El CSR construye el contenido en el navegador tras ejecutar el JavaScript (primera visualización retrasada, baja carga en el servidor); el SSR construye el HTML del lado del servidor antes del envío (visualización inmediata, mejor posicionamiento, mayor carga en el servidor). La hidratación reconecta el JavaScript a un HTML SSR ya mostrado, sin reconstruirlo. Next.js transmite los datos del renderizado del servidor al cliente mediante una etiqueta JSON dedicada (`__NEXT_DATA__`). |
| **Herramientas utilizables** | Los frameworks con renderizado SSR integrado (Next.js, Nuxt y equivalentes) para combinar visualización inmediata e interactividad una vez hidratado; `__NEXT_DATA__` para leer directamente los datos estructurados de una página Next.js. |
| **Trampas a evitar** | Un renderizado del servidor que produce un resultado distinto al del cliente durante la hidratación, forzando una reconstrucción completa del lado del cliente. |
| **Buenas prácticas** | Garantizar un renderizado idéntico entre servidor y cliente a partir de los mismos datos; transmitir explícitamente esos datos al cliente en lugar de recalcularlos durante la hidratación. |
