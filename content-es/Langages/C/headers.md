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
| **Para recordar** | Una cabecera (`.h`) contiene declaraciones, no definiciones: permite que varios archivos `.c` compartan las mismas firmas sin duplicarlas. El preprocesador resuelve `#include "..."` concatenando literalmente cada carpeta `-I` con la ruta escrita. |
| **Herramientas utilizables** | `#include <...>` (biblioteca del sistema) frente a `#include "..."` (archivo del proyecto); include guards (`#ifndef`/`#define`/`#endif` o `#pragma once`). |
| **Trampas a evitar** | Poner el cuerpo de una función en una cabecera: provoca un error de "multiple definition" en cuanto varios archivos la incluyen. Apuntar `-I` al nivel de carpeta equivocado, lo que rompe la concatenación con la ruta de `#include`. |
| **Buenas prácticas** | Proteger siempre una cabecera con un include guard, para soportar una inclusión indirecta múltiple sin error. |
