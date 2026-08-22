---
order: 2
---

# Los números de coma flotante (IEEE 754)

Es probablemente el comportamiento más desconcertante de la programación, y el que más a menudo se atribuye al culpable equivocado:

```text
0.1 + 0.2   ==>  0.30000000000000004
```

Este resultado es idéntico en JavaScript, en [Python](/?c=langages-de-programmation&s=python&p=python), en [C](/?c=langages-de-programmation&s=c&p=c), en [PHP](/?c=langages-de-programmation&s=php&p=php), en [Java](https://docs.oracle.com/en/java/) y en [C#](https://learn.microsoft.com/en-us/dotnet/csharp/). Por tanto **no** es un defecto de un lenguaje: es una consecuencia de la forma en que el procesador codifica los números decimales, descrita por la norma **IEEE 754**, que todos estos lenguajes usan porque es el hardware el que lo impone.

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

## Lo que añade cada lenguaje

La base es común; los lenguajes solo difieren en el envoltorio:

| Lenguaje | Particularidades |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c) | `float` / `double` / `long double` explícitos, `fabs()`, `isnan()` |
| JavaScript | un solo tipo `number` (siempre un double), `BigInt` para los grandes enteros, ver [Los números](/?c=langages-de-programmation&s=javascript&p=nombres) |
| [Python](/?c=langages-de-programmation&s=python&p=python) | `float` = double, enteros de tamaño arbitrario nativamente, `math.isclose()`, módulo `decimal` |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | `float` = double, `PHP_FLOAT_EPSILON` |

Recuerda sobre todo que estas diferencias no cambian nada de fondo: es el hardware el que decide, y decide igual para todo el mundo.

## Resumen

| A recordar | Por qué |
|---|---|
| `0.1 + 0.2 != 0.3` en todos los lenguajes | Codificación binaria, no un bug del lenguaje |
| Nunca comparar dos flotantes con `==` | Dos cálculos equivalentes dan bits diferentes |
| Comparar vía un epsilon adaptado al dominio | La precisión es relativa al orden de magnitud |
| Importes monetarios en enteros o `DECIMAL` | Ninguna aproximación tolerable con dinero |
| Enteros exactos hasta 2⁵³ en precisión doble | La mantisa tiene 52 bits |
| `NaN != NaN` | Un valor inválido no es igual a nada, ni a sí mismo |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un flotante (norma IEEE 754) almacena una aproximación, no un valor exacto: `0.1 + 0.2 != 0.3` en todos los lenguajes, sin excepción. La precisión es relativa: cuanto más grande es un número, mayor es la brecha entre dos flotantes consecutivos. |
| **Herramientas utilizables** | Comparación por epsilon (`math.isclose`, `fabs(a-b) < epsilon`), tipos `DECIMAL` para importes exactos. |
| **Trampas a evitar** | Comparar dos flotantes con `==`; almacenar un importe monetario en flotante en lugar de en enteros (céntimos) o `DECIMAL`. |
| **Buenas prácticas** | Elegir un epsilon adaptado al orden de magnitud manejado, nunca el epsilon de máquina por defecto para valores grandes. |
