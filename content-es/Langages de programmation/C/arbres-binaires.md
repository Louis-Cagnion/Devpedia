---
order: 12
---

# Los árboles binarios

Un **árbol binario** es una estructura de datos en la que cada elemento (llamado **nodo**) apunta como máximo a otros dos nodos: un hijo **izquierdo** y un hijo **derecho**. Es una generalización de una lista enlazada (un nodo, un único "siguiente") a dos direcciones posibles, lo que permite organizar los datos de forma jerárquica y buscarlos de manera eficiente.

## Declarar un nodo

```c
typedef struct Nodo
{
    int valor;
    struct Nodo *izquierdo;
    struct Nodo *derecho;
} Nodo;
```

> **Nota:** `struct Nodo *izquierdo` debe hacer referencia a `struct Nodo` (con la palabra clave `struct`), no solo a `Nodo`: en el momento en que el compilador lee esta línea, el `typedef Nodo` todavía no está completamente definido. Es una excepción necesaria, propia de las estructuras autorreferenciales.

## El árbol binario de búsqueda (ABR)

Un **árbol binario de búsqueda** (*Binary Search Tree*) impone una regla de orden a cada nodo: todo lo que está en el subárbol izquierdo es **menor**, y todo lo que está en el subárbol derecho es **mayor**. Esta regla permite localizar un elemento con el menor número posible de comparaciones.

```text
        10
       /  \
      5    15
     / \      \
    2   7      20
```

## Inserción recursiva

```c
Nodo *insertar(Nodo *raiz, int valor)
{
    if (raiz == NULL) {
        Nodo *nuevo = malloc(sizeof(Nodo));
        if (nuevo == NULL) {
            return NULL; // véase La gestión de la memoria: comprobar siempre malloc
        }
        nuevo->valor = valor;
        nuevo->izquierdo = NULL;
        nuevo->derecho  = NULL;
        return nuevo;
    }

    if (valor < raiz->valor) {
        raiz->izquierdo = insertar(raiz->izquierdo, valor);
    } else if (valor > raiz->valor) {
        raiz->derecho = insertar(raiz->derecho, valor);
    }
    // valor == raiz->valor: ya está presente, no se hace nada

    return raiz;
}
```

- El caso base de la recursión es `raiz == NULL`: se ha encontrado el lugar vacío donde insertar.
- Cada llamada recursiva devuelve la raíz del subárbol (modificado o no), que quien la invoca reasigna a `->izquierdo` o `->derecho`: esto es lo que conecta el nuevo nodo con el resto del árbol.

## Búsqueda

```c
Nodo *buscar(Nodo *raiz, int valor)
{
    if (raiz == NULL || raiz->valor == valor) {
        return raiz; // encontrado, o NULL si el árbol está vacío/agotado
    }

    if (valor < raiz->valor) {
        return buscar(raiz->izquierdo, valor);
    }
    return buscar(raiz->derecho, valor);
}
```

En cada paso, la comparación elimina **todo un subárbol** de la búsqueda: esto es lo que hace que un ABR equilibrado sea mucho más rápido que un recorrido lineal de una lista enlazada.

## Los tres recorridos clásicos

Recorrer un árbol significa visitar cada uno de sus nodos una vez. Hay tres órdenes posibles según el momento en que se "procesa" el nodo actual respecto a sus hijos:

```c
void recorridoInfijo(Nodo *raiz)   // izquierdo, nodo, derecho -> orden ascendente en un ABR
{
    if (raiz == NULL) return;
    recorridoInfijo(raiz->izquierdo);
    printf("%d ", raiz->valor);
    recorridoInfijo(raiz->derecho);
}

void recorridoPrefijo(Nodo *raiz)  // nodo, izquierdo, derecho
{
    if (raiz == NULL) return;
    printf("%d ", raiz->valor);
    recorridoPrefijo(raiz->izquierdo);
    recorridoPrefijo(raiz->derecho);
}

void recorridoPostfijo(Nodo *raiz)  // izquierdo, derecho, nodo
{
    if (raiz == NULL) return;
    recorridoPostfijo(raiz->izquierdo);
    recorridoPostfijo(raiz->derecho);
    printf("%d ", raiz->valor);
}
```

En el árbol de ejemplo anterior, `recorridoInfijo` muestra `2 5 7 10 15 20`, los valores en orden ascendente, una propiedad propia del ABR.

## Liberar un árbol

Al igual que con una lista enlazada, cada nodo asignado con `malloc()` debe liberarse individualmente; un recorrido postfijo se presta naturalmente a esto, ya que procesa los hijos antes que el propio nodo:

```c
void liberarArbol(Nodo *raiz)
{
    if (raiz == NULL) return;
    liberarArbol(raiz->izquierdo);
    liberarArbol(raiz->derecho);
    free(raiz);
}
```

Véase también [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs) (estructuras autorreferenciales) y [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) (cada `malloc` debe tener su `free`).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un árbol binario de búsqueda (ABR) impone subárbol izquierdo < nodo < subárbol derecho, lo que permite una búsqueda que elimina la mitad de los candidatos en cada paso. Tres recorridos (infijo, prefijo, postfijo) visitan los nodos en órdenes diferentes. |
| **Herramientas utilizables** | Inserción/búsqueda recursivas; recorrido infijo para obtener los valores ordenados de un ABR. |
| **Trampas a evitar** | Olvidar comprobar cada `malloc()` contra `NULL` durante la inserción. |
| **Buenas prácticas** | Liberar un árbol mediante un recorrido postfijo (hijos antes que el propio nodo), para no perder nunca el acceso a un subárbol que aún queda por liberar. |
