---
order: 9
---

# Los decoradores

Un **decorador** envuelve una función dentro de otra para añadirle un comportamiento (cronometraje, registro, verificación de derechos...) sin modificar su código; este mecanismo se basa directamente en las funciones de primera clase y los closures (véase el capítulo sobre funciones).

## El principio, sin adornos sintácticos

```python
def mon_decorateur(fonction):
    def enveloppe(*args, **kwargs):
        print("Avant l'appel")
        resultado = fonction(*args, **kwargs)
        print("Après l'appel")
        return resultado
    return enveloppe

def dire_bonjour(número):
    print(f"Bonjour {número}")

dire_bonjour = mon_decorateur(dire_bonjour)   # sustituye la función por su versión envuelta
dire_bonjour("Jean")
# Antes de la llamada
# Hola, Jean
# Tras la llamada
```

## La sintaxis`@`

`@mon_decorateur` El símbolo que aparece encima de una función es un simple atajo para «`fonction = mon_decorateur(fonction)`»:

```python
@mon_decorateur
def dire_bonjour(número):
    print(f"Bonjour {número}")

dire_bonjour("Jean")   # exactamente el mismo resultado que en el ejemplo anterior
```

## Ejemplo práctico: medir el tiempo de ejecución de una función

```python
import time

def chronometrer(fonction):
    def enveloppe(*args, **kwargs):
        debut = time.time()
        resultado = fonction(*args, **kwargs)
        duree = time.time() - debut
        print(f"{fonction.__name__} a pris {duree:.4f}s")
        return resultado
    return enveloppe

@chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

calcul_long()   # calcul_long ha tardado 0,0834 s
```

## Conservar los metadatos con `functools.wraps`

Si no se toman precauciones, la función decorada «pierde» su nombre y su documentación originales, que son sustituidos por los de la función envolvente:

```python
print(calcul_long.__name__)   # «envelope» -> no resulta muy útil para la depuración
```

```python
from functools import wraps

def chronometrer(fonction):
    @wraps(fonction)   # conserva __name__, __doc__... de la función original
    def enveloppe(*args, **kwargs):
        # ... la misma lógica que antes ...
        return fonction(*args, **kwargs)
    return enveloppe

@chronometrer   # Rediseñado con esta nueva versión de Chronometrer
def calcul_long():
    total = sum(x ** 2 for x in range(1000000))
    return total

print(calcul_long.__name__)   # «calcul_long» -> corregido
```

> **Nota:** redefinir `chronometrer` no tiene ningún efecto retroactivo sobre una función que ya haya sido decorada con su versión anterior; en este caso, hay que volver a decorar `calcul_long` para que `@wraps` se aplique realmente.

## Un decorador con sus propios argumentos

Para configurar un decorador (p. ej., `@repeter(3)` en lugar de `@repeter`), se necesita un nivel adicional de anidación:

```python
def repeter(nombre_de_fois):
    def decorateur(fonction):
        def enveloppe(*args, **kwargs):
            for _ in range(nombre_de_fois):
                resultado = fonction(*args, **kwargs)
            return resultado
        return enveloppe
    return decorateur

@repeter(3)
def saluer():
    print("Bonjour !")

saluer()   # muestra «¡Hola!» tres veces
```

`repeter(3)` Devuelve primero `decorateur` (una función que toma una función), que a continuación se aplica a `saluer` —de ahí los tres niveles de funciones anidadas—.

## Decoradores habituales de la biblioteca estándar

| Decorador | Función |
|---|---|
| `@property` | Convierte un método en un atributo calculado (véase el capítulo sobre la programación orientada a objetos) |
| `@staticmethod` | Método que no necesita ni un`self` ni la clase |
| `@classmethod` | Método que recibe la propia clase (`cls`) en lugar de una instancia |
| `@functools.lru_cache` | Almacena automáticamente en caché el resultado de una función para los argumentos ya utilizados |
