---
order: 7
---

# Atributos data-* y accesibilidad (ARIA)

Este capítulo cubre dos familias de atributos transversales, utilizables en casi cualquier etiqueta: los atributos `data-*` (almacenar un dato personalizado) y los atributos `aria-*` (mejorar la accesibilidad más allá de lo que permite la sola semántica HTML5).

## Los atributos `data-*`

```html
<div data-id="42" data-role="tarjeta-producto" data-en-existencia="true">
    Silla de madera
</div>
```

```javascript
const tarjeta = document.querySelector("div");
tarjeta.dataset.id;            // "42"
tarjeta.dataset.role;          // "tarjeta-producto"
tarjeta.dataset.enExistencia;  // "true" -> "data-en-existencia" se convierte en "enExistencia" en camelCase del lado de JS
```

`data-*` permite asociar un dato a un elemento HTML, recuperable en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) mediante `.dataset`: una forma estándar de hacer circular información del HTML hacia el JavaScript, sin necesidad de variables globales ni de peticiones adicionales.

> **Nota:** cualquier nombre después de `data-` es válido (`data-cualquier-cosa`); la única regla es la conversión automática de **kebab-case** (palabras separadas por guiones, `data-en-existencia`) a **camelCase** (cada palabra siguiente pegada y con mayúscula inicial, `enExistencia`) en JavaScript, una simple convención de nomenclatura, no un mecanismo propio de `data-*`.

## La accesibilidad: por qué importa

La accesibilidad web garantiza que una página siga siendo utilizable por personas en situación de discapacidad (discapacidad visual con un lector de pantalla, discapacidad motriz navegando únicamente con el teclado...); no es una opción secundaria, sino un requisito legal en muchos contextos (especialmente en sitios públicos), y una buena práctica general de calidad de código.

## `alt` y semántica: los fundamentos ya vistos

Gran parte de la accesibilidad se deriva directamente de los capítulos anteriores: `alt` en las imágenes, `<label>` en los campos de formulario, jerarquía correcta de los títulos, etiquetas semánticas HTML5 en lugar de `<div>` genéricas.

## ARIA: completar cuando la sola semántica HTML no basta

**ARIA** (*Accessible Rich Internet Applications*) añade información de accesibilidad para componentes que el HTML nativo no describe de forma nativa (una pestaña personalizada, una ventana modal...):

```html
<button aria-label="Cerrar la ventana">✕</button>
```

`aria-label` proporciona un texto alternativo para un lector de pantalla, cuando el contenido visible por sí solo (aquí, solo un símbolo `✕`) no basta para comprender su rol.

```html
<div role="alert">Tu sesión va a caducar en 2 minutos.</div>
```

`role="alert"` hace que un lector de pantalla anuncie inmediatamente este contenido en cuanto aparece, sin esperar a que el usuario navegue hasta él: útil para un mensaje de error o una notificación urgente que aparece de forma dinámica.

```html
<button aria-expanded="false" aria-controls="menu-movil">Menú</button>
<nav id="menu-movil" hidden>...</nav>
```

`aria-expanded` indica si un elemento controlado (a menudo mediante JavaScript) está actualmente abierto o cerrado; un lector de pantalla anuncia este estado, invisible de otro modo para alguien que no percibe el cambio visual.

> **Regla de oro de ARIA:** "*No ARIA is better than bad ARIA*": usar ARIA solo para suplir una carencia real de la semántica HTML nativa, nunca como sustituto de una etiqueta HTML que ya haría el trabajo correctamente. Un `<button>` nativo ya gestiona de forma nativa el foco de teclado y el anuncio de su rol; recrear este comportamiento a mano con un `<div role="button">` es casi siempre un retroceso, salvo necesidad absoluta.

## Navegación con el teclado

```html
<button class="boton-personalizado">Botón personalizado</button>
```

Un `<button>` nativo ya gestiona la accesibilidad por teclado (foco mediante Tab, activación mediante Intro/Espacio) y el anuncio de su rol por parte de un lector de pantalla: por eso la "regla de oro" anterior recomienda partir de un `<button>` real, restilizado en [CSS](/?c=langages-de-balisage&s=css&p=css) si hace falta, en lugar de recrear un botón a partir de una `<div>`.

Si un caso concreto impide realmente usar un `<button>` nativo, recrear su comportamiento exige más que solo `tabindex`/`role`:

```html
<div tabindex="0" role="button" id="mi-boton">Botón personalizado</div>
```

```javascript
const boton = document.getElementById("mi-boton");
boton.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        boton.click();   // provoca el mismo comportamiento que un clic
    }
});
```

`tabindex="0"` hace que el elemento sea enfocable mediante Tab y `role="button"` anuncia su rol a un lector de pantalla, pero **ninguno de los dos desencadena la activación por teclado** (Intro/Espacio); a diferencia de un `<button>` real, que lo hace de forma nativa. Sin este manejador `keydown` explícito, el elemento seguiría siendo enfocable pero inutilizable con el teclado: exactamente la trampa que la regla de oro de ARIA busca evitar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `data-*` asocia un dato personalizado a un elemento, recuperable en JavaScript mediante `.dataset`. `aria-*` completa la accesibilidad cuando la semántica HTML nativa no basta (componentes personalizados). |
| **Herramientas utilizables** | `.dataset` en JavaScript; `aria-label`, `role`, `aria-expanded`. |
| **Trampas a evitar** | Recrear un `<div role="button">` sin gestionar uno mismo el foco de teclado y la activación (Intro/Espacio); un `<button>` real hace todo esto de forma nativa. |
| **Buenas prácticas** | "No ARIA is better than bad ARIA": usar ARIA solo para suplir una carencia real, nunca como sustituto de una etiqueta HTML nativa que ya haría el trabajo. |
