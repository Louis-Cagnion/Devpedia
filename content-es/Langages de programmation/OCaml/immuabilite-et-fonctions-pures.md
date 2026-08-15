---
order: 2
---

# Inmutabilidad y funciones puras

## La inmutabilidad por defecto, y su salida explícita

Un enlace OCaml (`let x = ...`) no se puede reasignar: modificar un valor supone crear un valor **nuevo** a partir del antiguo, nunca modificar el original en su sitio. Cuando se necesita una casilla realmente mutable, OCaml obliga a declararlo explícitamente con una **referencia**:

```ocaml
let contador = ref 0       (* una referencia: una casilla mutable, explicita *)
contador := !contador + 1  (* := asigna un nuevo valor *)
print_int !contador        (* ! lee el valor actual -> 1 *)
```

La sintaxis `ref`/`:=`/`!` hace que toda mutación sea **visible en el código**: imposible mutar un valor por accidente, a diferencia de una variable Python o JavaScript, mutable por defecto sin ninguna marca distintiva en el lugar donde se modifica.

## Estructuras de datos persistentes

Añadir un elemento a una lista OCaml nunca modifica la lista original: el operador `::` construye una **nueva** lista, que comparte su final (su "cola") con la antigua en lugar de copiarla íntegramente.

```ocaml
let lista_a = [2; 3; 4]
let lista_b = 1 :: lista_a   (* lista_b = [1; 2; 3; 4] *)
(* lista_a sigue existiendo, sin cambios: [2; 3; 4] *)
```

```python
# Python: append() muta la lista existente, ya solo queda una lista
lista_a = [2, 3, 4]
lista_a.append(1)   # lista_a se convierte en [2, 3, 4, 1] -- la original ya no existe
```

Esta estructura llamada **persistente** hace posible mantener varias versiones de una misma colección sin copiarlas nunca íntegramente: `lista_a` y `lista_b` coexisten, comparten la memoria de lo que tienen en común, y ninguna de las dos puede corromper a la otra.

## Funciones puras

Una función es **pura** si cumple dos condiciones: su salida solo depende de sus argumentos (la misma entrada siempre produce la misma salida), y su ejecución no produce ningún **efecto secundario** observable (ninguna mutación de un estado externo a la función, ninguna escritura en disco, ninguna visualización).

```ocaml
let cuadrado x = x * x            (* pura: depende unicamente de x, ningun efecto secundario *)

let contador = ref 0
let cuadrado_impuro x =
  contador := !contador + 1;       (* efecto secundario: modifica un estado externo *)
  x * x
```

`cuadrado` puede reemplazarse por su valor de retorno en cualquier parte del programa sin cambiar su comportamiento, una propiedad llamada **transparencia referencial**. `cuadrado_impuro`, en cambio, no puede: llamarla o no cambia el contenido de `contador`, así que el orden y el número de llamadas importan, no solo el resultado final.

## Por qué importa concretamente

- **Probar se vuelve trivial**: una función pura se prueba con entradas y una salida esperada, sin tener que construir un estado previo ni verificar un efecto secundario tras la llamada, lo exacto opuesto de una dependencia oculta.
- **Ninguna sorpresa entre dos llamadas**: como ningún estado compartido puede modificarse sin que el llamador lo sepa, dos llamadas idénticas siempre dan el mismo resultado, incluso ejecutadas en paralelo en núcleos diferentes: un estado compartido mutado simultáneamente por varios threads es precisamente una de las causas clásicas de bug difícil de reproducir.
- **Una trampa estructuralmente imposible**: el argumento por defecto mutable en Python (cf. capítulo [Las funciones](/?c=langages-de-programmation&s=python&p=fonctions)) solo existe porque un objeto mutable compartido puede capturarse silenciosamente entre varias llamadas. Sin mutación implícita, esta trampa concreta simplemente no tiene dónde agarrarse.

> **Matiz:** ningún programa real está compuesto al 100% de funciones puras: mostrar un resultado, leer un archivo, responder a una petición de red son efectos secundarios por naturaleza. El objetivo no es eliminarlos, sino **aislarlos**: reducir al mínimo la parte del código que depende de ellos, para concentrar el esfuerzo de test y revisión donde los bugs son más probables.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un enlace OCaml es inmutable por defecto; `ref`/`:=`/`!` hacen explícita y visible toda mutación. Una función pura solo depende de sus argumentos y no tiene ningún efecto secundario: su salida es por tanto predecible y comprobable de forma aislada. |
| **Herramientas utilizables** | `ref`, `:=`, `!`, las estructuras de datos persistentes (listas inmutables que comparten su memoria). |
| **Trampas a evitar** | Esperar que una función con efecto secundario (vía `ref`) dé el mismo resultado en cada llamada, independientemente del orden de ejecución. |
| **Buenas prácticas** | Aislar los efectos secundarios en una pequeña parte del código en lugar de eliminarlos por completo; concentrar el esfuerzo de test donde se encuentran. |
