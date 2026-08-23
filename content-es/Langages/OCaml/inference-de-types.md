---
order: 5
---

# La inferencia de tipos

## Estático, pero sin anotaciones

OCaml es de **tipado estático**: cada expresión tiene un tipo fijado de una vez por todas, verificado incluso antes de la ejecución, como en [C](/?c=langages-de-programmation&s=c&p=c) (cf. capítulo [Las variables y tipos de datos](/?c=langages-de-programmation&s=c&p=variables)). A diferencia de C, este tipo casi nunca necesita escribirse explícitamente:

```ocaml
let suma x y = x + y
(* el compilador deduce solo: suma : int -> int -> int *)
```

El uso de `+` (reservado a los enteros en OCaml; `+.` es la suma flotante) basta al compilador para deducir que `x` e `y` son `int`, y por tanto que `suma` también devuelve uno. No se escribió ninguna anotación, y sin embargo el tipado es tan estricto como en C: llamar a `suma 1 "dos"` es un error detectado en la compilación, nunca en la ejecución.

## Cómo procede la inferencia

El mecanismo (el [algoritmo de Hindley-Milner](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)) parte de cada expresión y plantea restricciones sobre los tipos de sus subexpresiones, luego resuelve el conjunto del sistema de restricciones para todo el programa:

```ocaml
let doble x = x + x
(* '+' impone: x es int, y el resultado es int *)
(* -> doble : int -> int *)

let aplicar_dos_veces f x = f (f x)
(* f debe aceptar el tipo que devuelve -- ninguna restriccion fija CUAL *)
(* -> aplicar_dos_veces : ('a -> 'a) -> 'a -> 'a *)
```

El segundo ejemplo ilustra el **polimorfismo paramétrico**: `'a` significa "un tipo cualquiera, a determinar según la llamada", la misma idea que un template [C++](/?c=langages-de-programmation&s=cpp&p=cpp) (cf. capítulo [Las plantillas](/?c=langages-de-programmation&s=cpp&p=templates)), pero resuelta automáticamente por inferencia en lugar de declarada explícitamente en cada uso (`template<typename T>`).

## Comparado con el tipado dinámico y el tipado gradual

| | C | [Python](/?c=langages-de-programmation&s=python&p=python) (anotaciones) | OCaml |
|---|---|---|---|
| Verificación | En la compilación | A elección: nunca, o vía un [verificador externo](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) (`mypy`) | En la compilación, sistemáticamente |
| Anotación requerida | Siempre (`int x`) | Opcional | Nunca (deducida) |

Python (cf. capítulo [El tipado con anotaciones](/?c=langages-de-programmation&s=python&p=typage-avec-annotations)) permite añadir indicaciones de tipo a posteriori, verificadas por una herramienta separada que sigue siendo facultativa: el programa se ejecuta incluso si esas anotaciones son falsas o están ausentes. En OCaml, no existe un modo "sin verificación": un programa cuyos tipos no concuerdan simplemente no compila, y por tanto nunca puede llegar a la ejecución con una incoherencia de tipo.

## Una red de seguridad, no una restricción de verbosidad

La idea preconcebida sobre los lenguajes de tipado estático es que obligan a escribir más: es cierto en C, donde cada variable lleva su tipo. La inferencia disocia ambas cosas: el rigor del tipado estático (errores de tipo detectados antes de la ejecución, incluso en código nunca ejecutado durante los tests) sin el coste de tecleo que habitualmente se le asocia.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | OCaml es de tipado estático pero deduce los tipos sin anotación (algoritmo de Hindley-Milner): el rigor del tipado estático sin el coste de tecleo habitual. |
| **Herramientas utilizables** | El polimorfismo paramétrico (`'a`) para una función válida sobre cualquier tipo, resuelto automáticamente. |
| **Trampas a evitar** | Creer que un lenguaje sin anotación de tipo es forzosamente de tipado dinámico: OCaml verifica todo en la compilación, sin excepción. |
| **Buenas prácticas** | Dejar que el compilador infiera los tipos en lugar de anotarlos sistemáticamente; las anotaciones siguen siendo útiles puntualmente para documentar una firma compleja. |
