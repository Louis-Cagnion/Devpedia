---
order: 7
---

# El diseño adaptativo y las consultas de medios

El **diseño adaptativo** consiste en diseñar una página que se adapte a cualquier tamaño de pantalla (móvil, tableta, ordenador), algo imprescindible desde que la mayor parte del tráfico web se realiza a través de dispositivos móviles, y la razón principal de ser de **las consultas de medios**.

## Las unidades relativas, incluso antes de las consultas de medios

```css
div {
    width: 300px;     /* fixe, ne s'adapte à RIEN */
    width: 50%;         /* relatif au parent */
    font-size: 1.5rem;    /* relatif à la taille de police racine (<html>), indépendant du parent */
    font-size: 1.5em;      /* relatif à la taille de police du PARENT direct (peut s'accumuler en cascade) */
    width: 50vw;             /* relatif à la largeur de la fenêtre (viewport width) */
    height: 100vh;             /* relatif à la hauteur de la fenêtre (viewport height) */
}
```

> **Nota:** Por lo general, se prefiere «`rem`» a «`em`» para los tamaños de fuente, ya que el primero sigue siendo predecible incluso en componentes anidados (un «`em`» en un elemento cuyo padre ya tiene un «`em`» modificado suele acumularse de forma no deseada); «`rem`» siempre se basa en la misma referencia («`<html>`»), independientemente de la profundidad de anidación.

## Las consultas de medios

```css
/* Style par défaut, pensé "mobile first" */
.conteneur {
    flex-direction: column;
}

/* S'applique UNIQUEMENT si la largeur d'écran atteint au moins 768px */
@media (min-width: 768px) {
    .conteneur {
        flex-direction: row;
    }
}

/* S'applique UNIQUEMENT si la largeur d'écran est de 767px maximum */
@media (max-width: 767px) {
    nav { display: none; }
}
```

## «Mobile first» frente a «desktop first»

```css
/* Approche mobile first : le style de base cible le mobile, on ÉLARGIT ensuite */
.grille { grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .grille { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
    .grille { grid-template-columns: 1fr 1fr 1fr; }
}
```

> **Buenas prácticas:** el enfoque «*mobile first*» (utilizar `min-width`, diseñar primero para la pantalla más pequeña y, a continuación, añadir complejidad para las pantallas más grandes) suele preferirse al contrario, ya que obliga a pensar primero en el contenido esencial y se ajusta al hecho de que la mayor parte del tráfico web procede de dispositivos móviles.

## Puntos de interrupción (*breakpoints*) habituales

| Ancho | Público objetivo típico |
|---|---|
| `< 768px` | Móvil |
| `768px – 1023px` | Tableta |
| `≥ 1024px` | Ordenador de sobremesa |

> **Nota:** estos valores no constituyen una norma oficial; varían según los proyectos y los frameworks CSS. Lo que realmente importa es ajustar los puntos de ruptura en función del propio contenido (el momento en el que el diseño empieza a fallar visualmente), y no solo reproducir tamaños físicos concretos de los dispositivos.

## Otros recursos multimedia útiles

```css
@media (orientation: portrait) { }     /* écran plus haut que large */
@media (prefers-color-scheme: dark) { }  /* l'utilisateur a activé le mode sombre au niveau système */
@media print { }                          /* styles appliqués uniquement à l'impression */
```

Véase también el capítulo sobre CSS Grid, en el que `repeat(auto-fit, minmax(...))` permite conseguir un comportamiento adaptativo **sin escribir ninguna media query**, una alternativa complementaria que conviene conocer.
