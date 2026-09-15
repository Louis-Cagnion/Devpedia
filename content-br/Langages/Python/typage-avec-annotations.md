---
order: 11
---

# A tipagem com anotações

Python continua **dinamicamente tipado** mesmo com anotações de tipo: ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=php) (veja [As funções e métodos mais úteis](/?c=langages-de-programmation&s=php&p=methodes)), onde um tipo declarado é verificado e aplicado **na execução**, as anotações Python são apenas indicações **opcionais**, nunca verificadas pelo próprio interpretador.

## Anotar variáveis e funções

```python
idade: int = 25
nome: str = "Joao"

def adicao(a: int, b: int) -> int:
    return a + b

adicao("dois", "tres")   # NENHUM erro ao executar: Python executa mesmo assim, sem verificar os tipos
```

> **Nota:** ao contrário de PHP onde `function f(int $x): int` lança um `TypeError` se passarmos algo diferente de um inteiro, as anotações Python são pura documentação para um humano (ou uma ferramenta externa): o interpretador nunca as faz cumprir.

## Tipos compostos com o módulo `typing`

```python
from typing import Optional, List, Dict, Union

def encontrar_usuario(id: int) -> Optional[dict]:   # dict OU None
    if id <= 0:
        return None
    return {"id": id, "nome": "Silva"}

def processar_notas(notas: List[int]) -> float:     # lista de inteiros
    return sum(notas) / len(notas)

def config() -> Dict[str, Union[str, int]]:         # dict cujos valores sao str OU int
    return {"nome": "app", "versao": 2}
```

> **Nota:** desde o Python 3.9+, `list[int]`/`dict[str, int]` (os tipos nativos diretamente, em minúsculas) substituem `List[int]`/`Dict[str, int]` do módulo `typing` para esses casos simples; `typing` continua necessário para construções como `Optional`/`Union`.

## Sintaxe moderna `X | None` (Python 3.10+)

Desde o Python 3.10 ([PEP 604](https://peps.python.org/pep-0604/)), o operador `|` entre dois tipos substitui `Optional`/`Union` do módulo `typing`, diretamente nos próprios tipos, sem import adicional:

```python
def encontrar_usuario(id: int) -> dict | None:   # substitui Optional[dict]
    if id <= 0:
        return None
    return {"id": id, "nome": "Silva"}

def config() -> dict[str, str | int]:            # substitui Dict[str, Union[str, int]]
    return {"nome": "app", "versao": 2}
```

| Sintaxe antiga (`typing`) | Sintaxe moderna (3.10+) |
|---|---|
| `Optional[dict]` | `dict \| None` |
| `Union[str, int]` | `str \| int` |
| `Optional[Union[str, int]]` | `str \| int \| None` |

> **Nota:** essa sintaxe não substitui todo o `typing`: construções como `Callable`, `TypeVar` ou `Generic` continuam necessárias. Ela cobre apenas os casos antes tratados por `Optional`/`Union`.

## Forward reference e `TYPE_CHECKING`

Uma **forward reference** é uma anotação de tipo escrita entre aspas, que referencia um tipo ainda nao definido nesse ponto do arquivo (uma classe que se referencia a si mesma, ou um import que criaria um ciclo):

```python
class No:
    def __init__(self, valor: int, proximo: "No | None" = None):
        self.valor = valor
        self.proximo = proximo   # "No" ainda nao existe enquanto sua propria definicao nao termina
```

> **Armadilha:** sem as aspas (`proximo: No | None`), Python lança uma `NameError` imediata ao ler o arquivo: as anotações de uma função são avaliadas assim que ela é definida, não apenas lidas por uma ferramenta externa como `mypy`. As aspas a transformam em texto simples, resolvido somente quando uma ferramenta precisa dele.

O bloco `if TYPE_CHECKING:` atende a mesma necessidade entre dois arquivos: importar um tipo apenas para a anotação, sem causar um import circular ao iniciar o programa:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:   # nunca verdadeiro na execucao: lido apenas por mypy e editores
    from outro_modulo import OutraClasse

def processar(objeto: "OutraClasse") -> None:
    ...
```

| | `import` normal | `if TYPE_CHECKING:` |
|---|---|---|
| Executado ao iniciar o programa | Sim | Não |
| Lido por `mypy` / o editor | Sim | Sim |
| Risco de import circular | Sim, se os dois arquivos se importam mutuamente | Não |

## `mypy`: fazer respeitar as anotações apesar de tudo

Já que Python nunca aplica suas próprias anotações, uma ferramenta externa como `mypy` analisa o código **antes** da execução e sinaliza as incoerências de tipo, um pouco como um compilador faria para uma linguagem estaticamente tipada:

```bash
pip install mypy
mypy meu_script.py
# meu_script.py:5: error: Argument 1 to "adicao" has incompatible type "str"; expected "int"
```

## Por que anotar apesar de tudo

- Documentação diretamente legível no código, sem depender de comentários mantidos manualmente atualizados.
- Melhor autocompletar e detecção de erros no editor ([VS Code](https://code.visualstudio.com), [PyCharm](https://www.jetbrains.com/pycharm/)...), mesmo antes de rodar `mypy` ou o programa.
- Base indispensável para projetos Python de grande porte, onde a ausência de verificação de tipo pode tornar as refatorações arriscadas sem essa ajuda.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As anotações de tipo Python (`x: int`, `-> str`) são puramente documentais: nunca verificadas pelo interpretador, ao contrário de uma linguagem de tipagem estática ou até mesmo do PHP. |
| **Ferramentas utilizáveis** | O módulo `typing` (`Optional`, `Union`, `List`, `TYPE_CHECKING`...), a sintaxe `X \| None` (3.10+), `mypy` para uma verificação externa. |
| **Armadilhas a evitar** | Acreditar que uma anotação realmente impede passar um valor do tipo errado: nada a impede na execução. Esquecer as aspas de uma forward reference (`NameError` imediata). |
| **Boas práticas** | Anotar sistematicamente um projeto de porte significativo, e rodar `mypy` como complemento para detectar incoerências antes da execução. Usar `if TYPE_CHECKING:` para evitar um import circular causado por uma única anotação de tipo. |
