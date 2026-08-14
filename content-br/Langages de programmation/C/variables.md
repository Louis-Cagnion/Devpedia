---
order: 1
---

# Variáveis e tipos de dados

As variáveis são utilizadas para armazenar dados na memória, para que um programa possa manipulá-los. Na linguagem C, cada variável possui um tipo que determina:

- A quantidade de memória atribuída.
- Os valores que pode conter.
- As operações que podem ser realizadas no mesmo.

Compreender os diferentes tipos de dados é essencial para escrever programas eficazes e compreender melhor a gestão da memória.

## Os números inteiros (`int`)

O tipo `int` permite armazenar números inteiros positivos ou negativos.

```c
int idade = 25;
int temperature = -5;
```

O tamanho de um «`int`» depende da arquitetura do computador, mas é geralmente de 4 octetos (32 bits).

## Os caracteres (`char`)

O tipo «`char`» permite armazenar um único carácter.

```c
char letter = 'A';
char digit = '5';
```

Um `char`o ocupa geralmente 1 byte na memória e contém o valor ASCII do carácter.

## Os valores booleanos (`bool`)

Desde a norma C99, a linguagem disponibiliza o tipo «`bool`» através da biblioteca «`stdbool.h`».

```c
#include <stdbool.h>

bool isConnected = true;
bool isAdmin = false;
```

Um valor booleano representa um valor lógico:

- `true`
- `false`

Antes da norma C99, era comum utilizar inteiros (`0` para falso, valor diferente de zero para verdadeiro).

## Os números de vírgula flutuante

A linguagem C disponibiliza vários tipos para representar números decimais:

```c
float price = 9.99f;
double pi = 3.1415926535;
```

- `float` : precisão simples
- `double` : precisão dupla

## As cadeias de caracteres

A linguagem C não possui um tipo «string» nativo. Uma cadeia de caracteres é representada por um tabuleiro de caracteres terminado pelo caractere nulo (`\0`).

```c
char name[] = "Devpedia";
```

Na memória:

```
D e v p e d i a \0
```

Uma cadeia de caracteres é, portanto, simplesmente uma sequência de caracteres armazenados de forma contígua.

## Os ponteiros

Os ponteiros são uma das características mais importantes da linguagem C.

Permitem armazenar o endereço de memória de uma variável.

```c
int idade = 25;
int *ptr = &idade;
```

Aqui:

- `idade` contém um valor.
- `ptr` contém o endereço de memória de `idade`.

Os ponteiros são utilizados para:

- Manipular diretamente a memória.
- Passar dados para as funções.
- Construir estruturas de dados complexas.

## As estruturas (`struct`)

As estruturas permitem agrupar vários dados num único objeto.

```c
struct User
{
    int id;
    char name[50];
};
```

São frequentemente utilizadas para representar entidades complexas.

## Resumo

Os principais tipos de dados em C são:

| Tipo | Descrição |
|--------|-------------|
| `bool` | Valor lógico |
| `char` | Característica |
| `int` | Inteiro |
| `float` | Número decimal |
| `double` | Número decimal de alta precisão |
| `char[]` | Sequência de caracteres |
| `struct` | Conjunto de dados personalizados |
| `pointer` | Endereço de memória |

É essencial dominar estes tipos antes de abordar conceitos mais avançados, como listas encadeadas, árvores binárias, threads ou gestão de processos; consulte os capítulos dedicados a cada um destes temas.
