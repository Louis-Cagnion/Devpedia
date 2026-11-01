---
order: 24
---

# Recurso REST y autenticación HTTP Basic (31/10/2026)

Un programa (una aplicación móvil, un script, otro servidor) que quiere leer o modificar los datos de un sitio pasa por una [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http): una puerta de entrada en HTTP, hecha para ser usada por un programa más que por una persona. Este capítulo responde a dos preguntas. Cómo describir correctamente lo que expone esa puerta: es el **recurso REST**, que se declara como un [plugin](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) (un fragmento de código independiente que se inscribe por sí mismo en un catálogo central, el **registro**; el detalle viene más abajo). Cómo verificar quién llama a la puerta: es la **autenticación HTTP Basic**, la más sencilla de todas, y hay que conocer con precisión sus límites.

Supone dos conocimientos previos: el [método, la dirección y el código de estado](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) de una petición HTTP, y la diferencia entre [autenticación y autorización](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), que ya presenta HTTP Basic en una sección. Aquí se desmonta pieza por pieza, sobre un servidor realmente ejecutado. Como HTTP Basic envía el identificador en cada petición, la conexión que lo transporta debe estar protegida por TLS: lo que corta la opción que desactiva la verificación se explica en [Desactivar la verificación TLS: lo que la opción realmente desactiva](/?c=securite&s=cybersecurite&p=desactiver-la-verification-tls). Una cabecera de autorización copiada en un registro se trata en [Datos personales en los registros y las copias](/?c=securite&s=cybersecurite&p=donnees-personnelles-dans-les-journaux).

| Noción | Dónde se trata |
|---|---|
| Método, dirección, código de estado | [API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) |
| `401` frente a `403`, primer vistazo a Basic | [Autenticación frente a autorización](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) |
| Contrato, etiqueta y gestor de un plugin | [La arquitectura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| CORS, limitación de tasa en general, clave o token | [Seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Hash, cifrado, comparación de una firma | [Criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) y [Seguridad de los webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |
| Dónde guardar una contraseña o una clave | [Gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| **Aquí** | El recurso y su registro, Basic en detalle, la demostración de que Base64 no protege nada, la comparación en tiempo constante, los intentos limitados, la elección de una alternativa |

## Qué es un recurso REST

**REST** es un estilo de organización de una API: el servidor expone **recursos**, cada uno designado por una dirección, y el cliente actúa sobre ellos con los métodos HTTP habituales. Un **recurso** es una «cosa» que el servidor sabe nombrar: la lista de artículos, un artículo concreto, un usuario. Una **URL** (*Uniform Resource Locator*) es la dirección web que lo designa, por ejemplo `/articulos`. Una **representación** es el texto que el servidor devuelve para describir el recurso, casi siempre en [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (un formato de texto que describe datos con llaves y pares nombre/valor).

La imagen: el recurso es una carpeta etiquetada `/articulos` en una biblioteca. Los métodos son los gestos permitidos sobre esa carpeta (consultarla, añadir una ficha, corregir una ficha, retirar una ficha). La representación es la fotocopia que se le entrega, nunca la carpeta misma.

Una **cabecera** (*header*) es una línea `Nombre: valor` colocada antes del contenido de una petición o de una respuesta; transporta metadatos (el formato, la identidad, la fecha). Por ejemplo, `Accept` indica el formato que desea el cliente, y `Content-Type` el formato del contenido enviado. El siguiente esquema muestra un intercambio completo.

```
Cliente                                     Servidor
  |                                            |
  |  GET /articulos                            |   método + URL
  |  Accept: application/json                  |   cabecera: formato deseado
  | -----------------------------------------> |
  |                                            |   el recurso «articulos»
  |  200 OK                                    |   se encuentra, el método GET
  |  Content-Type: application/json            |   está permitido
  |  [{"id":1,"titulo":"Primer artículo"}]     |   representación (JSON)
  | <----------------------------------------- |
```

| Método | Gesto | ¿Modifica los datos? | ¿Repetible sin efecto adicional (idempotente)? | Éxito típico |
|---|---|---|---|---|
| `GET` | Leer el recurso | No | Sí | `200` |
| `POST` | Crear un elemento en la colección | Sí | No: dos envíos crean dos elementos | `201` (creado) |
| `PUT` | Reemplazar por completo un elemento | Sí | Sí: mismo estado final | `200` o `204` |
| `PATCH` | Corregir una parte de un elemento | Sí | Según cómo se escriba | `200` o `204` |
| `DELETE` | Eliminar un elemento | Sí | Sí: una vez eliminado, sigue eliminado | `204` (sin contenido) |

Un método es **idempotente** cuando enviarlo una vez o diez veces deja los datos en el mismo estado final. Importa cuando una red corta la respuesta: el cliente puede entonces reenviar la petición sin temor a un duplicado, salvo en el caso de `POST`.

| Dirección | Designa | Ejemplo de métodos útiles |
|---|---|---|
| `/articulos` | La colección (la lista) | `GET` para listar, `POST` para añadir |
| `/articulos/2` | Un elemento concreto de la colección | `GET`, `PATCH`, `DELETE` |
| `/salud` | Un recurso de estado del servicio | Solo `GET` |

Último rasgo de REST, de consecuencias importantes aquí: el servidor es **sin estado** (*stateless*). No guarda en memoria «el cliente que acaba de conectarse»: cada petición debe llevar todo lo necesario para ser procesada, **incluida la identidad**. Eso es exactamente lo que hace HTTP Basic, y la razón por la que encaja tan naturalmente con una API.

## Declarar un recurso como plugin

Sin organización, un servidor de API se parece pronto a un archivo central donde cada nueva dirección añade un caso más, con el defecto descrito en [el capítulo sobre la arquitectura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins): el archivo central tiene que conocerlos a todos. El **plugin** invierte la responsabilidad: cada recurso es un fragmento independiente que **se declara** ante un **registro** (el catálogo central de los recursos conocidos). El capítulo citado detalla el contrato, la etiqueta y el gestor; aquí nos limitamos a aplicarlo.

```
   Recursos declarados                 Registro (catálogo)
  +----------------------+           +-----------------------------+
  | articulos            |  declarar | id         ruta             |
  |  GET   permiso       | --------> | articulos  /articulos       |
  |  POST  permiso       |           | salud      /salud           |
  +----------------------+           +--------------+--------------+
  | salud                |                          |
  |  GET   (público)     |      petición GET /articulos
  +----------------------+                          |
                                          1. buscar el recurso por ruta
                                          2. buscar el método en sus reglas
                                          3. comprobar la identidad y el permiso
                                          4. ejecutar la regla, devolver la respuesta
```

| Elemento de la declaración | Función | En el ejemplo de este capítulo |
|---|---|---|
| Identificador | Nombre estable del recurso en el registro | `articulos` |
| Ruta | La URL que lo designa | `/articulos` |
| Métodos | Lista **blanca** de los métodos permitidos (todo lo demás se rechaza) | `GET`, `POST` |
| Permiso por método | Lo que debe tener quien llama para ese método | `leer`, `escribir` |
| Regla de ejecución | La función que produce la respuesta | `responder` |

Dos consecuencias hay que retener. Primero, añadir un recurso no modifica ninguna línea del código central: se declara, y basta. Después, la lista de métodos es un **contrato explícito**: un método ausente de la declaración recibe la respuesta [`405 Method Not Allowed`](https://developer.mozilla.org/es/docs/Web/HTTP/Reference/Status/405) («método no permitido»), acompañada de una cabecera `Allow` que enumera los métodos aceptados. Lo que no está declarado no existe: así se reduce la **superficie de ataque** (el conjunto de puntos por los que se puede atacar el servicio).

## El servidor de ejemplo

Para repetir las manipulaciones hace falta una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) Bash (Linux, macOS o WSL, véase [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base)), [Node.js](https://nodejs.org/en/download) instalado (el comando `node --version` debe mostrar un número) y `curl`, un programa incluido en Linux y macOS que envía peticiones HTTP. Se crea una carpeta de trabajo, se guarda en ella el código siguiente en un archivo `servidor-rest.mjs` (las cinco partes seguidas, en orden), y luego se inicia el servidor en una primera terminal. Los comandos `curl` se escriben en una **segunda** terminal, ya que la primera queda ocupada por el servidor.

Todo lo que sigue procede de un pequeño servidor escrito en [JavaScript](/?c=langages&s=javascript&p=javascript) con el módulo `node:http` de [Node.js](https://nodejs.org/api/http.html) (el entorno que ejecuta JavaScript fuera de un navegador). Escucha en el puerto `7312` (un **puerto** es el número de la puerta de un ordenador por la que escucha un programa) de la dirección `127.0.0.1`: la dirección de su propia máquina, también llamada `localhost`, como en [el servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement). El archivo se divide en cinco partes; cada notación del código se explica en un comentario en su primera aparición, con una referencia al capítulo que la detalla cuando existe: [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions), [los objetos](/?c=langages&s=javascript&p=objets), [los arrays](/?c=langages&s=javascript&p=tableaux), [los errores](/?c=langages&s=javascript&p=gestion-des-erreurs), [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone) y [las regex](/?c=langages&s=javascript&p=regex) (las expresiones regulares).

**Parte 1: las cuentas.** El servidor nunca guarda una contraseña legible: guarda una **sal** (un valor aleatorio propio de cada cuenta, que hace único cada resultado) y una **huella** (el resultado del hash mediante `scrypt`, una función de hash deliberadamente lenta, véase [contraseñas y hash](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). La sal y la huella se miden en **bytes** (un byte es un grupo de 8 bits, véase [los enteros y los bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)). `alice` solo tiene permiso para leer, `bruno` puede leer y escribir.

```javascript
// Un módulo es un archivo de código reutilizable (de ahí la extensión .mjs); import lo carga.
import http from 'node:http';                       // servidor HTTP integrado en Node
// Un byte es un grupo de 8 bits (un bit vale 0 o 1), por tanto un valor de 0 a 255.
// Un Buffer es una secuencia de bytes en bruto.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'; // hash

// ---------- Parte 1: las cuentas ----------
// const nombra un valor; (a, b) => { ... } es una función; return devuelve su resultado.
const crearCuenta = (contrasena, permisos) => {     // fabrica una cuenta registrada
  const sal = randomBytes(16);                       // sal: 16 bytes aleatorios de la cuenta
  // El sufijo Sync de scryptSync: el programa espera al final del cálculo antes de seguir.
  const huella = scryptSync(contrasena, sal, 32);    // hash lento, 32 bytes
  return { sal, huella, permisos };                  // { a, b } es el objeto { a: a, b: b }
};                                                   // nunca la contraseña misma

// new Map([...]) crea un diccionario: asocia una clave a un valor.
// Cada [clave, valor] es un array (una lista) de dos casillas.
const CUENTAS = new Map([                            // usuario => cuenta
  ['alice', crearCuenta('lectura-ok', ['leer'])],    // alice solo puede leer
  ['bruno', crearCuenta('escritura-ok', ['leer', 'escribir'])], // bruno lee y escribe
]);
const CUENTA_FICTICIA = crearCuenta('sin-uso', []); // sirve si el usuario no existe
```

**Parte 2: la autenticación HTTP Basic.** `leerCredenciales` decodifica la cabecera; `autenticar` verifica la contraseña. Cada línea se retomará en las secciones siguientes.

```javascript
// ---------- Parte 2: la autenticación HTTP Basic ----------
// function nombre(parámetro) { ... } declara una función; null significa «ningún valor».
function leerCredenciales(cabecera) {                // cabecera: valor de Authorization
  // La expresión regular /.../i es un patrón de búsqueda: ^ inicio del texto, \s+ unos
  // espacios, (\S+) un grupo de caracteres no blancos, $ fin del texto, i sin distinguir
  // mayúsculas de minúsculas. exec devuelve null si el texto no coincide con el patrón.
  // a ?? b vale a, salvo que a sea null o undefined (ausente): entonces b.
  const encontrado = /^basic\s+(\S+)$/i.exec(cabecera ?? '');
  if (encontrado === null) return null;              // otro esquema, o cabecera ausente
  // encontrado[1] es el texto del grupo (\S+). Base64 es una escritura de bytes con 64
  // caracteres (véase más abajo): Buffer.from(texto, 'base64') los decodifica en bytes, y
  // .toString('utf8') vuelve a leer esos bytes como texto.
  const claro = Buffer.from(encontrado[1], 'base64').toString('utf8'); // base64 -> texto
  const posicion = claro.indexOf(':');               // posición del PRIMER «:» (-1 si no hay)
  if (posicion < 0) return null;                     // sin «:»: cabecera mal formada
  return {
    // slice(a, b) extrae el texto desde la posición a (incluida) hasta b (excluida)
    usuario: claro.slice(0, posicion),               // antes del primer «:»
    contrasena: claro.slice(posicion + 1),           // el resto, otros «:» incluidos
  };
}

function autenticar(cabecera) {                      // devuelve la cuenta, o null
  const leido = leerCredenciales(cabecera);          // usuario y contraseña recibidos
  if (leido === null) return null;                   // cabecera inutilizable
  const conocido = CUENTAS.has(leido.usuario);       // has: ¿existe la clave?
  // get lee el valor asociado a la clave; si no existe, la cuenta ficticia
  const cuenta = CUENTAS.get(leido.usuario) ?? CUENTA_FICTICIA;
  const candidata = scryptSync(leido.contrasena, cuenta.sal, 32); // mismo coste siempre
  // timingSafeEqual compara dos Buffer en tiempo constante (explicado más abajo)
  const igual = timingSafeEqual(candidata, cuenta.huella);
  // a && b: «a y b»; test ? x : y vale x si test es verdadero, si no y;
  // ...cuenta copia en el nuevo objeto todas las propiedades de cuenta.
  return conocido && igual ? { usuario: leido.usuario, ...cuenta } : null;
}
```

**Parte 3: limitar los intentos.** Un contador de fallos por [dirección IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) (el número que identifica una máquina en una red), mantenido en el servidor, dentro de una ventana de sesenta segundos.

```javascript
// ---------- Parte 3: limitar los intentos ----------
const FALLOS = new Map();                            // dirección IP => { cantidad, inicio }
const MAX_FALLOS = 3;                                // fallos tolerados por ventana
const VENTANA_MS = 60_000;                           // 60 s en ms (el _ es un separador)

function bloqueado(direccion) {                      // ¿esta dirección ha fallado demasiado?
  const e = FALLOS.get(direccion);                   // su historial, si existe
  // Date.now() es la hora actual en milisegundos; !== significa «distinto de».
  // ¿Está dentro de la ventana?
  const reciente = e !== undefined && Date.now() - e.inicio < VENTANA_MS;
  return reciente && e.cantidad >= MAX_FALLOS;       // verdadero si se alcanza el tope (>=)
}

function anotarFallo(direccion) {                    // registra un fallo más
  const e = FALLOS.get(direccion);                   // su historial, si existe
  if (e === undefined || Date.now() - e.inicio >= VENTANA_MS) {
    FALLOS.set(direccion, { cantidad: 1, inicio: Date.now() }); // set: ventana nueva
  } else {
    e.cantidad += 1;                                 // += 1: suma 1 al contador
  }
}
```

**Parte 4: el registro de recursos.** Se declaran dos recursos: `articulos` (protegido, dos métodos) y `salud` (público, un método).

```javascript
// ---------- Parte 4: el registro de recursos ----------
const REGISTRO = new Map();                          // identificador => recurso declarado
// r.id lee la propiedad id del objeto r; set(clave, valor) añade una entrada al diccionario.
const declarar = (r) => REGISTRO.set(r.id, r);       // añade un recurso al registro
// [ ... ] es un array (una lista); { clave: valor } es un objeto.
const ARTICULOS = [{ id: 1, titulo: 'Primer artículo' }]; // datos en memoria (demo)

declarar({
  id: 'articulos',                                   // identificador estable del recurso
  ruta: '/articulos',                                // la URL que lo designa
  metodos: {                                         // método HTTP => regla
    // () => ARTICULOS: función sin parámetros que devuelve ARTICULOS
    GET: { permiso: 'leer', responder: () => ARTICULOS }, // lectura: permiso «leer»
    POST: {
      permiso: 'escribir',                           // creación: permiso «escribir»
      responder: (cuerpo) => {                       // cuerpo: el JSON recibido
        const titulo = String(cuerpo.titulo ?? '');  // String(x) fuerza un texto
        const articulo = { id: ARTICULOS.length + 1, titulo }; // length: nº de elementos
        ARTICULOS.push(articulo);                    // push añade al final de la lista
        return articulo;                             // devuelve el artículo creado
      },
    },
  },
});
declarar({
  id: 'salud',                                       // recurso de estado del servicio
  ruta: '/salud',                                    // su URL
  metodos: { GET: { permiso: null, responder: () => ({ estado: 'ok' }) } }, // público
});
```

**Parte 5: el servidor.** `controlar` encadena los controles de identidad; el gestor principal busca el recurso y el método, y luego ejecuta la regla; los códigos de estado como `404` (recurso no encontrado) se presentan en [API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). El formato [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) sirve para los cuerpos: `JSON.stringify` convierte un objeto en texto JSON, y `JSON.parse` hace lo inverso.

```javascript
// ---------- Parte 5: el servidor ----------
// cabeceras = {}: valor por defecto si se omite; ...cabeceras copia sus propiedades.
function responder(res, estado, cuerpo, cabeceras = {}) { // escribe una respuesta JSON
  res.writeHead(estado, { 'Content-Type': 'application/json', ...cabeceras }); // código
  res.end(JSON.stringify(cuerpo));                   // end envía el cuerpo como texto JSON
}

// async: la función puede esperar (await) un resultado que aún no ha llegado, sin bloquear
// el programa; for await lee el flujo de la petición fragmento a fragmento.
// Trampa: aquí no hay límite de tamaño; un servidor real rechaza un cuerpo demasiado grande.
async function leerCuerpo(req) {                     // lee el cuerpo JSON de una petición
  let texto = '';                                    // let: valor modificable (texto leído)
  for await (const fragmento of req) texto += fragmento; // lee el flujo hasta el final
  return texto === '' ? {} : JSON.parse(texto);      // texto vacío: objeto vacío
}

function controlar(req, res, regla) {                // devuelve true si la petición pasa
  const direccion = req.socket.remoteAddress;        // dirección IP del llamante
  if (bloqueado(direccion)) {                        // demasiados fallos recientes
    // 429: demasiadas peticiones; Retry-After: cuántos segundos esperar
    responder(res, 429, { error: 'demasiados intentos' }, { 'Retry-After': '60' });
    return false;
  }
  // Node escribe los nombres de cabecera en minúsculas: authorization es Authorization.
  const cuenta = autenticar(req.headers.authorization); // verifica la cabecera
  if (cuenta === null) {                             // ausente o inválida: el desafío
    if (req.headers.authorization !== undefined) anotarFallo(direccion); // intento real
    responder(res, 401, { error: 'autenticación requerida' },
      { 'WWW-Authenticate': 'Basic realm="demo", charset="UTF-8"' });
    return false;
  }
  // includes: ¿contiene el array este permiso? ! significa «no».
  if (!cuenta.permisos.includes(regla.permiso)) {    // identificado, pero sin permiso
    responder(res, 403, { error: 'permiso faltante' });
    return false;
  }
  return true;                                       // identificado y autorizado
}

// createServer recibe la función que se llama en cada petición; req es la petición
// recibida, res la respuesta que escribir.
const servidor = http.createServer(async (req, res) => {
  // new URL(dirección, base) descompone una dirección; pathname es su ruta, sin parámetros.
  const ruta = new URL(req.url, 'http://x').pathname;
  // res.on('finish', f) llama a f cuando la respuesta se ha enviado; console.log escribe
  // una línea en la terminal; `...${x}...` (acentos graves) inserta el valor de x.
  res.on('finish', () => console.log(`${req.method} ${ruta} -> ${res.statusCode}`));
  // [...REGISTRO.values()] crea una lista de los recursos; find(f) devuelve el primer
  // elemento para el que f es verdadera, si no undefined.
  const recurso = [...REGISTRO.values()].find((r) => r.ruta === ruta);
  // 404: recurso no encontrado
  if (recurso === undefined) return responder(res, 404, { error: 'recurso desconocido' });
  const regla = recurso.metodos[req.method];         // la regla de este método
  if (regla === undefined) {                         // método no declarado
    // Object.keys lista los nombres de las propiedades; join(', ') los une en un texto
    const permitidos = Object.keys(recurso.metodos).join(', ');
    return responder(res, 405, { error: 'método rechazado' }, { Allow: permitidos });
  }
  if (regla.permiso !== null && !controlar(req, res, regla)) return; // protegido
  // try { ... } catch { ... }: si ocurre un error en try, el programa salta a catch
  try {
    const cuerpo = req.method === 'POST' ? await leerCuerpo(req) : {}; // escrituras
    responder(res, req.method === 'POST' ? 201 : 200, regla.responder(cuerpo));
  } catch {
    responder(res, 400, { error: 'JSON no válido' }); // cuerpo ilegible
  }
});

servidor.listen(7312, '127.0.0.1');                  // puerto local únicamente
```

El servidor se inicia en la primera terminal con `timeout 100 node servidor-rest.mjs`; el comando `timeout` (incluido en Linux) lo detiene solo al cabo de cien segundos; sin `timeout` (en macOS, por ejemplo), se lanza `node servidor-rest.mjs` y se detiene con Ctrl+C. Registra una línea por petición (método, ruta, código de respuesta) y **nunca** la cabecera de identidad, una elección que importa; volveremos sobre ello.

## El diálogo HTTP Basic, petición a petición

El método está descrito por la norma [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) (una **RFC**, *Request for Comments*, es un documento de referencia que define un estándar de Internet). El cliente utilizado es `curl`, el programa de terminal que envía peticiones HTTP (véase la [documentación de curl](https://curl.se/docs/manpage.html)). En los bloques siguientes, el `$` al inicio de la línea es el indicador del terminal: se lee pero no se escribe, y las líneas sin `$` son la respuesta mostrada. Las líneas `Date`, `Connection`, `Keep-Alive` y `Transfer-Encoding`, sin interés aquí, se han quitado de las salidas copiadas.

| Opción de `curl` | Efecto |
|---|---|
| `-i` | Muestra las cabeceras de la respuesta antes de su contenido |
| `-s` | Silencioso: suprime la barra de progreso |
| `-u usuario:contrasena` | Proporciona las credenciales (curl fabrica la cabecera `Authorization`) |

Otras opciones se explican donde se usan por primera vez (`-v`, `-o`, `-X`, `-d`, `-w`, `--anyauth`, `--netrc-file`).

```
Cliente                                        Servidor
  |  GET /articulos                              |
  | --------------------------------------------> |  sin cabecera Authorization
  |  401 Unauthorized                            |
  |  WWW-Authenticate: Basic realm="demo"        |  el desafío: «demuestre su identidad»
  | <-------------------------------------------- |
  |  GET /articulos                              |
  |  Authorization: Basic YWxpY2U6bGVj...        |  usuario:contraseña en Base64
  | --------------------------------------------> |
  |  200 OK  + representación                    |  identidad verificada, permiso presente
  | <-------------------------------------------- |
```

**Sin credenciales.** La petición no lleva cabecera `Authorization`:

```
$ curl -i http://127.0.0.1:7312/articulos
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"error":"autenticación requerida"}
```

El código `401` es la respuesta «no sé quién es usted». La cabecera `WWW-Authenticate` es el **desafío**: nombra el método esperado (`Basic`), el `realm` (el nombre de la zona protegida, que el navegador muestra en su ventana de conexión) y el juego de caracteres de las credenciales (`UTF-8`, la norma que codifica las letras acentuadas, véase [la codificación de los textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

**Con una contraseña incorrecta.**

```
$ curl -i -u alice:falso http://127.0.0.1:7312/articulos
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"error":"autenticación requerida"}
```

La respuesta es **idéntica** a la anterior, y es intencionado: no dice si el usuario existe, si la contraseña es incorrecta ni si la cabecera está mal formada. Un mensaje más locuaz («contraseña incorrecta para alice») confirmaría a un atacante que `alice` es una cuenta real: es la **enumeración de cuentas**, que consiste en elaborar la lista de identificadores válidos para luego concentrar los ataques en ellos.

**Con las credenciales correctas.**

```
$ curl -i -u alice:lectura-ok http://127.0.0.1:7312/articulos
HTTP/1.1 200 OK
Content-Type: application/json

[{"id":1,"titulo":"Primer artículo"}]
```

Esta es la anatomía de la cabecera que `curl` acaba de enviar:

| Paso | Resultado para `alice` y `lectura-ok` |
|---|---|
| 1. Unir `usuario:contraseña` con dos puntos | `alice:lectura-ok` |
| 2. Codificar ese texto en bytes (UTF-8) y luego en Base64 | `YWxpY2U6bGVjdHVyYS1vaw==` |
| 3. Anteponer la palabra `Basic` y un espacio | `Basic YWxpY2U6bGVjdHVyYS1vaw==` |
| 4. Colocar todo en la cabecera `Authorization` | `Authorization: Basic YWxpY2U6bGVjdHVyYS1vaw==` |

El primer dos puntos separa el usuario de la contraseña, de ahí una regla de la norma: **un usuario no puede contener dos puntos**, mientras que una contraseña sí puede. Es la razón de `claro.indexOf(':')` en la parte 2, que corta solo en el primer dos puntos.

### Quién envía la cabecera, y cuándo

En la salida anterior, `curl -u` envió la cabecera **de inmediato**, sin esperar el desafío. Un navegador, en cambio, todavía no conoce las credenciales: envía una petición desnuda, recibe el `401` y su `WWW-Authenticate`, muestra su ventana de conexión y reenvía la petición con la cabecera. La opción `--anyauth` de `curl` reproduce ese comportamiento. Para ver los intercambios, se añade `-v` (*verbose*, «hablador»: muestra cada línea enviada y recibida; `-sv` agrupa `-s` y `-v`) y `-o /dev/null` (`-o` escribe el contenido de la respuesta en un archivo, y `/dev/null` es el archivo «papelera» de Linux que descarta todo, para quedarse solo con la traza). La traza muestra los dos ida y vuelta:

```
$ curl -sv --anyauth -u bruno:escritura-ok http://127.0.0.1:7312/articulos -o /dev/null
> GET /articulos HTTP/1.1
< HTTP/1.1 401 Unauthorized
< WWW-Authenticate: Basic realm="demo", charset="UTF-8"
> GET /articulos HTTP/1.1
> Authorization: Basic YnJ1bm86ZXNjcml0dXJhLW9r
< HTTP/1.1 200 OK
```

(Las líneas que empiezan por `>` las envía el cliente; las que llevan `<` las recibe. Solo se han conservado las líneas útiles.)

| Cliente | Primer envío | Consecuencia |
|---|---|---|
| `curl -u` | Con la cabecera `Authorization` | Un solo ida y vuelta, pero la contraseña sale incluso hacia un servidor que no la pedía |
| `curl --anyauth`, navegador | Sin cabecera, y reenvío tras el `401` | Dos ida y vuelta; la contraseña sale solo si el servidor la reclama |

## Base64 no es cifrado

El capítulo sobre [la autenticación y la autorización](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) lo afirma; aquí está la prueba. **Base64** es una forma de escribir bytes con solo 64 caracteres seguros (las letras, los dígitos, `+` y `/`), para que atraviesen sin daño los protocolos hechos para texto. Tres bytes se convierten en cuatro caracteres; uno o dos `=` al final del texto completan el último grupo (el **relleno**). No hay clave, ni secreto, ni cálculo difícil: es una tabla de correspondencias.

Lo que ve pasar un observador, al repetir la petición con `curl -v`:

```
$ curl -sv -u alice:lectura-ok http://127.0.0.1:7312/articulos -o /dev/null
> GET /articulos HTTP/1.1
> Authorization: Basic YWxpY2U6bGVjdHVyYS1vaw==
```

Y lo que hace después, sin ninguna clave, con el comando `base64` (incluido en Linux; `-d` significa *decode*, decodificar). `echo 'texto'` muestra el texto; `printf` hace lo mismo sin añadir un salto de línea final, que cambiaría el Base64; la **tubería** `|` envía lo que muestra el comando de la izquierda al comando de la derecha (véase [las redirecciones y las tuberías](/?c=langages&s=bash&p=redirections-et-pipes)):

```
$ echo 'YWxpY2U6bGVjdHVyYS1vaw==' | base64 -d
alice:lectura-ok
$ printf 'alice:lectura-ok' | base64
YWxpY2U6bGVjdHVyYS1vaw==
```

El usuario **y** la contraseña aparecen en claro, y el camino inverso devuelve exactamente el texto transmitido. La misma decodificación se escribe en Node con `Buffer.from(texto, 'base64').toString('utf8')`, lo que hace la línea `Buffer.from(encontrado[1], 'base64')` de la parte 2: el propio servidor no necesita ningún secreto para leer la cabecera, así que tampoco cualquiera.

| | Codificación (Base64) | Hash | Cifrado |
|---|---|---|---|
| ¿Reversible? | Sí, por cualquiera | No | Sí, solo con la clave |
| ¿Clave o secreto? | Ninguno | Ninguno (a veces una sal) | Sí |
| Finalidad | Hacer pasar bytes por texto | Verificar o comparar sin guardar el dato | Volver ilegible para quien no tiene la clave |
| ¿Protege una contraseña en tránsito? | **No** | No (el servidor debe recibir la contraseña) | Sí, es la función de TLS |

La distinción hash / cifrado se desarrolla en [Criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

### La única protección: HTTPS

**HTTPS** es HTTP dentro de un túnel cifrado por **TLS** (*Transport Layer Security*, el protocolo que cifra la conexión entre el cliente y el servidor; véase [el certificado TLS](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Con HTTPS, la cabecera `Authorization` viaja cifrada junto con el resto de la petición. El **certificado** es el documento de identidad digital del servidor, que el cliente verifica: sin esa verificación, un intermediario puede hacerse pasar por el servidor y leer lo que el cliente le envía.

```
HTTP (puerto 80)                                HTTPS (puerto 443)

Cliente -- Authorization: Basic YWxp... -->     Cliente -- bytes ilegibles (TLS) -->
          ^                                               ^
   legible por cada máquina del trayecto           solo el servidor puede leerlos
   (Wi-Fi público, router, proxy...)               (si el certificado está verificado)
```

> **Trampa:** redirigir `http://` a `https://` creyendo que el problema queda resuelto. Un cliente como `curl -u` envía la cabecera desde la **primera** petición, es decir en claro, antes incluso de leer la redirección. La contraseña ya ha viajado.
>
> **Buena práctica:** no escuchar nunca en HTTP simple una API que acepta Basic (o rechazar toda petición que lleve un `Authorization` fuera de TLS), y considerar comprometida una contraseña que alguna vez ha circulado sin TLS.

El servidor de ejemplo escucha en HTTP simple porque solo responde en `127.0.0.1` (su propia máquina), donde nada circula por una red: es un compromiso de demostración, nunca un modelo de despliegue.

## Los límites propios de HTTP Basic

Estos límites no son defectos de una implementación: se derivan del principio de Basic.

| Límite | Por qué | Consecuencia concreta |
|---|---|---|
| Sin cierre de sesión | El servidor no guarda ninguna sesión que cerrar; el cliente reenvía las credenciales mientras las conozca | Cerrar una pestaña no basta siempre, y el servidor no puede «expulsar» a un cliente sin cambiar la contraseña |
| Credenciales reenviadas en **cada** petición | Servidor sin estado: la identidad acompaña cada envío | Cada petición es una ocasión de fuga, y cada petición vuelve a lanzar un cálculo de verificación |
| Sin caducidad | La contraseña vale mientras no se cambie | Una credencial robada sigue utilizable durante meses |
| Secreto principal expuesto | Viaja la verdadera contraseña de la cuenta, no un token desechable | Una fuga compromete también los demás usos de la cuenta |
| Sin segundo factor | Un solo secreto, enviado en un solo mensaje | Imposible exigir un código temporal (véase [la autenticación multifactor](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)) |
| Trazas involuntarias | La cabecera puede ser copiada por herramientas intermedias | Véase el esquema siguiente |

```
 Equipo del desarrollador        Red                      Servidor
+--------------------+     +----------------+     +----------------------+
| historial shell    |     | proxy, corta-  |     | registro de acceso   |
| (curl -u u:clave)  | --> | fuegos que     | --> | (si la cabecera se   |
| depuración         |     | registra el    |     | copia en él), de     |
| captura de pantalla|     | tráfico        |     | vigilancia, copia    |
+--------------------+     +----------------+     | de seguridad         |
                                                  +----------------------+
 Cada recuadro puede guardar una copia de la contraseña.
```

Un **proxy** es un servidor intermedio por el que pasan las peticiones (a menudo en una empresa), un **cortafuegos** un dispositivo que filtra el tráfico de red; un **registro** (*log*) es el archivo donde un programa anota lo ocurrido, véase [los registros centralizados](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs). El servidor de ejemplo solo escribe `GET /articulos -> 401`: no hay nada que filtrar. Un servidor configurado para copiar todas las cabeceras en sus registros, en cambio, deposita en ellos contraseñas válidas.

La terminal es el caso más descuidado: teclear `curl -u alice:lectura-ok ...` escribe la contraseña en el historial de comandos, y la deja también visible un instante en la lista de programas en curso (el comando `ps` la muestra, con los argumentos de cada uno). Un archivo de credenciales leído por `curl` evita las dos cosas. Su formato es el de los archivos **netrc** (véase la opción [`--netrc-file`](https://curl.se/docs/manpage.html#--netrc-file) de curl): `machine` es el nombre o la dirección del servidor, `login` el usuario y `password` la contraseña. Este archivo se crea con un editor de texto (crearlo con `echo` volvería a meter la contraseña en el historial):

```
$ cat netrc-demo
machine 127.0.0.1 login alice password lectura-ok
$ chmod 600 netrc-demo
$ curl -si --netrc-file netrc-demo http://127.0.0.1:7312/articulos | head -1
HTTP/1.1 200 OK
```

`cat` muestra el contenido de un archivo. `chmod 600` reserva el archivo a su propietario (véanse [los permisos de archivos](/?c=langages&s=bash&p=permissions-et-fichiers)). `head -1` conserva solo la primera línea de la respuesta, aquí la línea de estado (véanse [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base) y [las tuberías](/?c=langages&s=bash&p=redirections-et-pipes)). En un despliegue real, el secreto no permanece en ningún archivo del repositorio: véase [la gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

## Autenticación y autorización: dos controles distintos

El servidor encadena sus verificaciones en un orden preciso, que materializa la función `controlar` de la parte 5:

```
petición
   |
   v
¿recurso conocido?  -- no --> 404 Not Found (no encontrado)
   |
   v
¿método declarado?  -- no --> 405 Method Not Allowed (+ Allow)
   |
   v
¿recurso protegido? -- no --> ejecutar
   |
   v
¿demasiados fallos recientes? -- sí --> 429 Too Many Requests (+ Retry-After)
   |
   v
¿identidad válida?  -- no --> 401 Unauthorized (+ WWW-Authenticate)
   |
   v
¿permiso presente?  -- no --> 403 Forbidden
   |
   v
ejecutar la regla -> 200 o 201
```

Las respuestas reales a cuatro casos: `alice` (solo permiso `leer`) intenta escribir, `bruno` (permiso `escribir`) escribe, `bruno` prueba un método no declarado, y una llamada sin credenciales apunta al recurso público `/salud`. Nuevas opciones de `curl`: `-X MÉTODO` elige el método HTTP, `-d 'texto'` proporciona el cuerpo de la petición. En el shell, una `\` al final de la línea indica que el comando continúa en la línea siguiente, donde la terminal muestra entonces el indicador `>` (que no hay que escribir).

```
$ curl -i -u alice:lectura-ok -X POST -d '{"titulo":"Intruso"}' \
>   http://127.0.0.1:7312/articulos
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"error":"permiso faltante"}

$ curl -i -u bruno:escritura-ok -X POST -d '{"titulo":"Segundo artículo"}' \
>   http://127.0.0.1:7312/articulos
HTTP/1.1 201 Created
Content-Type: application/json

{"id":2,"titulo":"Segundo artículo"}

$ curl -i -u bruno:escritura-ok -X DELETE http://127.0.0.1:7312/articulos
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json
Allow: GET, POST

{"error":"método rechazado"}

$ curl -i http://127.0.0.1:7312/salud
HTTP/1.1 200 OK
Content-Type: application/json

{"estado":"ok"}
```

`alice` está perfectamente autenticada en el primer caso (su contraseña es correcta) y, sin embargo, rechazada: el `403` indica que el servidor sabe quién es ella y le niega ese gesto. Incluso con los derechos más amplios, `bruno` no puede llamar a un método que el recurso no declara. Por último, `/salud` declara `permiso: null`: el recurso es **público** por una elección puesta por escrito, no por descuido.

| Código | Pregunta a la que responde | Se corrige en... |
|---|---|---|
| `401` | ¿Quién es usted? | Aportando credenciales válidas |
| `403` | ¿Tiene derecho a hacer esto? | Cambiando los permisos, nunca la contraseña |
| `405` | ¿Existe este método en este recurso? | Usando un método de la lista `Allow` |
| `429` | ¿Ha vuelto a intentarlo con demasiada frecuencia? | Esperando la duración de `Retry-After` |

Para agrupar los permisos en perfiles, véase [RBAC y ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac). Un punto que decidir con conocimiento de causa: en este ejemplo, los controles `404` y `405` pasan antes de la autenticación, así que un desconocido aprende qué direcciones y qué métodos existen. Para una API donde esa información es en sí misma sensible, se autentica primero y se responde `401` en todas partes.

## Comparar los secretos en tiempo constante

Comparar la contraseña recibida con la esperada parece trivial: `recibido === esperado`. Pero el operador de igualdad de un lenguaje se detiene en **la primera diferencia**. Cuanto más se parecen los dos textos al principio, más dura la comparación. El pequeño programa siguiente cuenta los caracteres examinados por una comparación clásica:

Archivo `comparacion.mjs` (guardarlo en la misma carpeta y luego ejecutarlo con `node comparacion.mjs`):

```javascript
import { timingSafeEqual } from 'node:crypto';          // comparación en tiempo constante

// Math.min(x, y) es el menor de los dos números; a[i] es el carácter de rango i
// (el primero tiene el rango 0); a.length es el número de caracteres del texto a.
function compararIngenuo(a, b) {                        // comparación «clásica»
  let comparados = 0;                                   // caracteres examinados hasta ahora
  // for (inicio; condición; paso) repite mientras la condición sea verdadera; i++ suma 1
  for (let i = 0; i < Math.min(a.length, b.length); i++) { // del primero al último
    comparados += 1;                                    // un carácter más examinado
    if (a[i] !== b[i]) return { igual: false, comparados }; // parada en la primera diferencia
  }
  return { igual: a.length === b.length, comparados };  // todo idéntico: ¿misma longitud?
}

const secreto = 'lectura-ok';                           // el secreto que adivinar
// for (const x of lista) repite el bloque para cada elemento de la lista
for (const intento of ['xxxxxxxxxx', 'lxxxxxxxxx', 'lecturaxxx', 'lectura-ok']) {
  const r = compararIngenuo(intento, secreto);          // resultado de la comparación
  console.log(intento, '->', r.igual, '| caracteres examinados:', r.comparados);
}

// try { ... } catch (error) { ... }: si try lanza un error, catch lo recibe
try {
  timingSafeEqual(Buffer.from('abcd'), Buffer.from(secreto)); // 4 bytes contra 10
} catch (error) {
  console.log(error.code);                              // la función se niega a comparar
}
```

Resultado obtenido en la ejecución (las cuatro primeras líneas para la comparación clásica, la última para `timingSafeEqual`):

```
$ node comparacion.mjs
xxxxxxxxxx -> false | caracteres examinados: 1
lxxxxxxxxx -> false | caracteres examinados: 2
lecturaxxx -> false | caracteres examinados: 8
lectura-ok -> true | caracteres examinados: 10
ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH
```

La duración de la comparación **revela** la longitud del prefijo exacto. Un **ataque por cronometraje** (*timing attack*) aprovecha esto: el atacante envía un número muy grande de intentos, mide los tiempos de respuesta y descubre el secreto carácter a carácter. A través de una red, la medida es ruidosa y el ataque necesita muchos intentos; se vuelve realista en una red local o con suficientes repeticiones, y la defensa casi no cuesta nada, por eso se aplica siempre.

| Lenguaje | Comparación en tiempo constante | Precaución |
|---|---|---|
| Node.js | `crypto.timingSafeEqual(a, b)` (véase la [documentación de Node](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)) | Exige dos `Buffer` de **igual tamaño**, si no lanza un error |
| PHP | [`hash_equals($esperado, $recibido)`](https://www.php.net/manual/es/function.hash-equals.php) | Poner el valor de confianza como primer argumento |
| Python | [`hmac.compare_digest(a, b)`](https://docs.python.org/3/library/hmac.html#hmac.compare_digest) | Dos textos o dos secuencias de bytes del mismo tipo; para textos, la documentación los limita a caracteres ASCII (letras sin tilde, dígitos, puntuación básica) |

El mismo reflejo sirve para las firmas de [webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) y de [HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

La trampa propia de `timingSafeEqual` es su exigencia de tamaño: comparar una contraseña de 4 caracteres con un secreto de 10 lanza un error (la última línea de arriba, `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`), y ese error delata la longitud del secreto.

La defensa, aplicada en la parte 2: nunca se comparan **las contraseñas en sí**, sino sus huellas `scrypt`, siempre de 32 bytes. El atacante no controla el principio de la huella (un carácter más en su intento cambia toda la huella), de modo que incluso una comparación ingenua no le enseñaría nada; `timingSafeEqual` añade una garantía más.

Segundo detalle de la parte 2: cuando el usuario es desconocido, el servidor calcula **igualmente** una huella, contra una `CUENTA_FICTICIA`. Sin eso, un usuario inexistente sería rechazado al instante, y un usuario real tras un cálculo lento, lo que permitiría la enumeración de cuentas midiendo los tiempos. Esta lentitud buscada de `scrypt` tiene un coste: cada intento consume procesador, lo que alimenta los [ataques por saturación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Por eso el control del número de fallos pasa **antes** del cálculo.

## Limitar los intentos

Un atacante que puede probar una contraseña por milisegundo probará millones: es la **fuerza bruta** (*brute force*), el ensayo metódico de un número enorme de valores hasta acertar. El servidor cuenta, pues, los fallos por dirección IP (parte 3) y, a partir de tres en una ventana de sesenta segundos, responde `429 Too Many Requests` («demasiadas peticiones») con una cabecera `Retry-After: 60` («vuelva a intentarlo dentro de sesenta segundos»). Tres intentos erróneos seguidos, y luego la contraseña **correcta**. La primera orden es un [bucle](/?c=langages&s=bash&p=boucles): `for i in 1 2 3; do ...; done` repite lo que hay entre `do` y `done` dando a `i` los valores 1, 2 y 3, y `$i` inserta ese valor. La opción `-w "intento $i : %{http_code}\n"` pide a `curl` que muestre, tras la respuesta, ese texto, donde `%{http_code}` se sustituye por el código de estado y `\n` es un salto de línea; `-o /dev/null` descarta el contenido de la respuesta.

```
$ for i in 1 2 3; do curl -s -o /dev/null -w "intento $i : %{http_code}\n" \
>   -u alice:falso$i http://127.0.0.1:7312/articulos; done
intento 1 : 401
intento 2 : 401
intento 3 : 429

$ curl -i -u alice:lectura-ok http://127.0.0.1:7312/articulos
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{"error":"demasiados intentos"}
```

(Un primer intento erróneo ya se había contado más arriba en la sesión: el contador llega, pues, a tres desde el segundo intento de la ráfaga, y el tercero se rechaza antes de cualquier verificación. Las peticiones **sin** cabecera `Authorization`, primer intercambio normal del desafío, no cuentan.) Incluso la contraseña correcta sigue rechazada mientras no pase la ventana: es la regla, y es lo que vuelve impracticables los ensayos masivos de contraseñas.

| Clave del contador | Protege contra | Riesgo |
|---|---|---|
| Por dirección IP | Un atacante que prueba muchas cuentas desde una misma máquina | Varios usuarios detrás de la misma dirección (una empresa) se bloquean mutuamente; un atacante que cambia de dirección lo elude |
| Por cuenta | Un atacante que apunta a una cuenta desde muchas direcciones | Puede **bloquear a propósito** una cuenta legítima fallando adrede: es una **denegación de servicio** (dejar un servicio inutilizable para los demás, véase [sobrecarga y denegación de servicio](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Ambas, con topes distintos | Los dos escenarios | Más reglas que ajustar y vigilar |

Cuatro trampas propias de esta implementación, todas reales en producción:

| Trampa | Por qué | Defensa |
|---|---|---|
| Servidor colocado detrás de un proxy inverso (un servidor frontal que recibe las peticiones en su lugar y se las reenvía) | `remoteAddress` es entonces la dirección del proxy, para todos los clientes: todos comparten un solo contador | Leer la dirección de origen que el proxy transmite en la cabecera [`X-Forwarded-For`](https://developer.mozilla.org/es/docs/Web/HTTP/Reference/Headers/X-Forwarded-For), y solo si el proxy es de confianza (si no, cualquier cliente puede escribir la dirección que quiera) |
| Contador guardado en la memoria del proceso | Se pierde en cada reinicio, y es propio de cada instancia si varias se ejecutan | Un almacenamiento compartido: una base de datos o una **caché** (una memoria rápida que guarda datos ya obtenidos) |
| Contador que nunca se vacía | Bloquea duraderamente a un usuario legítimo | Una ventana, como aquí, o un retraso creciente |
| Contador mantenido en el cliente | El cliente puede simplemente ignorarlo | Siempre en el servidor, véase [la seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web) |

## Las alternativas a HTTP Basic

| Mecanismo | Lo que viaja en cada petición | ¿Caduca? | ¿Revocable por sí solo? | Adecuado para | Capítulo |
|---|---|---|---|---|---|
| HTTP Basic | Usuario y **contraseña** | No | No (hay que cambiar la contraseña) | Script interno, herramienta de administración, detrás de HTTPS | Este capítulo |
| Clave de API | Un valor secreto largo ligado a una cuenta o a una aplicación | Raramente | Sí, se elimina la clave | Un servicio de terceros, un acceso servidor a servidor | [Seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Sesión y cookie | Un identificador de sesión elegido por el servidor | Sí | Sí, el servidor olvida la sesión | Un usuario humano en un navegador | [Sesiones y cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Token firmado (JWT) | Un token que contiene su propia información | Sí | Con dificultad antes de la caducidad | Una API consumida por una aplicación | [JWT y tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) |
| OAuth 2.0 | Un token de acceso emitido por un servidor de autorización | Sí | Sí | Dar acceso limitado a una aplicación de terceros sin compartir la contraseña | [OAuth 2.0 y OpenID Connect](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |
| Firma HMAC | Una firma calculada con un secreto compartido | Con una marca de tiempo (la fecha y la hora están incluidas en la firma) | Sí, se cambia el secreto | Una llamada de un sistema a otro, como un webhook | [Seguridad de los webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |

| Situación | Elección razonable |
|---|---|
| Un script de copia de seguridad interno llama a una API de administración por HTTPS | Basic con una cuenta **dedicada**, de permisos mínimos, y una contraseña larga generada al azar (véase [lo aleatorio](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) |
| Una aplicación móvil llama a la API en nombre de un usuario | Token de duración limitada, nunca la contraseña del usuario en cada petición |
| Un sitio de terceros necesita leer datos de un usuario | OAuth 2.0 |
| Un socio envía eventos automáticos | Firma HMAC |

## Ejemplo en Drupal: el módulo REST y el proveedor `basic_auth`

> **Este ejemplo es propio de Drupal, y su forma depende de la versión.** [Drupal](https://www.drupal.org) es un sistema de gestión de contenidos escrito en [PHP](/?c=langages&s=php&p=php) (un programa que permite construir y administrar un sitio web). No está instalado en el entorno que sirvió para escribir este capítulo: el código PHP siguiente no se ha ejecutado, solo se ha comprobado su sintaxis (con `php -l`, el comando de PHP que verifica un archivo sin ejecutarlo). Los nombres propios de Drupal se han confrontado con su documentación oficial ([api.drupal.org](https://api.drupal.org), rama 11.x, y [drupal.org](https://www.drupal.org/docs/drupal-apis/restful-web-services-api)). Lo más sensible a las versiones es la forma de declarar el plugin: un **atributo** PHP `#[RestResource]` en las versiones recientes (lo presenta la documentación de API de Drupal 10.3 y 11), una **anotación** `@RestResource` en las versiones anteriores (Drupal 8 a 10). Compruebe la versión de su sitio antes de copiar. El resto del capítulo no depende de ello.

Drupal propone los mismos componentes, con otros nombres. Un recurso es allí un **plugin** (véase [la arquitectura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins), que cita precisamente los recursos de API entre los tipos de plugins de ese programa) cuya etiqueta es el atributo `#[RestResource]` colocado justo encima de la clase.

| Concepto del capítulo | Elemento de Drupal |
|---|---|
| El registro de recursos | El gestor de plugins de recursos REST, alimentado por las clases de la carpeta `Plugin/rest/resource` de un módulo |
| La declaración de un recurso | Una clase que extiende `ResourceBase`, etiquetada con el atributo `#[RestResource(id, label, uri_paths)]` (o, antes, con la anotación `@RestResource(...)`) |
| Los métodos `GET` y `POST` | Los métodos PHP `get()` y `post()` de la clase (igual que `patch()` y `delete()`) |
| Los métodos y formatos activados, la autenticación aceptada | Una configuración `rest.resource.<identificador>` que enumera `methods`, `formats` y `authentication`; sin ella, el recurso no está disponible |
| El proveedor de autenticación Basic | El módulo `basic_auth`, referenciado por el identificador `basic_auth` |
| Los permisos por método | Permisos que `ResourceBase` genera para cada método, con la forma `restful get ejemplo_articulos`, para asignar a los roles |

```php
<?php

namespace Drupal\ejemplo_api\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup; // un texto traducible
use Drupal\rest\Attribute\RestResource;   // el atributo que declara el recurso
use Drupal\rest\Plugin\ResourceBase;      // clase madre de los recursos REST
use Drupal\rest\ResourceResponse;         // la respuesta devuelta por un recurso

/**
 * Expone una lista de artículos de ejemplo.
 */
#[RestResource(
  id: 'ejemplo_articulos',
  label: new TranslatableMarkup("Artículos de ejemplo"),
  uri_paths: [
    'canonical' => '/api/ejemplo/articulos',
    'create' => '/api/ejemplo/articulos',
  ],
)]
class ArticulosResource extends ResourceBase {

  /**
   * Responde a GET: devuelve la lista.
   */
  public function get(): ResourceResponse {
    $articulos = [['id' => 1, 'titulo' => 'Primer artículo']];  // datos de ejemplo
    return new ResourceResponse($articulos);                    // 200 y la lista en JSON
  }

  /**
   * Responde a POST: crea un artículo.
   */
  public function post(array $datos): ResourceResponse {
    // ?? : el valor de la izquierda, salvo que esté ausente; (string) fuerza un texto
    $titulo = (string) ($datos['titulo'] ?? '');                // lee el título recibido
    return new ResourceResponse(['id' => 2, 'titulo' => $titulo], 201); // 201: creado
  }

}
```

Un **atributo** PHP es una línea especial `#[...]`, colocada justo antes de la clase, que el gestor de plugins lee para descubrir el recurso: `id` lo nombra, `label` da su nombre legible, `uri_paths` asocia el recurso a sus direcciones (`canonical` para un elemento, `create` para la creación). `namespace` ubica la clase en un espacio de nombres, `use` importa una clase de otro espacio, y `extends` hace que herede de `ResourceBase`; véase [la programación orientada a objetos en PHP](/?c=langages&s=php&p=poo). En una versión más antigua de Drupal, la misma declaración se escribe con una **anotación**, un comentario especial encima de la clase, sin el `use` de `RestResource` ni el de `TranslatableMarkup` (este último pasa a ser `@Translation`):

```php
/**
 * Expone una lista de artículos de ejemplo.
 *
 * @RestResource(
 *   id = "ejemplo_articulos",
 *   label = @Translation("Artículos de ejemplo"),
 *   uri_paths = {
 *     "canonical" = "/api/ejemplo/articulos",
 *     "create" = "/api/ejemplo/articulos"
 *   }
 * )
 */
```

La segunda pieza activa el recurso y elige su autenticación. Es un archivo de configuración en formato [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) (un formato de texto basado en la sangría), de la misma estructura que la configuración del recurso `entity.node` incluida en el módulo REST de Drupal:

```yaml
id: ejemplo_articulos          # identificador de la configuración
plugin_id: ejemplo_articulos   # el plugin de recurso que activa
status: true                   # el recurso está activado
granularity: resource          # un ajuste para todo el recurso (no por método)
configuration:
  methods:                     # lista blanca de los métodos activados
    - GET
    - POST
  formats:                     # representaciones aceptadas
    - json
  authentication:              # proveedores de autenticación aceptados
    - basic_auth
```

Tres advertencias de prudencia. Primero, esta configuración solo vale si el módulo `basic_auth` está activado. Después, el proveedor `basic_auth` de Drupal aplica ya su propia limitación de los intentos fallidos (el servicio «flood», ajustado con la configuración `user.flood`: topes y duraciones por dirección IP y por cuenta, en el código de la rama 11.x): antes de escribir a mano la limitación vista más arriba, compruebe esos ajustes. Por último, el formato de la respuesta se elige en la dirección: la documentación de Drupal indica que la cabecera `Accept` ya no se admite y que hay que usar siempre el parámetro `_format`, de ahí una llamada del tipo `curl -u usuario:contrasena 'https://ejemplo.test/api/ejemplo/articulos?_format=json'` (`ejemplo.test` es un nombre de ejemplo), con exactamente los mismos límites que antes: Base64 transparente, HTTPS obligatorio, contraseña de la cuenta en cada petición. Para la documentación oficial, véase [la API de los servicios web RESTful de Drupal](https://www.drupal.org/docs/drupal-apis/restful-web-services-api).

## Las trampas

| Trampa | Por qué es un problema | Reflejo |
|---|---|---|
| Creer que Base64 protege las credenciales | Cualquiera lo decodifica con un comando, sin clave | HTTPS obligatorio, nunca Basic en claro |
| Redirigir `http://` a `https://` | El primer envío ya ha expuesto la contraseña | No escuchar en HTTP, o rechazar todo `Authorization` fuera de TLS |
| Comparar el secreto con `===` o `==` | La duración de la comparación revela el prefijo exacto | `timingSafeEqual`, `hash_equals` o `compare_digest` |
| `timingSafeEqual` con tamaños distintos | El error lanzado revela la longitud | Comparar huellas de tamaño fijo |
| Mensaje de error que precisa «contraseña incorrecta» o «cuenta desconocida» | Permite elaborar la lista de cuentas válidas | Una única respuesta `401` para todos los fallos |
| Usuario desconocido rechazado sin cálculo | La diferencia de duración revela las cuentas reales | Calcular una huella ficticia en ese caso |
| Copiar la cabecera `Authorization` en los registros | Contraseñas válidas en archivos que leen muchas personas | Registrar método, ruta y código, nunca la cabecera |
| `curl -u usuario:contrasena` escrito en la terminal | La contraseña queda en el historial de comandos y puede aparecer en la lista de procesos | `--netrc-file`, o `-u usuario` solo, que pide la contraseña |
| Contraseña en la dirección (`https://usuario:clave@host/`) | La dirección queda en el historial, en los registros y en los enlaces | Siempre la cabecera, nunca la dirección |
| Contador de fallos en el cliente o en la memoria de una sola instancia | Eludible, se pierde al reiniciar | Contador en el servidor, en un almacenamiento compartido |
| Bloquear una cuenta tras tres fallos | Un atacante bloquea a propósito a un usuario legítimo | Un retraso creciente en lugar de un bloqueo definitivo |
| Recurso declarado sin permiso, por tanto abierto a todos | Una API entera pública por descuido | Rechazo por defecto: exigir un permiso explícito, `null` solo para lo público deseado |
| Autorizar todos los métodos en un recurso | `DELETE` o `PATCH` abiertos cuando nadie los necesita | Lista blanca de métodos por recurso |
| Usar una cuenta de administrador para un script | La fuga da todos los derechos | Una cuenta dedicada, con permisos mínimos |

## Buenas prácticas

| Práctica | Razón |
|---|---|
| HTTPS en todas partes donde se acepta Basic | Única protección real de la cabecera `Authorization` |
| Declarar cada recurso en un registro, con sus métodos y sus permisos | Superficie de ataque conocida y legible, adición sin tocar el código central |
| Un permiso por método, rechazo por defecto | El control de acceso no depende de un descuido |
| Nunca almacenar una contraseña legible: sal aleatoria y hash lento | Una base robada no entrega las contraseñas |
| Comparar huellas de tamaño fijo en tiempo constante | Ninguna fuga por la duración ni por el tamaño |
| Misma respuesta y mismo coste para cuenta desconocida y contraseña falsa | Ninguna enumeración de cuentas |
| Limitar los intentos en el servidor, antes del cálculo costoso | Protege el secreto y el procesador |
| Responder `401` con `WWW-Authenticate`, `403` para un derecho que falta, `405` con `Allow` | El cliente entiende qué parte falla |
| Registrar sin la cabecera `Authorization` | Ninguna copia del secreto que proteger |
| Una cuenta dedicada por uso, contraseña larga y aleatoria, guardada en una herramienta de secretos | Fuga limitada, revocación sin consecuencias para los demás usos |
| Elegir un token, una clave o OAuth en cuanto intervenga un usuario humano o un tercero | Caducidad, revocación y delegación que Basic no sabe ofrecer |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar: el recurso** | Un **recurso REST** es una cosa designada por una URL, sobre la que el cliente actúa con métodos HTTP (`GET` lee, `POST` crea, `PUT` reemplaza, `PATCH` corrige, `DELETE` elimina) y de la que el servidor devuelve una representación, casi siempre en JSON. Se **declara como un plugin** en un registro: ruta, métodos permitidos (lista blanca, si no `405` con `Allow`) y permiso de cada método. La API es **sin estado**: la identidad acompaña cada petición. |
| **Para recordar: HTTP Basic** | **HTTP Basic** envía `Authorization: Basic <Base64 de usuario:contraseña>`; sin cabecera, el servidor responde `401` con `WWW-Authenticate: Basic realm="..."`. **Base64 no es un cifrado**: `base64 -d` devuelve la contraseña en claro, por eso HTTPS es obligatorio. |
| **Para recordar: sus límites** | Basic no tiene cierre de sesión, ni caducidad, ni segundo factor, y devuelve la contraseña real en cada petición, con riesgo de copia en los registros, los proxies y el historial de la terminal. |
| **Para recordar: los controles** | Autenticación (`401`) y autorización (`403`) son dos controles distintos. El secreto se compara **en tiempo constante** (`timingSafeEqual`, `hash_equals`, `compare_digest`) sobre huellas de tamaño fijo, un usuario desconocido cuesta el mismo cálculo, y los intentos se limitan en el servidor (`429` con `Retry-After`). |
| **Trampas que evitar** | Creer que Base64 protege; redirigir HTTP a HTTPS pensando que el primer envío quedó a salvo; comparar con `===`; `timingSafeEqual` con tamaños distintos; mensajes de error demasiado precisos; usuario desconocido rechazado sin cálculo; `Authorization` copiado en los registros; contraseña escrita en `curl -u` o colocada en la dirección; contador de fallos en el cliente, en memoria o detrás de un proxy sin dirección de origen; bloqueo definitivo de una cuenta; recurso sin permiso declarado, por tanto público; métodos no listados autorizados; cuenta de administrador para un script. |
| **Buenas prácticas** | HTTPS en todas partes; un registro de recursos con lista blanca de métodos y permiso por método, rechazo por defecto; sal y hash lento para almacenar contraseñas; comparación en tiempo constante de huellas de tamaño fijo; misma respuesta para todos los fallos de autenticación; limitación de intentos en el servidor antes del cálculo; registros sin `Authorization`; cuenta dedicada, con derechos mínimos y un secreto largo y aleatorio guardado en una herramienta de secretos; token, clave de API u OAuth 2.0 en cuanto intervenga un usuario humano o un tercero. |
