---
order: 12
---

# `constexpr` e as constantes em C++ (28/10/2026)

Um programa manipula valores que nunca mudam: o tamanho de uma casa em um jogo (64 pixels, sendo um **pixel** um ponto da tela), o número máximo de vidas, o valor de pi. Uma **constante** é um desses valores, associado a um nome e que não muda mais, em oposição a uma [variável](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), cujo valor pode mudar. O C++ oferece três ferramentas para criar constantes: `#define`, `const` e [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr). Elas se usam quase da mesma forma e se distinguem pelo **momento em que o valor é conhecido**, pelo seu **tipo** e pelo seu **escopo** (a zona do código em que o nome existe). Este capítulo as compara com um fio condutor: o tamanho de uma casa, `TILE_SIZE = 64`, guardado em uma classe de jogo (a palavra inglesa *tile* designa uma casa do tabuleiro).

| Tema | Pergunta a que responde | Seção |
|---|---|---|
| O problema | Por que dar um nome a um valor em vez de escrevê-lo em todo lugar? | [Uma constante](#uma-constante-dar-um-nome-a-um-valor) |
| Dois momentos | O que são a compilação, a execução e uma expressão constante? | [Compilação e execução](#compilacao-e-execucao-dois-momentos) |
| As três ferramentas | O que faz cada uma, e que risco se corre? | [`#define`](#define-uma-substituicao-de-texto), [`const`](#const-um-valor-fixado-na-inicializacao), [`constexpr`](#constexpr-um-valor-conhecido-na-compilacao) |
| Comparação | Qual escolher conforme a necessidade? | [A tabela comparativa](#comparar-define-const-e-constexpr) |
| Dentro de uma classe | Onde guardar `TILE_SIZE`, e como lê-lo de fora? | [O escopo](#o-escopo-de-uma-constante), [o membro `static constexpr`](#o-membro-static-constexpr-de-uma-classe) |
| Conforme o padrão | O que muda no C++17? O que `constexpr` pode calcular? | [Antes e a partir do C++17](#antes-e-a-partir-do-c-17-a-definicao-fora-da-classe), [funções e `static_assert`](#o-que-constexpr-sabe-calcular-funcoes-e-static-assert) |

O capítulo pressupõe conhecidos [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) e seus tipos, [as classes e objetos](/?c=langages&s=cpp&p=classes-et-objets) (incluindo `public` e `private`) e [os espaços de nomes](/?c=langages&s=cpp&p=espaces-de-noms). Para o preprocessador e a opção `-D`, ele se apoia em [o processo de compilação](/?c=langages&s=c&p=compilation), escrito para C, mas válido tal qual em C++. Os valores que dependem da versão da linguagem são citados por **padrão** (ou **norma**: uma versão oficial da linguagem, C++11, C++14, C++17, C++20). Todos os exemplos foram compilados com `g++`, o compilador C++ do GCC (*GNU Compiler Collection*, uma suíte de compiladores livres), a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal):

```bash
# -std=c++17 : escolhe o padrão ; -Wall -Wextra -pedantic : exibem os avisos
# -o programa : nome do arquivo produzido ; ./programa : executa este arquivo
g++ -std=c++17 -Wall -Wextra -pedantic arquivo.cpp -o programa
./programa
```

## Uma constante: dar um nome a um valor

Um **literal** é um valor escrito diretamente no código: `64`, `3.14`, `'a'`, `"texto"`, `true`. No programa a seguir, `int` é o **tipo** «número inteiro» (ver [a variável](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)) e `#include <iostream>` insere o cabeçalho que fornece `std::cout` (ver [os arquivos de cabeçalho](/?c=langages&s=c&p=headers) e [os espaços de nomes](/?c=langages&s=cpp&p=espaces-de-noms) para o prefixo `std::`). O operador `<<` envia um valor para `std::cout`, e `"\n"` é uma quebra de linha.

```cpp
#include <iostream>   // std::cout: exibe texto no terminal

int main()   // ponto de entrada: o programa começa aqui
{
    int largura = 10 * 64;      // 10 casas de largura: 64 é o tamanho de uma casa?
    int altura = 8 * 64;        // 8 casas de altura: o mesmo 64, reescrito
    int inicioCasa3 = 3 * 64;   // pixel onde começa a casa 3: ainda 64
    std::cout << largura << " x " << altura << ", casa 3 em x = " << inicioCasa3 << "\n";
    return 0;   // 0: o programa terminou corretamente
}
```

```text
640 x 512, casa 3 em x = 192
```

O literal `64` aparece três vezes sem nome: é um **número mágico**, cujo sentido o leitor precisa adivinhar. Passar as casas para 48 pixels obriga a encontrar cada `64` sem confundir os que designam outra coisa. Dar um nome ao valor resolve os dois problemas: o sentido fica escrito, e a mudança é feita em um único lugar. Eis as três escritas possíveis, lado a lado:

```cpp
#include <iostream>   // std::cout: exibe texto no terminal

#define TAMANHO_MACRO 64                // macro: o preprocessador troca este nome por 64
const int TAMANHO_CONST = 64;           // const: variável do tipo int somente leitura
constexpr int TAMANHO_CONSTEXPR = 64;   // constexpr: constante int conhecida na compilação

int main()
{
    // os três nomes são usados da mesma forma e exibem o mesmo valor
    std::cout << TAMANHO_MACRO << " " << TAMANHO_CONST << " " << TAMANHO_CONSTEXPR << "\n";
    return 0;
}
```

```text
64 64 64
```

| Escrita | O que é |
|---|---|
| `#define TAMANHO_MACRO 64` | Uma **macro**: um texto que o preprocessador substituirá antes da compilação |
| `const int TAMANHO_CONST = 64;` | Uma **variável** que se proíbe de modificar |
| `constexpr int TAMANHO_CONSTEXPR = 64;` | Uma **constante** cujo valor o compilador conhece |

## Compilação e execução: dois momentos

Um programa C++ existe em dois momentos distintos, detalhados em [o processo de compilação](/?c=langages&s=c&p=compilation):

```text
 arquivo .cpp --[ compilação: g++ ]--> programa --[ execução: ./programa ]--> resultado
 (seu texto)     o compilador lê       (um arquivo) o programa roda;
                 o código; ele não vê                ele lê o teclado, arquivos,
                 nenhuma entrada                     a rede...
```

| Momento | Definição | O que nele é conhecido |
|---|---|---|
| **Compilação** | O **compilador** traduz o texto do código em um programa que o computador sabe executar | O que está escrito no código: literais, constantes, cálculos sobre esses valores |
| **Execução** | O programa roda | Além disso: o que o usuário digita, o conteúdo de um arquivo, a hora |

Uma **expressão** é um cálculo escrito no código (`8 * 8`, `x + 1`). Uma **expressão constante** é uma expressão que o compilador consegue calcular sozinho, sem executar o programa, porque depende apenas de valores conhecidos na compilação. A tabela a seguir cita `lerTamanho()`, uma **função** (um bloco de código com nome, que se chama para obter um resultado) que lê um número do teclado; ela aparece em vários exemplos do capítulo.

| Expressão | Constante? | Por quê |
|---|---|---|
| `64` | sim | um literal |
| `8 * 8` | sim | um cálculo sobre literais |
| `TILE_SIZE * 10` (com `TILE_SIZE` definido como 64) | sim | um cálculo sobre uma constante conhecida |
| `lerTamanho()` (função que lê o teclado) | não | o resultado depende do que o usuário digita |

Alguns pontos da linguagem **exigem** uma expressão constante: o tamanho de um **vetor** (uma fileira de casas contíguas do mesmo tipo, por exemplo 80 inteiros: `casas[0]` designa a primeira, `casas[1]` a seguinte), o valor escrito entre `<` e `>` em um [template](/?c=langages&s=cpp&p=templates), como o 80 de `std::array<int, 80>`, e a condição de um [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert) (uma verificação feita na compilação, vista mais adiante). As três ferramentas do capítulo se julgam primeiro por essa exigência.

## `#define`: uma substituição de texto

O **preprocessador** é a primeira etapa da compilação: um programa que lê o código antes do compilador e trata toda linha que começa com `#` (ver [o preprocessador](/?c=langages&s=c&p=compilation#1-o-preprocessador)). A linha `#define NOME texto` cria uma **macro**: em todo lugar onde `NOME` aparece depois, o preprocessador o substitui por `texto`, como a função «localizar e substituir» de um editor de texto.

```cpp
#include <iostream>   // std::cout: exibe texto no terminal

#define TILE_SIZE 64                      // o preprocessador substituirá TILE_SIZE por 64
#define LARGURA_JANELA (TILE_SIZE * 10)   // o nome de uma macro pode conter outro

int main()
{
    std::cout << LARGURA_JANELA << "\n";   // vira: std::cout << (64 * 10) << "\n";
    return 0;
}
```

```text
640
```

Pode-se pedir ao preprocessador que pare depois do seu trabalho e exiba o resultado. O arquivo acima se chama aqui `macro.cpp`:

```bash
# -E : para depois do preprocessador ; -P : não acrescenta linhas de referência
# | : envia o resultado do g++ para o comando seguinte
# tail -n 5 : mantém as 5 últimas linhas
g++ -std=c++17 -E -P macro.cpp | tail -n 5
```

```text
int main()
{
    std::cout << (64 * 10) << "\n";
    return 0;
}
```

`LARGURA_JANELA` e `TILE_SIZE` desapareceram: o compilador vê apenas `(64 * 10)`. Três consequências decorrem disso.

### Nenhum tipo

O compilador vê apenas o texto substituído: o tipo de uma macro é simplesmente o do texto (`64` é um inteiro, `0.5` um número de ponto flutuante), nunca um tipo escolhido. Com `constexpr`, o tipo se escreve:

```cpp
#include <iostream>   // std::cout

#define RATIO_MACRO 0.5                  // nenhum tipo escrito: 0.5 é um double
constexpr float RATIO_CONSTEXPR = 0.5;   // o tipo está escrito: float

int main()
{
    // sizeof dá o tamanho em bytes (um byte: a unidade de medida da memória)
    std::cout << sizeof(RATIO_MACRO) << " " << sizeof(RATIO_CONSTEXPR) << "\n";
    return 0;
}
```

```text
8 4
```

`sizeof` dá o tamanho de um valor em bytes. `float` e `double` são dois tipos de número de ponto flutuante; o `double`, mais preciso, ocupa 8 bytes. O literal `0.5` é um `double`, enquanto a constante declarada `float` ocupa apenas 4.

### Nenhum escopo

Uma macro existe da linha `#define` até o fim do arquivo, qualquer que seja o lugar onde foi escrita: em uma função, em uma classe, em um espaço de nomes. Arquivo `macro_escopo.cpp`:

```cpp
#include <iostream>   // std::cout

void desenhar()
{
#define MARGEM 8   // definida aqui, no meio de uma função...
    std::cout << "desenhar : " << MARGEM << "\n";
}

void mover()
{
    std::cout << "mover : " << MARGEM << "\n";   // ...mas visível aqui: não há escopo
}

int main()
{
    desenhar();   // chama a primeira função
    mover();      // chama a segunda
    return 0;
}
```

```text
desenhar : 8
mover : 8
```

### Colisões conforme a ordem de inclusão

Dois arquivos de cabeçalho de [bibliotecas](/?c=langages&s=c&p=bibliotheques) diferentes podem definir uma macro com o mesmo nome. O arquivo `lib_a.h`, com sua **guarda de inclusão** (o `#ifndef` «se não definido», fechado por `#endif`, que impede inserir um arquivo duas vezes; ver [os cabeçalhos](/?c=langages&s=c&p=headers)):

```cpp
#ifndef LIB_A_H      // guarda de inclusão: este arquivo só é inserido uma vez por programa
#define LIB_A_H
#define LARGURA 10   // a biblioteca A tem 10 casas de largura
#endif
```

O arquivo `lib_b.h`:

```cpp
#ifndef LIB_B_H
#define LIB_B_H
#define LARGURA 20   // a biblioteca B tem 20 casas de largura: mesmo nome, outro valor
#endif
```

Dois programas diferem apenas pela ordem dos `#include`. O primeiro, `main_ab.cpp`:

```cpp
#include <iostream>   // std::cout
#include "lib_a.h"     // "..." : um arquivo do projeto, procurado ao lado deste arquivo
#include "lib_b.h"     // incluído em segundo: sua definição de LARGURA vai por último

int main()
{
    std::cout << "LARGURA = " << LARGURA << "\n";   // a última definição vence
    return 0;
}
```

```text
lib_b.h:3: warning: "LARGURA" redefined
lib_a.h:3: note: this is the location of the previous definition
LARGURA = 20
```

O segundo, `main_ba.cpp`, é idêntico, mas suas duas linhas `#include "lib_..."` estão invertidas: `lib_b.h` primeiro, `lib_a.h` depois.

```text
lib_a.h:3: warning: "LARGURA" redefined
lib_b.h:3: note: this is the location of the previous definition
LARGURA = 10
```

A última definição vence, e só um aviso o sinaliza: o programa compila e executa. Mudar a ordem de dois `#include`, às vezes feito por uma ferramenta de formatação, muda portanto o valor usado. As constantes colocadas em um [espaço de nomes](/?c=langages&s=cpp&p=espaces-de-noms) evitam o problema: `LibA::LARGURA` e `LibB::LARGURA` são dois nomes diferentes.

```cpp
#ifndef NS_A_H
#define NS_A_H
namespace LibA {
    constexpr int LARGURA = 10;   // LibA::LARGURA: 10 casas de largura
}
#endif
```

```cpp
#ifndef NS_B_H
#define NS_B_H
namespace LibB {
    constexpr int LARGURA = 20;   // LibB::LARGURA: 20 casas de largura
}
#endif
```

```cpp
#include <iostream>   // std::cout
#include "ns_a.h"      // a ordem de inclusão já não tem importância
#include "ns_b.h"

int main()
{
    // cada nome carrega o prefixo do seu espaço de nomes: nenhuma colisão
    std::cout << LibA::LARGURA << " " << LibB::LARGURA << "\n";
    return 0;
}
```

```text
10 20
```

### O que `#define` faz melhor

Uma macro é **visível em todo lugar** (sem escopo) e pode ser **ajustada pela linha de comando** com a opção `-D` do compilador: `-DNOME=valor` age como uma linha `#define NOME valor` colocada no início do arquivo (ver [o caso das constantes ajustáveis por `-D`](/?c=langages&s=c&p=compilation#verificar-na-compilacao-static-assert)). Um projeto usa isso para ajustar um limite sem tocar no código; o `#ifndef` («se não definido») fornece o valor padrão. O arquivo abaixo se chama aqui `tamanho_casa.cpp`:

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE     // se a linha de comando não definiu TILE_SIZE (opção -D)...
#define TILE_SIZE 64  // ...usamos este valor padrão
#endif

int main()
{
    std::cout << "Casa : " << TILE_SIZE << " pixels\n";   // exibe o valor adotado
    return 0;
}
```

```bash
# && : executa o comando seguinte somente se o anterior deu certo
# sem -D : vale o valor padrão do #define
g++ -std=c++17 tamanho_casa.cpp -o tamanho_casa && ./tamanho_casa
# -DTILE_SIZE=32 : o compilador define a macro antes de ler o arquivo
g++ -std=c++17 -DTILE_SIZE=32 tamanho_casa.cpp -o tamanho_casa && ./tamanho_casa
```

```text
Casa : 64 pixels
Casa : 32 pixels
```

| Vantagem do `#define` | Por que `const` e `constexpr` não a têm |
|---|---|
| Visível em todo o arquivo, sem prefixo | O nome delas segue as regras de escopo da linguagem |
| Ajustável por `-D` sem modificar o código | O valor delas está escrito no código |
| Utilizável em `#if` (condição avaliada pelo preprocessador) | O preprocessador não conhece as constantes da linguagem (ver as armadilhas) |

## `const`: um valor fixado na inicialização

`const` (de «constante») diante de uma variável proíbe modificá-la depois de sua **inicialização**, ou seja, o primeiro valor que ela recebe, na sua criação (dar um valor com `=` chama-se uma **atribuição**). Nada obriga esse valor a ser conhecido na compilação: ele pode vir do teclado ou de um arquivo, existindo portanto só na execução.

```cpp
#include <iostream>   // std::cin lê o teclado, std::cout escreve na tela

int lerTamanho()   // função que devolve um inteiro (int) lido do teclado
{
    int valor = 0;       // casa que receberá o número digitado
    std::cin >> valor;   // espera o usuário digitar um número e confirmar
    return valor;        // devolve esse número a quem chamou a função
}

int main()
{
    const int tamanhoCasa = lerTamanho();   // const: fixado aqui, durante a execução
    std::cout << "Tamanho de uma casa : " << tamanhoCasa << "\n";
    return 0;
}
```

```text
Tamanho de uma casa : 48
```

(O programa espera um número: digite `48`, depois Enter. Ler um arquivo em vez do teclado daria o mesmo resultado: o valor só é conhecido na execução.) A variável `tamanhoCasa` é de fato constante, pois nenhuma linha pode modificá-la depois, mas o compilador desconhece seu valor.

### Caso particular: um `const` inteiro inicializado por um literal

Quando uma `const` de tipo inteiro é inicializada por uma expressão constante, o compilador conhece seu valor e a aceita como constante:

```cpp
#include <array>      // std::array
#include <iostream>   // std::cout

const int LARGURA = 4;   // const inicializada por um literal: valor conhecido pelo compilador

int main()
{
    int casas[LARGURA] = {};               // aceito: LARGURA vale 4 desde a compilação
    std::array<int, LARGURA> outras{};     // aceito também
    casas[LARGURA - 1] = 9;                // a última casa recebe 9
    std::cout << outras.size() << " " << casas[3] << "\n";
    return 0;
}
```

```text
4 9
```

Essa regra histórica é limitada: só vale para tipos inteiros. Com um `double`, o compilador recusa:

```cpp
const double RATIO = 2.0;   // const não inteira, inicializada por um literal

// > : « maior que » ; a condição deve ser uma expressão constante
static_assert(RATIO > 1.0, "RATIO deve ultrapassar 1");

int main()
{
    return 0;
}
```

```text
const_double.cpp:4:21: error: non-constant condition for static assertion
const_double.cpp:4:15: error: the value of ‘RATIO’ is not usable in a constant expression
const_double.cpp:1:14: note: ‘RATIO’ was not declared ‘constexpr’
```

### Um `const` inicializado na execução: inutilizável como tamanho

A armadilha principal de `const`: ela **parece** uma constante, mas nada garante seu valor na compilação. Com `std::array` (um vetor de tamanho fixo, escrito entre `<` e `>`), o erro é evidente:

```cpp
#include <array>      // std::array: vetor cujo tamanho é escrito entre < e >
#include <iostream>   // std::cin, std::cout

int lerTamanho()   // lê um inteiro do teclado (ver o exemplo anterior)
{
    int valor = 0;
    std::cin >> valor;
    return valor;
}

int main()
{
    const int tamanho = lerTamanho();   // const, mas seu valor só existe na execução
    // {}: todas as casas valem 0 no início
    std::array<int, tamanho> casas{};   // ERRO: tamanho desconhecido na compilação
    std::cout << casas.size() << "\n";   // size(): o número de casas
    return 0;
}
```

```text
vetor_const.cpp:15:28: error: the value of ‘tamanho’ is not usable in a constant expression
vetor_const.cpp:13:15: note: ‘tamanho’ was not initialized with a constant expression
```

Com um vetor « no estilo C », o GCC aceita o código por uma extensão (um **vetor de tamanho variável**, cujo tamanho é lido na execução) e apenas emite um aviso:

```cpp
#include <iostream>   // std::cin, std::cout

int lerTamanho()   // lê um inteiro do teclado
{
    int valor = 0;
    std::cin >> valor;
    return valor;
}

int main()
{
    const int tamanho = lerTamanho();   // const: valor conhecido só na execução
    int casas[tamanho];                 // vetor C: o GCC aceita, a norma C++ não
    casas[0] = 7;                       // a primeira casa recebe 7
    std::cout << "Casas : " << tamanho << ", primeira : " << casas[0] << "\n";
    return 0;
}
```

```text
vetor_vla.cpp:13:9: warning: ISO C++ forbids variable length array ‘casas’ [-Wvla]
Casas : 5, primeira : 7
```

(com a entrada `5`). O programa funciona, mas o C++ padrão não tem esses vetores: com a opção `-pedantic-errors`, o aviso se torna `error: ISO C++ forbids variable length array ‘casas’ [-Wvla]`, e outros compiladores podem recusar o código: um mesmo programa corre o risco de ser válido em um e falso em outro.

## `constexpr`: um valor conhecido na compilação

`constexpr` (de *constant expression*, « expressão constante ») declara uma constante **tipada** cujo valor **deve** ser conhecido na compilação. O compilador a calcula, e recusa o programa se não conseguir. `constexpr` existe desde o C++11 e implica `const`: a constante não é modificada depois.

```cpp
#include <array>      // std::array: vetor cujo tamanho é escrito entre < e >
#include <iostream>   // std::cout

constexpr int LARGURA = 10;                  // 10 casas de largura
constexpr int ALTURA = 8;                    // 8 casas de altura
constexpr int NUM_CASAS = LARGURA * ALTURA;  // calculada na compilação: 80

int main()
{
    int casas[NUM_CASAS] = {};            // vetor C de 80 inteiros, todos iniciados em 0
    std::array<int, NUM_CASAS> outras{};  // std::array de 80 inteiros: o tamanho é aceito
    casas[NUM_CASAS - 1] = 5;             // a última casa recebe 5
    std::cout << NUM_CASAS << " " << outras.size() << " " << casas[79] << "\n";
    return 0;
}
```

```text
80 80 5
```

`NUM_CASAS` é calculada pelo compilador (10 x 8), depois aceita como tamanho de vetor, o que a `const` lida do teclado não conseguia. Se o valor depende da execução, o compilador avisa imediatamente:

```cpp
#include <iostream>   // std::cin, std::cout

int lerTamanho()   // lê um inteiro do teclado
{
    int valor = 0;
    std::cin >> valor;
    return valor;
}

int main()
{
    constexpr int tamanho = lerTamanho();   // ERRO: o valor depende do teclado
    std::cout << tamanho << "\n";
    return 0;
}
```

```text
constexpr_entrada.cpp:12:39: error: call to non-‘constexpr’ function ‘int lerTamanho()’
constexpr_entrada.cpp:3:5: note: ‘int lerTamanho()’ declared here
```

O erro acontece na compilação, antes que alguém execute o programa: é todo o interesse. A tabela a seguir resume o que separa `const` de `constexpr`:

| | `const` | `constexpr` |
|---|---|---|
| Garante que o valor não muda mais | sim | sim |
| Garante que o valor é conhecido na compilação | não | sim, senão erro |
| Inicialização pela digitação ou por um arquivo | permitida | recusada |
| Tamanho de vetor, argumento de template, `static_assert` | somente para um inteiro inicializado por um literal | sempre, para qualquer tipo permitido |
| Aplica-se a | qualquer variável | uma variável, uma função (ver mais abaixo) |

## Comparar `#define`, `const` e `constexpr`

| Critério | `#define` | `const` | `constexpr` |
|---|---|---|---|
| Natureza | Texto substituído pelo preprocessador | Variável somente leitura | Constante calculada na compilação |
| Tipo | Nenhum: o do texto substituído | Sim | Sim |
| Escopo | Nenhum: da linha `#define` até o fim do arquivo | Sim: bloco, classe, espaço de nomes | Sim: bloco, classe, espaço de nomes |
| Momento do valor | Antes da compilação (texto) | Inicialização, às vezes na execução | Compilação, obrigatoriamente |
| Tamanho de vetor | Sim | Somente se o valor for conhecido (inteiro inicializado por um literal) | Sim |
| Ajuste por `-D` | Sim | Não | Não (exceto lendo uma macro) |
| Utilizável em `#if` | Sim | Não | Não |
| Mensagem de erro | Cita o texto substituído | Cita o nome | Cita o nome |
| Depuração | O nome desaparece antes da compilação | O nome é conservado | O nome é conservado |

### As mensagens de erro

Modificar a constante por engano gera dois tipos de mensagem. Com a macro:

```cpp
#define TILE_SIZE 64   // macro

int main()
{
    TILE_SIZE = 32;   // ERRO: tenta-se modificar a constante
    return 0;
}
```

```text
modificar_macro.cpp:1:19: error: lvalue required as left operand of assignment
modificar_macro.cpp:5:5: note: in expansion of macro ‘TILE_SIZE’
```

O compilador fala de um valor à esquerda da atribuição (`64 = 32` não faz sentido): ele substituiu o nome pelo número. Se a primeira linha se tornar `const int TILE_SIZE = 64;` (arquivo `modificar_const.cpp`) ou `constexpr int TILE_SIZE = 64;` (arquivo `modificar_constexpr.cpp`), a mensagem é a mesma nos dois casos e cita o nome:

```text
modificar_const.cpp:5:15: error: assignment of read-only variable ‘TILE_SIZE’
```

### A depuração

Um **depurador** é uma ferramenta que executa um programa passo a passo e exibe suas variáveis (ver [o bug](/?c=fondamentaux&s=bases-de-l-informatique&p=le-bug)). Ele só lê o que o compilador deixou no programa. Arquivo `depuracao.cpp`:

```cpp
#define TILE_MACRO 64   // macro: desaparece antes da compilação propriamente dita

constexpr int TILE_CONSTEXPR = 64;   // constante: mantém seu nome no programa compilado

int main()
{
    // % : resto da divisão ; 128 % 7 vale 2 ; return devolve esse número ao sistema
    return (TILE_MACRO + TILE_CONSTEXPR) % 7;
}
```

```bash
# -g : o compilador acrescenta ao programa os nomes que um depurador lê
# (DWARF : o formato padrão em que esses nomes são guardados)
# objdump : exibe o conteúdo de um programa compilado
# grep -c : conta as linhas que citam uma palavra
g++ -std=c++17 -g depuracao.cpp -o depuracao
objdump --dwarf=info depuracao | grep -c TILE_CONSTEXPR
objdump --dwarf=info depuracao | grep -c TILE_MACRO
# -g3 : acrescenta também as macros, legíveis com --dwarf=macro
g++ -std=c++17 -g3 depuracao.cpp -o depuracao3
objdump --dwarf=macro depuracao3 | grep -c TILE_MACRO
```

```text
1
0
1
```

Com `-g`, a constante mantém seu nome (1 linha) e a macro não aparece em lugar nenhum (0). Só a opção `-g3` conserva as macros. Sem ela, o depurador mostra `64` onde o código dizia `TILE_MACRO`.

## O escopo de uma constante

O **escopo** de um nome é a zona do código em que ele existe. Uma constante `const` ou `constexpr` segue as regras de escopo de qualquer variável, o que permite que três constantes tenham o mesmo nome sem se atrapalhar:

| Onde ela é declarada? | Escopo | Como lê-la de fora |
|---|---|---|
| Em uma função | Da sua declaração até a chave de fechamento da função | Impossível: ela não existe mais depois |
| Em um espaço de nomes | Em todo lugar, com o prefixo e o operador `::` («que pertence a») | `Config::LARGURA` |
| Em uma classe, com `static` | Na classe; fora dela se for `public` | `Grade::LARGURA` |
| `#define` | Da linha `#define` até o fim do arquivo, sem prefixo | `LARGURA` (nenhum controle) |

```cpp
#include <iostream>   // std::cout

namespace Config {                // um espaço de nomes agrupa nomes sob um prefixo
    constexpr int LARGURA = 10;   // escreve-se Config::LARGURA, de qualquer lugar
}

class Grade {
public:
    static constexpr int LARGURA = 5;   // escreve-se Grade::LARGURA, de qualquer lugar
};

void desenhar()
{
    constexpr int LARGURA = 3;   // visível em desenhar(), até a chave de fechamento
    std::cout << LARGURA << " " << Config::LARGURA << " " << Grade::LARGURA << "\n";
}

int main()
{
    desenhar();   // exibe os três LARGURA: nenhum atrapalha os outros
    return 0;
}
```

```text
3 10 5
```

Em `desenhar`, o nome `LARGURA` sozinho designa a constante local (3); as outras duas se escrevem com o prefixo. Fora da sua função, uma constante local não existe mais:

```cpp
#include <iostream>   // std::cout

void desenhar()
{
    constexpr int MARGEM = 8;   // visível somente em desenhar()
    std::cout << "desenhar : " << MARGEM << "\n";
}

int main()
{
    desenhar();
    std::cout << "main : " << MARGEM << "\n";   // ERRO: MARGEM não existe aqui
    return 0;
}
```

```text
escopo_local.cpp:12:31: error: ‘MARGEM’ was not declared in this scope
```

Uma macro, ao contrário, teria sido visível em `main` (ver o exemplo `macro_escopo.cpp` acima, onde `MARGEM` ultrapassa sua função). Um escopo estreito é uma vantagem: um nome de constante local não pode colidir com outro nome do programa.

## O membro `static constexpr` de uma classe

Um **membro estático** (declarado `static`) de uma classe não pertence a cada objeto, mas à classe: existe em um único exemplar, compartilhado (ver [os membros estáticos](/?c=langages&s=cpp&p=classes-et-objets#membros-e-metodos-estaticos)). Uma constante de classe não tem razão para ser copiada em cada objeto `Game`: declara-se `static constexpr`. Eis o fio condutor: uma classe de jogo cujo tamanho de casa é um membro:

```cpp
#include <array>      // std::array: vetor de tamanho fixo, escrito entre < e >
#include <iostream>   // std::cout

class Game {
public:   // o que segue pode ser usado de fora da classe
    static constexpr int TILE_SIZE = 64;    // tamanho de uma casa em pixels
    static constexpr int GRID_WIDTH = 10;   // número de casas na largura
    static constexpr int GRID_HEIGHT = 8;   // número de casas na altura

    // posição em pixels da coluna dada ; const: não modifica o objeto
    int pixelX(int coluna) const { return coluna * TILE_SIZE; }
    // static_cast<int> converte em int o número de casas devolvido por size()
    int cellCount() const { return static_cast<int>(cells.size()); }

private:   // o que segue só pode ser usado dentro da classe
    // o tamanho é uma expressão constante: as três constantes são multiplicadas
    std::array<int, GRID_WIDTH * GRID_HEIGHT> cells{};
};

int main()
{
    Game game;   // um objeto Game
    std::cout << "Casa : " << Game::TILE_SIZE << " pixels\n";   // Classe::NOME: sem objeto
    std::cout << "Coluna 3 : x = " << game.pixelX(3) << "\n";
    std::cout << "Janela : " << Game::GRID_WIDTH * Game::TILE_SIZE << " x "
              << Game::GRID_HEIGHT * Game::TILE_SIZE << "\n";
    std::cout << "Casas : " << game.cellCount() << "\n";
    return 0;
}
```

```text
Casa : 64 pixels
Coluna 3 : x = 192
Janela : 640 x 512
Casas : 80
```

Pontos a reter:

- `Game::TILE_SIZE` se lê com `Classe::NOME` (o operador `::` significa «que pertence a»): nenhum objeto é necessário, pois a constante pertence à classe.
- As três constantes servem para calcular o tamanho de `cells`: o produto `GRID_WIDTH * GRID_HEIGHT` é uma expressão constante, aceita entre `<` e `>` de `std::array` (ver [os templates](/?c=langages&s=cpp&p=templates)).
- `static_cast<int>` converte um número de um tipo para outro (ver [os casts em C++](/?c=langages&s=cpp&p=cast-cpp)), e `const` depois de `pixelX(int coluna)` promete que o método (uma função da classe) não modifica o objeto.

O acesso de fora da classe depende da seção em que a constante é declarada:

| Declaração | Nas funções de `Game` | Fora da classe (`Game::NOME`) |
|---|---|---|
| Seção `public` | sim | sim |
| Seção `private` | sim | não: erro de compilação |
| Seção `protected` | sim | não, mas as classes derivadas têm acesso |

```cpp
#include <iostream>   // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // public: legível de fora

private:
    static constexpr int MAX_LIVES = 3;    // private: reservado às funções de Game
};

int main()
{
    std::cout << Game::TILE_SIZE << "\n";   // aceito
    std::cout << Game::MAX_LIVES << "\n";   // ERRO: MAX_LIVES é private
    return 0;
}
```

```text
privado.cpp:14:24: error: ‘constexpr const int Game::MAX_LIVES’ is private within this context
privado.cpp:8:26: note: declared private here
```

Uma constante útil só para a classe se coloca em `private`: ela não se torna uma interface que precisaria ser mantida.

### Antes e a partir do C++17: a definição fora da classe

Uma constante usada apenas como **valor** (`TILE_SIZE * 2`, `std::cout << TILE_SIZE`) não precisa existir na memória: o compilador copia o 64. Assim que se pede o seu **endereço** (o local do valor na memória, obtido por uma passagem por [referência](/?c=langages&s=cpp&p=references) ou pelo símbolo `&`), ela deve existir em um ponto preciso da memória. Uma **declaração** apenas anuncia um nome e seu tipo; uma **definição** reserva, além disso, esse local, uma única vez para o programa inteiro. Um **argumento** é o valor fornecido a uma função na sua chamada: `std::min` recebe seus dois argumentos por referência, portanto pelo seu endereço:

```cpp
#include <algorithm>   // std::min: devolve o menor de dois valores
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // tamanho de uma casa em pixels
};

int main()
{
    int pedido = 100;   // tamanho desejado pelo usuário
    // std::min recebe seus argumentos por referência: usa o endereço de TILE_SIZE
    int tamanho = std::min(pedido, Game::TILE_SIZE);
    std::cout << "Tamanho adotado : " << tamanho << "\n";
    return 0;
}
```

| Padrão | Na classe, `static constexpr int TILE_SIZE = 64;` é | A linha `constexpr int Game::TILE_SIZE;` fora da classe é |
|---|---|---|
| C++11 e C++14 | Uma declaração somente | **Necessária** se o endereço for pedido, em um único arquivo `.cpp` |
| C++17 e posteriores | Uma declaração e uma definição (a constante é implicitamente `inline`: uma definição que pode figurar em vários arquivos, mantendo o programa apenas um exemplar) | Desnecessária; ainda aceita, mas o padrão a declara obsoleta |

Em C++17, o programa exibe:

```text
Tamanho adotado : 64
```

Em C++11 e C++14, a compilação funciona, mas a **ligação** (a última etapa, que une as partes do programa, ver [os erros de ligação](/?c=langages&s=c&p=compilation#erros-de-compilacao-vs-erros-de-ligacao)) falha (`ld` é o programa que faz essa etapa):

```text
min_endereco.cpp:(.text+0x29): undefined reference to `Game::TILE_SIZE'
collect2: error: ld returned 1 exit status
```

A correção acrescenta a definição depois da classe:

```cpp
#include <algorithm>   // std::min
#include <iostream>    // std::cout

class Game {
public:
    static constexpr int TILE_SIZE = 64;   // declaração dentro da classe
};

// definição fora da classe: reserva o endereço de TILE_SIZE (em UM único arquivo .cpp)
constexpr int Game::TILE_SIZE;

int main()
{
    int pedido = 100;   // tamanho desejado pelo usuário
    int tamanho = std::min(pedido, Game::TILE_SIZE);   // limita a 64
    std::cout << "Tamanho adotado : " << tamanho << "\n";
    return 0;
}
```

```text
Tamanho adotado : 64
```

Este programa dá o mesmo resultado em C++11, C++14 e C++17. Dois detalhes desta armadilha:

- Com a opção de [otimização](/?c=langages&s=c&p=compilation#os-niveis-de-otimizacao-o0-a-o3-os) `-O2` (que pede ao compilador que reescreva o código para torná-lo mais rápido), a referência é substituída pelo valor 64 e o erro desaparece (observado com o código do exemplo em C++11): um programa pode, portanto, passar na versão otimizada e falhar na versão normal.
- A linha de definição pertence a **um único** arquivo `.cpp`. Colocada em um cabeçalho incluído por dois arquivos, ela dá, em C++14, `multiple definition of ‘Game::TILE_SIZE’`; em C++17 ela não é mais um problema, já que a constante é `inline`.

## O que `constexpr` sabe calcular: funções e `static_assert`

Declarada `constexpr`, uma função pode ser chamada na compilação quando todos os seus argumentos (os valores fornecidos na chamada) são conhecidos; com um argumento conhecido só na execução, ela roda como uma função comum. O que ela pode conter depende do padrão:

| Padrão | Conteúdo permitido em uma função `constexpr` |
|---|---|
| C++11 | Uma única instrução (um comando terminado por `;`): `return`; a **recursão** (uma função que chama a si mesma) e o operador ternário `teste ? a : b` substituem variáveis e laços |
| C++14 | Variáveis locais, laços [`for` e `while`](/?c=langages&s=c&p=boucles), várias instruções |
| C++20 | A palavra `consteval` impõe o cálculo na compilação (ver adiante) |

```cpp
#include <iostream>   // std::cin, std::cout

constexpr int quadrado(int x) { return x * x; }   // um só return: válido desde C++11

// recursão: a função chama a si mesma ; <= : « menor ou igual a »
// « teste ? a : b » vale a se teste for verdadeiro, senão b
constexpr int fatorial(int n) { return n <= 1 ? 1 : n * fatorial(n - 1); }

constexpr int AREA = quadrado(8);                             // calculada na compilação: 64
static_assert(quadrado(8) == 64, "quadrado(8) deve valer 64"); // == : teste de igualdade
int vetor[fatorial(3)];                                        // tamanho 3 x 2 x 1 = 6

int main()
{
    int n = 0;       // valor escolhido na execução
    std::cin >> n;   // lido do teclado
    // quadrado(n) roda como uma função comum: n é desconhecido na compilação
    std::cout << AREA << " " << fatorial(5) << " " << quadrado(n) << " "
              << vetor[0] << "\n";
    return 0;
}
```

```text
64 120 49 0
```

(com a entrada `7`). `fatorial(5)` vale 5 x 4 x 3 x 2 x 1, ou seja 120. A mesma função `quadrado` serve na compilação (`AREA`, `static_assert`) e na execução (`quadrado(n)`), enquanto `fatorial(3)` define o tamanho do vetor. Com um laço, a mesma ideia se escreve de forma mais simples, mas somente a partir do C++14:

```cpp
#include <iostream>   // std::cout

constexpr int soma(int n)   // soma os inteiros de 1 até n
{
    int total = 0;                 // variável local: permitida desde C++14
    for (int i = 1; i <= n; ++i)   // laço: permitido desde C++14 ; ++i soma 1 a i
        total += i;                // += : soma i a total
    return total;                  // 1 + 2 + ... + n
}

constexpr int TOTAL = soma(10);   // calculado na compilação: 55

int main()
{
    std::cout << TOTAL << "\n";
    return 0;
}
```

```text
55
```

Em C++11, a mesma função é recusada:

```text
soma.cpp:9:1: error: body of ‘constexpr’ function [...] not a return-statement
```

### `static_assert`: verificar na compilação

[`static_assert(condição, "mensagem")`](https://en.cppreference.com/w/cpp/language/static_assert) interrompe a compilação com a mensagem se a condição for falsa. A condição deve ser uma expressão constante. Isso transforma uma hipótese do código («o tamanho da casa é um múltiplo de 8») em uma regra que o compilador controla:

```cpp
constexpr int TILE_SIZE = 60;   // tamanho de uma casa em pixels

// a condição é falsa: a compilação para com esta mensagem
static_assert(TILE_SIZE % 8 == 0, "TILE_SIZE deve ser múltiplo de 8");

int main()
{
    return 0;
}
```

```text
assertion.cpp:4:29: error: static assertion failed: TILE_SIZE deve ser múltiplo de 8
assertion.cpp:4:29: note: the comparison reduces to ‘(4 == 0)’
```

(60 % 8 vale 4, o resto da divisão de 60 por 8.) Desde C++17, a mensagem pode ser omitida: `static_assert(TILE_SIZE > 0);`. Em C++11, o GCC aceita, mas avisa (`warning: ‘static_assert’ without a message only available with ‘-std=c++17’`).

### `consteval` (C++20)

Uma função `constexpr` ainda pode ser executada na execução. Uma função `consteval` (ver [a documentação](https://en.cppreference.com/w/cpp/language/consteval)) nunca pode: toda chamada deve ser uma expressão constante. Com `consteval int quadrado(int x) { return x * x; }` e um `n` lido do teclado, compilado com `-std=c++20`, a chamada `quadrado(8)` passa e `quadrado(n)` é recusada:

```text
consteval.cpp:9:43: error: the value of ‘n’ is not usable in a constant expression
```

## Os limites de `constexpr`

`constexpr` só se aplica ao que se calcula sem executar o programa:

| O que se gostaria | Possível? | Detalhe |
|---|---|---|
| Um inteiro, um número de ponto flutuante, um booleano (verdadeiro ou falso), um caractere (`'a'`) | sim | `constexpr double PI = 3.14159265358979;` |
| Um texto constante | sim | Um [ponteiro](/?c=langages&s=c&p=pointeurs) (o endereço de um valor na memória) para um texto escrito no código: `constexpr const char *` |
| Um valor digitado no teclado, lido de um arquivo ou da rede | não | O valor só existe na execução (ver o erro acima) |
| Uma variável `constexpr` do tipo `std::string` | não (testado em C++11 e C++17) | O tipo não é «literal» (ver abaixo) |
| Uma função `constexpr` que chama uma função não `constexpr` | recusada se exigirmos seu valor na compilação | `std::cin >> valor` no corpo causa o aviso `-Winvalid-constexpr` em C++17 e um erro em C++11 |

```cpp
#include <iostream>   // std::cout

constexpr double PI = 3.14159265358979;          // um número de ponto flutuante (double)
constexpr const char *TITULO = "Jogo de casas";  // ponteiro para um texto escrito no código
constexpr bool MODE_DEBUG = true;              // booleano: true (verdadeiro) ou false (falso)

int main()
{
    std::cout << TITULO << " : " << PI << " " << MODE_DEBUG << "\n";
    return 0;
}
```

```text
Jogo de casas : 3.14159 1
```

(um booleano aparece `1` para verdadeiro, `0` para falso.) Para `std::string`, a mensagem cita o tipo:

```cpp
#include <iostream>   // std::cout
#include <string>     // std::string: tipo de texto da biblioteca padrão

constexpr std::string TITULO = "Jogo de casas";   // ERRO: std::string não é constexpr

int main()
{
    std::cout << TITULO << "\n";
    return 0;
}
```

```text
texto.cpp:4:23: error: the type ‘const std::string’ [...] ‘TITULO’ is not literal
[...] has a non-trivial destructor
```

(`[...]` marca as palavras omitidas da mensagem.) Um **tipo literal** é um tipo que o compilador consegue criar durante a compilação: números, booleanos, caracteres, ponteiros e classes simples. `std::string` gerencia memória reservada durante a execução (ver [o gerenciamento de memória](/?c=langages&s=cpp&p=gestion-memoire-raii)), que um [destrutor](/?c=langages&s=cpp&p=classes-et-objets) libera no fim da sua vida: ele não é literal. Para um texto constante, escreve-se `constexpr const char *`.

## Organizar as constantes de um projeto

As constantes compartilhadas ficam em um cabeçalho, em um espaço de nomes. Uma constante `constexpr` de espaço de nomes existe em **um exemplar por arquivo `.cpp`** que inclui o cabeçalho (cada arquivo tem sua cópia, sem conflito na ligação). A partir do C++17, `inline constexpr` dá um exemplar único, compartilhado por todo o programa:

```cpp
#ifndef CONSTANTES_H
#define CONSTANTES_H
namespace Config {
    constexpr int TILE_SIZE = 64;           // uma cópia por arquivo .cpp
    inline constexpr int TILE_INLINE = 64;  // uma única cópia para todo o programa (C++17)
}
// definidas em outro arquivo .cpp: elas devolvem o endereço visto a partir desse arquivo
const int *enderecoTile();
const int *enderecoTileInline();
#endif
```

Em um programa de dois arquivos `.cpp` que incluem este cabeçalho (um define as duas funções, o outro as chama), o endereço de `TILE_SIZE` visto por cada um é diferente em C++14, assim como em C++17; o de `TILE_INLINE` é o mesmo em C++17 (resultado observado). Para um simples número lido por valor, a diferença não tem importância: ela só se nota quando se pede o endereço.

Para manter o ajuste por `-D` de `#define` com o tipo e o escopo de `constexpr`, combinam-se os dois: a macro serve apenas como ponto de entrada, lida uma única vez.

```cpp
#include <iostream>   // std::cout

#ifndef TILE_SIZE_PX     // a macro serve só como ponto de entrada para -D...
#define TILE_SIZE_PX 64  // ...com um valor padrão
#endif

constexpr int TILE_SIZE = TILE_SIZE_PX;   // o resto do código usa esta constante tipada
// static_assert: interrompe a compilação se a condição for falsa
static_assert(TILE_SIZE > 0, "o tamanho de uma casa deve ser positivo");

int main()
{
    std::cout << "Casa : " << TILE_SIZE << " pixels\n";
    return 0;
}
```

Este arquivo se chama aqui `ajuste.cpp`:

```bash
g++ -std=c++17 ajuste.cpp -o ajuste && ./ajuste
g++ -std=c++17 -DTILE_SIZE_PX=32 ajuste.cpp -o ajuste && ./ajuste
g++ -std=c++17 -DTILE_SIZE_PX=0 ajuste.cpp -o ajuste
```

```text
Casa : 64 pixels
Casa : 32 pixels
ajuste.cpp:9:25: error: static assertion failed: o tamanho de uma casa deve ser positivo
ajuste.cpp:9:25: note: the comparison reduces to ‘(0 > 0)’
```

O mesmo programa também compila em C++11. O resto do código usa somente `TILE_SIZE`: um valor absurdo passado por `-D` é interrompido na compilação pelo `static_assert`.

## As armadilhas

| Armadilha | Sintoma | Correção |
|---|---|---|
| Usar um `const` inicializado na execução como tamanho de vetor | `the value of ‘tamanho’ is not usable in a constant expression`; ou, com um vetor « no estilo C », um aviso `-Wvla` apenas com o GCC | Declarar o tamanho como `constexpr`; se o tamanho for realmente desconhecido na compilação, usar `std::vector` (ver [os contêineres](/?c=langages&s=cpp&p=stl-conteneurs)) |
| Acreditar que uma função `constexpr` é sempre calculada na compilação | `quadrado(n)` com `n` lido do teclado roda na execução, sem erro | Atribuir o resultado a uma variável `constexpr`, ou usar `consteval` (C++20) |
| Macro com **parâmetro** (um nome entre parênteses, substituído pelo texto fornecido na chamada) sem parênteses | `QUADRADO_ERRADO(1 + 2)` dá 5 e não 9 | Pôr entre parênteses cada parâmetro e o resultado, ou usar uma função `constexpr` |
| Constante `#define` sem parênteses | `5120 / LARGURA_ERRADA` dá 800 e não 8 | Pôr entre parênteses: `#define LARGURA_CERTA (64 * 10)` |
| Ponto e vírgula no fim de um `#define` | `#define TILE_SIZE 64;` e depois `int casas[TILE_SIZE];` dá `expected ‘]’ before ‘;’ token` | Nenhum ponto e vírgula em uma macro |
| Colisão de macros de mesmo nome | A última definição encontrada vence; só `warning: "LARGURA" redefined` o sinaliza | Constantes em um espaço de nomes; ler os avisos do compilador |
| Macro definida em uma função | Ela continua ativa depois da função (exemplo `macro_escopo.cpp`) | Uma `constexpr` local, que desaparece com a função |
| `#if` sobre uma constante C++ | `TILE_SIZE` vale 0 no `#if`: o ramo escolhido é falso, sem nenhum erro | Manter uma macro para os `#if`; no resto, `if` ou `static_assert` |
| `static constexpr` usado por endereço em C++11 ou C++14 | `undefined reference to ‘Game::TILE_SIZE’` | Acrescentar `constexpr int Game::TILE_SIZE;` em um `.cpp` |
| `static const double` dentro de uma classe | `‘constexpr’ needed for in-class initialization of static data member ‘const double Game::RATIO’ of non-integral type` | Escrever `static constexpr double RATIO = 0.5;` |
| Esquecer `static` diante de um membro `constexpr` | `non-static data member ‘TILE_SIZE’ declared ‘constexpr’` | Escrever `static constexpr int TILE_SIZE = 64;` |
| `constexpr` sobre um `std::string` | `the type ‘const std::string’ ... is not literal` | `constexpr const char *` para um texto constante |

O caso do `#if` se verifica neste programa (a constante é realmente 64, mas o `#if` acredita que vale 0):

```cpp
#include <iostream>   // std::cout

constexpr int TILE_SIZE = 64;   // uma constante C++, não uma macro

// #if testa uma condição antes da compilação ; ele só conhece as macros
#if TILE_SIZE > 32              // TILE_SIZE não é uma macro: vale 0 aqui
const char *tamanho = "grande";  // escolhida se TILE_SIZE > 32
#else
const char *tamanho = "pequena";  // escolhida caso contrário
#endif

int main()
{
    std::cout << "Casa " << tamanho << " (" << TILE_SIZE << " pixels)\n";
    return 0;
}
```

```text
Casa pequena (64 pixels)
```

A opção `-Wundef` avisa: `warning: "TILE_SIZE" is not defined, evaluates to 0 [-Wundef]`.

A armadilha dos parênteses se verifica neste programa:

```cpp
#include <iostream>   // std::cout

#define QUADRADO_ERRADO(x) x * x          // parâmetro sem parênteses
#define QUADRADO_CERTO(x) ((x) * (x))     // parâmetro e resultado entre parênteses
#define LARGURA_ERRADA 64 * 10            // constante sem parênteses
#define LARGURA_CERTA (64 * 10)           // constante entre parênteses
constexpr int quadrado(int x) { return x * x; }   // função: x é calculado primeiro

int main()
{
    // QUADRADO_ERRADO(1 + 2) vira 1 + 2 * 1 + 2, ou seja, 1 + 2 + 2 = 5
    std::cout << QUADRADO_ERRADO(1 + 2) << " " << QUADRADO_CERTO(1 + 2) << " "
              << quadrado(1 + 2) << "\n";
    // 5120 / LARGURA_ERRADA vira 5120 / 64 * 10, ou seja 80 * 10 = 800
    std::cout << 5120 / LARGURA_ERRADA << " " << 5120 / LARGURA_CERTA << "\n";
    return 0;
}
```

```text
5 9 9
800 8
```

## Boas práticas

| Boa prática | Por quê |
|---|---|
| `constexpr` por padrão para um valor conhecido na compilação | O compilador verifica a promessa; o tipo e o escopo são respeitados |
| `const` somente para um valor calculado na execução | Diz «fixado aqui, jamais modificado», sem pretender um cálculo na compilação |
| `#define` reservado às necessidades que só o preprocessador cobre: ajuste por `-D`, condição `#if`, guarda de inclusão | Em todos os outros casos, a macro não tem tipo, nem escopo, nem nome no depurador |
| Uma constante de classe como `static constexpr`, colocada em `private` se servir só à classe | Um único exemplar para todos os objetos; nenhuma interface pública a mais |
| Uma constante global em um espaço de nomes (`Config::TILE_SIZE`) | Nenhuma colisão; origem visível na leitura |
| Uma constante nomeada em vez de um número mágico | O sentido fica escrito; a mudança é feita em um único lugar |
| `static_assert` para toda hipótese sobre uma constante | Um valor absurdo interrompe a compilação, não o jogo |
| Escrever as macros em maiúsculas, colocá-las inteiramente entre parênteses | Uma macro se reconhece na leitura; a ordem das operações permanece a desejada |
| Compilar com `-std=c++17` (ou mais) e `-Wall -Wextra -pedantic` | A partir do C++17, nada de definição fora da classe a escrever; os avisos sinalizam macros redefinidas e vetores de tamanho variável |

Para aprofundar, no cppreference: [`constexpr`](https://en.cppreference.com/w/cpp/language/constexpr), [`const`](https://en.cppreference.com/w/cpp/language/cv), [`static_assert`](https://en.cppreference.com/w/cpp/language/static_assert), [os membros estáticos](https://en.cppreference.com/w/cpp/language/static), [o especificador `inline`](https://en.cppreference.com/w/cpp/language/inline), [`consteval`](https://en.cppreference.com/w/cpp/language/consteval), [`std::array`](https://en.cppreference.com/w/cpp/container/array) e [as macros](https://en.cppreference.com/w/cpp/preprocessor/replace).

## O que reter

| Para reter | Detalhe |
|---|---|
| Uma constante nomeia um valor fixo | Ela substitui um número mágico: o sentido fica escrito, a mudança se faz em um único lugar |
| Dois momentos | A compilação traduz o código; a execução roda o programa. Uma expressão constante é calculada na compilação |
| `#define` | Substituição de texto pelo preprocessador: sem tipo, sem escopo, sujeita a colisões; visível em todo lugar, ajustável por `-D`, utilizável em `#if` |
| `const` | Variável que não se modifica depois de inicializada; o valor pode vir da execução (teclado, arquivo); inutilizável como tamanho de vetor nesse caso |
| `constexpr` | Constante tipada cujo valor é conhecido na compilação; senão erro; utilizável como tamanho de vetor, argumento de template e em `static_assert` |
| Escopo | Função (local), espaço de nomes (`Config::NOME`), classe (`Classe::NOME`); uma macro não tem nenhum |
| Membro `static constexpr` | Um exemplar compartilhado pela classe; `Game::TILE_SIZE` fora da classe se for `public`, erro se for `private` |
| Padrão | Antes do C++17, um endereço pedido exige `constexpr int Game::TILE_SIZE;` fora da classe; a partir do C++17, o membro é `inline`. Funções `constexpr`: um só `return` em C++11, laços a partir do C++14; `consteval` em C++20 |
| Limites | Somente o que se calcula sem executar o programa: nada de entrada, nada de arquivo, nada de `std::string` constexpr |
| Não confundir | `const` (nunca modificada) e `constexpr` (conhecida na compilação); `#define` (texto) e constante (valor tipado) |
