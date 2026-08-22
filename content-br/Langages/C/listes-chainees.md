---
order: 12
---

# As listas encadeadas

Uma **lista encadeada** é uma estrutura de dados em que cada elemento (um **nó**, ou *node*) contém um valor e um ponteiro para o elemento seguinte. Ao contrário de um array, seus elementos não são armazenados de forma contígua na memória: é isso que permite adicionar ou remover um elemento sem precisar deslocar todos os outros.

## Declarar um nó

```c
typedef struct No
{
    int valor;
    struct No *seguinte;
} No;
```

Como para [uma árvore binária](/?c=langages-de-programmation&s=c&p=arbres-binaires), `struct No *seguinte` deve referenciar `struct No` e não apenas `No`: no momento em que essa linha é lida, o `typedef` ainda não está completamente definido.

## Criar e encadear nós

```c
No *primeiro = malloc(sizeof(No));   // a verificar contra NULL na pratica (veja O gerenciamento de memoria)
primeiro->valor = 10;

No *segundo = malloc(sizeof(No));
segundo->valor = 20;

primeiro->seguinte = segundo;  // encadeia o primeiro ao segundo
segundo->seguinte = NULL;      // NULL marca o fim da lista
```

```text
primeiro -> segundo -> NULL
   10          20
```

## Percorrer a lista

```c
void exibir(No *cabeca)
{
    No *atual = cabeca;

    while (atual != NULL) {
        printf("%d\n", atual->valor);
        atual = atual->seguinte;
    }
}
```

> **Nota:** `atual` é uma **cópia** do ponteiro `cabeca`: avançar `atual = atual->seguinte` não modifica `cabeca`, que continua designando o primeiro nó da lista. É por isso que sempre se usa um ponteiro "de trabalho" separado para percorrer uma lista, nunca a cabeça em si.

## Inserir no início da lista

```c
No *inserirNoInicio(No *cabeca, int valor)
{
    No *novo = malloc(sizeof(No));
    if (novo == NULL) {
        return cabeca; // falha de alocacao: devolver a lista inalterada em vez de travar
    }
    novo->valor = valor;
    novo->seguinte = cabeca;  // o novo no aponta para a antiga cabeca
    return novo;              // torna-se a nova cabeca
}

// uso:
cabeca = inserirNoInicio(cabeca, 5);
```

Inserir no início é uma operação em tempo constante (nenhum outro nó é deslocado); ao contrário de um array, em que inserir no início exige deslocar todos os elementos existentes.

## Liberar a lista

Cada nó alocado com `malloc()` deve ser liberado individualmente: liberar diretamente `cabeca` sem manter uma referência ao resto perderia o acesso a todos os nós seguintes (vazamento de memória, veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire)):

```c
void liberarLista(No *cabeca)
{
    No *atual = cabeca;

    while (atual != NULL) {
        No *seguinte = atual->seguinte; // salvar o seguinte ANTES de liberar atual
        free(atual);
        atual = seguinte;
    }
}
```

> **Nota:** a ordem importa aqui: chamar `free(atual)` e depois ler `atual->seguinte` seria um **use-after-free** (veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire)): o valor do ponteiro `seguinte` deve ser recuperado antes da liberação do nó que o contém.

## Lista encadeada vs array

| | Array | Lista encadeada |
|---|---|---|
| Acesso a um elemento por índice | Imediato (`array[i]`) | É preciso percorrer desde o início |
| Inserção no início/meio | Desloca todos os elementos seguintes | Tempo constante, nenhum deslocamento |
| Memória | Contígua | Espalhada, um `malloc` por nó |
| Tamanho | Fixo (array estático) ou a redimensionar (`realloc`) | Cresce naturalmente, um nó de cada vez |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma lista encadeada liga nós espalhados na memória via um ponteiro "seguinte"; ao contrário de um array, inserir no início é em tempo constante, mas o acesso por índice exige um percurso completo. |
| **Ferramentas utilizáveis** | Uma `struct` autorreferencial (`struct No *seguinte`), `malloc`/`free` por nó. |
| **Armadilhas a evitar** | Liberar um nó antes de salvar seu ponteiro `seguinte` (use-after-free); esquecer de liberar cada nó individualmente (vazamento de memória). |
| **Boas práticas** | Sempre salvar `atual->seguinte` antes de `free(atual)`; verificar cada `malloc()` contra `NULL` antes de usá-lo. |
