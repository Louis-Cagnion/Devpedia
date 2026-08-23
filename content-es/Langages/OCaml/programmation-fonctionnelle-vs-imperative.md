---
order: 1
---

# Programación funcional vs imperativa

## Instrucciones contra expresiones

En C, [Python](/?c=langages-de-programmation&s=python&p=python) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), un `if` es una **instrucción**: no produce ningún valor, solo dispara la ejecución de un bloque u otro.

```python
# Python: if es una instrucción, cada rama debe asignar explícitamente
if edad >= 18:
    mensaje = "mayor de edad"
else:
    mensaje = "menor de edad"
```

En OCaml, como en la gran mayoría de los lenguajes funcionales, `if` es una **expresión**: produce directamente un valor, como lo haría un operador ternario.

```ocaml
let mensaje = if edad >= 18 then "mayor de edad" else "menor de edad"
```

Esta idea se generaliza a todo el lenguaje: un bloque entero (delimitado por `let ... in`) es él mismo una expresión, cuyo valor es el de su última línea.

```ocaml
let resultado =
  let a = 2 in
  let b = 3 in
  a + b            (* resultado = 5: es el valor de todo el bloque *)
```

No existe por tanto, estructuralmente, ninguna distinción entre "lo que produce un valor" y "lo que ejecuta una acción": todo produce un valor, incluido `()` (*unit*, el equivalente de `void`) para una expresión ejecutada únicamente por su efecto.

## Enlace contra mutación

`let x = 5` en OCaml no reserva un lugar de memoria reasignable: es un **enlace** (*binding*), que asocia el nombre `x` al valor `5` para el ámbito donde es visible. Reutilizar `let x = ...` no modifica nada, crea un nuevo nombre que oculta el anterior.

```ocaml
let x = 5 in
let x = x + 1 in  (* nuevo enlace, NO modifica el x anterior *)
print_int x       (* 6 *)
```

```python
# Python: x se reasigna, la misma variable cambia de valor
x = 5
x = x + 1
print(x)   # 6
```

El resultado mostrado es idéntico, pero el mecanismo difiere: en Python, una sola casilla de memoria cambió de contenido; en OCaml, un nuevo enlace simplemente tomó el relevo del anterior en el ámbito actual. OCaml propone una salida explícita cuando se necesita una casilla realmente mutable, la referencia (`ref`), profundizada en el capítulo sobre la inmutabilidad y las funciones puras.

## Bucles contra recursión

Sin variable mutable por defecto, un bucle clásico (que se basa en un contador reasignado en cada vuelta) no tiene su lugar natural en estilo funcional. El reemplazo es la **recursión**: una función que se llama a sí misma, cada llamada llevando el equivalente de una vuelta de bucle.

```ocaml
(* Estilo imperativo: contador mutable, bucle for sobre un array *)
let suma_imperativa array =
  let total = ref 0 in
  for i = 0 to Array.length array - 1 do
    total := !total + array.(i)
  done;
  !total

(* Estilo funcional: recursion, ninguna variable mutable *)
let rec suma_funcional = function
  | [] -> 0
  | cabeza :: resto -> cabeza + suma_funcional resto
```

Ambos estilos coexisten en OCaml: `ref`, `for` y `while` existen realmente en el lenguaje, no es una simulación. El capítulo sobre la recursión y las funciones de orden superior detalla por qué la versión recursiva sigue siendo practicable incluso en listas grandes.

## Síntesis

| | Imperativo (C, Python, JS...) | Funcional (OCaml) |
|---|---|---|
| Unidad básica | Instrucción (ningún valor) | Expresión (siempre produce un valor) |
| Variables | Reasignables por defecto | Enlaces inmutables por defecto, mutación explícita vía `ref` |
| Repetición | Bucles (`for`, `while`) con contador mutable | Recursión, funciones de orden superior (`map`, `fold`) |
| Modelo mental | "Qué hacer, en qué orden" | "Qué valor, a partir de qué otros valores" |

Ningún estilo es estrictamente superior: el estilo imperativo a menudo encaja más naturalmente con un recurso que cambia realmente en el tiempo (el estado de una interfaz, una conexión de red), mientras que el estilo funcional destaca en transformaciones de datos puras. El resto de este tema detalla las razones concretas de esta ventaja en lugar de darla por sentada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | En OCaml, `if` y todo bloque son expresiones (producen un valor), `let` crea un enlace inmutable (no una variable reasignable), y la recursión reemplaza al bucle con contador mutable. |
| **Herramientas utilizables** | `let ... in`, `if ... then ... else` como expresión, `let rec` para una función recursiva. |
| **Trampas a evitar** | Confundir un nuevo enlace (`let x = x + 1`) con una reasignación: el `x` anterior no se modifica, solo se oculta en el ámbito siguiente. |
| **Buenas prácticas** | Elegir el estilo según la naturaleza del problema: imperativo para un estado que cambia realmente en el tiempo, funcional para una transformación de datos pura. |
