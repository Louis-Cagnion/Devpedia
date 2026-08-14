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

> **Nota:** uma vez ativado, `pip install` e `python` apontam para os executáveis **do ambiente virtual**, não os instalados globalmente no sistema: é isso que garante o isolamento. A pasta `.venv/` nunca deve ser versionada com Git (veja [O arquivo .gitignore](/?c=git&p=gitignore)): ela se regenera inteiramente a partir de `requirements.txt`.

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

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `import` carrega um módulo; `if __name__ == "__main__":` distingue execução direta e importação. `pip` instala bibliotecas, um ambiente virtual isola as dependências de um projeto. |
| **Ferramentas utilizáveis** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` para um pacote. |
| **Armadilhas a evitar** | Instalar bibliotecas globalmente em vez de em um ambiente virtual: conflitos de versão entre projetos. |
| **Boas práticas** | Sempre trabalhar em um ambiente virtual por projeto; versionar `requirements.txt`, nunca `.venv/`. |
