---
order: 10
---

# Los archivos de cabecera (.h)

Un archivo de cabecera (*header*, extensión `.h`) contiene **declaraciones**: anuncia "esta función/variable/estructura existe y esta es su firma", sin proporcionar su implementación. Permite que varios archivos `.c` compartan las mismas definiciones sin duplicarlas, y sirve de contrato entre un archivo que proporciona una funcionalidad y los archivos que la utilizan.

## Declaración frente a definición

```c
// calculos.h, declaración: "esta función existe, esta es su firma"
int suma(int a, int b);
```

```c
// calculos.c, definición: el cuerpo real de la función
#include "calculos.h"

int suma(int a, int b)
{
    return a + b;
}
```

```c
// main.c, uso, a través de la cabecera
#include "calculos.h"

int main(void)
{
    printf("%d\n", suma(2, 3));
}
```

`main.c` solo necesita conocer la **firma** de `suma()` (mediante `#include "calculos.h"`) para llamarla: el cuerpo real se proporciona en el momento del [enlazado](/?c=langages-de-programmation&s=c&p=compilation), a partir del archivo objeto compilado desde `calculos.c`.

## `static` en una función: nunca exponerla en una cabecera

```c
// utilidades.c
static int cuadrado(int x)   // enlace INTERNO: invisible fuera de utilidades.c
{
    return x * x;
}

// enlace externo (por defecto): declarable en utilidades.h, llamable desde otro lado
int cubo(int x)
{
    return x * cuadrado(x);
}
```

`static` aplicado a una función restringe su visibilidad a su propio archivo `.c` (su *unidad de traducción*): el enlazador nunca la ve desde otro archivo, aunque su prototipo estuviera declarado en una cabecera. Es el reflejo habitual para una función utilitaria interna, que no tiene ninguna razón para llamarse desde otro lado (ej. en `libft`, `ft_split.c` declara `static` sus funciones internas `ft_cnt_words`, `len_word`, `ft_free`, `write_split`, nunca presentes en `libft.h`).

## `static` en una variable local: duración de almacenamiento estática

```c
char *get_next_line(int fd)
{
    static char *linea_guardada;   // se conserva entre llamadas, nunca se recrea

    // ... usa y actualiza línea_guardada ...
    return (linea);
}
```

En una **variable local**, `static` cambia un aspecto completamente distinto: su **duración de vida**, no su visibilidad. Una variable local clásica se recrea en cada llamada a la función y se destruye al `return` (almacenada en la pila); una variable local `static` solo se inicializa una vez, en la primera llamada, y luego conserva su valor de una llamada a otra (almacenada en el mismo segmento de memoria que las variables globales). Es este mecanismo el que permite a `get_next_line()` "recordar" lo que queda por leer después de un `\n`, sin variable global ni parámetro adicional.

> **Trampa:** la misma palabra clave, dos efectos sin relación según lo que califique: en una función (sección anterior), `static` restringe la **visibilidad** (enlace interno); en una variable local, cambia la **duración de vida**, sin afectar su visibilidad (siempre limitada a la función que la declara).

## `#include <...>` frente a `#include "..."`

```c
#include <stdio.h>    // ángulos: busca en los directorios del sistema (biblioteca estándar)
#include "calculos.h" // comillas: busca primero en el directorio actual del proyecto
```

## Los include guards

Una misma cabecera puede incluirse indirectamente varias veces (por ejemplo, `a.h` incluye `comun.h`, y `b.h` también incluye `comun.h`, y `main.c` incluye `a.h` y `b.h`): sin protección, sus declaraciones se duplicarían y provocarían un error de compilación ("redefinition"). Un **include guard** impide que una cabecera sea procesada más de una vez por el preprocesador:

```c
#ifndef CALCULOS_H
#define CALCULOS_H

int suma(int a, int b);

#endif
```

- Primera inclusión: `CALCULOS_H` todavía no está definido → se incluye todo el contenido, y se define `CALCULOS_H`.
- Inclusión siguiente (mismo archivo, en otra cadena de includes): `CALCULOS_H` ya está definido → el preprocesador salta directamente a `#endif`, el contenido no se duplica.

Una alternativa más breve, admitida por casi todos los compiladores modernos aunque no garantizada por el estándar C:

```c
#pragma once

int suma(int a, int b);
```

> **Nota:** una cabecera solo debe contener **declaraciones** (prototipos de funciones, `struct`, `typedef`, constantes), nunca el cuerpo de una función que no sea `static`/`inline`: de lo contrario, cada archivo `.c` que la incluya obtendría su propia copia de la definición, provocando un error de "multiple definition" en el enlazado.

## Cómo se combinan realmente `#include` y `-I`

El preprocesador nunca "adivina" dónde está un archivo incluido: para `#include "glad/glad.h"`, concatena **literalmente** cada carpeta pasada vía [`-I`](/?c=langages&s=c&p=makefiles) con la ruta escrita tras `#include`, y prueba cada resultado hasta encontrar un archivo que exista:

```text
-I includes  +  #include "glad/glad.h"
   ↓
includes/glad/glad.h   <- ruta realmente probada en el disco
```

> **Trampa:** apuntar `-I` a la carpeta que contiene directamente `glad.h` (ej. `-I includes/glad`) en lugar de a su carpeta padre (`-I includes`), mientras el código escribe `#include "glad/glad.h"`. La concatenación da entonces `includes/glad/glad/glad.h`, que no existe: el compilador falla con "archivo no encontrado", para una ruta que a simple vista parece correcta si solo se piensa en "dónde está el archivo", sin reconstruir la concatenación exacta.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una cabecera (`.h`) contiene declaraciones, no definiciones: permite que varios archivos `.c` compartan las mismas firmas sin duplicarlas. El preprocesador resuelve `#include "..."` concatenando literalmente cada carpeta `-I` con la ruta escrita. `static` en una función restringe su visibilidad; en una variable local, cambia su duración de vida. |
| **Herramientas utilizables** | `#include <...>` (biblioteca del sistema) frente a `#include "..."` (archivo del proyecto); include guards (`#ifndef`/`#define`/`#endif` o `#pragma once`); `static` para una función interna a un archivo o una variable local persistente. |
| **Trampas a evitar** | Poner el cuerpo de una función en una cabecera: provoca un error de "multiple definition" en cuanto varios archivos la incluyen. Apuntar `-I` al nivel de carpeta equivocado, lo que rompe la concatenación con la ruta de `#include`. |
| **Buenas prácticas** | Proteger siempre una cabecera con un include guard, para soportar una inclusión indirecta múltiple sin error. |
