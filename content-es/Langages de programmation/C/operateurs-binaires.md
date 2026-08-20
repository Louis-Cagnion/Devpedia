---
order: 16
---

# Los operadores binarios

Los operadores binarios (o "bit a bit") trabajan directamente sobre la representación binaria de los enteros, bit por bit. En C se usan a diario sin que uno lo note: los indicadores pasados a las llamadas al sistema, los permisos de archivos, o incluso la optimización de cálculos simples se apoyan en ellos.

## Los seis operadores

| Operador | Nombre | Efecto sobre cada bit |
|---|---|---|
| `&` | Y (AND) | 1 si **ambos** bits están a 1 |
| `\|` | O (OR) | 1 si **al menos uno** de los bits está a 1 |
| `^` | O exclusivo (XOR) | 1 si los bits son **diferentes** |
| `~` | NO (NOT) | invierte cada bit |
| `<<` | desplazamiento a la izquierda | desplaza los bits hacia la izquierda |
| `>>` | desplazamiento a la derecha | desplaza los bits hacia la derecha |

```c
unsigned char a = 12;  // 0000 1100
unsigned char b = 10;  // 0000 1010

a & b  // 0000 1000 = 8   -> bits presentes en ambos
a | b  // 0000 1110 = 14  -> bits presentes en uno u otro
a ^ b  // 0000 0110 = 6   -> bits presentes en solo uno de los dos
~a     // 1111 0011 = 243 (en unsigned char)
```

> No confundir `&` con `&&`, ni `|` con `||`. Las versiones dobles son los operadores **lógicos**: trabajan sobre valores verdadero/falso y devuelven 0 o 1. `1 & 2` vale `0` (ningún bit en común), mientras que `1 && 2` vale `1` (ambos valores son verdaderos). Esta confusión es una fuente de errores silenciosos.

## Los desplazamientos

Desplazar `n` posiciones a la izquierda equivale a **multiplicar por 2ⁿ**, desplazar a la derecha a **dividir por 2ⁿ** (división entera):

```c
unsigned char x = 5;    // 0000 0101

x << 1  // 0000 1010 = 10   (5 * 2)
x << 3  // 0010 1000 = 40   (5 * 8)
x >> 1  // 0000 0010 = 2    (5 / 2, redondeado hacia abajo)
```

Los bits que salen del ancho del tipo se **pierden**; no es un error, no hay ningún aviso:

```c
unsigned char y = 200;  // 1100 1000
y << 1                  // 1001 0000 = 144, y no 400: se perdió un bit
```

**Dos trampas que hay que conocer:**

- Desplazar un número de posiciones mayor o igual al ancho del tipo es un **comportamiento indefinido** (`x << 32` sobre un `int` de 32 bits): el resultado no está garantizado, aunque "parezca funcionar".
- `>>` sobre un entero **con signo negativo** depende de la implementación (el bit de signo puede propagarse o no). Para manipular bits, usa siempre tipos **sin signo** (`unsigned int`, `uint32_t`).

## Las máscaras: la verdadera utilidad del día a día

Una **máscara** es un valor que se usa para apuntar a bits precisos. Las cuatro operaciones básicas:

```c
#define BANDERA_LECTURA    (1u << 0)  // 0000 0001
#define BANDERA_ESCRITURA  (1u << 1)  // 0000 0010
#define BANDERA_AGREGAR    (1u << 2)  // 0000 0100

unsigned int opciones = 0;

opciones |= BANDERA_LECTURA;                 // ACTIVAR    un bit
opciones |= BANDERA_ESCRITURA;

if (opciones & BANDERA_ESCRITURA) { ... }    // COMPROBAR  un bit

opciones &= ~BANDERA_ESCRITURA;  // DESACTIVAR un bit
opciones ^= BANDERA_AGREGAR;     // ALTERNAR   un bit
```

Es exactamente el mecanismo de las llamadas al sistema: `open("f.txt", O_WRONLY | O_CREAT)` combina indicadores con `|`, y la función luego los comprueba con `&`. Véase el capítulo [Las llamadas al sistema y los descriptores de archivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs).

Los permisos de archivos Unix siguen la misma lógica en base 8: `0644` codifica tres grupos de tres bits (lectura/escritura/ejecución para el propietario, el grupo, los demás). Véase también el capítulo [Permisos y gestión de archivos](/?c=shells&s=bash&p=permissions-et-fichiers) de Bash.

**¿Por qué usar indicadores en lugar de booleanos separados?** Un único `unsigned int` almacena 32 opciones independientes, se pasa en un solo argumento, y se comprueba en una sola instrucción de procesador.

## Modismos habituales

```c
// Paridad: el bit menos significativo vale 1 para un número impar
if (n & 1) { /* n es impar */ }

// Potencia de 2: el bit está a 1 una sola vez, por lo tanto n & (n-1) == 0
int es_potencia_de_2(unsigned int n) {
    return n != 0 && (n & (n - 1)) == 0;
}

// Contar los bits a 1 (algoritmo de Kernighan)
int contar_bits(unsigned int n) {
    int total = 0;
    while (n) {
        n &= n - 1;      // borra el bit a 1 mas a la derecha
        total++;
    }
    return total;
}

// Intercambiar dos enteros sin variable temporal (curiosidad, no usar)
a ^= b; b ^= a; a ^= b;
```

Los dos primeros son útiles en la práctica (el conteo de bits es el [algoritmo de Kernighan](https://en.wikipedia.org/wiki/Hamming_weight#Language_support)). El último ilustra una propiedad del XOR (`x ^ x == 0`, `x ^ 0 == x`) pero debe evitarse en código real: es ilegible, más lento que una variable temporal en un procesador moderno, y **falso si las dos variables son la misma** (`a` y `a` se convertirían en 0).

## ¿`n & 1` en lugar de `n % 2`?

Históricamente, `n & 1` era más rápido que `n % 2`, y `n << 1` más rápido que `n * 2`. **Ya no es un argumento válido**: cualquier compilador moderno realiza estas sustituciones por su cuenta cuando son correctas.

Escribe entonces lo que expresa tu intención: `n % 2 == 0` si hablas de paridad, `n & MASCARA` si hablas de bits. La legibilidad sale ganando y el rendimiento es idéntico.

> Cuidado de todos modos: `n % 2` y `n & 1` no son equivalentes para un `n` negativo en C (`-3 % 2` vale `-1`). Es una razón más para reservar las operaciones binarias a los tipos sin signo.

## Resumen

| Objetivo | Escritura |
|---|---|
| Activar un bit | `x \|= MASCARA` |
| Desactivar un bit | `x &= ~MASCARA` |
| Alternar un bit | `x ^= MASCARA` |
| Comprobar un bit | `if (x & MASCARA)` |
| Crear una máscara para el bit *n* | `1u << n` |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Los operadores binarios (`&`, `\|`, `^`, `~`, `<<`, `>>`) trabajan bit a bit, y se usan para indicadores, permisos y máscaras. No confundir con `&&`/`\|\|` (lógicos). |
| **Herramientas utilizables** | Máscaras (`\|=` activa, `&= ~` desactiva, `^=` alterna, `&` comprueba un bit). |
| **Trampas a evitar** | Desplazar un número de bits ≥ el ancho del tipo (comportamiento indefinido); usar `>>` sobre un signo negativo (depende de la implementación). |
| **Buenas prácticas** | Reservar las operaciones binarias a los tipos sin signo; escribir `n % 2`/`n * 2` en lugar de `n & 1`/`n << 1` por legibilidad: un compilador moderno ya optimiza la equivalencia. |
