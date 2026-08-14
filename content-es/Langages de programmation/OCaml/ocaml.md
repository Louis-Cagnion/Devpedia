---
order: 6
---

# OCaml

Todos los lenguajes vistos hasta ahora en esta sección ([C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp), [PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) comparten un mismo estilo de fondo: **instrucciones** ejecutadas en orden, una mutación directa de variables, bucles para repetir un tratamiento. Es el estilo **imperativo**, y está tan extendido que se vuelve invisible.

**OCaml** es la ocasión de observar un estilo diferente, el estilo **funcional**: los programas se construyen ensamblando funciones y evaluando expresiones, en lugar de encadenar instrucciones que modifican un estado. No es un lenguaje exótico de laboratorio; OCaml compila código nativo tan rápido como el C, y se usa en producción en ámbitos que valoran especialmente la fiabilidad: las finanzas ([Jane Street](https://www.janestreet.com) lo convirtió en su lenguaje principal), la verificación formal (el asistente de pruebas [Coq](https://coq.inria.fr) está escrito en OCaml), y el análisis estático de código.

Entre los conceptos esenciales abordados en esta sección:

- La comparación directa entre estilo funcional y estilo imperativo: expresiones frente a instrucciones, inmutabilidad frente a mutación
- Las funciones puras y sus ventajas concretas (código más fácil de probar, de razonar, de paralelizar)
- El filtrado por patrones (*pattern matching*) y los tipos algebraicos, una alternativa estructurada a los `if`/`switch` clásicos
- La recursión como reemplazo de los bucles, y las funciones de orden superior (`map`, `filter`, `fold`)
- La inferencia de tipos: una tipificación estricta, verificada en la compilación, sin tener que escribir ninguna anotación de tipo

> **Nota:** OCaml no impone un estilo 100% puro: a diferencia de [Haskell](https://www.haskell.org), permite libremente bucles `for`/`while`, referencias mutables (`ref`), y programación orientada a objetos. El estilo funcional es ahí la cultura dominante y la herramienta más natural, no una restricción absoluta del lenguaje. Es precisamente lo que permite comparar los dos estilos *dentro* de un mismo lenguaje en lugar de oponer dos lenguajes diferentes.
