---
order: 22
---

# Las API de página del navegador: tema, desplazamiento, visibilidad y cancelación (28/10/2026)

El **navegador** es el programa que muestra las páginas web (Chrome, Firefox, Safari...). Una **API** (*Application Programming Interface*, «interfaz de programación») es un conjunto de funciones y objetos que el navegador pone a disposición del código JavaScript para permitirle actuar sobre la página o leer el estado del dispositivo. Este capítulo presenta cuatro de estas API, que sirven para controlar una página:

| API | Lo que permite | Sección |
|---|---|---|
| `matchMedia` | Saber, desde JavaScript, si una condición de pantalla o de ajuste es verdadera (ventana estrecha, tema oscuro...) | [matchMedia](#matchmedia-leer-una-media-query-desde-javascript) |
| `scrollIntoView` | Desplazar la página hasta un elemento | [scrollIntoView](#scrollintoview-desplazar-la-pagina-hasta-un-elemento) |
| `visibilitychange` | Saber si el usuario mira la página o ha dejado de mirarla (pestaña oculta) | [visibilitychange](#visibilitychange-saber-si-la-pagina-esta-siendo-vista) |
| `AbortController` | Cancelar una operación en curso (petición de red, escuchadores de eventos) | [AbortController](#abortcontroller-cancelar-lo-que-esta-en-curso) |

Un **evento** es una señal que el navegador envía cuando ocurre algo (un clic, un redimensionamiento de la ventana, un cambio de pestaña); un **escuchador** es la función que se conecta a un evento para que se ejecute cada vez. Este capítulo supone conocidos [el DOM y los eventos](/?c=langages&s=javascript&p=dom-et-evenements) (la página vista como un árbol de objetos que JavaScript manipula), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions) (incluidas las funciones flecha `() => { ... }`), [las condiciones](/?c=langages&s=javascript&p=conditions), [los bucles](/?c=langages&s=javascript&p=boucles) y [los objetos](/?c=langages&s=javascript&p=objets) (la notación `{ nombre: valor }`).

La mayoría de estas API están disponibles en todos los navegadores actuales (28/10/2026): la sección de cada API señala los pocos puntos que requieren precaución.

## `matchMedia`: leer una media query desde JavaScript

Una **media query** («consulta de medios») es una condición escrita en CSS con `@media`, que solo aplica estilos si la pantalla o los ajustes del usuario coinciden: anchura de la ventana, tema oscuro, dispositivo táctil... Se explica en el [capítulo sobre el diseño adaptable](/?c=langages&s=css&p=responsive-et-media-queries). El CSS reacciona por sí solo, pero un script a veces necesita conocer la respuesta él mismo (detener una animación, cargar un contenido más ligero). La función `window.matchMedia(consulta)` se la proporciona. En el ejemplo siguiente, `(max-width: 600px)` significa «la anchura de la ventana es de 600 píxeles como máximo» (un **píxel** es el punto más pequeño de una pantalla). `window` es el objeto que representa la ventana de la pestaña: sus funciones pueden escribirse con o sin `window.` delante.

```javascript
// matchMedia recibe una media query en forma de texto y devuelve un objeto MediaQueryList
const consulta = window.matchMedia("(max-width: 600px)");

// matches vale true si la condición se cumple ahora, false si no
if (consulta.matches) {
    // console.log escribe un mensaje en la consola de las herramientas de desarrollo (F12)
    console.log("Ventana estrecha: 600 píxeles de ancho o menos");
} else {
    console.log("Ventana ancha: más de 600 píxeles");
}

console.log(consulta.media);    // "(max-width: 600px)": la consulta, tal como se ha leído
```

El objeto devuelto, un **`MediaQueryList`**, contiene:

| Elemento | Naturaleza | Papel |
|---|---|---|
| `.matches` | Booleano (`true` o `false`) | Verdadero si la condición se cumple **en este momento**; el valor se mantiene actualizado, releer `consulta.matches` más tarde da la respuesta actual |
| `.media` | Texto | La consulta tal como la ha entendido el navegador |
| `addEventListener("change", funcion)` | Función | Llama a `funcion` cada vez que `.matches` **cambia** de valor |
| `removeEventListener("change", funcion)` | Función | Retira un escuchador colocado con `addEventListener` (ver [la sección sobre la cancelación](#retirar-varios-escuchadores-de-una-vez)) |

### Las consultas útiles

| Consulta | Verdadera cuando | Uso típico |
|---|---|---|
| `(max-width: 600px)` | La ventana mide 600 píxeles de ancho o menos | Elegir una versión «teléfono» de un componente (un bloque de interfaz como un menú o una galería) |
| `(min-width: 601px)` | La ventana mide más de 600 píxeles | Lo contrario de la anterior |
| `(orientation: portrait)` | La ventana es más alta que ancha | Adaptar una galería o un juego |
| `(prefers-reduced-motion: reduce)` | El usuario ha pedido al sistema **reducir las animaciones** | No lanzar ninguna animación, ver [el capítulo sobre el SVG](/?c=langages&s=html&p=svg-dans-la-page) para un ejemplo completo |
| `(prefers-color-scheme: dark)` | El usuario ha elegido el **tema oscuro** en su sistema | Aplicar colores oscuros |
| `(hover: hover)` | El dispositivo principal (ratón, panel táctil) puede **pasar por encima** de un elemento; falso en una pantalla táctil, donde solo se puede tocar | Mostrar una información emergente al pasar el puntero solo si existe ese paso |

Varias condiciones se combinan con `and`: `"(max-width: 600px) and (orientation: portrait)"` es verdadera cuando las dos lo son. Las mismas consultas se usan tal cual en `@media` en CSS; [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) enumera todas las condiciones posibles, y la página sobre [`hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover) detalla el paso del puntero por encima.

### Leer una vez o escuchar los cambios

Leer `.matches` una sola vez da el estado **en ese instante**. Ahora bien, el usuario puede cambiar de opinión mientras la página está abierta: redimensionar la ventana, girar su teléfono, pasar el sistema a tema oscuro. El evento `change` avisa al script en cada cambio.

```javascript
// Objeto de la condición «tema oscuro elegido en el sistema»
const oscuro = window.matchMedia("(prefers-color-scheme: dark)");

function aplicarTema(esOscuro) {
    // document.documentElement es la etiqueta <html>; toggle(nombre, condición) añade la
    // clase si la condición es verdadera, la retira si no
    document.documentElement.classList.toggle("tema-oscuro", esOscuro);
}

aplicarTema(oscuro.matches);           // estado al cargar (change no se dispara ahí)

// En cada cambio del sistema, el navegador llama a esta función (objeto «evento»)
oscuro.addEventListener("change", (evento) => {
    aplicarTema(evento.matches);       // el nuevo valor de la condición
});
```

```css
:root {
    --fondo: #ffffff;                  /* variables CSS: colores del tema claro */
    --texto: #1a1a1a;
}

.tema-oscuro {
    --fondo: #121212;                  /* la clase colocada sustituye los valores */
    --texto: #f0f0f0;
}

body {
    background: var(--fondo);          /* var(--nombre) lee la variable */
    color: var(--texto);
}
```

Las [variables CSS](/?c=langages&s=css&p=variables-et-cascade) evitan reescribir todos los colores: el script solo coloca o retira una [clase](/?c=langages&s=css&p=selecteurs) (una etiqueta puesta en un elemento, que el CSS sabe seleccionar) en `<html>`, la [etiqueta](/?c=langages&s=html&p=structure-dun-document) que contiene toda la página.

| | Leer una vez | Escuchar los cambios |
|---|---|---|
| Escritura | `window.matchMedia(q).matches` | `addEventListener("change", funcion)` |
| Útil cuando | Una decisión se toma en un instante preciso: al hacer clic, al iniciar una animación | La interfaz debe seguir el ajuste en directo: tema, disposición |
| Se dispara | Nunca por sí solo: se lee en el momento deseado | Solo cuando la respuesta **cambia** (no en cada píxel del redimensionamiento), y nunca al cargar |

### ¿El CSS o JavaScript?

| Necesidad | Mejor herramienta | Por qué |
|---|---|---|
| Cambiar colores, tamaños, disposición según la anchura o el tema | **`@media` en CSS** | Ningún script que escribir, ninguna latencia, y funciona aunque el script falle |
| Elegir qué contenido cargar (una imagen pesada solo en pantalla grande) | `matchMedia` | El CSS no puede decidir qué descargar por script |
| Iniciar, detener o ralentizar una animación hecha en JavaScript | `matchMedia` | El CSS no tiene el control de un bucle JavaScript |
| Recordar una elección de tema del usuario | `matchMedia` + [almacenamiento en el navegador](/?c=langages&s=javascript&p=dom-et-evenements) | La elección explícita prevalece sobre el ajuste del sistema |

### Las trampas de `matchMedia`

La antigua escritura `addListener` está **obsoleta**: se encuentra en tutoriales antiguos, pero `addEventListener("change", ...)` la reemplaza.

```javascript
const consulta = window.matchMedia("(max-width: 600px)");
function alCambiar(evento) { console.log(evento.matches); }

consulta.addListener(alCambiar);                 // OBSOLETO: ya no se debe escribir
consulta.addEventListener("change", alCambiar);  // lo que se debe escribir en su lugar
```

La otra equivocación frecuente es **medir la ventana en bucle** para adivinar si es estrecha. `setInterval(funcion, retardo)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)) es un **temporizador**: vuelve a llamar a la función a intervalos regulares, aquí cada 16 milisegundos (un milisegundo es una milésima de segundo).

```javascript
// MAL: se consulta la anchura 60 veces por segundo, incluso cuando nada cambia
setInterval(() => {
    // window.innerWidth: la anchura de la ventana, en píxeles
    if (window.innerWidth <= 600) {
        console.log("estrecho");
    }
}, 16);                                            // 16 milisegundos entre dos mediciones
```

Este bucle hace trabajar al navegador en vano y consume batería. `matchMedia` avisa solo cuando la respuesta **cambia**. Para seguir el tamaño preciso de un elemento, `ResizeObserver` (ver [los observadores](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) es la herramienta prevista; el evento `resize` de la ventana, en cambio, se dispara decenas de veces por segundo y se limita con un **debounce** (actuar solo después de una pausa en la serie de eventos, ver el mismo capítulo).

Dos sutilezas que conocer. Por un lado, una consulta **mal escrita** no produce ningún error: `window.matchMedia("max-width 600")` (sin paréntesis) devuelve un objeto cuyo `.matches` vale simplemente `false`, y una prueba que falla en silencio es difícil de detectar. Por otro lado, `.matches` refleja la condición en el instante de la lectura, pero solo el evento `change` avisa de un cambio: leer `.matches` una vez al inicio y no volver a hacerlo nunca deja la interfaz caducada en cuanto el usuario cambia un ajuste.

## `scrollIntoView`: desplazar la página hasta un elemento

El **desplazamiento** (*scroll*) es el movimiento del contenido cuando se gira la rueda del ratón o se desliza el dedo. `elemento.scrollIntoView()` pide al navegador que desplace la página (y todos los contenedores que la incluyen) hasta que el elemento sea visible. El nombre significa «desplazar para llevar a la vista».

```html
<!-- Un botón, y más abajo un título con el id (identificador único) «tarifas» -->
<button id="ir-tarifas">Ver las tarifas</button>
<h2 id="tarifas">Tarifas</h2>
```

```javascript
const boton = document.getElementById("ir-tarifas");   // el botón, hallado por su id
const titulo = document.getElementById("tarifas");     // el elemento al que llegar

boton.addEventListener("click", () => {                // al hacer clic en el botón...
    // ... desplazarse suavemente hasta el título, pegado arriba de la zona visible
    titulo.scrollIntoView({ behavior: "smooth", block: "start" });
});
```

El argumento es un **objeto de opciones**: varios ajustes con nombre escritos entre llaves. Todos son facultativos.

| Opción | Valores posibles | Valor por defecto | Efecto |
|---|---|---|---|
| `behavior` | `"auto"`, `"smooth"` | `"auto"` | `"auto"` sigue la propiedad CSS `scroll-behavior` de la página (un salto inmediato si no se ha configurado nada). `"smooth"` anima el desplazamiento |
| `block` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"start"` | Dónde colocar el elemento **verticalmente** en la zona visible (en una página escrita de izquierda a derecha) |
| `inline` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"nearest"` | Dónde colocarlo **horizontalmente** |

`"nearest"` significa «el más cercano»: el navegador desplaza lo mínimo, y no se mueve en absoluto si el elemento ya es totalmente visible. El esquema siguiente muestra la zona visible (el marco) tras un desplazamiento para tres valores de `block`:

```
  block: "start"        block: "center"       block: "end"
  +-------------+       +-------------+       +-------------+
  | [elemento]  |       |             |       |             |
  |             |       | [elemento]  |       |             |
  |             |       |             |       | [elemento]  |
  +-------------+       +-------------+       +-------------+
  arriba de la vista    centro de la vista    abajo de la vista
```

### Compensar una cabecera fija con `scroll-margin-top`

Una **cabecera fija** es una barra que se mantiene pegada arriba de la ventana durante el desplazamiento (ver [el posicionamiento CSS](/?c=langages&s=css&p=positionnement)). Con `block: "start"`, el elemento alcanzado queda exactamente arriba de la zona visible, por tanto **oculto detrás** de esa barra. El CSS lo corrige con `scroll-margin-top`, un margen de desplazamiento: una distancia que el navegador conserva entre la parte superior de la vista y el elemento al que llegar ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-top)).

```css
.cabecera {
    position: sticky;                  /* pegada arriba mientras se desplaza */
    top: 0;                            /* a 0 píxeles del borde superior */
    height: 64px;                      /* altura de la barra */
}

h2[id] {
    scroll-margin-top: 80px;           /* 80 píxeles libres encima de todo h2 con id */
}
```

Este margen también se aplica a los enlaces de ancla `<a href="#tarifas">`: un solo ajuste CSS corrige ambos. Su equivalente colocado en el contenedor que se desplaza (a menudo `html`) es `scroll-padding-top` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding-top)).

### Respetar `prefers-reduced-motion`

El desplazamiento animado puede provocar vértigo en algunas personas (ver [`prefers-reduced-motion`](/?c=langages&s=css&p=animations-css-performantes)). Por eso **nunca hay que forzar `smooth`**: se lee el ajuste del usuario y se elige el comportamiento en consecuencia.

```javascript
function comportamientoDeDesplazamiento() {
    // Verdadero si el usuario ha pedido reducir las animaciones en su sistema
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reducido ? "auto" : "smooth";      // condición ? si_verdadero : si_falso
}

function ir(elemento) {
    elemento.scrollIntoView({ behavior: comportamientoDeDesplazamiento(), block: "start" });
}
```

El desplazamiento suave también puede ajustarse una vez para toda la página, en CSS, dentro de la misma condición:

```css
@media (prefers-reduced-motion: no-preference) {
    html {
        scroll-behavior: smooth;       /* todos los desplazamientos se vuelven suaves */
    }
}
```

Con esta regla, `behavior: "auto"` (el valor por defecto) basta en JavaScript: el navegador aplica el valor del CSS.

### `scrollIntoView`, `scrollTo`, el ancla y `focus()`

Cuatro herramientas parecen «hacer lo mismo», pero no se usan igual:

| Herramienta | Lo que se le pasa | ¿Cambia la URL? | ¿Mueve el foco? | Cuándo usarla |
|---|---|---|---|---|
| `elemento.scrollIntoView(opciones)` | Un elemento | No | No | Llevar un elemento a la vista desde un script |
| `window.scrollTo({ top, behavior })` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo)) | Una posición en píxeles desde la parte superior de la página | No | No | Volver arriba (`top: 0`), o ir a una posición que hemos calculado |
| Enlace de ancla `<a href="#tarifas">` | El `id` del elemento, en la dirección | Sí: añade `#tarifas` y una entrada en el historial (la lista que recorre el botón Atrás) | Solo si el destino puede recibir el foco; si no, la siguiente pulsación de Tab parte del destino | Un enlace de navegación que debe poder compartirse y funcionar sin JavaScript |
| `elemento.focus()` | Un elemento que puede recibir el foco | No | Sí | Hacer utilizable por teclado una zona (ver [el foco de teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)) |

El **foco** designa el elemento que recibe las teclas del teclado. `scrollIntoView` no lo mueve: una persona que navega con el teclado o con un lector de pantalla (un programa que lee la página en voz alta) no sabría que la hemos llevado a otra parte. Para una navegación real, se combinan entonces los dos. Llamar a `focus()` también desplaza la página hasta el elemento, de una sola vez; la opción `preventScroll: true` suprime ese desplazamiento para que solo actúe `scrollIntoView`:

```javascript
// <h2 id="tarifas" tabindex="-1">: tabindex="-1" permite el foco solo por script
const titulo = document.getElementById("tarifas");

titulo.scrollIntoView({ behavior: comportamientoDeDesplazamiento() }); // animado o no
titulo.focus({ preventScroll: true });   // foco sin un segundo desplazamiento simultáneo
```

`tabindex="-1"` es necesario porque un título no es un elemento que reciba el foco por sí mismo, a diferencia de un enlace o de un campo de formulario: el atributo se explica con el foco de teclado ([capítulo dedicado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). La documentación de `focus()` está en [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus).

### Las trampas de `scrollIntoView`

**Un contenedor de desplazamiento anidado.** Una lista de mensajes de altura fija, con su propia barra de desplazamiento, es un contenedor de desplazamiento: `scrollIntoView` desplaza la lista, **pero también toda la página** si hace falta, lo que puede hacer saltar la página de forma inesperada. Dos remedios:

```javascript
const lista = document.getElementById("lista-mensajes");   // el contenedor que tiene su barra
const ultimo = lista.lastElementChild;    // su último hijo: el último mensaje

// Remedio 1: nearest desplaza lo mínimo (pero aún puede mover la página)
ultimo.scrollIntoView({ block: "nearest" });

// Remedio 2: desplazar solo la lista, hasta el fondo de su contenido
// scrollHeight: la altura total del contenido, incluida la parte oculta
lista.scrollTo({ top: lista.scrollHeight, behavior: "smooth" });
```

**Un elemento que no está.** Si el elemento aún no está en el DOM (la página carga su contenido mediante una petición), `getElementById` devuelve `null` («ningún valor») y `null.scrollIntoView()` provoca un error. Se espera a que el elemento exista, o se comprueba antes:

```javascript
const destino = document.getElementById("resenas");   // null si el elemento aún no existe

// ?. (encadenamiento opcional) solo llama a la función si destino no es null
destino?.scrollIntoView({ behavior: "smooth" });
```

Un elemento en `display: none` no ocupa ningún lugar en la página: el desplazamiento no hace nada. Por último, si una imagen o un contenido se carga **después** del desplazamiento y agranda la página por encima del elemento, este queda descolocado: reservar el espacio de las imágenes con `width` y `height` evita esa descolocación. La documentación de la función está en [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView).

## `visibilitychange`: saber si la página está siendo vista

Una **pestaña** es una de las páginas abiertas una al lado de otra en una misma ventana del navegador. Está **oculta** cuando el usuario muestra otra, reduce la ventana, bloquea su pantalla o pasa a otra aplicación en el teléfono. En ese estado, nadie mira la página: seguir animándola o consultar a un **servidor** (un ordenador remoto que responde a las peticiones de la página) desperdicia batería y red.

El navegador lo indica mediante `document.visibilityState`, que toma uno de dos valores, y mediante el evento `visibilitychange`, disparado en `document` en cada cambio.

| Propiedad | Valor | Significado |
|---|---|---|
| `document.visibilityState` | `"visible"` | La página se muestra en pantalla |
| `document.visibilityState` | `"hidden"` | La página está oculta: pestaña en segundo plano, ventana reducida, pantalla bloqueada |
| `document.hidden` | `true` o `false` | Versión más antigua de la misma información: `true` cuando el estado es `"hidden"` |

```javascript
// Lectura al inicio: una pestaña abierta en segundo plano empieza en el estado «hidden»
console.log(document.visibilityState);      // "visible" o "hidden"
console.log(document.hidden);               // true si la pestaña está oculta

// El evento se coloca en document (no en window ni en un elemento)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        console.log("Pestaña oculta: ahorramos");
    } else {
        console.log("Pestaña de vuelta: retomamos");
    }
});
```

### Lo que hace el navegador con una pestaña oculta

| Mecanismo | En una pestaña oculta |
|---|---|
| `setTimeout` y `setInterval` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)): los **temporizadores**, que vuelven a llamar a una función tras un retardo o a intervalos regulares | Ralentizados: en general como máximo una ejecución por segundo, a veces mucho menos según el navegador |
| `requestAnimationFrame` (ver [el capítulo sobre el canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Suspendido: la función ya no se llama en absoluto, hasta el regreso a la pestaña |
| Animaciones CSS | El navegador puede reducir su frecuencia (ver [las animaciones CSS](/?c=langages&s=css&p=animations-css-performantes)) |
| Peticiones de red en curso | Continúan: solo el código que las relanza puede ser detenido por el script |

Un temporizador ralentizado no es, por tanto, un temporizador **detenido**: un sondeo cada 5 segundos sigue solicitando al servidor. El script debe decidir él mismo detenerse.

### Suspender un sondeo y retomarlo al volver

Un **sondeo** (*polling*) consiste en preguntar regularmente al servidor si hay algo nuevo. En el ejemplo aparecen dos nociones nuevas. `fetch(direccion)` envía una **petición de red** (una demanda enviada a un servidor, ver [la API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) y devuelve una **promesa**, un objeto que representa un resultado que llegará más tarde; `await` espera ese resultado sin bloquear la página, y `async` delante de una función le permite usarlo (ver [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone)). `.json()` convierte el texto de la respuesta, escrito en formato **JSON** (un formato de texto para intercambiar datos), en un objeto JavaScript.

```javascript
let temporizador = null;                       // temporizador activo, o null (ninguno)

async function actualizar() {
    const respuesta = await fetch("/api/messages");   // pide los mensajes al servidor
    const mensajes = await respuesta.json();          // lee la respuesta como JSON
    console.log(mensajes.length + " mensajes");       // muestra su número
}

function iniciarSondeo() {
    if (temporizador !== null) {               // !== : «es distinto de»
        return;                                // ya iniciado: no lanzamos un segundo
    }
    actualizar();                              // recupera lo que se ha perdido
    temporizador = setInterval(actualizar, 30000);   // luego cada 30 000 milisegundos
}

function detenerSondeo() {
    clearInterval(temporizador);               // clearInterval anula el temporizador
    temporizador = null;                       // anotamos que ya no hay ninguno
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        detenerSondeo();                       // pestaña oculta: ya no hay peticiones
    } else {
        iniciarSondeo();                       // pestaña de vuelta: retomamos
    }
});

if (!document.hidden) {                        // ! : «no»; al cargar, iniciar solo
    iniciarSondeo();                           // si la página es realmente visible
}
```

La guarda `temporizador !== null` impide acumular dos temporizadores si el evento se dispara dos veces seguidas.

### Poner un vídeo en pausa y reanudarlo

Para un [vídeo](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) (la etiqueta `<video>`, un reproductor integrado en la página), hay que recordar el **estado anterior al ocultamiento**: si el usuario había puesto él mismo el vídeo en pausa, reanudarlo al volver sería una sorpresa.

```javascript
const video = document.getElementById("demostracion");   // <video id="demostracion">
let reproduciaAntes = false;     // ¿el vídeo se reproducía antes de ocultarse?

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        reproduciaAntes = !video.paused;   // paused: verdadero si está en pausa
        video.pause();                         // lo pone en pausa
    } else if (reproduciaAntes) {
        video.play().catch(() => {});      // play: el rechazo de la promesa se ignora
        reproduciaAntes = false;               // el estado queda consumido
    }
});
```

### Reanudar una animación sin saltos

`requestAnimationFrame` se detiene solo en una pestaña oculta, así que no hay nada que suspender. Pero, al volver, el tiempo transcurrido entre dos fotogramas ha podido alcanzar varios minutos, y un objeto que avanza proporcionalmente al tiempo **salta** bruscamente. Entonces se limita la duración que se tiene en cuenta.

```javascript
let posicion = 0;                              // posición del objeto, en píxeles
const velocidad = 0.1;                         // 0,1 píxel por milisegundo
let ultimo = null;                             // hora del último fotograma, o null

function imagen(ahora) {                       // ahora: reloj del navegador, en ms
    // duración transcurrida desde el fotograma anterior (0 para el primero)
    const transcurrido = ultimo === null ? 0 : ahora - ultimo;
    ultimo = ahora;                            // guardamos la hora de este fotograma
    posicion += velocidad * Math.min(transcurrido, 100);   // como máximo 100 ms
    requestAnimationFrame(imagen);             // programa el fotograma siguiente
}

requestAnimationFrame(imagen);                 // inicia el bucle
```

### Enviar una última medición con `sendBeacon`

Un sitio que mide el tiempo pasado en una página quiere enviar su medición en el momento en que el usuario se va. Una petición `fetch` lanzada en ese instante corre el riesgo de ser interrumpida por el cierre de la página. `navigator.sendBeacon(direccion, datos)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)) se concibió para ese caso: confía el envío al navegador, que lo lleva a término aunque la página desaparezca. El envío es una petición de tipo **POST**, el método [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) que envía datos a un servidor. Solo devuelve un booleano (`true` si el envío se ha puesto en cola), nunca la respuesta del servidor.

```javascript
const inicio = performance.now();             // ms transcurridos desde el inicio de la carga

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") {
        return;                                // solo se envía al pasar a «hidden»
    }
    // JSON.stringify convierte un objeto en texto JSON; Math.round redondea al entero
    const medicion = JSON.stringify({ duracion: Math.round(performance.now() - inicio) });
    navigator.sendBeacon("/api/mesures", medicion);   // envío POST sin esperar respuesta
});
```

El servidor recibe texto (JSON) en POST. La medición es **acumulativa**: si el usuario oculta y vuelve a mostrar la pestaña varias veces, el servidor recibe varios envíos y se queda con el último.

### ¿Por qué no `beforeunload` ni `unload`?

Muchos tutoriales envían sus mediciones en los eventos `beforeunload` (la página va a cerrarse, puede mostrarse un mensaje de confirmación) o `unload` (la página se está descargando). Son poco fiables:

| Evento | Cuándo se dispara | Fiabilidad para enviar una medición |
|---|---|---|
| `beforeunload` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)) | La página va a abandonarse, cerrarse o recargarse | Baja: en móvil, pasar a otra aplicación o cerrar la pestaña no siempre se anuncia; sirve sobre todo para advertir de una entrada no guardada |
| `unload` | La página se descarga | Baja, y desaconsejado: su presencia puede impedir que el navegador conserve la página entera en memoria para una vuelta atrás instantánea |
| `pagehide` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)) | La página se abandona, **o** se conserva en memoria para una vuelta atrás rápida | Buena: también se dispara cuando el usuario navega a otra parte; `evento.persisted` vale `true` si la página se conserva |
| `visibilitychange` hacia `"hidden"` | La pestaña se oculta, lo que casi siempre precede a un cierre | La más fiable, sobre todo en móvil: es el último momento seguro |

La combinación robusta es `visibilitychange` (paso a `"hidden"`) con `sendBeacon`, complementada eventualmente con `pagehide`. Entonces solo debe contar un envío, de ahí el interés de anotar que una medición ya se ha enviado si no se quiere duplicarla.

```javascript
let yaEnviado = false;                         // true una vez enviada la medición

window.addEventListener("pagehide", () => {
    if (yaEnviado) {
        return;                                // sin duplicado con visibilitychange
    }
    yaEnviado = true;
    navigator.sendBeacon("/api/mesures", "fin");   // texto simple, leído por el servidor
});
```

### Las trampas de `visibilitychange`

| Trampa | Explicación |
|---|---|
| Suponer la página visible al inicio | Un enlace abierto en una pestaña en segundo plano carga la página ya oculta, **sin evento**: leer `document.visibilityState` al inicio |
| Poner en pausa un contenido cuyo audio se quiere | Un reproductor de música, un podcast, una videollamada deben seguir con la pestaña oculta: suspender solo lo puramente visual |
| Relanzar lo que el usuario había detenido | Guardar el estado anterior al ocultamiento (variable `reproduciaAntes`) |
| Olvidar refrescar al volver | Los datos han envejecido durante la ausencia: hacer una nueva petición al volver |
| Un gran salto de tiempo en una animación | Limitar la duración que se tiene en cuenta (`Math.min`) |
| Enviar en `unload` o `beforeunload` | Poco fiable, sobre todo en móvil |

## `AbortController`: cancelar lo que está en curso

Algunas operaciones duran: una petición que espera a un servidor lento, una descarga voluminosa. A veces su resultado ya no interesa (el usuario ha cambiado de página, ha vuelto a escribir su búsqueda) o deben detenerse tras un plazo. `AbortController` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)) es un objeto que sirve de **mando a distancia de cancelación**: se crea, se saca de él una **señal** que se entrega a la operación, y se pulsa «cancelar» cuando se decide.

| Elemento | Papel |
|---|---|
| `new AbortController()` | Crea el mando a distancia |
| `controlador.signal` | Un objeto `AbortSignal`: el hilo que se tiende a la operación para que sepa cuándo detenerse |
| `controlador.abort()` | Pulsa el botón: la señal pasa a «cancelada» y avisa a todos los que la escuchan |
| `signal.aborted` | `true` una vez disparada la cancelación |
| `signal.reason` | El motivo de la cancelación (ver más abajo) |

### Cancelar una petición `fetch`

`fetch` acepta como segundo argumento un objeto de opciones cuya clave `signal` recibe la señal. Si la señal se cancela, la promesa rechazada (una promesa puede fallar: se dice que queda **rechazada**, y el error se captura con `try` / `catch`, ver [la gestión de errores](/?c=langages&s=javascript&p=gestion-des-erreurs)) lleva un error de nombre `AbortError`. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) describe `fetch` en detalle.

```javascript
const controlador = new AbortController();     // el mando a distancia
const signal = controlador.signal;             // la señal que se entrega a fetch

// Al hacer clic en el botón «Cancelar» (<button id="cancelar">), se pulsa el mando
document.getElementById("cancelar").addEventListener("click", () => {
    controlador.abort();                       // la petición en curso se interrumpe
});

async function descargar() {
    try {
        // { signal } es la forma abreviada de { signal: signal }
        const respuesta = await fetch("/api/gros-fichier", { signal });
        console.log("Respuesta recibida", respuesta.ok);   // ok: verdadero si hubo respuesta
    } catch (error) {
        if (error.name === "AbortError") {         // name: el tipo del error (texto)
            console.log("Descarga cancelada");   // cancelación voluntaria, no un fallo
        } else {
            throw error;                           // un error real: lo relanzamos
        }
    }
}
```

La cancelación tiene dos límites. Por un lado, interrumpe **la espera y la descarga en el lado del navegador**, no necesariamente el trabajo del servidor: una petición que modifica datos (un pedido) puede haber sido tratada antes de la cancelación. Por otro lado, también se aplica a la lectura del contenido: un `await respuesta.json()` en curso se interrumpe del mismo modo, con el mismo error.

### Cancelar la petición anterior: la condición de carrera entre peticiones

En una barra de búsqueda que consulta al servidor con cada letra, el usuario escribe «re» y luego «rech». Salen dos peticiones. Nada garantiza que vuelvan **en el orden de envío**: la primera puede ser más lenta. Si su respuesta llega en último lugar, sobrescribe la visualización correcta con resultados caducados. Es una **condición de carrera** (*race condition*) entre peticiones: el resultado depende de cuál llegue primero.

```
Tiempo ---------------------------------------------------------------------->

SIN CANCELACIÓN
 escribe «re»     -> petición A ---------------------------> respuesta A (lenta)
 escribe «rech»   ->    petición B ----------> respuesta B
 pantalla                                       [B]            [A]  <- resultados caducados

CON CANCELACIÓN
 escribe «re»     -> petición A -----X   (abort() al siguiente carácter)
 escribe «rech»   ->    petición B ----------> respuesta B
 pantalla                                       [B]            (A nunca muestra nada)
```

La solución: guardar el controlador de la petición en curso y cancelarlo antes de lanzar una nueva. Para hallar la dirección de búsqueda, `encodeURIComponent(texto)` sustituye los caracteres especiales de un texto (espacios, `&`, acentos) por códigos seguros para ponerlos en una dirección.

```html
<input id="busqueda">                              <!-- campo de entrada -->
<p id="estado"></p>                                  <!-- mensaje de estado -->
<ul id="resultados"></ul>                             <!-- lista de resultados -->
```

```javascript
const campo = document.getElementById("busqueda");
const estado = document.getElementById("estado");
const resultados = document.getElementById("resultados");
let controladorActual = null;                  // controlador de la petición en curso

async function buscar(texto) {
    if (controladorActual !== null) {
        controladorActual.abort();             // cancela la petición anterior, si existe
    }
    controladorActual = new AbortController(); // nuevo mando para esta búsqueda
    estado.textContent = "Búsqueda en curso...";

    try {
        const direccion = "/api/recherche?q=" + encodeURIComponent(texto);
        const respuesta = await fetch(direccion, { signal: controladorActual.signal });
        const lista = await respuesta.json();  // supongamos: un arreglo de textos
        resultados.textContent = "";           // vacía la lista anterior
        for (const nombre of lista) {          // para cada resultado recibido...
            const fila = document.createElement("li");   // ...crea un elemento <li>
            fila.textContent = nombre;
            resultados.appendChild(fila);      // lo añade a la lista mostrada
        }
        estado.textContent = "";               // búsqueda terminada: sin mensaje
    } catch (error) {
        if (error.name === "AbortError") {
            return;                            // sustituida por una más reciente: callamos
        }
        estado.textContent = "La búsqueda ha fallado";
    }
}

campo.addEventListener("input", () => {       // input: en cada modificación del campo
    buscar(campo.value);                       // value: el texto escrito en este momento
});
```

La búsqueda cancelada no toca **ni lo mostrado ni el mensaje de estado**: si no, borraría el «Búsqueda en curso...» de la petición que la sustituye. En la práctica, a menudo se añade un **debounce** (esperar una breve pausa de escritura antes de enviar, ver [los observadores y la limitación de frecuencia](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) para enviar menos peticiones; la cancelación sigue siendo útil para los casos en que dos peticiones salen de todos modos.

### Limitar la duración con `AbortSignal.timeout`

Un servidor que nunca responde dejaría al usuario esperar sin fin. `AbortSignal.timeout(milisegundos)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)) crea una señal que se cancela sola al cabo del plazo indicado, sin controlador que manejar. Su error se llama `TimeoutError`, lo que permite distinguirlo de una cancelación voluntaria.

```javascript
async function cargarConTiempoLimite() {
    try {
        // La señal se cancela sola tras 5000 milisegundos (5 segundos)
        const respuesta = await fetch("/api/lent", { signal: AbortSignal.timeout(5000) });
        console.log("Recibido a tiempo", respuesta.ok);
    } catch (error) {
        if (error.name === "TimeoutError") {        // se ha superado el plazo
            console.log("El servidor tarda demasiado en responder");
        } else if (error.name === "AbortError") {   // cancelación voluntaria (aquí, nunca)
            console.log("Cancelado");
        } else {
            throw error;                            // cualquier otro problema (red caída...)
        }
    }
}
```

Para combinar un plazo y un botón «Cancelar», `AbortSignal.any([signalA, signalB])` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)) crea una señal cancelada en cuanto **una** de las dos lo está:

```javascript
const controlador = new AbortController();     // para el botón «Cancelar»
// Cancelada por controlador.abort() o al cabo de 8 segundos, según cuál ocurra primero
const signal = AbortSignal.any([controlador.signal, AbortSignal.timeout(8000)]);
```

### Retirar varios escuchadores de una vez

Retirar un escuchador con `removeEventListener(nombre, funcion)` exige entregarle **la misma función** que la de `addEventListener`: una función flecha escrita al vuelo no puede retirarse nunca. La señal resuelve el problema: `addEventListener` acepta la opción `signal` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)), y el escuchador se **retira automáticamente** cuando esa señal se cancela. Un solo `abort()` limpia todos los escuchadores que comparten la señal, lo que evita olvidar uno cuando un componente desaparece de la página.

```javascript
const controlador = new AbortController();     // un controlador para todo el componente
const opciones = { signal: controlador.signal }; // el objeto de opciones compartido

window.addEventListener("resize", () => {      // resize: la ventana cambia de tamaño
    console.log("anchura:", window.innerWidth);
}, opciones);                                  // 3er argumento: las opciones, con la señal

document.addEventListener("keydown", (evento) => {
    console.log("tecla:", evento.key);         // key: el nombre de la tecla pulsada
}, opciones);

document.addEventListener("visibilitychange", () => {
    console.log("visibilidad:", document.visibilityState);
}, opciones);

// Más tarde, cuando el componente desaparece: los tres escuchadores se retiran de una vez
controlador.abort();
```

### El motivo de una cancelación

`abort()` acepta un argumento facultativo, el **motivo** de la cancelación. Se lee en `signal.reason`, lo que ayuda a entender por qué se detuvo una operación. Una `DOMException` es el tipo de error que el propio navegador fabrica, con un nombre (`name`) y un mensaje. Atención: el error recibido por `fetch` **es ese mismo motivo**.

| Llamada | Valor de `signal.reason` | Lo que recibe el `catch` de `fetch` |
|---|---|---|
| `controlador.abort()` | Una `DOMException` de nombre `"AbortError"` | Ese error: `error.name === "AbortError"` |
| `controlador.abort("Página abandonada")` | El texto `"Página abandonada"` | El texto mismo: no tiene `name`, así que la prueba `error.name === "AbortError"` falla |
| `AbortSignal.timeout(5000)` | Una `DOMException` de nombre `"TimeoutError"` | Ese error: `error.name === "TimeoutError"` |

```javascript
const controlador = new AbortController();

fetch("/api/rapport", { signal: controlador.signal })
    .catch((error) => {
        console.log(error);                    // muestra: Página abandonada
    });

controlador.abort("Página abandonada");        // el motivo es un texto libre
console.log(controlador.signal.aborted);       // true: la señal está cancelada
console.log(controlador.signal.reason);        // Página abandonada
```

Cuando se proporciona un motivo propio, es preferible comprobar **`signal.aborted`** en lugar de `error.name`, o dar como motivo un error real (`new DOMException("Página abandonada", "AbortError")`).

### Las trampas de `AbortController`

Un controlador cancelado **no se vuelve a armar**: su señal queda cancelada para siempre, y toda operación a la que se le entregue después falla de inmediato. Hay que crear uno nuevo para cada operación.

```javascript
let controlador = new AbortController();
controlador.abort();                  // la señal queda cancelada para siempre

// MAL: esta petición se rechaza enseguida, porque la señal ya está cancelada
fetch("/api/donnees", { signal: controlador.signal })
    .catch(() => console.log("fallo inmediato"));

controlador = new AbortController();           // BIEN: un controlador nuevo
fetch("/api/donnees", { signal: controlador.signal });
```

El otro error es tratar la cancelación como una avería real: mostrar «Error de red» cuando el usuario solo ha lanzado una nueva búsqueda. El `catch` debe distinguir los dos casos, como en los ejemplos de arriba.

## Síntesis

| API | Pregunta a la que responde | Ejemplo de uso | Trampa principal |
|---|---|---|---|
| `window.matchMedia(consulta)` | ¿La condición de pantalla o de ajuste es verdadera, y cambia? | Tema oscuro del sistema, `prefers-reduced-motion`, ventana estrecha | Leer `.matches` una vez sin escuchar `change`; medir `innerWidth` en bucle; usar el obsoleto `addListener` |
| `elemento.scrollIntoView(opciones)` | ¿Cómo llevar este elemento a la vista? | Botón «Ver las tarifas» que desplaza hasta el título | Forzar `smooth` pese a `prefers-reduced-motion`; cabecera fija que tapa el destino (`scroll-margin-top`); desplazar la página entera desde un contenedor anidado |
| `document.visibilityState` y `visibilitychange` | ¿El usuario mira la página? | Suspender un sondeo o un vídeo; enviar una medición con `sendBeacon` | Suponer la página visible al inicio; enviar en `unload`; relanzar lo que el usuario había detenido |
| `AbortController` y `AbortSignal` | ¿Cómo detener lo que está en curso? | Cancelar la búsqueda anterior; `AbortSignal.timeout`; retirar escuchadores de una vez | Reutilizar un controlador cancelado; tratar `AbortError` como un error real |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Escribir `consulta.addListener(...)` | Obsoleto | `consulta.addEventListener("change", ...)` |
| Medir `window.innerWidth` en bucle | Trabajo inútil, batería consumida | `matchMedia` y su evento `change`, o `ResizeObserver` |
| Leer `.matches` una vez y olvidarlo | La interfaz queda caducada si el usuario cambia de tema o gira el dispositivo | Escuchar `change` cuando el ajuste deba seguirse |
| Una media query mal escrita | `matches` vale `false` sin error ni aviso | Conservar los paréntesis: `"(max-width: 600px)"` |
| Forzar `behavior: "smooth"` | Puede marear a las personas sensibles al movimiento | Leer `prefers-reduced-motion` o dejar `auto` y ajustar `scroll-behavior` en CSS |
| Destino tapado por la cabecera fija | La parte superior de la zona visible queda bajo la barra | `scroll-margin-top` en los destinos |
| `scrollIntoView` en un contenedor anidado | La página entera también puede desplazarse | `block: "nearest"` o `contenedor.scrollTo(...)` |
| Elemento ausente del DOM o en `display: none` | Error sobre `null`, o desplazamiento sin efecto | Esperar a que exista, comprobar con `?.` |
| `focus()` que desplaza bruscamente | El navegador desplaza la página hasta el elemento | `focus({ preventScroll: true })` |
| Suponer la página visible al cargar | Una pestaña abierta en segundo plano empieza «hidden» sin evento | Leer `document.visibilityState` al inicio |
| Confiar en `beforeunload` o `unload` para enviar datos | No se disparan de forma fiable, sobre todo en móvil | `visibilitychange` y `sendBeacon`, eventualmente `pagehide` |
| Sondeo o animación que sigue en pestaña oculta | Los temporizadores solo se ralentizan | Detenerse al pasar a `"hidden"` |
| Relanzar un vídeo que el usuario había puesto en pausa | Sorpresa desagradable | Guardar el estado anterior al ocultamiento |
| Reutilizar un `AbortController` cancelado | Su señal queda cancelada: la operación falla de inmediato | Crear un controlador por operación |
| Mostrar `AbortError` como una avería | La cancelación es un funcionamiento normal | Reconocer `error.name` (o `signal.aborted`) y callar |
| Cancelar con un motivo de texto y probar `error.name` | Un texto no tiene `name`: la prueba falla | Probar `signal.aborted`, o dar una `DOMException` |
| Creer que la cancelación detiene el servidor | Solo corta la espera en el lado del navegador | Prever un servidor que tolere que una petición se repita o se abandone |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Preferir `@media` en CSS cuando solo cambia el estilo; reservar `matchMedia` para las decisiones de script | El CSS es más sencillo y más rápido |
| Leer el estado de `matchMedia` al inicio **y** escuchar `change` | Se cubren tanto el estado inicial como los cambios |
| Respetar `prefers-reduced-motion` para todo desplazamiento o animación lanzados por script | Accesibilidad: algunas personas no soportan el movimiento |
| Poner `scroll-margin-top` en los destinos cuando hay una cabecera fija | El destino sigue visible, también para los enlaces de ancla |
| Tras un desplazamiento hacia una zona, colocar el foco en ella con `tabindex="-1"` y `focus({ preventScroll: true })` | La navegación con teclado y con lector de pantalla sigue al desplazamiento |
| Detener lo puramente visual cuando la página se oculta, y retomarlo al volver | Ahorro de batería y de red |
| Enviar las últimas mediciones con `sendBeacon` en `visibilitychange` | El único medio fiable, incluso en móvil |
| Cancelar la petición anterior antes de lanzar una nueva para la misma función | Sin resultados caducados, sin condición de carrera |
| Dar un plazo máximo a las peticiones con `AbortSignal.timeout` | El usuario nunca espera sin fin |
| Agrupar los escuchadores de un componente bajo una misma `signal` | Un solo `abort()` lo limpia todo, nada se olvida |
| Tratar `AbortError` y `TimeoutError` por separado en el `catch` | Cancelación voluntaria, plazo superado y avería llaman cada una a un mensaje distinto |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | `window.matchMedia(consulta)` devuelve un `MediaQueryList`: `.matches` da la respuesta actual, el evento `change` (vía `addEventListener`) avisa de los cambios, nunca al cargar; el CSS sigue siendo preferible cuando solo cambia el estilo. `elemento.scrollIntoView({ behavior, block, inline })` lleva un elemento a la vista; `scroll-margin-top` compensa una cabecera fija, `prefers-reduced-motion` prohíbe forzar `smooth`, y `focus({ preventScroll: true })` mueve el foco sin un segundo desplazamiento. `document.visibilityState` (`"visible"` o `"hidden"`) y el evento `visibilitychange` en `document` permiten suspender sondeos, vídeos y animaciones; `navigator.sendBeacon` envía la última medición, porque `beforeunload` y `unload` son poco fiables, sobre todo en móvil. `new AbortController()` proporciona una `signal` que se entrega a `fetch`, a `addEventListener` o a `AbortSignal.timeout`; `abort()` interrumpe, el error se reconoce por `error.name` (`AbortError`, `TimeoutError`), y un controlador cancelado no se vuelve a armar. |
| **Trampas a evitar** | `addListener` obsoleto; `innerWidth` medido en bucle; `.matches` leído una sola vez; `smooth` forzado; destino tapado por la cabecera fija; contenedor anidado que desplaza la página; elemento ausente del DOM; página supuesta visible al inicio; envío en `unload`; temporizador que sigue con la pestaña oculta; controlador cancelado reutilizado; cancelación tratada como error; motivo de texto que hace fallar la prueba sobre `error.name`. |
| **Buenas prácticas** | CSS primero, `matchMedia` para las decisiones de script; lectura inicial más escucha de `change`; respeto de `prefers-reduced-motion`; `scroll-margin-top` más foco tras un desplazamiento; detención y reanudación con `visibilitychange`; `sendBeacon` para la última medición; cancelación de la petición anterior y `AbortSignal.timeout`; una `signal` compartida para retirar varios escuchadores; `catch` que distingue cancelación, plazo superado y avería. |
