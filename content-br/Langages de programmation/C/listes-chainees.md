---
order: 11
---

# Listas encadeadas

Uma **lista encadeada** é uma estrutura de dados em que cada elemento (um **elo** ou *nó*) contém um valor e um ponteiro para o elemento seguinte. Ao contrário de um tabuuleiro, os seus elementos não são armazenados de forma contígua na memória: é isso que permite adicionar ou remover um elemento sem ter de deslocar todos os outros.

## Declarar um elo

```c
typedef struct Maillon
{
    int valor;
    struct Maillon *suivant;
} Maillon;
```

Tal como acontece com uma árvore binária (ver capítulo dedicado), `struct Maillon *suivant` deve remeter para `struct Maillon` e não apenas para `Maillon`: no momento em que esta linha for lida, o `typedef` ainda não está completamente definido.

## Criar e encadear elos

```c
Maillon *premier = malloc(sizeof(Maillon));   // à vérifier contre NULL en pratique (cf. chapitre mémoire)
premier->valor = 10;

Maillon *second = malloc(sizeof(Maillon));
second->valor = 20;

premier->suivant = second; // chaîne le premier vers le second
second->suivant = NULL;    // NULL marque la fin de la liste
```

```
premier -> second -> NULL
  10         20
```

## Ver a lista

```c
void afficher(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        printf("%d\n", courant->valor);
        courant = courant->suivant;
    }
}
```

> **Nota:** `courant` é uma **cópia** do ponteiro `tete`: avançar para `courant = courant->suivant` não altera `tete`, que continua a apontar para o primeiro elemento da lista. É por isso que se utiliza sempre um ponteiro «de trabalho» separado para percorrer uma lista, nunca o próprio ponteiro inicial.

## Inserir no início da lista

```c
Maillon *insererEnTete(Maillon *tete, int valor)
{
    Maillon *nouveau = malloc(sizeof(Maillon));
    if (nouveau == NULL) {
        return tete; // échec d'allocation : renvoyer la liste inchangée plutôt que planter
    }
    nouveau->valor = valor;
    nouveau->suivant = tete; // le nouveau maillon pointe vers l'ancienne tête
    return nouveau;          // devient la nouvelle tête
}

// utilisation :
tete = insererEnTete(tete, 5);
```

A inserção no início é uma operação de tempo constante (nenhum outro elemento é deslocado); ao contrário de um tabular, em que a inserção no início exige o deslocamento de todos os elementos existentes.

## Liberar a lista

Cada nó alocado com `malloc()` deve ser libertado individualmente: libertar diretamente `tete` sem manter uma referência ao resto faria com que se perdesse o acesso a todos os nós seguintes (fuga de memória, ver capítulo sobre gestão de memória):

```c
void libererListe(Maillon *tete)
{
    Maillon *courant = tete;

    while (courant != NULL) {
        Maillon *suivant = courant->suivant; // sauvegarder le suivant AVANT de libérer courant
        free(courant);
        courant = suivant;
    }
}
```

> **Nota:** a ordem é importante neste caso: chamar `free(courant)` e, em seguida, ler `courant->suivant` constituiria um **«use-after-free»** (ver capítulo sobre gestão de memória): o valor do ponteiro `suivant` deve ser recuperado antes da libertação do bloco de memória que o contém.

## Lista encadeada vs. tabela

| | Tabela | Lista encadeada |
|---|---|---|
| Acesso a um elemento por índice | Imediato (`tab[i]`) | É necessário percorrer a partir do início |
| Inserção no início/no meio | Desloca todos os elementos seguintes | Tempo constante, sem deslocamento |
| Memória | Contígua | Fragmentada, um «`malloc`» por nó |
| Tamanho | Fixo (tabela estática) ou redimensionável (`realloc`) | Cresce naturalmente, um elo de cada vez |
