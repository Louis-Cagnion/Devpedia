---
order: 1
---

# Los selectores

Un **selector** determina a qué elementos [HTML](/?c=langages-de-balisage&s=html&p=html) se aplica una regla CSS: desde el más simple (una etiqueta) hasta el más preciso (una combinación de atributos y posición en el árbol del documento).

## Selectores básicos

```css
h1 { }          /* todos los elementos <h1> */
.tarjeta { }    /* todos los elementos con class="tarjeta" */
#cabecera { }   /* el único elemento con id="cabecera" */
* { }            /* absolutamente todos los elementos */
```

> **Nota:** una `class` puede reutilizarse en varios elementos, mientras que un `id` debe seguir siendo **único** en toda la página: un selector `#id` siempre identifica, por lo tanto, a un único elemento concreto, a diferencia de `.clase`.

## Combinadores

```css
article p { }    /* todo <p> descendiente de <article>, a CUALQUIER profundidad */
article > p { }  /* todo <p> HIJO DIRECTO de <article>, no más profundo */
h2 + p { }       /* el <p> inmediatamente DESPUÉS de un <h2>, al mismo nivel */
h2 ~ p { }       /* TODOS los <p> que siguen a un <h2>, al mismo nivel */
```

## Selectores de atributos

```css
input[type="email"] { }  /* todo <input> con este atributo Y este valor exacto */
a[href^="https"] { }     /* href que EMPIEZA por "https" */
a[href$=".pdf"] { }      /* href que TERMINA en ".pdf" */
a[href*="ejemplo"] { }   /* href que CONTIENE "ejemplo" en cualquier parte */
```

## Pseudoclases: identificar un estado

```css
a:hover { }            /* cuando el ratón pasa por encima del elemento */
input:focus { }        /* cuando el campo tiene el foco (clic o tabulación) */
li:first-child { }     /* el primer hijo de su padre */
li:last-child { }      /* el último hijo de su padre */
li:nth-child(2) { }    /* precisamente el 2.º hijo */
li:nth-child(odd) { }  /* todos los hijos impares (1.º, 3.º, 5.º...) */
input:disabled { }     /* un campo deshabilitado */
input:required { }     /* un campo marcado como "required" en HTML (véase Los formularios) */
```

## Pseudoelementos: seleccionar una parte de un elemento

```css
p::first-line { }             /* únicamente la primera línea mostrada del párrafo */
p::before { content: "→ "; }  /* inserta contenido ANTES del texto real del párrafo */
p::after { content: " ✓"; }   /* inserta contenido DESPUÉS */
```

> **Nota:** `::before`/`::after` necesitan una propiedad `content` para ser visibles (aunque esté vacía, `content: "";`), muy utilizados para añadir un elemento puramente decorativo (icono, flecha...) sin sobrecargar el HTML con una etiqueta adicional sin verdadero significado semántico (véase [Semántica HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5)).

## La especificidad: ¿qué ocurre en caso de conflicto?

```css
p { color: blue; }
.texto-importante { color: red; }
#parrafo-unico { color: green; }
```

```html
<p id="parrafo-unico" class="texto-importante">¿Qué color?</p>
```

Un `id` tiene una especificidad mayor que una `class`, que a su vez es mayor que un selector de etiqueta: el párrafo se mostrará, por lo tanto, en **verde** (gana `#parrafo-unico`), sea cual sea el orden en que estén escritas las reglas en el archivo.

| Tipo de selector | Peso (de menor a mayor) |
|---|---|
| Selector universal (`*`) | El más débil |
| Etiqueta (`p`, `div`...) | Débil |
| Clase (`.tarjeta`), atributo (`[type=...]`), pseudoclase (`:hover`) | Medio |
| `id` (`#cabecera`) | Fuerte |
| Estilo en línea (`style="..."`) | Muy fuerte |
| `!important` | Anula todo lo demás (a evitar, véase [Variables CSS y la cascada](/?c=langages-de-balisage&s=css&p=variables-et-cascade)) |

Véase también [Variables CSS y la cascada](/?c=langages-de-balisage&s=css&p=variables-et-cascade), que detalla con precisión el orden de resolución entre especificidad, orden de escritura y origen de la regla.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un selector determina a qué elementos se aplica una regla CSS, desde el más simple (etiqueta) hasta el más preciso (atributos, posición, estado). En caso de conflicto, gana el selector más **específico** (id > clase > etiqueta); si no, la regla escrita en último lugar. |
| **Herramientas utilizables** | Selectores básicos, combinadores (`>`, `+`, `~`), selectores de atributos, pseudoclases (`:hover`, `:nth-child`...), pseudoelementos (`::before`/`::after`). |
| **Trampas a evitar** | Confundir especificidad con orden de escritura: un selector más específico siempre gana, aunque esté escrito antes que uno menos específico. |
| **Buenas prácticas** | Preferir las clases a los id para el estilo habitual (más fáciles de reutilizar y sobrescribir); reservar `id` para un uso realmente único en la página. |
