---
order: 12
---

# El DOM y la gestión de eventos

El **DOM** (*Document Object Model*) es la representación en memoria de una página HTML, en forma de árbol de objetos manipulables por JavaScript: cada etiqueta se convierte en un nodo de ese árbol, con sus propias propiedades y métodos.

## Seleccionar elementos

```javascript
document.getElementById("titulo");     // un elemento preciso, por su id
document.querySelector(".tarjeta");    // el PRIMER elemento que coincide con este selector CSS
document.querySelectorAll(".tarjeta"); // TODOS los elementos coincidentes (NodeList)
```

> **Nota:** `querySelector`/`querySelectorAll` aceptan cualquier [selector CSS](/?c=langages-de-balisage&s=css&p=selecteurs): `.clase`, `#id`, `div > p`, `[data-role="boton"]`... es el método más flexible.

## Modificar un elemento

```javascript
const titulo = document.querySelector("h1");

titulo.textContent = "Nuevo título";  // sustituye el texto (escapa automáticamente el HTML)
titulo.innerHTML = "<em>Título</em>"; // inserta HTML sin procesar -> PELIGRO si la fuente no es fiable (XSS)
titulo.style.color = "red";           // modifica un estilo CSS directamente
titulo.classList.add("activo");       // añade una clase CSS
titulo.classList.remove("activo");
titulo.classList.toggle("activo");            // añade si falta, quita si está presente
titulo.setAttribute("data-id", "42");
```

> **Nota:** `innerHTML` con un dato proveniente del usuario es una vulnerabilidad XSS clásica (véase [La seguridad](/?c=langages-de-programmation&s=php&p=securite), mismo principio): un atacante podría inyectar código ejecutable. `textContent` sigue siendo seguro por defecto, ya que siempre trata su contenido como texto sin formato.

## Crear e insertar un elemento

```javascript
const nuevaTarjeta = document.createElement("div");
nuevaTarjeta.textContent = "Nueva tarjeta";
nuevaTarjeta.classList.add("tarjeta");

document.querySelector("#lista").appendChild(nuevaTarjeta);
```

## Escuchar eventos

```javascript
const boton = document.querySelector("#mi-boton");

boton.addEventListener("click", (evento) => {
    console.log("¡Botón pulsado!", evento.target);
});
```

| Evento habitual | Se dispara cuando |
|---|---|
| `click` | Se hace clic en el elemento |
| `submit` | Se envía un formulario |
| `input` / `change` | El valor de un campo cambia |
| `keydown` / `keyup` | Se presiona/suelta una tecla del teclado |
| `DOMContentLoaded` | El HTML está completamente cargado (antes de las imágenes/estilos) |

## `preventDefault()`: anular el comportamiento por defecto

```javascript
document.querySelector("form").addEventListener("submit", (evento) => {
    evento.preventDefault();   // impide la recarga de página por defecto de un formulario
    console.log("Formulario interceptado por JavaScript");
});
```

## Propagación de eventos y delegación

Un evento se propaga desde el elemento objetivo hacia sus padres (*bubbling*), lo cual permite escuchar un evento en un padre común en lugar de en cada hijo individualmente:

```javascript
document.querySelector("#lista").addEventListener("click", (evento) => {
    if (evento.target.classList.contains("tarjeta")) {
        console.log("Se hizo clic en una tarjeta:", evento.target.textContent);
    }
});
// funciona incluso para tarjetas añadidas DINÁMICAMENTE después de este addEventListener,
// a diferencia de un addEventListener colocado individualmente en cada tarjeta al cargar la página
```

Esta técnica, la **delegación de eventos**, evita tener que volver a asociar un escuchador a cada nuevo elemento creado dinámicamente (véase el ejemplo de `createElement` más arriba): un único escuchador, colocado una vez en un ancestro estable, basta.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El DOM representa una página HTML en forma de árbol manipulable. `querySelector`/`addEventListener` seleccionan y reaccionan a las interacciones; un evento se propaga de los hijos hacia los padres (*bubbling*). |
| **Herramientas utilizables** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`. |
| **Trampas a evitar** | Asignar un dato de usuario a `innerHTML` (vulnerabilidad XSS); asociar un escuchador a cada elemento individual en lugar de delegar, lo cual falla para los elementos añadidos dinámicamente después. |
| **Buenas prácticas** | Usar la delegación de eventos (escuchador en un ancestro estable) en lugar de un escuchador por elemento, sobre todo si se añaden elementos dinámicamente. |
