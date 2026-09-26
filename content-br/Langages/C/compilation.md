---
order: 11
---

# O processo de compilação

Ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), interpretados diretamente na execução, um programa C precisa ser **traduzido em código de máquina** antes de poder ser executado. Essa tradução acontece em quatro etapas distintas, geralmente invisíveis atrás de um único comando ([`gcc`](https://gcc.gnu.org) `main.c -o programa`), mas que vale a pena saber separar para entender certos erros.

## As quatro etapas

```text
main.c --[1. preprocessador]--> main.i --[2. compilacao]--> main.s --[3. montagem]--> main.o --[4. ligacao]--> programa
```

### 1. O preprocessador

Processa tudo que começa com `#` **antes** de o compilador ver o código: substitui os `#include` pelo conteúdo real do arquivo incluído, substitui as macros `#define`, resolve os `#ifdef`/`#ifndef`. O resultado é um único arquivo fonte, "achatado", sem mais nenhuma diretiva `#`.

```bash
gcc -E main.c -o main.i
```

### 2. A compilação propriamente dita

Traduz o código fonte (C) em **assembly**, uma linguagem ainda legível por um humano mas bem próxima das instruções do processador.

```bash
gcc -S main.i -o main.s
```

### 3. A montagem

Traduz o assembly em **código de máquina binário**, agrupado em um arquivo objeto (`.o`). Esse arquivo já contém instruções executáveis, mas ainda não é um programa completo: as chamadas a funções externas (como `printf`) ainda não estão resolvidas.

```bash
gcc -c main.s -o main.o
```

### 4. A ligação (*linking*)

Junta um ou vários arquivos `.o` entre si, e resolve as referências a funções definidas em outro lugar (em outros arquivos `.o`, ou em [bibliotecas](/?c=langages-de-programmation&s=c&p=bibliotheques)) para produzir um executável final completo.

```bash
gcc main.o -o programa
```

## Por que separar compilação e ligação

Um projeto com vários arquivos fonte pode compilar cada `.c` em `.o` independentemente, e depois ligar (*link*) apenas os arquivos que mudaram: mais rápido do que uma recompilação completa a cada modificação. É exatamente isso que um [**Makefile**](/?c=langages-de-programmation&s=c&p=makefiles) automatiza:

```bash
gcc -c arquivo1.c -o arquivo1.o
gcc -c arquivo2.c -o arquivo2.o
gcc arquivo1.o arquivo2.o -o programa
```

## Os níveis de otimização (`-O0` a `-O3`, `-Os`)

Uma vez que o programa compila, `gcc`/[Clang](https://clang.llvm.org) podem reescrever o código de máquina produzido na etapa 2 para torná-lo mais rápido, sem mudar seu comportamento observável. Esse ajuste é feito com a opção `-O`:

| Nível | Efeito |
|---|---|
| `-O0` | Sem otimização (comportamento padrão): compilação rápida, código de máquina que segue o código-fonte passo a passo -- o mais fácil de acompanhar em um depurador |
| `-O1` | Otimizações básicas, ganho modesto, compilação ainda rápida |
| `-O2` | Nível recomendado em produção: inlining, eliminação de código morto, desenrolamento de laços (veja abaixo), sem disparar o tamanho do binário |
| `-O3` | Leva `-O2` mais longe (vetorização agressiva, inlining mais amplo): ganho às vezes marginal dependendo do programa, binário maior, compilação mais longa |
| `-Os` | Otimiza o tamanho do binário em vez da velocidade (útil em ambientes embarcados, com espaço em disco limitado) |

Três técnicas comuns explicam o ganho:

- **Inlining**: o corpo de uma função pequena é copiado diretamente em cada lugar onde é chamada, evitando o custo de uma chamada real (salvar contexto, salto, retorno).
- **Eliminação de código morto**: qualquer cálculo cujo resultado nunca é usado é removido do binário final.
- **Desenrolamento de laços** (*loop unrolling*): o corpo de um laço é duplicado várias vezes para reduzir o número de iterações (e, portanto, de verificações de condição), ao custo de um binário maior.

```bash
gcc -O2 main.c -o programme
```

> **Armadilha:** o inlining pode fazer aparecer um aviso invisível em `-O0`. Exemplo: uma função que retorna `-1` em caso de erro, cujo resultado é depois usado para calcular um tamanho passado a `malloc()`. Em `-O0`, o compilador vê duas funções separadas e não consegue relacionar os dois valores. Uma vez inlinada por `-O2`, ele vê o cálculo completo de uma vez e pode detectar que `malloc()` receberia um tamanho negativo (portanto gigantesco ao ser convertido para `size_t`) -- sinalizado por `-Walloc-size-larger-than=` (incluído em `-Wall -Wextra`, veja [Os Makefiles](/?c=langages-de-programmation&s=c&p=makefiles)), que se torna um erro bloqueante se `-Werror` estiver ativo. Um código sem avisos em `-O0` pode, portanto, falhar ao compilar em `-O2`: sempre testar a compilação no nível de otimização realmente usado em produção, não apenas em `-O0`.

## Mirar no processador (`-march=native`) e compilar com threads (`-pthread`)

Por padrão, o compilador produz um programa que roda em **todos** os processadores da mesma família, inclusive os mais antigos: ele se proíbe as instruções recentes. `-march=native` o autoriza a usar todas as instruções do processador **da máquina que compila**.

```bash
gcc -O2 -march=native -c contar.c    # contar.c: return __builtin_popcount(x);
```

| Compilação | Código produzido para `__builtin_popcount(x)` (verificado com `objdump -d`) |
|---|---|
| `gcc -O2` | Uma chamada a uma função auxiliar que conta os bits em várias etapas |
| `gcc -O2 -march=native` | Uma única instrução do processador, `popcnt` |

> **Armadilha:** um programa compilado com `-march=native` pode parar com o erro `Illegal instruction` em uma máquina com processador mais antigo. Reservar para programas que rodam na máquina onde são compilados (cálculo, medições), nunca para um executável distribuído.

Para um programa que usa [threads](/?c=langages&s=c&p=threads), passa-se `-pthread` **na compilação e na ligação**:

```bash
gcc -Wall -pthread -o programa programa.c
```

| Opção | Efeito |
|---|---|
| `-pthread` | Define os ajustes de que as threads precisam (a macro `_REENTRANT`) **e** acrescenta a biblioteca de threads na ligação |
| `-lpthread` | Só acrescenta a biblioteca, sem os ajustes de compilação |

Desde a versão 2.34 da biblioteca C do Linux (glibc), as funções de threads fazem parte da própria biblioteca C: um programa muitas vezes é ligado mesmo sem opção. `-pthread` continua sendo a forma portável de compilar, válida também em sistemas mais antigos.

## Erros de compilação vs erros de ligação

Saber em qual etapa um erro ocorre ajuda a diagnosticá-lo:

| Mensagem típica | Etapa envolvida | Causa frequente |
|---|---|---|
| `error: expected ';' before...` | Compilação | Erro de sintaxe no código fonte |
| `fatal error: xxx.h: No such file or directory` | Preprocessador | Arquivo de cabeçalho não encontrado (veja [Os arquivos de cabeçalho](/?c=langages-de-programmation&s=c&p=headers)) |
| `undefined reference to 'minha_funcao'` | Ligação | Função declarada mas nunca definida/ligada (arquivo `.o` ou biblioteca ausente) |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um programa C passa por 4 etapas antes da execução: preprocessador → compilação (assembly) → montagem (código de máquina, `.o`) → ligação (executável final). O nível de otimização (`-O0` a `-O3`, `-Os`) é ajustado na etapa de compilação. |
| **Ferramentas utilizáveis** | `gcc -E`/`-S`/`-c` para observar cada etapa separadamente; `-O0` a `-O3`/`-Os` para ajustar o nível de otimização; `-march=native` para o processador da máquina; `-pthread` para um programa com threads. |
| **Armadilhas a evitar** | Confundir um erro de compilação (sintaxe) com um erro de ligação (`undefined reference`, função nunca ligada): a mensagem indica a etapa envolvida. Um aviso invisível em `-O0` (oculto por duas funções não inlinadas) pode aparecer, ou até bloquear a compilação com `-Werror`, já a partir de `-O2`. |
| **Boas práticas** | Compilar cada arquivo `.c` em `.o` separadamente em um projeto com vários arquivos, para ligar apenas o que mudou em vez de recompilar tudo. Testar a compilação no nível de otimização realmente usado em produção, não apenas em `-O0`. |
