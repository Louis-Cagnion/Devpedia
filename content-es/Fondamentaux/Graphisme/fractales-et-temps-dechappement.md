---
order: 6
---

# Fractales por tiempo de escape: Mandelbrot y Julia

Una **fractal por tiempo de escape** colorea cada píxel de una imagen según la rapidez con la que una sucesión de números asociada a ese píxel "escapa" hacia el infinito, o nunca lo hace.

## El principio: iterar y contar

Para Mandelbrot, cada píxel de la imagen se convierte en un número complejo `c` (su posición en el plano). Se itera entonces la fórmula `z = z² + c`, partiendo de `z = 0`:

```text
z0 = 0
z1 = z0² + c
z2 = z1² + c
z3 = z2² + c
...
```

Si el módulo de `z` (su distancia al origen) supera un umbral fijo (el **radio de escape**, a menudo `2`), la sucesión "escapa": nunca volverá atrás y crecerá indefinidamente. El número de iteraciones realizadas antes de ese escape determina el color del píxel; si `z` nunca escapa antes de un número máximo de iteraciones fijado, el píxel pertenece al **conjunto de Mandelbrot** y se colorea de negro.

```text
Para cada píxel (convertido en un número complejo c):
    z = 0
    iteraciones = 0
    mientras |z| <= radio_de_escape Y iteraciones < max_iteraciones:
        z = z*z + c
        iteraciones += 1
    color del pixel = funcion(iteraciones)
```

## Mandelbrot vs Julia

| | Mandelbrot | Julia |
|---|---|---|
| `c` | Se convierte en la posición del píxel | Fijo, elegido una vez para toda la imagen |
| `z` inicial | Siempre `0` | Se convierte en la posición del píxel |
| Resultado | Una sola imagen, el mismo "mapa" cada vez | Una imagen distinta para cada valor de `c` elegido |

Julia usa exactamente el mismo bucle de iteración que Mandelbrot; solo cambia la asignación inicial de `c` y `z`.

## Evitar una raíz cuadrada en cada iteración

Calcular el módulo exacto de `z` (`√(parte_real² + parte_imaginaria²)`) en cada iteración exigiría una raíz cuadrada por iteración y por píxel, un cálculo costoso repetido millones de veces. Como solo importa la comparación con el radio de escape, comparar el **cuadrado** del módulo con el **cuadrado** del radio da exactamente el mismo resultado, sin calcular nunca una raíz cuadrada:

```text
parte_real² + parte_imaginaria² <= radio_de_escape²
```

> **Buena práctica:** elevar al cuadrado el umbral de comparación una sola vez (`radio_de_escape * radio_de_escape`) en lugar de recalcular una raíz cuadrada en cada iteración de cada píxel: una ganancia de rendimiento directa sobre un cálculo ya repetido millones de veces por imagen.

> **Para ir más allá:** existe una generalización con un exponente `d` no entero (*Multibrot*, `zᵈ + c`), calculada pasando `z` a forma polar (módulo y ángulo) y aplicando el teorema de De Moivre (`zᵈ = rᵈ·(cos(dθ) + i·sin(dθ))`): fuera del alcance de este capítulo, pero el mismo principio de iterar y contar se aplica.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una fractal por tiempo de escape itera una fórmula (`z = z² + c` para Mandelbrot/Julia) y colorea cada píxel según cuántas iteraciones ocurren antes de que `z` supere un umbral fijo (o nunca, para el conjunto en sí). |
| **Herramientas utilizables** | Comparar el cuadrado del módulo con el cuadrado del radio de escape, para evitar una raíz cuadrada por iteración. |
| **Trampas a evitar** | Recalcular una raíz cuadrada real en cada iteración para probar el escape, cuando comparar cuadrados basta. |
| **Buenas prácticas** | Precalcular el cuadrado del radio de escape una sola vez antes del bucle de renderizado. |
