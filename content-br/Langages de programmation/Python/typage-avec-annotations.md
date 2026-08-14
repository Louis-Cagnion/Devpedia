---
order: 11
---

# Tipagem com anotações

O Python continua a ser **dinamicamente tipado,** mesmo com anotações de tipo: ao contrário do PHP (ver capítulo sobre funções tipadas em PHP), onde um tipo declarado é verificado e aplicado **na execução**, as anotações em Python são apenas indicações **opcionais**, nunca verificadas pelo próprio interpretador.

## Anotar variáveis e funções

```python
idade: int = 25
nome: str = "Jean"

def addition(a: int, b: int) -> int:
    return a + b

addition("deux", "trois")   # NENHUM erro no arranque: o Python executa na mesma, sem verificar os tipos
```

> **Nota:** ao contrário do PHP, onde `function f(int $x): int` gera uma exceção `TypeError` se for passado algo que não seja um inteiro, as anotações em Python são pura documentação para um ser humano (ou uma ferramenta externa) — o interpretador não as faz valer em momento algum.

## Tipos compostos com o módulo «`typing`»

```python
from typing import Optional, List, Dict, Union

def trouver_utilisateur(id: int) -> Optional[dict]:   # dict OU None
    if id <= 0:
        return None
    return {"id": id, "nom": "Dupont"}

def traiter_notes(notes: List[int]) -> float:          # lista de números inteiros
    return sum(notes) / len(notes)

def config() -> Dict[str, Union[str, int]]:            # dict cujos valores são str OU int
    return {"nom": "app", "version": 2}
```

> **Nota:** a partir do Python 3.9+, `list[int]` / `dict[str, int]` (os tipos nativos diretamente, em minúsculas) substituem `List[int]` / `Dict[str, int]` do módulo `typing` para estes casos simples — `typing` continua a ser necessário para construções como `Optional` / `Union`.

## `mypy` : garantir que as anotações sejam respeitadas em qualquer circunstância

Uma vez que o Python nunca aplica as suas próprias anotações, uma ferramenta externa como o `mypy` analisa o código **antes** da execução e sinaliza as inconsistências de tipo, tal como um compilador faria numa linguagem de tipagem estática:

```bash
pip install mypy
mypy mon_script.py
# mon_script.py:5: erro: O argumento 1 da função «addition» tem o tipo «str», incompatível; esperava-se «int»
```

## Por que razão, mesmo assim, fazer anotações?

- Documentação diretamente legível no código, sem depender de comentários atualizados manualmente.
- Melhor autocompletar e deteção de erros no editor (VS Code, PyCharm...), antes mesmo de iniciar `mypy` ou o programa.
- Base indispensável para projetos Python de grande dimensão, em que a ausência de verificação de tipos pode tornar as refactorações arriscadas sem este apoio.
