---
order: 8
---

# ARIA dinámico y gestión del foco con el teclado

El capítulo [Atributos data-* y accesibilidad (ARIA)](/?c=langages&s=html&p=attributs-data-et-accessibilite) presentó `aria-label` y `aria-expanded`. **ARIA** (*Accessible Rich Internet Applications*) es un conjunto de [atributos](/?c=langages&s=html&p=structure-dun-document) de [HTML](/?c=langages&s=html&p=html) que describen a una **tecnología de apoyo** lo que la página no dice por sí misma. Una tecnología de apoyo es un programa o un dispositivo que ayuda a una persona con discapacidad a usar un ordenador; la más común es el **lector de pantalla**, que lee la página en voz alta o la muestra en braille.

Este capítulo trata dos situaciones que el capítulo anterior no aborda: la página que cambia después de cargarse (aparece un mensaje, una zona se bloquea) y el usuario que solo dispone del teclado. Para él, el **foco** es el elemento que recibe las teclas en un momento dado (un enlace, un botón, un campo). La tecla **Tab** mueve el foco al siguiente elemento interactivo (Mayús+Tab al anterior); un elemento es **interactivo** cuando se puede activar o rellenar.

Los ejemplos de código suponen conocidos [el DOM y los eventos](/?c=langages&s=javascript&p=dom-et-evenements), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions), [los bucles](/?c=langages&s=javascript&p=boucles), [los arrays](/?c=langages&s=javascript&p=tableaux) y [las condiciones](/?c=langages&s=javascript&p=conditions) (incluidos los operadores `?.` y `??`) en [JavaScript](/?c=langages&s=javascript&p=javascript), así como las etiquetas [`<p>` y `<ul>`](/?c=langages&s=html&p=balises-de-texte), [`<div>`](/?c=langages&s=html&p=semantique-html5) y [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite).

## Del HTML a la tecnología de apoyo

El navegador (el programa que muestra las páginas web) transforma el HTML en [DOM](/?c=langages&s=javascript&p=dom-et-evenements). Aplica los estilos escritos en [CSS](/?c=langages&s=css&p=css) para la visualización. A partir del DOM, construye también el **árbol de accesibilidad**: una lista simplificada de los elementos con, para cada uno, su nombre, su **rol** (lo que es: botón, enlace, pestaña...) y su estado. Es este árbol, y no la pantalla, el que lee la tecnología de apoyo.

```
HTML --> DOM --+--> visualización en pantalla (con los estilos)
               |
               +--> árbol de accesibilidad --> lector de pantalla
                    (nombre, rol, estado)

aria-* y role  : modifican el árbol de accesibilidad, no la pantalla
inert          : bloquea clic y foco Y retira del árbol, la pantalla no cambia
display: none  : retira de la pantalla, por tanto también del árbol
```

## `aria-live`: anunciar un cambio sin mover el foco

Un lector de pantalla solo lee un lugar de la página a la vez. Si un texto cambia en otro lugar (« 12 resultados encontrados »), no lo dice. `aria-live` declara una **región live**: una zona cuyos cambios de contenido se anuncian, sin que el foco vaya allí.

| Valor | Efecto | Cuándo usarlo |
|---|---|---|
| `off` (por defecto) | No se anuncia nada, salvo que el foco esté dentro de la zona | Actualizaciones frecuentes y no esenciales (marcador en directo) |
| `polite` | Se anuncia en el próximo momento de calma (al terminar la frase en curso, en una pausa al escribir) | El caso general: resultados, « Guardado » |
| `assertive` | Se anuncia de inmediato, pudiendo interrumpir lo que se está leyendo | Solo urgencias: tiempo casi agotado |

```html
<!-- La región existe desde la carga de la página, y está VACÍA -->
<p id="estado" aria-live="polite"></p>
```

```javascript
// Localiza la región por su identificador
const estado = document.getElementById("estado");
// El texto cambia: el lector de pantalla lo anuncia, el foco no se mueve
estado.textContent = "12 resultados encontrados";
```

Los anuncios solo se refieren a un **cambio** en una región que el navegador ya conoce. Crear la región con su contenido no produce, por tanto, nada que anunciar:

```javascript
// Obtiene el contenedor de mensajes: un <div id="contenedor"> ya presente en la página
const contenedor = document.getElementById("contenedor");

// MAL: la región nace con su texto, no hay ningún cambio que anunciar
contenedor.innerHTML = '<p aria-live="polite">12 resultados encontrados</p>';

// BIEN: la región `estado` ya existía, vacía; solo cambiamos su texto
estado.textContent = "12 resultados encontrados";
```

Lo más fiable es poner la región en el HTML original; crearla en JavaScript obliga a esperar antes de rellenarla, y el comportamiento varía según el navegador y el lector de pantalla, como detalla [la guía de las regiones live](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) de MDN (*MDN Web Docs*, la documentación de referencia de la web editada por Mozilla). Por defecto, solo se lee la parte modificada; [`aria-atomic="true"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-atomic) hace que se vuelva a leer toda la región.

## `aria-current`: marcar el elemento actual de un conjunto

En un grupo de elementos relacionados (enlaces `<a>` de una zona de navegación [`<nav>`](/?c=langages&s=html&p=semantique-html5), pasos de un recorrido), uno de ellos es «el actual». Un estilo visual (negrita, subrayado) no dice nada a un lector de pantalla: `aria-current` anuncia esa información. Un solo elemento por conjunto lleva la marca.

| Valor | Designa | Ejemplo |
|---|---|---|
| `page` | La página actual de un conjunto de páginas | Enlace de la página mostrada en un menú |
| `step` | El paso actual de un proceso | Paso 2 de un proceso de compra |
| `location` | La ubicación actual dentro de un entorno | Elemento resaltado en un esquema |
| `date` | La fecha actual de un conjunto de fechas | Hoy en un calendario |
| `time` | La hora actual de un conjunto de horas | Franja en curso en un horario |
| `true` | El elemento actual, sin más precisión | Ningún valor anterior encaja |
| `false` (por defecto) | No es el elemento actual | Equivale a la ausencia del atributo |

```html
<!-- <nav>: zona de navegación; aria-label: su nombre, como en el capítulo anterior -->
<nav aria-label="Navegación principal">
    <ul>
        <li><a href="/inicio">Inicio</a></li>
        <!-- aria-current="page": el lector dice « página actual » en este enlace -->
        <li><a href="/cursos" aria-current="page">Cursos</a></li>
        <li><a href="/contacto">Contacto</a></li>
    </ul>
</nav>
```

Un [selector de atributo](/?c=langages&s=css&p=selecteurs) CSS puede leer `aria-current` para dar estilo al enlace actual:

```css
/* El selector de atributo lee aria-current: una sola fuente para el estilo y el sentido */
nav a[aria-current="page"] {
    font-weight: bold;                 /* texto en negrita */
    border-bottom: 3px solid #1a4fd6;  /* línea azul de 3 píxeles bajo el enlace */
}
```

```javascript
// Mueve la marca cuando cambia la navegación sin recargar la página
function marcarActual(nuevo) {
    // Busca el enlace que está marcado actualmente en la navegación
    const anterior = document.querySelector('nav [aria-current="page"]');
    // Quita su marca (el `?.` no hace nada si no había ninguna)
    anterior?.removeAttribute("aria-current");
    // Pone la marca en el nuevo enlace
    nuevo.setAttribute("aria-current", "page");
}
```

Para una pestaña, una opción de lista o una fila de tabla, la marca correcta es `aria-selected` (ver más abajo), no `aria-current`.

## `role`: decir qué es un elemento cuando el HTML no lo dice

El atributo `role` fija el rol de un elemento en el árbol de accesibilidad. **Primera regla de ARIA**: si existe un elemento HTML nativo para la necesidad, se usa en lugar de un `role` (ver la «regla de oro» del [capítulo anterior](/?c=langages&s=html&p=attributs-data-et-accessibilite)). Un `role` cambia lo que se anuncia, nunca el comportamiento: el teclado hay que programarlo igualmente.

| Necesidad | Elemento nativo que conviene usar | `role` solo si no existe ningún nativo |
|---|---|---|
| Botón | [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) | `role="button"` |
| Enlace | [`<a href>`](/?c=langages&s=html&p=liens-et-images) | `role="link"` |
| Zona de navegación | [`<nav>`](/?c=langages&s=html&p=semantique-html5) | `role="navigation"` |
| Mensaje urgente que aparece dinámicamente | Ninguno | `role="alert"` |
| Mensaje de estado discreto | Ninguno | `role="status"` |
| Pestañas | Ninguno | `tablist`, `tab`, `tabpanel` |

| Rol | Significado | Comportamiento live implícito |
|---|---|---|
| `alert` | Mensaje importante y urgente | `aria-live="assertive"` y `aria-atomic="true"` |
| `status` | Información útil, no urgente | `aria-live="polite"` y `aria-atomic="true"` |
| `tablist` | Contenedor de un grupo de pestañas | Ninguno |
| `tab` | Una pestaña, que muestra un panel | Ninguno |
| `tabpanel` | El contenido asociado a una pestaña | Ninguno |

```html
<!-- Dos regiones vacías desde la carga, cada una con su rol -->
<div id="error" role="alert"></div>
<div id="guardado" role="status"></div>
```

```javascript
// Interrumpe la lectura en curso: reservado a lo urgente
document.getElementById("error").textContent = "Dirección de correo no válida";
// Se anuncia en el próximo momento de calma, sin interrumpir
document.getElementById("guardado").textContent = "Borrador guardado";
```

`role="alert"` solo se aplica a texto (nunca a un enlace o un botón), se usa con moderación y apunta a un contenido mostrado dinámicamente, no a un mensaje ya presente al cargar la página ([página MDN del rol `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)). Los roles de pestañas se implementan más abajo.

## `inert`: volver inerte una zona

`inert` es un atributo **booleano** (basta con que esté presente para activarlo, no tiene valor: `<div inert>`). Hace que el elemento y todos sus descendientes sean **inertes**: no clicables, no enfocables (por eso Tab los salta), no seleccionables, no encontrables con la búsqueda del navegador, y ausentes del árbol de accesibilidad. Siguen visibles en pantalla. El atributo está disponible en todos los navegadores habituales desde abril de 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)).

Su caso de uso típico es el fondo de un **cuadro de diálogo modal**: una ventana mostrada encima de la página, que bloquea todo lo demás mientras esté abierta. Existe una opción nativa: la etiqueta [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) abierta con su método `showModal()` (un método es una función asociada a un elemento) vuelve inerte el resto de la página, y además gestiona la tecla Esc y el foco inicial. Para un panel que no es un `<dialog>` (aquí, un panel lateral [`<aside>`](/?c=langages&s=html&p=semantique-html5)), se pone `inert` uno mismo:

```html
<!-- Todo el fondo está agrupado en un solo contenedor -->
<div id="pagina">
    <button id="abrir">Abrir el panel</button>
    <p>Contenido de la página.</p>
</div>

<!-- El panel está FUERA de #pagina: si no, quedaría inerte con ella -->
<!-- hidden: atributo booleano que oculta el panel mientras no esté abierto -->
<aside id="panel" aria-label="Ajustes" hidden>
    <button id="cerrar">Cerrar</button>
</aside>
```

```css
/* Señal visual: sin ella, nada indica que una zona se ha vuelto inerte */
[inert] { opacity: 0.5; }
```

```javascript
// Localiza los cuatro elementos por su identificador
const pagina = document.getElementById("pagina");
const panel = document.getElementById("panel");
const abrir = document.getElementById("abrir");
const cerrar = document.getElementById("cerrar");

abrir.addEventListener("click", () => {
    pagina.inert = true;      // la propiedad `inert` pone el atributo: página bloqueada
    panel.hidden = false;     // muestra el panel (`hidden`: atributo que oculta el elemento)
    cerrar.focus();           // coloca el foco en el panel, fuera de la zona inerte
});

cerrar.addEventListener("click", () => {
    pagina.inert = false;     // la página vuelve a ser utilizable
    panel.hidden = true;      // oculta el panel
    abrir.focus();            // devuelve el foco al botón que había abierto el panel
});
```

Tres mecanismos «ocultan» algo, pero no de la misma manera. `display: none` es una propiedad [CSS](/?c=langages&s=css&p=css) que retira el elemento de la visualización; `hidden` produce el mismo efecto por defecto; `aria-hidden="true"` retira el elemento solo del árbol de accesibilidad.

| | `inert` | `aria-hidden="true"` | `display: none` o `hidden` |
|---|---|---|---|
| Visible en pantalla | Sí | Sí | No |
| Alcanzable con Tab / enfocable | No | **Sí**, sigue siendo enfocable | No |
| Clicable | No | Sí | No |
| Leído por el lector de pantalla | No | No | No |

`aria-hidden="true"` sobre una zona que contiene elementos enfocables crea, por tanto, una trampa: el foco puede entrar en un elemento que el lector de pantalla ya no expone ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)). Para bloquear un fondo, `inert` es la herramienta adecuada.

## `:focus-visible`: el anillo de foco, solo cuando ayuda

El **anillo de foco** es el contorno que dibuja el navegador alrededor del elemento que tiene el foco, para que el usuario que usa el teclado vea dónde se encuentra. Es un `outline`: una propiedad CSS que traza una línea alrededor de un elemento sin cambiar su tamaño. Las [pseudoclases](/?c=langages&s=css&p=selecteurs) `:focus` y `:focus-visible` apuntan al elemento enfocado: la primera siempre, la segunda solo cuando el navegador considera que el foco debe hacerse visible.

| Situación | `:focus` | `:focus-visible` |
|---|---|---|
| Tab hasta un botón | Se aplica | Se aplica |
| Clic de ratón en un botón | Se aplica | En general no |
| Clic en un campo de texto | Se aplica | Se aplica (el navegador señala el foco en un campo) |

```css
/* MAL: quita el anillo a todos, el teclado ya no ve dónde está */
button:focus { outline: none; }

/* BIEN: un anillo nítido, solo cuando el navegador considera que ayuda */
button:focus-visible {
    outline: 3px solid #1a4fd6;  /* trazo continuo azul oscuro de 3 píxeles */
    outline-offset: 2px;         /* separa el trazo 2 píxeles, para que no quede pegado */
}
```

Quitar el indicador de foco sin sustituirlo deja la página inutilizable con el teclado: va en contra del criterio 2.4.7 «Foco visible» (nivel AA) de las WCAG, las reglas de accesibilidad web de referencia ([criterio](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [niveles de conformidad](/?c=ui-ux&p=accessibilite-ux)). El sustituto debe además tener buen contraste, de al menos 3 a 1 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)); los [ratios de contraste](/?c=ui-ux&p=couleur-et-contraste) se detallan en su capítulo.

## Una sola parada de Tab en un grupo: el «roving tabindex»

En una barra de **pestañas** (una fila de botones, cada uno de los cuales muestra un panel de contenido), dejar que cada pestaña sea alcanzable con Tab cuesta una pulsación por pestaña para recorrerla: diez pestañas, diez pulsaciones. La convención es tratar el grupo como **una sola parada de Tab** (un lugar donde se detiene el foco) y circular por dentro con las flechas. La técnica se llama *roving tabindex* («tabindex itinerante») y se basa en el atributo `tabindex`, que determina si un elemento puede recibir el foco y si es alcanzable con Tab:

| `tabindex` | Foco por clic o por `.focus()` | Alcanzable con Tab |
|---|---|---|
| Ausente | Solo si el elemento es interactivo nativo (botón, enlace, campo) | Sí, si es nativo |
| `0` | Sí | Sí, en el orden del HTML |
| `-1` | Sí | **No** |
| Positivo (`1`, `2`...) | Sí | Sí, pero antes que todos los demás: se altera el orden del HTML, hay que evitarlo |

```
Sin roving tabindex (todas las pestañas en tabindex="0"):

  Tab -> [ HTML ] -Tab-> [ CSS ] -Tab-> [ JS ] -Tab-> [ panel ] -Tab-> resto de la página

Con roving tabindex (solo la pestaña activa en tabindex="0"):

  Tab -> [ HTML ] -----------------------Tab------------> [ panel ] -Tab-> resto de la página
           ^   |  flechas derecha/izquierda, Home, Fin
           |   v
        [ CSS ]  [ JS ]   (tabindex="-1": enfocables por script, saltados por Tab)
```

Las teclas siguen el [modelo de pestañas de la APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (*ARIA Authoring Practices Guide*, la guía de buenas prácticas ARIA publicada por el W3C, el organismo que normaliza la web), aquí con activación automática: la pestaña que recibe el foco se muestra de inmediato, lo que se recomienda cuando el panel se muestra sin demora.

| Tecla | Efecto |
|---|---|
| Tab | Entra en la barra en la pestaña activa; desde la barra, pasa al panel |
| Flecha derecha | Pestaña siguiente (después de la última, vuelve a la primera) |
| Flecha izquierda | Pestaña anterior (antes de la primera, salta a la última) |
| Home / Fin | Primera / última pestaña (opcional) |

El `<button>` nativo proporciona gratis el clic, Intro y Espacio; `role="tab"` solo sustituye lo que se anuncia.

| Elemento | Atributo | Rol |
|---|---|---|
| Contenedor | `role="tablist"` | Grupo de pestañas |
| Contenedor | `aria-label` | Nombre del grupo |
| Cada pestaña | `role="tab"` | Una pestaña |
| Cada pestaña | `aria-selected` | `true` en la activa, `false` en las demás |
| Cada pestaña | `aria-controls` | `id` del panel que controla |
| Cada pestaña | `tabindex` | `0` en la activa, `-1` en las demás |
| Cada panel | `role="tabpanel"` | Contenido de una pestaña |
| Cada panel | `aria-labelledby` | `id` de la pestaña: su nombre viene de ella |
| Cada panel | `tabindex="0"` | Hace el panel alcanzable con Tab desde la barra, cuando su contenido no empieza por un elemento enfocable |
| Paneles inactivos | `hidden` | Ocultos |

```html
<!-- El grupo de pestañas: una sola parada de Tab, llamado « Lenguajes web » -->
<div role="tablist" aria-label="Lenguajes web" id="pestanas">
    <!-- Pestaña activa: seleccionada y alcanzable con Tab (tabindex="0") -->
    <button role="tab" id="pestana-html" aria-selected="true"
            aria-controls="panel-html" tabindex="0">HTML</button>
    <!-- Otras pestañas: no seleccionadas, saltadas por Tab (tabindex="-1") -->
    <button role="tab" id="pestana-css" aria-selected="false"
            aria-controls="panel-css" tabindex="-1">CSS</button>
    <button role="tab" id="pestana-js" aria-selected="false"
            aria-controls="panel-js" tabindex="-1">JavaScript</button>
</div>

<!-- Panel visible, asociado a la pestaña HTML -->
<div role="tabpanel" id="panel-html" aria-labelledby="pestana-html" tabindex="0">
    El HTML describe la estructura de la página.
</div>
<!-- Paneles de las pestañas inactivas: ocultos por el atributo hidden -->
<div role="tabpanel" id="panel-css" aria-labelledby="pestana-css" tabindex="0" hidden>
    El CSS describe el aspecto.
</div>
<div role="tabpanel" id="panel-js" aria-labelledby="pestana-js" tabindex="0" hidden>
    El JavaScript describe el comportamiento.
</div>
```

```css
/* El estilo lee el estado ARIA: la pestaña seleccionada aparece subrayada */
[role="tab"][aria-selected="true"] { border-bottom: 3px solid #1a4fd6; }
```

```javascript
// La barra y la lista de sus pestañas (el `...` copia la lista en un array de verdad)
const barra = document.getElementById("pestanas");
const pestanas = [...barra.querySelectorAll('[role="tab"]')];

// Muestra la pestaña elegida, oculta las demás y hace «viajar» la parada de Tab
function activar(destino) {
    for (const pestana of pestanas) {
        // true (booleano) solo para una pestaña: la que se activa
        const activa = pestana === destino;
        // String() convierte el booleano en texto, porque un valor de atributo es un texto
        pestana.setAttribute("aria-selected", String(activa));
        // La propiedad tabIndex es el atributo tabindex: solo la activa sigue en Tab
        pestana.tabIndex = activa ? 0 : -1;
        // Localiza el panel gracias al id que designa `aria-controls`
        const panel = document.getElementById(pestana.getAttribute("aria-controls"));
        // Solo el panel de la pestaña activa es visible
        panel.hidden = !activa;
    }
}

// Un clic en una pestaña la activa
barra.addEventListener("click", (evento) => {
    // `evento.target`: el elemento pulsado; `includes` comprueba que es una pestaña
    if (pestanas.includes(evento.target)) {
        activar(evento.target);
    }
});

// Las teclas del teclado, escuchadas en toda la barra
barra.addEventListener("keydown", (evento) => {
    const ultimo = pestanas.length - 1;                // posición de la última pestaña
    const posicion = pestanas.indexOf(evento.target);  // posición de la pestaña enfocada
    let siguiente = -1;                                // -1: ninguna tecla gestionada

    if (evento.key === "ArrowRight") {
        siguiente = posicion === ultimo ? 0 : posicion + 1;  // tras la última: la primera
    } else if (evento.key === "ArrowLeft") {
        siguiente = posicion === 0 ? ultimo : posicion - 1;  // antes de la primera: la última
    } else if (evento.key === "Home") {
        siguiente = 0;                                 // primera pestaña
    } else if (evento.key === "End") {
        siguiente = ultimo;                            // última pestaña
    }

    if (siguiente === -1) return;     // otra tecla: salimos, Tab conserva su función normal
    evento.preventDefault();          // impide que Home/Fin desplace la página
    activar(pestanas[siguiente]);     // activa la pestaña destino (estado, tabindex, panel)
    pestanas[siguiente].focus();      // mueve el foco hacia ella
});
```

Según la [guía APG del teclado](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), los grupos de [botones de opción](/?c=langages&s=html&p=formulaires) siguen la misma convención de una sola parada de Tab.

## Conservar el foco cuando cambia el diseño

El foco está ligado a un elemento preciso. Si el elemento se elimina (una lista redibujada con `innerHTML`, una parte de la página sustituida), el navegador devuelve el foco al [`<body>`](/?c=langages&s=html&p=structure-dun-document): el usuario que usa el teclado pierde su posición ([guía APG del teclado](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). Un elemento oculto con `display: none` tampoco puede enfocarse.

| Situación | Estrategia |
|---|---|
| Datos actualizados, mismos elementos | No recrear los nodos (los elementos del DOM): actualizar su texto o sus atributos, el foco se mantiene |
| Lista redibujada por completo | Memorizar el elemento enfocado mediante un identificador estable (`data-id`), redibujar y luego volver a enfocar el nuevo elemento equivalente |
| Elemento eliminado | Mover deliberadamente el foco a un vecino lógico (el siguiente, si no el anterior) |
| Panel o diálogo cerrado | Devolver el foco al elemento que lo había abierto (ver `inert`) |
| Cambio de [punto de ruptura](/?c=langages&s=css&p=responsive-et-media-queries) (*breakpoint*) | Adaptar la apariencia con CSS sobre los mismos elementos en lugar de destruirlos y recrearlos en JavaScript |

`document.activeElement` es la propiedad que devuelve el elemento que tiene el foco ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)). El ejemplo usa [`dataset`](/?c=langages&s=html&p=attributs-data-et-accessibilite) para vincular cada botón con su tarea, las [plantillas de cadena](/?c=langages&s=javascript&p=strings) (*backticks*) para insertar una variable en un texto, y `?.` y `??` vistos en las [condiciones](/?c=langages&s=javascript&p=conditions).

```html
<!-- La lista se rellena con JavaScript -->
<ul id="lista"></ul>
```

```javascript
// Cada tarea tiene un identificador estable (id): sobrevive a los redibujados
let tareas = [
    { id: 1, texto: "Escribir el capítulo" },
    { id: 2, texto: "Releer" },
    { id: 3, texto: "Publicar" },
];
const lista = document.getElementById("lista");

// Redibuja toda la lista: los botones antiguos se destruyen, se crean nuevos
function mostrar() {
    lista.innerHTML = "";                          // vacía la lista (destruye sus botones)
    for (const tarea of tareas) {                  // una línea por tarea
        const elemento = document.createElement("li");   // crea el elemento de lista
        const boton = document.createElement("button");  // crea su botón
        boton.dataset.id = tarea.id;                 // data-id: vincula el botón a la tarea
        boton.textContent = `Terminar: ${tarea.texto}`;  // texto del botón
        elemento.appendChild(boton);                 // mete el botón en el elemento
        lista.appendChild(elemento);                 // mete el elemento en la lista
    }
}

// Vuelve a enfocar el botón de una tarea; no hace nada si ese botón no existe
function enfocarTarea(id) {
    lista.querySelector(`[data-id="${id}"]`)?.focus();
}

// Caso A: redibujo sin eliminación, el foco debe quedarse en la misma tarea
function refrescar() {
    const memorizado = document.activeElement.dataset.id;  // 1. anota el id (o undefined)
    mostrar();                                     // 2. redibuja: aquí se pierde el foco
    enfocarTarea(memorizado);                      // 3. enfoca el nuevo botón
}

// Caso B: un clic termina la tarea; el foco pasa a la tarea vecina
lista.addEventListener("click", (evento) => {
    if (!evento.target.dataset.id) return;                 // clic fuera de un botón: salimos
    const id = Number(evento.target.dataset.id);           // Number(): texto -> número
    const indice = tareas.findIndex((tarea) => tarea.id === id);  // posición de la pulsada
    tareas = tareas.filter((tarea) => tarea.id !== id);    // copia sin la tarea terminada
    mostrar();                                             // redibuja la lista
    const vecina = tareas[indice] ?? tareas[indice - 1];   // la siguiente, si no la anterior
    if (vecina) enfocarTarea(vecina.id);                   // si la lista no está vacía
});
```

Cuando desaparece la última tarea, ya no hay vecina: el foco debe colocarse entonces en otro sitio, por ejemplo en un botón «Añadir una tarea».

## Resumen de las herramientas

| Herramienta | Naturaleza | Valores o uso | Sirve para |
|---|---|---|---|
| `aria-live` | Atributo ARIA | `off`, `polite`, `assertive` | Anunciar un cambio sin mover el foco |
| `aria-atomic` | Atributo ARIA | `true` | Volver a leer toda la región live |
| `aria-current` | Atributo ARIA | `page`, `step`, `location`, `date`, `time`, `true`, `false` | Marcar el elemento actual de un conjunto |
| `aria-selected` | Atributo ARIA | `true`, `false` | Marcar la pestaña seleccionada |
| `aria-hidden` | Atributo ARIA | `true` | Retirar del árbol de accesibilidad, sin bloquear el foco |
| `role` | Atributo HTML | `alert`, `status`, `tablist`, `tab`, `tabpanel` | Dar un rol cuando no existe ningún elemento nativo |
| `inert` | Atributo booleano | Presente o ausente | Hacer una zona no clicable, no enfocable, no leída |
| `tabindex` | Atributo HTML | `0`, `-1` | Ajustar el acceso con Tab |
| `:focus-visible` | Pseudoclase CSS | Con `outline` | Mostrar el anillo de foco con el teclado |

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Crear la región live con su contenido | No hay ningún cambio que anunciar. Ponerla en el HTML original, vacía, y luego cambiar su texto |
| `aria-live` en una zona que cambia sin cesar | Un flujo de anuncios ahoga al usuario. Usar `off` o anunciar solo un resumen |
| `assertive` o `role="alert"` en todas partes | Cada anuncio interrumpe la lectura. Reservarlos a las urgencias, y si no, `polite` o `status` |
| Marcar la página activa solo con un estilo | El lector de pantalla no lo sabe. Añadir `aria-current`, una sola vez por conjunto |
| `aria-current` en lugar de `aria-selected` en una pestaña | Ambos no tienen el mismo significado: una pestaña se marca con `aria-selected` |
| Un `role` sin el comportamiento que lo acompaña | El rol anuncia un botón o una pestaña, pero el teclado no funciona. Preferir el elemento nativo |
| `aria-hidden="true"` sobre contenido enfocable | El foco entra allí aunque no se lee nada. Usar `inert` o `hidden` |
| `inert` sin indicación visual, o puesto en un ancestro del panel que hay que enfocar | El usuario no entiende por qué la zona deja de reaccionar, y el panel se vuelve inerte con ella |
| `outline: none` sin sustituto | El teclado ya no ve el foco. Usar `:focus-visible` con un contorno contrastado |
| `tabindex="0"` en todas las pestañas, o un `tabindex` positivo | Demasiadas paradas de Tab, o un orden que ya no sigue al HTML |
| Redibujar una lista sin volver a enfocar | El foco cae en `<body>` y el usuario pierde su lugar |
| Pensar que un comportamiento ARIA es idéntico en todas partes | Varía según el navegador y el lector de pantalla. Probar con lectores reales, no solo con el teclado |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Elegir primero el elemento nativo (`<button>`, `<a>`, `<dialog>`, [`<details>`](/?c=langages&s=html&p=semantique-html5)) | Aporta rol, teclado y foco sin una sola línea de código ARIA |
| Declarar las regiones live en el HTML original, con mensajes breves | Es la única forma fiable de que se vigilen desde el principio |
| Usar `polite` por defecto | Anunciar sin cortar la palabra al usuario |
| Hacer que el estado lo lean a la vez el estilo y ARIA (`[aria-current="page"]`, `[aria-selected="true"]`) | Una sola fuente de verdad: la apariencia y el anuncio nunca divergen |
| En una zona modal, usar `<dialog>` o `inert`, y devolver el foco al disparador | El fondo queda bloqueado y el usuario recupera su lugar al cerrar |
| Sustituir el anillo de foco por un `:focus-visible` contrastado, nunca eliminarlo | El usuario del teclado siempre ve dónde está |
| Grupo de elementos relacionados (pestañas, botones de opción): una parada de Tab, flechas | Recorrer el grupo solo cuesta una pulsación de Tab |
| Volver a enfocar mediante un identificador estable tras un redibujo | El foco ya no depende de un nodo destruido |
| Probar solo con el teclado (Tab, Mayús+Tab, flechas, Esc) y luego con un lector de pantalla | Solo esta prueba revela un foco perdido o un anuncio que falta |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | `aria-live` anuncia un cambio sin mover el foco; `aria-current` marca el elemento actual; `role` solo se usa sin elemento nativo; `inert` bloquea una zona entera; `:focus-visible` dibuja el foco con el teclado; un grupo de elementos relacionados es solo una parada de Tab (`tabindex` `0` en la activa, `-1` en las demás); el foco se memoriza y se restaura cuando los elementos se recrean. |
| **Trampas a evitar** | Región live creada con su contenido, `assertive` abusivo, estilo sin `aria-current`, `aria-hidden` en algo enfocable, `inert` invisible, `outline: none` solo, `tabindex="0"` en todas partes, foco perdido tras un redibujo. |
| **Buenas prácticas** | Elemento nativo primero, región live en el HTML original, `polite` por defecto, `inert` o `<dialog>` para el fondo, anillo de foco contrastado, reenfoque mediante identificador estable, prueba con teclado y con lector de pantalla. |
