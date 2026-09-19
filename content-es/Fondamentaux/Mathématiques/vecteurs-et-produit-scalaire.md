---
order: 2
---

# Vectores y producto escalar

Un número solo basta para representar una información aislada (ver [la variable](/?c=bases-de-l-informatique&p=la-variable)). Pero a menudo, varios números describen juntos una sola cosa: una posición, las características de un cliente. Eso es lo que representa un **vector**.

Un vector es una lista ordenada de números, tratada como una sola entidad.

```text
Posicion de un punto en un plano:  [3, 5]
                                     |  |
                                     |  segunda coordenada (altura, y)
                                     primera coordenada (anchura, x)
```

```vecteurs
vecteurs: (3, 5)
label: El vector [3, 5]
```

> **Analogía:** una lista de compras donde el orden tiene un sentido preciso (2 kg de manzanas, luego 3 baguettes): invertir el orden cambiaría lo que representa cada número, no solo su posición en la lista.

> **Trampa:** creer que el orden de las componentes es intercambiable. `[3, 5]` y `[5, 3]` no describen el mismo punto: la primera componente siempre tiene el mismo rol (aquí, la posición horizontal), sea cual sea su valor.
>
> **Buena práctica:** documentar qué representa cada posición de un vector desde su creación (un comentario, un nombre de variable explícito): nada en los números en sí recuerda su significado.

## Un vector puede tener muchos más de dos números

Nada limita un vector a dos componentes:

```text
Un cliente:  [edad, salario, antiguedad] = [34, 42000, 5]
```

Cada componente adicional añade una **dimensión**. Un vector de 3 componentes aún se representa en el espacio (como un punto en 3D), pero un vector de 100 o 1000 componentes (el caso habitual en inteligencia artificial para representar una palabra o una imagen) ya no se dibuja, solo el cálculo sigue funcionando exactamente igual.

## Sumar dos vectores

```text
[1, 2] + [3, 4] = [1+3, 2+4] = [4, 6]
```

```vecteurs
vecteurs: (1, 2), (3, 4), (4, 6)
label: [1, 2] + [3, 4] = [4, 6]
```

Se suman las componentes una a una, en la misma posición.

> **Trampa:** sumar dos vectores de tamaños diferentes no tiene sentido (`[1, 2] + [1, 2, 3]` no está definido: ¿qué componente iría con cuál?). Un programa que intenta la operación en general lanza un error explícito (ej. *"shapes mismatch"* con [NumPy](/?c=data-science&p=numpy)) en lugar de adivinar.
>
> **Buena práctica:** verificar que dos vectores tienen la misma dimensión antes de combinarlos, en lugar de descubrir la incompatibilidad en el momento de la ejecución.

## El producto escalar: reducir dos vectores a un solo número

El **producto escalar** (*dot product*) de dos vectores de la misma dimensión multiplica sus componentes una a una, y luego suma todos esos productos:

```text
[1, 2, 3] . [4, 5, 6] = (1×4) + (2×5) + (3×6) = 4 + 10 + 18 = 32
```

A diferencia de la suma, el resultado no es un vector sino un **número único**: de ahí el nombre "escalar".

Este número mide hasta qué punto dos vectores apuntan en la misma dirección:

| Resultado del producto escalar | Interpretación |
|---|---|
| Grande y positivo | Los dos vectores apuntan globalmente en la misma dirección |
| Cerca de cero | Los dos vectores no tienen globalmente ninguna relación direccional |
| Negativo | Los dos vectores apuntan globalmente en direcciones opuestas |

> **Buena práctica:** esta misma operación (multiplicar término a término, luego sumar) vuelve a aparecer en numerosos cálculos más adelante, en particular para combinar varias entradas en un solo valor dando a cada una un **peso**, un número que refleja su importancia relativa en el resultado final (una entrada con peso alto pesa más en la suma que una entrada con peso bajo). Se dice entonces que el resultado es una suma **ponderada**. Reconocer esta operación bajo esta forma evita redescubrirla cada vez con un nombre distinto.

## La norma de un vector: su longitud

Un vector de 2 componentes como `[3, 4]` puede leerse como un punto en un plano (ver el primer ejemplo de este capítulo), alcanzado partiendo de un punto de partida común a todos los vectores: el **origen**, el punto `[0, 0]`. La **norma** de un vector es la distancia entre el origen y ese punto: el camino más directo, en línea recta, no la suma de las dos distancias recorridas en escuadra (`3 + 4 = 7` sería falso):

```text
        (3,4)
          /|
         / |
    5   /  | 4   <- segunda componente del vector: distancia vertical desde el origen
       /   |
      /____|
    (0,0)  3     <- primera componente del vector: distancia horizontal desde el origen
   origen
```

El trayecto directo (la diagonal, longitud 5) siempre es más corto que el trayecto en escuadra (3 luego 4, o sea 7): eso es precisamente lo que calcula la fórmula de la norma, que viene del [teorema de Pitágoras](https://en.wikipedia.org/wiki/Pythagorean_theorem): la raíz cuadrada de la suma de los cuadrados de cada componente.

```text
norma([3, 4]) = raiz(3² + 4²) = raiz(9 + 16) = raiz(25) = 5
```

Dividir cada componente de un vector por su propia norma lo **normaliza**: su dirección se mantiene igual, pero su longitud pasa a ser exactamente 1.

```text
[3, 4] tiene norma 5 (calculada antes)

Vector normalizado = [3/5, 4/5] = [0.6, 0.8]

Verificacion, recalculando la norma de este nuevo vector:
norma([0.6, 0.8]) = raiz(0.6² + 0.8²) = raiz(0.36 + 0.64) = raiz(1) = 1
```

Este resultado no es una coincidencia propia de este ejemplo: dividir cada componente por la norma divide mecánicamente la norma misma por ese mismo valor: una norma `N` dividida por `N` siempre da `1`, sea cual sea el vector de partida. Útil para comparar dos vectores solo en su dirección, sin que su respectiva longitud falsee la comparación.

> **Trampa:** normalizar un vector nulo (`[0, 0]`) equivale a dividir por una norma de 0: una operación no definida, no solo un error de redondeo.
>
> **Buena práctica:** verificar que un vector no es nulo antes de normalizarlo, en lugar de dejar que el programa falle en una división por cero.

## Prueba geométrica: ¿está un punto dentro de un triángulo?

Dado un triángulo formado por tres puntos `A`, `B`, `C` y un punto `P` a probar, un método simple consiste en comparar **áreas**: calcular el área del triángulo completo `ABC`, y luego la suma de las áreas de los tres subtriángulos formados por `P` y cada par de vértices (`P-A-B`, `P-B-C`, `P-C-A`). Si esa suma es igual al área del triángulo completo, `P` está dentro; si `P` estuviera fuera, la suma de las subáreas sería estrictamente mayor.

El área de un triángulo a partir de las coordenadas de sus tres vértices se calcula directamente, sin construir nunca una altura ni un ángulo, mediante un determinante:

```text
area(A, B, C) = |  (Bx-Ax)*(Cy-Ay) - (Cx-Ax)*(By-Ay)  |  / 2
```

```c
double area(double ax, double ay, double bx, double by, double cx, double cy)
{
    return fabs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2.0;
}

int puntoEnTriangulo(
    double px,
    double py,
    double ax,
    double ay,
    double bx,
    double by,
    double cx,
    double cy
)
{
    double areaTotal = area(ax, ay, bx, by, cx, cy);
    double areaSub1 = area(px, py, ax, ay, bx, by);
    double areaSub2 = area(px, py, bx, by, cx, cy);
    double areaSub3 = area(px, py, cx, cy, ax, ay);
    double epsilon = 0.0001;

    return fabs(areaTotal - (areaSub1 + areaSub2 + areaSub3)) < epsilon;
}
```

> **Trampa:** comparar las dos áreas con una igualdad estricta (`==`). Como con cualquier comparación de [números flotantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), un pequeño margen de error (epsilon) es indispensable para tolerar la imprecisión de los cálculos.
>
> **Buena práctica:** esta técnica (sumar las áreas de los subtriángulos) es una alternativa a otros dos métodos clásicos para la misma prueba: las coordenadas baricéntricas, o una prueba de signo cruzado por arista (comprobar que `P` está del mismo lado de cada una de las tres aristas); las tres dan el mismo resultado, la elección depende sobre todo de lo que el resto del programa ya calcule.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un vector es una lista ordenada de números tratada como una sola entidad. El producto escalar reduce dos vectores de la misma dimensión a un solo número, que mide hasta qué punto apuntan en la misma dirección. La norma es la longitud de un vector. |
| **Herramientas utilizables** | Ninguna herramienta específica para el cálculo a mano; en la práctica, una biblioteca como [NumPy](/?c=data-science&p=numpy) efectúa estas operaciones directamente sobre vectores enteros, sin bucle explícito. El cálculo de área por determinante para una prueba punto-en-triángulo. |
| **Trampas a evitar** | Sumar o combinar dos vectores de dimensiones diferentes. Normalizar un vector nulo (división por una norma de 0). Comparar dos áreas flotantes con igualdad estricta. |
| **Buenas prácticas** | Verificar que dos vectores tienen la misma dimensión antes de cualquier operación entre ellos. Documentar qué representa cada componente de un vector desde su creación. |
