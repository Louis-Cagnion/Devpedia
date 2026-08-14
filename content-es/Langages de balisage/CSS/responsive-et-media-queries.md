---
order: 7
---

# El diseño adaptativo y las consultas de medios

El **diseño adaptativo** consiste en diseñar una página que se adapte a cualquier tamaño de pantalla (móvil, tableta, ordenador): una necesidad desde que la mayor parte del tráfico web se realiza en móvil, y la razón principal de ser de las **media queries**.

## Las unidades relativas, incluso antes de las media queries

```css
div {
    width: 300px;       /* fijo, no se adapta a NADA */
    width: 50%;         /* relativo al padre */
    font-size: 1.5rem;  /* relativo al tamaño de fuente raíz (<html>), independiente del padre */
    font-size: 1.5em;   /* relativo al tamaño de fuente del PADRE directo (puede acumularse en cascada) */
    width: 50vw;        /* relativo al ancho de la ventana (viewport width) */
    height: 100vh;      /* relativo a la altura de la ventana (viewport height) */
}
```

> **Nota:** `rem` suele preferirse a `em` para los tamaños de fuente, ya que se mantiene predecible incluso en componentes anidados (un `em` en un elemento cuyo padre ya tiene un `em` modificado tiende a acumularse de forma no deseada); `rem` siempre se basa en la misma referencia (`<html>`), sin importar la profundidad de anidación.

## Las media queries

```css
/* Estilo por defecto, pensado "mobile first" */
.conteneur {
    flex-direction: column;
}

/* Se aplica ÚNICAMENTE si el ancho de pantalla alcanza al menos 768px */
@media (min-width: 768px) {
    .conteneur {
        flex-direction: row;
    }
}

/* Se aplica ÚNICAMENTE si el ancho de pantalla es de 767px como máximo */
@media (max-width: 767px) {
    nav { display: none; }
}
```

## "Mobile first" frente a "desktop first"

```css
/* Enfoque mobile first: el estilo base se dirige al móvil, luego se AMPLÍA */
.grille { grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .grille { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
    .grille { grid-template-columns: 1fr 1fr 1fr; }
}
```

> **Buenas prácticas:** el enfoque "*mobile first*" (utilizar `min-width`, diseñar primero para la pantalla más pequeña y, a continuación, añadir complejidad para las pantallas más grandes) suele preferirse al contrario: obliga a pensar primero en el contenido esencial y se ajusta al hecho de que la mayor parte del tráfico web procede de dispositivos móviles.

## Puntos de interrupción (*breakpoints*) habituales

| Ancho | Público objetivo típico |
|---|---|
| `< 768px` | Móvil |
| `768px – 1023px` | Tableta |
| `≥ 1024px` | Ordenador de sobremesa |

> **Nota:** estos valores no constituyen una norma oficial; varían según los proyectos y los frameworks CSS. Lo que realmente importa es ajustar los puntos de ruptura en función del propio contenido (el momento en el que el diseño empieza a fallar visualmente), y no solo reproducir tamaños físicos concretos de los dispositivos.

## Otras media features útiles

```css
@media (orientation: portrait) { }       /* pantalla más alta que ancha */
@media (prefers-color-scheme: dark) { }  /* el usuario activó el modo oscuro a nivel del sistema */
@media print { }                         /* estilos aplicados únicamente al imprimir */
```

Véase también [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), cuyo `repeat(auto-fit, minmax(...))` permite obtener un comportamiento adaptativo **sin escribir ninguna media query**, una alternativa complementaria que conviene conocer.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El diseño adaptativo adapta una página a cualquier tamaño de pantalla, mediante unidades relativas (`%`, `rem`, `vw`/`vh`) y media queries (`@media (min-width: ...)`) que aplican un estilo solo a determinados anchos. |
| **Herramientas utilizables** | `rem`/`em`/`vw`/`vh`, `@media (min-width/max-width/orientation/prefers-color-scheme)`. |
| **Trampas a evitar** | Basar los puntos de interrupción en tamaños de dispositivos concretos en lugar del momento en que el diseño realmente empieza a fallar visualmente. |
| **Buenas prácticas** | Adoptar un enfoque *mobile first* (`min-width`, diseñar primero para la pantalla más pequeña); preferir `rem` a `em` para los tamaños de fuente, más predecible en caso de anidación. |
