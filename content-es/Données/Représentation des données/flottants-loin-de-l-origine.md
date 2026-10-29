---
order: 10
---

# Los flotantes lejos del origen: precisión perdida y origen local

Un número de tipo `float` (un número de coma flotante almacenado en 32 bits) conserva unas siete cifras decimales fiables, **sea cual sea su tamaño**. Para un valor cercano a 1, esto da un detalle del orden de la diezmillonésima; para un valor de diez millones, el detalle más fino es el metro entero. Un punto situado a 10 000 km del origen, expresado en metros, ya no puede desplazarse en menos de un metro: un detalle de un centímetro desaparece. Este capítulo mide esa pérdida y luego presenta el remedio empleado en gráficos, cartografía y videojuegos: un **origen local**, un punto de referencia elegido cerca de los datos, que se resta en `double` (un número de coma flotante almacenado en 64 bits, más preciso) antes de guardar los valores en `float`.

Algunos términos del oficio, definidos aquí de una vez por todas. Una **coordenada** es un número que sitúa un punto respecto a un sistema de referencia (por ejemplo, «12,5 metros hacia el este»). El **origen** es el punto de ese sistema de referencia cuyas coordenadas valen todas 0. Un **vértice** es un punto de un objeto en 3D, y una **malla** es un objeto descrito por vértices unidos en triángulos (véase [el formato `.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Un mapa, un nivel de juego o una malla manejan todos listas de coordenadas de ese tipo.

Este capítulo supone conocidos los fundamentos de C ([las variables](/?c=langages&s=c&p=variables), [las condiciones](/?c=langages&s=c&p=conditions), [los bucles](/?c=langages&s=c&p=boucles)), [los tipos de números de coma flotante en C](/?c=langages&s=c&p=variables#los-numeros-de-coma-flotante) y [la codificación de los flotantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#como-se-codifica-un-flotante) (signo, exponente, mantisa), que prolonga sin repetirla. Las potencias de dos y los bits se recuerdan en [los enteros y los desbordamientos](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements). Todos los programas se compilaron con `gcc -std=c11 -Wall -Wextra -Werror -fsanitize=address,undefined` en Linux (`-Werror` convierte cada advertencia en error; `-fsanitize=...` añade comprobaciones durante la ejecución que detectan errores de memoria y comportamientos indefinidos; véase [el proceso de compilación](/?c=langages&s=c&p=compilation)) y luego se ejecutaron; también se recompilaron con `-O2 -ffp-contract=off` (la optimización del compilador, véase [los niveles de optimización](/?c=langages&s=c&p=compilation#los-niveles-de-optimizacion-o0-a-o3-os), sin la fusión de una multiplicación y una suma en una sola operación, que cambiaría los redondeos): las salidas son **idénticas** en ambos casos. Suponen un procesador actual cuyo `float` calcula realmente con 32 bits.

## La constatación: 24 bits significativos, por tanto una brecha que se duplica

Un `float` conserva **24 bits significativos**: los dígitos binarios que llevan el valor. A veces se lee que tiene 23 bits de mantisa, a veces 24. Ambos datos son correctos: 23 bits se **almacenan** (la mantisa), y el 24.º es implícito. Un número binario escrito en la forma normalizada «1,xxx × 2ᵉ» (una sola cifra antes de la coma, siempre 1) no necesita almacenar ese primer 1. El `double` hace lo mismo con 52 bits almacenados y 53 significativos.

| Tipo | Bits almacenados (mantisa) | Bits significativos | Brecha justo por encima de 1,0 | Cifras decimales fiables |
|---|---|---|---|---|
| `float` | 23 | 24 | 2⁻²³ ≈ 1,19 × 10⁻⁷ | unas 7 |
| `double` | 52 | 53 | 2⁻⁵² ≈ 2,2 × 10⁻¹⁶ | entre 15 y 16 |

Entre dos números consecutivos representables hay una **brecha**, llamada en inglés *ULP* (*unit in the last place*, «unidad en el último lugar»: el valor del último bit de la mantisa). Para un `float` comprendido entre 2ᵉ y 2ᵉ⁺¹, la brecha vale 2ᵉ⁻²³. Cada **tramo** [2ᵉ ; 2ᵉ⁺¹[ (el intervalo entre dos potencias de dos consecutivas) contiene exactamente el mismo número de `float` (2²³ = 8 388 608), y su anchura se duplica de un tramo al siguiente: la brecha también se duplica.

```text
valor :     1                2                      4                              8
            |----------------|----------------------|------------------------------|
float :     8 388 608 float  8 388 608 float        8 388 608 float
brecha :    2⁻²³ ≈ 1,2e-7    2⁻²² (x2)             2⁻²¹ (x4)
```

El siguiente programa consulta directamente a la máquina. `nextafterf(x, hacia)` devuelve el `float` vecino de `x` en la dirección de `hacia` ([`nextafterf`](https://en.cppreference.com/w/c/numeric/math/nextafter)); la diferencia con `x` es la brecha buscada.

```c
#include <float.h>
#include <math.h>
#include <stdio.h>

// Muestra la brecha entre x y sus vecinos, y después FLT_EPSILON * x para comparar
static void mostrar_brecha(float x)
{
    float siguiente = nextafterf(x, INFINITY);    // float inmediatamente superior a x
    float anterior = nextafterf(x, -INFINITY);    // float inmediatamente inferior a x
    printf("%10.0f | %-14.9g | %-14.9g | %.9g\n", x, siguiente - x, x - anterior,
           FLT_EPSILON * x);
}

int main(void)
{
    const float valores[] = {1.0f, 1000.0f, 1000000.0f, 16777216.0f, 100000000.0f};
    const int num = sizeof valores / sizeof valores[0];  // número de valores del array

    printf("%10s | %-14s | %-14s | %s\n", "x", "encima", "debajo", "FLT_EPSILON*x");
    for (int i = 0; i < num; i++)           // una línea por valor
        mostrar_brecha(valores[i]);
    printf("FLT_EPSILON = %.9g\n", FLT_EPSILON);    // la brecha por encima de 1.0, nada más

    float grande = 16777216.0f;             // 2^24: a partir de aquí faltan enteros
    float mas_uno = grande + 1.0f;          // 16777217 no existe: redondeo al más cercano
    float mas_dos = grande + 2.0f;          // 16777218 sí existe
    printf("2^24 + 1 == 2^24 ? %s\n", mas_uno == grande ? "si" : "no");
    printf("2^24 + 2 == 2^24 ? %s\n", mas_dos == grande ? "si" : "no");
    return 0;
}
```

```text
         x | encima         | debajo         | FLT_EPSILON*x
         1 | 1.1920929e-07  | 5.96046448e-08 | 1.1920929e-07
      1000 | 6.10351562e-05 | 6.10351562e-05 | 0.00011920929
   1000000 | 0.0625         | 0.0625         | 0.11920929
  16777216 | 2              | 1              | 2
 100000000 | 8              | 8              | 11.920929
FLT_EPSILON = 1.1920929e-07
2^24 + 1 == 2^24 ? si
2^24 + 2 == 2^24 ? no
```

| Elemento | Función |
|---|---|
| `#include <float.h>` | La cabecera (archivo de declaraciones, véase [las cabeceras](/?c=langages&s=c&p=headers)) que da los límites de los tipos de coma flotante, entre ellos `FLT_EPSILON` ([`<float.h>`](https://en.cppreference.com/w/c/types/limits)) |
| `static`, `const` | `static` delante de una función la hace visible solo en este archivo; `const` promete que un valor no se modificará |
| `#include <math.h>` | La cabecera de las funciones matemáticas: `nextafterf` y el valor `INFINITY` |
| `INFINITY` | El valor «infinito positivo»; `nextafterf(x, INFINITY)` devuelve el vecino de arriba, `-INFINITY` el vecino de abajo |
| `1.0f` | El sufijo `f` crea un `float`; sin él, `1.0` sería un `double` |
| `sizeof valores / sizeof valores[0]` | El tamaño del array dividido por el de una casilla: el número de casillas |
| `%10.0f`, `%-14.9g`, `%.9g` | Formatos de `printf`: un `float` de 10 caracteres sin decimales; un número de 14 caracteres alineado a la izquierda (`-`) con 9 cifras significativas; lo mismo sin anchura. Nueve cifras bastan para distinguir dos `float` |

Las brechas medidas, comparadas con la fórmula 2ᵉ⁻²³:

| Valor | Intervalo [2ᵉ ; 2ᵉ⁺¹[ | Brecha por encima | Qué significa para metros |
|---|---|---|---|
| 1 | [1 ; 2[ | 2⁻²³ ≈ 0,00000012 | Una diezmillonésima de metro |
| 1 000 | [512 ; 1 024[ | 2⁻¹⁴ ≈ 0,000061 | Unas 6 centésimas de milímetro |
| 1 000 000 | [524 288 ; 1 048 576[ | 2⁻⁴ = 0,0625 | Más de 6 centímetros |
| 16 777 216 (2²⁴) | [2²⁴ ; 2²⁵[ | 2 | Los enteros **impares** ya no existen |
| 100 000 000 | [2²⁶ ; 2²⁷[ | 2³ = 8 | Brechas de 8 metros |

Tres observaciones sobre la salida. Primero, a partir de 16 777 216 = 2²⁴, dos números consecutivos están separados por 2: `16777217` no existe, y el cálculo `2²⁴ + 1` vuelve a caer en `2²⁴` (el resultado exacto se encuentra justo entre dos `float`; la regla de redondeo, véase [la absorción](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorcion-y-cancelacion-cuando-un-calculo-pierde-sus-cifras), elige el que tiene el último bit a 0). Después, la brecha **por debajo** de 1 y de 2²⁴ vale la mitad de la brecha por encima (5,96e-08 y 1): una potencia de dos abre un intervalo, por tanto el tramo anterior es dos veces más fino. Por último, la columna `FLT_EPSILON*x` da el orden de magnitud de la brecha, nunca su valor exacto.

### Lo que significa `FLT_EPSILON`

`FLT_EPSILON`, definido en `<float.h>`, es la brecha justo por encima de **1,0** y nada más: 2⁻²³ ≈ 1,19 × 10⁻⁷. Tomarlo por «la precisión de un `float`» es un error frecuente.

| Lo que se cree | Lo que es cierto |
|---|---|
| «Dos `float` a menos de `FLT_EPSILON` uno del otro son iguales» | Solo vale cerca de 1. En 1 000 000, la brecha es 0,0625: más de 500 000 veces mayor |
| «Un `float` tiene una precisión de 10⁻⁷» | La precisión es **relativa**: alrededor de 10⁻⁷ **del valor** (entre 6 × 10⁻⁸ y 1,2 × 10⁻⁷ de `x`) |
| «La precisión es la misma en todas partes» | Es constante en proporción, pero el error **absoluto** crece con el valor: 10⁻⁷ en 1, 8 en 10⁸ |
| «El `double` resuelve el problema» | Lo aleja: el mismo fenómeno existe con 53 bits, con valores mucho mayores ([el capítulo sobre los flotantes](/?c=donnees&s=representation-des-donnees&p=nombres-flottants) da los umbrales del `double`) |

Para comparar dos `float`, se toma entonces un margen **proporcional** a su tamaño (véase [comparar correctamente](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#la-consecuencia-practica-nunca-probar-la-igualdad)), nunca `FLT_EPSILON` solo.

## Los síntomas, medidos

Un único programa realiza dos mediciones. **Primera medición**: sumar 0,1 un millón de veces a un `float`, una primera vez partiendo de 0 y una segunda partiendo de 10 000 000. El resultado matemático es 100 000 en el primer caso y 10 100 000 en el segundo.

**Segunda medición**, más cercana a una malla real: un pequeño triángulo ABC cuyos lados miden 1 cm (0,01 m) se sitúa a 10 000 km del origen (10 000 000 m). Se guardan sus vértices en `float`, se releen y se miden los lados. Se prueban dos triángulos: uno lejos de toda frontera de redondeo, y otro a caballo sobre una frontera. Para el segundo, esto es lo que ocurre con sus dos vértices A y B:

```text
x de A : 10000000.495  --redondeo-->  10000000   (el float más cercano)
x de B : 10000000.505  --redondeo-->  10000001   (el float más cercano)
diferencia real : 0,01 m             diferencia obtenida : 1 m
(dos float vecinos distan 1 m; su punto medio es 10000000.5, A por debajo, B por encima)
```

Los dos vértices, separados 1 cm, caen a ambos lados del punto medio entre dos `float` vecinos: A se convierte en 10 000 000 y B en 10 000 001.

```c
#include <math.h>
#include <stdio.h>

// Un vértice: dos coordenadas en metros, medidas desde el origen del sistema de referencia
typedef struct {
    double x;
    double y;
} Point;

// Lo que se obtiene al guardar un número en un float y luego releerlo
static double via_float(double v)
{
    return (double)(float)v;            // double -> float (redondeo) -> double (sin pérdida)
}

// Longitud del segmento entre dos puntos, en metros
static double lado(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y); // hypot(dx, dy): raíz de dx² + dy²
}

// Muestra los tres lados del triángulo, tras pasar por el float
static void mostrar_triangulo(const char *nombre, const Point s[3])
{
    Point f[3];                         // los tres vértices tras el paso por el float

    for (int i = 0; i < 3; i++) {       // cada coordenada se redondea a un float
        f[i].x = via_float(s[i].x);
        f[i].y = via_float(s[i].y);
    }
    printf("%s : AB=%g BC=%g CA=%g (esperado : 0.01 0.0141421 0.01)\n",
           nombre, lado(f[0], f[1]), lado(f[1], f[2]), lado(f[2], f[0]));
}

int main(void)
{
    float desde_cero = 0.0f;                    // suma que parte de 0
    float desde_diez_millones = 10000000.0f;    // suma que parte de diez millones

    for (int i = 0; i < 1000000; i++) {         // un millón de sumas de 0,1
        desde_cero += 0.1f;
        desde_diez_millones += 0.1f;
    }
    printf("desde 0         : %.2f (esperado 100000)\n", desde_cero);
    printf("desde 10000000  : %.2f (esperado 10100000)\n", desde_diez_millones);

    const Point en_medio[3] = {                 // lados de 1 cm, a 10 000 km (10^7 m)
        {10000000.2, 10000000.2}, {10000000.21, 10000000.2}, {10000000.2, 10000000.21}};
    const Point a_caballo[3] = {                // A justo bajo x.5, B justo encima
        {10000000.495, 10000000.0}, {10000000.505, 10000000.0},
        {10000000.495, 10000000.01}};

    mostrar_triangulo("degenerado", en_medio);
    mostrar_triangulo("deformado ", a_caballo);
    return 0;
}
```

```text
desde 0         : 100958.34 (esperado 100000)
desde 10000000  : 10000000.00 (esperado 10100000)
degenerado : AB=0 BC=0 CA=0 (esperado : 0.01 0.0141421 0.01)
deformado  : AB=1 BC=1 CA=0 (esperado : 0.01 0.0141421 0.01)
```

| Elemento | Función |
|---|---|
| `typedef struct {...} Point;` | Da el nombre `Point` a una agrupación de dos campos (véase [las estructuras](/?c=langages&s=c&p=variables#las-estructuras-struct)) |
| `(double)(float)v` | Dos conversiones seguidas: a un `float` (aquí tiene lugar el redondeo), y luego a un `double` (sin pérdida, porque un `double` contiene todos los `float`) |
| `hypot(dx, dy)` | La raíz cuadrada de dx² + dy²: la longitud de un segmento de lados dx y dy |
| `0.1f` | El `float` más cercano a 0,1 (valor exacto: 0,100000001490116...) |
| `const Point s[3]` | Un parámetro que recibe tres puntos (en realidad, la dirección del primero, véase [los punteros](/?c=langages&s=c&p=pointeurs)) |
| `%.2f`, `%g`, `%s` | Formatos de `printf`: dos decimales; un número sin ceros inútiles; un texto |
| `for` | El bucle que repite un bloque un número dado de veces (véase [el bucle `for`](/?c=langages&s=c&p=boucles#el-bucle-for)) |

| Medición | Resultado | Explicación |
|---|---|---|
| Suma partida de 0 | 100 958,34 en lugar de 100 000 | 0,1 nunca es un múltiplo exacto de la brecha. En cada suma el resultado se redondea, y a estos tamaños lo hace **siempre del mismo lado**: los errores se suman en lugar de compensarse |
| Suma partida de 10 000 000 | Se queda en 10 000 000,00 | La brecha allí vale 1: sumar 0,1 (menos de la mitad de una brecha) no cambia ningún bit. Cada uno de los un millón de sumas es **absorbido** |
| Triángulo «lejos de una frontera» | Los tres lados valen 0 | Los tres vértices se convierten en el mismo `float`: el triángulo es **degenerado** (reducido a un punto) |
| Triángulo «a caballo» | AB = 1 m, BC = 1 m, CA = 0 | Lados 100 veces demasiado grandes, o nulos: el triángulo está **deformado** |

Estos triángulos no tienen nada de exótico: un vértice que se convierte en un punto, un lado que pasa a medir un metro, son un agujero en una superficie, un objeto que tiembla al mover la cámara, o una colisión que falla.

## La solución: un origen local

La idea: no guardar las coordenadas **absolutas** (medidas desde el origen del mundo), sino coordenadas **relativas** a un punto cercano, el **origen local**. Si los datos caben en un radio de unos pocos metros, los números guardados valen unos pocos metros, y un `float` tiene allí una brecha del orden del micrómetro.

```text
        origen del mundo                        origen local O
              (0,0)                         (elegido cerca de los datos)
                |                                    |
                |<------------ 10 000 000 m -------->|<-- 0,01 m -->| vértice
                |                                    |
   almacenamiento directo : x = 10000000.505  -> float : diferencia de 1 m  (perdido)
   almacenamiento local   : x - O = 0.01      -> float : diferencia de ~1e-9 m (preciso)
```

El método se completa en cuatro pasos:

| Paso | Qué | En qué tipo |
|---|---|---|
| 1. Elegir el origen O | El primer vértice, el centro de los datos, una esquina... | `double` |
| 2. Restar | Para cada coordenada: `p - O` | **`double`** |
| 3. Convertir y guardar | La diferencia, ahora pequeña, se guarda en un `float` | `float` |
| 4. Releer | Al leer: `O + valor_float`, sumado en `double` | `double` |

O se conserva **con el objeto**, en `double`: es el único valor que guarda la posición real.

### Por qué la resta se hace en `double`

Todo depende del orden. Convertir **primero** a `float` y luego restar destruye la información, porque la pérdida tiene lugar en la conversión y la resta solo la hace visible. Restar **primero** en `double` lo conserva todo, y después la conversión se aplica a un número pequeño.

| Orden de las operaciones | Cálculo para B − A (B = 10000000.505, A = 10000000.495) | Resultado |
|---|---|---|
| Convertir, luego restar en `float` | `(float)B - (float)A` = 10000001 − 10000000 | **1** |
| Restar en `double`, luego convertir | `(float)(B - A)` | **0,01** |

La diferencia de dos `double` próximos entre sí es **exacta**. Más precisamente, si uno de los dos números está comprendido entre la mitad y el doble del otro, su diferencia cabe exactamente en un `double`: es el lema de Sterbenz (un resultado clásico de la aritmética de coma flotante). Intuitivamente: los dos números se escriben con las mismas cifras de peso alto, que se cancelan en la resta; solo quedan unos pocos bits que conservar, y los 53 bits del `double` les bastan de sobra. El programa siguiente guarda los mismos vértices de las dos maneras y mide el error de posición.

```c
#include <math.h>
#include <stdio.h>

typedef struct { double x, y; } Point;      // un vértice en metros, en double (53 bits)
typedef struct { float x, y; } PointF;      // un vértice guardado en float (24 bits)

// Guardado sin precaución: se convierten directamente las coordenadas a float
static PointF guardar_directo(Point p)
{
    return (PointF){(float)p.x, (float)p.y};
}

// Guardado con origen local: se resta en double y luego se convierte
static PointF guardar_local(Point p, Point origen)
{
    return (PointF){(float)(p.x - origen.x), (float)(p.y - origen.y)};
}

// Relectura sin origen: se obtiene el valor del float, nada más
static Point releer_directo(PointF f)
{
    return (Point){f.x, f.y};
}

// Relectura con origen: se vuelve a añadir el origen, en double
static Point releer_local(PointF f, Point origen)
{
    return (Point){origen.x + f.x, origen.y + f.y};
}

// Distancia entre dos puntos, en metros
static double dist(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y);
}

// Muestra los tres lados del triángulo releído r y su mayor error de posición
static void mostrar(const char *nombre, const Point v[3], const Point r[3])
{
    double peor = 0.0;                      // mayor distancia entre v[i] y r[i]

    for (int i = 0; i < 3; i++)
        peor = fmax(peor, dist(v[i], r[i]));
    printf("%-15s AB=%.6f BC=%.6f CA=%.6f  error max=%.2e m\n", nombre,
           dist(r[0], r[1]), dist(r[1], r[2]), dist(r[2], r[0]), peor);
}

int main(void)
{
    // Lados de 1 cm, a 10 000 km (10^7 m): A justo por debajo de x.5, B justo por encima
    const Point v[3] = {{10000000.495, 10000000.0}, {10000000.505, 10000000.0},
                        {10000000.495, 10000000.01}};
    const Point origen = v[0];              // origen local: el primer vértice
    Point directo[3], local[3];             // vértices releídos, sin y con origen local

    for (int i = 0; i < 3; i++) {           // guardado en float, y luego relectura
        directo[i] = releer_directo(guardar_directo(v[i]));
        local[i] = releer_local(guardar_local(v[i], origen), origen);
    }
    printf("esperado        AB=0.010000 BC=0.014142 CA=0.010000\n");
    mostrar("float directo", v, directo);
    mostrar("origen local", v, local);

    float fa = (float)v[0].x, fb = (float)v[1].x;  // A y B convertidos a float
    printf("B - A en float  : %g\n", fb - fa);      // resta hecha en float
    printf("B - A en double : %.6f\n", v[1].x - v[0].x);    // la misma resta en double
    return 0;
}
```

```text
esperado        AB=0.010000 BC=0.014142 CA=0.010000
float directo   AB=1.000000 BC=1.000000 CA=0.000000  error max=4.95e-01 m
origen local    AB=0.010000 BC=0.014142 CA=0.010000  error max=0.00e+00 m
B - A en float  : 1
B - A en double : 0.010000
```

| Elemento | Función |
|---|---|
| `(PointF){(float)p.x, (float)p.y}` | Un **literal compuesto**: crea un `PointF` en el sitio, sin variable intermedia (véase [el literal compuesto](/?c=langages&s=c&p=offsetof-et-litteral-compose#el-literal-compuesto-de-c99-un-valor-fabricado-sobre-la-marcha)) |
| `fmax(a, b)` | El mayor de los dos números |
| `%-15s` | Un texto de 15 caracteres, alineado a la izquierda |
| `%.2e` | Notación científica con dos decimales: `4.95e-01` significa 4,95 × 10⁻¹ |
| `const Point origen = v[0];` | El origen local es aquí el primer vértice |

Con el origen local, los lados son correctos. El «error max» de `0.00e+00` no dice que el `float` sea exacto (0,01 se guarda en él con un error de unos 2 × 10⁻¹⁰): ese error es menor que la mitad del paso del `double` a 10 000 km (unos 9 × 10⁻¹⁰ m), así que la suma `origen + valor` vuelve al valor original.

### Cómo elegir el origen

| Elección | Ventaja | Inconveniente |
|---|---|---|
| El primer vértice | Simple; desplazamientos pequeños para un objeto compacto | Depende del orden de los vértices; dos objetos vecinos tienen dos orígenes distintos |
| El centro de la caja envolvente (la caja más pequeña que contiene los datos) | Desplazamientos como mucho iguales a la mitad del tamaño | Se recalcula cada vez que cambian los datos |
| Una esquina de la zona | Fácil de encontrar | Desplazamientos de hasta el tamaño entero |
| Un múltiplo de una potencia de dos (sección siguiente) | Exacto en todas partes, idéntico para todos los objetos de una misma celda | Hay que elegir el paso |

## Por qué un paso de potencia de dos

Las tres primeras elecciones tienen un defecto común: el origen depende de los datos. Un **paso** es una longitud fija, aquí 2ᵏ metros (k es un entero: k = 10 da 1 024 m). El origen se calcula entonces a partir de la sola coordenada: O = 2ᵏ × (x / 2ᵏ redondeado al entero más cercano). Todos los puntos que reciben el mismo origen forman una **celda**: un segmento de 2ᵏ metros (un cuadrado en 2D, un cubo en 3D).

```text
fronteras :   9999872                  10000896
                 |<------- 1024 m ------->|
                 |           O             |
                 |       10000384          |   toda coordenada de esta celda
                 |                         |   recibe el mismo origen O
```

El cálculo, con x = 10000000.495 y k = 10:

| Paso | Operación | Valor |
|---|---|---|
| 1 | x ÷ 2¹⁰ (un simple desplazamiento del exponente) | 9765,6255 |
| 2 | Sumar 0,5 y luego tomar la parte entera (`floor`) | 9766 |
| 3 | Multiplicar por 2¹⁰ | O = 10 000 384 |
| 4 | Desplazamiento x − O | −383,505 |

```c
#include <math.h>
#include <stdio.h>

// Origen elegido por paso: el múltiplo de 2^k más cercano a x
static double origen_por_paso(double x, int k)
{
    double n = floor(ldexp(x, -k) + 0.5);  // x / 2^k, redondeado al entero más cercano
    return ldexp(n, k);                    // n * 2^k (ldexp(m, e) vale m * 2^e, sin error)
}

// Guarda x en un float relativo al origen o y luego lo relee: devuelve el valor recuperado
static double ida_y_vuelta(double x, double o)
{
    float f = (float)(x - o);              // resta en double, luego en float
    return o + f;                          // se vuelve a añadir el origen, en double
}

int main(void)
{
    const double x = 10000000.495;         // una coordenada a 10 000 km del origen
    const int paso[] = {0, 4, 10, 16};     // los exponentes k probados

    printf("x = %.3f\n", x);
    for (int i = 0; i < 4; i++) {          // una prueba por paso
        double o = origen_por_paso(x, paso[i]);
        double peor = 0.0;                 // mayor error sobre 200 000 puntos vecinos
        for (int j = 0; j < 200000; j++) {
            double p = 10000000.0 + j * 0.4713;
            peor = fmax(peor, fabs(ida_y_vuelta(p, origen_por_paso(p, paso[i])) - p));
        }
        printf("k=%2d paso=%6.0f origen=%.0f desplazamiento=%+.3f error max=%.2e\n",
               paso[i], ldexp(1.0, paso[i]), o, x - o, peor);
    }

    const double libre = 10000000.1;       // un origen «libre», cerca de los datos
    const double por_paso = origen_por_paso(libre, 10);
    printf("cualquiera : double=%.9f float=%.9f\n", libre, (double)(float)libre);
    printf("por paso   : double=%.9f float=%.9f\n", por_paso, (double)(float)por_paso);

    const double compartido = 10000040.123;   // un vértice común a dos trozos vecinos
    const double centro_a = 10000020.3, centro_b = 10000070.7;  // un centro por trozo
    printf("centros  : diferencia entre las dos relecturas = %.2e m\n",
           fabs(ida_y_vuelta(compartido, centro_a) - ida_y_vuelta(compartido, centro_b)));
    printf("por paso : diferencia entre las dos relecturas = %.2e m\n",
           fabs(ida_y_vuelta(compartido, origen_por_paso(compartido - 20.0, 10))
                - ida_y_vuelta(compartido, origen_por_paso(compartido + 30.0, 10))));

    const double borde = 10000895.9;       // un vértice cercano a una frontera de celda
    printf("en la frontera : diferencia = %.2e m\n",
           fabs(ida_y_vuelta(borde, origen_por_paso(borde - 2.0, 10))
                - ida_y_vuelta(borde, origen_por_paso(borde + 2.0, 10))));
    return 0;
}
```

```text
x = 10000000.495
k= 0 paso=     1 origen=10000000 desplazamiento=+0.495 error max=1.49e-08
k= 4 paso=    16 origen=10000000 desplazamiento=+0.495 error max=2.38e-07
k=10 paso=  1024 origen=10000384 desplazamiento=-383.505 error max=1.52e-05
k=16 paso= 65536 origen=10027008 desplazamiento=-27007.505 error max=9.75e-04
cualquiera : double=10000000.100000000 float=10000000.000000000
por paso   : double=10000384.000000000 float=10000384.000000000
centros  : diferencia entre las dos relecturas = 3.80e-07 m
por paso : diferencia entre las dos relecturas = 0.00e+00 m
en la frontera : diferencia = 3.05e-05 m
```

| Elemento | Función |
|---|---|
| `ldexp(m, e)` | Calcula m × 2ᵉ modificando solo el exponente del número: **ningún error de redondeo** ([`ldexp`](https://en.cppreference.com/w/c/numeric/math/ldexp)) |
| `floor(y)` | El mayor entero menor o igual que y, devuelto como `double`; `floor(y + 0.5)` redondea al entero más cercano ([`floor`](https://en.cppreference.com/w/c/numeric/math/floor)) |
| `fabs(y)` | El valor absoluto de y |
| `%+.3f`, `%6.0f`, `%2d` | Formatos de `printf`: tres decimales con el signo; un número de 6 caracteres sin decimales; un entero de 2 caracteres |
| `%.9f` | Un número con nueve decimales |
| `(double)(float)libre` | Lo que se obtiene si `libre` se hace pasar por un `float` |

¿Por qué potencias de dos, y no un origen «libre» o un paso decimal como 0,1 m (que ni `float` ni `double` representan exactamente)?

| Propiedad | Explicación | Lo que muestra la salida |
|---|---|---|
| El propio origen es exacto | Un múltiplo n × 2ᵏ (n < 2²⁴) cabe en un `float` **y** en un `double` sin redondeo. Un número como 10000000.1 no cabe en ninguno: solo está aproximado | `libre` vuelve a pasar por un `float` y se convierte en 10 000 000,0: **0,1 m de error adicional**, es decir, diez veces el lado del triángulo. `por_paso` vuelve sin cambios |
| El desplazamiento está acotado | La celda nunca se extiende más de 2ᵏ⁻¹ a cada lado de O: el error de la conversión queda acotado por 2ᵏ⁻²⁶ (más el redondeo mínimo de la suma final en `double`), sea cual sea la distancia al origen del mundo | La columna `error max` sigue la cota (tabla más abajo) |
| El mismo origen se encuentra en todas partes | O solo depende de x y de k: la carga, el guardado, el envío a la tarjeta gráfica y a otra máquina dan el mismo valor. Incluso puede memorizarse solo el entero n | En la línea `por paso`, dos puntos separados 50 m reciben el mismo origen |
| Los vecinos lo comparten | Todos los puntos de una misma celda tienen el mismo origen, y por tanto la misma conversión para un vértice común | `centros`: 3,80e-07 m de diferencia; `por paso`: 0 |

La primera propiedad merece una aclaración por honestidad. La **resta** `x - 10000000.1` sigue siendo exacta en `double`, como con cualquier origen cercano (véase más arriba). El error adicional nace cuando ese origen viaja a un lugar distinto de un `double`: enviado a la tarjeta gráfica en `float`, escrito en un archivo como texto redondeado, o recalculado de otra forma en otro punto del programa. Un origen múltiplo de 2ᵏ atraviesa todos esos pasos sin cambiar.

Elegir k implica un compromiso, medido sobre 200 000 puntos vecinos:

| k | Paso (m) | Desplazamiento máximo (m) | Cota 2ᵏ⁻²⁶ (m) | Error medido (m) |
|---|---|---|---|---|
| 0 | 1 | 0,5 | 1,49 × 10⁻⁸ | 1,49 × 10⁻⁸ |
| 4 | 16 | 8 | 2,4 × 10⁻⁷ | 2,38 × 10⁻⁷ |
| 10 | 1 024 | 512 | 1,5 × 10⁻⁵ | 1,52 × 10⁻⁵ |
| 16 | 65 536 | 32 768 | 9,8 × 10⁻⁴ | 9,75 × 10⁻⁴ |

Se elige el mayor k cuya cota queda por debajo de la tolerancia deseada: un paso mayor significa menos orígenes que gestionar; un paso menor, más precisión. La última prueba de la salida muestra el límite del método: en la **frontera** entre dos celdas, dos puntos vecinos reciben dos orígenes distintos (10 000 384 y 10 001 408), y un vértice común guardado dos veces puede diferir en 3,05 × 10⁻⁵ m, es decir, una brecha de `float` a 512 m. La diferencia queda acotada, pero no es nula.

## Límites y otros remedios

### Guardar el origen con el objeto

El origen local forma parte de los datos: sin él, los `float` ya no sitúan nada. Se guarda en `double`, junto a las coordenadas relativas:

```c
#include <stddef.h>

typedef struct {
    double origen[3];       // el origen local del objeto, en double (3 × 8 = 24 bytes)
    float *vertices;        // x, y, z de cada vértice, relativos al origen, en float
    size_t num_vertices;    // número de vértices
} Malla;

// Coordenada x absoluta del vértice i: el origen se vuelve a aplicar en double
static double x_absoluta(const Malla *m, size_t i)
{
    return m->origen[0] + m->vertices[3 * i];
}

// Diferencia en x entre el vértice i de a y el j de b, sin pasar por números grandes
static double desvio_x(const Malla *a, size_t i, const Malla *b, size_t j)
{
    double entre_origenes = a->origen[0] - b->origen[0];  // gran diferencia, en double
    return entre_origenes + ((double)a->vertices[3 * i] - b->vertices[3 * j]);
}
```

| Elemento | Función |
|---|---|
| `size_t` | Un entero sin signo pensado para contar elementos y posiciones |
| `m->origen[0]` | El campo `origen` de la estructura cuya dirección es `m`, primera casilla (x) |
| `m->vertices[3 * i]` | Los vértices se guardan en línea: x, y, z del vértice 0, luego del vértice 1...; la coordenada x del vértice i está en la casilla 3 × i |
| `(double)a->vertices[3 * i] - b->vertices[3 * j]` | El cast convierte el `float` de la izquierda en `double`; el de la derecha se promueve entonces automáticamente a `double`, así que la resta se hace en `double` |

`desvio_x` ilustra la regla para dos objetos con orígenes distintos: primero se restan los **orígenes** entre sí, en `double`, y luego se suma la pequeña diferencia de los desplazamientos.

### El coste y la tarjeta gráfica

| Pregunta | Respuesta |
|---|---|
| ¿Por qué no guardarlo todo en `double`? | Un `double` ocupa 8 bytes, un `float` 4 (véase [la organización en memoria](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Un millón de vértices en 3D: 12 MB (megabytes, millones de bytes) en `float`, 24 MB en `double`, y el doble de datos que enviar a la tarjeta gráfica en cada ocasión |
| ¿Por qué afecta a la tarjeta gráfica? | Sus programas, los [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#los-shaders-los-programas-de-la-tarjeta-grafica), calculan en `float`: el `double` está ausente en algunos equipos y es netamente más lento en otros |
| ¿Qué hacer entonces? | Mantener el origen en `double` del lado del procesador y enviar solo `float` relativos. La traslación del objeto (véase [las matrices model, view y projection](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#del-objeto-a-la-pantalla-model-view-projection)) se calcula en `double`, y solo su versión reducida viaja en `float` |

### Otros remedios

| Remedio | Principio | Detalle |
|---|---|---|
| Coordenadas relativas a la cámara | En cada imagen, restar en `double` la posición de la cámara: la precisión es máxima cerca del ojo | Un origen local que sigue a la cámara |
| Enteros de coma fija | Contar en milímetros con un entero de 64 bits: la brecha es la misma en todas partes | Véase [la coma fija](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#una-alternativa-la-representacion-en-coma-fija) |
| `double` en todas partes | Desplaza el umbral (de 16,7 millones a 9 × 10¹⁵ para los enteros) | Coste en memoria, velocidad |
| Dividir el mundo en celdas | Un origen por celda (el paso de potencia de dos de este capítulo), y cada celda tiene sus propios `float` | Gestionar las fronteras |

## Las trampas

| Trampa | Por qué es un problema |
|---|---|
| Convertir a `float` **antes** de restar | `(float)p - (float)O` vuelve a 0 o a un metro: la pérdida ya se ha producido. Restar primero en `double` |
| Perder el origen, o guardarlo en `float` | Los desplazamientos siguen siendo correctos, pero todo el objeto se desplaza (0,1 m en el ejemplo de `libre`). Guardar el origen en `double` junto al objeto |
| Mezclar dos objetos con orígenes distintos | Comparar o sumar sus `float` como si compartieran un sistema de referencia desplaza todo en la diferencia de los orígenes. Llevar al mismo sistema de referencia (restar los orígenes en `double`, véase `desvio_x`) |
| Un vértice común a dos trozos con orígenes distintos | Guardado dos veces, difiere en algunas brechas de `float`: una grieta entre los trozos. Dar el mismo origen a ambos, o guardarlo una sola vez |
| Añadir la traslación del objeto en `float` más tarde | Una matriz de colocación (una tabla de números que mueve y gira el objeto) que contiene 10 000 000 en `float` vuelve a plantear el problema del origen. Componer en `double`, reducir al final |
| Comparar dos flotantes con `==` | Incluso tras una ida y vuelta exacta, puede quedar un redondeo. Comparar con un margen relativo (véase `casi_iguales` más abajo) o en `double` tras restaurar el origen |
| Tomar `FLT_EPSILON` por la precisión de todo `float` | Solo vale cerca de 1. Hace falta una tolerancia proporcional al valor |
| Elegir un paso demasiado grande | Con k = 16, el error sube a casi un milímetro. Elegir k según la tolerancia |
| Sumar muchos valores pequeños en un gran total | Cada suma se redondea (o se absorbe): véanse las sumas más arriba y [la absorción](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorcion-y-cancelacion-cuando-un-calculo-pierde-sus-cifras). Sumar primero los valores pequeños entre sí |

Una comparación de `float` con margen proporcional (`fabsf` es el valor absoluto de un `float`, `fmaxf` el mayor de dos `float`):

```c
#include <float.h>
#include <math.h>

// Verdadero si a y b difieren como máximo cuatro veces la brecha relativa de un float
static int casi_iguales(float a, float b)
{
    float margen = 4.0f * FLT_EPSILON * fmaxf(fabsf(a), fabsf(b));  // margen proporcional
    return fabsf(a - b) <= margen;      // fabsf: valor absoluto de un float
}
```

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Guardar las coordenadas del mundo en `double`, y guardar en `float` solo desplazamientos | Los números grandes siguen siendo precisos, los pequeños caben en 24 bits |
| Restar el origen en `double`, convertir después | La diferencia es exacta, y la conversión se aplica a un número pequeño |
| Elegir el origen por pasos de potencia de dos (`ldexp`, `floor`) | Origen exacto, reproducible, compartido por los vecinos |
| Elegir k según la tolerancia: error ≤ 2ᵏ⁻²⁶ | El error máximo se calcula antes de programar |
| Guardar el origen (o el entero n y k) con cada objeto | Los `float` no sirven de nada sin él |
| Llevar dos objetos al mismo sistema de referencia restando sus orígenes en `double` | Ningún valor grande vuelve a pasar por un `float` |
| Medir la brecha por encima del valor útil con `nextafterf` en lugar de suponerla | Se ve la precisión real en el punto donde se trabaja |
| Comparar con un margen proporcional, nunca con `==` | La tolerancia sigue el tamaño de los valores |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un `float` tiene 24 bits significativos: la brecha entre dos vecinos vale 2ᵉ⁻²³ y se duplica en cada tramo de potencia de dos (1,2e-7 en 1, 0,0625 en un millón, 2 en 16 777 216, 8 en cien millones). `FLT_EPSILON` es esa brecha solo alrededor de 1,0: la precisión es constante en proporción, pero el error absoluto crece. Lejos del origen, un triángulo de 1 cm se vuelve nulo o mide 1 m. El remedio es un origen local en `double`, restado **antes** de la conversión a `float`; el origen se elige por pasos de potencia de dos (2ᵏ × entero), exacto, reproducible y compartido por los vecinos. |
| **Trampas a evitar** | Convertir antes de restar; olvidar o redondear el origen; mezclar dos sistemas de referencia con orígenes distintos; un vértice común guardado con dos orígenes; la traslación de objeto recompuesta en `float`; `==` y `FLT_EPSILON` como tolerancia universal; un paso demasiado grande; sumar pequeños términos en un gran total. |
| **Buenas prácticas** | Mundo en `double`, desplazamientos en `float`; resta en `double` y luego conversión; origen por pasos 2ᵏ con k elegido según la tolerancia; origen guardado con el objeto; diferencia de los orígenes en `double` entre objetos; margen de comparación proporcional al valor; `nextafterf` para medir la brecha real. |
