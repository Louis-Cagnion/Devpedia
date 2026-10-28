---
order: 9
---

# El SVG escrito directamente en la página

Un **SVG** (*Scalable Vector Graphics*, «gráfico vectorial redimensionable») es una imagen que se **describe con formas** (un rectángulo aquí, un círculo allí, una línea entre dos puntos) en lugar de fabricarla con puntos de color. El navegador (el programa que muestra las páginas web) vuelve a dibujar esas formas al tamaño deseado: la imagen se mantiene nítida, desde el icono minúsculo hasta el cartel gigante. Este capítulo muestra cómo escribir un SVG **en el código de la página**, dibujarlo con las formas básicas, colocar texto en él, animarlo, hacerlo accesible y reaccionar a los clics.

Supone conocidos [las etiquetas y los atributos HTML](/?c=langages&s=html&p=structure-dun-document) (una etiqueta es una palabra entre `<` y `>` que crea un elemento; un atributo es un ajuste escrito en la etiqueta de apertura, con la forma `nombre="valor"`), [la sintaxis de una regla CSS](/?c=langages&s=css&p=selecteurs) y, para los ejemplos en JavaScript, [el DOM y los eventos](/?c=langages&s=javascript&p=dom-et-evenements), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) y [las funciones](/?c=langages&s=javascript&p=fonctions).

## Imagen vectorial o imagen en píxeles

Un **píxel** es el punto más pequeño de una pantalla. Una imagen JPEG o PNG (dos formatos de archivo de imagen; se habla de imagen **matricial**) memoriza el color de cada píxel: ampliada, se vuelve borrosa o aparece en escalones. Una imagen **vectorial** memoriza instrucciones de dibujo: ampliada, el navegador recalcula el dibujo, que sigue nítido.

| | Imagen matricial (PNG, JPEG) | Imagen vectorial (SVG) |
|---|---|---|
| Lo que se almacena | El color de cada píxel | Formas y sus coordenadas |
| Ampliada | Borrosa | Nítida |
| Peso | Crece con el número de píxeles | Crece con el número de formas |
| Ideal para | Fotografías, texturas | Iconos, logotipos, esquemas, gráficos |
| Modificable con CSS o JavaScript | No | Sí (si el SVG está en la página) |

Un SVG puede llegar a la página de varias maneras:

| Método | Escritura | Lo que la página puede hacer con él |
|---|---|---|
| Archivo cargado por `<img>` | `<img src="logo.svg" alt="Logo">` (ver [las imágenes](/?c=langages&s=html&p=liens-et-images)) | Ni estilo ni script desde la página; el navegador lo guarda en **caché** (una copia conservada para no volver a descargarlo) |
| Imagen de fondo CSS | `background-image: url(logo.svg)` | Lo mismo: una imagen fija |
| **Escrito en la página** | Una etiqueta `<svg>` en el HTML | Cada forma es un elemento del [DOM](/?c=langages&s=javascript&p=dom-et-evenements): estilizable en CSS, modificable en JavaScript, animable, con un texto legible por un [lector de pantalla](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier) |
| `<canvas>` | Ver [Canvas 2D](/?c=langages&s=javascript&p=canvas-2d-et-animations) | Un dibujo en píxeles: más rápido para miles de elementos, pero ninguna forma existe ya una vez dibujada |

Escribir el SVG en la página también evita una **petición** (una solicitud de archivo enviada al servidor, ver [la API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). El precio: el código de la imagen engorda el HTML y no se guarda en caché por separado. Por eso conviene reservarlo para los iconos, esquemas y gráficos que la página debe estilizar, animar o leer por script.

## Un primer SVG

```html
<!-- width y height: el tamaño de visualización, en píxeles (200 de ancho, 100 de alto) -->
<!-- viewBox: el espacio de dibujo interno (explicado en la sección siguiente) -->
<svg width="200" height="100" viewBox="0 0 200 100">
    <!-- rect: un rectángulo; x e y: su esquina superior izquierda; fill: su color -->
    <rect x="0" y="0" width="200" height="100" fill="#e8eefc"/>
    <!-- circle: un círculo; cx y cy: su centro; r: su radio (mitad del diámetro) -->
    <circle cx="100" cy="50" r="30" fill="#1a4fd6"/>
</svg>
```

El rectángulo cubre toda la superficie (de 0 a 200 de ancho, de 0 a 100 de alto) en azul muy claro; el disco azul oscuro está centrado en el punto (100, 50), así que ocupa de 70 a 130 en anchura y de 20 a 80 en altura. La `/>` al final de una etiqueta la cierra sobre sí misma, como con `<img>`, puesto que una forma no tiene contenido.

Dentro de una página HTML no hace falta ningún ajuste adicional. Un archivo `.svg` autónomo exige en cambio el atributo `xmlns="http://www.w3.org/2000/svg"` en `<svg>` (una dirección que nombra el vocabulario SVG), explicado en [las trampas](#las-trampas).

## `viewBox`: el sistema de coordenadas

Para colocar una forma hace falta un sistema de referencia. El del SVG parte de la **esquina superior izquierda**, en el punto (0, 0). La coordenada `x` crece hacia la derecha, y la coordenada `y` crece **hacia abajo** (al contrario que en una gráfica matemática).

```
(0,0) ---------- x crece hacia la derecha --------->
  |
  |        (70,20)          (130,20)
  |           +-----------------+
  |           |                 |       cuadrado que contiene
  y crece     |     (100,50)    |       el círculo: su centro
  hacia       |                 |       está en (100,50)
  abajo       +-----------------+
  |        (70,80)          (130,80)
  v
```

El atributo `viewBox` configura este espacio de dibujo. Contiene cuatro números: `min-x min-y ancho alto`, es decir, la esquina superior izquierda de la zona visible y después sus dimensiones, en **unidades de usuario** (las unidades propias del dibujo, sin relación fija con los píxeles). El navegador estira este espacio para que llene el tamaño de visualización `width` × `height`. Este estiramiento se llama **escalado**.

```html
<!-- Mismo dibujo (círculo de radio 20 centrado en 50,25) en un espacio de 100 x 50 -->
<!-- Mostrado en 100 x 50 píxeles: una unidad = 1 píxel (escala 1) -->
<svg width="100" height="50" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>

<!-- Mostrado en 400 x 200 píxeles: escala 4, el mismo dibujo, nítido -->
<svg width="400" height="200" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>
```

| `viewBox` | `width` × `height` | Escala | Consecuencia |
|---|---|---|---|
| `0 0 100 50` | 100 × 50 | 1 | 1 unidad = 1 píxel |
| `0 0 100 50` | 400 × 200 | 4 | El dibujo se amplía 4 veces, sin pérdida de nitidez |
| `0 0 200 100` | 100 × 50 | 0,5 | El dibujo se reduce a la mitad |
| Ausente | 100 × 50 | 1, fija | Ningún escalado: el SVG ya no se adapta a otro tamaño |
| `10 10 50 50` | 100 × 100 | 2 | Solo se ve el cuadrado de 50 × 50 que empieza en (10, 10): el resto del dibujo queda cortado |

Si las proporciones del `viewBox` y de `width` × `height` difieren, el atributo `preserveAspectRatio` decide qué pasa después. Su valor por defecto (`xMidYMid meet`) mantiene las proporciones del dibujo y lo centra en la zona, aunque deje franjas vacías; la lista de valores está en la [página de MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio).

Para que un SVG se adapte a su contenedor (pantalla de teléfono o de ordenador, ver [el diseño adaptable](/?c=langages&s=css&p=responsive-et-media-queries)), se conserva el `viewBox` y se ajusta el tamaño en CSS:

```css
.esquema {
    width: 100%;        /* ocupa todo el ancho de su contenedor */
    max-width: 400px;   /* sin superar los 400 píxeles */
    height: auto;       /* la altura sigue las proporciones del viewBox */
}
```

## Las formas básicas

```html
<!-- viewBox 0 0 400 200: un espacio de dibujo de 400 unidades por 200 -->
<svg viewBox="0 0 400 200" width="400" height="200">
    <!-- rect: esquina (10,10), 80 de ancho, 60 de alto; rx: esquinas redondeadas de 8 -->
    <rect x="10" y="10" width="80" height="60" rx="8" fill="#1a4fd6"/>
    <!-- circle: centro (140,40), radio 30: va de x=110 a x=170 -->
    <circle cx="140" cy="40" r="30" fill="#c0392b"/>
    <!-- ellipse: un círculo aplastado; rx: radio horizontal 45; ry: radio vertical 25 -->
    <ellipse cx="230" cy="40" rx="45" ry="25" fill="#2e8b57"/>
    <!-- line: segmento de (300,10) a (380,70); stroke: color del trazo -->
    <!-- sin stroke, una línea es invisible; stroke-width: grosor del trazo -->
    <line x1="300" y1="10" x2="380" y2="70" stroke="#333" stroke-width="4"/>
    <!-- polyline: segmentos que unen los puntos listados, sin cerrar la forma -->
    <!-- fill="none": sin relleno, solo el trazo -->
    <polyline points="10,150 40,100 70,150 100,100 130,150"
              fill="none" stroke="#1a4fd6" stroke-width="4"/>
    <!-- polygon: como polyline, pero el último punto se une con el primero -->
    <polygon points="170,150 200,100 230,150" fill="#e0a800"/>
</svg>
```

| Forma | Atributos principales | Lo que regulan |
|---|---|---|
| `rect` | `x`, `y`, `width`, `height`, `rx`, `ry` | Esquina superior izquierda, dimensiones, redondeo de las esquinas |
| `circle` | `cx`, `cy`, `r` | Centro y radio |
| `ellipse` | `cx`, `cy`, `rx`, `ry` | Centro, radio horizontal, radio vertical |
| `line` | `x1`, `y1`, `x2`, `y2` | Punto de inicio y punto de llegada |
| `polyline` | `points` | Lista de puntos `x,y` unidos por segmentos, forma abierta |
| `polygon` | `points` | Lista de puntos `x,y` unidos, forma cerrada automáticamente |
| `path` | `d` | Un trazado cualquiera, descrito por comandos (sección siguiente) |

En `points`, cada punto se escribe `x,y` y los puntos se separan con espacios. El triángulo del ejemplo tiene sus vértices en (170, 150), (200, 100) y (230, 150).

## Rellenar y contornear: `fill` y `stroke`

Toda forma se dibuja con un **relleno** (el interior, regulado por `fill`) y un **contorno** (el trazo que sigue el borde, regulado por `stroke`). Por defecto, el relleno es **negro** y no hay **ningún contorno**: por eso una `line` sin `stroke` sigue siendo invisible (no tiene interior que rellenar). El contorno se centra sobre el borde: la mitad de su grosor sobresale hacia fuera, la otra mitad entra hacia dentro.

Estos ajustes son **atributos de presentación**: atributos cuyo nombre es el de una propiedad CSS, escritos directamente en la etiqueta.

| Atributo | Función | Valor por defecto | Ejemplo |
|---|---|---|---|
| `fill` | Color del interior (`none`: sin relleno) | Negro | `fill="#1a4fd6"` |
| `stroke` | Color del contorno | Ninguno | `stroke="#333"` |
| `stroke-width` | Grosor del contorno, en unidades de usuario | `1` | `stroke-width="4"` |
| `stroke-linecap` | Forma de los extremos de un trazo: `butt` (corte recto), `round` (redondeado), `square` (cuadrado) | `butt` | `stroke-linecap="round"` |
| `stroke-linejoin` | Forma de las esquinas entre dos segmentos: `miter` (puntiagudo), `round`, `bevel` (cortado) | `miter` | `stroke-linejoin="round"` |
| `stroke-dasharray` | Trazo discontinuo: longitudes alternas de trazo y de vacío | Trazo continuo | `stroke-dasharray="10 5"`: 10 de trazo, 5 de vacío |
| `stroke-dashoffset` | Desplazamiento del inicio de los trazos discontinuos | `0` | `stroke-dashoffset="5"` |
| `opacity` | Transparencia de toda la forma, de `0` (invisible) a `1` | `1` | `opacity="0.5"` |
| `fill-opacity` | Transparencia solo del relleno | `1` | `fill-opacity="0.3"` |

Los colores se escriben como en CSS: nombre (`red`), código hexadecimal (`#1a4fd6`: el `#` seguido de tres pares de cifras en base 16, para la cantidad de rojo, de verde y de azul) o `rgb(...)`. `stroke-dasharray` y `stroke-dashoffset` sirven también para fabricar un anillo de progreso, como se menciona en el [capítulo sobre los degradados](/?c=langages&s=css&p=degrades); un ejemplo animado se muestra más abajo.

## `path`: dibujar cualquier trazado

Las formas básicas no bastan para un icono o un logotipo. `<path>` traza una forma cualquiera a partir del atributo `d` (de *data*, «datos»), una sucesión de **comandos**: una letra seguida de números. Se puede imaginar como un lápiz: el comando `M` lo apoya, los demás lo hacen avanzar.

| Comando | Nombre | Números esperados | Efecto |
|---|---|---|---|
| `M` | *Move to* (ir a) | `x y` | Levanta el lápiz y lo apoya en (x, y), sin trazar. Empieza todo trazado |
| `L` | *Line to* (línea hacia) | `x y` | Traza un segmento recto hasta (x, y) |
| `H` | *Horizontal line to* | `x` | Segmento horizontal hasta la abscisa `x` (`y` sin cambios) |
| `V` | *Vertical line to* | `y` | Segmento vertical hasta la ordenada `y` (`x` sin cambios) |
| `C` | *Curve to* (curva hacia) | `x1 y1 x2 y2 x y` | Curva de Bézier cúbica: parte del punto actual, termina en (x, y), guiada por dos puntos de control (x1, y1) y (x2, y2) |
| `Z` | *Close path* (cerrar) | ninguno | Traza un segmento recto hasta el punto de inicio del trazado y lo cierra |

Una **curva de Bézier** es una curva flexible definida por sus dos extremos y por unos **puntos de control**: la curva se lanza hacia cada punto de control, sin atravesarlo nunca, como un hilo tenso que dos imanes atraen. Existen otros comandos (`Q`, `S`, `T` para otras curvas, `A` para un arco de elipse), listados en la [página de MDN del trazado](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d).

Un comando en **mayúscula** usa coordenadas **absolutas** (posición en el `viewBox`), y en **minúscula** coordenadas **relativas** (desplazamiento desde el punto actual): `L 50 10` va al punto (50, 10), `l 50 10` avanza 50 hacia la derecha y 10 hacia abajo.

```html
<svg viewBox="0 0 300 100" width="300" height="100">
    <!-- M: lápiz en (10,90); L: hacia (50,10) y luego (90,90); Z: vuelta a (10,90) -->
    <path d="M 10 90 L 50 10 L 90 90 Z" fill="#1a4fd6"/>
    <!-- C: de (120,90) a (200,90), guiada por (140,10) y (180,10) -->
    <!-- fill="none": sin relleno; stroke: el color del trazo -->
    <path d="M 120 90 C 140 10, 180 10, 200 90"
          fill="none" stroke="#c0392b" stroke-width="4"/>
    <!-- h, v en minúscula: relativo; 50 a la derecha, 50 abajo, 50 a la izquierda, z -->
    <path d="M 230 20 h 50 v 50 h -50 z"
          fill="none" stroke="#2e8b57" stroke-width="4"/>
</svg>
```

El primer trazado es un triángulo lleno de vértices (10, 90), (50, 10) y (90, 90). El segundo es un arco: parte de (120, 90), sube y vuelve a bajar en (200, 90), siendo su punto más alto el situado en (160, 30). El tercero es el contorno de un cuadrado de 50 de lado cuya esquina superior izquierda está en (230, 20): `h 50` lleva a (280, 20), `v 50` a (280, 70), `h -50` a (230, 70), y `z` lo cierra.

Escribir una `d` a mano solo es útil para trazados sencillos. Para un icono, se copia desde un programa de dibujo vectorial (que exporta un archivo `.svg`, que se abre en un editor para copiar sus etiquetas).

## `<g>` y las transformaciones

`<g>` (de *group*, «grupo») reúne varias formas sin dibujar nada por sí mismo. Los atributos de presentación puestos en el grupo son **heredados** por sus hijos, salvo que un hijo los redefina.

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- g: fill y stroke puestos aquí valen para los tres círculos -->
    <g fill="#1a4fd6" stroke="#0b2a7a" stroke-width="3">
        <circle cx="40" cy="50" r="20"/>
        <circle cx="100" cy="50" r="20"/>
        <!-- Este hijo redefine fill: es rojo, pero conserva el contorno heredado -->
        <circle cx="160" cy="50" r="20" fill="#c0392b"/>
    </g>
</svg>
```

El atributo `transform` desplaza, gira o agranda un grupo entero de una vez:

| Transformación | Escritura | Efecto |
|---|---|---|
| Desplazar | `translate(tx ty)` | Desplaza `tx` hacia la derecha y `ty` hacia abajo |
| Girar | `rotate(angulo)` o `rotate(angulo cx cy)` | Gira `angulo` **grados** (una vuelta completa = 360) en el sentido de las agujas del reloj, alrededor del punto (0, 0) o del punto (cx, cy) |
| Agrandar | `scale(s)` o `scale(sx sy)` | Multiplica las dimensiones (`1`: sin cambios, `0.5`: la mitad) |
| Inclinar | `skewX(angulo)`, `skewY(angulo)` | Inclina el dibujo horizontal o verticalmente |

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- translate(100 50): el origen (0,0) del grupo se encuentra en el punto (100,50) -->
    <!-- rotate(45): luego todo se gira 45 grados alrededor de este nuevo origen -->
    <g transform="translate(100 50) rotate(45)">
        <!-- Cuadrado de 40 de lado centrado en el origen del grupo (x e y valen -20) -->
        <rect x="-20" y="-20" width="40" height="40" fill="#1a4fd6"/>
    </g>
</svg>
```

El cuadrado está centrado en (100, 50) y, una vez girado 45 grados, se presenta como un rombo cuyas puntas están a unas 28 unidades del centro (la mitad de la diagonal, es decir, 20 × √2). Varias transformaciones se suceden en un mismo atributo, y **el orden importa**: cada una se aplica en el sistema de referencia ya desplazado por las anteriores, de modo que `translate(100 50) rotate(45)` (girar en el sitio, en el punto (100, 50)) no es `rotate(45) translate(100 50)` (desplazarse a lo largo de un eje ya girado).

## El estilo: atributos, CSS, `currentColor` y variables

Una forma SVG se da estilo de tres maneras. Se combinan, y la más prioritaria gana (ver [la cascada](/?c=langages&s=css&p=variables-et-cascade): el orden de las reglas que se contradicen).

| Manera | Ejemplo | Prioridad |
|---|---|---|
| Atributo de presentación | `<circle fill="red">` | La más débil: cualquier regla CSS la reemplaza |
| Regla CSS de una hoja de estilo | `.sector { fill: blue; }` | Media |
| Atributo `style` de la etiqueta | `<circle style="fill: green">` | La más fuerte |

Si un `<circle class="sector" fill="red">` encuentra la regla `.sector { fill: blue; }`, el círculo es, por tanto, azul. El CSS es el lugar adecuado para los colores que cambian (paso del puntero, tema), los atributos para el dibujo en sí. Las formas de un SVG escrito en la página reciben un estilo como cualquier elemento, incluidas las [pseudoclases](/?c=langages&s=css&p=selecteurs) como `:hover` (el puntero está encima). Las propiedades, en cambio, cambian de nombre:

| En HTML | Para una forma SVG | Observación |
|---|---|---|
| `background-color` | `fill` | El fondo de una forma es su relleno |
| `color` (texto) | `fill` | El color de un `<text>` SVG es su `fill`, no `color` |
| `border-color`, `border-width` | `stroke`, `stroke-width` | El contorno de una forma es un `stroke` |
| `margin`, `padding` | Ningún equivalente | Una forma se coloca por sus coordenadas |
| `z-index` | Ningún equivalente | El orden en el código decide (ver [las trampas](#las-trampas)) |

Dos herramientas relacionan la imagen con el resto de la página:

- **`currentColor`** es una palabra clave que significa «el valor actual de la propiedad CSS `color` del elemento». Escribir `fill="currentColor"` hace que el icono siga el color del texto que lo rodea.
- Una **variable CSS** (ver [las variables](/?c=langages&s=css&p=variables-et-cascade)) se lee en un SVG escrito en la página, como en el resto del documento: `fill: var(--color-primario)`. Un SVG cargado por `<img>` no tiene acceso a ella.

```css
:root {
    --color-primario: #1a4fd6;         /* variable declarada una vez para toda la página */
}

.boton-icono {
    color: var(--color-primario);      /* color del texto del botón, y por tanto del icono */
}

.boton-icono:hover {
    color: #c0392b;                    /* al pasar el puntero, texto e icono pasan a rojo */
}

.boton-icono svg {
    width: 24px;                       /* el icono se muestra en 24 x 24 píxeles */
    height: 24px;
}
```

```html
<button class="boton-icono">
    <!-- aria-hidden="true": oculta el icono a los lectores de pantalla (ver más abajo) -->
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <!-- Triángulo de vértices (12,3), (21,20), (3,20) -->
        <!-- fill="currentColor": el relleno toma el color del texto -->
        <path d="M 12 3 L 21 20 L 3 20 Z" fill="currentColor"/>
    </svg>
    Alerta
</button>
```

El [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) cambia de color al pasar el puntero, y su icono con él, sin que ninguna regla apunte al SVG.

## `<text>`: escribir en una imagen

`<text>` muestra un texto en unas **coordenadas**. Su punto de referencia (x, y) no es la esquina superior izquierda, sino el inicio de la **línea de base**: la línea imaginaria sobre la que descansan las letras (las colas de la «g» o de la «p» bajan por debajo).

```html
<svg viewBox="0 0 300 120" width="300" height="120">
    <!-- Referencia: línea vertical discontinua (4 de trazo, 4 de vacío) en x = 150 -->
    <line x1="150" y1="0" x2="150" y2="120" stroke="#999" stroke-dasharray="4 4"/>
    <!-- text-anchor: de qué lado del punto x se extiende el texto -->
    <!-- font-size: tamaño de las letras -->
    <text x="150" y="30" font-size="18" text-anchor="start">inicio</text>
    <text x="150" y="60" font-size="18" text-anchor="middle">medio</text>
    <text x="150" y="90" font-size="18" text-anchor="end">final</text>
</svg>
```

Las tres palabras tienen su línea de base a las alturas 30, 60 y 90. «inicio» empieza en x = 150 y se extiende hacia la derecha, «medio» está centrado en x = 150, «final» termina en x = 150.

| Atributo | Valores | Efecto |
|---|---|---|
| `text-anchor` | `start` (por defecto), `middle`, `end` | Posición **horizontal** del texto con respecto a `x` |
| `dominant-baseline` | `auto` (por defecto), `middle`, `central`, `hanging` | Posición **vertical** del texto con respecto a `y` |
| `font-size`, `font-family`, `font-weight` | Como en CSS | Tamaño, tipografía, grosor, en atributo o en CSS |

Para `dominant-baseline`, `auto` alinea la parte inferior de las letras sin cola con `y`, `middle` alinea `y` con el centro de la altura de las minúsculas, `central` con el centro de la línea entera, y `hanging` alinea la parte superior del texto con `y`. `dominant-baseline="central"` con `text-anchor="middle"` sirve para centrar un texto en un círculo; como la diferencia exacta entre `middle` y `central` es sutil, se comprueba a simple vista en el navegador de destino.

El texto SVG **no** es texto HTML:

| | Texto HTML (`<p>`) | Texto SVG (`<text>`) |
|---|---|---|
| Salto de línea automático | Sí, según el ancho del contenedor | **No**: una sola línea, que se desborda o se corta |
| Posición | En el flujo de la página | En las coordenadas `x` e `y` |
| Color | `color` | `fill` |
| Fondo, borde, margen | Sí | No: hay que dibujar un `<rect>` detrás |
| Tamaño en pantalla | Independiente de la imagen | Escalado con el `viewBox`: un SVG reducido a la mitad muestra un texto reducido a la mitad |
| Seleccionable y buscable | Sí | Sí, si queda un `<text>` real |

Para escribir en varias líneas, se trocea a mano con `<tspan>`, un fragmento de texto dentro de `<text>` que se puede posicionar aparte:

```html
<svg viewBox="0 0 200 80" width="200" height="80">
    <text x="10" y="30" font-size="16">
        <!-- x="10" devuelve cada trozo al borde izquierdo; dy: desplazamiento vertical -->
        <tspan x="10">Primera línea</tspan>
        <!-- dy="1.2em": baja 1,2 veces el tamaño de la tipografía -->
        <tspan x="10" dy="1.2em">Segunda línea</tspan>
    </text>
</svg>
```

La unidad `em` vale el tamaño de la tipografía en curso (ver [las unidades relativas](/?c=langages&s=css&p=responsive-et-media-queries)): `1.2em` deja, pues, un interlineado proporcional al texto. Para saber si un texto cabe en el espacio disponible, `getComputedTextLength()` da su ancho en unidades de usuario; la idea es la misma que `measureText()` del [capítulo sobre el canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations), aplicada a un elemento SVG:

```javascript
// Localiza el texto y el rectángulo que debe servirle de fondo
const etiqueta = document.getElementById("etiqueta");
const fondo = document.getElementById("fondo-etiqueta");

// getComputedTextLength(): anchura real del texto mostrado, en unidades de usuario
const anchura = etiqueta.getComputedTextLength();
// El fondo mide la anchura del texto más 16 de margen (8 a cada lado)
fondo.setAttribute("width", anchura + 16);
```

## La animación

Como las formas son elementos del DOM, se aplican las tres grandes técnicas de animación de la web.

### En CSS: `transition` y `@keyframes`

Las nociones de [transición y de @keyframes](/?c=langages&s=css&p=animations-css-performantes) valen para las formas SVG. Las propiedades propias del SVG (`fill`, `stroke`, `stroke-dashoffset`...) se animan como las demás:

```css
.sector {
    fill: #1a4fd6;                       /* color de partida */
    transition: fill 0.2s ease-out;      /* animar fill durante 0,2 segundos, desacelerando */
}

.sector:hover {
    fill: #c0392b;                       /* al pasar el puntero, el relleno pasa al rojo */
}
```

Para un movimiento o un agrandamiento, se anima `transform`. En una forma **dentro** de un SVG, hay una trampa: el punto alrededor del cual la forma gira o crece (el **origen de la transformación**, `transform-origin`) es por defecto el origen (0, 0) del sistema de referencia de todo el SVG, no el centro de la forma. `transform-box: fill-box` hace que el origen se calcule sobre el **cuadro delimitador** de la forma (el rectángulo más pequeño que la contiene), y `transform-origin: center` lo sitúa en el centro de ese cuadro ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-box)).

```css
.pulsacion {
    transform-box: fill-box;             /* el origen se mide sobre el cuadro de la forma */
    transform-origin: center;            /* en el centro de ese cuadro */
    animation: latido 1.2s ease-in-out infinite;   /* nombre, duración, curva, repetición */
}

@keyframes latido {
    0%   { transform: scale(1); }        /* inicio: tamaño normal */
    50%  { transform: scale(1.3); }      /* a mitad del recorrido: 130 % */
    100% { transform: scale(1); }        /* fin: vuelta al tamaño normal */
}
```

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- La clase pulsacion aplica la animación: el disco crece y luego se encoge -->
    <circle class="pulsacion" cx="50" cy="50" r="20" fill="#c0392b"/>
</svg>
```

Un segundo uso clásico es el **anillo de progreso**. La **circunferencia** de un círculo mide 2 × π × r, donde π (≈ 3,14159) es la relación entre el perímetro de un círculo y su diámetro. Para r = 40, eso da unos 251,33. Se ajusta `stroke-dasharray` a ese valor (un trazo tan largo como el círculo, seguido de un vacío igual de largo) y `stroke-dashoffset` a la parte oculta: 251,33 oculta todo el anillo, `0` lo muestra entero.

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- Anillo de fondo, gris, completo -->
    <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" stroke-width="8"/>
    <!-- Anillo de progreso: rotate(-90 50 50) hace que el trazo parta de arriba -->
    <circle id="progreso" class="progreso" cx="50" cy="50" r="40" fill="none"
            stroke="#1a4fd6" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="251.33" stroke-dashoffset="251.33"
            transform="rotate(-90 50 50)"/>
</svg>
<button id="avanzar">Avanzar al 75 %</button>
```

```css
.progreso {
    transition: stroke-dashoffset 0.6s ease-out;   /* el trazo se despliega en 0,6 segundos */
}
```

```javascript
// Circunferencia del círculo de radio 40 (Math.PI vale π)
const CIRCUNFERENCIA = 2 * Math.PI * 40;
const progreso = document.getElementById("progreso");

// parte: un número entre 0 (nada) y 1 (todo); la parte oculta es el resto
function mostrarAvance(parte) {
    progreso.style.strokeDashoffset = CIRCUNFERENCIA * (1 - parte);
}

// Un clic en el botón llena el anillo hasta tres cuartos (el desplazamiento pasa a 62,83)
document.getElementById("avanzar").addEventListener("click", () => {
    mostrarAvance(0.75);
});
```

El anillo empieza vacío: al hacer clic, el valor de `stroke-dashoffset` pasa de 251,33 a unos 62,83 y la regla `transition` hace deslizar el trazo de uno a otro. La transición solo se pone en marcha si el valor cambia **después** de la primera visualización: por eso la llamada se coloca dentro de un clic.

### Con `<animate>` (SMIL)

**SMIL** (*Synchronized Multimedia Integration Language*) es un lenguaje de animación escrito directamente en las etiquetas del SVG: una etiqueta `<animate>` colocada dentro de la forma describe qué atributo varía, entre qué valores y durante cuánto tiempo.

```html
<svg viewBox="0 0 60 60" width="60" height="60">
    <circle cx="30" cy="30" r="10" fill="#1a4fd6">
        <!-- attributeName: el atributo a animar (el radio r) -->
        <!-- from y to: valores de inicio y de llegada; dur: duración de un recorrido -->
        <!-- repeatCount="indefinite": se repite sin fin -->
        <animate attributeName="r" from="10" to="25" dur="2s" repeatCount="indefinite"/>
    </circle>
</svg>
```

SMIL funciona sin CSS ni JavaScript, pero vive aparte: la [media query](/?c=langages&s=css&p=responsive-et-media-queries) `prefers-reduced-motion` (una condición que lee un ajuste del usuario, ver más abajo) no lo detiene. En un proyecto nuevo, se prefieren CSS y JavaScript.

### En JavaScript

Se crean y modifican las formas con las herramientas del [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (`getElementById`, `setAttribute`, `classList`...). Una sola diferencia: una forma SVG pertenece a otro **espacio de nombres** que el HTML. Un espacio de nombres XML (*XML namespace*) es un identificador, escrito en forma de dirección web, que indica a qué vocabulario pertenece una etiqueta (HTML o SVG). Para crear una forma, se usa, pues, `document.createElementNS` (el «NS» viene de *namespace*) con la dirección del SVG, y no `document.createElement`.

```html
<svg id="grafico" viewBox="0 0 300 100" width="300" height="100"></svg>
```

```javascript
// Dirección que identifica el vocabulario SVG (es un nombre, el navegador no la visita)
const ESPACIO_SVG = "http://www.w3.org/2000/svg";
const valores = [30, 80, 55];                       // la altura de cada barra
const grafico = document.getElementById("grafico");

// forEach llama a la función por cada valor del arreglo, con su rango (0, 1, 2)
valores.forEach((valor, rango) => {
    // createElementNS: crea una forma SVG real (createElement: elemento desconocido)
    const barra = document.createElementNS(ESPACIO_SVG, "rect");
    barra.setAttribute("x", rango * 100 + 20);      // barras en x = 20, 120 y 220
    barra.setAttribute("y", 100 - valor);           // borde superior (y crece hacia abajo)
    barra.setAttribute("width", 60);                // 60 unidades de ancho
    barra.setAttribute("height", valor);            // altura de la barra
    barra.setAttribute("fill", "#1a4fd6");          // color de relleno
    grafico.appendChild(barra);                     // la añade al SVG: aparece
});
```

El resultado son tres rectángulos de 60 de ancho, cuya parte inferior toca la línea y = 100 y cuya altura es 30, 80 y 55 (su borde superior está, por tanto, en y = 70, 20 y 45). Para una animación continua, se combinan estos cambios con `requestAnimationFrame`, presentado en el [capítulo sobre el canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations):

```javascript
const punto = document.getElementById("punto");       // un <circle id="punto"> del SVG
// matchMedia prueba una media query; .matches vale true si el ajuste está activado
const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function imagen(ahora) {                              // ahora: tiempo, en milisegundos
    // 1 unidad cada 20 ms; % (resto de la división) vuelve a 0 después de 260
    punto.setAttribute("cx", 20 + ((ahora / 20) % 260));
    requestAnimationFrame(imagen);                    // programa la imagen siguiente
}

if (!reducido) requestAnimationFrame(imagen);         // nada se mueve si se ha rechazado
```

El punto se desplaza entre x = 20 y x = 280 sobre un `viewBox` de 300 de ancho, salvo que el usuario haya pedido reducir las animaciones.

### Respetar `prefers-reduced-motion`

Algunas personas soportan mal el movimiento en pantalla (vértigo, náuseas): su sistema operativo ofrece un ajuste «reducir las animaciones», que el CSS lee con la media query `prefers-reduced-motion`, explicada en el [capítulo sobre las animaciones](/?c=langages&s=css&p=animations-css-performantes). El principio sigue siendo válido para un SVG:

```css
@media (prefers-reduced-motion: reduce) {
    .pulsacion {
        animation: none;            /* el disco permanece inmóvil */
    }

    .progreso {
        transition: none;           /* el anillo pasa a su nuevo valor de golpe */
    }
}
```

Para un SVG animado con `<animate>`, hay que detenerlo en JavaScript: el elemento `<svg>` posee un método `pauseAnimations()` que congela todas sus animaciones SMIL (`document.querySelector("svg").pauseAnimations()`).

## La accesibilidad

Un **lector de pantalla** lee la página en voz alta para las personas ciegas o con baja visión (ver [ARIA y lectores de pantalla](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). Una imagen no tiene ningún sentido para él sin texto: hay que decir lo que representa, o indicar que es decorativa. El navegador construye, en efecto, una lista simplificada de la página para estos programas, que solo contiene lo que el código le dice que ponga en ella.

| Situación | Solución | Ejemplo |
|---|---|---|
| Imagen que aporta información (gráfico, esquema) | `role="img"` + `<title>` + eventualmente `<desc>` + `aria-labelledby` | Ver el código más abajo |
| Imagen decorativa (adorno, icono junto a un texto ya explícito) | `aria-hidden="true"` | `<svg aria-hidden="true">` |
| Icono solo dentro de un botón | `aria-label` en el botón, `aria-hidden` en el icono | `<button aria-label="Cerrar">` |
| Dato complejo (gráfico con varias series) | Una [tabla HTML](/?c=langages&s=html&p=tableaux) equivalente, junto al SVG | Los valores legibles fila por fila |

- **`role="img"`** declara que todo el SVG es una imagen única: el lector de pantalla no anuncia sus formas una por una.
- **`<title>`** da el nombre corto de la imagen. Colocado como **primer hijo** de `<svg>`, también aparece como un pequeño recuadro de ayuda (una etiqueta que surge al pasar el puntero) en la mayoría de navegadores. **`<desc>`** (*description*, «descripción») da una explicación más larga.
- **`aria-labelledby`** (ver [ARIA](/?c=langages&s=html&p=attributs-data-et-accessibilite)) nombra el elemento a partir de otros elementos de la página, designados por su `id`. Vincular explícitamente el `<title>` al SVG es la práctica más segura, porque su soporte por sí solo no siempre ha sido homogéneo según los lectores de pantalla.

```html
<!-- role="img": una imagen única; aria-labelledby: su nombre viene de los elementos -->
<!-- cuyos id se listan: el título y la descripción -->
<svg role="img" aria-labelledby="titulo-ventas descripcion-ventas"
     viewBox="0 0 300 100" width="300" height="100">
    <!-- <title>: el nombre corto; el id permite a aria-labelledby encontrarlo -->
    <title id="titulo-ventas">Ventas por trimestre</title>
    <!-- <desc>: el detalle de los datos, para quien no ve las barras -->
    <desc id="descripcion-ventas">30 en el primer trimestre, 80 en el segundo,
        55 en el tercero.</desc>
    <rect x="20" y="70" width="60" height="30" fill="#1a4fd6"/>
    <rect x="120" y="20" width="60" height="80" fill="#1a4fd6"/>
    <rect x="220" y="45" width="60" height="55" fill="#1a4fd6"/>
</svg>
```

```html
<!-- Icono decorativo: aria-hidden="true" lo quita de lo que lee el lector de pantalla -->
<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#1a4fd6"/>
</svg>

<!-- Botón que solo contiene un icono: su nombre viene de aria-label -->
<button aria-label="Cerrar la ventana">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
        <path d="M 4 4 L 20 20 M 20 4 L 4 20" stroke="currentColor" stroke-width="3"/>
    </svg>
</button>
```

Queda la cuestión del texto. Un SVG puede contener **texto real** (`<text>`) o texto **dibujado** (las letras convertidas en trazados `path`, como en muchos logotipos exportados).

| | Texto real (`<text>`) | Texto convertido en trazados (`path`) |
|---|---|---|
| Seleccionable y buscable (Ctrl+F) | Sí | No |
| Leído por un lector de pantalla | Sí, salvo que el SVG sea `role="img"` (entonces solo se dice el `<title>`) | No: el `<title>` debe decirlo todo |
| Tipografía e idioma | Dependen de las tipografías instaladas | Fijados, resultado idéntico en todas partes |
| Traducible, modificable | Sí | No |

Un gráfico con `role="img"` oculta sus `<text>` internos a los lectores de pantalla: la información que llevan debe figurar entonces en el `<title>` o el `<desc>`, o en una tabla colocada al lado. Los colores obedecen a las reglas de [contraste](/?c=ui-ux&p=couleur-et-contraste), y una información nunca debe pasar solo por el color (ver [la accesibilidad en UX](/?c=ui-ux&p=accessibilite-ux)).

## La interacción: puntero y teclado

Una forma SVG escucha los eventos como cualquier elemento (`click`, `keydown`...). Los **eventos de puntero** (*pointer events*, entre ellos `pointerdown`, `pointermove`, `pointerenter`) reúnen ratón, dedo y lápiz bajo un mismo nombre: un solo código basta para todos los dispositivos ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

¿Qué partes de una forma reaccionan al puntero? La propiedad `pointer-events` lo regula: decide qué zonas de un elemento pueden ser el objetivo de un clic o de un paso por encima.

| Valor | Zona que reacciona | Caso de uso |
|---|---|---|
| `visiblePainted` (por defecto; el valor `auto` es equivalente) | Las partes **pintadas**: relleno si `fill` no es `none`, contorno si `stroke` no es `none` | Comportamiento normal |
| `all` | Todo el interior y el contorno, incluso sin relleno ni contorno | Zona pulsable en una forma transparente |
| `stroke` | Solo el contorno | Un medidor en el que solo reacciona el anillo |
| `none` | **Ninguna**: el clic atraviesa la forma y alcanza lo que hay debajo | Una leyenda o una capa decorativa puesta encima |

Una forma con `fill="none"` no es, por tanto, pulsable en su centro por defecto: el puntero la atraviesa. De ahí `pointer-events="all"` en el ejemplo siguiente.

Al teclado, una forma SVG **no** es alcanzable con la tecla Tab (ver [el foco y `tabindex`](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). `tabindex="0"` la hace enfocable, y hay que añadir un rol, un nombre y la reacción a las teclas Intro y Espacio, que el navegador solo proporciona a los botones de verdad.

```html
<svg id="escena" viewBox="0 0 200 100" width="400" height="200">
    <!-- tabindex="0": alcanzable con Tab; role="button" y aria-label: anuncia como botón -->
    <!-- pointer-events="all": todo el disco reacciona, aunque fill sea none -->
    <circle id="zona" class="zona" cx="100" cy="50" r="30" fill="none"
            stroke="#1a4fd6" stroke-width="4" pointer-events="all"
            tabindex="0" role="button" aria-label="Activar la zona"/>
    <!-- pointer-events="none": este punto sigue al puntero sin interceptar ningún clic -->
    <circle id="cursor" cx="0" cy="0" r="4" fill="#c0392b"
            pointer-events="none"/>
</svg>
```

```css
.zona.activa {
    fill: #e8eefc;                 /* estado «activado»: el interior se rellena */
}

.zona:focus-visible {
    stroke: #c0392b;               /* foco con el teclado: el contorno cambia de color */
    stroke-width: 6;               /* y se engrosa, para seguir bien visible */
}
```

```javascript
const escena = document.getElementById("escena");
const zona = document.getElementById("zona");
const cursor = document.getElementById("cursor");

// classList.toggle añade la clase «activa» si falta, la quita si está presente
function activar() {
    zona.classList.toggle("activa");
}

// click cubre el ratón y el dedo; keydown añade el teclado
zona.addEventListener("click", activar);
zona.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();        // impide que la página se desplace con Espacio
        activar();
    }
});

// pointermove: en cada desplazamiento del puntero sobre el SVG
escena.addEventListener("pointermove", (evento) => {
    // DOMPoint: un punto (x, y); clientX y clientY: posición del puntero en la ventana
    const pixel = new DOMPoint(evento.clientX, evento.clientY);
    // getScreenCTM(): la conversión de dibujo a píxeles; inverse(): de píxeles a dibujo
    const local = pixel.matrixTransform(escena.getScreenCTM().inverse());
    cursor.setAttribute("cx", local.x);     // coordenadas en el viewBox, no en píxeles
    cursor.setAttribute("cy", local.y);
});
```

El último bloque ilustra una sutileza ligada al `viewBox`: las coordenadas del puntero (`clientX`, `clientY`) están en píxeles de la ventana, mientras que `cx` y `cy` están en unidades de usuario. Un SVG mostrado en 400 × 200 con un `viewBox` de 200 × 100 duplica cada valor, de ahí la conversión mediante `getScreenCTM()`.

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Archivo `.svg` autónomo sin `xmlns="http://www.w3.org/2000/svg"` | Fuera de una página HTML, el archivo se lee como **XML** (un lenguaje de marcado parecido al HTML, pero más estricto) y el navegador no sabe que las etiquetas son SVG: la imagen no se muestra. Dentro de una página HTML, el atributo no hace falta |
| `viewBox` olvidada | El SVG conserva su tamaño fijo en píxeles y ya no se adapta a su contenedor. Poner siempre una `viewBox` y ajustar el tamaño en CSS |
| `id` repetido entre varios SVG de la página | Un `id` debe ser único en **toda** la página: las referencias como `fill="url(#degradado)"` o `aria-labelledby` apuntan entonces al primer elemento encontrado, a veces en otro SVG. Prefijar los `id` de cada SVG |
| Buscar un `z-index` | No existe en SVG: la forma escrita en **último** lugar en el código se dibuja encima de las demás. Reordenar el código, o en JavaScript `appendChild` sobre la forma ya presente la traslada al final |
| `width` y `height` en CSS y en atributos a la vez | La regla CSS prevalece sobre el atributo. Elegir un solo lugar (el CSS para un SVG adaptable) |
| `document.createElement("circle")` | Crea un elemento HTML desconocido, nunca dibujado. Usar `createElementNS` con la dirección del SVG |
| `className` en JavaScript sobre una forma SVG | En un elemento SVG devuelve un objeto y no el texto de las clases. Usar `classList` |
| `color`, `background`, `border`, `margin` sobre una forma | Sin efecto: usar `fill`, `stroke` y las coordenadas |
| `line` sin `stroke`, o `fill` olvidado | Una línea sin contorno es invisible, una forma sin `fill` es negra |
| `fill="none"` y clic en el centro de la forma | El puntero atraviesa la forma. Añadir `pointer-events="all"` |
| Texto esperado en varias líneas | `<text>` nunca corta por sí solo. Trocear con `<tspan>` o usar HTML alrededor del SVG |
| Texto ilegible en el móvil | Se encoge con el SVG. Prever un tamaño mínimo o adaptar el `viewBox` |
| Rotación o escala de una forma alrededor del punto equivocado | Por defecto, el origen es el punto (0, 0) del SVG. Añadir `transform-box: fill-box; transform-origin: center` |
| `<animate>` (SMIL) no detenido para `prefers-reduced-motion` | El CSS no tiene ningún efecto sobre él. Llamar a `pauseAnimations()` o no usarlo |
| SVG informativo sin `<title>`, o decorativo sin `aria-hidden` | El lector de pantalla no dice nada útil o lee formas sin sentido |
| Forma interactiva sin `tabindex`, `role` ni gestión de las teclas | Inutilizable con el teclado |

Así es como la unicidad de los `id` rompe un degradado. `<defs>` es una zona donde se declaran elementos reutilizables, que solo se dibujan cuando una forma los referencia; `url(#nombre)` designa el elemento de `id` «nombre»; `<linearGradient>` declara un degradado que pasa poco a poco de un color a otro (ver [los degradados CSS](/?c=langages&s=css&p=degrades) para la idea); cada `<stop>` fija el color (`stop-color`) en una posición (`offset`) entre 0 y 1.

```html
<!-- Primer SVG: un degradado de id «degradado», del azul al azul claro -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="degradado">
            <stop offset="0" stop-color="#1a4fd6"/>
            <stop offset="1" stop-color="#8fb0ff"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#degradado)"/>
</svg>

<!-- MAL: mismo id «degradado»: este rectángulo usará el primer degradado -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="degradado">
            <stop offset="0" stop-color="#c0392b"/>
            <stop offset="1" stop-color="#f5b7b1"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#degradado)"/>
</svg>
```

El segundo SVG debería ser rojo, pero su `fill="url(#degradado)"` designa el primer elemento de la página que lleva ese `id`, es decir, el degradado azul. La corrección consiste en renombrar los `id`: `degradado-azul` para uno, `degradado-rojo` para el otro.

Y he aquí el orden de dibujo:

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- Dibujado primero: azul, centrado en (80,50) -->
    <circle cx="80" cy="50" r="30" fill="#1a4fd6"/>
    <!-- Dibujado después: rojo, centrado en (120,50), cubre el azul de x = 90 a 110 -->
    <circle cx="120" cy="50" r="30" fill="#c0392b"/>
</svg>
```

Para que el círculo azul quede por encima, se mueve **después** del rojo en el código.

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Escribir siempre una `viewBox` y ajustar el tamaño en CSS | El SVG se adapta a su contenedor sin perder nitidez |
| Escribir en la página los SVG que hay que estilizar, animar o leer por script; usar `<img>` para una ilustración fija | Los primeros se benefician del CSS y de JavaScript, los segundos se guardan en caché |
| Usar `fill="currentColor"` y las variables CSS para los iconos | Un icono sigue el color del texto y el tema de la página |
| Poner los colores que cambian en el CSS, el dibujo en los atributos | El CSS prevalece, y el aspecto se modifica sin tocar el dibujo |
| Prefijar los `id` de cada SVG (`degradado-azul`, `titulo-ventas`) | Las referencias `url(#...)` y `aria-labelledby` nunca se cruzan |
| Animar `transform`, `opacity`, `fill`, `stroke-dashoffset` en lugar de atributos de geometría (`cx`, `width`) | Estas propiedades se animan en todas partes en CSS. Medir después, porque la aceleración gráfica depende del navegador para formas dentro de un SVG |
| Prever `prefers-reduced-motion` para cada animación, SMIL incluido | Respetar a las personas sensibles al movimiento |
| `role="img"` + `<title>` (+ `<desc>`) + `aria-labelledby` para una imagen informativa; `aria-hidden="true"` para una imagen decorativa | El lector de pantalla dice lo esencial o se calla |
| Completar un gráfico complejo con una tabla HTML | Los valores siguen siendo legibles para todos |
| Conservar texto `<text>` real en lugar de letras convertidas en trazados | Texto seleccionable, buscable y traducible |
| Hacer que una forma interactiva sea alcanzable con el teclado, con un foco visible | El mismo servicio para el ratón, el dedo y el teclado |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un SVG describe formas, no píxeles: se mantiene nítido a cualquier tamaño. Escrito en la página, cada forma es un elemento del DOM, estilizable en CSS, animable y controlable en JavaScript. El `viewBox` define el sistema de referencia (origen arriba a la izquierda, `y` hacia abajo) y el escalado. Las formas básicas son `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` y `path` (comandos `M`, `L`, `C`, `Z`). `<g>` agrupa y `transform` desplaza, gira o agranda. El color se regula con `fill` y `stroke`, `currentColor` sigue al texto. `<text>` se coloca por coordenadas, sin salto de línea automático. Un SVG informativo tiene `role="img"`, un `<title>` y un `aria-labelledby`; un SVG decorativo tiene `aria-hidden="true"`. |
| **Trampas a evitar** | `xmlns` olvidado en un archivo autónomo; `viewBox` olvidada; `id` repetido; buscar un `z-index` (decide el orden del código); `createElement` en lugar de `createElementNS`; `color` o `background` sobre una forma; `fill="none"` que deja pasar el clic; texto en varias líneas sin `<tspan>`; transformación alrededor del punto equivocado; SMIL que ignora `prefers-reduced-motion`; forma pulsable pero inutilizable con el teclado. |
| **Buenas prácticas** | `viewBox` más tamaño en CSS; `currentColor` y variables CSS; `id` prefijados; animar `transform`, `opacity`, `fill` o `stroke-dashoffset`; variante para `prefers-reduced-motion`; título y descripción para una imagen informativa, `aria-hidden` para un adorno; tabla HTML como complemento de un gráfico; texto real en lugar de texto convertido en trazados; `tabindex`, rol y teclas en toda forma interactiva. |
