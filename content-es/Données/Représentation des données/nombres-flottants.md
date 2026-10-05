---
order: 2
---

# Los números de coma flotante (IEEE 754)

Es probablemente el comportamiento más desconcertante de la programación, y el que más a menudo se atribuye al culpable equivocado:

```text
0.1 + 0.2   ==>  0.30000000000000004
```

Este resultado es idéntico en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), en [Python](/?c=langages-de-programmation&s=python&p=python), en [C](/?c=langages-de-programmation&s=c&p=c), en [PHP](/?c=langages-de-programmation&s=php&p=php), en [Java](https://docs.oracle.com/en/java/) y en [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). Por tanto **no** es un defecto de un lenguaje: es una consecuencia de la forma en que el procesador codifica los números decimales, descrita por la norma **IEEE 754**, que todos estos lenguajes usan porque es el hardware el que lo impone.

## ¿Por qué una aproximación?

En base 10, ciertas fracciones no tienen escritura decimal finita: `1/3 = 0,333...`: hay que detenerse en algún punto, por tanto escribir una aproximación.

El mismo fenómeno existe en base 2, pero **con otros números**. Un número solo tiene una escritura binaria finita si su denominador es una potencia de 2:

| Número | En binario | ¿Exacto? |
|---|---|---|
| `0,5` (= 1/2) | `0,1` | sí |
| `0,25` (= 1/4) | `0,01` | sí |
| `0,75` (= 3/4) | `0,11` | sí |
| `0,1` (= 1/10) | `0,0001100110011...` | **no**, periódico infinito |

`0.1` es perfectamente simple en decimal e infinito en binario. La máquina debe por tanto truncarlo: lo que realmente se almacena es el flotante más cercano a `0,1`, no `0,1`. Sumar dos valores aproximados acumula las desviaciones, y el resultado de `0.1 + 0.2` cae en un flotante ligeramente superior al que representa `0.3`.

> Lo que se muestra no es un error de visualización: `0.30000000000000004` **es** el valor almacenado, expresado en decimal.

## Cómo se codifica un flotante

Un flotante se almacena en tres partes, como una notación científica en binario (± mantisa × 2^exponente):

```text
[ signo : 1 bit ][ exponente ][ mantisa ]
```

| Tipo | Total | Signo | Exponente | Mantisa | Dígitos decimales fiables |
|---|---|---|---|---|---|
| `float` (precisión simple) | 32 bits | 1 | 8 | 23 | ~7 |
| `double` (precisión doble) | 64 bits | 1 | 11 | 52 | ~15-16 |

- el **signo** indica positivo o negativo;
- el **exponente** da el orden de magnitud: es él quien permite representar tanto `10⁻³⁰⁰` como `10³⁰⁰`;
- la **mantisa** lleva las cifras significativas, y es ella quien **limita la precisión**.

Este compromiso es el núcleo del asunto: un flotante sacrifica la precisión para cubrir un rango enorme de valores con pocos bits. Al ser fijo el número de bits de mantisa, la precisión es **relativa**: cuanto más grande es un número, mayor es la brecha entre dos flotantes consecutivos.

```text
1.0  y el siguiente flotante  : brecha de unos 2,2e-16
1e9  y el siguiente flotante  : brecha de unos 1,2e-7
1e16 y el siguiente flotante  : brecha de unos 2,0
```

A partir de 2⁵³ (unos 9 × 10¹⁵), la brecha supera 1: enteros vecinos se vuelven **indistinguibles**, porque la mantisa de 52 bits ya no basta para diferenciarlos.

## La consecuencia práctica: nunca probar la igualdad

Como dos cálculos matemáticamente equivalentes pueden producir flotantes diferentes, `==` sobre flotantes es casi siempre un bug latente. Se compara la **diferencia** con un margen de error aceptable, llamado epsilon:

```text
si valor_absoluto(a - b) < epsilon  ->  considerar a y b como iguales
```

En C:

```c
#include <math.h>

double epsilon = 0.0001;
if (fabs(a - b) < epsilon) { /* considerados iguales */ }
```

En Python:

```python
import math
math.isclose(0.1 + 0.2, 0.3)     # True -> gestiona la tolerancia por ti
```

En JavaScript:

```js
Math.abs(a - b) < 0.0001;
```

**¿Qué epsilon elegir?** Depende del dominio, no del lenguaje. Para precios al céntimo, `0.001` basta. No tomes sistemáticamente el "epsilon de máquina" (la brecha representable más pequeña alrededor de 1, `2,22e-16` en precisión doble): es correcto para valores cercanos a 1, pero **demasiado estricto** para valores grandes, donde la brecha natural entre dos flotantes ya lo supera ampliamente.

## Absorción y cancelación: cuando un cálculo pierde sus cifras

La distancia entre dos flotantes consecutivos crece con el valor (véase más arriba). Un resultado exacto que cae entre dos flotantes se **redondea** al más cercano: sumar un número pequeño a uno grande puede por tanto no cambiar **nada**, es la **absorción**.

| Tipo | Primer entero que ya no existe | Sumar 1 se pierde siempre a partir de |
|---|---|---|
| `float` | 2²⁴ + 1 = 16 777 217 | 2²⁵ = 33 554 432 |
| `double` | 2⁵³ + 1 = 9 007 199 254 740 993 | 2⁵⁴ = 18 014 398 509 481 984 |

Resultados medidos en C (`float`, 32 bits):

```c
float big = 16777216.0f;      /* 2^24 */
big + 1.0f == big;            /* verdadero: 16 777 217 no existe, se redondea a 16 777 216 */
big + 2.0f == big;            /* falso: 16 777 218 existe */

float sum = 16777216.0f;
for (int i = 0; i < 1000; i++)
	sum += 1.0f;              /* cada +1 se pierde: sum sigue valiendo 16 777 216, no 16 778 216 */
```

El remedio es **sumar primero los valores pequeños entre sí**: 1000 sumas de `1.0f` dan exactamente 1000, y luego `16777216.0f + 1000.0f` vale 16 778 216 (un número par, representable a esta escala). Pasar a `double` solo desplaza el umbral.

La **cancelación** es la trampa inversa: restar dos números grandes y cercanos destruye las cifras fiables. Aquí el error ya se comete en la conversión; la resta lo hace visible:

```c
float distance = 100000000.0f;    /* 10^8 */
float radius = 99999999.0f;       /* almacenado como 100 000 000: la distancia entre dos float es 8 a este tamaño */
float near = distance - radius;   /* 0.0 en lugar de 1.0 */
```

Un `near` igual a 0 donde el cálculo posterior exige un número estrictamente positivo (división, plano de proyección) produce un resultado infinito o absurdo, sin ningún mensaje de error. Hay que controlar el resultado de una resta cuyos dos términos son cercanos, o calcular en `double`.

**Comparar con un margen relativo.** Una constante absoluta (`0.0001`) depende de la unidad de los valores: demasiado grande para objetos de 0,001, demasiado pequeña para valores de 10⁸ (donde la distancia natural es 8). Se compara por tanto con una fracción del mayor de los dos valores:

```c
/* Verdadero si a y b difieren como máximo en la fracción rel del mayor de los dos (valor absoluto). */
static int close_enough(double a, double b, double rel)
{
	return fabs(a - b) <= rel * fmax(fabs(a), fabs(b));   /* fabs: valor absoluto; fmax: el mayor de los dos */
}
```

Para comparar con 0 exactamente, esta fórmula no sirve (el margen se vuelve nulo): hay que añadir un suelo absoluto elegido según la unidad del dominio.

**`NaN` y el infinito atraviesan las comparaciones sin error.** Una comparación con `NaN` es siempre falsa (véase [valores particulares](#valores-particulares)), y el infinito es mayor que todo:

| Expresión | `NaN` | `+inf` (infinito positivo) |
|---|---|---|
| `x < 0` | falso | falso |
| `x > 10` | falso | verdadero |
| `x > 0` | falso | verdadero |
| `x == x` | falso | verdadero |

El control habitual «rechazar si está fuera de rango» deja pasar por tanto `NaN` (las dos condiciones son falsas). Se escribe el control **en el sentido de la aceptación**: aceptar solo lo que es finito y está en el rango.

```c
/* Verdadero si x es un número finito en [min, max]; falso para NaN, +inf y -inf. */
static int in_range(double x, double min, double max)
{
	return isfinite(x) && x >= min && x <= max;   /* isfinite: falso para NaN y para el infinito */
}
```

`inf - inf` da `NaN`: un solo valor infinito produce después `NaN` en todo el resto del cálculo.

> **Trampa:** ninguno de estos casos produce un error ni una caída: el cálculo continúa con un valor falso. Verificar las entradas numéricas desde que llegan (`isfinite`, rango del dominio) en lugar de suponer valores sanos.

## El caso del dinero: no usar flotantes

Para importes, la respuesta correcta no es ajustar el epsilon sino **cambiar de representación**: contar en céntimos, con enteros.

```text
precio_en_centimos = 1999      // 19,99 EUR
total = precio_en_centimos * 3 // 5997, exacto
```

Esta es también la razón por la que las bases de datos distinguen `DECIMAL` (exacto, en base 10) de `FLOAT` (aproximado): un importe se almacena en `DECIMAL`. Ver el capítulo [SQL](/?c=domain-specific-languages-dsl&p=sql).

## Valores particulares

La norma reserva ciertas combinaciones de bits para valores especiales, presentes en todos los lenguajes:

- **infinitos**: producidos por un desbordamiento o una división por cero (`1.0 / 0.0`);
- **NaN** (*Not a Number*): resultado de una operación inválida (`0.0 / 0.0`, raíz de un número negativo).

`NaN` tiene una propiedad deliberadamente sorprendente: **no es igual a nada, ni siquiera a sí mismo**. `NaN == NaN` es falso. Es coherente (dos resultados inválidos no tienen ninguna razón para ser "el mismo número"), pero obliga a usar una función dedicada para detectarlo (`isnan()` en C, `math.isnan()` en Python, `Number.isNaN()` en JavaScript).

## Una alternativa: la representación en coma fija

En lugar de sacrificar precisión para cubrir un rango enorme de valores (como hace un flotante), la **representación en coma fija** (*fixed-point*) almacena un número decimal como un entero normal, cuyos últimos bits representan por convención la parte fraccionaria:

```text
Con 8 bits fraccionarios:
  valor real = entero_almacenado / 2^8

  entero_almacenado = 2560  ->  2560 / 256 = 10.0
  entero_almacenado = 2688  ->  2688 / 256 = 10.5
```

Convertir un entero normal a coma fija equivale a multiplicarlo por `2^bits_fraccionarios` (`10 * 256 = 2560`); convertir en sentido inverso (a entero o a flotante) equivale a dividir por ese mismo valor.

| | Flotante (IEEE 754) | Coma fija |
|---|---|---|
| Almacenamiento | Signo + exponente + mantisa | Un entero normal |
| Precisión | Relativa (depende del orden de magnitud) | Fija y constante (siempre el mismo número de decimales) |
| Cálculo | Requiere una unidad de coma flotante (FPU) | Simples operaciones enteras, más rápidas y deterministas |
| Uso típico | Cálculo científico, rango de valores muy amplio | Embebido sin FPU, videojuegos retro, señal de audio/DSP |

> **Buena práctica:** la coma fija garantiza un resultado estrictamente idéntico en cualquier máquina (a diferencia de un flotante, cuyo redondeo puede variar ligeramente según el compilador o el procesador): útil en cuanto un cálculo deba seguir siendo reproducible bit a bit, por ejemplo en un juego multijugador donde cada cliente debe obtener exactamente el mismo resultado.

Es la técnica en la que se basa el formato **Q** (*Q number format*), todavía usado hoy por algunos procesadores digitales de señal (DSP) que no incorporan una unidad de coma flotante.

## Lo que añade cada lenguaje

La base es común; los lenguajes solo difieren en el envoltorio:

| Lenguaje | Particularidades |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | `float` / `double` / `long double` explícitos, `fabs()`, `isnan()` |
| JavaScript | un solo tipo `number` (siempre un double), `BigInt` para los grandes enteros, ver [Los números](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, enteros de tamaño arbitrario nativamente, `math.isclose()`, módulo `decimal` |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Recuerda sobre todo que estas diferencias no cambian nada de fondo: es el hardware el que decide, y decide igual para todo el mundo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un flotante (norma IEEE 754) almacena una aproximación, no un valor exacto: `0.1 + 0.2 != 0.3` en todos los lenguajes, sin excepción. La precisión es relativa: cuanto más grande es un número, mayor es la brecha entre dos flotantes consecutivos. Los enteros siguen siendo exactos hasta 2⁵³ en precisión doble (52 bits de mantisa); más allá, enteros vecinos se vuelven indistinguibles; en `float`, desde 2²⁴. Un número pequeño sumado a uno grande puede ser absorbido, y una resta de números grandes y cercanos puede dar 0. |
| **Herramientas utilizables** | Comparación por epsilon (`math.isclose`, `fabs(a-b) < epsilon`), tipos `DECIMAL` para importes exactos. La coma fija para un resultado reproducible bit a bit sin FPU. |
| **Trampas a evitar** | Comparar dos flotantes con `==` (incluido `NaN`, que no es igual a nada, ni a sí mismo); almacenar un importe monetario en flotante en lugar de en enteros (céntimos) o `DECIMAL`. Controlar una entrada con «rechazar si está fuera de rango»: `NaN` pasa, y el infinito pasa una prueba `x > 0`. Sumar uno a uno términos pequeños a un total grande. |
| **Buenas prácticas** | Elegir un epsilon adaptado al orden de magnitud manejado, nunca el epsilon de máquina por defecto para valores grandes. Comparar con un margen relativo en lugar de una constante absoluta. Sumar los valores pequeños entre sí antes de añadirlos al total grande. Aceptar una entrada solo si `isfinite(x)` y está en el rango del dominio. |
