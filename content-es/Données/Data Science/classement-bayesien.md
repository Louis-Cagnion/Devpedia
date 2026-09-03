---
order: 11
---

# El ranking bayesiano: corregir un promedio demasiado ingenuo

Clasificar elementos (reseñas de clientes, restaurantes, películas) por su simple **promedio** parece natural, pero favorece injustamente a las muestras pequeñas: una ficha calificada 5/5 por un solo cliente vence, en un ranking por promedio puro, a una ficha calificada 4,8/5 por 500 clientes. El **ranking bayesiano** (popularizado por IMDB para su clasificación de películas) corrige este sesgo.

## El problema: un promedio perfecto no siempre es fiable

| Ficha | Nota promedio | Número de reseñas | ¿Fiable? |
|---|---|---|---|
| A | 5,0 / 5 | 2 | Poco fiable: dos reseñas casi no prueban nada |
| B | 4,8 / 5 | 500 | Muy fiable: un promedio estable sobre una muestra grande |

Un promedio simple clasificaría a A antes que a B, aunque B es evidentemente el resultado más digno de confianza.

## La fórmula

```
nota_ajustada = (R x v + m x C) / (v + m)
```

| Variable | Significado |
|---|---|
| `R` | Promedio bruto del elemento (ej: 5,0 para la ficha A) |
| `v` | Número de reseñas del elemento (ej: 2 para la ficha A) |
| `C` | Promedio global de referencia, calculado sobre el conjunto de fichas |
| `m` | Umbral de confianza: el número de reseñas a partir del cual se confía realmente en `R` en lugar de en `C` |

## Interpretación: un suavizado progresivo, no un umbral brusco

```python
def nota_ajustada(R, v, C, m):
    return (R * v + m * C) / (v + m)

# Ficha A: 5.0 sobre 2 resenas, contra un promedio global de 4.2, umbral de confianza m=50
nota_ajustada(R=5.0, v=2,   C=4.2, m=50)   # ~4.23: muy cerca de la referencia global
nota_ajustada(R=4.8, v=500, C=4.2, m=50)   # ~4.71: muy cerca del promedio bruto
```

- Cuando `v` es **grande** frente a `m` (ficha B): la fórmula tiende hacia el promedio bruto `R`, el volumen de reseñas basta para confiar en él.
- Cuando `v` es **pequeño** frente a `m` (ficha A): la fórmula tiende hacia la referencia global `C`, la muestra es demasiado pequeña para confiar en ella sola.

```text
v = 0        v pequeno        v = m           v grande         v -> infinito
  |             |                |                |                 |
  C ────────────┼────────────────┼────────────────┼─────────────────R
             cerca de C      a mitad de camino  cerca de R       igual a R
```

Sin umbral brusco ("menos de `m` reseñas = ficha ignorada"): la transición entre `C` y `R` es continua, proporcional al número de reseñas ya recolectadas.

> **Trampa:** elegir `m` arbitrariamente pequeño para que una ficha de alto volumen "gane" más rápido. Un `m` demasiado bajo reintroduce el problema inicial: una ficha con 3 reseñas perfectas vuelve a ser competitiva frente a una ficha con 500 reseñas muy buenas.
>
> **Buena práctica:** fijar `m` en un valor representativo del número de reseñas necesario, en el dominio en cuestión, para que un promedio empiece a considerarse fiable (a menudo estimado empíricamente a partir de la distribución real del número de reseñas por ficha).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un promedio bruto favorece injustamente a las muestras pequeñas. El ranking bayesiano pondera el promedio de cada elemento por su volumen de reseñas, acercándolo a un promedio global de referencia mientras ese volumen siga siendo bajo. |
| **Herramientas utilizables** | La fórmula `(R·v + m·C) / (v + m)`, con `m` calibrado empíricamente sobre la distribución real del número de reseñas. |
| **Trampas a evitar** | Clasificar por promedio bruto sin tener en cuenta el volumen de reseñas; elegir un `m` demasiado bajo, que anula el efecto corrector buscado. |
| **Buenas prácticas** | Calibrar `m` con datos reales en lugar de al azar; verificar que el ranking obtenido coloque las fichas de alto volumen y buena nota por delante de las fichas cuyo volumen es demasiado bajo para ser fiable. |
