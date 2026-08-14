---
order: 1
---

# As variáveis e os tipos de dados

Para lembrar, [uma variável é uma caixa etiquetada que contém um valor](/?c=bases-de-l-informatique&p=la-variable). Em linguagem C, cada variável também tem um tipo que determina:

- A quantidade de memória alocada.
- Os valores que ela pode conter.
- As operações que podem ser feitas com ela.

Entender os diferentes tipos de dados é essencial para escrever programas eficientes e compreender melhor o gerenciamento de memória.

## Os inteiros (`int`)

O tipo `int` permite armazenar números inteiros positivos ou negativos.

```c
int idade = 25;
int temperatura = -5;
```

O tamanho de um `int` depende da arquitetura da máquina, mas geralmente é de 4 bytes (32 bits).

## Os caracteres (`char`)

O tipo `char` permite armazenar um único caractere.

```c
char letra = 'A';
char digito = '5';
```

Um `char` geralmente ocupa 1 byte em memória e contém o valor ASCII do caractere.

> **Armadilha:** confundir `'A'` (aspas simples) e `"A"` (aspas duplas). O primeiro é um único `char` (o valor ASCII 65); o segundo é uma **string** de dois bytes, `'A'` seguido do caractere nulo `'\0'` (veja a seção dedicada abaixo). Escrever `char letra = "A";` é um erro de tipo, não apenas uma diferença de estilo.
>
> **Boa prática:** reservar as aspas simples para um caractere isolado, as aspas duplas para uma string, mesmo de um único caractere.
>
> **Nota:** o padrão C não define se um `char` "puro" (sem `signed`/`unsigned` explícito) é assinado ou não: essa escolha depende do compilador e da arquitetura. Um código que armazena outra coisa além de texto em um `char` (um pequeno valor numérico, por exemplo) deveria especificar `signed char` ou `unsigned char` em vez de supor um dos dois comportamentos.

## Os booleanos (`bool`)

Desde o padrão [C99](https://en.wikipedia.org/wiki/C99), a linguagem fornece o tipo `bool` via a biblioteca `stdbool.h`.

```c
#include <stdbool.h>

bool estaConectado = true;
bool ehAdmin = false;
```

Um booleano representa um valor lógico:

- `true`
- `false`

Antes do C99, era comum usar inteiros (`0` para falso, valor não nulo para verdadeiro).

> **Armadilha:** supor que um `bool` armazena fielmente qualquer inteiro atribuído. `bool b = 5;` não armazena `5`: qualquer valor não nulo é reduzido a `1` (`true`) na atribuição. Comparar depois `b == 5` então é falso, um resultado que surpreende quem esperava recuperar o valor original.
>
> **Boa prática:** nunca reutilizar um `bool` como se ele ainda pudesse conter o valor numérico original; ater-se a `true`/`false` uma vez a variável declarada `bool`.

> **Nota:** código C mais antigo (pré-C99, ou que não inclui `stdbool.h`) ainda usa um simples `int` para representar um booleano. Ler esse código exige manter em mente a mesma convenção: `0` é falso, qualquer outro valor é verdadeiro, incluindo valores negativos.

## Os números de ponto flutuante

O C oferece vários tipos para representar números decimais:

```c
float preco = 9.99f;
double pi = 3.1415926535;
```

- `float`: precisão simples (32 bits)
- `double`: precisão dupla (64 bits)

Esses tipos armazenam uma **aproximação**, não um valor exato: `0.1 + 0.2` não vale exatamente `0.3`. Esse comportamento não é específico do C: ele decorre do padrão IEEE 754 imposto pelo processador, e se repete identicamente em [Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) ou [PHP](/?c=langages-de-programmation&s=php&p=php) (veja o capítulo [Os números de ponto flutuante](/?c=representation-des-donnees&p=nombres-flottants) para a explicação da codificação).

> **Armadilha:** comparar dois floats com `==`, esperando que `0.1 + 0.2 == 0.3` seja verdadeiro. Por causa da aproximação, esse teste falha silenciosamente na maior parte das vezes: nenhum erro, apenas um resultado inesperado.
>
> **Boa prática:** comparar dois floats pela diferença entre eles (`fabs(a - b) < epsilon`, uma tolerância escolhida), nunca por igualdade estrita; veja a [forma correta de comparar](/?c=representation-des-donnees&p=nombres-flottants) para o detalhe.

Da mesma forma, a faixa de valores dos inteiros e seu comportamento em caso de overflow decorrem do número de bits alocados: veja [Os inteiros, os bits e os overflows](/?c=representation-des-donnees&p=entiers-et-debordements).

## As strings

A linguagem C não tem um tipo "string" nativo. Uma string é representada por um array de caracteres terminado pelo caractere nulo (`\0`).

```c
char nome[] = "Devpedia";
```

Em memória:

```text
D e v p e d i a \0
```

Uma string é então simplesmente uma sequência de caracteres armazenados de forma contígua.

> **Armadilha:** confundir `sizeof(nome)` com o comprimento real do texto. Aqui, `sizeof(nome)` vale `9` (8 caracteres + o `\0`), calculado na **compilação** a partir do tamanho do array. Mas assim que esse mesmo array é passado a uma função, ele se comporta como um simples ponteiro (veja a [armadilha equivalente com arrays](/?c=langages-de-programmation&s=c&p=boucles)): `sizeof` então retorna o tamanho de um ponteiro (frequentemente `8`), não o da string.
>
> **Boa prática:** usar `sizeof` apenas em um array ainda declarado como tal no escopo atual; usar `strlen()` (que percorre a string até o `\0`) para obter seu comprimento real em qualquer outro contexto, principalmente dentro de uma função que a recebe como parâmetro.

Veja também [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire) para as funções a priorizar (`strncpy`, `snprintf`...) para nunca escrever além do tamanho realmente alocado de uma string.

## Os ponteiros

Os ponteiros são uma das características mais importantes da linguagem C.

Eles permitem armazenar o endereço de memória de uma variável.

```c
int idade = 25;
int *ptr = &idade;
```

Aqui:

- `idade` contém um valor.
- `ptr` contém o endereço de memória de `idade`.

Os ponteiros são usados para:

- Manipular diretamente a memória.
- Passar dados para funções.
- Construir estruturas de dados complexas.

Isso é apenas um panorama: veja o capítulo dedicado [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs) para a aritmética de ponteiros, a passagem por endereço, e as armadilhas associadas (ponteiro não inicializado, `NULL` não testado...).

## As estruturas (`struct`)

As estruturas permitem agrupar vários dados em um mesmo objeto.

```c
struct Usuario
{
    int id;
    char nome[50];
};
```

Elas são frequentemente usadas para representar entidades complexas.

> **Armadilha:** comparar duas estruturas com `==`. O C não permite isso para uma `struct` (erro de compilação), e até uma comparação byte a byte (`memcmp`) pode errar: o compilador frequentemente insere bytes de preenchimento invisíveis entre os campos para respeitar o alinhamento de memória de cada tipo, e seu conteúdo não é garantido idêntico entre duas instâncias por outro lado iguais.
>
> **Boa prática:** comparar uma estrutura campo por campo explicitamente (`a.id == b.id && strcmp(a.nome, b.nome) == 0`), nunca por igualdade global nem por `memcmp` na estrutura inteira.

## Resumo

Os principais tipos de dados em C são:

| Tipo | Descrição |
|--------|-------------|
| `bool` | Valor lógico |
| `char` | Caractere |
| `int` | Inteiro |
| `float` | Número decimal |
| `double` | Número decimal de alta precisão |
| `char[]` | String |
| `struct` | Conjunto de dados personalizados |
| `pointer` | Endereço de memória |

O domínio desses tipos é indispensável antes de abordar conceitos mais avançados como listas encadeadas, árvores binárias, threads ou gerenciamento de processos (veja os capítulos dedicados a cada um desses assuntos).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada variável C tem um tipo fixo que determina seu tamanho em memória, os valores possíveis e as operações permitidas: `int`, `char`, `bool` (C99), `float`/`double`, array de `char` (string), `struct`, ponteiro. |
| **Ferramentas utilizáveis** | `stdbool.h` para um verdadeiro tipo booleano; `sizeof` para o tamanho de um tipo na compilação; `strlen()` para o comprimento real de uma string na execução. |
| **Armadilhas a evitar** | Confundir `'A'` e `"A"`. Atribuir a um `bool` um valor que ele não devolve tal como foi dado. Comparar dois floats com `==`. Confundir `sizeof` em um array e no ponteiro que o sucede uma vez passado a uma função. Comparar duas `struct` com `==` ou `memcmp` (bytes de preenchimento). |
| **Boas práticas** | Escolher o tipo mais estreito que realmente cobre os valores esperados, em vez de um `int`/`double` padrão sistemático. Comparar os floats pela diferença, as strings com `strcmp`, as estruturas campo por campo. |
