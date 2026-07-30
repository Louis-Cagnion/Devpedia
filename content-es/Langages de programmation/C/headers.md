---
order: 6
---

# Los archivos de cabecera (.h)

Un archivo de encabezado (*header*, con la extensión `.h`) contiene **declaraciones**: indica «esta función/variable/estructura existe y esta es su firma», sin proporcionar su implementación. Permite que varios archivos `.c` compartan las mismas definiciones sin duplicarlas, y sirve de contrato entre un archivo que proporciona una funcionalidad y los archivos que la utilizan.

## Declaración frente a definición

```c
// calculs.h — déclaration : "cette fonction existe, voici sa signature"
int addition(int a, int b);
```

```c
// calculs.c — définition : le vrai corps de la fonction
#include "calculs.h"

int addition(int a, int b)
{
    return a + b;
}
```

```c
// main.c — utilisation, via le header
#include "calculs.h"

int main(void)
{
    printf("%d\n", addition(2, 3));
}
```

`main.c` Solo es necesario conocer la **firma** de `addition()` (a través de `#include "calculs.h"`) para llamarla; el cuerpo real se proporciona en el momento de la vinculación (véase el capítulo sobre la compilación), a partir del archivo objeto compilado desde `calculs.c`.

## `#include <...>` vs `#include "..."`

```c
#include <stdio.h>   // chevrons : cherche dans les répertoires système (bibliothèque standard)
#include "calculs.h" // guillemets : cherche d'abord dans le répertoire courant du projet
```

## Los «include guards»

Un mismo archivo de cabecera puede incluirse indirectamente varias veces (p. ej., `a.h` incluye `commun.h`, y `b.h` también incluye `commun.h`, y `main.c` incluye `a.h` y `b.h`); sin protección, sus declaraciones se duplicarían y provocarían un error de compilación («redefinición»). Un **«include guard»** impide que el preprocesador procese un encabezado más de una vez:

```c
#ifndef CALCULS_H
#define CALCULS_H

int addition(int a, int b);

#endif
```

- Primera inclusión: «`CALCULS_H`» aún no está definido → se incluye todo el contenido, y «`CALCULS_H`» está definido.
- Siguiente inclusión (en el mismo archivo, en otra cadena de inclusiones): `CALCULS_H` ya está definido → el preprocesador salta directamente a `#endif`, el contenido no se duplica.

Una alternativa más breve, compatible con casi todos los compiladores modernos, aunque no está garantizada por el estándar C:

```c
#pragma once

int addition(int a, int b);
```

> **Nota:** un archivo de cabecera solo debe contener **declaraciones** (prototipos de funciones, `struct`, `typedef`, constantes), nunca el cuerpo de una función no `static` /no `inline`; de lo contrario, cada archivo `.c` que lo incluya obtendría su propia copia de la definición, lo que provocaría un error de «definición múltiple» al compilar.
