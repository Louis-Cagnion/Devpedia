---
order: 1
---

# Los selectores

Un **selector** determina a qué elementos HTML se aplica una regla CSS, desde los más sencillos (una etiqueta) hasta los más precisos (una combinación de atributos y posición en el árbol del documento).

## Selectores básicos

```css
h1 { }             /* tous les éléments <h1> */
.carte { }          /* tous les éléments avec class="carte" */
#en-tete { }          /* l'unique élément avec id="en-tete" */
* { }                   /* absolument tous les éléments */
```

> **Nota:** una «`class`» puede reutilizarse en varios elementos, mientras que un «`id`» debe ser **único** en toda la página; por lo tanto, un selector «`#id`» siempre se aplica a un único elemento concreto, a diferencia de «`.classe`».

## Combinadores

```css
article p { }        /* tout <p> descendant de <article>, à N'IMPORTE quelle profondeur */
article > p { }        /* tout <p> ENFANT DIRECT de <article>, pas plus profond */
h2 + p { }               /* le <p> immédiatement APRÈS un <h2>, au même niveau */
h2 ~ p { }                /* TOUS les <p> qui suivent un <h2>, au même niveau */
```

## Seleccionadores de atributos

```css
input[type="email"] { }         /* tout <input> avec cet attribut ET cette valeur exacte */
a[href^="https"] { }              /* href qui COMMENCE par "https" */
a[href$=".pdf"] { }                 /* href qui SE TERMINE par ".pdf" */
a[href*="exemple"] { }                /* href qui CONTIENT "exemple" n'importe où */
```

## Pseudoclases: cómo identificar un estado

```css
a:hover { }          /* quand la souris survole l'élément */
input:focus { }        /* quand le champ a le focus (clic ou tabulation) */
li:first-child { }       /* le premier enfant de son parent */
li:last-child { }          /* le dernier enfant de son parent */
li:nth-child(2) { }          /* le 2e enfant précisément */
li:nth-child(odd) { }          /* tous les enfants impairs (1er, 3e, 5e...) */
input:disabled { }               /* un champ désactivé */
input:required { }                 /* un champ marqué "required" en HTML (cf. chapitre formulaires) */
```

## Pseudoelementos: seleccionar una parte de un elemento

```css
p::first-line { }     /* uniquement la première ligne affichée du paragraphe */
p::before { content: "→ "; }  /* insère du contenu AVANT le texte réel du paragraphe */
p::after { content: " ✓"; }    /* insère du contenu APRÈS */
```

> **Nota:** `::before` / `::after` requieren que la propiedad `content` esté definida para que sean visibles (aunque esté vacía, `content: "";`); se utilizan mucho para añadir un elemento puramente decorativo (icono, flecha...) sin sobrecargar el código HTML con una etiqueta adicional sin significado semántico real (véase el capítulo sobre la semántica de HTML5).

## La particularidad: ¿qué ocurre en caso de conflicto?

```css
p { color: blue; }
.texte-important { color: red; }
#paragraphe-unique { color: green; }
```

```html
<p id="paragraphe-unique" class="texte-important">Quelle couleur ?</p>
```

Un «`id`» tiene una especificidad mayor que una «`class`», que a su vez es mayor que un selector de etiqueta; por lo tanto, el párrafo se mostrará en **verde** (prevalece «`#paragraphe-unique`»), independientemente del orden en que estén escritas las reglas en el archivo.

| Tipo de selector | Ponderación (de menor a mayor) |
|---|---|
| Selector universal (`*`) | El más bajo |
| Etiquetas (`p`, `div`...) | Baja |
| Clase (`.carte`), atributo (`[type=...]`), pseudoclase (`:hover`) | Medio |
| `id` (`#en-tete`) | Fort |
| Estilo en línea (`style="..."`) | Muy intenso |
| `!important` | Anula todo lo demás (a evitar; véase el capítulo sobre la cascada) |

Véase también el capítulo sobre la cascada, que detalla con precisión el orden de resolución entre la especificidad, el orden de escritura y el origen de la regla.
