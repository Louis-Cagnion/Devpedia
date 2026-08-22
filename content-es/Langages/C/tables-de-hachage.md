---
order: 14
---

# Las tablas hash (hash tables)

Una **tabla hash** es una estructura de datos que permite insertar, buscar y eliminar un valor a partir de una clave en un tiempo casi constante en promedio (`O(1)`), mientras que una [lista enlazada](/?c=langages-de-programmation&s=c&p=listes-chainees) exigiría recorrer todos los elementos uno por uno. El principio: calcular una "dirección" numérica a partir de la clave, y almacenar/recuperar el valor directamente en ese lugar dentro de un array.

## El principio general

```text
clave -> función de hash -> índice en un array -> valor almacenado en ese índice
```

```text
"nombre" -> hash("nombre") = 193847 -> 193847 % capacidad_array = 3 -> valor almacenado en la casilla 3
```

En lugar de buscar secuencialmente "¿está la clave aquí? ¿y aquí? ¿y allí?", la tabla hash calcula directamente **dónde** buscar.

## La función de hash

Una **función de hash** transforma una entrada de tamaño cualquiera (una cadena, una estructura...) en un número de tamaño fijo, de forma determinista: la misma entrada siempre produce el mismo número y, idealmente, entradas diferentes producen números bien distribuidos (para evitar que demasiadas claves caigan en el mismo lugar).

```c
unsigned long hash_cadena(const char *cadena)
{
    unsigned long hash = 5381;
    int c;

    while ((c = *cadena++)) {
        hash = hash * 33 + c;
    }
    return hash;
}
```

El número obtenido se reduce después al tamaño real del array mediante un módulo:

```c
unsigned long indice = hash_cadena(clave) % capacidad_array;
```

## Las colisiones

El número de claves posibles es infinito (cualquier cadena), pero el array tiene un tamaño finito: dos claves diferentes pueden, por tanto, tarde o temprano, producir el mismo índice. Es una **colisión**, gestionada principalmente de dos maneras:

- **Encadenamiento** (*separate chaining*): cada casilla del array contiene una [lista enlazada](/?c=langages-de-programmation&s=c&p=listes-chainees) con todas las entradas que han llegado a ese índice.
- **Direccionamiento abierto** (*open addressing*): en caso de colisión, se busca la siguiente casilla libre según una regla fija (por ejemplo, la casilla siguiente), hasta encontrar una.

## Implementación mediante encadenamiento

```c
typedef struct Entrada
{
    char *clave;
    int valor;
    struct Entrada *siguiente; // varias entradas pueden compartir la misma casilla
} Entrada;

typedef struct TablaHash
{
    Entrada **casillas; // array de punteros a listas enlazadas
    int capacidad;
} TablaHash;
```

### Inserción

```c
void insertar(TablaHash *tabla, const char *clave, int valor)
{
    unsigned long indice = hash_cadena(clave) % tabla->capacidad;

    Entrada *nueva = malloc(sizeof(Entrada));
    if (nueva == NULL) {
        return; // fallo de asignación (véase La gestión de la memoria): se renuncia a la inserción
    }
    nueva->clave = strdup(clave);
    nueva->valor = valor;
    nueva->siguiente = tabla->casillas[indice]; // inserción al principio de la lista de esa casilla
    tabla->casillas[indice] = nueva;
}
```

### Búsqueda

```c
int buscar(TablaHash *tabla, const char *clave, int *encontrado)
{
    unsigned long indice = hash_cadena(clave) % tabla->capacidad;
    Entrada *actual = tabla->casillas[indice];

    while (actual != NULL) {
        if (strcmp(actual->clave, clave) == 0) {
            *encontrado = 1;
            return actual->valor;
        }
        actual = actual->siguiente;
    }
    *encontrado = 0;
    return 0;
}
```

Aunque el índice coincida, la búsqueda compara de todos modos la clave completa (`strcmp`): el índice solo reduce la búsqueda a una lista pequeña (idealmente un único elemento), no la elimina por completo.

## Factor de carga y redimensionamiento

El **factor de carga** (número de entradas ÷ tamaño del array) mide cuán llena está la tabla. Si se vuelve demasiado alto (por encima de un umbral habitual como `0.75`), las listas de cada casilla se alargan, y el rendimiento se degrada hacia `O(n)`: en el peor de los casos (todas las claves en la misma casilla), la tabla hash se comporta exactamente como una simple lista enlazada. Una buena implementación **redimensiona** entonces el array (generalmente duplicando su tamaño) y reinserta todas las entradas existentes ("rehash"), para recuperar un factor de carga razonable.

## Dónde se esconden ya las tablas hash a tu alrededor

- Los arrays **asociativos** de PHP (véase [Las variables](/?c=langages-de-programmation&s=php&p=variables)) están, internamente, implementados con una estructura muy cercana a una tabla hash.
- El modelo de almacenamiento de objetos de Git (véase [La arquitectura interna de Git](/?c=git&p=architecture-interne)) **es** directamente una tabla hash: la clave de cada objeto es el hash SHA-1 de su contenido, y la subcarpeta `.git/objects/xx/` cumple exactamente el papel de una casilla (*bucket*).
- Los diccionarios de Python (`dict`) se basan en el mismo principio.

Entender las tablas hash es, por tanto, entender un mecanismo que se repite silenciosamente en casi la totalidad de los lenguajes y herramientas modernos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una tabla hash calcula un índice a partir de una clave (mediante una función de hash) para acceder directamente al valor, en `O(1)` en promedio. Una colisión (dos claves, mismo índice) se gestiona mediante encadenamiento o direccionamiento abierto. |
| **Herramientas utilizables** | Una función de hash determinista y bien distribuida; el redimensionamiento ("rehash") cuando el factor de carga supera un umbral (a menudo 0.75). |
| **Trampas a evitar** | Una función de hash mal distribuida que concentra demasiadas claves en pocos índices: degrada el rendimiento hacia `O(n)`. |
| **Buenas prácticas** | Redimensionar y reinsertar todas las entradas en cuanto el factor de carga se vuelve demasiado alto, en lugar de dejar que las listas de cada casilla se alarguen indefinidamente. |
