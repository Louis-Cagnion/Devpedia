---
order: 13
---

# Módulos, pip e ambientes virtuais

Um projeto Python raramente permanece um único arquivo por muito tempo: este capítulo cobre como organizar código em vários arquivos (módulos), instalar bibliotecas externas (`pip`), e isolar as dependências de um projeto para outro (ambientes virtuais).

## Importar um módulo

```python
# arquivo calculos.py
def adicao(a, b):
    return a + b
```

```python
# arquivo main.py
import calculos

print(calculos.adicao(2, 3))   # 5, acesso via o nome do modulo

from calculos import adicao     # importa diretamente a funcao, sem prefixo
print(adicao(2, 3))

import calculos as c             # renomeia o modulo importado
print(c.adicao(2, 3))
```

## `if __name__ == "__main__":`

Cada arquivo Python possui uma variável especial `__name__`: ela vale `"__main__"` apenas se o arquivo for **executado diretamente**, e o nome do módulo se for **importado** de outro arquivo.

```python
# calculos.py
def adicao(a, b):
    return a + b

if __name__ == "__main__":
    print("Teste rapido:", adicao(2, 3))   # so executa SE lancarmos "python calculos.py" diretamente
```

> **Nota:** essa proteção permite que um arquivo sirva tanto como módulo reutilizável (importado sem executar nada inesperado) quanto como script autônomo (testável diretamente), sem que esses dois usos interfiram entre si.

## `pip`: instalar bibliotecas externas

```bash
pip install requests          # instala uma biblioteca
pip install requests==2.31.0  # instala uma versao precisa
pip uninstall requests        # desinstala
pip list                      # lista as bibliotecas instaladas
```

## `requirements.txt`: fixar as dependências de um projeto

```text
requests==2.31.0
numpy==1.26.0
```

```bash
pip freeze > requirements.txt    # gera esse arquivo a partir do ambiente atual
pip install -r requirements.txt  # reinstala exatamente as mesmas versoes em outro lugar
```

## Os ambientes virtuais

Sem isolamento, `pip install` instala as bibliotecas **globalmente** na máquina: dois projetos que precisam de versões diferentes de uma mesma biblioteca entram então em conflito. Um **ambiente virtual** cria uma instalação Python isolada, própria de um projeto:

```bash
python -m venv .venv          # cria um ambiente virtual na pasta .venv

source .venv/bin/activate  # ativa o ambiente (Linux/macOS)
.venv\Scripts\activate     # ativa o ambiente (Windows)

pip install requests             # instala APENAS nesse ambiente, nao globalmente

deactivate                        # sai do ambiente virtual
```

> **Nota:** uma vez ativado, `pip install` e `python` apontam para os executáveis **do ambiente virtual**, não os instalados globalmente no sistema: é isso que garante o isolamento. A pasta `.venv/` nunca deve ser versionada com [Git](/?c=git&p=git) (veja [O arquivo .gitignore](/?c=git&p=gitignore)): ela se regenera inteiramente a partir de `requirements.txt`.

## Organizar um projeto em pacote

```text
meu_projeto/
├── meu_pacote/
│   ├── __init__.py     # torna a pasta importavel como um pacote
│   ├── calculos.py
│   └── utils.py
└── main.py
```

```python
from meu_pacote import calculos
from meu_pacote.utils import uma_funcao
```

Um simples arquivo `__init__.py` (mesmo vazio) basta para tornar uma pasta um **pacote** importável, reunindo vários módulos sob um mesmo namespace.

> **Nota:** desde o Python 3.3, `__init__.py` não é mais obrigatório para que uma pasta seja importável: sem ele, o Python a trata como um **namespace package** ([PEP 420](https://peps.python.org/pep-0420/)). A diferença é visível na prática: em um pacote clássico (com `__init__.py`), `meu_pacote.__file__` aponta para esse arquivo; em um namespace package, `__file__` vale `None` e `__path__` se torna um objeto especial em vez de uma simples lista. Uma pasta sem `__init__.py` continua, portanto, importável, mas não se comporta exatamente como um pacote clássico para todo o código que inspeciona esses atributos.

## `pyproject.toml`: o packaging moderno

`requirements.txt` fixa versões, mas não descreve o projeto em si (seu nome, como instalá-lo, seus metadados): `pyproject.toml` centraliza essa descrição em um formato padrão, reconhecido pelas ferramentas de packaging modernas (`setuptools`, `poetry`...):

```toml
[project]
name = "meu-projeto"
version = "0.1.0"
dependencies = ["requests==2.31.0"]

[tool.setuptools.packages.find]
where = ["."]
```

`[tool.setuptools.packages.find]` detecta automaticamente os pacotes clássicos (com `__init__.py`); um projeto que se apoia em namespace packages deve usar `find_namespace_packages` no lugar, caso contrário as pastas sem `__init__.py` são silenciosamente ignoradas na instalação.

```bash
pip install -e .   # instalacao "editable"
```

A instalação **editável** (`pip install -e .`) instala o projeto sem copiar seus arquivos para o ambiente virtual: em vez disso, ela cria um arquivo `.pth` que aponta para a pasta de origem. Modificar o código-fonte tem efeito imediato, sem reinstalação, o que torna esse comando indispensável no desenvolvimento ativo de uma biblioteca.

## O Python "portátil" (*embeddable*) e o arquivo `._pth`

Uma instalação Python clássica adiciona automaticamente a pasta do script lançado a `sys.path` (a lista de pastas onde `import` procura um módulo). O **Python embarcado** (distribuição ZIP mínima do [python.org](https://docs.python.org/3/using/windows.html#the-embeddable-package), sem exigir direitos de administrador, usada por exemplo para entregar uma ferramenta sem depender de uma instalação do sistema) funciona de forma diferente:

```text
python-3.12.0-embed-amd64/
├── python.exe
├── python312.zip     # a biblioteca padrão, comprimida
├── python312._pth    # a lista CONGELADA das pastas de sys.path
└── meu_script.py
```

```text
# python312._pth
python312.zip
.
#import site          # comentado: site-packages desativado, instalação mais leve
```

O arquivo `._pth` **congela** inteiramente o `sys.path` nessa lista: ao contrário de uma instalação clássica, a pasta do script lançado NÃO é adicionada automaticamente.

```python
# meu_script.py, situado na mesma pasta
import sys
sys.path.insert(0, ".")  # sem isso, um pacote vizinho nao listado no ._pth fica inencontravel

import meu_pacote
```

> **Armadilha:** um projeto que roda sem problema com uma instalação Python clássica pode falhar com `ModuleNotFoundError` uma vez implantado em um Python embarcado, por falta desse `sys.path.insert(0, ...)` manual antes de importar qualquer pacote vizinho.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `import` carrega um módulo; `if __name__ == "__main__":` distingue execução direta e importação. `pip` instala bibliotecas, um ambiente virtual isola as dependências de um projeto. `pyproject.toml` descreve o projeto em si, além das versões fixadas apenas por `requirements.txt`. |
| **Ferramentas utilizáveis** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` para um pacote clássico, `pyproject.toml` e `pip install -e .` para o packaging moderno. |
| **Armadilhas a evitar** | Instalar bibliotecas globalmente em vez de em um ambiente virtual: conflitos de versão entre projetos. Esquecer `find_namespace_packages` para um projeto sem `__init__.py`, o que faz as pastas serem ignoradas silenciosamente na instalação. |
| **Boas práticas** | Sempre trabalhar em um ambiente virtual por projeto; versionar `requirements.txt`, nunca `.venv/`. Usar `pip install -e .` no desenvolvimento ativo de uma biblioteca. |
