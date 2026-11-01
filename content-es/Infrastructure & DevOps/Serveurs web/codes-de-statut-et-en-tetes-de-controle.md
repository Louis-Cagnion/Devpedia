---
order: 1
---

# Códigos de estado HTTP y cabeceras de control

Cuando un navegador o un programa pide una página a un servidor, la respuesta contiene mucho más que la página: lleva un **código de estado** (un número que indica si todo salió bien) y unas **cabeceras** (líneas de instrucciones del tipo «guarda esta página 60 segundos» o «vuelve dentro de 5 segundos»). Este capítulo enseña a leer esos dos elementos, a producirlos en el lado del servidor y, sobre todo, a reaccionar correctamente en el lado del cliente. Supone conocidas las bases de [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (un **cliente** envía una **petición**, un **servidor** devuelve una **respuesta**) y el uso de una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana en la que se escriben comandos con el teclado). Se sitúa en la sección [Servidores web](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web).

Un **servidor web** es un programa que espera peticiones HTTP y responde a ellas: es el que se encuentra detrás de un sitio de internet o de una API (una interfaz que otros programas llaman por HTTP para obtener o enviar datos). Una **cabecera** (*header*) es una línea `Nombre: valor` colocada antes del contenido de un mensaje HTTP, que transmite una información sobre el propio mensaje en lugar de sobre su contenido.

## Una respuesta HTTP, línea por línea

Una respuesta HTTP se divide siempre en tres partes: una línea de estado, unas cabeceras y, después de una línea vacía, el contenido (el **cuerpo**).

```text
HTTP/1.1 429 Too Many Requests        <- línea de estado: versión, código, nombre del código
Content-Type: text/plain; charset=utf-8   <- cabeceras: un «Nombre: valor» por línea
Content-Length: 22
Retry-After: 5
                                       <- línea vacía: fin de las cabeceras
Demasiadas peticiones                  <- cuerpo: el contenido propiamente dicho
```

`Content-Type` (el tipo de contenido) y `Content-Length` (su tamaño en octetos) se explican en [Content-Type y Content-Length](#content-type-y-content-length-leer-bien-el-cuerpo).

| Parte | Función | Quién la lee |
|---|---|---|
| Línea de estado | Resume el resultado: `429` es el **código**, `Too Many Requests` su nombre en inglés | El programa (el código está pensado para ser leído por una máquina) |
| Cabeceras | Precisan cómo tratar el cuerpo y cómo comportarse después | El navegador, el programa, las cachés intermedias |
| Cuerpo | El contenido: página, datos [JSON](/?c=infrastructure-devops&s=infrastructure&p=json), mensaje de error... | El usuario o el programa |

El código es la parte fiable: el nombre que lo acompaña es una indicación para las personas, y el cuerpo puede ser cualquier cosa. Por eso un programa decide **según el código**, nunca según el texto.

## Observar una respuesta con `curl`

Los comandos de este capítulo están escritos para Bash (Linux, macOS, WSL o Git Bash), no para PowerShell ni cmd.

**`curl`** es un programa de terminal que envía una petición HTTP y muestra la respuesta ([documentación oficial](https://curl.se/docs/manpage.html)). Está presente en la mayoría de Linux y macOS; en Windows PowerShell, el nombre `curl` suele designar otro [alias](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), y hay que escribir `curl.exe`. Compruebe su presencia con `curl --version`.

| Opción | Efecto |
|---|---|
| `-i` | Muestra las cabeceras de la respuesta antes del cuerpo |
| `-I` | Envía una petición `HEAD` (un [método HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http#une-requete-une-methode-une-adresse-parfois-des-donnees): como `GET`, pero el servidor solo devuelve la línea de estado y las cabeceras, sin cuerpo) |
| `-s` | Silencioso: sin barra de progreso |
| `-o /dev/null` | Descarta el cuerpo (`/dev/null` es el «archivo papelera» de Linux y macOS, véase [las redirecciones](/?c=langages&s=bash&p=redirections-et-pipes)) |
| `-w '%{http_code}\n'` | Muestra, al terminar la petición, solo el código de estado (`\n` salta de línea) |
| `-L` | Sigue las redirecciones (véase `Location` más abajo) |
| `-H 'Nombre: valor'` | Añade una cabecera a la petición |

Para poder probarlo todo en casa, la sección siguiente ofrece un pequeño servidor de demostración.

## Un servidor de prueba en Node.js

**Node.js** es un programa que ejecuta JavaScript fuera del navegador ([sitio oficial e instalación](https://nodejs.org/en/download)); hace falta Node 18 o más (compruebe con `node --version`); su módulo `http` permite crear un servidor ([documentación](https://nodejs.org/api/http.html)). El código de abajo supone conocidas las bases de [JavaScript](/?c=langages&s=javascript&p=javascript): [funciones](/?c=langages&s=javascript&p=fonctions), [condiciones](/?c=langages&s=javascript&p=conditions), [objetos](/?c=langages&s=javascript&p=objets) y [arrays](/?c=langages&s=javascript&p=tableaux). Guárdelo en un archivo `servidor.mjs` (la extensión `.mjs` indica a Node que el archivo usa `import`, véase [el editor de código](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide)).

Escucha en `127.0.0.1` (la dirección de **su propia máquina**, véase [el direccionamiento de red](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) y en el **puerto** 5628 (un número que distingue varios programas de red en una misma máquina, véase [los sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Si ese puerto ya está ocupado, Node muestra `EADDRINUSE`: cambie el número en `PUERTO` y en las direcciones de los ejemplos.

```javascript
// import carga un módulo: http es el de Node que permite crear un servidor web
import http from "node:http";

// PUERTO: el «número de puerta» en el que escucha el servidor
const PUERTO = 5628;
// LIMITE: número de peticiones aceptadas por ventana de tiempo
const LIMITE = 3;
// VENTANA_MS: duración de una ventana, en milisegundos (5000 ms = 5 s)
const VENTANA_MS = 5000;

// RUTAS: para cada dirección fija, el estado, las cabeceras y el cuerpo que devolver
const RUTAS = {
  // 301: la cabecera Location da la nueva dirección de la página
  "/antiguo": [301, { Location: "/nuevo" }, ""],
  // 200: el cliente puede guardar la página 60 segundos (Cache-Control)
  "/nuevo": [200, { "Cache-Control": "max-age=60" }, "Bienvenido\n"],
  // 401: «¿quién es usted?»; WWW-Authenticate indica cómo identificarse
  // (Basic: un nombre de usuario y una contraseña; realm: el nombre de la zona protegida)
  "/privado": [401, { "WWW-Authenticate": 'Basic realm="privado"' }, "Identifíquese\n"],
  // 403: el servidor sabe quién es usted, pero rechaza
  "/prohibido": [403, {}, "Acceso denegado\n"],
  // 503: servidor en mantenimiento; Retry-After indica que vuelva dentro de 120 segundos
  "/mantenimiento": [503, { "Retry-After": "120" }, "Mantenimiento en curso\n"],
};

// inicioVentana: instante (en ms) en el que empezó la ventana actual
// (Date.now() devuelve el instante presente en milisegundos)
let inicioVentana = Date.now();
// contador: número de peticiones ya vistas en la ventana actual
let contador = 0;

// responder envía un código de estado, unas cabeceras y un cuerpo de texto
function responder(res, estado, cabeceras, cuerpo) {
  // Content-Length: tamaño del cuerpo en octetos (una «í» ocupa 2 en UTF-8)
  // Buffer: el tipo de Node para manipular octetos; byteLength cuenta los del cuerpo
  const tamano = Buffer.byteLength(cuerpo);
  // cabeceras comunes a todas las respuestas; ...cabeceras copia las de la ruta
  const todos = {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": tamano,
    ...cabeceras,
  };
  // writeHead fija el código de estado y las cabeceras; end envía el cuerpo
  res.writeHead(estado, todos);
  res.end(cuerpo);
}

// limitar cuenta la petición y devuelve la espera en segundos (0 = aceptada)
function limitar(ahora) {
  // si la ventana ha terminado, se empieza de nuevo con el contador a cero
  if (ahora - inicioVentana >= VENTANA_MS) {
    inicioVentana = ahora;
    contador = 0;
  }
  // una petición más en la ventana
  contador += 1;
  // por debajo del límite: aceptada; si no, segundos restantes redondeados hacia arriba
  if (contador <= LIMITE) return 0;
  return Math.ceil((inicioVentana + VENTANA_MS - ahora) / 1000);
}

// servirPagina responde a /pagina: 304 si el cliente ya tiene la versión "v1"
function servirPagina(req, res) {
  // if-none-match: la etiqueta (ETag) que el cliente guardó de su visita anterior
  if (req.headers["if-none-match"] === '"v1"') {
    // 304: nada ha cambiado, la respuesta no lleva cuerpo a propósito
    res.writeHead(304, { ETag: '"v1"' });
    res.end();
    return;
  }
  // primera visita: la página entera, con su etiqueta de versión
  responder(res, 200, { ETag: '"v1"', "Cache-Control": "no-cache" }, "Página v1\n");
}

// servidor: la función pasada a createServer se llama en cada petición
// req: la petición recibida, res: la respuesta que hay que enviar
// (req, res) => { ... } es una función escrita con flecha, sin nombre
const servidor = http.createServer((req, res) => {
  // req.url: la parte de la dirección después del nombre de la máquina, por ejemplo /api
  if (req.url === "/api") {
    // espera: 0 si la petición se acepta; si no, los segundos que hay que esperar
    const espera = limitar(Date.now());
    // 429 Too Many Requests, con Retry-After en segundos (String: número en texto)
    if (espera > 0) {
      responder(res, 429, { "Retry-After": String(espera) }, "Demasiadas peticiones\n");
      return;
    }
    // si no: 200 con una respuesta en formato JSON
    responder(res, 200, { "Content-Type": "application/json" }, '{"ok":true}\n');
    return;
  }
  // /pagina gestiona su propia lógica
  if (req.url === "/pagina") {
    servirPagina(req, res);
    return;
  }
  // ruta fija conocida: ...RUTAS[req.url] pasa los tres valores a responder
  if (RUTAS[req.url]) {
    responder(res, ...RUTAS[req.url]);
    return;
  }
  // cualquier otra dirección no existe: 404
  responder(res, 404, {}, "No encontrado\n");
});

// listen empieza a escuchar; 127.0.0.1 = solo esta máquina
servidor.listen(PUERTO, "127.0.0.1");
```

| Dirección | Lo que devuelve el servidor |
|---|---|
| `/api` | `200` para las 3 primeras peticiones de cada ventana de 5 segundos, luego `429` con `Retry-After` |
| `/antiguo` | `301` y `Location: /nuevo` |
| `/nuevo` | `200` y `Cache-Control: max-age=60` |
| `/pagina` | `200` con un `ETag`, o `304` si el cliente ya lo conoce |
| `/privado` | `401` |
| `/prohibido` | `403` |
| `/mantenimiento` | `503` con `Retry-After` |
| cualquier otra dirección | `404` |

Lance el servidor en una primera terminal con `node servidor.mjs`: la terminal queda ocupada mientras el servidor funciona (para detenerlo, `Ctrl+C`). Abra una **segunda** terminal para los comandos `curl` siguientes. Un ejemplo, con la respuesta realmente obtenida:

```bash
# -i: muestra las cabeceras; /nuevo es la página que lleva Cache-Control
curl -i http://127.0.0.1:5628/nuevo
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 11
Cache-Control: max-age=60
Date: Sat, 31 Oct 2026 20:09:49 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Bienvenido
```

`Date`, `Connection` y `Keep-Alive` los añade Node automáticamente (la fecha y la hora de la respuesta, y después la indicación de mantener la conexión abierta unos segundos); en el resto del capítulo, estas tres líneas se omiten de las salidas para aligerarlas.

## Las cinco familias de códigos

Un código de estado tiene tres cifras, y **la primera** basta para conocer la familia:

| Familia | Nombre | Sentido general | Quién debe actuar después |
|---|---|---|---|
| `1xx` | Información | La petición se ha recibido, lo siguiente llega (rara vez lo ve un desarrollador de aplicaciones) | Nadie, el protocolo se encarga |
| `2xx` | Éxito | La petición fue comprendida y tratada | Nadie |
| `3xx` | Redirección | El recurso está en otra parte o no ha cambiado | El cliente debe hacer otra petición (o reutilizar su copia) |
| `4xx` | Error del cliente | La petición es incorrecta, está prohibida o es demasiado frecuente | **El cliente** debe modificar su petición o su comportamiento |
| `5xx` | Error del servidor | La petición era válida, pero el servidor no pudo tratarla | **El servidor** debe ser reparado; el cliente puede a veces volver a intentarlo más tarde |

La idea que hay que retener: la primera cifra responde a «**¿quién debe cambiar algo?**». Repetir idénticamente una petición que dio un `4xx` no sirve de nada (salvo `429`, véase más abajo); repetir una petición que dio un `5xx` puede funcionar si la avería era pasajera.

## Los códigos que más se encuentran

### Éxito y redirecciones

| Código | Nombre | Significado | Responsable | Ejemplo |
|---|---|---|---|---|
| `200` | OK | La petición tuvo éxito, el cuerpo contiene el resultado | Nadie | Cargar una página, leer una lista |
| `201` | Created | Se ha creado un recurso nuevo; `Location` indica su dirección | Nadie | Respuesta a un `POST` que crea una cuenta |
| `204` | No Content | Éxito, voluntariamente **sin cuerpo** | Nadie | Respuesta a un `DELETE` exitoso |
| `301` | Moved Permanently | El recurso ha cambiado de dirección de forma definitiva (`Location`) | Servidor (configuración) | Un sitio que pasa de una dirección antigua a una nueva |
| `302` | Found | El recurso está **temporalmente** en otra parte (`Location`) | Servidor (configuración) | Redirigir a la página de inicio de sesión y volver después |
| `304` | Not Modified | Nada ha cambiado desde la copia que tiene el cliente; **sin cuerpo** | Nadie | Un navegador que vuelve a comprobar una página que ya tiene |

`301` y `302` no siempre conservan el método de origen: un navegador puede transformar un `POST` redirigido en un `GET`. Los códigos `308` (equivalente permanente) y `307` (equivalente temporal) obligan a **mantener el mismo método** ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110); una RFC, *Request For Comments*, es un documento numerado que describe una norma de Internet). El navegador puede memorizar la `301` durante mucho tiempo, lo que la hace molesta de corregir si era un error.

### Errores del cliente (4xx)

| Código | Nombre | Significado | Responsable | Ejemplo |
|---|---|---|---|---|
| `400` | Bad Request | La petición está mal formada o no es válida | Cliente | JSON roto, campo obligatorio ausente |
| `401` | Unauthorized | **No identificado**: el servidor no sabe quién es usted (o la identificación es falsa) | Cliente | Falta la contraseña, token caducado (un token es un código temporal que demuestra su identidad) |
| `403` | Forbidden | **Identificado pero rechazado**: el servidor sabe quién es usted y no le autoriza | Cliente | Un usuario sin privilegios que pide una página de administración |
| `404` | Not Found | El recurso no existe (o el servidor se niega a decir que existe) | Cliente | Error de escritura en la dirección |
| `429` | Too Many Requests | **Demasiadas peticiones** en un tiempo dado; a menudo acompañado de `Retry-After` | Cliente | Un script que consulta una API en bucle |

### Errores del servidor (5xx)

| Código | Nombre | Significado | Responsable | Ejemplo |
|---|---|---|---|---|
| `500` | Internal Server Error | El servidor encontró un error imprevisto | Servidor | Fallo en el código, [base de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) inaccesible |
| `502` | Bad Gateway | Un servidor intermedio recibió una respuesta no válida del servidor situado detrás de él | Servidor (cadena de servidores) | El programa de aplicación falló detrás de un [proxy inverso](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) (definido bajo la tabla) |
| `503` | Service Unavailable | El servidor no puede responder **por ahora** (sobrecarga, mantenimiento); a menudo acompañado de `Retry-After` | Servidor | Actualización en curso |
| `504` | Gateway Timeout | El intermediario esperó demasiado la respuesta del servidor situado detrás de él | Servidor (cadena de servidores) | Petición muy lenta en un sitio detrás de un proxy inverso |

Un **proxy inverso** es un servidor intermedio que recibe las peticiones en lugar del servidor de aplicación y se las transmite: es él quien produce un `502` o un `504` cuando el servidor situado detrás de él está caído o es demasiado lento.

Veamos algunos de estos códigos en el servidor de prueba (las líneas `Date`, `Connection` y `Keep-Alive` se omiten, y una línea vacía separa aquí cada respuesta):

```bash
# 301: -i muestra la cabecera Location; sin -L, curl no sigue la redirección
curl -i http://127.0.0.1:5628/antiguo
# 401: la cabecera WWW-Authenticate indica cómo identificarse
curl -i http://127.0.0.1:5628/privado
# 403: ninguna cabecera especial, el servidor simplemente rechaza
curl -i http://127.0.0.1:5628/prohibido
# 404: dirección desconocida para el servidor
curl -i http://127.0.0.1:5628/ausente
```

```text
HTTP/1.1 301 Moved Permanently
Content-Type: text/plain; charset=utf-8
Content-Length: 0
Location: /nuevo

HTTP/1.1 401 Unauthorized
Content-Type: text/plain; charset=utf-8
Content-Length: 15
WWW-Authenticate: Basic realm="privado"

Identifíquese

HTTP/1.1 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 16

Acceso denegado

HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Content-Length: 14

No encontrado
```

La primera respuesta no tiene cuerpo (lo indica `Content-Length: 0`); las otras tres sí. Para retener solo el código, `-w` basta:

```bash
# -s silencioso, -o /dev/null descarta el cuerpo, -w muestra el código de estado
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/ausente
```

Lo que muestra `404`.

### `401` o `403`: la confusión más frecuente

La **autenticación** responde a «¿quién es usted?»; la **autorización** responde a «¿tiene derecho a hacer esto?» ([la diferencia en detalle](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation)). El nombre oficial del `401`, *Unauthorized*, es engañoso: habla en realidad de **autenticación**.

| Situación | Código | Lo que debe hacer el cliente |
|---|---|---|
| Ningún identificador enviado | `401` | Identificarse y luego volver a intentarlo |
| Identificador incorrecto o token caducado | `401` | Volver a identificarse |
| Identificado, pero sin derecho (usuario simple, página de administración) | `403` | Nada: volver a identificarse no cambia nada, hace falta otra cuenta u otro permiso |
| Recurso que se prefiere no revelar | `404` | Nada (el servidor oculta a propósito que existe) |

## Las cabeceras que dirigen al cliente

Algunas cabeceras de respuesta no describen solo el contenido: **indican al cliente qué hacer**.

| Cabecera | Lo que pide | A menudo asociada a |
|---|---|---|
| `Retry-After` | Esperar antes de volver a intentarlo | `429`, `503` |
| `Cache-Control` | Guardar (o no guardar) la respuesta en memoria | `200`, `304` |
| `Location` | Ir a esta dirección | `201`, `301`, `302`, `307`, `308` |
| `Content-Type` | Leer el cuerpo como tal tipo de contenido | Casi todas las respuestas con cuerpo |
| `Content-Length` | Leer exactamente este número de octetos de cuerpo | Casi todas las respuestas con cuerpo |

### `Location`: adónde ir ahora

Con una redirección (`3xx`), `Location` indica la nueva dirección; con un `201`, indica la dirección del recurso que acaba de crearse. Un navegador sigue la redirección por sí mismo. `curl` solo lo hace si se le pide:

```bash
# -L: sigue la redirección; -w muestra el código final y la dirección final
# (url_effective es el nombre que curl da a la dirección de la última petición)
curl -sL -o /dev/null -w '%{http_code} %{url_effective}\n' http://127.0.0.1:5628/antiguo
```

```text
200 http://127.0.0.1:5628/nuevo
```

Sin `-L`, la misma llamada muestra `301 http://127.0.0.1:5628/antiguo`. Se han realizado dos peticiones: una a `/antiguo` (respuesta `301`) y otra a `/nuevo` (respuesta `200`).

### `Content-Type` y `Content-Length`: leer bien el cuerpo

| Cabecera | Valor de ejemplo | Función |
|---|---|---|
| `Content-Type` | `application/json` | El **tipo de contenido** (tipo MIME, por el nombre de la norma de origen, *Multipurpose Internet Mail Extensions*): aquí, datos [JSON](/?c=infrastructure-devops&s=infrastructure&p=json). `text/html` para una página web, `text/plain` para texto plano |
| `Content-Type` | `text/plain; charset=utf-8` | El tipo, seguido del **juego de caracteres** (*charset*): la tabla que asocia los octetos con las letras. UTF-8 es la más común y maneja las tildes ([codificación de textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) |
| `Content-Length` | `18` | El tamaño del cuerpo en **octetos** (un octeto es una unidad de almacenamiento: una letra sin tilde ocupa 1) |

En la respuesta `429` de la sección [Una respuesta HTTP, línea por línea](#una-respuesta-http-linea-por-linea), el cuerpo «Demasiadas peticiones» seguido de un salto de línea cuenta 22 caracteres y también 22 octetos, porque no contiene ninguna letra acentuada. Un `Content-Length` contado en caracteres en lugar de octetos corta el cuerpo: el cliente recibe un texto cuyo final se pierde (una cifra demasiado grande, en cambio, hace esperar indefinidamente octetos que no llegan). Con «Identifíquese» de la respuesta `401`, la diferencia aparece: 14 caracteres con el salto de línea, pero 15 octetos, porque la «í» ocupa 2.

Un `Content-Type` incorrecto produce errores extraños: un navegador que recibe JSON etiquetado como `text/html` lo muestra como una página, y un cliente que espera JSON etiquetado como `text/plain` puede negarse a analizarlo. El servidor también debe etiquetar correctamente lo que sirve, para evitar que el navegador «adivine» el tipo (véase `X-Content-Type-Options` en [los fallos del navegador](/?c=securite&s=cybersecurite&p=failles-de-navigateur)).

### `Cache-Control`: guardar o no guardar

Una **caché** es una copia guardada en memoria (por el navegador o por un servidor intermedio) para evitar volver a pedir lo mismo. `Cache-Control` regula este comportamiento ([documentación de referencia](https://developer.mozilla.org/es/docs/Web/HTTP/Reference/Headers/Cache-Control)):

| Valor | Efecto |
|---|---|
| `max-age=60` | La copia se considera válida durante 60 segundos: durante ese tiempo, no se envía ninguna petición |
| `no-cache` | La copia puede guardarse, pero el cliente debe **volver a comprobar** con el servidor antes de reutilizarla (pese a su nombre, no desactiva el almacenamiento) |
| `no-store` | No guardar nada (páginas bancarias, datos personales) |
| `private` | Solo el navegador del usuario puede guardar la copia, no una caché compartida entre usuarios |
| `public` | Cualquier caché puede guardarla |

Con `no-cache`, la nueva comprobación se hace con un `ETag`: una **etiqueta de versión** que el servidor pega a la respuesta. En la siguiente visita, el cliente la devuelve en la cabecera de petición `If-None-Match` («dame la página solo si ya no coincide con esta etiqueta»). Si nada ha cambiado, el servidor responde `304` **sin cuerpo**, lo que ahorra la transferencia. Con la ruta `/pagina` del servidor de prueba:

```bash
# primera visita: el servidor responde 200 con el cuerpo y el ETag
curl -i http://127.0.0.1:5628/pagina
# segunda visita: -H envía If-None-Match con el ETag recibido; respuesta 304
curl -i -H 'If-None-Match: "v1"' http://127.0.0.1:5628/pagina
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 11
ETag: "v1"
Cache-Control: no-cache

Página v1

HTTP/1.1 304 Not Modified
ETag: "v1"
```

`curl` no guarda nada en caché: solo muestra las cabeceras. Es el navegador el que aplica `max-age` o `no-cache`. El principio vecino «servir enseguida una copia caducada y actualizarla después» se describe en [el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant).

## `Retry-After`: «vuelve más tarde»

Cuando un servidor no puede o no quiere responder en este momento, no se limita a decir «no»: puede indicar **cuándo** volver a intentarlo. Ese es el papel de `Retry-After`. Acompaña sobre todo a `429` (el cliente va demasiado rápido) y a `503` (el servidor está sobrecargado o en mantenimiento), y también puede aparecer en una redirección `3xx` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 10.2.3; el código `429` está definido por la [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585)).

### Dos formatos posibles

| Formato | Ejemplo | Significado |
|---|---|---|
| Un número de segundos | `Retry-After: 120` | Espera 120 segundos a partir de ahora |
| Una fecha HTTP | `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT` | No vuelvas antes de este instante (hora GMT, equivalente a la hora UTC, la misma para todo el mundo) |

Un cliente debe saber leer los dos. Con el servidor de prueba:

```bash
# espere 5 s después del comando anterior sobre /api ; 3 peticiones pasan,
# la 4.ª supera el límite: 429 con Retry-After en segundos
for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/api; done
# el servidor de mantenimiento también da un Retry-After, con el código 503
curl -i http://127.0.0.1:5628/mantenimiento
```

```text
200
200
200
429
HTTP/1.1 503 Service Unavailable
Content-Type: text/plain; charset=utf-8
Content-Length: 23
Retry-After: 120

Mantenimiento en curso
```

El `for i in 1 2 3 4; do ... done` es un [bucle](/?c=langages&s=bash&p=boucles) del shell que repite el comando cuatro veces.

Para ver una respuesta `429` completa, basta con enviar tres peticiones seguidas y después una cuarta con `-i` (sin pausa entre ellas; espere 5 segundos después del comando anterior para volver a empezar con una ventana vacía):

```bash
# las 3 primeras peticiones consumen el límite, la 4.ª muestra la respuesta 429 completa
for i in 1 2 3; do curl -s -o /dev/null http://127.0.0.1:5628/api; done
curl -i http://127.0.0.1:5628/api
```

```text
HTTP/1.1 429 Too Many Requests
Content-Type: text/plain; charset=utf-8
Content-Length: 22
Retry-After: 5

Demasiadas peticiones
```

Es la forma descrita en [Una respuesta HTTP, línea por línea](#una-respuesta-http-linea-por-linea): una línea de estado, cabeceras, una línea vacía y después el cuerpo. `Retry-After: 5` significa «reintenta dentro de 5 segundos»: el servidor ha calculado que quedan 5 segundos hasta el final de la ventana de 5 segundos en curso, y que una petición enviada antes sería rechazada de nuevo. Si se espera antes de lanzar la cuarta petición, el valor baja (4, 3...), puesto que la ventana avanza.

### Lo que hace un cliente cortés

```text
Cliente                                         Servidor
  | GET /api  (4.ª petición en la ventana)  ---->  |
  | <----  429 Too Many Requests, Retry-After: 5   |
  |                                                |
  |   el cliente ESPERA 5 s (+ un poco de azar)    |
  |                                                |
  | GET /api  -------------------------------->    |
  | <----  200 {"ok":true}                         |
```

| Regla del cliente cortés | Por qué |
|---|---|
| Reintentar solo `429` y `503` (y otras averías pasajeras) | `400`, `401`, `403`, `404` no cambiarán al repetir la misma petición |
| Leer `Retry-After` en primer lugar (segundos **o** fecha) | El servidor conoce mejor que el cliente la duración de su propia sobrecarga |
| Sin `Retry-After`: esperar cada vez más (**retroceso exponencial**, *exponential backoff*) | El retraso se duplica con cada fallo: así se deja al servidor tiempo para recuperarse |
| Añadirle **azar** (*jitter*) | Sin azar, mil clientes que recibieron el mismo `Retry-After: 5` vuelven todos al mismo segundo y provocan un nuevo pico |
| Limitar el número de intentos y acotar la espera | Un `Retry-After` de varias horas no debe bloquear un programa sin fin |
| Repetir una petición solo si es **idempotente** | Una petición idempotente (`GET`, `PUT`, `DELETE`) tiene el mismo efecto se envíe una vez o diez; repetir un `POST` puede crear un duplicado |

El mismo principio lo aplican las bibliotecas cliente de las API profesionales (véase [el SDK y la API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)) y se completa con el cortacircuitos (dejar de llamar a un recurso averiado), descrito en [la robustez de los procesos por lotes](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

### El mal cliente: reintentar sin esperar

Este es un script que ignora la respuesta y vuelve a intentarlo inmediatamente. Usa `fetch` (la función de JavaScript que envía una petición HTTP) con `await` (esperar el resultado), explicados en [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone). `fetch` está disponible sin instalación desde Node 18, y `await` fuera de una función exige un archivo `.mjs`: guárdelo en `malo.mjs` y ejecute `node malo.mjs` tras esperar 5 segundos desde el comando anterior.

```javascript
// contadores: cuántas respuestas de cada código se han recibido
const contadores = {};
// veinte peticiones inmediatas, sin esperar nunca: el comportamiento que hay que evitar
for (let i = 0; i < 20; i += 1) {
  // solo miramos el código de estado; { status } extrae la propiedad status de la respuesta
  const { status } = await fetch("http://127.0.0.1:5628/api");
  // sumamos 1 al contador de ese código (?? 0: si aún no existía, partimos de 0)
  contadores[status] = (contadores[status] ?? 0) + 1;
}
// muestra el balance
console.log(contadores);
```

```text
{ '200': 3, '429': 17 }
```

De 20 peticiones, 17 fueron inútiles: cargaron el servidor, consumieron el límite y no aportaron nada. En un servicio real, esto puede llevar a un bloqueo duradero de la clave de acceso (el código secreto que identifica su programa ante el servicio; véase [la seguridad de una API web](/?c=securite&s=cybersecurite&p=securite-api-web)).

### El buen cliente: respetar `Retry-After`

El script siguiente (que se guarda en `cliente.mjs`) lee la cabecera, espera y vuelve a intentarlo. La función `leerRetryAfter` gestiona los dos formatos; `retrasoCreciente` sirve de respaldo cuando falta la cabecera. La gestión de errores con `throw` se explica en [la gestión de errores](/?c=langages&s=javascript&p=gestion-des-erreurs).

```javascript
// URL_API: la dirección de la ruta que limita el ritmo
const URL_API = "http://127.0.0.1:5628/api";
// MAX_INTENTOS: número máximo de intentos antes de rendirse
const MAX_INTENTOS = 5;
// ESPERA_MAX_MS: tope de una espera, sea cual sea la petición del servidor
const ESPERA_MAX_MS = 30000;

// dormir devuelve una promesa que termina después de ms milisegundos
function dormir(ms) {
  // setTimeout llama a la función terminar cuando pasa el tiempo
  return new Promise((terminar) => setTimeout(terminar, ms));
}

// leerRetryAfter convierte el valor de la cabecera en milisegundos (null si falta)
function leerRetryAfter(valor) {
  // sin cabecera, o cabecera vacía: el cliente deberá decidir solo su retraso
  if (valor === null || valor.trim() === "") return null;
  // primer formato posible: un número entero de segundos, por ejemplo "5"
  const segundos = Number(valor);
  // Number.isFinite es falso para NaN («no es un número»), lo que descarta una fecha
  if (Number.isFinite(segundos)) return Math.max(0, segundos * 1000);
  // segundo formato: una fecha HTTP; Date.parse la lee y la convierte en milisegundos
  // transcurridos desde el 1 de enero de 1970 (como Date.now())
  const fecha = Date.parse(valor);
  if (Number.isNaN(fecha)) return null;
  // Date.now(): instante presente; Math.max(0, x) se queda con el mayor de 0 y x,
  // así que nunca es negativo: una fecha pasada significa «enseguida»
  return Math.max(0, fecha - Date.now());
}

// retrasoCreciente: espera al azar entre 0 y 500 ms x 2^intento (retroceso exponencial)
function retrasoCreciente(intento) {
  // Math.random() da un número entre 0 y 1; 2 ** intento: 2 elevado a intento
  return Math.random() * 500 * 2 ** intento;
}

// llamar envía la petición y reintenta con cortesía ante 429 y 503
async function llamar(url) {
  // intento vale 0 en el primer intento, 1 en el segundo, etc.
  for (let intento = 0; intento < MAX_INTENTOS; intento += 1) {
    // fetch envía la petición; respuesta.status es el código de estado recibido
    const respuesta = await fetch(url);
    // respuesta.ok es verdadero para todos los códigos 2xx: devolvemos la respuesta
    if (respuesta.ok) return respuesta;
    // cualquier otro código distinto de 429 o 503: reintentar no serviría de nada
    if (respuesta.status !== 429 && respuesta.status !== 503) {
      throw new Error(`Fallo definitivo: ${respuesta.status}`);
    }
    // indicación del servidor si existe; ?? elige si no el retraso creciente aleatorio
    const consigna = leerRetryAfter(respuesta.headers.get("Retry-After"));
    // se añade un azar de 0 a 500 ms: los clientes no vuelven todos al mismo instante
    const espera = (consigna ?? retrasoCreciente(intento)) + Math.random() * 500;
    // demasiado largo: abandonamos en lugar de bloquear el programa
    if (espera > ESPERA_MAX_MS) throw new Error(`Espera demasiado larga: ${espera} ms`);
    // Math.round redondea al entero; los ${...} de un texto entre acentos graves
    // se sustituyen por su valor
    const redondeado = Math.round(espera);
    console.log(`intento ${intento + 1}: ${respuesta.status}, pausa de ${redondeado} ms`);
    // pausa antes de volver a intentarlo
    await dormir(espera);
  }
  throw new Error("Demasiados intentos");
}

// encadenamos seis llamadas: las tres primeras pasan, las siguientes sufren el límite
for (let numero = 1; numero <= 6; numero += 1) {
  const respuesta = await llamar(URL_API);
  console.log(`llamada ${numero}: ${respuesta.status} ${(await respuesta.text()).trim()}`);
}
```

Con el servidor de prueba en marcha, la salida realmente obtenida es:

```text
llamada 1: 200 {"ok":true}
llamada 2: 200 {"ok":true}
llamada 3: 200 {"ok":true}
intento 1: 429, pausa de 5302 ms
llamada 4: 200 {"ok":true}
llamada 5: 200 {"ok":true}
llamada 6: 200 {"ok":true}
```

La cuarta llamada recibió un `429`, esperó un poco más de 5 segundos (los 5 de `Retry-After` más el azar de 0 a 500 ms) y tuvo éxito a la primera. Ninguna petición se desperdició. La duración de la pausa varía ligeramente de una ejecución a otra por el azar.

Esto es lo que devuelve `leerRetryAfter` (en milisegundos) para distintos valores de la cabecera, resultados obtenidos llamando a la función:

| Valor de la cabecera | Resultado | Explicación |
|---|---|---|
| `"5"` | `5000` | 5 segundos convertidos en milisegundos |
| `"120"` | `120000` | 2 minutos |
| `"-5"` | `0` | Un retraso negativo no tiene sentido: ninguna espera |
| Una fecha ya pasada (`Wed, 21 Oct 2015 07:28:00 GMT`) | `0` | Volver de inmediato está permitido |
| Una fecha dentro de 90 segundos | aproximadamente `89000` | El tiempo que queda hasta esa fecha |
| `"abc"`, `""` o ausente | `null` | Valor no aprovechable: el cliente usa `retrasoCreciente` |

Sin `Retry-After`, `retrasoCreciente` elige un número al azar entre 0 y un tope que se duplica en cada intento:

| Intento (número de partida 0) | Tope de la espera elegida al azar |
|---|---|
| 0 | 500 ms |
| 1 | 1000 ms |
| 2 | 2000 ms |
| 3 | 4000 ms |
| 4 | 8000 ms |

`Retry-After` sigue siendo una **solicitud**, no una obligación técnica: nada impide a un cliente ignorarla. Un servidor bien diseñado se protege entonces por sí mismo (limitación de ritmo, bloqueo de los clientes que insisten); este lado del servidor es el tema de [la limitación de ritmo y el proxy inverso](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit). El riesgo que supone una sobrecarga se detalla en [la sobrecarga y la denegación de servicio de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Algunos servicios añaden sus propias cabeceras para anunciar la cuota restante; sus nombres y su significado se leen en la documentación de cada servicio.

## Elegir el código adecuado en el servidor

| Situación | Código que devolver |
|---|---|
| La página o el dato se devuelve con normalidad | `200` |
| Un `POST` ha creado un recurso | `201` con `Location` |
| Un `DELETE` ha tenido éxito, nada que mostrar | `204` |
| La página ha cambiado de dirección de forma definitiva | `301` con `Location` |
| El cuerpo de la petición no es válido (JSON roto, campo ausente) | `400`, con en el cuerpo lo que está mal |
| Ningún identificador, o identificador incorrecto | `401` |
| Identificado pero no autorizado | `403` |
| El recurso no existe | `404` |
| El cliente supera su límite | `429` con `Retry-After` |
| Error o avería imprevista | `500` (sin detalles internos en el cuerpo) |
| Sobrecarga o mantenimiento programado | `503` con `Retry-After` |

## Las trampas

| Trampa | Consecuencia | Qué hacer en su lugar |
|---|---|---|
| Confundir `401` y `403` | El cliente se vuelve a identificar en bucle cuando no tiene derecho, o nunca se identifica cuando debería | `401`: no identificado; `403`: identificado pero rechazado |
| Devolver `200` con un mensaje de error en el cuerpo (`{"error": "no encontrado"}`) | Los programas, las cachés y las herramientas de vigilancia creen que todo va bien; el error se cuenta como un éxito | Usar el código correspondiente (`404`, `400`...) y mantener el mensaje en el cuerpo como complemento |
| Reintentar inmediatamente en bucle | Medido arriba: 17 peticiones perdidas de 20; riesgo de bloqueo por parte del servidor | Esperar `Retry-After`; si no, un retraso creciente y aleatorio, con un número de intentos limitado |
| Ignorar el formato de fecha de `Retry-After` | `Number("Wed, 21 Oct 2026...")` da `NaN`: el cliente espera `NaN` milisegundos, es decir, nada en absoluto | Leer los dos formatos (`leerRetryAfter`) |
| Reintentar un `400`, `401`, `403` o `404` | La misma respuesta cada vez, carga inútil | Corregir la petición, o identificarse |
| Reintentar un `POST` no idempotente tras un `5xx` | Duplicado posible (dos pedidos, dos pagos) si la primera había tenido éxito en realidad | Reintentar solo las peticiones idempotentes, o añadir una clave de unicidad (un identificador único enviado con la petición, que permite al servidor ignorar un duplicado; véase [la idempotencia](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)) |
| No poner tope ni número máximo de intentos | Un programa bloqueado durante horas por un `Retry-After` enorme | `ESPERA_MAX_MS` y `MAX_INTENTOS` |
| `500` para un error del cliente (JSON no válido, campo ausente) | Las alertas de avería saltan por error, el cliente cree en una avería pasajera y reintenta | `400`: es la petición la que tiene el problema |
| `404` para todo (incluso una denegación de acceso) | El cliente no sabe qué corregir | Un código preciso, salvo que se quiera ocultar la existencia |
| `301` puesta por error | La memorizan los navegadores y es difícil de anular | Probar primero con `302`, pasar a `301` cuando la dirección sea definitiva |
| `Content-Length` contado en caracteres | Cuerpo truncado en cuanto hay una tilde | Medir en octetos (`Buffer.byteLength`) |
| `Content-Type` ausente o incorrecto | El navegador adivina el tipo o muestra mal el contenido | Declararlo siempre (`application/json` para JSON) |
| Poner una respuesta personal como `public` | Una caché compartida la sirve a otro usuario | `private` o `no-store` para los datos personales |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Decidir según el **código**, no según el texto del cuerpo | El código es el contrato entre máquinas |
| Distinguir `4xx` (corregir la petición) y `5xx` (reintentar más tarde, con límite) | Cada familia provoca una reacción diferente |
| Leer siempre `Retry-After` en `429` y `503` | El servidor sabe mejor que usted cuánto durará la avería |
| Retroceso exponencial, azar, número de intentos y espera máxima acotados | Evita que todos los clientes vuelvan a la vez, y las esperas interminables |
| Devolver el código exacto en el servidor, con `Retry-After` cuando se limita | Así un cliente bien escrito podrá comportarse cortésmente |
| Declarar `Content-Type` (con `charset=utf-8` para texto) y dejar `Content-Length` a la biblioteca cuando sea posible | Ningún cálculo de octetos a mano |
| Elegir `Cache-Control` con criterio: `max-age` para lo estático, `no-cache` con `ETag` para lo dinámico que hay que volver a comprobar, `no-store` para lo sensible | El comportamiento por defecto de las cachés rara vez es el que se quiere |
| Probar con `curl -i` antes de escribir el cliente | Se ve exactamente lo que envía el servidor |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un código de estado se lee por su primera cifra: `2xx` éxito, `3xx` redirección, `4xx` falta del cliente, `5xx` falta del servidor. `Retry-After` (segundos o fecha HTTP) acompaña a `429` y `503` e indica cuándo volver; `Cache-Control`, `Location`, `Content-Type` y `Content-Length` regulan la caché, el destino y la lectura del cuerpo. `curl -i` permite observarlo todo. |
| **Trampas que evitar** | Confundir `401` (no identificado) y `403` (rechazado); devolver `200` con un error en el cuerpo; reintentar en bucle sin esperar; leer solo el formato en segundos de `Retry-After`; reintentar un `4xx` o un `POST` no idempotente; contar `Content-Length` en caracteres. |
| **Buenas prácticas** | Decidir según el código; reintentar solo las averías pasajeras (`429`, `503`), respetando `Retry-After`, o si no, retroceso exponencial con azar, número de intentos y espera máxima acotados; devolver el código exacto y las cabeceras adecuadas en el servidor; comprobar con `curl -i`. |
