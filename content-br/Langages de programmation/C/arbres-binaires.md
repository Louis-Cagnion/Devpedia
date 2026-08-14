---
order: 12
---

# Árvores binárias

Uma **árvore binária** é uma estrutura de dados em que cada elemento (denominado **nó**) aponta para, no máximo, dois outros nós: um filho **esquerdo** e um filho **direito**. Trata-se de uma generalização de uma lista encadeada (um nó, um único «seguinte») com duas direções possíveis, o que permite organizar os dados de forma hierárquica e pesquisá-los de forma eficiente.

## Declarar um nó

```c
typedef struct Noeud
{
    int valor;
    struct Noeud *gauche;
    struct Noeud *droit;
} Noeud;
```

> **Nota:** `struct Noeud *gauche` deve referenciar `struct Noeud` (com a palavra-chave `struct`), e não apenas `Noeud`: no momento em que o compilador lê esta linha, o `typedef Noeud` ainda não está completamente definido. Trata-se de uma exceção necessária, própria das estruturas autorreferenciais.

## A árvore binária de pesquisa (ABR)

Uma **árvore binária de pesquisa** (*Binary Search Tree*) impõe uma regra de ordenação a cada nó: tudo o que se encontra na subárvore esquerda é **menor**, tudo o que se encontra na subárvore direita é **maior**. Esta regra permite localizar um elemento com o mínimo de comparações.

```
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Inserção recursiva

```c
Noeud *inserer(Noeud *raiz, int valor)
{
    if (raiz == NULL) {
        Noeud *nouveau = malloc(sizeof(Noeud));
        if (nouveau == NULL) {
            return NULL; // cf. chapitre sur la gestion de la mémoire : toujours vérifier malloc
        }
        nouveau->valor = valor;
        nouveau->gauche = NULL;
        nouveau->droit  = NULL;
        return nouveau;
    }

    if (valor < raiz->valor) {
        raiz->gauche = inserer(raiz->gauche, valor);
    } else if (valor > raiz->valor) {
        raiz->droit = inserer(raiz->droit, valor);
    }
    // valeur == racine->valeur : déjà présente, on ne fait rien

    return raiz;
}
```

- O caso base da recursão é`raiz == NULL`: encontrou-se o local vazio onde inserir.
- Cada chamada recursiva devolve a raiz da subárvore (modificada ou não), que é reatribuída a `->gauche` ou `->droit` pelo chamador: é isto que liga o novo nó ao resto da árvore.

## Pesquisa

```c
Noeud *rechercher(Noeud *raiz, int valor)
{
    if (raiz == NULL || raiz->valor == valor) {
        return raiz; // trouvé, ou NULL si l'arbre est vide/épuisé
    }

    if (valor < raiz->valor) {
        return rechercher(raiz->gauche, valor);
    }
    return rechercher(raiz->droit, valor);
}
```

A cada etapa, a comparação elimina **toda uma subárvore** da pesquisa: é isso que torna uma ABR equilibrada muito mais rápida do que um percurso linear de uma lista encadeada.

## Os três percursos clássicos

Percorrer uma árvore significa visitar cada um dos seus nós uma vez. São possíveis três ordens, dependendo do momento em que se «processa» o nó atual em relação aos seus filhos:

```c
void parcoursInfixe(Noeud *raiz)   // gauche, nœud, droit -> ordre croissant sur un ABR
{
    if (raiz == NULL) return;
    parcoursInfixe(raiz->gauche);
    printf("%d ", raiz->valor);
    parcoursInfixe(raiz->droit);
}

void parcoursPrefixe(Noeud *raiz)  // nœud, gauche, droit
{
    if (raiz == NULL) return;
    printf("%d ", raiz->valor);
    parcoursPrefixe(raiz->gauche);
    parcoursPrefixe(raiz->droit);
}

void parcoursSuffixe(Noeud *raiz)  // gauche, droit, nœud
{
    if (raiz == NULL) return;
    parcoursSuffixe(raiz->gauche);
    parcoursSuffixe(raiz->droit);
    printf("%d ", raiz->valor);
}
```

Na árvore de exemplo acima, `parcoursInfixe` apresenta `2 5 7 10 15 20`, os valores por ordem crescente, uma característica própria do ABR.

## Liberar uma árvore

Tal como numa lista encadeada, cada nó alocado com`malloc()`deve ser libertado individualmente; um percurso por sufixo é naturalmente adequado para isso, uma vez que trata os filhos antes do próprio nó:

```c
void libererArbre(Noeud *raiz)
{
    if (raiz == NULL) return;
    libererArbre(raiz->gauche);
    libererArbre(raiz->droit);
    free(raiz);
}
```

Ver também o capítulo sobre ponteiros (estruturas autorreferenciais) e sobre a gestão da memória (cada `malloc` deve ter o seu `free`).
