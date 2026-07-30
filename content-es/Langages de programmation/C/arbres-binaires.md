---
order: 12
---

# Los árboles binarios

Un **árbol binario** es una estructura de datos en la que cada elemento (denominado **nodo**) apunta a un máximo de otros dos nodos: un hijo **izquierdo** y un hijo **derecho**. Se trata de una generalización de una lista enlazada (un nodo, un único «siguiente») con dos direcciones posibles, lo que permite organizar los datos de forma jerárquica y buscarlos de manera eficaz.

## Declarar un nodo

```c
typedef struct Noeud
{
    int valor;
    struct Noeud *gauche;
    struct Noeud *droit;
} Noeud;
```

> **Nota:** «`struct Noeud *gauche`» debe hacer referencia a «`struct Noeud`» (con la palabra clave «`struct`»), y no solo a «`Noeud`»; en el momento en que el compilador lee esta línea, «`typedef Noeud`» aún no está completamente definido. Se trata de una excepción necesaria, propia de las estructuras autorreferenciales.

## El árbol binario de búsqueda (ABR)

Un **árbol binario de búsqueda** (*Binary Search Tree*) impone una regla de orden a cada nodo: todo lo que se encuentra en el subárbol izquierdo es **menor**, y todo lo que se encuentra en el subárbol derecho es **mayor**. Esta regla permite localizar un elemento con el menor número posible de comparaciones.

```
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Inserción recursiva

```c
Noeud *inserer(Noeud *raíz, int valor)
{
    if (raíz == NULL) {
        Noeud *nouveau = malloc(sizeof(Noeud));
        if (nouveau == NULL) {
            return NULL; // cf. chapitre sur la gestion de la mémoire : toujours vérifier malloc
        }
        nouveau->valor = valor;
        nouveau->gauche = NULL;
        nouveau->droit  = NULL;
        return nouveau;
    }

    if (valor < raíz->valor) {
        raíz->gauche = inserer(raíz->gauche, valor);
    } else if (valor > raíz->valor) {
        raíz->droit = inserer(raíz->droit, valor);
    }
    // valeur == racine->valeur : déjà présente, on ne fait rien

    return raíz;
}
```

- El caso básico de la recursión es`raíz == NULL`: se ha encontrado la posición vacía donde insertar.
- Cada llamada recursiva devuelve la raíz del subárbol (modificada o no), que el llamante reasigna a `->gauche` o `->droit`; esto es lo que vincula el nuevo nodo con el resto del árbol.

## Búsqueda

```c
Noeud *rechercher(Noeud *raíz, int valor)
{
    if (raíz == NULL || raíz->valor == valor) {
        return raíz; // trouvé, ou NULL si l'arbre est vide/épuisé
    }

    if (valor < raíz->valor) {
        return rechercher(raíz->gauche, valor);
    }
    return rechercher(raíz->droit, valor);
}
```

En cada paso, la comparación elimina **todo un subárbol** de la búsqueda; esto es lo que hace que un ABR equilibrado sea mucho más rápido que un recorrido lineal por una lista enlazada.

## Las tres vías clásicas

Recorrer un árbol significa visitar cada uno de sus nodos una vez. Existen tres órdenes posibles en función del momento en que se «procesa» el nodo actual en relación con sus hijos:

```c
void parcoursInfixe(Noeud *raíz)   // gauche, nœud, droit -> ordre croissant sur un ABR
{
    if (raíz == NULL) return;
    parcoursInfixe(raíz->gauche);
    printf("%d ", raíz->valor);
    parcoursInfixe(raíz->droit);
}

void parcoursPrefixe(Noeud *raíz)  // nœud, gauche, droit
{
    if (raíz == NULL) return;
    printf("%d ", raíz->valor);
    parcoursPrefixe(raíz->gauche);
    parcoursPrefixe(raíz->droit);
}

void parcoursSuffixe(Noeud *raíz)  // gauche, droit, nœud
{
    if (raíz == NULL) return;
    parcoursSuffixe(raíz->gauche);
    parcoursSuffixe(raíz->droit);
    printf("%d ", raíz->valor);
}
```

En el árbol de ejemplo anterior, `parcoursInfixe` muestra `2 5 7 10 15 20` — los valores en orden ascendente, una propiedad propia del ABR.

## Liberar un árbol

Al igual que en una lista encadenada, cada nodo asignado con `malloc()` debe liberarse individualmente; para ello, un recorrido por sufijos resulta especialmente adecuado, ya que procesa los hijos antes que el propio nodo:

```c
void libererArbre(Noeud *raíz)
{
    if (raíz == NULL) return;
    libererArbre(raíz->gauche);
    libererArbre(raíz->droit);
    free(raíz);
}
```

Véase también el capítulo sobre punteros (estructuras autorreferenciales) y sobre la gestión de la memoria (cada `malloc` debe tener su `free`).
