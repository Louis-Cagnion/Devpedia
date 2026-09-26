---
order: 9
---

# Cuadrados latinos y muestreo uniforme con una cadena de Markov

Para probar un programa, a menudo hacen falta ejemplos **sacados al azar de forma uniforme**: cada ejemplo posible debe tener exactamente la misma probabilidad de salir (ver [Las probabilidades básicas](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). Para algunos objetos, es sorprendentemente difícil. Este capítulo toma el ejemplo de los cuadrados latinos, que usan puzles como el Sudoku o el Skyscraper.

## El cuadrado latino

Un **cuadrado latino** de orden n es una cuadrícula n × n rellena con n símbolos, cada uno **una sola vez por fila y por columna**:

```
1 2 3 4
2 1 4 3
3 4 1 2
4 3 2 1
```

Su número explota (sucesión [A002860](https://oeis.org/A002860) de la enciclopedia de sucesiones de enteros):

| n | Número de cuadrados latinos |
|---|---|
| 3 | 12 |
| 4 | 576 |
| 5 | 161 280 |
| 6 | 812 851 200 |

Los valores hasta n = 5 se comprobaron aquí por enumeración completa.

## La trampa de la mezcla: la isotopía

Método ingenuo para «sacar un cuadrado al azar»: partir del **cuadrado cíclico** (cada fila desplazada una posición) y mezclar al azar sus filas, sus columnas y sus símbolos.

```
cuadrado cíclico      tras intercambiar las filas 1 y 3, luego los símbolos 1 y 4
1 2 3 4               3 1 4 2
2 3 4 1               2 3 1 4
3 4 1 2               4 2 3 1
4 1 2 3               1 4 2 3
```

Dos cuadrados que se pueden transformar uno en otro mediante estas permutaciones son **isótopos**. El problema: no todos los cuadrados latinos son isótopos del cuadrado cíclico. Comprobado en 4 × 4:

| Cuadrados 4 × 4 | Número | Proporción |
|---|---|---|
| Isótopos del cuadrado cíclico (alcanzables mezclando) | 432 | 75 % |
| Los demás (entre ellos el del principio del capítulo) | 144 | 25 % |
| Total | 576 | 100 % |

Por tanto, la mezcla **nunca** produce una cuarta parte de los cuadrados 4 × 4, y la parte inaccesible crece con n. Un banco de pruebas construido así solo prueba una familia particular de cuadrículas: sus medidas pueden ser engañosas.

## La cadena de Markov: un paseo al azar

Una **cadena de Markov** es una sucesión de estados en la que el estado siguiente se saca al azar **dependiendo solo del estado actual**, no del camino recorrido antes. Ejemplo con el tiempo:

| Hoy | Mañana: sol | Mañana: lluvia |
|---|---|---|
| Sol | 0,8 | 0,2 |
| Lluvia | 0,4 | 0,6 |

Si la cadena funciona mucho tiempo, la frecuencia de cada estado se estabiliza (aquí, 2 días de sol de cada 3), sea cual sea el punto de partida: es la **distribución estacionaria**.

La idea del **MCMC** (*Markov Chain Monte Carlo*): para sacar al azar un objeto difícil de construir directamente, se inventa un paseo aleatorio entre estos objetos cuya distribución estacionaria sea **uniforme**. Tras suficientes pasos, el estado actual es un sorteo (casi) uniforme.

## La cadena de Jacobson-Matthews

Jacobson y Matthews (1996) construyeron una cadena así para los cuadrados latinos. Un cuadrado se ve como un **cubo** de n × n × n casillas `m[fila][columna][símbolo]`, que vale 1 si la casilla (fila, columna) contiene ese símbolo, y 0 si no.

| Etapa | Lo que ocurre |
|---|---|
| Elegir una esquina | Una casilla del cubo a 0, al azar |
| Formar un cubito | Con las tres casillas a 1 alineadas con ella (misma columna y símbolo, misma fila y símbolo, misma fila y columna), define un subcubo 2 × 2 × 2 |
| Modificar sus 8 esquinas | +1 en cuatro esquinas, −1 en las otras cuatro, alternando: cada línea del cubo conserva la misma suma |
| Cuadrado «impropio» | Si una esquina baja a −1, el cuadrado es temporalmente **impropio**; el paso siguiente parte obligatoriamente de esa casilla para repararla |

Jacobson y Matthews demostraron que, mirando solo los cuadrados propios, esta cadena tiene una distribución estacionaria uniforme.

## Dónde leer el sorteo: una trampa medida

Tras los pasos previstos, la cadena puede estar en un cuadrado impropio. Solución tentadora: seguir hasta el primer cuadrado propio y devolverlo. Es **falso**: detenerse en el primer estado «correcto» no equivale a mirar la cadena en un instante fijo. Hay que rechazar el sorteo o volver a lanzar un bloque completo de pasos.

```python
# extracto: cubo_del_cuadrado_ciclico, un_paso y cuadrado_desde_cubo se suponen escritas
def sacar_cuadrado(n, rng, pasos):
    m = cubo_del_cuadrado_ciclico(n)                 # punto de partida
    impropio = None
    while True:
        for _ in range(pasos):                       # un bloque completo de pasos
            impropio = un_paso(m, n, rng, impropio)  # devuelve la casilla a -1, o None
        if impropio is None:                         # leído al final de un bloque, nunca antes
            return cuadrado_desde_cubo(m, n)
```

Medido sobre 5 760 sorteos de cuadrados 4 × 4 (cada cuadrado debería salir unas 10 veces):

| Método | Cuadrados no isótopos del cíclico (esperado: 25 %) | Cuadrado más sacado |
|---|---|---|
| Seguir hasta el primer cuadrado propio (64, 256 o 1 024 pasos) | 8 % | 24 veces |
| Volver a lanzar un bloque completo si el cuadrado es impropio (64 pasos) | 25,5 % | 21 veces |

El sesgo no disminuye al aumentar el número de pasos: viene del **lugar** donde se lee el resultado, no de una falta de mezcla. La comprobación correcta consiste en comparar las frecuencias obtenidas con las esperadas en un tamaño pequeño donde todo se puede contar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un cuadrado latino contiene cada símbolo una vez por fila y por columna. Mezclar el cuadrado cíclico solo da sus isótopos (75 % de los cuadrados 4 × 4). La cadena de Jacobson-Matthews permite un sorteo uniforme, siempre que el resultado se lea en un instante fijo. |
| **Herramientas utilizables** | Cadena de Markov y MCMC; representación de un cuadrado latino como cubo de incidencia; cadena de Jacobson-Matthews; comparación de frecuencias por enumeración en un tamaño pequeño. |
| **Trampas a evitar** | Generar datos de prueba mezclando simplemente un único modelo; devolver el primer estado «correcto» de una cadena en lugar del estado en un instante fijo. |
| **Buenas prácticas** | Comprobar la uniformidad de un generador en un tamaño donde todos los objetos se pueden contar; variar el origen de los datos de un banco de pruebas. |
