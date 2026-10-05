---
order: 10
---

# Tecla atascada: el teclado virtual XTEST y `xdotool`

Para probar una aplicación gráfica (un juego, un programa 3D como el del [capítulo sobre el bucle de renderizado](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), un script puede «pulsar» teclas en lugar de una persona: mantener una flecha durante un segundo y medir hasta dónde llegó el objeto, por ejemplo. En Linux, la herramienta que lo hace se apoya en un **teclado virtual**. Este capítulo explica cómo funciona, la trampa que deja una tecla **pulsada para toda la máquina**, cómo reconocerla y cómo protegerse.

## Un teclado invisible: XTEST y `xdotool`

En Linux, el **servidor de pantalla** es el programa que gestiona la pantalla, el teclado y el ratón, y que reparte teclado y ratón a las ventanas ([X11](https://www.x.org/wiki/) es el más extendido). Prevé **extensiones** (funciones opcionales del protocolo que los programas usan para hablarle). **XTEST** ([especificación](https://www.x.org/releases/current/doc/xextproto/xtest.html)) es una de ellas: permite a un programa **inyectar eventos** como si vinieran de un teclado real, mediante un **teclado virtual**. [`xdotool`](https://github.com/jordansissel/xdotool) es el comando que la utiliza.

Una pulsación se compone de **dos eventos**: la **presión** (*keydown*) y luego la **liberación** (*keyup*). Mientras la liberación no haya llegado, el servidor considera la tecla **mantenida**.

| Comando | Eventos enviados | Efecto |
|---|---|---|
| `xdotool key Escape` | presión y luego liberación | una pulsación completa |
| `xdotool keydown Left` | solo presión | la flecha izquierda **sigue pulsada** |
| `xdotool keyup Left` | solo liberación | la flecha izquierda se libera |

Mantener una tecla durante un tiempo dado se escribe, por tanto, en tres pasos:

```bash
xdotool keydown Left   # la tecla está pulsada
sleep 1                # la aplicación la ve mantenida durante 1 segundo
xdotool keyup Left     # liberación: sin esta línea, la tecla sigue pulsada
```

## La trampa: una tecla pulsada para toda la máquina

Si el script se detiene **entre** `keydown` y `keyup`, la liberación nunca se envía:

```
tiempo ──────────────────────────────────────────────────────►
script   keydown ─── trabajo ─── ✕ interrumpido     keyup (nunca ejecutado)
servidor tecla pulsada ──────────────────────────────────────────► sigue pulsada
```

El servidor repite entonces la tecla **automáticamente** (la **autorrepetición**: una tecla mantenida produce pulsaciones en serie, como cuando se deja el dedo encima) y la envía a la ventana que tiene el **foco** (la que recibe el teclado en ese instante). Ya no es la aplicación probada: es el editor, la terminal, lo que esté en primer plano, incluso una vez terminada la prueba.

| Lo que interrumpe el script | Por qué se pierde el `keyup` |
|---|---|
| `Ctrl-C` | el script recibe la **señal** `SIGINT` (un mensaje que el sistema envía a un programa) y se detiene |
| `timeout` | envía la señal `SIGTERM` al terminar el plazo |
| `kill PID` | señal `SIGTERM` |
| `kill -9 PID`, memoria saturada (el sistema mata el programa) | señal `SIGKILL`: el programa **no** tiene ninguna posibilidad de reaccionar |
| Fallo del script o error de sintaxis entre las dos líneas | la línea `keyup` nunca se alcanza |

## Reconocer una tecla atascada

Los síntomas: una letra o una flecha que se repite sin fin en una ventana sin relación, caracteres que se escriben solos. Dos formas de comprobarlo:

| Método | Qué muestra |
|---|---|
| `xinput query-state ID` | **`xinput`** lista (`xinput list`) e interroga los dispositivos de entrada; en el teclado virtual (llamado « Virtual core XTEST keyboard »), una tecla atascada aparece como `key[9]=down` |
| `XQueryKeymap` | función de **Xlib** (la biblioteca C que habla con el servidor X): rellena un arreglo de 32 bytes, es decir **256 casillas con 0 o 1**, una por **código de tecla** (el número que el servidor da a cada tecla física; 9 para Esc en un teclado estándar) |

```c
/* Devuelve 1 si la tecla de codigo « keycode » esta pulsada segun el servidor X, 0 si no. */
static int key_is_down(Display *display, unsigned int keycode)
{
	char keys[32];                      /* 32 bytes = 256 casillas, una por codigo de tecla */

	XQueryKeymap(display, keys);        /* el servidor rellena el arreglo */
	return ((unsigned char)keys[keycode / 8] >> (keycode % 8)) & 1;   /* byte keycode/8, bit keycode%8 */
}
```

El código de una tecla depende del teclado y de su distribución: se le pregunta a Xlib (`XKeysymToKeycode`, que convierte el **símbolo** de una tecla, por ejemplo el de Esc, en un código) en lugar de escribirlo fijo.

## Liberarla

Lo más sencillo, a mano: `xdotool keyup Escape`. En un programa C, se envía el mismo evento por XTEST:

```c
/* Libera la tecla si esta atascada. Devuelve 1 si lo estaba, 0 si no, -1 en caso de error. */
int release_if_stuck(unsigned int keycode)
{
	Display *display = XOpenDisplay(NULL);   /* NULL: servidor designado por la variable DISPLAY */
	const char *shown = getenv("DISPLAY");   /* solo para el mensaje de error */
	int stuck;

	if (!display)
	{
		fprintf(stderr, "servidor X inaccesible (variable DISPLAY: %s)\n", shown ? shown : "ausente");
		return -1;
	}
	stuck = key_is_down(display, keycode);
	if (stuck && !XTestFakeKeyEvent(display, keycode, 0, 0))   /* 0: liberacion (keyup) */
	{
		fprintf(stderr, "extension XTEST no disponible: tecla %u no liberada\n", keycode);
		XCloseDisplay(display);
		return -1;
	}
	XFlush(display);                         /* envia la orden sin esperar */
	XCloseDisplay(display);
	return stuck;
}
```

Probada bajo **Xvfb** (un servidor X sin pantalla, que permite probar sin visualización real): antes de la pulsación, `key_is_down` devuelve 0; tras un `keydown` solo, 1; `release_if_stuck` devuelve entonces 1 y, justo después, la tecla vuelve a 0; una segunda llamada devuelve 0 (nada que hacer).

## Garantizar la liberación: `trap`

El remedio es prever la liberación **antes** de pulsar. El comando `trap` ([véase el capítulo sobre los procesos](/?c=shells&s=bash&p=gestion-des-processus)) registra una acción que el script ejecutará al salir, sea cual sea el motivo:

```bash
release() { xdotool keyup Left; }   # inofensivo si la tecla ya esta liberada
trap release EXIT                   # EXIT: en cada salida del script, normal o causada por una señal

xdotool keydown Left
sleep 30 &                          # el comando largo (aqui sleep, en realidad la aplicacion probada)...
wait $!                             # ...lo espera « wait » ($!: numero del ultimo proceso lanzado)
```

Probado con la liberación sustituida por una línea escrita en un archivo (`xdotool` no está instalado en la máquina de prueba):

| Interrupción | Resultado con `trap release EXIT` |
|---|---|
| `kill` (señal `SIGTERM`) | liberada **una vez**, en 1 s |
| `timeout 2 comando` | liberada **una vez** |
| `kill -9` (señal `SIGKILL`) | **nunca** liberada |

> **Trampa (el `trap` se retrasa):** bash solo ejecuta el `trap` **después de que termine el comando en curso**. Con un simple `sleep 30` en lugar de `sleep 30 & wait $!`, cada prueba esperó los 30 segundos antes de liberar (la serie completa duró más de 4 minutos). `wait`, en cambio, es interrumpido de inmediato por una señal: por eso se lanza el comando largo en segundo plano y luego se espera con `wait`.

> **Trampa (ejecutado dos veces):** `trap release EXIT INT TERM` libera **dos veces** con un `SIGTERM` (una por la señal, otra por la salida que sigue). Basta con `trap release EXIT`, y el manejador debe ser **inofensivo si se ejecuta dos veces** (liberar una tecla ya liberada no hace nada).

> **Trampa (`SIGKILL`):** ningún `trap` atrapa `kill -9` ni una parada forzada por falta de memoria. Nunca matar una prueba así mientras haya una tecla pulsada; y **al arrancar** la prueba siguiente, llamar a `release_if_stuck` (arriba) o a `xdotool keyup` sobre cada tecla usada, para reparar una parada brusca anterior.

## En otras máquinas

| Situación | Comportamiento |
|---|---|
| Servidor X11 (el caso habitual) | `xdotool` y XTEST funcionan |
| Wayland (otro servidor de pantalla, cada vez más habitual) | `xdotool` solo alcanza las aplicaciones lanzadas mediante **XWayland** (la capa de compatibilidad con X11); las demás requieren otra herramienta |
| Máquina sin pantalla (servidor, contenedor, integración continua) | `xvfb-run comando` lanza un servidor X virtual (Xvfb) mientras dura el comando |
| Variable `DISPLAY` ausente o errónea | `xdotool` y `XOpenDisplay` fallan: el mensaje debe nombrar la variable, como en `release_if_stuck` |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `xdotool` inyecta teclas mediante la extensión XTEST del servidor X, a través de un teclado virtual. Una pulsación es una presión y luego una liberación; si el script se detiene entre las dos, la tecla sigue pulsada para toda la máquina y se repite en la ventana que tiene el foco. Se reconoce con `xinput query-state` o `XQueryKeymap`, y se libera con `xdotool keyup` o `XTestFakeKeyEvent`. |
| **Herramientas utilizables** | `xdotool key`/`keydown`/`keyup`, `xinput list`/`query-state`, `XQueryKeymap`, `XTestFakeKeyEvent`, `trap`, `wait`, `timeout`, `xvfb-run`. |
| **Trampas a evitar** | Un `keydown` sin `keyup` garantizado. Un `trap` retrasado por un comando largo lanzado en primer plano. Un `trap` sobre `EXIT INT TERM` ejecutado dos veces. `kill -9` sobre una prueba que mantiene una tecla. Código de tecla escrito fijo. Variable `DISPLAY` ausente sin señalar. |
| **Buenas prácticas** | Poner `trap release EXIT` antes del `keydown`; lanzar el comando largo en segundo plano y luego `wait $!`. Liberar cada tecla usada al arrancar la prueba siguiente. Pedir el código de tecla a Xlib. Probar bajo Xvfb en lugar de en la pantalla de trabajo. |
