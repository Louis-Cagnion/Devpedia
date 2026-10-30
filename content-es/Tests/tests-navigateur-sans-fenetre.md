---
order: 12
---

# Probar una interfaz en un navegador sin ventana (29/10/2026)

Un **navegador** es el programa que muestra las páginas web (Chrome, Firefox, Safari...). La **interfaz** de una aplicación web es lo que el usuario ve y manipula: botones, campos, textos. Probar una interfaz consiste en abrir la página en un navegador de verdad, hacer clic y escribir en lugar de una persona, y después comprobar lo que aparece. Este capítulo lo hace con un navegador **sin ventana** (en inglés *headless*, « sin cabeza »): un navegador de verdad, con su motor completo (carga la página, ejecuta su JavaScript, calcula la maquetación), pero que no dibuja nada en pantalla y que solo se controla por programa.

El control lo asegura un **banco de pruebas** escrito a mano: una pequeña herramienta que lanza el navegador, ejecuta las pruebas, señala los fallos y lo recoge todo al final. Habla con el navegador mediante el **Chrome DevTools Protocol** (*CDP*, « protocolo de las herramientas de desarrollo de Chrome »; un **protocolo** es un conjunto de reglas que fijan cómo dialogan dos programas) y ocupa unas 220 líneas de JavaScript. Escribir este banco una vez permite entender qué hacen por usted las herramientas listas para usar, como [Playwright](https://playwright.dev/docs/intro) y [Puppeteer](https://pptr.dev/), comparadas [más abajo](#playwright-puppeteer-o-un-banco-propio).

Este capítulo complementa [las pruebas end-to-end](/?c=tests&p=tests-end-to-end), que explican **por qué** y **cuándo** simular un recorrido completo de usuario: aquí vemos **cómo** hacerlo funcionar en la práctica. Supone conocidos [la terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana donde se escriben órdenes), [las etiquetas y los atributos HTML](/?c=langages&s=html&p=structure-dun-document), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions), [el DOM y los eventos](/?c=langages&s=javascript&p=dom-et-evenements) (la página vista como un árbol de elementos que JavaScript manipula), [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone) (`async`, `await` y las promesas: operaciones cuyo resultado llega más tarde) y [la gestión de errores](/?c=langages&s=javascript&p=gestion-des-erreurs) (`try`, `catch`, `finally`).

| Paso del banco | Qué ocurre | Sección |
|---|---|---|
| 1. Lanzar | Chrome arranca sin ventana, con un **perfil** nuevo (su carpeta de ajustes) y un **puerto de depuración** abierto (una puerta numerada por la que se le controla) | [Lanzar Chrome sin ventana](#lanzar-chrome-sin-ventana) |
| 2. Conectarse | La prueba abre una conexión [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) (un canal que permanece abierto) hacia la página | [El CDP](#el-cdp-comandos-json-enviados-por-websocket) |
| 3. Actuar | La prueba envía órdenes: navegar, hacer clic, escribir | [El banco, pieza a pieza](#el-banco-pieza-a-pieza) |
| 4. Esperar | La prueba aguarda hasta el estado deseado, sin pausa fija | [Esperar un estado](#esperar-un-estado-en-lugar-de-dormir-un-plazo-fijo) |
| 5. Verificar | La prueba lee la página y compara con lo esperado | [Leer la página y escribir aserciones](#leer-la-pagina-y-escribir-aserciones) |
| 6. Diagnosticar y cerrar | Si hay un fallo, se toma una captura de imagen; después se cierra Chrome | [Capturar una imagen](#capturar-una-imagen-para-diagnosticar-un-fallo) |

## Por qué un navegador sin ventana

Para comprobar que una página funciona existen tres enfoques. Una **petición HTTP** (la solicitud que un programa envía a un servidor para obtener un archivo, véase [la API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) solo recupera el texto de la página: no se ejecuta ningún JavaScript, así que ningún botón reacciona. Un navegador con ventana hace todo, pero exige una pantalla. El navegador sin ventana hace todo, sin pantalla.

| | Petición HTTP sola | Navegador sin ventana | Navegador con ventana |
|---|---|---|---|
| Ejecuta el JavaScript de la página | No | Sí | Sí |
| Calcula la maquetación, como para el usuario | No | Sí | Sí |
| Necesita una pantalla | No | No | Sí |
| Puede funcionar en un servidor sin pantalla | Sí | Sí | Solo si la máquina proporciona una pantalla, aunque sea ficticia |
| Una persona puede verlo en directo | No aplica | No: se toman capturas de imagen | Sí |
| Uso típico | Comprobar que una dirección responde | Pruebas automáticas | Entender una prueba mirándola |

Tres razones concretas motivan esta elección.

| Razón | Explicación |
|---|---|
| Servidor de integración continua | La **integración continua** (CI) es un servicio que ejecuta automáticamente las pruebas en cada modificación del código (véase [la canalización CI/CD](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd)). Sus máquinas no suelen tener pantalla: el navegador debe poder arrancar sin ella |
| Rapidez | Ninguna ventana que dibujar ni gestionar. En la máquina de redacción: Chrome responde en su puerto entre 0,65 y 0,84 s tras su lanzamiento (cuatro intentos), y seis pruebas duran de 0,33 a 0,76 s cada una, es decir, unos 2,5 s en total |
| Reproducibilidad | Un perfil nuevo (ninguna extensión, ningún ajuste personal) y un tamaño de página fijado dan el mismo resultado en cada máquina. El navegador habitual del usuario nunca se toca |

## Lo que hay que tener a mano

**Node** (o Node.js) es un programa que ejecuta JavaScript fuera de un navegador, desde una terminal ([documentación oficial](https://nodejs.org/docs/latest/api/)). El banco está escrito en Node, con las únicas herramientas que trae de origen: no hay ningún paquete que instalar (un **paquete** es un conjunto de código escrito por otros que se descarga para usarlo).

| Elemento | Función | Cómo comprobarlo |
|---|---|---|
| Google Chrome | El navegador controlado | El archivo existe en su ubicación (tabla siguiente) |
| Node, versión reciente | Ejecuta el banco y las pruebas | `node --version` muestra un número de versión |
| El `WebSocket` integrado en Node | Hablar con el navegador sin paquete adicional | `node -e "console.log(typeof WebSocket)"` muestra `function` (verificado el 29/10/2026) |
| Una terminal | Lanzar las órdenes | Véase [la terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) |
| Una carpeta de trabajo | Recibe los tres archivos del capítulo: `contador.html`, `banco.mjs`, `pruebas.mjs` | Cualquier carpeta vacía |

Si `typeof WebSocket` muestra `undefined`, la versión de Node es demasiado antigua: hay que actualizarla.

El banco lee la ubicación de Chrome en una **variable de entorno** llamada `CHROME_PATH` (un valor que la terminal transmite a cada programa que lanza; véase [las variables de entorno en Bash](/?c=langages&s=bash&p=variables-denvironnement) y [en PowerShell](/?c=langages&s=powershell&p=variables-denvironnement)). Así, el mismo código funciona en todas las máquinas: solo cambia la variable.

| Sistema | Ubicación habitual de Chrome |
|---|---|
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| macOS | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Linux | `/usr/bin/google-chrome` (varía según la distribución) |

```bash
# Bash (Git Bash, la terminal instalada con Git en Windows, o la de Linux y macOS)
# export crea una variable para los programas lanzados después; en Git Bash, las barras
# oblicuas / sustituyen a las barras invertidas \
export CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

```powershell
# PowerShell: $env:NOMBRE = valor crea la variable para los programas lanzados después
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Solo se ha verificado la ubicación de Windows durante la redacción (29/10/2026): compruebe las otras dos en su máquina.

## La página a probar

Para practicar sin depender de un sitio existente, aquí tiene una pequeña página: un contador, un campo « paso » (en cuánto aumenta el contador), tres botones y una zona de mensaje. Contiene dos lentitudes voluntarias, que imitan una aplicación real: sus botones no responden hasta 300 ms después de la carga, y « Guardar » tarda 400 ms en confirmar, como lo haría un servidor.

Guarde este código con el nombre `contador.html`.

```html
<!DOCTYPE html>
<!-- lang="es": la página está escrita en español -->
<html lang="es">
<head>
    <!-- charset: codificación de los caracteres, para que « ñ » se vea bien -->
    <meta charset="utf-8">
    <!-- title: el título de la página, que las pruebas pueden leer con document.title -->
    <title>Contador</title>
</head>
<body>
    <h1>Contador</h1>
    <!-- output: muestra un resultado ; data-testid: referencia estable para las pruebas -->
    <p>Valor: <output id="valor" data-testid="valor">0</output></p>
    <!-- El campo « paso »: en cuánto aumenta el contador en cada suma -->
    <label>Paso: <input id="paso" type="text" value="1"></label>
    <!-- Tres botones ; type="button": no envían ningún formulario -->
    <button id="sumar" type="button">Sumar</button>
    <button id="reiniciar" type="button">Poner a cero</button>
    <button id="guardar" type="button">Guardar</button>
    <!-- role="status": zona cuyo texto cambia para informar al usuario -->
    <p id="estado" role="status"></p>
    <script>
        // Total del contador y acceso a los elementos de la página
        let total = 0;
        const valor = document.getElementById("valor");
        const paso = document.getElementById("paso");
        const estado = document.getElementById("estado");

        // Suma el paso al total (0 si el campo no contiene un número) y lo muestra
        function sumar() {
            total += Number(paso.value) || 0;   // Number convierte el texto en número
            valor.textContent = total;          // muestra el nuevo total
        }

        // Conecta los botones y el teclado, y después anuncia que la página está lista
        function arrancar() {
            // Un clic en « Sumar » llama a la función sumar
            document.getElementById("sumar").addEventListener("click", sumar);
            // Un clic en « Poner a cero » devuelve el total a 0
            document.getElementById("reiniciar").addEventListener("click", () => {
                total = 0;                      // el total vuelve a empezar desde cero
                valor.textContent = total;      // y la pantalla también
            });
            // Un clic en « Guardar » muestra primero un mensaje de espera
            document.getElementById("guardar").addEventListener("click", () => {
                estado.textContent = "Guardando...";
                // Simula un servidor lento: la respuesta llega 400 ms después
                setTimeout(() => {
                    estado.textContent = "Guardado: " + total;
                }, 400);
            });
            // La tecla Intro en el campo « paso » actúa como un clic en Sumar
            paso.addEventListener("keydown", (evento) => {
                if (evento.key === "Enter") sumar();
            });
            document.body.dataset.listo = "si";   // señal para las pruebas: data-listo="si"
        }

        // Simula una inicialización lenta: setTimeout llama a arrancar tras 300 ms,
        // así que los botones solo responden a partir de ese momento
        setTimeout(arrancar, 300);
    </script>
</body>
</html>
```

Las pruebas designan los elementos mediante **selectores CSS**: la escritura que designa un elemento de la página, como en [los selectores CSS](/?c=langages&s=css&p=selecteurs). `#valor` designa el elemento cuyo `id` es `valor`; `[data-testid="valor"]` designa el que tiene el atributo `data-testid` cuyo valor es « valor » (véase [los atributos `data-`](/?c=langages&s=html&p=attributs-data-et-accessibilite)). Las pruebas se apoyan en estas referencias:

| Referencia | Elemento | Comportamiento |
|---|---|---|
| `#valor` | El total mostrado | Empieza en `0` |
| `#paso` | El campo de entrada | Contiene `1` al principio ; su valor se suma en cada suma |
| `#sumar` | Botón « Sumar » | Suma el paso al total (también con la tecla Intro en `#paso`) |
| `#reiniciar` | Botón « Poner a cero » | Devuelve el total a `0` |
| `#guardar` | Botón « Guardar » | Muestra « Guardando... » y, 400 ms después, « Guardado: » seguido del total |
| `#estado` | Zona de mensaje | Vacía al principio |
| `data-listo="si"` en `<body>` | Marcador « la aplicación está lista » | Puesto 300 ms después de la carga |

El marcador `data-listo` es una costumbre útil: la aplicación indica por sí misma cuándo está lista, lo que evita tener que adivinarlo.

Una página abierta mediante una dirección `file://` (un archivo del disco, sin servidor) basta mientras no cargue otros archivos: véase [el servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) para los límites de `file://`.

## Lanzar Chrome sin ventana

Lanzar Chrome equivale a arrancar un **proceso**: un programa en ejecución, identificado por un número llamado **PID** (véase [la gestión de procesos en Bash](/?c=langages&s=bash&p=gestion-des-processus) y [en PowerShell](/?c=langages&s=powershell&p=gestion-des-processus)). Se le pasan **opciones**: palabras que empiezan por `--` y que regulan su comportamiento.

| Opción | Función |
|---|---|
| `--headless` | Arranca sin ventana |
| `--remote-debugging-port=9333` | Abre un **puerto** de depuración. Un puerto es un número (de 0 a 65535) que distingue, en una misma máquina, los programas que esperan conexiones; `9333` es una elección arbitraria: cualquier número libre sirve (véase [el servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) para `localhost` y los puertos) |
| `--user-data-dir=<carpeta>` | Designa el **perfil**: la carpeta donde el navegador guarda sus ajustes, sus **cookies** (pequeños archivos mediante los cuales un sitio reconoce a un visitante), su historial y sus **extensiones** (pequeños programas añadidos al navegador). Una carpeta nueva y vacía da un Chrome « nuevo de fábrica » y deja intacto el del usuario |
| `--no-first-run` | Omite el asistente de primer inicio de un perfil nuevo |
| `--no-default-browser-check` | No propone convertirse en el navegador predeterminado |
| `about:blank` | Dirección de inicio: una página vacía |

En la máquina de redacción (29/10/2026), `--headless` solo basta y `--headless=new` también se acepta. El nombre de la opción y sus variantes evolucionan de una versión de Chrome a otra: la [documentación oficial del modo sin ventana](https://developer.chrome.com/docs/chromium/headless) es la referencia, de ahí la fecha en el título de este capítulo. Un Chrome lanzado así se presenta como `HeadlessChrome` en su identificador (su *User-Agent*), lo que se ha comprobado.

El banco lanzará Chrome él mismo (sección [El banco](#el-banco-pieza-a-pieza)). Una vez lanzado, Chrome escucha en el puerto: es él quien servirá de ventanilla para el control.

## El CDP: comandos JSON enviados por WebSocket

Un **protocolo** es un conjunto de reglas de diálogo: qué mensajes se pueden enviar, con qué forma y en qué orden. HTTP es otro ejemplo, véase [la API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). El **Chrome DevTools Protocol** es el que usan las herramientas de desarrollo integradas en Chrome (tecla F12) para dialogar con la página; Chrome también lo ofrece a los programas ([documentación oficial](https://chromedevtools.github.io/devtools-protocol/)).

Dos tecnologías sostienen este diálogo:

- el **WebSocket**, una conexión que permanece abierta y en la que cada parte puede enviar mensajes cuando quiera, descrita en [WebSocket: la comunicación en tiempo real](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel);
- el **JSON**, un formato de texto estructurado (`{ "clave": valor }`), descrito en [el formato JSON](/?c=infrastructure-devops&s=infrastructure&p=json): cada mensaje es un pequeño texto JSON.

Chrome ofrece además un servicio HTTP minúsculo en el mismo puerto, para encontrar las direcciones WebSocket. Esto es lo que respondió `/json/version` en la máquina de redacción (los valores de versión se sustituyen por `...`):

```text
{
  Browser: 'Chrome/...',
  'File-Path-Style': 'windows',
  'Protocol-Version': '...',
  'User-Agent': 'Mozilla/5.0 (...) AppleWebKit/... HeadlessChrome/... Safari/...',
  'V8-Version': '...',
  'WebKit-Version': '...',
  webSocketDebuggerUrl: 'ws://127.0.0.1:9333/devtools/browser/<identificador>'
}
```

`webSocketDebuggerUrl` es la dirección de la conexión al **navegador** en sí. La lista de **objetivos** (páginas y otros elementos controlables), en la dirección `/json/list`, da una dirección por objetivo. En la máquina de redacción, un Chrome nuevo listaba cinco objetivos, de tipos `background_page`, `page`, `browser_ui`, `browser_ui` y `service_worker`: solo el de tipo `page` es la página que controlar. Tomar el primero de la lista sería un error.

```text
  La prueba (Node)            Chrome sin ventana                 La página
  ----------------            ------------------                 ---------
       |                              |                              |
       | 1. GET /json/list (HTTP)     |                              |
       |----------------------------->|                              |
       |<-----------------------------|  direcciones WebSocket       |
       |                              |                              |
       | 2. conexión WebSocket        |                              |
       |==============================|  (sigue abierta)             |
       |                              |                              |
       | 3. {"id":1,"method":         |                              |
       |    "Page.navigate",...}      |  carga contador.html         |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 4. {"id":1,"result":{...}}   |                              |
       |<-----------------------------|                              |
       |                              |                              |
       | 5. {"method":                |  la página ha cargado        |
       |    "Page.loadEventFired"}    |                              |
       |<-----------------------------|<-----------------------------|
       |                              |                              |
       | 6. {"id":2,"method":         |                              |
       |    "Runtime.evaluate",...}   |  ejecuta JavaScript          |
       |----------------------------->|----------------------------->|
       |                              |                              |
       | 7. {"id":2,"result":         |  el valor calculado          |
       |    {"result":{"value":..}}}  |                              |
       |<-----------------------------|<-----------------------------|
```

El paso 1 es una petición HTTP corriente (`GET` significa « dame este recurso »). Después, todo pasa por la conexión WebSocket. Solo existen tres clases de mensajes:

| Clase | Enviado por | Contiene | Se reconoce por |
|---|---|---|---|
| Orden | La prueba | Un `id` elegido por la prueba, un `method` (el nombre de la orden, con la forma `Dominio.nombre`) y `params` | La presencia de `method` **y** de `id` |
| Respuesta | Chrome | El mismo `id`, y después `result` (éxito) o `error` (fallo) | La presencia de `id` |
| Evento | Chrome | Un `method` y `params`, nunca `id`: Chrome avisa por sí mismo | `method` **sin** `id` |

El `id` permite asociar cada respuesta a su orden, puesto que varias órdenes pueden estar en vuelo a la vez. Estos son mensajes reales intercambiados en la máquina de redacción (los `<-` los recibe la prueba, los `->` los envía; el primer mensaje está partido en dos líneas para que quepa en pantalla):

```text
-> {"id":101,"method":"Runtime.evaluate",
    "params":{"expression":"document.title","returnByValue":true}}
<- {"id":101,"result":{"result":{"type":"string","value":"Contador"}}}
-> {"id":102,"method":"Foo.bar"}
<- {"id":102,"error":{"code":-32601,"message":"'Foo.bar' wasn't found"}}
<- {"method":"Page.loadEventFired","params":{"timestamp":1283163.132011}}
```

Una orden desconocida produce, por tanto, una respuesta `error`. Pero atención: una expresión JavaScript que lanza un error **en la página** no produce ningún `error`. La respuesta es un `result` que contiene un campo `exceptionDetails` (observado con `document.title.longitud.x`). El banco que sigue comprueba ese campo.

Las órdenes utilizadas en este capítulo:

| Orden | Función | Usada por |
|---|---|---|
| [`Page.navigate`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Ir a una dirección | `abrir` |
| [`Page.captureScreenshot`](https://chromedevtools.github.io/devtools-protocol/tot/Page/) | Fotografiar la página | `capturar` |
| [`Runtime.evaluate`](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/) | Ejecutar JavaScript en la página y devolver su valor | `evaluar` |
| [`Input.dispatchMouseEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simular el ratón (pulsación y suelta) | `hacerClic` |
| [`Input.dispatchKeyEvent`](https://chromedevtools.github.io/devtools-protocol/tot/Input/) | Simular el teclado (tecla pulsada, tecla soltada) | `escribir`, `pulsarIntro` |
| [`Emulation.setDeviceMetricsOverride`](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) | Fijar el tamaño de la página | `conectarPagina` |
| `Runtime.enable`, `Page.enable` | Pedir recibir los eventos de estos dominios | `conectarPagina` |
| [`Browser.close`](https://chromedevtools.github.io/devtools-protocol/tot/Browser/) | Cerrar el navegador | `cerrarNavegador` |

## El banco, pieza a pieza

El banco cabe en un archivo `banco.mjs`. La extensión `.mjs` indica a Node que el archivo es un **módulo**: un archivo que puede importar herramientas de otro (`import`) y ofrecer las suyas a otros (`export`). Los bloques que siguen se juntan uno detrás de otro, en orden, en ese mismo archivo. Algunas escrituras de JavaScript aparecen constantemente:

| Escritura | Significado | Ejemplo del banco |
|---|---|---|
| `texto ${valor} texto` | Un texto escrito entre comillas invertidas en el código, donde `${...}` inserta un valor | `El puerto ${puerto} ya está en uso` |
| `objeto?.propiedad` | Lee la propiedad si el objeto existe; si no, da `undefined` en lugar de provocar un error | `detalle.exception?.description` |
| `a ?? b` | Da `b` si `a` vale `undefined` o `null`; si no, da `a` | `detalle.exception?.description ?? detalle.text` |
| `{ ...objeto, clave: 1 }` | Copia todas las propiedades de un objeto en uno nuevo | `{ type: "keyUp", ...tecla }` |
| `new Map()` | Una tabla que asocia una clave (aquí, un número de orden) a un valor | `esperas` |
| `new Promise((ok, ko) => ...)` | Fabrica una promesa que uno mismo cumple: `ok(valor)` la cumple, `ko(error)` la hace fallar | `enviar` |
| `(x) => x + 1` | Una función flecha: una función escrita en forma abreviada | `(c) => c.type === "page"` |

### Las importaciones y la ruta de Chrome

```javascript
// El prefijo « node: » indica un módulo integrado en Node (herramientas ya incluidas)
import { spawn } from "node:child_process";                  // lanza otro programa
import { existsSync } from "node:fs";                        // ¿existe el archivo?
import { mkdtemp, rm, writeFile } from "node:fs/promises";   // carpetas y archivos
import { tmpdir } from "node:os";                            // carpeta temporal del sistema
import { join } from "node:path";                            // une las partes de una ruta
import net from "node:net";                                  // conexiones de red
import { setTimeout as pausa } from "node:timers/promises";  // pausa: una promesa

export const PUERTO = 9333;                    // puerto de depuración elegido para este banco
const CHROME = process.env.CHROME_PATH;        // ruta de Chrome, dada por el entorno
```

### `esperar`: aguardar hasta que una condición sea verdadera

Esta función es la más importante del banco: sustituye a cualquier pausa fija. Se explica en la sección [Esperar un estado en lugar de dormir un plazo fijo](#esperar-un-estado-en-lugar-de-dormir-un-plazo-fijo).

```javascript
// Reintenta condicion() hasta que devuelva un valor verdadero, o falla al agotarse el plazo
export async function esperar(condicion, descripcion, plazo = 5000) {
    const limite = Date.now() + plazo;         // la hora (en ms) que no hay que superar
    let ultimoError = null;                    // último error visto, para el mensaje final
    while (Date.now() < limite) {              // mientras el plazo no haya vencido
        try {
            const valor = await condicion();   // prueba la condición
            if (valor) return valor;           // verdadera: devuelve lo que ha encontrado
        } catch (error) {
            ultimoError = error;               // aún no está lista: anota y reintenta
        }
        await pausa(50);                       // 50 ms de pausa antes de reintentar
    }
    // El mensaje dice qué se esperaba, y el último error si lo hubo
    const detalle = ultimoError ? ` (último error: ${ultimoError.message})` : "";
    throw new Error(`Tiempo agotado (${plazo} ms): ${descripcion}${detalle}`);  // fallo neto
}
```

### `puertoLibre` y `lanzarNavegador`: arrancar Chrome

`puertoLibre` intenta conectarse al puerto: si alguien responde, está ocupado. `lanzarNavegador` verifica la ruta de Chrome y el puerto, crea una carpeta de perfil nueva (`mkdtemp` añade letras al azar a un nombre de partida para que sea único), lanza Chrome mediante `spawn` (que arranca un programa sin esperar a su fin) y después espera a que su puerto responda. Para ello, `fetch` envía una petición HTTP (véase [la API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) y devuelve una promesa de la respuesta; `respuesta.ok` vale `true` cuando el servidor ha respondido con éxito. `stdio: "ignore"` significa que los mensajes que Chrome escribe se descartan. La función devuelve lo necesario para cerrarlo todo más tarde.

```javascript
// Devuelve true si nadie escucha en este puerto de la máquina
export function puertoLibre(puerto) {
    return new Promise((resolver) => {         // una promesa: su respuesta llegará más tarde
        const socket = net.connect(puerto, "127.0.0.1");   // intenta conectarse a este puerto
        socket.on("connect", () => {           // conexión aceptada: el puerto está ocupado
            socket.destroy();                  // lo cerramos de inmediato
            resolver(false);                   // respuesta: el puerto no está libre
        });
        socket.on("error", () => resolver(true));        // rechazada: nadie escucha
    });
}
```

```javascript
// Lanza Chrome sin ventana, con un perfil nuevo, y espera a que su puerto responda
export async function lanzarNavegador(puerto = PUERTO) {
    // Primero dos comprobaciones, para fallar con un mensaje claro
    if (!CHROME || !existsSync(CHROME)) throw new Error(`CHROME_PATH no válido: ${CHROME}`);
    if (!(await puertoLibre(puerto))) throw new Error(`El puerto ${puerto} ya está en uso`);
    const perfil = await mkdtemp(join(tmpdir(), "banco-perfil-"));  // carpeta nueva y vacía
    const proceso = spawn(CHROME, [            // lanza Chrome con la lista de opciones
        "--headless",                          // sin ventana
        `--remote-debugging-port=${puerto}`,   // abre el puerto de depuración
        `--user-data-dir=${perfil}`,           // perfil desechable, nunca el de una persona
        "--no-first-run",                      // sin asistente de primer inicio
        "--no-default-browser-check",          // no propone ser el navegador predeterminado
        "about:blank",                         // página de inicio: una página vacía
    ], { stdio: "ignore" });                   // ignora los mensajes que Chrome escribe
    // Chrome tarda un instante en arrancar: esperamos a que /json/version responda
    await esperar(async () => {
        const respuesta = await fetch(`http://127.0.0.1:${puerto}/json/version`);  // pregunta
        return respuesta.ok;                   // verdadero cuando Chrome responde
    }, "Chrome no escucha en su puerto de depuración", 10000);
    return { proceso, perfil, puerto };        // lo necesario para cerrarlo más tarde
}
```

### `conectarPagina`: abrir la conversación con la página

Elige el objetivo de tipo `page`, abre la conexión WebSocket y después instala tres elementos:

| Elemento | Función |
|---|---|
| `esperas` | Retiene, para cada `id` de orden enviado, la promesa que espera su respuesta |
| `excepciones` | Recoge los errores de JavaScript lanzados en la página (evento `Runtime.exceptionThrown`), para que la prueba los vea |
| `enviar` | Envía una orden y devuelve una promesa de su respuesta: `await pagina.enviar("Page.navigate", ...)` |

También fija el tamaño de la página en 800 × 600 píxeles (un **píxel** es el punto más pequeño de una pantalla): la razón se explica en la sección [Capturar una imagen](#capturar-una-imagen-para-diagnosticar-un-fallo).

```javascript
// Se conecta a la página abierta y devuelve un objeto « página » para hablarle
export async function conectarPagina(puerto = PUERTO) {
    const objetivo = await esperar(async () => {
        const respuesta = await fetch(`http://127.0.0.1:${puerto}/json/list`);   // lista
        const objetivos = await respuesta.json();   // JSON convertido en lista de objetos
        return objetivos.find((c) => c.type === "page");   // se queda con la página real
    }, "ninguna página abierta");
    const ws = new WebSocket(objetivo.webSocketDebuggerUrl);   // abre la conexión WebSocket
    await new Promise((ok, ko) => {            // espera a que la conexión esté establecida
        ws.addEventListener("open", ok);       // abierta: todo va bien
        ws.addEventListener("error", () => ko(new Error("conexión WebSocket rechazada")));
    });
    let numero = 0;                            // número de la última orden enviada
    const esperas = new Map();                 // número de orden -> respuesta esperada
    const excepciones = [];                    // errores de JavaScript ocurridos en la página
    ws.addEventListener("message", (message) => {
        const recibido = JSON.parse(message.data);   // el texto recibido pasa a ser un objeto
        if (recibido.id !== undefined) {       // un « id »: es la respuesta a una orden
            const espera = esperas.get(recibido.id);   // averigua quién la esperaba
            if (!espera) return;               // orden desconocida para este banco: se ignora
            esperas.delete(recibido.id);       // esta respuesta ha llegado: la olvidamos
            if (recibido.error) espera.ko(new Error(recibido.error.message));  // rechazada
            else espera.ok(recibido.result);   // si no, la promesa recibe el resultado
        } else if (recibido.method === "Runtime.exceptionThrown") {   // un evento de error
            const detalle = recibido.params.exceptionDetails;   // el detalle del error
            excepciones.push(detalle.exception?.description ?? detalle.text);  // se guarda
        }
    });
    ws.addEventListener("close", () => {       // conexión perdida: no llega más respuesta
        for (const espera of esperas.values()) espera.ko(new Error("conexión cerrada"));
    });
    // Envía una orden CDP y devuelve una promesa de su respuesta
    function enviar(metodo, parametros = {}) {
        const id = ++numero;                   // número nuevo para esta orden
        return new Promise((ok, ko) => {
            esperas.set(id, { ok, ko });       // anota quién espera la respuesta
            ws.send(JSON.stringify({ id, method: metodo, params: parametros }));   // envío
        });
    }
    await enviar("Runtime.enable");            // pide recibir los eventos de error
    await enviar("Page.enable");               // y los de la página
    await enviar("Emulation.setDeviceMetricsOverride", {   // fija el tamaño de la página:
        width: 800, height: 600, deviceScaleFactor: 1, mobile: false,   // 800 x 600 píxeles
    });                                        // capturas idénticas en cada máquina
    return { enviar, excepciones, ws };        // objeto « página » usado por las herramientas
}
```

### `evaluar`, `abrir` y `textoDe`: leer y cargar

`evaluar` ejecuta en la página un texto de código JavaScript y devuelve su valor; `returnByValue` pide el valor en sí (sin eso, Chrome devuelve una referencia a un objeto de la página), `awaitPromise` espera el resultado de una promesa. `abrir` distingue **dos clases de « listo »**: el navegador ha terminado de cargar la página (`document.readyState` vale `"complete"`), y la aplicación ha terminado de arrancar (el marcador `data-listo` de la página). Ninguna de las dos sustituye a la otra, como muestra la sección sobre la espera. En `textoDe`, `JSON.stringify("#valor")` devuelve el texto `"#valor"`, comillas incluidas: así se puede insertar un selector en el código sin riesgo, aunque contenga comillas.

```javascript
// Ejecuta JavaScript en la página y devuelve su valor (texto, número, objeto...)
export async function evaluar(pagina, expresion) {
    const respuesta = await pagina.enviar("Runtime.evaluate", {
        expression: expresion,                 // el código a ejecutar, en forma de texto
        returnByValue: true,                   // devuelve el valor en sí
        awaitPromise: true,                    // si es una promesa, espera su resultado
    });
    const fallo = respuesta.exceptionDetails;  // presente si el código ha lanzado un error
    if (fallo) throw new Error(fallo.exception?.description ?? fallo.text);   // lo relanzamos
    return respuesta.result.value;             // el valor calculado en la página
}

// Abre una dirección y espera a que la página Y la aplicación estén listas
export async function abrir(pagina, direccion) {
    // Va a la dirección (Page.navigate)
    const respuesta = await pagina.enviar("Page.navigate", { url: direccion });
    // Una dirección inaccesible no lanza un error CDP: devuelve un texto de error
    if (respuesta.errorText) throw new Error(`Navegación imposible: ${respuesta.errorText}`);
    await esperar(                             // 1. la página ha cargado
        () => evaluar(pagina, "document.readyState === 'complete'"),
        "carga de la página",
    );
    await esperar(                             // 2. la aplicación se ha declarado lista
        () => evaluar(pagina, "document.body?.dataset.listo === 'si'"),
        "arranque de la aplicación (data-listo)",
    );
}

// Lee el texto de un elemento (null si no existe)
export function textoDe(pagina, selector) {
    const sel = JSON.stringify(selector);      // protege las comillas del selector
    // ?. devuelve undefined si falta el elemento; ?? null lo sustituye por null
    return evaluar(pagina, `document.querySelector(${sel})?.textContent ?? null`);
}
```

### `hacerClic`, `escribir` y `pulsarIntro`: actuar como una persona

Para hacer clic hacen falta coordenadas. Las funciones `buscarCentro` y `enfocarCampo` se ejecutan **dentro de la página**: el banco se las envía en forma de texto (escribir una función en una plantilla de texto, `${buscarCentro}`, inserta su código fuente). Desplazan la página hasta el elemento si hace falta, y devuelven el centro de su rectángulo o dan el foco al campo. El **foco** es el hecho de que un elemento reciba las pulsaciones del teclado. Cada acción espera primero a que el elemento exista, gracias a `esperar`.

El ratón envía dos eventos (pulsación y suelta), como un clic real. El teclado envía `keyDown` (la tecla se pulsa, con el texto que produce) y después `keyUp` (la tecla se suelta). `campo.select()` selecciona el texto ya presente: la siguiente pulsación lo reemplaza, como una persona que selecciona y escribe.

```javascript
// Función ejecutada DENTRO de la página: desplaza hasta el elemento y devuelve su centro
function buscarCentro(selector) {
    const elemento = document.querySelector(selector);   // busca el elemento
    if (!elemento) return null;                // no existe: la espera volverá a intentarlo
    elemento.scrollIntoView({ block: "center" });        // lo hace visible en pantalla
    const zona = elemento.getBoundingClientRect();       // rectángulo del elemento
    return { x: zona.x + zona.width / 2, y: zona.y + zona.height / 2 };   // su centro
}

// Simula un clic de ratón en el centro de un elemento
export async function hacerClic(pagina, selector) {
    const llamada = `(${buscarCentro})(${JSON.stringify(selector)})`;   // texto del código
    const { x, y } = await esperar(() => evaluar(pagina, llamada), `elemento ${selector}`);
    for (const type of ["mousePressed", "mouseReleased"]) {   // pulsación, luego suelta
        await pagina.enviar("Input.dispatchMouseEvent", {
            type, x, y, button: "left", clickCount: 1,   // botón izquierdo, un solo clic
        });
    }
}

// Función ejecutada DENTRO de la página: coloca el cursor en un campo y selecciona su texto
function enfocarCampo(selector) {
    const campo = document.querySelector(selector);      // busca el campo
    if (!campo) return false;                  // no existe: la espera volverá a intentarlo
    campo.focus();                             // le da el foco: recibe el teclado
    campo.select();                            // la pulsación reemplaza el texto
    return true;                               // encontrado: la espera se detiene
}

// Escribe un texto en un campo, una tecla tras otra
export async function escribir(pagina, selector, texto) {
    const llamada = `(${enfocarCampo})(${JSON.stringify(selector)})`;   // texto del código
    await esperar(() => evaluar(pagina, llamada), `campo ${selector}`);   // pone el foco
    for (const letra of texto) {               // una letra cada vez
        const tecla = { key: letra };          // la letra pulsada
        const pulsacion = { type: "keyDown", text: letra, ...tecla };   // pulsación y texto
        await pagina.enviar("Input.dispatchKeyEvent", pulsacion);       // se pulsa la tecla
        const suelta = { type: "keyUp", ...tecla };
        await pagina.enviar("Input.dispatchKeyEvent", suelta);          // se suelta la tecla
    }
}

// Pulsa la tecla Intro (pulsación y suelta)
export async function pulsarIntro(pagina) {
    const tecla = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 };   // la tecla
    await pagina.enviar("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", ...tecla });
    await pagina.enviar("Input.dispatchKeyEvent", { type: "keyUp", ...tecla });   // se suelta
}
```

### `capturar`: fotografiar la página

`Page.captureScreenshot` devuelve la imagen en forma de texto en **base64** (una forma de escribir bytes usando solo letras, cifras, `+` y `/`, véase [Base64 en MDN](https://developer.mozilla.org/en-US/docs/Glossary/Base64)). `Buffer.from(texto, "base64")` la convierte de nuevo en bytes (una sucesión de números de 0 a 255, la forma en que se almacena un archivo), que se escriben en un archivo **PNG** (un formato de imagen sin pérdida).

```javascript
// Fotografía la página y la guarda en un archivo PNG
export async function capturar(pagina, archivo) {
    const { data } = await pagina.enviar("Page.captureScreenshot", { format: "png" });  // PNG
    await writeFile(archivo, Buffer.from(data, "base64"));   // decodifica el texto en bytes
    return archivo;                            // devuelve la ruta, útil para mostrarla
}
```

### `cerrarNavegador`: recoger todo

Esta función pide a Chrome que se cierre educadamente, espera, fuerza la parada si hace falta y después elimina la carpeta de perfil. Sus límites se explican en la sección [Cerrar Chrome correctamente](#cerrar-chrome-correctamente).

```javascript
// Cierra Chrome correctamente, o por la fuerza, y después borra el perfil temporal
export async function cerrarNavegador(navegador, pagina) {
    const { proceso, perfil, puerto } = navegador;   // lo que devolvió lanzarNavegador
    const detenido = new Promise((ok) => proceso.once("exit", ok));   // se cumple al parar
    pagina?.ws.close();                        // primero cierra la conexión con la página
    try {
        const respuesta = await fetch(`http://127.0.0.1:${puerto}/json/version`);  // pregunta
        const info = await respuesta.json();   // contiene la dirección de conexión
        const ws = new WebSocket(info.webSocketDebuggerUrl);   // conexión « navegador »
        ws.addEventListener("open", () => {    // conexión abierta: pide la parada educada
            ws.send(JSON.stringify({ id: 1, method: "Browser.close" }));   // la orden
        });
    } catch {
        proceso.kill();                        // Chrome ya no responde: parada forzada
    }
    // Carrera entre la parada de Chrome y un plazo de 10 s; ref: false: este plazo
    // no impide que Node termine
    const plazoMax = pausa(10000, "demasiado tarde", { ref: false });
    if ((await Promise.race([detenido, plazoMax])) === "demasiado tarde") proceso.kill();
    await detenido;                            // solo seguimos cuando Chrome esté parado
    // Borra el perfil: varios intentos, porque Chrome libera sus archivos con retraso
    await rm(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
```

## Leer la página y escribir aserciones

Una **aserción** es una verificación que falla (lanzando un error) cuando un valor no es el esperado. Node proporciona `node:assert` ([documentación oficial](https://nodejs.org/api/assert.html)); la versión `node:assert/strict` compara de forma estricta: `"1"` (un texto) no es igual a `1` (un número). `assert.equal(real, esperado)` compara dos valores, `assert.deepEqual` compara el contenido de dos listas u objetos.

Toda lectura de la página pasa por `evaluar`: se escribe el JavaScript del [DOM](/?c=langages&s=javascript&p=dom-et-evenements) que se escribiría en la **consola** del navegador (la pestaña de herramientas de desarrollo, tecla F12, donde se ejecuta JavaScript a mano). Esto es lo que dan, sobre la página de prueba, después de escribir `5` en el campo y hacer clic en « Sumar » (valores observados):

| Lo que se quiere saber | Expresión pasada a `evaluar` | Valor leído |
|---|---|---|
| El texto de un elemento | `document.querySelector("#valor").textContent` | `"5"` |
| Lo que contiene un campo | `document.querySelector("#paso").value` | `"5"` |
| El valor de un atributo | `document.querySelector("#estado").getAttribute("role")` | `"status"` |
| ¿Existe un elemento? | `document.querySelector("[data-testid='valor']") !== null` | `true` |
| ¿Está ausente un elemento? | `document.querySelector("#ausente") === null` | `true` |
| ¿Ocupa espacio un elemento? | `document.querySelector("#sumar").getBoundingClientRect().width > 0` | `true` |
| Un estilo calculado | `getComputedStyle(document.querySelector("h1")).fontSize` | `"32px"` |
| El número de elementos | `document.querySelectorAll("button").length` | `3` |
| El título de la página | `document.title` | `"Contador"` |
| Un atributo `data-` | `document.body.dataset.listo` | `"si"` |
| El elemento que tiene el foco | `document.activeElement.id` | `"sumar"` |
| El tipo de dirección | `location.protocol` | `"file:"` |

Para **designar** el elemento que leer o sobre el que hacer clic, son posibles varios selectores:

| Selector | Escritura | ¿Conviene preferirlo? |
|---|---|---|
| Por identificador | `#sumar` | Sí, si el `id` es estable y único |
| Por atributo dedicado a las pruebas | `[data-testid="valor"]` | Sí: independiente del texto y de la maquetación |
| Por clase | `.boton-principal` | Con prudencia: las clases sirven al estilo y cambian a menudo |
| Por texto mostrado o por posición | « el tercer botón » | No: el menor cambio de texto rompe la prueba, véase [las pruebas end-to-end](/?c=tests&p=tests-end-to-end) |

El banco detecta también los **errores de JavaScript de la página**: en la máquina de redacción, `setTimeout(() => { throw new Error('pum'); }, 0)` ejecutado en la página llenó `pagina.excepciones` con `["Error: pum\n    at <anonymous>:1:26"]`. Sin esto, una página puede mostrar las cifras correctas y ocultar un error que nadie ve.

## Esperar un estado en lugar de dormir un plazo fijo

El reflejo del principiante es la **pausa fija** (« esperar 2 segundos y confiar en que baste »). Es o demasiado corta (la prueba falla sin razón válida: es una prueba **inestable**, *flaky* en inglés, véase [las pruebas unitarias](/?c=tests&p=tests-unitaires)), o demasiado larga (toda la suite se ralentiza). La alternativa es esperar al **estado** deseado, con un límite de seguridad: véase también [Esperar sin perder tiempo](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts). El siguiente script compara las estrategias sobre la página de prueba.

```javascript
import { setTimeout as pausa } from "node:timers/promises";  // pausa: una promesa
import {
    esperar, hacerClic, conectarPagina, evaluar,
    cerrarNavegador, lanzarNavegador, abrir, textoDe,
} from "./banco.mjs";                                        // nuestras herramientas

const DIRECCION = new URL("./contador.html", import.meta.url).href;   // la página a probar
const navegador = await lanzarNavegador();                   // Chrome arranca
const pagina = await conectarPagina();                       // nos conectamos a ella

try {
    // Caso 1: hacer clic en cuanto el navegador dice « cargada », sin esperar a la aplicación
    await pagina.enviar("Page.navigate", { url: DIRECCION });   // carga la página
    await esperar(() => evaluar(pagina, "document.readyState === 'complete'"), "carga");
    await hacerClic(pagina, "#sumar");         // los botones aún no están conectados
    console.log("1. clic demasiado pronto:", await textoDe(pagina, "#valor"));

    // Caso 2: pausa fija corta, pausa fija larga y después espera de un estado
    for (const plazo of [100, 2000, "estado"]) {
        await abrir(pagina, DIRECCION);        // página nueva, aplicación lista
        await hacerClic(pagina, "#guardar");   // el servidor simulado responde tras 400 ms
        const salida = Date.now();             // hora de salida de la espera
        if (plazo === "estado") {
            await esperar(                     // espera el texto final, no una duración
                // startsWith: ¿el texto empieza por « Guardado »?
                async () => (await textoDe(pagina, "#estado")).startsWith("Guardado"),
                "confirmación",
            );
        } else {
            await pausa(plazo);                // pausa de duración fija
        }
        const leido = await textoDe(pagina, "#estado");   // lo que muestra la página
        const duracion = Date.now() - salida;  // duración realmente transcurrida esperando
        const etiqueta = String(plazo).padEnd(6);   // padEnd: completa con espacios
        console.log(`2. espera ${etiqueta}: ${duracion} ms ->`, leido);
    }
} finally {
    await cerrarNavegador(navegador, pagina);  // cierra Chrome pase lo que pase
}
```

Resultado observado en la máquina de redacción (la primera de tres ejecuciones; la tabla siguiente indica el alcance de las tres):

```text
1. clic demasiado pronto: 0
2. espera 100   : 111 ms -> Guardando...
2. espera 2000  : 2010 ms -> Guardado: 0
2. espera estado: 434 ms -> Guardado: 0
```

| Estrategia | Duración realmente esperada | Lo que lee la prueba | Veredicto |
|---|---|---|---|
| Hacer clic en cuanto la página está « complete », sin esperar a la aplicación | 0 ms | `0`: el clic se pierde, los botones aún no están conectados | Fallo (observado 3 veces de 3 aquí; en una aplicación cuya lentitud varía, el fallo se vuelve intermitente) |
| Pausa fija de 100 ms | 111 a 122 ms | `Guardando...` | Fallo: demasiado corta |
| Pausa fija de 2000 ms | 2006 a 2015 ms | `Guardado: 0` | Correcto, pero más de cuatro veces más lento de lo necesario |
| Espera del estado (`esperar`) | 434 a 449 ms | `Guardado: 0` | Correcto, y tan rápido como lo permite la página |

El valor leído es `Guardado: 0` y no `Guardado: 1`, porque este script nunca hace clic en « Sumar »: el total se queda en `0`.

Tres reglas se derivan de ello:

| Regla | Por qué |
|---|---|
| Esperar el **resultado** que se quiere leer (un texto, un elemento), nunca un tiempo | La duración varía de una máquina a otra y de un día a otro; el resultado, no |
| Distinguir « página cargada » de « aplicación lista » | El navegador anuncia solo la primera; la segunda la debe señalar la aplicación (`data-listo`) |
| Siempre un límite, con un mensaje que diga qué se esperaba | Sin límite, una prueba bloqueada no termina nunca; sin mensaje, no se sabe por qué ha fallado |

Por ejemplo, `hacerClic(pagina, "#inexistente")` falló tras 5048 ms con el mensaje `Tiempo agotado (5000 ms): elemento #inexistente`.

## Escribir y lanzar las pruebas

Cada prueba parte de la página de origen (`abrir` al inicio de `probar`): el orden de las pruebas no importa y una prueba no puede perturbar a otra. Una prueba que falla no debe detener las siguientes: se anota el fallo, se toma una captura y se continúa. Al final, el programa devuelve un **código de salida**: el número que un programa devuelve al terminar. `0` significa « todo va bien »; cualquier otro valor indica un fallo. Guarde este código con el nombre `pruebas.mjs`, en la misma carpeta que `banco.mjs` y `contador.html`.

```javascript
import assert from "node:assert/strict";                     // comparaciones que fallan
import { mkdir } from "node:fs/promises";                    // creación de carpetas
import { join } from "node:path";                            // une las partes de una ruta
import { fileURLToPath } from "node:url";                    // dirección file:// a ruta
import {
    pulsarIntro, esperar, capturar, hacerClic, conectarPagina,
    cerrarNavegador, lanzarNavegador, abrir, escribir, textoDe,
} from "./banco.mjs";                                        // nuestras herramientas

// Dirección file:// de la página a probar, situada junto a este archivo
// (import.meta.url es la dirección del archivo en curso; URL calcula una dirección relativa)
const DIRECCION = new URL("./contador.html", import.meta.url).href;
const CARPETA_IMAGENES = fileURLToPath(new URL("./imagenes/", import.meta.url));   // capturas
await mkdir(CARPETA_IMAGENES, { recursive: true });          // crea la carpeta de capturas

const navegador = await lanzarNavegador();                   // Chrome arranca, sin ventana
const pagina = await conectarPagina();                       // nos conectamos a su página
const fallos = [];                                           // pruebas fallidas

// Ejecuta una prueba sobre una página nueva, con captura de imagen en caso de fallo
async function probar(nombre, cuerpo) {
    const inicio = Date.now();                 // hora de inicio, para medir la duración
    try {
        await abrir(pagina, DIRECCION);        // cada prueba parte de la página de origen
        await cuerpo();                        // la prueba en sí
        // Un error JavaScript de la página hace fallar la prueba, aunque el resto vaya bien
        // (splice(0) vacía la lista de errores de la página y devuelve su contenido)
        assert.deepEqual(
            pagina.excepciones.splice(0),
            [],
            "error de JavaScript en la página",
        );
        console.log(`  ok     ${nombre} (${Date.now() - inicio} ms)`);  // correcta
    } catch (error) {
        fallos.push(nombre);                   // anotamos el nombre de la prueba fallida
        const imagen = join(CARPETA_IMAGENES, `fallo-${fallos.length}.png`);  // archivo
        await capturar(pagina, imagen).catch(() => {});      // catch: ignora un fallo aquí
        console.log(`  FALLO  ${nombre}\n         ${error.message}`);
        console.log(`         imagen: ${imagen}`);
    }
}

try {
    console.log("Pruebas de contador.html");     // título de la serie
    await probar("el contador empieza en 0", async () => {
        assert.equal(await textoDe(pagina, "#valor"), "0");   // lee la pantalla del contador
    });
    await probar("un clic en Sumar aumenta el contador en 1", async () => {
        await hacerClic(pagina, "#sumar");     // clic de ratón sobre el botón
        assert.equal(await textoDe(pagina, "#valor"), "1");   // un clic: el contador vale 1
    });
    await probar("el paso escrito con el teclado se usa", async () => {
        await escribir(pagina, "#paso", "5");  // reemplaza el « 1 » del campo por « 5 »
        await hacerClic(pagina, "#sumar");     // primer clic: 0 + 5
        await hacerClic(pagina, "#sumar");     // segundo clic: 5 + 5
        assert.equal(await textoDe(pagina, "#valor"), "10");  // dos clics de 5 dan 10
    });
    await probar("la tecla Intro en el campo paso también suma", async () => {
        await escribir(pagina, "#paso", "2");  // el paso pasa a ser 2
        await pulsarIntro(pagina);             // tecla Intro en el campo
        assert.equal(await textoDe(pagina, "#valor"), "2");   // sin clic: 0 + 2
    });
    await probar("Poner a cero borra el total", async () => {
        await hacerClic(pagina, "#sumar");     // total: 1
        await hacerClic(pagina, "#sumar");     // total: 2
        await hacerClic(pagina, "#reiniciar"); // vuelta a 0
        assert.equal(await textoDe(pagina, "#valor"), "0");   // el contador está a 0
    });
    await probar("Guardar confirma tras una breve espera", async () => {
        await hacerClic(pagina, "#sumar");     // total: 1
        await hacerClic(pagina, "#guardar");   // lanza el guardado (400 ms)
        // Esperamos el estado deseado: el texto de confirmación, no un número de segundos
        await esperar(
            async () => (await textoDe(pagina, "#estado")) === "Guardado: 1",   // el texto
            "el estado « Guardado: 1 »",      // lo que dirá el error si se espera en vano
        );
    });
} finally {
    await cerrarNavegador(navegador, pagina);  // cierra Chrome, incluso tras un error
}

// El balance, y después el código de salida que leen un script o la integración continua
if (fallos.length === 0) console.log("Todo en verde.");
else console.log(`${fallos.length} prueba(s) fallida(s).`);
process.exitCode = fallos.length === 0 ? 0 : 1;              // código de salida: 0 = éxito
```

Un servidor de integración continua solo lee este código para decidir si las pruebas han pasado. Lance las verificaciones y después las pruebas:

```bash
# node --check lee el archivo y verifica su sintaxis, sin ejecutar nada
node --check banco.mjs
node --check pruebas.mjs
# lanza la serie de pruebas (CHROME_PATH debe estar definido en esta terminal)
node pruebas.mjs
# muestra el código de salida del último programa (en PowerShell: $LASTEXITCODE)
echo $?
```

Salida observada en la máquina de redacción (29/10/2026):

```text
Pruebas de contador.html
  ok     el contador empieza en 0 (373 ms)
  ok     un clic en Sumar aumenta el contador en 1 (356 ms)
  ok     el paso escrito con el teclado se usa (343 ms)
  ok     la tecla Intro en el campo paso también suma (335 ms)
  ok     Poner a cero borra el total (347 ms)
  ok     Guardar confirma tras una breve espera (760 ms)
Todo en verde.
```

El código de salida era `0`. La misma serie también se lanzó en PowerShell (`$env:CHROME_PATH = ...` y luego `node pruebas.mjs`) con el mismo resultado.

Una prueba que nunca puede fallar no demuestra nada: comprobamos, por tanto, que la serie **sabe** fallar. Rompamos la página a propósito, sustituyendo en `contador.html` la línea `total += Number(paso.value) || 0;` por una versión que suma 1 de más:

```javascript
// Versión rota de la función sumar: cada suma cuenta 1 de más
total += (Number(paso.value) || 0) + 1;
```

## Capturar una imagen para diagnosticar un fallo

Esto es lo que devolvió la serie en la página rota (observado; la ruta de la imagen está acortada y el mensaje, en inglés, lo proporciona Node: `Expected values to be strictly equal` significa « los valores deberían ser estrictamente iguales »):

```text
Pruebas de contador.html
  ok     el contador empieza en 0 (389 ms)
  FALLO  un clic en Sumar aumenta el contador en 1
         Expected values to be strictly equal:

'2' !== '1'

         imagen: ...\imagenes\fallo-1.png
  FALLO  el paso escrito con el teclado se usa
         Expected values to be strictly equal:

'12' !== '10'

         imagen: ...\imagenes\fallo-2.png
  FALLO  la tecla Intro en el campo paso también suma
         Expected values to be strictly equal:

'3' !== '2'

         imagen: ...\imagenes\fallo-3.png
  ok     Poner a cero borra el total (345 ms)
  FALLO  Guardar confirma tras una breve espera
         Tiempo agotado (5000 ms): el estado « Guardado: 1 »
         imagen: ...\imagenes\fallo-4.png
4 prueba(s) fallida(s).
```

El código de salida era `1`. Tres enseñanzas:

| Constatación | Explicación |
|---|---|
| Cuatro pruebas de seis fallan | Cada una lee un total falso: `2` en lugar de `1`, `12` en lugar de `10`, `3` en lugar de `2`, y el texto `Guardado: 1` nunca llega |
| « Poner a cero » pasa a pesar del error de programación (el **defecto**) | Esta prueba solo verifica la vuelta a `0`, que la suma demasiado generosa no cambia: una prueba puede estar en verde y dejar pasar un defecto, de ahí el interés de tener varias |
| El último mensaje es claro | Gracias al mensaje de `esperar`, se lee **lo que se esperaba**, no un simple « fallo » |

Una captura de imagen muestra el estado de la página **en el momento del fallo**. La de la primera prueba fallida muestra « Valor: 2 » encima del campo « Paso: 1 » y de los tres botones, sobre un fondo blanco (el archivo mide 800 × 600 píxeles, unos 8,6 KB, dimensiones leídas en su cabecera): se ve de un vistazo que la pantalla es fiel al valor leído y que es el cálculo el que está mal, puesto que una sola suma con un paso de 1 debería dar 1. En un servidor de integración continua, donde nadie mira, la captura es la única huella visual: el servicio puede conservarla como **artefacto** (un archivo producido por la ejecución y guardado después).

El tamaño merece una precaución. Con la opción `--window-size=800,600`, la captura medía 782 × 470 píxeles en la máquina de redacción: esta opción ajusta la ventana (marco incluido), no la página. La orden `Emulation.setDeviceMetricsOverride`, usada por `conectarPagina`, fija el tamaño de la **página**: es ella la que ha dado 800 × 600.

Piense en excluir la carpeta `imagenes/` del repositorio con [un archivo `.gitignore`](/?c=qualite-performance-et-outils&s=git&p=gitignore): las capturas no se versionan (el **repositorio** es la carpeta cuyas modificaciones sigue Git).

## Cerrar Chrome correctamente

Chrome es un programa aparte: si queda abierto tras la prueba, ocupa el puerto, memoria y una carpeta de perfil. `cerrarNavegador` sigue tres tiempos: la orden `Browser.close` (parada educada), un plazo de 10 segundos y, después, `proceso.kill()` (parada forzada mediante el PID de este Chrome), antes de borrar el perfil. Se llama desde un bloque `finally`, que se ejecuta tanto si las pruebas han tenido éxito como si han fallado o se han colgado.

Lo que se observó en la máquina de redacción (29/10/2026):

| Situación | Observado |
|---|---|
| Parada educada (`Browser.close`), caso habitual | Chrome se detiene en menos de 3 segundos tras la orden (una treintena de intentos) |
| Parada educada, caso lento | 6 veces de unas cincuenta ejecuciones, Chrome solo se detuvo entre 25 y 29 segundos después de su lanzamiento (en lugar de 2 a 4), sin causa establecida: cerraba sus procesos hijos uno por uno |
| `proceso.kill()` sobre un Chrome en marcha | Chrome desaparece en 0,1 a 0,4 s |
| `proceso.kill()` durante una parada educada ya lenta | No acortó la espera (observado 3 veces, con plazos de 5 a 8 segundos antes del `kill()`): hay que prever un plazo global de prueba generoso |
| Programa Node que se cuelga o termina sin cerrar Chrome | En Windows, Chrome se detuvo con él (observado 3 veces). En Linux y macOS, el comportamiento no se ha verificado aquí: no cuente con ello |
| Programa que olvida cerrar Chrome sin colgarse | Node nunca termina; lanzado con la orden `timeout` (que detiene un programa tras una duración dada, véase [un script que se detiene correctamente](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout)) fijada en 15 segundos, fue detenido por la fuerza (código de salida 124) |
| Carpeta de perfil tras un fallo | Permanece en el disco (unos 10 MB cada una): se acumulan |

Un `kill()` solo mata el proceso **principal** de Chrome. Sus procesos hijos (uno por pestaña, uno para la red, etc.) se detienen por sí mismos justo después: en la máquina de redacción, quedaban algunos al cabo de un segundo, y ninguno tras tres segundos. En Windows, la orden `taskkill /pid <número> /t /f` ([documentación Microsoft](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill)) detiene un proceso **y** todos sus descendientes (`/t`) por la fuerza (`/f`), siempre a partir de su PID exacto (verificado aquí sobre el Chrome del banco), nunca de su nombre: detener « todos los `chrome.exe` » cerraría también el navegador personal del usuario.

## Playwright, Puppeteer o un banco propio

Existen bibliotecas para este trabajo: [Playwright](https://playwright.dev/docs/intro) y [Puppeteer](https://pptr.dev/). Una **biblioteca** es un conjunto de código escrito por otros que se instala y se llama desde el programa propio. Se basan en las mismas ideas que el banco de este capítulo (un navegador controlado por un protocolo), y añaden todo lo que hace cómodo su uso.

| Criterio | Banco propio (este capítulo) | Puppeteer | Playwright |
|---|---|---|---|
| Instalación | Nada (Node y Chrome bastan) | Un paquete (y un navegador, según su documentación) | Un paquete y los navegadores que descarga |
| Navegadores controlados | Chrome | Chrome en primer lugar | Varias familias de navegadores, según su documentación |
| Esperas automáticas antes de un clic | Por escribir (`esperar`) | Parciales, según la documentación | Integradas, según la documentación |
| Ejecutor de pruebas, informes, trazas | Por escribir | Por añadir | Incluidos, según la documentación |
| Mantenimiento del código de control | A su cargo | Por sus autores | Por sus autores |
| Interés principal | Comprender; cero dependencias | Scripts de Chrome (capturas, PDF) | Suites de pruebas de un equipo |

Las celdas « según la documentación » indican funciones que verificar en la documentación oficial enlazada, que evoluciona.

| Situación | Opción recomendada |
|---|---|
| Aprender qué ocurre por dentro | El banco propio |
| Uno o dos escenarios sobre una página que se domina, sin poder instalar paquetes | El banco propio |
| Una suite de pruebas que crece, varios desarrolladores, varios navegadores | Playwright |
| Un script aislado que controla Chrome (capturas, generación de PDF) | Puppeteer |
| Páginas que no controla | Una biblioteca mantenida **y** el capítulo sobre [los navegadores automatizados atacados](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Chrome queda abierto tras la prueba | Conserva el puerto y la memoria. En Windows, Chrome se detuvo con Node durante las pruebas; en otros sistemas, el comportamiento no se ha verificado. Cerrar siempre en un `finally`, véase [Cerrar Chrome correctamente](#cerrar-chrome-correctamente) |
| Puerto ya ocupado | Observado: al lanzar en un puerto ya ocupado, Chrome arranca igualmente, señala `bind() returned an error` en su registro y luego escucha en la dirección `[::1]` (la forma IPv6 de la propia máquina, véase [las direcciones IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)), mientras la prueba se conecta a `127.0.0.1`, es decir, al otro programa. El banco comprueba el puerto con `puertoLibre` antes de lanzar |
| Perfil compartido entre dos Chrome | Observado: un segundo Chrome lanzado con la misma carpeta de perfil devuelve el control en 0,24 s y deja funcionando el primero, con sus propias opciones. Un perfil nuevo por cada lanzamiento |
| El perfil por defecto del usuario | Contiene sus contraseñas, sus cookies y sus extensiones: una prueba nunca debe usarlo. Siempre `--user-data-dir` hacia una carpeta desechable |
| Perfiles temporales que se acumulan | Tras un fallo, la carpeta permanece (unos 10 MB observados). Hay que limpiarlas con regularidad |
| Tomar el primer objetivo de `/json/list` | La lista también contiene páginas internas de Chrome: hay que filtrar por `type === "page"` |
| Pausa fija en lugar de una espera | Demasiado corta: fallo aleatorio; demasiado larga: suite lenta. Esperar un estado, véase [la sección dedicada](#esperar-un-estado-en-lugar-de-dormir-un-plazo-fijo) |
| Página cargada pero aplicación no lista | Observado: un clic enviado en cuanto `readyState` vale `"complete"` se pierde (el contador sigue en `0`). Un marcador `data-listo` lo pone la propia aplicación |
| Tamaño de página sin fijar | Las capturas difieren de una máquina a otra; observado: `--window-size=800,600` dio 782 × 470. Usar `Emulation.setDeviceMetricsOverride` |
| Un error de JavaScript silencioso en la página | No hace fallar ninguna aserción de lectura. Hay que recoger `Runtime.exceptionThrown`, como hace el banco |
| Una excepción en `Runtime.evaluate` que no se mira | La respuesta no es un `error` sino un `result` con `exceptionDetails`: hay que comprobarlo, como hace `evaluar` |
| Selector frágil (texto, posición) | El menor cambio de texto rompe la prueba, véase [las pruebas end-to-end](/?c=tests&p=tests-end-to-end) |
| Pruebas que dependen unas de otras | Un fallo en cascada oculta la causa. Cada prueba vuelve a abrir la página de origen |
| Un puerto de depuración abierto a otros | Quien se conecta a él controla todo el navegador. El puerto solo es útil para la máquina local: no lo redirija hacia el exterior (véase [los túneles SSH y la redirección de puertos](/?c=infrastructure-devops&s=reseaux&p=tunnel-ssh-et-redirection-de-port)) |
| `--no-sandbox` en un **contenedor** (un entorno aislado, véase [Docker: los conceptos básicos](/?c=infrastructure-devops&s=docker&p=concepts-de-base)) | Véase el párrafo siguiente |
| Controlar páginas ajenas | Una página hostil se ejecuta con las capacidades de un navegador de verdad: véase [atacar y defender un navegador automatizado](/?c=securite&s=securite-offensive&p=attaques-navigateur-automatise) |

**La sandbox.** Chrome encierra cada pestaña en un entorno restringido, la **sandbox** (« caja de arena »): si una página maliciosa explota un fallo, no puede tocar el resto del ordenador. En algunos contenedores, Chrome no puede ponerla en marcha y se niega a arrancar. La opción `--no-sandbox` elimina el obstáculo, pero **desactiva esta protección**: el código de la página se ejecuta entonces con todos los derechos del programa. Está reservada a páginas que uno mismo haya escrito, en un contenedor desechable y sin secretos. Es preferible configurar el contenedor (usuario no privilegiado, véase [Docker: buenas prácticas y seguridad](/?c=infrastructure-devops&s=docker&p=bonnes-pratiques-et-securite)) que quitar la protección. Esta opción no se ha podido probar durante la redacción (ningún contenedor en la máquina).

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Un perfil nuevo por lanzamiento, borrado al final | Ninguna huella de una prueba en la siguiente, ningún riesgo para el perfil del usuario |
| Comprobar la ruta de Chrome y la disponibilidad del puerto antes de lanzar | Un mensaje claro vale más que un tiempo agotado misterioso |
| Cerrar Chrome en un `finally` | El navegador se cierra aunque una prueba se cuelgue |
| Esperar un estado con un límite y un mensaje | Prueba rápida cuando todo va bien, diagnóstico claro cuando todo va mal |
| Hacer que la aplicación declare que está lista (`data-listo`) | Se deja de adivinar el momento adecuado |
| Designar los elementos por `id` o `data-testid` | Las pruebas sobreviven a los cambios de texto y de maquetación |
| Fijar el tamaño de la página | Capturas comparables de una máquina a otra |
| Partir de una página nueva en cada prueba | Pruebas independientes, en cualquier orden |
| Recoger los errores de JavaScript de la página | Una página que muestra bien pero falla en silencio queda detectada |
| Capturar una imagen en cada fallo y conservarla como artefacto | Ver el estado de la página sin poder reproducirlo |
| Hacer fallar voluntariamente la serie una vez | Comprobar que las pruebas saben detectar un defecto |
| Devolver un código de salida distinto de cero en caso de fallo | La integración continua lee ese código para decidir |
| Limitar las pruebas de navegador a los recorridos críticos | Son más lentas que las pruebas unitarias, véase [la pirámide de pruebas](/?c=tests&p=pyramide-de-test) |
| Pasar a Playwright cuando la suite crece | Las esperas automáticas, los informes y las trazas evitan escribirlos uno mismo |

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Un navegador sin ventana es un navegador de verdad que se controla sin pantalla: encaja con los servidores de integración continua. Chrome abre un puerto de depuración; la prueba habla con el navegador mediante el Chrome DevTools Protocol, mensajes JSON intercambiados sobre una conexión WebSocket: órdenes (con un `id`), respuestas (con el mismo `id`) y eventos (sin `id`). Un banco mínimo ocupa unas 220 líneas de Node: lanzar Chrome con un perfil nuevo, elegir el objetivo de tipo `page`, enviar `Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent`, `Input.dispatchKeyEvent` y `Page.captureScreenshot`, y después cerrar. Se espera un estado (nunca una duración), se verifica con aserciones y se toma una captura en cada fallo. |
| **Trampas que evitar** | Chrome huérfano o nunca cerrado; puerto ya ocupado (Chrome puede entonces escuchar en un lugar distinto de aquel al que se conecta la prueba); perfil compartido o perfil del usuario; primer objetivo de `/json/list` tomado sin filtrar; pausa fija; página cargada pero aplicación no lista; tamaño de página sin fijar; error de JavaScript silencioso; `--no-sandbox` fuera de un contenedor desechable; selectores frágiles. |
| **Buenas prácticas** | Un perfil nuevo por lanzamiento y un `finally` que cierra Chrome; comprobar ruta y puerto antes de lanzar; esperar el estado deseado con un límite y un mensaje; marcador `data-listo`; `id` o `data-testid`; tamaño de página fijado; una página nueva por prueba; captura de imagen en cada fallo; código de salida distinto de cero en caso de fallo; comprobar que la serie sabe fallar; Playwright en cuanto la suite crece. |
