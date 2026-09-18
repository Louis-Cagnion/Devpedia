---
order: 9
---

# Solapar la latencia con un pool en tiovivo

Cuando un programa debe procesar muchos elementos que implican cada uno una espera de red (cargar una página, llamar a una API, leer un archivo remoto), el tiempo total casi nunca depende del cálculo: depende del número de idas y vueltas de red y de su encadenamiento.

## El problema del procesamiento de uno en uno

La versión más simple procesa cada elemento por completo antes de pasar al siguiente:

```python
resultados = []
for item in items:
    pagina = obtener(item)          # espera de red: ej. 800 ms
    resultados.append(extraer(pagina))
```

Si cada espera dura 800 ms y hay 1000 elementos, el programa tarda unos 13 minutos, aunque el cálculo en sí (`extraer`) solo tome unos milisegundos. La CPU pasa la mayor parte del tiempo sin hacer nada, esperando una respuesta.

## Lanzarlo todo de golpe: rápido, pero peligroso

A la inversa, iniciar las 1000 esperas al mismo tiempo repartiría todo el tiempo de red en una única espera colectiva, al precio de 1000 peticiones simultáneas al mismo servicio. Muchos servicios web ralentizan o bloquean deliberadamente a un cliente que envía tantas peticiones a la vez, y una base de datos o un servidor puede simplemente colapsar bajo la carga.

## Un compromiso: un pool acotado a N huecos

La solución adoptada en la práctica es un **pipeline**: mantener siempre como máximo **N** esperas en vuelo (N elegido, por ejemplo 5 o 10), nunca más, nunca menos mientras quede trabajo. En concreto, N huecos numerados de 0 a N-1 se reparten el trabajo por turnos, en **tiovivo**:

```python
N = 5
huecos = [None] * N
resultados = []

for i, item in enumerate(items):
    if huecos[i % N] is not None:
        resultados.append(extraer(huecos[i % N]))   # termina la vuelta (i - N)
    huecos[i % N] = obtener(item)                    # inicia la vuelta i, sin esperar

for i in range(len(items) - N, len(items)):
    resultados.append(extraer(huecos[i % N]))        # vacia los ultimos N huecos
```

En la vuelta `i`, `obtener(item)` empieza **antes** de que `extraer(...)` de la vuelta `i - N` haya terminado de ejecutarse: el procesamiento de un elemento transcurre mientras la espera de red del siguiente ya avanza. Ninguna de las dos vueltas espera a la otra, y nunca hay más de N esperas en vuelo a la vez.

| Enfoque | Esperas en vuelo | Tiempo total para 1000 elementos a 800 ms |
|---|---|---|
| Uno por uno (secuencial) | 1 | ≈ 13 minutos |
| Todo de golpe | 1000 | El más rápido en teoría, pero con fuerte riesgo de bloqueo por el servicio remoto |
| Pool acotado a N=5 | 5 | ≈ 2,7 minutos, sin superar nunca 5 peticiones simultáneas |

> **Buena práctica:** elegir N en función de lo que tolera el servicio en cuestión (documentación, una cuota conocida, o tanteo prudente), nunca al azar: un N demasiado grande reproduce el problema de la versión "todo de golpe".

## El caso particular de 2 huecos: el double buffering

Con N = 2, este patrón tiene un nombre clásico: el **double buffering** (doble búfer), usado por ejemplo en el renderizado gráfico para preparar la siguiente imagen mientras la anterior aún se muestra. El principio sigue siendo rigurosamente el mismo: dos huecos que alternan entre "en preparación" y "en uso", para que ninguno bloquee nunca al otro.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Procesar elementos de uno en uno desperdicia todo el tiempo de espera de red; lanzarlo todo de golpe sobrecarga el servicio remoto. Un pool acotado a N huecos solapa la espera de la siguiente vuelta con el procesamiento de la vuelta actual, sin superar nunca N peticiones simultáneas. |
| **Herramientas utilizables** | Un array de N huecos indexados en tiovivo (`i % N`), que inicia el trabajo de la vuelta `i` antes de recuperar el resultado de la vuelta `i - N`. |
| **Trampas a evitar** | Un N elegido al azar, demasiado grande para lo que tolera el servicio remoto. Olvidar vaciar los últimos N huecos tras el bucle principal. |
| **Buenas prácticas** | Elegir N a partir de un límite conocido o documentado del servicio remoto. Reconocer el caso N=2 como un double buffering, un patrón ya extendido en otros ámbitos (renderizado gráfico). |
