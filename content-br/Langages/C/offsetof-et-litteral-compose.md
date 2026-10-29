---
order: 31
---

# Controlar campos pelo deslocamento (offsetof) e o literal composto

Uma **estrutura** (`struct`) reúne vários valores sob um único nome; cada valor ocupa ali uma casa nomeada, um **campo** (veja [as estruturas](/?c=langages&s=c&p=variables#as-estruturas-struct)). Este capítulo responde a duas perguntas que surgem assim que se preenche uma estrutura a partir de um arquivo de ajustes. Como evitar uma longa cadeia de `if`, um ramo por campo? Guardando, em um **array** (uma sequência de casas do mesmo tipo), a descrição de cada campo, incluindo sua **posição em bytes** na estrutura: esse é o papel de `offsetof`. E como montar uma estrutura no lugar, sem variável intermediária, para passá-la a uma função? Com o **literal composto** do C99 (a revisão de 1999 da linguagem C), `(Tipo){valores}`.

Ele pressupõe que você já conhece [os ponteiros](/?c=langages&s=c&p=pointeurs) (o endereço de um valor na memória e o desreferenciamento `*`), [os laços](/?c=langages&s=c&p=boucles) e [as condições](/?c=langages&s=c&p=conditions). O **byte** (8 bits) é a unidade de memória: cada byte tem seu próprio endereço (veja [a organização dos dados na memória](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). Todos os programas foram compilados com `gcc -std=c11 -Wall -Wextra` no Linux (veja [o processo de compilação](/?c=langages&s=c&p=compilation)), depois executados; os que usam o literal composto também foram executados com `-std=c99`, com o mesmo resultado.

## O problema: colocar linhas « nome valor » em uma estrutura

Um programa lê um arquivo de ajustes. Cada linha é uma **diretiva**: um nome, um espaço, um valor (`velocidade 2.5`). O programa deve colocar cada valor no campo certo de uma estrutura `Ajustes`, mantendo-o entre um limite mínimo e um limite máximo. A versão mais direta é uma cadeia de `if`:

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    float velocidade;                   // velocidade de movimento, de 0 a 10
    float gravidade;                    // intensidade da gravidade, de 0 a 20
    int   tamanho;                      // tamanho em casas, de 1 a 50
} Ajustes;

// Guarda o valor v no campo que tem o nome dado. Retorna 0, ou -1 se desconhecido.
static int aplicar(Ajustes *r, const char *nome, double v)
{
    if (strcmp(nome, "velocidade") == 0) {     // primeiro campo
        if (v < 0.0) v = 0.0;                  // limite inferior copiado aqui
        if (v > 10.0) v = 10.0;                // limite superior copiado aqui
        r->velocidade = (float)v;              // escrita no campo
    } else if (strcmp(nome, "gravidade") == 0) {   // segundo campo: tudo recomeça
        if (v < 0.0) v = 0.0;
        if (v > 20.0) v = 20.0;
        r->gravidade = (float)v;
    } else if (strcmp(nome, "tamanho") == 0) {     // terceiro campo: de novo
        if (v < 1.0) v = 1.0;
        if (v > 50.0) v = 50.0;
        r->tamanho = (int)v;
    } else {
        return -1;                             // nenhum campo tem esse nome
    }
    return 0;
}

int main(void)
{
    const char *linhas[] = {"velocidade 2.5", "gravidade 99", "tamanho 12", "cor 3"};
    Ajustes     r = {0};                // todos os campos em zero
    char        nome[32];               // o nome lido na linha
    double      v;                      // o valor lido na linha

    for (size_t i = 0; i < 4; i++) {            // uma passagem por linha
        if (sscanf(linhas[i], "%31s %lf", nome, &v) != 2)   // extrai « nome valor »
            continue;                   // linha malformada: ignoramos
        if (aplicar(&r, nome, v) == -1)         // campo desconhecido?
            printf("diretiva desconhecida : %s\n", nome);
    }
    printf("velocidade=%g gravidade=%g tamanho=%d\n", r.velocidade, r.gravidade, r.tamanho);
    return 0;
}
```

```text
diretiva desconhecida : cor
velocidade=2.5 gravidade=20 tamanho=12
```

O programa funciona: `gravidade 99` foi limitado ao valor 20, e `cor` é sinalizada como desconhecida. Alguns elementos usados:

| Elemento | Papel |
|---|---|
| `static` (diante de uma função) | A função só é visível neste arquivo |
| `const` (em `const char *nome`) | Promete que o valor apontado não será modificado |
| `const char *linhas[] = {...}` | Um array de textos; um texto é uma sequência de `char` (veja [as strings](/?c=langages&s=c&p=variables#as-strings)) |
| `typedef struct {...} Ajustes;` | Dá o nome curto `Ajustes` a esse tipo de estrutura, para não escrever `struct` em cada uso ([`typedef`](https://en.cppreference.com/w/c/language/typedef)) |
| `r->velocidade` | O campo `velocidade` da estrutura cujo endereço é `r`; equivale a `(*r).velocidade` |
| `strcmp(a, b) == 0` | Verdadeiro quando os dois textos são idênticos (veja [comparar uma string](/?c=langages&s=c&p=variables#buscar-e-comparar-uma-string-strcmp-strchr-strrchr-strstr)) |
| `sscanf(linha, "%31s %lf", nome, &v)` | Extrai uma palavra (no máximo 31 caracteres) e depois um número do tipo `double`; retorna o número de valores lidos (veja [`sscanf`](/?c=langages&s=c&p=lecture-formatee-scanf)) |
| `Ajustes r = {0};` | Inicializa a estrutura: o primeiro campo vale 0 e os campos não citados também valem zero |
| `(float)v` | Converte o `double` em `float` antes da escrita (dois tipos de número com vírgula, o `double` sendo o mais preciso: veja [os números de ponto flutuante](/?c=langages&s=c&p=variables#os-numeros-de-ponto-flutuante)) |
| `%g`, `%d` | No `printf`: um número decimal sem zeros inúteis, um inteiro |
| `size_t` | Inteiro sem sinal feito para contar tamanhos e posições; `printf` o exibe com `%zu` |

Seus defeitos aparecem assim que há mais de três campos:

| Defeito | Consequência |
|---|---|
| Um ramo a mais por campo | Vinte campos dão vinte ramos quase idênticos |
| Os limites são copiados em cada ramo | Mudar uma regra de limitação obriga a tocar em cada ramo |
| Esquecimento fácil | Um campo acrescentado à estrutura sem ramo correspondente é ignorado em silêncio |
| Os dados ficam misturados ao código | Impossível reutilizar a lista de diretivas (para exibir uma ajuda, por exemplo) |

A solução: separar os **dados** (quais diretivas existem, com quais limites) do **código** (uma única função que sabe aplicar qualquer diretiva). Os dados vão em um array e, para que a função saiba onde escrever, o array deve guardar a posição do campo na estrutura.

## `offsetof`: a posição de um campo em sua estrutura

O **deslocamento** (*offset*) de um campo é o número de bytes entre o início da estrutura e o início desse campo. O primeiro campo fica em 0. A macro `offsetof(tipo, campo)`, definida no cabeçalho `<stddef.h>` (veja [os cabeçalhos](/?c=langages&s=c&p=headers)), calcula-o e o devolve na forma de `size_t` ([`offsetof`](https://en.cppreference.com/w/c/types/offsetof)). Uma **macro** é um trecho de código que o preprocessador substitui antes da compilação (veja [o preprocessador](/?c=langages&s=c&p=compilation#1-o-preprocessador)).

Seria de se esperar que o deslocamento de um campo fosse a soma dos tamanhos dos campos anteriores. Isso é falso assim que o compilador insere **preenchimento** (*padding*): bytes perdidos, colocados entre dois campos para que cada valor comece em um endereço múltiplo do seu tamanho (veja [o preenchimento](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#o-preenchimento-padding-nas-structs) e [o alinhamento](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#o-alinhamento)). Este programa mostra os deslocamentos reais de uma estrutura de teste:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    char   ativo;                       // 1 byte
    float  velocidade;                  // 4 bytes
    char   nivel;                       // 1 byte
    double massa;                       // 8 bytes
} Demo;

int main(void)
{
    printf("ativo      : deslocamento %zu\n", offsetof(Demo, ativo));       // início
    printf("velocidade : deslocamento %zu\n", offsetof(Demo, velocidade)); // após preench.
    printf("nivel      : deslocamento %zu\n", offsetof(Demo, nivel));        // logo após
    printf("massa      : deslocamento %zu\n", offsetof(Demo, massa));      // após preench.
    printf("tamanho total : %zu bytes\n", sizeof(Demo));                     // soma: 14
    return 0;
}
```

```text
ativo      : deslocamento 0
velocidade : deslocamento 4
nivel      : deslocamento 8
massa      : deslocamento 16
tamanho total : 24 bytes
```

Os quatro campos pesam 1 + 4 + 1 + 8 = 14 bytes, a estrutura ocupa 24 ([`sizeof`](/?c=langages&s=c&p=memoire#sizeof) dá o tamanho em bytes de um tipo). Eis a memória dessa estrutura, um byte por coluna:

```text
byte    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
        a  .  .  .  v  v  v  v  n  .  .  .  .  .  .  .  m  m  m  m  m  m  m  m
        ^           ^           ^                       ^
        desl. 0     desl. 4     desl. 8                 desl. 16

a = ativo   v = velocidade   n = nivel   m = massa   . = preenchimento (bytes perdidos)
```

| Campo | Tamanho | Deslocamento previsto pela soma | Deslocamento real (`offsetof`) | Por que a diferença |
|---|---|---|---|---|
| `ativo` | 1 | 0 | 0 | Primeiro campo |
| `velocidade` | 4 | 1 | 4 | Um `float` começa em um múltiplo de 4: 3 bytes perdidos |
| `nivel` | 1 | 5 | 8 | Segue `velocidade`, que termina no byte 7 |
| `massa` | 8 | 6 | 16 | Um `double` começa em um múltiplo de 8: 7 bytes perdidos |

Essa diferença é exatamente a razão de ser do `offsetof`: só o compilador sabe onde colocou cada campo, e ele informa isso aqui. O resultado é uma **constante** conhecida na compilação, portanto utilizável em um array inicializado fora de qualquer função. Vale para **qualquer** variável do mesmo tipo de estrutura: um deslocamento não depende de um exemplar específico.

## A tabela de diretivas e a função única

Cada diretiva vira uma linha `{nome, deslocamento, min, max}` de um array. Toda a lógica cabe então em uma única função: procurar a linha pelo nome, limitar o valor, escrever no campo. Para começar, a tabela contém apenas os dois campos `float`; `tamanho`, do tipo `int`, aparece na seção seguinte.

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float velocidade;                   // velocidade de movimento
    float gravidade;                    // intensidade da gravidade
    int   tamanho;                      // tamanho em casas (tratado mais adiante)
} Ajustes;

typedef struct {
    const char *nome;                   // nome da diretiva no arquivo
    size_t      deslocamento;           // posição do campo em Ajustes, em bytes
    double      min;                    // menor valor aceito
    double      max;                    // maior valor aceito
} Diretiva;

static const Diretiva g_tabela[] = {
    {"velocidade", offsetof(Ajustes, velocidade), 0.0, 10.0},   // uma linha por campo
    {"gravidade", offsetof(Ajustes, gravidade), 0.0, 20.0},
};
#define NUM_DIRETIVAS (sizeof g_tabela / sizeof g_tabela[0])     // número de linhas

// Aplica uma linha « nome valor ». Retorna 0 se foi aplicada, -1 caso contrário.
static int aplicar_linha(Ajustes *r, const char *linha)
{
    char   nome[32];                    // o nome lido
    double v;                           // o valor lido

    if (sscanf(linha, "%31s %lf", nome, &v) != 2 || !isfinite(v))   // forma e valor
        return -1;
    for (size_t i = 0; i < NUM_DIRETIVAS; i++) {        // procura a linha na tabela
        if (strcmp(nome, g_tabela[i].nome) != 0)        // não é esta
            continue;
        if (v < g_tabela[i].min) v = g_tabela[i].min;   // limite inferior
        if (v > g_tabela[i].max) v = g_tabela[i].max;   // limite superior
        *(float *)((char *)r + g_tabela[i].deslocamento) = (float)v;   // escreve no campo
        return 0;
    }
    return -1;                          // nenhuma linha tem esse nome
}

int main(void)
{
    const char *linhas[] = {"velocidade 2.5", "gravidade 99", "cor 3", "velocidade nan"};
    Ajustes     r = {0};                // todos os campos em zero

    for (size_t i = 0; i < 4; i++)      // uma passagem por linha
        if (aplicar_linha(&r, linhas[i]) == -1)
            printf("linha rejeitada : %s\n", linhas[i]);
    printf("velocidade=%g gravidade=%g\n", r.velocidade, r.gravidade);
    return 0;
}
```

```text
linha rejeitada : cor 3
linha rejeitada : velocidade nan
velocidade=2.5 gravidade=20
```

| Elemento | Papel |
|---|---|
| `static const Diretiva g_tabela[]` | Array fixo, nunca modificado (`const`), visível só neste arquivo (`static`) |
| `{"velocidade", offsetof(...), 0.0, 10.0}` | Uma linha: o nome, o deslocamento do campo, depois os dois limites |
| `sizeof g_tabela / sizeof g_tabela[0]` | Bytes do array inteiro divididos pelos bytes de uma linha: o número de linhas, que acompanha sozinho cada acréscimo |
| `continue;` | Passa diretamente à próxima volta do laço (veja [`break` e `continue`](/?c=langages&s=c&p=boucles#break-e-continue)) |
| `... != 2 \|\| !isfinite(v)` | `\|\|` significa « ou »; `!` inverte uma condição: rejeita-se se a linha estiver malformada ou se o valor não for finito |
| `isfinite(v)` | Falso para `NaN` (« não é um número ») e para o infinito, de `<math.h>`: eles passariam pelos limites sem erro (veja [`NaN` e `inf`](/?c=langages&s=c&p=convertir-un-texte-en-nombre#os-numeros-decimais-strtod-nan-e-inf)) |
| Os dois `if` sobre `v` | Trazem o valor para dentro de `[min, max]` (veja [limitar cada valor](/?c=langages&s=c&p=convertir-un-texte-en-nombre#limitar-cada-valor-ao-seu-dominio)) |

### Desmontando a escrita no campo

A linha importante é `*(float *)((char *)r + g_tabela[i].deslocamento) = (float)v;`. Ela se lê de dentro para fora:

| Etapa | Expressão | Tipo | O que acontece |
|---|---|---|---|
| 1 | `r` | `Ajustes *` | O endereço do início da estrutura |
| 2 | `(char *)r` | `char *` | Um **cast**: uma conversão explícita de um tipo para outro, escrita `(tipo)valor`. O mesmo endereço, mas visto como o de um `char`, que pesa 1 byte |
| 3 | `(char *)r + g_tabela[i].deslocamento` | `char *` | Avança `deslocamento` bytes: o endereço do campo visado |
| 4 | `(float *)(...)` | `float *` | Um segundo cast: mesmo endereço, mas declara-se que ali está um `float` |
| 5 | `*(...)` | `float` | A desreferenciação: o próprio campo, pronto para receber um valor |
| 6 | `= (float)v` | | O `double` lido é convertido em `float`, depois escrito nos 4 bytes do campo |

O `(char *)` da etapa 2 é indispensável. Em um ponteiro, a soma conta **elementos** e não bytes: `r + 8` avançaria 8 vezes o tamanho de `Ajustes` (veja [a aritmética de ponteiros](/?c=langages&s=c&p=pointeurs#aritmetica-de-ponteiros)), bem para fora da estrutura. Com um `char *`, cada unidade vale exatamente 1 byte, e o deslocamento em bytes dado por `offsetof` cai certo.

```text
r (Ajustes *)        r + 4 bytes
     |                    |
     v                    v
     +--------------------+--------------------+--------------------+
     |velocidade (4 bytes)| gravidade (4 bytes)|  tamanho (4 bytes) |
     +--------------------+--------------------+--------------------+
     0                    4                    8                    12

(char *)r + 4  -->  endereço de gravidade  -->  (float *) e depois *  -->  escrita
```

Em C++, esse tipo de conversão de ponteiro se escreve `reinterpret_cast`, justamente para torná-la visível (veja [os casts em C++](/?c=langages&s=cpp&p=cast-cpp)): o C só tem a sintaxe `(tipo)valor` para tudo.

O deslocamento, e não o endereço do campo, é o que a tabela guarda, porque a tabela existe antes de qualquer estrutura: ela é escrita uma vez, e a mesma linha serve para qualquer exemplar de `Ajustes`, esteja ele na pilha (a memória das variáveis locais) ou em um array. Acrescentar um campo equivale a **acrescentar uma única linha** à tabela: a função não muda. O parentesco com a tabela de dispatch do PHP é direto (veja [a tabela de dispatch do roteamento](/?c=langages&s=php&p=routage#o-front-controller-e-a-tabela-de-dispatch)): substitui-se uma sequência de comparações por uma consulta a um array. A variante do C para chamar uma função em vez de escrever em um campo se apoia em [os ponteiros de função](/?c=langages&s=c&p=pointeurs#ponteiros-de-funcoes) e no [dispatch por etiqueta de tipo](/?c=langages&s=c&p=generiques-par-etiquette-de-type#dispatch-sem-uma-cadeia-de-if-else-if).

## Os limites e as armadilhas da escrita por deslocamento

### Vários tipos de campo: uma coluna « tipo »

O cast `(float *)` supõe que **todos** os campos visados sejam `float`. Assim que um campo é `int`, a função precisa saber qual escrever: a tabela ganha uma coluna `tipo`. Uma **enumeração** (`enum`) é uma lista de nomes aos quais o compilador atribui inteiros 0, 1, 2... ([`enum`](https://en.cppreference.com/w/c/language/enum)); aqui ela serve de etiqueta.

```c
typedef enum {                          // os tipos de campo que a tabela sabe escrever
    TYPE_FLOAT,                         // o campo é um float
    TYPE_INT                            // o campo é um int
} Tipo;

typedef struct {
    const char *nome;                   // nome da diretiva no arquivo
    Tipo        tipo;                   // tipo do campo visado
    size_t      deslocamento;           // posição do campo em Ajustes, em bytes
    double      min;                    // menor valor aceito
    double      max;                    // maior valor aceito
} Diretiva;

static const Diretiva g_tabela[] = {
    {"velocidade", TYPE_FLOAT, offsetof(Ajustes, velocidade), 0.0, 10.0},
    {"gravidade", TYPE_FLOAT, offsetof(Ajustes, gravidade), 0.0, 20.0},
    {"tamanho",  TYPE_INT,   offsetof(Ajustes, tamanho),  1.0, 50.0},   // linha nova
};

// Escreve v no campo descrito por d, com o tipo correto.
static void escrever_campo(Ajustes *r, const Diretiva *d, double v)
{
    char *byte = (char *)r + d->deslocamento;   // endereço do campo, contado em bytes

    switch (d->tipo) {                  // o tipo decide como escrever
    case TYPE_FLOAT:
        *(float *)byte = (float)v;      // 4 bytes, codificados como ponto flutuante
        break;
    case TYPE_INT:
        *(int *)byte = (int)v;          // 4 bytes, codificados como inteiro
        break;
    }
}
```

`aplicar_linha` quase não muda: em vez de escrever no campo, ela chama `escrever_campo(r, &g_tabela[i], v)`. O `switch` escolhe entre casos conforme um valor (veja [o `switch`](/?c=langages&s=c&p=conditions#o-switch)). O programa completo da última seção reúne todas essas peças.

### O alinhamento: por que a fórmula cai certo

O endereço `(char *)r + deslocamento` está corretamente alinhado para o tipo do campo **porque** `deslocamento` vem de `offsetof`, que leva o preenchimento em conta. Um deslocamento calculado à mão (4 + 4 para chegar a `tamanho`) falharia assim que um campo fosse precedido de um tipo menor ou maior: na estrutura de teste da seção anterior, a soma dava 1 para `velocidade`, e o real é 4. Um acesso desalinhado é proibido em alguns processadores e mais lento nos outros.

### Escrever um tipo do tamanho errado

O compilador não verifica se o cast corresponde ao campo. Escrever um `double` (8 bytes) no endereço de um `float` (4 bytes) transborda para o campo vizinho:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float velocidade;                   // bytes 0 a 3
    float gravidade;                    // bytes 4 a 7
    int   tamanho;                      // bytes 8 a 11
} Ajustes;

int main(void)
{
    Ajustes r = {5.0f, 9.8f, 12};       // três valores iniciais

    // ERRO proposital: um double (8 bytes) escrito em um campo de 4 bytes
    *(double *)((char *)&r + offsetof(Ajustes, velocidade)) = 1.0;
    printf("velocidade=%g gravidade=%g tamanho=%d\n", r.velocidade, r.gravidade, r.tamanho);
    return 0;
}
```

```text
velocidade=0 gravidade=1.875 tamanho=12
```

Os 8 bytes do `double` `1.0` recobriram `velocidade` **e** `gravidade`. Os valores exibidos (0, depois 1,875) são os de um processador x86 de teste, que guarda os bytes de um número começando pelo menos significativo (veja [a ordem dos bytes](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire#a-ordem-dos-bytes-endianness)); em outra máquina eles mudariam. A linguagem não promete nada aqui: é um **comportamento indefinido**, um caso em que a norma da linguagem C não garante resultado algum (nem travamento nem valor preciso).

### Perder a verificação de tipo

Uma escrita normal, `s.tamanho = 2.5f`, passa pelo compilador, que conhece o tipo do campo: ele converte e, com a opção `-Wconversion`, avisa sobre a perda. Com o deslocamento, ele não sabe mais nada:

```c
#include <stddef.h>
#include <stdio.h>

typedef struct {
    float velocidade;                   // campo do tipo float
    int   tamanho;                      // campo do tipo int
} R;

int main(void)
{
    R r = {0, 0};                       // dois campos em zero
    R s = {0, 0};                       // uma segunda estrutura, para comparar

    s.tamanho = 2.5f;                   // escrita normal: o compilador converte
    *(float *)((char *)&r + offsetof(R, tamanho)) = 2.5f;   // escrita por deslocamento
    printf("normal : tamanho=%d\n", s.tamanho);
    printf("por deslocamento : tamanho=%d\n", r.tamanho);
    return 0;
}
```

```text
normal : tamanho=2
por deslocamento : tamanho=1075838976
```

A segunda escrita compila sem o menor aviso: os 4 bytes do `float` 2,5 foram postos tal qual em um campo lido depois como inteiro, daí 1.075.838.976. Esse é o preço da tabela guiada: a segurança que dá um `if` por campo (cada ramo é verificado) é substituída pela disciplina de uma coluna `tipo` correta.

| Abordagem | Verificação do compilador | Acrescentar um campo |
|---|---|---|
| Cadeia de `if` ou `switch` sobre o nome | Completa: cada atribuição é tipada | Um ramo inteiro |
| Tabela `{nome, deslocamento, min, max}` | Nenhuma sobre o tipo escrito | Uma linha |

### Campos de bits e as outras estruturas

Um **campo de bits** (*bit-field*) é um campo cuja largura é fixada em bits (`unsigned nivel : 3;`) para agrupar vários pequenos valores em um mesmo byte (veja [os operadores binários](/?c=langages&s=c&p=operateurs-binaires) para as manipulações de bits, e [os campos de bits](https://en.cppreference.com/w/c/language/bit_field)). Ele não tem endereço de byte próprio, então `offsetof` não se aplica a ele. O compilador avisa:

```text
error: attempt to take address of bit-field structure member ‘nivel’
```

Por fim, a tabela está ligada ao tipo de estrutura para o qual seus deslocamentos foram calculados. Aplicada a outro tipo, ela compila mesmo assim e escreve em posições sem relação com o que se queria.

## O literal composto do C99: um valor fabricado no lugar

Um **literal** é um valor escrito tal como é no código: `42`, `3.5`, `'a'`, `"abc"`. Números e caracteres bastam para os tipos simples, mas nenhuma escrita produz uma estrutura de uma vez. Para passar o ponto (4, 6) a uma função (como **argumento**: o valor dado à função quando a chamamos, veja [a passagem a uma função](/?c=langages&s=c&p=pointeurs#passar-um-ponteiro-a-uma-funcao-passagem-por-endereco)), era preciso declarar uma variável, preenchê-la e depois passá-la. O **literal composto** fabrica esse valor no lugar onde ele é necessário: `(Tipo){valores}` ([literal composto](https://en.cppreference.com/w/c/language/compound_literal)). A parte `(Tipo)` parece um cast, mas as chaves que seguem fazem dela um valor construído.

| Maneira de fabricar o ponto (4, 6) | Escrita | Variável nomeada |
|---|---|---|
| Declaração com inicialização | `Point p = {4, 6};` | Sim, `p` |
| Atribuição campo a campo | `p.x = 4; p.y = 6;` | Sim, `p` |
| Literal composto | `(Point){4, 6}` | Não |

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscissa
    int y;                              // ordenada
} Point;

static double distance2(Point a, Point b)
{
    int dx = b.x - a.x;                 // diferença horizontal
    int dy = b.y - a.y;                 // diferença vertical
    return (double)(dx * dx + dy * dy); // quadrado da distância
}

static int soma(const int *t, int n)
{
    int total = 0;                      // acumulado
    for (int i = 0; i < n; i++)         // percorre n inteiros
        total += t[i];
    return total;
}

static void mover(Point *p)
{
    p->x += 10;                         // altera o ponto recebido por endereço
}

int main(void)
{
    Point p = {1, 2};                   // a forma clássica: uma variável nomeada

    printf("%.0f\n", distance2(p, (Point){4, 6}));              // um ponto sem nome
    printf("%.0f\n", distance2((Point){0, 0}, (Point){.y = 3, .x = 4}));
    printf("%d\n", soma((int[]){1, 2, 3, 4}, 4));               // um array sem nome
    printf("%d\n", soma((int[5]){1, 2}, 5));                    // 5 casas, 3 em zero
    mover(&(Point){7, 7});              // endereço de um literal: pode ser escrito
    char *palavra = (char[]){"abc"};    // array de char modificável (cópia de "abc")
    palavra[0] = 'X';                   // permitido: não é um literal de string
    printf("%s\n", palavra);
    return 0;
}
```

```text
25
25
10
3
Xbc
```

| Forma | Exemplo | O que se obtém |
|---|---|---|
| Estrutura, valores na ordem dos campos | `(Point){4, 6}` | `x` vale 4, `y` vale 6 |
| Estrutura, **inicializadores designados** | `(Point){.y = 3, .x = 4}` | `.campo = valor` nomeia o campo visado: a ordem é livre e um campo não citado vale zero ([inicialização](https://en.cppreference.com/w/c/language/struct_initialization)) |
| Array, tamanho deduzido | `(int[]){1, 2, 3, 4}` | 4 casas |
| Array, tamanho fixado | `(int[5]){1, 2}` | 5 casas, as três últimas em zero |
| Array designado | `(int[]){[2] = 7}` | 3 casas: `{0, 0, 7}` |
| Texto modificável | `(char[]){"abc"}` | 4 casas (`a`, `b`, `c` e o `\0` final), copiadas e modificáveis |

Os valores `25` e `25` são os quadrados das distâncias de (1, 2) a (4, 6) e de (0, 0) a (4, 3): nos dois casos 3 e 4 (ou 4 e 3) de diferença, ou seja 9 + 16.

### Tempo de vida: até o fim do bloco

O **tempo de vida** de um valor é o período durante o qual ele existe na memória. Um **bloco** é o texto compreendido entre uma chave de abertura `{` e a de fechamento `}` (corpo de uma função, de um laço...). Um literal composto escrito em um bloco se comporta como uma variável local desse bloco:

| Onde o literal é escrito | Seu tempo de vida |
|---|---|
| Em uma função ou em um bloco | Até a chave de fechamento do bloco que o envolve |
| No corpo de um laço | Recriado a cada volta |
| Fora de qualquer função | Todo o programa (os valores devem então ser constantes) |

```c
typedef struct { int x; int y; } Point;

static Point *const g_origem = &(Point){0, 0};     // fora de função: vive o programa todo
static const int   *g_primeiros = (const int[]){2, 3, 5, 7};   // idem

void exemplo(void)
{
    int *p;                             // um ponteiro, declarado no bloco da função
    {                                   // um bloco interno
        p = (int[]){1, 2, 3};           // o array vive até a } seguinte
    }                                   // aqui o array não existe mais
}                                       // e p apontaria para uma área morta
```

A consequência: **nunca guardar nem devolver o endereço de um literal composto local**. Devolvê-lo por valor, em contrapartida, é sem perigo, pois é uma cópia.

```c
#include <stdio.h>

typedef struct {
    int x;                              // abscissa
    int y;                              // ordenada
} Point;

static Point *g_ptr;                    // ponteiro global, para guardar um endereço

static void guardar(void)
{
    g_ptr = &(Point){3, 4};             // o endereço de um literal local é guardado
}

int main(void)
{
    guardar();                          // a função termina: seu literal deixa de existir
    printf("%d\n", g_ptr->x);           // leitura de uma área morta
    return 0;
}
```

Compilado apenas com `-Wall -Wextra -Werror`, este programa é recusado pelo GCC: `error: storing the address of local variable ‘({anonymous})’ in ‘g_ptr’ [-Werror=dangling-pointer=]`. Compilado com `-fsanitize=address,undefined` a mais, ele passa pela compilação, e a execução para em `ERROR: AddressSanitizer: stack-use-after-return`. Essas mensagens são as da máquina de teste; outro compilador pode se calar na compilação, mas o erro existe do mesmo jeito.

### Modificável, ao contrário de um literal de string

O texto `"abc"` escrito no código costuma ser guardado em uma área de memória somente leitura: escrever nela é um comportamento indefinido, quase sempre um travamento. Um literal composto `(char[]){"abc"}`, ao contrário, é uma **cópia** em um array comum: pode-se modificá-lo (o programa acima fez isso: `Xbc`). Para impedir, acrescenta-se `const`: `(const Point){4, 6}`.

### Um pouco de C++

O literal composto é um recurso do C, não do C++ padrão: um compilador C++ o recusa ou, como o GCC, o aceita como extensão avisando com `-pedantic` `ISO C++ forbids compound-literals`. Em C++, escreve-se `Point{4, 6}` ou usa-se um construtor (veja [as classes e objetos](/?c=langages&s=cpp&p=classes-et-objets)). Um arquivo destinado às duas linguagens evita, portanto, o literal composto.

## Um exemplo que combina os dois

As duas noções se completam: a tabela preenche a estrutura, e um literal composto fornece seus valores padrão. Estes ficam em uma função que retorna a estrutura por valor; os campos que um arquivo de ajustes não menciona mantêm assim um valor razoável em vez de zero. O programa reúne a tabela da seção anterior (com o tipo) e o literal composto:

```c
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    float velocidade;                   // velocidade de movimento
    float gravidade;                    // intensidade da gravidade
    int   tamanho;                      // tamanho em casas
} Ajustes;

typedef enum { TYPE_FLOAT, TYPE_INT } Tipo;   // tipos de campo que a tabela sabe escrever

typedef struct {
    const char *nome;                   // nome da diretiva no arquivo
    Tipo        tipo;                   // tipo do campo visado
    size_t      deslocamento;           // posição do campo em Ajustes, em bytes
    double      min;                    // menor valor aceito
    double      max;                    // maior valor aceito
} Diretiva;

static const Diretiva g_tabela[] = {
    {"velocidade", TYPE_FLOAT, offsetof(Ajustes, velocidade), 0.0, 10.0},
    {"gravidade", TYPE_FLOAT, offsetof(Ajustes, gravidade), 0.0, 20.0},
    {"tamanho",  TYPE_INT,   offsetof(Ajustes, tamanho),  1.0, 50.0},
};
#define NUM_DIRETIVAS (sizeof g_tabela / sizeof g_tabela[0])     // número de linhas

// Os valores de partida, fabricados no lugar e retornados por valor (uma cópia).
static Ajustes ajustes_padrao(void)
{
    return (Ajustes){.velocidade = 1.0f, .gravidade = 9.8f, .tamanho = 4};
}

static void escrever_campo(Ajustes *r, const Diretiva *d, double v)
{
    char *byte = (char *)r + d->deslocamento;   // endereço do campo, contado em bytes

    if (d->tipo == TYPE_FLOAT)          // campo do tipo float
        *(float *)byte = (float)v;
    else                                // campo do tipo int
        *(int *)byte = (int)v;
}

static int aplicar_linha(Ajustes *r, const char *linha)
{
    char   nome[32];                    // o nome lido
    double v;                           // o valor lido

    if (sscanf(linha, "%31s %lf", nome, &v) != 2 || !isfinite(v))   // forma e valor
        return -1;
    for (size_t i = 0; i < NUM_DIRETIVAS; i++) {        // procura a linha na tabela
        if (strcmp(nome, g_tabela[i].nome) != 0)        // não é esta
            continue;
        if (v < g_tabela[i].min) v = g_tabela[i].min;   // limite inferior
        if (v > g_tabela[i].max) v = g_tabela[i].max;   // limite superior
        escrever_campo(r, &g_tabela[i], v);             // escrita tipada
        return 0;
    }
    return -1;                          // nenhuma linha tem esse nome
}

static void mostrar(const char *titulo, const Ajustes *r)
{
    printf("%-8s velocidade=%g gravidade=%g tamanho=%d\n",
           titulo, r->velocidade, r->gravidade, r->tamanho);
}

int main(void)
{
    const char *linhas[] = {"velocidade 2.5", "tamanho 120", "gravidade -3", "cor 3"};
    Ajustes     r = ajustes_padrao();   // partimos dos valores padrão

    mostrar("init", &r);
    for (size_t i = 0; i < 4; i++)      // uma passagem por linha do arquivo
        if (aplicar_linha(&r, linhas[i]) == -1)
            printf("linha rejeitada : %s\n", linhas[i]);
    mostrar("lido", &r);
    mostrar("parcial", &(Ajustes){.tamanho = 8});     // só tamanho é dado
    return 0;
}
```

```text
init     velocidade=1 gravidade=9.8 tamanho=4
linha rejeitada : cor 3
lido     velocidade=2.5 gravidade=0 tamanho=50
parcial  velocidade=0 gravidade=0 tamanho=8
```

| Elemento | Papel |
|---|---|
| `(Ajustes){.velocidade = 1.0f, .gravidade = 9.8f, .tamanho = 4}` | Fabrica a estrutura dos valores padrão, com campos nomeados: a ordem da declaração não importa |
| `return (Ajustes){...};` | Retorna uma cópia da estrutura: seguro, ao contrário do endereço de um literal local |
| `mostrar("parcial", &(Ajustes){.tamanho = 8})` | Passa o endereço de uma estrutura sem nome; os campos não citados valem zero, daí `velocidade=0 gravidade=0` |
| `const Ajustes *r` | Diz que `mostrar` não alterará a estrutura recebida |
| `%-8s` | Escreve um texto alinhado à esquerda em 8 caracteres, para que as colunas se alinhem |

| Linha do arquivo | O que faz a tabela | Resultado |
|---|---|---|
| `velocidade 2.5` | Valor em `[0, 10]` | `velocidade` passa de 1 para 2,5 |
| `tamanho 120` | Ultrapassa o limite 50 | `tamanho` vale 50, escrito como `int` |
| `gravidade -3` | Abaixo do limite 0 | `gravidade` vale 0 |
| `cor 3` | Nenhuma linha com esse nome | Rejeitada, a estrutura não muda |

Acrescentar um ajuste (uma `cor`, um `volume`) exige um campo em `Ajustes`, um valor em `ajustes_padrao` e uma linha em `g_tabela`: nenhuma função a modificar.

## As armadilhas

| Armadilha | Por quê | Solução |
|---|---|---|
| Escrever `r + deslocamento` sem `(char *)` | A soma conta em estruturas inteiras e não em bytes | Sempre `(char *)r + deslocamento` |
| Um cast que não corresponde ao tipo do campo | Tamanho ou codificação errados, sem erro nem aviso | Coluna `tipo` e um cast por tipo |
| Escrever um `double` em um campo `float` | Transborda para o campo vizinho (comportamento indefinido) | Converter o valor com `(float)v` antes da escrita |
| Calcular o deslocamento somando tamanhos | O preenchimento desloca os campos | Somente `offsetof` |
| `offsetof` em um campo de bits | Ele não tem endereço de byte: erro de compilação | Campo comum, ou função de acesso dedicada |
| Uma tabela aplicada a outra estrutura | Os deslocamentos deixam de corresponder, sem erro | Uma tabela por tipo de estrutura, nomeada em conformidade |
| Deixar passar `NaN` | Atravessa todos os testes de limite | Testar `isfinite` antes de limitar |
| Guardar o endereço de um literal composto local | Ele desaparece no fim do bloco | Retornar a estrutura por valor ou copiá-la em uma variável de vida longa |
| Modificar um literal de string `"abc"` | Área somente leitura: comportamento indefinido | Copiar para um array: `char t[] = "abc";` ou `(char[]){"abc"}` |
| Valores de um literal composto na ordem dos campos | Um campo deslocado ou acrescentado muda o sentido sem erro | Inicializadores designados `.campo = valor` |
| Usar o literal composto em código compartilhado com C++ | Não padrão em C++ | Reservar esse código ao C, ou escrever `Point{4, 6}` do lado C++ |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Separar os dados (a tabela) do código (a função única) | Acrescentar um ajuste toca apenas uma linha |
| Contar as linhas com `sizeof g_tabela / sizeof g_tabela[0]` | O número acompanha sozinho cada acréscimo |
| Declarar a tabela `static const` | Ela não pode ser modificada nem por engano nem a partir de outro arquivo |
| Calcular cada deslocamento com `offsetof`, nunca à mão | O compilador conhece o preenchimento |
| Manter uma coluna `tipo` assim que os campos diferirem | Cada escrita tem o cast que lhe convém |
| Limitar e testar `sscanf` antes de escrever | Um valor absurdo ou uma linha malformada não entra |
| Compilar com `-Wall -Wextra` e rodar um teste com `-fsanitize=address,undefined` | As escritas fora do campo e os endereços mortos são detectados já no primeiro teste |
| Dar os valores padrão por um literal composto aos campos nomeados | Os campos esquecidos valem zero, e a ordem dos campos continua livre |
| Retornar um literal composto por valor, nunca por endereço | Uma cópia sobrevive à função |

## O que reter

| | |
|---|---|
| **Para lembrar** | `offsetof(tipo, campo)` (de `<stddef.h>`) dá o deslocamento em bytes de um campo em sua estrutura, preenchimento incluso; guarda-se isso em uma tabela `{nome, deslocamento, min, max}` e uma única função escreve no campo por `*(float *)((char *)r + deslocamento) = valor`. O `(char *)` faz contar em bytes; o segundo cast diz qual tipo está ali. Um campo a mais = uma linha a mais. O literal composto `(Tipo){valores}` (C99) fabrica uma estrutura ou um array no lugar, modificável, válido até o fim do bloco; os inicializadores designados `.campo = valor` nomeiam os campos. Documentação: [`offsetof`](https://en.cppreference.com/w/c/types/offsetof), [literal composto](https://en.cppreference.com/w/c/language/compound_literal). |
| **Armadilhas a evitar** | Esquecer `(char *)`; um cast que não corresponde ao tipo do campo (nenhuma verificação do compilador); escrever um `double` em um `float`; calcular um deslocamento à mão; `offsetof` em um campo de bits; uma tabela aplicada à estrutura errada; deixar passar `NaN`; guardar o endereço de um literal composto local; modificar um literal de string; contar com o literal composto em C++. |
| **Boas práticas** | Tabela `static const` separada do código; `offsetof` para cada deslocamento; coluna `tipo` assim que os campos diferirem; limites aplicados em um único lugar; valores padrão em literal composto com inicializadores designados; literal composto retornado por valor, nunca por endereço. |
