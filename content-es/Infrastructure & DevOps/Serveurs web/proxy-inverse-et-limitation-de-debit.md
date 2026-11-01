---
order: 2
---

# Proxy inverso y limitación de tasa

Un sitio web recibe **peticiones** (solicitudes enviadas por un navegador o un programa, el **cliente**) y responde a ellas: es el principio de [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). El programa que ejecuta el código del sitio y fabrica las respuestas se llama aquí **servidor de aplicación**. El papel de un [servidor web](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web) (el programa que escucha las peticiones que llegan a una máquina y les responde) se presenta en un capítulo aparte.

Este capítulo responde a dos preguntas que surgen en cuanto el sitio sale del ordenador de su autor:

- **¿Quién debe recibir las peticiones primero?** Respuesta: un **proxy inverso**, un intermediario colocado delante de los servidores de aplicación.
- **¿Cómo evitar que un solo cliente se quede con todo?** Respuesta: la **limitación de tasa** (*rate limiting*), que limita el número de peticiones aceptadas por cliente y por duración.

Los dos temas están unidos por una trampa: detrás de un proxy, la aplicación ya no ve la [dirección IP real del cliente](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#la-direccion-ip-identificar-una-maquina) (el número que identifica su máquina en la red), y la limitación de tasa apunta al objetivo equivocado. La última parte la trata.

| Parte | Pregunta | Herramienta estudiada |
|---|---|---|
| [Proxy directo frente a proxy inverso](#proxy-directo-frente-a-proxy-inverso) | ¿Quién está oculto, y de quién? | Esquemas |
| [Lo que hace un proxy inverso](#lo-que-hace-un-proxy-inverso) | ¿Qué servicios presta? | TLS, reparto de carga, caché, compresión |
| [Un ejemplo con nginx](#un-ejemplo-con-nginx) | ¿Qué aspecto tiene la configuración? | `upstream`, `proxy_pass`, `proxy_set_header` |
| [La limitación de tasa](#la-limitacion-de-tasa) | ¿Cómo contar las peticiones? | Cubo de fichas, `limit_req` |
| [La trampa de la dirección vista detrás de un proxy](#la-trampa-de-la-direccion-vista-detras-de-un-proxy) | ¿Quién es realmente el cliente? | `X-Forwarded-For` |

Los bloques de código JavaScript se ejecutan con **Node.js** (un programa que ejecuta JavaScript fuera del navegador, [documentación oficial](https://nodejs.org/docs/latest/api/)) desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Las palabras *función*, *clase* y *variable* se explican en [las funciones](/?c=langages&s=javascript&p=fonctions), [las clases](/?c=langages&s=javascript&p=poo) y [la variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable). El bloque `/** ... */` colocado encima de una función es un comentario de documentación: `@brief` resume lo que hace la función, `@param` describe un valor que recibe, `@returns` el valor que devuelve. Entre llaves se indica el tipo del valor: `number` = número, `boolean` = verdadero o falso, `string` = texto, `Set<string>` = conjunto de textos, `{{autorizado: boolean, espera: number}}` = objeto que agrupa un verdadero o falso y un número. Las estructuras `if`, `{ ... }`, `for` y `[ ... ]` se explican en [las condiciones](/?c=langages&s=javascript&p=conditions), [los objetos](/?c=langages&s=javascript&p=objets), [los bucles](/?c=langages&s=javascript&p=boucles) y [los arrays](/?c=langages&s=javascript&p=tableaux); una **función flecha** `(a) => ...` es una escritura corta de función (véase [las funciones](/?c=langages&s=javascript&p=fonctions)). Los archivos `.mjs` son módulos de JavaScript: se lanzan con `node nombre.mjs` y pueden intercambiarse código con `import` y `export`. Los comandos Bash del capítulo se explican en su lugar, con enlaces a [las redirecciones y pipes](/?c=langages&s=bash&p=redirections-et-pipes), [el tratamiento de texto](/?c=langages&s=bash&p=traitement-de-texte), [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base), [los scripts y el shebang](/?c=langages&s=bash&p=scripts-et-shebang) y [los permisos](/?c=langages&s=bash&p=permissions-et-fichiers).

## Proxy directo frente a proxy inverso

Un **proxy** (palabra inglesa, que en español puede traducirse como «intermediario») es un programa que se interpone entre un cliente y un servidor: recibe la petición en lugar del servidor y después la reenvía. Existen dos variantes, según el lado de la red que protege.

```
PROXY DIRECTO (forward proxy): protege a los clientes

  Red de la empresa                                Internet
  +----------+
  | Equipo 1 |--+
  +----------+  |   +-------+
                +-->| Proxy |-------------------------> Sitio web
  +----------+  |   +-------+                           (ve el proxy,
  | Equipo 2 |--+                                        no los equipos)
  +----------+

PROXY INVERSO (reverse proxy): protege a los servidores

  Internet                                  Alojamiento
  +----------+
  | Visita A |--+                           +-----------+
  +----------+  |   +---------+        +--->| Aplic. 1  |
                +-->| Proxy   |--------+    +-----------+
  +----------+  |   | inverso |        |    +-----------+
  | Visita B |--+   +---------+        +--->| Aplic. 2  |
  +----------+   (los clientes ven          +-----------+
                  el proxy, no las aplicaciones)
```

| | Proxy directo | Proxy inverso |
|---|---|---|
| Se coloca delante | Los **clientes** (equipos de una red interna) | Los **servidores** (aplicaciones) |
| ¿A quién oculta? | A los clientes, ante los servidores de Internet | A los servidores, ante los clientes |
| ¿Quién sabe que existe? | El cliente (está configurado para usarlo) | Nadie en el lado del cliente: cree hablar con el sitio |
| ¿Quién lo instala? | La organización que gestiona los equipos | El equipo que gestiona el sitio |
| Usos típicos | Filtrar los sitios visitados, registrar cada petición en un archivo (el registro), guardar en caché las páginas pedidas con frecuencia | Cifrado, reparto de carga, caché, protección |
| Ejemplos de programas | [Squid](https://www.squid-cache.org/) | [nginx](https://nginx.org/), [HAProxy](https://www.haproxy.org/), [Traefik](https://doc.traefik.io/traefik/), [Caddy](https://caddyserver.com/) |

Una dirección web como `https://ejemplo.com/public/a.css` se lee en partes: el **nombre de dominio** (`ejemplo.com`, el nombre legible de la máquina, [explicación de MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)), la **ruta** (`/public/a.css`, lo que se pide en esta máquina) y, cuando aparece, el **puerto** (el número que distingue varios servicios en una misma máquina; sin él, HTTPS usa el 443).

El resto del capítulo solo habla del proxy inverso, el que instala un desarrollador de sitios. En un proyecto con varios contenedores, aparece como un servicio más (véase [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)). Su pariente cercana, la [pasarela de API](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=microservices#la-pasarela-api-api-gateway), lee el contenido de cada petición para enrutarla (dirigirla hacia el servicio adecuado); el proxy inverso, en cambio, en general solo examina la dirección, el nombre de dominio y la ruta.

## Lo que hace un proxy inverso

Situado a la entrada, el proxy inverso ve pasar todas las peticiones y todas las respuestas. Aprovecha para prestar cinco servicios que cada aplicación ya no tiene que implementar por sí misma.

```
Visita ==(1) HTTPS cifrado==> +------------------------------+
                              |        PROXY INVERSO         |
                              |  (1) descifra (TLS)          |
                              |  (3) responde desde caché    |-- si no hay --+
                              |  (5) comprime respuesta      |               |
                              +--------------+---------------+               |
                                             | (2) elige un servidor         |
                                  +----------+----------+                    |
                                  v                     v                    |
                            +-----------+         +-----------+              |
                            | Aplic. 1  |         | Aplic. 2  |<-------------+
                            +-----------+         +-----------+
                            (4) direcciones privadas, invisibles desde Internet
```

| Servicio | Qué hace | Por qué es útil | Para profundizar |
|---|---|---|---|
| Terminación TLS | Recibe la conexión cifrada (HTTPS), la descifra y después habla en claro con las aplicaciones | Un único lugar tiene el certificado y su clave privada; las aplicaciones no tienen ningún código de cifrado | [Criptografía aplicada para desarrolladores](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#el-certificado-tls-autofirmado) |
| Reparto de carga | Envía cada petición a uno de los servidores de aplicación | Varios servidores comparten el tráfico; se evita un servidor averiado | [Autoscaling y balanceo de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#el-balanceador-de-carga-load-balancer) |
| Caché | Guarda la respuesta a una petición y la reproduce tal cual a los clientes siguientes | La aplicación ya no recibe peticiones para una página que no ha cambiado | [CDN y transmisión adaptativa](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative#el-cdn-copias-del-contenido-repartidas-por-todo-el-mundo) para la versión repartida por el mundo |
| Ocultación de los servidores | Solo el proxy tiene una dirección pública; las aplicaciones permanecen en la red privada | Una aplicación no puede ser atacada directamente desde Internet | [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), que a menudo se instala en ese mismo lugar |
| Compresión | Reduce el tamaño de las respuestas (por ejemplo con **gzip**, un formato de compresión) antes de enviarlas | Menos datos en la red, páginas que cargan más rápido | [Documentación del módulo gzip de nginx](https://nginx.org/en/docs/http/ngx_http_gzip_module.html) |

**TLS** (*Transport Layer Security*) es el protocolo que cifra la conexión; **HTTPS** es HTTP transportado dentro de una conexión TLS. Un **certificado** es el documento que demuestra que el servidor es el del nombre de dominio pedido. Una **caché** es una memoria que guarda una respuesta para reproducirla sin volver a hacer el trabajo que la produjo.

Estos servicios tienen un coste: el proxy se convierte en un **punto único de fallo** (*single point of failure*), es decir, un elemento cuya avería lo detiene todo, aunque las aplicaciones de detrás funcionen bien. Se protege lanzando varios proxies idénticos, repartidos a su vez por una dirección virtual (una dirección IP que pasa automáticamente de un proxy a otro cuando el primero cae) o por un servicio del proveedor de alojamiento (véase [el reparto de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#el-balanceador-de-carga-load-balancer)).

## Un ejemplo con nginx

**nginx** (que se pronuncia «engine X», [sitio oficial](https://nginx.org/)) es un programa que hace de servidor web y de proxy inverso. Su configuración es un archivo de texto hecho de **directivas**: un nombre, unos valores y un punto y coma final (`gzip on;`). Unas llaves `{ }` agrupan directivas en **bloques**. Una **cabecera** (*header*) es una línea `Nombre: valor` que acompaña a una petición o a una respuesta para describirla (el nombre de dominio pedido, el idioma aceptado...). Las cabeceras de control y los códigos de estado tienen su [capítulo dedicado](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle).

| Bloque o directiva | Función |
|---|---|
| `upstream nombre { ... }` | Declara un grupo de servidores de aplicación bajo un nombre («aguas arriba» del proxy) |
| `server { ... }` | Describe un sitio: puerto de escucha, nombre de dominio, certificado |
| `location ruta { ... }` | Reglas aplicadas a las peticiones cuya dirección empieza por esta ruta |
| `proxy_pass dirección;` | Reenvía la petición a esta dirección, o a un grupo `upstream` |
| `proxy_set_header Nombre valor;` | Añade o sustituye una cabecera de la petición reenviada |

La configuración siguiente hace la terminación TLS, reparte entre dos aplicaciones, comprime y transmite los datos del cliente. Las direcciones `10.0.0.11` y `10.0.0.12` son direcciones de red privada inventadas (véase [la dirección IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#la-direccion-ip-identificar-una-maquina)); `3000` es el puerto en el que escucha cada aplicación.

```nginx
# upstream: grupo llamado «aplicacion», los servidores entre los que nginx reparte
upstream aplicacion {
    # primera aplicación, dirección privada y puerto 3000
    server 10.0.0.11:3000;
    # segunda aplicación; sin otro ajuste, nginx las toma por turnos
    server 10.0.0.12:3000;
}

# server: un sitio
server {
    # escucha el puerto 443 (el de HTTPS) y activa TLS
    listen 443 ssl;
    # este bloque responde a las peticiones que piden este nombre de dominio
    server_name ejemplo.com;

    # archivo del certificado (documento de identidad del sitio) y certificados intermedios
    # (los de los organismos que garantizan su firma): es la «cadena completa»
    ssl_certificate     /etc/ssl/ejemplo.com/fullchain.pem;
    # archivo de la clave privada (el secreto que demuestra que el certificado es nuestro):
    # solo debe ser legible por nginx
    ssl_certificate_key /etc/ssl/ejemplo.com/privkey.pem;

    # activa la compresión de las respuestas
    gzip on;
    # tipos MIME a comprimir: un tipo MIME es la etiqueta del formato de un contenido
    # (text/css = hoja de estilo); el texto se comprime bien, las imágenes ya menos
    gzip_types text/css application/javascript application/json;

    # Host: nombre de dominio pedido por el cliente, copiado sin el puerto
    proxy_set_header Host $host;
    # X-Real-IP: dirección del cliente, tal como la ve nginx ($remote_addr)
    proxy_set_header X-Real-IP $remote_addr;
    # X-Forwarded-For: cadena de las direcciones atravesadas, con la del cliente al final
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # X-Forwarded-Proto: protocolo usado por el cliente (https aquí)
    proxy_set_header X-Forwarded-Proto $scheme;

    # location /: todas las direcciones del sitio
    location / {
        # reenvía la petición a uno de los servidores del grupo «aplicacion»
        proxy_pass http://aplicacion;
    }
}
```

Un **tipo MIME** ([documentación de MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types)) se escribe `categoría/formato`, por ejemplo `application/json` para datos JSON. Las palabras que empiezan por `$` (`$host`, `$remote_addr`, `$scheme`) son **variables** de nginx: las sustituye en cada petición por el valor del momento. Las cabeceras añadidas son indispensables, porque la aplicación ya no ve al cliente sino al proxy:

| Cabecera | Lo que la aplicación no sabría sin ella |
|---|---|
| `Host` | El nombre de dominio pedido. Sin `proxy_set_header Host`, nginx envía el nombre del grupo (`aplicacion`) |
| `X-Forwarded-For` | La dirección del cliente y las de los proxies atravesados (detalle [más abajo](#la-trampa-de-la-direccion-vista-detras-de-un-proxy)) |
| `X-Forwarded-Proto` | Si el cliente llegó por `https`; la aplicación, a la que el proxy habla en `http`, no puede adivinarlo y corre el riesgo de fabricar enlaces en `http` |
| `X-Real-IP` | La dirección del par directo de nginx (la máquina que se conecta a él), cuando solo hay un proxy de por medio; el estándar `Forwarded` ([RFC 7239](https://www.rfc-editor.org/rfc/rfc7239)) pretende sustituir la familia `X-Forwarded-*` |

### Lo que se ha probado

nginx se ha ejecutado en una imagen **Docker** (véase [los conceptos básicos de Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base)) sin instalarlo en la máquina. La configuración anterior fue validada por `nginx -t` (el comando que comprueba la sintaxis de un archivo sin arrancar el servidor) con un [certificado autofirmado](/?c=securite&s=cybersecurite&p=cryptographie-appliquee#el-certificado-tls-autofirmado) (firmado por su propio titular, sin organismo garante), y después se ejecutó de verdad: las direcciones `10.0.0.x:3000` se sustituyeron por dos pequeños servidores locales (puertos 18431 y 18433) que devuelven las cabeceras que reciben. El formato del registro se personaliza con estas dos directivas, colocadas en el bloque `http` (el bloque que contiene los bloques `server`):

```nginx
# log_format: define un formato de línea con nombre «seguimiento»: dirección del
# cliente, código de la respuesta, dirección del servidor de aplicación elegido
log_format seguimiento '$remote_addr $status $upstream_addr';
# access_log: escribe una línea por petición en este archivo, con el formato «seguimiento»
access_log /var/log/nginx/acceso.log seguimiento;
```

Registro de nginx para cuatro peticiones consecutivas (dirección del cliente, código, servidor elegido):

```text
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
127.0.0.1 200 127.0.0.1:18431
127.0.0.1 200 127.0.0.1:18433
```

Las dos aplicaciones se reparten efectivamente por turnos. Estas son las cabeceras que recibió la aplicación para una petición llegada por HTTPS (extracto: las cabeceras que nginx añadió):

```text
host: 127.0.0.1            <- Host copiado
x-real-ip: 127.0.0.1       <- dirección del cliente vista por nginx
x-forwarded-for: 127.0.0.1 <- cadena de direcciones: aquí solo el cliente
x-forwarded-proto: https   <- el cliente estaba en HTTPS
```

> **Trampa:** un `location` que contiene su propia directiva `proxy_set_header` ya no hereda las del bloque `server`. Prueba con `X-Real-IP` puesto a nivel de `server` y un `location /otro/` que añade `Host`: la aplicación recibió `Host`, pero ya no `X-Real-IP`.
>
> **Buena práctica:** poner todos los `proxy_set_header` al mismo nivel, o agruparlos en un archivo incluido por cada `location` con la directiva `include`, que inserta el contenido de otro archivo:

```nginx
# en cada location: inserta los proxy_set_header comunes, escritos en este archivo
include /etc/nginx/proxy-headers.conf;
```

### Añadir una caché

Para las páginas que no cambian de un visitante a otro, el proxy puede guardar la respuesta. La directiva `proxy_cache_path` se coloca fuera del bloque `server`, las demás dentro de un `location` dedicado:

```nginx
# proxy_cache_path: carpeta de almacenamiento, 10 MB de índice en memoria (keys_zone),
# 100 MB como máximo, y se borra una respuesta no pedida desde hace 10 minutos
proxy_cache_path /var/cache/nginx/paginas keys_zone=paginas:10m max_size=100m inactive=10m;

# dentro del bloque «server» existente:
location /public/ {
    # guarda las respuestas en la zona «paginas»
    proxy_cache paginas;
    # guarda las respuestas con código 200 durante 1 minuto
    proxy_cache_valid 200 1m;
    # añade a la respuesta HIT (servida por la caché) o MISS (venida de la aplicación)
    add_header X-Cache $upstream_cache_status;
    # reenvía a la aplicación las peticiones que la caché no sabe servir
    proxy_pass http://aplicacion;
}
```

Tres peticiones seguidas a `/public/a.css` dieron `MISS`, `HIT`, `HIT`, y la aplicación solo contó **una** llamada: las dos últimas respuestas venían de la caché. Una petición a un archivo JSON con `Accept-Encoding: gzip` recibió `Content-Encoding: gzip`, prueba de que la compresión está activa.

> **Trampa:** poner en caché una respuesta **personalizada** (la página «mi cuenta» de un usuario conectado). La caché la reproduciría a otro visitante. nginx guarda las respuestas bajo una clave construida a partir de la dirección pedida: si dos visitantes piden la misma dirección, reciben la misma respuesta.
>
> **Buena práctica:** poner `proxy_cache` solo en rutas públicas (archivos estáticos, páginas idénticas para todos) y dar a la caché una duración corta.

## La limitación de tasa

La **limitación de tasa** (*rate limiting*) consiste en rechazar las peticiones de un cliente que envía demasiadas, por ejemplo más de 5 por segundo. La **tasa** es ese número de peticiones referido a una duración.

| Motivo | Ejemplo |
|---|---|
| Protegerse de la fuerza bruta | Un programa prueba miles de contraseñas en el formulario de inicio de sesión (véase [la seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web#limitar-la-tasa-de-solicitudes-rate-limiting)) |
| Absorber un fallo del lado del cliente | Una aplicación móvil que vuelve a llamar a la API en bucle tras un error |
| Mantener el servicio equilibrado | Un cliente que descarga todo el catálogo no ralentiza a los demás |
| Controlar los costes | Cada petición desencadena una llamada facturada a un servicio externo (véase [sobrecarga y denegación de servicio a nivel de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Complementar un WAF | Un [WAF](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif) filtra por patrón de ataque, la limitación de tasa filtra por cantidad: una petición válida, repetida un millón de veces, pasa el primero pero no la segunda |

La limitación de tasa no sustituye al [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge#el-problema-un-solo-servidor-tiene-una-capacidad-limitada), que añade servidores para absorber un tráfico legítimo: solo sirve para rechazar el exceso de un cliente concreto.

### Dónde colocarla: proxy o aplicación

| | En el proxy inverso | En la aplicación |
|---|---|---|
| Ventaja | Rechazo antes de cualquier trabajo de la aplicación; una sola regla para todas las aplicaciones | Conoce la cuenta conectada, el plan tarifario, el coste real de cada ruta |
| Límite | Solo conoce lo que contiene la petición (dirección, cabeceras) | Cada instancia (cada copia del programa que se ejecuta) tiene sus contadores: con 3 instancias, un cliente puede obtener 3 veces el límite |
| Remedio para el límite | Completar con una regla en la aplicación | Compartir los contadores en un [almacén en memoria como Redis](/?c=donnees&s=bases-de-donnees&p=redis) |

En la práctica se combinan los dos: un límite amplio en el proxy y límites finos en la aplicación.

### Dos formas de contar: ventana fija y cubo de fichas

La **ventana fija** divide el tiempo en tramos (por ejemplo de 10 segundos) y cuenta las peticiones de cada tramo: pasado el límite, rechaza hasta el tramo siguiente. El **cubo de fichas** (*token bucket*) funciona como una reserva: un cubo contiene como máximo *N* fichas, cada petición toma una, y el cubo se llena a velocidad constante. Con el cubo vacío, la petición se rechaza con el código **429** («demasiadas peticiones», detallado más abajo). Una **ráfaga** es un grupo de peticiones enviadas casi todas a la vez.

```
        fichas añadidas a velocidad constante (ej. 1 por segundo)
                          |
                          v
                    +-----------+  <- capacidad máxima: 5 fichas
                    |  o o o o  |     (el exceso se pierde)
                    |  o o      |
                    +-----+-----+
                          |
         cada petición retira UNA ficha:
           ficha disponible -> petición aceptada
           cubo vacío       -> petición rechazada (429)
```

| | Ventana fija | Cubo de fichas |
|---|---|---|
| Principio | Un contador que vuelve a cero en cada tramo | Una reserva de fichas que se recarga de forma continua |
| Memoria por cliente | Un contador y un número de tramo | Un número de fichas y un instante |
| Ráfaga permitida | Todo el límite de golpe, al inicio del tramo | Como máximo la capacidad del cubo, después el ritmo de la tasa |
| Defecto principal | **Efecto de frontera**: 5 peticiones al final del tramo + 5 al principio del siguiente = 10 peticiones en una fracción de segundo | Dos ajustes que entender (capacidad y tasa) |
| Espera antes de reintentar | Hasta el final del tramo | El tiempo para recibir una ficha, calculable exactamente |
| Usado en | Cuotas mensuales o diarias | Límites por segundo o por minuto en una API |

La **ventana deslizante** (variante de la ventana fija que recalcula la cuota de forma continua) se presenta en [la seguridad de las API web](/?c=securite&s=cybersecurite&p=securite-api-web#limitar-la-tasa-de-solicitudes-rate-limiting). El mismo principio de límite existe también en el navegador con el nombre de *throttle* (véase [debounce y throttle](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence#debounce-y-throttle-dos-formas-de-limitar-la-frecuencia-de-una-funcion)).

### Un cubo de fichas en JavaScript

El tiempo se pasa como parámetro (`ahora`, en segundos) en lugar de leerse dentro de la función: así el comportamiento es reproducible, y por tanto comprobable.

Esta clase se guarda en el archivo `seau.mjs`.

```js
/**
 * @brief Cubo de fichas: cada petición toma una ficha, el cubo se llena con el tiempo.
 *
 * @param {number} capacidad - entero mayor o igual que 1
 * @param {number} tasa - número estrictamente positivo (fichas por segundo)
 */
// export: hace la clase utilizable desde otro archivo; class: un modelo de objetos
export class CuboDeFichas {
  // constructor: se llama con «new» al crear un cubo
  constructor(capacidad, tasa) {
    // this designa el cubo en curso de creación: ahí guardamos sus ajustes
    // tamaño máximo del cubo = tamaño de la mayor ráfaga aceptada
    this.capacidad = capacidad;
    // velocidad de llenado, en fichas por segundo
    this.tasa = tasa;
    // el cubo empieza lleno
    this.fichas = capacidad;
    // instante de la última extracción (null = «nada»: todavía no hubo ninguna)
    this.ultimoInstante = null;
  }

  /**
   * @brief Intenta extraer una ficha en el instante dado.
   *
   * @param {number} ahora - segundos, nunca inferiores a la llamada anterior
   *
   * @returns {{autorizado: boolean, espera: number}} espera en segundos antes de una ficha
   */
  extraer(ahora) {
    // !== significa «distinto de»: salvo en la primera llamada, se recarga el cubo
    if (this.ultimoInstante !== null) {
      // fichas ganadas desde la última llamada: duración transcurrida x tasa
      const ganadas = (ahora - this.ultimoInstante) * this.tasa;
      // Math.min conserva el menor de los dos números: el cubo no desborda
      this.fichas = Math.min(this.capacidad, this.fichas + ganadas);
    }
    // guardamos este instante para el siguiente cálculo
    this.ultimoInstante = ahora;
    // >= significa «mayor o igual que»
    if (this.fichas >= 1) {
      // queda al menos una ficha: -= 1 quita una y aceptamos la petición
      this.fichas -= 1;
      // { ... } es un objeto: dos valores guardados con los nombres autorizado y espera
      return { autorizado: true, espera: 0 };
    }
    // faltan (1 - fichas) fichas: a esta tasa llegarán dentro de ese plazo
    return { autorizado: false, espera: (1 - this.fichas) / this.tasa };
  }
}
```

Prueba, que se guarda en `essai-seau.mjs`: un cubo de capacidad 5, lleno a 1 ficha por segundo, recibe 7 peticiones simultáneas, y después 4 peticiones tres segundos más tarde.

```js
// import: toma la clase escrita en el archivo seau.mjs
import { CuboDeFichas } from "./seau.mjs";

// describe en una línea el resultado de una extracción
function linea(instante, numero, veredicto) {
  // operador ? : : si el acceso está autorizado escribe « ok », si no « rechazada »
  const estado = veredicto.autorizado ? "ok" : "rechazada";
  // los ${...} insertan el valor de una variable en el texto entre comillas invertidas
  return `t=${instante} s  petición ${numero}: ${estado} (espera ${veredicto.espera} s)`;
}

// cubo de capacidad 5, lleno a 1 ficha por segundo
const cubo = new CuboDeFichas(5, 1);
// bucle for: repite el bloque para i = 1, 2, ... 7 (i++ suma 1 a i en cada vuelta);
// 7 peticiones en el instante t = 0 s
for (let i = 1; i <= 7; i++) {
  // console.log escribe una línea en la terminal
  console.log(linea(0, i, cubo.extraer(0)));
}
// 3 segundos después se han añadido 3 fichas: 4 peticiones
for (let i = 1; i <= 4; i++) {
  console.log(linea(3, i, cubo.extraer(3)));
}
```

Salida obtenida (archivos `seau.mjs` y `essai-seau.mjs`, comando `node essai-seau.mjs`):

```text
t=0 s  petición 1: ok (espera 0 s)
t=0 s  petición 2: ok (espera 0 s)
t=0 s  petición 3: ok (espera 0 s)
t=0 s  petición 4: ok (espera 0 s)
t=0 s  petición 5: ok (espera 0 s)
t=0 s  petición 6: rechazada (espera 1 s)
t=0 s  petición 7: rechazada (espera 1 s)
t=3 s  petición 1: ok (espera 0 s)
t=3 s  petición 2: ok (espera 0 s)
t=3 s  petición 3: ok (espera 0 s)
t=3 s  petición 4: rechazada (espera 1 s)
```

La ráfaga de 5 pasa, la sexta se rechaza con una espera de 1 s, exactamente el tiempo de producir una ficha; tras 3 s el cubo ha recuperado 3 fichas. Una petición rechazada no consume nada.

### El efecto de frontera de la ventana fija, medido

Mismo límite para los dos métodos (5 peticiones por cada 10 segundos, es decir, 0,5 fichas por segundo); 5 peticiones llegan a 9,9 s, otras 5 a 10,1 s. El script se guarda en `fixe.mjs` y se lanza con `node fixe.mjs`.

```js
// import: la clase CuboDeFichas vista más arriba
import { CuboDeFichas } from "./seau.mjs";

/**
 * @brief Contador de ventana fija: máximo `limite` peticiones por tramo de `duracion` s.
 *
 * @param {number} limite - entero mayor o igual que 1
 * @param {number} duracion - número estrictamente positivo (segundos)
 */
class VentanaFija {
  constructor(limite, duracion) {
    // peticiones permitidas por tramo y duración de un tramo (this: véase más arriba)
    this.limite = limite;
    this.duracion = duracion;
    // número del tramo en curso y número de peticiones ya contadas en él
    this.tramo = null;
    this.cuenta = 0;
  }

  /**
   * @brief Cuenta una petición en el instante dado.
   *
   * @param {number} ahora - segundos
   *
   * @returns {boolean} true si la petición se acepta
   */
  extraer(ahora) {
    // Math.floor redondea al entero inferior: 9,9 / 10 da 0; 10,1 / 10 da 1
    const tramo = Math.floor(ahora / this.duracion);
    // tramo nuevo (!== significa «distinto de»): el contador vuelve a cero
    if (tramo !== this.tramo) {
      this.tramo = tramo;
      this.cuenta = 0;
    }
    // cuenta esta petición, y acéptala mientras no se supere el límite
    this.cuenta += 1;
    // <= significa «menor o igual que»
    return this.cuenta <= this.limite;
  }
}

// 5 peticiones por tramo de 10 s, frente a un cubo de 5 fichas recargado a 0,5 ficha/s
const ventana = new VentanaFija(5, 10);
const cubo = new CuboDeFichas(5, 0.5);
// contadores de las peticiones aceptadas por cada método
let aceptadasVentana = 0;
let aceptadasCubo = 0;
// 5 peticiones a t = 9,9 s (final del tramo), luego 5 a t = 10,1 s (inicio del siguiente)
// for...of: recorre la lista, t toma cada valor a su vez
for (const t of [9.9, 9.9, 9.9, 9.9, 9.9, 10.1, 10.1, 10.1, 10.1, 10.1]) {
  // += 1 suma 1 al contador cuando el método acepta la petición
  if (ventana.extraer(t)) aceptadasVentana += 1;
  if (cubo.extraer(t).autorizado) aceptadasCubo += 1;
}
console.log(`ventana fija: ${aceptadasVentana} peticiones aceptadas en 0,2 s`);
console.log(`cubo de fichas: ${aceptadasCubo} peticiones aceptadas en 0,2 s`);
```

```text
ventana fija: 10 peticiones aceptadas en 0,2 s
cubo de fichas: 5 peticiones aceptadas en 0,2 s
```

La ventana fija deja pasar el **doble** del límite alrededor de la frontera entre dos tramos; el cubo solo deja pasar su capacidad.

### Conectar el cubo a un servidor HTTP

El servidor siguiente, que se guarda en `app.mjs`, crea un cubo por cliente, rechaza con el código **429** cuando el cubo está vacío y adjunta la cabecera `Retry-After` (el número de segundos que hay que esperar antes de reintentar). El sentido exacto de este código y de esta cabecera se detalla en [el capítulo sobre los códigos de estado y las cabeceras de control](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle); aquí basta con retener que 429 significa «demasiadas peticiones».

El servidor importa una función `direccionCliente`, que decide qué dirección contar para cada petición. Se escribe en la última parte; mientras tanto, el archivo `adresse.mjs` contiene una versión provisional que devuelve la dirección de la conexión:

```js
// versión provisional: devuelve siempre la dirección de la conexión; el «par» es la
// máquina que abrió la conexión con nosotros (el cliente, o un proxy colocado delante)
export function direccionCliente(par) {
  // return devuelve el valor a quien llamó a la función
  return par;
}
```

```js
// node:http es el módulo de Node.js que sabe escuchar peticiones HTTP
import http from "node:http";
// performance.now() da un tiempo en milisegundos que nunca retrocede
import { performance } from "node:perf_hooks";
import { CuboDeFichas } from "./seau.mjs";
import { direccionCliente } from "./adresse.mjs";

// puerto de escucha, leído de una variable de entorno; Number convierte el texto en número
const PUERTO = Number(process.env.PORT);
// claves de API conocidas (ejemplos inventados); un Set es un conjunto sin duplicados,
// donde .has(x) responde a «¿x forma parte de él?» (documentación: MDN, Set)
const CLAVES = new Set(["clave-alice", "clave-bob"]);
// ?? toma el valor de la derecha si el de la izquierda falta; split corta el texto
// en cada coma; filter(Boolean) quita los trozos vacíos; new Set(...) lo convierte
// en un conjunto
const FIABLES = new Set((process.env.FIABLES ?? "").split(",").filter(Boolean));
// cada clave de limitación recibe un cubo de 3 fichas, lleno a 1 ficha por segundo
const CAPACIDAD = 3;
const TASA = 1;
// un cubo por clave de limitación, creado en la primera petición; una Map asocia un valor
// a una clave: .set(clave, valor) añade, .get(clave) lee, .has(clave) comprueba si existe
const cubos = new Map();

// createServer: la función flecha (req, res) => { ... } (una función escrita con =>)
// se llama con cada petición recibida (req) para responderla (res)
const servidor = http.createServer((req, res) => {
  // dirección del cliente, según las reglas de confianza vistas más abajo
  const direccion = direccionCliente(
    req.socket.remoteAddress,
    req.headers["x-forwarded-for"],
    FIABLES,
  );
  // cabecera X-Api-Key enviada por el cliente (undefined si falta)
  const claveApi = req.headers["x-api-key"];
  // clave de API conocida: se limita por clave; si no, por dirección
  const clave = CLAVES.has(claveApi) ? `clave:${claveApi}` : `ip:${direccion}`;
  // primera petición de esta clave: le creamos su cubo
  if (!cubos.has(clave)) cubos.set(clave, new CuboDeFichas(CAPACIDAD, TASA));
  // reloj monótono en segundos: nunca retrocede, a diferencia de la hora del sistema
  const veredicto = cubos.get(clave).extraer(performance.now() / 1000);
  if (!veredicto.autorizado) {
    // Retry-After se escribe en segundos enteros: Math.ceil redondea hacia arriba, String
    // convierte el número en texto; writeHead envía código y cabeceras de la respuesta
    res.writeHead(429, { "Retry-After": String(Math.ceil(veredicto.espera)) });
    res.end(`demasiadas peticiones para ${clave}\n`);
    return;
  }
  // si no, la petición pasa (código 200 por defecto)
  res.end(`ok para ${clave}\n`);
});

// escucha solo en la máquina local: 127.0.0.1 designa siempre la propia máquina
servidor.listen(PUERTO, "127.0.0.1");
```

Lanzamiento en una primera terminal (sintaxis Bash, véase [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement)), y después cinco peticiones con **curl** (una herramienta que envía una petición HTTP desde la terminal, [documentación](https://curl.se/docs/)) desde una segunda terminal. La opción `-s` suprime los mensajes de progreso y `-i` muestra la cabecera de la respuesta. El `|` (*pipe*) envía la salida de curl a `grep`, que solo conserva las líneas que coinciden con un patrón: `-E` activa los patrones extendidos, `^` significa «al principio de la línea» y un `|` dentro del patrón significa «o», así que se conservan las líneas que empiezan por `HTTP` (el código de estado) o `Retry-After` (véase [las redirecciones y pipes](/?c=langages&s=bash&p=redirections-et-pipes) y [el tratamiento de texto](/?c=langages&s=bash&p=traitement-de-texte)). `for i in 1 2 3 4 5; do ... done` repite los comandos una vez por valor (véase [los bucles Bash](/?c=langages&s=bash&p=boucles)).

```bash
# lanza el servidor en el puerto 18431 (PORT la lee el programa)
PORT=18431 node app.mjs
# segunda terminal: cinco peticiones seguidas desde la misma dirección
for i in 1 2 3 4 5; do
  curl -si http://127.0.0.1:18431/ | grep -E "^HTTP|^Retry-After"
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
Retry-After: 1
HTTP/1.1 429 Too Many Requests
Retry-After: 1
```

Las tres primeras pasan (capacidad 3), las dos siguientes se rechazan con `Retry-After: 1`.

### Por dirección IP o por clave de API

La **clave de limitación** es lo que designa «un cliente»: hay que elegir qué se cuenta.

| Clave | Ventaja | Límite |
|---|---|---|
| Dirección IP | Disponible para todo visitante, incluso anónimo | Varias personas detrás de la misma dirección pública (una oficina, una escuela, una caja: véase [NAT](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#dos-mecanismos-complementarios-dhcp-y-nat)) comparten un cubo; un atacante que dispone de muchas direcciones obtiene un cubo por dirección |
| Clave de API (identificador dado a cada desarrollador o aplicación cliente) | Precisa: sigue al cliente real, sea cual sea su dirección | Solo para los clientes que tienen una; una clave filtrada la usa cualquiera |
| Cuenta de usuario | Sigue a la persona | Requiere estar conectado; no protege el propio formulario de inicio de sesión |

El servidor anterior limita por clave de API cuando es conocida; si no, por dirección. Prueba (`X-Api-Key` es la cabecera en la que el cliente envía su clave; `-H` añade una cabecera a la petición; `--interface` hace salir la petición desde una dirección local elegida: en Linux, cualquier dirección `127.x.y.z` designa la propia máquina, lo que permite simular varios clientes; `head -n 1` solo conserva la primera línea de la respuesta):

```bash
# clave conocida, enviada desde dos direcciones alternas: un solo cubo para la clave
for a in 127.0.0.4 127.0.0.5 127.0.0.4 127.0.0.5; do
  curl -si --interface $a -H "X-Api-Key: clave-alice" http://127.0.0.1:18431/ | head -n 1
done
```

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
```

Dos direcciones distintas, un solo cubo: el de la clave. Una clave **desconocida** (`clave-x1`, `clave-x2`, `clave-x3`, `clave-x4`, enviadas desde la misma dirección) recae en el límite por dirección: 3 respuestas 200, y después 429. Si el servidor creara un cubo para toda clave recibida, un atacante obtendría un cubo nuevo inventando una clave en cada petición.

> **Trampa:** guardar todos los cubos en memoria sin eliminarlos nunca. Cada dirección o clave vista crea una entrada; un atacante que cambia de dirección hace crecer la tabla hasta saturar la memoria.
>
> **Buena práctica:** eliminar los cubos inactivos (un cubo lleno desde hace mucho tiempo equivale a un cubo nuevo) y limitar el número de entradas.

### La misma limitación en nginx

El proxy sabe limitar sin escribir una sola línea de código de aplicación. Las directivas `limit_req_zone` y `limit_req_status` se colocan fuera del bloque `server` (al mismo nivel que `upstream`), `limit_req` dentro de un `location`:

```nginx
# limit_req_zone: crea una zona de contadores en memoria (10 MB), uno por valor de clave
# $binary_remote_addr: dirección del cliente, en forma compacta; rate: 1 petición/segundo
limit_req_zone $binary_remote_addr zone=por_ip:10m rate=1r/s;
# el mismo principio con la clave de API; una petición sin la cabecera X-Api-Key no se cuenta
limit_req_zone $http_x_api_key zone=por_clave:10m rate=1r/s;
# código devuelto cuando se supera el límite (503 si falta la directiva)
limit_req_status 429;

# dentro del bloque «server» existente:
location /api/ {
    # aplica la zona por_ip; burst=3: hasta 3 peticiones de adelanto; nodelay: sin espera
    limit_req zone=por_ip burst=3 nodelay;
    # la misma regla por clave de API: se aplican los dos límites
    limit_req zone=por_clave burst=3 nodelay;
    # reenvía a la aplicación lo que ha pasado los límites
    proxy_pass http://aplicacion;
}

# cuando nginx decide un 429, pasa por el bloque con nombre «limite» de abajo
error_page 429 @limite;
location @limite {
    # always: la cabecera se añade incluso en un código de error
    add_header Retry-After 1 always;
    # responde 429 con un texto corto
    return 429 "Demasiadas peticiones\n";
}
```

| Ajuste | Efecto |
|---|---|
| `rate=1r/s` | Velocidad de recarga: 1 petición por segundo (`r/m` para por minuto) |
| `burst=3` | Número de peticiones de adelanto toleradas por encima del ritmo |
| `nodelay` | Las peticiones de la ráfaga pasan de inmediato; sin él, nginx las hace **esperar** para respetar el ritmo |
| `$binary_remote_addr` | Clave = dirección del cliente, guardada en pocos bytes; más económica que `$remote_addr` (texto) |
| `$http_x_api_key` | Clave = valor de la cabecera `X-Api-Key` (nginx construye `$http_` + el nombre de la cabecera en minúsculas, con los guiones sustituidos por `_`) |

Resultados observados con este archivo (7 peticiones rápidas sobre `/api/x` desde una misma dirección):

```text
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 200 OK
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
HTTP/1.1 429 Too Many Requests
```

Cuatro aceptadas y después rechazos: `burst=3` da **1 + 3** peticiones de golpe, es decir, un cubo de capacidad 4 recargado a 1 por segundo. El registro de errores de nginx anota cada rechazo (`limiting requests, excess: 3.961 by zone "por_ip"`). La respuesta 429 llevaba `Retry-After: 1`. Con la clave `k1` enviada desde dos direcciones alternas, la quinta petición fue rechazada por la zona `por_clave` (registro: `by zone "por_clave"`).

La documentación de nginx describe su algoritmo como un «leaky bucket» (*cubo con fugas*), primo del cubo de fichas; el comportamiento medido (1 + `burst` peticiones de entrada, y luego el ritmo `rate`) es el de un cubo de fichas de capacidad `burst + 1`. Sin `nodelay`, con `burst=3` y peticiones enviadas seguidas, cada una se retrasó alrededor de 1 segundo (mediciones: 0,99 s para las peticiones 2 a 5) en lugar de rechazarse.

> **Trampa:** creer que `limit_req_zone $http_x_api_key` protege todo. Las peticiones **sin** cabecera `X-Api-Key` tienen una clave vacía, que nginx no cuenta: hay que mantener la zona `por_ip` al lado.
>
> **Buena práctica:** siempre un límite por dirección como red de seguridad, y el límite por clave además para los clientes identificados.

## La trampa de la dirección vista detrás de un proxy

Toda conexión de red tiene dos extremos, y el servidor ve la dirección de **quien le habla directamente**, llamado el **par** (*peer*). Detrás de un proxy, el par de la aplicación es siempre el proxy.

```
Sin proxy

Cliente A (198.51.100.7) --> Aplicación
   la aplicación ve 198.51.100.7

Con un proxy inverso

Cliente A (198.51.100.7) --+
                           +--> Proxy (10.0.0.2) --> Aplicación
Cliente B (203.0.113.9)  --+
   la aplicación ve 10.0.0.2 para A Y para B
```

Consecuencia directa para la limitación de tasa: todos los clientes comparten **un solo cubo**, el de la dirección del proxy, y el primero que consume las fichas bloquea a los demás. Para medirlo, un pequeño proxy hace de nginx: recibe la petición, añade la dirección del cliente a `X-Forwarded-For` y después la reenvía a la aplicación. El proxy se guarda en `proxy.mjs`; la transmisión del contenido usa `pipe`, explicado en [los streams](/?c=langages&s=javascript&p=streams).

```js
// node:http: el módulo HTTP de Node.js
import http from "node:http";

// puerto de escucha del proxy y puerto de la aplicación detrás de él
const PUERTO = Number(process.env.PORT);
const ORIGEN = Number(process.env.AMONT);

http.createServer((req, res) => {
  // dirección de quien acaba de llamar a este proxy
  const visto = req.socket.remoteAddress;
  // cadena ya recibida, si otro proxy pasó antes (undefined si no)
  const cadena = req.headers["x-forwarded-for"];
  // un proxy añade la dirección que ha visto al final de la cadena; ... copia las cabeceras
  const cab = { ...req.headers, "x-forwarded-for": cadena ? `${cadena}, ${visto}` : visto };
  // rehace la petición hacia la aplicación, con las cabeceras completadas
  const opciones = { host: "127.0.0.1", port: ORIGEN, path: req.url, headers: cab };
  const reenvio = http.request(opciones, (respuesta) => {
    // copia el código y las cabeceras de la respuesta, luego su contenido
    // (pipe: conecta un flujo de lectura con un flujo de escritura)
    res.writeHead(respuesta.statusCode, respuesta.headers);
    respuesta.pipe(res);
  });
  // la petición se transmite tal cual a la aplicación
  req.pipe(reenvio);
}).listen(PUERTO, "127.0.0.1");
```

Las pruebas necesitan un pequeño script, `client.sh`, que hace de cliente. Envía el número de peticiones indicado desde la dirección local dada (`--interface`, como más arriba) y muestra para cada una el código de respuesta y el texto recibido. Un tercer argumento, opcional, añade una cabecera `X-Forwarded-For` a cada petición Los comandos que siguen a `curl` ponen todo en una sola línea: `tr -d '\r'` quita los retornos de carro (`\r`), carácter invisible que termina cada línea de una respuesta HTTP y que, si no, haría que la línea de estado fuera sobrescrita por el resto de la salida; `sed -n '1p;$p'` solo muestra la primera y la última línea; `paste -sd'|'` une las líneas en una sola, separadas por `|`; el último `sed` sustituye ese `|` por tres espacios. `$1`, `$2` y `$3` son los argumentos dados al script; `seq 1 N` produce los números del 1 al N; `$(...)` se sustituye por el resultado del comando que contiene; un `\` al final de línea continúa el comando en la línea siguiente. El archivo se guarda con el nombre `client.sh`; `chmod +x client.sh` lo hace ejecutable (véase [los scripts y el shebang](/?c=langages&s=bash&p=scripts-et-shebang) y [los permisos](/?c=langages&s=bash&p=permissions-et-fichiers)).

```bash
#!/bin/bash
# $1: dirección local de partida, $2: número de peticiones
# $3 (opcional): inicio de la dirección escrita en X-Forwarded-For, seguido de 1, 2, 3...
p="petición"
# lo que sigue a && solo se ejecuta si la prueba es verdadera; -gt: « mayor que »
[ "$2" -gt 1 ] && p="peticiones"
echo "cliente $1: $2 $p"
for i in $(seq 1 "$2"); do
  # arreglo vacío, que recibe la opción -H (añadir una cabecera) si se indica $3
  xff=()
  [ -n "$3" ] && xff=(-H "X-Forwarded-For: $3.$i")
  # -s: silencioso, -i: muestra la cabecera, --interface: dirección de partida de la petición
  # tr quita los \r de fin de línea; sed conserva la primera línea (estado) y la última
  # (cuerpo); paste las une
  curl -si --interface "$1" "${xff[@]}" http://127.0.0.1:18432/ \
    | tr -d '\r' | sed -n '1p;$p' | paste -sd'|' | sed 's/|/   /'
done
```

El proxy se guarda en el archivo `proxy.mjs`. Primera prueba: la aplicación funciona con la versión provisional de `direccionCliente` (que devuelve siempre el par), y el proxy escucha en el puerto 18432 delante de ella. En tres terminales se lanzan la aplicación (puerto 18431), el proxy (`PORT` es su puerto de escucha, `AMONT` el de la aplicación), y después el cliente `127.0.0.2` envía 3 peticiones y el cliente `127.0.0.3` solo una:

```bash
# terminal 1: la aplicación, en el puerto 18431
PORT=18431 node app.mjs
# terminal 2: el proxy, en el puerto 18432, que reenvía a la aplicación del puerto 18431
PORT=18432 AMONT=18431 node proxy.mjs
# terminal 3: 3 peticiones del cliente 127.0.0.2, luego 1 petición del cliente 127.0.0.3
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```

```text
cliente 127.0.0.2: 3 peticiones
HTTP/1.1 200 OK   ok para ip:127.0.0.1
HTTP/1.1 200 OK   ok para ip:127.0.0.1
HTTP/1.1 200 OK   ok para ip:127.0.0.1
cliente 127.0.0.3: 1 petición
HTTP/1.1 429 Too Many Requests   demasiadas peticiones para ip:127.0.0.1
```

El cliente `127.0.0.3`, que aún no había enviado nada, es rechazado: la aplicación contó a todo el mundo bajo la dirección `127.0.0.1`, la del proxy.

### X-Forwarded-For: la cadena de direcciones

El remedio es la cabecera `X-Forwarded-For` («transmitido por», [descripción de MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)). Cada proxy **añade al final** la dirección de quien le ha hablado:

```
Cliente (198.51.100.7) --> Proxy 1 (10.0.0.1) --> Proxy 2 (10.0.0.2) --> Aplicación

Cabecera recibida por la aplicación: X-Forwarded-For: 198.51.100.7, 10.0.0.1
Par visto por la aplicación:         10.0.0.2

  198.51.100.7: añadida por Proxy 1 (vio al cliente)
  10.0.0.1    : añadida por Proxy 2 (vio al Proxy 1)
  10.0.0.2    : NO está en la cabecera: es el par, la aplicación lo ve por sí misma
```

La cabecera la **escriben los proxies, pero también cualquier cliente**: un cliente malintencionado puede **falsificarla** (fabricarla de cero), por ejemplo enviar `X-Forwarded-For: 1.1.1.1` para hacerse pasar por otra dirección. Solo es digna de confianza si viene de un proxy **conocido**. De ahí la regla:

1. Si el par no es un proxy fiable, se **ignora** la cabecera y se toma el par.
2. Si el par es un proxy fiable, se lee la cadena **de derecha a izquierda** y se retiene la primera dirección que no es un proxy fiable. Lo que está a la izquierda de esa dirección lo ha escrito el cliente, así que no es fiable.

```js
/**
 * @brief Determina la dirección del verdadero cliente tras cero, uno o varios proxies.
 *
 * Ejemplo: par 10.0.0.2 (fiable), cabecera "1.2.3.4, 10.0.0.1" -> 1.2.3.4
 *
 * @param {string} par - dirección IP de la máquina que abrió la conexión
 * @param {string|undefined} cabecera - valor bruto de X-Forwarded-For, o undefined
 * @param {Set<string>} fiables - direcciones de los proxies cuya cabecera aceptamos
 *
 * @returns {string} dirección retenida para identificar al cliente
 */
export function direccionCliente(par, cabecera, fiables) {
  // ! significa «no», || «o»: par desconocido o sin cabecera, tomamos el par
  // (un par desconocido puede escribir cualquier cosa en la cabecera)
  if (!fiables.has(par) || !cabecera) return par;
  // corta "a, b, c" en una lista de direcciones; map aplica la función (a) => a.trim() a cada
  // elemento, y trim quita los espacios alrededor
  const cadena = cabecera.split(",").map((a) => a.trim());
  // subimos desde la derecha: cada proxy fiable ha añadido la dirección que vio;
  // las posiciones de una lista empiezan en 0, así que la última es la de longitud - 1;
  // i-- quita 1 a i en cada vuelta, y cadena[i] lee el elemento en la posición i
  for (let i = cadena.length - 1; i >= 0; i--) {
    // primera dirección que no es un proxy fiable = el cliente
    if (!fiables.has(cadena[i])) return cadena[i];
  }
  // toda la cadena es fiable: el cliente es la primera dirección
  return cadena[0];
}
```

Seis casos probados (dos proxies fiables, `10.0.0.1` y `10.0.0.2`), en un archivo `cas.mjs` que se lanza con `node cas.mjs`:

```js
// la función que acabamos de escribir
import { direccionCliente } from "./adresse.mjs";

// dos proxies fiables: 10.0.0.1 y 10.0.0.2
const fiables = new Set(["10.0.0.1", "10.0.0.2"]);
// cada caso: nombre, dirección de la conexión, cabecera recibida, proxies fiables
const casos = [
  ["par desconocido, cabecera falsa", "203.0.113.9", "1.1.1.1", fiables],
  ["par fiable, un proxy", "10.0.0.2", "198.51.100.7", fiables],
  ["par fiable, inicio falso", "10.0.0.2", "1.1.1.1, 198.51.100.7", fiables],
  ["dos proxies fiables", "10.0.0.2", "198.51.100.7, 10.0.0.1", fiables],
  ["par fiable, sin cabecera", "10.0.0.2", undefined, fiables],
  ["ningún proxy fiable", "10.0.0.2", "198.51.100.7", new Set()],
];
// for...of recorre la lista; los corchetes de la izquierda extraen los 4 valores de cada caso
for (const [nombre, par, cabecera, lista] of casos) {
  console.log(`${nombre} -> ${direccionCliente(par, cabecera, lista)}`);
}
```

```text
par desconocido, cabecera falsa -> 203.0.113.9
par fiable, un proxy -> 198.51.100.7
par fiable, inicio falso -> 198.51.100.7
dos proxies fiables -> 198.51.100.7
par fiable, sin cabecera -> 10.0.0.2
ningún proxy fiable -> 10.0.0.2
```

| Caso | Dirección retenida | Razón |
|---|---|---|
| Par desconocido que envía una cabecera | El par | La cabecera viene de un desconocido: se ignora |
| Par fiable, un proxy | El cliente de la cabecera | El proxy fiable escribió esa dirección |
| Cliente que falsifica el inicio de la cadena | El verdadero cliente | La lectura de derecha a izquierda se detiene en la primera dirección no fiable, añadida por el proxy |
| Par fiable sin cabecera | El par | Nada que leer |
| Ningún proxy declarado fiable | El par | Ajuste prudente: siempre se ve el proxy |

Segunda prueba, con la función completa. Se reemplaza el contenido de `adresse.mjs` por la función `direccionCliente` de arriba, luego se detiene la aplicación (`Ctrl+C` en la terminal 1) y se vuelve a lanzar con `FIABLES=127.0.0.1` (la dirección del proxy de prueba). Este relanzamiento pone también a cero todos los cubos. El proxy, por su parte, sigue funcionando:

```bash
# terminal 1: vuelve a lanzar la aplicación; FIABLES lista los proxies cuya cabecera se acepta
FIABLES=127.0.0.1 PORT=18431 node app.mjs
# terminal 3: mismas peticiones que en la primera prueba
./client.sh 127.0.0.2 3
./client.sh 127.0.0.3 1
```


```text
cliente 127.0.0.2: 3 peticiones
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
cliente 127.0.0.3: 1 petición
HTTP/1.1 200 OK   ok para ip:127.0.0.3
```

Cada cliente tiene ahora su cubo. Por último, el cliente `127.0.0.2` envía a través del proxy cinco peticiones con un `X-Forwarded-For` **distinto** cada vez (`1.1.1.1`, `1.1.1.2`...) para intentar obtener cinco cubos nuevos. Pero el cubo de `127.0.0.2` acaba de quedar vacío por la prueba anterior, y se rellena a 1 ficha por segundo. Lanzadas de inmediato, las cinco peticiones serían todas rechazadas (`429`), sin probar nada sobre la falsificación. Hay que esperar, pues, 3 segundos, el tiempo en que vuelven las 3 fichas (`sleep 3` pone la terminal en pausa 3 segundos):

```bash
# espera 3 segundos para que el cubo se rellene
sleep 3
# cinco peticiones con un X-Forwarded-For diferente: 1.1.1.1, 1.1.1.2, ...
./client.sh 127.0.0.2 5 1.1.1
```

```text
cliente 127.0.0.2: 5 peticiones
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 200 OK   ok para ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   demasiadas peticiones para ip:127.0.0.2
HTTP/1.1 429 Too Many Requests   demasiadas peticiones para ip:127.0.0.2
```

La aplicación ve `1.1.1.i, 127.0.0.2`, retiene `127.0.0.2` y responde `200`, `200`, `200`, `429`, `429`. La falsificación fracasa.

### El equivalente en nginx: el módulo realip

Cuando nginx está a su vez detrás de otro proxy, es él quien debe recuperar la dirección del cliente antes de aplicar `limit_req` (si no, la zona `por_ip` contaría la dirección del proxy de delante). El módulo *realip* ([documentación](https://nginx.org/en/docs/http/ngx_http_realip_module.html)) aplica la misma regla que `direccionCliente`:

```nginx
# dentro del bloque «server», antes de los «location»:
# los pares de esta red privada (10.x.x.x, direcciones inventadas) son proxies fiables
set_real_ip_from 10.0.0.0/8;
# lee la dirección del cliente en esta cabecera en lugar de en la conexión
real_ip_header X-Forwarded-For;
# salta las direcciones de confianza partiendo desde la derecha
real_ip_recursive on;
```

(La notación `10.0.0.0/8` es la [notación CIDR](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau#la-notacion-cidr-una-forma-abreviada-de-escribir-la-mascara).) Con esta configuración (adaptada a la red de prueba: `127.0.0.1/32`), detrás del pequeño proxy, un cliente en `127.0.0.2` que envía `X-Forwarded-For: 1.1.1.i` fue contado bajo `127.0.0.2`: `200`, `200`, `200`, `200`, `429`, `429` (burst de 3, es decir, 4 peticiones de entrada).

Segunda prueba: una conexión directa desde `127.0.0.2` (par no fiable) con una cabecera falsificada se contó también bajo `127.0.0.2`. La zona seguía agotada por la prueba anterior, de ahí seis `429` seguidos: la cabecera falsificada no dio un cubo nuevo.

> **Trampa:** después de `real_ip_header`, la variable `$remote_addr` contiene la dirección del **cliente** y ya no la de la conexión. Con `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, nginx añade entonces la dirección del cliente una segunda vez: la aplicación recibió `1.1.1.1, 127.0.0.2, 127.0.0.2` en lugar de `1.1.1.1, 127.0.0.2`. La dirección de la conexión sigue disponible en `$realip_remote_addr`.
>
> **Buena práctica:** dejar que la aplicación lea la cadena de derecha a izquierda con la lista de sus proxies fiables, y no deducir el número de proxies del número de direcciones de la cadena.

| Versión de la dirección | Dónde leerla | ¿Fiable? |
|---|---|---|
| Par de la conexión | `req.socket.remoteAddress` en Node.js, `$remote_addr` en nginx sin `realip` | Sí: es la conexión real |
| Principio de `X-Forwarded-For` | Primera dirección de la lista | No: la escribe el cliente |
| Final de `X-Forwarded-For` | Última dirección de la lista | Sí si el par es un proxy fiable, porque ha sido él quien la añadió |
| Dirección retenida por `direccionCliente` o `realip` | Resultado de la regla anterior | Sí, siempre que la lista de proxies fiables sea exacta |

Para que esta regla baste, la aplicación solo debe aceptar conexiones que vengan del proxy: un [cortafuegos](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld) que bloquee el acceso directo completa el dispositivo.

Ejemplo con ufw, si el proxy está en `10.0.0.2` y la aplicación en el puerto 3000:

```bash
# solo permite que el proxy (10.0.0.2) acceda al puerto 3000 de esta máquina
sudo ufw allow from 10.0.0.2 to any port 3000 proto tcp
# rechaza otro acceso a ese puerto (la regla de permiso, puesta antes, se aplica primero)
sudo ufw deny 3000/tcp
```

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Leer la dirección de la conexión detrás de un proxy | Todos los clientes llevan la dirección del proxy y comparten un cubo | Leer `X-Forwarded-For` solo si el par es un proxy fiable |
| Confiar en `X-Forwarded-For` sin condiciones | Cualquier cliente escribe la dirección que quiere y evita el límite | Ignorar la cabecera si el par no es fiable; leer la cadena de derecha a izquierda |
| Tomar la primera dirección de la cadena | Es la que un cliente puede falsificar | Detenerse en la primera dirección no fiable partiendo de la derecha |
| Dejar la aplicación accesible directamente | Un atacante evita el proxy, sus límites y su WAF | Cortafuegos: aceptar solo las conexiones del proxy |
| Un solo proxy sin redundancia | Su avería detiene todo el sitio | Al menos dos proxies idénticos |
| Poner en caché una página personalizada | Un visitante recibe la página de otro | `proxy_cache` solo en las rutas públicas |
| `proxy_set_header` dentro de un `location` | Las cabeceras del bloque `server` ya no se heredan | Poner todas las cabeceras al mismo nivel o incluirlas |
| Olvidar los WebSocket y los plazos de espera | Sin `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;` y `proxy_set_header Connection "upgrade";`, una conexión [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) falla; al cabo de `proxy_read_timeout` (60 s por defecto), nginx corta una respuesta demasiado lenta | Añadir estas tres directivas para las rutas WebSocket y ajustar el plazo |
| Olvidar `Host` | La aplicación recibe el nombre del grupo `upstream` | `proxy_set_header Host $host;` |
| Limitar solo por clave de API | Las peticiones sin clave escapan a la zona | Mantener además un límite por dirección |
| Un cubo por clave recibida, sin validación | Un atacante inventa una clave nueva en cada petición | Crear un cubo propio solo para las claves conocidas |
| Cubos que nunca se eliminan | La memoria crece con el número de direcciones vistas | Purgar los cubos inactivos, limitar su número |
| Contador en cada instancia | Con *n* instancias, un cliente obtiene *n* veces el límite | Contador compartido (Redis) o límite en el proxy |
| Reloj del sistema para medir el tiempo | Un cambio de hora puede hacer retroceder el tiempo | Un reloj monótono (`performance.now()`) |
| `Retry-After` no entero | La cabecera se escribe en segundos enteros | Redondear hacia arriba (`Math.ceil`) |
| Ventana fija para un límite por segundo | El doble del límite pasa alrededor de la frontera | Cubo de fichas para los límites cortos |
| Contar también las peticiones rechazadas | Un cliente correcto que insiste no sale nunca del bloqueo | Un rechazo no consume ninguna ficha |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Terminar TLS en el proxy y volver a cifrar hacia las aplicaciones si la red interna no es segura | Un único lugar gestiona los certificados; el tráfico interno queda protegido cuando hace falta |
| Transmitir `Host`, `X-Forwarded-For` y `X-Forwarded-Proto` | La aplicación conoce el dominio, el cliente y el protocolo de origen |
| Declarar explícitamente la lista de proxies fiables | La confianza es una elección escrita, no un valor por defecto |
| Limitar por dirección en el proxy, y luego por clave o por cuenta en la aplicación | Cada capa ve lo que conoce |
| Ajustar la capacidad del cubo a la ráfaga legítima y la tasa a la media | Un usuario normal nunca alcanza el límite |
| Responder 429 con `Retry-After` en lugar de cortar la conexión | Los clientes bien escritos saben cuándo volver |
| Probar el comportamiento con relojes simulados y direcciones falsificadas | Los casos límite se comprueban sin esperar ni atacar |
| Vigilar el número de rechazos | Un pico de rechazos señala un error del cliente o un ataque |
| Ejecutar `nginx -t` antes de cada recarga | Un error de sintaxis no tumba el sitio |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un **proxy inverso** es un intermediario colocado delante de los servidores de aplicación: termina TLS, reparte la carga, guarda una caché, oculta los servidores y comprime. Un **proxy directo** protege, en cambio, a los clientes. La **limitación de tasa** limita las peticiones por cliente; el **cubo de fichas** acepta una ráfaga igual a su capacidad y luego sigue el ritmo de la tasa, mientras que la ventana fija deja pasar el doble del límite alrededor de la frontera (10 peticiones aceptadas frente a 5 en la prueba). Una respuesta **429** con `Retry-After` indica cuándo reintentar. Detrás de un proxy, la aplicación ve la dirección del proxy: la dirección del cliente se lee en `X-Forwarded-For`, solo si el par es un proxy conocido, de derecha a izquierda. |
| **Trampas que evitar** | Leer la dirección de la conexión detrás de un proxy; creer `X-Forwarded-For` cuando el par es desconocido, o tomar su primera dirección; dejar la aplicación accesible sin pasar por el proxy; poner en caché una página personalizada; limitar solo por clave de API; crear un cubo para cualquier clave inventada; guardar los cubos sin purgarlos; contar por separado en cada instancia; perder los `proxy_set_header` dentro de un `location`. |
| **Buenas prácticas** | Transmitir `Host`, `X-Forwarded-For` y `X-Forwarded-Proto`; declarar la lista de proxies fiables; limitar por dirección en el proxy y por clave en la aplicación; cubo de fichas para los límites cortos; 429 con `Retry-After`; contadores compartidos cuando hay varias instancias; `nginx -t` antes de cualquier recarga. |
