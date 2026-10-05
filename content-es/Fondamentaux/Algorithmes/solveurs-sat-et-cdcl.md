---
order: 9
---

# Los solucionadores SAT y el algoritmo CDCL

Un **solucionador SAT** es un programa genérico que responde a una sola pregunta: «¿se puede dar un valor verdadero/falso a cada variable de modo que se respeten todas estas reglas?». Se traduce en él el propio problema (puzle, planificación, verificación de circuitos...: ver [Codificar un problema en SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)) y se deja buscar al solucionador. Se apoya en el [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes), pero **aprende de cada fracaso**: es el algoritmo **CDCL**.

Ejemplo medido en un solucionador del puzle *Skyscraper*: el backtracking con propagación se estancaba en cuadrículas de 11 × 11, mientras que un solucionador CDCL escrito para la ocasión resuelve cuadrículas de 32 × 32 en menos de un segundo.

## El problema SAT: variables verdadero/falso y cláusulas

| Término | Definición | Ejemplo |
|---|---|---|
| Variable booleana | Una incógnita que vale **verdadero** o **falso** | `a`: «la casilla 1 contiene un 3» |
| Literal | Una variable o su negación (`¬`, «no») | `a`, `¬a` |
| Cláusula | Varios literales unidos por **O**: al menos uno debe ser verdadero | `(¬a ∨ b)`: «si `a` es verdadero, entonces `b` también» |
| Fórmula en **CNF** (*Conjunctive Normal Form*, forma normal conjuntiva) | Varias cláusulas unidas por **Y**: todas deben ser verdaderas | `(¬a ∨ b) ∧ (¬b ∨ ¬c)` |

El símbolo `∨` se lee «o», `∧` se lee «y». Una cláusula como `(¬a ∨ b)` expresa una regla «si... entonces»: solo es falsa si `a` es verdadero y `b` falso.

El problema SAT es **NP-completo**: ningún algoritmo conocido lo resuelve rápido en todos los casos (ver [Los problemas NP-completos](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets)). Sin embargo, en la práctica los solucionadores modernos tratan fórmulas de millones de cláusulas, porque los problemas reales están muy estructurados.

## El formato DIMACS: el idioma común de los solucionadores

Todos los solucionadores leen el mismo formato de texto, **DIMACS**. Las variables se numeran a partir de 1, un número negativo es una negación y cada cláusula termina con `0`:

```
c a=1 b=2 c=3 d=4 x=5 y=6     <- línea "c": comentario
p cnf 6 5                     <- cabecera: 6 variables, 5 cláusulas
-1 2 0                        <- (¬a ∨ b)
-1 3 0                        <- (¬a ∨ c)
-2 -3 4 0                     <- (¬b ∨ ¬c ∨ d)
-2 -4 0                       <- (¬b ∨ ¬d)
-5 6 0                        <- (¬x ∨ y)
```

Respuesta del solucionador [kissat](https://github.com/arminbiere/kissat) sobre este archivo:

```
s SATISFIABLE                 <- existe una solución
v -1 -2 -3 -4 -5 -6 0         <- la solución: todas las variables a falso
```

El código de salida del programa vale `10` si existe una solución y `20` si no (`s UNSATISFIABLE`), lo que permite usarlo desde un script.

## La propagación unitaria, los niveles y la traza

Cuando todos los literales de una cláusula son falsos salvo uno, este último queda **forzado** a verdadero: es la **propagación unitaria**. Cada elección libre (una *decisión*) abre un nuevo **nivel**. La **traza** (*trail*) anota cada asignación, su nivel y su **razón** (la cláusula que la forzó).

Sobre la fórmula anterior, el solucionador decide primero `x = verdadero` y luego `a = verdadero`:

| Nivel | Asignación | Razón |
|---|---|---|
| 1 | `x = verdadero` | decisión |
| 1 | `y = verdadero` | `(¬x ∨ y)`: `¬x` es falso, así que `y` queda forzado |
| 2 | `a = verdadero` | decisión |
| 2 | `b = verdadero` | `(¬a ∨ b)` |
| 2 | `c = verdadero` | `(¬a ∨ c)` |
| 2 | `d = verdadero` | `(¬b ∨ ¬c ∨ d)`: `¬b` y `¬c` son falsos |
| 2 | **conflicto** | `(¬b ∨ ¬d)`: `¬b` y `¬d` son falsos los dos |

## El conflicto y el aprendizaje de cláusulas (CDCL)

Un backtracking simple volvería al nivel anterior y probaría `a = falso`. El **CDCL** (*Conflict-Driven Clause Learning*, aprendizaje de cláusulas dirigido por conflictos) busca primero **por qué** se produjo el conflicto, remontando las razones de la traza. En cada paso, se combina la cláusula actual con la razón de una de sus variables (esta combinación se llama *resolución*):

| Paso | Cláusula actual | Sustituida gracias a la razón de... |
|---|---|---|
| Inicio | `(¬b ∨ ¬d)` (la cláusula en conflicto) | |
| 1 | `(¬b ∨ ¬c)` | `d`, forzada por `(¬b ∨ ¬c ∨ d)` |
| 2 | `(¬b ∨ ¬a)` | `c`, forzada por `(¬a ∨ c)` |
| 3 | `(¬a)` | `b`, forzada por `(¬a ∨ b)` |

Se para en cuanto solo queda **un único** literal del nivel del conflicto: es el **primer punto de implicación único** (*1UIP*). La cláusula obtenida, `(¬a)`, se **aprende**: añadida a la fórmula, dice «`a` nunca puede ser verdadero».

El solucionador vuelve entonces al nivel más alto entre los demás literales de la cláusula aprendida (su segundo nivel más alto, o 0 si solo tiene un literal), aquí el nivel 0: anula también la decisión `x = verdadero`, que no tenía nada que ver con el conflicto. Es el **retroceso no cronológico** (*backjumping*). Después `(¬a)` fuerza inmediatamente `a = falso`.

| | Backtracking | CDCL |
|---|---|---|
| Tras un fracaso | Prueba el valor siguiente en el nivel anterior | Aprende una cláusula y salta al nivel útil |
| Memoria de los fracasos | Ninguna: el mismo callejón sin salida puede volver a visitarse en otro sitio | Cada cláusula aprendida poda todas las ramas donde se repetiría la misma causa |
| Retroceso | Un nivel cada vez | Directamente al nivel correcto, saltando las decisiones sin relación |

Los solucionadores reales **minimizan** después la cláusula aprendida, quitando los literales ya implicados por los demás (técnica introducida por [MiniSat](http://minisat.se/)).

## Dos literales vigilados: propagar sin releerlo todo

Con millones de cláusulas, releer cada cláusula en cada asignación sería demasiado lento. Cada cláusula **vigila solo dos** de sus literales (*two watched literals*):

```
Cláusula (¬b ∨ ¬c ∨ d ∨ e)    vigilados: ¬b y ¬c
  b pasa a verdadero (¬b falso) -> buscar otro literal no falso que vigilar: d
  c pasa a verdadero (¬c falso) -> buscar un sustituto: e
  d pasa a falso              -> no queda sustituto: e queda forzado a verdadero
```

Mientras ninguno de los dos literales vigilados sea falso, la cláusula no puede forzar nada ni estar en conflicto: no se mira. Y al retroceder **no hay nada que deshacer**: los literales que vuelven a quedar libres siguen siendo buenos candidatos para vigilar.

## Elegir la variable: VSIDS y guardado de fase

| Mecanismo | Principio | Por qué |
|---|---|---|
| **VSIDS** (*Variable State Independent Decaying Sum*) | Cada variable tiene una **actividad**, que aumenta cuando participa en un conflicto y luego «se desgasta» con el tiempo. Se decide siempre sobre la más activa. | Concentra la búsqueda en la parte difícil del problema, la que produce conflictos en este momento. |
| Decaimiento mediante el incremento | En lugar de disminuir todas las actividades en cada conflicto, se **aumenta** el valor sumado a las siguientes (×1,05 por conflicto) y se reescala todo antes de superar la capacidad de un [número de coma flotante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants). | Mismo efecto, con un coste constante por conflicto. |
| [Montículo binario](/?c=fondamentaux&s=algorithmes&p=file-de-priorite-et-tas-binaire) | Estructura que da la variable más activa en tiempo logarítmico. | Evita recorrer todas las variables en cada decisión. |
| **Guardado de fase** (*phase saving*) | Una variable retoma el último valor que tenía antes de ser anulada. | Tras un retroceso, el solucionador reconstruye rápido las partes ya coherentes. |

## Reiniciar y olvidar: Luby y LBD

Un **reinicio** anula todas las decisiones y vuelve a empezar desde el nivel 0, **conservando** las cláusulas aprendidas y las actividades. Evita quedarse atascado mucho tiempo en una mala región del árbol.

| Estrategia | Cuándo reiniciar | Medido en el solucionador Skyscraper |
|---|---|---|
| **Secuencia de Luby** | Tras 1, 1, 2, 1, 1, 2, 4, 1, 1, 2... veces una unidad de conflictos (aquí 300) | La que se conservó |
| Glucose | Cuando la calidad reciente de las cláusulas aprendidas empeora | 2 veces más lenta |
| Ningún reinicio | Nunca | Todas las cuadrículas de 56 × 56 probadas superan los 90 s |

Las cláusulas aprendidas se acumulan: se elimina regularmente la mitad, conservando las mejores según su **LBD** (*Literal Block Distance*): el número de niveles distintos entre sus literales. Una cláusula de LBD 2 solo involucra dos niveles de decisión: se volverá a usar a menudo.

## Heurísticas avanzadas: medir antes de adoptar

Los solucionadores punteros añaden decenas de mecanismos a los vistos más arriba. Su efecto depende del problema: un mecanismo que gana las competiciones SAT puede ralentizar una codificación concreta. Estos son los probados en el solucionador Skyscraper, con su efecto medido.

### Decidir solo sobre algunas variables: la ramificación restringida

La [codificación por orden](/?c=fondamentaux&s=algorithmes&p=encodages-sat#codificacion-directa-o-codificacion-por-orden) del Skyscraper tiene dos familias de variables por casilla, `x` («la casilla vale v») e `y` («la casilla vale al menos v»), más variables auxiliares para la visibilidad. La **ramificación restringida** (*restricted branching*) solo deja que el solucionador **decida** sobre las `y`: todas las demás variables las fija la propagación. Es la versión SAT de la elección de [la variable sobre la que ramificar](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#sobre-que-ramificar-una-variable-pequena-en-lugar-de-una-restriccion-entera).

| Decisiones permitidas | Cuadrículas de 56 × 56 (5 cuadrículas) |
|---|---|
| Sobre todas las variables | 1 cuadrícula de cada 5 por encima de 90 s |
| Solo sobre las `y` | 7,9 s de media, peor caso 10 s |
| Sobre las `x` y las `y` | 4 veces más lento que solo sobre las `y` |

### VMTF: el último conflicto al frente de la cola

**VMTF** (*Variable Move-To-Front*, [Ryan, 2004](https://summit.sfu.ca/_flysystem/fedora/sfu_migrate/2725/b35038871.pdf)) sustituye las actividades de VSIDS por una **cola**: una [lista doblemente enlazada](/?c=langages&s=c&p=listes-chainees) de todas las variables. Tras cada conflicto, las variables que participaron pasan **al frente**, marcadas con una **marca de tiempo** (un contador que aumenta con cada desplazamiento, para saber rápido cuál se movió más recientemente). Para decidir, el solucionador toma la primera variable libre empezando por el frente.

```
frente                                  final
 x7 <-> x2 <-> x9 <-> x4 <-> x1          antes del conflicto
 x1 <-> x4 <-> x7 <-> x2 <-> x9          tras un conflicto que implica a x4 y x1
```

| | VSIDS | VMTF |
|---|---|---|
| Lo que se recuerda | Una actividad por variable, que se desgasta con el tiempo | El orden de los últimos conflictos |
| Encontrar la variable que decidir | [Montículo binario](/?c=fondamentaux&s=algorithmes&p=file-de-priorite-et-tas-binaire): tiempo logarítmico | Recorrido desde el frente, retomado donde se detuvo |
| Actualización tras un conflicto | Aumentar actividades, reordenar el montículo | Mover al frente: tiempo constante |
| Medido (cuadrícula de 48 × 48, un solo proceso) | 1,47 s | 1,31 s |

VMTF es el modo «enfocado» de los solucionadores [kissat](https://github.com/arminbiere/kissat) y [CaDiCaL](https://github.com/arminbiere/cadical). En un portafolio de procesos (varias copias del solucionador lanzadas en paralelo sobre el mismo problema; gana la primera que termina), casi siempre ganan las copias VMTF (ver la sección sobre las colas pesadas, más abajo).

### Lo que perjudicó aquí

| Mecanismo | Idea | Referencia | Medido aquí |
|---|---|---|---|
| Retroceso cronológico | Tras un conflicto, subir un solo nivel en lugar de saltar lejos, para no rehacer decenas de decisiones (aquí, de 66 a 93 niveles saltados de media) | Nadel y Ryvchin, [*Chronological Backtracking*](https://doi.org/10.1007/978-3-319-94144-8_7) (2018) | Más lento (probado con kissat) |
| Reutilización de la traza | Al reiniciar, conservar las decisiones que el solucionador volvería a tomar de todos modos | van der Tak, Ramos y Heule, [*Reusing the Assignment Trail in CDCL Solvers*](https://doi.org/10.3233/sat190082) (2011) | Nula con VMTF (nada reutilizable), neutra o peor con VSIDS |
| Fases objetivo y *rephasing* | Recordar la mejor asignación parcial encontrada y volver a ella con regularidad | [kissat](https://github.com/arminbiere/kissat) (Biere, 2020) | Cuadrículas de 56 × 56: de 6,8 s a 25 s de media, una cuadrícula por encima de 90 s |
| *Shrinking* | Acortar aún más las cláusulas aprendidas, tras la minimización | [kissat](https://github.com/arminbiere/kissat) | +15 % de tiempo |
| Vivificación de las cláusulas aprendidas | Acortar una cláusula suponiendo falsos sus literales uno a uno (sección siguiente) | Piette, Hamadi y Saïs, [*Vivifying Propositional Clausal Formulae*](https://hal.archives-ouvertes.fr/hal-00865274) (2008); Luo et al., [*An Effective Learnt Clause Minimization Approach for CDCL SAT Solvers*](https://doi.org/10.24963/ijcai.2017/98) (2017) | Cuadrículas de 108 × 108: 64,5 s de portafolio simulado frente a 49,5 s |

### Simplificar en la raíz

Una asignación del nivel 0 nunca se deshace: una cláusula que contiene un literal verdadero en el nivel 0 queda satisfecha para siempre, y conservarla solo sirve para volver a leerla. La **simplificación en la raíz** (función `simplify` de [MiniSat](http://minisat.se/)) elimina esas cláusulas, así como las implicaciones hacia un literal ya verdadero.

| Cláusula | En el nivel 0, `a` es verdadero | Tras la simplificación |
|---|---|---|
| `(a ∨ b)` | Satisfecha para siempre | Eliminada |
| `(¬a ∨ c)` | La propagación fuerza `c` en el nivel 0: satisfecha también | Eliminada |
| `(b ∨ d)` | Ni `b` ni `d` están fijados todavía | Conservada |

Medido junto con otros dos retoques del mismo tipo: un pequeño porcentaje de tiempo ganado, con [contadores de trabajo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-con-contadores-de-trabajo-no-solo-con-el-tiempo) idénticos.

### La vivificación: acortar una cláusula aprendida

Una cláusula aprendida suele ser más larga de lo necesario. La **vivificación** ([Piette, Hamadi y Saïs, 2008](https://hal.archives-ouvertes.fr/hal-00865274), aplicada a las cláusulas aprendidas por [Luo et al., 2017](https://doi.org/10.24963/ijcai.2017/98)) la acorta probando sus propios literales: se suponen **falsos** sus literales **uno a uno**, con una [propagación unitaria](#la-propagacion-unitaria-los-niveles-y-la-traza) tras cada uno, apartando la propia cláusula durante la prueba.

| Qué ocurre tras suponer falso un literal | Consecuencia |
|---|---|
| La propagación produce un **conflicto** | Los literales supuestos hasta ahí bastan: la cláusula se acorta a ellos |
| Un literal posterior pasa a **verdadero** por propagación | Los literales supuestos, más este, bastan |
| Un literal posterior pasa a **falso** por propagación | Es inútil: se quita |
| Nada de lo anterior | La cláusula queda como está |

```python
import itertools
import random


def valor(literal, asignacion):
    """Verdadero, falso o None (aún sin asignar) para un literal: +v es v, -v es no v."""
    if abs(literal) not in asignacion:
        return None
    return asignacion[abs(literal)] == (literal > 0)


def propagar(formula, asignacion):
    """Propagación unitaria: amplía la asignación; devuelve False si hay conflicto."""
    cambio = True
    while cambio:
        cambio = False
        for clause in formula:
            if any(valor(l, asignacion) is True for l in clause):
                continue                                    # cláusula ya satisfecha
            libres = [l for l in clause if valor(l, asignacion) is None]
            if not libres:
                return False                                # todos falsos: conflicto
            if len(libres) == 1:                            # solo queda uno: queda forzado
                asignacion[abs(libres[0])] = libres[0] > 0
                cambio = True
    return True


def vivificar(clause, formula):
    """Acorta una cláusula suponiendo falsos sus literales, uno a uno, con propagación."""
    asignacion, conservados = {}, []
    for l in clause:
        v = valor(l, asignacion)
        if v is True:                                       # ya verdadero por los anteriores
            return conservados + [l]                        # esos literales bastan
        if v is False:                                      # ya implicado falso: inútil
            continue
        conservados.append(l)
        asignacion[abs(l)] = l < 0                          # se supone l falso
        if not propagar(formula, asignacion):               # conflicto: los conservados bastan
            return conservados
    return conservados


def modelos(formula, num_vars):
    """Todos los modelos de la fórmula, por enumeración (solo fórmulas pequeñas)."""
    for bits in itertools.product([False, True], repeat=num_vars):
        a = {v + 1: bits[v] for v in range(num_vars)}
        if all(any(valor(l, a) for l in c) for c in formula):
            yield bits


def implicada(clause, todos):
    """Verdadero si cada modelo de la fórmula hace verdadera la cláusula."""
    return all(any(valor(l, {v + 1: b[v] for v in range(10)}) for l in clause) for b in todos)


def sacar_clausula(tamano):
    """Una cláusula al azar: variables distintas del 1 al 10, de signos aleatorios."""
    return tuple(random.choice([-1, 1]) * v for v in random.sample(range(1, 11), tamano))


# Ejemplo a mano: a -> b -> c -> d (variables 1 a 4), cláusula aprendida (no a o d o e o f)
cadena = [(-1, 2), (-2, 3), (-3, 4)]
aprendida = (-1, 4, 5, 6)
print("cláusula aprendida:", aprendida, "-> vivificada:", tuple(vivificar(aprendida, cadena)))

# Verificación con fórmulas aleatorias: la cláusula acortada sigue implicada
random.seed(1)
total, quitados, errores = 0, 0, 0
for _ in range(300):
    formula = [sacar_clausula(3) for _ in range(30)]
    todos = list(modelos(formula, 10))
    if not todos:
        continue                                            # fórmula contradictoria: se omite
    for _ in range(20):
        clause = sacar_clausula(6)
        if not implicada(clause, todos):
            continue                                        # cláusula no implicada
        corta = vivificar(clause, formula)
        total += 1
        quitados += len(clause) - len(corta)
        if not implicada(corta, todos):
            errores += 1                                    # no debe ocurrir nunca
print(total, "cláusulas implicadas de 6 literales,", quitados, "literales quitados,",
      errores, "errores")
```

```
cláusula aprendida: (-1, 4, 5, 6) -> vivificada: (-1, 4)
5075 cláusulas implicadas de 6 literales, 11649 literales quitados, 0 errores
```

La cláusula aprendida `(¬a ∨ d ∨ e ∨ f)` pasa a `(¬a ∨ d)`: suponiendo `a` verdadero, la cadena `a → b → c → d` fuerza `d` a verdadero, así que `e` y `f` no sirven de nada. Con 5.075 cláusulas de 6 literales implicadas por una fórmula aleatoria, la vivificación quita 2,3 literales de media, y la cláusula acortada sigue implicada en todos los casos (0 errores en la enumeración de todos los modelos).

Es un tratamiento que cuesta tiempo (propagaciones adicionales, hechas en los reinicios) a cambio de cláusulas más cortas y, por tanto, más útiles. En el solucionador de Skyscraper, el resultado depende del tamaño de la cuadrícula:

| Medición | Resultado |
|---|---|
| 64 × 64, 40 cuadrículas, presupuesto del 10 % del tiempo | Ningún efecto |
| 64 × 64, presupuesto del 30 % | 17 cuadrículas resueltas solo con la vivificación frente a 8 solo sin ella, sumando las dos semillas de 40 cuadrículas (probabilidad de una diferencia tan clara por azar: alrededor del 5 %, antes de tener en cuenta las 4 comparaciones hechas), pero un 8 a 22 % más de propagaciones (mediana) cuando ambas versiones resuelven |
| 108 × 108, 29 cuadrículas, con el [filtrado de Régin](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin) | 73 copias resueltas frente a 91 sin vivificación (16 victorias contra 34 comparando copia a copia), un 22 a 35 % más de propagaciones; cada propagación cuesta un 18 % menos, lo que no compensa |
| Portafolio simulado con 108 × 108 | 64,5 s con vivificación, 49,5 s sin ella |

> **Lección:** una señal favorable a tamaño pequeño (17 frente a 8) no se trasladó al tamaño buscado. Medir en el tamaño que importa y endurecer el umbral de confianza cuando se comparan varios ajustes.

## Las colas pesadas: unas pocas instancias catastróficas

Entre cuadrículas del mismo tamaño, la mayoría se resuelve rápido, pero unas pocas tardan más de 6 veces el tiempo mediano, o no terminan: su tiempo de resolución sigue una distribución de **cola pesada** (*heavy-tailed*). Medido en el solucionador Skyscraper con cuadrículas de 72 × 72, sobre 100 cuadrículas:

| Versión | Tiempo mediano | Cuadrículas por encima de 90 s |
|---|---|---|
| Un solo solucionador (3 ejecuciones simultáneas en la máquina) | 13,4 s | 7 |
| 4 copias del solucionador lanzadas en paralelo, cada una con una parte de azar distinta; gana la primera que encuentra | 9,3 s | 0 |

Los reinicios y el azar controlado sirven precisamente para salir de estas malas trayectorias.

### El azar desplaza la cola, no la reduce

Una decisión aleatoria consiste en elegir una variable al azar en vez de la más activa, con una pequeña probabilidad fija (parámetro `random_var_freq` de [MiniSat](http://minisat.se/)). Medido en el solucionador Skyscraper en cuadrícula 72 × 72, sobre 100 cuadrículas:

| Configuración | Cuadrículas por encima de 90 s |
|---|---|
| Sin randomización (versión de referencia, sola en la máquina) | 4 |
| Con 3 % de decisiones aleatorias | 8, pero no las mismas 4 cuadrículas |

Las 4 cuadrículas que se bloqueaban sin randomización se resuelven con ella, pero otras 8 se bloquean a su vez: una misma cuadrícula pasa o se bloquea según la tirada aleatoria. La cola pesada depende de la trayectoria recorrida, no de la dificultad intrínseca de la instancia; añadir azar la desplaza, no la reduce.

### La trampa de evaluación: sesgo de selección y regresión a la media

Probar una nueva heurística solo en las cuadrículas que bloqueaban la configuración de referencia la favorece mecánicamente: esas cuadrículas se eligieron precisamente por su mala suerte con la referencia, y una configuración distinta tiene estadísticamente menos motivos de sufrir la misma mala suerte. Esta trampa tiene nombre en estadística: la [regresión a la media](https://es.wikipedia.org/wiki/Regresi%C3%B3n_a_la_media) (una muestra elegida por un resultado extremo se acerca a la media al volver a medirla, incluso sin ningún cambio real).

| Conjunto de prueba | Resultado medido |
|---|---|
| 8 cuadrículas difíciles, elegidas entre las que bloqueaban la referencia | Todas resueltas: la variante parece excelente |
| 100 cuadrículas, el conjunto completo | El doble de casos por encima de 90 s que antes |

Buena práctica: revalidar siempre una heurística sobre el conjunto completo de instancias, nunca solo sobre el subconjunto que motivó el cambio.

### Diversificar sin destruir lo aprendido

Dos formas de diversificar rompen lo que el solucionador ha aprendido: añadir ruido a las actividades VSIDS en cada reinicio, o volver a las fases iniciales en vez de conservar el guardado de fase (ver más arriba). Ambas hacen que se bloqueen incluso las cuadrículas fáciles, que no necesitaban ninguna diversificación. La diversificación debe recaer sobre unas pocas decisiones puntuales (como `random_var_freq`), nunca sobre lo que el solucionador ya ha aprendido (actividades, cláusulas, fases).

### Portafolio de trayectorias independientes: la ley de p^k

Otro remedio: lanzar varias trayectorias en paralelo con semillas distintas (el número que inicializa el azar de cada proceso) y quedarse con el resultado del primer proceso que termina (portafolio de procesos, [Gomes, Selman & Kautz, *Boosting Combinatorial Search Through Randomization*, AAAI 1998](https://www.cs.cornell.edu/selman/papers/pdf/98.aaai.boost.pdf), medido originalmente sobre la compleción de cuadrados latinos). Si cada ejecución se bloquea de forma independiente con una probabilidad *p*, *k* ejecuciones se bloquean todas juntas con una probabilidad *p^k*: el riesgo cae muy rápido con el número de procesos. Con p = 7/100 (medido aquí):

```python
# p: probabilidad de que UNA ejecución supere 90 s (medido: 7 de 100 cuadrículas)
p = 7 / 100
for k in range(1, 5):
    # probabilidad de que los k procesos superen TODOS 90 s (independientes)
    print(f"k={k} procesos: p^k = {p ** k:.6f}")
```

```
k=1 procesos: p^k = 0.070000
k=2 procesos: p^k = 0.004900
k=3 procesos: p^k = 0.000343
k=4 procesos: p^k = 0.000024
```

Medido en cuadrícula 72 × 72 sobre 100 cuadrículas: 4 procesos ([`fork`](/?c=langages&s=c&p=processus), el resultado del primer proceso recibido por una [tubería](/?c=langages&s=c&p=appels-systeme-et-descripteurs) y `poll`, que espera varias tuberías a la vez) pasan de 7 casos por encima de 90 s a ninguno, con una media de 9,6 s y un peor caso de 16,8 s. En comparación, un solo proceso con reinicio periódico completo solo elimina 3 de los 7: una sola trayectoria sigue siendo una sola trayectoria sin importar cuántos reinicios tenga, mientras que procesos realmente independientes siguen la ley *p^k*.

### Portafolio heterogéneo y rendimientos decrecientes

Diversificar también las heurísticas de decisión, no solo las semillas aleatorias, refuerza aún más el portafolio. Medido en cuadrícula 96 × 96, con 4 procesos:

| Portafolio | Tiempo medio (5 cuadrículas 96 × 96) |
|---|---|
| 4 × VSIDS | 67 s |
| 1 × VSIDS + 3 × VMTF (ver más arriba) | 32 s |

Los procesos VMTF ganan de forma muy regular, entre 25 000 y 30 000 conflictos. El portafolio de 4 copias VSIDS ya situaba la frontera de un minuto entre las cuadrículas de 88 × 88 y 96 × 96; el portafolio heterogéneo la lleva a 100 × 100 (45,3 s de media sobre 100 cuadrículas, solo una más allá de 90 s).

Más allá de 4 a 6 procesos, las ganancias se frenan y luego se invierten: el ancho de banda de memoria (el caudal de datos entre la memoria y el procesador) compartido entre procesos acaba costando más de lo que aporta la diversidad (8 procesos más lentos que 6). Compartir cláusulas aprendidas entre procesos (ManySAT, [Hamadi, Jabbour & Sais, 2009](http://www.cril.univ-artois.fr/~jabbour/manysat.htm)) solo ayuda si las cláusulas aprendidas son cortas: aquí, una resolución completa solo aprende de 2 a 7 cláusulas unitarias y de 11 a 34 cláusulas binarias (cuadrícula 56 × 56); las demás cláusulas aprendidas son largas, sin interés en compartirlas.

## Los solucionadores de referencia

| Solucionador | Aportación | Enlace |
|---|---|---|
| MiniSat (Eén y Sörensson, 2003) | Implementación corta y clara de todo este capítulo, la referencia para aprender | [minisat.se](http://minisat.se/) |
| Glucose (Audemard y Simon, 2009) | Medida LBD y los reinicios asociados | [github.com/audemard/glucose](https://github.com/audemard/glucose) |
| kissat (Armin Biere) | Entre los mejores de las competiciones SAT actuales | [github.com/arminbiere/kissat](https://github.com/arminbiere/kissat) |

Medido sobre la codificación del puzle (cuadrícula de 48 × 48, 8 millones de cláusulas): la configuración por defecto de kissat supera el presupuesto de 90 s, porque sus simplificaciones previas cuestan más de lo que aportan en este problema voluminoso pero fácil; con la opción `--plain`, que las desactiva, resuelve en 2,2 s.

Fuentes: Marques-Silva y Sakallah, *GRASP* (1996); Moskewicz et al., *Chaff* (2001); Eén y Sörensson, *An Extensible SAT-solver* (MiniSat, 2003); Audemard y Simon, *Predicting Learnt Clauses Quality in Modern SAT Solvers* (Glucose, 2009); *Handbook of Satisfiability*, 2.ª edición (2021).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un solucionador SAT busca valores verdadero/falso que satisfagan una fórmula en CNF (cláusulas O unidas por Y). El CDCL añade al backtracking el análisis de cada conflicto: una cláusula aprendida y un retroceso directo al nivel útil. |
| **Herramientas utilizables** | Formato DIMACS; solucionadores MiniSat, Glucose, kissat; propagación unitaria con dos literales vigilados; VSIDS y guardado de fase; reinicios de Luby; clasificación de las cláusulas aprendidas por LBD; ramificación restringida, VMTF, simplificación en la raíz. |
| **Trampas a evitar** | Suprimir los reinicios (instancias bloqueadas); conservar todas las cláusulas aprendidas (memoria y propagación ralentizadas); suponer que los ajustes por defecto de un solucionador sirven para cualquier problema; adoptar un mecanismo de un solucionador puntero (fases objetivo, retroceso cronológico) sin medirlo en el propio problema. |
| **Buenas prácticas** | Empezar con un solucionador existente sobre un archivo DIMACS antes de escribir el propio; medir sobre muchas instancias, no sobre una sola, por culpa de las colas pesadas. |
