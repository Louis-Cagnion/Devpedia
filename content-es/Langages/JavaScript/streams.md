---
order: 20
---

# Los streams: procesar un flujo de datos sin cargarlo todo en memoria

Hasta ahora, cada dato manipulado ([un texto](/?c=langages-de-programmation&s=javascript&p=strings), un array, la respuesta de un [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone)) se ha tratado como un bloque entero, disponible de una sola vez. Un **stream** (flujo) trata en cambio un dato **trozo a trozo** (*chunk* a *chunk*), a medida que llega, sin tener nunca que cargarlo entero en memoria.

## Por qué no simplemente cargarlo todo en memoria

| | Cargar todo en memoria | Procesar en stream |
|---|---|---|
| Principio | Esperar el dato completo antes de tocarlo | Procesar cada trozo en cuanto llega |
| Memoria utilizada | Proporcional al tamaño total del dato | Proporcional al tamaño de un solo trozo |
| Primer resultado visible | Solo una vez recibido todo | Desde el primer trozo |
| Ejemplo típico | Un pequeño archivo de configuración (unos KB) | Un vídeo, un archivo voluminoso, una respuesta HTTP larga |

> **Trampa:** cargar un contenido potencialmente voluminoso entero en memoria "para simplificar" (ej. `await respuesta.arrayBuffer()` en un archivo de varios gigabytes) cuando solo está transitando hacia otro destino (otro archivo, otra respuesta HTTP). El programa retiene entonces todo el contenido en memoria a la vez, aunque nunca lo necesite entero al mismo tiempo.
>
> **Buena práctica:** en cuanto un dato solo transita (se retransmite, se copia, se envía a otro sitio) sin ser analizado en su totalidad, procesarlo en stream en lugar de cargarlo entero.

## Dos implementaciones distintas, coexistiendo en el ecosistema JavaScript

El concepto de stream existe desde hace mucho tiempo en el lado del servidor (Node.js), y se añadió más tarde en el lado del navegador (los "Web Streams", un estándar de la Web). Ambos comparten la misma idea pero usan una API diferente:

| | Node.js Streams | Web Streams |
|---|---|---|
| Origen | Específico de Node.js, desde sus inicios | Estándar del navegador, también disponible en Node.js reciente |
| Tipo principal | `stream.Readable` / `stream.Writable` | `ReadableStream` / `WritableStream` |
| Dónde se encuentran | Lectura de archivo ([`fs.createReadStream()`](https://nodejs.org/api/fs.html)), respuesta HTTP Express (`res`) | Cuerpo de una respuesta [`fetch()`](/?c=langages-de-programmation&s=javascript&p=asynchrone) (`response.body`) |
| Estilo de API | Eventos (`on("data", ...)`) o `.pipe()` | Un "lector" obtenido mediante `.getReader()`, consumido con `await` |

## Hacer que los dos se comuniquen: un adaptador manual

Un mismo programa puede necesitar ambos a la vez: por ejemplo, retransmitir el cuerpo de una respuesta `fetch()` (un `ReadableStream`, estándar Web) hacia una respuesta HTTP Express (`res`, que espera un flujo Node.js clásico). No existe ninguna conversión automática entre los dos: hay que leer el `ReadableStream` manualmente y reemitir cada trozo en un `Readable` de Node.js.

```js
import { Readable } from "node:stream";

async function retransmitirARespuestaExpress(respuestaFetch, res) {
    const lector = respuestaFetch.body.getReader();  // "lector" del ReadableStream (Web)

    const flujo = new Readable({
        // llamada cada vez que .pipe() necesita un trozo más
        async read() {
            const { done, value } = await lector.read();
            if (done) {
                this.push(null);   // señala el fin del flujo Node.js
            } else {
                this.push(value);  // retransmite el trozo, sin almacenarlo nunca entero
            }
        },
    });

    flujo.pipe(res);  // conecta el flujo Node.js adaptado a la respuesta Express
}
```

> **Trampa:** olvidar que `read()` de un `ReadableStream` es asíncrono (`await`): llamar a `lector.read()` sin esperarlo devolvería una Promise sin resolver en lugar del trozo de dato real.
>
> **Buena práctica:** mantener este adaptador genérico (solo copia trozos de un formato a otro, sin leer nunca su contenido) para reutilizarlo en cualquier sitio donde un `ReadableStream` deba alimentar una API que espera un flujo Node.js.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un stream procesa un dato trozo a trozo en lugar de en un solo bloque, sin tener nunca que cargarlo entero en memoria. Dos implementaciones coexisten en JavaScript: los Node.js Streams (históricos, del lado del servidor) y los Web Streams (estándar del navegador, también usados por `fetch()`). |
| **Herramientas utilizables** | `stream.Readable`/`Writable` y `.pipe()` del lado de Node.js; `ReadableStream`/`getReader()` del lado Web/`fetch()`. |
| **Trampas a evitar** | Cargar un contenido voluminoso entero en memoria cuando solo está transitando. Llamar a `read()` de un `ReadableStream` sin esperarlo. |
| **Buenas prácticas** | Procesar en stream todo dato que solo transite. Escribir un adaptador genérico y reutilizable entre las dos implementaciones en lugar de un caso por caso. |
