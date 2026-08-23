---
order: 10
---

# A programação orientada a objetos

Python é uma linguagem orientada a objetos de ponta a ponta: até mesmo um `int` ou uma `str` é na verdade um objeto, instância de uma classe. A sintaxe das classes personalizadas se parece com a de [PHP](/?c=langages-de-programmation&s=php&p=php), com uma diferença imediata: `self` (o equivalente de `$this`) é um parâmetro **explícito** de cada método, nunca implícito.

## Declarar uma classe

```python
class Veiculo:
    def __init__(self, marca, modelo):
        self.marca = marca   # self.xxx: equivalente de $this->xxx em PHP
        self.modelo = modelo

    def descricao(self):
        return f"{self.marca} {self.modelo}"

v = Veiculo("Peugeot", "308")
print(v.descricao())   # "Peugeot 308"
```

> **Nota:** `self` deve ser escrito explicitamente como **primeiro parâmetro** de cada método de instância: Python o preenche automaticamente com a instância atual na chamada (`v.descricao()` equivale a `Veiculo.descricao(v)`), mas omiti-lo na assinatura provoca um erro.

## Atributos de classe vs atributos de instância

```python
class Contador:
    total_criados = 0   # atributo de CLASSE: compartilhado por todas as instancias

    def __init__(self):
        Contador.total_criados += 1
        self.id = Contador.total_criados   # atributo DE INSTANCIA: proprio de cada objeto

c1 = Contador()
c2 = Contador()
print(Contador.total_criados)  # 2 -> compartilhado
print(c1.id, c2.id)            # 1 2 -> proprio de cada um
```

## A herança

```python
class Animal:
    def __init__(self, nome):
        self.nome = nome

    def falar(self):
        return "..."

class Cachorro(Animal):
    def falar(self):
        return f"{self.nome} late"

class Gato(Animal):
    def falar(self):
        return f"{self.nome} mia"

animais = [Cachorro("Rex"), Gato("Felix")]
for animal in animais:
    print(animal.falar())
```

`super()` permite chamar explicitamente o método da classe pai, por exemplo para estendê-lo em vez de substituí-lo inteiramente:

```python
class CachorroDeGuarda(Cachorro):
    def falar(self):
        return super().falar() + " ruidosamente"
```

## Os métodos especiais (*dunder methods*)

Métodos com o nome cercado por underscores duplos, chamados automaticamente pelo Python em certos contextos:

```python
class Ponto:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):           # chamado por repr(obj) e a exibicao no console/debugador
        return f"Ponto({self.x}, {self.y})"

    def __str__(self):             # chamado por print(obj) e str(obj)
        return f"({self.x}, {self.y})"

    def __eq__(self, outro):       # chamado por "=="
        return self.x == outro.x and self.y == outro.y

    def __add__(self, outro):      # chamado por "+"
        return Ponto(self.x + outro.x, self.y + outro.y)

p1 = Ponto(1, 2)
p2 = Ponto(3, 4)
print(p1 + p2)            # (4, 6) -> gracas a __add__
print(p1 == Ponto(1, 2))  # True -> gracas a __eq__
```

| Método especial | Disparado por |
|---|---|
| `__init__` | `NomeClasse(...)` (construtor) |
| `__str__` | `print(obj)`, `str(obj)` |
| `__repr__` | Exibição no console/debugador, `repr(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__len__` | `len(obj)` |
| `__getitem__` | `obj[chave]` |

## `@property`: um atributo calculado, acessado sem parênteses

```python
class Circulo:
    def __init__(self, raio):
        self.raio = raio

    @property
    def area(self):
        return 3.14159 * self.raio ** 2

c = Circulo(5)
print(c.area)   # 78.53975 -> acessado como um atributo, NAO como c.area()
```

`@property` transforma um método em atributo de leitura, recalculado a cada acesso, útil para expor um valor derivado sem exigir que o chamador saiba que é na verdade um cálculo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Em Python, tudo é objeto. `self` é um parâmetro explícito de cada método. Os métodos especiais (`__init__`, `__str__`, `__eq__`...) definem como um objeto reage a operações nativas (`+`, `==`, `print`...). |
| **Ferramentas utilizáveis** | `super()` para chamar o método pai, `@property` para um atributo calculado, atributos de classe vs de instância. |
| **Armadilhas a evitar** | Esquecer `self` como primeiro parâmetro de um método de instância: provoca um erro na chamada. |
| **Boas práticas** | Definir `__repr__` em toda classe destinada a ser exibida em depuração, para uma representação legível em vez do endereço de memória padrão. |
