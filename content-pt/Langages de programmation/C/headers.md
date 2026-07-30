---
order: 6
---

# Os ficheiros de cabeçalho (.h)

Um ficheiro de cabeçalho (*header*, com a extensão `.h`) contém **declarações** — indica que «esta função/variável/estrutura existe e eis a sua assinatura», sem fornecer a sua implementação. Permite que vários ficheiros `.c` partilhem as mesmas definições sem as duplicar e serve de contrato entre um ficheiro que fornece uma funcionalidade e os ficheiros que a utilizam.

## Declaração vs. definição

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

`main.c` basta conhecer a **assinatura** de `addition()` (através do `#include "calculs.h"`) para a chamar — o corpo real é fornecido no momento da ligação (ver capítulo sobre a compilação), a partir do ficheiro objeto compilado a partir de `calculs.c`.

## `#include <...>` vs `#include "..."`

```c
#include <stdio.h>   // chevrons : cherche dans les répertoires système (bibliothèque standard)
#include "calculs.h" // guillemets : cherche d'abord dans le répertoire courant du projet
```

## Os «include guards»

Um mesmo ficheiro de cabeçalho pode ser incluído indiretamente várias vezes (por exemplo, `a.h` inclui `commun.h`, e `b.h` também inclui `commun.h`, e `main.c` inclui `a.h` e `b.h`) — sem proteção, as suas declarações seriam duplicadas e provocariam um erro de compilação («redefinição»). Um **«include guard»** impede que um cabeçalho seja processado mais do que uma vez pelo pré-processador:

```c
#ifndef CALCULS_H
#define CALCULS_H

int addition(int a, int b);

#endif
```

- Primeira inclusão: `CALCULS_H` ainda não está definido → todo o conteúdo é incluído e `CALCULS_H` está definido.
- Inclusão seguinte (no mesmo ficheiro, noutra cadeia de inclusões): `CALCULS_H` já está definido → o pré-processador salta diretamente para `#endif`, o conteúdo não é duplicado.

Uma alternativa mais concisa, suportada por praticamente todos os compiladores modernos, embora não seja garantida pela norma C:

```c
#pragma once

int addition(int a, int b);
```

> **Nota:** um ficheiro de cabeçalho só deve conter **declarações** (protótipos de funções, `struct`, `typedef`, constantes), nunca o corpo de uma função não-`static` /não-`inline` — caso contrário, cada ficheiro `.c` que o inclua obteria a sua própria cópia da definição, provocando um erro de «definição múltipla» durante a ligação de ficheiros.
