---
order: 2
---

# Variables CSS y la cascada

Este capítulo aborda dos mecanismos transversales de CSS: las **variables personalizadas** (reutilizar un valor en varios lugares) y la **cascada** (cómo resuelve CSS un conflicto entre varias reglas que se aplican al mismo elemento): la "C" de CSS (*Cascading*) hace referencia directa a este segundo mecanismo.

## Las variables CSS (propiedades personalizadas)

```css
:root {
    --color-primario: #3366cc;
    --espaciado-estandar: 16px;
}

.boton {
    background-color: var(--color-primario);
    padding: var(--espaciado-estandar);
}
```

`:root` identifica el elemento raíz del documento (`<html>`): declarar las variables ahí las hace accesibles **en cualquier parte** de la hoja de estilo. Cambiar una sola vez `--color-primario` actualiza al instante todos los lugares que la utilizan, sin necesidad de "buscar y reemplazar" en todo el archivo.

```css
.boton {
    background-color: var(--color-primario, blue);   /* "blue": valor de respaldo si la variable no existe */
}
```

## Variables locales a un componente

```css
.tarjeta {
    --margen-interno: 20px;
    padding: var(--margen-interno);
}

.tarjeta.compacta {
    --margen-interno: 8px;   /* redefine la variable ÚNICAMENTE para los elementos con esta clase adicional */
}
```

> **Nota:** a diferencia de una variable [Sass](https://sass-lang.com)/[Less](https://lesscss.org) (resueltas de una vez por todas en la compilación), una variable CSS nativa está **viva** en el navegador: modificable incluso en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`elemento.style.setProperty('--margen-interno', '30px')`), y reevaluada dinámicamente según el elemento en el que se consulta.

## `color-mix()`: derivar un color a partir de una variable, sin declarar una nueva

```css
.boton-peligro:hover {
    background-color: color-mix(in srgb, var(--color-peligro) 85%, black);
    /* mezcla 85% de --color-peligro con negro: una version ligeramente oscurecida, al pasar el cursor */
}
```

`color-mix(in <espacio-de-color>, color1 porcentaje1, color2)` mezcla dos colores en el espacio de color indicado (`srgb` es el más común), sin tener que calcular ni declarar una nueva variable dedicada para cada variante (hover, deshabilitado, un fondo ligeramente teñido...).

| | Sin `color-mix()` | Con `color-mix()` |
|---|---|---|
| Una variante más oscura al pasar el cursor | Calcular/declarar una segunda variable (`--color-peligro-hover`) | `color-mix(in srgb, var(--color-peligro) 85%, black)` |
| Un fondo ligeramente teñido | Una tercera variable dedicada, o un color `rgba()` fijo | `color-mix(in srgb, var(--color-peligro) 10%, transparent)` |

> **Buena práctica:** usar `color-mix()` para cualquier variante puntual de un color ya declarado como variable (más claro, más oscuro, más transparente), en lugar de multiplicar variables dedicadas para cada pequeña variación.

## Leer una variable CSS desde JavaScript

La escritura de arriba (`setProperty`) tiene su inversa, la **lectura**: útil para que un renderizado que no entiende CSS (dibujo en un `<canvas>`, gráfico en SVG generado en JavaScript) siga sincronizado con los colores declarados en la hoja de estilos, sin duplicarlos a mano en el código JS.

```javascript
const colorPrimario = getComputedStyle(document.documentElement)
    .getPropertyValue("--couleur-primaire")   // "#3366cc" (cadena bruta, espacios incluidos)
    .trim();

console.log(colorPrimario || "#000000");      // valor de repliegue si la variable no existe
```

`getComputedStyle(elemento)` devuelve el estilo **final** aplicado a ese elemento una vez resuelta la cascada (ver sección siguiente), como un objeto consultable mediante `getPropertyValue()`. A diferencia de `var(--nombre, repliegue)` en CSS, `getPropertyValue()` no tiene un valor de repliegue integrado: devuelve una cadena vacía si la variable no existe, a gestionar uno mismo (`|| "#000000"` arriba).

> **Trampa:** `getPropertyValue()` siempre devuelve una cadena bruta, con los espacios originales incluidos (`" #3366cc"` por ejemplo): `.trim()` evita comparaciones o concatenaciones que fallen en silencio por un espacio invisible.

## La cascada: tres criterios, en este orden

Ante varias reglas que se aplican al mismo elemento y a la misma propiedad, CSS las resuelve en este orden preciso:

### 1. La importancia (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignorado: la regla de arriba tiene !important */
```

`!important` cortocircuita todo el resto de la cascada: una regla con `!important` gana, sea cual sea su especificidad o su orden de escritura.

> **Buena práctica:** evitar `!important` en el uso habitual: dificulta la depuración (imposible de sobrescribir de forma sencilla) y rompe la lógica natural de la cascada. Debe reservarse para casos muy excepcionales (a menudo para sobrescribir un estilo de terceros que no se controla).

### 2. La especificidad (véase [Los selectores](/?c=langages-de-balisage&s=css&p=selecteurs))

```css
#boton-principal { color: blue; }  /* especificidad: id -> más fuerte */
.boton { color: red; }             /* especificidad: clase -> más débil */
```

Gana el selector más específico, independientemente del orden de escritura en el archivo.

### 3. El orden de aparición (a igualdad de especificidad)

```css
.boton { color: blue; }
.boton { color: red; }   /* GANA: misma especificidad, pero escrita en último lugar */
```

A especificidad estrictamente igual, gana la regla declarada **en último lugar** en el archivo (o en el último archivo cargado).

## La herencia: algunas propiedades se transmiten, otras no

```css
body {
    color: #333;         /* HEREDADO: todos los descendientes (p, span, li...) adoptan este color de texto */
    border: 1px solid;   /* NO heredado: cada elemento tiene su propio borde, o ninguno */
}
```

Las propiedades relacionadas con el **texto** (`color`, `font-family`, `font-size`, `line-height`...) suelen heredarse por defecto; las propiedades relacionadas con la **caja** (`border`, `margin`, `padding`, `background`...) nunca se heredan: es un mecanismo distinto de la cascada, aunque interactúa con ella (una regla heredada tiene la especificidad más baja posible, fácilmente sobrescrita por cualquier regla aplicada directamente al elemento).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Las variables CSS (`--nombre`, leídas mediante `var()`) evitan repetir un valor. Ante un conflicto entre reglas, la cascada decide en este orden: `!important` > especificidad > orden de escritura. La herencia (texto sí, caja no) es un mecanismo distinto que interactúa con la cascada. |
| **Herramientas utilizables** | `:root` para variables globales, `var(--nombre, valor-de-respaldo)`, `color-mix(in srgb, ...)` para derivar una variante de color, `elemento.style.setProperty()` para modificarlas en JavaScript, `getComputedStyle().getPropertyValue()` para leerlas. |
| **Trampas a evitar** | Abusar de `!important`: cortocircuita toda la cascada y dificulta sobrescribir el estilo después. Olvidar `.trim()` tras `getPropertyValue()`: la cadena devuelta conserva sus espacios originales. |
| **Buenas prácticas** | Reservar `!important` para casos excepcionales (sobrescribir un estilo de terceros que no se controla); definir los colores/espaciados recurrentes como variables en `:root` en lugar de repetirlos; leer esas variables desde JS en lugar de duplicar los colores a mano, para que un renderizado Canvas/SVG siga sincronizado con la hoja de estilos. |
