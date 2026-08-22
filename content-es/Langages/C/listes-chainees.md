---
order: 12
---

# Las listas encadenadas

Una **lista encadenada** es una estructura de datos en la que cada elemento (un **eslabón**, o *nodo*) contiene un valor y un puntero al elemento siguiente. A diferencia de un array, sus elementos no se almacenan de forma contigua en memoria: esto es lo que permite añadir o eliminar un elemento sin tener que desplazar todos los demás.

## Declarar un eslabón

```c
typedef struct Eslabon
{
    int valor;
    struct Eslabon *siguiente;
} Eslabon;
```

Como en el caso de [un árbol binario](/?c=langages-de-programmation&s=c&p=arbres-binaires), `struct Eslabon *siguiente` debe hacer referencia a `struct Eslabon` y no solo a `Eslabon`: en el momento en que se lee esta línea, el `typedef` todavía no está completamente definido.

## Crear y encadenar eslabones

```c
Eslabon *primero = malloc(sizeof(Eslabon));   // a comprobar contra NULL en la práctica (véase La gestión de la memoria)
primero->valor = 10;

Eslabon *segundo = malloc(sizeof(Eslabon));
segundo->valor = 20;

primero->siguiente = segundo;  // encadena el primero con el segundo
segundo->siguiente = NULL;     // NULL marca el final de la lista
```

```text
primero -> segundo -> NULL
  10         20
```

## Recorrer la lista

```c
void mostrar(Eslabon *cabeza)
{
    Eslabon *actual = cabeza;

    while (actual != NULL) {
        printf("%d\n", actual->valor);
        actual = actual->siguiente;
    }
}
```

> **Nota:** `actual` es una **copia** del puntero `cabeza`: avanzar `actual = actual->siguiente` no modifica `cabeza`, que sigue designando el primer eslabón de la lista. Por eso siempre se utiliza un puntero "de trabajo" separado para recorrer una lista, nunca la propia cabeza.

## Insertar al principio de la lista

```c
Eslabon *insertarAlPrincipio(Eslabon *cabeza, int valor)
{
    Eslabon *nuevo = malloc(sizeof(Eslabon));
    if (nuevo == NULL) {
        return cabeza; // fallo de asignación: devolver la lista sin cambios en lugar de fallar
    }
    nuevo->valor = valor;
    nuevo->siguiente = cabeza;  // el nuevo eslabón apunta hacia la antigua cabeza
    return nuevo;                // se convierte en la nueva cabeza
}

// uso:
cabeza = insertarAlPrincipio(cabeza, 5);
```

Insertar al principio es una operación en tiempo constante (ningún otro eslabón se desplaza); a diferencia de un array, donde insertar al principio exige desplazar todos los elementos existentes.

## Liberar la lista

Cada eslabón asignado con `malloc()` debe liberarse individualmente: liberar directamente `cabeza` sin conservar una referencia al resto haría perder el acceso a todos los eslabones siguientes (fuga de memoria, véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)):

```c
void liberarLista(Eslabon *cabeza)
{
    Eslabon *actual = cabeza;

    while (actual != NULL) {
        Eslabon *siguiente = actual->siguiente; // guardar el siguiente ANTES de liberar actual
        free(actual);
        actual = siguiente;
    }
}
```

> **Nota:** aquí el orden importa: llamar a `free(actual)` y luego leer `actual->siguiente` sería un **use-after-free** (véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)): el valor del puntero `siguiente` debe recuperarse antes de liberar el eslabón que lo contiene.

## Lista encadenada frente a array

| | Array | Lista encadenada |
|---|---|---|
| Acceso a un elemento por índice | Inmediato (`tab[i]`) | Hay que recorrer desde el principio |
| Inserción al principio/en medio | Desplaza todos los elementos siguientes | Tiempo constante, sin desplazamiento |
| Memoria | Contigua | Fragmentada, un `malloc` por eslabón |
| Tamaño | Fijo (array estático) o redimensionable (`realloc`) | Crece de forma natural, un eslabón a la vez |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una lista encadenada enlaza eslabones dispersos en memoria mediante un puntero "siguiente"; a diferencia de un array, insertar al principio es en tiempo constante, pero el acceso por índice requiere un recorrido completo. |
| **Herramientas utilizables** | Una `struct` autorreferencial (`struct Eslabon *siguiente`), `malloc`/`free` por eslabón. |
| **Trampas a evitar** | Liberar un eslabón antes de guardar su puntero `siguiente` (use-after-free); olvidar liberar cada eslabón individualmente (fuga de memoria). |
| **Buenas prácticas** | Guardar siempre `actual->siguiente` antes de `free(actual)`; comprobar cada `malloc()` contra `NULL` antes de usarlo. |
