---
order: 9
---

# Servidores web (31/10/2026)

Cuando escribes una dirección en un navegador, aparece una página: en algún lugar, un programa ha recibido tu petición y ha devuelto el contenido. Ese programa es un **servidor web**. Este capítulo explica qué hace, cómo se configura, cómo atiende a varios visitantes a la vez y cómo leer lo que escribe en sus registros. Supone que sabes abrir un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana donde se escriben comandos con el teclado).

La palabra «servidor» tiene dos sentidos que conviene distinguir desde ahora:

| Sentido | Qué es | Ejemplo |
|---|---|---|
| La máquina | Un ordenador encendido permanentemente, conectado a Internet, que presta servicios | Un ordenador en un centro de datos |
| El programa | Un software que espera peticiones y les responde | nginx, Apache, Caddy (presentados más abajo) |

En este capítulo, «servidor web» designa el **programa**. Una misma máquina puede ejecutar uno, varios o ninguno. El **navegador** (el software que muestra las páginas: [Firefox](https://www.mozilla.org/es/firefox/), [Chrome](https://www.google.com/intl/es/chrome/)...) desempeña el otro papel, el de **cliente**: pide, y el servidor responde. Las reglas de este diálogo se llaman **HTTP** (*HyperText Transfer Protocol*); sus métodos (`GET`, `POST`...) y sus códigos de estado (`200`, `404`...) se explican en [los intercambios de datos: API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) y no se repiten aquí.

## Un programa que escucha un puerto

Una máquina conectada a una red tiene una **dirección IP** (un número que la identifica, véase [el direccionamiento de red](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)). Pero varios programas pueden funcionar en la misma máquina: ¿cómo saber a quién va dirigido un mensaje? Gracias al **puerto**, un número entre 0 y 65535 que designa un programa concreto de la máquina.

> **Analogía:** la dirección IP es la dirección de un edificio, el puerto es el número del apartamento. El correo llega al edificio y luego va a la puerta correcta.

Un servidor web **escucha** un puerto: lo reserva ante el sistema y luego espera a que un cliente se conecte. Es el mecanismo del [socket de servidor](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) (el punto de comunicación de red de un programa) que describe su propio capítulo.

```text
 CLIENTE (navegador, curl...)               MÁQUINA SERVIDOR (IP 203.0.113.10)

                                            puerto 25   : otro programa
 1. abre una conexión hacia el puerto 80    puerto 80   : [ servidor web ]  <- escucha
    ---------------------------------------->      |
 2. envía la petición                              | 3. busca el recurso
    "GET /contact.html"                            |    (un archivo o un cálculo)
    ---------------------------------------->      |
                                                   | 4. construye la respuesta
 5. recibe la respuesta                            |    estado + cabeceras + cuerpo
    <----------------------------------------      v
 6. la muestra (página, imagen, datos...)
```

La dirección `203.0.113.10` es una dirección reservada para la documentación: no existe en la Internet real.

Los números de puerto no están libres. Algunos son una convención mundial:

| Puerto | Uso | Observación |
|---|---|---|
| `80` | HTTP, sin cifrado | Puerto por defecto: el navegador lo supone para una dirección `http://` |
| `443` | HTTPS, con cifrado (explicado en la sección HTTPS más abajo) | Puerto por defecto para una dirección `https://` |
| `8080`, `8000`, `3000`... | [Servidores de desarrollo](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) | Simple costumbre, ninguna regla |

Cuando la dirección no contiene puerto, el navegador elige `80` o `443` según el inicio de la dirección. `http://exemple.test:8080/` fuerza el puerto `8080`.

## Ver el ciclo petición/respuesta en la práctica

Nada vale más que un servidor diminuto que se puede leer entero. El archivo `serveur.js` que aparece a continuación pone en marcha un servidor web en unas cuarenta líneas. Está escrito en [JavaScript](/?c=langages&s=javascript&p=javascript) y lo ejecuta **Node.js** (un programa que ejecuta JavaScript fuera del navegador). Para instalarlo, sigue las instrucciones del [sitio oficial](https://nodejs.org) y luego comprueba en la terminal con `node --version`: debe aparecer un número de versión. Copia después el código de abajo en un archivo llamado `serveur.js`, creado con un [editor de código](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide). El módulo `http` utilizado se describe en la [documentación de Node.js](https://nodejs.org/api/http.html). No hace falta dominar el lenguaje (véase [las funciones de JavaScript](/?c=langages&s=javascript&p=fonctions) para la notación `=>`): cada línea está comentada, y lo importante es el recorrido.

```javascript
// http es el módulo de Node.js que sabe hablar el protocolo HTTP
// require("...") carga un módulo; const nombra el resultado (un valor que no cambia)
const http = require("node:http");

// Una tabla: a cada valor de la cabecera Host le corresponde el texto del sitio
// (\n es un salto de línea en el texto)
const sitios = {
  "a.exemple.test": "Bienvenido al sitio A\n",
  "b.exemple.test": "Bienvenido al sitio B\n",
};

// createServer recibe una función que se llama en CADA petición recibida
// ((peticion, respuesta) => { ... } es una función flecha: parámetros, flecha, cuerpo)
const servidor = http.createServer((peticion, respuesta) => {
  // peticion.method: el método (GET...); peticion.url: la ruta pedida
  console.log(peticion.method, peticion.url, peticion.headers.host);

  // /lento: esperamos un segundo antes de responder (sirve más abajo)
  // setTimeout(función, 1000) ejecuta la función tras 1000 milisegundos (1 segundo)
  // respuesta.end(texto) envía el texto y luego termina la respuesta
  if (peticion.url === "/lento") {
    setTimeout(() => respuesta.end("terminado\n"), 1000);
    return;
  }

  // /hora: una respuesta calculada en cada petición (contenido dinámico)
  // toISOString da la fecha en el formato 2026-10-31T20:18:44.603Z: T separa la fecha
  // de la hora; Z significa « hora UTC » (el tiempo universal, sin desfase)
  if (peticion.url === "/hora") {
    respuesta.end(new Date().toISOString() + "\n");
    return;
  }

  // Buscamos el sitio pedido gracias a la cabecera Host, sin el número de puerto
  // « a || b » vale a si existe, si no b; split(":")[0] conserva lo que precede a « : »
  const nombre = (peticion.headers.host || "").split(":")[0];
  const texto = sitios[nombre];

  // Ningún sitio con ese nombre: estado 404 («no encontrado») y un mensaje corto
  if (texto === undefined) {
    respuesta.statusCode = 404;
    respuesta.setHeader("Content-Type", "text/plain; charset=utf-8");
    respuesta.end("Ningún sitio con ese nombre\n");
    return;
  }

  // Si no: estado 200 («éxito»), una cabecera que describe el contenido y luego el cuerpo
  respuesta.statusCode = 200;
  respuesta.setHeader("Content-Type", "text/plain; charset=utf-8");
  respuesta.end(texto);
});

// listen: el programa reserva el puerto 8081 y espera las conexiones
servidor.listen(8081, "127.0.0.1", () => console.log("escuchando en 8081"));
```

La dirección `127.0.0.1` es la dirección de **la propia máquina**: el servidor solo puede alcanzarse desde tu ordenador. Inícialo en una primera terminal con `node serveur.js` (`Ctrl+C` en esa terminal lo detiene), y luego consúltalo desde una segunda con **curl**, una herramienta de línea de comandos que envía una petición HTTP y muestra la respuesta (véase [su documentación](https://curl.se/docs/)). La opción `-i` muestra además las cabeceras de la respuesta. La opción `-H` añade una cabecera a la petición, aquí `Host` (su función se explica en la sección sobre los sitios virtuales).

```bash
# -i : muestra la línea de estado y las cabeceras de la respuesta antes de su cuerpo
# -H : envía la cabecera « Host: a.exemple.test » en la petición
curl -i http://127.0.0.1:8081/ -H 'Host: a.exemple.test'
```

Salida obtenida:

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:18:44 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 22

Bienvenido al sitio A
```

La opción `-v` (*verbose*, «hablador») muestra además la petición enviada, precedida del signo `>`; la respuesta va precedida de `<`. Estas son las líneas de la misma petición:

```text
> GET / HTTP/1.1
> Host: a.exemple.test
> User-Agent: curl/8.5.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Date: Sat, 31 Oct 2026 20:18:44 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 22
<
```

| Línea | Nombre | Función |
|---|---|---|
| `GET / HTTP/1.1` | Línea de petición | El método, la ruta pedida, la versión del protocolo |
| `Host: ...` | Cabecera de petición | El nombre del sitio al que va dirigida (véase la sección sobre los sitios virtuales) |
| `User-Agent: ...` | Cabecera de petición | El software que envía la petición (aquí curl, a menudo un navegador) |
| `Accept: */*` | Cabecera de petición | Los tipos de contenido aceptados (`*/*`: todos) |
| línea vacía | Separador | Marca el final de las cabeceras; el cuerpo viene después |
| `HTTP/1.1 200 OK` | Línea de estado | La versión, el código de estado y su texto |
| `Content-Type` | Cabecera de respuesta | La naturaleza del contenido (texto, imagen, página [HTML](/?c=langages&s=html&p=html)...) y su codificación (la forma en que se codifican las letras en bytes; el **byte** es la unidad de tamaño de un dato) |
| `Content-Length: 22` | Cabecera de respuesta | El tamaño del cuerpo en bytes (aproximadamente un carácter sencillo por byte: aquí 22, con el salto de línea incluido) |
| `Connection: keep-alive` | Cabecera de respuesta | La conexión sigue abierta para la siguiente petición |
| `Keep-Alive: timeout=5` | Cabecera de respuesta | Se cerrará tras 5 segundos sin nueva petición |

Una **cabecera** (*header*) es una línea `Nombre: valor` que da una información sobre el intercambio. El **cuerpo** (*body*) es el propio contenido, después de la línea vacía. Último caso, un sitio desconocido: el servidor responde `404`.

```bash
# El nombre « inconnu.test » no figura en la tabla: se espera un estado 404
curl -i http://127.0.0.1:8081/ -H 'Host: inconnu.test'
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:18:44 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 29

Ningún sitio con ese nombre
```

Durante estas pruebas, la terminal del servidor mostró lo que hace la línea `console.log` del código: un **registro** mínimo de cada petición recibida. Aquí tienes un extracto: el de las cuatro primeras llamadas (sitio A, sitio desconocido, sitio B, llamada con `-v`) y luego el de las tres llamadas a `/lento` que se ven más abajo; las llamadas a `/hora` y con `--resolve` añaden sus propias líneas:

```text
escuchando en 8081
GET / a.exemple.test
GET / inconnu.test
GET / b.exemple.test
GET / a.exemple.test
GET /lento 127.0.0.1:8081
GET /lento 127.0.0.1:8081
GET /lento 127.0.0.1:8081
```

Cuando el servidor no está en marcha, nadie escucha el puerto: la conexión se rechaza antes incluso de que exista una petición.

```text
curl: (7) Failed to connect to 127.0.0.1 port 8081 after 0 ms: Couldn't connect to server
```

Este mensaje (en español, «No se pudo conectar») no es, por tanto, una respuesta HTTP: no hay código de estado. La diferencia con un error `404` o `500` es la que describe [el capítulo sobre HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) entre «ninguna respuesta» y «respuesta de error».

## Contenido estático y contenido dinámico

Un servidor web puede responder de dos maneras muy distintas:

| | Contenido estático | Contenido dinámico |
|---|---|---|
| Qué es | Un archivo tal como está almacenado (página [HTML](/?c=langages&s=html&p=html), imagen, hoja de estilos, script) | Una respuesta calculada en el momento de la petición por un programa |
| Quién produce la respuesta | El servidor web solo: lee el archivo y lo envía | Un programa de aplicación ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), Node.js...) al que el servidor llama |
| Dos visitas seguidas | Mismo resultado, mientras el archivo no cambie | Resultado que puede variar (hora, usuario conectado, contenido de la [base de datos](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) |
| Velocidad | Muy rápida | Depende del cálculo |
| Ejemplo en este capítulo | `contact.html` servido por Apache | La ruta `/hora` del servidor Node |

La ruta `/hora` de `serveur.js` calcula su respuesta en cada llamada. Dos llamadas separadas por dos segundos:

```bash
# -s : modo silencioso (curl no muestra su barra de progreso, solo la respuesta)
curl -s http://127.0.0.1:8081/hora
# La misma llamada, dos segundos después
curl -s http://127.0.0.1:8081/hora
```

```text
2026-10-31T20:18:44.603Z
2026-10-31T20:18:46.632Z
```

Algunos servidores web, como nginx, no ejecutan ellos mismos el código PHP. **Transmiten** la petición a un programa dedicado y luego devuelven al cliente lo que este ha producido. Para PHP, ese programa es PHP-FPM, presentado en el capítulo [Responder al cliente y luego seguir trabajando (PHP-FPM)](/?c=langages&s=php&p=php-fpm):

```text
Petición GET /index.php?id=3
        |
        v
 Servidor web ---- archivo .html, .css, .png ? ---> leído en disco y enviado
        |
        +-------- archivo .php ? ----------------> transmitido a PHP-FPM
                                                    (que ejecuta el script)
                                                           |
        respuesta enviada al cliente  <-----------------------+
```

Es también lo que hace un [renderizado del lado del servidor](/?c=langages&s=javascript&p=ssr-vs-csr): la página se construye antes del envío, en lugar de ensamblarse en el navegador.

## Tres servidores web habituales: nginx, Apache, Caddy

Tres servidores web libres (su código es público y su uso gratuito) están muy extendidos, o en progresión en el caso de Caddy. Hacen el mismo trabajo (escuchar un puerto, responder en HTTP), pero difieren en su historia y en la forma de configurarse:

| | nginx | Apache HTTP Server | Caddy |
|---|---|---|---|
| Qué es | Servidor web conocido por gestionar muchas conexiones con poca memoria | El más antiguo de los tres, muy modular (se le añaden funciones mediante módulos) | Servidor web reciente que activa el cifrado HTTPS por sí mismo |
| Configuración | Un único archivo en bloques `{ }` | Archivos en bloques `<...>`; ajustes locales posibles por carpeta (`.htaccess`) | Un archivo corto, el `Caddyfile` |
| Documentación | [nginx.org](https://nginx.org/en/docs/) | [httpd.apache.org](https://httpd.apache.org/docs/current/) | [caddyserver.com](https://caddyserver.com/docs/) |

Un **módulo** es una pieza de funcionalidad que se activa o no (cifrado, compresión, redirecciones). Un archivo **`.htaccess`** es, en Apache, un pequeño archivo de ajustes colocado en una carpeta del sitio: práctico, pero Apache debe releerlo en cada petición, lo que ralentiza.

La elección depende del contexto: ninguno es «el bueno». En una máquina proporcionada por un proveedor de alojamiento, el servidor suele estar ya elegido.

## Un archivo de configuración mínimo (nginx)

Un servidor web no adivina nada: todo lo que hace (qué sitios, qué carpetas, qué puertos) se describe en un **archivo de configuración**, un archivo de texto que el servidor lee al arrancar. Cada línea es una **directiva** (un ajuste: un nombre seguido de su valor, terminado en `;` en nginx). Las directivas se agrupan en **bloques** delimitados por `{ }`, que se anidan como muñecas rusas.

Esta es una configuración completa y mínima para nginx. Sirve una carpeta de archivos estáticos en el puerto 80. Suele encontrarse en `/etc/nginx/nginx.conf` (la ubicación varía según la instalación).

```nginx
# Número de procesos trabajadores (véase abajo); « auto » : uno por núcleo del chip
# (un núcleo es una unidad de cálculo del chip)
worker_processes auto;
# Archivo donde nginx escribe sus errores, con el nivel mínimo « warn » (aviso)
error_log /var/log/nginx/error.log warn;

# Bloque « events »: ajustes del tratamiento de las conexiones
events {
    # Número máximo de conexiones que cada trabajador gestiona al mismo tiempo
    worker_connections 1024;
}

# Bloque « http »: todo lo relativo al protocolo HTTP
http {
    # Carga la tabla que asocia una extensión (.html, .png) a un tipo de contenido
    include /etc/nginx/mime.types;
    # Tipo de contenido usado cuando la extensión es desconocida
    default_type application/octet-stream;
    # Archivo donde nginx anota cada petición recibida
    access_log /var/log/nginx/access.log;

    # Bloque « server »: un sitio web (un « sitio virtual », véase más abajo)
    server {
        # Escucha el puerto 80
        listen 80;
        # Este bloque responde a las peticiones cuya cabecera Host es uno de estos dos nombres
        server_name exemple.test www.exemple.test;
        # La carpeta que contiene los archivos del sitio
        root /var/www/exemple;
        # Archivo devuelto cuando la dirección pedida es una carpeta (« / »)
        index index.html;

        # Bloque « location »: regla para las rutas que empiezan por « / » (todas)
        location / {
            # Busca el archivo ($uri), luego una carpeta del mismo nombre; si no, estado 404
            try_files $uri $uri/ =404;
        }
    }
}
```

`$uri` es una **variable** de nginx: contiene la ruta pedida por el cliente (por ejemplo `/contact.html`). Una vez escrito el archivo, bastan dos comandos para comprobarlo y aplicarlo sin cortar a los visitantes en curso (`sudo` es el comando que ejecuta el siguiente con privilegios de administrador, necesarios aquí):

```bash
# -t : « test », comprueba la sintaxis del archivo de configuración sin arrancar nada
sudo nginx -t
# -s reload : pide a nginx que vuelva a leer su configuración sin detenerse
sudo nginx -s reload
```

Para servir PHP, se añade, dentro del bloque `server`, un bloque `location` (con `index index.php;` si la dirección pedida puede ser una carpeta) que transmite las peticiones de los archivos `.php` a PHP-FPM, como en el esquema de la sección anterior:

```nginx
# Las rutas que terminan en .php (el « ~ » introduce una expresión regular)
location ~ \.php$ {
    # Retoma las variables habituales del protocolo FastCGI (el protocolo de diálogo
    # entre el servidor web y PHP-FPM)
    include fastcgi_params;
    # Indica a PHP-FPM qué script ejecutar
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    # Transmite la petición a PHP-FPM, accesible por este socket (ruta variable)
    fastcgi_pass unix:/run/php/php-fpm.sock;
}
```

Una **expresión regular** es un patrón de búsqueda en un texto (véase [el capítulo dedicado](/?c=langages&s=javascript&p=regex)). El protocolo FastCGI y el socket de PHP-FPM se explican en el [capítulo sobre PHP-FPM](/?c=langages&s=php&p=php-fpm).

### Lo mismo con Apache y Caddy

Para comparar, aquí está el mismo sitio en Apache. Esta configuración deriva de la que se ejecutó **realmente** para este capítulo: solo aparece uno de los dos sitios, las rutas están abreviadas y la línea `LogFormat` se muestra más abajo, en la sección sobre los registros. Un archivo de instalación habitual, en cambio, se divide en varios fragmentos:

```apache
# La carpeta de trabajo del servidor (rutas relativas, archivos temporales)
ServerRoot "/ruta/a/apache"
# Escucha el puerto 8082 de la máquina local
Listen 127.0.0.1:8082
# Carga el módulo que gestiona las conexiones (véase la sección sobre los trabajadores)
LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so
# Módulo que decide quién tiene derecho a acceder a qué
LoadModule authz_core_module /usr/lib/apache2/modules/mod_authz_core.so
# Módulo que sirve index.html cuando la dirección pedida es una carpeta
LoadModule dir_module /usr/lib/apache2/modules/mod_dir.so
# Módulo que asocia una extensión a un tipo de contenido
LoadModule mime_module /usr/lib/apache2/modules/mod_mime.so
# La tabla de tipos de contenido
TypesConfig /etc/mime.types
# El archivo de errores
ErrorLog "/ruta/a/apache/logs/error.log"
# El nombre del propio servidor (evita una advertencia al arrancar)
ServerName localhost

# Un sitio: el bloque se abre para la dirección y el puerto indicados
<VirtualHost 127.0.0.1:8082>
    # Responde a las peticiones cuya cabecera Host es a.exemple.test
    ServerName a.exemple.test
    # La carpeta que contiene los archivos del sitio
    DocumentRoot "/ruta/a/apache/site-a"
    # El archivo donde se anota cada petición, en formato « combined » (véase más abajo)
    CustomLog "/ruta/a/apache/logs/access-a.log" combined
    # Reglas que se aplican a esta carpeta
    <Directory "/ruta/a/apache/site-a">
        # Permite a todo el mundo leer esta carpeta
        Require all granted
    </Directory>
</VirtualHost>
```

El formato `combined` se define en el archivo de prueba mediante una línea `LogFormat`. Como con nginx, se comprueba antes de aplicar:

```bash
# -t : comprueba la sintaxis del archivo indicado con -f, sin arrancar el servidor
apache2 -t -f /ruta/a/apache/httpd.conf
```

```text
Syntax OK
```

En Caddy, el mismo sitio cabe en dos directivas (**no verificado**: Caddy no está instalado en la máquina de redacción). El archivo se llama `Caddyfile`:

```text
# El sitio: « :8080 » significa « el puerto 8080, con cualquier nombre »
:8080 {
    # La carpeta que contiene los archivos del sitio (« * »: para todas las rutas)
    root * /var/www/exemple
    # Activa el envío de los archivos estáticos de esta carpeta
    file_server
}
```

| Necesidad | nginx | Apache | Caddy |
|---|---|---|---|
| Escuchar un puerto | `listen 80;` | `Listen 80` | `:80 { ... }` |
| Nombre del sitio | `server_name` | `ServerName` | El nombre al inicio del bloque |
| Carpeta del sitio | `root` | `DocumentRoot` | `root *` |
| Probar la configuración | `nginx -t` | `apache2 -t` (`httpd -t` en otras distribuciones) | `caddy validate` |

## Varios sitios en una misma máquina: los sitios virtuales

Un proveedor de alojamiento puede tener cientos de sitios en una sola máquina, con **una sola dirección IP** y **un solo puerto 80**. ¿Cómo sabe el servidor cuál mostrar? Gracias a la cabecera **`Host`**, que el cliente envía en cada petición con el nombre del sitio escrito en la dirección: `GET / HTTP/1.1` seguido de `Host: a.exemple.test`. Es el principio de los **sitios virtuales** (*virtual hosts* en Apache, bloques `server` en nginx): un mismo programa se comporta como varios sitios distintos según el nombre pedido. La documentación de referencia de la cabecera está en [MDN](https://developer.mozilla.org/es/docs/Web/HTTP/Reference/Headers/Host).

```text
                           +---- Host: a.exemple.test ----> sitio A (carpeta site-a)
Peticiones ---> puerto 80  |
 (una sola IP)             +---- Host: b.exemple.test ----> sitio B (carpeta site-b)
                           |
                           +---- Host: otro-nombre.test ----> sitio por defecto
```

El servidor Node de la sección anterior hace exactamente eso con su tabla `sitios`. La misma dirección, el mismo puerto, dos respuestas distintas según `Host`:

```bash
# La misma dirección y el mismo puerto, pero una cabecera Host distinta en cada llamada
curl -s -H 'Host: a.exemple.test' http://127.0.0.1:8081/
curl -s -H 'Host: b.exemple.test' http://127.0.0.1:8081/
```

```text
Bienvenido al sitio A
Bienvenido al sitio B
```

Con nginx, dos sitios se escriben con dos bloques `server` dentro del bloque `http` (**no verificado**, la sintaxis es la del archivo de la sección anterior):

```nginx
server {
    # Primer sitio: responde al nombre a.exemple.test
    listen 80;
    server_name a.exemple.test;
    root /var/www/site-a;
}

server {
    # Segundo sitio: responde al nombre b.exemple.test
    listen 80;
    server_name b.exemple.test;
    root /var/www/site-b;
}
```

¿Qué ocurre cuando el nombre pedido no corresponde a ningún sitio? Cada servidor tiene una regla de reserva. Con la prueba de Apache realizada para este capítulo (dos sitios virtuales `a.exemple.test` y `b.exemple.test`), una petición con `Host: inconnu.test` recibió un estado `200`: es el **primer** sitio declarado en el archivo el que responde, el sitio por defecto. El mismo comportamiento existe en nginx (el primer bloque `server`, salvo que se designe otro con `listen 80 default_server;`).

> **Trampa:** el sitio por defecto se sirve a cualquiera que conozca solo la dirección IP, o a un robot que prueba todas las direcciones. Si es un sitio real, queda expuesto bajo un nombre que nadie eligió.
>
> **Buena práctica:** declarar en primer lugar un sitio «papelera» que responda con un error o una página vacía. Con nginx: `server { listen 80 default_server; return 444; }` (el estado `444` es propio de nginx: cierra la conexión sin responder nada).

Para probar un sitio virtual sin comprar un nombre de dominio, hay dos soluciones locales: el [archivo hosts](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) del sistema, que asocia un nombre con una dirección IP, o la opción `--resolve` de curl:

```bash
# Indica a curl: el nombre a.exemple.test:8081 se encuentra en la dirección 127.0.0.1
curl -s --resolve a.exemple.test:8081:127.0.0.1 http://a.exemple.test:8081/
```

```text
Bienvenido al sitio A
```

Un **nombre de dominio** es el nombre legible de un sitio (`exemple.test`). El sufijo `.test` está reservado para las pruebas, como la dirección `203.0.113.10` vista más arriba: no existe en la Internet real. Resolver un nombre en una dirección es la función del [**DNS**](https://developer.mozilla.org/fr/docs/Glossary/DNS) (*Domain Name System*): el directorio de Internet que traduce `exemple.test` en una dirección IP. El archivo hosts y `--resolve` omiten este directorio para tus pruebas.

## Los puertos 80 y 443, y HTTPS

**HTTPS** es HTTP envuelto en una capa de cifrado, **TLS** (*Transport Layer Security*): el contenido de los intercambios se vuelve ilegible para quien intercepte el tráfico por el camino, y el cliente puede verificar que habla con el servidor correcto. HTTPS escucha tradicionalmente el puerto `443`. Para el cifrado en sí (claves, certificados), véase [la criptografía aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee): el mismo capítulo muestra también cómo fabricar un certificado autofirmado, con el comando `openssl`. Un certificado **autofirmado** es un certificado que tú mismo firmas y que nadie más reconoce.

Un servidor HTTPS necesita dos archivos:

| Archivo | Contenido | ¿Hay que protegerlo? |
|---|---|---|
| El certificado | La clave pública del servidor, su nombre y la firma de una autoridad de certificación que atestigua el vínculo entre ambos | No, se envía a cada visitante |
| La clave privada | La clave secreta que demuestra que el servidor es el propietario del certificado | **Sí, estrictamente**: quien la tenga puede hacerse pasar por el sitio |

La prueba se hizo con Apache, con un certificado autofirmado para `a.exemple.test` (obtenido con el comando `openssl req -x509 ...` del capítulo citado más arriba, con la opción `-addext "subjectAltName=DNS:a.exemple.test"` que precisa el nombre cubierto) y dos sitios: uno en el puerto `8082` que redirige, y otro en `8443` en HTTPS (los puertos `80` y `443` exigen privilegios especiales, véase más abajo). Extracto de la configuración:

```apache
# Puerto « HTTP » de la prueba: responde con una redirección hacia la versión cifrada
<VirtualHost 127.0.0.1:8082>
    ServerName a.exemple.test
    # Redirect permanent: estado 301 « movido permanentemente » hacia la nueva dirección
    Redirect permanent / https://a.exemple.test:8443/
</VirtualHost>

# Puerto « HTTPS » de la prueba: sirve el sitio
<VirtualHost 127.0.0.1:8443>
    ServerName a.exemple.test
    DocumentRoot "/ruta/a/apache/site-a"
    # Activa el cifrado TLS en este sitio
    SSLEngine on
    # El certificado, enviado a cada visitante
    SSLCertificateFile "/ruta/a/tls/certificado.pem"
    # La clave privada, que nunca sale del servidor
    SSLCertificateKeyFile "/ruta/a/tls/clave-privada.pem"
</VirtualHost>
```

Primera petición, en HTTP simple:

```bash
curl -s -i --resolve a.exemple.test:8082:127.0.0.1 http://a.exemple.test:8082/
```

```text
HTTP/1.1 301 Moved Permanently
Location: https://a.exemple.test:8443/
```

(Extracto: la respuesta contiene otras cabeceras y un cuerpo HTML breve.) El servidor no sirve la página: responde `301` con una cabecera `Location` que indica la nueva dirección, y el navegador la sigue. Segunda petición, en HTTPS, con `-v` para ver la negociación TLS (**apretón de manos**, *handshake*) y `--cacert` para indicar a curl que confíe en el certificado autofirmado:

```bash
# --cacert : confía en este certificado concreto, a falta de una autoridad reconocida
curl -sv --cacert certificado.pem --resolve a.exemple.test:8443:127.0.0.1 \
    https://a.exemple.test:8443/
```

Líneas pertinentes de la salida (extracto):

```text
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, Finished (20):
*  subject: CN=a.exemple.test
*  subjectAltName: host "a.exemple.test" matched cert's "a.exemple.test"
*  SSL certificate verify ok.
< HTTP/1.1 200 OK
<h1>Site A</h1>
```

El cliente saluda (*Client hello*), el servidor responde y presenta su certificado, ambos se ponen de acuerdo sobre una clave, y solo después sale la petición HTTP, ya cifrada. Sin `--cacert`, la misma llamada falla:

```text
curl: (60) SSL certificate problem: self-signed certificate
```

Es el comportamiento esperado: un certificado que nadie reconocido ha firmado no prueba nada. Un navegador mostraría una página de advertencia.

| Pregunta | Respuesta |
|---|---|
| ¿Dónde obtener un certificado verdadero y gratuito? | En **Let's Encrypt**, una autoridad de certificación gratuita que emite certificados mediante un protocolo automático, [ACME](https://datatracker.ietf.org/doc/html/rfc8555) ([documentación](https://letsencrypt.org/docs/)) |
| ¿Quién lo renueva? | Una herramienta (como [Certbot](https://certbot.eff.org)) que habla ese protocolo y vuelve a cargar el servidor; los certificados tienen una vida corta, así que la renovación automática es imprescindible |
| ¿Y en Caddy? | Caddy sabe pedir y renovar los certificados por sí solo para un sitio con un nombre de dominio real (**no verificado** aquí, véase su [documentación](https://caddyserver.com/docs/automatic-https)) |
| ¿Qué hacer con el puerto 80? | Mantenerlo abierto solo para redirigir hacia el 443 (y para la validación del certificado en algunos métodos) |

Redirección del puerto 80 hacia el 443 en nginx (**no verificado**):

```nginx
server {
    # El puerto HTTP: no sirve ninguna página, solo redirige hacia HTTPS
    listen 80;
    server_name exemple.test;
    # Estado 301 hacia la misma dirección https ($host: nombre recibido; $request_uri: ruta)
    return 301 https://$host$request_uri;
}
```

Un último punto práctico: en Linux, un programa normal no tiene permiso para escuchar un puerto inferior a 1024. Este límite es comprobable en la máquina de redacción (`cat /proc/sys/net/ipv4/ip_unprivileged_port_start` muestra `1024`), y el servidor Node, lanzado como usuario ordinario tras sustituir 8081 por 80 en `listen`, se queja:

```text
Error: listen EACCES: permission denied 127.0.0.1:80
```

Por eso, según su documentación, los servidores web de producción arrancan con privilegios de administrador el tiempo de abrir los puertos `80` y `443`, y luego confían el trabajo a procesos con privilegios reducidos (**no verificado**: haría falta tener privilegios de administrador para reproducirlo). El **cortafuegos** de la máquina también debe dejar pasar estos puertos: véase [el capítulo sobre UFW y firewalld](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld). En [Docker](/?c=infrastructure-devops&s=docker&p=docker), el puerto se publica con `-p 8080:80`, explicado en [el capítulo sobre volúmenes y redes](/?c=infrastructure-devops&s=docker&p=volumes-et-reseaux).

## Procesos trabajadores y conexiones simultáneas

Un sitio popular recibe miles de peticiones por segundo. El servidor no puede atender a los visitantes uno por uno haciendo esperar a todos los demás. Se combinan dos ideas:

- **Varios trabajadores** (*workers*): un **proceso** es un programa en ejecución; un servidor web arranca varios que se reparten el trabajo (véase [la gestión de procesos](/?c=langages&s=c&p=processus) para su funcionamiento). Un proceso **maestro** (*master*) los lanza y los vigila; los trabajadores atienden las peticiones.
- **Varias conexiones por trabajador**: un trabajador no se bloquea esperando a un cliente lento. Vigila muchas conexiones a la vez y solo se ocupa de las que tienen algo que hacer. Es el [bucle de eventos](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) descrito en el capítulo sobre sockets.

```text
               +--------------------------+
               |   proceso maestro        |  lanza, vigila, recarga la configuración
               +--------------------------+
                   |        |        |
              +--------+ +--------+ +--------+
              |trabaj.1| |trabaj.2| |trabaj.3|   cada uno: un bucle de eventos
              +--------+ +--------+ +--------+
               /  |  \     /  |  \     /  |  \
          conexiones   conexiones   conexiones    (cientos cada uno)
```

> **Analogía:** un camarero de restaurante que toma un pedido, lo transmite a la cocina y luego pasa a la mesa siguiente en lugar de quedarse plantado delante de la cocina esperando el plato.

El servidor Node de este capítulo es un ejemplo diminuto: funciona en un solo proceso, pero la ruta `/lento` espera un segundo antes de responder. Tres clientes la piden al mismo tiempo:

```bash
# time : mide la duración del comando entre paréntesis
# for i in 1 2 3; do ... done : repite lo que hay entre do y done para i = 1, 2, 3
# (véase el capítulo sobre los bucles en Bash)
# El & lanza cada petición en paralelo; wait espera a que terminen
time (for i in 1 2 3; do curl -s http://127.0.0.1:8081/lento & done; wait)
```

```text
terminado
terminado
terminado

real    0m1,01s
```

El tiempo total medido por `time` es de **1,01 segundos**, y no 3 segundos: el servidor no esperó al final de la primera respuesta para aceptar la segunda. Las tres peticiones esperaron juntas.

En nginx, dos directivas del archivo de configuración determinan la capacidad:

| Directiva | Función | Valor en el ejemplo |
|---|---|---|
| `worker_processes` | Número de trabajadores (en la práctica, uno por núcleo del procesador, es decir, por unidad de cálculo del chip) | `auto` |
| `worker_connections` | Número máximo de conexiones por trabajador | `1024` |

El límite teórico de conexiones simultáneas es su producto: 4 núcleos × 1024 conexiones = 4096 (**no verificado**, nginx no está instalado; el límite real depende también del sistema, véase más abajo). Cada conexión abierta consume un [descriptor de archivo](/?c=langages&s=c&p=appels-systeme-et-descripteurs), y el sistema limita su número por proceso (véanse [los límites de recursos](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). Un valor de `worker_connections` superior a ese límite no sirve, pues, para nada.

Apache ofrece varias formas de trabajar, llamadas **MPM** (*Multi-Processing Module*), es decir, un módulo que decide cómo se reparten las conexiones entre procesos e **hilos** (*threads*, unidades de ejecución paralelas dentro de un mismo proceso):

| MPM | Funcionamiento (según la documentación de Apache) | Observación |
|---|---|---|
| `prefork` | Un proceso por conexión, sin hilos | Robusto, muy exigente en memoria; impuesto por algunos módulos antiguos |
| `worker` | Varios procesos, cada uno con varios hilos | Menos memoria que `prefork` |
| `event` | Como `worker`, pero las conexiones inactivas se gestionan aparte para liberar los hilos | Opción habitual hoy |

En la máquina de redacción, el comando `apache2 -f httpd.conf -V` informa `Server MPM: event`, y el comando `ps -o pid,ppid,comm` (que lista los procesos) muestra, durante la prueba, un padre y varios hijos. El PID es el número de identificación de un proceso, el PPID el de su proceso padre:

```text
    PID    PPID COMMAND
  84277   84275 apache2
  84278   84277 apache2
  84279   84277 apache2
  84354   84277 apache2
```

Los procesos 84278, 84279 y 84354 son hijos del proceso 84277. Las descripciones de `prefork` y `worker` de arriba están **no verificadas** aquí: solo `event` estaba disponible en esta prueba.

> **Trampa:** subir `worker_connections` demasiado sin mirar la memoria disponible: cada conexión consume un poco, y una máquina saturada ralentiza todo el sitio. Para los ataques que buscan precisamente saturar un servidor, véase [la sobrecarga y la denegación de servicio a nivel de aplicación](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

## Los registros de acceso y de errores

Un servidor web escribe continuamente lo que hace en archivos de texto, los **registros** (*logs*). Responden a la pregunta «¿qué ha pasado, y para quién?». Siempre hay dos:

| Registro | Contenido | Cuándo leerlo |
|---|---|---|
| Registro de **acceso** (*access log*) | Una línea por petición recibida: quién, cuándo, qué, con qué estado | Ver quién visita, detectar los `404`, medir el tráfico |
| Registro de **errores** (*error log*) | Los problemas que encuentra el propio servidor y su arranque | Un sitio que responde `500`, un servidor que no arranca |

Ubicación habitual (la de Apache está verificada en la máquina de redacción, las otras dos **no verificadas**):

| Servidor | Acceso | Errores |
|---|---|---|
| Apache (Debian, Ubuntu) | `/var/log/apache2/access.log` | `/var/log/apache2/error.log` |
| nginx | `/var/log/nginx/access.log` | `/var/log/nginx/error.log` |
| Caddy | Desactivado por defecto, configurable en el `Caddyfile` | Mostrados en la terminal donde se ejecuta Caddy |

### Leer una línea del registro de acceso

nginx y Apache (Debian) escriben por defecto en formato **combined** («combinado»), y Caddy escribe en JSON. Estas son diez líneas obtenidas durante las pruebas de este capítulo: diez peticiones enviadas a un sitio Apache de dos páginas (`/` y `/contact.html`), tres de ellas hacia páginas que no existen. El formato se define en la configuración de prueba mediante:

```apache
# Define un formato llamado « combined »: cada % es una variable sustituida por un valor
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
```

```text
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /absent.html HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /wp-login.php HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /.env HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "https://x.test/" "Mozilla"
```

Desglose de la última línea:

| Fragmento | Variable | Significado |
|---|---|---|
| `127.0.0.1` | `%h` | La dirección IP del cliente |
| `-` (primero) | `%l` | Identidad del cliente según un protocolo antiguo, casi siempre ausente (`-`) |
| `-` (segundo) | `%u` | Nombre de usuario, si el sitio pide autenticación (si no, `-`) |
| `[31/Oct/2026:21:14:30 +0100]` | `%t` | Fecha y hora de la petición, con la diferencia horaria |
| `"GET / HTTP/1.1"` | `%r` | La línea de petición: método, ruta, versión |
| `200` | `%>s` | El código de estado de la respuesta |
| `16` | `%b` | El tamaño del cuerpo enviado, en bytes (`-` si no hay) |
| `"https://x.test/"` | `%{Referer}i` | La página desde la que llega el visitante (`-` si se desconoce) |
| `"Mozilla"` | `%{User-Agent}i` | El software del cliente |

La cabecera se escribe `Referer`, con una sola `r` central: es una falta de ortografía presente desde el origen de la norma, conservada desde entonces.

Fíjate en las líneas `404`: `/wp-login.php` (la página de inicio de sesión de [WordPress](https://wordpress.org), un programa muy extendido para crear sitios) y `/.env` (un archivo que a menudo contiene las contraseñas y claves de acceso de una aplicación, véase [la gestión de secretos](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) no existen en este sitio, pero unos robots los piden por toda Internet, con la esperanza de dar con una página de administración o un archivo de secretos mal protegido. Estos `404` son, pues, **normales** y no tienen consecuencias. Una línea `/.env` con estado `200` sería, al contrario, grave: un archivo que no debía publicarse lo está.

### Leer una línea del registro de errores

Para ver más detalles, Apache acepta un **nivel de registro** (`LogLevel info`): cuanto más se acerca el nivel a `debug`, más charlatán es el registro. Los niveles, del más grave al más charlatán, son `emerg`, `alert`, `crit`, `error`, `warn`, `notice`, `info`, `debug` (nginx los toma de la misma forma: **no verificado**). Dos peticiones provocan dos líneas en el registro de errores; la primera corresponde a un archivo ausente, la segunda a una dirección que contiene `../` (un intento de salir de la carpeta del sitio para llegar a `/etc/passwd`, el archivo que enumera las cuentas de un sistema Linux):

```text
[Sat Oct 31 21:07:24.865848 2026] [core:info] [pid 81231:tid 134962096056000]
    [client 127.0.0.1:52190] AH00128: File does not exist: [...]/site-a/absent.html
[Sat Oct 31 21:07:24.871139 2026] [core:error] [pid 81320:tid 134962096056000]
    [client 127.0.0.1:52192] AH10244: invalid URI path (/../../etc/passwd)
```

(Cada entrada ocupa una sola línea en el archivo real; aquí se corta para la lectura, y la ruta de una carpeta temporal se abrevia como `[...]`.) Los fragmentos, de izquierda a derecha: la hora, `[módulo:nivel]`, el número de proceso (`pid`) y de hilo de ejecución (`tid`) que atendió la petición, el cliente, un código propio de Apache (`AH...`), y luego el mensaje. Este código es valioso: se busca tal cual en la [documentación](https://httpd.apache.org/docs/current/) o en Internet.

### Buscar en un registro con comandos

Un registro puede contener millones de líneas: no se lee a ojo. Las herramientas del [procesamiento de texto en Bash](/?c=langages&s=bash&p=traitement-de-texte) (`grep`, `awk`, `sort`, `uniq`) y las [tuberías](/?c=langages&s=bash&p=redirections-et-pipes) (`|`, que envía la salida de un comando a la entrada del siguiente) bastan. En el formato `combined`, `awk` numera las columnas separadas por espacios: `$7` es la ruta, `$9` el estado.

```bash
# Sigue el registro en directo (Ctrl+C para detener): ver llegar las peticiones
tail -f /var/log/apache2/access.log
# Cuenta las peticiones por estado: extrae la columna 9, ordena y cuenta los duplicados
# sort -rn : -n ordena por valor numérico, -r invierte el orden (el mayor primero)
awk '{print $9}' access-a.log | sort | uniq -c | sort -rn
```

```text
      7 200
      3 404
```

```bash
# ¿Qué rutas han provocado un 404? (columna 9 igual a 404, mostramos la ruta)
awk '$9==404 {print $7}' access-a.log | sort | uniq -c | sort -rn
```

```text
      1 /wp-login.php
      1 /.env
      1 /absent.html
```

```bash
# Las tres páginas más pedidas (head -n 3 : conserva las tres primeras líneas)
awk '{print $7}' access-a.log | sort | uniq -c | sort -rn | head -3
```

```text
      4 /
      3 /contact.html
      1 /wp-login.php
```

| Comando | Función |
|---|---|
| `tail -f archivo` | Muestra el final del archivo y lo actualiza en directo (*follow*) |
| `tail -n 50 archivo` | Muestra las últimas 50 líneas |
| `grep ' 500 ' archivo` | Conserva las líneas que contienen el estado `500` |
| `awk '{print $1}' archivo \| sort \| uniq -c` | Cuenta las peticiones por dirección IP |
| `sort -rn` | Ordena de mayor a menor número (el más frecuente primero) |
| `head -n 3` | Conserva las 3 primeras líneas |

Cuando hay que leer juntos los registros de decenas de máquinas, se centralizan en una herramienta dedicada: véase [la agregación de registros con ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs).

### Los registros crecen: la rotación

Un registro solo hace crecer. Sin precaución, acaba por llenar el disco, y un disco lleno detiene el sitio. La **rotación** consiste en renombrar periódicamente el archivo actual (`error.log` se convierte en `error.log.1`), en empezar uno nuevo, en comprimir los antiguos (`.gz`: archivo comprimido con gzip) y en borrar los más viejos. En la máquina de redacción, la carpeta de Apache muestra el resultado de esta operación:

```text
access.log   error.log   error.log.1   error.log.2.gz   error.log.3.gz
error.log.4.gz   other_vhosts_access.log
```

En Linux, es el programa [`logrotate`](https://github.com/logrotate/logrotate) quien se encarga, según sus propios archivos de configuración (comportamiento general; su configuración no se detalla aquí). Los registros de acceso contienen direcciones IP de visitantes, que son **datos personales** en el sentido del [**RGPD**](https://www.cnil.fr/fr/reglement-europeen-protection-donnees) (el reglamento europeo de protección de datos personales): no se guardan indefinidamente y su acceso se concede solo a quienes lo necesitan.

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Modificar la configuración y recargar sin probar | Un error de sintaxis puede impedir el reinicio y cortar el sitio | Ejecutar siempre `nginx -t` o `apache2 -t` antes de recargar |
| Olvidar el punto y coma final de una directiva nginx | El archivo se rechaza, el servidor no arranca | Leer el mensaje de error: indica el número de línea |
| Servir una carpeta demasiado amplia | `root /var/www` publica todo lo que contiene, incluidos archivos de copia de seguridad o de secretos | Publicar solo la carpeta del sitio, y nunca dejar en ella ningún `.env` ni archivo de copia |
| Un sitio por defecto que sirve un sitio real | Alguien que solo conoce la dirección IP ve un sitio que no debía ver | Declarar un primer sitio «papelera» (respuesta vacía o error) |
| `EADDRINUSE` al arrancar | El puerto ya lo ocupa otro programa (a menudo la instancia anterior del mismo servidor) | Detener el otro programa o cambiar de puerto |
| Confundir un mensaje de curl con un estado HTTP | `Failed to connect` no es un estado: nadie escucha | Comprobar primero que el servidor está en marcha y escucha el puerto correcto |
| Un registro que crece sin fin | Un disco lleno detiene el sitio | Configurar la rotación y vigilar el espacio en disco |
| Clave privada legible por todos o enviada a un repositorio | Quien la lea puede hacerse pasar por el sitio | Permisos restringidos solo a la cuenta del servidor, nunca en un repositorio Git |
| Certificado caducado | Los navegadores muestran una advertencia o bloquean el sitio | Renovación automática y vigilancia de la fecha de caducidad |

El mensaje `EADDRINUSE` se reproduce al lanzar dos veces el servidor de este capítulo:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:8081
```

## Buenas prácticas

| Práctica | Razón |
|---|---|
| Probar la configuración antes de recargar (`nginx -t`, `apache2 -t`) | Un error se detecta antes de tener efectos |
| Recargar en lugar de reiniciar (`nginx -s reload`) | Los visitantes en curso no se cortan |
| Redirigir sistemáticamente el puerto 80 hacia el 443 | Nunca se sirve una página sin cifrado |
| Automatizar la renovación de los certificados | Un certificado que caduca corta el sitio, y nadie se acuerda de renovarlo a mano |
| Guardar la configuración en un repositorio [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base) | Se ve quién cambió qué y se puede volver atrás |
| Leer primero el registro de errores cuando un sitio responde `500` | Dice por qué, mientras que el navegador no dice nada |
| Hacer que el servidor de aplicación escuche en `127.0.0.1` cuando no tiene que ser público | Solo la máquina puede alcanzarlo; el servidor web, colocado delante, retransmite las peticiones (véase [el proxy inverso](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit)) |
| Mantener el servidor web actualizado | Un servidor expuesto a Internet es escaneado permanentemente |
| Añadir un filtro delante si el sitio está expuesto | Véase [el WAF (cortafuegos de aplicaciones)](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), que se añade al código seguro sin reemplazarlo |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un servidor web es un programa que escucha un puerto (`80` para HTTP, `443` para HTTPS), recibe una petición y devuelve una respuesta (estado, cabeceras, cuerpo). Sirve archivos (estático) o transmite a un programa de aplicación (dinámico, por ejemplo PHP-FPM). La cabecera `Host` le permite alojar varios sitios en una misma dirección. Reparte el trabajo entre varios procesos trabajadores que gestionan cada uno muchas conexiones. Escribe un registro de acceso (una línea por petición) y un registro de errores. |
| **Trampas que evitar** | Recargar sin probar la configuración. Dejar un sitio por defecto que sirve un contenido real. Publicar una carpeta demasiado amplia. Exponer una clave privada. Olvidar la rotación de los registros. Tomar un `404` de un robot por un error. |
| **Buenas prácticas** | Probar y luego recargar. Pasar todo a HTTPS con renovación automática del certificado. Leer el registro de errores antes de buscar en otra parte. Vigilar el espacio en disco y guardar la configuración en Git. |

## En esta subsección

Esta subsección, «Servidores web», cuenta este capítulo introductorio y dos capítulos que lo complementan:

| Capítulo | Tema |
|---|---|
| [Códigos de estado y cabeceras de control](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle) | Los estados HTTP en detalle y las cabeceras que controlan el comportamiento del cliente, como `Retry-After` |
| [Proxy inverso y limitación de la tasa de peticiones](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) | Colocar un servidor delante de otros servidores, y limitar el número de peticiones aceptadas |
