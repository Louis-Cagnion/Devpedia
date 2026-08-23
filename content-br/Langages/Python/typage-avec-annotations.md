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

def processar_notas(notas: List[int]) -> float:      # lista de inteiros
    return sum(notas) / len(notas)

def config() -> Dict[str, Union[str, int]]:           # dict cujos valores sao str OU int
    return {"nome": "app", "versao": 2}
```

> **Nota:** desde o Python 3.9+, `list[int]`/`dict[str, int]` (os tipos nativos diretamente, em minúsculas) substituem `List[int]`/`Dict[str, int]` do módulo `typing` para esses casos simples; `typing` continua necessário para construções como `Optional`/`Union`.

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
| **Ferramentas utilizáveis** | O módulo `typing` (`Optional`, `Union`, `List`...), `mypy` para uma verificação externa. |
| **Armadilhas a evitar** | Acreditar que uma anotação realmente impede passar um valor do tipo errado: nada a impede na execução. |
| **Boas práticas** | Anotar sistematicamente um projeto de porte significativo, e rodar `mypy` como complemento para detectar incoerências antes da execução. |
