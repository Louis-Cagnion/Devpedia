---
order: 8
---

# Iteradores y generadores

Un bucle `for` funciona con listas, diccionarios, archivos, y muchos otros objetos, porque todos implementan el mismo **protocolo de iteración**. Entender este protocolo permite crear tus propios objetos "recorribles", y usar generadores para procesar grandes cantidades de datos sin cargarlas todas en memoria.

## El protocolo de iteración

`for elemento in objeto:` funciona en realidad así, entre bastidores:

```python
iterador = iter(objeto)       # llama a objeto.__iter__()
while True:
    try:
        elemento = next(iterador)  # llama a iterador.__next__()
    except StopIteration:
        break
    # ... cuerpo del bucle con "elemento" ...
```

Un objeto es **iterable** si implementa `__iter__()` (devuelve un iterador). Un **iterador** implementa `__next__()` (devuelve el siguiente elemento, o lanza `StopIteration` cuando ya no hay más).

## Crear un iterador personalizado

```python
class Contador:
    def __init__(self, limite):
        self.limite = limite
        self.actual = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.actual >= self.limite:
            raise StopIteration
        self.actual += 1
        return self.actual

for numero in Contador(5):
    print(numero)   # 1 2 3 4 5
```

## Los generadores: una forma más simple de escribir un iterador

Una función que contiene `yield` se convierte automáticamente en un **generador**: Python implementa por ella todo el protocolo `__iter__`/`__next__` visto arriba, sin necesidad de escribir una clase.

```python
def contador(limite):
    actual = 0
    while actual < limite:
        actual += 1
        yield actual

for numero in contador(5):
    print(numero)   # 1 2 3 4 5
```

`yield` "pausa" la función y devuelve un valor, **sin perder su estado**: en la siguiente llamada a `next()`, la ejecución se reanuda justo después del `yield`, con todas las variables locales intactas.

## Por qué usar un generador en lugar de una lista

```python
def cuadrados_lista(n):
    return [x ** 2 for x in range(n)]   # calcula y almacena TODO en memoria, de golpe

def cuadrados_generador(n):
    for x in range(n):
        yield x ** 2                     # calcula UN SOLO elemento a la vez, bajo demanda
```

Para `n = 10_000_000`, `cuadrados_lista()` asigna una lista de 10 millones de elementos en memoria **antes** de empezar a usarlos. `cuadrados_generador()` solo produce un elemento a la vez, consumido y luego olvidado: la memoria usada permanece constante, sea cual sea el tamaño de `n`.

> **Nota:** esta "evaluación perezosa" (*lazy evaluation*) tiene un coste: un generador solo se puede recorrer **una única vez** (una vez agotado, un nuevo bucle `for` sobre él ya no produce nada), a diferencia de una lista que se puede volver a recorrer libremente.

## Expresión generadora

Equivalente a una comprensión de lista, pero perezosa: reemplaza los corchetes por paréntesis:

```python
cuadrados = (x ** 2 for x in range(10))         # generador, nada se ha calculado todavía
lista_cuadrados = [x ** 2 for x in range(10)]   # lista, todo se calcula de inmediato

# calcula la suma SIN almacenar nunca el millón de valores
sum(x ** 2 for x in range(1000000))
```

Ver también [Las funciones](/?c=langages-de-programmation&s=python&p=fonctions) (closures) y [NumPy](/?c=data-science&p=numpy), donde la distinción memoria inmediata vs perezosa vuelve a ser central a gran escala.

## `next()` con valor por defecto: evitar `StopIteration`

```python
iterador = iter([1, 2, 3])

next(iterador)              # 1
next(iterador)              # 2
next(iterador)              # 3
next(iterador)              # StopIteration: ya no queda nada que producir

# "agotado" -> forma de dos argumentos: sin excepcion si esta agotado
next(iterador, "agotado")
```

`next(iterable, defecto)` devuelve `defecto` en lugar de lanzar `StopIteration` cuando el iterador ya no produce nada. Combinado con una expresión generadora filtrada, esto da una forma concisa de obtener el primer elemento que cumple una condición, con un valor de repliegue si ninguno la cumple:

```python
numeros = [1, 3, 5, 8, 9]

primer_par = next((x for x in numeros if x % 2 == 0), None)
# 8 -> primer elemento par encontrado

primer_negativo = next((x for x in numeros if x < 0), None)
# None -> ningun elemento coincide, se devuelve el valor de repliegue
```

> **Buena práctica:** preferir `next((x for x in col if condicion), defecto)` a un bucle `for` manual con `break`, o a `[x for x in col if condicion][0]` (que construye toda la lista filtrada antes de quedarse solo con el primer elemento, y lanza un `IndexError` si está vacía en lugar de devolver un valor de repliegue).

## Generador vs thread: un solo flujo a la vez

Un generador a veces da la impresión de "hacer dos cosas a la vez" (el código llamador, y el generador que avanza en segundo plano). Es engañoso: a diferencia de un thread (ver [Los threads (pthread)](/?c=langages-de-programmation&s=c&p=threads)), donde dos flujos de ejecución pueden realmente avanzar en paralelo sin coordinarse explícitamente, un generador nunca hace nada "en segundo plano".

`next()` es una llamada de función como cualquier otra: **bloquea** el código llamador hasta que el generador alcanza el siguiente `yield` (o termina). Solo uno de los dos flujos avanza en un instante dado, nunca los dos a la vez:

```python
def tareas():
    print("Inicio")
    yield "A"
    print("Reanudación tras A")
    yield "B"

t = tareas()
print("Antes del primer next")
# "Inicio" se muestra AQUÍ, en el momento de la llamada, no antes, no en segundo plano
print(next(t))
print("Antes del segundo next")
print(next(t))     # "Reanudación tras A" se muestra AQUÍ, nunca mientras tanto
```

El orden de salida es **totalmente determinista** y reproducible en cada ejecución, al contrario que dos threads independientes, cuyo orden de ejecución relativo no es predecible sin sincronización explícita (mutex, `pthread_join`...). Por eso se habla de **corrutina** más que de paralelismo para describir `yield`: la función "coopera" con su llamador devolviéndole explícitamente el control en cada `yield`, en lugar de ser interrumpida por la fuerza por un planificador como haría un thread.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un objeto iterable implementa `__iter__`, un iterador implementa `__next__`. Una función con `yield` se convierte en un generador: perezoso, memoria constante, pero recorrible una sola vez. |
| **Herramientas utilizables** | `iter()`/`next()` (con o sin valor por defecto), `yield`, expresión generadora (`(x for x in ...)`). |
| **Trampas a evitar** | Reutilizar un generador ya agotado, esperando que reproduzca sus valores. Usar `next()` sin valor por defecto cuando el agotamiento del iterador es un caso normal, no un error. |
| **Buenas prácticas** | Preferir un generador a una lista en cuanto la colección es grande y se recorre una sola vez secuencialmente. `next((x for x in col if condicion), defecto)` para obtener el primer elemento que cumple una condición, sin bucle ni lista intermedia. |
