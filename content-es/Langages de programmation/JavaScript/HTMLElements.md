---
order: 10
---

# Los elementos HTML

Un «`HTMLElement`» es la representación en JavaScript de una etiqueta HTML en el DOM. Cada etiqueta (`<div>`, `<p>`, `<a>`...) se convierte en un objeto `HTMLElement` al que se puede acceder y manipular mediante JavaScript.

```javascript
const div = document.querySelector('div');
// «div» es ahora un objeto HTMLElement
```

---

## Crear e insertar elementos

**`document.createElement`** Crea un nuevo elemento HTML sin insertarlo en la página.
```javascript
const p = document.createElement('p');
```

**`append`** Inserta uno o varios elementos (o textos) al final del contenido de un elemento padre.
```javascript
document.body.append(p);
document.body.append('texte brut', p, autreElement);
```

**`prepend`** Inserta uno o varios elementos (o textos) al **principio** del contenido de un elemento padre.
```javascript
parent.prepend(p);
parent.prepend('texte brut', p, autreElement);
```

**`insertAdjacentHTML`** Inserta código HTML sin formato en una posición concreta alrededor de un elemento, sin sobrescribir el contenido existente.
```javascript
elemento.insertAdjacentHTML('beforebegin', "<p>avant l'élément</p>");
elemento.insertAdjacentHTML('afterbegin',  "<p>au début du contenu</p>");
elemento.insertAdjacentHTML('beforeend',   "<p>à la fin du contenu</p>");
elemento.insertAdjacentHTML('afterend',    "<p>après l'élément</p>");
```

> **Nota (seguridad):** al igual que `innerHTML` (véase más abajo), `insertAdjacentHTML` interpreta su argumento como HTML; nunca se debe insertar en él ningún dato procedente del usuario sin haberlo escapado previamente, ya que, de lo contrario, se produciría una vulnerabilidad XSS (véase el capítulo sobre seguridad en PHP; se aplica el mismo principio).

**`remove`** Elimina el elemento del DOM.
```javascript
p.remove();
```

**`replaceWith`** Sustituye el elemento por uno o varios elementos distintos.
```javascript
p.replaceWith(autreElement);
```

---

## Acceder a los elementos existentes

**`querySelector`** Devuelve el primer elemento que coincida con el selector CSS indicado, o `null` si no existe.
```javascript
const título = document.querySelector('h1');
const div = document.querySelector('.ma-classe');
const lien = document.querySelector('#mon-id a');
```

**`querySelectorAll`** Devuelve todos los elementos correspondientes en forma de «`NodeList`» (similar a una matriz).
```javascript
const paragraphes = document.querySelectorAll('p');
paragraphes.forEach(p => console.log(p.textContent));
```

**`getElementById`**, **`getElementsByClassName`** y **`getElementsByTagName`** son alternativas más antiguas y menos flexibles que `querySelector`.
```javascript
document.getElementById('mon-id');
document.getElementsByClassName('ma-classe'); // HTMLCollection (en vivo)
document.getElementsByTagName('p');           // HTMLCollection (en vivo)
```

> **Nota:** una `HTMLCollection` (devuelta por `getElementsByClassName` / `getElementsByTagName`) está **en tiempo real**: se actualiza automáticamente si cambia el DOM, a diferencia de la `NodeList` devuelta por `querySelectorAll` (congelada en el momento de la llamada). Modificar el DOM (añadir o eliminar los elementos correspondientes) **mientras** se recorre una colección en tiempo real puede, por lo tanto, hacer que se salte o se vuelva a pasar por algunos elementos de forma inesperada —una buena razón para preferir `querySelectorAll` siempre que se prevea modificar la página durante el recorrido.

---

## Los atributos

**`setAttribute`** Añade o modifica un atributo.
```javascript
elemento.setAttribute('class', 'ma-classe');
elemento.setAttribute('href', 'https://example.com');
```

**`getAttribute`** Devuelve el valor de un atributo o «`null`» si no existe.
```javascript
elemento.getAttribute('class'); // «mi-clase»
```

**`removeAttribute`** Elimina un atributo.
```javascript
elemento.removeAttribute('class');
```

**`hasAttribute`** Comprueba si un atributo existe en el elemento.
```javascript
elemento.hasAttribute('class'); // true o false
```

---

## Las clases CSS

**`classList`** Es un objeto dedicado a la gestión de las clases CSS de un elemento, más fiable que `className` a la hora de manipular las clases de forma individual.

```javascript
elemento.classList.add('nouvelle-classe');       // añade
elemento.classList.remove('ancienne-classe');    // elimina
elemento.classList.toggle('active');             // Añadir si no está, eliminar si está.
elemento.classList.contains('ma-classe');        // true o false
elemento.classList.replace('ancienne', 'nouvelle'); // sustituye a
```

**`className`** Da acceso a todas las clases en forma de cadena. Se debe utilizar con precaución: al asignarla, se sustituyen **todas** las clases existentes.
```javascript
elemento.className;               // 'clase1 clase2'
elemento.className = 'nouvelle';  // ⚠️ Sobrescribe todo
```

---

## Contenido

**`textContent`** Accede al contenido textual de un elemento (se ignoran todas las etiquetas secundarias). Al asignar un valor, se sustituye todo el contenido por texto sin formato: las etiquetas HTML que puedan estar presentes se escapan y se muestran tal cual, sin interpretarse en ningún momento.
```javascript
elemento.textContent;              // «Mi texto»
elemento.textContent = 'Nouveau';  // sustituye todo el contenido por texto
```

**`innerHTML`** Accede al contenido HTML interno del elemento en forma de cadena. Al asignarle un valor, **se sustituye** todo el contenido existente y se interpretan las etiquetas HTML.
```javascript
elemento.innerHTML;                        // '<strong>Mi texto</strong>'
elemento.innerHTML = '<em>Nouveau</em>';   // ⚠️ sobrescribe todo, interpreta el HTML
```

> **Nota (seguridad):** asignar a `innerHTML` un dato procedente del usuario (no fiable) constituye una vulnerabilidad XSS clásica: el contenido se interpreta como HTML/JavaScript ejecutable real, no como texto. `textContent` (arriba) sigue siendo seguro por defecto, ya que nunca interpreta su contenido.

---

## El estilo

**`style`** Permite acceder a los estilos inline del elemento. Las propiedades CSS se escriben en **camelCase** (sin guiones).
```javascript
elemento.style.color = 'red';
elemento.style.backgroundColor = 'blue';  // «background-color» en CSS
elemento.style.fontSize = '1.2rem';       // El tamaño de fuente en CSS
elemento.style.borderLeft = '2px solid grey'; // border-left en CSS
```

---

## Navegar por el DOM

A partir de un elemento, se puede acceder a sus elementos vecinos y a su jerarquía.

**`parentElement`** Devuelve el elemento padre directo.
```javascript
elemento.parentElement;
```

**`children`** Devuelve los elementos hijos directos (excepto los nodos de texto) en forma de `HTMLCollection`.
```javascript
elemento.children;       // [div, p, span...]
elemento.children[0];    // primer hijo
```

**`firstElementChild`** y **`lastElementChild`** devuelven el primer y el último elemento secundario.
```javascript
elemento.firstElementChild;
elemento.lastElementChild;
```

**`nextElementSibling`** y **`previousElementSibling`** devuelven el siguiente o el anterior hermano.
```javascript
elemento.nextElementSibling;
elemento.previousElementSibling;
```

---

## Comprobar el tipo de un elemento

**`tagName`** Devuelve el nombre de la etiqueta en mayúsculas.
```javascript
elemento.tagName; // «DIV», «P», «SPAN»...
```

**`instanceof`** Comprueba si el elemento pertenece a una interfaz DOM concreta.
```javascript
elemento instanceof HTMLAnchorElement;  // true si se trata de un <a>
elemento instanceof HTMLImageElement;   // true si se trata de un <img>
```

---

## Dimensiones y posición

**`getBoundingClientRect`** Devuelve el tamaño y la posición del elemento con respecto a la ventana.
```javascript
const rect = elemento.getBoundingClientRect();
rect.width;   // anchura
rect.height;  // altura
rect.top;     // distancia desde la parte superior de la ventana
rect.left;    // distancia desde el margen izquierdo de la ventana
```

**`offsetWidth`** y **`offsetHeight`** devuelven el tamaño del elemento (contenido + relleno + borde).
```javascript
elemento.offsetWidth;
elemento.offsetHeight;
```

---

## Recursos

- [MDN — HTMLElement](https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
- [MDN — Document.querySelector](https://developer.mozilla.org/fr/docs/Web/API/Document/querySelector)
- [MDN — Element.classList](https://developer.mozilla.org/fr/docs/Web/API/Element/classList)
- [MDN — Element.setAttribute](https://developer.mozilla.org/fr/docs/Web/API/Element/setAttribute)
- [MDN — insertAdjacentHTML](https://developer.mozilla.org/fr/docs/Web/API/Element/insertAdjacentHTML)
