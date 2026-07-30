---
order: 3
---

# Los bucles

Python ofrece `for` y `while`, pero el bucle `for` funciona de forma diferente a PHP/C/JS: siempre recorre directamente los elementos de un iterable, nunca un contador numérico manipulado manualmente.

## El bucle «`for`»

```python
frutas = ["pomme", "banane", "cerise"]

for fruta in frutas:
    print(fruta)
```

Para obtener un contador numérico clásico, `range()` genera una secuencia de números:

```python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):  # de 2 a 10 (excluido), en incrementos de 2 -> 2, 4, 6, 8
    print(i)
```

## `enumerate()` : obtener el índice Y el valor

```python
for índice, fruta in enumerate(frutas):
    print(f"{índice} : {fruta}")
# 0: manzana
# 1: banana
# 2: cereza
```

## `zip()` : explorar varias colecciones al mismo tiempo

```python
noms = ["Jean", "Marie"]
ages = [25, 30]

for número, edad in zip(noms, ages):
    print(f"{número} a {edad} ans")
```

`zip()` se detiene en cuanto se agota la colección **más corta**, aunque las demás aún contengan elementos.

## El bucle «`while`»

```python
i = 0

while i < 5:
    print(i)
    i += 1   # Python no tiene el operador i++ ni ++i: hay que escribir i += 1
```

## `break` y `continue`

Al igual que en la mayoría de los lenguajes:

```python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)
```

## La cláusula «`else`» de un bucle: una particularidad de Python

Un bucle «`for`» / «`while`» puede incluir un bloque «`else`», que solo se ejecuta si el bucle ha finalizado **normalmente**, sin «`break`»:

```python
números = [1, 3, 5, 7]

for n in números:
    if n % 2 == 0:
        print("Nombre pair trouvé")
        break
else:
    print("Aucun nombre pair dans la liste")  # Se ejecuta únicamente si no se ha producido ningún salto de interrupción.
```

> **Nota:** esta construcción suele sorprender a los desarrolladores que provienen de otros lenguajes (el `else` parece estar relacionado con el `if` anterior, pero en realidad está vinculado al `for`). Evita un patrón clásico en el que, de otro modo, se necesitaría una variable «indicadora» (`trouve = False`, establecida en `True` en el `if`, y comprobada tras el bucle).

## No hay acceso directo al índice en un `for`

A diferencia de un bucle «`for`» en C (`for (int i = 0; i < taille; i++)`), el bucle de Python nunca maneja explícitamente un índice: `enumerate()` es la forma habitual de obtener uno cuando es necesario, en lugar de iterar sobre `range(len(lista))` y luego indexarlo manualmente.
