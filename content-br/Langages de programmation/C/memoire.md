---
order: 5
---

# Gestão da memória

Ao contrário de linguagens como o PHP ou o JavaScript, que gerem automaticamente a memória através de um recolhedor de lixo (*garbage collector*), o C atribui ao programador a responsabilidade total pela alocação e libertação da memória de que o seu programa necessita. É isso que permite um elevado desempenho e um controle preciso dos recursos, à custa de uma vigilância constante.

## Stack (pilha) e Heap (montão)

Um programa em C dispõe de duas áreas principais de memória para os seus dados:

| | Pilha | Heap |
|---|---|---|
| Gestão | Automática (variáveis locais) | Manual (`malloc` / `free`) |
| Duração | O tempo do bloco/da função atual | Até ao «`free()`» explícito |
| Tamanho | Limitado, definido no arranque do programa | Limitado pela RAM/espaço de swap disponível |
| Velocidade | Muito rápida (simples deslocamento de um ponteiro) | Mais lenta (procura de um espaço livre) |

```c
void exemple(void)
{
    int x = 5;            // sur la stack, libéré automatiquement à la fin de la fonction
    int *p = malloc(sizeof(int)); // sur le heap, reste alloué jusqu'à free(p)
    *p = 5;
    free(p);
}
```

## Alocar memória dinamicamente

`malloc()` reserva um bloco de memória bruta na pilha (heap), cujo tamanho é expresso em octetos:

```c
int *tab = malloc(5 * sizeof(int)); // réserve la place pour 5 entiers

if (tab == NULL) {
    // malloc a échoué (mémoire insuffisante) -> tab vaut NULL, à toujours vérifier
    return;
}

for (int i = 0; i < 5; i++) {
    tab[i] = i * 10;
}
```

> **Nota:** `malloc()` não **reinicializa** a memória alocada: esta pode conter qualquer valor residual («garbage»). `calloc(número, taille)` faz o mesmo que `malloc(número * taille)`, mas, além disso, define todos os bytes a zero.

```c
int *tab = calloc(5, sizeof(int)); // 5 entiers, tous initialisés à 0
```

## Redimensionar um bloco: `realloc()`

```c
int *tab = malloc(3 * sizeof(int));
// ... on a besoin de plus de place ...
int *nouveauTab = realloc(tab, 6 * sizeof(int));

if (nouveauTab == NULL) {
    // realloc a échoué : l'ancien bloc "tab" est toujours valide, ne pas le perdre
    free(tab);
    return;
}
tab = nouveauTab; // le bloc a pu être déplacé ailleurs en mémoire
```

`realloc()` mantém o conteúdo existente (truncado se o novo tamanho for menor), mas pode deslocar o bloco na memória, se necessário — é por isso que nunca se reatribui `tab` diretamente antes de verificar se `realloc()` não devolveu `NULL`.

## Liberar memória: `free()`

Cada `malloc()` / `calloc()` / `realloc()` bem-sucedido deve corresponder exatamente a um `free()`, quando o bloco já não for necessário:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p contient toujours l'ancienne adresse ("dangling pointer") : il ne faut plus l'utiliser
p = NULL; // bonne pratique : empêche une utilisation accidentelle après libération
```

## Os três erros de memória clássicos

| Erro | Causa | Consequência |
|---|---|---|
| **Fuga de memória** (*memory leak*) | Um bloco `malloc` é nunca é `free()` | A memória utilizada pelo programa aumenta sem nunca diminuir |
| **Use-after-free** | O programa desreferencia um ponteiro após a sua «`free()`» | Comportamento indefinido: dados corrompidos, falha do sistema ou, pior ainda, «funciona» silenciosamente |
| **«Double free»** | «`free()`» chamado duas vezes no mesmo ponteiro | Corrupção do gestor de memória, falha frequentemente diferida e difícil de rastrear |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free : comportement indéfini
```

> **Nota:** estes erros nem sempre provocam uma falha imediata e visível — é isso que os torna difíceis de detetar. Uma ferramenta como **o Valgrind** (`valgrind ./mon_programme`) executa o programa e identifica com precisão as fugas de memória e os acessos inválidos, indicando a linha de código responsável.

## `sizeof`

`sizeof` não é uma função, mas sim um operador avaliado na compilação: devolve o tamanho, em bytes, de um tipo ou de uma variável, essencial para calcular corretamente o tamanho a atribuir:

```c
sizeof(int);      // généralement 4
sizeof(char);      // toujours 1, par définition du standard C
sizeof(int) * 10;  // taille nécessaire pour 10 entiers -> à passer à malloc()
```

Consulte também o capítulo sobre ponteiros, cuja compreensão é um pré-requisito para este.
