---
order: 6
---

# Las funciones

Una función de Python se declara con «`def`». Las funciones son **objetos de primera clase**: pueden almacenarse en una variable, pasarse como argumento a otra función o devolverse desde una función, exactamente igual que cualquier otro valor.

## Declarar y llamar a una función

```python
def addition(a, b):
    return a + b

resultado = addition(2, 3)   # 5
```

## Parámetros por defecto

```python
def saluer(número, mensaje="Bonjour"):
    return f"{mensaje} {número}"

saluer("Jean")               # «Hola, Jean»
saluer("Jean", "Salut")       # «Hola, Jean»
```

> **Error clásico: nunca utilices un objeto mutable (lista, diccionario) como valor por defecto.** El valor por defecto **solo** se evalúa **una vez**, al definir la función, no en cada llamada:

```python
def ajouter_a_liste(elemento, lista=[]):  # PELIGRO: esta lista se COMPARTE entre todas las llamadas
    lista.append(elemento)
    return lista

ajouter_a_liste(1)   # [1]
ajouter_a_liste(2)   # [1, 2] -> ¡no [2]! Se ha reutilizado la misma lista por defecto
```

Buenas prácticas:

```python
def ajouter_a_liste(elemento, lista=None):
    if lista is None:
        lista = []   # una NUEVA lista, creada en cada llamada
    lista.append(elemento)
    return lista
```

## `*args` y «`**kwargs`»: un número variable de argumentos

```python
def somme(*números):          # *args: agrupa los argumentos posicionales sobrantes en una tupla
    return sum(números)

somme(1, 2, 3, 4)   # 10

def afficher_infos(**options):  # **kwargs: agrupa los argumentos con nombre sobrantes en un diccionario**
    for clave, valor in options.items():
        print(f"{clave} : {valor}")

afficher_infos(número="Jean", edad=25)
```

## Argumentos solo mediante palabras clave

Un «`*`» solo en la firma obliga a que todo lo que le siga se pase por nombre, nunca por posición:

```python
def creer_utilisateur(número, *, email, actif=True):
    return {"nom": número, "email": email, "actif": actif}

creer_utilisateur("Jean", email="jean@exemple.com")   # De acuerdo
creer_utilisateur("Jean", "jean@exemple.com")           # TypeError: el campo «email» debe tener un nombre
```

## Las funciones lambda

Una función anónima, limitada a una sola expresión (sin «`return`» explícito, sin bloque de varias líneas):

```python
double = lambda x: x * 2
double(5)   # 10

# Uso habitual: como argumento de una función que espera una llamada de retorno.
números = [5, 2, 8, 1]
nombres_tries = sorted(números, key=lambda x: -x)  # orden descendente
```

## Cierres y «`nonlocal`»

Una función anidada puede leer las variables de la función que la engloba; para **modificarlas**, es necesario utilizar «`nonlocal`»:

```python
def contador():
    total = 0

    def incrementer():
        nonlocal total   # Sin esto, «total += 1» crearía una nueva variable LOCAL que se incrementaría.
        total += 1
        return total

    return incrementer

compter = contador()
compter()   # 1
compter()   # 2 -> «total» se ha conservado correctamente entre las llamadas
```

Véase también el capítulo sobre decoradores, que se basa directamente en este mecanismo de cierre.
