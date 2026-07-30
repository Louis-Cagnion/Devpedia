---
order: 4
---

# Las listas y las tuplas

Python distingue entre dos estructuras ordenadas de colecciones: la **lista**, mutable, y la **tupla**, inmutable. Ambas pueden mezclar libremente elementos de diferentes tipos.

## Las listas

```python
frutas = ["pomme", "banane", "cerise"]

frutas[0]           # «manzana»
frutas[-1]           # «cerise» -> índice negativo: cuenta desde el final
frutas[0:2]          # ["manzana", "plátano"] -> slicing: elementos del índice 0 (incluido) al 2 (excluido)
frutas[::-1]         # ["cereza", "plátano", "manzana"] -> invierte la lista (paso a paso -1)

frutas.append("kiwi")     # añadir al final
frutas.insert(0, "mangue") # Inserar en un índice concreto
frutas.remove("banane")    # elimina la primera aparición de este valor
frutas.pop()                # elimina Y devuelve el último elemento
len(frutas)                  # número de elementos
"pomme" in frutas             # True/False -> comprueba si existe un valor
```

> **Nota:** a diferencia de un array en C (tamaño fijo, un único tipo), una lista en Python es un array **dinámico** heterogéneo: crece automáticamente y cada elemento puede ser de un tipo diferente, lo que conlleva un sobrecoste de memoria por elemento (cada elemento es, en realidad, una referencia a un objeto de Python, no un valor bruto contiguo como en C).

## El «slicing» en detalle

```python
números = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

números[2:5]     # [2, 3, 4] -> desde el índice 2 (incluido) hasta el 5 (excluido)
números[:3]       # [0, 1, 2] -> desde el principio
números[7:]       # [7, 8, 9] -> hasta el final
números[::2]       # [0, 2, 4, 6, 8] -> uno de cada dos elementos
```

## Las tuplas: listas inmutables

```python
coordonnees = (48.8566, 2.3522)

coordonnees[0]        # 48,8566
coordonnees[0] = 0     # TypeError: una tupla no se puede modificar una vez creada
```

Una tupla se utiliza normalmente para representar un registro fijo (un par de coordenadas, un punto RGB...) más que una colección destinada a evolucionar.

### Descompresión (*unpacking*)

```python
latitude, longitude = coordonnees
print(latitude)   # 48,8566

a, b, c = 1, 2, 3   # También funciona sin paréntesis explícitos: una tupla implícita
a, b = b, a          # Intercambio de valores, sin variables temporales
```

## Conceptos básicos sobre listas

Una **comprensión de lista** crea una nueva lista en una sola expresión, más concisa y, a menudo, más rápida que un bucle clásico de «`for`» con «`.append()`»:

```python
carres = [x ** 2 for x in range(5)]
# equivalente a:
carres = []
for x in range(5):
    carres.append(x ** 2)
```

Con un criterio de filtrado:

```python
pairs = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

> **Nota:** el código sigue siendo legible para una transformación sencilla en una sola línea; más allá de eso (varias condiciones anidadas, lógica compleja), un bucle clásico de tipo «`for`» sigue siendo más claro de leer y depurar.

Véase también el capítulo sobre diccionarios y conjuntos para conocer el equivalente a las comprensiones en estas estructuras, y el capítulo sobre iteradores/generadores para conocer la expresión generadora (variante perezosa de una comprensión de lista).
