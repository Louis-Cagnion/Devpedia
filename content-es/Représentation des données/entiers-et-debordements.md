---
order: 1
---

# Los enteros, los bits y los desbordamientos

Un entero no se almacena "tal cual": ocupa un número **fijo** de bits, decidido en la declaración. Toda la mecánica de los enteros se deriva de esta restricción: los valores máximos, los números negativos, y los desbordamientos.

## ¿Cuántos valores en *n* bits?

Con *n* bits, se dispone de **2ⁿ** combinaciones distintas, por tanto 2ⁿ valores representables:

| Bits | Combinaciones | Sin signo | Con signo |
|---|---|---|---|
| 8 | 256 | 0 → 255 | −128 → 127 |
| 16 | 65 536 | 0 → 65 535 | −32 768 → 32 767 |
| 32 | ~4,3 mil millones | 0 → 4 294 967 295 | −2 147 483 648 → 2 147 483 647 |
| 64 | ~1,8 × 10¹⁹ | 0 → ~1,8 × 10¹⁹ | ~−9,2 × 10¹⁸ → ~9,2 × 10¹⁸ |

El número de valores no cambia según se tenga signo o no: es el **rango** el que se desplaza. Un `char` sin signo va de 0 a 255, uno con signo de −128 a 127: 256 valores en ambos casos.

**El cálculo a recordar:** para *n* bits, el valor máximo sin signo es `2ⁿ − 1` (el `− 1` porque el cero ocupa una combinación). Con signo, el rango es `−2ⁿ⁻¹` a `2ⁿ⁻¹ − 1`.

## El peso de un bit

Cada bit contribuye al valor total según su posición, una potencia de 2 creciente de derecha a izquierda (su **peso**):

```text
bit :    1    0    1    1    0    0    1    0
peso : 128   64   32   16   8    4    2    1
         ^                                  ^
    peso fuerte                       peso debil
```

El **bit de menor peso** (el más a la derecha) es el que vale 1 (2⁰); el **bit de mayor peso** (el más a la izquierda) es el que más pesa en el valor final, 2ⁿ⁻¹ en *n* bits. Esta distinción reaparece en dos contextos habituales: el bit de mayor peso sirve de indicador de signo en complemento a dos (ver más abajo), y el bit de menor peso por sí solo basta para probar la paridad de un número (`n & 1`, ver el capítulo [Los operadores binarios](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

## Los números negativos: el complemento a dos

¿Cómo almacenar un signo cuando solo se dispone de 0 y 1? La idea ingenua sería reservar un bit para el signo. Es lo que hace el flotante, pero no el entero, porque eso plantearía dos problemas: dos representaciones del cero (`+0` y `−0`), y una suma que debería tratar los signos aparte.

La solución universalmente adoptada es el **complemento a dos**: para obtener `−x`, se invierten todos los bits de `x` y luego se suma 1.

```text
 5 (en 8 bits)   = 0000 0101
 inversion       = 1111 1010
 + 1             = 1111 1011  =  -5
```

El interés es decisivo: **la suma funciona sin caso especial**. El procesador suma los bits sin saber ni preocuparse por el signo.

```text
   5  = 0000 0101
+ -5  = 1111 1011
-----------------
   0  = 0000 0000   (el bit que desborda simplemente se pierde)
```

El bit de mayor peso actúa entonces como un indicador de signo: `0` para positivo, `1` para negativo. Esto también explica la **asimetría** del rango (`−128` a `127`): al estar el cero del lado positivo, queda una combinación más para los negativos.

## El desbordamiento (*overflow*)

¿Qué pasa cuando un resultado ya no cabe en el número de bits asignados? Los bits sobrantes se **pierden**, y el valor "da la vuelta".

```c
unsigned char x = 255;  // 1111 1111, el maximo
x = x + 1;              // 0000 0000 -> 0 !
```

Es el comportamiento llamado *wraparound*: se vuelve al principio, como un cuentakilómetros. Para un entero **con signo**, el efecto es más sorprendente:

```c
signed char y = 127;  // 0111 1111, el maximo
y = y + 1;            // 1000 0000 -> -128 !
```

Sumar 1 al mayor número positivo da el menor negativo.

> **Trampa mayor en C/C++:** el desbordamiento de un entero **con signo** es un **comportamiento indefinido** (*undefined behavior*), no un wraparound garantizado. El compilador tiene derecho a suponer que nunca ocurre y optimizar en consecuencia: una prueba como `if (x + 1 < x)` puede ser directamente eliminada. El desbordamiento **sin signo**, en cambio, está definido por la norma y sí da la vuelta. Para contar, comparar o enmascarar bits, preferid por tanto los tipos sin signo.

## Por qué importa de verdad

Los desbordamientos de enteros no son una curiosidad académica:

- El **bug del año 2038**: los sistemas Unix cuentan los segundos desde 1970 en un entero con signo de 32 bits. Desbordará el 19 de enero de 2038, devolviendo una fecha en 1901.
- Numerosas **fallas de seguridad** vienen de un cálculo de tamaño que desborda: si `tamaño + 1` da la vuelta a 0, una asignación de 0 bytes va seguida de una escritura de varios miles: es un desbordamiento de búfer. Ver el capítulo [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) de C.
- El **primer Ariane 5** fue destruido en 1996 debido a una conversión de un flotante de 64 bits a un entero de 16 bits que desbordó.

## Según los lenguajes

| Lenguaje | Comportamiento |
|---|---|
| [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp) | Tamaño fijo elegido explícitamente. Desbordamiento con signo = comportamiento indefinido |
| [Java](https://docs.oracle.com/en/java/), [C#](https://learn.microsoft.com/en-us/dotnet/csharp/) | Tamaño fijo, wraparound definido para todos los enteros |
| **[Python](/?c=langages-de-programmation&s=python&p=python)** | Enteros de **tamaño arbitrario**: crecen mientras la memoria siga, ningún desbordamiento |
| JavaScript | Sin verdadero tipo entero: todo es flotante, por tanto exacto solo hasta 2⁵³ (ver [Los números de coma flotante](/?c=representation-des-donnees&p=nombres-flottants)). `BigInt` para ir más allá |
| [PHP](/?c=langages-de-programmation&s=php&p=php) | Entero nativo; en caso de desbordamiento, conversión automática a `float` (por tanto pérdida de precisión) |

Python ilustra bien el compromiso: no desbordar nunca es cómodo, pero cada entero es un objeto más pesado y más lento que un entero máquina. Es una de las razones por las que las bibliotecas de cálculo como NumPy usan tipos de tamaño fijo (`int32`, `int64`). Ver el capítulo [NumPy](/?c=data-science&p=numpy).

## Cuando un tamaño fijo ya no basta: aritmética de precisión arbitraria sobre cadenas

Ningún entero nativo, por amplio que sea (64 bits, o incluso más), basta para ciertos cálculos: criptografía sobre grandes números primos, cálculo de miles de decimales de π, factorial de un número grande... Una técnica habitual para superar este límite, con independencia del lenguaje y de su tipo entero nativo, consiste en representar el número ya no como un valor binario de tamaño fijo, sino como una **cadena de caracteres** (o un array), un elemento por cifra:

```text
"123" -> ['1', '2', '3']   (cada cifra sigue siendo un caracter, no un valor binario)
```

La multiplicación reproduce entonces, cifra a cifra, el método aprendido a mano en la escuela (multiplicación en columna):

```text
    1 2 3
  x   4 5
  -------
    6 1 5    (123 x 5)
+ 4 9 2 .    (123 x 4, desplazado una posicion)
  -------
  5 5 3 5
```

Cada cifra del segundo número multiplica todas las cifras del primero, con un **acarreo** propagado como en una suma en columna, el resultado de cada línea desplazado una posición (una potencia de 10) antes de sumarse a las líneas anteriores.

> **Trampa:** propagar cada acarreo inmediatamente en la cifra siguiente, como se haría a mano en una sola línea. Una implementación robusta almacena en cambio cada producto cifra por cifra en un array intermedio suficientemente grande (`tamaño1 + tamaño2` cifras), y propaga los acarreos en una sola pasada final sobre ese array: más fácil de implementar correctamente que una propagación sobre la marcha, donde una cifra ya escrita podría necesitar modificarse varias veces seguidas.

El coste es claro frente a una multiplicación nativa: multiplicar *n* por *m* cifras requiere del orden de *n* × *m* multiplicaciones cifra a cifra (frente a una sola instrucción máquina para un entero nativo), a reservar para los casos en que el tamaño del número supera realmente lo que un tipo nativo puede representar. Es exactamente el mecanismo que se esconde detrás de los enteros de precisión arbitraria de Python vistos más arriba, con una base mucho mayor que 10 internamente para limitar el número de operaciones.

## Manipular los bits directamente

El corolario de esta representación binaria es que se puede actuar sobre los bits mismos: máscaras, desplazamientos, banderas. Es el objeto del capítulo [Los operadores binarios](/?c=langages-de-programmation&s=c&p=operateurs-binaires) en C.

## Resumen

| A recordar | |
|---|---|
| *n* bits | 2ⁿ valores; máx sin signo = 2ⁿ − 1 |
| Negativos | Complemento a dos: invertir los bits, sumar 1 |
| Rango con signo asimétrico | El cero se cuenta del lado positivo |
| Desbordamiento | Los bits sobrantes se pierden, el valor da la vuelta |
| En C, con signo que desborda | Comportamiento **indefinido**: usar sin signo |
| Precisión arbitraria | Representar el número como cadena de cifras y multiplicar como a mano, para superar cualquier tamaño nativo |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un entero ocupa un número fijo de bits, decidido en la declaración: *n* bits dan 2ⁿ valores posibles. Los negativos se codifican en complemento a dos; un desbordamiento hace "dar la vuelta" al valor (o provoca un comportamiento indefinido en C para uno con signo). Cuando ningún tamaño nativo basta, una cadena de cifras multiplicada a mano rodea el límite. |
| **Herramientas utilizables** | Los tipos sin signo para contar/comparar/enmascarar bits sin riesgo de UB; los tipos de tamaño fijo (`int32`, `int64`) de las bibliotecas de cálculo; la aritmética de precisión arbitraria sobre cadena para superar cualquier tamaño nativo. |
| **Trampas a evitar** | Contar con el desbordamiento de un entero con signo en C/C++: comportamiento indefinido, no un wraparound garantizado. Propagar los acarreos de una multiplicación en columna sobre la marcha en lugar de mediante un array intermedio. |
| **Buenas prácticas** | Preferir los tipos sin signo para toda manipulación de bits; verificar que un cálculo de tamaño no pueda desbordar antes de una asignación de memoria. |
