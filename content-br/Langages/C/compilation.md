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

## Vários arquivos e inlining: unidade de tradução, `static inline`, `-flto`

Uma **unidade de tradução** é um arquivo `.c` tal como a etapa 2 o vê: seu próprio código, mais tudo o que seus `#include` copiaram para ele na etapa 1. O compilador trata **uma única unidade por vez**: ele nunca vê o conteúdo dos outros `.c` do projeto.

Consequência direta para o [inlining](#os-niveis-de-otimizacao-o0-a-o3-os): o compilador só pode copiar o corpo de uma função se o vê. Uma função definida em outro `.c` continua sendo uma chamada de verdade, mesmo em `-O3`.

```c
/* quadrado.h */
int quadrado(int x);                    // só a declaração: o corpo está em outro lugar

/* quadrado.c */
#include "quadrado.h"
int quadrado(int x) { return x * x; }   // a definição, em outra unidade

/* main.c */
#include <stdio.h>
#include "quadrado.h"
int main(void) {
    long soma = 0;
    for (int i = 0; i < 1000; i++)
        soma += quadrado(i);            // main.c só vê a declaração
    printf("%ld\n", soma);              // exibe 332833500
    return 0;
}
```

Três maneiras de obter o inlining apesar da divisão em arquivos, verificadas com [`objdump -d`](https://sourceware.org/binutils/docs/binutils/objdump.html) no executável final:

| Forma de compilar | `call quadrado` em `main`? | Princípio |
|---|---|---|
| `quadrado.c` e `main.c` compilados separadamente (`-O2`) | Sim | Cada unidade é otimizada sozinha: a chamada permanece |
| `static inline int quadrado(int x) { return x * x; }` escrito em `quadrado.h` | Não | O corpo é copiado em cada unidade que inclui o [arquivo de cabeçalho](/?c=langages&s=c&p=headers) |
| `-flto` na compilação **e** na ligação | Não | *Link-Time Optimization*: os `.o` guardam uma forma intermediária do código, e a ligação otimiza o programa inteiro de uma vez |
| `-flto` esquecido só para `main.c` | Sim | Uma unidade compilada sem `-flto` só contém código de máquina: nada a reotimizar |

```bash
gcc -O2 -flto -c main.c -o main.o           # -flto ao compilar CADA arquivo
gcc -O2 -flto -c quadrado.c -o quadrado.o
gcc -O2 -flto main.o quadrado.o -o prog     # ... e ao ligar
```

| Método | Vantagem | Desvantagem |
|---|---|---|
| Tudo em um único `.c` | Nenhuma opção a lembrar | Arquivo longo, difícil de ler |
| `static inline` em um arquivo de cabeçalho | Funciona com qualquer compilação | Reservado a funções pequenas; uma cópia por unidade que a usa |
| `-flto` | Inlining entre todos os arquivos, sem mudar o código | Ligação mais lenta; esquecê-lo em um único arquivo passa despercebido |

> **Armadilha:** uma função comum (sem `static`) definida em um arquivo de cabeçalho incluído por dois `.c` provoca o erro `multiple definition of 'quadrado'` na ligação: cada unidade contém uma cópia pública. E `inline` sozinho, sem `static`, segue em C regras sutis (é preciso também uma definição não `inline` em um único `.c`): `static inline` é a forma segura.

**O que isso muda na prática.** O [solucionador SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) do projeto de onde vêm estas medições passou de um único arquivo de 1 424 linhas para 7 arquivos `.c`. As funções chamadas a cada passo do cálculo (centenas de milhões de vezes por grade) ficaram todas na mesma unidade, ou viraram `static inline` nos arquivos de cabeçalho. Resultado: nenhuma lentidão (até 2,7 % mais rápido), e `-flto` não trouxe nada a mais (+0,9 % em relação ao arquivo único, e até 3,8 % mais lento que a divisão sozinha). Dividir um programa não custa nada, desde que se mantenha junto o que se chama com muita frequência: [medir](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) antes e depois da divisão.

## A otimização guiada por perfil (PGO)

Na compilação, o `gcc` não sabe quais ramos de um `if` serão tomados com mais frequência: ele adivinha. A **otimização guiada por perfil** (*Profile-Guided Optimization*, PGO) substitui esse palpite por contagens reais, medidas em uma execução de teste, para organizar melhor o código: os caminhos frequentes em um só bloco, os caminhos raros deixados de lado.

```text
ramo.c --[gcc -fprofile-generate]--> ramo (instrumentado, conta suas passagens)
ramo   --[execução de treino]--> ramo.gcda (o perfil: as contagens)
ramo.c + ramo.gcda --[gcc -fprofile-use]--> ramo (otimizado a partir das contagens)
```

```c
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    int n = argc > 1 ? atoi(argv[1]) : 1000, pequenos = 0, grandes = 0;
    for (int i = 0; i < n; i++) {
        if (i % 100 == 0) grandes++;    // ramo raro: 1 vez em 100
        else pequenos++;                // ramo frequente
    }
    printf("%d pequenos, %d grandes\n", pequenos, grandes);
    return 0;
}
```

```bash
gcc -O2 -fprofile-generate ramo.c -o ramo   # 1. versão instrumentada
./ramo 1000000                              # 2. treino: escreve ramo.gcda ao sair
gcc -O2 -fprofile-use ramo.c -o ramo        # 3. recompilação a partir do perfil
```

As opções estão descritas na [documentação do GCC](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html). No solucionador SAT citado acima, a PGO ganhou 3,4 %, com exatamente o mesmo trabalho realizado (mesmos contadores de cálculo): um ganho modesto, mas gratuito depois de automatizado em um [Makefile](/?c=langages&s=c&p=makefiles).

| Armadilha | O que acontece | Solução |
|---|---|---|
| Nome de saída diferente entre as etapas 1 e 3 (`-o ramo_instr`, depois `-o ramo`) | O perfil se chama `ramo_instr-ramo.gcda`, a etapa 3 procura `ramo.gcda`: um simples **aviso** `profile count data file not found`, e o programa é compilado **sem** PGO | Mesmo nome de saída (ou mesmos arquivos `.o`) nas duas etapas, e verificar a ausência desse aviso |
| Fontes modificadas depois do treino | Erro `coverage-mismatch`: o perfil não corresponde mais ao código | Refazer as três etapas a cada modificação |
| Programa encerrado por `_exit()`, morto por um sinal, ou processo filho que sai por `_exit()` | Nenhum `.gcda` escrito: o perfil é gravado pela saída normal ([`exit()` ou `return` em `main`](/?c=langages&s=c&p=exit-et-codes-de-retour)), que `_exit()` pula | Treinar com uma execução que termine normalmente (no solucionador: em um único processo, sem os [processos filhos](/?c=langages&s=c&p=processus) do modo paralelo) |
| Treinar com os mesmos dados da medição de velocidade | O programa é otimizado para o próprio teste: ganho superestimado | Treinar com entradas diferentes das usadas na medição |

## O canário de pilha (`-fstack-protector`)

Um [estouro de buffer](/?c=securite&s=securite-offensive&p=corruption-memoire#o-buffer-overflow-escrever-alem-do-espaco-reservado) na pilha pode sobrescrever o endereço para o qual a função deve voltar. O **canário** é um valor secreto que o compilador coloca entre os arrays locais e esse endereço, e verifica logo antes de voltar: se mudou, o programa para na hora (o nome vem dos canários que os mineiros levavam para detectar o gás antes que fosse tarde demais).

```c
#include <stdio.h>
__attribute__((noinline)) static void copiar(const char *texto) {
    char buffer[8];                     // 8 bytes reservados na pilha
    for (int i = 0; texto[i]; i++)      // cópia sem verificar o tamanho
        buffer[i] = texto[i];
    printf("copiado: %.8s\n", buffer);
}
int main(int argc, char **argv) {
    copiar(argc > 1 ? argv[1] : "curto");
    return 0;
}
```

Com um argumento de 40 caracteres (o buffer só comporta 8):

| Compilação | Saída | Código de saída |
|---|---|---|
| `gcc -O2` (padrão do GCC do Ubuntu: `-fstack-protector-strong`) | `copiado: AAAAAAAA` e depois `*** stack smashing detected ***: terminated` | 134: parada voluntária ([sinal](/?c=langages&s=c&p=signaux-unix#os-sinais-comuns) `SIGABRT`, 128 + 6) |
| `gcc -O2 -fno-stack-protector` | `copiado: AAAAAAAA` e depois uma falha | 139: falha de segmentação (`SIGSEGV`, 128 + 11), mais tarde e de forma menos clara |

O custo: algumas instruções em cada função que tem um array local (`objdump -d` mostra a leitura do valor secreto, `mov %fs:0x28`, sua comparação na volta e a chamada a `__stack_chk_fail`). No solucionador SAT, `-fno-stack-protector` ganhou cerca de 1 %.

> **Armadilha:** com `strcpy()` no lugar do laço, a mensagem passa a ser `*** buffer overflow detected ***`, mesmo com `-fno-stack-protector`. É **outra** proteção do Ubuntu, [`_FORTIFY_SOURCE`](https://man7.org/linux/man-pages/man7/feature_test_macros.7.html), que em `-O2` troca as funções de cópia conhecidas por versões verificadas. Retirar o canário não retira, portanto, todas as proteções, e uma cópia escrita à mão só é coberta pelo canário.

| Situação | Canário |
|---|---|
| Programa que lê dados externos (arquivos recebidos, rede, entrada de um usuário) | Mantê-lo, sempre |
| Programa de cálculo com entradas já validadas, em que cada ponto percentual conta | Retirá-lo é aceitável, **depois** de medir o ganho |

## Verificar na compilação: `_Static_assert`

Um controle comum (`if`, `assert`) executa **quando o programa roda**: um valor incoerente é descoberto tarde, às vezes nunca. `_Static_assert(condição, "mensagem");` (C11) verifica uma condição **durante a compilação**: se for falsa, a compilação para com a mensagem e nenhum programa é produzido. Não custa nada na execução, pois não gera código algum.

| Ferramenta | Verifica | Condição sobre | Se a condição é falsa |
|---|---|---|---|
| `if` + mensagem de erro | na execução | quaisquer valores | mensagem, caminho de falha previsto pelo programa |
| `assert(c)` (`<assert.h>`) | na execução, retirado pela opção `-DNDEBUG` (explicada abaixo) | quaisquer valores | parada brusca do programa |
| `_Static_assert(c, "m")` | na compilação | somente **constantes** | compilação recusada |

A condição deve ser uma **expressão constante inteira**: calculável pelo compilador sem executar o programa (números escritos, `sizeof`, constantes `#define`).

**Caso típico: constantes sobrescrevíveis por `-D`.** A opção `-DNOME=valor` do `gcc` define uma macro como se o arquivo começasse com `#define NOME valor`. Um projeto a usa para ajustar limites sem mexer no código; um `#ifndef` («se não definido») dá o valor padrão. Nada garante então que os valores fornecidos continuem coerentes entre si:

```c
#ifndef ZOOM_MIN                  /* se a linha de comando não o definiu... */
# define ZOOM_MIN 1               /* ...valor padrão */
#endif
#ifndef ZOOM_MAX
# define ZOOM_MAX 10
#endif

_Static_assert(ZOOM_MIN < ZOOM_MAX, "ZOOM_MIN deve ser menor que ZOOM_MAX");
```

```text
$ gcc -std=c11 -DZOOM_MIN=20 main.c
main.c:10:1: error: static assertion failed: "ZOOM_MIN deve ser menor que ZOOM_MAX"
```

Sem essa verificação, nada sinaliza o erro: um `clamp` (limitar um valor entre um mínimo e um máximo) escrito `fminf(fmaxf(x, ZOOM_MIN), ZOOM_MAX)` com mínimo 20 e máximo 10 devolve **sempre 10**, qualquer que seja `x` (medido com `x = 5`). A mensagem nomeia a constante defeituosa e a relação esperada.

`_Static_assert` também serve para verificar uma hipótese sobre a máquina, por exemplo `_Static_assert(sizeof(int) >= 4, "int pequeno demais");`, para que um programa compilado numa plataforma inesperada falhe na compilação e não na execução. Em C11, também existe `static_assert` (sem o sublinhado inicial), via `#include <assert.h>`; desde o C23 (`-std=c2x` no `gcc` 13), é uma palavra-chave e a mensagem é opcional.

**Constantes de ponto flutuante: um aviso a silenciar somente naquele ponto.** Uma comparação de `float` (`NEAR_PLANE < FAR_PLANE`) não é uma expressão constante *inteira*: o `gcc` a aceita, mas a opção `-Wpedantic` («pedante»: avisar de tudo o que a norma C não permite estritamente) a sinaliza:

```text
warning: expression in static assertion is not an integer constant expression [-Wpedantic]
```

Uma diretiva `#pragma` é uma instrução dada ao compilador (como `#pragma once`, veja [Os arquivos de cabeçalho](/?c=langages-de-programmation&s=c&p=headers)). Três linhas `#pragma GCC diagnostic` limitam o silêncio à asserção:

```c
#pragma GCC diagnostic push                       /* salva o estado dos avisos */
#pragma GCC diagnostic ignored "-Wpedantic"       /* desliga este a partir daqui */
_Static_assert(NEAR_PLANE > 0.0f && NEAR_PLANE < FAR_PLANE, "planos near/far incoerentes");
#pragma GCC diagnostic pop                        /* restaura: o resto do arquivo continua controlado */
```

`push` e `pop` delimitam o silêncio: desligar `-Wpedantic` para o arquivo inteiro esconderia problemas reais em outros lugares. Essas diretivas são reconhecidas pelo `gcc` e pelo `clang` (não pelo compilador da Microsoft, que tem sua própria sintaxe).

> **Armadilha:** `_Static_assert` não pode testar um valor lido na execução (argumento de função, variável, entrada do usuário): para esses, ainda é preciso um `if` com uma mensagem de erro.

## Quando um `snprintf` pode truncar: `-Wformat-truncation`

`snprintf(buffer, tamanho, formato, ...)` nunca escreve mais que `tamanho` bytes: não estoura, mas **trunca em silêncio** se o resultado for mais longo. O compilador costuma conseguir prever isso: o aviso `-Wformat-truncation` (nível 1, incluído em `-Wall`) dispara quando ele prova que o resultado **pode** ultrapassar o buffer. Ele conhece o comprimento máximo de um `%s` quando uma **precisão** o limita: `%.200s` escreve no máximo 200 caracteres.

```c
#include <stdio.h>

int main(int argc, char **argv)
{
	char path[64];                                  /* 64 bytes, '\0' incluído */

	if (argc < 3)
		return 1;
	snprintf(path, sizeof path, "%.200s/shaders/%.200s", argv[1], argv[2]);
	puts(path);
	return 0;
}
```

```text
$ gcc -Wall -c main.c
main.c:9:38: warning: '%.200s' directive output may be truncated writing up to 200 bytes into a region of size 64 [-Wformat-truncation=]
note: '__builtin___snprintf_chk' output between 10 and 410 bytes into a destination of size 64
```

Com dois argumentos de 100 caracteres, o programa guarda só 63 caracteres do caminho (o 64º byte é o `\0` final): sem o aviso nada sinaliza, e o programa abre depois um arquivo que não é o pedido. O aviso quantifica o pior caso: `200 + 9 + 200` caracteres mais o `\0`, ou seja 410 bytes para um buffer de 64.

**Dimensionar o buffer para o pior caso, não para o caso comum.** O tamanho se calcula somando os máximos de cada campo (cada um limitado por sua precisão), o texto fixo e 1 para o `\0`:

| Parte do formato | Bytes no máximo |
|---|---|
| `%.200s` (diretório) | 200 |
| `/shaders/` (texto fixo) | 9 |
| `%.200s` (nome) | 200 |
| `\0` final | 1 |
| **Total** | **410** |

```c
#define DIR_MAX 200
#define NAME_MAX_LEN 200

/* tamanho do pior caso: 200 + 9 + 200 + '\0' */
char path[DIR_MAX + sizeof "/shaders/" + NAME_MAX_LEN];

snprintf(path, sizeof path, "%.*s/shaders/%.*s", DIR_MAX, argv[1], NAME_MAX_LEN, argv[2]);
```

`sizeof "/shaders/"` vale 10: já conta o `\0`. As constantes nomeadas servem ao mesmo tempo ao buffer e às precisões (`%.*s` recebe a precisão como argumento), então não podem mais se dessincronizar. O mesmo programa deixa então de produzir avisos.

| O que não fazer | Por quê |
|---|---|
| Adicionar `-Wno-format-truncation` para calar o aviso | O truncamento continua: só o sinal some |
| Aumentar o buffer «no chute» (`char path[256]`) | Nada prova que 256 basta: refazer a soma dos máximos |
| Ignorar o valor devolvido por `snprintf` | Ele dá o comprimento que teria sido escrito: `n >= sizeof path` significa truncado |

Quando os comprimentos não são limitados na compilação (um caminho lido de fora), o aviso não pode provar nada: testar o retorno (`n < 0 || (size_t)n >= sizeof path`) e recusar com uma mensagem que nomeie o valor longo demais. O nível 2 (`-Wformat-truncation=2`, veja a [documentação do GCC](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html)) estende a análise aos casos de comprimento desconhecido; é mais barulhento. Para o `snprintf` em si, veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire).

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
| **Para lembrar** | Um programa C passa por 4 etapas antes da execução: preprocessador → compilação (assembly) → montagem (código de máquina, `.o`) → ligação (executável final). O nível de otimização (`-O0` a `-O3`, `-Os`) é ajustado na etapa de compilação. O compilador só vê uma unidade de tradução por vez: sem `static inline` nem `-flto`, uma função de outro `.c` nunca é inlinada. A PGO otimiza a partir de uma execução de teste; o canário de pilha para um programa cujo buffer local transbordou. `_Static_assert(condição, "mensagem")` verifica uma condição constante na compilação, sem custo na execução. |
| **Ferramentas utilizáveis** | `gcc -E`/`-S`/`-c` para observar cada etapa separadamente; `-O0` a `-O3`/`-Os` para ajustar o nível de otimização; `-march=native` para o processador da máquina; `-pthread` para um programa com threads; `static inline` e `-flto` para o inlining entre arquivos; `-fprofile-generate`/`-fprofile-use` para a PGO; `objdump -d` para verificar o código gerado. `_Static_assert` (C11); `-DNOME=valor` para ajustar uma constante; `#pragma GCC diagnostic push`/`ignored`/`pop` para desligar um aviso em poucas linhas. |
| **Armadilhas a evitar** | Confundir um erro de compilação (sintaxe) com um erro de ligação (`undefined reference`, função nunca ligada): a mensagem indica a etapa envolvida. Um aviso invisível em `-O0` (oculto por duas funções não inlinadas) pode aparecer, ou até bloquear a compilação com `-Werror`, já a partir de `-O2`. Esquecer `-flto` em um único arquivo, ou mudar o nome de saída entre as duas etapas da PGO: a otimização desaparece sem nenhum erro. Retirar o canário de um programa que lê dados externos. Deixar constantes sobrescrevíveis por `-D` sem verificar sua coerência (um `clamp` cujo mínimo supera o máximo devolve sempre o máximo), desligar `-Wpedantic` para um arquivo inteiro, testar com `_Static_assert` um valor conhecido só na execução. |
| **Boas práticas** | Compilar cada arquivo `.c` em `.o` separadamente em um projeto com vários arquivos, para ligar apenas o que mudou em vez de recompilar tudo. Testar a compilação no nível de otimização realmente usado em produção, não apenas em `-O0`. Manter em uma mesma unidade (ou em `static inline`) as funções chamadas com muita frequência, e medir antes e depois de qualquer divisão ou mudança de opção. Verificar na compilação, com uma mensagem que nomeie a constante defeituosa, a coerência das constantes entre si e as hipóteses sobre a máquina; limitar um `#pragma GCC diagnostic ignored` com `push` e `pop`. |
