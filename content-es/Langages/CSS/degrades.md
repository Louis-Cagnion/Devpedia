---
order: 8
---

# Los degradados CSS (linear, radial, conic)

Un **degradado** (*gradient*) es una transición progresiva entre varios colores, utilizable en cualquier lugar donde valga un color simple (`background`, `border-image`...), sin imagen ni archivo externo. Existen tres formas, que se distinguen por la **dirección** en la que progresa el color.

## `linear-gradient()`: una progresión en línea recta

```css
.barra {
    background: linear-gradient(to right, #4a90d9, #d94a90);
    /* progresa en linea recta, de izquierda a derecha */
}
```

| Parámetro | Rol |
|---|---|
| Dirección (`to right`, `45deg`...) | El eje a lo largo del cual progresa el color |
| Colores (2 o más, separados por comas) | Las etapas de la transición, repartidas uniformemente por defecto |

## `radial-gradient()`: una progresión en círculos concéntricos

```css
.halo {
    background: radial-gradient(circle, #ffffff, #000000);
    /* progresa desde el centro hacia el exterior, en circulos concentricos */
}
```

Parte de un punto central y progresa hacia el exterior, en círculos (o elipses) cada vez más grandes, en lugar de en línea recta.

## `conic-gradient()`: una progresión angular, alrededor de un punto central

```css
.anillo-progreso {
    width: 100px;
    height: 100px;
    border-radius: 50%;   /* hace el elemento redondo */
    background: conic-gradient(#4a90d9 75%, #e0e0e0 0);
    /* el color "gira" alrededor del centro, como las agujas de un reloj */
}
```

A diferencia de los dos anteriores, el color no progresa ni en línea recta ni en círculos concéntricos: **gira** alrededor de un punto central, como las agujas de un reloj. `conic-gradient(#4a90d9 75%, #e0e0e0 0)` rellena el 75% de la vuelta en azul, y el resto en gris: combinado con `border-radius: 50%`, este patrón dibuja un anillo de progreso circular sin ningún SVG (`stroke-dasharray`) ni JavaScript para calcular la forma.

| | `linear-gradient` | `radial-gradient` | `conic-gradient` |
|---|---|---|---|
| Dirección de la progresión | Línea recta | Círculos concéntricos, desde el centro hacia fuera | Rotación alrededor de un punto central |
| Caso de uso típico | Fondo, botón, superposición de legibilidad sobre una imagen | Halo luminoso, viñeta | Anillo/medidor de progreso, rueda de colores |

> **Buena práctica:** `conic-gradient()` en un elemento con `border-radius: 50%` es una alternativa ligera a un anillo de progreso en SVG, siempre que la forma se mantenga como un simple círculo rellenado por porcentaje; pasar a SVG en cuanto el medidor necesite un grosor de trazo variable o extremos redondeados (`stroke-linecap`), que `conic-gradient()` no puede producir.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un degradado transiciona entre varios colores sin necesitar imagen. `linear-gradient` progresa en línea recta, `radial-gradient` en círculos concéntricos desde un centro, `conic-gradient` girando alrededor de un punto central. |
| **Herramientas utilizables** | `linear-gradient(direccion, colores...)`, `radial-gradient(forma, colores...)`, `conic-gradient(colores...)` combinado con `border-radius: 50%` para un anillo de progreso. |
| **Trampas a evitar** | Recrear en SVG/JavaScript un anillo de progreso circular simple que `conic-gradient()` dibuja en una sola línea de CSS. |
| **Buenas prácticas** | Elegir la forma de degradado según la dirección real de la progresión buscada, no por costumbre de usar siempre la misma. Pasar a SVG solo cuando `conic-gradient()` ya no baste (grosor/extremos variables). |
