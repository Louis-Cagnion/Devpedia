---
order: 23
---

# Eventos de puntero y carga de fuentes (28/10/2026)

Un **evento** es una señal que el navegador envía cuando ocurre algo (una pulsación, un movimiento, el final de una descarga); un **escuchador** es la función que se conecta a un evento para que se ejecute cada vez. Se explican en detalle en [el capítulo sobre el DOM y los eventos](/?c=langages&s=javascript&p=dom-et-evenements). Este capítulo presenta dos temas del mismo registro que [las API de página del navegador](/?c=langages&s=javascript&p=api-de-page-du-navigateur) (ese capítulo define qué es una API): la información que el navegador da a un script sobre lo que hace el usuario, y sobre lo que la pantalla muestra realmente. Ambos comparten una trampa: el script actúa sobre lo que cree saber, mientras que la realidad (un dedo que sale del marco, una fuente que todavía no ha llegado) cambia después.

| Tema | Lo que permite | Sección |
|---|---|---|
| Los eventos de puntero | Reaccionar igual ante un ratón, un dedo y un lápiz digital; arrastrar un elemento sin perder el seguimiento; gestionar varios dedos | [Los eventos de puntero](#los-eventos-de-puntero) |
| La carga de fuentes | Saber cuándo ha llegado una fuente, para medir un texto o dibujarlo con la anchura correcta | [La carga de fuentes](#la-carga-de-fuentes) |

Este capítulo supone conocidos [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions) (incluidas las funciones flecha `() => { ... }`), [las condiciones](/?c=langages&s=javascript&p=conditions), [los objetos](/?c=langages&s=javascript&p=objets) (la notación `{ nombre: valor }`), [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone) (promesas, `async` y `await`) y [los selectores CSS](/?c=langages&s=css&p=selecteurs). Un **píxel** es el punto más pequeño de una pantalla; `px` es la unidad CSS que cuenta los píxeles. Todas las API de este capítulo están disponibles en todos los navegadores actuales (28/10/2026).

## Los eventos de puntero

### Por qué existen

Un **puntero** es todo lo que señala un punto de la pantalla: el cursor de un **ratón** (el **cursor** es la flecha que el ratón desplaza), un **dedo** apoyado en una **pantalla táctil** (que detecta los contactos), un **lápiz digital** (un bolígrafo especial para tableta). Durante mucho tiempo, cada dispositivo tenía sus propios eventos: `mousedown` para el ratón, `touchstart` para el dedo. Escribir una interfaz que funcionara en todas partes obligaba a escribir el código dos veces. Los **eventos de puntero** (*pointer events*) agrupan los tres dispositivos bajo un mismo conjunto de nombres ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

| | Eventos de ratón | Eventos táctiles | Eventos de puntero |
|---|---|---|---|
| Nombres | `mousedown`, `mousemove`, `mouseup` | `touchstart`, `touchmove`, `touchend` | `pointerdown`, `pointermove`, `pointerup` |
| Dispositivos | Ratón (y panel táctil de ordenador) | Solo dedos | Ratón, dedo, lápiz digital |
| Varios dedos | No aplica | Una lista de contactos en cada evento (`event.touches`) | Un evento por dedo, reconocido por su `pointerId` |
| Posición | `clientX`, `clientY` | `touches[0].clientX` (en la lista) | `clientX`, `clientY` directamente |
| Código que escribir | Un conjunto | Otro conjunto | **Uno solo** |

Un código escrito solo con `mousedown` no responde bien a un dedo: el navegador fabrica, eso sí, eventos de ratón tras un toque, llamados **de compatibilidad**, pero todos de golpe después de que el dedo se levanta, y sin seguir el movimiento. Los eventos de puntero no tienen ese defecto.

> Para probarlos sin teléfono: las herramientas de desarrollo del navegador (F12) saben simular una pantalla táctil.

### Los eventos de un puntero

| Evento | Se dispara cuando | Sube a los padres (burbujea) |
|---|---|---|
| `pointerdown` | El puntero «pulsa»: botón del ratón presionado, dedo o lápiz que toca la pantalla | Sí |
| `pointermove` | El puntero se mueve. Ratón: incluso sin botón presionado; dedo: solo en contacto; lápiz: en contacto o sobrevolando | Sí |
| `pointerup` | El puntero se suelta | Sí |
| `pointercancel` | El navegador **cancela** el gesto: toma el control (desplazamiento, zoom) o el dispositivo pierde el contacto. Ya no llega ningún evento para este puntero | Sí |
| `pointerover` | El puntero entra en el elemento o en uno de sus hijos | Sí |
| `pointerenter` | El puntero entra en el propio elemento (una sola vez, sea cual sea el número de hijos atravesados) | No |
| `pointerout` | El puntero sale del elemento o entra en uno de sus hijos | Sí |
| `pointerleave` | El puntero sale del elemento **y** de todos sus descendientes | No |
| `gotpointercapture`, `lostpointercapture` | El elemento acaba de obtener, o de perder, la captura del puntero (ver [la sección sobre la captura](#arrastrar-la-captura-del-puntero)) | Sí |

Un evento **sube a los padres** (*bubbling*) cuando un escuchador colocado en un padre también lo recibe: este mecanismo se describe en [la propagación de eventos](/?c=langages&s=javascript&p=dom-et-evenements). El **sobrevuelo** (*hover*) es el estado de un elemento sobre el que hay un puntero sin pulsar; un dedo no tiene sobrevuelo, pues toca o no toca. De ahí un orden de eventos distinto según el dispositivo:

| Dispositivo | Secuencia alrededor de una pulsación |
|---|---|
| Ratón | `pointerover`, `pointerenter`, `pointermove` (en cada desplazamiento), `pointerdown`, `pointerup`, luego `click`; `pointerout` y `pointerleave` cuando el cursor sale del elemento |
| Dedo | `pointerover`, `pointerenter`, `pointerdown`, `pointermove`..., `pointerup`, `pointerout`, `pointerleave`, luego `click`: sin sobrevuelo, la entrada y la salida enmarcan de inmediato la pulsación |
| Dedo, cuando el navegador empieza a desplazarse | `pointerdown`, algunos `pointermove`, `pointercancel`, `pointerout`, `pointerleave`; **ni `pointerup`, ni `click`** |

El código mínimo escucha los cuatro eventos del ciclo de vida de un puntero. `console.log` escribe un mensaje en la consola de las herramientas de desarrollo (F12); `document.getElementById` localiza un elemento por su `id`, su identificador único.

```javascript
// Un elemento de la página, localizado por su id
const zona = document.getElementById("zona-prueba");

zona.addEventListener("pointerdown", (evento) => {
    console.log("pulsación", evento.pointerType);   // qué dispositivo pulsa
});

zona.addEventListener("pointermove", () => {
    console.log("movimiento");        // se repite mientras el puntero se mueve
});

zona.addEventListener("pointerup", () => {
    console.log("soltado");
});

zona.addEventListener("pointercancel", () => {
    console.log("cancelado por el navegador");   // ya no llegará ningún pointerup
});
```

### Las propiedades del evento

El objeto recibido por el escuchador es un `PointerEvent` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)). Lleva todo lo que el navegador sabe del puntero:

| Propiedad | Valor | Lo que indica |
|---|---|---|
| `pointerType` | `"mouse"`, `"touch"`, `"pen"` (lápiz digital), o `""` si el dispositivo es desconocido | Qué dispositivo ha producido el evento |
| `pointerId` | Un número entero | El número del puntero: **uno por dedo**. Se mantiene igual desde el `pointerdown` hasta el `pointerup` de ese dedo |
| `isPrimary` | `true` o `false` | Verdadero para el puntero principal de cada tipo de dispositivo: el ratón lo es siempre, y para los dedos, el primero apoyado |
| `clientX`, `clientY` | Números decimales, en píxeles | Posición en la **ventana visible**, medida desde su esquina superior izquierda |
| `pageX`, `pageY` | En píxeles | Posición en la **página entera**, desplazamiento incluido |
| `pressure` | De `0` a `1` | Fuerza de presión. Sin sensor de presión (ratón, la mayoría de pantallas), `0.5` durante la pulsación y `0` en caso contrario |
| `button` | `0` para el botón principal | Qué botón ha cambiado de estado. Un dedo o un lápiz en contacto dan `0` |
| `buttons` | Un número (bits) | Qué botones están presionados en este instante |

```javascript
zona.addEventListener("pointerdown", (evento) => {
    console.log(evento.pointerType);   // "mouse", "touch" o "pen"
    console.log(evento.pointerId);     // el número de este puntero
    console.log(evento.isPrimary);     // true para el puntero principal
    console.log(evento.pressure);      // fuerza de presión, de 0 a 1
    console.log(evento.button);        // 0: botón principal (o contacto)
    console.log(evento.clientX, evento.clientY);   // posición en la ventana
});
```

Para obtener la posición **dentro del elemento** en lugar de en la ventana, se resta la posición del elemento. `getBoundingClientRect()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)) devuelve el rectángulo que ocupa el elemento, medido en las mismas coordenadas que `clientX` y `clientY`: sus propiedades `left` y `top` dan el borde izquierdo y el borde superior, `width` y `height` su tamaño.

```javascript
zona.addEventListener("pointermove", (evento) => {
    // El rectángulo se mide en cada llamada: la página pudo desplazarse entretanto
    const rect = zona.getBoundingClientRect();
    const x = evento.clientX - rect.left;   // distancia al borde izquierdo del elemento
    const y = evento.clientY - rect.top;    // distancia a su borde superior
    console.log(x, y);
});
```

En un [SVG](/?c=langages&s=html&p=svg-dans-la-page) cuya `viewBox` cambia la escala, o en un [canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations) cuya resolución interna difiere del tamaño mostrado, esta resta no basta: hay que añadir una conversión de escala, presentada en esos capítulos (para el SVG, `getScreenCTM`).

### `click` o `pointerdown`?

| | `click` | `pointerdown` |
|---|---|---|
| Cuándo | Tras la pulsación **y** la suelta | Desde la pulsación |
| Teclado | Sí: Intro o Espacio sobre un botón también lo disparan | No |
| Dispositivos | Todos: ratón, dedo, lápiz, teclado, lector de pantalla | Solo punteros |
| Gesto cancelable | Sí: soltar fuera del elemento anula el clic | No: ya se ha lanzado |
| Para qué usarlo | Activar un botón o un enlace | Dibujar, arrastrar, reaccionar sin esperar la suelta |

Un botón que valida una acción debe reaccionar a `click`, si no el teclado deja de funcionar (ver [el foco del teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)).

### Arrastrar: la captura del puntero

Un **arrastre** (*drag*) es un gesto en tres tiempos: pulsar sobre un elemento, moverse manteniendo la pulsación, soltar. La trampa: `pointermove` se envía al elemento **bajo** el puntero. Si el ratón va deprisa y sale del elemento, este ya no recibe nada y se queda inmóvil, o nunca se entera de que el botón se ha soltado en otro sitio. La **captura del puntero** (*pointer capture*) lo remedia: el elemento que captura recibe **todos** los eventos de ese puntero hasta la suelta, estén donde estén.

```
SIN CAPTURA                                  CON setPointerCapture
(el elemento solo recibe lo que              (el elemento recibe TODO, hasta
 llega mientras el puntero está encima)       el final del gesto)

 pointerdown      -> elemento                 pointerdown      -> elemento
                                                (+ setPointerCapture)
 pointermove      -> elemento                 pointermove      -> elemento
 pointermove      -> elemento                 pointermove      -> elemento
   el puntero sale del elemento                 el puntero sale del elemento
 pointerleave     -> elemento                   (ningún pointerleave)
 pointermove      -> página u otro elemento   pointermove      -> elemento
 pointerup        -> página u otro elemento   pointerup        -> elemento
   el elemento nunca sabrá                     lostpointercapture -> elemento
   que el gesto ha terminado: queda «pegado»     (la captura se devuelve sola)
```

| Función o evento | Papel |
|---|---|
| `elemento.setPointerCapture(pointerId)` | El elemento captura este puntero. Hay que llamarla durante el `pointerdown`: el `pointerId` debe designar un puntero activo, si no el navegador lanza un error |
| `elemento.releasePointerCapture(pointerId)` | Devuelve la captura antes del final del gesto |
| `elemento.hasPointerCapture(pointerId)` | `true` si este elemento captura este puntero |
| `gotpointercapture` | El elemento acaba de obtener la captura |
| `lostpointercapture` | El elemento acaba de perderla, por liberación explícita, por `pointerup`, por `pointercancel` o porque ha salido de la página |

La captura se devuelve **automáticamente** al final del gesto (`pointerup` o `pointercancel`): no hay, pues, que liberarla a mano en el caso normal ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)). En una pantalla táctil, el navegador captura incluso el dedo para el elemento tocado desde el `pointerdown` (**captura implícita**); con un ratón, no se captura nada mientras no se pida. Llamar a `setPointerCapture` sigue siendo la buena costumbre: el mismo código funciona para todos los dispositivos.

Durante una captura, los eventos de entrada y salida (`pointerenter`, `pointerleave`, `pointerover`, `pointerout`) se comportan como si el puntero nunca saliera del elemento que captura. Los elementos sobrevolados debajo no reciben nada: para saber qué hay bajo el puntero, hay que pedirlo explícitamente, como hace el ejemplo completo más abajo.

### `touch-action`: ¿quién decide el desplazamiento táctil?

En una pantalla táctil, un dedo que se desliza puede significar «desplaza la página», «haz zoom» o «mueve mi mapa». El navegador debe decidir **al inicio del gesto**, según la propiedad CSS `touch-action` del elemento tocado ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)). Si decide desplazarse, toma el control y envía `pointercancel`: el elemento ya no recibe ningún `pointermove`. Llamar a `preventDefault()` en `pointermove` no cambia nada: la decisión ya está tomada.

| Valor | Lo que el navegador gestiona en el elemento | Uso |
|---|---|---|
| `auto` (por defecto) | Desplazamiento en ambos sentidos, zoom por pellizco, zoom por doble toque | Todo lo que no es un gesto personalizado |
| `none` | **Nada**: todo gesto llega a los escuchadores | Zona de dibujo, mapa o plano que se mueve con el dedo |
| `pan-y` | Solo el desplazamiento vertical | Un deslizador horizontal en una página que se desplaza de arriba abajo: el gesto horizontal vuelve al script |
| `pan-x` | Solo el desplazamiento horizontal | El caso simétrico |
| `pinch-zoom` | Solo el zoom por pellizco | Combinar con `pan-x` o `pan-y` para conservar el zoom |
| `manipulation` | Desplazamiento y pellizco, pero no el zoom por doble toque | Botones y listas: sin zoom intempestivo |

```css
.tarjeta {
    touch-action: none;       /* un dedo apoyado aquí no desplaza ni hace zoom */
}

.deslizador-horizontal {
    touch-action: pan-y;      /* la página se desplaza en vertical; lo horizontal, nuestro */
}
```

El valor se lee **al inicio del gesto**: cambiarlo en JavaScript a mitad de un arrastre no tiene efecto sobre ese arrastre. Y `touch-action: none` puesto en una zona grande impide desplazar la página al tocarla: mejor reservarlo para el elemento que se arrastra, y no bloquear el zoom por pellizco en todas partes, pues hay personas que lo necesitan para leer.

### Ejemplo completo: arrastrar una tarjeta hacia una zona

Una tarjeta se arrastra hacia una zona de depósito. Si se suelta sobre la zona, se queda allí; si se suelta en otro sitio, si el navegador cancela el gesto o si se pulsa Esc, vuelve a su sitio. Un solo dedo a la vez puede conducir el arrastre. Primero el HTML y el CSS:

```html
<!-- La zona donde se deposita, la tarjeta a arrastrar y un mensaje de estado -->
<div id="zona-deposito" class="zona-deposito">Depositar aquí</div>
<div id="tarjeta" class="tarjeta">Arrástrame</div>
<p id="estado">Ningún arrastre en curso</p>
```

```css
.tarjeta {
    width: 120px;
    padding: 12px;
    background: #e8eefc;
    cursor: grab;             /* mano abierta al sobrevolar, con un ratón */
    touch-action: none;       /* el navegador no desplaza ni hace zoom aquí */
    user-select: none;        /* el texto de la tarjeta no se selecciona */
}

.tarjeta.arrastrando {
    cursor: grabbing;         /* mano cerrada durante el arrastre */
    opacity: 0.8;             /* un poco transparente: se ve la zona de debajo */
}

.zona-deposito {
    height: 100px;
    border: 2px dashed #999;  /* marco de puntos */
}

.zona-deposito.sobrevuelo {
    border-color: #1a4fd6;    /* marco azul cuando el puntero está encima */
}
```

`.tarjeta.arrastrando` es un [selector](/?c=langages&s=css&p=selecteurs) que apunta a un elemento que lleva **a la vez** las clases `tarjeta` y `arrastrando`; `cursor` elige la forma del cursor del ratón; `opacity` regula la transparencia (de `0`, invisible, a `1`, opaco); `user-select: none` prohíbe la selección del texto, que se activaría si no al arrastrar con el ratón. El JavaScript guarda el estado del arrastre en unas cuantas variables:

```javascript
const tarjeta = document.getElementById("tarjeta");
const zona = document.getElementById("zona-deposito");
const estado = document.getElementById("estado");

let activo = null;     // pointerId del arrastre en curso, o null si no hay ninguno
let posicionX = 0;     // posición fijada de la tarjeta, en píxeles
let posicionY = 0;
let desfaseX = 0;      // separación entre el puntero y la tarjeta al inicio
let desfaseY = 0;
let nuevaX = 0;        // posición de la tarjeta durante el arrastre
let nuevaY = 0;
```

Tres pequeñas funciones se derivan de ahí. `transform: translate(x, y)` desplaza un elemento en pantalla sin tocar la maquetación (ver [el posicionamiento](/?c=langages&s=css&p=positionnement) y [las animaciones CSS](/?c=langages&s=css&p=animations-css-performantes)). Los acentos graves (`` ` ``) delimitan un texto donde `${x}` se sustituye por el valor de `x`. `document.elementsFromPoint(x, y)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint)) devuelve el arreglo de todos los elementos presentes en ese punto de la ventana, del más alto al más bajo; `includes(zona)` responde `true` si la zona forma parte de él.

```javascript
function mover(x, y) {
    // Los acentos graves insertan x e y en el texto: "translate(40px, 10px)"
    tarjeta.style.transform = `translate(${x}px, ${y}px)`;
}

function bajoElPuntero(x, y) {
    // Los elementos apilados en ese punto: ¿es la zona uno de ellos?
    return document.elementsFromPoint(x, y).includes(zona);
}

function terminar(soltada) {
    activo = null;                         // ningún arrastre en curso
    tarjeta.classList.remove("arrastrando");
    zona.classList.remove("sobrevuelo");
    if (soltada) {
        posicionX = nuevaX;                // la tarjeta se queda donde se soltó
        posicionY = nuevaY;
        estado.textContent = "Tarjeta depositada en la zona";
    } else {
        mover(posicionX, posicionY);       // vuelta a la posición anterior al arrastre
        estado.textContent = "Tarjeta devuelta a su sitio";
    }
}
```

Los escuchadores retoman los cuatro eventos del ciclo de vida, más la tecla Esc. `classList` y `textContent` se presentan en [el capítulo sobre el DOM](/?c=langages&s=javascript&p=dom-et-evenements); `classList.toggle(nombre, condicion)` añade la clase si la condición es verdadera, la quita si no.

```javascript
tarjeta.addEventListener("pointerdown", (evento) => {
    if (activo !== null) return;           // ya hay un arrastre: ignoramos los otros dedos
    if (evento.button !== 0) return;       // ratón: solo el botón principal
    activo = evento.pointerId;             // retenemos QUÉ puntero arrastra
    desfaseX = evento.clientX - posicionX; // el desfase se mantiene durante el arrastre
    desfaseY = evento.clientY - posicionY;
    tarjeta.setPointerCapture(activo);     // la tarjeta recibe todo, incluso fuera de ella
    tarjeta.classList.add("arrastrando");
    evento.preventDefault();               // sin eventos de ratón de compatibilidad
    estado.textContent = "Arrastre en curso";
});

tarjeta.addEventListener("pointermove", (evento) => {
    if (evento.pointerId !== activo) return;   // no es el puntero que arrastra
    nuevaX = evento.clientX - desfaseX;        // la tarjeta sigue al puntero
    nuevaY = evento.clientY - desfaseY;
    mover(nuevaX, nuevaY);
    const encima = bajoElPuntero(evento.clientX, evento.clientY);
    zona.classList.toggle("sobrevuelo", encima);   // marco azul si el puntero está encima
});

tarjeta.addEventListener("pointerup", (evento) => {
    if (evento.pointerId !== activo) return;
    // Soltada sobre la zona: depósito; en otro sitio: vuelta a la posición de origen
    terminar(bajoElPuntero(evento.clientX, evento.clientY));
});

tarjeta.addEventListener("pointercancel", (evento) => {
    if (evento.pointerId === activo) terminar(false);   // gesto cancelado: vuelta
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && activo !== null) {
        tarjeta.releasePointerCapture(activo);   // devuelve el seguimiento a otros elementos
        terminar(false);                         // cancelación querida por el usuario
    }
});
```

Lo que aporta cada pieza:

| Pieza | Si se quita |
|---|---|
| `setPointerCapture` | Con ratón, un movimiento rápido sale de la tarjeta: esta se detiene, y la suelta en otro sitio nunca llega hasta ella |
| `touch-action: none` | En el teléfono, el dedo desplaza la página, el navegador envía `pointercancel`, y la tarjeta suelta tras unos píxeles |
| `pointercancel` escuchado | La tarjeta queda bloqueada en el estado «arrastrando» tras una cancelación del navegador |
| `activo` y la prueba de `pointerId` | Un segundo dedo (o un sobrevuelo del ratón sin pulsar) movería la tarjeta |
| `elementsFromPoint` | `pointerenter` sobre la zona no se dispara durante la captura: la zona nunca sabría que la sobrevuelan |
| `releasePointerCapture` con Esc | El dedo sigue apoyado: sin devolver la captura, la tarjeta seguiría recibiendo todo el gesto |
| `preventDefault()` en `pointerdown` | Tras un toque, el navegador enviaría además eventos de ratón de compatibilidad (`mousedown`...) |

`preventDefault()` en `pointerdown` solo impide esos eventos de compatibilidad. No sustituye ni a `touch-action` (el desplazamiento táctil), ni a `user-select` (la selección de texto con ratón). Cada efecto molesto tiene su propio remedio:

| Efecto molesto durante un arrastre | Remedio |
|---|---|
| La página se desplaza bajo el dedo | `touch-action: none` (CSS) |
| El texto se selecciona con el ratón | `user-select: none` (CSS) |
| Llegan eventos de ratón tras el toque | `preventDefault()` en `pointerdown` |
| El arrastre solo funciona con ratón o con dedo | Añadir un equivalente con teclado (ver [el foco del teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)): un arrastre solo excluye a quien no puede apuntar |

### Varios dedos a la vez

Usar varios dedos a la vez se llama **multitáctil** (*multitouch*). Cada dedo apoyado crea **su propio puntero**, con su `pointerId`, sus propios `pointerdown`, `pointermove` y `pointerup`. El `pointerId` es, pues, la clave para seguir cada dedo por separado. El ejemplo memoriza la posición de cada dedo apoyado y calcula la separación entre dos dedos, la base de un gesto de pellizco.

Algunas nociones del ejemplo. Un `Map` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) es una tabla que asocia una **clave** con un **valor**: `set(clave, valor)` añade o reemplaza, `has(clave)` comprueba la presencia, `delete(clave)` retira, `size` da el número de entradas. Los tres puntos `[...dedos.values()]` copian los valores del Map en un arreglo, y `const [a, b] = ...` guarda los dos primeros en `a` y `b` (ver [la desestructuración y el spread](/?c=langages&s=javascript&p=objets)). `Math.hypot(dx, dy)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot)) calcula la distancia entre dos puntos cuyas posiciones difieren en `dx` y en `dy`: es la raíz cuadrada de `dx` al cuadrado más `dy` al cuadrado (teorema de Pitágoras), la raíz cuadrada de un número siendo aquel que, multiplicado por sí mismo, da de nuevo ese número.

```html
<div id="superficie" class="superficie">Coloque dos dedos aquí</div>
<p id="info">0 puntero(s) apoyado(s)</p>
```

```css
.superficie {
    height: 200px;
    background: #e8eefc;
    touch-action: none;      /* sin esto, dos dedos desplazan o hacen zoom en la página */
}
```

```javascript
const superficie = document.getElementById("superficie");
const info = document.getElementById("info");

// Un Map asocia una clave (aquí el pointerId) con un valor (aquí la posición del dedo)
const dedos = new Map();

function mostrar() {
    let texto = dedos.size + " puntero(s) apoyado(s)";   // size: número de entradas
    if (dedos.size === 2) {
        const [a, b] = [...dedos.values()];              // las dos posiciones
        const separacion = Math.hypot(a.x - b.x, a.y - b.y);  // distancia entre los dos dedos
        texto += ", separación: " + Math.round(separacion) + " px";
    }
    info.textContent = texto;
}

superficie.addEventListener("pointerdown", (evento) => {
    superficie.setPointerCapture(evento.pointerId);      // seguir este dedo por todas partes
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    mostrar();
});

superficie.addEventListener("pointermove", (evento) => {
    if (!dedos.has(evento.pointerId)) return;            // este puntero no está apoyado
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    mostrar();
});

function soltar(evento) {
    dedos.delete(evento.pointerId);                      // este dedo ya no está apoyado
    mostrar();
}

superficie.addEventListener("pointerup", soltar);
superficie.addEventListener("pointercancel", soltar);    // una cancelación retira el dedo
```

Retirar el dedo también en `pointercancel` es esencial: si no, el Map conservaría un dedo fantasma, y `dedos.size` nunca volvería a cero.

### `pointer-events`: dejar pasar los clics

`pointer-events` es una propiedad CSS que decide si un elemento puede ser el **objetivo** de un puntero ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events)). Para un elemento HTML, cuentan dos valores; el [capítulo sobre el SVG](/?c=langages&s=html&p=svg-dans-la-page) detalla los valores propios de las formas SVG (`all`, `stroke`...).

| Valor | Efecto |
|---|---|
| `auto` (por defecto) | El elemento recibe los punteros con normalidad |
| `none` | El elemento es **transparente** a los punteros: el clic o el toque lo atraviesa y llega a lo que está debajo. No recibe eventos de puntero ni sobrevuelo (`:hover`) |

El caso típico es un adorno colocado **encima** de contenido pulsable, como un velo degradado que difumina la parte inferior de una lista (ver [los degradados](/?c=langages&s=css&p=degrades)):

```html
<div class="marco">
    <ul class="lista">
        <li><button>Artículo 1</button></li>
        <li><button>Artículo 2</button></li>
        <li><button>Artículo 3</button></li>
    </ul>
    <!-- Velo decorativo, colocado encima de la parte inferior de la lista -->
    <div class="velo"></div>
</div>
```

```css
.marco {
    position: relative;          /* punto de referencia para el velo */
}

.lista {
    height: 120px;
    overflow-y: auto;            /* barra vertical si el contenido se desborda */
}

.velo {
    position: absolute;          /* colocado encima, sin ocupar espacio */
    left: 0;                     /* pegado a los bordes izquierdo, derecho e inferior */
    right: 0;
    bottom: 0;
    height: 40px;
    background: linear-gradient(transparent, #ffffff);   /* del transparente al blanco */
    pointer-events: none;        /* los clics y los toques lo atraviesan */
}
```

Sin `pointer-events: none`, el velo interceptaría los clics en los botones que oculta, y la rueda del ratón sobre él dejaría de desplazar la lista ([el posicionamiento](/?c=langages&s=css&p=positionnement) explica `relative` y `absolute`). Tres precisiones:

| Precisión | Detalle |
|---|---|
| Los hijos pueden volver | Un hijo de un elemento en `pointer-events: none` puede poner `pointer-events: auto`: solo él vuelve a ser pulsable |
| El teclado no está afectado | Un botón en `none` sigue siendo accesible con Tab y activable con Intro. Para desactivar un botón, usar el atributo `disabled` (ver [los formularios](/?c=langages&s=html&p=formulaires)) |
| La búsqueda por posición sigue la regla | `document.elementFromPoint` y `elementsFromPoint` ignoran los elementos en `none`, como lo haría un clic real |

### Las trampas de los eventos de puntero

**Olvidar `pointercancel`.** Un arrastre que solo termina con `pointerup` se queda bloqueado cuando el navegador anula el gesto (desplazamiento, llamada entrante, cambio de aplicación): el estado «arrastrando» nunca se reinicia. Todo estado creado en `pointerdown` debe deshacerse con `pointerup` **y** con `pointercancel`, lo que hace la función `terminar` del ejemplo.

**Contar con `pointerleave` durante una captura.** No se dispara mientras el elemento captura (ver el esquema de más arriba). Para saber qué hay bajo el puntero, usar `document.elementsFromPoint`.

**Mantener la captura cuando ya no sirve.** Se devuelve sola al final del gesto, pero un arrastre que el usuario cancela a mitad de camino (Esc) deja el dedo apoyado: sin `releasePointerCapture`, el elemento sigue recibiendo todo el gesto. Y `setPointerCapture` con un `pointerId` que ya no está activo lanza un error: llamarla durante el `pointerdown`.

**Suponer que `mouse` existe.** En un teléfono, `pointerType` vale `"touch"`: un código que prueba `pointerType === "mouse"` no reacciona a nada. En un ordenador con pantalla táctil, ratón y dedo coexisten. Razonar por capacidad, no por dispositivo: `window.matchMedia("(hover: hover)")` indica si el sobrevuelo existe (ver [`matchMedia`](/?c=langages&s=javascript&p=api-de-page-du-navigateur)).

**Reaccionar solo al sobrevuelo.** Un dedo no tiene sobrevuelo: una información emergente que solo aparece con `pointerenter` nunca existe al tocar. Prever un equivalente con la pulsación o con el teclado.

**El caso de los números decimales.** `clientX` y `clientY` pueden tener una parte decimal en una pantalla de alta densidad de píxeles: redondearlos (`Math.round`) antes de usarlos como posición de píxel entero.

## La carga de fuentes

### Por qué cambia el texto cuando llega la fuente

Una **fuente** (*font*) es el dibujo de las letras: su forma, su grosor (el **grosor**, `400` para un texto normal, `700` para la negrita). Las fuentes instaladas en el dispositivo, como Georgia o Arial, se pueden usar de inmediato. Una **fuente web** es un archivo que la página descarga, declarado en el CSS por la regla `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face)). Este capítulo no elige las fuentes: para eso, ver [la tipografía](/?c=ui-ux&p=typographie).

La propiedad `font-family` da una **lista**: el navegador toma la primera fuente disponible. Mientras la fuente web se descarga, usa la siguiente, la **fuente de respaldo** (*fallback*), o no muestra nada, según el ajuste `font-display`. Cuando llega el archivo, sustituye a la fuente de respaldo: el texto se vuelve a dibujar con otras anchuras. El **archivo de fuente** aquí está en formato WOFF2, un formato comprimido concebido para la web.

```css
@font-face {
    font-family: "Lora";            /* el nombre que se usará después */
    src: url("/fuentes/lora.woff2") format("woff2");   /* dirección del archivo, y formato */
    font-weight: 700;               /* esta declaración aporta el grosor negrita */
    font-display: swap;             /* ver la sección siguiente */
}

h2 {
    font-family: "Lora", Georgia, serif;   /* Lora, si no Georgia, si no serif */
    font-weight: 700;
}
```

`serif` es un nombre de **familia genérica**: cualquier fuente con remates (pequeños trazos en los extremos de las letras) del dispositivo. La carga no empieza al leer el CSS: el navegador descarga el archivo solo **cuando un texto de la página lo necesita**, tras calcular la maquetación. El esquema siguiente (valores de ejemplo) muestra lo que ve el usuario, y lo que devuelve una medición tomada demasiado pronto:

```
Tiempo ----------------------------------------------------------------------->

Página    | primera maquetación | espera del archivo ......... | maquetación 2
Texto     | fuente de respaldo (Georgia)                        | fuente web (Lora)
Anchura   | « Nuevo »: 61 px    |  medida tomada AQUÍ: 61 px   | « Nuevo »: 68 px
                                    (falsa: ya no es
                                     la fuente mostrada)
```

Este cambio de anchura desplaza todo lo que sigue al texto: es un **salto de maquetación** (*layout shift*). Molesta a la lectura y falsea todo código que haya **medido** el texto antes de la llegada de la fuente.

### `font-display`: ¿qué mostrar durante la espera?

La propiedad `font-display`, colocada en `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)), decide lo que se muestra durante la descarga. Distingue un periodo de **bloqueo** (el texto es invisible, para evitar el salto de maquetación) y un periodo de **intercambio** (la fuente de respaldo se muestra, sustituida por la fuente web cuando llega).

| Valor | Durante la espera | Si la fuente llega tarde | Uso típico |
|---|---|---|---|
| `auto` | A elección del navegador, por lo general como `block` | Igual | Evitar: comportamiento impredecible |
| `block` | Texto **invisible** unos segundos, luego fuente de respaldo | Intercambio al llegar | Una fuente de iconos, donde la fuente de respaldo sería ilegible |
| `swap` | Fuente de respaldo **de inmediato** | Intercambio en cualquier momento | El texto corriente: se lee sin esperar |
| `fallback` | Texto invisible un instante muy corto, luego fuente de respaldo | Intercambio aceptado solo durante unos segundos | Compromiso: sin gran salto tardío |
| `optional` | Texto invisible un instante muy corto, luego fuente de respaldo | La fuente web **no se aplica** en esta página; sirve para las visitas siguientes | Una fuente de confort, nunca indispensable |

Las duraciones exactas («unos segundos», «un instante muy corto») dependen del navegador. Una consecuencia para lo que sigue: con `swap`, `fallback` y `optional`, la fuente mostrada cambia según el momento y la conexión. Un código que mide no debe suponer nunca cuál se muestra: espera el estado final, y luego mide lo que está realmente en pantalla.

### `document.fonts`: seguir la carga

`document.fonts` es un objeto `FontFaceSet` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API)): el conjunto de fuentes conocidas de la página, con lo necesario para seguir su carga.

| Elemento | Naturaleza | Papel |
|---|---|---|
| `document.fonts.ready` | Promesa | Se resuelve cuando la carga en curso ha terminado y la maquetación está actualizada |
| `document.fonts.load(fuente)` | Función, devuelve una promesa | Inicia la carga de la fuente descrita **y** la espera |
| `document.fonts.check(fuente)` | Función, devuelve un booleano | `true` si la fuente está lista, sin cargar nada |
| `new FontFace(nombre, origen)` | Constructor | Describe una fuente en JavaScript, sin `@font-face` |
| `document.fonts.add(cara)` | Función | Añade una `FontFace` al conjunto: el CSS puede entonces usarla |
| `document.fonts.status` | Texto | `"loading"` durante una carga, `"loaded"` en caso contrario |
| `loadingdone`, `loadingerror` | Eventos | Fin de un lote de cargas, o fallo de al menos una |

Una **promesa** es un objeto que representa un resultado futuro; `await` espera ese resultado dentro de una función `async` (ver [la programación asíncrona](/?c=langages&s=javascript&p=asynchrone)). Para esperar todas las fuentes que se están cargando:

```javascript
async function iniciar() {
    await document.fonts.ready;        // espera a que las fuentes en curso estén listas
    console.log("Fuentes listas");
}

iniciar();
```

`document.fonts.ready` espera lo que **ya está en curso**. Para pedir una fuente concreta, `document.fonts.load()` toma una descripción en la sintaxis de la propiedad CSS `font`: un grosor, un tamaño, un nombre de familia (`"700 18px Lora"`); un segundo argumento opcional da el texto que se mostrará, útil cuando la fuente se divide por rangos de caracteres. `check()` toma la misma descripción.

```javascript
async function prepararTitulos() {
    const fuente = "700 18px Lora";        // grosor, tamaño, familia: como CSS font
    // true solo si la fuente está cargada (o si ningún @font-face la describe)
    console.log(document.fonts.check(fuente));
    const caras = await document.fonts.load(fuente);   // inicia la carga y la espera
    console.log(caras.length);             // número de fuentes cargadas: 1 aquí
    console.log(document.fonts.check(fuente));         // true: la fuente está lista
}

prepararTitulos();
```

`load()` devuelve un arreglo de `FontFace`: **vacío** si ningún `@font-face` coincide (un error en el nombre de familia no produce ningún error), rechazado si el archivo no ha podido descargarse. El **grosor pedido cuenta**: `"18px Lora"` carga el grosor normal, no la negrita.

### El objeto `FontFace`: cargar una fuente desde JavaScript

Cuando el nombre o la dirección de la fuente solo se conocen en tiempo de ejecución (una elección del usuario, una fuente recibida de un servidor), `FontFace` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FontFace)) la declara desde JavaScript. Su `status` vale `"unloaded"`, `"loading"`, `"loaded"` o `"error"`. Un fallo se captura con `try` / `catch` (ver [la gestión de errores](/?c=langages&s=javascript&p=gestion-des-erreurs)).

```javascript
async function cargarFuente() {
    // new FontFace(nombre, origen, opciones) describe la fuente sin descargarla todavía
    const cara = new FontFace("Lora", "url(/fuentes/lora.woff2)", { weight: "700" });
    try {
        await cara.load();                 // descarga; promesa rechazada si falla
        document.fonts.add(cara);          // el CSS puede usar ya «Lora»
        console.log(cara.status);          // "loaded"
    } catch (error) {
        console.log("Fuente no disponible:", error.name);   // la fuente de respaldo se queda
    }
}

cargarFuente();
```

### Reaccionar a cada lote: `loadingdone`

`ready` es una promesa: solo sirve una vez. Si otras fuentes se cargan más tarde (texto añadido a la página, otro idioma), una promesa ya obtenida no lo sabe. Los eventos `loadingdone` y `loadingerror` de `document.fonts` avisan **en cada lote**:

```javascript
document.fonts.addEventListener("loadingdone", (evento) => {
    // fontfaces: la lista de las fuentes que acaban de terminar de cargarse
    console.log(evento.fontfaces.length + " fuente(s) cargada(s)");
});

document.fonts.addEventListener("loadingerror", () => {
    console.log("Al menos una fuente no ha podido cargarse");
});
```

### Medir un texto después de la fuente

Varias herramientas dan la **anchura de un texto**. Todas miden el texto **tal como se muestra en este instante**: si la fuente web no ha llegado, miden la fuente de respaldo, sin error ni aviso.

| Herramienta | Lo que mide | La trampa antes de la fuente |
|---|---|---|
| `canvas.measureText(texto).width` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)) | La anchura de un texto con la fuente fijada en `ctx.font` (ver [el canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Un nombre de fuente no cargada no es un error: el canvas usa otra fuente, y no se vuelve a dibujar solo |
| `elemento.getBoundingClientRect()` | El tamaño de un elemento HTML, con su fuente actual | La anchura de un texto con la fuente de respaldo, o incluso de un texto invisible (`block`) |
| `elemento.getComputedTextLength()` | La anchura de un `<text>` SVG (ver [el SVG](/?c=langages&s=html&p=svg-dans-la-page)) | Mismo efecto: el fondo ajustado a una anchura incorrecta |

El remedio es el mismo para todos: **esperar la fuente, y luego medir**. El ejemplo ajusta el fondo de una etiqueta SVG a la anchura de su texto. El `<rect>` es el fondo; `rx` redondea sus esquinas; el texto se escribe en negrita con la fuente `Lora`.

```html
<svg id="insignia" viewBox="0 0 200 60" width="200" height="60">
    <!-- El fondo: su anchura la calculará el script (0 al principio) -->
    <rect id="fondo-etiqueta" x="10" y="10" width="0" height="36" rx="6" fill="#e8eefc"/>
    <!-- El texto, en Lora negrita 18 px; x="22" deja 12 de margen tras el fondo -->
    <text id="etiqueta" x="22" y="34" font-family="Lora, Georgia, serif"
          font-weight="700" font-size="18">Nuevo</text>
</svg>
```

```javascript
const etiqueta = document.getElementById("etiqueta");
const fondo = document.getElementById("fondo-etiqueta");
const MARGEN = 12;                         // espacio a cada lado del texto, en unidades

function ajustarFondo() {
    const anchura = etiqueta.getComputedTextLength();   // anchura del texto mostrado
    fondo.setAttribute("width", anchura + 2 * MARGEN);   // el fondo sobresale a cada lado
}

async function iniciar() {
    try {
        // Pide la fuente exacta del texto (negrita, 18 px) y espera su llegada
        await document.fonts.load("700 18px Lora");
    } catch (error) {
        console.log("Fuente no cargada: se mide la fuente de respaldo");
    }
    ajustarFondo();                        // mide la fuente realmente mostrada
}

iniciar();
```

En el `catch`, la medición se realiza igualmente: si la carga falla, es la fuente de respaldo la que se muestra, y medirla da la anchura correcta. El principio es medir **lo que está en pantalla**, no la fuente que se desearía.

Un canvas plantea un problema adicional: es una imagen en píxeles, que **nunca se actualiza sola**. Un texto dibujado con la fuente de respaldo se queda así, incluso después de la llegada de la fuente web. Por eso se espera la fuente antes de dibujar, y se vuelve a dibujar en cada lote de fuentes:

```javascript
// <canvas id="cartel" width="200" height="60"> : la zona de dibujo
const canvas = document.getElementById("cartel");
const ctx = canvas.getContext("2d");      // ctx: el objeto que dibuja en el canvas

async function dibujar() {
    const fuente = "700 24px Lora";
    // Un fallo se ignora: se dibujará entonces con la fuente de respaldo
    await document.fonts.load(fuente).catch(() => {});
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // borra la imagen anterior
    ctx.font = fuente;                                  // misma sintaxis que CSS font
    const anchura = ctx.measureText("Rebajas").width;   // anchura del texto con esta fuente
    ctx.fillStyle = "#e8eefc";
    ctx.fillRect(10, 10, anchura + 20, 40);             // fondo: x, y, anchura, altura
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText("Rebajas", 20, 38);                    // texto, línea base en (20, 38)
}

dibujar();
document.fonts.addEventListener("loadingdone", dibujar);   // vuelve a dibujar tras cada lote
```

Para un **elemento HTML** cuyo tamaño debe seguir al texto sea cual sea la causa del cambio (fuente, idioma, ventana), un `ResizeObserver` (ver [los observadores](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) vuelve a llamar al script en cada variación, sin que tenga que esperar las fuentes por sí mismo.

### Las trampas de la carga de fuentes

**Medir demasiado pronto.** Una medición lanzada desde la carga del script, o en `DOMContentLoaded` (el final de la lectura del HTML), precede a menudo a la llegada de la fuente: anchura falsa, fondo mal ajustado, texto que desborda su marco. Medir después de `await document.fonts.load(...)`.

**Creer que `ready` basta.** `ready` solo cubre lo que **ya está en curso**. Llamado muy pronto, antes de que el navegador haya calculado la maquetación y descubierto que un texto necesita la fuente, puede estar ya resuelto cuando nada ha llegado:

```javascript
// Script ejecutado muy pronto en la página
document.fonts.ready.then(() => {
    // MAL: puede ejecutarse incluso antes de que se haya pedido la descarga
    console.log(document.fonts.status);    // "loaded", aunque Lora no ha llegado
});

// BIEN: pedir la fuente explícitamente, y luego esperar
document.fonts.load("700 18px Lora").then(() => {
    console.log("Lora ha llegado");
});
```

**Un nombre de fuente incorrecto o ausente no produce ningún error.** `document.fonts.load("700 18px Lroa")` (errata) se resuelve con un arreglo vacío, y `document.fonts.check("700 18px Lroa")` devuelve `true`: ninguna fuente declarada coincide, así que no hay nada que esperar. El texto se muestra con la fuente de respaldo, en silencio. Comprobar que `caras.length` no es `0`, y que el nombre es idéntico al de `@font-face`.

**Una carga que falla.** Archivo no encontrado, red cortada: `load()` rechaza su promesa, el evento `loadingerror` se dispara y el texto se queda con la fuente de respaldo. Sin `try` / `catch` alrededor del `await`, el error interrumpe la función **antes de la medición**, que entonces nunca tiene lugar. Además, `ready` no señala el fallo: para saberlo hay que escuchar `load()` (o `loadingerror`).

**Pedir el grosor equivocado.** `load("16px Lora")` solo carga el grosor normal; un título en negrita (`700`) sigue en espera. Pedir exactamente la combinación de grosor, estilo (`italic`) y tamaño que usa el texto.

**Fijar `ctx.font` con otra fuente distinta de la de la página.** La medición ya no corresponde a lo que se muestra (ver [la trampa del canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)).

## Síntesis

| Necesidad | Herramienta | Trampa principal |
|---|---|---|
| Reaccionar igual ante ratón, dedo y lápiz digital | `pointerdown`, `pointermove`, `pointerup` | Suponer que `pointerType` vale `"mouse"` |
| Reconocer cada dedo | `pointerId` (un `Map` de pointerId a posición) | Olvidar retirar el dedo en `pointercancel` |
| Arrastrar sin perder el seguimiento | `setPointerCapture` en `pointerdown` | Contar con `pointerleave`, que no llega durante la captura |
| Impedir el desplazamiento táctil durante un gesto | `touch-action: none` (o `pan-y`, `pan-x`) | `preventDefault()` solo no basta; valor leído al inicio del gesto |
| Saber qué hay bajo el puntero | `document.elementsFromPoint(x, y)` | Un elemento en `pointer-events: none` no aparece en la lista |
| Dejar que los clics atraviesen un adorno | `pointer-events: none` | No desactiva el teclado: `disabled` para un verdadero botón |
| Evitar el salto de maquetación de una fuente | `font-display` en `@font-face` | `auto`: comportamiento impredecible |
| Esperar una fuente concreta | `await document.fonts.load("700 18px Lora")` | El grosor pedido debe coincidir con el del texto |
| Saber si las fuentes en curso están listas | `await document.fonts.ready` | Ya resuelta si aún no se ha pedido nada |
| Reaccionar a cada lote de fuentes | `loadingdone`, `loadingerror` | Una promesa ya obtenida solo se dispara una vez |
| Medir un texto | `measureText`, `getBoundingClientRect`, `getComputedTextLength` | Mide la fuente de respaldo si la fuente web no ha llegado |
| Cargar una fuente desde el script | `new FontFace(...)`, `cara.load()`, `document.fonts.add(cara)` | Capturar el fallo: la fuente de respaldo se queda |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Escribir el código dos veces, con `mousedown` y `touchstart` | Código doble, comportamientos distintos, eventos de compatibilidad que se superponen | `pointerdown`, `pointermove`, `pointerup` |
| No escuchar `pointercancel` | El arrastre se queda bloqueado cuando el navegador retoma el control | Deshacer el estado en `pointerup` **y** `pointercancel` |
| Olvidar `touch-action` | En el teléfono, el dedo desplaza la página: `pointercancel` tras unos píxeles | `touch-action: none` (o `pan-y`, `pan-x`) en el elemento que se arrastra |
| `touch-action: none` en zonas grandes | La página ya no se desplaza al tocarla | Reservarlo al elemento que se arrastra |
| Contar con `preventDefault()` para el desplazamiento | La decisión se toma antes de los eventos `pointermove` | `touch-action` en CSS |
| No capturar el puntero con el ratón | Un movimiento rápido sale del elemento, el arrastre se interrumpe | `setPointerCapture(evento.pointerId)` en `pointerdown` |
| Capturar un puntero que ya no está activo | El navegador lanza un error | Capturar durante el `pointerdown` |
| Conservar la captura tras una anulación con Esc | El dedo sigue apoyado: el elemento sigue recibiendo el gesto | `releasePointerCapture` |
| Esperar `pointerleave` o `pointerenter` en otros elementos durante una captura | No se disparan para los demás elementos | `document.elementsFromPoint(x, y)` |
| Reaccionar a un solo puntero sin comprobar `pointerId` | Un segundo dedo, o el sobrevuelo del ratón, perturba el arrastre | Retener `pointerId` e ignorar los demás |
| Comprobar `pointerType === "mouse"` como regla general | Un teléfono no tiene ratón; un ordenador táctil tiene ambos | Razonar por capacidad (`matchMedia("(hover: hover)")`) |
| Prever un sobrevuelo sin equivalente al tacto | Un dedo no tiene sobrevuelo | Un equivalente con la pulsación o el teclado |
| Reservar el arrastre al puntero | Una persona que solo usa el teclado queda excluida | Un equivalente con el teclado |
| `pointer-events: none` para «desactivar» un botón | El teclado sigue activándolo | El atributo `disabled` |
| Medir un texto antes de la fuente | Anchura de la fuente de respaldo | `await document.fonts.load(...)`, y luego medir |
| Fiarse de `document.fonts.ready` llamado muy pronto | Ya resuelta si aún no se ha pedido ninguna fuente | `document.fonts.load("700 18px Lora")` |
| Creer que un nombre de fuente incorrecto produce un error | Ningún mensaje: `load()` devuelve un arreglo vacío, `check()` responde `true` | Comprobar `caras.length` y la correspondencia con `@font-face` |
| No proteger `await document.fonts.load()` | Un fallo de descarga interrumpe la función antes de la medición | `try` / `catch`, y luego medir de todos modos |
| No pedir el grosor adecuado | `load("16px Lora")` no carga la negrita | El mismo grosor, estilo y tamaño que el texto |
| Dibujar un canvas una sola vez | La imagen nunca se actualiza: el texto se queda con la fuente de respaldo | Esperar la fuente, volver a dibujar en `loadingdone` |
| Dejar `font-display: auto` | Texto invisible o saltos de maquetación impredecibles | `swap` para el texto corriente; `optional` para una fuente de confort |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Usar los eventos de puntero para todo gesto (arrastrar, dibujar, pellizcar) | Un solo código para ratón, dedo y lápiz digital |
| Mantener `click` para activar un botón o un enlace | El teclado y los lectores de pantalla también lo activan |
| Capturar el puntero desde `pointerdown` para un arrastre | El seguimiento continúa incluso fuera del elemento |
| Deshacer el estado del arrastre en una función única llamada por `pointerup`, `pointercancel` y Esc | Ningún camino deja la interfaz bloqueada |
| Retener el `pointerId` del arrastre e ignorar los demás | Un solo gesto a la vez, sin interferencias |
| Poner `touch-action` en CSS desde la creación del elemento | El navegador lee el valor al inicio del gesto |
| Añadir una alternativa con el teclado a todo arrastre | Accesibilidad: un gesto de puntero no está al alcance de todos |
| Usar `pointer-events: none` para los adornos superpuestos, `disabled` para los botones inactivos | Los clics atraviesan el adorno; el teclado queda bien desactivado en el botón |
| Elegir `font-display` explícitamente, `swap` para el texto corriente | Sin texto invisible, sin comportamiento del navegador que adivinar |
| Pedir la fuente precisa con `document.fonts.load("grosor tamaño familia")` antes de medir | La promesa se refiere a la fuente deseada, no solo a lo que ya está en curso |
| Proteger la espera con `try` / `catch` y medir de todos modos | La fuente de respaldo mostrada también es medible |
| Medir lo que se muestra, nunca lo que se desearía mostrar | La medición corresponde a la pantalla |
| Volver a dibujar un canvas en `loadingdone` | El canvas no se actualiza solo |
| Preferir `ResizeObserver` para un elemento HTML cuyo tamaño debe seguir a su texto | Cubre todas las causas de cambio, incluidas las fuentes |
| Probar con la fuente bloqueada o lenta (red limitada en las herramientas de desarrollo) | El salto de maquetación solo aparece con una conexión lenta |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Los eventos de puntero (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`) agrupan ratón, dedo y lápiz digital: `pointerType` (`mouse`, `touch`, `pen`), `pointerId` (uno por dedo), `isPrimary`, `clientX` y `clientY`, `pressure`. `setPointerCapture` hace seguir todo el gesto a un elemento, incluso fuera de sus bordes, y se devuelve sola al final; `touch-action` (`none`, `pan-y`, `pan-x`) deja que el script, y no el navegador, gestione el gesto táctil; `pointer-events: none` vuelve un elemento transparente a los clics. Una fuente web llega después de la primera visualización: el texto cambia entonces de anchura. `font-display` regula lo que se muestra durante la espera; `document.fonts.ready` espera las fuentes en curso, `document.fonts.load("grosor tamaño familia")` pide una y la espera, `check` consulta sin cargar, `FontFace` y `document.fonts.add` cargan desde JavaScript, `loadingdone` avisa en cada lote. `measureText`, `getBoundingClientRect` y `getComputedTextLength` miden la fuente mostrada en este instante: se espera la fuente antes de medir o de dibujar. |
| **Trampas a evitar** | `pointercancel` sin escuchar; `touch-action` olvidado (el dedo desplaza la página); `preventDefault()` tomado por un remedio contra el desplazamiento; `pointerleave` esperado durante una captura; captura no devuelta tras Esc; `pointerType === "mouse"` supuesto; arrastre reservado al puntero; `pointer-events: none` para desactivar un botón; medición antes de la fuente; `ready` llamado demasiado pronto; nombre de fuente incorrecto sin error; fallo de carga no gestionado; grosor equivocado pedido; canvas dibujado una sola vez. |
| **Buenas prácticas** | Un solo código para todos los punteros; `click` para activar, `pointerdown` para arrastrar; captura en `pointerdown`, estado deshecho en `pointerup`, `pointercancel` y Esc; `touch-action` puesto en CSS; alternativa con el teclado; `font-display: swap` para el texto corriente; `document.fonts.load` preciso seguido de `try` / `catch` antes de toda medición; medir lo que se muestra; redibujar un canvas en `loadingdone`; `ResizeObserver` para un elemento HTML. |
