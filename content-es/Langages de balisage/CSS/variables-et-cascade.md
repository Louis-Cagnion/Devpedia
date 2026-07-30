---
order: 2
---

# Variables CSS y la cascada

Este capítulo aborda dos mecanismos transversales de CSS: las **variables personalizadas** (reutilizar un valor en varios lugares) y la **cascada** (cómo resuelve CSS un conflicto entre varias reglas que se aplican al mismo elemento); la «C» de CSS (*Cascading*) hace referencia directa a este segundo mecanismo.

## Las variables CSS (propiedades personalizadas)

```css
:root {
    --couleur-primaire: #3366cc;
    --espacement-standard: 16px;
}

.bouton {
    background-color: var(--couleur-primaire);
    padding: var(--espacement-standard);
}
```

`:root` Se refiere al elemento raíz del documento (`<html>`): al declarar las variables allí, estas quedan accesibles **en cualquier** **parte** de la hoja de estilo. Basta con cambiar una sola vez `--couleur-primaire` para que se actualicen al instante todos los lugares donde se utiliza, sin necesidad de «buscar y sustituir» en todo el archivo.

```css
.bouton {
    background-color: var(--couleur-primaire, blue);   /* "blue" : valeur de secours si la variable n'existe pas */
}
```

## Variables locales de un componente

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    --marge-interne: 8px;   /* redéfinit la variable UNIQUEMENT pour les éléments avec cette classe supplémentaire */
}
```

> **Nota:** a diferencia de una variable Sass/Less (que se resuelve de una vez por todas durante la compilación), una variable CSS nativa está **activa** en el navegador —se puede modificar incluso en JavaScript (`elemento.style.setProperty('--marge-interne', '30px')`)— y se reevalúa dinámicamente en función del elemento en el que se consulta.

## La cascada: tres criterios, en este orden

Cuando hay varias reglas que se aplican al mismo elemento y a la misma propiedad, el CSS las resuelve en este orden concreto:

### 1. La importancia (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignoré : la règle du dessus a !important */
```

`!important` anula todo el resto de la cascada: una regla con «`!important`» tiene prioridad, independientemente de su especificidad o de su orden de escritura.

> **Buena práctica:** evitar el uso habitual de `!important`, ya que dificulta la depuración (es imposible sobreescribirlo fácilmente) y rompe la lógica natural de la cadena de control. Debe reservarse para casos muy excepcionales (a menudo para sobreescribir un estilo de terceros sobre el que no se tiene control).

### 2. La especificidad (véase el capítulo sobre los selectores)

```css
#bouton-principal { color: blue; }   /* spécificité : id -> plus fort */
.bouton { color: red; }                /* spécificité : classe -> plus faible */
```

Prevalece el selector más específico, independientemente del orden en que aparezcan en el archivo.

### 3. El orden de aparición (a igualdad de especificidad)

```css
.bouton { color: blue; }
.bouton { color: red; }   /* GAGNE : même spécificité, mais écrite en dernier */
```

En caso de coincidir exactamente las especificaciones, prevalecerá la regla declarada **en último lugar** en el archivo (o en el último archivo cargado).

## La herencia: algunas propiedades se transmiten, otras no

```css
body {
    color: #333;         /* HÉRITÉ : tous les descendants (p, span, li...) reprennent cette couleur de texte */
    border: 1px solid;      /* PAS hérité : chaque élément a sa propre bordure, ou aucune */
}
```

Las propiedades relacionadas con **el** **texto** (`color`, `font-family`, `font-size`, `line-height`...) suelen heredarse por defecto; las propiedades relacionadas con el **cuadro** (`border`, `margin`, `padding`, `background`...) nunca se heredan: se trata de un mecanismo distinto de la cascada, aunque interactúa con ella (una regla heredada tiene la especificidad más baja posible, y puede ser fácilmente anulada por cualquier regla aplicada directamente al elemento).
