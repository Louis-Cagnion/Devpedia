---
order: 12
---

# As dataclasses

Uma classe [comum](/?c=langages-de-programmation&s=python&p=poo) cujo papel se limita a agrupar alguns valores (um ponto, um registro, o resultado de um cálculo) mesmo assim obriga a escrever `__init__`, frequentemente `__repr__` e `__eq__`, na mão, para um resultado puramente mecânico: copiar cada parâmetro para `self`, exibir os valores, comparar campo por campo. O decorador `@dataclass` (módulo `dataclasses`, nativo desde o Python 3.7) gera esse código automaticamente a partir das [anotações de tipo](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) dos campos.

## Antes/depois: o mesmo `Point` do capítulo de POO

```python
# Versao classica (veja A programacao orientada a objetos)
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

    def __eq__(self, outro):
        return self.x == outro.x and self.y == outro.y
```

```python
# Versao dataclass: equivalente, sem escrever __init__/__repr__/__eq__ na mao
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p1 = Point(1, 2)
p2 = Point(1, 2)

print(p1)        # Point(x=1, y=2)  -> __repr__ gerado automaticamente
print(p1 == p2)  # True             -> __eq__ gerado automaticamente, comparacao campo a campo
```

Cada linha `x: int` declara ao mesmo tempo um campo **e** seu tipo: `@dataclass` lê essas anotações para construir `__init__(self, x, y)` automaticamente, na ordem em que os campos são declarados.

| Gerado automaticamente | Papel |
|---|---|
| `__init__` | Um parâmetro por campo declarado, na ordem |
| `__repr__` | Exibição legível: `NomeClasse(campo1=valor1, campo2=valor2...)` |
| `__eq__` | Compara duas instâncias campo por campo |

> **Nota:** `@dataclass` **não** gera `__lt__`/`__gt__` (comparação de ordem, para ordenar instâncias) por padrão: adicione `@dataclass(order=True)` se as instâncias precisarem ser ordenáveis entre si (a ordem de comparação então segue a dos campos, da esquerda para a direita).

## `frozen=True`: instâncias imutáveis

Um caso de uso muito comum: representar o resultado congelado de um cálculo ou de uma extração (um registro lido de um arquivo, uma linha de resultado), que não tem nenhuma razão de mudar depois de criado. `frozen=True` proíbe qualquer modificação depois da construção:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class BlocoTexto:
    pagina: int
    texto: str

bloco = BlocoTexto(pagina=1, texto="Ola")
bloco.texto = "Modificado"   # FrozenInstanceError : impossivel modificar um campo apos a criacao
```

Uma dataclass `frozen=True` também se torna **hashável** (utilizável como chave de `dict` ou elemento de um `set`) assim que todos os seus campos também o são, ao contrário de uma dataclass comum (mutável, portanto não hashável por padrão): uma consequência direta do mesmo princípio de que uma [tupla é hashável mas uma lista não é](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles).

> **Armadilha:** `frozen=True` protege os próprios campos contra uma reatribuição, mas não o **conteúdo** de um campo mutável. Um campo `frozen` que contém uma lista continua sendo uma lista comum: sua referência não pode mudar, mas seu conteúdo, sim.

```python
@dataclass(frozen=True)
class Grupo:
    membros: list

g = Grupo(membros=["Alice"])
g.membros = ["Bob"]      # FrozenInstanceError : o proprio campo esta protegido
g.membros.append("Bob")  # funciona sem erro : a LISTA, essa, continua mutavel
```

> **Boa prática:** para uma imutabilidade realmente completa, use tipos eles mesmos imutáveis para os campos (uma [tupla](/?c=langages-de-programmation&s=python&p=listes-et-tuples) em vez de uma lista), não apenas `frozen=True` na classe envolvente.

## Valores padrão: `field(default_factory=...)`

Uma dataclass continua sujeita à mesma [armadilha dos valores padrão mutáveis](/?c=langages-de-programmation&s=python&p=fonctions) que uma função comum: `@dataclass` a detecta já na definição da classe e se recusa a iniciar em vez de deixar um bug silencioso se instalar:

```python
from dataclasses import dataclass, field

@dataclass
class Carrinho:
    itens: list = []   # ValueError lancada na definicao da classe : lista mutavel proibida como padrao direto

@dataclass
class Carrinho:
    itens: list = field(default_factory=list)   # correto : uma NOVA lista a cada instancia

c1 = Carrinho()
c2 = Carrinho()
c1.itens.append("maca")
print(c2.itens)   # [] -> bem independente de c1, ao contrario da armadilha das funcoes
```

`field(default_factory=funcao)` chama `funcao()` (aqui `list`, portanto `list()`) a cada nova instância em vez de uma única vez na definição da classe: é isso que evita o compartilhamento involuntário.

## Quando uma dataclass basta, quando uma classe clássica se impõe

| | Dataclass | Classe clássica |
|---|---|---|
| Papel principal | Agrupar dados, com pouca ou nenhuma lógica própria | Encapsular um comportamento rico, invariantes a fazer respeitar |
| `__init__`/`__repr__`/`__eq__` | Gerados automaticamente | Escritos na mão (ou explicitamente personalizados) |
| Adicionar um método | Sempre possível, uma dataclass continua sendo uma classe comum | Caso de uso normal |

Uma dataclass continua sendo uma classe Python completa: nada impede de adicionar métodos, `@property`, ou fazê-la herdar de outra classe, exatamente como para uma classe declarada de forma clássica.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `@dataclass` gera `__init__`/`__repr__`/`__eq__` a partir dos campos anotados de uma classe, evitando esse código repetitivo para uma classe que só agrupa dados. `frozen=True` torna as instâncias imutáveis (e hasháveis). |
| **Ferramentas utilizáveis** | `@dataclass`, `@dataclass(frozen=True)`, `@dataclass(order=True)` para ordenação, `field(default_factory=...)` para um valor padrão mutável. |
| **Armadilhas a evitar** | Achar que `frozen=True` também protege o conteúdo de um campo mutável (uma lista continua modificável). Dar diretamente uma lista/dict como valor padrão de um campo. |
| **Boas práticas** | Usar um tipo ele mesmo imutável (tupla) para um congelamento realmente completo. Sempre passar por `field(default_factory=...)` para um valor padrão mutável. Reservar a dataclass para classes majoritariamente portadoras de dados. |
