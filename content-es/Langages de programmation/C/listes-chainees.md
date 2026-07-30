---
order: 11
---

# Las listas encadenadas

Una **lista enlazada** es una estructura de datos en la que cada elemento (un **eslabón** o *nodo*) contiene un valor y un puntero al elemento siguiente. A diferencia de un array, sus elementos no se almacenan de forma contigua en la memoria; esto es lo que permite añadir o eliminar un elemento sin tener que desplazar todos los demás.

## Declarar un eslabón

```c
typedef struct Maillon
{
    int valor;
    struct Maillon *suivant;
} Maillon;
```

Al igual que en el caso de un árbol binario (véase el capítulo correspondiente), `struct Maillon *suivant` debe hacer referencia a `struct Maillon` y no solo a `Maillon`: en el momento de leer esta línea, `typedef` aún no está completamente definido.

## Crear y encadenar eslabones

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

## Explorar la lista

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

> **Nota:** `courant` es una **copia** del puntero `tete` — avanzar `courant = courant->suivant` no modifica `tete`, que sigue apuntando al primer elemento de la lista. Por eso siempre se utiliza un puntero «de trabajo» independiente para recorrer una lista, nunca el propio puntero de cabeza.

## Añadir al principio de la lista

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

La inserción al principio es una operación de tiempo constante (no se desplaza ningún otro elemento), a diferencia de lo que ocurre con un array, en el que insertar al principio requiere desplazar todos los elementos existentes.

## Ver la lista

Cada eslabón asignado con `malloc()` debe liberarse individualmente; si se libera directamente `tete` sin conservar una referencia al resto, se perdería el acceso a todos los eslabones siguientes (fuga de memoria; véase el capítulo sobre la gestión de la memoria):

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

> **Nota:** aquí es importante el orden: llamar a `free(courant)` y luego leer `courant->suivant` constituiría un **«use-after-free»** (véase el capítulo sobre gestión de la memoria); el valor del puntero `suivant` debe recuperarse antes de liberar el nodo que lo contiene.

## Lista encadenada frente a matriz

| | Tabla | Lista encadenada |
|---|---|---|
| Acceso a un elemento por índice | Inmediato (`tab[i]`) | Hay que recorrer la lista desde el principio |
| Inserción al principio o en medio | Desplaza todos los elementos siguientes | Tiempo constante, sin desplazamiento |
| Memoria | Contigua | Fragmentada, un e`malloc`e por eslabón |
| Tamaño | Fijo (tabla estática) o redimensionable (`realloc`) | Crece de forma natural, paso a paso |
