---
order: 11
---

# Las herramientas del oficio

Los capítulos anteriores cubren conceptos (jerarquía, color, tokens, wireframe...) independientemente de cualquier software concreto. En la práctica, un diseñador de interfaz pasa la mayor parte de su tiempo en una herramienta de diseño dedicada, y a veces en una herramienta de animación para las interacciones más avanzadas; este capítulo nombra ese panorama de herramientas, sin convertirse en un tutorial: cada una merece un aprendizaje propio, fuera del alcance de este sitio.

## Las herramientas de diseño de interfaz

La mayoría de las herramientas de este tipo ([Figma](https://www.figma.com), [Sketch](https://www.sketch.com), Adobe XD, [Penpot](https://penpot.app)...) comparten los mismos conceptos básicos, con nombres a veces diferentes:

| Concepto | Rol | Equivalente ya visto |
|---|---|---|
| Capa (*layer*) | Cada elemento (texto, forma, imagen) existe de forma independiente, apilado sobre los demás | Similar al apilamiento de los elementos HTML en un documento |
| Componente | Un elemento reutilizable (botón, tarjeta...), definido una vez e instanciado en todas partes | La [biblioteca de componentes](/?c=ui-ux&p=design-systems) de un design system |
| Auto-layout | Un contenedor que reposiciona y redimensiona su contenido automáticamente según reglas (espaciado, alineación), en lugar de posiciones fijadas a mano | [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) en CSS: el mismo principio, en la herramienta de diseño en lugar de en el código |

Trabajar con componentes y auto-layout en la herramienta de diseño, en lugar de con posiciones fijas, produce maquetas que ya se comportan como lo hará la interfaz programada (un botón que se adapta a la longitud de su texto, por ejemplo); la brecha entre la maqueta y el resultado programado se reduce así.

> **Trampa:** construir una maqueta enteramente en posiciones fijas, sin componentes ni auto-layout, porque "es más rápido por esta vez". Cada cambio posterior (un texto más largo, un nuevo idioma) debe entonces aplicarse a mano en cada ocurrencia en lugar de en una sola definición compartida.
>
> **Buena práctica:** construir un componente en cuanto un elemento aparece una segunda vez de forma idéntica, y usar el auto-layout por defecto en lugar del posicionamiento fijo: los mismos reflejos que la [biblioteca de componentes](/?c=ui-ux&p=design-systems) y el uso de [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) del lado del código.

## Las herramientas de animación para interacciones avanzadas

Una transición simple (un botón que cambia ligeramente de color al pasar el cursor) se cubre directamente en CSS. Una interacción más elaborada (varios elementos animados en un orden preciso, un movimiento que reacciona al gesto del usuario, una física de resorte en lugar de una simple aceleración lineal) supera lo que las transiciones CSS básicas cubren cómodamente, y entonces se apoya en una biblioteca JavaScript dedicada a la animación ([GSAP](https://gsap.com), Framer Motion, entre otras):

| | Transición CSS | Biblioteca de animación JS |
|---|---|---|
| Adecuada para | Un cambio de estado simple (hover, aparición) | Secuencias de varias animaciones coordinadas, gestos, una física de movimiento |
| Control desde el código | Limitado (activado por un cambio de estado CSS) | Fino (iniciar, pausar, encadenar etapas con precisión) |
| Costo | Ninguna dependencia adicional | Una biblioteca externa que cargar y mantener |

> **Trampa:** usar una biblioteca de animación JavaScript para una simple transición de estado (un hover, una aparición) que una transición CSS bastaría para cubrir. El costo (peso de la biblioteca, complejidad de código adicional) supera ampliamente la ganancia en un caso tan simple.
>
> **Buena práctica:** reservar una biblioteca de animación JS para las interacciones que realmente superan lo que cubren las transiciones CSS (secuencias coordinadas, gestos, física de movimiento), no como reflejo por defecto para cualquier animación.

## Elegir una herramienta: la estabilidad antes que la novedad

> **Trampa:** cambiar de herramienta de diseño porque una nueva herramienta está de moda, sin que resuelva un problema concreto encontrado con la herramienta actual. El cambio tiene un costo real: reaprendizaje de todo el equipo, migración de las maquetas existentes, interrupción temporal de la colaboración con los demás roles (desarrolladores, producto) acostumbrados a la herramienta vigente.
>
> **Buena práctica:** elegir una herramienta en función de lo que el equipo y el ecosistema existente ya usan (interoperabilidad con las demás herramientas del proyecto, competencias ya adquiridas), y cambiar solo ante una necesidad concreta no cubierta por la herramienta actual, no por anticipación de una necesidad hipotética.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Las herramientas de diseño de interfaz (Figma y sus alternativas) comparten los mismos conceptos básicos (capas, componentes, auto-layout) que prefiguran directamente la estructura del código final. Una biblioteca de animación JS (GSAP, Framer Motion) toma el relevo de las transiciones CSS para interacciones más elaboradas (secuencias, gestos, física de movimiento). |
| **Herramientas utilizables** | Una herramienta de diseño con componentes y auto-layout (Figma o equivalente); una biblioteca de animación JS para las interacciones que superan una simple transición CSS. |
| **Trampas a evitar** | Construir una maqueta en posiciones fijas sin componentes ni auto-layout. Usar una biblioteca de animación JS para una simple transición que una regla CSS bastaría para cubrir. Cambiar de herramienta por moda en lugar de por necesidad concreta. |
| **Buenas prácticas** | Crear un componente en cuanto un elemento se repite, usar el auto-layout por defecto. Reservar una biblioteca de animación JS para las interacciones realmente complejas. Elegir una herramienta por su adecuación al equipo existente, no por su novedad. |
