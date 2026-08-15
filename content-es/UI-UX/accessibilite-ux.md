---
order: 6
---

# Accesibilidad básica (UX)

El capítulo [Atributos data-* y accesibilidad (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite) cubre el *cómo programar* la accesibilidad. Este capítulo cubre el *por qué* del lado del diseño: decisiones a tomar desde la maqueta, antes de escribir la menor línea de código: corregirlas después siempre cuesta más caro.

## Los niveles de conformidad WCAG

El [WCAG](/?c=ui-ux&p=couleur-et-contraste), ya visto en el capítulo sobre el color por sus relaciones de contraste, en realidad define tres niveles globales de conformidad, que cubren mucho más que el simple contraste:

| Nivel | Qué cubre | Uso típico |
|---|---|---|
| A | El mínimo indispensable: sin él, una parte del contenido es totalmente inutilizable para ciertos usuarios | Rara vez suficiente por sí solo |
| AA | El nivel generalmente buscado por defecto en un proyecto: buen equilibrio entre accesibilidad real y esfuerzo de implementación | Estándar de referencia para la mayoría de los sitios y aplicaciones |
| AAA | Un nivel reforzado, difícil de alcanzar en un sitio entero | Reservado a contextos específicos (servicios esenciales, contenido explícitamente destinado a un público con discapacidad) |

Las relaciones de contraste concretas asociadas a estos niveles se detallan en el capítulo [Color y contraste](/?c=ui-ux&p=couleur-et-contraste).

## Tamaño mínimo de las zonas clicables y táctiles

Un **objetivo táctil** (*touch target*) es la zona que un dedo o un cursor debe alcanzar para activar un elemento: puede ser más grande que el elemento visual en sí (un icono) sin que se note.

| Referencia | Tamaño mínimo recomendado |
|---|---|
| Apple ([Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)) | 44×44 px |
| Google ([Material Design](https://m3.material.io)) | 48×48 dp |
| WCAG (criterio 2.5.5, nivel AAA) | 44×44 px |

> **Trampa:** botones o enlaces demasiado pequeños o demasiado próximos, en particular en móvil. El usuario toca el elemento equivocado: un riesgo mayor para una persona con temblor o una discapacidad motriz, pero que molesta a cualquiera (en un autobús, caminando, con dedos grandes).
>
> **Buena práctica:** prever una zona clicable de al menos 44×44px incluso cuando el elemento visual (un icono) es más pequeño: un espacio invisible alrededor del icono puede ampliar la zona realmente clicable sin cambiar su apariencia.

## Diseñar la navegación por teclado desde la maqueta

La **navegación por teclado** permite usar toda una interfaz sin ratón: `Tab` para pasar de un elemento interactivo al siguiente, `Enter`/`Espacio` para activarlo, `Esc` para cerrar una ventana. Es indispensable para los usuarios que no pueden usar un ratón, y también acelera el uso para cualquiera.

> **Trampa:** pensar la navegación por teclado solo al momento de programar, una vez fijada la maqueta. El orden visual de los elementos, elegido libremente en la maqueta, no siempre corresponde entonces a un orden de tabulación lógico: un ajuste en código (reordenar manualmente, reestructurar el HTML) se vuelve necesario después.
>
> **Buena práctica:** definir desde la maqueta el orden lógico de navegación (qué elemento recibe el foco primero, y luego en qué orden). Un orden que sigue el sentido de lectura natural (de arriba hacia abajo, de izquierda a derecha) evita este problema en la gran mayoría de los casos.

## Pasar a la implementación

La implementación técnica de estos principios (atributos `tabindex`, roles ARIA, foco visible) se cubre en [Atributos data-* y accesibilidad (ARIA)](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La accesibilidad UX se decide antes del código: nivel WCAG buscado (A/AA/AAA), zonas clicables suficientemente grandes (44×44px mínimo), y orden de navegación por teclado lógico desde la maqueta. |
| **Herramientas utilizables** | Ninguna herramienta específica: estas decisiones se toman en el diseño (maqueta), antes de la implementación técnica. |
| **Trampas a evitar** | Zonas clicables demasiado pequeñas o demasiado próximas, sobre todo en móvil; posponer la reflexión sobre la navegación por teclado hasta el momento de programar. |
| **Buenas prácticas** | Apuntar al nivel AA por defecto; prever zonas clicables de al menos 44×44px; definir el orden de tabulación desde la maqueta, alineado con el sentido de lectura natural. |
