---
order: 8
---

# Los solucionadores SAT y el algoritmo CDCL

Un **solucionador SAT** es un programa genérico que responde a una sola pregunta: «¿se puede dar un valor verdadero/falso a cada variable de modo que se respeten todas estas reglas?». Se traduce en él el propio problema (puzle, planificación, verificación de circuitos...) y se deja buscar al solucionador. Se apoya en el [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes), pero **aprende de cada fracaso**: es el algoritmo **CDCL**.

Ejemplo medido en un solucionador del puzle *Skyscraper*: el backtracking con propagación se estancaba en cuadrículas de 11 × 11, mientras que un solucionador CDCL escrito para la ocasión resuelve cuadrículas de 32 × 32 en menos de un segundo.

## El problema SAT: variables verdadero/falso y cláusulas

| Término | Definición | Ejemplo |
|---|---|---|
| Variable booleana | Una incógnita que vale **verdadero** o **falso** | `a`: «la casilla 1 contiene un 3» |
| Literal | Una variable o su negación (`¬`, «no») | `a`, `¬a` |
| Cláusula | Varios literales unidos por **O**: al menos uno debe ser verdadero | `(¬a ∨ b)`: «si `a` es verdadero, entonces `b` también» |
| Fórmula en **CNF** (*Conjunctive Normal Form*, forma normal conjuntiva) | Varias cláusulas unidas por **Y**: todas deben ser verdaderas | `(¬a ∨ b) ∧ (¬b ∨ ¬c)` |

El símbolo `∨` se lee «o», `∧` se lee «y». Una cláusula como `(¬a ∨ b)` expresa una regla «si... entonces»: solo es falsa si `a` es verdadero y `b` falso.

El problema SAT es **NP-completo**: ningún algoritmo conocido lo resuelve rápido en todos los casos (ver [La complejidad](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). Sin embargo, en la práctica los solucionadores modernos tratan fórmulas de millones de cláusulas, porque los problemas reales están muy estructurados.

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

El solucionador vuelve entonces al nivel más alto que queda en la cláusula aprendida, aquí el nivel 0: anula también la decisión `x = verdadero`, que no tenía nada que ver con el conflicto. Es el **retroceso no cronológico** (*backjumping*). Después `(¬a)` fuerza inmediatamente `a = falso`.

| | Backtracking | CDCL |
|---|---|---|
| Tras un fracaso | Prueba el valor siguiente en el nivel anterior | Aprende una cláusula y salta al nivel útil |
| Memoria de los fracasos | Ninguna: el mismo callejón sin salida puede volver a visitarse en otro sitio | Cada cláusula aprendida poda todas las ramas donde se repetiría la misma causa |
| Retroceso | Un nivel cada vez | Directamente al nivel correcto, saltando las decisiones sin relación |

Los solucionadores reales **minimizan** después la cláusula aprendida, quitando los literales ya implicados por los demás (técnica introducida por MiniSat).

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
| Decaimiento mediante el incremento | En lugar de disminuir todas las actividades en cada conflicto, se **aumenta** el valor sumado a las siguientes (×1,05 por conflicto) y se reescala todo antes de superar la capacidad de un número de coma flotante. | Mismo efecto, con un coste constante por conflicto. |
| Montículo binario | Estructura que da la variable más activa en tiempo logarítmico. | Evita recorrer todas las variables en cada decisión. |
| **Guardado de fase** (*phase saving*) | Una variable retoma el último valor que tenía antes de ser anulada. | Tras un retroceso, el solucionador reconstruye rápido las partes ya coherentes. |

## Reiniciar y olvidar: Luby y LBD

Un **reinicio** anula todas las decisiones y vuelve a empezar desde el nivel 0, **conservando** las cláusulas aprendidas y las actividades. Evita quedarse atascado mucho tiempo en una mala región del árbol.

| Estrategia | Cuándo reiniciar | Medido en el solucionador Skyscraper |
|---|---|---|
| **Secuencia de Luby** | Tras 1, 1, 2, 1, 1, 2, 4, 1, 1, 2... veces una unidad de conflictos (aquí 300) | La que se conservó |
| Glucose | Cuando la calidad reciente de las cláusulas aprendidas empeora | 2 veces más lenta |
| Ningún reinicio | Nunca | Todas las semillas probadas en cuadrícula de 56 × 56 superan los 90 s |

Las cláusulas aprendidas se acumulan: se elimina regularmente la mitad, conservando las mejores según su **LBD** (*Literal Block Distance*): el número de niveles distintos entre sus literales. Una cláusula de LBD 2 solo relaciona dos decisiones: se volverá a usar a menudo.

## Las colas pesadas: unas pocas instancias catastróficas

Entre cuadrículas del mismo tamaño, la mayoría se resuelve rápido, pero unas pocas tardan 100 veces más: su tiempo de resolución sigue una distribución de **cola pesada** (*heavy-tailed*). Medido en el solucionador Skyscraper con cuadrículas de 72 × 72, sobre 100 cuadrículas:

| Versión | Tiempo mediano | Cuadrículas por encima de 90 s |
|---|---|---|
| Un solo solucionador | 13,4 s | 7 |
| 4 copias del solucionador lanzadas en paralelo, cada una con una parte de azar distinta; gana la primera que encuentra | 9,3 s | 0 |

Los reinicios y el azar controlado sirven precisamente para salir de estas malas trayectorias.

## Los solucionadores de referencia

| Solucionador | Aportación | Enlace |
|---|---|---|
| MiniSat (Eén y Sörensson, 2003) | Implementación corta y clara de todo este capítulo, la referencia para aprender | [minisat.se](http://minisat.se/) |
| Glucose (Audemard y Simon, 2009) | Medida LBD y los reinicios asociados | [github.com/audemard/glucose](https://github.com/audemard/glucose) |
| kissat (Armin Biere) | Entre los mejores de las competiciones SAT actuales | [github.com/arminbiere/kissat](https://github.com/arminbiere/kissat) |

Medido sobre la codificación del puzle (cuadrícula de 48 × 48, 8 millones de cláusulas): la configuración por defecto de kissat supera el presupuesto, porque sus simplificaciones previas cuestan más de lo que aportan en este problema voluminoso pero fácil; con la opción `--plain`, que las desactiva, resuelve en 2,2 s.

Fuentes: Marques-Silva y Sakallah, *GRASP* (1996); Moskewicz et al., *Chaff* (2001); Eén y Sörensson, *An Extensible SAT-solver* (MiniSat, 2003); Audemard y Simon, *Predicting Learnt Clauses Quality in Modern SAT Solvers* (Glucose, 2009); *Handbook of Satisfiability*, 2.ª edición (2021).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un solucionador SAT busca valores verdadero/falso que satisfagan una fórmula en CNF (cláusulas O unidas por Y). El CDCL añade al backtracking el análisis de cada conflicto: una cláusula aprendida y un retroceso directo al nivel útil. |
| **Herramientas utilizables** | Formato DIMACS; solucionadores MiniSat, Glucose, kissat; propagación unitaria con dos literales vigilados; VSIDS y guardado de fase; reinicios de Luby; clasificación de las cláusulas aprendidas por LBD. |
| **Trampas a evitar** | Suprimir los reinicios (instancias bloqueadas); conservar todas las cláusulas aprendidas (memoria y propagación ralentizadas); suponer que los ajustes por defecto de un solucionador sirven para cualquier problema. |
| **Buenas prácticas** | Empezar con un solucionador existente sobre un archivo DIMACS antes de escribir el propio; medir sobre muchas instancias, no sobre una sola, por culpa de las colas pesadas. |
