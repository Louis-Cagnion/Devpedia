---
order: 13
---

# As árvores binárias

Uma **árvore binária** é uma estrutura de dados em que cada elemento (chamado **nó**) aponta para no máximo outros dois nós: um filho **esquerdo** e um filho **direito**. É uma generalização de uma lista encadeada (um nó, um único "seguinte") para duas direções possíveis, o que permite organizar dados de forma hierárquica e buscá-los eficientemente.

## Declarar um nó

```c
typedef struct No
{
    int valor;
    struct No *esquerda;
    struct No *direita;
} No;
```

> **Nota:** `struct No *esquerda` deve referenciar `struct No` (com a palavra-chave `struct`), não apenas `No`: no momento em que o compilador lê essa linha, o `typedef No` ainda não está completamente definido. É uma exceção necessária, própria das estruturas autorreferenciais.

## A árvore binária de busca (ABB)

Uma **árvore binária de busca** (*Binary Search Tree*) impõe uma regra de ordem a cada nó: tudo o que está na subárvore esquerda é **menor**, tudo o que está na subárvore direita é **maior**. Essa regra permite encontrar um elemento com um número mínimo de comparações.

```text
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Inserção recursiva

```c
No *inserir(No *raiz, int valor)
{
    if (raiz == NULL) {
        No *novo = malloc(sizeof(No));
        if (novo == NULL) {
            return NULL; // veja O gerenciamento de memoria: sempre verificar malloc
        }
        novo->valor = valor;
        novo->esquerda = NULL;
        novo->direita  = NULL;
        return novo;
    }

    if (valor < raiz->valor) {
        raiz->esquerda = inserir(raiz->esquerda, valor);
    } else if (valor > raiz->valor) {
        raiz->direita = inserir(raiz->direita, valor);
    }
    // valor == raiz->valor: ja presente, nao faz nada

    return raiz;
}
```

- O caso base da recursão é `raiz == NULL`: encontrou-se o espaço vazio onde inserir.
- Cada chamada recursiva devolve a raiz da subárvore (modificada ou não), que é reatribuída a `->esquerda` ou `->direita` pelo chamador: é isso que liga o novo nó ao resto da árvore.

## Busca

```c
No *buscar(No *raiz, int valor)
{
    if (raiz == NULL || raiz->valor == valor) {
        return raiz; // encontrado, ou NULL se a arvore estiver vazia/esgotada
    }

    if (valor < raiz->valor) {
        return buscar(raiz->esquerda, valor);
    }
    return buscar(raiz->direita, valor);
}
```

A cada etapa, a comparação elimina **toda uma subárvore** da busca: é isso que torna uma ABB equilibrada muito mais rápida que um percurso linear de uma lista encadeada.

## Os três percursos clássicos

Percorrer uma árvore significa visitar cada um de seus nós uma vez. Três ordens são possíveis conforme o momento em que se "processa" o nó atual em relação a seus filhos:

```c
void percursoEmOrdem(No *raiz)      // esquerda, no, direita -> ordem crescente em uma ABB
{
    if (raiz == NULL) return;
    percursoEmOrdem(raiz->esquerda);
    printf("%d ", raiz->valor);
    percursoEmOrdem(raiz->direita);
}

void percursoPreOrdem(No *raiz)     // no, esquerda, direita
{
    if (raiz == NULL) return;
    printf("%d ", raiz->valor);
    percursoPreOrdem(raiz->esquerda);
    percursoPreOrdem(raiz->direita);
}

void percursoPosOrdem(No *raiz)     // esquerda, direita, no
{
    if (raiz == NULL) return;
    percursoPosOrdem(raiz->esquerda);
    percursoPosOrdem(raiz->direita);
    printf("%d ", raiz->valor);
}
```

Na árvore de exemplo acima, `percursoEmOrdem` exibe `2 5 7 10 15 20`, os valores em ordem crescente, uma propriedade própria da ABB.

## Liberar uma árvore

Como para uma lista encadeada, cada nó alocado com `malloc()` deve ser liberado individualmente; um percurso pós-ordem se presta naturalmente a isso, já que processa os filhos antes do próprio nó:

```c
void liberarArvore(No *raiz)
{
    if (raiz == NULL) return;
    liberarArvore(raiz->esquerda);
    liberarArvore(raiz->direita);
    free(raiz);
}
```

Veja também [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs) (estruturas autorreferenciais) e [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire) (cada `malloc` deve ter seu `free`).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma árvore binária de busca (ABB) impõe subárvore esquerda < nó < subárvore direita, o que permite uma busca eliminando metade dos candidatos a cada etapa. Três percursos (em ordem, pré-ordem, pós-ordem) visitam os nós em ordens diferentes. |
| **Ferramentas utilizáveis** | Inserção/busca recursivas; percurso em ordem para obter os valores ordenados de uma ABB. |
| **Armadilhas a evitar** | Esquecer de verificar cada `malloc()` contra `NULL` durante a inserção. |
| **Boas práticas** | Liberar uma árvore por percurso pós-ordem (filhos antes do próprio nó), para nunca perder o acesso a uma subárvore ainda a liberar. |
