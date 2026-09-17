---
order: 3
---

# Pila y cola: LIFO y FIFO

Una **pila** (*stack*) y una **cola** (*queue*) son dos estructuras de datos que añaden una regla de orden sobre una [lista enlazada](/?c=langages-de-programmation&s=c&p=listes-chainees) o un array: solo permiten acceder por un extremo, nunca a un elemento en medio.

## La pila (Stack): LIFO

Una pila solo expone dos operaciones sobre su **cima** (el último elemento añadido):

- **apilar** (`push`): añadir un elemento en la cima.
- **desapilar** (`pop`): quitar y devolver el elemento de la cima.

```text
apilar(1)    apilar(2)    apilar(3)    desapilar()
   [1]          [2]          [3]          [2]
                [1]          [2]          [1]
                             [1]
```

El último elemento apilado es siempre el primero en desapilarse: **LIFO** (*Last In, First Out*). Una pila de platos ilustra bien la idea: solo se puede quitar el de arriba.

Implementada sobre una [lista enlazada](/?c=langages-de-programmation&s=c&p=listes-chainees), la cabeza de la lista hace directamente de cima: apilar/desapilar en la cabeza ya es una operación en tiempo constante ahí, ningún dato necesita moverse.

```c
typedef struct Nodo
{
    int valor;
    struct Nodo *siguiente;
} Nodo;

void apilar(Nodo **cima, int valor)
{
    Nodo *nuevo = malloc(sizeof(Nodo));

    if (nuevo == NULL)
        return;
    nuevo->valor = valor;
    nuevo->siguiente = *cima;   // apunta a la antigua cima
    *cima = nuevo;              // se convierte en la nueva cima
}

int desapilar(Nodo **cima)
{
    Nodo *antiguo = *cima;
    int valor = antiguo->valor;

    *cima = antiguo->siguiente;   // el siguiente se convierte en la nueva cima
    free(antiguo);
    return valor;
}
```

## La cola (Queue): FIFO

Una cola aplica la regla contraria: el primer elemento añadido es el primero en salir, **FIFO** (*First In, First Out*), como una cola de gente en la vida real. Expone **encolar** (`enqueue`, añadir al final) y **desencolar** (`dequeue`, quitar desde el principio).

| | Pila (Stack) | Cola (Queue) |
|---|---|---|
| Regla | LIFO: último en entrar, primero en salir | FIFO: primero en entrar, primero en salir |
| Añadir | En la cima | Al final |
| Quitar | En la cima | Al principio |
| Ejemplo real | Pila de platos | Cola de gente |

> **Trampa:** implementar una cola sobre una lista enlazada simple (como la pila anterior) sin guardar un puntero al último nodo. Añadir al final exige entonces recorrer toda la lista en cada `enqueue` (**O(n)**) en lugar de tiempo constante.
>
> **Buena práctica:** mantener dos punteros actualizados, uno al primer nodo y otro al último, para que `enqueue`/`dequeue` sigan siendo ambos **O(1)**.

Ambas estructuras son abstractas: nada obliga a implementarlas sobre una lista enlazada. Un array dinámico funciona igual de bien para una pila (añadir/quitar al final del array); una cola necesita entonces un poco más de cuidado (quitar del principio desplaza si no todos los elementos, salvo una estructura dedicada como un buffer circular, fuera del alcance de este capítulo).

Concepto transversal, usado mucho más allá de estas dos estructuras: una pila de llamadas gestiona las llamadas recursivas de funciones, un historial "deshacer/rehacer" (*undo/redo*) apila acciones, un analizador sintáctico (*parser*) suele apoyarse en una pila para gestionar paréntesis y bloques anidados.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una pila (LIFO) y una cola (FIFO) restringen el acceso a un único extremo de una lista enlazada o un array. La pila apila/desapila en la cima; la cola encola al final y desencola al principio. |
| **Herramientas utilizables** | Una lista enlazada para una pila en O(1); dos punteros (cabeza/cola) para una cola en O(1). |
| **Trampas a evitar** | Implementar una cola sin guardar un puntero al último nodo, lo que hace que `enqueue` sea O(n) en lugar de O(1). |
| **Buenas prácticas** | Elegir la pila o la cola según el orden de procesamiento realmente necesario, nunca al revés adaptando el código después. |
