---
order: 13
---

# Las tablas hash (hash tables)

Una **tabla hash** es una estructura de datos que permite insertar, buscar y eliminar un valor a partir de una clave en un tiempo medio casi constante (`O(1)`), mientras que una lista enlazada (véase el capítulo dedicado) requeriría recorrer todos los elementos uno por uno. El principio consiste en calcular una «dirección» numérica a partir de la clave y almacenar o recuperar el valor directamente en esa ubicación dentro de una matriz.

## El principio general

```
clé -> fonction de hachage -> indice dans un tableau -> valeur stockée à cet indice
```

```
"nom" -> hash("nom") = 193847 -> 193847 % taille_tableau = 3 -> valeur stockée en case 3
```

En lugar de buscar secuencialmente «¿está la clave aquí? ¿y aquí? ¿y allá?», la tabla hash calcula directamente **dónde** buscar.

## La función hash

Una **función hash** transforma una entrada de cualquier tamaño (una cadena, una estructura...) en un número de tamaño fijo, de forma determinista: una misma entrada siempre produce el mismo número y, en teoría, entradas diferentes producen números bien distribuidos (para evitar que demasiadas claves caigan en el mismo lugar).

```c
unsigned long hash_chaine(const char *cadena)
{
    unsigned long hash = 5381;
    int c;

    while ((c = *cadena++)) {
        hash = hash * 33 + c;
    }
    return hash;
}
```

A continuación, el número obtenido se reduce al tamaño real de la matriz mediante un módulo:

```c
unsigned long índice = hash_chaine(clave) % taille_tableau;
```

## Las colisiones

El número de claves posibles es infinito (cualquier cadena), pero el array tiene un tamaño finito, por lo que dos claves diferentes pueden, tarde o temprano, generar el mismo índice. Se trata de una **colisión**, que se gestiona principalmente de dos formas:

- **Encadenamiento** (*separate chaining*): cada celda de la matriz contiene una lista encadenada (véase el capítulo dedicado a este tema) de todas las entradas que han dado lugar a ese índice.
- **Direccionamiento abierto** (*open addressing*): en caso de colisión, se busca la siguiente celda libre según una regla fija (por ejemplo, la celda siguiente), hasta encontrar una.

## Implementación mediante encadenamiento

```c
typedef struct Entrada
{
    char *clave;
    int valor;
    struct Entrada *suivant; // plusieurs entrées peuvent partager le même indice
} Entrada;

typedef struct TableHachage
{
    Entrada **cases; // tableau de pointeurs vers des listes chaînées
    int taille;
} TableHachage;
```

### Inserción

```c
void inserer(TableHachage *table, const char *clave, int valor)
{
    unsigned long índice = hash_chaine(clave) % table->taille;

    Entrada *nouvelle = malloc(sizeof(Entrada));
    if (nouvelle == NULL) {
        return; // échec d'allocation (cf. chapitre sur la gestion de la mémoire) : on renonce à l'insertion
    }
    nouvelle->clave = strdup(clave);
    nouvelle->valor = valor;
    nouvelle->suivant = table->cases[índice]; // insertion en tête de la liste de ce bucket
    table->cases[índice] = nouvelle;
}
```

### Búsqueda

```c
int rechercher(TableHachage *table, const char *clave, int *trouve)
{
    unsigned long índice = hash_chaine(clave) % table->taille;
    Entrada *courant = table->cases[índice];

    while (courant != NULL) {
        if (strcmp(courant->clave, clave) == 0) {
            *trouve = 1;
            return courant->valor;
        }
        courant = courant->suivant;
    }
    *trouve = 0;
    return 0;
}
```

Aunque el índice sea el mismo, la búsqueda compara de todos modos la clave completa (`strcmp`): el índice solo reduce la búsqueda a una lista pequeña (idealmente, un único elemento), pero no la elimina por completo.

## Factor de carga y redimensionamiento

El **factor de carga** (número de entradas ÷ tamaño de la tabla) mide el grado de ocupación de la tabla. Si se vuelve demasiado alto (por encima de un umbral habitual como `0.75`), las listas de cada celda se alargan y el rendimiento se degrada hasta alcanzar un tiempo de respuesta de «`O(n)`»; en el peor de los casos (todas las claves en la misma celda), la tabla hash se comporta exactamente como una simple lista enlazada. Una buena implementación **redimensiona** entonces la matriz (por lo general, duplicando su tamaño) y vuelve a insertar todas las entradas existentes («rehash»), para recuperar un factor de carga razonable.

## Dónde se esconden ya las tablas hash a tu alrededor

- Las matrices **asociativas** de PHP (véase el capítulo sobre variables en PHP) se implementan internamente con una estructura muy similar a la de una tabla hash.
- El modelo de almacenamiento de objetos de Git (véase el capítulo sobre la arquitectura interna de Git) **es**, directamente, una tabla hash: la clave de cada objeto es el hash SHA-1 de su contenido, y la subcarpeta `.git/objects/xx/` desempeña exactamente la función de un compartimento (*bucket*).
- Los diccionarios de Python (`dict`) se basan en el mismo principio.

Entender las tablas hash es, por tanto, entender un mecanismo que se repite de forma silenciosa en casi todos los lenguajes y herramientas modernos.
