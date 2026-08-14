---
order: 6
---

# Os arquivos de cabeçalho (.h)

Um arquivo de cabeçalho (*header*, extensão `.h`) contém **declarações**: ele anuncia "essa função/variável/estrutura existe e aqui está sua assinatura", sem fornecer sua implementação. Ele permite que vários arquivos `.c` compartilhem as mesmas definições sem duplicá-las, e serve como um contrato entre um arquivo que fornece uma funcionalidade e os arquivos que a usam.

## Declaração vs definição

```c
// calculos.h, declaracao: "essa funcao existe, aqui esta sua assinatura"
int adicao(int a, int b);
```

```c
// calculos.c, definicao: o corpo real da funcao
#include "calculos.h"

int adicao(int a, int b)
{
    return a + b;
}
```

```c
// main.c, uso, via o header
#include "calculos.h"

int main(void)
{
    printf("%d\n", adicao(2, 3));
}
```

`main.c` só precisa conhecer a **assinatura** de `adicao()` (via o `#include "calculos.h"`) para chamá-la: o corpo real é fornecido no momento da [ligação](/?c=langages-de-programmation&s=c&p=compilation), a partir do arquivo objeto compilado de `calculos.c`.

## `#include <...>` vs `#include "..."`

```c
#include <stdio.h>     // colchetes angulares: busca nos diretorios do sistema (biblioteca padrao)
#include "calculos.h"  // aspas: busca primeiro no diretorio atual do projeto
```

## Os include guards

Um mesmo header pode ser incluído indiretamente várias vezes (ex.: `a.h` inclui `comum.h`, e `b.h` também inclui `comum.h`, e `main.c` inclui `a.h` e `b.h`): sem proteção, suas declarações seriam duplicadas e provocariam um erro de compilação ("redefinition"). Um **include guard** impede que um header seja processado mais de uma vez pelo preprocessador:

```c
#ifndef CALCULOS_H
#define CALCULOS_H

int adicao(int a, int b);

#endif
```

- Primeira inclusão: `CALCULOS_H` ainda não está definido → todo o conteúdo é incluído, e `CALCULOS_H` é definido.
- Inclusão seguinte (mesmo arquivo, em outra cadeia de includes): `CALCULOS_H` já está definido → o preprocessador pula diretamente para `#endif`, o conteúdo não é duplicado.

Uma alternativa mais curta, suportada pela quase totalidade dos compiladores modernos embora não garantida pelo padrão C:

```c
#pragma once

int adicao(int a, int b);
```

> **Nota:** um header deve conter apenas **declarações** (protótipos de funções, `struct`, `typedef`, constantes), nunca o corpo de uma função não-`static`/não-`inline`: senão, cada arquivo `.c` que o inclui obteria sua própria cópia da definição, provocando um erro "multiple definition" na ligação.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um header (`.h`) contém declarações, não definições: permite que vários arquivos `.c` compartilhem as mesmas assinaturas sem duplicá-las. |
| **Ferramentas utilizáveis** | `#include <...>` (biblioteca do sistema) vs `#include "..."` (arquivo do projeto); include guards (`#ifndef`/`#define`/`#endif` ou `#pragma once`). |
| **Armadilhas a evitar** | Colocar o corpo de uma função em um header: provoca um erro "multiple definition" assim que vários arquivos o incluem. |
| **Boas práticas** | Sempre proteger um header com um include guard, para suportar uma inclusão indireta múltipla sem erro. |
