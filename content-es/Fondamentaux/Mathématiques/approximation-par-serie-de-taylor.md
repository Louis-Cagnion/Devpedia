---
order: 7
---

# La aproximación por serie de Taylor

Una **serie de Taylor** aproxima una función matemática complicada (`sin`, `cos`, `exp`...) mediante una suma de términos cada vez más precisos, calculables solo con sumas y multiplicaciones: útil cuando la función nativa (`<math.h>`) no está disponible, o para entender cómo se calcula internamente.

## El principio: sumar términos cada vez más precisos

El desarrollo en serie de `cos(x)` se escribe:

```text
cos(x) ≈ 1 - x²/2! + x⁴/4! - x⁶/6! + ...
```

Cada término adicional afina la aproximación; cuantos más términos se sumen, más se acerca el resultado al valor real de `cos(x)`. En la práctica, solo unos pocos términos (5, por ejemplo) ya bastan para una precisión ampliamente suficiente para un uso visual (coloreado, animación).

## Calcular cada término a partir del anterior

Calcular un factorial (`6! = 720`) en cada término, en cada llamada, sería redundante. Cada término se deduce del anterior mediante una simple multiplicación, sin recalcular nunca un factorial desde cero:

```c
double coseno(double x, int numeroDeTerminos)
{
    double resultado = 1.0;
    double termino = 1.0;

    for (int i = 1; i <= numeroDeTerminos; i++) {
        termino *= -x * x / ((2 * i - 1) * (2 * i)); // deducido del termino anterior
        resultado += termino;
    }
    return resultado;
}
```

> **Nota:** `termino *= -x * x / ((2*i-1) * (2*i))` pasa de un término al siguiente en una sola operación: el signo se alterna (`-x*x`), y dividir entre `(2i-1)*(2i)` equivale a multiplicar progresivamente el denominador por los dos factores que faltan del siguiente factorial, sin recalcularlo nunca por completo.

> **Buena práctica:** usar la función nativa (`cos()` de `<math.h>`) en cuanto esté disponible: más precisa y ya optimizada. Reimplementarla mediante una serie de Taylor solo tiene sentido cuando la biblioteca estándar no está disponible o está prohibida (restricción de un ejercicio, entorno embebido mínimo).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una serie de Taylor aproxima una función mediante una suma de términos; cada término adicional mejora la precisión, y un número limitado de términos suele bastar para un uso práctico. |
| **Herramientas utilizables** | Deducir cada término del anterior mediante una multiplicación, en lugar de recalcular un factorial cada vez. |
| **Trampas a evitar** | Recalcular un factorial completo en cada término en lugar de deducirlo progresivamente del anterior. |
| **Buenas prácticas** | Preferir la función nativa de la biblioteca estándar en cuanto esté disponible; reservar la reimplementación por serie a un contexto que realmente lo exija. |
