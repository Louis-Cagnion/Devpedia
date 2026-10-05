---
order: 11
---

# Comparar dos ajustes: emparejamiento, prueba del signo y comparaciones múltiples

«¿Este ajuste es mejor que el otro?» La pregunta parece simple, pero un cronómetro o un contador solo responde para **un caso**: una cuadrícula, una semilla, una ejecución. Este capítulo muestra cómo concluir con honestidad a partir de varios casos, con las mediciones reales de la investigación sobre el [solucionador de Skyscraper](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl): comparar cada caso consigo mismo, medir la diferencia con la prueba del signo, no dejarse engañar por un gran número de comparaciones y no juzgar un ajuste con los casos que sirvieron para elegirlo.

Vocabulario: un **ajuste** es una forma de lanzar el programa (una opción, un umbral); una **cuadrícula** es un caso de prueba; una **semilla** es el número que inicializa el azar del solucionador: dos semillas dan dos recorridos distintos de la misma cuadrícula.

## Por qué una media no basta

| Fuente de variación | Orden de magnitud medido |
|---|---|
| Mismo programa, misma cuadrícula, dos cronometrajes | ±15 % de tiempo |
| Dos rondas de medición alternas del mismo binario | Hasta un 3,6 % de diferencia |
| Misma cuadrícula, dos semillas | Resuelta en un caso, bloqueada en el otro |
| Contador de propagaciones, mismo programa y misma semilla | Idéntico en cada ejecución |

Dos consecuencias:

| Regla | Por qué |
|---|---|
| Comparar con **contadores de trabajo** (propagaciones, conflictos) en lugar de con el tiempo | Un contador no se mueve de una ejecución a otra (véanse [comparar con contadores de trabajo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-con-contadores-de-trabajo-no-solo-con-el-tiempo) y [medir en rondas alternas](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#medir-en-rondas-alternas)) |
| No fiarse de una media que contiene fallos | Una cuadrícula no resuelta cuenta por todo el presupuesto (400 millones de propagaciones): la media depende del presupuesto elegido, no solo del solucionador. Con 64 × 64, 187 millones de propagaciones de media sin el filtrado de Régin y 97 millones con él, pero 12 cuadrículas de 40 cuentan por 400 millones en el primer caso |

## El emparejamiento: cada cuadrícula contra sí misma

Comparar las medias de dos ajustes mezcla dos cosas: la diferencia entre los ajustes y la diferencia entre las cuadrículas. El **emparejamiento** elimina la segunda: cada cuadrícula se lanza con los dos ajustes y se compara la **pareja** de resultados. Para un resultado «resuelta o no», cada cuadrícula cae en una de cuatro casillas:

| | Resuelta con B | No resuelta con B |
|---|---|---|
| **Resuelta con A** | Concordante: no dice nada sobre el sentido de la diferencia | **Discordante**: gana A |
| **No resuelta con A** | **Discordante**: gana B | Concordante: no dice nada |

Solo las cuadrículas **discordantes** informan sobre la comparación.

## La prueba del signo

Si los dos ajustes fueran equivalentes, cada cuadrícula discordante iría a un lado o a otro como una moneda al aire (véanse [las probabilidades](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). La **prueba del signo** calcula la probabilidad de obtener, solo por azar, una diferencia al menos tan clara como la observada: es el **valor p**. No dice «B es mejor con tal probabilidad»: solo dice cuán **sorprendentes** serían los datos si A y B fueran equivalentes.

Datos reales: 40 cuadrículas de 64 × 64, sin y con el filtrado de Régin (véase [el filtrado de Régin](/?c=fondamentaux&s=algorithmes&p=couplages-et-filtrage-de-regin)):

```python
from math import comb

# Una letra por cuadrícula (64 x 64, las mismas 40): 1 = resuelta, 0 = no resuelta
sin_regin = "1111111110111110101010010011011111010011"
con_regin = "1111111111111111111111111111111111111101"


def prueba_del_signo(a_favor, en_contra):
    """Probabilidad de una diferencia tan clara, si los dos ajustes fueran equivalentes."""
    n = a_favor + en_contra                 # solo cuentan las cuadrículas discordantes
    k = max(a_favor, en_contra)
    unilateral = sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n
    return unilateral, min(1.0, 2 * unilateral)


def comparar(inicio, fin):
    """Compara los dos ajustes en las cuadrículas inicio a fin (excluida)."""
    a, b = sin_regin[inicio:fin], con_regin[inicio:fin]
    ambos = sum(x == "1" and y == "1" for x, y in zip(a, b))
    a_favor = sum(x == "0" and y == "1" for x, y in zip(a, b))   # solo con Régin
    en_contra = sum(x == "1" and y == "0" for x, y in zip(a, b))  # solo sin él
    ninguna = len(a) - ambos - a_favor - en_contra
    unilateral, bilateral = prueba_del_signo(a_favor, en_contra)
    print(f"cuadrículas {inicio + 1:2}-{fin:2}: ambos {ambos:2}, solo con {a_favor:2}, "
          f"solo sin {en_contra}, ninguna {ninguna}; "
          f"p = {unilateral:.4f} (unilateral), {bilateral:.4f} (bilateral)")


comparar(0, 40)
comparar(0, 20)
comparar(20, 40)
```

```
cuadrículas  1-40: ambos 27, solo con 12, solo sin 1, ninguna 0; p = 0.0017 (unilateral), 0.0034 (bilateral)
cuadrículas  1-20: ambos 16, solo con  4, solo sin 0, ninguna 0; p = 0.0625 (unilateral), 0.1250 (bilateral)
cuadrículas 21-40: ambos 11, solo con  8, solo sin 1, ninguna 0; p = 0.0195 (unilateral), 0.0391 (bilateral)
```

| Lectura | Valor |
|---|---|
| 40 cuadrículas: 12 ganadas por Régin, 1 perdida | `p = 0,0034` (bilateral): muy improbable por azar |
| Cuadrículas 1 a 20 solas: 4 contra 0 | `p = 0,125`: muy pocas cuadrículas para concluir |
| Cuadrículas 21 a 40 solas: 8 contra 1 | `p = 0,039`: por debajo del 5 %, pero lejos de 0,0034 |

Dos precisiones:

| Precisión | Explicación |
|---|---|
| **Unilateral o bilateral** | La prueba unilateral solo espera una diferencia en un sentido (Régin mejor); la bilateral acepta los dos sentidos. Sin razón para prever el sentido antes de medir, la bilateral (el doble) es la elección prudente |
| **Las 40 cuadrículas mezclan dos papeles** | El umbral de Régin que se conservó (`REGINK=16`) se había elegido mirando las cuadrículas 1 a 20 entre varios ajustes. Para juzgar con honestidad hacen falta cuadrículas que la elección no ha visto: 8 contra 1 en las cuadrículas 21 a 40, es decir `p = 0,039`, un resultado más frágil que el `0,0034` de las 40 cuadrículas agrupadas |

## Varias comparaciones a la vez

Un umbral del 5 % significa: una vez de cada veinte aparece una diferencia «significativa» **por azar**. Con una sola comparación es aceptable; con siete ajustes comparados con la misma referencia, hay muchas más probabilidades de que al menos uno parezca significativo sin serlo. La **corrección de Bonferroni** exige entonces a cada comparación un umbral dividido por el número de comparaciones (aquí `0,05 / 7 = 0,0071`).

```python
from math import comb

referencia = "1111111110111110101010010011011111010011"  # 40 cuadrículas, sin Régin

# Siete variantes del mismo mecanismo, contra la misma referencia (1 = resuelta)
variantes = {
    "REGIN=1, todas las filas (cuadrículas 1-20)":  ("11111110110111111111", 0),
    "REGINMAX=96 (cuadrículas 1-20)":                 ("11011111111111111111", 0),
    "REGINMAX=128 (cuadrículas 1-20)":                ("11110011111111111001", 0),
    "REGINMAX=192 (cuadrículas 1-20)":                ("11111110111101101111", 0),
    "REGINK=24 (cuadrículas 1-20)":                   ("11101111111111111001", 0),
    "REGINK=16 (cuadrículas 1-20)":                   ("11111111111111111111", 0),
    "REGINK=12 (cuadrículas 21-40)":                  ("11011110111111111111", 20),
}


def p_bilateral(a_favor, en_contra):
    n, k = a_favor + en_contra, max(a_favor, en_contra)
    return min(1.0, 2 * sum(comb(n, i) for i in range(k, n + 1)) / 2 ** n)


umbral = 0.05 / len(variantes)                               # corrección de Bonferroni
print(f"umbral por comparación: {umbral:.4f}")
for nombre, (resultado, inicio) in variantes.items():
    ref = referencia[inicio:inicio + 20]                     # mismas cuadrículas
    a_favor = sum(r == "0" and v == "1" for r, v in zip(ref, resultado))
    en_contra = sum(r == "1" and v == "0" for r, v in zip(ref, resultado))
    p = p_bilateral(a_favor, en_contra)
    marca = "< 0,05" if p < 0.05 else ""
    print(f"{nombre:44} {a_favor} contra {en_contra}   p = {p:.3f}   {marca}")

# ¿Y si las siete variantes fueran todas equivalentes a la referencia?
import random

random.seed(5)
campanas, alertas_5, alertas_bonferroni = 2000, 0, 0
for _ in range(campanas):
    ps = []
    for _ in range(len(variantes)):
        a_favor = en_contra = 0
        for _ in range(20):                                  # 20 cuadrículas, igual azar
            a, b = random.random() < 0.7, random.random() < 0.7
            a_favor += b and not a
            en_contra += a and not b
        ps.append(p_bilateral(a_favor, en_contra))
    alertas_5 += min(ps) < 0.05                              # una variante «significativa»
    alertas_bonferroni += min(ps) < umbral
print(f"falsas alarmas: {alertas_5 / campanas:.1%} de las campañas a 0,05, "
      f"{alertas_bonferroni / campanas:.1%} con el umbral {umbral:.4f}")
```

```
umbral por comparación: 0.0071
REGIN=1, todas las filas (cuadrículas 1-20)  4 contra 2   p = 0.688   
REGINMAX=96 (cuadrículas 1-20)               4 contra 1   p = 0.375   
REGINMAX=128 (cuadrículas 1-20)              3 contra 3   p = 1.000   
REGINMAX=192 (cuadrículas 1-20)              3 contra 2   p = 1.000   
REGINK=24 (cuadrículas 1-20)                 3 contra 2   p = 1.000   
REGINK=16 (cuadrículas 1-20)                 4 contra 0   p = 0.125   
REGINK=12 (cuadrículas 21-40)                7 contra 1   p = 0.070   
falsas alarmas: 13.9% de las campañas a 0,05, 1.2% con el umbral 0.0071
```

| Observación | Lectura |
|---|---|
| Ninguna de las siete variantes reales alcanza el 5 % con 20 cuadrículas | Diferencia **no probada**: no es lo mismo que «ninguna diferencia». `REGINK=16` gana 4 cuadrículas y no pierde ninguna, lo que es muy poco con 20 cuadrículas; con 40, el efecto es claro |
| Si las siete variantes fueran equivalentes, una campaña produciría al menos una falsa alarma al 5 % en el 13,9 % de los casos | El umbral nominal del 5 % ya no vale cuando se prueban varios ajustes (la prueba del signo es prudente, así que el exceso es menor que el 30 % del cálculo ingenuo) |
| Con el umbral de Bonferroni, un 1,2 % de falsas alarmas | La corrección baja el riesgo por debajo del 5 %, a costa de detectar menos efectos modestos |

La vivificación de las cláusulas aprendidas (véase [el capítulo sobre solucionadores](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)) dio 17 cuadrículas ganadas frente a 8 perdidas (`p` cercano a 0,05) entre 4 comparaciones hechas: con un umbral de `0,05 / 4 = 0,0125`, no es significativo, y el resultado no se confirmó con 108 × 108.

## El sesgo de selección: elegir y juzgar con las mismas cuadrículas

Cuando se prueban muchos ajustes con las mismas cuadrículas y se conserva el mejor, **el mejor es en parte el más afortunado**. En cuadrículas nuevas, vuelve hacia la media. Simulación: 162 ajustes **todos equivalentes** (4 cuadrículas de 100 exceden el plazo para cada uno), medidos con las mismas 100 cuadrículas; el mejor se conserva y se vuelve a medir con 100 cuadrículas nuevas:

```python
import random

random.seed(3)
P_EXCESO = 0.04             # ajustes equivalentes: 4 de cada 100 exceden el tiempo


def excesos(n=100):
    """Número de cuadrículas que exceden el tiempo entre n sorteadas."""
    return sum(random.random() < P_EXCESO for _ in range(n))


aparente, real = 0, 0
for _ in range(1000):                                        # 1000 campañas de selección
    mediciones = [excesos() for _ in range(162)]             # 162 ajustes, las mismas 100
    aparente += min(mediciones)                              # nos quedamos con el mejor
    real += excesos()                                        # medido de nuevo en 100 nuevas
print(f"mejor ajuste elegido: {aparente / 1000:.2f} excesos en las cuadrículas de la elección")
print(f"el mismo ajuste, en cuadrículas nuevas: {real / 1000:.2f} excesos")
```

```
mejor ajuste elegido: 0.06 excesos en las cuadrículas de la elección
el mismo ajuste, en cuadrículas nuevas: 3.96 excesos
```

El mejor ajuste parece casi perfecto en las cuadrículas que lo designaron y vuelve exactamente al nivel de todos los demás en cuadrículas nuevas. Dos casos reales de la investigación:

| Caso | Constatación |
|---|---|
| Un ajuste elegido con las 8 cuadrículas en que la referencia fallaba (`RANDFREQ=300`) | 8 cuadrículas de 8 resueltas, pero 8 excesos de tiempo en 100 cuadrículas frente a 4 de la referencia (véase [la trampa de evaluación](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#la-trampa-de-evaluacion-sesgo-de-seleccion-y-regresion-a-la-media)) |
| El mejor de 162 portafolios clasificados con las mismas 100 cuadrículas | Unos 4 excesos esperados en cuadrículas nuevas, no 1 |

Remedio: decidir con cuadrículas **apartadas desde el principio** (un conjunto de confirmación) y fijar el umbral antes de mirar.

## Simular un portafolio a partir de copias medidas solas

Un [portafolio](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#portafolio-de-trayectorias-independientes-la-ley-de-p-k) lanza 4 copias del solucionador en paralelo y se queda con la primera que termina. Como cada copia es determinista, basta medir cada una **sola**: el tiempo del portafolio es el de la copia con menos propagaciones, multiplicado por el coste de una propagación (63,6 ns medidos con 4 procesos), más 0,4 s de arranque. Se pueden entonces comparar cientos de combinaciones sin volver a lanzarlas:

```python
NS_POR_PROPAGACION = 63.6e-9      # coste medido de una propagación con 4 procesos
ARRANQUE = 0.4                    # codificación y arranque, en segundos
TOPE = 90                         # una cuadrícula que lo supere cuenta como 90 s

# Propagaciones de cada copia lanzada sola (None: no resuelta), cuadrículas 108 x 108
mediciones = {
    "cuadrícula 1":  ([1160198340, 1079061713, 965580745, 1121869261],
                  [1161081253, 1080793391, None, 1128429894]),
    "cuadrícula 2":  ([935030775, 873949674, None, 1030612002],
                  [935461446, 870245776, None, 1029000510]),
    "cuadrícula 36": ([None, None, None, None], [None, None, None, 855762975]),
    "cuadrícula 44": ([None, None, None, None], [1164445761, 918386044, 880153114, 900765717]),
    "cuadrícula 45": ([None, None, None, None], [930976402, 978540372, 826546571, None]),
}


def tiempo_del_portafolio(copias):
    """Gana el primer proceso que termina: el que tiene menos propagaciones, por su coste."""
    resueltas = [p for p in copias if p is not None]
    if not resueltas:
        return TOPE
    return min(TOPE, min(resueltas) * NS_POR_PROPAGACION + ARRANQUE)


print(f"{'cuadrícula':12} {'sin Régin':>12} {'con Régin':>12}")
for nombre, (referencia, regin) in mediciones.items():
    t_ref, t_regin = tiempo_del_portafolio(referencia), tiempo_del_portafolio(regin)
    print(f"{nombre:12} {t_ref:11.1f} s {t_regin:11.1f} s")
```

```
cuadrícula      sin Régin    con Régin
cuadrícula 1        61.8 s        69.1 s
cuadrícula 2        56.0 s        55.7 s
cuadrícula 36        90.0 s        54.8 s
cuadrícula 44        90.0 s        56.4 s
cuadrícula 45        90.0 s        53.0 s
```

La cuadrícula 1 es un recordatorio útil: Régin es allí **más lento** (69,1 s frente a 61,8 s), porque la trayectoria de búsqueda es distinta. Ninguna cuadrícula aislada decide nada. En las 100 cuadrículas reales con 108 × 108, la simulación da 56,6 s y 4 excesos sin Régin frente a 53,0 s y ningún exceso con él, siendo Régin más rápido en 73 cuadrículas frente a 27 (prueba del signo en estas 100 cuadrículas: `p` inferior a 0,00001). Encuentra exactamente los excesos reales (cuadrículas 36, 44, 45 y 86 con 108 × 108; 31, 42 y 76 con 104 × 104); la medición real da 49,3 s: la simulación es ligeramente pesimista.

## Comprobar un sorteo uniforme: la prueba del χ²

Las cuadrículas de prueba deben representar el problema, no solo el generador que las produce. Para los [cuadrados latinos](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme#la-cadena-de-jacobson-matthews), el generador de Jacobson y Matthews debe sortear cada cuadrado con la misma probabilidad. La **prueba del χ²** (ji cuadrado) compara el número de veces que ha salido cada cuadrado con lo que se esperaría de un sorteo uniforme. A continuación, un sorteo al azar entre 576 posibilidades (los 576 cuadrados latinos de 4 × 4) sustituye al generador, una vez uniforme y otra sesgado:

```python
import random

CASILLAS = 576                    # los 576 cuadrados latinos 4 x 4
SORTEOS = 57600                   # 100 sorteos esperados por cuadrado
random.seed(2)


def ji2(sorteos):
    """Suma de (observado - esperado)^2 / esperado en las 576 casillas del recuento."""
    cuentas = [0] * CASILLAS
    for t in sorteos:
        cuentas[t] += 1
    esperado = len(sorteos) / CASILLAS
    return sum((c - esperado) ** 2 / esperado for c in cuentas)


uniforme = [random.randrange(CASILLAS) for _ in range(SORTEOS)]
# un sorteo sesgado: los 100 primeros cuadrados salen algo más a menudo
sesgado = [random.randrange(CASILLAS) if random.random() < 0.9 else random.randrange(100)
          for _ in range(SORTEOS)]
print(f"sorteo uniforme: ji2 = {ji2(uniforme):.0f}")
print(f"sorteo sesgado: ji2 = {ji2(sesgado):.0f}")
desviacion = (2 * (CASILLAS - 1)) ** 0.5
print(f"esperado si es uniforme: {CASILLAS - 1} con una desviación de unos {desviacion:.0f}")
```

```
sorteo uniforme: ji2 = 556
sorteo sesgado: ji2 = 3466
esperado si es uniforme: 575 con una desviación de unos 34
```

| Resultado | Lectura |
|---|---|
| χ² = 556 para 576 cuadrados posibles | Cercano a 575 (el número de grados de libertad), a menos de una desviación (unos 34): compatible con un sorteo uniforme |
| χ² = 3466 para un sorteo sesgado | Muy por encima: se detecta el sesgo |

Medición real con el generador de la investigación: aparecen los 576 cuadrados de 4 × 4 y χ² = 557 para 575 ± 34 esperados. La prueba no **demuestra** la uniformidad: simplemente no ha detectado nada. Se completa con una comprobación en el propio problema: con 104 × 104, el portafolio de referencia simulado da 47,3 s en 20 cuadrículas uniformes frente a 50,4 s en las 100 cuadrículas oficiales, sin excesos; con 72 × 72, 6,2 s frente a 6,5 s. El solucionador no está ajustado solo al generador oficial.

## Las trampas

| Trampa | Qué ocurre | Remedio |
|---|---|---|
| Comparar medias en cuadrículas distintas | La diferencia entre cuadrículas oculta (o fabrica) la que hay entre ajustes | Emparejar: mismas cuadrículas, mismas semillas |
| Contar los fallos por el presupuesto en una media | La media depende del presupuesto, no solo del solucionador | Comparar los números de cuadrículas resueltas y los contadores en las resueltas por ambos |
| Concluir de una `p` superior a 0,05 que no hay diferencia | Muy pocas cuadrículas: un efecto real pasa inadvertido (`REGINK=16` con 20 cuadrículas) | Añadir cuadrículas nuevas, sin tocar el umbral por el camino |
| Probar varios ajustes con el mismo umbral del 5 % | Falsas alarmas (13,9 % con 7 ajustes) | Corregir el umbral (Bonferroni) o anunciar el número de comparaciones hechas |
| Quedarse con el mejor ajuste y juzgarlo con las mismas cuadrículas | El resultado es optimista (0,06 frente a 3,96 excesos en la simulación) | Un conjunto de confirmación apartado desde el principio |
| Juzgar una cuadrícula aislada | Un ajuste mejor de media puede perder en algunas cuadrículas (la cuadrícula 1) | Mirar las 100 cuadrículas y la prueba del signo |

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Para comparar dos ajustes: las mismas cuadrículas para ambos (emparejamiento), contadores de trabajo en lugar de tiempo, prueba del signo en las cuadrículas discordantes. El valor p mide cuán sorprendente sería la diferencia si los ajustes fueran equivalentes. Varias comparaciones aumentan las falsas alarmas; elegir y luego juzgar con las mismas cuadrículas es optimista. |
| **Herramientas utilizables** | La prueba del signo (`math.comb`), la corrección de Bonferroni, un conjunto de cuadrículas de confirmación, la simulación de un portafolio a partir de copias medidas solas, la prueba del χ² para comprobar un sorteo uniforme. |
| **Trampas a evitar** | Comparar medias, contar los fallos por el presupuesto, leer una `p` alta como prueba de equivalencia, multiplicar las comparaciones sin corregir el umbral, juzgar con las cuadrículas de la elección. |
| **Buenas prácticas** | Decidir el número de cuadrículas y el umbral antes de medir. Reservar cuadrículas nuevas para confirmar. Anunciar todas las comparaciones hechas. Comprobar el resultado con varias fuentes de cuadrículas. |
