---
order: 10
---

# El property-based testing

Todos los tipos de prueba vistos hasta ahora ([unitarias](/?c=tests&p=tests-unitaires), [de integración](/?c=tests&p=tests-dintegration), [E2E](/?c=tests&p=tests-end-to-end)) comparten un mismo principio: elegir ejemplos precisos de entrada, y verificar el resultado esperado para cada uno. El **property-based testing** invierte esta lógica: en lugar de elegir las entradas uno mismo, se describe una **propiedad** que debe seguir siendo cierta para cualquier entrada válida, y una herramienta genera automáticamente cientos de entradas para intentar contradecirla.

## Una prueba clásica, ejemplo por ejemplo

Una prueba unitaria clásica verifica un número finito de casos elegidos a mano:

```text
prueba "sumar(2, 3) == 5"
prueba "sumar(-1, 1) == 0"
prueba "sumar(0, 0) == 0"
```

Estas tres pruebas pasan, pero no dicen nada sobre qué ocurre con `sumar(1000000, -999999)`, o con cualquier otra combinación no probada explícitamente: un bug escondido en un caso que la persona que escribió la prueba no eligió permanece invisible.

## Una propiedad: lo que siempre debe ser cierto

Una **propiedad** describe una regla general, válida para cualquier entrada que cumpla ciertas restricciones, en lugar de un resultado preciso para una entrada precisa:

```text
Propiedad: "sumar es conmutativa"
  Para todo a y b: sumar(a, b) == sumar(b, a)

Propiedad: "ordenar una lista no cambia su tamaño"
  Para toda lista L: tamano(ordenar(L)) == tamano(L)

Propiedad: "ordenar dos veces da el mismo resultado que ordenar una vez"
  Para toda lista L: ordenar(ordenar(L)) == ordenar(L)
```

Una herramienta de property-based testing (por ejemplo [fast-check](https://fast-check.dev) en [JavaScript](/?c=langages&s=javascript&p=javascript), [Hypothesis](https://hypothesis.readthedocs.io) en [Python](/?c=langages&s=python&p=python), o [QuickCheck](https://hackage.haskell.org/package/QuickCheck), la herramienta histórica del campo en Haskell) genera después automáticamente cientos de entradas aleatorias que cumplen las restricciones dadas, y verifica la propiedad en cada una.

```text
Prueba property-based para "ordenar no cambia el tamaño":

  repetir 200 veces:
    generar una lista aleatoria L (tamaño y contenido variables)
    verificar que tamano(ordenar(L)) == tamano(L)

  -> si un solo caso generado rompe la propiedad, la prueba
     falla y muestra la lista exacta que causó el problema
```

## Encontrar un contraejemplo mínimo (shrinking)

Cuando una herramienta de property-based testing encuentra una entrada que rompe la propiedad, no se queda ahí: intenta **reducirla** (*shrinking*) hacia el contraejemplo más pequeño posible que todavía reproduzca el bug, para facilitar el diagnóstico.

```text
Contraejemplo encontrado inicialmente:
  L = [47, -12, 999, 3, -5, 0, 812, ...] (lista de 50 elementos)

Tras la reducción (shrinking):
  L = [1, 0] (2 elementos, el bug sigue reproduciéndose)

-> mucho más fácil de entender y corregir que la lista inicial
```

## Cuándo elegir este enfoque

El property-based testing no reemplaza las pruebas clásicas, las complementa, en particular en código donde una **regla general** es más fácil de formular que una lista de casos precisos: funciones matemáticas, algoritmos de ordenación o codificación/decodificación, parsers, estructuras de datos.

> **Trampa:** intentar escribir una propiedad para un comportamiento que en realidad no sigue una regla general simple (una lógica de negocio con numerosos casos particulares arbitrarios). Forzar una propiedad donde no encaja produce una regla tan complicada que se vuelve ella misma propensa a errores.
>
> **Buena práctica:** reservar el property-based testing a los comportamientos que realmente obedecen a una regla general simple de enunciar; mantener pruebas clásicas, por ejemplo, para la lógica de negocio rica en casos particulares.

## Un caso vecino: el test diferencial

Al reescribir un algoritmo existente (implementación más rápida, cambio de estructura de datos...), no siempre hay una propiedad general simple que formular. El **test diferencial** compara entonces directamente las dos implementaciones sobre muchas entradas generadas: la antigua sirve de referencia, y cualquier desacuerdo entre los dos resultados señala un error en la reescritura.

Ejemplo real del solucionador SAT Skyscraper (véase [Codificar un problema en SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)): al pasar de cláusulas implícitas enumeradas a recuperadas por cálculo, la reescritura se validó en dos niveles: el conjunto exacto de cláusulas retiradas comparado con el antiguo conjunto enumerado, y luego el acuerdo «solución encontrada / sin solución» entre las dos versiones en 700 cuadrículas.

```python
def ordenar_antiguo(xs):
    """Implementación antigua: ordenación por selección (correcta pero lenta)."""
    xs = list(xs)
    for i in range(len(xs)):
        m = i
        for j in range(i + 1, len(xs)):
            if xs[j] < xs[m]:
                m = j
        xs[i], xs[m] = xs[m], xs[i]
    return xs

def ordenar_nuevo(xs):
    """Reescritura a validar: ordenación nativa de Python (Timsort)."""
    return sorted(xs)
```

Ejecutado sobre 500 listas aleatorias (longitudes de 0 a 20, valores de -50 a 50), comparando `ordenar_antiguo(xs) != ordenar_nuevo(xs)` en cada sorteo: salida real `0 desaccord(s) sur 500 entrees generees` (0 desacuerdo(s) de 500 entradas generadas).

| Property-based testing | Test diferencial |
|---|---|
| Compara el resultado con una **propiedad general** enunciada a mano | Compara el resultado con **otra implementación** (la versión antigua) |
| Útil incluso sin una versión previa con la que comparar | Sirve específicamente para validar una reescritura |
| Exige formular una regla verdadera para cualquier entrada válida | Solo exige que la implementación antigua siga disponible como referencia |

> **Trampa:** el test diferencial no detecta un error presente en ambas implementaciones: estarían de acuerdo, erróneamente. Valida una reescritura frente a lo existente, no lo existente frente a la especificación.
>
> **Buena práctica:** generar muchas entradas, incluyendo casos límite (lista vacía, valores repetidos, tamaños extremos); combinar con una prueba contra la especificación cuando exista.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | El property-based testing describe una propiedad válida para cualquier entrada, en lugar de verificar ejemplos elegidos a mano; una herramienta genera automáticamente cientos de entradas para intentar contradecirla, y reduce (shrinking) todo contraejemplo encontrado hacia el caso más simple posible. El test diferencial, un caso vecino, compara en cambio el resultado de una reescritura con el de la implementación antigua sobre muchas entradas generadas. |
| **Herramientas utilizables** | fast-check (JavaScript), Hypothesis (Python), QuickCheck (Haskell, la herramienta histórica del campo); test diferencial: no requiere herramienta dedicada, basta un script de comparación. |
| **Trampas a evitar** | Forzar una propiedad sobre un comportamiento sin regla general simple; creer que el acuerdo entre dos implementaciones en un test diferencial prueba la ausencia de un error compartido por ambas. |
| **Buenas prácticas** | Reservar el property-based testing a comportamientos con una regla general clara (funciones matemáticas, ordenación, parsers); mantener pruebas clásicas para la lógica de negocio rica en casos particulares; en el test diferencial, generar también casos límite y combinar con una prueba contra la especificación cuando exista. |
