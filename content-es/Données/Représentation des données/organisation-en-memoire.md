---
order: 4
---

# La organización de los datos en memoria

La memoria es un inmenso array de bytes numerados. Entender cómo se disponen los valores ahí explica varios comportamientos desconcertantes: por qué una estructura ocupa más espacio que la suma de sus campos, o por qué un archivo binario escrito en una máquina puede ser ilegible en otra.

> Este capítulo trata la **disposición** de los datos. Para la asignación (pila, heap, `malloc`/`free`) y los bugs asociados, ver el capítulo [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) de [C](/?c=langages-de-programmation&s=c&p=c).

## La unidad de direccionamiento es el byte

Cada **byte** (8 bits) tiene su propia dirección. No se puede direccionar un bit aislado: para leer un bit preciso, hay que cargar el byte que lo contiene y luego aplicar una máscara (ver [Los operadores binarios](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

El procesador, por su parte, trabaja por **palabra** (*word*): 8 bytes en una máquina de 64 bits. Es esta diferencia de escala entre la unidad de direccionamiento y la unidad de procesamiento la que explica todo lo que sigue.

## La alineación

Un procesador lee la memoria en bloques alineados sobre múltiplos del tamaño de la palabra. Un valor de 4 bytes colocado en una dirección múltiplo de 4 se lee en un solo acceso; a caballo entre dos bloques, hacen falta dos, más un ensamblado.

La regla aplicada por los compiladores: **un valor de tamaño *n* se coloca en una dirección múltiplo de *n***.

En ciertas arquitecturas, un acceso no alineado está simplemente **prohibido** y provoca un error de hardware. En x86 funciona pero cuesta más. En ambos casos, el compilador prefiere alinear.

## El relleno (*padding*) en las estructuras

Es la consecuencia más visible de la alineación: una estructura a menudo ocupa **más** que la suma de sus campos.

```c
struct Ejemplo {
    char  a;  // 1 byte
    int   b;  // 4 bytes
    char  c;  // 1 byte
};

sizeof(struct Ejemplo)   // ¡12, y no 6!
```

Lo que hace realmente el compilador:

```text
byte 0     : a
bytes 1-3  : RELLENO (para alinear b en un multiplo de 4)
bytes 4-7  : b
byte 8     : c
bytes 9-11 : RELLENO (para que el tamaño total sea multiplo de 4)
```

El relleno final existe para que, en un **array** de estructuras, cada elemento siga alineado.

**Consecuencia práctica: el orden de declaración cambia el tamaño.** Agrupando los campos del más grande al más pequeño, se reduce el desperdicio:

```c
struct Compacta {
    int   b;  // bytes 0-3
    char  a;  // byte 4
    char  c;  // byte 5
                // bytes 6-7: relleno final
};              // sizeof = 8 en lugar de 12
```

En una estructura usada en millones de ejemplares, este detalle cambia el consumo de memoria en un tercio, y sobre todo la eficacia de la caché del procesador, a menudo más determinante que el cálculo en sí.

> Por tanto, **nunca** calcules el tamaño de una estructura a mano: usa `sizeof`. Y no escribas una estructura bruta en un archivo o en la red suponiendo su disposición: el relleno varía según el compilador y la arquitectura. Es el papel de la **serialización** ([JSON](/?c=infrastructure&p=json), [Protobuf](https://protobuf.dev)...) producir un formato definido independientemente de la máquina.

## El orden de los bytes (*endianness*)

Para un valor de varios bytes, ¿en qué orden colocarlos en memoria? Coexisten dos convenciones. Tomemos el entero de 32 bits `0x12345678`:

| Convención | Bytes en memoria | Usada por |
|---|---|---|
| **Little-endian** | `78 56 34 12` | x86, x86-64, ARM (por defecto) |
| **Big-endian** | `12 34 56 78` | Red, algunos procesadores (SPARC, PowerPC) |

El *little-endian* coloca el byte de **menor peso** primero. No es ni mejor ni peor, es una elección histórica, pero no es universal, de ahí dos implicaciones:

- Un archivo binario escrito en una máquina little-endian y leído por una big-endian dará valores erróneos, sin error señalado: la lectura tiene éxito, los números simplemente están mal.
- Los protocolos de red imponen el big-endian, llamado por esta razón **orden de red**. Las funciones `htons()`/`ntohl()` en C sirven exactamente para esta conversión.

Es otra razón más para preferir un formato serializado explícito (texto o binario especificado) a una copia bruta de la memoria.

## Lo que "la dirección" quiere decir concretamente

Un puntero contiene la dirección del **primer** byte de un valor. Es su **tipo** el que indica cuántos bytes leer a partir de ahí, y cómo interpretarlos.

```c
int    x = 65;
int   *pi = &x;
char  *pc = (char *)&x;

*pi  // 65      -> lee 4 bytes, los interpreta como un entero
*pc  // 'A'     -> lee 1 byte en la MISMA direccion, lo interpreta como un caracter
```

Es también por eso que `puntero + 1` avanza `sizeof(tipo)` bytes y no 1: la aritmética de punteros cuenta en elementos, no en bytes. Ver el capítulo [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs).

## ¿Y en los lenguajes de más alto nivel?

[Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) o [PHP](/?c=langages-de-programmation&s=php&p=php) ocultan todo esto: no eliges la disposición en memoria. Pero no desaparece, y se manifiesta de otra forma:

- una lista Python de 1000 enteros ocupa mucho más que 4000 bytes, porque cada entero es un **objeto** con su cabecera;
- es precisamente por esta razón que existe NumPy: un array NumPy almacena valores brutos contiguos, alineados, sin cabecera por elemento: de ahí ganancias de velocidad de un orden de magnitud en cálculo numérico (ver [NumPy](/?c=data-science&p=numpy)).

## Resumen

| Noción | A recordar |
|---|---|
| Unidad de direccionamiento | El byte; un bit solo no es direccionable |
| Alineación | Un valor de *n* bytes se coloca en una dirección múltiplo de *n* |
| Padding | Una estructura ≥ suma de sus campos; el orden de declaración importa |
| `sizeof` | Siempre medir, nunca calcular a mano |
| Endianness | Orden de los bytes; la red impone el big-endian |
| Escribir memoria bruta | A evitar: serializar en un formato definido |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La memoria se direcciona por byte, pero el procesador prefiere leer valores alineados en múltiplos de su tamaño: de ahí el *padding* que agranda una estructura más allá de la suma de sus campos. El orden de los bytes (*endianness*) varía según la arquitectura. |
| **Herramientas utilizables** | `sizeof` para medir un tamaño real, reordenar los campos de una estructura (más grande al más pequeño) para reducir el padding. |
| **Trampas a evitar** | Calcular el tamaño de una estructura a mano en lugar de usar `sizeof`; escribir la memoria bruta de una estructura en un archivo/red, sin tener en cuenta el padding ni el endianness. |
| **Buenas prácticas** | Serializar en un formato definido (JSON, Protobuf...) en lugar de copiar la memoria bruta de una estructura entre máquinas. |
