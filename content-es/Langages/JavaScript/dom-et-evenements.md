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
// inserta HTML sin procesar -> PELIGRO si la fuente no es fiable (XSS)
titulo.innerHTML = "<em>Título</em>";
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
// a diferencia de un addEventListener colocado individualmente en cada tarjeta al cargar la
// página
```

Esta técnica, la **delegación de eventos**, evita tener que volver a asociar un escuchador a cada nuevo elemento creado dinámicamente (véase el ejemplo de `createElement` más arriba): un único escuchador, colocado una vez en un ancestro estable, basta.

No todos los eventos se propagan por bubbling: `toggle` (disparado por un [`<details>`](/?c=langages-de-balisage&s=html&p=semantique-html5#lt-details-gt-lt-summary-gt-un-contenido-plegable-sin-javascript)), y también históricamente `focus`, `blur` y `scroll`, permanecen confinados al elemento en el que se dispararon. Para interceptarlos mediante delegación, hay que escuchar en la fase de **captura** (el recorrido inverso: del `document` hacia el elemento objetivo, antes del bubbling), con un tercer argumento `true`:

```javascript
document.addEventListener("toggle", (evento) => {
    console.log("Un details cambio de estado:", evento.target.open);
}, true);  // fase de captura obligatoria: "toggle" no hace bubbling
```

| Fase | Sentido del recorrido | ¿Se activa por defecto? |
|---|---|---|
| Captura | Del `document` hacia el elemento objetivo | No: solo con `true` (o `{ capture: true }`) como 3er argumento |
| Bubbling | Del elemento objetivo hacia el `document` | Sí |

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

// Escuchar la salida de pantalla completa, incluso si el usuario la abandonó
// mediante un atajo del navegador (Escape) en lugar de un botón de la página
document.addEventListener("fullscreenchange", () => {
    const enPantallaCompleta = document.fullscreenElement !== null;
    botonPantallaCompleta.textContent = enPantallaCompleta ? "Salir" : "Pantalla completa";
});
```

```javascript
// Copiar texto al portapapeles (asíncrono, puede fallar: permiso denegado)
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

## Almacenamiento persistente en el navegador: `sessionStorage` y `localStorage`

Dos mecanismos integrados en el navegador para conservar un dato de texto (clave/valor) tras recargar la página, sin base de datos ni servidor:

```javascript
sessionStorage.setItem("auditoria-confirmada", "true");
localStorage.setItem("tema", "oscuro");

sessionStorage.getItem("auditoria-confirmada");  // "true", o null si no existe
localStorage.removeItem("tema");
```

| Mecanismo | Alcance | Sobrevive a... |
|---|---|---|
| `sessionStorage` | Una sola pestaña | Una recarga de página (F5) |
| `localStorage` | Todas las pestañas del mismo origen | El cierre completo del navegador |

> **Trampa:** `sessionStorage`/`localStorage` solo almacenan cadenas de texto: guardar un objeto exige convertirlo con `JSON.stringify()` al escribir y `JSON.parse()` al leer.

> **Atención, seguridad:** ambos mecanismos son accesibles desde cualquier script JavaScript de la página, incluido uno inyectado mediante una vulnerabilidad XSS (véase [El cross-site scripting (XSS) en detalle](/?c=securite&s=cybersecurite&p=xss-en-detail)): nunca almacenar ahí un token de sesión sensible sin medir ese riesgo.

## Generar un archivo descargable en el cliente: `Blob` y `URL.createObjectURL()`

```javascript
const contenidoCsv = "nombre;valor\nfila1;10\nfila2;20";
const archivo = new Blob([contenidoCsv], { type: "text/csv;charset=utf-8" });
// URL temporal que apunta a este archivo en memoria
const url = URL.createObjectURL(archivo);

const enlace = document.createElement("a");
enlace.href = url;
enlace.download = "export.csv";
enlace.click();  // dispara la descarga, sin llegar a añadirlo nunca al DOM

URL.revokeObjectURL(url);  // libera la memoria una vez iniciada la descarga
```

Un `Blob` (*Binary Large OBject*) representa datos brutos (texto, binario) como un archivo, enteramente en memoria en el navegador, sin ningún viaje de ida y vuelta al servidor. `URL.createObjectURL()` le asigna una URL temporal (`blob:...`) utilizable en cualquier lugar donde se espere una URL de archivo (aquí, el `href` de un enlace); `URL.revokeObjectURL()` la libera una vez iniciada la descarga, para evitar una fuga de memoria.

> **Buena práctica:** llamar siempre a `URL.revokeObjectURL()` una vez terminado su uso: el navegador nunca libera esta URL temporal por sí mismo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El DOM representa una página HTML en forma de árbol manipulable. `querySelector`/`addEventListener` seleccionan y reaccionan a las interacciones; un evento se propaga de los hijos hacia los padres (*bubbling*), salvo algunas excepciones (`toggle`, `focus`, `blur`, `scroll`) que exigen la fase de captura. |
| **Herramientas utilizables** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`, `history.pushState`/`replaceState`, `requestFullscreen()`/`navigator.clipboard.writeText()`, `sessionStorage`/`localStorage`, `Blob`/`URL.createObjectURL()`. |
| **Trampas a evitar** | Asignar un dato de usuario a `innerHTML` (vulnerabilidad XSS); asociar un escuchador a cada elemento individual en lugar de delegar, lo cual falla para los elementos añadidos dinámicamente después; olvidar `fullscreenchange` y suponer que solo el botón de la página cambia la pantalla completa; escuchar `toggle` sin la fase de captura (`true` como 3er argumento), ya que nunca hace bubbling; almacenar un token sensible en `sessionStorage`/`localStorage`, legible por cualquier script (XSS). |
| **Buenas prácticas** | Usar la delegación de eventos (escuchador en un ancestro estable) en lugar de un escuchador por elemento, sobre todo si se añaden elementos dinámicamente. Preferir `replaceState` a `pushState` para sincronizar la URL con un estado ya mostrado en pantalla, sin ensuciar el historial de navegación. Rodear siempre `clipboard.writeText()` con un `try`/`catch`. Llamar siempre a `URL.revokeObjectURL()` una vez iniciada una descarga `Blob`. |
