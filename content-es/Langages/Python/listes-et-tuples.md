---
order: 4
---

# Las listas y las tuplas

Python distingue dos estructuras ordenadas de colecciones: la **lista**, mutable, y la **tupla**, inmutable. Ambas pueden mezclar libremente elementos de tipos diferentes.

## Las listas

```python
frutas = ["manzana", "platano", "cereza"]

frutas[0]     # "manzana"
frutas[-1]    # "cereza" -> índice negativo: cuenta desde el final
frutas[0:2]   # ["manzana", "platano"] -> slicing: elementos del índice 0 (incluido) al 2 (excluido)
frutas[::-1]  # ["cereza", "platano", "manzana"] -> invierte la lista (paso -1)

frutas.append("kiwi")       # añade al final
frutas.insert(0, "mango")   # inserta en un índice preciso
frutas.remove("platano")    # elimina la primera aparición de ese valor
frutas.pop()                 # elimina Y devuelve el último elemento
len(frutas)                  # número de elementos
"manzana" in frutas           # True/False -> prueba la presencia de un valor
```

> **Nota:** a diferencia de un array en [C](/?c=langages-de-programmation&s=c&p=c) (tamaño fijo, un solo tipo), una lista Python es un array **dinámico** heterogéneo: crece automáticamente, y cada elemento puede ser de un tipo diferente, al precio de un sobrecoste de memoria por elemento (cada elemento es en realidad una referencia a un objeto Python, no un valor bruto contiguo como en C).

## El slicing en detalle

```python
numeros = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

numeros[2:5]  # [2, 3, 4] -> del índice 2 (incluido) al 5 (excluido)
numeros[:3]   # [0, 1, 2] -> desde el principio
numeros[7:]   # [7, 8, 9] -> hasta el final
numeros[::2]  # [0, 2, 4, 6, 8] -> un elemento de cada dos
```

## Las tuplas: listas inmutables

```python
coordenadas = (48.8566, 2.3522)

coordenadas[0]      # 48.8566
coordenadas[0] = 0  # TypeError: una tupla no se puede modificar tras su creación
```

Una tupla sirve típicamente para representar un registro fijo (un par de coordenadas, un punto RGB...) más que una colección destinada a evolucionar.

### Desempaquetado (*unpacking*)

```python
latitud, longitud = coordenadas
print(latitud)   # 48.8566

a, b, c = 1, 2, 3  # también funciona sin paréntesis explícitos: una tupla implícita
a, b = b, a        # intercambio de valores, sin variable temporal
```

## Las comprensiones de lista

Una **comprensión de lista** construye una nueva lista en una sola expresión, más concisa y a menudo más rápida que un bucle `for` clásico con `.append()`:

```python
cuadrados = [x ** 2 for x in range(5)]
# equivalente a:
cuadrados = []
for x in range(5):
    cuadrados.append(x ** 2)
```

Con una condición de filtrado:

```python
pares = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

> **Nota:** una comprensión sigue siendo legible para una transformación simple en una sola línea; más allá (varias condiciones anidadas, lógica compleja), un bucle `for` clásico sigue siendo más claro de leer y depurar.

Ver también [Los diccionarios y los conjuntos](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) para el equivalente de las comprensiones sobre estas estructuras, y [Iteradores y generadores](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) para la expresión generadora (variante perezosa de una comprensión de lista).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una lista es mutable, una tupla es inmutable: ambas ordenadas y heterogéneas. El slicing (`[inicio:fin:paso]`) extrae una porción; una comprensión construye una lista en una expresión. |
| **Herramientas utilizables** | `append`/`insert`/`remove`/`pop`, slicing, desempaquetado (*unpacking*), comprensiones de lista. |
| **Trampas a evitar** | Intentar modificar una tupla tras su creación (`TypeError`): usar una lista si el contenido debe evolucionar. |
| **Buenas prácticas** | Usar una tupla para un registro fijo, una lista para una colección destinada a evolucionar; reservar la comprensión a una transformación simple, un bucle `for` más allá. |
