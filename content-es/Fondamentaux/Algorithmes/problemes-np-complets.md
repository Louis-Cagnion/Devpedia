---
order: 11
---

# Los problemas NP-completos: por qué un problema «exponencial» se resuelve de todos modos

Algunos problemas no tienen **ningún algoritmo rápido conocido** que funcione en todos los casos: se llaman **NP-completos**. Sin embargo, hay programas que resuelven a diario **instancias** enormes de ellos (una instancia es un ejemplar concreto del problema: una cuadrícula dada, una fórmula dada). Este capítulo explica qué significa «NP-completo», qué promete realmente esta etiqueta y por qué no impide resolver en la práctica.

Ejemplo conductor, medido en un solucionador del puzle *Skyscraper* (una cuadrícula n × n de alturas de edificios, véase [Contar permutaciones](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations)): una cuadrícula de 72 × 72 tiene un número de rellenos posibles que se escribe con **7473 cifras**, y aun así un [solucionador CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) la resuelve en unos **2 millones de decisiones**, es decir, de elecciones libres del solucionador (mediana sobre 100 cuadrículas: 13 segundos).

## Verificar es fácil, encontrar es difícil

| Pregunta | Trabajo necesario para una cuadrícula n × n |
|---|---|
| **Verificar**: ¿esta cuadrícula rellena respeta las reglas? | Leer cada casilla un número fijo de veces: `O(n²)` (véase [la notación Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)) |
| **Encontrar**: ¿qué cuadrícula respeta las reglas? | Ningún método conocido garantiza un tiempo razonable en todos los casos |

Verificar que una cuadrícula es un [cuadrado latino](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) (cada valor una sola vez por fila y por columna), en [Python](/?c=langages&s=python&p=python):

```python
def es_cuadrado_latino(cuadricula):
    n = len(cuadricula)                              # tamaño: n filas de n casillas
    esperado = set(range(1, n + 1))                  # el conjunto {1, 2, ..., n}
    for fila in cuadricula:                          # cada fila...
        if set(fila) != esperado:                    # ...debe contener 1..n una vez
            return False                             # un solo error basta para rechazar
    for c in range(n):                               # cada columna...
        columna = {cuadricula[r][c] for r in range(n)}   # ...reúne sus n valores
        if columna != esperado:
            return False
    return True                                      # 2 × n × n casillas leídas: O(n²)


print(es_cuadrado_latino([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 2, 1]]))
print(es_cuadrado_latino([[1, 2, 3, 4], [2, 1, 4, 3], [3, 4, 1, 2], [4, 3, 1, 2]]))
```

```
True
False
```

La segunda cuadrícula se rechaza: su última fila coloca 1 y 2 en las columnas 3 y 4, donde la fila 3 ya los había colocado. Incluso para una cuadrícula de 1000 × 1000, esta verificación sigue siendo instantánea. Encontrar la cuadrícula es otra historia.

## Las clases P y NP

Un algoritmo es **polinómico** si su coste es como mucho `O(nᵏ)` para un número `k` fijo (`O(n)`, `O(n²)`, `O(n³)`...): sigue siendo utilizable cuando `n` crece. En cambio, un coste **exponencial** como `O(2ⁿ)` o [factorial](/?c=fondamentaux&s=mathematiques&p=combinatoire-des-permutations#el-factorial-el-numero-de-ordenes-posibles) como `O(n!)` se vuelve imposible muy rápido.

| Clase | Definición | Ejemplos |
|---|---|---|
| **P** | Problemas que sabemos **resolver** en tiempo polinómico | [Ordenar un arreglo](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), buscar un elemento |
| **NP** | Problemas cuya solución propuesta se **verifica** en tiempo polinómico | Todos los de P, más SAT, el Sudoku, el Skyscraper |

El nombre NP significa «polinómico no determinista»: un problema de NP lo resolvería en tiempo polinómico una máquina teórica que adivinara siempre la elección correcta en cada paso. Una máquina real todavía tiene que **buscar** esa elección correcta.

Todo problema de P está en NP (si se sabe resolver rápido, se sabe verificar rápido). La pregunta inversa, **¿P = NP?** (¿todo lo que se verifica rápido se resuelve rápido?), sigue sin respuesta: es uno de los siete [problemas del milenio](https://www.claymath.org/millennium/p-vs-np/) del instituto Clay, dotado con un millón de dólares. La mayoría de los investigadores piensa que P ≠ NP.

## NP-completo: los problemas más difíciles de NP

Una **reducción** transforma cualquier instancia de un problema A en una instancia de un problema B, en tiempo polinómico, de modo que la respuesta de B dé la de A. Resolver B permite entonces resolver A: B es «al menos igual de difícil» que A.

Ejemplo ya visto en este sitio: [codificar un Skyscraper en SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat) es una reducción del Skyscraper a SAT. Por tanto, un solucionador SAT sabe resolver Skyscrapers.

| Término | Definición | Ejemplos |
|---|---|---|
| **NP-difícil** | Al menos igual de difícil que **cualquier** problema de NP (todo problema de NP se reduce a él) | Encontrar el circuito más corto del [viajante](https://es.wikipedia.org/wiki/Problema_del_viajante) (demostrar que ningún circuito es más corto: no se sabe verificar rápido) |
| **NP-completo** | NP-difícil **y** en NP | SAT, completar un cuadrado latino, el Skyscraper |

```
+------------------------------ NP --------------------------------+
|  +--------- P ---------+     +-------- NP-completos ---------+   |
|  | ordenar un arreglo  |     | SAT, Skyscraper,              |   |
|  | buscar un elemento  |     | completar un cuadrado latino  |   |
|  +---------------------+     +-------------------------------+   |
+------------------------------------------------------------------+
  (esquema válido si P ≠ NP; los NP-difíciles incluyen los
   NP-completos y otros problemas, fuera de NP)
```

| Resultado | Referencia |
|---|---|
| SAT es el primer problema demostrado NP-completo | Cook, [*The Complexity of Theorem-Proving Procedures*](https://doi.org/10.1145/800157.805047) (1971) |
| 21 problemas clásicos (coloreado de grafos, mochila...) son NP-completos, por reducciones desde SAT | Karp, [*Reducibility Among Combinatorial Problems*](https://doi.org/10.1007/978-1-4684-2001-2_9) (1972) |
| Completar un cuadrado latino parcialmente relleno es NP-completo | Colbourn, [*The Complexity of Completing Partial Latin Squares*](https://doi.org/10.1016/0166-218X(84)90075-1) (1984) |
| El Skyscraper (también llamado *Building puzzle*) es NP-completo | Iwamoto y Matsui, [*Computational Complexity of Building Puzzles*](https://doi.org/10.1587/transfun.E99.A.1145) (2016) |

Consecuencia práctica: si se encontrara un algoritmo polinómico para **un solo** problema NP-completo, todos los problemas de NP se volverían polinómicos, por reducción.

## Lo que «NP-completo» no dice: peor caso y caso típico

NP-completo habla del **peor caso** (véase la nota sobre el peor caso en [la notación Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): existen instancias en las que ningún algoritmo conocido evita una explosión del tiempo de cálculo. No dice nada de las instancias que realmente se encuentran.

| «NP-completo» dice | «NP-completo» no dice |
|---|---|
| Ningún algoritmo conocido es rápido en **todas** las instancias; si P ≠ NP, ninguno lo será nunca | Que las instancias reales sean difíciles |
| Cada método conocido tiene instancias en las que su tiempo explota | Que la búsqueda deba recorrer todo el espacio de posibilidades |

Tamaño del espacio bruto de un Skyscraper, rellenando cada fila con una permutación cualquiera (`n!` opciones por fila, por tanto `(n!)ⁿ` cuadrículas):

```python
import math

for n in (4, 9, 16, 72):
    cifras = n * math.log10(math.factorial(n))      # log10((n!)^n) = n × log10(n!)
    print(n, math.floor(cifras) + 1)                # número de cifras de (n!)^n
```

| n | `(n!)ⁿ` cuadrículas | Comentario |
|---|---|---|
| 4 | 331 776 | Enumerable en una fracción de segundo |
| 9 | unos 1,1 × 10⁵⁰ (51 cifras) | A mil millones de cuadrículas por segundo: unos 3 × 10³³ años |
| 16 | unos 1,3 × 10²¹³ (214 cifras) | |
| 72 | unos 4,6 × 10⁷⁴⁷² (7473 cifras) | Resuelto en unos 2 millones de decisiones |

El número de cifras se calcula con el [logaritmo](/?c=fondamentaux&s=mathematiques&p=le-logarithme) en base 10, sin calcular nunca el número en sí. La diferencia entre 10⁷⁴⁷² y 2 millones se debe a que cada decisión elimina de golpe familias enteras de cuadrículas:

| Mecanismo | Lo que elimina |
|---|---|
| [Propagación de restricciones](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reducir-los-dominios-antes-incluso-de-intentar-la-propagacion-de-restricciones) | Todos los valores que se han vuelto imposibles tras una decisión, sin probarlos |
| [Cláusulas aprendidas del CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) | Toda rama futura que reproduciría la causa de un fallo ya encontrado |

## Las transiciones de fase: dónde se esconden las instancias difíciles

Para estudiar la dificultad «típica», se sortean [fórmulas SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#el-problema-sat-variables-verdadero-falso-y-clausulas) al azar: **fórmulas 3-SAT aleatorias**, en las que cada cláusula contiene 3 variables elegidas al azar, cada una negada o no al azar. El único ajuste es el número de cláusulas por variable.

Experimento con 40 variables y 40 fórmulas por ajuste, resueltas por un [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) simple sobre las cláusulas ([DPLL](https://doi.org/10.1145/368273.368557), el antepasado del CDCL, sin aprendizaje):

```python
import random


def dpll(clausulas, asignacion, contador):
    contador[0] += 1                                  # un nodo del árbol de búsqueda
    restantes = []                                    # cláusulas aún no satisfechas
    for clausula in clausulas:
        if any(asignacion.get(abs(lit)) == (lit > 0) for lit in clausula):
            continue                                  # un literal verdadero: satisfecha
        libres = [lit for lit in clausula if abs(lit) not in asignacion]
        if not libres:
            return False                              # todos sus literales falsos: callejón
        restantes.append(libres)                      # conservar solo los literales libres
    if not restantes:
        return True                                   # nada más que satisfacer: solución
    v = abs(min(restantes, key=len)[0])               # variable de la cláusula más corta
    for valor in (True, False):                       # probar verdadero, luego falso
        asignacion[v] = valor
        if dpll(restantes, asignacion, contador):
            return True
        del asignacion[v]                             # retroceso
    return False


rng = random.Random(1)                                # semilla fija: resultados reproducibles
n = 40                                                # 40 variables
for ratio in (2, 3, 4, 4.3, 5, 6, 8):
    sat = nodos = 0
    for _ in range(40):                               # 40 fórmulas sorteadas por ratio
        formula = []
        for _ in range(round(ratio * n)):             # ratio × n cláusulas de 3 literales
            variables = rng.sample(range(1, n + 1), 3)        # 3 variables distintas
            formula.append([v * rng.choice((1, -1)) for v in variables])  # signos al azar
        contador = [0]
        sat += dpll(formula, {}, contador)
        nodos += contador[0]
    print(f"{ratio:>3} cláusulas por variable: {sat * 100 // 40:3d} % satisfacibles, "
          f"{nodos // 40:4d} nodos de media")
```

```
  2 cláusulas por variable: 100 % satisfacibles,   46 nodos de media
  3 cláusulas por variable: 100 % satisfacibles,  126 nodos de media
  4 cláusulas por variable:  82 % satisfacibles,  898 nodos de media
4.3 cláusulas por variable:  65 % satisfacibles,  920 nodos de media
  5 cláusulas por variable:   7 % satisfacibles,  948 nodos de media
  6 cláusulas por variable:   0 % satisfacibles,  621 nodos de media
  8 cláusulas por variable:   0 % satisfacibles,  296 nodos de media
```

| Zona | Fórmulas | Dificultad |
|---|---|---|
| Pocas cláusulas por variable | Casi siempre muchas soluciones: se da rápido con una de ellas | Fácil |
| **Transición** | Aproximadamente una posibilidad de cada dos de tener solución | **Difícil**: ni solución evidente ni contradicción rápida |
| Muchas cláusulas por variable | Casi nunca hay solución, y la contradicción aparece rápido | Fácil de refutar |

Este perfil «fácil, difícil, fácil» se llama **transición de fase**, por analogía con el agua que se congela a una temperatura precisa. Para fórmulas 3-SAT grandes, el umbral está hacia 4,3 cláusulas por variable; con solo 40 variables como aquí, es difuso y el pico de dificultad se extiende de 4 a 5.

| Problema | Umbral de dificultad medido | Referencia |
|---|---|---|
| Varios problemas NP-completos (coloreado de grafos, ciclos hamiltonianos...) | Pico de dificultad en el punto donde la probabilidad de tener solución pasa de 1 a 0 | Cheeseman, Kanefsky y Taylor, [*Where the Really Hard Problems Are*](https://www.ijcai.org/Proceedings/91-1/Papers/052.pdf) (1991) |
| 3-SAT aleatorio | Hacia 4,3 cláusulas por variable | Mitchell, Selman y Levesque, [*Hard and Easy Distributions of SAT Problems*](https://cdn.aaai.org/AAAI/1992/AAAI92-071.pdf) (1992) |
| Completar un cuadrado latino | Hacia un 42 % de casillas ya rellenas, sea cual sea el tamaño | Gomes y Selman, [*Problem Structure in the Presence of Perturbations*](https://cdn.aaai.org/AAAI/1997/AAAI97-035.pdf) (1997) |

> **Trampa:** evaluar un solucionador solo con instancias sorteadas lejos del umbral (todas fáciles) o solo en el umbral (todas difíciles) da una imagen falsa de su rendimiento. Variar el origen de las instancias de prueba, como con [los cuadrados latinos](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme).

## El teorema de Hall: cuando las casillas se bloquean entre sí

Una **casilla** que ya no tiene ningún valor posible es una contradicción fácil de ver. Más traicionero: varias casillas que tienen cada una valores posibles, pero **no suficientes entre todas**. Ejemplo en una fila donde tres casillas vacías, a causa de sus columnas, ya solo aceptan estos valores:

| Casilla | Valores aún posibles |
|---|---|
| A | 2 o 5 |
| B | 2 o 5 |
| C | 2 o 5 |

Cada casilla, por separado, tiene elección. Pero tres casillas deben recibir tres valores **distintos**, y solo tienen dos para repartirse: es imposible.

El **teorema del matrimonio de Hall** ([P. Hall, 1935](https://doi.org/10.1112/jlms/s1-10.37.26)) dice exactamente cuándo existe tal asignación: se puede dar a cada casilla un valor de su lista, sin que dos casillas reciban el mismo, **si y solo si** todo grupo de k casillas dispone, entre todas, de al menos k valores distintos. El nombre viene de la versión original: formar parejas en las que cada persona acepta a su pareja, sin que dos personas tengan la misma.

Este teorema da un resultado tranquilizador sobre los cuadrados latinos ([M. Hall, 1945](https://projecteuclid.org/journals/bulletin-of-the-american-mathematical-society/volume-51/issue-6.P1/An-existence-theorem-for-latin-squares/bams/1183506980.full)): si k filas **completas** ya están rellenas sin repetición, **siempre** se puede completar el cuadrado entero. El peligro viene de las casillas rellenas **dispersas**. Cuadrícula 4 × 4 encontrada por búsqueda exhaustiva (5 casillas rellenas):

```
         col 1  col 2  col 3  col 4
fila 1     2      1      .      .
fila 2     .      .      .      4
fila 3     1      3      .      .
fila 4     .      .      .      .
```

| Paso | Razonamiento |
|---|---|
| 1 | La fila 1 aún debe colocar 3 y 4 en las columnas 3 y 4. La columna 4 ya tiene un 4: por tanto, 4 en la columna 3. |
| 2 | La fila 3 aún debe colocar 2 y 4 en las columnas 3 y 4. Misma razón: 4 en la columna 3. |
| 3 | La columna 3 recibiría dos 4: ninguna solución. |

Sin embargo, cada casilla vacía tiene al menos un valor posible, y cada fila y cada columna, **por separado**, puede completarse (verificado por programa). La contradicción solo aparece al combinar dos filas y dos columnas.

Es el bloqueo observado en el solucionador Skyscraper: algunas ejecuciones llegan al 99,8 % de las variables fijadas y luego se quedan bloqueadas más de un minuto en 56 casillas dispersas en 7 filas. Añadir al solucionador una prueba de Hall en las filas y columnas casi llenas (como mucho 16 casillas libres) detecta antes estos callejones sin salida: medido en cuadrículas de 104 × 104 sobre las mismas 18 ejecuciones (9 cuadrículas, 2 ajustes del azar cada una), 15 terminan dentro del presupuesto fijado con esta prueba, frente a 8 sin ella.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | NP reúne los problemas cuya solución se verifica rápido; los NP-completos son los más difíciles de NP (SAT, cuadrado latino, Skyscraper). NP-completo describe el peor caso: las instancias reales suelen resolverse gracias a la propagación y al aprendizaje, y las instancias aleatorias difíciles se concentran cerca de una transición de fase. |
| **Herramientas utilizables** | Reducción a SAT y luego un solucionador SAT; el logaritmo para estimar el tamaño de un espacio de búsqueda; el teorema de Hall para detectar que un grupo de casillas no tiene suficientes valores para repartirse. |
| **Trampas a evitar** | Concluir «NP-completo, luego imposible en la práctica»; juzgar un solucionador con instancias todas fáciles o todas en el umbral; comprobar las contradicciones solo casilla por casilla. |
| **Buenas prácticas** | Verificar una solución con un programa aparte, simple y polinómico; medir con instancias de orígenes variados; buscar las contradicciones entre grupos de casillas, no solo en una casilla aislada. |
