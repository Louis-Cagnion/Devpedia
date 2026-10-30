---
order: 11
---

# Bloqueo de cardán y rotación incremental

Una **orientación** es la forma en que se gira un objeto en el espacio, aparte de su posición: un avión que cabecea, una cámara que mira hacia arriba, un modelo 3D que se hace girar con el ratón. Para memorizarla, lo más natural es guardar **tres ángulos**, uno por eje: son los **ángulos de Euler**. Funciona bien, hasta un valor preciso en el que dos de los tres mandos empiezan a hacer lo mismo: un movimiento se vuelve imposible y la vista puede dar un salto. Este defecto se llama **bloqueo de cardán** (*gimbal lock* en inglés). Un **cardán** es una suspensión formada por anillos encajados, cada uno girando dentro del siguiente, como la de una brújula de barco o la de un giroscopio; el bloqueo se produce cuando dos de esos anillos quedan en el mismo plano. Los cálculos siguientes reproducen este montaje con matrices ([detalle del fenómeno](https://en.wikipedia.org/wiki/Gimbal_lock)).

Este capítulo muestra el defecto con mediciones, lo evita guardando una matriz en lugar de ángulos y, después, trata el precio que hay que pagar:

| Paso | Pregunta | Sección |
|---|---|---|
| 1 | ¿Qué es un ángulo de Euler y por qué importa el orden de las rotaciones? | [Los ángulos de Euler](#los-angulos-de-euler-tres-numeros-tres-ejes) |
| 2 | ¿Qué ocurre exactamente en el momento del bloqueo? | [El bloqueo de cardán](#el-bloqueo-de-cardan-cuando-dos-ejes-ya-no-son-mas-que-uno) |
| 3 | ¿Cómo evitarlo? | [La rotación incremental](#la-rotacion-incremental-guardar-la-matriz-no-los-angulos) |
| 4 | ¿Qué error acumula esta matriz y cómo se elimina? | [El error de redondeo](#el-error-de-redondeo-que-se-acumula) y después [la reortonormalización](#la-reortonormalizacion-enderezar-la-matriz) |
| 5 | ¿Cuándo conviene conservar ángulos de todos modos? | [Las variantes](#las-variantes-cuaterniones-y-angulos-limitados) |

Este capítulo continúa [Matrices y cámara](/?c=fondamentaux&s=graphisme&p=matrices-et-camera), que construye las matrices de rotación, presenta la [rotación acumulada](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#hacer-girar-un-objeto-la-rotacion-acumulada) y la [fórmula de Rodrigues](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-alrededor-de-un-eje-cualquiera-la-formula-de-rodrigues): las usa sin volver a demostrarlas. Supone conocidas [las matrices y el producto matricial](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) (una tabla de números y la forma de multiplicar dos tablas), [los vectores, el producto escalar y la norma](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (una lista de números, la suma de sus productos dos a dos, y la longitud del vector), y las bases de C: [las variables](/?c=langages&s=c&p=variables), [las condiciones](/?c=langages&s=c&p=conditions) y [los bucles](/?c=langages&s=c&p=boucles).

Todos los programas se compilan con `gcc -std=c99 -Wall -Wextra -o programa programa.c -lm` (véase [el proceso de compilación](/?c=langages&s=c&p=compilation): `-Wall -Wextra` piden todas las advertencias, `-lm` añade la biblioteca matemática) y se ejecutan con `./programa` (en Linux o macOS). Las salidas reproducidas en este capítulo se han obtenido todas al ejecutar. Regla de ensamblado: un programa se forma con **todos los bloques de funciones que lo preceden**, en orden, seguidos de **un único bloque que contiene `main`** (la función por la que empieza un programa C). Los bloques que ya contienen un `main` solo sirven para sí mismos.

## Los ángulos de Euler: tres números, tres ejes

Un **eje** es la recta alrededor de la que se gira, como el eje de una peonza. El espacio tiene tres, nombrados como en [el capítulo sobre las matrices](/?c=fondamentaux&s=graphisme&p=matrices-et-camera): **X** hacia la derecha, **Y** hacia arriba, **Z** hacia usted, fuera de la pantalla (la cámara mira, por tanto, hacia -Z). Los ángulos de Euler, que llevan el nombre del matemático Leonhard Euler ([detalle](https://en.wikipedia.org/wiki/Euler_angles)), describen una orientación mediante una rotación alrededor de cada uno:

| Ángulo | Nombre en inglés | Eje | El gesto de la cabeza | En un avión |
|---|---|---|---|---|
| **Cabeceo** | *pitch* | X | Asentir con la cabeza para decir «sí» | El morro sube o baja |
| **Guiñada** | *yaw* | Y | Girar la cabeza para decir «no» | El morro se desvía a la izquierda o a la derecha |
| **Alabeo** | *roll* | Z | Inclinar la cabeza, la oreja hacia el hombro | Las alas se inclinan |

```text
            Y (arriba)  guiñada: girar alrededor de Y
            ^
            |
            |
            +---------> X (derecha)   cabeceo: girar alrededor de X
           /
          /
         v
        Z (hacia usted)                alabeo: girar alrededor de Z
```

Un ángulo se mide en **grados** (una vuelta completa vale 360) o en **radianes** (180 grados valen π, es decir unos 3,14159 radianes; [recordatorio](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#del-objeto-a-la-pantalla-model-view-projection) con el coseno y el seno). Las funciones `cos` y `sin` de C esperan radianes. El sentido positivo es el de la **regla de la mano derecha**: el pulgar a lo largo del eje, apuntando hacia uno mismo, los dedos que se cierran indican el sentido de giro de un ángulo positivo.

Cada rotación es una matriz 3×3, la versión sin traslación de las del [capítulo anterior](/?c=fondamentaux&s=graphisme&p=matrices-et-camera). Para una matriz así, la **columna j** indica adónde va la flecha de longitud 1 colocada sobre el eje j (columna 0 para X, 1 para Y, 2 para Z): eso es lo que da el producto de la matriz por esa flecha. Los bloques de código que siguen usan algunas escrituras de C:

| Escritura | Significado |
|---|---|
| `#include <math.h>` | Carga una biblioteca de funciones ([las cabeceras](/?c=langages&s=c&p=headers)). `math.h` aporta `cos`, `sin`, `sqrt` (raíz cuadrada) y `fabs` (valor absoluto: el número sin su signo), véase la [lista de funciones de `<math.h>`](https://en.cppreference.com/w/c/numeric/math); `stdio.h` aporta `printf` |
| `int`, `long` | Números enteros (`long`: un rango más amplio), véase [las variables](/?c=langages&s=c&p=variables) |
| `float`, `double` | Números en coma flotante almacenados en 32 y 64 bits, es decir unas 7 y 15 cifras exactas ([detalle](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#como-se-codifica-un-flotante)). Las funciones `cos`, `sin`, `sqrt` calculan en `double` |
| `1e-9`, `3.0e-08` | Notación científica: `1e-9` vale 10⁻⁹, es decir 0,000000001 |
| `const` | Un valor que nunca cambiará |
| `float v[3]` | Un arreglo: 3 números colocados uno al lado de otro, `v[0]`, `v[1]`, `v[2]`, que se rellena con `{1, 0, 0}` |
| `typedef struct { ... } Nom;` | Agrupa varios valores bajo un solo nombre de tipo; `e.campo` designa el campo `campo` del valor `e` |
| `m[i][j]` | La casilla de la fila `i` y de la columna `j` de un arreglo de dos dimensiones; se cuenta desde 0 |
| `for (int i = 0; i < 3; i++)` | Repite la instrucción siguiente con `i` valiendo 0, luego 1, luego 2 |
| `a % b` | El resto de la división de `a` entre `b` |
| `a += b`, `a -= b`, `a /= b` | Atajos para `a = a + b`, `a = a - b`, `a = a / b` |
| `a == b`, `a && b` | `==` compara dos valores (verdadero si son iguales); `&&` significa «y» |
| Una función | Un trozo de código con nombre: `Mat3 producto(Mat3 a, Mat3 b)` recibe dos matrices y devuelve una (`return`) |
| `x ? a : b` | Vale `a` si la condición `x` es verdadera, `b` en caso contrario |

El primer bloque escribe las rotaciones alrededor de un eje, el producto de dos matrices y la aplicación de una matriz a un punto. Una única función `rotacion_eje` fabrica las tres rotaciones: para el eje 2 (Z), rellena exactamente la matriz de la tabla del capítulo anterior.

```c
#include <math.h>      // cos, sin, sqrt, fabs...
#include <stdio.h>     // printf

// Un ángulo de 1 grado, expresado en radianes: π / 180
const float DEG = 0.017453292;

// Una matriz 3 x 3 de float, leída m[fila][columna]; typedef le da un nombre corto
typedef struct { float m[3][3]; } Mat3;

// Matriz de rotación de "angulo" radianes alrededor del eje 0 (X), 1 (Y) o 2 (Z)
Mat3 rotacion_eje(int eje, float angulo)
{
    Mat3 r = {{{0}}};                       // toda la matriz empieza en 0
    int i = (eje + 1) % 3;                  // los otros dos ejes, en el orden X, Y, Z
    int j = (eje + 2) % 3;                  // (% da el resto de la división: 2 + 1 da 0)
    r.m[eje][eje] = 1;                      // el propio eje de rotación no se mueve
    r.m[i][i] = cos(angulo);                // cos y sin calculan en double;
    r.m[i][j] = -sin(angulo);               // el resultado se guarda en un float
    r.m[j][i] = sin(angulo);                // segunda casilla fuera de la diagonal: seno
    r.m[j][j] = cos(angulo);                // segunda casilla de la diagonal: coseno
    return r;
}

// Producto matricial a * b: el elemento (i, j) es el producto escalar de la fila i
// de a por la columna j de b
Mat3 producto(Mat3 a, Mat3 b)
{
    Mat3 r = {{{0}}};                       // el resultado, rellenado casilla a casilla
    for (int i = 0; i < 3; i++)             // cada fila i del resultado
        for (int j = 0; j < 3; j++)         // cada columna j del resultado
            for (int k = 0; k < 3; k++)     // suma de los tres productos fila x columna
                r.m[i][j] += a.m[i][k] * b.m[k][j];  // añade un producto a la casilla (i, j)
    return r;
}

// Imagen del punto p por a: el vector a * p, guardado en v (void: nada que devolver)
void aplicar(Mat3 a, const float p[3], float v[3])
{
    for (int i = 0; i < 3; i++)             // cada coordenada del resultado
        // fila i de a, multiplicada término a término por p, y luego sumada
        v[i] = a.m[i][0] * p[0] + a.m[i][1] * p[1] + a.m[i][2] * p[2];
}

// Lleva a 0 un resto de redondeo (menos de 0,00005) para que la salida sea legible;
// « x ? a : b » vale a si la condición x es verdadera, b en caso contrario
float neto(float x)
{
    return fabs(x) < 0.00005 ? 0 : x;
}
```

El programa siguiente compone dos rotaciones de 90 grados en los dos órdenes. `printf("(%.0f, %.0f)\n", x, y)` muestra un texto en el que cada `%` se sustituye por un valor dado después (`%.0f`: un número en coma flotante sin decimales), y `\n` pasa a la línea siguiente; `return 0` indica al sistema que el programa ha terminado correctamente.

```c
int main(void)
{
    const float inicio[3] = {1, 0, 0};     // un punto situado sobre el eje X
    float v[3];                             // el punto tras la rotación
    // Z (eje 2) y luego X (eje 0): el producto se escribe X * Z
    Mat3 z_luego_x = producto(rotacion_eje(0, 90 * DEG), rotacion_eje(2, 90 * DEG));
    // X (eje 0) y luego Z (eje 2): el producto se escribe Z * X
    Mat3 x_luego_z = producto(rotacion_eje(2, 90 * DEG), rotacion_eje(0, 90 * DEG));

    aplicar(z_luego_x, inicio, v);          // Z actúa primero (la matriz más a la derecha)
    // las tres coordenadas, sin resto de redondeo
    printf("Z luego X: (%.0f, %.0f, %.0f)\n", neto(v[0]), neto(v[1]), neto(v[2]));
    aplicar(x_luego_z, inicio, v);          // X actúa primero
    printf("X luego Z: (%.0f, %.0f, %.0f)\n", neto(v[0]), neto(v[1]), neto(v[2]));  // idem
    return 0;
}
```

```text
Z luego X: (0, 0, 1)
X luego Z: (0, 1, 0)
```

| Orden | Lo que hace el punto (1, 0, 0) | Resultado |
|---|---|---|
| Z luego X | Z lo lleva del eje X al eje Y; X lo hace pasar después de Y a Z | (0, 0, 1) |
| X luego Z | X lo deja en su sitio (está sobre el eje X); Z lo lleva después hacia Y | (0, 1, 0) |

**El orden importa**: dos rotaciones no **conmutan**. Por tanto, para tres ángulos hay que **elegir un orden de una vez por todas** y mantenerlo. Este capítulo toma **guiñada, cabeceo, alabeo**: la orientación es el producto `Ry(guiñada) × Rx(cabeceo) × Rz(alabeo)`. El producto se lee de derecha a izquierda, como en el capítulo sobre las matrices: el alabeo actúa primero sobre el objeto, el cabeceo después, la guiñada en último lugar.

### Por qué resulta tentador

| Ventaja | Detalle |
|---|---|
| Legible | «Cabeceo de 30 grados» habla a una persona; nueve coeficientes de matriz, no |
| Fácil de manejar con el ratón | Un desplazamiento horizontal suma a la guiñada, un desplazamiento vertical suma al cabeceo |
| Ligero | 3 números en lugar de 9 |
| Ninguna deriva | La matriz se recalcula a partir de los 3 ángulos: siempre es una rotación exacta, salvo redondeos |
| Simple de escribir en un archivo o un editor | Tres deslizadores, tres campos de entrada |

El precio que hay que pagar aparece en la sección siguiente.

## El bloqueo de cardán: cuando dos ejes ya no son más que uno

El producto `Ry(guiñada) × Rx(cabeceo) × Rz(alabeo)` hace actuar el alabeo alrededor de Z, y luego el cabeceo **hace bascular** ese eje Z. Cuando el cabeceo vale 90 grados, lo tumba exactamente sobre el eje Y, el de la guiñada: alabeo y guiñada giran entonces alrededor del **mismo eje**.

```text
Cabeceo 0 grados                      Cabeceo 90 grados

    Y = eje de la guiñada                 Y = eje de la guiñada
    ^                                     ^  = eje del alabeo (tumbado por el cabeceo)
    |                                     |
    +-----> X                             +-----> X
   /                                     /
  Z = eje del alabeo                    Z: ya ningún ángulo gira alrededor de él

tres ejes distintos:                  dos ejes confundidos:
tres rotaciones posibles              dos rotaciones posibles
```

Se pierde una rotación: se dice que se tiene **un grado de libertad menos** (un grado de libertad es una forma independiente de moverse: aquí, tres al principio, dos en el bloqueo). El programa siguiente lo demuestra con los 9 coeficientes de la matriz. Fabrica una orientación a partir de un orden de ejes y de tres ángulos, mide la mayor diferencia entre dos matrices (`diferencia_max`) y muestra una matriz (`mostrar`). En `mostrar`, `const char *nombre` es un texto; `%s` lo inserta en la salida y `%7.4f` escribe un número de 7 caracteres de ancho, con 4 decimales.

```c
// Orientación con tres ángulos: producto de las rotaciones orden[0], orden[1], orden[2]
// de ángulos angulo[0], angulo[1], angulo[2]; la última escrita actúa primero
Mat3 euler(const int orden[3], const float angulo[3])
{
    Mat3 r = rotacion_eje(orden[0], angulo[0]);     // la primera del producto
    // multiplicamos por la segunda rotación
    r = producto(r, rotacion_eje(orden[1], angulo[1]));
    return producto(r, rotacion_eje(orden[2], angulo[2]));
}

// Mayor diferencia, en valor absoluto, entre los 9 coeficientes de a y los de b
float diferencia_max(Mat3 a, Mat3 b)
{
    float peor = 0;                         // la mayor diferencia encontrada
    for (int i = 0; i < 3; i++)             // cada fila
        for (int j = 0; j < 3; j++)         // cada columna
            if (fabs(a.m[i][j] - b.m[i][j]) > peor)  // ¿esta diferencia bate el récord?
                peor = fabs(a.m[i][j] - b.m[i][j]);  // sí: pasa a ser el récord
    return peor;
}

// Muestra una matriz, una línea de tres coeficientes por línea de texto;
// «const char *nombre» es un texto (una dirección de caracteres), %s lo inserta
void mostrar(const char *nombre, Mat3 a)
{
    printf("%s\n", nombre);                 // el título de la matriz
    for (int i = 0; i < 3; i++)             // una línea de texto por fila de la matriz
        // los tres coeficientes de la fila
        printf("  %7.4f %7.4f %7.4f\n",
               neto(a.m[i][0]), neto(a.m[i][1]), neto(a.m[i][2]));
}
```

Tres conjuntos de ángulos {guiñada, cabeceo, alabeo} comparten el mismo cabeceo de 90 grados y la misma diferencia guiñada menos alabeo (20). Otros dos, con cabeceo de 45 grados, tienen la misma guiñada y el mismo alabeo. `%.1e` muestra un número en notación científica con un decimal: `3.0e-08` vale 3,0 × 10⁻⁸, es decir 0,00000003.

```c
int main(void)
{
    const int orden[3] = {1, 0, 2};         // guiñada (Y), cabeceo (X), alabeo (Z)
    // Cada conjunto de ángulos se escribe {guiñada, cabeceo, alabeo}
    const float a[3] = {30 * DEG, 90 * DEG, 10 * DEG};
    // mismo cabeceo; guiñada y alabeo aumentados en 20 grados
    const float b[3] = {50 * DEG, 90 * DEG, 30 * DEG};
    // mismo cabeceo; guiñada menos alabeo sigue valiendo 20
    const float c[3] = {20 * DEG, 90 * DEG, 0 * DEG};
    const float d[3] = {30 * DEG, 45 * DEG, 10 * DEG};      // misma guiñada y alabeo que a,
    const float e[3] = {50 * DEG, 45 * DEG, 30 * DEG};      // pero cabeceo de 45 grados

    // los 9 coeficientes del conjunto A
    mostrar("A: guiñada 30, cabeceo 90, alabeo 10", euler(orden, a));
    mostrar("B: guiñada 50, cabeceo 90, alabeo 30", euler(orden, b));  // los del B
    mostrar("C: guiñada 20, cabeceo 90, alabeo 0", euler(orden, c));  // los del C
    // mayor diferencia entre las matrices A y B
    printf("diferencia A-B: %.1e\n", diferencia_max(euler(orden, a), euler(orden, b)));
    // entre A y C
    printf("diferencia A-C: %.1e\n", diferencia_max(euler(orden, a), euler(orden, c)));
    // entre D y E
    printf("diferencia D-E (cabeceo 45): %.1e\n",
           diferencia_max(euler(orden, d), euler(orden, e)));
    return 0;
}
```

```text
A: guiñada 30, cabeceo 90, alabeo 10
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
B: guiñada 50, cabeceo 90, alabeo 30
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
C: guiñada 20, cabeceo 90, alabeo 0
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
diferencia A-B: 3.0e-08
diferencia A-C: 3.0e-08
diferencia D-E (cabeceo 45): 2.3e-01
```

| Comparación | Cabeceo | Mayor diferencia entre los 9 coeficientes | Lectura |
|---|---|---|---|
| A (30, 90, 10) frente a B (50, 90, 30) | 90 grados | 3,0 × 10⁻⁸ | Misma matriz (salvo el ruido de redondeo) |
| A (30, 90, 10) frente a C (20, 90, 0) | 90 grados | 3,0 × 10⁻⁸ | Misma matriz |
| D (30, 45, 10) frente a E (50, 45, 30) | 45 grados | 0,23 | Dos orientaciones bien distintas |

Tres conjuntos de ángulos distintos dan **la misma orientación**: a 90 grados, solo cuenta la diferencia guiñada menos alabeo. El cálculo a mano lo confirma: `Ry(a) × Rx(90°) × Rz(c) = Ry(a - c) × Rx(90°)`. La tabla de órdenes más abajo comprueba esta regla por medición.

### Medir la libertad perdida

Para saber alrededor de qué eje gira el objeto cada ángulo, se hace variar en un paso muy pequeño (0,001 radianes) y se lee el eje de la pequeña rotación obtenida. La **transpuesta** de una matriz intercambia sus filas y sus columnas ([recordatorio](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#la-transpuesta-intercambiar-filas-y-columnas)); para una rotación, es además su **inversa**: la rotación que deshace exactamente la primera. Multiplicar una orientación `despues` por la transpuesta de `antes` da, pues, la rotación que lleva de una a otra, cuyo eje se lee en las diferencias entre elementos simétricos (`r21 - r12`, ..., donde `rij` es el elemento de la fila `i` y de la columna `j`, como en [la sección sobre el eje y el ángulo](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#recuperar-el-eje-y-el-angulo-de-una-rotacion)).

```c
// Transpuesta de a: filas y columnas intercambiadas. Para una rotación, es además
// su inversa: la rotación que deshace exactamente a
Mat3 transpuesta(Mat3 a)
{
    Mat3 t = {{{0}}};                       // la transpuesta, rellenada casilla a casilla
    for (int i = 0; i < 3; i++)             // cada fila i de a
        for (int j = 0; j < 3; j++)         // cada columna j de a
            t.m[j][i] = a.m[i][j];          // pasa a ser la fila j, columna i de t
    return t;
}

// Velocidad de rotación entre dos orientaciones muy próximas: el eje de la pequeña rotación
// que lleva de antes a despues, leído en las diferencias r21 - r12, r02 - r20, r10 - r01
void velocidad(Mat3 antes, Mat3 despues, float paso, float w[3])
{
    Mat3 r = producto(despues, transpuesta(antes));    // rotación de antes a despues
    w[0] = (r.m[2][1] - r.m[1][2]) / (2 * paso);      // componente según X
    w[1] = (r.m[0][2] - r.m[2][0]) / (2 * paso);      // componente según Y
    w[2] = (r.m[1][0] - r.m[0][1]) / (2 * paso);      // componente según Z
}
```

```c
int main(void)
{
    const int orden[3] = {1, 0, 2};         // guiñada (Y), cabeceo (X), alabeo (Z)
    // los nombres mostrados de los tres ángulos
    const char *nombre[3] = {"guiñada ", "cabeceo ", "alabeo  "};
    const float paso = 0.001;               // cada ángulo varía en 0,001 radianes
    // los dos cabeceos probados: 0 y 90 grados
    const float cabeceos[2] = {0 * DEG, 90 * DEG};

    for (int t = 0; t < 2; t++) {           // una serie con cabeceo 0, otra con cabeceo 90
        float angulo[3] = {0, cabeceos[t], 0};  // guiñada 0, cabeceo de la serie, alabeo 0
        Mat3 antes = euler(orden, angulo);  // la orientación de partida
        printf("cabeceo %.0f grados\n", cabeceos[t] / DEG);  // el título de la serie
        for (int i = 0; i < 3; i++) {       // solo se mueve uno de los tres ángulos
            float w[3];                     // el eje medido, rellenado por velocidad
            // copia de los ángulos, de los que solo uno va a cambiar
            float movido[3] = {angulo[0], angulo[1], angulo[2]};
            movido[i] += paso;              // el ángulo número i aumenta 0,001 radianes
            // el eje de la pequeña rotación obtenida
            velocidad(antes, euler(orden, movido), paso, w);
            // los nombres ya miden 8 caracteres (el relleno va dentro del texto)
            printf("  %s gira alrededor de (%6.3f, %6.3f, %6.3f)\n", nombre[i],
                   neto(w[0]), neto(w[1]), neto(w[2]));
        }
    }
    return 0;
}
```

```text
cabeceo 0 grados
  guiñada  gira alrededor de ( 0.000,  1.000,  0.000)
  cabeceo  gira alrededor de ( 1.000,  0.000,  0.000)
  alabeo   gira alrededor de ( 0.000,  0.000,  1.000)
cabeceo 90 grados
  guiñada  gira alrededor de ( 0.000,  1.000,  0.000)
  cabeceo  gira alrededor de ( 1.000,  0.000,  0.000)
  alabeo   gira alrededor de ( 0.000, -1.000,  0.000)
```

| Cabeceo | Eje de la guiñada | Eje del cabeceo | Eje del alabeo | Ejes distintos |
|---|---|---|---|---|
| 0 grados | (0, 1, 0) | (1, 0, 0) | (0, 0, 1) | 3: todo movimiento es posible |
| 90 grados | (0, 1, 0) | (1, 0, 0) | **(0, -1, 0)** | 2: el alabeo gira alrededor del eje de la guiñada, en sentido contrario |

En el bloqueo, **ningún ángulo hace ya girar el objeto alrededor de Z** (el eje que apunta hacia usted). Para inclinar la vista, la única salida es salir de los 90 grados, por ejemplo cambiando el cabeceo.

### El síntoma: la vista que salta en el cenit

El **cenit** es el punto situado en la vertical por encima de uno. Cuando la nariz de un objeto o la mirada de una cámara pasa por ahí, los ángulos que lo describen cambian bruscamente, aunque el movimiento sea mínimo. Para verlo, hay que volver a leer la guiñada a partir de una dirección: `atan2(a, b)` da el ángulo del punto (b, a) visto desde el origen, en el rango de -180 a 180 grados, y sabe en qué cuadrante se encuentra el punto.

```c
// Guiñada, en grados, que los ángulos de Euler (orden Y, X, Z) dan a un morro que apunta
// hacia (x, y, z). atan2(a, b) devuelve el ángulo del punto (b, a) visto desde el origen,
// de -180 a 180 grados (asin, el arcoseno, daría el cabeceo: el ángulo cuyo seno es y)
float guinada_del_morro(const float morro[3])
{
    return atan2(-morro[0], -morro[2]) / DEG;
}

int main(void)
{
    const int orden[3] = {1, 0, 2};         // guiñada (Y), cabeceo (X), alabeo (Z)
    // guiñada 30 grados, cabeceo 80 grados, alabeo 0
    const float angulo[3] = {30 * DEG, 80 * DEG, 0};
    const float delante[3] = {0, 0, -1};    // el morro, antes de toda rotación: hacia -Z
    float morro[3];                         // la dirección del morro tras la rotación

    aplicar(euler(orden, angulo), delante, morro);      // ¿hacia dónde apunta el morro?
    // la guiñada releída debe valer 30
    printf("control: guiñada 30, cabeceo 80 -> guiñada releída %.1f\n",
           guinada_del_morro(morro));

    // Dos morros casi verticales, separados 0,02 grados: uno 0,01 grados a la derecha,
    // el otro 0,01 grados a la izquierda
    const float diferencia = sin(0.01 * DEG);
    const float derecha[3] = {diferencia, 1, 0};        // morro a 0,01 grados de la vertical
    const float izquierda[3] = {-diferencia, 1, 0};     // morro a 0,01 grados, lado izquierdo
    // la guiñada atribuida al morro de la derecha
    printf("morro a la derecha: guiñada %.1f\n", guinada_del_morro(derecha));
    // la guiñada atribuida al morro de la izquierda
    printf("morro a la izquierda: guiñada %.1f\n", guinada_del_morro(izquierda));
    return 0;
}
```

```text
control: guiñada 30, cabeceo 80 -> guiñada releída 30.0
morro a la derecha: guiñada -90.0
morro a la izquierda: guiñada 90.0
```

La primera línea controla la función: una guiñada de 30 grados se relee como 30,0. Los dos morros siguientes solo se separan **0,02 grados** (una centésima de grado a cada lado de la vertical), pero su guiñada difiere en **180 grados**. En una aplicación, la vista da entonces media vuelta alrededor de la vertical de una imagen a otra (una **imagen** es una visualización de la escena, véase el [bucle de renderizado](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-bucle-de-renderizado): hay normalmente unas sesenta por segundo). El síntoma que describimos es este: al mirar hacia arriba del todo, mover el ratón hacia un lado hace girar la vista sobre sí misma en lugar de inclinarla hacia ese lado (la guiñada y el alabeo producen el mismo efecto, salvo por el signo, como mostró la medición anterior), y cruzar la vertical hace saltar la visualización.

### ¿Qué eje se bloquea según el orden elegido?

Cambiar el orden no elimina el bloqueo: lo desplaza. El programa siguiente prueba los seis órdenes posibles de los tres ejes (el primer eje actúa en último lugar, como en el producto escrito), con el ángulo **del medio** a 90, -90 y luego 45 grados. Para cada caso, mueve el primer y el último ángulo 10 grados (en el mismo sentido, luego en sentidos contrarios) y dice qué combinación de los dos sigue en juego: su **diferencia** (mover los dos en el mismo sentido no cambia nada) o su **suma** (mover los dos en sentidos contrarios no cambia nada). Prueba también el orden Z X Z, que repite un eje (los ángulos de Euler llamados «propios», frente a los ángulos de «Tait-Bryan» con tres ejes distintos, [detalle](https://en.wikipedia.org/wiki/Euler_angles)), con el ángulo del medio a 0, 180 y luego 90 grados. En el bloque, `"diferencia"` es un texto que devuelve la función, `'X'` un solo carácter, y `const int *o` designa la dirección de una tabla de tres enteros.

```c
// ¿Qué le ocurre a la matriz al mover el primer y el último ángulo 10 grados?
// Devuelve "diferencia" si solo cuenta la diferencia de los dos (mismo sentido: sin efecto),
// "suma" si solo cuenta su suma (sentidos contrarios: sin efecto), "ninguno" en otro caso
const char *bloqueo(const int orden[3], float medio)    // devuelve un texto
{
    const float base[3] = {20 * DEG, medio, 35 * DEG};      // un punto de partida cualquiera
    const float igual[3] = {30 * DEG, medio, 45 * DEG};     // los dos extremos +10 grados
    const float contrario[3] = {30 * DEG, medio, 25 * DEG}; // primero +10, último -10
    Mat3 m = euler(orden, base);            // la orientación de partida

    // mismo sentido: ¿la matriz queda sin cambios?
    if (diferencia_max(m, euler(orden, igual)) < 0.0001)
        return "diferencia";
    if (diferencia_max(m, euler(orden, contrario)) < 0.0001)  // sentidos contrarios: ¿igual?
        return "suma";
    return "ninguno";
}

int main(void)
{
    // Las seis formas de ordenar X (0), Y (1) y Z (2) en un producto de tres rotaciones
    const int ordenes[6][3] = {
        // cada terna es un orden de ejes ({0, 1, 2}: X Y Z)
        {0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}
    };
    const char eje[3] = {'X', 'Y', 'Z'};    // 'X': un solo carácter, mostrado con %c

    for (int k = 0; k < 6; k++) {           // una línea por orden
        const int *o = ordenes[k];          // o: la dirección de los tres ejes de este orden
        // un orden, y luego el veredicto para cada ángulo del medio
        printf("%c %c %c: medio a 90: %s; a -90: %s; a 45: %s\n", eje[o[0]],
               eje[o[1]], eje[o[2]], bloqueo(o, 90 * DEG), bloqueo(o, -90 * DEG),
               bloqueo(o, 45 * DEG));
    }
    const int zxz[3] = {2, 0, 2};           // eje Z repetido: los ángulos de Euler «propios»
    // misma salida para el orden Z X Z
    printf("Z X Z: medio a 0: %s; a 180: %s; a 90: %s\n", bloqueo(zxz, 0 * DEG),
           bloqueo(zxz, 180 * DEG), bloqueo(zxz, 90 * DEG));
    return 0;
}
```

```text
X Y Z: medio a 90: suma; a -90: diferencia; a 45: ninguno
X Z Y: medio a 90: diferencia; a -90: suma; a 45: ninguno
Y X Z: medio a 90: diferencia; a -90: suma; a 45: ninguno
Y Z X: medio a 90: suma; a -90: diferencia; a 45: ninguno
Z X Y: medio a 90: suma; a -90: diferencia; a 45: ninguno
Z Y X: medio a 90: diferencia; a -90: suma; a 45: ninguno
Z X Z: medio a 0: suma; a 180: diferencia; a 90: ninguno
```

| Orden (primer eje escrito primero) | Ángulo que se bloquea | El primero y el último ángulo: solo cuenta... (medio a 90 grados) | ... (medio a -90 grados) |
|---|---|---|---|
| X Y Z | Y (el medio) | su suma | su diferencia |
| X Z Y | Z | su diferencia | su suma |
| **Y X Z** (el del capítulo) | **X, el cabeceo** | su diferencia | su suma |
| Y Z X | Z | su suma | su diferencia |
| Z X Y | X | su suma | su diferencia |
| Z Y X | Y | su diferencia | su suma |

En los seis órdenes con tres ejes, siempre es **el ángulo del medio** el que se bloquea, a 90 grados como a -90 grados; la combinación que queda sola en juego es entonces la otra (la suma pasa a ser la diferencia, y viceversa: medido para los seis órdenes). A 45 grados, ninguno se bloquea. Elegir el orden equivale, pues, a elegir **qué gesto quedará atrapado**; no se puede hacer desaparecer la trampa. El orden Z X Z, que repite un eje, se bloquea de otra manera: sus dos ejes extremos coinciden cuando el ángulo del medio vale 0 (solo cuenta su suma) o 180 grados (solo cuenta su diferencia), y no se bloquea a 90 grados. El bloqueo se produce, pues, en reposo, y no en la vertical.

## La rotación incremental: guardar la matriz, no los ángulos

El bloqueo viene de que se **guardan ángulos**: tres números globales, relativos a ejes en un orden fijo. La idea de la **rotación incremental** es no guardar ninguno. Se conserva la propia orientación, una matriz 3×3 `R` (9 números), y, en cada imagen, se multiplica por una **pequeña rotación** `d` (un eje y un ángulo pequeño) calculada a partir del movimiento del ratón: `R = d × R`. No existe ningún ángulo global: la matriz no recuerda cómo llegó allí, así que nada puede confundirse.

| | Ángulos de Euler | Rotación incremental |
|---|---|---|
| Lo que se guarda | 3 ángulos | 1 matriz 3×3 (9 números) |
| Actualización en cada imagen | `guinada += ...` luego `cabeceo += ...` | `R = d × R` |
| Bloqueo de cardán | **Sí**, cuando el ángulo del medio vale 90 grados | **No** |
| Error de redondeo que se acumula | No (matriz recalculada cada vez) | **Sí**: hay que corregirlo (secciones siguientes) |
| Legible y modificable a mano | Sí | No |

La pequeña rotación procede de la fórmula de Rodrigues, dada en el [capítulo vecino](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-alrededor-de-un-eje-cualquiera-la-formula-de-rodrigues). Aquí se escribe en una forma equivalente y más compacta: `cos(θ) × I + sin(θ) × K + (1 - cos(θ)) × k × kᵀ`, donde `k` es el eje de longitud 1 y `θ` el ángulo; `I` es la **matriz identidad** (unos en la diagonal, ceros en el resto: deja todo en su sitio); `K` es la matriz `0 -kz ky / kz 0 -kx / -ky kx 0` (filas separadas por `/`), que multiplicada por un vector `v` da el producto vectorial `k × v` (un vector perpendicular a ambos, véase [la cámara](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#la-camara-look-at)); y `k × kᵀ` es la matriz cuyo elemento (i, j) vale `k_i × k_j`. La función `arrastrar` traduce un arrastre del ratón (botón pulsado, ratón desplazado `dx` píxeles hacia la derecha y `dy` hacia abajo; un **píxel** es el punto más pequeño de la pantalla) en una rotación alrededor del eje `(dy, dx, 0)`, de un ángulo proporcional a la longitud del arrastre.

```c
// Matriz identidad: unos en la diagonal, ceros en el resto; no hace girar nada
Mat3 identidad(void)
{
    Mat3 r = {{{0}}};                       // ceros, luego unos en la diagonal
    for (int i = 0; i < 3; i++)             // cada casilla de la diagonal
        r.m[i][i] = 1;                      // un 1 en la casilla (i, i)
    return r;
}

// Rotación de "angulo" radianes alrededor del eje (x, y, z), de longitud cualquiera
// (fórmula de Rodrigues: cos * I + sin * K + (1 - cos) * k * kᵀ, K descrita en el texto)
Mat3 rotacion_eje_angulo(float x, float y, float z, float angulo)
{
    double n = sqrt(x * x + y * y + z * z);             // longitud del eje
    if (n < 1e-9)                                       // eje nulo: el ratón no se ha movido
        return identidad();
    double k[3] = {x / n, y / n, z / n};                // el eje reducido a longitud 1
    double c = cos(angulo), s = sin(angulo);            // coseno y seno del ángulo
    // la matriz K: multiplicar por ella equivale a hacer k x v
    const double cruz[3][3] = {{0, -k[2], k[1]}, {k[2], 0, -k[0]}, {-k[1], k[0], 0}};
    Mat3 r;                                 // la rotación, rellenada casilla a casilla
    for (int i = 0; i < 3; i++)             // cada fila i
        for (int j = 0; j < 3; j++)         // cada columna j
            // los tres términos de la fórmula, casilla (i, j)
            r.m[i][j] = (i == j ? c : 0) + s * cruz[i][j] + (1 - c) * k[i] * k[j];
    return r;
}

// Orientación tras un arrastre del ratón de (dx, dy) píxeles: una pequeña rotación alrededor
// del eje (dy, dx, 0), tanto mayor cuanto más largo sea el arrastre
Mat3 arrastrar(Mat3 r, float dx, float dy)
{
    float angulo = sqrt(dx * dx + dy * dy) * 0.005;     // 0,005 radianes por píxel
    return producto(rotacion_eje_angulo(dy, dx, 0, angulo), r);     // R = d * R
}
```

El programa siguiente hace arrastrar el ratón en vertical durante 180 imágenes de un grado, alrededor del eje X de la pantalla: la nariz del objeto sube, pasa por el cenit y luego baja del otro lado. Desde el cenit (el momento en que la nariz apunta justo hacia arriba, imagen 90), mide después los ejes de tres pequeños arrastres, como para los ángulos de Euler. `%3d` muestra un entero en 3 caracteres de ancho.

```c
int main(void)
{
    const float delante[3] = {0, 0, -1};    // el morro del objeto: hacia -Z al principio
    const float paso = 0.001;               // pequeño ángulo de prueba: 0,001 radianes
    Mat3 r = identidad();                   // orientación de partida: ninguna rotación
    Mat3 cenit = r;                         // copia de la orientación «morro hacia arriba»
    float morro[3], w[3];                   // la dirección del morro y el eje medido

    // Arrastre vertical de 180 imágenes de 1 grado, alrededor del eje X de la pantalla
    for (int imagen = 0; imagen <= 180; imagen++) {
        if (imagen % 45 == 0) {             // una línea cada 45 grados
            aplicar(r, delante, morro);     // ¿hacia dónde apunta ahora el morro?
            // el ángulo recorrido, y luego la dirección del morro
            printf("%3d grados: morro = (%6.3f, %6.3f, %6.3f)\n", imagen,
                   neto(morro[0]), neto(morro[1]), neto(morro[2]));
        }
        if (imagen == 90)                   // a mitad de recorrido, morro justo hacia arriba
            cenit = r;                      // el morro acaba de llegar justo arriba
        r = producto(rotacion_eje_angulo(1, 0, 0, 1 * DEG), r);    // R = d * R
    }
    // Desde el cenit, tres pequeños arrastres: según X, Y y luego Z de la pantalla
    for (int eje = 0; eje < 3; eje++) {
        float k[3] = {0, 0, 0};             // el eje del arrastre: tres ceros...
        k[eje] = 1;                         // el eje de este arrastre
        // la orientación tras un pequeño arrastre según este eje
        Mat3 despues = producto(rotacion_eje_angulo(k[0], k[1], k[2], paso), cenit);
        velocidad(cenit, despues, paso, w); // el eje de la rotación obtenida
        // el número del arrastre, y luego el eje medido
        printf("arrastre %d: gira alrededor de (%6.3f, %6.3f, %6.3f)\n", eje + 1,
               neto(w[0]), neto(w[1]), neto(w[2]));
    }
    return 0;
}
```

```text
  0 grados: morro = ( 0.000,  0.000, -1.000)
 45 grados: morro = ( 0.000,  0.707, -0.707)
 90 grados: morro = ( 0.000,  1.000,  0.000)
135 grados: morro = ( 0.000,  0.707,  0.707)
180 grados: morro = ( 0.000,  0.000,  1.000)
arrastre 1: gira alrededor de ( 1.000,  0.000,  0.000)
arrastre 2: gira alrededor de ( 0.000,  1.000,  0.000)
arrastre 3: gira alrededor de ( 0.000,  0.000,  1.000)
```

El morro atraviesa el cenit **sin sacudidas**: su altura sube de 0 a 1 y luego baja, de forma regular. Sobre todo, desde el cenit, los tres arrastres giran alrededor de tres ejes **distintos** (X, Y y Z), mientras que tres ángulos de Euler solo ofrecían dos. Como las pequeñas rotaciones se expresan en el sistema de referencia de la pantalla, siempre hay disponibles tres direcciones de rotación, sea cual sea la orientación del objeto. Un ratón solo proporciona dos direcciones (ejes X e Y); la rotación alrededor de Z (el alabeo) se controla de otra forma, con la rueda o con teclas.

### ¿`d × R` o `R × d`?

El producto no es conmutativo: el lado en que se coloca `d` cambia el eje de la rotación. El programa siguiente comprueba también `arrastrar`: un arrastre de 100 píxeles hacia la derecha debe hacer que la cara vuelta hacia la pantalla se desplace hacia la derecha (+X), y un arrastre hacia abajo debe hacerla bajar (-Y).

```c
int main(void)
{
    const float delante[3] = {0, 0, -1};    // el morro del objeto: hacia -Z al principio
    const float cara[3] = {0, 0, 1};        // un punto de la cara vuelta hacia la pantalla
    Mat3 r = rotacion_eje_angulo(0, 1, 0, 90 * DEG);    // objeto girado 90° (eje Y)
    Mat3 d = rotacion_eje_angulo(1, 0, 0, 10 * DEG);    // arrastre vertical de 10° (eje X)
    float p[3];                             // el punto tras la transformación

    aplicar(arrastrar(identidad(), 100, 0), cara, p);   // 100 píxeles hacia la derecha
    printf("arrastre a la derecha: cara = (%6.3f, %6.3f, %6.3f)\n",  // adónde ha ido la cara
           neto(p[0]), neto(p[1]), neto(p[2]));
    aplicar(arrastrar(identidad(), 0, 100), cara, p);   // 100 píxeles hacia abajo
    printf("arrastre hacia abajo:  cara = (%6.3f, %6.3f, %6.3f)\n",  // adónde ha ido la cara
           neto(p[0]), neto(p[1]), neto(p[2]));
    aplicar(producto(d, r), delante, p);    // d * R: eje X de la pantalla
    // adónde apunta el morro
    printf("d * R: morro = (%6.3f, %6.3f, %6.3f)\n", neto(p[0]), neto(p[1]), neto(p[2]));
    aplicar(producto(r, d), delante, p);    // R * d: eje X del objeto
    // adónde apunta el morro
    printf("R * d: morro = (%6.3f, %6.3f, %6.3f)\n", neto(p[0]), neto(p[1]), neto(p[2]));
    return 0;
}
```

```text
arrastre a la derecha: cara = ( 0.479,  0.000,  0.878)
arrastre hacia abajo:  cara = ( 0.000, -0.479,  0.878)
d * R: morro = (-1.000,  0.000,  0.000)
R * d: morro = (-0.985,  0.174,  0.000)
```

| Producto | ¿Alrededor de qué ejes? | Morro tras un arrastre vertical de 10 grados, objeto ya girado 90 grados alrededor de Y |
|---|---|---|
| `d × R` (el de `arrastrar`) | Los ejes **de la pantalla**: un arrastre hacia la derecha siempre gira hacia la derecha | (-1,000, 0,000, 0,000): el morro queda alineado con el eje X de la pantalla, no se mueve |
| `R × d` | Los ejes **del objeto**: han girado con él | (-0,985, 0,174, 0,000): el morro sube |

Para una manipulación con el ratón, los ejes de la pantalla son los que se esperan. Elija un lado, escríbalo en un comentario y no lo cambie nunca.

### Conectar la matriz al renderizado

Para una cámara, la parte de rotación de la matriz de vista es la **inversa** de la orientación de la cámara. Para una matriz que es una rotación verdadera, la inversa es la transpuesta (función `transpuesta` vista más arriba): no hace falta un cálculo de inversa general. Es lo que ya hace [`look_at`](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#la-camara-look-at), cuyas filas son las tres direcciones de la cámara. Su caso degenerado (mirar justo hacia arriba con `up = (0, 1, 0)`) es de la misma familia que el bloqueo de cardán: dos direcciones se confunden. Con una orientación en forma de matriz, no se impone ninguna dirección «arriba», y el caso ya no se presenta.

## El error de redondeo que se acumula

Un `float` solo guarda unas 7 cifras exactas ([detalle](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), y [la distancia entre dos `float` vecinos](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine#lo-que-significa-flt-epsilon)): cada suma y cada multiplicación redondea su resultado. Un producto de dos matrices 3×3 contiene 27 multiplicaciones y 18 sumas. El error por imagen es minúsculo, del orden de 10⁻⁷, pero `R = d × R` parte en cada imagen del resultado de la anterior: los errores **se suman**.

Una verdadera rotación tiene una matriz **ortogonal**: sus tres columnas miden 1 y son perpendiculares dos a dos (su producto escalar es nulo); de forma equivalente, `R × Rᵀ` es la matriz identidad. Cuando el error crece, la matriz deja de ser una rotación: una columna de longitud mayor que 1 **estira** el objeto en esa dirección, y unas columnas que ya no forman ángulo recto lo **inclinan** (lo cizallan).

| Medida | Lo que calcula | Valor para una rotación perfecta |
|---|---|---|
| `longitud` | La mayor diferencia respecto de 1 de la longitud de una columna | 0 |
| `perpendicular` | El mayor producto escalar entre dos columnas | 0 |
| `identidad` | La mayor diferencia entre `R × Rᵀ` y la matriz identidad | 0 |

La función `medir` las calcula (en `double`, para que la propia medición no añada error).

```c
// Las tres diferencias respecto de una verdadera rotación: 0 en todo si la matriz es perfecta
typedef struct {
    double longitud;            // mayor distancia a 1 de la longitud de una columna
    double perpendicular;       // mayor producto escalar de dos columnas
    double identidad;           // mayor diferencia entre a * aᵀ y la matriz identidad
} Diferencias;

Diferencias medir(Mat3 a)
{
    Diferencias e = {0, 0, 0};              // las tres diferencias empiezan en 0
    for (int j = 0; j < 3; j++) {           // cada columna j
        double suma = 0;                    // el cuadrado de su longitud
        // suma de los cuadrados de los tres elementos de la columna
        for (int i = 0; i < 3; i++)
            suma += (double)a.m[i][j] * a.m[i][j];      // (double): cálculo en double
        // ¿la diferencia respecto de 1 de su longitud bate el récord?
        if (fabs(sqrt(suma) - 1) > e.longitud)
            e.longitud = fabs(sqrt(suma) - 1);  // sí: nuevo récord
        for (int k = j + 1; k < 3; k++) {   // cada columna k tras j: una vez por pareja
            double p = 0;                   // producto escalar de las columnas j y k
            // suma de los productos término a término de las columnas j y k
            for (int i = 0; i < 3; i++)
                p += (double)a.m[i][j] * a.m[i][k];     // añadimos un producto
            if (fabs(p) > e.perpendicular)  // ¿este producto escalar bate el récord?
                e.perpendicular = fabs(p);  // sí: nuevo récord
        }
    }
    for (int i = 0; i < 3; i++)             // a * aᵀ: el elemento (i, k) es el producto
        for (int k = 0; k < 3; k++) {       // escalar de la fila i por la fila k de a
            double p = 0;                   // producto escalar de las filas i y k
            for (int j = 0; j < 3; j++)     // suma de los productos término a término
                p += (double)a.m[i][j] * a.m[k][j];     // añadimos un producto
            if (fabs(p - (i == k)) > e.identidad)   // (i == k): 1 en la diagonal
                e.identidad = fabs(p - (i == k));   // sí: nuevo récord
        }
    return e;
}
```

El programa hace girar una orientación durante un millón de imágenes, de 0,01 radianes por imagen (unos 0,57 grados), alrededor de un eje que cambia lentamente, y toma las tres medidas tras 100, 10 000, 100 000 y luego 1 000 000 de imágenes. `%8ld` muestra un entero de tipo `long` en 8 caracteres de ancho.

```c
int main(void)
{
    const long hitos[4] = {100, 10000, 100000, 1000000};    // números de imágenes medidos
    Mat3 r = identidad();                   // la orientación, al principio sin rotación
    long imagen = 0;                        // número de imágenes ya calculadas

    for (int j = 0; j < 4; j++) {           // nos paramos en cada hito para medir
        for (; imagen < hitos[j]; imagen++) {   // una imagen por vuelta, hasta el hito
            double t = imagen * 0.001;      // el tiempo: el eje del ratón gira lentamente
            // 0,01 radianes por imagen, alrededor de un eje que cambia en cada imagen
            r = producto(rotacion_eje_angulo(cos(t), sin(t), 0.5, 0.01), r);
        }
        Diferencias e = medir(r);           // las tres diferencias en este hito
        // número de imágenes, y luego las tres diferencias
        printf("%8ld imágenes: longitud %.1e, producto escalar %.1e, a*aT %.1e\n",
               imagen, e.longitud, e.perpendicular, e.identidad);
    }
    return 0;
}
```

```text
     100 imágenes: longitud 4.0e-07, producto escalar 3.2e-07, a*aT 8.3e-07
   10000 imágenes: longitud 1.9e-05, producto escalar 8.3e-06, a*aT 3.4e-05
  100000 imágenes: longitud 2.0e-04, producto escalar 9.0e-05, a*aT 3.4e-04
 1000000 imágenes: longitud 2.0e-03, producto escalar 8.3e-04, a*aT 3.1e-03
```

El mismo programa, con `float` sustituido por `double` en todas partes, da diferencias del orden de 10⁻¹¹ tras un millón de imágenes; este segundo ensayo muestra que la precisión del tipo es realmente la causa.

| Imágenes | `longitud` (`float`) | `perpendicular` (`float`) | `identidad` (`float`) | `identidad` (`double`) |
|---|---|---|---|---|
| 100 | 4,0 × 10⁻⁷ | 3,2 × 10⁻⁷ | 8,3 × 10⁻⁷ | 2,2 × 10⁻¹⁵ |
| 10 000 | 1,9 × 10⁻⁵ | 8,3 × 10⁻⁶ | 3,4 × 10⁻⁵ | 2,5 × 10⁻¹³ |
| 100 000 | 2,0 × 10⁻⁴ | 9,0 × 10⁻⁵ | 3,4 × 10⁻⁴ | 2,5 × 10⁻¹² |
| 1 000 000 | 2,0 × 10⁻³ | 8,3 × 10⁻⁴ | 3,1 × 10⁻³ | 2,5 × 10⁻¹¹ |

Lectura: de 10 000 a 1 000 000 de imágenes, la diferencia se **multiplica por unas 10 cada vez que se multiplica por 10 el número de imágenes**: crece de forma regular y nunca se estabiliza. Tras un millón de imágenes (unas cuatro horas y media a 60 imágenes por segundo), la longitud de una columna se aparta de 1 en 0,002: un segmento de 1 metro, una vez transformado, mide 2 milímetros más o menos, y la diferencia sigue creciendo. Pasar a `double` no resuelve el problema, sino que lo **aplaza**: la diferencia es unas cien millones de veces menor (10⁸), y sigue creciendo de la misma manera. Estos valores precisos dependen de la velocidad de rotación y del movimiento; lo que hay que retener es el orden de magnitud y el crecimiento regular.

## La reortonormalización: enderezar la matriz

**Reortonormalizar** una matriz es corregirla ligeramente para que vuelva a ser ortogonal: columnas de longitud 1 y perpendiculares. Como el error es de unos 10⁻⁷ por imagen, la corrección es minúscula y no se ve en pantalla. Existen varios métodos:

| Método | Principio | Resultado medido (véase más abajo) |
|---|---|---|
| Normalizar cada columna | Dividir cada columna entre su longitud | Se corrigen las longitudes, pero no el ángulo entre columnas: **insuficiente** |
| **Gram-Schmidt sobre dos columnas, y luego producto vectorial** (elegido) | Fijar la columna 0, hacer perpendicular a ella la columna 1, **fabricar** la columna 2 con un producto vectorial | Las tres diferencias bajan a unos 10⁻⁶ (N = 100) |
| Gram-Schmidt sobre tres columnas | El mismo procedimiento, aplicado también a la columna 2 | No medido aquí: un cálculo de más para una columna que el producto vectorial ya determina por completo |

El **procedimiento de Gram-Schmidt** ([detalle](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)) trata las columnas una a una: cada nueva columna pierde primero la parte que va en la dirección de las columnas ya fijadas, y luego se lleva a la longitud 1. Esa parte se calcula con el producto escalar: si `c0` tiene longitud 1, `c1 · c0` es su medida. Ejemplo numérico: `c0 = (1, 0, 0)` y `c1 = (1, 2, 0)` tienen como producto escalar 1 (1 × 1 + 0 × 2 + 0 × 0); `c1 - 1 × c0 = (0, 2, 0)`, que es perpendicular a `c0`; llevado a la longitud 1 (se divide entre 2), queda `(0, 1, 0)`.

El método elegido es el más sencillo de escribir y de verificar: dos normalizaciones, un producto escalar, un producto vectorial. Ofrece dos garantías: la columna 2 es **exactamente** perpendicular a las otras dos y de longitud 1 (el producto vectorial de dos vectores de longitud 1 perpendiculares entre sí es un tercero de ese tipo), y está del lado correcto: el resultado es una verdadera rotación y no un **espejo** (que intercambiaría la izquierda y la derecha del objeto, algo que ninguna rotación hace). El precio: la columna 0 conserva su dirección y las otras dos se ajustan a su alrededor; como la corrección es del orden del error (10⁻⁶), este leve privilegio no tiene consecuencias.

```c
// Divide el vector v entre su longitud: su dirección no cambia, su longitud pasa a ser 1
void normalizar(double v[3])
{
    double n = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);   // su longitud (su norma)
    if (n > 0)                              // un vector nulo no puede normalizarse
        for (int i = 0; i < 3; i++)         // cada componente de v
            v[i] /= n;                      // dividida entre la longitud
}

// Rectifica en tres pasos la matriz cuya dirección es a: «Mat3 *a» es un puntero,
// y a->m designa la tabla de esta matriz, que la función modifica en el sitio
void rectificar(Mat3 *a)
{
    double c0[3], c1[3], c2[3];             // las tres columnas
    for (int i = 0; i < 3; i++) {           // cada fila i
        c0[i] = a->m[i][0];                 // copiamos las columnas 0 y 1
        c1[i] = a->m[i][1];                 // columna 1
    }
    normalizar(c0);                         // paso 1: la columna 0 conserva su dirección
    double d = c1[0] * c0[0] + c1[1] * c0[1] + c1[2] * c0[2];   // parte de c1 según c0
    for (int i = 0; i < 3; i++)             // cada componente
        c1[i] -= d * c0[i];                 // paso 2: se quita esa parte, c1 queda
    normalizar(c1);                         // perpendicular a c0, y luego de longitud 1
    c2[0] = c0[1] * c1[2] - c0[2] * c1[1];  // paso 3: la columna 2 es el producto
    c2[1] = c0[2] * c1[0] - c0[0] * c1[2];  // vectorial de las otras dos: perpendicular
    c2[2] = c0[0] * c1[1] - c0[1] * c1[0];  // a ambas y de longitud 1, sin cálculo extra
    for (int i = 0; i < 3; i++) {           // cada fila i
        a->m[i][0] = c0[i];                 // reescribimos las tres columnas
        a->m[i][1] = c1[i];                 // columna 1
        a->m[i][2] = c2[i];                 // columna 2
    }
}

// Variante insuficiente, para comparar: cada columna llevada a la longitud 1, nada más
void normalizar_columnas(Mat3 *a)
{
    for (int j = 0; j < 3; j++) {           // cada columna j
        double c[3] = {a->m[0][j], a->m[1][j], a->m[2][j]};  // la columna j, copiada
        normalizar(c);                      // llevada a la longitud 1
        for (int i = 0; i < 3; i++)         // cada fila i
            a->m[i][j] = c[i];              // y reescrita en la matriz
    }
}
```

El programa siguiente rehace el millón de imágenes del programa anterior, corrigiendo la matriz cada `N` imágenes (el periodo `periodo` del código), y toma, para cada una de las tres medidas, **el peor valor encontrado** durante todo el ensayo (una medida por imagen). Compara la ausencia de corrección, la simple normalización de las columnas y `rectificar` con seis ritmos. `fmax` devuelve el mayor de dos números.

```c
// Un millón de imágenes; modo 0: ninguna corrección, 1: normalizar_columnas, 2: rectificar.
// Corrige cada "periodo" imágenes. Devuelve, para cada una de las tres diferencias,
// el peor valor encontrado durante todo el experimento
Diferencias ensayo(int modo, long periodo)
{
    Mat3 r = identidad();                   // la orientación de partida
    Diferencias peor = {0, 0, 0};           // los peores valores, a 0 al principio

    for (long imagen = 1; imagen <= 1000000; imagen++) {    // una vuelta por imagen
        double t = imagen * 0.001;          // mismo movimiento que en la sección anterior
        // la rotación de esta imagen
        r = producto(rotacion_eje_angulo(cos(t), sin(t), 0.5, 0.01), r);
        if (modo == 1 && imagen % periodo == 0) // modo 1: cada "periodo" imágenes
            normalizar_columnas(&r);        // &r: la dirección de r
        if (modo == 2 && imagen % periodo == 0) // modo 2: cada "periodo" imágenes
            rectificar(&r);                 // se rectifica la matriz
        Diferencias e = medir(r);           // se mide en cada imagen; fmax: el mayor
        // nos quedamos con la mayor diferencia encontrada
        peor.longitud = fmax(peor.longitud, e.longitud);
        peor.perpendicular = fmax(peor.perpendicular, e.perpendicular);     // idem
        peor.identidad = fmax(peor.identidad, e.identidad);                 // idem
    }
    return peor;
}

int main(void)
{
    // los ritmos de corrección probados
    const long periodos[6] = {1, 10, 100, 1000, 10000, 100000};
    Diferencias e = ensayo(0, 1);           // el periodo no sirve de nada sin corrección
    // las tres peores diferencias, sin corrección
    printf("sin corrección: %.1e %.1e %.1e\n", e.longitud, e.perpendicular, e.identidad);
    e = ensayo(1, 100);                     // normalizar las columnas, cada 100 imágenes
    // las tres peores diferencias
    printf("normalizar, N=100: %.1e %.1e %.1e\n", e.longitud, e.perpendicular, e.identidad);
    for (int k = 0; k < 6; k++) {           // la misma corrección con ritmos distintos
        e = ensayo(2, periodos[k]);         // rectificar cada periodos[k] imágenes
        // el periodo, y luego las tres peores diferencias
        printf("rectificar, N=%6ld: %.1e %.1e %.1e\n", periodos[k], e.longitud,
               e.perpendicular, e.identidad);
    }
    return 0;
}
```

```text
sin corrección: 2.0e-03 8.8e-04 4.0e-03
normalizar, N=100: 1.3e-06 9.3e-04 9.3e-04
rectificar, N=     1: 5.1e-08 8.5e-08 1.0e-07
rectificar, N=    10: 4.7e-07 5.4e-07 1.0e-06
rectificar, N=   100: 1.5e-06 1.7e-06 2.7e-06
rectificar, N=  1000: 4.8e-06 4.2e-06 8.5e-06
rectificar, N= 10000: 2.6e-05 1.5e-05 5.1e-05
rectificar, N=100000: 2.2e-04 1.1e-04 4.3e-04
```

Las tres columnas de cifras son, en orden: `longitud`, `perpendicular`, `identidad`.

| Corrección | `longitud` | `perpendicular` | `identidad` |
|---|---|---|---|
| Ninguna | 2,0 × 10⁻³ | 8,8 × 10⁻⁴ | 4,0 × 10⁻³ |
| Normalizar las columnas, N = 100 | 1,3 × 10⁻⁶ | **9,3 × 10⁻⁴** | **9,3 × 10⁻⁴** |
| `rectificar`, N = 1 | 5,1 × 10⁻⁸ | 8,5 × 10⁻⁸ | 1,0 × 10⁻⁷ |
| `rectificar`, N = 10 | 4,7 × 10⁻⁷ | 5,4 × 10⁻⁷ | 1,0 × 10⁻⁶ |
| `rectificar`, N = 100 | 1,5 × 10⁻⁶ | 1,7 × 10⁻⁶ | 2,7 × 10⁻⁶ |
| `rectificar`, N = 1 000 | 4,8 × 10⁻⁶ | 4,2 × 10⁻⁶ | 8,5 × 10⁻⁶ |
| `rectificar`, N = 10 000 | 2,6 × 10⁻⁵ | 1,5 × 10⁻⁵ | 5,1 × 10⁻⁵ |
| `rectificar`, N = 100 000 | 2,2 × 10⁻⁴ | 1,1 × 10⁻⁴ | 4,3 × 10⁻⁴ |

Tres enseñanzas:

- **Normalizar las columnas solas no basta**: las longitudes se corrigen (10⁻⁶), pero las columnas siguen inclinadas una respecto de otra (`perpendicular` 9,3 × 10⁻⁴, no mejor que sin corrección).
- **Corregir en cada imagen** (N = 1) da el mejor resultado, del orden de 10⁻⁷: el límite del `float`, porque la corrección también redondea.
- **Corregir con menos frecuencia degrada poco a poco**: el peor error pasa de 10⁻⁷ (N = 1) a 8,5 × 10⁻⁶ (N = 1 000) y luego a 4,3 × 10⁻⁴ (N = 100 000), es decir, aproximadamente lo que se medía sin corrección tras 100 000 imágenes.

Para elegir `N`, fije el error máximo aceptable. Un error de 10⁻⁵ sobre un objeto ancho de 1 000 píxeles representa 0,01 píxel: invisible. A este ritmo de rotación, **N = 1 000** respeta ese límite (8,5 × 10⁻⁶), es decir, una corrección cada 17 segundos aproximadamente a 60 imágenes por segundo. El coste de una llamada a `rectificar` se cuenta así: 2 raíces cuadradas, 6 divisiones y 18 multiplicaciones, frente a 27 multiplicaciones de un producto de dos matrices. Corregir en cada imagen sigue siendo viable para algunos objetos, y corregir cada cientos de imágenes no cuesta casi nada. Un movimiento más rápido o una escena más larga exigen repetir la medición.

## Las variantes: cuaterniones y ángulos limitados

### Los cuaterniones

Un **cuaternión** representa una rotación con **4 números** en lugar de 9. Como los ángulos de Euler, es compacto; como la matriz, **no tiene bloqueo de cardán**. Componer dos rotaciones equivale a multiplicar dos cuaterniones, y se rectifica simplemente dividiéndolo entre su norma (su longitud): 4 números que normalizar, en lugar de rectificar tres columnas. El capítulo vecino lo señala como [alternativa](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#hacer-girar-un-objeto-la-rotacion-acumulada); ningún capítulo del sitio lo desarrolla: la fuente de referencia es la página sobre los [cuaterniones y las rotaciones en el espacio](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation). Para un proyecto que solo necesita hacer girar un objeto con el ratón y dibujarlo, la matriz rectificada de este capítulo basta y es fácil de conectar con [OpenGL](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl).

### Cuándo conservar ángulos de todos modos

El bloqueo solo es un problema si la orientación puede alcanzar la configuración atrapada. Si la aplicación no tiene alabeo, o impide alcanzar la vertical, dos ángulos bastan:

| Situación | Elección | Por qué |
|---|---|---|
| Cámara en primera persona (un personaje camina, el horizonte permanece horizontal) | Dos ángulos (guiñada, cabeceo), **cabeceo limitado a menos de 90 grados** | Sin alabeo, nada que bloquear; el límite impide pasar por el cenit |
| Cámara orbital (gira alrededor de un objeto, como un satélite) | Dos ángulos (alrededor del objeto, altura sobre él), **altura limitada** | Misma razón |
| Cámara de vuelo libre (puede darse la vuelta, como la de una nave), objeto que se hace girar en todos los sentidos | Matriz incremental rectificada, o cuaternión | Ninguna dirección está prohibida |
| Visualización o entrada por el usuario (deslizadores, archivo de escena legible) | Ángulos de Euler **solo para la interfaz** | Legibles; no volver a leerlos desde la matriz cerca del cenit (la vista salta 180 grados, medido más arriba) |
| Guardar una orientación en un archivo | La matriz (9 números) o el cuaternión | Los ángulos no son únicos en el entorno del bloqueo |

El bloque siguiente limita el cabeceo de una cámara a 89 grados. `c->guinada` designa el campo `guinada` de la cámara `c` (un puntero: la dirección de la cámara, que la función modifica en el sitio). `dx` y `dy` son los desplazamientos del ratón, en píxeles, desde la imagen anterior; en un programa real, se obtienen con los eventos del ratón de [GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu).

```c
// Una cámara descrita por solo dos ángulos: sin alabeo, no hay nada que bloquear
typedef struct { float guinada, cabeceo; } Camara;

const float LIMITE = 1.553343;              // 89 grados en radianes: nunca del todo 90

// dx y dy: desplazamiento del ratón desde la imagen anterior, en píxeles
void apuntar(Camara *c, float dx, float dy)    // c->guinada: el campo guinada de la cámara c
{
    c->guinada += dx * 0.002;               // 0,002 radianes de guiñada por píxel
    c->cabeceo -= dy * 0.002;               // ratón hacia arriba (dy < 0): mirada más alta
    if (c->cabeceo > LIMITE)                // el cabeceo se mantiene entre -89 y +89 grados
        c->cabeceo = LIMITE;                // limitado a +89 grados
    if (c->cabeceo < -LIMITE)               // ¿demasiado bajo?
        c->cabeceo = -LIMITE;               // suelo en -89 grados
}

int main(void)
{
    Camara c = {0, 0};                      // mira justo al frente
    for (int i = 0; i < 3; i++)             // tres grandes arrastres hacia arriba
        apuntar(&c, 0, -1000);              // 1000 píxeles hacia arriba (dy es negativo)
    // el cabeceo final, en grados
    printf("cabeceo tras 3000 píxeles hacia arriba: %.1f grados\n", c.cabeceo / DEG);
    apuntar(&c, 0, 5000);                   // luego un arrastre muy grande hacia abajo
    printf("cabeceo tras 5000 píxeles hacia abajo: %.1f grados\n", c.cabeceo / DEG);  // idem
    return 0;
}
```

```text
cabeceo tras 3000 píxeles hacia arriba: 89.0 grados
cabeceo tras 5000 píxeles hacia abajo: -89.0 grados
```

Sea cual sea la longitud del arrastre (3 000 píxeles hacia arriba, luego 5 000 hacia abajo), el cabeceo se mantiene entre -89 y +89 grados: la vista ya no puede alcanzar la vertical.

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Creer que el bloqueo solo molesta a 90 grados exactos | Cerca de la vertical, un movimiento mínimo exige un gran cambio de guiñada: 0,02 grados de diferencia dan 180 grados de diferencia de guiñada (medido) |
| Guardar la orientación en ángulos para un objeto que gira libremente | Un ángulo del medio a 90 grados pierde una rotación: el movimiento pedido ya no tiene efecto |
| Cambiar el orden de las rotaciones para evitar el bloqueo | Cambiar de orden desplaza el bloqueo, no lo elimina (tabla de los seis órdenes) |
| Volver a leer los ángulos desde la matriz y reinyectarlos | En el cenit, la guiñada salta 180 grados por un movimiento de 0,02 grados |
| No rectificar nunca la matriz | El error crece en cada imagen (3,1 × 10⁻³ tras un millón de imágenes): el objeto se estira y se inclina |
| Normalizar solo las columnas | Se corrigen las longitudes, no el ángulo entre columnas (9,3 × 10⁻⁴ medido) |
| Copiar la columna 2 en lugar de recalcularla con el producto vectorial | Conserva su error, y nada garantiza que se obtenga una rotación y no un espejo |
| Pasar a `double` creyendo que se elimina la deriva | El `double` hace el error unas cien millones de veces menor, pero sigue creciendo de forma regular |
| Normalizar un eje nulo | Cuando el ratón no se mueve, el eje `(dy, dx, 0)` es nulo: dividir entre su longitud (0) da **`NaN`** (*Not a Number*, el resultado de un cálculo imposible como `0 / 0`, [detalle](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#la-camara-look-at)) que contamina toda la matriz. `rotacion_eje_angulo` devuelve la identidad en ese caso |
| Mezclar `d × R` y `R × d` | Los ejes de rotación pasan de la pantalla al objeto: el ratón parece girar en sentido contrario |
| Girar un ángulo fijo en cada imagen | La velocidad depende entonces de la cadencia de la máquina: usar una velocidad por segundo multiplicada por [el delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#el-delta-time-una-velocidad-independiente-de-la-maquina) |
| Limitar el cabeceo a exactamente 90 grados | El cenit sigue siendo alcanzable: dejar un margen (89 grados) |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Guardar la orientación de un objeto que gira libremente como matriz (o cuaternión), no como ángulos | Ningún ángulo global: el bloqueo deja de existir |
| Conservar dos ángulos y limitar el cabeceo en una cámara en primera persona u orbital | Lo más sencillo, y sin bloqueo posible |
| Rectificar la matriz con Gram-Schmidt sobre dos columnas más un producto vectorial, cada `N` imágenes | El error se reduce de unos 10⁻³ a 10⁻⁵ o menos; la columna 2 es exacta y el resultado sigue siendo una rotación |
| Elegir `N` midiendo (`medir`, `ensayo`) según el error aceptable | `N = 1 000` da 8,5 × 10⁻⁶ con 0,01 radianes por imagen; un movimiento más rápido exige una nueva medición |
| Elegir un lado para la composición (`d × R`, ejes de la pantalla, para el ratón) y anotarlo en un comentario | Evita rotaciones que salen del lado equivocado |
| Tratar el eje nulo (ratón inmóvil) antes de normalizar | Ningún `NaN` en la matriz |
| Probar los casos límite: cabeceo de 90 grados, arrastre nulo, un millón de imágenes | Son ellos los que revelan el bloqueo y la deriva |
| Guardar la matriz o el cuaternión, y mostrar los ángulos solo en la interfaz | Los ángulos no son únicos cerca del bloqueo |

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Los ángulos de Euler (cabeceo, guiñada, alabeo) describen una orientación mediante tres rotaciones en un orden fijo, y el orden importa. Cuando el ángulo del medio vale 90 grados, los otros dos giran alrededor del mismo eje: es el bloqueo de cardán, y se pierde una rotación (medido: tres conjuntos de ángulos dan la misma matriz, y en el cenit 0,02 grados de movimiento hacen saltar la guiñada 180 grados). El remedio es la rotación incremental: guardar la matriz 3×3 y multiplicarla en cada imagen por una pequeña rotación, `R = d × R`, sin ángulo global y, por tanto, sin bloqueo. Su contrapartida es el error de redondeo, que se acumula (3,1 × 10⁻³ tras un millón de imágenes en `float`): se corrige devolviendo las columnas a longitud 1 y perpendiculares (Gram-Schmidt sobre dos columnas, producto vectorial para la tercera), por ejemplo cada 1 000 imágenes (8,5 × 10⁻⁶). Un cuaternión, o dos ángulos limitados a menos de 90 grados para una cámara en primera persona, son las variantes. |
| **Herramientas utilizables** | `cos`, `sin`, `sqrt`, `fabs`, `fmax`, `atan2` de la [biblioteca matemática de C](https://en.cppreference.com/w/c/numeric/math); [la fórmula de Rodrigues](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#girar-alrededor-de-un-eje-cualquiera-la-formula-de-rodrigues); [el procedimiento de Gram-Schmidt](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process); [los cuaterniones](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation); [los ángulos de Euler](https://en.wikipedia.org/wiki/Euler_angles); [el bloqueo de cardán](https://en.wikipedia.org/wiki/Gimbal_lock). |
| **Trampas a evitar** | Guardar ángulos para un objeto libre; creer que cambiar el orden elimina el bloqueo; volver a leer ángulos desde la matriz cerca del cenit; no rectificar nunca la matriz; normalizar solo las columnas; normalizar un eje nulo (`NaN`); mezclar `d × R` y `R × d`; un ángulo fijo por imagen en lugar de una velocidad por segundo; un cabeceo limitado a exactamente 90 grados. |
| **Buenas prácticas** | Matriz (o cuaternión) para la rotación libre, dos ángulos limitados para la cámara en primera persona u orbital; rectificar cada `N` imágenes con `N` elegido por la medición; componer del lado de la pantalla para el ratón; tratar el eje nulo; probar cabeceo de 90 grados, arrastre nulo y sesiones muy largas; guardar la matriz, mostrar los ángulos solo en la interfaz. |
