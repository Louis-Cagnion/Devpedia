---
order: 15
---

# Manipular arquivos e pastas com `pathlib`

[O tratamento de erros](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) já abre um arquivo com `open("dados.txt")`, um simples caminho escrito como string. O módulo padrão **`pathlib`** representa um caminho como um objeto de verdade, manipulável e portável entre sistemas operacionais, sem nunca concatenar strings manualmente.

## `pathlib.Path`: representar um caminho como um objeto

```python
from pathlib import Path

pasta = Path("relatorios") / "2026" / "agosto.txt"  # "/" constroi o caminho, PORTAVEL (\ no Windows, / no resto)
print(pasta)                                        # relatorios/2026/agosto.txt

pasta.exists()   # True/False -> o arquivo/pasta existe mesmo no disco?
pasta.is_file()  # True/False
pasta.is_dir()   # True/False
```

> **Nota:** o operador `/` está sobrecarregado aqui (veja [Métodos refletidos](/?c=langages-de-programmation&s=python&p=poo)): `Path.__truediv__` constrói um NOVO caminho adicionando um segmento, sem nunca tocar no caminho de origem.

> **Equivalência:** um objeto `Path` também expõe `.open()` como MÉTODO, estritamente equivalente à função nativa `open()` (mesmos argumentos: modo, `encoding`...): `pasta.open("a", encoding="utf-8")` evita voltar a passar por `open(str(pasta), "a", encoding="utf-8")` uma vez que já se tem um `Path` em mãos.

## Criar uma pasta: `.mkdir()`

```python
pasta = Path("relatorios") / "2026"

pasta.mkdir()                              # FileNotFoundError se "relatorios" ainda não existir (o pai)
pasta.mkdir(parents=True)                  # cria também os pais que faltarem -> não há mais FileNotFoundError
pasta.mkdir(exist_ok=True)                 # FileExistsError se a pasta já existir (sem parents=True)
pasta.mkdir(parents=True, exist_ok=True)   # os dois combinados: NUNCA reclama, cria o que faltar
```

`parents=True, exist_ok=True` é o padrão idiomático "criar a pasta se precisar": substitui um `if not pasta.exists(): pasta.mkdir()` explícito por uma única linha que nunca quebra, exista a pasta ou não. Uso comum: criar a pasta pai de um arquivo logo antes de abri-lo para escrita.

```python
caminho_arquivo = Path("relatorios") / "2026" / "agosto.txt"

caminho_arquivo.parent.mkdir(parents=True, exist_ok=True)   # cria "relatorios/2026" antes de escrever o arquivo
with caminho_arquivo.open("w", encoding="utf-8") as f:
    f.write("concluído")
```

> **Armadilha:** esquecer `exist_ok=True` faz um script relançado uma segunda vez falhar sobre uma pasta já criada na primeira passagem (`FileExistsError`), um caso frequente para uma pasta de saída recriada a cada execução.

## Decompor um caminho: `.name`, `.stem`, `.suffix`

```python
relatorio = Path("relatorio.txt")

relatorio.name    # "relatorio.txt" -> nome completo do arquivo
relatorio.stem    # "relatorio"     -> nome SEM a extensão
relatorio.suffix  # ".txt"          -> a extensão, com o ponto

relatorio.with_name("rascunho.txt")                                  # Path("rascunho.txt") -> substitui o nome inteiro
relatorio.with_suffix(".csv")                                         # Path("relatorio.csv") -> substitui so a extensao
relatorio.with_name(f"{relatorio.stem}.peugeot{relatorio.suffix}")   # Path("relatorio.peugeot.txt") -> insere uma palavra no meio
```

> **Armadilha:** `.with_name()` substitui o ÚLTIMO segmento do caminho (o nome do arquivo), ao contrário de `/` que ADICIONA um novo: `Path("a/b") / "c"` dá `a/b/c`, `Path("a/b").with_name("c")` dá `a/c`.

## Remover uma pasta não vazia: `shutil.rmtree()`

```python
pasta.rmdir()  # OSError se a pasta nao estiver vazia -> pathlib se recusa deliberadamente a apagar conteudo

import shutil
shutil.rmtree(pasta)                      # remove a pasta E todo seu conteudo, recursivamente
shutil.rmtree(pasta, ignore_errors=True)  # qualquer erro (arquivo bloqueado...) e ignorado, silenciosamente
```

`shutil` («*shell utilities*», módulo padrão) fornece operações de arquivos de nível mais alto que `pathlib`. `shutil.rmtree()` equivale a `rm -rf` em [Bash](/?c=shells&s=bash&p=redirections-et-pipes) ou `Remove-Item -Recurse` em [PowerShell](/?c=shells&s=powershell&p=powershell); `shutil.copy()`/`shutil.move()` cobrem a cópia e o deslocamento.

> **Armadilha:** `ignore_errors=True` torna uma falha de remoção totalmente silenciosa: a pasta pode permanecer no lugar sem que nenhuma exceção o sinalize. Só usá-lo se quem chama verificar de novo depois (ex. `pasta.exists()`) em vez de supor que a remoção deu certo.

## Ler e escrever um arquivo CSV

```python
import csv

with open("contatos.csv", newline="", encoding="utf-8") as f:
    leitor = csv.reader(f, delimiter=",")
    for linha in leitor:
        print(linha)  # ["Joao", "Silva", "25"] -> uma simples LISTA, por posicao
```

```python
with open("contatos.csv", newline="", encoding="utf-8") as f:
    leitor = csv.DictReader(f, delimiter=",")  # usa a primeira linha como cabecalhos
    for linha in leitor:
        print(linha)             # {"nome": "Joao", "sobrenome": "Silva", "idade": "25"} -> um DICT, por nome de coluna
        print(linha["nome"])     # "Joao" -> acesso por nome, mais legivel que por indice
```

`csv.reader` retorna cada linha como uma lista posicional; `csv.DictReader` transforma cada linha em um dicionário a partir da linha de cabeçalho (veja [hasheabilidade e chaves de dict](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), mais legível e mais robusto a um reordenamento de colunas. `delimiter=";"` (comum na França) substitui a vírgula padrão. Na escrita, `csv.writer`/`csv.DictWriter` seguem a mesma lógica inversa.

> **Nota:** `newline=""` em `open()` é recomendado pela documentação do módulo `csv`: sem ele, quebras de linha no meio de um valor entre aspas podem ser mal interpretadas dependendo do sistema operacional.

## Ler e escrever JSON

Um CSV estrutura dados em tabela (linhas/colunas); o módulo padrão [`json`](https://docs.python.org/3/library/json.html) estrutura dados em árvore (dicts e listas aninhados) como texto, legível por qualquer linguagem, não só Python.

```python
import json

usuario = {"nome": "Léa", "notas": [15, 12, 18]}   # um dict Python "normal"

texto = json.dumps(usuario, ensure_ascii=False)    # '{"nome": "Léa", "notas": [15, 12, 18]}' -> texto JSON
objeto = json.loads(texto)                         # objeto Python, decodificado de volta a partir do texto (== usuario)
```

| Função | Entrada | Saída |
|---|---|---|
| `json.dumps(obj)` | objeto Python (dict, list...) | texto JSON (`str`) |
| `json.loads(texto)` | texto JSON (`str`) | objeto Python |
| `json.dump(obj, arquivo)` | objeto Python + arquivo já aberto | nada: escreve diretamente em `arquivo` |
| `json.load(arquivo)` | arquivo já aberto | objeto Python, lido diretamente |

> **Nota:** sem `ensure_ascii=False` (comportamento padrão), um caractere acentuado como «é» é escapado em uma notação Unicode `\uXXXX` ilegível no texto JSON produzido (`XXXX` sendo seu código hexadecimal). `ensure_ascii=False` o mantém como está; `json.loads()` decodifica ambas as formas de maneira idêntica.

### O formato «JSON Lines»: adicionar entradas sem reescrever todo o arquivo

Um arquivo JSON clássico contém um único objeto ou array raiz: adicionar uma entrada obriga a reler todo o arquivo, modificá-lo em memória, e depois reescrevê-lo inteiro. O formato **JSON Lines** (extensão `.jsonl`) contorna esse problema: cada LINHA do arquivo é um objeto JSON completo e independente, prático para um arquivo que cresce ao longo da execução de um programa (ex. acompanhamento do progresso de uma tarefa).

```python
with open("estados.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")   # ADICIONA uma linha, sem tocar no resto do arquivo
```

```python
with open("estados.jsonl", encoding="utf-8") as f:
    for linha in f:
        entrada = json.loads(linha)   # cada linha e decodificada independentemente das outras
        print(entrada["id"])
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `pathlib.Path` representa um caminho como um objeto manipulável (`/` para construir, `.stem`/`.suffix`/`.with_name()` para decompor, `.open()` equivalente a `open()`, `.mkdir()` para criar uma pasta). `shutil.rmtree()` remove uma pasta não vazia, o que `Path.rmdir()` recusa. `csv.DictReader` lê um CSV em dicts nomeados por cabeçalho, `csv.reader` em listas posicionais. `json.dumps`/`loads` convertem objeto Python e texto JSON nos dois sentidos; o formato JSON Lines (uma linha = um objeto) permite adicionar entradas sem reescrever todo o arquivo. |
| **Ferramentas utilizáveis** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`/`.mkdir()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`. |
| **Armadilhas a evitar** | `.with_name()` substitui o último segmento do caminho onde `/` adiciona um novo. `.mkdir()` sem `exist_ok=True` falha se a pasta já existir. `shutil.rmtree(ignore_errors=True)` torna uma falha silenciosa. Esquecer `newline=""` com `csv` pode quebrar valores multilinha entre aspas. Esquecer `ensure_ascii=False` torna ilegíveis os acentos no JSON produzido (sem quebrar `json.loads()`). |
| **Boas práticas** | Usar `pasta.mkdir(parents=True, exist_ok=True)` (ou `caminho_arquivo.parent.mkdir(...)`) em vez de um `if not pasta.exists(): ...` antes de escrever um arquivo. Verificar `pasta.exists()` após um `rmtree(ignore_errors=True)` em vez de supor o sucesso. Preferir `DictReader`/`DictWriter` a um acesso por índice assim que um CSV tiver cabeçalhos. Usar JSON Lines para um arquivo de estado que cresce durante a execução, um arquivo JSON clássico para um objeto fixo. |
