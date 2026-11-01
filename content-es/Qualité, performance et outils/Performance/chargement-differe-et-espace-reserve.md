---
order: 13
---

# Carga diferida y marcador de posición (31/10/2026)

Una **página web** es un documento que el **navegador** (el programa que muestra las páginas) recibe de un **servidor** (un ordenador que responde a las peticiones del navegador) y muestra; el intercambio se describe en [petición y respuesta HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Rara vez es de una sola pieza: se compone de **bloques**, trozos autónomos (un menú, un artículo, un carrito, un mensaje « Hola Juan »). La mayoría son idénticos para todos los visitantes; algunos son **lentos** de calcular o **propios de la persona** que mira. Este capítulo explica cómo mostrar enseguida lo que ya está listo, sin esperar a esos bloques, y colocarlos en cuanto estén calculados.

Se apoya en estos intercambios y en la idea de [no recalcular lo que no ha cambiado](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant). Los ejemplos ejecutados usan [Node.js](https://nodejs.org/api/http.html), lanzado desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Un sistema de gestión de contenidos, [Drupal](https://www.drupal.org/) (un programa escrito en [PHP](/?c=langages&s=php&p=php) que permite construir y administrar un sitio web), sirve de ejemplo al final del capítulo: es solo una ilustración, la idea vale para cualquier sitio. El caché compartido que evita recalcular los bloques idénticos se detalla en [Metadatos de caché e invalidación](/?c=qualite-performance-et-outils&s=performance&p=metadonnees-de-cache-et-invalidation), y la reserva de espacio de una imagen en [Redimensionar imágenes y servir WebP](/?c=qualite-performance-et-outils&s=performance&p=redimensionner-des-images-et-servir-du-webp).

| Sección | Pregunta que responde |
|---|---|
| [El problema](#el-problema-un-solo-bloque-lento-bloquea-toda-la-pagina) | Por qué un bloque lento o personal perjudica a toda la página |
| [La idea](#la-idea-un-marcador-de-posicion-que-se-rellena-mas-tarde) | Mostrar primero, rellenar después |
| [Tres formas de entregar](#tres-formas-de-entregar-el-bloque-diferido) | Síncrona, en flujo o mediante una segunda petición |
| [La experiencia](#la-experiencia-un-pequeno-servidor-que-mide) | Medir la ganancia con un servidor real |
| [El desplazamiento](#la-trampa-del-desplazamiento-de-diseno) | Reservar el tamaño del espacio |
| [La accesibilidad](#la-accesibilidad-anunciar-lo-que-llega) | Anunciar el contenido que llega |
| [El bloque como plugin](#el-bloque-como-plugin) | Dónde guardar el código de un bloque |
| [Un ejemplo en Drupal](#un-ejemplo-en-drupal-lazy-builder-y-bigpipe) | El mecanismo en un programa real |

## El problema: un solo bloque lento bloquea toda la página

Pensemos en una tienda en línea. Su página de inicio está formada por cuatro bloques:

```
+-------------------------------------------------+
|  Menú                  (idéntico para todos)    |
+-------------------------------------------------+
|  Artículos destacados  (idéntico para todos)    |
+-------------------------------------------------+
|  Hola Juan, 3 artículos en el carrito           |   <- propio de Juan, lento
+-------------------------------------------------+
|  Pie de página         (idéntico para todos)    |
+-------------------------------------------------+
```

| Bloque | ¿Mismo contenido para todos? | Coste de cálculo | ¿Se puede guardar en caché? |
|---|---|---|---|
| Menú | Sí | Bajo | Sí |
| Artículos destacados | Sí | Medio (consultas a la [base de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) | Sí |
| Carrito y « Hola Juan » | No, depende del visitante | Alto (base de datos, cuenta conectada) | Solo para Juan |
| Pie de página | Sí | Bajo | Sí |

Una **caché** es una copia de un resultado ya calculado, guardada para reutilizarla sin rehacer el cálculo (ver [evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). Una copia solo es reutilizable si el resultado es el mismo para quien la pide. Una caché **compartida** (por ejemplo la de una [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), una red de servidores que guarda copias cerca de los visitantes) sirve la misma copia a todo el mundo.

Un solo bloque personal basta para estropear toda la página:

| Decisión del desarrollador | Consecuencia |
|---|---|
| Página entera en caché compartida | María vería « Hola Juan »: error grave (fuga de datos personales) |
| Página entera sin caché | Cada visita recalcula también el menú y los artículos, que no han cambiado |
| Una copia de la página por visitante | Tantas copias como visitantes, casi nunca reutilizadas: la caché no sirve de nada |
| Página en espera del bloque lento | El visitante mira una página en blanco durante todo el cálculo del carrito |

El último caso es el más visible: el tiempo hasta que el visitante ve algo es igual al tiempo del bloque **más lento**, aunque los demás estuvieran listos desde hacía mucho.

## La idea: un marcador de posición que se rellena más tarde

Un **marcador de posición** (en inglés *placeholder*) es un espacio vacío, o relleno con un texto provisional, que se deja en lugar de un bloque que aún no está calculado. El servidor procede en dos tiempos:

1. Envía enseguida la página, con el marcador de posición en lugar del bloque lento.
2. Calcula el bloque y luego lo hace llegar para reemplazar el marcador de posición.

La **carga diferida** (en inglés *lazy loading*) es ese aplazamiento del cálculo de un bloque: se hace **después** del envío del resto, no antes. No lo confunda con el atributo `loading="lazy"` de las imágenes, que solo retrasa la descarga de una imagen mientras no es visible (ver [los enlaces e imágenes](/?c=langages&s=html&p=liens-et-images)): aquí es el **cálculo de un bloque por el servidor** lo que se aplaza.

```
Sin diferir (síncrono)
  tiempo ->  0 ms                                  800 ms
            |------ cálculo del carrito -------------|
                                                    | envío de la página entera
            página en blanco durante 800 ms ------------>  todo aparece de golpe

Con diferido
  tiempo ->  0 ms   1 ms                           800 ms
            |      | envío de la página + marcador de posición
            |      | el visitante ya lee el menú y los artículos
            |------ cálculo del carrito -------------|
                                                    | el carrito reemplaza el espacio
```

Esta separación tiene una segunda consecuencia, aún más importante para la caché: la página « esqueleto » (menú, artículos, marcador de posición) es **la misma para todo el mundo**, así que puede guardarse en caché. La parte personal se calcula aparte, para cada visitante, y solo ella necesita rehacerse.

| Parte | Contenido | ¿Cacheable? | Quién la calcula |
|---|---|---|---|
| Esqueleto | Menú, artículos, marcador de posición | Sí, para todos | Una vez, luego copia |
| Fragmento | « Hola Juan, 3 artículos » | No (o por visitante) | En cada visita, solo sobre el bloque afectado |

## Tres formas de entregar el bloque diferido

El fragmento puede llegar de tres maneras. Se diferencian por el momento en que empieza el cálculo y por el número de peticiones HTTP.

| | Síncrona (sin diferir) | Diferida en flujo | Diferida mediante una segunda petición |
|---|---|---|---|
| Principio | Todo se calcula, luego todo se envía | Página y marcador de posición enviados, fragmento enviado más tarde **en la misma respuesta** | Página y marcador de posición enviados, el navegador vuelve a pedir el fragmento con **otra petición** |
| Número de peticiones | 1 | 1 | 2 |
| Inicio del cálculo lento | Antes del envío | Mientras el navegador muestra el resto | Solo cuando llega la segunda petición |
| Primera visualización | Tras todo el cálculo | Inmediata | Inmediata |
| Fragmento completo visible | Al final del cálculo | Al final del cálculo | Al final del cálculo, más una ida y vuelta de red |
| ¿Esqueleto cacheable en HTTP? | No | No (la respuesta contiene el fragmento personal) | Sí, los octetos son idénticos para todos |
| ¿Hace falta JavaScript? | No | Sí, para colocar el fragmento | Sí, para pedir y colocar el fragmento |
| Ajuste de red delicado | Ninguno | Un intermediario que guarda la respuesta en memoria (búfer) hasta el final anula la ganancia | Una petición más que gestionar |

El **flujo** (en inglés *streaming*) consiste en enviar una respuesta HTTP **por trozos**, sin esperar a que termine: las cabeceras y el primer trozo salen enseguida, los siguientes salen cuando están listos. Las **cabeceras** son líneas de información enviadas antes del contenido de la respuesta (tipo de contenido, fecha...). HTTP sabe hacer este flujo con la cabecera `Transfer-Encoding: chunked` (« transferencia por trozos »): el tamaño total no se anuncia de antemano. Un caso cercano, en un script PHP, se describe en [el streaming HTTP progresivo](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant#streaming-http-progresivo-cuando-el-calculo-es-inevitable); aquí sirve para otro fin: entregar en dos tiempos una página de la que una parte es lenta.

En el flujo, el esqueleto no es cacheable **a nivel de HTTP** (la respuesta completa contiene el fragmento personal), pero la aplicación puede guardar el esqueleto en caché **dentro de sí misma** (en memoria, del lado del servidor) y calcular solo el fragmento. Con la segunda petición, la primera respuesta es idéntica para todos: una caché compartida puede guardarla tal cual.

## La experiencia: un pequeño servidor que mide

Nada vale tanto como una medición. Este servidor Node.js (el motor que ejecuta JavaScript fuera del navegador, ver [el servidor local de desarrollo](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)) ofrece los tres modos en tres direcciones: `/sincrono`, `/flujo` y `/peticion`. El « cálculo lento » se simula con una pausa de 800 milisegundos. Guarde el código siguiente en un archivo llamado `servidor-diferido.mjs` (la extensión `.mjs` indica a Node que el archivo usa `import`), en una carpeta de su elección.

Algunas notaciones del código, definidas aquí antes de leerlo:

| Notación | Significado | Para profundizar |
|---|---|---|
| `async` y `await` | Esperar un resultado sin bloquear el programa | [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone) |
| `new Promise(...)` | Una promesa: un valor que todavía no está, pero que llegará más tarde | [las promesas](/?c=langages&s=javascript&p=asynchrone) |
| `(x) => ...` | Función flecha, una función escrita de forma abreviada | [las funciones](/?c=langages&s=javascript&p=fonctions) |
| `/.../` | Expresión regular, un patrón de texto que buscar | [las expresiones regulares](/?c=langages&s=javascript&p=regex) |
| `process.env.PORT` | Valor de la variable de entorno `PORT`, fijada al arrancar | [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement) |
| `?.` y `??` | Si el dato falta, no hacer nada (`?.`) o tomar un valor de reserva (`??`) | [las condiciones](/?c=langages&s=javascript&p=conditions) |
| `` `...${x}...` `` | Texto en el que `${x}` se sustituye por el valor de `x` | [las cadenas de caracteres](/?c=langages&s=javascript&p=strings) |

En el código, `req` es la solicitud recibida (`req.url` es la dirección pedida) y `res` la respuesta que hay que enviar. El HTML utilizado se describe en [la estructura de un documento](/?c=langages&s=html&p=structure-dun-document): `<div>` es un bloque de página, `id` su nombre, `style` los ajustes de apariencia.

```js
import { createServer } from 'node:http';         // módulo HTTP incluido en Node

const PORT = Number(process.env.PORT);            // puerto de escucha, convertido en número
const RETARDO_MS = 800;                           // duración del cálculo lento simulado
// charset=utf-8: codificación de caracteres, que permite escribir las tildes
const TIPO = { 'content-type': 'text/html; charset=utf-8' }; // la respuesta es HTML
const ESPERA = 'Cargando el carrito…';            // texto provisional del espacio

// Pausa de `ms` milisegundos: una promesa que termina tras ese retardo
// (setTimeout llama a la función `fin` una vez transcurrido el retardo)
const esperar = (ms) => new Promise((fin) => setTimeout(fin, ms));
// Sustituye < > & " ' por su código HTML (&#60; para <), para que el navegador
// nunca tome un nombre por HTML (charCodeAt(0): número del carácter)
const escapar = (t) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

// El bloque lento y propio del usuario: devuelve texto plano, sin HTML
async function calcularCarrito(nombre) {
  await esperar(RETARDO_MS);                      // simula una base de datos lenta
  return `Hola ${nombre}, 3 artículos en el carrito`; // propio de esta persona
}

// Lee el nombre en la cookie « usuario »: `exec` busca el patrón, `[1]` toma
// el texto entre paréntesis; « visitante » si no hay cookie
const nombreDe = (req) =>
  /usuario=([^;]+)/.exec(req.headers.cookie ?? '')?.[1] ?? 'visitante';

const arriba = '<h1>Tienda</h1><p>Contenido idéntico para todos.</p>'; // parte común

// El lugar del bloque lento. min-height:2em reserva una altura de al menos dos veces
// el tamaño del texto; aria-live="polite" hace que los lectores de pantalla lo anuncien
const zona = (contenido) =>
  `<div id="carrito" style="min-height:2em" aria-live="polite">` +
  `${contenido}</div>`;

createServer(async (req, res) => {                // se llama a cada petición recibida
  const nombre = nombreDe(req);                   // quién pide la página
  if (req.url === '/sincrono') {                  // modo 1: todo se calcula antes del envío
    const carrito = await calcularCarrito(nombre); // la página entera espera este cálculo
    // aquí el texto se inserta como HTML: debe escaparse
    res.writeHead(200, TIPO).end(arriba + zona(escapar(carrito))); // envío tras 800 ms
  } else if (req.url === '/flujo') {              // modo 2: marcador, luego flujo
    res.writeHead(200, TIPO);                     // código 200 (OK) y cabeceras, primero
    res.write(arriba + zona(ESPERA));             // 1er trozo: página y espacio reservado
    const carrito = await calcularCarrito(nombre); // el cálculo avanza, la página ya está ahí
    // JSON.stringify pone el texto entre comillas, como un texto JavaScript;
    // \u003c es la escritura JavaScript de < : un </script> del texto no cierra la etiqueta
    const codigo = JSON.stringify(carrito).replace(/</g, '\\u003c');
    // textContent coloca texto puro en el elemento: no hace falta escapar HTML
    res.end(`<script>carrito.textContent = ${codigo}</script>`); // 2º trozo: lo rellena
  } else if (req.url === '/peticion') {           // modo 3: relleno mediante una petición
    const script = "fetch('/fragmento').then((r) => r.text())" + // el navegador pide
      '.then((t) => { carrito.textContent = t; })'; // y lo coloca en el espacio
    res.writeHead(200, TIPO).end(arriba + zona(ESPERA) + `<script>${script}</script>`);
  } else if (req.url === '/fragmento') {          // el bloque lento, servido aparte
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); // texto simple
    res.end(await calcularCarrito(nombre));       // responde tras 800 ms
  } else {                                        // cualquier otra dirección
    res.writeHead(404).end();                     // no encontrada
  }
}).listen(PORT, '127.0.0.1');                     // 127.0.0.1: solo escucha en esta máquina
```

Regla que recordar, aplicada arriba: un texto insertado **como HTML** (`/sincrono`) debe escaparse; un texto colocado con `textContent` (`/flujo`, `/peticion`) no se escapa **nunca**, o el visitante vería los códigos `&#60;` en lugar del carácter.

Los comandos siguientes se escriben en una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) abierta en la carpeta del archivo. Se lanza el servidor y luego se mide con [`curl`](https://curl.se/docs/manpage.html) (un programa que envía una petición HTTP desde la terminal). La opción `-w` muestra duraciones: `time_starttransfer` es el tiempo transcurrido hasta el **primer octeto** recibido, `time_total` el tiempo hasta el final. Notaciones del shell utilizadas:

| Notación | Significado | Para profundizar |
|---|---|---|
| `commande &` | Lanza el comando en segundo plano: la terminal sigue disponible | [los procesos](/?c=langages&s=bash&p=gestion-des-processus) |
| `PORT=7143 commande` | Fija la variable `PORT` solo para este comando | [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement) |
| `timeout 300 commande` | Detiene el comando al cabo de 300 s: el servidor se detiene solo | [`timeout`](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| `for m in a b; do ... done` | Repite para cada valor; `$m` es el valor actual | [los bucles](/?c=langages&s=bash&p=boucles) |
| `\` al final de línea | El comando continúa en la línea siguiente | [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base) |
| `a \| b` | El resultado de `a` pasa a ser la entrada de `b` (una tubería, *pipe*) | [redirecciones y pipes](/?c=langages&s=bash&p=redirections-et-pipes) |
| `grep`, `sed` | Buscar (`grep`) o reemplazar (`sed`) texto | [el procesamiento de texto](/?c=langages&s=bash&p=traitement-de-texte) |

Pasados 300 segundos, `curl` ya no recibe respuesta: vuelva a lanzar el primer comando.

```bash
# Lanza el servidor en el puerto 7143 en segundo plano; « timeout 300 » lo detiene tras 300 s
PORT=7143 timeout 300 node servidor-diferido.mjs &
# Deja un segundo al servidor para empezar a escuchar
sleep 1
# Para cada una de las tres direcciones, envía una petición y muestra los dos tiempos
for m in sincrono flujo peticion; do
  # -s : modo silencioso ; -o /dev/null : descarta el cuerpo ; -w : formato de los tiempos
  curl -s -o /dev/null \
    -w "$m : primer octeto %{time_starttransfer}s, total %{time_total}s\n" \
    "http://127.0.0.1:7143/$m"
done
```

Salida obtenida (los tiempos varían ligeramente de un intento a otro, los órdenes de magnitud no):

```text
sincrono : primer octeto 0.809237s, total 0.809291s
flujo : primer octeto 0.000792s, total 0.803238s
peticion : primer octeto 0.000685s, total 0.000709s
```

| Modo | Primer octeto | Total | Lectura |
|---|---|---|---|
| `/sincrono` | unos 0,8 s | unos 0,8 s | No llega nada antes del final del cálculo |
| `/flujo` | menos de 2 ms | unos 0,8 s | El esqueleto llega casi al instante; el fragmento llega 800 ms después en la misma respuesta |
| `/peticion` | menos de 2 ms | menos de 2 ms | La página está completa enseguida; el fragmento es una segunda petición |

Para la segunda petición, el tiempo que cuenta es el de la dirección `/fragmento`:

```bash
# Mide la segunda petición, la que envía el navegador tras recibir la página
curl -s -o /dev/null -w "fragmento : primer octeto %{time_starttransfer}s\n" \
  http://127.0.0.1:7143/fragmento
```

```text
fragmento : primer octeto 0.802402s
```

Así, el fragmento llega, en los dos modos diferidos, unos 800 ms después de la petición del fragmento: la ganancia no está en calcular más rápido, sino en **mostrar el resto durante ese tiempo**. Para ver llegar los dos trozos de `/flujo` en instantes distintos, se pide a `curl` que registre cada recepción:

```bash
# --trace-ascii - : escribe la traza en la salida ; --trace-time : añade la hora
# grep solo conserva las líneas « Recv data » (datos recibidos), una por trozo
curl -s -o /dev/null --trace-time --trace-ascii - \
  http://127.0.0.1:7143/flujo | grep "Recv data"
```

```text
13:01:42.839034 <= Recv data, 140 bytes (0x8c)
13:01:43.639987 <= Recv data, 83 bytes (0x53)
```

Dos trozos (140 octetos, luego 83), separados unos 0,8 s (801 ms aquí): el primero contiene la página y el marcador de posición, el segundo el pequeño script que lo rellena. Las cabeceras de la respuesta anuncian bien el envío por trozos:

```bash
# -i : muestra las cabeceras de la respuesta antes de su cuerpo
# sed (GNU, el de Linux) parte la línea entre dos etiquetas: >< se vuelve > y luego <
curl -si http://127.0.0.1:7143/flujo | sed 's/></>\n</g'
```

```text
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
Date: Sun, 01 Nov 2026 12:01:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

<h1>Tienda</h1>
<p>Contenido idéntico para todos.</p>
<div id="carrito" style="min-height:2em" aria-live="polite">Cargando el carrito…</div>
<script>carrito.textContent = "Hola visitante, 3 artículos en el carrito"</script>
```

Queda la prueba de que el esqueleto de `/peticion` es el mismo para todos. `md5sum` calcula una huella de un contenido: dos contenidos idénticos dan la misma huella, dos contenidos distintos dan (casi seguro) dos huellas diferentes. La opción `-b` de `curl` envía una cookie.

```bash
# Página de /peticion pedida por Juan, luego por María ; md5sum da la huella de cada página
curl -s -b usuario=Juan http://127.0.0.1:7143/peticion | md5sum
curl -s -b usuario=María http://127.0.0.1:7143/peticion | md5sum
# Misma comparación para la página síncrona, que contiene el carrito
curl -s -b usuario=Juan http://127.0.0.1:7143/sincrono | md5sum
curl -s -b usuario=María http://127.0.0.1:7143/sincrono | md5sum
```

```text
c255b4583ef5cf5fb6448eb77d09cd78  -
c255b4583ef5cf5fb6448eb77d09cd78  -
3c9a3b3aedadf3c0f49d2633c83f2993  -
5dc2694783f8ef317424de6fe3ca301d  -
```

| Página pedida | Juan | María | Conclusión |
|---|---|---|---|
| `/peticion` | `c255b458...` | `c255b458...` | Idéntica: una caché compartida puede servirla a todos |
| `/sincrono` | `3c9a3b3a...` | `5dc26947...` | Distinta: imposible de compartir |

Por último, el fragmento es de verdad propio de cada visitante. `echo` muestra un salto de línea, para que las salidas no se peguen. La cookie trampa `<b>x` contiene una etiqueta HTML; el texto plano del fragmento la conserva tal cual, porque `textContent` nunca la interpreta:

```bash
# Fragmento para Juan
curl -s -b usuario=Juan http://127.0.0.1:7143/fragmento; echo
# Fragmento para una cookie que contiene HTML: texto plano, sin escapar
curl -s -b 'usuario=<b>x' http://127.0.0.1:7143/fragmento; echo
```

```text
Hola Juan, 3 artículos en el carrito
Hola <b>x, 3 artículos en el carrito
```

En la página síncrona, en cambio, el texto se inserta como HTML: ahí es donde `escapar` neutraliza el nombre trampa (fallo descrito en [el XSS](/?c=securite&s=cybersecurite&p=xss-en-detail)). En el modo en flujo, un `</script>` en el nombre se escribe `\u003c/script>` para no cerrar la etiqueta:

```bash
# Página síncrona con la cookie trampa: `<` se convierte en &#60;
curl -s -b 'usuario=<b>x' http://127.0.0.1:7143/sincrono | fold -s -w 90; echo
# Modo flujo, cookie con </script> ; tail -c 120 conserva los últimos 120 caracteres ;
# fold -s -w 90 corta la salida en líneas de 90 caracteres como máximo (solo visualización)
curl -s -b 'usuario=</script>x' http://127.0.0.1:7143/flujo \
  | tail -c 120 | fold -s -w 90; echo
```

```text
<h1>Tienda</h1><p>Contenido idéntico para todos.</p><div id="carrito" 
style="min-height:2em" aria-live="polite">Hola &#60;b&#62;x, 3 artículos en el 
carrito</div>
e">Cargando el carrito…</div><script>carrito.textContent = "Hola \u003c/script>x, 3 
artículos en el carrito"</script>
```

Estas mediciones se refieren a un servidor local, sin red real; con una red de verdad, cada ida y vuelta añade su propia latencia (ver [limitar las idas y vueltas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)). Miden la llegada de los octetos, no la visualización: para ver la página llenarse, abra `http://127.0.0.1:7143/flujo` en un navegador ([el DOM](/?c=langages&s=javascript&p=dom-et-evenements) explica cómo el script modifica la página).

## Por qué se parece a un solapamiento

Mientras el servidor calcula el carrito (800 ms), el navegador no está bloqueado: muestra el esqueleto. Es la aplicación, a escala de una página, de la idea del [solapamiento de latencia](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence): hacer avanzar tareas independientes en lugar de esperar primero a la más lenta. Y es lo contrario del tiempo muerto descrito en [esperar sin perder tiempo](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts): la espera sigue existiendo, pero ya no retrasa nada más.

| Capítulo | Misma idea | Aquí |
|---|---|---|
| [Solapamiento de latencia](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence) | Hacer otra cosa durante una espera | Mostrar el esqueleto mientras se calcula el carrito |
| [Esperar sin perder tiempo](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts) | No bloquear en lo que no está listo | No bloquear toda la página por un bloque |
| [Evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) | No rehacer lo que no ha cambiado | Guardar el esqueleto en caché, recalcular solo el fragmento |

## La trampa del desplazamiento de diseño

Si el marcador de posición está **vacío** o es más pequeño que el contenido final, todo lo que queda debajo es **empujado hacia abajo** en el momento del relleno: el visitante que leía o iba a hacer clic ve moverse el texto ante sus ojos. Se habla de **desplazamiento de diseño** (en inglés *layout shift*). El mismo problema existe con las imágenes, de ahí los atributos `width` y `height` descritos en [los enlaces e imágenes](/?c=langages&s=html&p=liens-et-images).

```html
<!-- Marcador de posición: su altura se fija antes de que llegue el contenido -->
<div id="carrito" style="min-height: 2em">   <!-- al menos 2 veces el tamaño del texto -->
  Cargando el carrito…                      <!-- texto provisional -->
</div>
<!-- El contenido siguiente no se mueve, mientras el carrito quepa en 2em -->
<p>Pie de página</p>
```

| Situación | Efecto | Remedio |
|---|---|---|
| Marcador de posición vacío (altura 0) | Todo el contenido siguiente salta hacia abajo | Reservar una altura mínima |
| Altura reservada demasiado grande | Un gran espacio en blanco inútil, luego un salto hacia arriba | Medir el tamaño medio real del contenido |
| Contenido final de tamaño variable (lista) | Salto según el número de elementos | Reservar el tamaño del caso habitual, o un marco de tamaño fijo con desplazamiento |
| Texto provisional más corto que el final | Una línea de más al rellenar | Escribir el provisional con el mismo ancho y la misma altura |
| Bloque que desaparece cuando está vacío | La página sube | Conservar el lugar, o diferir solo los bloques que siempre están presentes |

La unidad `em` (aquí `2em`: dos veces el tamaño del texto) y las demás unidades de tamaño se explican en [las unidades y funciones de tamaño CSS](/?c=langages&s=css&p=unites-et-fonctions-de-taille), y la manera en que un elemento ocupa espacio en [el modelo de caja](/?c=langages&s=css&p=box-model).

## La accesibilidad: anunciar lo que llega

Un lector de pantalla (un programa que lee la página en voz alta para las personas ciegas o con baja visión) solo lee un lugar a la vez. Un contenido que aparece en otro lugar distinto de donde se lee pasa **desapercibido**. Hay que declarar, pues, el marcador de posición como una **región en vivo** (`aria-live`): una zona cuyos cambios se anuncian sin mover el foco. El mecanismo se detalla en [ARIA dinámico y foco con el teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier).

```html
<!-- aria-live="polite" : anuncia el cambio cuando el lector ha terminado de hablar -->
<div id="carrito" aria-live="polite" style="min-height: 2em">
  Cargando el carrito…
</div>
```

| Punto de atención | Por qué | Práctica |
|---|---|---|
| La región existe **antes** del cambio | Un lector de pantalla vigila una zona ya presente, no una zona que aparece con su contenido | Enviar la región con el marcador de posición y rellenarla después |
| `polite` en lugar de `assertive` | `assertive` interrumpe de inmediato lo que el lector estaba diciendo; `polite` espera al final de la frase | Reservar `assertive` para las alertas urgentes |
| No mover el foco | El usuario perdería su posición en la página | Dejar el foco donde está |
| Texto provisional claro | « Cargando el carrito… » dice lo que pasa | Evitar un blanco o un simple símbolo |
| Sin JavaScript | El fragmento nunca llega | Prever una alternativa, por ejemplo un enlace a la página del carrito dentro de un `<noscript>`, etiqueta cuyo contenido solo se muestra si JavaScript está desactivado ([MDN](https://developer.mozilla.org/es/docs/Web/HTML/Reference/Elements/noscript)) |

El HTML de arriba es el que produce el servidor del experimento. El anuncio en sí depende del lector de pantalla y del navegador utilizados: pruebe con los de sus visitantes.

## El bloque como plugin

En un programa construido alrededor de bloques, cada bloque suele ser una [clase](/?c=langages&s=php&p=poo) (un modelo de objeto, aquí en PHP) independiente que la aplicación encuentra sola: un **plugin**. El detalle del mecanismo (declarar, descubrir, instanciar) está en [la arquitectura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins). Lo que importa aquí:

| Función | Lo que hace el plugin del bloque | Relación con el diferido |
|---|---|---|
| Declaración | Da un identificador y un nombre al bloque | El sistema sabe qué bloque colocar y dónde |
| Construcción | Un método devuelve la descripción de la visualización | Aquí se decide calcular enseguida o **anunciar** un cálculo diferido |
| Independencia | El bloque no depende de los demás | Un bloque lento puede diferirse sin tocar a los demás |

Un bloque, pues, solo se diferencia de su vecino por la forma en que construye su contenido: el bloque de menú devuelve su contenido, el bloque de carrito devuelve **la promesa de calcularlo más tarde** (una descripción de lo que se calculará, como una [Promise](/?c=langages&s=javascript&p=asynchrone) en JavaScript).

## Un ejemplo en Drupal: lazy builder y BigPipe

> **Esta sección es un ejemplo de un programa concreto.** Drupal sirve de ilustración; la idea del capítulo no depende de él. Los nombres de API que siguen vienen de la documentación oficial de Drupal ([arrays de renderizado y lazy builders](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), [marcadores automáticos y BigPipe](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)). Están verificados en el código fuente de Drupal 11.x.

Drupal describe lo que hay que mostrar mediante **arrays de renderizado** (en inglés *render arrays*): arrays [PHP](/?c=langages&s=php&p=php) cuyas claves que empiezan por `#` son instrucciones. Para diferir un bloque, uno de estos arrays declara un **lazy builder** (« constructor perezoso »): en lugar del contenido, designa la función que lo calculará más tarde. El sistema sustituye entonces el trozo por un marcador de posición. Esta sustitución solo se produce en una petición cacheable (una lectura de página, `GET`, no el envío de un formulario, `POST`): `#create_placeholder => TRUE` no fuerza nada en un `POST`.

Notaciones PHP de los ejemplos (ver [la programación orientada a objetos en PHP](/?c=langages&s=php&p=poo)): `namespace` da a la clase su « dirección » lógica, `use` importa una clase de otro namespace, `class A extends B` crea una clase `A` que retoma todo lo que hace `B`, `implements` declara que una clase respeta un contrato (una *interface*), `public static function f(): array` es un método accesible desde fuera, que se puede llamar sin crear objeto (`static`) y que devuelve un array (`: array`), `new X(...)` crea un objeto, `string $cantidad` declara un parámetro de texto (dentro de un texto entre comillas, `$cantidad` inserta su valor), `<?php` abre el código PHP, `TRUE` es el booleano « verdadero » y `#[Block(...)]` es un **atributo**, una etiqueta de declaración que Drupal lee para reconocer el plugin.

```php
<?php

namespace Drupal\tienda\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// Declara el plugin: un identificador y un nombre legible para la administración
#[Block(id: 'tienda_carrito', admin_label: new TranslatableMarkup('Carrito'))]
class CarritoBlock extends BlockBase {

  // Construye el bloque: devuelve un « array de renderizado » (la descripción de la vista)
  public function build(): array {
    return [
      // En lugar de calcular aquí, designa la función que calculará más tarde
      '#lazy_builder' => ['tienda.carrito_builder:construir', ['3']],
      // Pide un marcador de posición en lugar de este trozo (petición cacheable)
      '#create_placeholder' => TRUE,
    ];
  }
}
```

El primer elemento de `#lazy_builder` es el nombre del **servicio** (un objeto compartido que el sistema sabe construir, ver [el contenedor de servicios](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services)), dos puntos, y luego el método. El segundo es la lista de argumentos, que deben seguir siendo simples (texto, número, booleano) según la [documentación](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), para que el sistema pueda memorizarlos sin guardar objetos.

```php
<?php

namespace Drupal\tienda;

use Drupal\Core\Security\TrustedCallbackInterface;

// El servicio que calcula el trozo lento, llamado después por Drupal
class CarritoBuilder implements TrustedCallbackInterface {

  // Recibe los argumentos dados en '#lazy_builder' (aquí el texto « 3 »)
  public function construir(string $cantidad): array {
    // Devuelve el array de renderizado final que sustituirá al marcador de posición
    return ['#markup' => "Carrito: $cantidad artículos"];
  }

  // Lista los métodos que Drupal tiene derecho a llamar así
  public static function trustedCallbacks(): array {
    return ['construir'];
  }
}
```

La interfaz `TrustedCallbackInterface` y su método `trustedCallbacks()` permiten que Drupal llame a `construir`. Desde Drupal 11.5, el atributo `#[TrustedCallback]`, colocado en el método `construir`, es una alternativa a esta interfaz.

El servicio se declara en un archivo [YAML](https://yaml.org/spec/1.2.2/) (un formato de configuración en texto, donde la sangría expresa el anidamiento), llamado `tienda.services.yml` y ubicado en la raíz del módulo `tienda`, junto al archivo `tienda.info.yml` que declara el propio módulo:

```yaml
services:
  # Nombre del servicio, el escrito antes de los dos puntos en '#lazy_builder'
  tienda.carrito_builder:
    # Clase PHP que se instanciará para este servicio
    class: Drupal\tienda\CarritoBuilder
```

El módulo **BigPipe** ([documentación](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)), incluido con Drupal, se encarga después de la entrega: primero envía la página con los marcadores de posición, luego los fragmentos a medida que se calculan, en la misma respuesta. Es el modo « diferido en flujo » de la tabla comparativa, que hemos reproducido en miniatura con `/flujo`.

| Elemento | Qué es | Equivalente en el experimento |
|---|---|---|
| `#lazy_builder` | Designa la función que calculará el contenido más tarde | `calcularCarrito` |
| `#create_placeholder` | Pide un marcador de posición | `zona(ESPERA)` |
| Servicio `tienda.carrito_builder` | Objeto que contiene el método llamado | La función `calcularCarrito` |
| BigPipe | Envía los fragmentos en flujo en la misma respuesta | `res.write` y luego `res.end` de `/flujo` |
| Array de renderizado | Descripción de la visualización | El HTML enviado |

## Qué diferir, y cuándo

Diferir tiene un coste: una página en varios tiempos es más compleja, y el marcador de posición puede estorbar si el contenido es esencial. La tabla ayuda a elegir.

| Bloque | ¿Diferirlo? | Razón |
|---|---|---|
| Menú, pie de página | No | Rápidos e idénticos para todos: caché ordinaria |
| Texto principal del artículo | No | Es el motivo de la visita, debe estar desde el principio |
| Carrito, nombre del visitante, notificaciones | Sí | Personales, impiden la caché de la página |
| Recomendaciones calculadas al vuelo | Sí | Lentas, secundarias |
| Contenido rápido (unos milisegundos) | No | La ganancia no compensa la complejidad |
| Bloque que el visitante quizá nunca verá (pie de página) | Sí, y activado al desplazarse | Mejor no calcularlo si nunca se mira |

Antes de diferir, se **mide**: ver [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser). Un bloque que se supone lento puede no serlo, y el tiempo total no ha disminuido: lo que baja es el tiempo antes de la primera visualización.

## Las trampas

Un **proxy** es un servidor situado entre el visitante y el sitio; un [balanceador de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) es una especie de él. Un **búfer** es una memoria donde se guardan datos antes de transmitirlos.

| Trampa | Consecuencia | Remedio |
|---|---|---|
| Diferir un bloque rápido | Complejidad y salto de diseño por una ganancia nula | Medir primero, diferir solo lo lento o lo personal |
| Marcador de posición sin tamaño | El contenido siguiente salta al rellenarse | Reservar una altura mínima |
| Fragmento personal en una página en caché compartida | María ve los datos de Juan | Poner lo personal en el fragmento, nunca en el esqueleto |
| Intermediario que guarda la respuesta en búfer hasta el final | El flujo solo llega al final, la ganancia desaparece | Comprobar toda la cadena, medir el primer octeto de extremo a extremo |
| Insertar el fragmento como HTML sin escaparlo | Fallo XSS | Insertar con `textContent` (sin escapar); si el texto entra en HTML, escaparlo |
| `</script>` en el texto del fragmento | El navegador cierra el script demasiado pronto | Reemplazar `<` por `\u003c` en el texto del script, como `replace(/</g, '\\u003c')` en el experimento: `\u003c` es la escritura JavaScript del carácter `<`, que ya no cierra la etiqueta |
| Fragmento que falla o tarda demasiado | El espacio queda en « Cargando… » para siempre | Prever un plazo límite y un mensaje de respaldo |
| Depender de JavaScript sin alternativa | El fragmento falta para quien lo ha desactivado | `<noscript>` (ver más arriba) con un enlace a la página correspondiente |
| Muchos bloques diferidos que piden cada uno una petición | Las idas y vueltas se acumulan | Agrupar en una respuesta en flujo, o en una sola petición |
| Fragmento anunciado en bucle a los lectores de pantalla | Flujo de anuncios | Una región `polite`, un único cambio |

## Buenas prácticas

| Práctica | Por qué |
|---|---|
| Separar lo común de lo personal | Lo común se guarda en caché, lo personal se calcula aparte |
| Medir el primer octeto antes y después | La medición demuestra la ganancia (`curl -w`) |
| Reservar el tamaño del espacio | Evita el salto de diseño |
| Declarar la zona como región `aria-live="polite"` desde el envío | El contenido que llega se anuncia |
| Escapar todo texto propio del usuario antes de insertarlo como HTML (o usar `textContent`) | Evita las fallas XSS |
| Elegir el modo según la necesidad | Flujo si el esqueleto se queda en la respuesta, segunda petición si se quiere caché compartida |
| Prever el fallo y el plazo límite | Un fragmento que no llega no bloquea la página |
| Guardar el código de un bloque en un plugin separado | Un bloque lento puede cambiar de modo sin tocar a los demás |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un bloque lento o propio del visitante impide poner la página entera en caché y retrasa su visualización. Se envía primero el esqueleto con un **marcador de posición**, y luego se rellena el espacio con el **fragmento** calculado aparte: en la misma respuesta (flujo) o mediante una segunda petición. El esqueleto se vuelve cacheable, el tiempo hasta el primer octeto baja de unos 0,8 s a unos pocos milisegundos en el experimento, y el fragmento sigue llegando 800 ms después. La ganancia está en mostrar el resto durante la espera, no en un cálculo más rápido. |
| **Trampas a evitar** | Diferir un bloque rápido; olvidar reservar el tamaño del espacio (salto de diseño); poner el fragmento personal en una página compartida; dejar que un intermediario guarde el flujo en búfer; insertar como HTML un texto sin escapar; no prever nada cuando el fragmento falla o JavaScript está desactivado; olvidar la región `aria-live`. |
| **Buenas prácticas** | Medir primero (`curl -w`, primer octeto); diferir solo lo lento o lo personal; reservar una altura mínima; declarar una región `aria-live="polite"` desde el envío; escapar el texto; prever un plazo límite y una alternativa; guardar cada bloque en su plugin para cambiar de modo sin tocar a los demás. |
