---
order: 12
---

# El DOM y la gestión de eventos

El **DOM** (*Document Object Model*) es la representación en memoria de una página [HTML](/?c=langages-de-balisage&s=html&p=html), en forma de árbol de objetos manipulables por JavaScript: cada etiqueta se convierte en un nodo de ese árbol, con sus propias propiedades y métodos.

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

## Modificar la URL sin recargar la página

La API `history` del navegador cambia la URL mostrada en la barra de direcciones sin recargar la página ni disparar ninguna navegación de red:

```javascript
const params = new URLSearchParams();
params.set("domaine", "atlas");

history.replaceState(null, "", `${window.location.pathname}?${params}`);
// URL mostrada: .../page?domaine=atlas, sin recargar ni añadir una entrada al historial
```

Los tres argumentos son siempre los mismos: un `state` (dato asociado a esta entrada del historial, recuperable después mediante el evento `popstate`; `null` si no se usa aquí), un título (ignorado por la mayoría de navegadores) y la nueva URL (que debe permanecer en el mismo origen, o el navegador lanza un error).

| Método | Efecto sobre el historial | Caso de uso típico |
|---|---|---|
| `history.pushState(...)` | Añade una nueva entrada: el botón "Atrás" del navegador vuelve a ella | Cambiar de "página" en una [aplicación de página única](/?c=langages-de-programmation&s=javascript&p=ssr-vs-csr#csr-el-servidor-envia-una-cascara-vacia) sin recarga |
| `history.replaceState(...)` | Reemplaza la entrada actual: no se crea ninguna entrada nueva | Sincronizar la URL con un estado ya mostrado en pantalla (un filtro, una pestaña activa), sin ensuciar el historial de navegación |

> **Nota:** a diferencia de `window.location.href = "..."`, ni `pushState` ni `replaceState` recargan la página: el JavaScript ya cargado sigue ejecutándose, solo cambia la URL visible.

## Fullscreen y Clipboard: dos API activadas por una acción del usuario

Dos API del navegador, accesibles desde JavaScript, pero que **solo pueden usarse a raíz de una acción explícita del usuario** (un clic, una tecla): por seguridad, el navegador se niega a activarlas desde código que se ejecuta por sí solo.

```javascript
// Entrar en pantalla completa
document.querySelector("#zona-video").requestFullscreen();

// Escuchar la salida de pantalla completa, incluso si el usuario la abandono
// mediante un atajo del navegador (Escape) en lugar de un boton de la pagina
document.addEventListener("fullscreenchange", () => {
    const enPantallaCompleta = document.fullscreenElement !== null;
    botonPantallaCompleta.textContent = enPantallaCompleta ? "Salir" : "Pantalla completa";
});
```

```javascript
// Copiar texto al portapapeles (asincrono, puede fallar: permiso denegado)
async function copiar(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarConfirmacion("¡Copiado!");
    } catch (error) {
        mostrarConfirmacion("No se pudo copiar");
    }
}
```

| API | Activada por | Punto notable |
|---|---|---|
| Fullscreen (`requestFullscreen()`/`exitFullscreen()`) | Un clic o tecla | El evento `fullscreenchange` es necesario porque la pantalla completa puede abandonarse por una vía que el código no activó él mismo (Escape, un atajo del sistema) |
| Clipboard (`navigator.clipboard.writeText()`) | Un clic o tecla | Siempre asíncrono (una `Promise`), y puede fallar si el usuario/navegador deniega el permiso: rodearlo siempre con un `try`/`catch` |

> **Buena práctica:** escuchar siempre `fullscreenchange` para resincronizar el estado de la interfaz (texto del botón, icono) con el estado real de pantalla completa, en lugar de suponer que solo el botón de la página puede cambiarlo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El DOM representa una página HTML en forma de árbol manipulable. `querySelector`/`addEventListener` seleccionan y reaccionan a las interacciones; un evento se propaga de los hijos hacia los padres (*bubbling*). |
| **Herramientas utilizables** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`, `history.pushState`/`replaceState`, `requestFullscreen()`/`navigator.clipboard.writeText()`. |
| **Trampas a evitar** | Asignar un dato de usuario a `innerHTML` (vulnerabilidad XSS); asociar un escuchador a cada elemento individual en lugar de delegar, lo cual falla para los elementos añadidos dinámicamente después; olvidar `fullscreenchange` y suponer que solo el botón de la página cambia la pantalla completa. |
| **Buenas prácticas** | Usar la delegación de eventos (escuchador en un ancestro estable) en lugar de un escuchador por elemento, sobre todo si se añaden elementos dinámicamente. Preferir `replaceState` a `pushState` para sincronizar la URL con un estado ya mostrado en pantalla, sin ensuciar el historial de navegación. Rodear siempre `clipboard.writeText()` con un `try`/`catch`. |
