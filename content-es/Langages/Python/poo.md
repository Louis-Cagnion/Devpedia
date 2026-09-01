---
order: 10
---

# La programación orientada a objetos

Python es un lenguaje orientado a objetos de principio a fin: incluso un `int` o un `str` es en realidad un objeto, instancia de una clase. La sintaxis de las clases personalizadas se parece a la de [PHP](/?c=langages-de-programmation&s=php&p=php), con una diferencia inmediata: `self` (el equivalente de `$this`) es un parámetro **explícito** de cada método, nunca implícito.

## Declarar una clase

```python
class Vehiculo:
    def __init__(self, marca, modelo):
        self.marca = marca   # self.xxx: equivalente de $this->xxx en PHP
        self.modelo = modelo

    def descripcion(self):
        return f"{self.marca} {self.modelo}"

v = Vehiculo("Peugeot", "308")
print(v.descripcion())   # "Peugeot 308"
```

> **Nota:** `self` debe escribirse explícitamente como **primer parámetro** de cada método de instancia: Python lo rellena automáticamente con la instancia actual en la llamada (`v.descripcion()` equivale a `Vehiculo.descripcion(v)`), pero omitirlo en la firma provoca un error.

## Atributos de clase vs atributos de instancia

```python
class Contador:
    total_creados = 0   # atributo de CLASE: compartido por todas las instancias

    def __init__(self):
        Contador.total_creados += 1
        self.id = Contador.total_creados   # atributo DE INSTANCIA: propio de cada objeto

c1 = Contador()
c2 = Contador()
print(Contador.total_creados)  # 2 -> compartido
print(c1.id, c2.id)            # 1 2 -> propio de cada uno
```

## Leer un atributo por su nombre: `getattr()`

```python
u = Vehiculo("Peugeot", "308")

u.marca                            # "Peugeot" -> el nombre del atributo debe conocerse al escribir el código
getattr(u, "marca")                # "Peugeot" -> lo mismo, pero el nombre viene de una CADENA, resuelta en ejecución
getattr(u, "color", None)          # None      -> valor de repuesto si el atributo no existe (como dict.get())
```

`getattr(objeto, nombre, defecto)` permite aplicar el mismo tratamiento a una LISTA de nombres de atributos, calculada en tiempo de ejecución (ej. una variable de bucle), sin escribir un `if`/`elif` por atributo:

```python
for campo in ["marca", "modelo"]:
    print(f"{campo}: {getattr(u, campo)}")
```

`setattr(objeto, nombre, valor)` (escribe un atributo por su nombre) y `hasattr(objeto, nombre)` (prueba su existencia, `True`/`False`) siguen el mismo principio.

## La herencia

```python
class Animal:
    def __init__(self, nombre):
        self.nombre = nombre

    def hablar(self):
        return "..."

class Perro(Animal):
    def hablar(self):
        return f"{self.nombre} ladra"

class Gato(Animal):
    def hablar(self):
        return f"{self.nombre} maulla"

animales = [Perro("Rex"), Gato("Felix")]
for animal in animales:
    print(animal.hablar())
```

`super()` permite llamar explícitamente al método de la clase padre, por ejemplo para extenderlo en lugar de reemplazarlo por completo:

```python
class PerroGuardian(Perro):
    def hablar(self):
        return super().hablar() + " ruidosamente"
```

## Los métodos especiales (*dunder methods*)

Métodos cuyo nombre está rodeado de dobles guiones bajos, invocados automáticamente por Python en ciertos contextos:

```python
class Punto:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # llamado por repr(obj) y la visualización en consola/depurador
        return f"Punto({self.x}, {self.y})"

    def __str__(self):             # llamado por print(obj) y str(obj)
        return f"({self.x}, {self.y})"

    def __eq__(self, otro):        # llamado por "=="
        return self.x == otro.x and self.y == otro.y

    def __add__(self, otro):       # llamado por "+"
        return Punto(self.x + otro.x, self.y + otro.y)

p1 = Punto(1, 2)
p2 = Punto(3, 4)
print(p1 + p2)            # (4, 6) -> gracias a __add__
print(p1 == Punto(1, 2))  # True -> gracias a __eq__
```

| Método especial | Activado por |
|---|---|
| `__init__` | `NombreClase(...)` (constructor) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Visualización en consola/depurador, `repr(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[clave]` |

### Métodos reflejados (`__radd__`...) y `NotImplemented`

```python
class Distancia:
    def __init__(self, metros):
        self.metros = metros

    def __add__(self, otro):      # llamado cuando Distancia es el operando IZQUIERDO: d + 5
        if isinstance(otro, (int, float)):
            return Distancia(self.metros + otro)
        return NotImplemented     # "no sé tratar este tipo" -> Python reintenta con otro método

    def __radd__(self, otro):     # llamado cuando Distancia es el operando DERECHO: 5 + d
        return self.__add__(otro)

d = Distancia(100)
d + 5  # Distancia(105) -> vía __add__
5 + d  # Distancia(105) -> vía __radd__, porque int.__add__(5, d) falla y devuelve NotImplemented
```

Cuando se evalúa `izquierda + derecha`, Python primero intenta `izquierda.__add__(derecha)`. Si ese método no existe o devuelve **`NotImplemented`** (un valor especial, que no hay que confundir con la excepción `NotImplementedError`), Python reintenta con el método **reflejado** del objeto de la derecha: `derecha.__radd__(izquierda)`. Cada método especial tiene su equivalente reflejado (`__radd__`, `__rsub__`, `__rtruediv__`...): este mecanismo es el que permite por ejemplo a `pathlib.Path` (ver [Manipular archivos y carpetas](/?c=langages-de-programmation&s=python&p=manipuler-des-fichiers-et-dossiers)) definir `__rtruediv__`, para que `"carpeta" / ruta` funcione incluso con una simple cadena a la izquierda.

## `@property`: un atributo calculado, accedido sin paréntesis

```python
class Circulo:
    def __init__(self, radio):
        self.radio = radio

    @property
    def area(self):
        return 3.14159 * self.radio ** 2

c = Circulo(5)
print(c.area)   # 78.53975 -> accedido como un atributo, NO como c.area()
```

`@property` transforma un método en un atributo de lectura, recalculado en cada acceso, útil para exponer un valor derivado sin exigir que quien llama sepa que en realidad es un cálculo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | En Python, todo es objeto. `self` es un parámetro explícito de cada método. Los métodos especiales (`__init__`, `__str__`, `__eq__`...) definen cómo un objeto reacciona a las operaciones nativas (`+`, `==`, `print`...). |
| **Herramientas utilizables** | `super()` para llamar al método padre, `@property` para un atributo calculado, atributos de clase vs de instancia. |
| **Trampas a evitar** | Olvidar `self` como primer parámetro de un método de instancia: provoca un error en la llamada. |
| **Buenas prácticas** | Definir `__repr__` en toda clase destinada a mostrarse en depuración, para una representación legible en lugar de la dirección de memoria por defecto. |
