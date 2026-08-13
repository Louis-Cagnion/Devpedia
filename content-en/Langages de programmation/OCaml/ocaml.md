# OCaml

Every language covered so far in this section — C, C++, PHP, Python, JavaScript — shares the same underlying style: **statements** executed in order, direct mutation of variables, loops to repeat a process. This is the **imperative** style, and it's so widespread it becomes invisible.

**OCaml** is a chance to see a different style, the **functional** style: programs are built by assembling functions and evaluating expressions, rather than chaining statements that modify a state. It's not some exotic lab language — OCaml compiles to native code as fast as C, and is used in production in fields that especially value reliability: finance ([Jane Street](https://www.janestreet.com) made it their main language), formal verification (the [Coq](https://coq.inria.fr) proof assistant is written in OCaml), and static code analysis.

Among the essential concepts covered in this section:

- The direct comparison between functional and imperative style: expressions vs. statements, immutability vs. mutation
- Pure functions and their concrete advantages (code that's easier to test, reason about, and parallelize)
- Pattern matching and algebraic types, a structured alternative to classic `if`/`switch`
- Recursion as a replacement for loops, and higher-order functions (`map`, `filter`, `fold`)
- Type inference: strict typing, checked at compile time, with no type annotation to write at all

> **Note:** OCaml doesn't enforce a 100% pure style — unlike [Haskell](https://www.haskell.org), it freely allows `for`/`while` loops, mutable references (`ref`), and object-oriented programming. The functional style is the dominant culture and the most natural tool there, not an absolute constraint of the language. This is exactly what makes it possible to compare the two styles *within* a single language rather than pitting two different languages against each other.
