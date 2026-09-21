---
order: 5
---

# El swap-remove: eliminar un elemento en O(1)

Eliminar un elemento en medio de un array normalmente sale caro: hay que desplazar todos los elementos siguientes una casilla hacia la izquierda para cubrir el hueco, una operación **O(n)** ([complejidad](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). El *swap-remove* (o *swap-and-pop*) evita ese desplazamiento, a costa de perder el orden de los elementos -- aceptable en cuanto ese orden no necesite conservarse.

## El problema: el desplazamiento clásico

```c
// elimina el elemento en el índice i, desplazando todo lo que sigue -- O(n)
void eliminar_con_desplazamiento(int arr[], int *tamano, int i)
{
    for (int j = i; j < *tamano - 1; j++)
        arr[j] = arr[j + 1];   // cada elemento retrocede una casilla
    (*tamano)--;
}
```

En un array de 1000 elementos, eliminar el primero desplaza los otros 999: costoso si la operación se repite a menudo.

## La técnica: intercambiar con el último, luego eliminar

En lugar de desplazar, se intercambia el elemento a eliminar con el **último elemento activo** del array, y luego se reduce el contador de tamaño:

```c
// elimina el elemento en el índice i intercambiándolo con el último -- O(1)
void swap_remove(int arr[], int *tamano, int i)
{
    arr[i] = arr[*tamano - 1];   // el último elemento ocupa el lugar del eliminado
    (*tamano)--;                  // el último ya no cuenta como activo
}
```

```text
Antes (eliminar el índice 1, valor B):
[A][B][C][D]        tamano = 4
    ^ a eliminar

Después de swap_remove(arr, &tamano, 1):
[A][D][C] [B]        tamano = 3
             ^ B sigue físicamente en memoria, pero ya no se cuenta
```

Solo se mueve un elemento, sea cual sea el tamaño del array: **O(1)**, independiente de la posición eliminada.

> **Trampa:** esta técnica solo sirve si el orden de los elementos restantes no necesita conservarse. En un array donde el orden importa (ej. una clasificación, un historial cronológico), swap-remove rompería silenciosamente ese orden -- en ese caso, mantener el desplazamiento clásico.

## Deshacer una eliminación sin copiar

Como el elemento eliminado permanece físicamente presente más allá del nuevo contador (`arr[*tamano]` hasta el antiguo `*tamano`, nunca sobrescrito mientras no ocurra otro `swap_remove`), deshacer la última eliminación consiste simplemente en restaurar el antiguo contador -- no hace falta copiar ningún dato:

```c
int tamano_anterior = tamano;
swap_remove(arr, &tamano, i);
// ... más tarde, para deshacer:
tamano = tamano_anterior;   // arr[i] vuelve a ser válido tal cual, nada que recopiar
```

Esta propiedad hace del swap-remove una técnica especialmente adecuada para un algoritmo que prueba y deshace candidatos en bucle, como el [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El swap-remove elimina un elemento de un array desordenado en O(1), intercambiándolo con el último elemento activo y decrementando el contador de tamaño, a costa de perder el orden de los elementos. |
| **Herramientas utilizables** | Ninguna herramienta dedicada: una técnica que se aplica directamente sobre un array/contador de tamaño. |
| **Trampas a evitar** | Usarla en un array donde el orden de los elementos deba conservarse (clasificación, historial). |
| **Buenas prácticas** | Aprovechar que el elemento eliminado permanece físicamente en memoria para deshacer una eliminación sin copiar, simplemente restaurando el antiguo contador. |
