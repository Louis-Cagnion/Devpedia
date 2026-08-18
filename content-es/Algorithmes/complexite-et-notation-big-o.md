---
order: 1
---

# La complejidad y la notación Big-O

Dos algoritmos pueden resolver exactamente el mismo problema con rendimientos radicalmente distintos según la cantidad de datos procesada. La **complejidad algorítmica** mide cómo **aumenta** el tiempo de ejecución (o la memoria usada) de un algoritmo cuando crece el tamaño de sus datos de entrada, con independencia de la máquina en la que se ejecute o del lenguaje usado para escribirlo.

## ¿Por qué no medir simplemente el tiempo en segundos?

Cronometrar un algoritmo da un resultado que depende del procesador, de la carga de la máquina en el momento de la prueba, del lenguaje usado... Esa cifra no permite entonces comparar dos algoritmos de forma fiable, ni predecir qué pasará con 10 veces más datos. La complejidad responde a una pregunta distinta y más útil: "si multiplico el tamaño de los datos por 10, ¿el tiempo de ejecución se multiplica por 10? ¿Por 100? ¿Se queda igual?"

## La notación Big-O: describir una tendencia, no una cifra precisa

La **notación Big-O** (escrita `O(...)`) describe cómo evoluciona el coste de un algoritmo en función del tamaño `n` de sus datos de entrada, en el peor de los casos, una vez ignorados los detalles constantes (un factor `2×` o una operación fija adicional no cambia la categoría).

```c
void mostrarUnaVez(int arreglo[], int tamano)
{
    printf("%d\n", arreglo[0]); // siempre 1 sola operacion, sea cual sea "tamano"
}
```

```c
void mostrarTodo(int arreglo[], int tamano)
{
    for (int i = 0; i < tamano; i++) {
        printf("%d\n", arreglo[i]); // 1 operacion por elemento -> "tamano" operaciones en total
    }
}
```

El primer ejemplo es **O(1)** (tiempo constante: siempre una sola operación). El segundo es **O(n)** (tiempo lineal: el número de operaciones crece exactamente como `n`, el número de elementos).

## Las clases de complejidad más habituales

| Notación | Nombre | Ejemplo de operación | Para n = 1 000 000 |
|---|---|---|---|
| `O(1)` | Constante | Acceder a `arreglo[i]` por índice | 1 operación |
| `O(log n)` | Logarítmica | Búsqueda en un [árbol binario de búsqueda](/?c=langages-de-programmation&s=c&p=arbres-binaires) equilibrado | ~20 operaciones |
| `O(n)` | Lineal | Recorrer todos los elementos una vez | 1 000 000 operaciones |
| `O(n log n)` | Casi lineal | Una [ordenación por fusión](/?c=algorithmes&p=tri-par-comparaison) | ~20 000 000 operaciones |
| `O(n²)` | Cuadrática | Comparar cada elemento con todos los demás (doble bucle anidado) | 1 000 000 000 000 operaciones |
| `O(2ⁿ)` | Exponencial | Probar todas las combinaciones posibles de un conjunto | Astronómico, ya para n = 40 |

```text
Tiempo
  ^                                         O(2^n)
  |                                    ,
  |                               ,   O(n^2)
  |                          ,·''
  |                    ,·''       O(n log n)
  |              ,·''''
  |        ,·'''            O(n)
  |   ,·''''
  |,·'  ________________ O(log n) / O(1)
  +----------------------------------------> n (tamaño de los datos)
```

> **Nota:** Big-O describe el **peor de los casos** por defecto (ej.: buscar un elemento ausente en un arreglo no ordenado obliga a recorrerlo entero). A veces se distingue el mejor caso (*best case*), el caso medio (*average case*) y el peor caso (*worst case*), pero Big-O solo, sin precisión adicional, siempre designa el peor caso.

## Complejidad en tiempo frente a complejidad en memoria

La misma notación se aplica a la **memoria** usada por un algoritmo, no solo a su duración de ejecución: un algoritmo puede ser rápido (`O(n)` en tiempo) pero costoso en memoria (`O(n)` de espacio adicional asignado), o al revés. Ambas deben evaluarse por separado: un compromiso frecuente en algorítmica consiste en cambiar memoria adicional por un tiempo de ejecución más corto, o viceversa.

> **Trampa:** ignorar un `O(n²)` oculto en un bucle que llama a una función que a su vez es `O(n)` (ej.: buscar un elemento por barrido dentro de un bucle que ya recorre todos los elementos): el coste real no es la suma de las dos complejidades, sino su producto.
>
> **Buena práctica:** antes de optimizar un algoritmo a nivel de hardware (véase [Performance](/?c=performance)), comprobar primero su complejidad: un `O(n²)` sustituido por un `O(n log n)` suele ganar mucho más que un ajuste de bajo nivel sobre un algoritmo cuya complejidad sigue siendo mala.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La notación Big-O describe cómo evoluciona el coste de un algoritmo con el tamaño de sus datos, en el peor de los casos, con independencia de la máquina usada. |
| **Herramientas utilizables** | La tabla de las clases de complejidad (`O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(2ⁿ)`) para clasificar rápidamente un algoritmo. |
| **Trampas a evitar** | Confundir la suma y el producto de las complejidades de operaciones anidadas; medir solo en segundos sin tener en cuenta la tendencia a gran escala. |
| **Buenas prácticas** | Evaluar la complejidad en tiempo Y en memoria por separado; corregir una mala complejidad antes de optimizar a nivel de hardware. |
