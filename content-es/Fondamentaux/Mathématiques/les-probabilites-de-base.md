---
order: 5
---

# Las probabilidades básicas

Este capítulo presenta las probabilidades, una noción retomada más adelante para describir lo que predice un modelo: no una respuesta única y certera, sino varias respuestas posibles, cada una con su propia probabilidad de ocurrir.

## ¿Qué es una probabilidad?

Una **probabilidad** mide hasta qué punto un evento tiene posibilidades de ocurrir: un número entre 0 (imposible) y 1 (seguro).

| Valor | Significado | Ejemplo |
|---|---|---|
| 0 | Imposible | Obtener un 7 al lanzar un dado de 6 caras |
| 0,5 | Tantas posibilidades de que sea así como de lo contrario | Obtener cara al lanzar una moneda equilibrada |
| 1 | Seguro | Obtener un número menor que 10 al lanzar un dado de 6 caras |

> **Analogía:** un indicador graduado de 0 a 1, como un indicador de combustible, pero que mide la confianza de que un evento ocurra en lugar de una cantidad de gasolina.

Se anota `P(evento) = valor`. Para un dado de 6 caras equilibrado (cada cara tiene tantas posibilidades de salir como las demás): `P(obtener un 3) = 1/6 ≈ 0,167`.

## Una distribución de probabilidad: varios resultados, una sola suma

Cuando un evento tiene varios resultados posibles, cada uno recibe su propia probabilidad: el conjunto de esas probabilidades se llama una **distribución de probabilidad**:

```text
Dado de 6 caras equilibrado:

P(1) = 0,167
P(2) = 0,167
P(3) = 0,167
P(4) = 0,167
P(5) = 0,167
P(6) = 0,167
        -----
Suma = 1,000
```

```distribution
barres: 1=0.167, 2=0.167, 3=0.167, 4=0.167, 5=0.167, 6=0.167
label: Distribucion de un dado de 6 caras equilibrado
```

Sin importar cómo se repartan las probabilidades entre los resultados posibles, su suma siempre vale exactamente **1**: uno de los resultados listados ocurre forzosamente, no hay nada fuera de esa lista.

> **Trampa:** una distribución calculada por un programa que no suma exactamente 1 (redondeo impreciso, resultado posible olvidado en el cálculo) no es una distribución de probabilidad válida.
>
> **Buena práctica:** tras calcular una distribución de probabilidad, verificar que la suma de sus valores efectivamente vale 1 (o muy cerca, teniendo en cuenta los redondeos) antes de usarla más adelante en un cálculo.

## Una distribución no es forzosamente equilibrada

Nada obliga a cada resultado a tener la misma probabilidad que los demás: un dado de 6 caras equilibrado es un caso particular, no la regla general:

```text
Un clima que favorece fuertemente la lluvia:

P(lluvia) = 0,80
P(sol)    = 0,15
P(nieve)  = 0,05
             -----
Suma      = 1,00
```

```distribution
barres: Lluvia=0.80, Sol=0.15, Nieve=0.05
label: Distribucion climatica desequilibrada
```

El resultado más probable (aquí, la lluvia) no es el único posible: solo aquel cuya probabilidad es más alta. Esta distinción se retomará tal cual más adelante: un modelo que predice "probablemente X" siempre deja abierta la posibilidad de un resultado diferente, con una probabilidad más baja pero no nula.

> **Trampa:** confundir "el resultado más probable" con "el único resultado posible": una probabilidad de 0,80 sigue significando un 20% de posibilidades de que sea otra cosa, no una certeza.
>
> **Buena práctica:** razonar sobre la distribución completa en lugar de solo su resultado más probable, en cuanto los resultados menos probables tengan consecuencias importantes si ocurren de todos modos.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una probabilidad es un número entre 0 (imposible) y 1 (seguro). Una distribución de probabilidad lista la probabilidad de cada resultado posible; esas probabilidades siempre suman 1. El resultado más probable no es el único posible. |
| **Herramientas utilizables** | Ninguna herramienta específica: la notación `P(evento) = valor` basta para razonar en papel. |
| **Trampas a evitar** | Una distribución cuya suma no vale exactamente 1 (error de cálculo). Confundir "lo más probable" con "seguro". |
| **Buenas prácticas** | Verificar que una distribución calculada efectivamente suma 1 antes de usarla. Razonar sobre la distribución completa, no solo sobre su resultado más probable, cuando los resultados raros tienen consecuencias importantes. |
