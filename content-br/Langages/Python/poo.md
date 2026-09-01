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

## Ler um atributo pelo seu nome: `getattr()`

```python
u = Veiculo("Peugeot", "308")

u.marca                            # "Peugeot" -> o nome do atributo deve ser conhecido ao escrever o codigo
getattr(u, "marca")                # "Peugeot" -> o mesmo, mas o nome vem de uma STRING, resolvida em execucao
getattr(u, "cor", None)            # None      -> valor de reserva se o atributo nao existir (como dict.get())
```

`getattr(objeto, nome, padrao)` permite aplicar o mesmo tratamento a uma LISTA de nomes de atributos, calculada em tempo de execução (ex.: uma variável de loop), sem escrever um `if`/`elif` por atributo:

```python
for campo in ["marca", "modelo"]:
    print(f"{campo}: {getattr(u, campo)}")
```

`setattr(objeto, nome, valor)` (escreve um atributo pelo seu nome) e `hasattr(objeto, nome)` (testa sua existência, `True`/`False`) seguem o mesmo princípio.

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

### Métodos refletidos (`__radd__`...) e `NotImplemented`

```python
class Distancia:
    def __init__(self, metros):
        self.metros = metros

    def __add__(self, outro):     # chamado quando Distancia e o operando ESQUERDO: d + 5
        if isinstance(outro, (int, float)):
            return Distancia(self.metros + outro)
        return NotImplemented     # "nao sei tratar esse tipo" -> Python tenta outro metodo

    def __radd__(self, outro):    # chamado quando Distancia e o operando DIREITO: 5 + d
        return self.__add__(outro)

d = Distancia(100)
d + 5  # Distancia(105) -> via __add__
5 + d  # Distancia(105) -> via __radd__, porque int.__add__(5, d) falha e retorna NotImplemented
```

Quando `esquerda + direita` é avaliado, Python primeiro tenta `esquerda.__add__(direita)`. Se esse método não existir ou retornar **`NotImplemented`** (um valor especial, que não deve ser confundido com a exceção `NotImplementedError`), Python então tenta o método **refletido** do objeto da direita: `direita.__radd__(esquerda)`. Cada método especial tem seu equivalente refletido (`__radd__`, `__rsub__`, `__rtruediv__`...): é esse mecanismo que permite por exemplo a `pathlib.Path` (veja [Manipular arquivos e pastas](/?c=langages-de-programmation&s=python&p=manipuler-des-fichiers-et-dossiers)) definir `__rtruediv__`, para que `"pasta" / caminho` funcione mesmo com uma simples string à esquerda.

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
