---
order: 15
---

# Manipular arquivos e pastas com `pathlib`

[O tratamento de erros](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) já abre um arquivo com `open("dados.txt")`, um simples caminho escrito como string. O módulo padrão **`pathlib`** representa um caminho como um objeto de verdade, manipulável e portável entre sistemas operacionais, sem nunca concatenar strings manualmente.

## `pathlib.Path`: representar um caminho como um objeto

```python
from pathlib import Path

# "/" constroi o caminho, PORTÁVEL (\ no Windows, / no resto)
pasta = Path("relatorios") / "2026" / "agosto.txt"
print(pasta)                                        # relatórios/2026/agosto.txt

pasta.exists()   # True/False -> o arquivo/pasta existe mesmo no disco?
pasta.is_file()  # True/False
pasta.is_dir()   # True/False
```

> **Nota:** o operador `/` está sobrecarregado aqui (veja [Métodos refletidos](/?c=langages-de-programmation&s=python&p=poo)): `Path.__truediv__` constrói um NOVO caminho adicionando um segmento, sem nunca tocar no caminho de origem.

> **Equivalência:** um objeto `Path` também expõe `.open()` como MÉTODO, estritamente equivalente à função nativa `open()` (mesmos argumentos: modo, `encoding`...): `pasta.open("a", encoding="utf-8")` evita voltar a passar por `open(str(pasta), "a", encoding="utf-8")` uma vez que já se tem um `Path` em mãos.

## Criar uma pasta: `.mkdir()`

```python
pasta = Path("relatorios") / "2026"

# FileNotFoundError se "relatórios" ainda não existir (o pai)
pasta.mkdir()
# cria também os pais que faltarem -> não há mais FileNotFoundError
pasta.mkdir(parents=True)
# FileExistsError se a pasta já existir (sem parents=True)
pasta.mkdir(exist_ok=True)
# os dois combinados: NUNCA reclama, cria o que faltar
pasta.mkdir(parents=True, exist_ok=True)
```

`parents=True, exist_ok=True` é o padrão idiomático "criar a pasta se precisar": substitui um `if not pasta.exists(): pasta.mkdir()` explícito por uma única linha que nunca quebra, exista a pasta ou não. Uso comum: criar a pasta pai de um arquivo logo antes de abri-lo para escrita.

```python
caminho_arquivo = Path("relatorios") / "2026" / "agosto.txt"

# cria "relatórios/2026" antes de escrever o arquivo
caminho_arquivo.parent.mkdir(parents=True, exist_ok=True)
with caminho_arquivo.open("w", encoding="utf-8") as f:
    f.write("concluído")
```

> **Armadilha:** esquecer `exist_ok=True` faz um script relançado uma segunda vez falhar sobre uma pasta já criada na primeira passagem (`FileExistsError`), um caso frequente para uma pasta de saída recriada a cada execução.

## Ler/escrever um arquivo inteiro em uma linha: `.write_text()`/`.read_text()`

```python
caminho_arquivo.write_text("concluído", encoding="utf-8")
# equivale a:
with caminho_arquivo.open("w", encoding="utf-8") as f:
    f.write("concluído")

conteudo = caminho_arquivo.read_text(encoding="utf-8")
# equivale a:
with caminho_arquivo.open(encoding="utf-8") as f:
    conteudo = f.read()
```

`write_text()`/`read_text()` abrem, escrevem (ou leem) todo o conteúdo, e fecham o arquivo em uma única chamada, sem bloco `with` explícito: prático para um arquivo inteiro processado de uma vez, não linha por linha ou em fluxo.

> **Armadilha:** usar `write_text()`/`read_text()` em um arquivo volumoso ou processado linha por linha (veja mais abaixo): esses métodos carregam todo o conteúdo na memória de uma vez, enquanto um bloco `with` clássico permite iterar sobre as linhas sem carregar tudo ao mesmo tempo.

## Decompor um caminho: `.name`, `.stem`, `.suffix`

```python
relatorio = Path("relatorio.txt")

relatorio.name    # "relatório.txt" -> nome completo do arquivo
relatorio.stem    # "relatório"     -> nome SEM a extensão
relatorio.suffix  # ".txt"          -> a extensão, com o ponto

# Path("rascunho.txt") -> substitui o nome inteiro
relatorio.with_name("rascunho.txt")
# Path("relatório.csv") -> substitui só a extensão
relatorio.with_suffix(".csv")
# Path("relatório.peugeot.txt") -> insere uma palavra no meio
relatorio.with_name(f"{relatorio.stem}.peugeot{relatorio.suffix}")
```

> **Armadilha:** `.with_name()` substitui o ÚLTIMO segmento do caminho (o nome do arquivo), ao contrário de `/` que ADICIONA um novo: `Path("a/b") / "c"` dá `a/b/c`, `Path("a/b").with_name("c")` dá `a/c`.

## Remover um arquivo: `.unlink()`

```python
caminho_arquivo.unlink()                 # FileNotFoundError se o arquivo já não existir
caminho_arquivo.unlink(missing_ok=True)  # nunca quebra, mesmo se o arquivo já estiver ausente
```

`.unlink()` remove um ARQUIVO, nunca uma pasta (veja `.rmdir()`/`shutil.rmtree()` mais abaixo para isso). `missing_ok=True` evita um `FileNotFoundError` se o arquivo já tiver sido removido: a mesma lógica "idempotente, nunca quebra se o estado desejado já foi atingido" que `exist_ok=True` em `.mkdir()`.

## Remover uma pasta não vazia: `shutil.rmtree()`

```python
# OSError se a pasta não estiver vazia -> pathlib se recusa deliberadamente a apagar conteúdo
pasta.rmdir()

import shutil
shutil.rmtree(pasta)                      # remove a pasta E todo seu conteúdo, recursivamente
# qualquer erro (arquivo bloqueado...) é ignorado, silenciosamente
shutil.rmtree(pasta, ignore_errors=True)
```

`shutil` («*shell utilities*», módulo padrão) fornece operações de arquivos de nível mais alto que `pathlib`. `shutil.rmtree()` equivale a `rm -rf` em [Bash](/?c=shells&s=bash&p=redirections-et-pipes) ou `Remove-Item -Recurse` em [PowerShell](/?c=shells&s=powershell&p=powershell); `shutil.copy()`/`shutil.move()` cobrem a cópia e o deslocamento.

> **Armadilha:** `ignore_errors=True` torna uma falha de remoção totalmente silenciosa: a pasta pode permanecer no lugar sem que nenhuma exceção o sinalize. Só usá-lo se quem chama verificar de novo depois (ex. `pasta.exists()`) em vez de supor que a remoção deu certo.

## Ler e escrever um arquivo CSV

```python
import csv

with open("contatos.csv", newline="", encoding="utf-8") as f:
    leitor = csv.reader(f, delimiter=",")
    for linha in leitor:
        print(linha)  # ["Joao", "Silva", "25"] -> uma simples LISTA, por posição
```

```python
with open("contatos.csv", newline="", encoding="utf-8") as f:
    leitor = csv.DictReader(f, delimiter=",")  # usa a primeira linha como cabecalhos
    for linha in leitor:
        # {"nome": "Joao", "sobrenome": "Silva", "idade": "25"} -> um DICT, por nome de coluna
        print(linha)
        print(linha["nome"])     # "Joao" -> acesso por nome, mais legível que por índice
```

`csv.reader` retorna cada linha como uma lista posicional; `csv.DictReader` transforma cada linha em um dicionário a partir da linha de cabeçalho (veja [hasheabilidade e chaves de dict](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), mais legível e mais robusto a um reordenamento de colunas. `delimiter=";"` (comum na França) substitui a vírgula padrão. Na escrita, `csv.writer`/`csv.DictWriter` seguem a mesma lógica inversa.

> **Nota:** `newline=""` em `open()` é recomendado pela documentação do módulo `csv`: sem ele, quebras de linha no meio de um valor entre aspas podem ser mal interpretadas dependendo do sistema operacional.

## Ler e escrever JSON

Um CSV estrutura dados em tabela (linhas/colunas); o módulo padrão [`json`](https://docs.python.org/3/library/json.html) estrutura dados em árvore (dicts e listas aninhados) como texto, legível por qualquer linguagem, não só Python.

```python
import json

usuario = {"nome": "Léa", "notas": [15, 12, 18]}   # um dict Python "normal"

# '{"nome": "Léa", "notas": [15, 12, 18]}' -> texto JSON
texto = json.dumps(usuario, ensure_ascii=False)
# objeto Python, decodificado de volta a partir do texto (== usuário)
objeto = json.loads(texto)
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
    # ADICIONA uma linha, sem tocar no resto do arquivo
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")
```

```python
with open("estados.jsonl", encoding="utf-8") as f:
    for linha in f:
        entrada = json.loads(linha)   # cada linha é decodificada independentemente das outras
        print(entrada["id"])
```

### Reler somente o que foi adicionado desde a última leitura: `.seek()`/`.tell()`

Um arquivo de log cresce enquanto outro processo o alimenta continuamente. Relê-lo inteiro em intervalos regulares só para extrair as novas linhas desperdiça tempo em um arquivo cada vez mais volumoso; guardar a posição já lida permite reler apenas o que foi escrito desde então.

```python
posicao = 0

def ler_novas_linhas(caminho):
    global posicao
    with open(caminho, encoding="utf-8") as f:
        f.seek(posicao)              # retoma de onde a leitura anterior parou
        novas_linhas = f.readlines()
        posicao = f.tell()           # memoriza a posição alcançada, para a próxima chamada
    return novas_linhas
```

`.tell()` devolve a posição atual do cursor de leitura (em bytes desde o início do arquivo); `.seek(posicao)` reposiciona o cursor ali antes de ler. Ao guardar `posicao` entre chamadas, cada passagem relê apenas os bytes escritos desde a anterior, nunca o arquivo inteiro.

> **Nota:** esse é o mecanismo por trás de `tail -f` no [Bash](/?c=shells&s=bash&p=redirections-et-pipes) ou `Get-Content -Wait` no [PowerShell](/?c=shells&s=powershell&p=powershell): esses comandos acompanham eles mesmos um arquivo que cresce relendo apenas seu conteúdo adicionado, nunca desde o início.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `pathlib.Path` representa um caminho como um objeto manipulável (`/` para construir, `.stem`/`.suffix`/`.with_name()` para decompor, `.open()` equivalente a `open()`, `.mkdir()` para criar uma pasta). `shutil.rmtree()` remove uma pasta não vazia, o que `Path.rmdir()` recusa. `csv.DictReader` lê um CSV em dicts nomeados por cabeçalho, `csv.reader` em listas posicionais. `json.dumps`/`loads` convertem objeto Python e texto JSON nos dois sentidos; o formato JSON Lines (uma linha = um objeto) permite adicionar entradas sem reescrever todo o arquivo. `.seek()`/`.tell()` permitem reler somente o que um arquivo em crescimento recebeu desde a última leitura. |
| **Ferramentas utilizáveis** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`/`.mkdir()`/`.unlink()`, `.write_text()`/`.read_text()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`, `.seek()`/`.tell()`. |
| **Armadilhas a evitar** | `.with_name()` substitui o último segmento do caminho onde `/` adiciona um novo. `.mkdir()` sem `exist_ok=True` falha se a pasta já existir. `.write_text()`/`.read_text()` em um arquivo volumoso que deveria ser processado linha por linha. `shutil.rmtree(ignore_errors=True)` torna uma falha silenciosa. Esquecer `newline=""` com `csv` pode quebrar valores multilinha entre aspas. Esquecer `ensure_ascii=False` torna ilegíveis os acentos no JSON produzido (sem quebrar `json.loads()`). Reler um arquivo de log inteiro a cada passagem em vez de guardar a posição já lida. |
| **Boas práticas** | Usar `pasta.mkdir(parents=True, exist_ok=True)` (ou `caminho_arquivo.parent.mkdir(...)`) em vez de um `if not pasta.exists(): ...` antes de escrever um arquivo. Verificar `pasta.exists()` após um `rmtree(ignore_errors=True)` em vez de supor o sucesso. Preferir `DictReader`/`DictWriter` a um acesso por índice assim que um CSV tiver cabeçalhos. Usar JSON Lines para um arquivo de estado que cresce durante a execução, um arquivo JSON clássico para um objeto fixo. Memorizar a posição (`.tell()`) após cada leitura de um arquivo em crescimento, para reposicionar ali o cursor (`.seek()`) na passagem seguinte. |
