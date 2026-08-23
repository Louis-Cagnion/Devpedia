---
order: 4
---

# Recursión y funciones de orden superior

## La recursión reemplaza al bucle

Sin variable mutable por defecto, repetir un tratamiento pasa por una función que se llama a sí misma, cada llamada reduciendo el problema en un paso:

```ocaml
let rec factorial n =
  if n = 0 then 1
  else n * factorial (n - 1)

factorial 5   (* 120 *)
```

## Recursión terminal: evitar hacer crecer la pila

El `factorial` de arriba **no es terminal** (*not tail-recursive*): en cada llamada, la multiplicación `n * ...` espera el resultado de la llamada recursiva antes de poder ejecutarse. Cada llamada en espera permanece por tanto en la **pila de llamadas** (cf. capítulo [La organización en memoria](/?c=representation-des-donnees&p=organisation-en-memoire) para la distinción pila/heap), hasta que se alcanza el caso base y luego todas las multiplicaciones se desarrollan en cascada al volver.

Una versión **terminal** lleva el resultado intermedio en un argumento adicional (un **acumulador**), de modo que la llamada recursiva es lo último que hace la función; ya no queda nada esperando después de ella:

```ocaml
let factorial_terminal n =
  let rec aux n acc =
    if n = 0 then acc
    else aux (n - 1) (n * acc)     (* ultima llamada: nada queda en espera despues *)
  in
  aux n 1
```

El compilador OCaml reconoce esta forma y la optimiza en un simple bucle a nivel del código máquina generado: la pila **no** crece de una llamada a otra, sea cual sea la profundidad de recursión. Esto es lo que hace practicable la recursión incluso en listas de varios millones de elementos, donde una versión no terminal acabaría agotando la pila (*stack overflow*).

## Funciones de orden superior: `map`, `filter`, `fold`

Una función de orden superior toma una función como argumento, o devuelve una, el mismo principio que un decorador [Python](/?c=langages-de-programmation&s=python&p=python) (cf. capítulo [Los decoradores](/?c=langages-de-programmation&s=python&p=decorateurs)), generalizado a toda la biblioteca estándar de listas en lugar de reservado a un caso de uso preciso.

```ocaml
let cuadrados = List.map (fun x -> x * x) [1; 2; 3; 4]        (* [1; 4; 9; 16] *)
let pares = List.filter (fun x -> x mod 2 = 0) [1; 2; 3; 4]   (* [2; 4] *)
let suma = List.fold_left (+) 0 [1; 2; 3; 4]                  (* 10 *)
```

Estas tres funciones cubren, ellas solas, casi la totalidad de los bucles `for` (cf. capítulo [Los bucles](/?c=langages-de-programmation&s=c&p=boucles), sección C) que se escribirían para transformar una colección (`map`), conservar una parte de ella (`filter`), o agregarla en un solo valor (`fold`):

```c
// Equivalente imperativo de la suma, en C
int total = 0;
for (int i = 0; i < tamanio; i++) {
    total += array[i];
}
```

La versión `fold_left` nunca menciona explícitamente un contador ni una variable intermedia: el "cómo recorrer" se delega enteramente a `List.fold_left`, y el código solo expresa ya el "qué hacer con cada elemento" (`(+)`) y el estado de partida (`0`).

> **Nota:** `fold_left` acumula de izquierda a derecha (`(((0 + 1) + 2) + 3) + 4`); para una operación no asociativa o sensible al orden, `List.fold_right` acumula de derecha a izquierda, con una firma de llamada ligeramente diferente (el acumulador es el último argumento, no el segundo).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La recursión reemplaza al bucle con contador mutable. Una recursión terminal (la llamada recursiva es la última acción) es optimizada por el compilador en un bucle, sin hacer crecer la pila. `map`/`filter`/`fold` cubren lo esencial de los bucles de transformación/filtrado/agregación. |
| **Herramientas utilizables** | `let rec`, un acumulador para hacer terminal una recursión, `List.map`/`List.filter`/`List.fold_left`. |
| **Trampas a evitar** | Escribir una recursión no terminal sobre una lista muy grande: riesgo de desbordamiento de pila (*stack overflow*). |
| **Buenas prácticas** | Transformar una recursión en forma terminal (con acumulador) en cuanto deba procesar colecciones potencialmente grandes. |
