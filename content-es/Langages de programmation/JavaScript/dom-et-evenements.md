---
order: 11
---

# El DOM y la gestión de eventos

El **DOM** (*Document Object Model*) es la representación en memoria de una página HTML, en forma de árbol de objetos que pueden manipularse mediante JavaScript: cada etiqueta se convierte en un nodo de este árbol, con sus propias propiedades y métodos.

## Seleccionar elementos

```javascript
document.getElementById("titre");           // un elemento concreto, mediante su ID
document.querySelector(".carte");            // el PRIMER elemento que coincida con este selector CSS
document.querySelectorAll(".carte");          // TODOS los elementos correspondientes (NodeList)
```

> **Nota:** `querySelector` / `querySelectorAll` admiten cualquier selector CSS (véase el capítulo correspondiente): `.classe`, `#id`, `div > p`, `[data-role="bouton"]`... Es el método más flexible.

## Modificar un elemento

```javascript
const título = document.querySelector("h1");

título.textContent = "Nouveau titre";     // sustituye el texto (escapa automáticamente el HTML)
título.innerHTML = "<em>Titre</em>";       // Inserta código HTML sin formato -> PELIGRO si la fuente no es fiable (XSS)
título.style.color = "red";                  // modifica un estilo CSS directamente
título.classList.add("actif");                // Añade una clase CSS
título.classList.remove("actif");
título.classList.toggle("actif");              // Añádela si no está, elimínala si está.
título.setAttribute("data-id", "42");
```

> **Nota:** «`innerHTML`» con datos proporcionados por el usuario constituye una vulnerabilidad XSS clásica (véase el capítulo sobre seguridad en PHP, el mismo principio): un atacante podría inyectar código ejecutable. «`textContent`» sigue siendo seguro por defecto, ya que siempre trata su contenido como texto sin formato.

## Crear e insertar un elemento

```javascript
const nouvelleCarte = document.createElement("div");
nouvelleCarte.textContent = "Nouvelle carte";
nouvelleCarte.classList.add("carte");

document.querySelector("#liste").appendChild(nouvelleCarte);
```

## Escuchar eventos

```javascript
const bouton = document.querySelector("#mon-bouton");

bouton.addEventListener("click", (evenement) => {
    console.log("Bouton cliqué !", evenement.target);
});
```

| Evento habitual | Se activa cuando |
|---|---|
| `click` | Se hace clic en el elemento |
| `submit` | Se envía un formulario |
| `input` / `change` | El valor de un campo cambia |
| `keydown` / `keyup` | Se pulsa o se suelta una tecla del teclado |
| `DOMContentLoaded` | El HTML se ha cargado por completo (antes que las imágenes y los estilos) |

## `preventDefault()` : anular el comportamiento por defecto

```javascript
document.querySelector("form").addEventListener("submit", (evenement) => {
    evenement.preventDefault();   // Impide que un formulario se recargue de forma predeterminada.
    console.log("Formulaire intercepté par JavaScript");
});
```

## Propagación de eventos y delegación

Un evento se propaga desde el elemento de destino hacia sus elementos padres (*bubbling*), lo que permite escuchar un evento en un elemento padre común en lugar de en cada elemento hijo individualmente:

```javascript
document.querySelector("#liste").addEventListener("click", (evenement) => {
    if (evenement.target.classList.contains("carte")) {
        console.log("Une carte a été cliquée :", evenement.target.textContent);
    }
});
// Funciona incluso con tarjetas añadidas DINÁMICAMENTE después de este addEventListener,
// a diferencia de un addEventListener aplicado individualmente a cada mapa al cargarse
```

Esta técnica, la **delegación de eventos**, evita tener que volver a asociar un oyente a cada nuevo elemento creado dinámicamente (véase el ejemplo de `createElement` más arriba): basta con un único oyente, asociado una sola vez a un antepasado estable.
