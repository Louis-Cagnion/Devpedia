---
order: 7
---

# Atributos «data-*» y accesibilidad (ARIA)

Este capítulo aborda dos familias de atributos transversales, que pueden utilizarse en casi cualquier etiqueta: los atributos «`data-*`» (para almacenar datos personalizados) y los atributos «`aria-*`» (para mejorar la accesibilidad más allá de lo que permite únicamente la semántica HTML5).

## Los atributos`data-*`

```html
<div data-id="42" data-role="carte-produit" data-en-stock="true">
    Chaise en bois
</div>
```

```javascript
const carte = document.querySelector("div");
carte.dataset.id;         // «42»
carte.dataset.role;         // «ficha de producto»
carte.dataset.enStock;       // «true» -> «data-en-stock» se convierte en «enStock» en camelCase en el lado de JS
```

`data-*` Permite asociar un dato a un elemento HTML, que se puede recuperar en JavaScript mediante `.dataset`: un método estándar para hacer circular información del HTML al JavaScript, sin necesidad de variables globales ni consultas adicionales.

> **Nota:** cualquier nombre que siga a `data-` es válido (`data-nimporte-quoi`); la única regla es la conversión automática de «kebab-case» (`data-en-stock`) a «camelCase» (`enStock`) en JavaScript (véase el capítulo sobre variables, apartado JavaScript, para conocer esta convención de nomenclatura).

## La accesibilidad: por qué es importante

La accesibilidad web garantiza que una página siga siendo utilizable por personas con discapacidad (discapacidad visual con un lector de pantalla, discapacidad motora al navegar únicamente con el teclado...) — no es una opción secundaria, sino un requisito legal en muchos contextos (especialmente en sitios web públicos) y una buena práctica general para garantizar la calidad del código.

## `alt` y semántica: los fundamentos ya vistos

Gran parte de la accesibilidad se deriva directamente de los capítulos anteriores: `alt` sobre las imágenes, `<label>` sobre los campos de formulario, jerarquía correcta de los títulos, etiquetas semánticas HTML5 en lugar de etiquetas genéricas de tipo «`<div>`».

## ARIA: se utiliza cuando la semántica HTML por sí sola no es suficiente

**ARIA** (*Accessible Rich Internet Applications*) añade información de accesibilidad para componentes que el HTML nativo no describe de forma nativa (una pestaña personalizada, una ventana modal...):

```html
<button aria-label="Fermer la fenêtre">✕</button>
```

`aria-label` Proporciona un texto alternativo para un lector de pantalla, cuando el contenido visible por sí solo (en este caso, solo un símbolo `✕`) no basta para comprender su función.

```html
<div role="alert">Votre session va expirer dans 2 minutes.</div>
```

`role="alert"` hace que un lector de pantalla anuncie inmediatamente este contenido en cuanto aparece, sin esperar a que el usuario se desplace hasta él —útil para un mensaje de error o una notificación urgente que aparece de forma dinámica—.

```html
<button aria-expanded="false" aria-controls="menu-mobile">Menu</button>
<nav id="menu-mobile" hidden>...</nav>
```

`aria-expanded` Indica si un elemento controlado (a menudo mediante JavaScript) está actualmente abierto o cerrado; un lector de pantalla anuncia este estado, que de otro modo resultaría invisible para alguien que no perciba el cambio visual.

> **Regla de oro de ARIA:** «*Más vale no usar ARIA que usar ARIA mal*»: utiliza ARIA solo para subsanar una carencia real de la semántica HTML nativa, nunca como sustituto de una etiqueta HTML que ya cumpla su función correctamente. Un «`<button>`» nativo ya gestiona de forma nativa el foco del teclado y la indicación de su función; recrear este comportamiento manualmente con un «`<div role="button">`» supone casi siempre un retroceso, salvo que sea absolutamente necesario.

## Navegación con el teclado

```html
<button class="bouton-personnalise">Bouton personnalisé</button>
```

Un «`<button>`» nativo ya gestiona la accesibilidad mediante el teclado (foco mediante la tecla Tab, activación mediante Intro/Espacio) y la lectura de su función por parte de un lector de pantalla; por eso, la «regla de oro» anterior recomienda partir de un «`<button>`» auténtico, rediseñado con CSS si es necesario, en lugar de recrear un botón a partir de un `<div>`.

Si un caso concreto impide realmente utilizar un «`<button>`» nativo, recrear su comportamiento requiere algo más que solo `tabindex` / `role`:

```html
<div tabindex="0" role="button" id="mon-bouton">Bouton personnalisé</div>
```

```javascript
const bouton = document.getElementById("mon-bouton");
bouton.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter" || evenement.key === " ") {
        evenement.preventDefault();
        bouton.click();   // provoca el mismo comportamiento que un clic
    }
});
```

`tabindex="0"` Hace que el elemento sea seleccionable mediante las teclas Tab y `role="button"` e indica su función a un lector de pantalla, pero **ninguna de las dos opciones activa la selección mediante el teclado** (Intro/Espacio), a diferencia de un «`<button>`» auténtico, que lo hace de forma nativa. Sin este gestor «`keydown`» explícito, el elemento seguiría siendo seleccionable, pero inusable con el teclado: exactamente la trampa que la regla de oro de ARIA pretende evitar.
