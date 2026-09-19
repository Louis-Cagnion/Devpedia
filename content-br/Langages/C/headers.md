---
order: 10
---

# Os arquivos de cabeçalho (.h)

Um arquivo de cabeçalho (*header*, extensão `.h`) contém **declarações**: ele anuncia "essa função/variável/estrutura existe e aqui está sua assinatura", sem fornecer sua implementação. Ele permite que vários arquivos `.c` compartilhem as mesmas definições sem duplicá-las, e serve como um contrato entre um arquivo que fornece uma funcionalidade e os arquivos que a usam.

## Declaração vs definição

```c
// calculos.h, declaração: "essa função existe, aqui está sua assinatura"
int adicao(int a, int b);
```

```c
// calculos.c, definição: o corpo real da função
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

## `static` em uma função: nunca expô-la em um header

```c
// utilitários.c
static int quadrado(int x)   // ligação INTERNA: invisível fora de utilitários.c
{
    return x * x;
}

// ligação externa (padrão): declarável em utilitários.h, chamável em outro lugar
int cubo(int x)
{
    return x * quadrado(x);
}
```

`static` aplicado a uma função restringe sua visibilidade ao seu próprio arquivo `.c` (sua *translation unit*): o ligador nunca a vê a partir de outro arquivo, mesmo que seu protótipo tenha sido declarado em um header. É o reflexo comum para uma função utilitária interna, que não tem motivo para ser chamada em outro lugar (ex.: na `libft`, `ft_split.c` declara `static` suas funções internas `ft_cnt_words`, `len_word`, `ft_free`, `write_split`, nunca presentes em `libft.h`).

## `static` em uma variável local: duração de armazenamento estática

```c
char *get_next_line(int fd)
{
    static char *linha_salva;   // mantida entre chamadas, nunca recriada

    // ... usa e atualiza linha_salva ...
    return (linha);
}
```

Em uma **variável local**, `static` muda um aspecto completamente diferente: sua **duração de vida**, não sua visibilidade. Uma variável local comum é recriada a cada chamada da função e destruída no `return` (armazenada na pilha); uma variável local `static` só é inicializada uma vez, na primeira chamada, e depois mantém seu valor de uma chamada para outra (armazenada no mesmo segmento de memória que as variáveis globais). É esse mecanismo que permite a `get_next_line()` "lembrar" o que ainda falta ler depois de um `\n`, sem variável global nem parâmetro extra.

> **Armadilha:** a mesma palavra-chave, dois efeitos sem relação conforme o que ela qualifica: em uma função (seção anterior), `static` restringe a **visibilidade** (ligação interna); em uma variável local, ela muda a **duração de vida**, sem afetar sua visibilidade (sempre limitada à função que a declara).

## `#include <...>` vs `#include "..."`

```c
// colchetes angulares: busca nos diretórios do sistema (biblioteca padrão)
#include <stdio.h>
#include "calculos.h"  // aspas: busca primeiro no diretório atual do projeto
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

## Como `#include` e `-I` realmente se combinam

O pré-processador nunca "adivinha" onde está um arquivo incluído: para `#include "glad/glad.h"`, ele concatena **literalmente** cada pasta passada via [`-I`](/?c=langages&s=c&p=makefiles) com o caminho escrito depois de `#include`, e testa cada resultado até achar um arquivo que exista:

```text
-I includes  +  #include "glad/glad.h"
   ↓
includes/glad/glad.h   <- caminho realmente testado no disco
```

> **Armadilha:** apontar `-I` para a pasta que contém diretamente `glad.h` (ex. `-I includes/glad`) em vez da pasta pai (`-I includes`), enquanto o código escreve `#include "glad/glad.h"`. A concatenação então dá `includes/glad/glad/glad.h`, que não existe: o compilador falha com "arquivo não encontrado", para um caminho que parece correto à primeira vista se só se pensa em "onde está o arquivo", sem reconstruir a concatenação exata.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um header (`.h`) contém declarações, não definições: permite que vários arquivos `.c` compartilhem as mesmas assinaturas sem duplicá-las. O pré-processador resolve `#include "..."` concatenando literalmente cada pasta `-I` com o caminho escrito. `static` em uma função restringe sua visibilidade; em uma variável local, muda sua duração de vida. |
| **Ferramentas utilizáveis** | `#include <...>` (biblioteca do sistema) vs `#include "..."` (arquivo do projeto); include guards (`#ifndef`/`#define`/`#endif` ou `#pragma once`); `static` para uma função interna a um arquivo ou uma variável local persistente. |
| **Armadilhas a evitar** | Colocar o corpo de uma função em um header: provoca um erro "multiple definition" assim que vários arquivos o incluem. Apontar `-I` para o nível de pasta errado, o que quebra a concatenação com o caminho do `#include`. |
| **Boas práticas** | Sempre proteger um header com um include guard, para suportar uma inclusão indireta múltipla sem erro. |
