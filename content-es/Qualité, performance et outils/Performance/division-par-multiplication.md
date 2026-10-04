---
order: 10
---

# Sustituir una división por una multiplicación

En un programa que calcula mucho, una operación en particular cuesta más que las demás: la **división**. Este capítulo muestra cómo una división por un número fijo puede sustituirse por una multiplicación que da **exactamente** el mismo resultado, por qué funciona, dentro de qué límites y, sobre todo, cuánto gana realmente: la respuesta es una lección de [medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

## Qué hace una división y por qué cuesta cara

Una **división entera** busca cuántas veces cabe un número en otro: es el **cociente**. Lo que sobra es el **resto**.

| Cálculo | Cociente | Resto | En C |
|---|---|---|---|
| 1.000.000 ÷ 108 | 9.259 | 28 | `1000000 / 108` y `1000000 % 108` |
| 17 ÷ 5 | 3 | 2 | `17 / 5` y `17 % 5` |

Un procesador ejecuta **instrucciones** (sumar, multiplicar, dividir...), y cada una ocupa un número de **ciclos**: un ciclo es un latido del reloj interno del procesador (véase [el contador de ciclos](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#cronometrar-una-parte-de-un-bucle-el-contador-de-ciclos)). Los órdenes de magnitud, que varían según el modelo de procesador:

| Operación con enteros | Coste típico |
|---|---|
| Suma, resta | alrededor de 1 ciclo |
| Multiplicación | alrededor de 3 ciclos |
| División | una decena de ciclos o más |

La multiplicación es rápida porque un circuito dedicado calcula todo el resultado de una sola pasada. La división se parece más a la de la escuela: el circuito avanza por etapas sucesivas. Es, por tanto, la operación que conviene evitar en un bucle que se ejecuta millones de veces.

## La idea: multiplicar por el inverso

Dividir entre 4 es multiplicar por 0,25. Dividir entre 8 es multiplicar por 0,125. Dividir entre `q` es multiplicar por `1/q`, que se llama el **inverso** de `q`.

El problema: los enteros no tienen coma, y `1/7` vale `0,142857142857...` sin acabar nunca. El truco consiste en trabajar en **coma fija**: se conserva un número fijo de decimales, se redondea **hacia arriba** y se desplaza la coma escribiendo el resultado como un entero.

Ejemplo en base 10, para dividir entre 7 con 6 decimales: el inverso redondeado hacia arriba es `0,142858`, es decir, el entero `142.858` si se multiplica por un millón. Se multiplica `d` por `142.858` y luego se **descartan las 6 últimas cifras** (lo que equivale a dividir entre un millón):

| d | d × 142.858 | se descartan 6 cifras | d ÷ 7 (cociente real) |
|---|---|---|---|
| 6 | 857.148 | 0 | 0 |
| 7 | 1.000.006 | 1 | 1 |
| 1.000 | 142.858.000 | 142 | 142 |
| 999.999 | 142.857.857.142 | 142.857 | 142.857 |

El ordenador cuenta en base 2, no en base 10: se sustituye el millón por `2^32` (unos 4300 millones) y «descartar las 6 últimas cifras» por «descartar los 32 últimos bits», es decir, un [desplazamiento a la derecha](/?c=langages&s=c&p=operateurs-binaires#los-desplazamientos) de 32 posiciones (`>> 32`).

```
inverso(q) = 2^32 / q, redondeado hacia arriba
d / q      = (d × inverso(q)) >> 32
```

## El código

```c
#include <stdint.h>
#include <stdio.h>

/* el inverso de q en coma fija: 2^32 / q redondeado hacia arriba.
   Se calcula UNA sola vez por divisor. */
static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }

/* d / q sin división: multiplicar por el inverso,
   luego descartar los 32 bits de menor peso */
static unsigned dividir(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned n = 108;                       /* un divisor conocido solo en ejecución */
    uint64_t inv = inverso(n);              /* la única división real, pagada una vez */
    unsigned d = 1000000;
    unsigned cociente = dividir(d, inv);    /* d / n, por multiplicación */
    unsigned resto = d - cociente * n;      /* d % n, tampoco con una división */

    printf("inverso(%u) = %llu\n", n, (unsigned long long)inv);
    printf("%u / %u = %u, resto %u\n", d, n, cociente, resto);
    printf("control: %u / %u = %u, resto %u\n", d, n, d / n, d % n);
    return 0;
}
```

Salida:

```
inverso(108) = 39768216
1000000 / 108 = 9259, resto 28
control: 1000000 / 108 = 9259, resto 28
```

| Elemento del código | Papel |
|---|---|
| `uint64_t` | Entero sin signo de 64 bits. El producto `d × inverso` supera los 32 bits: hace falta un espacio más ancho (véase el [desbordamiento](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements#el-desbordamiento-overflow)). |
| `1ull << 32` | El número `2^32`, escrito como `unsigned long long` (sufijo `ull`) para que quepa en memoria. |
| `+ q - 1` | Para redondear un cociente entero **hacia arriba**: `(a + q - 1) / q` es el menor entero mayor o igual que `a / q`. |
| `>> 32` | Descarta los 32 bits de menor peso: el equivalente de «descartar las 6 últimas cifras». Permitido aquí porque el valor tiene 64 bits: desplazar 32 posiciones un entero de 32 bits es un comportamiento indefinido (véanse [los desplazamientos](/?c=langages&s=c&p=operateurs-binaires#los-desplazamientos)). |
| `d - cociente * n` | El resto, sin una segunda división: `d % n` se deduce del cociente. |

El cálculo del inverso contiene a su vez una división real, pero se hace **una sola vez** por divisor. Cada división siguiente es solo una multiplicación y un desplazamiento. El truco solo compensa, pues, si se usa un **mismo divisor** un gran número de veces.

## Por qué es exacto

El inverso se redondeó hacia arriba: es un poco demasiado grande. Llamemos `e` a ese excedente, en unidades de `1/2^32`:

```
e = q × inverso(q) - 2^32          con 0 <= e < q
```

Entonces `d × inverso(q) / 2^32 = d/q + d×e / (q × 2^32)`: el cálculo da el cociente real más un pequeño error positivo, `d×e / (q × 2^32)`. Ese error no cambia el resultado mientras siga siendo **inferior a `1/q`**:

| Etapa | Razonamiento |
|---|---|
| 1 | `d / q` se escribe `k + r/q`: `k` es el cociente, `r` el resto, y `r` es como máximo `q - 1`. |
| 2 | La parte tras la coma vale, por tanto, como máximo `(q - 1)/q = 1 - 1/q`. |
| 3 | Sumarle un error estrictamente inferior a `1/q` no puede alcanzar `k + 1`: la parte entera sigue siendo `k`. |
| 4 | El error es inferior a `1/q` cuando `d × e < 2^32`. |
| 5 | Con `q <= 128`, `e < 128 = 2^7`; con `d < 2^25`, `d × e < 2^25 × 2^7 = 2^32`. |

El método es, por tanto, exacto para todo divisor hasta 128 y todo dividendo inferior a `2^25` (33.554.432). Una demostración tranquiliza, pero un error de un solo bit pasa inadvertido: se verifica también por **fuerza bruta**, comparando con la división real para cada uno de los 128 × 2^25 pares posibles:

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned dividir(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

int main(void)
{
    unsigned long long verificadas = 0, erroneas = 0;

    for (unsigned q = 1; q <= 128; q++) {               /* divisores de la zona garantizada */
        uint64_t inv = inverso(q);
        for (unsigned d = 0; d < (1u << 25); d++) {     /* dividendos de la zona garantizada */
            verificadas++;
            if (dividir(d, inv) != d / q)               /* control con la división real */
                erroneas++;
        }
    }
    printf("%llu divisiones verificadas, %llu erróneas\n", verificadas, erroneas);
    return 0;
}
```

```
4294967296 divisiones verificadas, 0 erróneas
```

## Fuera de la zona garantizada, el resultado es erróneo sin avisar

Cuando `d × e` alcanza `2^32`, el error supera `1/q` y el cociente puede valer **uno más** que el correcto, sin ningún mensaje:

```c
#include <stdint.h>
#include <stdio.h>

int main(void)
{
    unsigned q = 127;
    uint64_t inv = ((1ull << 32) + q - 1) / q;
    uint64_t e = q * inv - (1ull << 32);        /* error de redondeo: 0 <= e < q */
    unsigned d = 0;

    while ((unsigned)(d * inv >> 32) == d / q)  /* busca el primer dividendo erróneo */
        d++;
    printf("q = %u, e = %llu\n", q, (unsigned long long)e);
    printf("primer d erróneo: %u (2^25 = %u, 2^32 / e = %llu)\n",
           d, 1u << 25, (1ull << 32) / e);
    printf("cociente real: %u, cociente calculado: %u\n", d / q, (unsigned)(d * inv >> 32));
    return 0;
}
```

```
q = 127, e = 111
primer d erróneo: 38693470 (2^25 = 33554432, 2^32 / e = 38693399)
cociente real: 304672, cociente calculado: 304673
```

El primer dividendo erróneo está justo por encima de `2^32 / e`, como prevé la demostración. Depende del divisor:

| Divisor `q` | Error `e` | `2^32 / e` | Primer `d` erróneo |
|---|---|---|---|
| 3 | 2 | 2.147.483.648 | 2.147.483.648 |
| 10 | 4 | 1.073.741.824 | 1.073.741.829 |
| 127 | 111 | 38.693.399 | 38.693.470 |
| 129 | 113 | 38.008.560 | 38.008.688 |
| 128 | 0 | (ningún error) | ninguno (potencia de 2: el inverso es exacto) |

La cota «`q <= 128` y `d < 2^25`» es, por tanto, **suficiente**, no la única posible: un divisor pequeño como 3 sigue siendo exacto hasta más de dos mil millones. Para una zona mayor hace falta una versión más fina del algoritmo, con un desplazamiento adicional: es lo que hacen los compiladores y la biblioteca [libdivide](https://libdivide.com/), a partir del artículo de [Granlund y Montgomery (1994)](https://doi.org/10.1145/178243.178249).

## El compilador ya lo hace cuando conoce el divisor

Cuando el divisor es una constante escrita en el código, el [compilador](/?c=langages&s=c&p=compilation) aplica esta transformación por sí solo:

```c
unsigned div_constante(unsigned d) { return d / 108; }
unsigned div_variable(unsigned d, unsigned n) { return d / n; }
```

El código máquina producido por `gcc -O2` (los [niveles de optimización](/?c=langages&s=c&p=compilation#los-niveles-de-optimizacion-o0-a-o3-os) del compilador), mostrado con `objdump -d` ([ejemplo de uso](/?c=langages&s=c&p=compilation#varios-archivos-e-inlining-unidad-de-traduccion-static-inline-flto)), sin las líneas de alineación ni `endbr64`:

```
div_constante:                       div_variable:
  mov    eax,edi                       mov    eax,edi
  shr    eax,0x2                       xor    edx,edx
  imul   rax,rax,0x4bda12f7            div    esi          <- la división real
  shr    rax,0x23
  ret                                  ret
```

Para `d / 108`, el compilador eligió por sí mismo una constante mágica (`0x4bda12f7`): una multiplicación y desplazamientos, ninguna instrucción `div`. Lo hace incluso sin optimización (`-O0`). Para `d / n` no puede hacer nada: el valor de `n` solo existe en ejecución (leído de la línea de comandos, de un archivo...), así que conserva `div`.

| Divisor | ¿Quién sustituye la división? |
|---|---|
| Constante conocida al compilar | El compilador, automáticamente |
| Fijado al arrancar, reutilizado millones de veces | El programador (esta técnica), o una biblioteca |
| Distinto en cada división | Nadie: calcular el inverso cuesta una división, no se gana nada |

## Cuánto se gana: una lección de medición

Para medir, el programa siguiente cronometra (con [`clock_gettime`](/?c=langages&s=c&p=mesure-du-temps#medir-una-duracion-clock-gettime-clock-monotonic)) dos situaciones. En la **cadena dependiente**, cada división necesita el resultado de la anterior: no puede empezar antes. En las divisiones **independientes**, el procesador puede hacer avanzar varias a la vez. El divisor se lee de la línea de comandos: el compilador no puede conocerlo.

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }
static unsigned dividir(unsigned d, uint64_t inv) { return (unsigned)(d * inv >> 32); }

#define N 400000000u                /* número de iteraciones */
#define MASCARA ((1u << 25) - 1)    /* mantiene d bajo 2^25, donde el inverso es exacto */

/* cadena dependiente: cada división espera el resultado de la anterior */
static unsigned cadena_div(unsigned n)
{
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (d / n + i * 2654435761u) & MASCARA;
    return d;
}

static unsigned cadena_mul(unsigned n)
{
    uint64_t inv = inverso(n);
    unsigned d = 12345;

    for (unsigned i = 0; i < N; i++)
        d = (dividir(d, inv) + i * 2654435761u) & MASCARA;
    return d;
}

/* divisiones independientes: el procesador puede avanzar varias a la vez */
static unsigned indep_div(unsigned n)
{
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += ((i * 2654435761u) & MASCARA) / n;
    return s;
}

static unsigned indep_mul(unsigned n)
{
    uint64_t inv = inverso(n);
    unsigned s = 0;

    for (unsigned i = 0; i < N; i++)
        s += dividir((i * 2654435761u) & MASCARA, inv);
    return s;
}

static double ahora(void)
{
    struct timespec t;

    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(int argc, char **argv)
{
    unsigned n = argc > 1 ? (unsigned)atoi(argv[1]) : 108;     /* desconocido al compilar */
    unsigned (*f[4])(unsigned) = { cadena_div, cadena_mul, indep_div, indep_mul };
    const char *nombre[4] = { "cadena       d / n  ", "cadena       inverso",
                              "independientes d / n  ", "independientes inverso" };
    double mejor[4] = { 1e9, 1e9, 1e9, 1e9 };
    unsigned res[4];

    for (int ronda = 0; ronda < 5; ronda++)    /* 5 rondas alternadas, se guarda la mejor */
        for (int k = 0; k < 4; k++) {
            double t0 = ahora();
            double duracion;

            res[k] = f[k](n);
            duracion = ahora() - t0;
            if (duracion < mejor[k])
                mejor[k] = duracion;
        }
    for (int k = 0; k < 4; k++)
        printf("%s : %5.2f ns por división\n", nombre[k], mejor[k] / N * 1e9);
    printf("resultados idénticos: %s\n",
           res[0] == res[1] && res[2] == res[3] ? "sí" : "NO");
    return 0;
}
```

```
cadena       d / n   :  2.66 ns por división
cadena       inverso :  1.28 ns por división
independientes d / n   :  1.29 ns por división
independientes inverso :  0.38 ns por división
resultados idénticos: sí
```

| Situación | División `/` | Inverso precalculado | Ganancia |
|---|---|---|---|
| Cadena dependiente | 2,66 ns | 1,28 ns | alrededor de ×2 |
| Divisiones independientes | 1,3 ns | 0,38 ns | alrededor de ×3,4 |

En este pequeño programa, la división es el único trabajo: la ganancia es máxima. En un programa real es otra cosa. En el [solucionador de Skyscraper](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl), que encuentra la fila y la columna de una casilla a partir de su número (divisiones entre el tamaño `n` de la cuadrícula), la sustitución se comprobó así: las dos versiones hacen **exactamente la misma búsqueda** (mismos contadores de trabajo, véase [comprobar que dos versiones hacen el mismo trabajo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comprobar-que-dos-versiones-hacen-el-mismo-trabajo-antes-de-cronometrarlas)), y luego se cronometraron en dos [rondas alternas](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#medir-en-rondas-alternas). Resultado con `n = 96`: **0,5 % de tiempo ganado**.

¿Por qué tan poco, si la división es de 2 a 3 veces más lenta aislada?

| Razón | Explicación |
|---|---|
| El procesador oculta la latencia | Mientras una división se ejecuta, ya adelanta otras instrucciones: el tiempo de espera queda en gran parte cubierto por otro trabajo. |
| La división es una pequeña parte del tiempo | El solucionador pasa la mayor parte del tiempo leyendo memoria, no dividiendo (véase [la caché del procesador](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#la-jerarquia-de-cache)). |
| Un microtest es un máximo | Aísla la operación medida: da la cota alta de la ganancia, nunca la ganancia real. |

> Una ganancia de ×3 en un microtest y de 0,5 % en el programa completo no se contradicen: no miden lo mismo. Antes de optimizar una operación, conviene cronometrar **el programa entero**; si no, se pasa tiempo escribiendo código más sutil para un resultado que el cronómetro apenas distingue del ruido.

## Las trampas

```c
#include <stdint.h>
#include <stdio.h>

static uint64_t inverso(unsigned q) { return ((1ull << 32) + q - 1) / q; }

int main(void)
{
    unsigned q = 108, d = 1000000;
    unsigned inv32 = (unsigned)inverso(q);      /* inverso copiado en 32 bits */
    unsigned inv_de_1 = (unsigned)inverso(1);   /* vale 2^32: hacen falta 33 bits */

    printf("d / q                         = %u\n", d / q);
    printf("producto calculado en 64 bits = %u\n", (unsigned)(d * inverso(q) >> 32));
    printf("producto calculado en 32 bits = %u\n", (unsigned)((uint64_t)(d * inv32) >> 32));
    printf("5 / 1 con un inverso de 32 bits = %u\n",
           (unsigned)((uint64_t)(5 * inv_de_1) >> 32));
    return 0;
}
```

```
d / q                         = 9259
producto calculado en 64 bits = 9259
producto calculado en 32 bits = 0
5 / 1 con un inverso de 32 bits = 0
```

| Trampa | Qué ocurre | Remedio |
|---|---|---|
| Producto calculado en 32 bits | El excedente más allá de 32 bits se pierde, y luego el desplazamiento de 32 bits solo deja 0: el resultado es erróneo sin error ni aviso | Conservar el inverso en un `uint64_t`: la multiplicación se hace entonces en 64 bits |
| Inverso de 1 | `2^32` no cabe en 32 bits: copiado en un `unsigned`, vale 0 | El mismo remedio: el inverso se queda en 64 bits |
| `d` o `q` fuera de la zona garantizada | Cociente uno más grande, sin mensaje | Acotar `d` y `q` al crear el inverso, o verificar la zona por fuerza bruta como arriba |
| Números negativos | La división en C redondea hacia cero (`-7 / 2` da `-3`); el truco solo cubre enteros sin signo | Aplicar la técnica solo a valores `unsigned` |
| Divisor nulo | `inverso(0)` divide entre cero y detiene el programa | Rechazar `q == 0` antes de calcular el inverso |

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Dividir entre `q` es multiplicar por el inverso `2^32 / q` redondeado hacia arriba y descartar luego los 32 bits de menor peso. Es exacto mientras `d × e < 2^32` (donde `e < q` es el error de redondeo): para `q <= 128`, todo `d < 2^25`. Calcular el inverso cuesta una división, que se paga una sola vez. |
| **Herramientas utilizables** | El compilador (divisor constante: automático), `objdump -d` para comprobar que ha desaparecido una instrucción `div`, la biblioteca [libdivide](https://libdivide.com/) para una zona más amplia, un bucle de fuerza bruta para verificar una zona, `clock_gettime` para cronometrar. |
| **Trampas a evitar** | Un producto calculado en 32 bits, un `d` o un `q` fuera de la zona (resultado erróneo sin mensaje), números negativos, un divisor nulo, un divisor que cambia en cada llamada (no se gana nada), y concluir a partir de un microtest sin medir el programa entero. |
| **Buenas prácticas** | Dejar que lo haga el compilador cuando el divisor se conoce al compilar; escribirlo a mano solo para un divisor fijado en ejecución y reutilizado millones de veces; demostrar o verificar la zona de exactitud; comparar las dos versiones sobre el mismo trabajo antes de cronometrar; cronometrar el programa completo. |
