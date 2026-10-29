---
order: 30
---

# Filtrar uma string no próprio lugar com dois ponteiros

Remover caracteres de um texto (espaços em excesso, quebras de linha, tudo o que não é letra) parece simples enquanto temos o direito de criar um segundo texto. Este capítulo mostra como fazê-lo **no próprio lugar**: na própria memória do texto original, sem alocar nada, em uma única passagem. A técnica se apoia em dois ponteiros, um que lê e outro que escreve. Ela reúne três noções que o C usa em toda parte: a escrita `*out++ = *p`, a diferença entre `*p++` e `(*p)++`, e a subtração de dois ponteiros.

Ele pressupõe que você já conhece [os ponteiros](/?c=langages&s=c&p=pointeurs) (uma variável que guarda o endereço de outra; `*p` lê ou escreve a casa apontada; `p + 1` designa a casa seguinte, veja [a aritmética de ponteiros](/?c=langages&s=c&p=pointeurs#aritmetica-de-ponteiros)), [as strings](/?c=langages&s=c&p=variables#as-strings) (um array de `char` terminado pelo **caractere nulo** `'\0'`, de código 0, que marca o fim do texto) e [os laços](/?c=langages&s=c&p=boucles). Um `char` é um pequeno inteiro que codifica uma letra, um algarismo ou um sinal: `'a'` vale 97, e `'a' + 1` vale `'b'`.

## O problema: remover caracteres sem uma segunda string

Dois filtros servem de fio condutor para todo o capítulo.

| Filtro | Regra | Antes | Depois |
|---|---|---|---|
| Espaços em excesso | Uma sequência de espaços vira um único espaço | `a   b  c` | `a b c` |
| Linhas cortadas | Uma barra invertida `\` seguida de quebra de linha desaparece | `un \` + quebra de linha + `deux` | `un deux` |

A **barra invertida** (*backslash*) `\` e a **quebra de linha** (o caractere que termina uma linha, escrito `'\n'` em C) são dois caracteres como os outros. Em um texto escrito entre aspas em C, o `\` introduz um caractere especial (`\n`, `\0`): para designar um `\` de verdade, escreve-se dois, `'\\'`.

### Primeira ideia: deslocar o restante a cada remoção

Assim que um caractere deve desaparecer, recua-se uma casa tudo o que vem depois dele. `memmove(destino, origem, n)` ([documentação](https://en.cppreference.com/w/c/string/byte/memmove)) copia `n` bytes de uma área para outra, mesmo que as duas áreas se sobreponham (o que `memcpy` não tem permissão de fazer, veja [copiar e preencher bytes](/?c=langages&s=c&p=memoire#copiar-e-preencher-bytes-memcpy-e-memset)). `strlen(t)` ([documentação](https://en.cppreference.com/w/c/string/byte/strlen)) conta os caracteres de `t` até o `'\0'`. O programa também conta os bytes movidos, para medir o custo. Os elementos que ele emprega:

| Elemento | Papel |
|---|---|
| `size_t` | Inteiro sem sinal feito para um tamanho ou um comprimento (o que `strlen` devolve) |
| `unsigned long` | Inteiro sem sinal, grande o bastante para um total que passa de alguns bilhões |
| `&movidos` | O endereço da variável `movidos`, para que a função a modifique (veja [passar um ponteiro a uma função](/?c=langages&s=c&p=pointeurs#passar-um-ponteiro-a-uma-funcao-passagem-por-endereco)) |
| `%s`, `%zu`, `%lu`, `%c`, `%td` | Marcadores do `printf` para um texto, um `size_t`, um `unsigned long`, um caractere, um `ptrdiff_t` |
| `[%s]` | Os colchetes em volta do texto mostram onde ele começa e onde termina (útil para ver os espaços) |

```c
#include <stdio.h>
#include <string.h>

// Reduz cada sequência de espaços a um só, deslocando o restante do texto.
// Soma em *movidos o número de bytes deslocados, para medir o custo.
void compactar_ingenuo(char *s, unsigned long *movidos)
{
    size_t i = 0;                       // posição atual em s

    while (s[i] != '\0') {              // até o fim do texto
        if (s[i] == ' ' && s[i + 1] == ' ') {   // dois espaços seguidos: um está em excesso
            size_t resto = strlen(s + i + 1) + 1;   // bytes a deslocar, '\0' incluído
            memmove(s + i, s + i + 1, resto);       // recua todo o restante uma casa
            *movidos += resto;          // anota o custo desse deslocamento
        } else {
            i++;                        // nada a remover aqui: avança
        }
    }
}

int main(void)
{
    char          s[] = "a   b  c";     // 3 espaços entre a e b, 2 entre b e c
    unsigned long movidos = 0;          // total de bytes deslocados

    compactar_ingenuo(s, &movidos);     // filtra s no próprio lugar
    printf("[%s] depois de %lu bytes movidos\n", s, movidos);   // [ ] marcam as bordas
    return 0;
}
```

```text
[a b c] depois de 16 bytes movidos
```

O resultado está certo, mas o trabalho é desperdiçado: as três remoções deslocaram 7, depois 6, depois 3 bytes, ou seja 16. Cada remoção recopia **todo o restante**: em um texto de `n` caracteres que contém da ordem de `n` remoções, o total cresce como `n × n / 2`. Fala-se em custo **quadrático**, anotado `O(n²)` (veja [a complexidade e a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)): um texto dez vezes mais longo exige cem vezes mais trabalho. A seção « Medir a diferença », mais abaixo, quantifica isso.

### Segunda ideia: uma só passagem com dois ponteiros

Em vez de recuar o restante a cada vez, percorre-se o texto **uma única vez** e recopia-se, à medida que avança, apenas o que se mantém, para o início do mesmo array. Nada a deslocar, nada a alocar.

| Abordagem | Memória extra | Trabalho | Defeito |
|---|---|---|---|
| Copiar para uma segunda string | Uma string inteira ([`malloc` depois `free`](/?c=langages&s=c&p=memoire#alocar-memoria-dinamicamente)) | Uma passagem | Pode falhar por falta de memória; deve ser liberada |
| Deslocar o restante a cada remoção | Nenhuma | Quadrático | Fica lento em um texto longo |
| **Dois ponteiros, no próprio lugar** | Nenhuma | Uma passagem (**linear**: o trabalho cresce como `n`) | Modifica o texto do chamador |

## O princípio: um ponteiro que lê, um ponteiro que escreve

Dois ponteiros apontam para o **mesmo array**, ambos no início, na primeira casa:

| Ponteiro | Nome usual | Papel | Avança quando? |
|---|---|---|---|
| Leitura | `p` | Examina cada caractere, do primeiro até o `'\0'` | A cada volta do laço |
| Escrita | `out` | Designa a casa onde escrever o próximo caractere mantido | Somente quando um caractere é mantido |

Uma regra mantém o conjunto seguro: **`out <= p` em todo momento**. Os dois ponteiros partem da mesma casa; a cada volta, `p` avança uma casa (ou mais) e `out` no máximo uma casa. Logo `out` nunca pode alcançar e depois ultrapassar `p`, e cada casa onde se escreve já foi lida: nunca se sobrescreve um caractere que ainda não foi examinado. O esquema segue o filtro dos espaços em excesso sobre `"a  b"` (o `_` representa um espaço, `^` marca a casa apontada):

```text
Volta 1 : lê 'a'  -> mantido, copiado na casa 0 (sobre ele mesmo)
  casa :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :  ^
  out  :  ^

Volta 2 : lê '_', o último escrito é 'a'  -> mantido, copiado na casa 1
  casa :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :      ^
  out  :      ^

Volta 3 : lê '_', o último escrito é '_'  -> ignorado, out não se move
  casa :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :          ^
  out  :          ^

Volta 4 : lê 'b'  -> mantido, copiado na casa 2 (sobre um espaço já lido)
  casa :  0   1   2   3   4
  s    :  a   _   _   b   \0
  p    :              ^
  out  :          ^

Fim : p lê '\0', o laço para; resta escrever '\0' na casa 3
  casa :  0   1   2   3   4
  s    :  a   _   b   b   \0
  p    :                  ^
  out  :              ^
```

Na volta 3, aparece a distância entre os dois ponteiros: `p` avançou, `out` não. Depois, `out` fica uma casa atrás de `p` até o fim. A regra `out <= p` vale para os filtros que escrevem **no máximo um caractere por caractere lido** (remover, manter, substituir um caractere por outro); um filtro que alongasse o texto a violaria (veja « Quando dá errado »).

## `*out++ = *p`, decomposto

Esta linha recopia o caractere lido para a casa de escrita, depois avança `out`. Ela combina três operadores (símbolos que calculam algo):

| Operador | Nome | Efeito |
|---|---|---|
| `*` diante de um ponteiro | Desreferenciamento | Designa a casa apontada pelo ponteiro, para lê-la ou nela escrever |
| `++` depois de uma variável (`out++`) | Incremento **pós-fixado** | Avança a variável uma casa **depois** de fornecer seu valor anterior |
| `++` antes de uma variável (`++out`) | Incremento **pré-fixado** | Avança a variável **antes** de fornecer seu valor |

Para um ponteiro, « uma casa » quer dizer uma casa do seu tipo (uma casa de `char` aqui, veja [a aritmética de ponteiros](/?c=langages&s=c&p=pointeurs#aritmetica-de-ponteiros)). Resta saber qual se aplica primeiro, `*` ou `++`. É a **precedência** dos operadores (a ordem em que a linguagem os aplica quando se seguem, veja a [tabela oficial](https://en.cppreference.com/w/c/language/operator_precedence)): o `++` pós-fixado passa antes do `*`. Portanto `*out++` lê-se `*(out++)`:

1. `out++` fornece o **endereço antigo** de `out`, e `out` avança uma casa;
2. o `*` se aplica ao endereço antigo: é a casa onde se escreve.

Em outras palavras, `*out++ = *p;` faz exatamente o que fazem estas duas linhas:

```c
*out = *p;   // escreve no endereço que out continha
out++;       // só então avança out
```

| Escrita compacta | Equivalente desenvolvido |
|---|---|
| `*out++ = *p;` | `*out = *p; out++;` |
| `*out++ = *p++;` | `*out = *p; out++; p++;` |
| `c = *p++;` | `c = *p; p++;` |
| `*++out = *p;` | `out++; *out = *p;` (avança **antes** de escrever) |

O mesmo raciocínio distingue quatro expressões que se parecem. O programa testa cada uma delas no texto `"abc"`; `p - t` é o número de casas que `p` se afastou de `t` (a subtração de ponteiros é detalhada mais abaixo). Os parênteses de `(*p)++` contam: sem eles, `*p++` seria lido `*(p++)`.

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
    char  t[] = "abc";                  // o texto de partida
    char *p = t;                        // p aponta para t[0], que vale 'a'
    char  v;                            // o valor que a expressão testada produz

    v = *p++;                           // lê a casa apontada, depois avança p
    printf("*p++   : valor %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // restaura o texto de partida, '\0' incluído
    p = t;                              // e p na primeira casa
    v = (*p)++;                         // lê o valor, depois o aumenta de 1 em t[0]
    printf("(*p)++ : valor %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // mesma restauração
    p = t;
    v = *++p;                           // avança p primeiro, depois lê a casa atingida
    printf("*++p   : valor %c, p - t = %td, t = %s\n", v, p - t, t);

    memcpy(t, "abc", 4);                // mesma restauração
    p = t;
    v = ++*p;                           // aumenta t[0] de 1, depois lê o novo valor
    printf("++*p   : valor %c, p - t = %td, t = %s\n", v, p - t, t);
    return 0;
}
```

```text
*p++   : valor a, p - t = 1, t = abc
(*p)++ : valor a, p - t = 0, t = bbc
*++p   : valor b, p - t = 1, t = abc
++*p   : valor b, p - t = 0, t = bbc
```

| Expressão | Lê-se | Valor produzido | O que muda |
|---|---|---|---|
| `*p++` | `*(p++)` | `a`: a casa apontada **antes** de avançar | `p` avança uma casa; o texto fica intacto |
| `(*p)++` | `(*p)++` | `a`: o valor **antes** do aumento | `t[0]` passa de `a` a `b`; `p` não se move |
| `*++p` | `*(++p)` | `b`: a casa atingida **depois** de avançar | `p` avança uma casa; o texto fica intacto |
| `++*p` | `++(*p)` | `b`: o valor **depois** do aumento | `t[0]` passa de `a` a `b`; `p` não se move |

Para lembrar: o `++` age sobre o que lhe está **colado**. Em `*p++`, ele está colado a `p`, então é o ponteiro que avança. Em `(*p)++` e `++*p`, ele incide sobre `*p`, então é o valor apontado que muda. Quanto ao pré e ao pós-fixado, o segundo fornece o valor de **antes**, o primeiro o de **depois**.

> **Armadilha:** escrever `*p++;` sozinho, acreditando aumentar o valor apontado. Isso avança `p` e descarta o valor lido; com `-Wall` (a opção que ativa os avisos usuais do [`gcc`](/?c=langages&s=c&p=compilation), o compilador: o programa que traduz o C em programa executável), o compilador avisa: `warning: value computed is not used`. Para aumentar o valor, use `(*p)++`.

Última precaução: em `*out++ = *p++`, duas variáveis diferentes são modificadas (`out` e `p`), o que é sem perigo. Já uma expressão que **modifica** uma variável e a **lê** em outro ponto, como `*out++ = *out`, tem um **comportamento indefinido** (a linguagem não diz o que acontece: de uma falha a um resultado errado que parece certo): ela não impõe a ordem em que suas partes são executadas (veja [a ordem de avaliação](/?c=langages&s=c&p=operateur-virgule#armadilha-a-ordem-de-avaliacao-dos-argumentos-nao-e-especificada)). Regra: uma variável modificada em uma expressão não é lida em outro ponto dela.

## Primeiro filtro completo: remover os espaços em excesso

Aplica-se o esquema do capítulo ao filtro de espaços. A cada volta, decide-se se o caractere lido é mantido: todo caractere que não é um espaço é mantido; um espaço só é mantido se o último caractere escrito não for um espaço.

```c
#include <stddef.h>
#include <stdio.h>

// Reduz cada sequência de espaços a um único espaço, no próprio lugar.
// Devolve o novo comprimento de s, sem contar o '\0'.
size_t compactar_espacos(char *s)
{
    const char *p = s;                  // ponteiro de LEITURA: percorre toda a string
    char       *out = s;                // ponteiro de ESCRITA: segue só o que se mantém

    while (*p != '\0') {                // até o '\0' que termina a string
        if (*p != ' ' || out == s || out[-1] != ' ')   // caractere a manter?
            *out++ = *p;                // escreve-o, depois avança out
        p++;                            // a leitura avança a cada volta, mantido ou não
    }
    *out = '\0';                        // põe o novo fim da string
    return (size_t)(out - s);           // número de caracteres mantidos
}

int main(void)
{
    char   a[] = "a  b";                // dois espaços entre a e b
    char   b[] = "  un   deux    trois  ";   // sequências de espaços de tamanhos variados
    size_t n;                           // comprimento devolvido por compactar_espacos

    n = compactar_espacos(a);           // filtra a no próprio lugar
    printf("[%s] comprimento %zu\n", a, n);
    n = compactar_espacos(b);           // filtra b no próprio lugar
    printf("[%s] comprimento %zu\n", b, n);
    return 0;
}
```

```text
[a b] comprimento 3
[ un deux trois ] comprimento 15
```

A condição de guarda se lê peça por peça. Os três testes são ligados por `||` (« ou »), que para assim que um teste é verdadeiro, sem avaliar os seguintes (veja [a avaliação em curto-circuito](/?c=langages&s=c&p=boucles#avaliacao-em-curto-circuito-de)): é isso que torna `out == s` protetor.

| Parte | Pergunta feita | Papel |
|---|---|---|
| `*p != ' '` | O caractere lido não é um espaço? | Qualquer outro caractere é mantido |
| `out == s` | Ainda não se escreveu nada? | No início, `out[-1]` seria a casa **antes** do array: não a lemos |
| `out[-1] != ' '` | O último caractere escrito não é um espaço? | Mantém o primeiro espaço de uma sequência, ignora os seguintes |

`out[-1]` é `*(out - 1)`: a casa imediatamente **antes** de `out`, portanto o último caractere escrito (veja [`[]` é apenas açúcar sintático](/?c=langages&s=c&p=pointeurs#e-apenas-acucar-sintatico) no capítulo sobre ponteiros). Um índice negativo é legal em um ponteiro, desde que a casa visada pertença ao array.

O ponteiro de leitura é declarado `const char *p`: ele promete nunca escrever. Se o código tentasse `*p = ...`, o compilador recusaria. Só `out` escreve. Essa divisão de papéis evita trocar um ponteiro pelo outro.

Observação sobre as bordas: os espaços no início e no fim não desaparecem, são reduzidos a um só (`"  un ... trois  "` vira `" un ... trois "`). Removê-los por completo é outro filtro, que exige conhecer o fim da string.

## O terminador: escrever o `'\0'` final

Uma string C termina no **primeiro** `'\0'` que se encontra. Depois do filtro, o texto ficou mais curto, mas o antigo `'\0'` permaneceu mais adiante: sem um novo terminador, o antigo fim do texto reaparece. O programa a seguir é o dos espaços, do qual se retirou a linha `*out = '\0'`:

```c
#include <stdio.h>
#include <string.h>

// Mesmo filtro que compactar_espacos, mas ESQUECE de terminar a string.
void compactar_sem_fim(char *s)
{
    const char *p = s;                  // ponteiro de leitura
    char       *out = s;                // ponteiro de escrita

    while (*p != '\0') {                // percorre toda a string
        if (*p != ' ' || out == s || out[-1] != ' ')   // caractere a manter?
            *out++ = *p;                // escreve-o, depois avança out
        p++;                            // a leitura avança a cada volta
    }
                                        // esquecimento: sem *out = '\0' aqui
}

int main(void)
{
    char s[] = "a  b";                  // 4 caracteres, mais o '\0' na casa 4

    compactar_sem_fim(s);               // filtra s sem terminá-la
    printf("[%s] comprimento %zu\n", s, strlen(s));   // esperado: [a b] comprimento 3
    return 0;
}
```

```text
[a bb] comprimento 4
```

```text
casa :  0   1   2   3   4
antes   a   _   _   b   \0
sem     a   _   b   b   \0      <- o 'b' da casa 3 ficou: texto « a bb »
com     a   _   b   \0  \0      <- *out = '\0' na casa 3: o texto para aqui
```

Nenhum erro é sinalizado: tudo fica no array, o programa « funciona » e exibe um texto errado. Esse bug não é detectado pelos [sanitizers](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) (ferramentas de controle em tempo de execução); só um teste que compara com o resultado esperado o encontra. A linha `*out = '\0';` vai **sempre** depois do laço, antes de devolver o controle.

## Medir a diferença

Retomemos as duas versões no pior caso do deslocamento: `n` espaços seguidos de um `x`. (`sizeof array` dá o tamanho em bytes do array, veja [`sizeof`](/?c=langages&s=c&p=memoire#sizeof); dividir pelo tamanho de uma casa dá o número de casas.) O `main` abaixo supõe que `compactar_ingenuo` e `compactar_espacos` estão copiadas acima dele, tal como apresentadas antes.

```c
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// (aqui: compactar_ingenuo e compactar_espacos, copiadas das seções anteriores)

int main(void)
{
    size_t tamanhos[] = {1000, 10000, 100000};   // tamanhos de teste, em espaços
    size_t quantidade = sizeof tamanhos / sizeof tamanhos[0];   // número de testes

    for (size_t k = 0; k < quantidade; k++) {   // um teste por comprimento
        size_t n = tamanhos[k];         // número de espaços deste teste
        char  *a = malloc(n + 2);       // n espaços, um 'x', um '\0'
        char  *b = malloc(n + 2);       // mesmo texto, para a versão de dois ponteiros
        unsigned long movidos = 0;      // bytes deslocados pela versão ingênua

        if (a == NULL || b == NULL)     // sem memória: desistimos
            return 1;
        memset(a, ' ', n);              // n espaços seguidos: pior caso do deslocamento
        a[n] = 'x';                     // um caractere visível depois dos espaços
        a[n + 1] = '\0';                // fim da string
        memcpy(b, a, n + 2);            // cópia idêntica, '\0' incluído
        compactar_ingenuo(a, &movidos); // versão que desloca
        compactar_espacos(b);           // versão de dois ponteiros
        printf("n = %6zu : ingênuo %11lu bytes movidos, ", n, movidos);
        printf("dois ponteiros %6zu lidos, ", n + 1);   // o texto inteiro, lido uma só vez
        printf("iguais: %s\n", strcmp(a, b) == 0 ? "sim" : "não");   // mesmo resultado?
        free(a);                        // devolve a memória
        free(b);
    }
    return 0;
}
```

```text
n =   1000 : ingênuo      501498 bytes movidos, dois ponteiros   1001 lidos, iguais: sim
n =  10000 : ingênuo    50014998 bytes movidos, dois ponteiros  10001 lidos, iguais: sim
n = 100000 : ingênuo  5000149998 bytes movidos, dois ponteiros 100001 lidos, iguais: sim
```

As duas colunas não contam as mesmas coisas (bytes movidos de um lado, caracteres lidos do outro), mas a evolução fala por si: quando o texto é multiplicado por 10, o trabalho do deslocamento é multiplicado por 100, o dos dois ponteiros por 10.

| Comprimento `n` | Deslocamento (bytes movidos) | Dois ponteiros (caracteres lidos) | Razão entre os dois |
|---|---|---|---|
| 1 000 | 501 498 | 1 001 | cerca de 500 |
| 10 000 | 50 014 998 | 10 001 | cerca de 5 000 |
| 100 000 | 5 000 149 998 | 100 001 | cerca de 50 000 |

A razão é multiplicada por 10 a cada linha: a distância não para de aumentar com o tamanho do texto.

## A diferença de dois ponteiros: o novo comprimento

No fim de `compactar_espacos`, `out` avançou uma casa por caractere mantido desde `s`. O número de caracteres mantidos é portanto a distância entre `out` e `s`, e a **subtração de dois ponteiros** a dá diretamente: `out - s`. Não é preciso chamar `strlen`, que percorreria todo o texto de novo.

O resultado tem o tipo `ptrdiff_t` ([documentação](https://en.cppreference.com/w/c/types/ptrdiff_t)), definido em `<stddef.h>`: um inteiro **com sinal** (o resultado pode ser negativo se o primeiro ponteiro estiver antes do segundo), feito para conter uma distância entre ponteiros. `printf` o exibe com `%td`. A distância conta-se **em casas do tipo apontado**, não em bytes, como a soma de um inteiro a um ponteiro:

```c
#include <stddef.h>
#include <stdio.h>

int main(void)
{
    int       vet[5] = {10, 20, 30, 40, 50};   // 5 inteiros lado a lado na memória
    int      *inicio = &vet[1];         // endereço da casa 1 (valor 20)
    int      *fim = &vet[4];            // endereço da casa 4 (valor 50)
    ptrdiff_t casas = fim - inicio;     // distância em CASAS (em int), não em bytes
    ptrdiff_t bytes = (char *)fim - (char *)inicio;   // a mesma distância, vista byte a byte

    printf("fim - inicio = %td casas\n", casas);
    printf("em bytes    = %td\n", bytes);
    printf("inicio + casas == fim : %d\n", inicio + casas == fim);   // 1 = verdadeiro
    return 0;
}
```

```text
fim - inicio = 3 casas
em bytes    = 12
inicio + casas == fim : 1
```

Três casas de distância, ou seja 12 bytes, porque um `int` ocupa 4 nesta máquina. Para um array de `char`, uma casa vale um byte, e as duas contagens coincidem, mas o princípio continua sendo « em casas ». A subtração é o inverso da soma: `inicio + (fim - inicio)` devolve `fim`. As operações permitidas entre ponteiros:

| Operação | Sentido | Permitida? |
|---|---|---|
| `p + n`, `p - n` | Ponteiro avançado ou recuado de `n` casas | Sim, sem sair do array (a casa logo após o fim é permitida, mas não mais além) |
| `p - q` | Número de casas entre `q` e `p`, de tipo `ptrdiff_t` | Sim, se `p` e `q` apontam para o **mesmo** array |
| `p < q`, `p <= q` | Qual endereço vem antes | Sim, se for o mesmo array |
| `p + q` | Nenhum sentido | Não: o compilador recusa (`invalid operands to binary +`) |
| `p - q` sobre dois arrays distintos | Distância sem significado | Não: comportamento indefinido |

Em nossos filtros, `out` e `s` apontam para o mesmo array e `out >= s`: a distância é positiva, e a convertemos sem risco para `size_t` com `(size_t)(out - s)`. Depois de um filtro correto, `out - s` e `strlen(s)` são iguais; se o `'\0'` foi esquecido, diferem (`out - s` vale 3 e `strlen(s)` vale 4 no programa da seção anterior).

## Olhar adiante: juntar as linhas cortadas por `\`

Em um arquivo de configuração, um script (um arquivo de comandos) ou um [`Makefile`](/?c=langages&s=c&p=makefiles), um `\` seguido de quebra de linha significa « esta linha continua na seguinte ». O segundo filtro suprime esses dois caracteres para juntar o texto. Ele não pode decidir olhando apenas o caractere atual: um `\` só deve ser removido **se o seguinte é uma quebra de linha**. Ele lê, portanto, `p[1]`, a casa imediatamente após a de `p`:

| `*p` | `p[1]` | Ação | Por quê |
|---|---|---|---|
| `\` | `'\n'` | `p += 2`, nada é escrito | O par a remover |
| `\` | outro caractere | Recopiar o `\` | Não é uma continuação |
| `\` | `'\0'` | Recopiar o `\` | `p[1]` é o fim da string: não se lê nada além |
| outra coisa | não lido | Recopiar o caractere | `&&` para antes de avaliar `p[1]` |

A leitura de `p[1]` é segura porque o laço só gira enquanto `*p != '\0'`: a casa seguinte existe com certeza, no pior caso é o terminador. Ler `p[2]` sem ter verificado `p[1]` não seria seguro: se `p[1]` é o `'\0'`, `p[2]` já está fora do array.

```c
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Remove cada par « \ seguido de quebra de linha » de s, no próprio lugar.
// Devolve o novo comprimento de s.
size_t juntar_linhas(char *s)
{
    const char *p = s;                  // ponteiro de LEITURA
    char       *out = s;                // ponteiro de ESCRITA

    while (*p != '\0') {                // até o fim da string
        if (*p == '\\' && p[1] == '\n')   // '\' seguido de quebra de linha?
            p += 2;                     // pula os dois caracteres, sem escrever nada
        else
            *out++ = *p++;              // recopia um caractere e avança os dois ponteiros
    }
    *out = '\0';                        // põe o novo fim da string
    return (size_t)(out - s);           // novo comprimento
}

int main(void)
{
    char a[] = "un \\\ndeux \\\ntrois\n";   // o texto contém dois « \ » + quebra de linha
    char b[] = "fin\\";                 // um '\' bem no fim, nada depois dele
    size_t antes = strlen(a);           // comprimento antes do filtro
    size_t depois = juntar_linhas(a);   // comprimento depois do filtro

    printf("%s", a);                    // o texto juntado mantém sua quebra de linha final
    printf("antes %zu, depois %zu\n", antes, depois);
    juntar_linhas(b);                   // p[1] vale '\0': o '\' é mantido
    printf("[%s]\n", b);
    return 0;
}
```

```text
un deux trois
antes 18, depois 14
[fin\]
```

O texto de `a` contém `un \`, uma quebra de linha, `deux \`, uma quebra de linha, `trois` e uma última quebra de linha: 18 caracteres. Dois pares de dois caracteres desaparecem, restam 14. Neste filtro, `p` às vezes avança duas casas enquanto `out` não se move: a distância entre os dois ponteiros cresce, o que a regra `out <= p` permite. O caso de `b` verifica a leitura no fim da string: o `\` final é conservado, e nada é lido depois do `'\0'`.

> **Armadilha:** um arquivo vindo do Windows costuma terminar suas linhas com dois caracteres, `\r` (retorno de carro) e depois `\n`. Um `\` seguido de `\r\n` então não é reconhecido por este filtro. Se o texto pode vir do Windows, é preciso testar também `p[1] == '\r' && p[2] == '\n'`, verificando antes que `p[1]` não é o `'\0'`.

## Uma função reutilizável: `filtrar`

Quando o critério depende apenas do próprio caractere (é uma letra? um algarismo?), escreve-se o laço **uma única vez** e passa-se o critério como argumento. O critério é uma função, transmitida por um [ponteiro de função](/?c=langages&s=c&p=pointeurs#ponteiros-de-funcoes): `int (*manter)(int)` lê-se « `manter` é um ponteiro para uma função que recebe um `int` e devolve um `int` ». O caractere é passado na forma de `int`, a convenção das funções de `<ctype.h>` (cabeçalho da biblioteca padrão que reúne os testes sobre caracteres): `isalpha(c)` ([documentação](https://en.cppreference.com/w/c/string/byte/isalpha)) devolve um valor não nulo se `c` é uma letra, `isdigit(c)` se é um algarismo de 0 a 9, e 0 caso contrário.

O critério deve receber o valor do caractere **sem sinal** (de 0 a 255). Um `char` pode ser negativo em muitas máquinas (é o caso dos bytes acima de 127, que se encontram nos acentos de um texto [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)), e passar um valor negativo a `isalpha` é proibido pela norma. Daí a conversão `(unsigned char)*p` antes da chamada.

```c
#include <ctype.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

// Mantém em s os caracteres para os quais manter() devolve verdadeiro (não nulo).
// Modifica s no próprio lugar e devolve o novo comprimento.
size_t filtrar(char *s, int (*manter)(int))
{
    const char *p = s;                  // ponteiro de LEITURA
    char       *out = s;                // ponteiro de ESCRITA

    if (s == NULL || manter == NULL)    // nada a filtrar, ou sem critério
        return 0;
    while (*p != '\0') {                // percorre toda a string
        if (manter((unsigned char)*p))  // o critério julga o valor sem sinal
            *out++ = *p;                // mantido: escreve, depois avança out
        p++;                            // a leitura avança em todos os casos
    }
    *out = '\0';                        // põe o novo fim da string
    return (size_t)(out - s);           // novo comprimento
}

// Uma função própria: verdadeira para uma vogal (letras sem acento).
int e_vogal(int c)
{
    return c != '\0' && strchr("aeiouyAEIOUY", c) != NULL;   // strchr('\0') seria verdadeiro
}

int main(void)
{
    char   a[] = "Salut R2-D2, code 42";   // um texto misturando letras, algarismos e sinais
    char   b[] = "Salut R2-D2, code 42";   // uma cópia por filtro: cada um modifica a sua
    char   c[] = "Salut R2-D2, code 42";
    size_t n;                           // comprimento devolvido por filtrar

    n = filtrar(a, isalpha);            // isalpha: verdadeiro para uma letra
    printf("isalpha     : [%s] (%zu)\n", a, n);
    n = filtrar(b, isdigit);            // isdigit: verdadeiro para um algarismo de 0 a 9
    printf("isdigit     : [%s] (%zu)\n", b, n);
    n = filtrar(c, e_vogal);            // nosso próprio critério
    printf("e_vogal     : [%s] (%zu)\n", c, n);
    return 0;
}
```

```text
isalpha     : [SalutRDcode] (11)
isdigit     : [2242] (4)
e_vogal     : [auoe] (4)
```

`strchr(t, c)` procura o caractere `c` em `t` (veja [buscar uma string](/?c=langages&s=c&p=variables#buscar-e-comparar-uma-string-strcmp-strchr-strrchr-strstr)). Ela considera o `'\0'` final como parte de `t`: `strchr("abc", '\0')` não devolve `NULL`. Em `filtrar`, `e_vogal` nunca recebe `'\0'`, mas a guarda `c != '\0'` evita depender de quem a chama.

| Chamada | Critério | Texto de origem | Resultado |
|---|---|---|---|
| `filtrar(a, isalpha)` | Manter as letras | `Salut R2-D2, code 42` | `SalutRDcode` |
| `filtrar(b, isdigit)` | Manter os algarismos | `Salut R2-D2, code 42` | `2242` |
| `filtrar(c, e_vogal)` | Manter as vogais | `Salut R2-D2, code 42` | `auoe` |

`filtrar` não substitui os laços anteriores, pois seu critério só vê **um caractere de cada vez**:

| O que é preciso saber para decidir | Ferramenta |
|---|---|
| O caractere sozinho (letra, algarismo, vogal) | `filtrar` com um critério |
| O último caractere já escrito (espaços em excesso) | Laço dedicado com `out[-1]` |
| Os caracteres seguintes (`\` depois quebra de linha) | Laço dedicado com `p[1]` |

## Quando dá errado: três tentativas

### Filtrar um literal de string

Um **literal de string** é um texto escrito entre aspas no código ([documentação](https://en.cppreference.com/w/c/language/string_literal)). O compilador o guarda em uma área da memória que o programa só pode ler. Duas declarações, que se parecem, não têm portanto nada a ver uma com a outra:

| Declaração | O que é | Modificável? |
|---|---|---|
| `char s[] = "abc";` | Um array de 4 `char`, **cópia** do texto | Sim |
| `char *s = "abc";` | Um ponteiro para o literal, somente leitura | Não: escrever falha |
| `const char *s = "abc";` | Idem, mas o compilador protege | Não: escrever é recusado na **compilação** |

```c
#include <stdio.h>

int main(void)
{
    char *literal = "abc";              // aponta para um literal, área somente leitura
    char  copia[] = "abc";              // array: cópia modificável do texto

    copia[0] = 'X';                     // permitido: escrevemos em nosso próprio array
    printf("cópia : %s\n", copia);
    fflush(stdout);                     // mostra a linha antes de uma eventual falha
    literal[0] = 'X';                   // proibido: escrita na área somente leitura
    printf("literal : %s\n", literal);  // nunca alcançado
    return 0;
}
```

```text
cópia : Xbc
AddressSanitizer:DEADLYSIGNAL
==28957==ERROR: AddressSanitizer: SEGV on unknown address 0x64b4603c5080 ...
==28957==The signal is caused by a WRITE memory access.
```

`fflush(stdout)` força a exibição imediata do texto que aguarda para ser escrito. O primeiro acesso funciona, o segundo faz o programa falhar: o sistema recusa a escrita na área protegida (uma **falha de segmentação**). Sem a opção `-fsanitize=address`, o resultado é o mesmo, sem o relatório: o [shell](/?c=langages&s=bash&p=architecture-dun-shell) assinala a falha de segmentação e o programa termina com o status 139 (128 mais 11, o número do sinal dessa falha). A linguagem C diz apenas que a escrita tem um comportamento indefinido; a falha é o que se observa aqui no Linux. Com `const char *`, o mesmo `literal[0] = 'X'` é recusado já na compilação (`error: assignment of read-only location`): veja [`const` com ponteiros](/?c=langages&s=c&p=pointeurs#const-com-ponteiros). Para filtrar um texto fixo, copia-se primeiro para um array (`char s[] = "..."`).

### Um ponteiro de escrita que ultrapassa o ponteiro de leitura

Um filtro que escreve **mais** caracteres do que lê faz `out` passar à frente de `p`, e ele então sobrescreve caracteres que ainda não foram lidos. Aqui, cada letra deve ser escrita duas vezes; o laço é limitado a 3 voltas para que o teste termine (sem esse limite, `p` nunca encontraria o `'\0'` sobrescrito):

```c
#include <stdio.h>

int main(void)
{
    char  b[16] = "abc";                // 3 letras, depois zeros
    char *p;                            // ponteiro de leitura
    char *out = b;                      // ponteiro de escrita

    for (p = b; p < b + 3; p++) {       // 3 voltas: lê as 3 letras originais
        *out++ = *p;                    // escreve a letra lida...
        *out++ = *p;                    // ...depois a reescreve: out ultrapassa p
    }
    printf("[%s]\n", b);                // esperado: [aabbcc]
    return 0;
}
```

```text
[aaaaaa]
```

Na volta 2, `p` lê a casa 1, que a volta 1 já substituiu por um `a`: os `b` e `c` originais desapareceram antes de serem lidos. Para aumentar um texto, é preciso um destino **separado**, grande o bastante (veja [alocar memória](/?c=langages&s=c&p=memoire#alocar-memoria-dinamicamente)), e não o mesmo array.

### Ler `out[-1]` antes de ter escrito

Retiremos a guarda `out == s` de `compactar_espacos`, sobre o texto `" a"` (um espaço e depois `a`). Na primeira volta, o teste `*p != ' '` é falso (é um espaço) e o programa avalia `out[-1]`, a casa antes do array. Compilado com `-fsanitize=address`, o programa para em:

```text
==29371==ERROR: AddressSanitizer: stack-buffer-underflow on address 0x74f8e130001f ...
READ of size 1 at 0x74f8e130001f thread T0
```

Sem sanitizer, a leitura fora do array passa despercebida: o valor lido é o de uma variável vizinha, e o resultado do filtro depende do acaso. Veja [Sanitizers e testes de alocação](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation).

## As armadilhas

| Armadilha | Por quê | Solução |
|---|---|---|
| Filtrar um literal (`char *s = "..."`) | Área somente leitura: falha na escrita | `char s[] = "..."`, ou copiar antes; declarar `const char *` para que um erro seja detectado na compilação |
| Esquecer `*out = '\0'` | O antigo fim do texto reaparece (`a bb`) | Terminar depois do laço, sempre |
| Um filtro que escreve mais do que lê | `out` ultrapassa `p` e sobrescreve texto não lido | Destino separado de tamanho conhecido |
| Ler `out[-1]` sem guarda | Leitura antes do início do array | Testar `out == s` antes, em um `\|\|` |
| Ler `p[1]` ou `p[2]` sem verificar o fim | Leitura depois do `'\0'` | Ler `p[1]` só se `*p` não for `'\0'`, e `p[2]` só se `p[1]` também não for |
| Confundir `*p++` e `(*p)++` | Um avança o ponteiro, o outro muda o valor apontado | Lembrar que o `++` age sobre o que lhe está colado |
| Escrever `*p++;` sozinho | Aviso `value computed is not used`: o valor lido é descartado | `(*p)++` para aumentar o valor |
| Modificar a variável do chamador sem avisar | O chamador perde o texto original | Documentar acima da função; copiar o texto antes, se ainda for preciso |
| Passar um `char` negativo a `isalpha` | Comportamento indefinido segundo a norma | `(unsigned char)*p` antes da chamada |
| Filtrar um texto UTF-8 byte a byte | Um caractere acentuado ocupa vários bytes: retirar um só quebra o caractere | Filtrar somente texto sem acentos; senão, um tratamento pensado para [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes#a-consequencia-um-caractere-um-byte) |
| Passar `NULL` | Desreferenciar `NULL` faz o programa falhar | Testar `s == NULL` no início da função |
| Modificar e ler uma variável na mesma expressão (`*out++ = *out`) | A linguagem não impõe a ordem: comportamento indefinido | Separar em duas instruções |
| Chamar `strlen` a cada volta | Recai em custo quadrático, veja [três armadilhas de desempenho](/?c=langages&s=c&p=memoire#tres-armadilhas-de-desempenho-e-de-leitura-de-memoria) | Calcular o comprimento com `out - s` |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Um ponteiro de leitura `const char *p` e um ponteiro de escrita `char *out`, assim nomeados | O compilador proíbe escrever pelo ponteiro errado; o código se lê de relance |
| Ter o invariante `out <= p` em mente antes de escrever um filtro | Um filtro que só remove ou mantém é seguro; além disso, muda-se de método |
| Escrever `*out = '\0'` logo depois do laço | A string resultado está sempre terminada |
| Devolver `(size_t)(out - s)` | Quem chama tem o novo comprimento sem percorrer o texto de novo |
| Documentar acima da função que `s` é modificada | Quem chama sabe que perde o texto original |
| Testar `s == NULL` e `manter == NULL` no início da função | Nenhuma falha com uma entrada ausente |
| Escrever o laço genérico uma vez (`filtrar`) para os critérios de um caractere | Um único laço para verificar |
| Testar cada filtro com uma string vazia, um único caractere, um texto totalmente removido, sob `-fsanitize=address,undefined` | As bordas (início, fim, `'\0'`) são onde os filtros erram |

## O que reter

| | |
|---|---|
| **Para lembrar** | Filtrar no próprio lugar é percorrer o texto com um ponteiro de leitura `p` e recopiar o que se mantém com um ponteiro de escrita `out`, para o início do mesmo array: uma só passagem, nenhuma alocação, custo linear, contra um custo quadrático para o deslocamento a cada remoção. `out <= p` enquanto o filtro não escrever mais do que lê. `*out++ = *p` escreve e depois avança `out` (o `++` pós-fixado passa antes do `*`). `*p++` lê e depois avança o ponteiro; `(*p)++` aumenta o valor apontado; `*++p` avança e depois lê; `++*p` aumenta e depois lê. É preciso pôr `*out = '\0'` depois do laço. `out - s` é o novo comprimento, do tipo `ptrdiff_t`, contado em casas e não em bytes. Um filtro que olha adiante lê `p[1]`, sem ultrapassar o terminador. |
| **Armadilhas a evitar** | Filtrar um literal (`char *s = "..."`); esquecer o `'\0'` final; fazer `out` passar à frente de `p`; ler `out[-1]` no início; ler `p[2]` sem ter testado `p[1]`; confundir `*p++` e `(*p)++`; modificar o texto do chamador sem documentá-lo; passar um `char` negativo a `isalpha`; filtrar UTF-8 byte a byte. |
| **Boas práticas** | `const char *p` para ler, `char *out` para escrever; `*out = '\0'` logo depois do laço; devolver `(size_t)(out - s)`; `filtrar(s, critério)` para os critérios de um caractere, um laço dedicado caso contrário; testes nas bordas sob `-fsanitize=address,undefined`; documentação: [`memmove`](https://en.cppreference.com/w/c/string/byte/memmove), [precedência dos operadores](https://en.cppreference.com/w/c/language/operator_precedence), [`ptrdiff_t`](https://en.cppreference.com/w/c/types/ptrdiff_t), [`isalpha`](https://en.cppreference.com/w/c/string/byte/isalpha). |
