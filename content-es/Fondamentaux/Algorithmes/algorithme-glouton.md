---
order: 4
---

# El algoritmo voraz (Greedy algorithm)

Un **algoritmo voraz** (*greedy algorithm*) resuelve un problema paso a paso, eligiendo en cada paso la opción localmente mejor, sin volver nunca atrás ni garantizar un resultado globalmente óptimo.

## Ejemplo: dar cambio

Dar 67 céntimos con el menor número de monedas posible, disponiendo de monedas de 50, 20, 10, 5, 2 y 1 céntimo: en cada paso, se toma la moneda más grande que no supere la cantidad restante.

```text
Resta por dar: 67
  -> 50 (resta 17)
  -> 10 (resta 7)
  -> 5  (resta 2)
  -> 2  (resta 0)
Resultado: 4 monedas (50 + 10 + 5 + 2)
```

Con este sistema de monedas (1, 2, 5, 10, 20, 50), esta elección voraz siempre da el número mínimo de monedas. Eso no está garantizado con cualquier sistema: ver la trampa más abajo.

## Una elección voraz no siempre es óptima

> **Trampa:** creer que un algoritmo voraz siempre da la mejor solución posible. Con monedas de 1, 3 y 4 céntimos, dar 6 céntimos de forma voraz toma una moneda de 4 más dos de 1 (3 monedas), mientras que dos monedas de 3 bastarían (2 monedas): la elección localmente óptima en el primer paso (tomar la moneda más grande) lleva aquí a un resultado globalmente peor.
>
> **Buena práctica:** un algoritmo voraz debe demostrarse correcto (o verificarse empíricamente contra el sistema de monedas realmente usado) antes de adoptarlo; en caso de duda, la **programación dinámica** (que explora varias opciones en cada paso y se queda con la mejor después, fuera del alcance de este capítulo) garantiza un resultado óptimo donde el voraz no lo garantiza.

## Otros ejemplos clásicos

| Problema | Elección voraz |
|---|---|
| Dar cambio | Tomar siempre la moneda más grande posible |
| Algoritmo de Dijkstra (camino más corto) | Extender siempre hacia el vértice no visitado más cercano |
| Codificación de Huffman (compresión) | Agrupar siempre los dos símbolos menos frecuentes |

Un algoritmo voraz suele ser rápido y sencillo de implementar (una sola pasada, sin vuelta atrás); a diferencia de un algoritmo que explora varias posibilidades antes de elegir (programación dinámica, `backtracking`), más costoso pero que garantiza la optimalidad en casos donde el voraz falla.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un algoritmo voraz elige, en cada paso, la opción localmente mejor, sin volver atrás ni garantizar un resultado globalmente óptimo. |
| **Herramientas utilizables** | Dar cambio, Dijkstra, Huffman como ejemplos clásicos de algoritmos voraces. |
| **Trampas a evitar** | Suponer que una elección voraz siempre es óptima: depende enteramente del problema (ver el contraejemplo con monedas de 1/3/4). |
| **Buenas prácticas** | Verificar (o demostrar) que un algoritmo voraz es correcto para el problema real antes de adoptarlo; si no, preferir la programación dinámica. |
