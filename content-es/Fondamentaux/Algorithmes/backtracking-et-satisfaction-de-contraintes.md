---
order: 6
---

# El backtracking y la satisfacción de restricciones (CSP)

Un [CSP](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem) (*Constraint Satisfaction Problem*, problema de satisfacción de restricciones) consiste en encontrar un valor para cada **variable** de un problema, dentro de un conjunto de valores posibles (su **dominio**), sin violar ninguna **restricción** entre ellas. El [sudoku](https://es.wikipedia.org/wiki/Sudoku), el [problema de las N-reinas](https://es.wikipedia.org/wiki/Problema_de_las_ocho_reinas) (colocar N reinas en un tablero N×N sin que ninguna pueda capturar a otra) y el coloreado de grafos (colorear cada nodo sin que dos nodos vecinos compartan color) son todos CSP.

## Reintentar en lugar de retroceder al azar: el backtracking

El **backtracking** (búsqueda con retroceso) explora las soluciones posibles una variable a la vez: prueba un valor, **recurre** a la variable siguiente (la función se llama a sí misma sobre un subproblema más pequeño; véase la ordenación por mezcla en [El ordenamiento por comparación](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) para otro ejemplo de recursión), y si ningún valor funciona para la siguiente variable, **deshace** el intento actual para probar el siguiente -- de ahí el nombre "retroceso".

Ejemplo con las N-reinas, colocando una reina por columna:

```c
int columnas[N]; // columnas[i] = fila donde está la reina de la columna i

int es_valido(int columna, int fila)
{
    for (int c = 0; c < columna; c++)
    {
        if (columnas[c] == fila)                     // misma fila que una reina ya colocada
            return 0;
        if (abs(columnas[c] - fila) == columna - c)   // misma diagonal
            return 0;
    }
    return 1;
}

int resolver(int columna)
{
    if (columna == N)
        return 1; // todas las columnas están colocadas: solución encontrada

    for (int fila = 0; fila < N; fila++)
    {
        if (es_valido(columna, fila))
        {
            columnas[columna] = fila;    // intento
            if (resolver(columna + 1))
                return 1;
            // fallo más adelante: nada que deshacer aquí, la casilla se sobrescribe en la siguiente vuelta
        }
    }
    return 0; // ninguna fila funciona: retroceso a la llamada anterior
}
```

`resolver` prueba cada fila para la columna actual; si una fila lleva a un callejón sin salida más adelante (`resolver(columna + 1)` devuelve `0`), el bucle simplemente pasa a la siguiente fila -- ese es todo el mecanismo de retroceso, sin ninguna estructura de datos dedicada. En un array desordenado usado para representar los candidatos restantes de una variable, el [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove) permite deshacer un candidato ya retirado sin ninguna copia.

## Elegir primero la variable adecuada: la heurística MRV

¿En qué orden tratar las variables? La columna en el ejemplo anterior, pero nada impone ese orden. La heurística **MRV** (*Minimum Remaining Values*) elige primero la variable con **menos** valores posibles restantes:

| Variable | Valores posibles restantes | Orden MRV |
|---|---|---|
| A | 4 valores | 3.º |
| B | 1 valor | 1.º |
| C | 2 valores | 2.º |

Tratar `B` primero falla (o tiene éxito) inmediatamente si su único valor posible ya es inválido, en lugar de descubrirlo tras explorar inútilmente `A` y `C` primero. Una variable con un solo valor posible que falla corta toda una rama de la búsqueda desde el primer paso: adivinar primero sobre la variable más restringida hace fallar las malas ramas lo antes posible.

## Reducir los dominios antes incluso de intentar: la propagación de restricciones

El backtracking por sí solo prueba y luego deshace. La **propagación de restricciones** va más allá: antes (o durante) la búsqueda, reduce directamente los valores posibles de las variables aún no asignadas, en función de las ya fijadas, hasta que ninguna reducción adicional es posible (un **punto fijo**).

```text
Restricción: columna A ≠ columna B (ya fijada en 3)

Antes de la propagación: A puede ser {1, 2, 3, 4}
Después de la propagación: A puede ser {1, 2, 4}    (3 eliminado, incompatible con B)
```

Si esta reducción vacía por completo el dominio de una variable (no queda ningún valor posible), la rama actual es matemáticamente imposible -- inútil intentar nada, se abandona de inmediato (*fail-fast*, fallar lo antes posible en lugar de descubrirlo tras varios pasos de búsqueda inútiles). Esta técnica de reducción hasta el punto fijo, combinada con esta detección de contradicción, tiene nombre en la literatura CSP: [**AC-3**](https://en.wikipedia.org/wiki/AC-3_algorithm) (*Arc Consistency 3*).

| | Solo backtracking | + Propagación de restricciones (AC-3) |
|---|---|---|
| Detección del fallo | Después de probar un valor inválido | Antes incluso de probar, si un dominio queda vacío |
| Coste | Menos cálculo por paso | Más cálculo por paso, pero ramas enteras evitadas |
| Uso típico | Problemas pequeños, pocas restricciones cruzadas | Sudoku, planificación, problemas con fuertes restricciones cruzadas |

> **Buena práctica:** combinar los tres -- propagación para eliminar ramas imposibles pronto, MRV para adivinar primero sobre la variable más propensa a fallar rápido, backtracking para explorar el resto -- en lugar de apoyarse en un único mecanismo.

> **Nota:** para ir más lejos, ver [Paralelizar una búsqueda: dividir en subproblemas independientes](/?c=fondamentaux&s=algorithmes&p=recherche-parallele-par-sous-problemes) (explorar varias ramas al mismo tiempo en varios núcleos) y [Los solucionadores SAT y el algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) (aprender de cada fracaso en lugar de solo retroceder).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un CSP busca un valor por variable sin violar ninguna restricción. El backtracking prueba un valor, recurre, y lo deshace si falla más adelante. MRV elige primero la variable más restringida. La propagación de restricciones (AC-3) reduce los dominios y detecta una contradicción antes incluso de probar. |
| **Herramientas utilizables** | Recursión para la exploración; swap-remove para deshacer un candidato retirado sin copiar. |
| **Trampas a evitar** | Explorar las variables en un orden arbitrario en lugar de con MRV, lo que descubre los fallos más tarde de lo necesario. |
| **Buenas prácticas** | Combinar backtracking, MRV y propagación de restricciones en lugar de un único mecanismo aislado; cortar una rama en cuanto una contradicción sea detectable (fail-fast), sin explorar más allá. |
