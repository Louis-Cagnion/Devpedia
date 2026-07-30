---
order: 10
---

# La programación orientada a objetos

Python es un lenguaje orientado a objetos de principio a fin: incluso un `int` o un `str` es, en realidad, un objeto, una instancia de una clase. La sintaxis de las clases personalizadas se asemeja a la de PHP, con una diferencia inmediata: `self` (el equivalente a `$this`) es un parámetro **explícito** de cada método, nunca implícito.

## Declarar una clase

```python
class Vehicule:
    def __init__(self, marca, modelo):
        self.marca = marca   # self.xxx: equivalente a $this->xxx en PHP
        self.modelo = modelo

    def description(self):
        return f"{self.marca} {self.modelo}"

v = Vehicule("Peugeot", "308")
print(v.description())   # «Peugeot 308»
```

> **Nota:** «`self`» debe escribirse explícitamente como **primer parámetro** de cada método de instancia; Python lo rellena automáticamente con la instancia actual en el momento de la llamada (`v.description()` equivale a `Vehicule.description(v)`), pero omitirlo en la firma provoca un error.

## Atributos de clase frente a atributos de instancia

```python
class Contador:
    total_crees = 0   # Atributo de CLASE: compartido por todas las instancias

    def __init__(self):
        Contador.total_crees += 1
        self.id = Contador.total_crees   # Atributo de INSTANCIA: propio de cada objeto

c1 = Contador()
c2 = Contador()
print(Contador.total_crees)   # 2 -> compartido
print(c1.id, c2.id)             # 1 2 -> específico para cada uno
```

## La herencia

```python
class Animal:
    def __init__(self, número):
        self.número = número

    def parler(self):
        return "..."

class Chien(Animal):
    def parler(self):
        return f"{self.número} aboie"

class Chat(Animal):
    def parler(self):
        return f"{self.número} miaule"

animaux = [Chien("Rex"), Chat("Félix")]
for animal in animaux:
    print(animal.parler())
```

`super()` Permite invocar explícitamente el método de la clase padre, por ejemplo, para ampliarlo en lugar de sustituirlo por completo:

```python
class ChienDeGarde(Chien):
    def parler(self):
        return super().parler() + " bruyamment"
```

## Los métodos especiales (*dunder methods*)

Métodos cuyo nombre está entre dos guiones bajos, que Python invoca automáticamente en determinados contextos:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # Llamada mediante repr(obj) y visualización en la consola o el depurador
        return f"Point({self.x}, {self.y})"

    def __str__(self):             # que se invoca mediante print(obj) y str(obj)
        return f"({self.x}, {self.y})"

    def __eq__(self, autre):       # llamada mediante «==»
        return self.x == autre.x and self.y == autre.y

    def __add__(self, autre):      # llamada mediante «+»
        return Point(self.x + autre.x, self.y + autre.y)

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)      # (4, 6) -> gracias a __add__
print(p1 == Point(1, 2))  # True -> gracias a __eq__
```

| Método especial | Activado por |
|---|---|
| `__init__` | `NomClasse(...)` (fabricante) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Visualización en consola/depurador, `repr(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[clave]` |

## `@property` : un atributo calculado, al que se accede sin paréntesis

```python
class Cercle:
    def __init__(self, rayon):
        self.rayon = rayon

    @property
    def surface(self):
        return 3.14159 * self.rayon ** 2

c = Cercle(5)
print(c.surface)   # 78.53975 -> se accede a él como un atributo, NO como c.surface()
```

`@property` Convierte un método en un atributo de lectura, que se recalcula cada vez que se accede a él; resulta útil para exponer un valor derivado sin exigir que quien lo invoque sepa que, en realidad, se trata de un cálculo.
