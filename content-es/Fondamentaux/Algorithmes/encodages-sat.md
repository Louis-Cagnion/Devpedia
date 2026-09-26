---
order: 9
---

# Codificar un problema en SAT

Un [solucionador SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) solo conoce variables verdadero/falso y cláusulas. **Codificar** un problema es traducirlo a ese lenguaje. Casi siempre existen varias traducciones correctas, y la elección cambia la velocidad de resolución en un factor de 10 o más.

Ejemplo conductor: el puzle **Skyscraper**. Una cuadrícula n × n contiene edificios de altura 1 a n, cada altura una sola vez por fila y por columna. Una pista en el borde de una fila indica cuántos edificios se ven desde ese lado: un edificio oculta todos los más pequeños situados detrás de él.

```
pista 3 ->  1  2  4  3      se ve 1, luego 2, luego 4 (4 oculta a 3): 3 edificios
```

## Codificación directa o codificación por orden

| Codificación | Variables para una casilla de altura 1 a 4 | Lo que afirma una variable |
|---|---|---|
| **Directa** | `x1, x2, x3, x4` | `x3`: «la casilla vale exactamente 3» |
| **Por orden** | `y2, y3, y4` | `y3`: «la casilla vale **al menos** 3» |

La codificación por orden necesita cláusulas «escalera»: si la casilla vale al menos 4, vale al menos 3 (`¬y4 ∨ y3`), y así sucesivamente. Las dos codificaciones pueden convivir, unidas por **cláusulas de canal** (*channeling*): `x3` es verdadero exactamente cuando `y3` es verdadero e `y4` falso.

Por qué es útil aquí: la visibilidad es una cuestión de **comparaciones** («¿este edificio es más alto que todos los anteriores?»). Con la codificación por orden, «más alto que 3» es una sola variable, compartida por las cuatro direcciones de vista en lugar de recalcularse en cada una.

| Codificación de la visibilidad | Cuadrícula de 16 × 16 |
|---|---|
| Directa | 0,42 s |
| Por orden, compartida por las 4 direcciones | 0,03 s (13 veces más rápida) |

## «Al menos uno» y «como máximo uno»

En una fila, cada altura aparece **al menos una vez** (ALO, *at least one*) y **como máximo una vez** (AMO, *at most one*). «Al menos uno» cabe en una sola cláusula: `(a ∨ b ∨ c ∨ d)`. «Como máximo uno» se traduce de varias formas:

```python
from itertools import combinations

def como_maximo_uno_pares(xs):
    """Una cláusula (¬a ∨ ¬b) por cada par de variables."""
    return [[-a, -b] for a, b in combinations(xs, 2)]  # -a: literal ¬a, como en DIMACS

print(como_maximo_uno_pares([1, 2, 3]))  # [[-1, -2], [-1, -3], [-2, -3]]
```

| Codificación de «como máximo uno» | Cláusulas para 100 variables | Propagación |
|---|---|---|
| Por pares | 4 950 (n(n-1)/2) | Máxima: en cuanto una variable pasa a verdadero, todas las demás quedan forzadas a falso en un solo paso |
| Compacta (escalera, contador) | unas 300 | Pasa por variables auxiliares: varios pasos de propagación |

Más compacto no significa más rápido: en el solucionador Skyscraper, la codificación compacta era **un 50 % más lenta** que los pares, porque cada deducción necesitaba más pasos. La respuesta correcta depende del problema: hay que medir.

## Contar: el contador secuencial

«Exactamente k edificios visibles» es una **restricción de cardinalidad**: exactamente k variables verdaderas entre n. El **contador secuencial** (Sinz, 2005) añade variables auxiliares `s[i][j]` = «entre las i primeras variables, al menos j son verdaderas», como un contador que se hace avanzar casilla tras casilla:

```python
def como_maximo_k_contador(xs, k, siguiente_var):
    """Cláusulas «como máximo k verdaderas entre xs», y la siguiente variable libre."""
    n = len(xs)
    # s[i][j]: al menos j+1 verdaderas entre x1..x(i+1)
    s = [[siguiente_var + i * k + j for j in range(k)] for i in range(n)]
    clauses = []
    for i in range(n):
        # xi verdadera => al menos 1 verdadera hasta aquí
        clauses.append([-xs[i], s[i][0]])
        if i > 0:
            # la cuenta nunca baja
            for j in range(k):
                clauses.append([-s[i - 1][j], s[i][j]])
            # xi verdadera => la cuenta avanza 1
            for j in range(1, k):
                clauses.append([-xs[i], -s[i - 1][j - 1], s[i][j]])
            # ya hay k verdaderas: xi está prohibida
            clauses.append([-xs[i], -s[i - 1][k - 1]])
    return clauses, siguiente_var + n * k
```

Comprobado por fuerza bruta con 5 variables y k = 2: las 21 cláusulas producidas (con 10 variables auxiliares) aceptan exactamente las combinaciones en las que como máximo 2 variables son verdaderas. Para «exactamente k», se añade el otro sentido («al menos k»). Una alternativa conocida es el **totalizer** (Bailleux y Boufkhad, 2003), que cuenta mediante un árbol de pequeños contadores en lugar de una cadena.

## Añadir cláusulas redundantes

Una cláusula **redundante** (o *implícita*) ya se deduce de las demás: no cambia el conjunto de soluciones. Aun así ayuda al solucionador, porque le da directamente una deducción que, si no, tendría que redescubrir mediante la búsqueda.

Ejemplo: las **reglas de borde** del Skyscraper. Con la pista k en el borde de una fila de n casillas, la casilla en la posición d (contando desde ese borde, d = 1 para la primera) vale como máximo n − k + d. Comprobado en todas las filas de 4 casillas con la pista 3:

| Casilla | Alturas posibles | Regla: como máximo 4 − 3 + d |
|---|---|---|
| 1 | 1, 2 | 2 |
| 2 | 1, 2, 3 | 3 |
| 3 | 1 a 4 | 4 |

Cada regla se convierte en **cláusulas unitarias** (un solo literal, por ejemplo «la casilla 1 no vale 3»), verdaderas antes de cualquier búsqueda. Medido en el solucionador Skyscraper: 2,4 veces más rápido (cuadrícula de 13 × 13: 0,30 → 0,13 s). Otro hecho redundante añadido sin coste: el edificio más alto entre las i primeras casillas de una fila mide al menos i, ya que todas tienen alturas distintas.

## Nombrar una subfórmula: variables auxiliares definicionales

Una restricción como «la casilla i es visible» se despliega en una fórmula larga (depende de todas las casillas anteriores). Copiarla cada vez que se usa haría explotar el tamaño de la codificación. La **[transformación de Tseitin](https://doi.org/10.1007/978-3-642-81955-1_28)** (1968) evita esto: se inventa una nueva variable que **nombra** la subfórmula, con cláusulas que la obligan a valer lo mismo que ella. Estas variables no existían en el enunciado del problema: son **definicionales**, añadidas solo para acortar la codificación.

```python
from itertools import product


def clausulas_tseitin_y(p, a, b):
    """Cláusulas que imponen p <-> (a y b); -x significa «no x»."""
    return [[-p, a], [-p, b], [p, -a, -b]]          # p ⇒ a, p ⇒ b, (a y b) ⇒ p


def satisfecha(clausula, valores):
    """Verdadero si al menos un literal de la cláusula es verdadero."""
    return any(valores[abs(lit)] == (lit > 0) for lit in clausula)


acuerdos = 0
for a, b, p in product((False, True), repeat=3):    # las 8 combinaciones posibles
    valores = {1: a, 2: b, 3: p}                      # variables: a = 1, b = 2, p = 3
    clausulas_ok = all(satisfecha(c, valores) for c in clausulas_tseitin_y(3, 1, 2))
    acuerdos += clausulas_ok == (p == (a and b))      # ¿de acuerdo con la definición de p?
print(f"{acuerdos}/8 combinaciones de acuerdo")
```

```
8/8 combinaciones de acuerdo
```

Las 3 cláusulas aceptan exactamente las combinaciones en las que p vale «a y b»: p es de verdad un nombre para esta subfórmula. En el solucionador Skyscraper, dos subfórmulas se nombran así: «altura máxima vista entre las i primeras casillas de una fila» y «la casilla i es visible». Sin estas dos familias de variables auxiliares, cada restricción de visibilidad volvería a ser una fórmula de tamaño proporcional al número de casillas anteriores, en lugar de un puñado de cláusulas ligadas a una variable compartida: en una cuadrícula de 72 × 72, estas variables definicionales representan el 68 % del total de variables de la codificación.

## Cláusulas implícitas: recuperadas por cálculo en lugar de almacenadas

Algunas familias de cláusulas tienen una **estructura regular**: sus literales se deducen de un índice (número de casilla, altura, posición en la fila) mediante una fórmula sencilla. Almacenarlas una a una desperdicia memoria en una información que podría recalcularse. Por eso una **cláusula implícita** nunca se escribe en un arreglo: se reconstruye en el momento en que el solucionador la necesita, calculando índices.

Esto complica un punto concreto: cuando el solucionador deduce que una variable es verdadera, debe recordar **por qué** (la cláusula que la forzó), para reconstruir ese razonamiento más tarde durante el análisis del conflicto. Si la cláusula no está almacenada, esa razón también debe codificarse de forma compacta: en 32 bits, unos pocos bits de mayor peso designan la **familia** de cláusula implicada, y los bits restantes llevan el número de una **variable de anclaje**, a partir de la cual toda la cláusula se recalcula.

| Enfoque | Qué se almacena | Memoria (cuadrícula de 72 × 72) | Velocidad (cuadrícula de 48 × 48) |
|---|---|---|---|
| Cláusulas enumeradas | Cada literal de cada cláusula regular | 674 MB | referencia |
| Cláusulas implícitas (familia + anclaje) | Un código de 32 bits por razón, la cláusula se recalcula | 263 MB | 1,5 veces más rápida |

## Propagadores y generación perezosa de cláusulas

Un **propagador** es código dedicado a una restricción global (por ejemplo «todas estas variables toman valores distintos»): en lugar de traducir la restricción en cláusulas de antemano, el solucionador ejecuta directamente el algoritmo que sabe deducir sus consecuencias. El propagador solo produce una **cláusula de explicación** (por qué se forzó tal variable) cuando el [análisis del conflicto](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) la necesita: la traducción a cláusulas se hace entonces bajo demanda en lugar de toda de una vez al principio, de ahí el nombre de **[generación perezosa de cláusulas](https://doi.org/10.1007/s10601-008-9064-x)** (*Lazy Clause Generation*, Ohrimenko, Stuckey y Codish, 2009). Las cláusulas implícitas de la sección anterior son una forma simple de esto, escrita a mano para una sola restricción; la generación perezosa de cláusulas generaliza la idea a cualquier restricción global mediante un propagador. Es el principio de los solucionadores híbridos que combinan SAT y programación por restricciones, como [Chuffed](https://github.com/chuffed/chuffed) o el solucionador CP-SAT de [OR-Tools](https://github.com/google/or-tools).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un mismo problema se codifica de varias formas correctas, con diferencias de velocidad de un factor de 10 o más. La codificación por orden («al menos v») conviene a las comparaciones; «como máximo uno» y los conteos tienen cada uno varias codificaciones. Una variable auxiliar puede nombrar una subfórmula (Tseitin); una cláusula de estructura regular puede quedar implícita (recuperada por cálculo); un propagador puede aplazar la traducción a cláusulas hasta que se pida una explicación (generación perezosa de cláusulas). |
| **Herramientas utilizables** | Codificación directa y por orden, cláusulas de canal; «como máximo uno» por pares o compacto; contador secuencial y totalizer para las cardinalidades; cláusulas redundantes (unitarias si es posible); variables auxiliares definicionales; cláusulas implícitas (razón codificada como familia + anclaje); propagadores y generación perezosa de cláusulas. |
| **Trampas a evitar** | Elegir la codificación más compacta sin medir (propagación más lenta); recalcular en cada restricción una información que una variable compartida podría llevar; almacenar una cláusula de estructura regular en lugar de recalcularla. |
| **Buenas prácticas** | Comprobar una codificación por fuerza bruta en tamaños pequeños; añadir las deducciones fáciles como cláusulas unitarias; comparar las codificaciones sobre muchas instancias; reservar las cláusulas implícitas y los propagadores a familias realmente regulares, medidas antes y después. |
