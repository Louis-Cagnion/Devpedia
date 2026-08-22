---
order: 9
---

# Los decoradores

Un **decorador** envuelve una función dentro de otra, para añadirle un comportamiento (cronometraje, registro, verificación de permisos...) sin modificar su código; este mecanismo se apoya directamente en las funciones de primera clase y las closures (ver [Las funciones](/?c=langages-de-programmation&s=python&p=fonctions)).

## El principio, sin azúcar sintáctico

```python
def mi_decorador(funcion):
    def envoltura(*args, **kwargs):
        print("Antes de la llamada")
        resultado = funcion(*args, **kwargs)
        print("Después de la llamada")
        return resultado
    return envoltura

def decir_hola(nombre):
    print(f"Hola {nombre}")

decir_hola = mi_decorador(decir_hola)   # sustituye la función por su versión envuelta
decir_hola("Juan")
# Antes de la llamada
# Hola Juan
# Después de la llamada
```

## La sintaxis `@`

`@mi_decorador` encima de una función es un simple atajo para `funcion = mi_decorador(funcion)`:

```python
@mi_decorador
def decir_hola(nombre):
    print(f"Hola {nombre}")

decir_hola("Juan")   # exactamente el mismo resultado que el ejemplo anterior
```

## Ejemplo práctico: cronometrar una función

```python
import time

def cronometrar(funcion):
    def envoltura(*args, **kwargs):
        inicio = time.time()
        resultado = funcion(*args, **kwargs)
        duracion = time.time() - inicio
        print(f"{funcion.__name__} tardó {duracion:.4f}s")
        return resultado
    return envoltura

@cronometrar
def calculo_largo():
    total = sum(x ** 2 for x in range(1000000))
    return total

calculo_largo()   # calculo_largo tardó 0.0834s
```

## Preservar los metadatos con `functools.wraps`

Sin precaución, la función decorada "pierde" su nombre y su documentación originales, reemplazados por los de la función envoltura:

```python
print(calculo_largo.__name__)   # "envoltura" -> no muy útil para depurar
```

```python
from functools import wraps

def cronometrar(funcion):
    @wraps(funcion)   # preserva __name__, __doc__... de la función original
    def envoltura(*args, **kwargs):
        # ... misma lógica que antes ...
        return funcion(*args, **kwargs)
    return envoltura

@cronometrar   # redecorada con esta nueva versión de cronometrar
def calculo_largo():
    total = sum(x ** 2 for x in range(1000000))
    return total

print(calculo_largo.__name__)   # "calculo_largo" -> corregido
```

> **Nota:** redefinir `cronometrar` no cambia nada retroactivamente en una función ya decorada por su antigua versión: `calculo_largo` debe ser redecorada aquí para que `@wraps` se aplique realmente.

## Un decorador con sus propios argumentos

Para parametrizar un decorador (ej. `@repetir(3)` en lugar de `@repetir`), se necesita un nivel de anidación adicional:

```python
def repetir(numero_de_veces):
    def decorador(funcion):
        def envoltura(*args, **kwargs):
            for _ in range(numero_de_veces):
                resultado = funcion(*args, **kwargs)
            return resultado
        return envoltura
    return decorador

@repetir(3)
def saludar():
    print("¡Hola!")

saludar()   # muestra "¡Hola!" tres veces
```

`repetir(3)` devuelve primero `decorador` (una función que toma una función), que se aplica luego a `saludar`, de ahí los tres niveles de funciones anidadas.

## Decoradores frecuentes de la biblioteca estándar

| Decorador | Papel |
|---|---|
| `@property` | Transforma un método en un atributo calculado (ver [La programación orientada a objetos](/?c=langages-de-programmation&s=python&p=poo)) |
| `@staticmethod` | Método que no necesita ni `self`, ni la clase |
| `@classmethod` | Método que recibe la propia clase (`cls`) en lugar de una instancia |
| `@functools.lru_cache` | Almacena en caché automáticamente el resultado de una función para argumentos ya vistos |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un decorador (`@nombre`) envuelve una función para añadirle un comportamiento sin modificar su código: `@decorador def f()` equivale a `f = decorador(f)`. |
| **Herramientas utilizables** | `functools.wraps` (preserva los metadatos), `@property`/`@staticmethod`/`@classmethod`, `@functools.lru_cache`. |
| **Trampas a evitar** | Olvidar `@wraps`: la función decorada pierde su `__name__`/`__doc__` original, lo que complica la depuración. |
| **Buenas prácticas** | Usar siempre `@wraps(funcion)` en la función de envoltura de un decorador personalizado. |
