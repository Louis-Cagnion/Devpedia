---
order: 11
---

# Los HTMLElements

Un `HTMLElement` es la representación en JavaScript de una etiqueta [HTML](/?c=langages-de-balisage&s=html&p=html) en el DOM. Cada etiqueta (`<div>`, `<p>`, `<a>`...) se convierte en un objeto `HTMLElement` accesible y manipulable desde JavaScript.

```javascript
const div = document.querySelector('div');
// div es ahora un objeto HTMLElement
```

## Crear e insertar elementos

| Método | Efecto |
|---|---|
| `document.createElement(etiqueta)` | Crea un nuevo elemento, sin insertarlo en la página |
| `padre.append(...)` | Inserta uno o varios elementos (o textos) al **final** del contenido del padre |
| `padre.prepend(...)` | Inserta uno o varios elementos (o textos) al **principio** del contenido del padre |
| `elemento.insertAdjacentHTML(posicion, html)` | Inserta HTML sin procesar en una posición precisa, sin sobrescribir el contenido existente |
| `elemento.remove()` | Elimina el elemento del DOM |
| `elemento.replaceWith(...)` | Sustituye el elemento por uno o varios otros |

```javascript
const p = document.createElement('p');
document.body.append(p);
document.body.append('texto sin formato', p, otroElemento);

padre.prepend(p);

elemento.insertAdjacentHTML('beforebegin', "<p>antes del elemento</p>");
elemento.insertAdjacentHTML('afterbegin',  "<p>al principio del contenido</p>");
elemento.insertAdjacentHTML('beforeend',   "<p>al final del contenido</p>");
elemento.insertAdjacentHTML('afterend',    "<p>después del elemento</p>");

p.remove();
p.replaceWith(otroElemento);
```

> **Trampa (seguridad):** al igual que `innerHTML` (véase más abajo), `insertAdjacentHTML` interpreta su argumento como HTML: insertarle un dato proveniente del usuario sin haberlo escapado abre una vulnerabilidad XSS (véase [La seguridad](/?c=langages-de-programmation&s=php&p=securite), mismo principio).
>
> **Buena práctica:** nunca pasar un dato de usuario sin escapar a `insertAdjacentHTML`/`innerHTML`; usar `createElement` + `textContent` cuando el contenido proviene del usuario.

## Acceder a los elementos existentes

| Método | Devuelve |
|---|---|
| `document.querySelector(selector)` | El primer elemento que coincide con el selector [CSS](/?c=langages-de-balisage&s=css&p=css), o `null` |
| `document.querySelectorAll(selector)` | Todos los elementos coincidentes, en forma de `NodeList` (fija) |
| `document.getElementById(id)` | El elemento con ese id (alternativa más antigua, menos flexible) |
| `document.getElementsByClassName(clase)` | Los elementos con esa clase, en forma de `HTMLCollection` (**en vivo**) |
| `document.getElementsByTagName(etiqueta)` | Los elementos de ese tipo de etiqueta, en forma de `HTMLCollection` (**en vivo**) |

```javascript
const titulo = document.querySelector('h1');
const enlace = document.querySelector('#mi-id a');

const parrafos = document.querySelectorAll('p');
parrafos.forEach(p => console.log(p.textContent));
```

> **Trampa:** una `HTMLCollection` (devuelta por `getElementsByClassName`/`getElementsByTagName`) está **en vivo**: se actualiza automáticamente si el DOM cambia, a diferencia de la `NodeList` devuelta por `querySelectorAll` (fija en el momento de la llamada). Modificar el DOM (añadir/quitar elementos coincidentes) **mientras** se recorre una colección en vivo puede entonces saltar o repasar elementos de forma inesperada.
>
> **Buena práctica:** preferir `querySelectorAll` en cuanto se prevea modificar la página durante el recorrido de la colección.

## Los atributos

| Método | Efecto |
|---|---|
| `elemento.setAttribute(nombre, valor)` | Añade o modifica un atributo |
| `elemento.getAttribute(nombre)` | Devuelve el valor de un atributo, o `null` si no existe |
| `elemento.removeAttribute(nombre)` | Elimina un atributo |
| `elemento.hasAttribute(nombre)` | Comprueba la existencia de un atributo (`true`/`false`) |

```javascript
elemento.setAttribute('class', 'mi-clase');
elemento.setAttribute('href', 'https://example.com');

elemento.getAttribute('class');   // 'mi-clase'
elemento.hasAttribute('class');   // true

elemento.removeAttribute('class');
```

## Las clases CSS

**`classList`** es un objeto dedicado a la gestión de las clases CSS de un elemento, más fiable que `className` para manipular las clases individualmente.

```javascript
elemento.classList.add('nueva-clase');          // añade
elemento.classList.remove('clase-antigua');      // elimina
elemento.classList.toggle('activo');             // añade si falta, elimina si está presente
elemento.classList.contains('mi-clase');         // true o false
elemento.classList.replace('antigua', 'nueva');  // reemplaza
```

**`className`** da acceso a todas las clases en forma de cadena. Debe usarse con precaución: asignarla sustituye **todas** las clases existentes.
```javascript
elemento.className;              // 'clase1 clase2'
elemento.className = 'nueva';    // ⚠️ sobrescribe todo
```

## El contenido

| Propiedad | Contenido | Asignación |
|---|---|---|
| `textContent` | El texto del elemento, etiquetas hijas ignoradas | Sustituye todo por texto sin formato; cualquier etiqueta HTML proporcionada se escapa, nunca se interpreta |
| `innerHTML` | El HTML interno del elemento, en forma de cadena | Sustituye todo **e interpreta** las etiquetas HTML proporcionadas |

```javascript
elemento.textContent;                // 'Mi texto'
elemento.textContent = 'Nuevo';      // sustituye todo el contenido por texto

elemento.innerHTML;                        // '<strong>Mi texto</strong>'
elemento.innerHTML = '<em>Nuevo</em>';     // sobrescribe todo, interpreta el HTML
```

> **Trampa (seguridad):** asignar a `innerHTML` un dato proveniente del usuario (no fiable) es una vulnerabilidad XSS clásica: el contenido se interpreta como HTML/JavaScript ejecutable real, no como texto.
>
> **Buena práctica:** preferir `textContent` a `innerHTML` en cuanto el contenido esperado sea texto sin formato; sigue siendo seguro por defecto, ya que nunca interpreta su contenido.

## El estilo

`style` da acceso a los estilos inline del elemento. Las propiedades CSS se escriben en **camelCase** (sin guion):

```javascript
elemento.style.color = 'red';
elemento.style.backgroundColor = 'blue';        // background-color en CSS
elemento.style.fontSize = '1.2rem';             // font-size en CSS
elemento.style.borderLeft = '2px solid grey';   // border-left en CSS
```

## Navegar por el DOM

A partir de un elemento, se puede acceder a sus vecinos y a su jerarquía:

| Propiedad | Devuelve |
|---|---|
| `parentElement` | El elemento padre directo |
| `children` | Los elementos hijos directos (no los nodos de texto), en forma de `HTMLCollection` |
| `firstElementChild` / `lastElementChild` | El primer / último elemento hijo |
| `nextElementSibling` / `previousElementSibling` | El hermano siguiente / anterior |

```javascript
elemento.parentElement;

elemento.children;         // [div, p, span...]
elemento.children[0];      // primer hijo

elemento.firstElementChild;
elemento.nextElementSibling;
```

## Comprobar el tipo de un elemento

```javascript
elemento.tagName;   // 'DIV', 'P', 'SPAN'... -> el nombre de la etiqueta, en mayúsculas

elemento instanceof HTMLAnchorElement;   // true si es un <a>
elemento instanceof HTMLImageElement;    // true si es un <img>
```

`tagName` devuelve una simple cadena; `instanceof` comprueba directamente la pertenencia a una interfaz DOM precisa.

## Dimensiones y posición

| Propiedad | Devuelve |
|---|---|
| `getBoundingClientRect()` | Un objeto `{ width, height, top, left, ... }`: tamaño y posición respecto a la ventana |
| `offsetWidth` / `offsetHeight` | Tamaño del elemento (contenido + padding + borde) |

```javascript
const rect = elemento.getBoundingClientRect();
rect.width;   // ancho
rect.top;     // distancia desde la parte superior de la ventana

elemento.offsetWidth;
```

## Recursos

- [MDN (*Mozilla Developer Network*, la documentación de referencia de la web): HTMLElement](https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
- [MDN: Document.querySelector](https://developer.mozilla.org/fr/docs/Web/API/Document/querySelector)
- [MDN: Element.classList](https://developer.mozilla.org/fr/docs/Web/API/Element/classList)
- [MDN: Element.setAttribute](https://developer.mozilla.org/fr/docs/Web/API/Element/setAttribute)
- [MDN: insertAdjacentHTML](https://developer.mozilla.org/fr/docs/Web/API/Element/insertAdjacentHTML)

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un `HTMLElement` representa una etiqueta HTML manipulable en JavaScript: crearla (`createElement`), seleccionarla (`querySelector`), modificar su contenido (`textContent`/`innerHTML`), sus atributos, sus clases o su estilo. |
| **Herramientas utilizables** | `querySelector`/`querySelectorAll`, `classList`, `setAttribute`/`getAttribute`, `getBoundingClientRect`. |
| **Trampas a evitar** | Asignar un dato de usuario sin escapar a `innerHTML`/`insertAdjacentHTML` (vulnerabilidad XSS); modificar una `HTMLCollection` en vivo mientras se recorre. |
| **Buenas prácticas** | Preferir `textContent` a `innerHTML` en cuanto el contenido sea texto sin formato; preferir `querySelectorAll` (fija) a `getElementsByClassName`/`getElementsByTagName` (en vivo) si el DOM se modifica durante el recorrido. |
