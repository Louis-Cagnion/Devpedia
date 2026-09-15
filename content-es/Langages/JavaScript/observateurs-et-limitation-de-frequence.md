---
order: 16
---

# Observadores del navegador y limitación de frecuencia

El [capítulo sobre el DOM](/?c=langages&s=javascript&p=dom-et-evenements) cubre los eventos disparados por una acción explícita (un clic, una tecla pulsada). Este capítulo cubre otras dos necesidades: reaccionar a un cambio que **no** es un evento clásico (un elemento que se vuelve visible, el contenido de una página que cambia), y limitar la frecuencia de ejecución de una función llamada con demasiada frecuencia.

## `IntersectionObserver`: detectar que un elemento se vuelve visible

Antes de `IntersectionObserver`, saber si un elemento era visible en pantalla exigía recalcular su posición en cada desplazamiento (`scroll`), un cálculo costoso repetido en bucle. `IntersectionObserver` invierte el problema: el navegador avisa por sí mismo en cuanto un elemento entra o sale de la zona visible, sin recálculo manual.

```javascript
const centinela = document.querySelector('.centinela-paginacion');

const observador = new IntersectionObserver((entradas) => {
    if (entradas[0].isIntersecting) {   // el centinela acaba de entrar en la zona visible
        cargarSiguientePagina();
    }
}, { rootMargin: '200px' });            // dispara 200px ANTES de que el centinela sea realmente visible

observador.observe(centinela);
```

Este patrón (un "centinela" invisible al final de una lista, que dispara la carga de la página siguiente en cuanto se acerca a la zona visible) implementa el **scroll infinito**: `rootMargin` adelanta el disparo, para que el contenido siguiente ya esté cargado cuando el usuario llegue realmente a él, en lugar de después.

> **Buena práctica:** llamar siempre a `observador.disconnect()` una vez que la observación deja de ser necesaria (todo el contenido ya cargado, el elemento retirado de la página), para liberar la referencia y evitar un callback que sigue ejecutándose sobre un elemento que ya no necesita vigilancia.

## `MutationObserver`: reaccionar a un cambio del DOM sin sondear en bucle

`MutationObserver` avisa al código cuando el DOM cambia (adición/eliminación de elementos, cambio de atributo...), sin tener que comprobar "¿ha cambiado?" en bucle (*polling*):

```javascript
const contenedor = document.getElementById('mensajes');

const observador = new MutationObserver(() => {
    desplazarHaciaAbajo();
});

observador.observe(contenedor, { childList: true, subtree: true });
```

`{ childList: true, subtree: true }` precisa qué vigilar: la adición/eliminación de hijos directos (`childList`), incluso a cualquier profundidad bajo `contenedor` (`subtree`). Sin `subtree`, un hijo añadido a un nieto de `contenedor` no dispararía nada.

> **Trampa:** `MutationObserver` solo detecta cambios de **estructura DOM** o de **atributo HTML**. Escribir `miSelect.value = "x"` cambia la propiedad JavaScript `value` de un `<select>`, pero no modifica ningún atributo HTML ni la estructura del DOM: nunca se notifica ninguna mutación para este tipo de escritura, ni siquiera observando `attributes: true`. Véase [interceptar un setter de propiedad](/?c=langages&s=javascript&p=intercepter-un-setter-de-propriete) para la técnica que cubre este hueco.

## Debounce y throttle: dos formas de limitar la frecuencia de una función

Algunos eventos (`resize`, `scroll`, `input`) se disparan decenas de veces por segundo. Ejecutar una función costosa en cada disparo puede ralentizar toda la página. Dos técnicas limitan la frecuencia de ejecución, pero con lógicas opuestas:

| | Debounce | Throttle |
|---|---|---|
| Principio | Espera una pausa de inactividad antes de ejecutar | Ejecuta como máximo una vez por intervalo fijo |
| Efecto sobre una ráfaga continua | Una sola ejecución, tras el final de la ráfaga | Varias ejecuciones regulares, espaciadas, durante la ráfaga |
| Caso de uso típico | Búsqueda en tiempo real (esperar a que el usuario termine de escribir) | Reiniciar un temporizador de inactividad (limitar, sin bloquear nunca del todo) |

```javascript
// Debounce: solo ejecuta tras 300ms sin nueva llamada
function debounce(fn, retraso) {
    let temporizador = null;
    return (...args) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => fn(...args), retraso);
    };
}
```

```javascript
// Throttle: bloquea las llamadas siguientes durante 1000ms tras la primera
let bloqueado = false;

function alHaberActividad() {
    if (bloqueado) return;
    bloqueado = true;
    setTimeout(() => { bloqueado = false; }, 1000);

    reiniciarTemporizadorInactividad();
}
```

El throttle anterior no usa deliberadamente ningún `setInterval`: el bloqueo se libera una sola vez, 1000ms después de la primera llamada de la ráfaga, tras lo cual la siguiente llamada puede pasar de nuevo y activa su propio nuevo bloqueo. Es la forma más simple de un throttle (llamada *leading edge*: ejecuta de inmediato en la primera llamada en lugar de esperar al final del intervalo).

> **Trampa:** aplicar un debounce donde en realidad hace falta un throttle. En un temporizador de inactividad reiniciado en cada movimiento del ratón, un debounce nunca reiniciaría nada mientras el ratón siga moviéndose (la pausa de inactividad nunca llega): justo lo contrario del comportamiento buscado.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `IntersectionObserver` detecta la visibilidad de un elemento sin recálculo manual en el scroll (scroll infinito). `MutationObserver` reacciona a un cambio del DOM sin sondear en bucle, pero no ve ni las propiedades JS asignadas directamente ni los cambios fuera del DOM. Debounce espera una pausa antes de ejecutar; throttle ejecuta como máximo una vez por intervalo. |
| **Herramientas utilizables** | `IntersectionObserver` (`rootMargin`, `isIntersecting`), `MutationObserver` (`childList`/`subtree`/`attributes`), un debounce/throttle casero vía `setTimeout`. |
| **Trampas a evitar** | Olvidar `observador.disconnect()` una vez que la observación deja de ser necesaria. Esperar una mutación DOM sobre una propiedad JS asignada directamente (`select.value = x`). Confundir debounce y throttle en una necesidad de reinicio repetido. |
| **Buenas prácticas** | `rootMargin` para precargar antes de que el elemento sea realmente visible. `subtree: true` en cuanto el cambio pueda producirse a cualquier profundidad. Elegir debounce para una acción final única tras una ráfaga, throttle para un tope regular durante la ráfaga. |
