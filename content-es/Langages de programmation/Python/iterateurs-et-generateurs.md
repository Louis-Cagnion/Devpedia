---
order: 8
---

# Iteradores y generadores

Un bucle «`for`» funciona con listas, diccionarios, archivos y muchos otros objetos, ya que todos ellos implementan el mismo **protocolo de iteración**. Comprender este protocolo permite crear tus propios objetos «iterables» y utilizar generadores para procesar grandes cantidades de datos sin tener que cargarlos todos en memoria.

## El protocolo de iteración

`for elemento in objeto:` En realidad, así es como funciona entre bastidores:

```python
iterateur = iter(objeto)       # llama a objeto.__iter__()
while True:
    try:
        elemento = next(iterateur)  # llama a iterador.__next__()
    except StopIteration:
        break
    # ... cuerpo del bucle con «element» ...
```

Un objeto es **iterable** si implementa `__iter__()` (devuelve un iterador). Un **iterador** implementa `__next__()` (devuelve el siguiente elemento o lanza una excepció`StopIteration` cuando no quedan más).

## Crear un iterador personalizado

```python
class Contador:
    def __init__(self, limite):
        self.limite = limite
        self.actuel = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.actuel >= self.limite:
            raise StopIteration
        self.actuel += 1
        return self.actuel

for número in Contador(5):
    print(número)   # 1 2 3 4 5
```

## Los generadores: una forma más sencilla de escribir un iterador

Una función que contenga `yield` se convierte automáticamente en un **generador**: Python implementa para ella todo el protocolo `__iter__` / `__next__` visto anteriormente, sin que sea necesario escribir una clase.

```python
def contador(limite):
    actuel = 0
    while actuel < limite:
        actuel += 1
        yield actuel

for número in contador(5):
    print(número)   # 1 2 3 4 5
```

`yield` «Pausa» la función y devuelve un valor, **sin perder su estado**: en la siguiente llamada a `next()`, la ejecución se reanuda justo después de `yield`, con todas las variables locales intactas.

## ¿Por qué utilizar un generador en lugar de una lista?

```python
def carres_liste(n):
    return [x ** 2 for x in range(n)]   # calcula y almacena TODO en memoria, de una sola vez

def carres_generateur(n):
    for x in range(n):
        yield x ** 2                     # Calcula UN SOLO elemento cada vez, bajo demanda.
```

En el caso de `n = 10_000_000`, `carres_liste()` asigna una lista de 10 millones de elementos en memoria **antes** de empezar a utilizarlos. `carres_generateur()` solo genera un elemento cada vez, que se consume y luego se olvida; la memoria utilizada permanece constante, independientemente del tamaño de `n`.

> **Nota:** esta «evaluación perezosa» (*lazy evaluation*) tiene un coste: un generador **solo** se puede recorrer **una vez** (una vez agotado, un nuevo bucle `for` sobre él ya no produce nada), a diferencia de una lista, que se puede volver a recorrer libremente.

## Expresión generadora

Equivalente a una comprensión de lista, pero perezosa: sustituye los corchetes por paréntesis:

```python
carres = (x ** 2 for x in range(10))   # generador, aún no se ha calculado nada
liste_carres = [x ** 2 for x in range(10)]  # lista, todo se calcula al instante

sum(x ** 2 for x in range(1000000))    # calcula la suma SIN almacenar nunca el millón de valores
```

Véase también el capítulo sobre las funciones (closures) y sobre NumPy/pandas, donde la distinción entre memoria inmediata y memoria diferida vuelve a ser fundamental a gran escala.
