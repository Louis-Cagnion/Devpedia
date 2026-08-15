---
order: 6
---

# La derivada y el gradiente

Este capítulo responde a una pregunta planteada por [la curva de una función](/?c=mathematiques&p=la-fonction-mathematique): ¿hasta qué punto cambia una función en un punto dado, y en qué dirección? Eso es lo que miden la derivada, y luego el gradiente: su generalización a una función con varias entradas.

## La pendiente: a qué velocidad cambia una función

Para una función simple como `f(x) = 2x + 1`, la **pendiente** entre dos puntos mide cuánto cambia `f`, en relación con un cambio de `x`:

```text
f(1) = 3
f(3) = 7

pendiente entre x=1 y x=3 = (f(3) - f(1)) / (3 - 1) = (7 - 3) / 2 = 2
```

Esta función es una recta: su pendiente vale 2 en todas partes, sean cuales sean los dos puntos elegidos. Esto ya no es cierto para una función cuya curva no es una recta, como se verá a continuación.

## La derivada: la pendiente en un solo punto preciso

Para una curva (por ejemplo `f(x) = x²`), la pendiente ya no es constante; depende del punto observado. Para conocer la pendiente **exactamente en un punto**, se calcula la pendiente entre ese punto y otro cada vez más cercano:

```text
f(x) = x²

Alrededor de x = 2:
f(2)      = 4
f(2,1)    = 4,41      -> pendiente entre 2 y 2,1   : (4,41 - 4) / 0,1     = 4,1
f(2,01)   = 4,0401    -> pendiente entre 2 y 2,01  : (4,0401 - 4) / 0,01  = 4,01
f(2,001)  = 4,004001  -> pendiente entre 2 y 2,001 : (4,004001 - 4) / 0,001 = 4,001
```

Cuanto más se reduce la diferencia, más se acerca la pendiente calculada a **4**: esa es la **derivada** de `f` en el punto `x = 2`, anotada `f'(2) = 4`. Para `f(x) = x²`, esta derivada vale `2x` en cualquier punto (un resultado conocido, que se puede verificar aquí: `2 × 2 = 4`).

## El signo de la derivada indica la dirección

| Signo de `f'(x)` | Comportamiento de la función en ese punto |
|---|---|
| Positivo | La función aumenta |
| Negativo | La función disminuye |
| Cero | La función está momentáneamente plana (una cima, un hueco, o una meseta) |

```plot-fonction
fn: x => x^2
domaine: -4, 4
label: f(x) = x², el mismo hueco que en el esquema de abajo
```

```text
f(x)
  |  \                                /
  |   \                              /
  |    \          hueco            /
  |     \_____   (derivada = 0)  _/
  |           \_________________/
  |     f' < 0     f'=0      f' > 0
  +------------------------------------ x
```

## Descender una curva: avanzar en el sentido opuesto a la derivada

Si el objetivo es encontrar el punto más bajo de una curva (su mínimo), y solo se conoce la pendiente en el punto actual, avanzar en la dirección **opuesta** al signo de esa pendiente acerca al mínimo:

```text
f(x) = x²   (minimo en x = 0)

Punto de partida: x = 3         f'(x) = 2x = 6
nuevo x = x - 0,1 × f'(x) = 3 - 0,1 × 6 = 2,4

x = 2,4     f'(x) = 4,8    nuevo x = 2,4 - 0,1 × 4,8   = 1,92
x = 1,92    f'(x) = 3,84   nuevo x = 1,92 - 0,1 × 3,84  = 1,536
...                        -> se acerca progresivamente a x = 0
```

El `0,1` controla el tamaño de cada paso: un paso demasiado grande puede sobrepasar el mínimo, un paso demasiado pequeño hace el descenso muy lento. Este método (avanzar en sentido opuesto a la derivada, paso a paso) se llama **descenso de gradiente**.

> **Trampa:** una curva puede tener varios huecos (varios mínimos locales). Este método solo garantiza encontrar el hueco más cercano al punto de partida, no necesariamente el más bajo de todos.
>
> **Buena práctica:** tener presente que un mínimo encontrado por este método es local, no necesariamente el mejor posible: probar varios puntos de partida diferentes es una precaución habitual para limitar este riesgo.

## El gradiente: la derivada de una función con varias entradas

Para una función con varias entradas (ver [la función matemática](/?c=mathematiques&p=la-fonction-mathematique)), el **gradiente** generaliza la derivada: es un [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) que contiene, para cada entrada, su propia **derivada parcial**: hasta qué punto cambia la función si se mueve únicamente esa entrada, quedando las demás fijas.

```text
f(x, y) = x² + y²

derivada parcial respecto a x (y tratada como constante): 2x
derivada parcial respecto a y (x tratada como constante): 2y

gradiente de f en el punto (3, 4) = [2×3, 2×4] = [6, 8]
```

El gradiente apunta en la dirección donde la función **aumenta** más rápido. Avanzar en la dirección opuesta (restar el gradiente, componente por componente, ver [la suma de vectores](/?c=mathematiques&p=vecteurs-et-produit-scalaire)) hace entonces que la función disminuya lo más rápido posible, exactamente la misma lógica que para una sola entrada, aplicada a cada componente del vector:

```text
nuevo_vector = vector_anterior - tasa × gradiente
```

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | La derivada mide la pendiente de una función en un punto preciso (su signo indica si la función aumenta, disminuye, o está momentáneamente plana). El gradiente generaliza la derivada a una función con varias entradas: un vector de derivadas parciales, que apunta hacia la dirección de mayor aumento. |
| **Herramientas utilizables** | Ningún cálculo a mano en la práctica: las bibliotecas de deep learning calculan las derivadas y gradientes automáticamente (ver la [diferenciación automática](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)). |
| **Trampas a evitar** | Confundir "un mínimo encontrado" con "el mínimo más bajo posible": una curva con varios huecos solo garantiza el hueco más cercano al punto de partida. |
| **Buenas prácticas** | Probar varios puntos de partida diferentes para limitar el riesgo de quedar atrapado en un mínimo local poco satisfactorio. |
