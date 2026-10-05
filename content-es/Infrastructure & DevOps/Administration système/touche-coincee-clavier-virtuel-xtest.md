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

Medido en la sesión real (Xorg), con `xdotool keydown F13` (una tecla sin código fijo: `xdotool` le instala un código temporal, aquí 8, y no tiene efecto en las aplicaciones): una vez que `xdotool` ha terminado, `xinput query-state` en el teclado XTEST muestra `key[8]=down` y `XQueryKeymap` ve el código 8 pulsado; `xdotool keyup F13` pone ambos a cero. Bajo Xephyr (un servidor X mostrado en una ventana), el mismo teclado XTEST se queda en `key[9]=up` mientras `XQueryKeymap` ve Escape pulsada: en un servidor anidado, fiarse de `XQueryKeymap`.

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

Probada bajo **Xvfb** (un servidor X sin pantalla, que permite probar sin visualización real): antes de la pulsación, `key_is_down` devuelve 0; tras un `keydown` solo, 1; `release_if_stuck` devuelve entonces 1 y, justo después, la tecla vuelve a 0; una segunda llamada devuelve 0 (nada que hacer). Repetida aquí bajo Xephyr (un servidor X mostrado en una ventana, al no estar instalado Xvfb): mismos resultados, `0`, `1`, `1`, `0` y luego `0`.

## Garantizar la liberación: `trap`

El remedio es prever la liberación **antes** de pulsar. El comando `trap` ([véase el capítulo sobre los procesos](/?c=shells&s=bash&p=gestion-des-processus)) registra una acción que el script ejecutará al salir, sea cual sea el motivo:

```bash
release() { xdotool keyup Left; }   # inofensivo si la tecla ya esta liberada
trap release EXIT                   # EXIT: en cada salida del script, normal o causada por una señal

xdotool keydown Left
sleep 30 &                          # el comando largo (aqui sleep, en realidad la aplicacion probada)...
wait $!                             # ...lo espera « wait » ($!: numero del ultimo proceso lanzado)
```

Probado con el `xdotool` real en una sesión Xorg, con la tecla F13 (sin efecto en las aplicaciones) y un registro de las liberaciones:

| Interrupción | Resultado con `trap release EXIT` |
|---|---|
| `kill` (señal `SIGTERM`) | liberada **una vez**, en 1 s |
| `timeout 2 comando` | liberada **una vez** |
| `kill -9` (señal `SIGKILL`) | **nunca** liberada |

> **Trampa (el `trap` de señal se retrasa):** para un `trap` sobre una **señal** (`INT`, `TERM`), bash solo ejecuta el manejador **después de que termine el comando en curso**. Medido con `trap release EXIT INT TERM` y un simple `sleep 5` en primer plano: un `SIGTERM` enviado a 1 s solo libera a los 5 s (el script termina 4,0 s después de la señal). `wait`, al contrario, es interrumpido enseguida por una señal: se lanza pues el comando largo en segundo plano y luego se espera con `wait $!`. Con `trap release EXIT` solo, el `SIGTERM` mata el script de inmediato y el manejador se ejecuta al instante, incluso con un `sleep` en primer plano.

> **Trampa (ejecutado dos veces):** `trap release EXIT INT TERM` libera **dos veces** con un `SIGTERM` (una por la señal, otra por la salida que sigue). Basta con `trap release EXIT`, y el manejador debe ser **inofensivo si se ejecuta dos veces** (liberar una tecla ya liberada no hace nada).

> **Trampa (`SIGKILL`):** ningún `trap` atrapa `kill -9` ni una parada forzada por falta de memoria. Nunca matar una prueba así mientras haya una tecla pulsada; y **al arrancar** la prueba siguiente, llamar a `release_if_stuck` (arriba) o a `xdotool keyup` sobre cada tecla usada, para reparar una parada brusca anterior.

## Enviar una tecla a la ventana correcta: un protocolo seguro

Con la versión de `xdotool` probada, una pulsación dirigida a una ventana que **ya tiene el foco** no se entrega a esa ventana en particular: sale por el teclado virtual XTEST, es decir, hacia **cualquier ventana que tenga el foco en ese instante**. Si el usuario cambió de ventana entretanto, la pulsación (Escape, por ejemplo) llega al editor o a la terminal.

Tres comandos de `xdotool` permiten comprobar el destino antes de actuar. Una ventana se designa por su **identificador** (un número que el servidor X asigna a cada ventana); el **PID** es el número del proceso propietario de la ventana.

| Comando | Pregunta planteada |
|---|---|
| `xdotool getwindowname ID` | ¿existe todavía la ventana? (falla si no) |
| `xdotool getwindowfocus` | ¿qué ventana tiene el foco? (debe ser `ID`) |
| `xdotool getwindowpid ID` | ¿a qué proceso pertenece? (debe ser el PID de la aplicación probada) |

```bash
# Envía Escape a la ventana $1 de la aplicación de PID $2, una sola vez, tras tres comprobaciones.
send_escape_once() {
	local win=$1 pid=$2 focus owner

	xdotool getwindowname "$win" > /dev/null 2>&1 \
		|| { echo "ventana $win no encontrada" >&2; return 1; }
	focus=$(xdotool getwindowfocus)
	[ "$focus" = "$win" ] \
		|| { echo "la ventana $win no tiene el foco (foco: $focus)" >&2; return 1; }
	owner=$(xdotool getwindowpid "$win")
	[ "$owner" = "$pid" ] \
		|| { echo "ventana $win con PID $owner, se esperaba $pid" >&2; return 1; }
	xdotool key --window "$win" Escape
}
```

Reglas del protocolo:

- **Una sola pulsación**, nunca un segundo intento si una comprobación falla o si la aplicación no reacciona: una pulsación repetida al azar es el mismo peligro que la tecla atascada. En caso de fallo, se **detiene la aplicación con una señal** (`kill PID`) en lugar de reintentar.
- Cada comprobación tiene **su propio mensaje**, que nombra la ventana, el valor encontrado y el valor esperado.

**Demostrar lo que el teclado virtual envió realmente.** `xinput test-xi2 --root` muestra en directo cada evento del teclado, todas las ventanas juntas. Se lanza en segundo plano hacia un archivo durante la prueba y después se cuenta:

| Qué contar en el archivo | Resultado esperado para una pulsación correcta |
|---|---|
| pulsaciones (`RawKeyPress`) | 1 |
| liberaciones (`RawKeyRelease`) | 1 |
| pulsaciones de más (autorrepetición) | 0 |

Una pulsación sin liberación, o varias pulsaciones seguidas, indica una tecla atascada o repetida.

Medido en Xephyr con `xev` (una pulsación de Escape enviada por `send_escape_once`, `xinput test-xi2 --root` en segundo plano): 1 `RawKeyPress` y 1 `RawKeyRelease`, código de retorno 0. Las tres comprobaciones fallan como se esperaba, cada una con su mensaje: `fenêtre 99999999 introuvable`, `fenêtre 2097153 sans le focus (focus : 528)`, `fenêtre 2097153 au PID 33947, attendu 1`. Trampa: `xdotool getwindowpid` responde `window 2097153 has no pid associated with it` para una ventana cuya aplicación no rellena la propiedad `_NET_WM_PID` (es el caso de `xev`, que hubo que completar con `xprop`); una ventana GLFW la rellena (PID idéntico al del proceso, comprobado).

## Medir lo que la aplicación muestra: captura y píxeles

Para saber si el objeto se movió tras la pulsación, se **captura la pantalla** y se miden los píxeles. `ffmpeg` (la herramienta de conversión de audio y vídeo) sabe leer la pantalla de un servidor X con `-f x11grab`:

```bash
ffmpeg -f x11grab -draw_mouse 0 -video_size 800x600 -i :99 -frames:v 1 shot.ppm
```

| Opción | Función |
|---|---|
| `-f x11grab` | lee la pantalla del servidor X en lugar de un archivo |
| `-draw_mouse 0` | **no dibuja el cursor del ratón** en la imagen |
| `-video_size 800x600` | tamaño de la zona capturada, en píxeles |
| `-i :99` | servidor X que se lee (valor de `DISPLAY`) |
| `-frames:v 1` | una sola imagen, guardada en formato **PPM** (imagen en bruto: una pequeña cabecera y luego 3 bytes rojo-verde-azul por píxel) |

> **Trampa (el cursor falsea la medida):** por defecto, `x11grab` dibuja el cursor en la captura. Su flecha blanca se suma al objeto medido y agranda su **caja delimitadora** (el rectángulo más pequeño que contiene todos los píxeles del objeto), por tanto una medida de posición o de tamaño. `-draw_mouse 0` la excluye.

Medido (pantalla negra de 800 × 600, ventana blanca, cursor en (400, 300)) con la función `bounding_box` de abajo: `(12, 12, 211, 111)` con `-draw_mouse 0`, `(12, 12, 408, 308)` sin esa opción: el cursor estira la caja hasta él.

La medida se hace después leyendo el PPM: sobre fondo negro, la caja delimitadora es la de los píxeles que no son negros.

```python
import re
import sys


def read_ppm(path):
    """Devuelve (ancho, alto, bytes RGB) de un PPM binario P6 de 255 niveles."""
    with open(path, "rb") as file:
        data = file.read()
    header = re.match(rb"P6\s+(\d+)\s+(\d+)\s+255\s", data)   # cabecera: P6, ancho, alto, 255
    if not header:
        sys.exit(f"{path}: se esperaba un PPM binario P6 de 255 niveles")
    width, height = int(header.group(1)), int(header.group(2))
    pixels = data[header.end():]
    if len(pixels) != width * height * 3:
        sys.exit(f"{path}: {len(pixels)} bytes de píxeles, se esperaban {width * height * 3}")
    return width, height, pixels


def bounding_box(path):
    """Devuelve (x_min, y_min, x_max, y_max) de los píxeles no negros, None si todo es negro."""
    width, height, pixels = read_ppm(path)
    xs, ys = [], []
    for index in range(0, len(pixels), 3):
        if pixels[index:index + 3] != b"\x00\x00\x00":    # un píxel = 3 bytes
            xs.append((index // 3) % width)               # columna del píxel
            ys.append((index // 3) // width)              # fila del píxel
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None
```

Probado con imágenes sintéticas: un rectángulo blanco de 3 × 2 píxeles da `(3, 2, 5, 3)`, una imagen toda negra `None`, un archivo truncado o de otro formato un mensaje que nombra el archivo. La cabecera se lee con una expresión regular y no dividiendo el archivo por espacios: un primer píxel cuyo byte vale 10 (salto de línea) sería si no absorbido como separador.

Si la aplicación **pulsa** (un [shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), programa ejecutado por la tarjeta gráfica, cuyo brillo varía con el tiempo), se comparan dos capturas **tras normalizar el brillo** (dividir cada captura por su propio brillo medio); si no, dos renderizados idénticos parecen distintos.

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
