---
order: 12
---

# Módulos, pip e ambientes virtuais

Um projeto em Python raramente se limita a um único arquivo por muito tempo: este capítulo aborda como organizar o código em vários arquivos (módulos), instalar bibliotecas externas (`pip`) e isolar as dependências de um projeto para outro (ambientes virtuais).

## Importar um módulo

```python
# arquivo calculs.py
def addition(a, b):
    return a + b
```

```python
# arquivo main.py
import calculs

print(calculs.addition(2, 3))   # 5, acesso através do nome do módulo

from calculs import addition     # importa diretamente a função, sem prefixo
print(addition(2, 3))

import calculs as c               # renomeia o módulo importado
print(c.addition(2, 3))
```

## `if __name__ == "__main__":`

Cada arquivo Python possui uma variável especial`__name__`: o seu valor é `"__main__"` apenas se o arquivo for **executado diretamente** e o nome do módulo se for **importado** a partir de outro arquivo.

```python
# calculs.py
def addition(a, b):
    return a + b

if __name__ == "__main__":
    print("Test rapide :", addition(2, 3))   # Só é executado se se lançar «python calculs.py» diretamente
```

> **Nota:** esta medida de segurança permite que um arquivo funcione simultaneamente como um módulo reutilizável (importado sem executar nada inesperado) e como um script autónomo (testável diretamente), sem que estas duas utilizações interfiram entre si.

## `pip` : instalar bibliotecas externas

```bash
pip install requests           # instala uma biblioteca
pip install requests==2.31.0    # instala uma versão específica
pip uninstall requests          # desinstala
pip list                         # enumera as bibliotecas instaladas
```

## `requirements.txt` : fixar as dependências de um projeto

```
requests==2.31.0
numpy==1.26.0
```

```bash
pip freeze > requirements.txt    # Gera este arquivo a partir do ambiente atual
pip install -r requirements.txt   # reinstala exatamente as mesmas versões noutro local
```

## Os ambientes virtuais

Sem isolamento, o comando «`pip install`» instala as bibliotecas **globalmente** na máquina — dois projetos que necessitem de versões diferentes da mesma biblioteca entram, assim, em conflito. Um **ambiente virtual** cria uma instalação Python isolada, específica para um projeto:

```bash
python -m venv .venv          # cria um ambiente virtual na pasta .venv

fonte .venv/bin/activate       # ativa o ambiente (Linux/macOS)
.venv\Scripts\activate           # ativa o ambiente (Windows)

pip install requests             # Instala-se APENAS neste ambiente, não globalmente

deactivate                        # sair do ambiente virtual
```

> **Nota:** uma vez ativados, os arquivos `pip install` e `python` apontam para os executáveis **do ambiente virtual**, e não para os instalados globalmente no sistema — é isso que garante o isolamento. A pasta `.venv/` nunca deve ser controlada pelo Git (ver capítulo `.gitignore`): ela é totalmente regenerada a partir de `requirements.txt`.

## Organizar um projeto em pacotes

```
mon_projet/
├── mon_package/
│   ├── __init__.py     # rend le dossier importable comme un package
│   ├── calculs.py
│   └── utils.py
└── main.py
```

```python
from mon_package import calculs
from mon_package.utils import une_fonction
```

Basta um simples arquivo «`__init__.py`» (mesmo que esteja vazio) para transformar uma pasta num **pacote** importável, agrupando vários módulos sob um mesmo espaço de nomes.
