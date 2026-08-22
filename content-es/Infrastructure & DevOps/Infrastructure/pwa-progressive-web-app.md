---
order: 8
---

# La PWA: un sitio web que se comporta como una aplicación

Una **PWA** (*Progressive Web App*) es un sitio web clásico al que dos mecanismos añaden capacidades hasta ahora reservadas a las aplicaciones nativas: seguir funcionando sin conexión a internet, e instalarse en el dispositivo como una aplicación de verdad, sin pasar por una tienda de aplicaciones.

## El service worker: un script que corre entre el sitio y la red

Un **service worker** es un script de JavaScript que el navegador ejecuta en segundo plano, por separado de la propia página, capaz de interceptar cada petición de red que el sitio emite antes de que llegue realmente a internet:

```text
Sin service worker:                Con service worker:

Pagina -> peticion -> red          Pagina -> peticion -> service worker
                                                            |
                                                en cache? --+-- si -> respuesta inmediata, sin red
                                                            |
                                                            +-- no -> red, luego se guarda en cache
```

Esta posición de intermediario permite servir un recurso ya guardado en caché incluso cuando la red no está disponible, algo que un sitio clásico no puede hacer: sin una petición de red exitosa, simplemente no tiene nada que mostrar.

> **Trampa:** confundir el service worker con el hilo principal de la página. Un service worker se ejecuta en su propio contexto, sin acceso directo al DOM; se comunica con la página mediante mensajes, no manipulando sus elementos directamente.
>
> **Buena práctica:** mantener el service worker centrado en la intercepción de red y la caché; toda la lógica que afecta a la visualización se queda en el propio código de la página.

## Estrategias de caché: qué servir, y cuándo comprobar la red

| Estrategia | Principio | Adecuada para |
|---|---|---|
| **Caché primero** (*cache-first*) | Sirve la versión en caché si existe, solo va a la red si no hay nada en caché | Recursos que cambian raramente (logo, fuente, CSS versionado) |
| **Red primero** (*network-first*) | Intenta la red primero, solo recurre a la caché si falla | Contenido que debe mantenerse al día mientras la red responda |
| **Caducado durante la actualización** (*stale-while-revalidate*) | Sirve inmediatamente la versión en caché, mientras la refresca en segundo plano para la próxima visita | Contenido que tolera una ligera caducidad, ya visto en [bases de datos de alto tráfico](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) para el mismo compromiso del lado del servidor |

Ninguna de estas estrategias es universalmente la correcta: la elección depende de la frecuencia real de cambio de cada recurso, no de una preferencia única aplicada a todo el sitio.

## El manifest: lo que hace que un sitio sea instalable

Un archivo **manifest** (`manifest.json`), enlazado desde la página HTML, declara la información que un navegador o sistema operativo usa para ofrecer instalar el sitio como una aplicación: su nombre, un icono en varios tamaños, un color de tema, y un modo de visualización (`standalone` oculta la barra de direcciones del navegador, para parecerse a una aplicación nativa).

```json
{
  "name": "Mi aplicación",
  "short_name": "MiApp",
  "icons": [{ "src": "icono-512.png", "sizes": "512x512", "type": "image/png" }],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b"
}
```

Sin un manifest válido (iconos presentes, `start_url` correcta), el navegador nunca ofrece la instalación, aunque ya funcione un service worker.

## Lo que la PWA no sustituye

Una PWA sigue siendo un sitio web: no tiene acceso a la totalidad de las API que puede usar una aplicación nativa (algunos sensores, una integración profunda con el sistema), y su instalación depende del navegador y el sistema operativo del usuario en lugar de una tienda centralizada. Es adecuada para ampliar un sitio existente, no para todo lo que ya exigiría una aplicación nativa hoy.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una PWA añade a un sitio web el funcionamiento sin conexión (service worker que intercepta las peticiones de red, caché) y la instalabilidad (manifest que declara nombre, iconos, modo de visualización). La elección de la estrategia de caché depende de la frecuencia real de cambio de cada recurso. |
| **Herramientas utilizables** | Un service worker para interceptar peticiones y servir desde la caché; un `manifest.json` para hacer el sitio instalable. |
| **Trampas a evitar** | Confundir el service worker con el hilo principal de la página (sin acceso directo al DOM). Un manifest incompleto que impide la instalación sin error visible. |
| **Buenas prácticas** | Elegir la estrategia de caché por recurso en lugar de una elección única para todo el sitio. Mantener el service worker centrado en la red y la caché. |
