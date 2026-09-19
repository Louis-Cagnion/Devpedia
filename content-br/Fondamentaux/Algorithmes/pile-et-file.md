---
order: 3
---

# Pilha e fila: LIFO e FIFO

Uma **pilha** (*stack*) e uma **fila** (*queue*) são duas estruturas de dados que acrescentam uma regra de ordem sobre uma [lista encadeada](/?c=langages-de-programmation&s=c&p=listes-chainees) ou um array: elas só permitem acesso por uma extremidade, nunca a um elemento no meio.

## A pilha (Stack): LIFO

Uma pilha expõe apenas duas operações sobre seu **topo** (o último elemento adicionado):

- **empilhar** (`push`): adicionar um elemento no topo.
- **desempilhar** (`pop`): remover e retornar o elemento do topo.

```text
empilhar(1)  empilhar(2)  empilhar(3)  desempilhar()
   [1]          [2]          [3]          [2]
                [1]          [2]          [1]
                             [1]
```

O último elemento empilhado é sempre o primeiro a ser desempilhado: **LIFO** (*Last In, First Out*). Uma pilha de pratos ilustra bem a ideia: só se pode retirar o de cima.

Implementada em cima de uma [lista encadeada](/?c=langages-de-programmation&s=c&p=listes-chainees), a cabeça da lista faz diretamente o papel de topo: empilhar/desempilhar na cabeça já é uma operação em tempo constante ali, nenhum dado precisa ser movido.

```c
typedef struct No
{
    int valor;
    struct No *proximo;
} No;

void empilhar(No **topo, int valor)
{
    No *novo = malloc(sizeof(No));

    if (novo == NULL)
        return;
    novo->valor = valor;
    novo->proximo = *topo;   // aponta para o antigo topo
    *topo = novo;            // vira o novo topo
}

int desempilhar(No **topo)
{
    No *antigo = *topo;
    int valor = antigo->valor;

    *topo = antigo->proximo;   // o próximo vira o novo topo
    free(antigo);
    return valor;
}
```

## A fila (Queue): FIFO

Uma fila aplica a regra oposta: o primeiro elemento adicionado é o primeiro a sair, **FIFO** (*First In, First Out*), como uma fila de pessoas no mundo real. Ela expõe **enfileirar** (`enqueue`, adicionar no fim) e **desenfileirar** (`dequeue`, remover do início).

| | Pilha (Stack) | Fila (Queue) |
|---|---|---|
| Regra | LIFO: último a entrar, primeiro a sair | FIFO: primeiro a entrar, primeiro a sair |
| Adicionar | No topo | No fim |
| Remover | No topo | No início |
| Exemplo real | Pilha de pratos | Fila de pessoas |

> **Armadilha:** implementar uma fila em cima de uma lista encadeada simples (como a pilha acima) sem manter um ponteiro para o último nó. Adicionar no fim passa então a exigir percorrer toda a lista a cada `enqueue` (**O(n)**) em vez de tempo constante.
>
> **Boa prática:** manter dois ponteiros atualizados, um para o primeiro nó e outro para o último, para que `enqueue`/`dequeue` permaneçam ambos **O(1)**.

As duas estruturas são abstratas: nada obriga a implementá-las em cima de uma lista encadeada. Um array dinâmico funciona igualmente bem para uma pilha (adicionar/remover no fim do array); uma fila exige então um pouco mais de cuidado (remover do início desloca senão todos os elementos, exceto com uma estrutura dedicada como um buffer circular, fora do escopo deste capítulo).

Conceito transversal, usado bem além dessas duas estruturas: uma pilha de chamadas gerencia as chamadas recursivas de funções, um histórico "desfazer/refazer" (*undo/redo*) empilha ações, um analisador sintático (*parser*) costuma se apoiar em uma pilha para lidar com parênteses e blocos aninhados.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma pilha (LIFO) e uma fila (FIFO) restringem o acesso a uma única extremidade de uma lista encadeada ou array. A pilha empilha/desempilha no topo; a fila enfileira no fim e desenfileira no início. |
| **Ferramentas utilizáveis** | Uma lista encadeada para uma pilha em O(1); dois ponteiros (cabeça/cauda) para uma fila em O(1). |
| **Armadilhas a evitar** | Implementar uma fila sem manter um ponteiro para o último nó, o que torna `enqueue` O(n) em vez de O(1). |
| **Boas práticas** | Escolher a pilha ou a fila conforme a ordem de processamento realmente necessária, nunca o contrário adaptando o código depois. |
