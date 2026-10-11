---
order: 9
---

# Animaciones CSS eficientes

Una **animación** es un cambio progresivo de la apariencia de un elemento (posición, tamaño, transparencia...) durante una duración dada. El [CSS](/?c=langages&s=css&p=css) sabe producirlas sin una sola línea de [JavaScript](/?c=langages&s=javascript&p=javascript), pero no todas las animaciones valen lo mismo: algunas obligan al navegador (el software que muestra las páginas web) a repetir muchos cálculos en cada instante, y la animación **se entrecorta** (*jank*): las imágenes llegan con retraso, el movimiento deja de ser fluido. Este capítulo muestra cómo escribir una animación, por qué solo dos propiedades son realmente baratas, y cómo no molestar a las personas a las que el movimiento marea.

Supone conocidos [los selectores](/?c=langages&s=css&p=selecteurs) (incluida la pseudoclase `:hover`, que selecciona un elemento sobre el que pasa el ratón, y la clase `.nombre`, que selecciona los elementos cuyo atributo `class` contiene ese nombre), [el modelo de caja](/?c=langages&s=css&p=box-model) y [el posicionamiento](/?c=langages&s=css&p=positionnement). Los ejemplos JavaScript suponen conocidos [el HTML](/?c=langages&s=html&p=html) (etiqueta `<div>`, atributos `id` y `class`), [el DOM y la gestión de eventos](/?c=langages&s=javascript&p=dom-et-evenements), [las variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [las funciones](/?c=langages&s=javascript&p=fonctions) (incluidas las funciones flecha `=>`), [las condiciones](/?c=langages&s=javascript&p=conditions) y [las cadenas de caracteres](/?c=langages&s=javascript&p=strings) con backticks.

## Dos propiedades estrella: `transform` y `opacity`

Todo el capítulo gira en torno a estas dos propiedades. `opacity` regula la transparencia, de `0` (invisible) a `1` (opaco). `transform` desplaza, agranda o hace girar el elemento **al mostrarse**, sin modificar el lugar que ocupa en la página: sus vecinos no se mueven, exactamente como ocurre con `position: relative` visto en el [capítulo sobre el posicionamiento](/?c=langages&s=css&p=positionnement). Un **píxel** es el punto más pequeño de una pantalla; `px` es la unidad que cuenta los píxeles.

| Valor de `transform` | Efecto | Ejemplo |
|---|---|---|
| `translateX(d)` | Desplaza horizontalmente (positivo: hacia la derecha, negativo: hacia la izquierda) | `translateX(30px)`: 30 píxeles hacia la derecha |
| `translateY(d)` | Desplaza verticalmente (positivo: hacia abajo) | `translateY(-20px)`: 20 píxeles hacia arriba |
| `scale(n)` | Multiplica el tamaño por `n` (1: sin cambios) | `scale(1.2)`: 120 % del tamaño, `scale(0.5)`: la mitad |
| `translate(x, y)` | Desplaza en los dos sentidos a la vez. Un porcentaje se calcula sobre el tamaño del propio elemento | `translate(-50%, -50%)`: la mitad de su anchura hacia la izquierda y la mitad de su altura hacia arriba |
| `rotate(a)` | Gira en el sentido de las agujas del reloj | `rotate(45deg)`: 45 grados (`deg`), `360deg` es una vuelta completa |

Varias funciones se combinan en un solo valor: `transform: translateX(30px) scale(1.2);`. Las duraciones se escriben con `s` (segundo) o `ms` (milisegundo, una milésima de segundo): `0.2s` equivale a `200ms`.

## `transition`: pasar de un valor a otro

Una **transición** anima el paso de un valor a otro cuando este cambia: el navegador calcula por sí mismo todos los valores intermedios. Necesita un disparador: un paso del ratón por encima, o una clase añadida por [JavaScript](/?c=langages&s=javascript&p=dom-et-evenements) (`classList.add`). Cuando el disparador desaparece, la transición vuelve en sentido inverso.

```css
.boton {
    /* anima la propiedad `transform` en 0,2 s, con un frenado al final (ease-out) */
    transition: transform 0.2s ease-out;
}

.boton:hover {
    transform: scale(1.05);   /* al pasar el ratón: un 5 % más grande, con transición */
}
```

| Propiedad | Función | Valor por defecto |
|---|---|---|
| `transition-property` | Qué propiedad animar (`transform`, `opacity`...) | `all` (todas) |
| `transition-duration` | Duración del paso | `0s` (instantáneo) |
| `transition-timing-function` | Curva de velocidad (véase la tabla más abajo) | `ease` |
| `transition-delay` | Espera antes de empezar | `0s` |

El atajo `transition` reúne las propiedades en orden: propiedad, duración, curva, retraso. Cuando contiene dos duraciones, la primera es la duración, la segunda el retraso.

## `@keyframes` y `animation`: una secuencia de pasos

Una transición solo conoce dos estados (antes, después) y espera un disparador. Para más pasos, o para una animación que arranca sola al cargar, se declara una secuencia de **fotogramas clave** (*keyframes*, los momentos en los que se fija la apariencia) con `@keyframes`, y luego se reproduce con las propiedades `animation-*`.

| | `transition` | `@keyframes` + `animation` |
|---|---|---|
| Número de pasos | Dos (salida, llegada) | Tantos como se quiera |
| Inicio | Un cambio de valor (paso del ratón, clase) | Solo, en cuanto se aplica la regla |
| Repetición | No | Sí (`animation-iteration-count`) |
| Uso típico | Reacción a un paso del ratón o a un clic | Aparición, carga, movimiento continuo |

```css
/* objetivo: <div class="notificacion">Guardado</div> */
/* @keyframes declara una animación con nombre «aparicion» (el nombre es libre) */
@keyframes aparicion {
    from {                              /* from: el estado al principio (equivale a 0%) */
        opacity: 0;                     /* invisible */
        transform: translateY(20px);    /* desplazado 20 píxeles hacia abajo */
    }
    to {                                /* to: el estado al final (equivale a 100%) */
        opacity: 1;                     /* totalmente visible */
        transform: translateY(0);       /* en su sitio normal */
    }
}

.notificacion {
    animation-name: aparicion;          /* qué secuencia de pasos reproducir */
    animation-duration: 0.4s;           /* cada reproducción dura 0,4 s */
    animation-timing-function: ease-out;    /* velocidad: frena hacia el final */
    animation-delay: 0.5s;              /* espera 0,5 s antes de empezar */
    animation-iteration-count: 1;       /* se reproduce una sola vez */
    animation-direction: normal;        /* del primer paso al último */
    animation-fill-mode: backwards;     /* aplica el estado inicial durante la espera */
}
```

| Propiedad | Función | Por defecto | Valores habituales |
|---|---|---|---|
| `animation-name` | Nombre del `@keyframes` a reproducir | `none` | `aparicion` |
| `animation-duration` | Duración de una reproducción | `0s` | `0.4s`, `300ms` |
| `animation-timing-function` | Curva de velocidad | `ease` | `ease`, `linear`, `ease-out`... |
| `animation-delay` | Espera antes de empezar (un valor negativo empieza a mitad de camino) | `0s` | `0.5s`, `-1s` |
| `animation-iteration-count` | Número de reproducciones | `1` | `3`, `0.5` (la mitad), `infinite` |
| `animation-direction` | Sentido de reproducción | `normal` | `normal`, `reverse`, `alternate`, `alternate-reverse` |
| `animation-fill-mode` | Lo que se muestra antes y después de la reproducción | `none` | `none`, `forwards`, `backwards`, `both` |
| `animation-play-state` | Reproducción o pausa | `running` | `running`, `paused` |

| `animation-direction` | Efecto |
|---|---|
| `normal` | Cada reproducción va del principio al final |
| `reverse` | Cada reproducción va del final al principio |
| `alternate` | Ida, luego vuelta, luego ida... (la primera reproducción va en el sentido normal) |
| `alternate-reverse` | Vuelta, luego ida... (la primera reproducción va en el sentido inverso) |

| `animation-fill-mode` | Durante la espera (`animation-delay`) | Después del final |
|---|---|---|
| `none` (por defecto) | Estilo normal del elemento | Vuelta al estilo normal |
| `backwards` | Estado del primer paso | Vuelta al estilo normal |
| `forwards` | Estilo normal del elemento | Se queda en el estado del último paso |
| `both` | Estado del primer paso | Se queda en el estado del último paso |

Sin `backwards` en el ejemplo anterior, la notificación sería visible durante los 0,5 s de espera, luego desaparecería de golpe para reaparecer con un fundido. A la inversa, una animación que termina en `opacity: 0` vuelve a ser visible al final sin `forwards`.

| Curva (`timing-function`) | Velocidad |
|---|---|
| `ease` (por defecto) | Inicio progresivo, parte central rápida, final progresivo |
| `linear` | Constante |
| `ease-in` | Lenta al principio, luego rápida |
| `ease-out` | Rápida al principio, luego frena |
| `ease-in-out` | Lenta al principio y al final |
| `cubic-bezier(a, b, c, d)` | Curva a medida, regulada por cuatro números |
| `steps(n)` | `n` saltos bruscos, sin fluidez |

Las demás formas de escribirlas se enumeran en la [página de MDN sobre `animation-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function) (*MDN Web Docs*, la documentación de referencia de la web editada por Mozilla). El atajo `animation` reúne las propiedades en una línea, en un orden libre salvo para las dos duraciones (la primera es la duración, la segunda el retraso). Con más de dos pasos, se colocan por porcentaje del tiempo:

```css
/* una bolita que crece y luego se encoge: tres pasos repartidos en el tiempo */
@keyframes pulsacion {
    0%   { transform: scale(1); }       /* al principio: tamaño normal */
    50%  { transform: scale(1.3); }     /* a mitad de camino: 130 % */
    100% { transform: scale(1); }       /* al final: vuelta al tamaño normal */
}

.carga {
    /* nombre, duración, curva, repetición infinita: las cuatro propiedades en una línea */
    animation: pulsacion 1.2s ease-in-out infinite;
}
```

## Cómo dibuja el navegador una página

Una pantalla muestra una sucesión de **imágenes** (*frames*), como una película. El número de imágenes mostradas por segundo se llama **frecuencia de imagen** (*FPS*, *frames per second*): la mayoría de las pantallas se refrescan 60 veces por segundo ([web.dev](https://web.dev/articles/rendering-performance), el sitio de documentación de Google sobre la web). Un segundo equivale a 1000 ms, así que el navegador dispone de 1000 / 60, es decir, unos **16,7 ms** para producir cada imagen. Si tarda más, salta una imagen y la animación se entrecorta. En la práctica, el navegador tiene además su propio trabajo en cada imagen: web.dev aconseja apuntar a unos 10 ms para el código de la página.

El **renderizado** es el trabajo que transforma el HTML y el CSS en píxeles. Se hace en etapas encadenadas, precedidas del cálculo de los estilos (qué regla CSS se aplica a qué elemento, véase [la cascada](/?c=langages&s=css&p=variables-et-cascade)):

| Etapa | Pregunta a la que responde | Observación |
|---|---|---|
| **Maquetación** (*layout*) | ¿Qué tamaño y qué posición tiene cada elemento? | Afecta casi siempre a todo el documento: cambiar un elemento puede desplazar a sus vecinos y a sus padres |
| **Pintado** (*paint*) | ¿De qué color es cada píxel? (fondos, texto, bordes, sombras) | A menudo la etapa más larga |
| **Composición** (*composite*) | ¿Cómo apilar las **capas** (*layers*) en una sola imagen? | La menos costosa. Una capa es como un calco transparente: la **GPU** (la unidad de procesamiento gráfico, véase [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)) puede moverla o volverla transparente sin repintarla |

```
CSS modificado
   |
   v
[ Maquetación ] --> [ Pintado ] --> [ Composición ] --> pantalla
 tamaño/posición    rellenar los    apilar las
 de cada elemento   píxeles         capas (GPU)

width modificado     : maquetación --> pintado --> composición   (3 etapas)
color modificado     :                 pintado --> composición   (2 etapas)
transform modificado :                             composición  (1 etapa)
```

Las etapas están encadenadas: si una debe rehacerse, todas las siguientes también. Según la propiedad que anime una animación, el navegador debe rehacer en cada imagen una, dos o tres etapas.

| Propiedad animada | Etapas rehechas en cada imagen |
|---|---|
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | Maquetación, pintado, composición |
| `color`, `background-color`, `border-color`, `box-shadow` (sombra alrededor del elemento) | Pintado, composición |
| `transform`, `opacity` | Solo composición |

Para una propiedad que no aparece en esta tabla, las herramientas de desarrollo del navegador indican las etapas rehechas (véase más abajo). La tabla supone que el elemento que se mueve está en su propia capa, algo que el navegador decide por lo general solo durante una animación CSS.

## Por qué animar solo `transform` y `opacity`

Según [web.dev](https://web.dev/articles/animations-overview), son las dos únicas propiedades que los navegadores animan a bajo coste, por dos razones.

**Razón 1: ninguna maquetación ni pintado que rehacer.** Animar `left` o `width` obliga al navegador a recalcular la geometría en cada imagen, es decir, 60 veces por segundo, y a repintar. Animar `transform` solo exige la composición.

**Razón 2: el trabajo puede salir del hilo principal.** Un **hilo** (*thread*, o hilo de ejecución) es una secuencia de instrucciones que el procesador ejecuta; un programa puede tener varios en paralelo (véase [los subprocesos en C](/?c=langages&s=c&p=threads)). El **hilo principal** del navegador ejecuta los estilos, la maquetación, el pintado y todo el JavaScript de la página, [uno a la vez](/?c=langages&s=javascript&p=asynchrone). Otro hilo, el **compositor**, solo hace la composición. Las animaciones CSS de `transform` y `opacity` pueden ejecutarse en ese hilo: siguen funcionando incluso cuando el hilo principal está ocupado (un cálculo largo de JavaScript, por ejemplo).

```
Animar `left` o `width`: el hilo principal debe trabajar en cada imagen
  hilo principal  : [maquetación][pintado]        [maquetación][pintado]...
  hilo compositor :                  [composición]                 [composición]

Animar `transform` u `opacity`: el hilo principal queda libre
  hilo principal  : libre para el JavaScript, los clics, el desplazamiento
  hilo compositor : [composición]  [composición]  [composición]...   (GPU)
```

La comparación con el mismo movimiento escrito de dos formas:

```css
/* las dos cajas tienen el mismo tamaño de partida */
.caja-mala, .caja-buena {
    width: 100px;                       /* anchura: 100 píxeles */
    height: 100px;                      /* altura: 100 píxeles */
    background-color: #1a4fd6;          /* fondo azul */
}

/* MAL: left, width y height cambian la maquetación en cada imagen */
.caja-mala {
    position: relative;                 /* necesario para que `left` actúe */
    /* infinite alternate: vaivén sin fin, para poder observarlo */
    animation: mover-izquierda 2s ease-in-out infinite alternate;
}
@keyframes mover-izquierda {
    from { left: 0;     width: 100px; height: 100px; }
    to   { left: 200px; width: 150px; height: 150px; }
}

/* BIEN: un movimiento y un agrandamiento comparables, sin tocar la maquetación */
.caja-buena {
    animation: mover-transform 2s ease-in-out infinite alternate;
}
@keyframes mover-transform {
    from { transform: translateX(0)     scale(1); }
    /* scale(1.5): 1,5 x 100 px = 150 px, agrandado alrededor del centro */
    to   { transform: translateX(200px) scale(1.5); }
}
```

| Efecto deseado | A evitar (rehace la maquetación) | Preferible |
|---|---|---|
| Desplazar | `left`, `top`, `margin` | `transform: translateX()` / `translateY()` |
| Agrandar o reducir | `width`, `height` | `transform: scale()` |
| Hacer aparecer o desaparecer | `height` o `width` hacia `0` | `opacity` |
| Animar una sombra | `box-shadow` | Poner la sombra final en un [pseudoelemento](/?c=langages&s=css&p=selecteurs) y animar su `opacity` |

Dos límites de `scale`: estira también el contenido (el texto se deforma, las esquinas redondeadas también), así que conviene más a las formas y a los fondos que a los bloques de texto; y el espacio reservado en la página no cambia, de modo que el elemento agrandado puede cubrir a otros. Un `transform` en un ancestro tiene por último efectos secundarios sobre los descendientes en `position: fixed`, descritos en el [capítulo sobre el posicionamiento](/?c=langages&s=css&p=positionnement).

La ganancia real depende de la página, del dispositivo y del navegador: se mide (véase [Medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)). [La guía de web.dev](https://web.dev/articles/animations-guide) describe tres herramientas de **Chrome DevTools** (las herramientas de desarrollo integradas en Chrome, el navegador de Google) para verificar una animación:

| Herramienta (panel de DevTools) | Lo que muestra |
|---|---|
| *Performance*, pestaña *Summary* | Un valor de *Rendering* distinto de cero indica que la animación hace trabajo de maquetación |
| *Rendering*, casilla *FPS meter* | El número de imágenes mostradas por segundo y las imágenes saltadas |
| *Rendering*, casilla *Paint Flashing* | Las zonas repintadas en cada imagen (toda la pantalla parpadea: hay que investigarlo) |

## `will-change`: avisar al navegador

`will-change` indica al navegador qué propiedades van a cambiar, para que prepare la capa con antelación. Pero cada capa ocupa memoria: mal usada, la propiedad ralentiza la página en lugar de acelerarla. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change) la presenta como un **último recurso** frente a un problema de rendimiento ya comprobado, y no como una precaución. Con `transform` u `opacity`, crea además desde el principio un contexto de apilamiento (véase el [capítulo sobre el posicionamiento](/?c=langages&s=css&p=positionnement)).

```css
/* MAL: pide una capa para CADA elemento de la página, para siempre */
* {
    will-change: transform;
}
```

El buen uso es ponerla justo antes de la animación y quitarla justo después. El retraso de 0,5 s de la notificación deja aquí al navegador tiempo para prepararse:

```html
<!-- hidden: atributo que oculta el elemento (como display: none) mientras esté presente -->
<div id="notificacion" class="notificacion" hidden>Guardado</div>
```

```javascript
// Busca la notificación en la página
const notificacion = document.getElementById("notificacion");

function mostrarNotificacion() {
    // 1. Antes: avisa al navegador (en JavaScript, `will-change` se escribe `willChange`)
    notificacion.style.willChange = "transform, opacity";
    // 2. Durante: muestra el elemento, lo que inicia la animación `aparicion`
    notificacion.hidden = false;
    // 3. Después: `animationend` es el evento emitido al final de la animación CSS
    notificacion.addEventListener("animationend", () => {
        // `auto` devuelve al navegador su comportamiento normal
        notificacion.style.willChange = "auto";
    }, { once: true });   // `once: true`: esta función solo se llama una vez
}
```

## `prefers-reduced-motion`: respetar a quienes el movimiento marea

Algunas personas sufren trastornos del **sistema vestibular** (el oído interno, que gestiona el equilibrio): un movimiento en pantalla, sobre todo un gran desplazamiento o un zoom, les provoca vértigo, náuseas y dolor de cabeza, hasta el punto de tener que tumbarse a veces (según el [WCAG](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), las reglas de accesibilidad web de referencia, cuyos niveles A, AA y AAA se explican en el [capítulo sobre la accesibilidad](/?c=ui-ux&p=accessibilite-ux)). Otras tienen **epilepsia fotosensible**: ciertos parpadeos desencadenan crisis. El sistema operativo (Windows, macOS, Android... el software básico del dispositivo) ofrece un ajuste «reducir animaciones», que el CSS lee con la **media query** (condición `@media`, vista en el [capítulo sobre el diseño adaptativo](/?c=langages&s=css&p=responsive-et-media-queries)) `prefers-reduced-motion`.

| Valor | Significado |
|---|---|
| `no-preference` | El usuario no ha pedido nada |
| `reduce` | El usuario ha pedido reducir el movimiento |

El ajuste se encuentra aquí, según [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) (rótulos de origen en inglés):

| Sistema | Ruta |
|---|---|
| Windows 11 | Settings > Accessibility > Visual Effects > Animation Effects |
| macOS | System Settings > Accessibility > Display (o Motion) > Reduce motion |
| iOS | Settings > Accessibility > Motion |
| Android 9 y posteriores | Settings > Accessibility > Remove animations |

Reducir no significa suprimirlo todo: se retiran los grandes desplazamientos, los zooms, las rotaciones y los bucles, y se conserva un cambio suave, como un fundido. Retomemos `.notificacion`:

```css
/* un fundido solo, sin movimiento: sustituye a `aparicion` cuando se pide `reduce` */
@keyframes aparicion-suave {
    from { opacity: 0; }                /* invisible */
    to   { opacity: 1; }                /* visible */
}

/* @media: la regla solo se aplica si la condición entre paréntesis es verdadera */
@media (prefers-reduced-motion: reduce) {
    .notificacion {
        animation-name: aparicion-suave;    /* ya no hay deslizamiento hacia arriba */
        animation-duration: 0.2s;           /* más corto */
    }

    .carga {
        animation: none;                /* sin bucle: la bolita permanece inmóvil */
    }
}
```

También se puede invertir la lógica: la animación solo existe para quienes no han pedido nada, y todo lo que no se reconoce permanece inmóvil.

```css
@media (prefers-reduced-motion: no-preference) {
    .carga {
        animation: pulsacion 1.2s ease-in-out infinite;   /* animada solo aquí */
    }
}
```

El [capítulo sobre el diseño adaptativo](/?c=langages&s=css&p=responsive-et-media-queries) presenta una regla global (duraciones reducidas a `0.001ms`, que conserva los eventos `animationend`); el presente ejemplo va más allá sustituyendo la animación por una variante suave. Tres criterios del WCAG conciernen al movimiento:

| Criterio | Nivel | Exigencia |
|---|---|---|
| [2.3.1 Tres destellos](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | A | Nada que parpadee más de tres veces por segundo (o por debajo de los umbrales definidos) |
| [2.2.2 Pausa, detención, ocultación](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | A | Un movimiento automático de más de cinco segundos, presentado junto a otros contenidos, debe poder pausarse, detenerse u ocultarse (salvo que sea esencial) |
| [2.3.3 Animación provocada por interacciones](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | AAA | Un movimiento desencadenado por una interacción puede desactivarse (salvo que sea esencial) |

Para probarlo, el panel *Rendering* de DevTools permite emular `prefers-reduced-motion` ([documentación](https://developer.chrome.com/docs/devtools/rendering/emulate-css)).

## Las trampas en el código

La primera trampa afecta a `transform`: dentro de un `@keyframes`, **reemplaza** el valor `transform` del elemento, no se le suma.

```css
/* un modal (ventana superpuesta a la página), centrado: translate(-50%, -50%) lo devuelve
   a la mitad de SU anchura y de SU altura */
.modal-malo, .modal-bueno {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.modal-malo { animation: zoom-malo 0.3s backwards; }
.modal-bueno { animation: zoom-bueno 0.3s backwards; }

/* MAL: este valor reemplaza al translate, el modal pierde su centrado */
@keyframes zoom-malo {
    from { transform: scale(0.8); }
}

/* BIEN: se repite el translate en el paso inicial, y luego se añade scale */
@keyframes zoom-bueno {
    from { transform: translate(-50%, -50%) scale(0.8); }
}
```

La segunda trampa es una animación de tamaño: si una banda crece en altura, todo lo que la sigue en el flujo normal (véase el [posicionamiento](/?c=langages&s=css&p=positionnement)) desciende en cada imagen, y el texto que se lee salta. La solución es sacarla del flujo con `position: fixed`.

```css
/* MAL: la altura crece, todo lo que está debajo se empuja en cada imagen */
.banda-mala {
    height: 0;
    animation: abrir 0.4s forwards;     /* forwards: se queda abierta al final */
}
@keyframes abrir {
    to { height: 60px; }
}

/* BIEN: la banda se coloca encima (fixed), el resto de la página nunca se mueve */
.banda-buena {
    position: fixed;                    /* sacada del flujo, pegada a la ventana */
    top: 0;
    left: 0;
    right: 0;
    height: 60px;                       /* tamaño final reservado desde el principio */
    animation: bajar 0.4s backwards;
}
@keyframes bajar {
    from { transform: translateY(-100%); }  /* -100 % de su altura: fuera de la pantalla */
}
```

La tercera es `transition: all`, que anima cualquier propiedad que cambie, incluidas las que no se habían previsto. `all` es también el valor por defecto de `transition-property` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-property)): escribir `transition: 0.3s` sin nombre de propiedad equivale a `transition: all 0.3s`.

```css
/* MAL: si un script cambia `width` o `margin`, la maquetación también se anima */
.boton-todo { transition: all 0.3s; }

/* MAL también: sin nombre de propiedad, el valor por defecto es `all` */
.boton-implicito { transition: 0.3s; }

/* BIEN: solo las propiedades deseadas, separadas por una coma */
.boton-preciso { transition: transform 0.3s, opacity 0.3s; }
```

La última es animar en JavaScript con `setInterval` (una función que llama a otra a intervalos fijos; se compara con `requestAnimationFrame` en el capítulo sobre las [animaciones en canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)). Esto acumula los defectos: el código se ejecuta en el hilo principal, no está sincronizado con el refresco de la pantalla, y `left` rehace la maquetación en cada llamada.

```javascript
// Busca la caja (un <div id="caja-js"> con `position: relative`)
const caja = document.getElementById("caja-js");
let izquierda = 0;                      // posición horizontal actual, en píxeles

// MAL: se llama cada 16 ms, sin relación con la pantalla
setInterval(() => {
    izquierda += 2;                     // `+= 2` suma 2 a `izquierda`
    caja.style.left = izquierda + "px"; // `+` pega «px»; `left` rehace la maquetación
}, 16);
```

La buena solución es una animación CSS (`transition` o `@keyframes`), que el navegador optimiza por sí mismo, incluso reduciendo la frecuencia de una animación en una pestaña no visible ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using)). Si el JavaScript es indispensable (animación controlada por el ratón, por ejemplo), se usa [`requestAnimationFrame`](/?c=langages&s=javascript&p=canvas-2d-et-animations) (que llama a una función justo antes del siguiente refresco de la pantalla) y `transform`, o la API [`element.animate()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), que permite al navegador optimizar como en CSS.

```javascript
let inicio = null;                      // fecha de la primera llamada, anotada al principio

function avanzar(ahora) {               // `ahora`: fecha dada por el navegador (ms)
    if (inicio === null) inicio = ahora;        // anota el comienzo en la primera llamada
    // Math.min conserva el menor de los dos números: la caja se detiene en 200 píxeles
    const izquierda = Math.min((ahora - inicio) / 10, 200);    // 1 píxel cada 10 ms
    // los backticks insertan el valor de `izquierda` en el texto, en lugar de ${izquierda}
    caja.style.transform = `translateX(${izquierda}px)`;   // transform, no left
    if (izquierda < 200) requestAnimationFrame(avanzar);   // programa la imagen siguiente
}
requestAnimationFrame(avanzar);         // arranca
```

## Resumen de las propiedades

| Propiedad | Naturaleza | Valores | Sirve para |
|---|---|---|---|
| `transition` | Atajo | `transform 0.2s ease-out` | Animar el paso entre dos valores |
| `@keyframes` | Regla | Pasos `from`/`to` o en `%` | Describir una secuencia de pasos |
| `animation` (y `animation-*`) | Atajo | Nombre, duración, curva, retraso, repetición... | Reproducir una secuencia de pasos |
| `animation-play-state` | Propiedad | `running`, `paused` | Pausar o reanudar |
| `transform` | Propiedad | `translateX()`, `scale()`, `rotate()` | Desplazar, agrandar, girar (composición) |
| `opacity` | Propiedad | `0` a `1` | Regular la transparencia (composición) |
| `will-change` | Propiedad | `transform`, `opacity`, `auto` | Preparar una capa, como último recurso |
| `@media (prefers-reduced-motion)` | Media query | `reduce`, `no-preference` | Adaptar el movimiento al ajuste del sistema |

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Animar `left`, `top`, `width`, `height` o `margin` | Maquetación y pintado rehechos en cada imagen. Usar `transform` |
| Animar `box-shadow` o un color en un elemento grande | El pintado se rehace en cada imagen. Animar la `opacity` de un pseudoelemento |
| `transition: all` o `transition: 0.3s` | Toda propiedad que cambie se anima, la maquetación incluida. Nombrar las propiedades |
| `will-change` puesto en todo, o nunca retirado | Cada capa cuesta memoria. Ponerlo antes, quitarlo después, como último recurso |
| Animación que cambia el tamaño de un elemento del flujo | El contenido de debajo salta en cada imagen. Reservar el espacio, animar `transform` |
| `transform` del `@keyframes` que sobrescribe el del elemento | Se pierde el centrado o la rotación inicial. Repetir el valor base |
| Olvidar `animation-fill-mode` | Elemento visible durante la espera, o vuelta brusca al final |
| Animación `infinite` sobre un contenido que no necesita moverse | Distracción, batería consumida, molestia vestibular. Reservar para indicadores útiles (carga) |
| Contenido que parpadea más de tres veces por segundo | Riesgo de crisis de epilepsia fotosensible (WCAG 2.3.1) |
| Animar con `setInterval` y `left` | Hilo principal cargado, ritmo sin relación con la pantalla. CSS, o `requestAnimationFrame` y `transform` |
| Ignorar `prefers-reduced-motion` | Náuseas y vértigos en algunos usuarios |
| `animation: none` cuando el código espera `animationend` | El evento nunca llega. Reducir la duración (véase el capítulo sobre el diseño adaptativo) |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Animar `transform` y `opacity` solo | Composición sola, trabajo posible fuera del hilo principal |
| `transition` para una reacción, `@keyframes` para una secuencia | Cada herramienta para su caso, sin JavaScript |
| Nombrar las propiedades de una transición | Ninguna animación involuntaria |
| Apuntar a 60 imágenes por segundo (16,7 ms por imagen) | Es el ritmo de una pantalla habitual |
| Verificar en las herramientas del navegador en lugar de suponer | Solo la medición dice si la animación es fluida |
| Poner `will-change` justo antes, quitarlo justo después | Memoria liberada, capa preparada a tiempo |
| Prever una variante `prefers-reduced-motion` para cada movimiento | Sustituir los grandes desplazamientos por un fundido |
| Reservar el espacio de un elemento animado antes de la animación | Ningún desplazamiento del contenido |
| Limitar los bucles a los indicadores útiles, con pausa posible a partir de 5 s | Menos distracción (WCAG 2.2.2) |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | `transition` anima dos estados, `@keyframes` más pasos. El renderizado encadena maquetación, pintado y composición: `transform` y `opacity` solo necesitan la composición, que puede salir del hilo principal. Una pantalla a 60 imágenes por segundo deja unos 16,7 ms por imagen. `will-change` es un último recurso, puesto y luego retirado. `prefers-reduced-motion: reduce` sustituye el movimiento por un cambio suave. |
| **Trampas a evitar** | Animar `left`, `width` o `margin`; `transition: all`; `will-change` en todas partes; animación de tamaño que empuja el contenido; `transform` del `@keyframes` que sobrescribe el existente; `fill-mode` olvidado; bucles inútiles; `setInterval`; ignorar `prefers-reduced-motion`. |
| **Buenas prácticas** | `transform` y `opacity` solos, propiedades nombradas en las transiciones, espacio reservado, variante suave para `reduce`, verificación con las herramientas del navegador, `will-change` raro y temporal. |
