---
order: 3
---

# Los bucles

Python ofrece `for` y `while`, pero el bucle `for` funciona de forma diferente a [PHP](/?c=langages-de-programmation&s=php&p=php)/[C](/?c=langages-de-programmation&s=c&p=c)/JS: siempre recorre directamente los elementos de un iterable, nunca un contador numérico manipulado manualmente.

## El bucle `for`

```python
frutas = ["manzana", "platano", "cereza"]

for fruta in frutas:
    print(fruta)
```

Para obtener un contador numérico clásico, `range()` genera una secuencia de números:

```python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):  # de 2 a 10 (excluido), en pasos de 2 -> 2, 4, 6, 8
    print(i)
```

## `enumerate()`: obtener el índice Y el valor

```python
for indice, fruta in enumerate(frutas):
    print(f"{indice}: {fruta}")
# 0: manzana
# 1: platano
# 2: cereza
```

## `zip()`: recorrer varias colecciones en paralelo

```python
nombres = ["Juan", "Maria"]
edades = [25, 30]

for nombre, edad in zip(nombres, edades):
    print(f"{nombre} tiene {edad} años")
```

`zip()` se detiene en cuanto se agota la **más corta** de las colecciones, incluso si las demás aún contienen elementos.

## `any()` / `all()`: probar una condición en todo un iterable

```python
edades = [16, 20, 15, 30]

any(edad >= 18 for edad in edades)  # True  -> AL MENOS UN elemento cumple la condición
all(edad >= 18 for edad in edades)  # False -> haría falta que la cumplieran TODOS
```

`any(iterable)` devuelve `True` en cuanto un elemento es verdadero, sin recorrer necesariamente el resto (cortocircuito, como `or`); `all(iterable)` devuelve `True` solo si todos lo son, y se detiene en el primer falso (como `and`). Ambas se usan típicamente directamente sobre una [expresión generadora](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) (sin construir una lista intermedia), lo que evita recorrer toda la colección si la respuesta ya se conoce.

> **Trampa:** sobre un iterable VACÍO, los resultados suelen sorprender: `any([])` vale `False` (no se encontró ningún elemento verdadero), `all([])` vale `True` (vacuidad: "todos" los cero elementos cumplen la condición, ya que ninguno la contradice).

## El bucle `while`

```python
i = 0

while i < 5:
    print(i)
    i += 1   # Python no tiene operador i++ ni ++i: hay que escribir i += 1
```

## `break` y `continue`

Como en la mayoría de los lenguajes:

```python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)
```

## La cláusula `else` de un bucle: una particularidad de Python

Un bucle `for`/`while` puede tener un bloque `else`, ejecutado únicamente si el bucle terminó **normalmente**, sin `break`:

```python
numeros = [1, 3, 5, 7]

for n in numeros:
    if n % 2 == 0:
        print("Número par encontrado")
        break
else:
    print("Ningún número par en la lista")  # ejecutado solo si no hubo ningún break
```

> **Nota:** esta construcción suele sorprender a quienes vienen de otros lenguajes (el `else` parece pertenecer al `if` de arriba, pero en realidad pertenece al `for`). Evita un patrón clásico donde se necesitaría si no una variable "bandera" (`encontrado = False`, puesta a `True` en el `if`, probada después del bucle).

## Sin acceso directo al índice en un `for`

A diferencia de un bucle `for` en C (`for (int i = 0; i < tamanio; i++)`), el bucle de Python nunca maneja explícitamente un índice; `enumerate()` es la forma idiomática de obtener uno cuando es necesario, en lugar de iterar sobre `range(len(lista))` e indexar manualmente después.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `for` recorre directamente los elementos de un iterable (nunca un contador manual); `range()` genera una secuencia de números si hace falta. `enumerate()`/`zip()` cubren las necesidades de índice y recorrido en paralelo. `any()`/`all()` prueban una condición en todo un iterable. |
| **Herramientas utilizables** | `enumerate()`, `zip()`, `any()`/`all()`, la cláusula `else` de un bucle (ejecutada si no hubo `break`). |
| **Trampas a evitar** | Iterar sobre `range(len(lista))` e indexar manualmente, en lugar de usar directamente `for elemento in lista` o `enumerate()`. |
| **Buenas prácticas** | Usar `enumerate()` en cuanto se necesita un índice además del valor, en lugar de gestionarlo manualmente. |
