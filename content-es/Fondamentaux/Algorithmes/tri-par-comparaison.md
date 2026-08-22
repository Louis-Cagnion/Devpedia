---
order: 2
---

# La ordenación por comparación

Ordenar una lista de valores es uno de los problemas más estudiados en algorítmica: existen numerosas estrategias, con [complejidades](/?c=algorithmes&p=complexite-et-notation-big-o) muy diferentes. Una **ordenación por comparación** solo dispone de una operación básica para decidir el orden: comparar dos elementos entre sí (`a < b ?`), sin acceder nunca directamente a su valor numérico (a diferencia de otras familias de ordenación, fuera del alcance de este capítulo, que explotan la estructura de los propios valores).

## La ordenación por inserción

La **ordenación por inserción** construye la parte ordenada del arreglo elemento por elemento: en cada paso, toma el siguiente elemento y lo inserta en su lugar correcto entre los ya ordenados, como se ordenarían cartas de una en una en la mano.

```c
void ordenacionInsercion(int arreglo[], int tamano)
{
    for (int i = 1; i < tamano; i++) {
        int valor = arreglo[i];
        int j = i - 1;

        while (j >= 0 && arreglo[j] > valor) {
            arreglo[j + 1] = arreglo[j]; // desplaza el elemento hacia la derecha
            j--;
        }
        arreglo[j + 1] = valor; // inserta en el lugar correcto
    }
}
```

Esta ordenación es **O(n²)** en el peor de los casos (arreglo ordenado al revés: cada inserción desplaza todo lo anterior), pero solo **O(n)** si el arreglo ya está casi ordenado: una ventaja que explotan algoritmos híbridos más avanzados.

## La ordenación por fusión (*merge sort*)

La **ordenación por fusión** aplica el principio *divide y vencerás*: corta el arreglo en dos mitades, ordena recursivamente cada mitad, y luego **fusiona** las dos mitades ordenadas en una única lista ordenada.

```text
[8, 3, 5, 1, 9, 2]
        |
   dividir en dos
        |
  [8, 3, 5]      [1, 9, 2]
    |                |
  ordenar          ordenar
    |                |
  [3, 5, 8]      [1, 2, 9]
        \            /
         \          /
          fusionar
              |
      [1, 2, 3, 5, 8, 9]
```

La fusión de dos listas ya ordenadas es **O(n)**: basta con comparar los dos primeros elementos restantes de cada lista y tomar el menor, avanzando progresivamente. Combinado con la división en dos (`log n` niveles de división), la ordenación por fusión completa cuesta **O(n log n)**, sea cual sea el estado inicial del arreglo: a diferencia de la ordenación por inserción, su peor caso no se degrada.

> **Nota:** este compromiso entre los dos algoritmos (inserción rápida en datos casi ordenados, fusión estable en O(n log n) en todos los casos) es explotado directamente por ordenaciones híbridas como la **ordenación por fusión e inserción** (*merge-insertion sort*), que inserta pequeños grupos ya ordenados por fusión mediante una búsqueda por inserción optimizada.

## Comparar los algoritmos de ordenación

| Algoritmo | Peor caso | Caso medio | Memoria adicional | ¿Estable? |
|---|---|---|---|---|
| Ordenación de burbuja | O(n²) | O(n²) | O(1) | Sí |
| Ordenación por selección | O(n²) | O(n²) | O(1) | No |
| Ordenación por inserción | O(n²) | O(n²) | O(1) | Sí |
| Ordenación por fusión | O(n log n) | O(n log n) | O(n) | Sí |
| Ordenación rápida (*quicksort*) | O(n²) | O(n log n) | O(log n) | No |

Una ordenación es **estable** cuando dos elementos considerados iguales por la comparación conservan su orden relativo original tras la ordenación (importante si, por ejemplo, se ordena una lista ya ordenada por nombre, esta vez por edad: dos personas de la misma edad deben mantenerse en su orden alfabético).

> **Trampa:** creer que una ordenación por comparación puede bajar de **O(n log n)** en el caso general: es un límite teórico demostrado (imposible hacerlo mejor comparando solo pares de elementos), no una simple cuestión de optimización de la implementación.
>
> **Buena práctica:** usar la implementación de ordenación ya proporcionada por el lenguaje/la biblioteca estándar (generalmente una ordenación híbrida ya optimizada) en lugar de reescribir una ordenación a mano, salvo restricción específica (memoria limitada, límite en el número de operaciones permitidas, estructura de datos particular).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una ordenación por comparación solo decide el orden comparando pares de elementos. La ordenación por inserción es simple pero O(n²); la ordenación por fusión garantiza O(n log n) en todos los casos a costa de memoria adicional. |
| **Herramientas utilizables** | La tabla comparativa de los algoritmos de ordenación (complejidad, memoria, estabilidad) para elegir el adecuado según el contexto. |
| **Trampas a evitar** | Esperar bajar de O(n log n) con una ordenación por comparación pura: es un límite teórico, no un defecto de implementación. |
| **Buenas prácticas** | Preferir la ordenación ya proporcionada por el lenguaje, y solo reimplementar una ordenación a mano cuando exista una restricción concreta que lo justifique. |
