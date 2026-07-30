---
order: 1
---

# Variables y tipos básicos

Python es **un lenguaje de tipado dinámico**: una variable no tiene un tipo declarado de antemano, sino que simplemente adopta el tipo del valor que se le asigna, y puede cambiar de tipo libremente a lo largo del programa (a diferencia de PHP o C, donde el tipo de una propiedad o variable tipada permanece fijo una vez declarado).

## Declarar una variable

```python
edad = 25            # int
precio = 9.99          # float
número = "Devpedia"      # str
actif = True          # bool
rien = None           # equivalente a null/NULL

edad = "vingt-cinq"    # Totalmente válido: «age» se convierte en un tipo «str» sin necesidad de declarar nada.
```

> **Nota:** a diferencia de PHP (`$variable`), Python no utiliza ningún símbolo específico para designar una variable, sino solo un nombre, en minúsculas y con guiones bajos por convención (`nom_utilisateur`, no `nomUtilisateur`).

## Comprobar el tipo de una variable

```python
type(edad)             # <class 'int'>
isinstance(edad, int)   # True -> preferible a type() == int para las comprobaciones condicionales
```

## Los operadores

```python
a, b = 5, 3   # asignación múltiple en una sola línea

a + b    # 8
a - b    # 2
a * b    # 15
a / b     # 1,6666... -> división real, siempre un float
a // b    # 1 -> división entera (división por el suelo)
a % b     # 2 -> módulo
a ** b    # 125 -> potencia

a == b    # False
a != b    # Verdadero
a and b   # Y lógico (no «&&»)
a or b    # Operador lógico «O» (no «||»)
not a     # NEGACIÓN lógica (no «!»)
```

> **Nota:** Python utiliza las palabras clave `and` / `or` / `not` en lugar de los símbolos `&&` / `||` / `!` que se encuentran en PHP, JavaScript o C.

## Las f-strings: insertar variables en el texto

```python
número = "Jean"
edad = 25

print(f"{número} a {edad} ans")           # Jean tiene 25 años.
print(f"Dans 10 ans : {edad + 10} ans") # una expresión real, no solo una variable
```

Las f-strings (prefijo «`f`» antes de las comillas) son el método moderno recomendado, que sustituye a «`"{} a {} ans".format(número, edad)`» o a la concatenación con «`+`».

## Inmutabilidad de las cadenas de caracteres

Al igual que en PHP, una cadena en Python es **inmutable**: cualquier «modificación» crea, en realidad, una nueva cadena, sin modificar nunca la original en memoria.

```python
texto = "bonjour"
texto.upper()      # devuelve «BONJOUR», NO MODIFICA el texto
print(texto)        # Siempre «hola»

texto = texto.upper()  # Hay que reasignar para «conservar» el cambio.
```

## Resumen de los tipos básicos

| Tipo | Ejemplo | Equivalente en PHP |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"texto"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

Consulta también los capítulos sobre listas/tuplas y diccionarios/conjuntos para conocer las estructuras de datos compuestas.
