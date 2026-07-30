---
order: 10
---

# A programação orientada para objetos

O Python é uma linguagem orientada para objetos de ponta a ponta — até mesmo um `int` ou um `str` é, na realidade, um objeto, uma instância de uma classe. A sintaxe das classes personalizadas assemelha-se à do PHP, com uma diferença imediata: `self` (o equivalente a `$this`) é um parâmetro **explícito** de cada método, nunca implícito.

## Declarar uma classe

```python
class Vehicule:
    def __init__(self, marca, modelo):
        self.marca = marca   # self.xxx: equivalente a $this->xxx em PHP
        self.modelo = modelo

    def description(self):
        return f"{self.marca} {self.modelo}"

v = Vehicule("Peugeot", "308")
print(v.description())   # «Peugeot 308»
```

> **Nota:** «`self`» deve ser escrito explicitamente como **primeiro parâmetro** de cada método de instância — o Python preenche-o automaticamente com a instância atual no momento da chamada (`v.description()` equivale a `Vehicule.description(v)`), mas omitir este parâmetro na assinatura provoca um erro.

## Atributos de classe vs. atributos de instância

```python
class Contador:
    total_crees = 0   # atributo de CLASSE: partilhado por todas as instâncias

    def __init__(self):
        Contador.total_crees += 1
        self.id = Contador.total_crees   # Atributo de instância: específico de cada objeto

c1 = Contador()
c2 = Contador()
print(Contador.total_crees)   # 2 -> partilhado
print(c1.id, c2.id)             # 1 2 -> específico para cada um
```

## A herança

```python
class Animal:
    def __init__(self, nome):
        self.nome = nome

    def parler(self):
        return "..."

class Chien(Animal):
    def parler(self):
        return f"{self.nome} aboie"

class Chat(Animal):
    def parler(self):
        return f"{self.nome} miaule"

animaux = [Chien("Rex"), Chat("Félix")]
for animal in animaux:
    print(animal.parler())
```

`super()` permite chamar explicitamente o método da classe pai, por exemplo, para o estender em vez de o substituir na totalidade:

```python
class ChienDeGarde(Chien):
    def parler(self):
        return super().parler() + " bruyamment"
```

## Os métodos especiais (*dunder methods*)

Métodos cujos nomes são delimitados por dois sublinhados, chamados automaticamente pelo Python em determinados contextos:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # chamada por repr(obj) e a exibição na consola/depurador
        return f"Point({self.x}, {self.y})"

    def __str__(self):             # chamada por print(obj) e str(obj)
        return f"({self.x}, {self.y})"

    def __eq__(self, autre):       # chamada por «==»
        return self.x == autre.x and self.y == autre.y

    def __add__(self, autre):      # chamada por «+»
        return Point(self.x + autre.x, self.y + autre.y)

p1 = Point(1, 2)
p2 = Point(3, 4)
print(p1 + p2)      # (4, 6) -> graças ao __add__
print(p1 == Point(1, 2))  # True -> graças ao __eq__
```

| Método especial | Acionado por |
|---|---|
| `__init__` | `NomClasse(...)` (fabricante) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Exibição na consola/depurador, `repr(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[chave]` |

## `@property` : um atributo calculado, acedido sem parênteses

```python
class Cercle:
    def __init__(self, rayon):
        self.rayon = rayon

    @property
    def surface(self):
        return 3.14159 * self.rayon ** 2

c = Cercle(5)
print(c.surface)   # 78.53975 -> acedido como um atributo, NÃO como c.surface()
```

`@property` transforma um método num atributo de leitura, recalculado a cada acesso — útil para expor um valor derivado sem exigir que quem o invoca saiba que se trata, na realidade, de um cálculo.
