---
order: 10
---

# Las unidades CSS y las funciones de tamaño: de `rem` a `clamp()` (28/10/2026)

Cada tamaño escrito en CSS (la anchura de una columna, el tamaño de un texto, el espacio entre dos bloques) es un **número seguido de una unidad**: en `16px`, 16 es el número y `px` la unidad. La elección de la unidad decide lo que ocurre con la página cuando cambia la pantalla, cuando el usuario **amplía** (agranda toda la página) o cuando ajusta **el tamaño de fuente de su navegador** (el programa que muestra las páginas web). Este capítulo explica cada unidad, las funciones que calculan un tamaño (`calc()`, `min()`, `max()`, `clamp()`), la trampa de `100vh` en el teléfono, y después lo que hay que hacer para que una página siga siendo utilizable cuando el texto se agranda al 200 % o al 300 %.

| Tema | Pregunta a la que responde | Sección |
|---|---|---|
| Las unidades | ¿A qué se refiere cada unidad (`px`, `em`, `rem`, `%`, `vw`, `ch`...)? | [Las unidades relativas](#las-unidades-relativas-a-que-se-refiere-cada-una) |
| `em` y `rem` | ¿Por qué se acumula `em`, y por qué `rem` respeta el ajuste del usuario? | [`em` y `rem`](#em-practico-pero-se-acumula) |
| Ventana en móvil | ¿Por qué `100vh` sobresale de la pantalla de un teléfono? | [Las unidades de ventana](#las-unidades-de-ventana-en-movil-el-problema-de-100vh) |
| Las funciones | ¿Cómo calcular, limitar o hacer fluido un tamaño? | [Las funciones de tamaño](#las-funciones-de-tamano-calc-min-max-y-clamp) |
| Ampliación | ¿Qué exige el WCAG y cómo hacer que una página resista al 200 % y al 300 %? | [Ampliar el texto](#ampliar-el-texto-al-200-y-al-300-lo-que-exige-el-wcag) |

Supone conocidos [la sintaxis de una regla CSS](/?c=langages&s=css&p=selecteurs) (un **selector** designa los elementos a los que se da estilo; después, los ajustes se escriben entre llaves con la forma `propiedad: valor;`), [el modelo de caja](/?c=langages&s=css&p=box-model) (`width`, `padding`, `margin`) y [las variables CSS](/?c=langages&s=css&p=variables-et-cascade) (`var(--nombre)` lee un valor declarado una sola vez). El capítulo sobre [el diseño adaptable y las media queries](/?c=langages&s=css&p=responsive-et-media-queries) presenta ya `px`, `%`, `em`, `rem`, `vw` y `vh` en pocas líneas: aquí se completa sin volver a explicarlos.

## Un valor CSS: un número y una unidad

```css
p {
    font-size: 16px;        /* font-size: el tamaño del texto; valor: 16 y la unidad px */
    margin-bottom: 1.5em;   /* margin-bottom: el espacio bajo el párrafo; unidad: em */
    width: 60%;             /* width: la anchura; % también es una unidad */
    line-height: 1.5;       /* line-height: la altura de una línea; aquí sin unidad */
}
```

Un **píxel** es el punto más pequeño de una pantalla. El **píxel CSS** (`px`) es la unidad de base del CSS: no es necesariamente un punto físico de la pantalla. En una pantalla muy fina, un píxel CSS se dibuja con varios puntos; y al ampliar, el navegador dibuja cada píxel CSS con todavía más puntos. En adelante, «píxel» designa siempre el píxel CSS, salvo mención en contrario.

Se distinguen dos familias de unidades:

| Familia | Definición | Ejemplos |
|---|---|---|
| **Absoluta** | Vale siempre la misma longitud, sea cual sea lo que la rodea | `px`, y para la impresión `cm`, `mm`, `in` (pulgada), `pt` (punto) |
| **Relativa** | Se calcula a partir de una **referencia**: el tamaño de una fuente, el del padre, el de la ventana | `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex`, `lh` |

Las unidades de impresión se relacionan con el píxel mediante factores fijos: 1 `in` = 96 `px`, luego 12 `pt` = 12 × 96 / 72 = 16 `px`. Una página web las usa raramente; la lista completa está en la [página de MDN sobre las longitudes](https://developer.mozilla.org/en-US/docs/Web/CSS/length).

## Las unidades relativas: a qué se refiere cada una

La **ventana de visualización** (*viewport*) es la zona de la página visible en el navegador, sin las barras ni los menús. La **raíz** es el elemento `<html>`, ancestro de todos los demás (ver [las etiquetas HTML](/?c=langages&s=html&p=structure-dun-document)); el CSS la designa con `:root` (ver [las variables](/?c=langages&s=css&p=variables-et-cascade)).

| Unidad | Se refiere a | Uso típico |
|---|---|---|
| `em` | El tamaño de fuente **del elemento** (para la propiedad `font-size` en sí: el del **padre**, es decir, el del elemento que lo contiene) | Espacios que siguen al tamaño del texto (`padding` de un botón) |
| `rem` | El tamaño de fuente de **la raíz** (« *root em* ») | Tamaños de fuente, espaciados generales |
| `%` | Depende de la propiedad (tabla siguiente) | Anchuras, tamaños relativos al padre |
| `vw` | El 1 % de la **anchura** de la ventana de visualización | Anchuras ligadas a la pantalla |
| `vh` | El 1 % de la **altura** de la ventana de visualización | Alturas ligadas a la pantalla (ver la sección sobre móvil) |
| `vmin` | El 1 % del **lado más pequeño** de la ventana | Un cuadrado que siempre cabe en la pantalla |
| `vmax` | El 1 % del **lado más grande** de la ventana | Un fondo que siempre cubre la pantalla |
| `ch` | La anchura del **dígito 0** en la fuente del elemento | Anchura de una línea de texto (`65ch`: unos 65 caracteres) |
| `ex` | La altura de la **x minúscula** de la fuente | Alinear un icono con las minúsculas (raro) |
| `lh` | La altura de **una línea** de texto del elemento (su valor de `line-height`) | Un espacio vertical igual a una línea |

El porcentaje no tiene una referencia única:

| Propiedad | `%` se calcula sobre | Ejemplo |
|---|---|---|
| `width` | La anchura del padre | `width: 50%`: la mitad del padre |
| `height` | La altura del padre, **solo si** está fijada explícitamente (si no, el valor se ignora y la altura queda automática) | `height: 100%` |
| `font-size` | El tamaño de fuente del padre | `font-size: 150%`: 1,5 veces el del padre |
| `padding`, `margin` | La **anchura** del padre, también para arriba y abajo | `padding-top: 10%` |

```css
.cuadrado {
    width: 50vmin;           /* 50 % del lado más pequeño de la ventana */
    height: 50vmin;          /* mismo valor: el bloque es, pues, un cuadrado */
}

.articulo {
    /* como máximo 65 anchuras de «0»: unos 65 caracteres por línea */
    max-width: 65ch;
    margin-bottom: 1lh;      /* un espacio igual a la altura de una línea de texto */
}
```

Sobre un teléfono cuya ventana mide 390 píxeles de anchura por 844 de altura (valores de ejemplo), el lado más pequeño es 390: `50vmin` vale 195 píxeles. Girado en **modo horizontal** (la pantalla es más ancha que alta: 844 de anchura, 390 de altura), el lado más pequeño sigue siendo 390: el cuadrado conserva sus 195 píxeles y, por tanto, siempre cabe en la pantalla.

| Unidad | En una ventana de 390 × 844 | En una ventana de 1280 × 800 |
|---|---|---|
| `10vw` | 39 px | 128 px |
| `10vh` | 84,4 px | 80 px |
| `10vmin` | 39 px | 80 px |
| `10vmax` | 84,4 px | 128 px |

La longitud de una línea de texto influye directamente en la lectura: el capítulo [Tipografía](/?c=ui-ux&p=typographie) recomienda de 50 a 75 caracteres, algo que `max-width: 65ch` garantiza mejor que una anchura en píxeles, porque `ch` sigue a la fuente elegida. `ch`, `ex` y `lh` dependen de la fuente y del interlineado del elemento: su valor en píxeles depende, pues, de la fuente cargada y no se puede adivinar sin mostrarla. Estas unidades están disponibles en los navegadores habituales (28/10/2026).

## `em`: práctico, pero se acumula

`em` tiene dos sentidos según la propiedad. Para `font-size`, se refiere al tamaño de fuente del **padre**. Para todas las demás propiedades (`padding`, `width`, `margin`...), se refiere al tamaño de fuente **del propio elemento**. Es el efecto que hace que los espaciados de un botón sean proporcionales a su texto:

```css
.boton {
    /* texto de 1.25 veces el tamaño de la raíz: 20 px si esta mide 16 px */
    font-size: 1.25rem;
    /* arriba y abajo: 0.5 × 20 = 10 px; izquierda y derecha: 1 × 20 = 20 px */
    padding: 0.5em 1em;
}
```

Si el usuario ajusta el tamaño de fuente de su navegador a 24 píxeles (en lugar de 16), el texto del botón pasa a 1,25 × 24 = 30 px y los espacios a 15 px y 30 px: el botón sigue proporcionado. Es el buen uso de `em`.

El problema aparece con `font-size` en elementos **anidados** (colocados unos dentro de otros): cada nivel multiplica el tamaño de su padre, por lo que los efectos se acumulan.

```html
<!-- Tres bloques anidados: cada uno es hijo del anterior, con la misma clase en todos -->
<div class="nivel">Nivel 1
    <div class="nivel">Nivel 2
        <div class="nivel">Nivel 3</div>
    </div>
</div>
```

```css
html {
    font-size: 100%;         /* la raíz: 16 px con el ajuste por defecto */
}

.nivel {
    font-size: 1.5em;        /* 1.5 veces el tamaño de fuente del PADRE */
}
```

```
html                       16 px      (tamaño de la raíz)
 └─ .nivel (nivel 1)       16 × 1,5 = 24 px
     └─ .nivel (nivel 2)   24 × 1,5 = 36 px
         └─ .nivel (nivel 3) 36 × 1,5 = 54 px     el texto crece en cada nivel
```

Con `font-size: 1.5rem` en su lugar, los tres niveles medirían 24 píxeles: `rem` se refiere siempre a la raíz, sea cual sea la profundidad.

| | `em` | `rem` |
|---|---|---|
| Referencia de `font-size` | El padre (varía en cada nivel) | La raíz (siempre la misma) |
| Referencia de las demás propiedades | La fuente del elemento | La fuente de la raíz |
| Riesgo | Acumulación en los elementos anidados (listas dentro de listas, componentes encajados) | Ninguna acumulación |
| Cuándo elegirlo | `padding`, `margin` o `gap` que deben seguir **al texto del mismo elemento** | Los tamaños de fuente, y los espacios que no dependen de un texto concreto |

## `rem` y el ajuste del usuario

Todo navegador tiene un **tamaño de fuente por defecto**, 16 píxeles mientras nadie lo toque. El usuario puede cambiarlo en los ajustes de apariencia o de fuentes de su navegador: una persona con baja visión lo sube a 24, 32 píxeles o más, y espera que **todos** los sitios lo sigan. La raíz recoge ese valor: es el que usa `rem`.

El punto esencial: un tamaño escrito en **píxeles** no sigue ese ajuste; un tamaño en `rem` sí.

| Ajuste del usuario | `font-size: 16px` | `font-size: 1rem` | `font-size: 1.125rem` |
|---|---|---|---|
| 16 px (por defecto) | 16 px | 16 px | 18 px |
| 24 px (150 %) | 16 px | 24 px | 27 px |
| 32 px (200 %) | 16 px | 32 px | 36 px |
| 48 px (300 %) | 16 px | 48 px | 54 px |

Una página hecha solo de píxeles se queda, pues, diminuta para quien ha pedido un texto un 200 % más grande: su ajuste se ignora. No es un defecto del **zoom**: ampliar con el teclado (Ctrl y `+`, o ⌘ y `+` en Mac) agranda también los píxeles. Solo el **ajuste del tamaño de fuente** los deja sin cambios (ver [la sección sobre las dos formas de ampliar](#dos-formas-de-ampliar-el-zoom-y-el-tamano-de-fuente)). Hay que hacer, pues, que la raíz también siga ese ajuste:

```css
/* BIEN: el 100 % del tamaño elegido por el usuario (16 px si no se ha tocado nada) */
html {
    font-size: 100%;
}
```

```css
/* A EVITAR: fija 16 px sea cual sea la elección del usuario; rem ya no sigue su ajuste */
html {
    font-size: 16px;
}
```

Los tamaños de fuente de las maquetas suelen darse en píxeles (ver [Tipografía](/?c=ui-ux&p=typographie)): se convierten dividiendo entre 16.

| Maqueta | Cálculo | En CSS |
|---|---|---|
| 14 px | 14 / 16 | `0.875rem` |
| 16 px | 16 / 16 | `1rem` |
| 18 px | 18 / 16 | `1.125rem` |
| 24 px | 24 / 16 | `1.5rem` |
| 32 px | 32 / 16 | `2rem` |
| 48 px | 48 / 16 | `3rem` |

Los píxeles conservan su sitio para lo que **no** debe crecer con el texto: un borde fino (`1px solid`), un trazo de sombra.

## Las unidades de ventana en móvil: el problema de `100vh`

En un teléfono, la **barra de direcciones** (la zona del navegador que muestra la dirección de la página) se reduce o desaparece al desplazarse hacia abajo, y reaparece al subir. La zona visible de la página cambia, pues, de altura durante la lectura. Ahora bien, `vh` ha seguido calculándose, en los navegadores móviles, sobre la **mayor** altura posible, con la barra oculta. Un bloque `height: 100vh` resulta entonces demasiado alto mientras la barra está visible: su parte inferior (un botón, por ejemplo) queda bajo el borde de la pantalla, fuera de alcance sin desplazarse.

CSS ha añadido, por tanto, tres familias de unidades, que designan cada una un estado de la barra:

| Unidad | Nombre | Se refiere a la altura... | ¿Cambia durante el desplazamiento? |
|---|---|---|---|
| `svh` | *small viewport height* | De la **pequeña** ventana: barra de direcciones visible | No |
| `lvh` | *large viewport height* | De la **grande** ventana: barra de direcciones oculta | No |
| `dvh` | *dynamic viewport height* | De la ventana **actual**: sigue la barra en directo | Sí |
| `vh` | *viewport height* | En la práctica, lo mismo que `lvh` en móvil | No |

Este es el esquema, para una pantalla donde la zona total mide 800 píxeles y la barra de direcciones 60 píxeles (valores de ejemplo):

```
BARRA VISIBLE (página en lo más alto)
+----------------------------+
| barra de dirección: 60 px  |
+----------------------------+   <- borde superior de la zona visible
|                            |     ^
|        zona visible        |     |  100svh = 740 px
|                            |     |  100dvh = 740 px (sigue la barra)
+----------------------------+     v  <- borde inferior de la pantalla
   60 px fuera de la pantalla ...............   100lvh = 800 px: sobresale 60 px

BARRA OCULTA (tras un desplazamiento hacia abajo)
+----------------------------+   <- borde superior de la pantalla
|                            |     ^
|        zona visible        |     |  100lvh = 800 px
|                            |     |  100dvh = 800 px (sigue la barra)
|                            |     |  100svh = 740 px: 60 px menos
+----------------------------+     v  <- borde inferior de la pantalla
```

| Estado de la barra | `100svh` | `100lvh` (y `100vh`) | `100dvh` |
|---|---|---|---|
| Visible | 740 px | 800 px (60 px fuera de la pantalla) | 740 px |
| Oculta | 740 px | 800 px | 800 px |

En un ordenador, ninguna barra se despliega: las cuatro unidades valen la misma altura. Los mismos prefijos existen para la anchura (`svw`, `lvw`, `dvw`) y para `vmin` y `vmax`; como la anchura no varía con la barra de direcciones, se encuentran raramente.

Los navegadores recientes entienden `svh`, `lvh` y `dvh` (28/10/2026). Para un navegador antiguo, se escribe primero el valor anterior y luego el nuevo: un navegador que no conoce la unidad ignora la línea que no comprende y conserva la anterior.

```css
.inicio {
    height: 100vh;           /* alternativa: un navegador antiguo se detiene aquí */
    height: 100dvh;          /* un navegador reciente sustituye la línea anterior */
}
```

| Necesidad | Unidad recomendada | Motivo |
|---|---|---|
| Pantalla de inicio o ventana que debe verse siempre por completo | `dvh` | Ocupa exactamente la zona visible, con barra o sin ella |
| Bloque que no debe cambiar de tamaño durante el desplazamiento | `svh` | Valor estable: el bloque no «respira» cuando la barra se mueve |
| Fondo que debe cubrir la pantalla incluso cuando la barra se retira | `lvh` | Llega hasta la parte inferior de la ventana grande |

Como `dvh` se recalcula continuamente, un bloque que lo usa se redimensiona en cada movimiento de la barra: puede moverse ante los ojos del lector. Y, para un bloque que contiene texto, se escribe `min-height` en lugar de `height` (ver [la lista de control](#la-lista-de-control-para-resistir-al-200-y-al-300)).

```css
.inicio {
    /* alternativa: al menos la altura de la pantalla, más si el texto lo exige */
    min-height: 100vh;
    min-height: 100dvh;      /* versión reciente: la altura realmente visible */
}
```

## Las funciones de tamaño: `calc()`, `min()`, `max()` y `clamp()`

Una **función CSS** es un valor que calcula su resultado: su nombre va seguido de paréntesis que contienen sus **argumentos** (los valores que se le dan), separados por comas. `var(--nombre)` es una de ellas. Las cuatro funciones de tamaño siguientes aceptan todas las unidades de este capítulo, mezcladas.

### `calc()`: calcular con varias unidades

`calc()` realiza un cálculo que el navegador resuelve al mostrarlo. Su interés: mezclar unidades que no se pueden sumar a mano (un porcentaje y `rem`, por ejemplo).

```css
:root {
    --separacion: 1rem;                  /* variable CSS de la raíz: un espaciado */
}

.columna {
    /* anchura del padre menos 2 rem: 768 px para un padre de 800 px */
    width: calc(100% - 2rem);
    padding: calc(var(--separacion) * 2);     /* el doble de la variable: 2 rem */
    margin-top: calc(100% / 3);          /* la tercera parte de la anchura del padre */
}
```

| Operador | Regla | Ejemplo válido | Ejemplo no válido |
|---|---|---|---|
| `+` | **Espacio obligatorio** a cada lado | `calc(1rem + 2vw)` | `calc(1rem+2vw)` |
| `-` | **Espacio obligatorio** a cada lado | `calc(100% - 2rem)` | `calc(100%-2rem)` |
| `*` | Uno de los dos lados es un número sin unidad | `calc(var(--separacion) * 2)` | `calc(1rem * 2rem)` (dos longitudes) |
| `/` | El lado derecho es un número sin unidad | `calc(100% / 3)` | `calc(100% / 2rem)` (evitar: dividir entre una longitud) |

Los espacios alrededor de `+` y de `-` son obligatorios porque `-2rem` también se lee como **un número negativo**: sin espacio, el navegador ve dos valores pegados y no una resta. Un valor no válido no produce ningún error: la línea se ignora en silencio, y la propiedad conserva su valor anterior o su valor por defecto. En cambio, los espacios no son obligatorios alrededor de `*` y de `/`, aunque se escriben por costumbre. El detalle completo está en la [página de MDN sobre `calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/calc).

### `min()` y `max()`: el más pequeño, el más grande

`min(a, b)` devuelve el más pequeño de los valores, `max(a, b)` el más grande. La trampa de lectura: `min()` pone un **techo** (el resultado nunca superará el valor más pequeño), y `max()` un **suelo** (el resultado nunca bajará por debajo del más grande).

```css
.contenido {
    /* el más pequeño de los dos: nunca más ancho que 40 rem (640 px) */
    width: min(100%, 40rem);
}

.titulo {
    font-size: max(1rem, 2vw); /* el mayor de los dos: nunca menos de 1 rem (16 px) */
}
```

| Escritura | En el caso | Valores comparados | Resultado |
|---|---|---|---|
| `min(100%, 40rem)` | Padre de 500 px | 500 px y 640 px | 500 px |
| `min(100%, 40rem)` | Padre de 900 px | 900 px y 640 px | 640 px |
| `max(1rem, 2vw)` | Ventana de 400 px | 16 px y 8 px | 16 px |
| `max(1rem, 2vw)` | Ventana de 1000 px | 16 px y 20 px | 20 px |

`width: min(100%, 40rem)` equivale a `width: 100%; max-width: 40rem;` en una sola línea. Las páginas de MDN sobre [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) y [`max()`](https://developer.mozilla.org/en-US/docs/Web/CSS/max) detallan su sintaxis.

### `clamp()`: un tamaño fluido, acotado por ambos lados

`clamp(mínimo, preferido, máximo)` elige el valor **preferido** mientras se mantenga entre los dos límites; si no, el límite más cercano. Es el equivalente de `max(mínimo, min(preferido, máximo))`. Con una parte preferida que depende de la anchura de la ventana, el tamaño crece **progresivamente** con la pantalla (se habla de tamaño **fluido**), sin media query:

```css
.titulo {
    /* suelo: 1 rem (16 px); preferido: 0.5 rem + 2 % de la anchura; máximo: 2 rem */
    font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
}
```

Esto es lo que da esta línea según la anchura de la ventana (con la raíz a 16 píxeles, es decir, 0,5 rem = 8 px y 1 rem = 16 px):

| Anchura de la ventana | Parte preferida `0.5rem + 2vw` | Resultado | Qué valor gana |
|---|---|---|---|
| 320 px | 8 + 6,4 = 14,4 px | **16 px** | El suelo (14,4 está por debajo de 16) |
| 400 px | 8 + 8 = 16 px | **16 px** | El suelo y el preferido coinciden |
| 600 px | 8 + 12 = 20 px | **20 px** | El preferido |
| 800 px | 8 + 16 = 24 px | **24 px** | El preferido |
| 1000 px | 8 + 20 = 28 px | **28 px** | El preferido |
| 1200 px | 8 + 24 = 32 px | **32 px** | El preferido y el techo coinciden |
| 1440 px | 8 + 28,8 = 36,8 px | **32 px** | El techo (36,8 está por encima de 32) |

Entre 400 y 1200 píxeles de anchura, el texto crece en línea recta de 16 a 32 píxeles; por debajo y por encima, se queda fijo en el límite.

**¿Cómo elegir la parte preferida?** Se parte de lo que se quiere: el tamaño mínimo a partir de una anchura dada, el tamaño máximo a partir de otra. La parte preferida se escribe `ordenada + pendiente × anchura`, donde la **pendiente** es el número de píxeles ganados por cada píxel de anchura de ventana, y la **ordenada en el origen** el valor que se suma al principio para volver al tamaño deseado.

| Paso | Cálculo | Ejemplo: de 16 px a 400 px de anchura hasta 32 px a 1200 px |
|---|---|---|
| 1. Pendiente en píxeles por píxel de anchura | (tamaño máx. - tamaño mín.) / (anchura máx. - anchura mín.) | (32 - 16) / (1200 - 400) = 0,02 |
| 2. Pendiente en `vw` | Pendiente × 100, porque 1vw es el 1 % de la anchura | 0,02 × 100 = **2vw** |
| 3. Ordenada en el origen | tamaño mín. - pendiente × anchura mín. | 16 - 0,02 × 400 = 8 px |
| 4. Ordenada en `rem` | Ordenada / 16 | 8 / 16 = **0,5rem** |
| 5. Ensamblaje | `clamp(mín, ordenada + pendiente, máx)` | `clamp(1rem, 0.5rem + 2vw, 2rem)` |

La comprobación es inmediata: a 1200 píxeles, 8 + 0,02 × 1200 = 32. Otro ejemplo: de 18 píxeles (1,125 rem) a 400 píxeles de anchura hasta 24 píxeles (1,5 rem) a 1200 píxeles: la pendiente es (24 - 18) / 800 = 0,0075, es decir, 0,75vw; la ordenada en el origen es 18 - 0,0075 × 400 = 15 px, es decir, 0,9375 rem. Se escribe, pues, `clamp(1.125rem, 0.9375rem + 0.75vw, 1.5rem)`; comprobación: a 400 píxeles, 15 + 3 = 18; a 1200 píxeles, 15 + 9 = 24.

`clamp()` no se limita al texto: `padding: clamp(1rem, 4vw, 3rem)` hace variar un espaciado con la pantalla. Los detalles están en la [página de MDN sobre `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp). Dentro de `clamp()`, `min()`, `max()` o de un `calc()`, un cálculo se escribe sin repetir `calc()`: `0.5rem + 2vw` basta, con los mismos espacios obligatorios.

### La trampa de `vw` solo en un tamaño de fuente

Un tamaño de fuente escrito **únicamente** en `vw` depende solo de la anchura de la ventana:

```css
.titulo-fragil {
    font-size: 2vw;           /* el 2 % de la anchura: 25.6 px a 1280 px, 6.4 px a 320 px */
}
```

Tres defectos se derivan de ello. No sigue el ajuste de tamaño de fuente del usuario, que no cambia la anchura de la ventana. Tampoco crece al ampliar, como calcula la sección sobre la ampliación un poco más abajo. Y en pantallas pequeñas se vuelve diminuto: a 320 píxeles de anchura, `2vw` da 6,4 píxeles, ilegible. La regla es, pues: **añadir siempre una parte en `rem`** (como el `0.5rem` del ejemplo de `clamp()`), y expresar los límites en `rem` y no en píxeles, para que sigan el ajuste del usuario.

## Ampliar el texto al 200 % y al 300 %: lo que exige el WCAG

El **WCAG** (*Web Content Accessibility Guidelines*) es el conjunto de pautas de accesibilidad web publicado por el [W3C](https://www.w3.org/) (*World Wide Web Consortium*), el organismo que normaliza la web (ver [Color y contraste](/?c=ui-ux&p=couleur-et-contraste) y [la accesibilidad en UX](/?c=ui-ux&p=accessibilite-ux), que presentan sus niveles A, AA y AAA). Dos de sus criterios, ambos de **nivel AA** (el nivel buscado por defecto), se refieren a la ampliación:

| Número | Enunciado | Lo que exige el criterio | Página oficial |
|---|---|---|---|
| 1.4.4 | Cambio de tamaño del texto (*Resize Text*) | El texto puede ampliarse hasta un **200 %**, sin herramienta especializada, **sin pérdida de contenido ni de función** | [W3C: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| 1.4.10 | Reflujo (*Reflow*) | A **320 píxeles CSS de anchura** (un zoom del 400 % en una ventana de 1280 píxeles), el contenido se muestra **sin desplazamiento horizontal**, ni pérdida de contenido ni de función | [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |

Un **desplazamiento horizontal** es la barra que obliga a deslizar la página de izquierda a derecha para leer una línea: rompe la lectura, porque hay que volver atrás sin cesar. El criterio admite excepciones para los contenidos cuyo sentido exige una disposición en dos dimensiones (tabla de datos, mapa, imagen), y fija un equivalente de 256 píxeles de **alto** para un contenido que se desplaza en horizontal.

**¿Y el 300 %?** Ningún criterio fija este nivel: se sitúa entre los dos umbrales oficiales (200 % y 400 %). Es un **nivel de prueba** útil: en una ventana de 1280 píxeles, un zoom del 300 % da una anchura de unos 427 píxeles, un tamaño intermedio en el que los puntos de ruptura pensados para teléfonos concretos a veces dejan un hueco. Una página que resiste al 200 %, al 300 % y al 400 % es segura en todo el rango.

### Dos formas de ampliar: el zoom y el tamaño de fuente

Los usuarios disponen de dos medios para obtener un texto más grande, con efectos muy distintos:

| | Zoom de la página | Tamaño de fuente del navegador |
|---|---|---|
| Gesto | Ctrl y `+` (⌘ y `+` en Mac), o Ctrl y la rueda del ratón | Ajustes del navegador, sección de apariencia o de fuentes |
| Lo que crece | **Todo**: texto, imágenes, píxeles, espaciados | Solo lo que se expresa en `rem`, `em` o en porcentaje de la fuente (los píxeles se quedan) |
| Anchura de la ventana en píxeles CSS | **Disminuye** (anchura real / zoom) | No cambia |
| Media queries en `px` | Reaccionan: la maquetación pasa a la versión «teléfono» | No reaccionan: la maquetación ancha se mantiene y el texto crece dentro de ella |
| Riesgo típico | Alturas fijas demasiado pequeñas, cabecera fija que ocupa la pantalla | Columnas demasiado estrechas, texto que desborda bloques de anchura fija |

Un zoom del 200 % sobre una ventana de 1280 × 800 píxeles equivale, para el CSS, a una ventana dos veces más pequeña: 1280 / 2 = 640 píxeles de anchura. Estos son los valores de cada nivel:

| Zoom | Anchura en píxeles CSS (ventana de 1280) | Altura en píxeles CSS (ventana de 800) | Lo que ve el CSS |
|---|---|---|---|
| 100 % | 1280 | 800 | Un ordenador |
| 200 % | 640 | 400 | Una anchura cercana a la de una tableta pequeña |
| 300 % | unos 427 | unos 267 | Una anchura cercana a la de un teléfono grande |
| 400 % | 320 | 200 | Una anchura cercana a la de un teléfono pequeño |

Conviene retener sobre todo la altura: al 400 %, un bloque escrito con `height: 100vh` solo mide 200 píxeles CSS. Y una barra de cabecera fija de 80 píxeles CSS ocuparía entonces 80 / 200 = 40 % de la ventana.

Los puntos de ruptura también siguen el ajuste de fuente si se escriben en `em`: en una media query, `em` se refiere al tamaño de fuente por defecto del navegador (y no al que define el CSS de la página). Así, `48em` vale 48 × 16 = 768 píxeles por defecto, pero 48 × 32 = 1536 píxeles si el usuario ha elegido 32 píxeles: una ventana de 1280 píxeles se considera entonces estrecha, lo que conviene a un texto dos veces más grande.

```css
/* 48em: 768 px con el tamaño por defecto (16 px), 1536 px con 32 px elegidos */
/* @media aplica el bloque solo si la ventana tiene al menos esta anchura */
@media (min-width: 48em) {
    .pagina {
        /* las columnas se colocan una junto a otra solo por encima de este umbral */
        display: flex;
    }
}
```

### ¿Qué ocurre con un tamaño fluido al ampliar?

El cálculo se hace con la anchura en píxeles CSS de la tabla anterior: un tamaño de fuente fijo en `rem` se multiplica por el zoom, mientras que la parte `vw` de un tamaño fluido disminuye al mismo tiempo que la ventana. Esto es lo que muestra, sobre una ventana de 1280 píxeles, el tamaño **mostrado** (tamaño CSS × zoom) de tres escrituras:

| Zoom | Anchura CSS | `2rem` | `clamp(1rem, 0.5rem + 2vw, 2rem)` | `2vw` |
|---|---|---|---|---|
| 100 % | 1280 | 32 px | 32 px | 25,6 px |
| 200 % | 640 | 64 px (×2) | 8 + 12,8 = 20,8 px CSS, es decir, 41,6 px (×1,3) | 12,8 px CSS, es decir, 25,6 px (×1) |
| 300 % | 427 | 96 px (×3) | 8 + 8,53 = 16,53 px CSS, es decir, 49,6 px (×1,55) | 8,53 px CSS, es decir, 25,6 px (×1) |
| 400 % | 320 | 128 px (×4) | 16 px CSS (suelo), es decir, 64 px (×2) | 6,4 px CSS, es decir, 25,6 px (×1) |

Lectura: `2rem` crece exactamente como el zoom. `2vw` **no crece en absoluto** (×1 en cada nivel): el aumento lo anula la reducción de la ventana, de ahí su condena. `clamp()` crece, pero menos que el zoom (×1,3 al 200 %) mientras pese su parte preferida en `vw`. Con el ajuste de fuente a 32 píxeles, el mismo cálculo da 0,5 × 32 + 0,02 × 1280 = 41,6 píxeles, es decir, todavía ×1,3.

Esta tabla es un cálculo, no un veredicto: no indica si se cumple el criterio 1.4.4, lo que se juzga con la página abierta. Basta para decidir: para el **texto corriente**, quedarse con `rem` fijos (`1rem`), que crecen exactamente en la proporción del zoom pedido; reservar `clamp()` para los **grandes títulos**, con una separación moderada entre los límites; y probar al 200 %.

### La lista de control para resistir al 200 % y al 300 %

| Riesgo | Lo que se rompe al 200 % o al 300 % | Corrección |
|---|---|---|
| Anchura fija en píxeles (`width: 1200px`) | Una barra de desplazamiento horizontal | `max-width` más `width: 100%`, o `width: min(100%, 75rem)` |
| Altura fija en píxeles en un bloque de texto | El texto sale del bloque o queda cortado | `min-height`, o no fijar la altura |
| `height: 100vh` para un bloque que contiene texto | Al 400 %, la altura es solo de 200 píxeles CSS | `min-height: 100vh` (y luego `min-height: 100dvh`) |
| `overflow: hidden` en un contenedor (ajuste que oculta lo que sobresale de la caja) | Lo que sobresale se **corta**, y por tanto se pierde | `overflow: visible` (por defecto), o `overflow: auto` para una tabla o un bloque de código |
| Elemento [flex](/?c=langages&s=css&p=flexbox) o [grid](/?c=langages&s=css&p=grid) que se niega a encogerse | El contenedor se sale de la pantalla | `min-width: 0` (anchura mínima permitida: cero) en el elemento flex; `minmax(0, 1fr)` para una columna de cuadrícula |
| Palabra o dirección muy larga | Una línea que no se puede cortar sobresale del bloque | `overflow-wrap: anywhere` (permite cortar una palabra demasiado larga) |
| Interlineado en píxeles (`line-height: 24px`) | Las líneas se superponen cuando el texto crece | `line-height: 1.5` (número sin unidad) |
| Imagen o SVG más ancho que la pantalla | Desplazamiento horizontal | `max-width: 100%; height: auto;` (ver [las imágenes](/?c=langages&s=html&p=liens-et-images) y [el SVG](/?c=langages&s=html&p=svg-dans-la-page)) |
| Cabecera pegada arriba de la ventana (`position: fixed` o `sticky`, ver [el posicionamiento](/?c=langages&s=css&p=positionnement)) | Cubre una gran parte de la ventana estrecha | Devolverla a `position: static` (desplazamiento normal) en una media query para las ventanas estrechas |
| Botón de altura fija | Su etiqueta desborda | `min-height` y `padding` en `em` |

El **`overflow`** rige lo que ocurre cuando el contenido sobresale de su caja:

| Valor | Efecto |
|---|---|
| `visible` (por defecto) | El contenido sobresale y sigue visible |
| `hidden` | Lo que sobresale se oculta, definitivamente |
| `auto` | Una barra de desplazamiento aparece solo si es necesaria |
| `scroll` | Una barra de desplazamiento está siempre presente |

La [página de MDN sobre `overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) enumera los demás valores. Esto explica por qué `min-width: 0` es útil en un contenedor flex: por defecto, un elemento flex se niega a ser más estrecho que su contenido (su valor mínimo es `auto`, que equivale a la anchura de la palabra más larga o de la imagen más ancha que contiene). Una palabra larga o una imagen ancha lo mantienen, pues, ancho, y el contenedor se sale de la pantalla. Del mismo modo, en una cuadrícula, `1fr` se escribe en realidad `minmax(auto, 1fr)`: se aplica el mismo mínimo.

```css
.tarjetas {
    display: flex;           /* los hijos se colocan en una misma línea (ver Flexbox) */
    flex-wrap: wrap;         /* pasan a la línea siguiente cuando falta espacio */
    gap: 1rem;               /* espacio de 1 rem entre los elementos */
}

.tarjeta {
    flex: 1 1 15rem;         /* puede crecer, puede encogerse, anchura de partida 15 rem */
    min-width: 0;            /* el elemento puede ser más estrecho que su contenido */
    overflow-wrap: anywhere; /* corta una palabra demasiado larga donde haga falta */
}
```

`overflow-wrap` decide si una palabra demasiado larga para su línea puede cortarse en medio: `normal` (por defecto) la deja sobresalir; `anywhere` la corta en cualquier punto (y tiene en cuenta ese corte al calcular la anchura mínima de un elemento flex o grid, cosa que no hace `break-word`, otro valor del mismo ajuste); véase la [página de MDN sobre `overflow-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap). Para cortar bien por sílabas, `hyphens: auto` (ver [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)) añade un guion, pero exige que el idioma de la página esté declarado con `lang` en `<html>` (ver [la estructura de un documento](/?c=langages&s=html&p=structure-dun-document)).

En una cuadrícula, `min()` resuelve el caso de una columna más ancha que la pantalla:

```css
.galeria {
    display: grid;
    /* cada columna: al menos 12 rem, o todo el contenedor si es más estrecho */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: 1rem;               /* espacio entre las celdas */
}
```

Con `minmax(200px, 1fr)` en su lugar, una columna no podría bajar de 200 píxeles: en un contenedor más estrecho, la cuadrícula se saldría. La combinación `min(100%, 12rem)` reduce el mínimo a la anchura del contenedor.

Este es el mismo componente antes y después de la corrección:

```css
/* ANTES: todo se rompe al 200 % o al 300 % */
.pagina {
    width: 1200px;           /* anchura fija: desplazamiento horizontal bajo 1200 px */
}

.cabecera {
    height: 80px;            /* altura fija: el texto ampliado desborda */
    overflow: hidden;        /* y el desbordamiento se corta: el texto se pierde */
}

.contenido {
    line-height: 24px;       /* interlineado fijo: las líneas se superponen */
}
```

```css
/* DESPUÉS: la página se adapta al espacio real */
.pagina {
    width: 100%;             /* ocupa la anchura de la ventana */
    max-width: 75rem;        /* máximo 1200 px (75 × 16) con el ajuste por defecto */
    /* 0 arriba y abajo, auto a izquierda y derecha: bloque centrado */
    margin: 0 auto;
    padding: 0 1rem;         /* margen interior a izquierda y derecha */
}

.cabecera {
    min-height: 5rem;        /* al menos 80 px por defecto, más si el texto lo exige */
}

.contenido {
    line-height: 1.5;        /* 1.5 veces el tamaño del texto: sigue las ampliaciones */
}
```

El número sin unidad de `line-height: 1.5` se **hereda tal cual**: cada hijo lo recalcula con su propio tamaño de fuente, mientras que un valor en píxeles se transmite en píxeles a los hijos, aunque tengan un texto más grande ([la herencia](/?c=langages&s=css&p=variables-et-cascade) transmite un valor fijo). Para comprender la propiedad, véase la [página de MDN sobre `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height).

### Cómo probar

Ninguna regla de este capítulo sustituye una prueba real en un navegador: los cálculos anteriores predicen el resultado, pero solo la visualización muestra una línea cortada o una barra de desplazamiento inesperada.

| Prueba | Cómo | Qué se verifica |
|---|---|---|
| Tamaño de fuente al 200 % | En los ajustes del navegador, elegir 32 px como tamaño de fuente por defecto (16 px por defecto), y luego recargar la página | El texto en `rem` se duplica; nada se corta ni se superpone |
| Tamaño de fuente al 300 % | Mismo ajuste, con 48 px | Igual; las columnas siguen siendo legibles |
| Zoom 200 % | Ctrl y `+` hasta el 200 % en una ventana de 1280 px | La maquetación pasa a la versión estrecha, sin pérdida |
| Zoom 300 % | Hasta el 300 % | Sin hueco entre las dos versiones de la maquetación |
| Zoom 400 % | Hasta el 400 %: la ventana mide 320 píxeles CSS | **Ninguna barra de desplazamiento horizontal** (criterio 1.4.10) |
| Vuelta a la normalidad | Ctrl y `0` | Restablece el zoom al 100 % |

Los menús del navegador varían de una versión a otra: se busca «tamaño de fuente» en el campo de búsqueda de sus ajustes. Para cada nivel se comprueban cuatro puntos: ninguna barra de desplazamiento horizontal (salvo en tablas o mapas), ningún texto cortado, todos los botones y enlaces utilizables con el teclado y con el ratón, y nada oculto bajo una cabecera o un pie de página fijos.

Para encontrar qué elemento provoca un desplazamiento horizontal, se puede interrogar la página desde la **consola**, la zona de las herramientas de desarrollo (que se abre con la tecla F12) donde se escribe JavaScript (ver [el DOM](/?c=langages&s=javascript&p=dom-et-evenements), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) y [las funciones](/?c=langages&s=javascript&p=fonctions)):

```javascript
// Anchura visible de la página: la de la raíz <html>, sin la barra de desplazamiento
const anchura = document.documentElement.clientWidth;

// querySelectorAll("*"): todos los elementos; [...] los reúne en un arreglo
// filter conserva los de borde derecho (right) más allá de la anchura visible
const desbordados = [...document.querySelectorAll("*")].filter(
    (elemento) => elemento.getBoundingClientRect().right > anchura
);

// console.log escribe la lista en la consola: un clic sobre un elemento lo resalta
console.log(desbordados);
```

`getBoundingClientRect()` devuelve el rectángulo que ocupa el elemento en la ventana; su propiedad `right` es la posición de su borde derecho en píxeles. La lista mostrada contiene los elementos cuya caja sobresale de la ventana por la derecha: son los que hay que corregir (un menú ocultado a propósito fuera de la pantalla también aparece, sin ser un error). Ver [los arreglos](/?c=langages&s=javascript&p=tableaux) para `filter`.

## Qué unidad para cada necesidad

| Necesidad | Qué escribir | Por qué |
|---|---|---|
| Tamaño de un texto corriente | `1rem` | Sigue el ajuste del navegador y el zoom |
| Espacio que sigue al texto de un elemento (botón) | `em` | Sigue proporcionado a su propio texto |
| Anchura de una columna de texto | `max-width: 65ch` | Longitud de línea cómoda, adaptada a la fuente |
| Anchura de un bloque que no debe sobrepasar un límite | `width: min(100%, 40rem)` | Se adapta a las pantallas pequeñas y se limita en las grandes |
| Altura a pantalla completa en móvil | `min-height: 100vh` y luego `min-height: 100dvh` | Sigue la barra de direcciones, con alternativa |
| Gran título fluido | `clamp(1.75rem, 1.125rem + 2.5vw, 3rem)` | Crece con la pantalla, acotado, sigue la raíz |
| Interlineado | `1.5` sin unidad | Sigue el tamaño del texto |
| Punto de ruptura | `@media (min-width: 48em)` | Sigue el tamaño de fuente por defecto |
| Borde fino, sombra | `1px` | No debe crecer con el texto |
| Imagen | `max-width: 100%; height: auto` | No sobrepasa nunca a su padre |

El título fluido de la tabla sigue el método de los pasos anteriores, de 28 píxeles (1,75 rem) a 400 píxeles de anchura hasta 48 píxeles (3 rem) a 1200 píxeles: la pendiente es (48 - 28) / 800 = 0,025, es decir, 2,5vw; la ordenada en el origen es 28 - 0,025 × 400 = 18 px, es decir, 1,125 rem. Comprobación: a 400 píxeles, 18 + 10 = 28; a 1200 píxeles, 18 + 30 = 48.

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| `html { font-size: 16px; }` | Fija la raíz: `rem` ya no sigue el ajuste de tamaño de fuente del usuario |
| `html { font-size: 62.5%; }` para que `1rem` valga 10 px | Sigue el ajuste, pero todo el texto no redefinido pasa a 10 px (ilegible), y cada tamaño debe recalcularse (`1.6rem` para 16 px) |
| `em` en elementos anidados | El tamaño se multiplica en cada nivel: 16, 24, 36, 54 px para `1.5em` |
| `font-size: 2vw` solo | No crece ni con el zoom ni con el ajuste del usuario; 6,4 px a 320 px de anchura |
| Límites de `clamp()` en píxeles | Ignoran el ajuste del usuario: hay que escribir `1rem` y `2rem` |
| Texto corriente en `clamp()` | La parte `vw` frena el crecimiento (×1,3 con el zoom al 200 % a 1280 px): reservar para los grandes títulos |
| `100vh` en teléfono | La parte inferior del bloque sobresale bajo el borde de la pantalla cuando la barra de direcciones está visible |
| `width: 100vw` en ordenador | `vw` cuenta la barra de desplazamiento vertical: el bloque sobresale de su anchura y crea un desplazamiento horizontal; preferir `100%` |
| `calc(100%-2rem)` sin espacios | Valor no válido, línea ignorada en silencio |
| `min()` y `max()` al revés | `min()` pone techo y `max()` suelo: el efecto es contrario a la intuición |
| `height: 100%` sin altura en el padre | El porcentaje se ignora: la altura sigue siendo automática |
| `height` en píxeles en un bloque de texto | El texto ampliado sale del bloque |
| `overflow: hidden` alrededor de un texto | El texto ampliado se corta, y por tanto se pierde |
| `line-height` en píxeles | Las líneas se superponen en cuanto el texto crece |
| Elemento flex o grid sin `min-width: 0` | Una palabra larga basta para desbordar todo el contenedor |
| `<meta name="viewport" ... user-scalable=no>` (o `maximum-scale=1`) | Prohíbe el zoom por pellizco en móvil, contrario al criterio 1.4.4 (ver [la estructura de un documento](/?c=langages&s=html&p=structure-dun-document)) |
| Probar solo con el zoom | Los píxeles crecen con el zoom pero no con el ajuste de fuente: hay que probar los dos casos |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Dejar `html { font-size: 100%; }` y escribir los tamaños de fuente en `rem` | El texto sigue el ajuste del usuario |
| Reservar `em` para los espacios proporcionales al texto del mismo elemento | Sin acumulación, el botón conserva sus proporciones |
| Convertir los tamaños de maqueta en `rem` (px / 16) | Mismo resultado por defecto, pero respeta el ajuste |
| Usar `min-height` en lugar de `height` para un bloque de texto | El bloque crece con su contenido |
| Escribir `100vh` y luego `100dvh` (o `svh` / `lvh` según la necesidad) | Alternativa para los navegadores antiguos, altura exacta en móvil |
| Poner `max-width` en `rem` o en `ch`, con `width: 100%` | La maquetación se adapta de 320 px a la pantalla ancha |
| `clamp()` para los grandes títulos, con límites y ordenada en `rem` | Tamaño fluido y acotado, que además sigue el ajuste |
| `line-height` en número sin unidad | El interlineado sigue al texto |
| `min-width: 0`, `minmax(0, 1fr)` y `overflow-wrap: anywhere` en los componentes flex y grid | Ninguna palabra larga desborda la página |
| Puntos de ruptura en `em` | Siguen el tamaño de fuente por defecto |
| Probar al 200 %, 300 % y 400 %, con el zoom **y** con el tamaño de fuente | Las dos formas de ampliar producen problemas distintos |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un tamaño CSS es un número y una unidad. `px` es absoluta; `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex` y `lh` son relativas. `rem` sigue la raíz (16 px por defecto, ajustable por el usuario), mientras que `px` ignora ese ajuste; `em` se acumula en los elementos anidados. En móvil, `svh` es la altura con la barra visible, `lvh` con la barra oculta y `dvh` la altura actual; se escribe `100vh` y luego `100dvh` como alternativa. `calc()` mezcla unidades (espacios obligatorios alrededor de `+` y `-`); `min()` pone techo y `max()` suelo; `clamp(mínimo, preferido, máximo)` da un tamaño fluido cuya parte preferida se calcula como `ordenada + pendiente × anchura` (por ejemplo `clamp(1rem, 0.5rem + 2vw, 2rem)`). El WCAG exige un texto ampliable al 200 % (criterio 1.4.4, Cambio de tamaño del texto) y un contenido sin desplazamiento horizontal a 320 píxeles CSS, es decir, con un zoom del 400 % (criterio 1.4.10, Reflujo); el 300 % es un nivel de prueba intermedio. |
| **Trampas a evitar** | Raíz en píxeles; `62.5%` mal compensado; `em` anidados; `vw` solo en un tamaño de fuente; límites de `clamp()` en píxeles; `100vh` en teléfono; `100vw` con barra de desplazamiento; `calc(100%-2rem)`; `min()` y `max()` invertidos; alturas e interlineados en píxeles; `overflow: hidden` alrededor del texto; elementos flex y grid sin `min-width: 0`; zoom del móvil bloqueado por `user-scalable=no`; probar solo una de las dos formas de ampliar. |
| **Buenas prácticas** | Tamaños de fuente y espaciados generales en `rem`, `em` para lo que sigue al texto del elemento; `min-height`, `max-width` y `width: min(100%, ...)` en lugar de dimensiones fijas; `100vh` seguido de `100dvh`; `clamp()` para los grandes títulos, con límites en `rem`; `line-height` sin unidad; `overflow-wrap: anywhere` y `min-width: 0`; puntos de ruptura en `em`; prueba real al 200 %, 300 % y 400 %, con el zoom y con el tamaño de fuente. |
