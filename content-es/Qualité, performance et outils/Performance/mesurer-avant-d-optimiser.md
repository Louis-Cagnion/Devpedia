---
order: 1
---

# Medir antes de optimizar

La regla más rentable en rendimiento es también la más ignorada: **nunca optimizar sin haber medido**. La intuición sobre "qué es lento" es fiablemente errónea, porque nos fijamos en el código que nos parece complicado en lugar del código que realmente cuesta caro.

## El caso típico

En un programa de automatización de navegador demasiado lento, mis hipótesis eran: las cargas de página, luego la paginación, luego la extracción de datos. Un profiling dio esto:

| Etapa | Tiempo | Parte |
|---|---|---|
| Espera de un banner de cookies | 12,8s | **50 %** |
| Esperas fijas tras la paginación | ~7,5s | 30 % |
| Cargas de página + extracción | ~5s | 20 % |

La mitad del tiempo se iba en vigilar un banner **que nunca aparecía**: el consentimiento ya estaba registrado en el perfil del navegador. Ninguna de mis tres hipótesis era la verdadera culpable, y el culpable real ni siquiera estaba en mi lista.

## Perfilar por fases, no línea por línea

Un profiler clásico ([`cProfile`](https://docs.python.org/3/library/profile.html) en Python, la pestaña Rendimiento de un navegador) da el tiempo por función. Es útil para cálculo, mucho menos cuando el programa pasa su tiempo **esperando**: todo aparece bajo un puñado de funciones de espera, sin decir *por qué* se espera.

En ese caso, instrumentar uno mismo las fases lógicas es más elocuente. El principio: envolver las funciones clave para acumular su tiempo, sin tocar el código medido.

```python
import time

timings = []

def cronometrar(modulo, nombre):
    """Reemplaza modulo.nombre por una version que registra su tiempo de ejecucion."""
    original = getattr(modulo, nombre)

    def envoltura(*args, **kwargs):
        inicio = time.perf_counter()
        resultado = original(*args, **kwargs)
        timings.append((nombre, time.perf_counter() - inicio))
        return resultado

    setattr(modulo, nombre, envoltura)

cronometrar(mi_modulo, "esperar_contenido")
cronometrar(mi_modulo, "cerrar_banner")
```

Al agregar luego por nombre, se obtiene el número de llamadas **y** el tiempo acumulado de cada una. El número de llamadas suele ser la información decisiva: una función de 0,3s llamada 40 veces cuesta más que una función de 2s llamada una vez.

> Piense también en mostrar el tiempo **no atribuido** (total medido menos la suma de las fases). Si es alto, su instrumentación no capta lo esencial y sus conclusiones estarán equivocadas.

## Medir también después

Una optimización no vuelta a medir es una creencia. Dos comprobaciones merecen ser sistemáticas:

- **el tiempo bajó realmente**: a veces un cambio "obviamente más rápido" no cambia nada, porque no estaba en el **camino crítico** (la sucesión de etapas dependientes que por sí sola determina la duración total; acelerar una etapa fuera de esa sucesión no acorta nada, ya que el programa de todos modos espera a que terminen las etapas que sí forman parte de ella);
- **el resultado es idéntico**: es la comprobación que se olvida, y es la más importante. Una optimización que rompe silenciosamente la salida es mucho peor que un programa lento.

En el caso anterior, comparar la salida byte a byte antes y después de cada etapa permitió detectar una extracción que se había vuelto incompleta: un bug que ningún cronómetro habría revelado.

## La trampa de la medición única

Una sola medición no dice nada: la red, la caché y la carga de la máquina hacen variar los resultados en decenas de puntos porcentuales. Tome varias mediciones y observe si la diferencia entre dos configuraciones supera su variación natural. Si no, está midiendo ruido.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Nunca optimizar sin haber medido: la intuición sobre "qué es lento" suele apuntar al código que parece complicado, no al que realmente cuesta caro. |
| **Herramientas utilizables** | Un profiler clásico (por función), una instrumentación manual por fase cuando el programa pasa su tiempo esperando. |
| **Trampas a evitar** | Fiarse de una medición única: el ruido (red, caché, carga de la máquina) puede superar el efecto real de una optimización. |
| **Buenas prácticas** | Siempre volver a medir tras una optimización (tiempo Y exactitud del resultado); tomar varias mediciones para distinguir una ganancia real del ruido. |
