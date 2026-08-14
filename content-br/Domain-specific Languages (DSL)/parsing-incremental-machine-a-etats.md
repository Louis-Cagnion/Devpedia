---
order: 3
---

# Parsing incremental por máquina de estados

[A regex](/?c=domain-specific-languages-dsl&p=regex) encontra padrões em texto, mas continua cega a uma **estrutura aninhada** (uma tag aberta em algum lugar, fechada bem mais adiante, com outras tags entre as duas): não é para isso que ela foi feita. A solução mais conhecida para um formato marcado como [HTML](/?c=langages-de-balisage&s=html&p=html) (ou seu primo mais genérico [**XML**](https://www.w3.org/XML/), *Extensible Markup Language*, que segue as mesmas regras de tags aninhadas mas sem vocabulário de tags predefinido) é construir uma **árvore** completa em memória, o [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements), e depois percorrê-la. Existe um terceiro caminho, mais leve: o **parsing incremental**, que processa o texto conforme chega, um evento por vez, sem nunca construir uma estrutura completa.

## Três formas de ler um formato marcado

| | Regex | Árvore (DOM) | Parsing incremental |
|---|---|---|---|
| Princípio | Buscar um padrão de texto | Construir toda a estrutura em memória, e depois percorrê-la | Receber um evento por tag encontrada (abertura, texto, fechamento), conforme a leitura avança |
| Memória usada | Mínima | Proporcional ao tamanho do documento inteiro | Mínima: nada é armazenado além do que o código escolhe guardar |
| Entende o aninhamento? | Não | Sim, nativamente (é uma árvore) | Não nativamente: cabe ao código chamador reconstruí-lo ele mesmo |
| Adequado para | Uma busca/substituição pontual | Um documento que cabe confortavelmente em memória, a consultar em vários sentidos | Um documento muito grande, ou uma estrutura simples que não vale a pena carregar por inteiro |

Um parser incremental nunca conhece "o documento inteiro": ele só sabe o que acontece **agora**, mais o que o código escolheu explicitamente memorizar desde o início. É essa restrição que lhe dá o nome de **máquina de estados**: o programa precisa manter ele mesmo um estado ("estou atualmente dentro de uma linha de tabela? de uma célula?"), atualizado a cada evento recebido.

## `HTMLParser`: um exemplo concreto em Python

O módulo padrão `html.parser` fornece `HTMLParser`, uma classe para herdar: três métodos, chamados automaticamente a cada tag ou fragmento de texto encontrado durante a leitura.

```python
from html.parser import HTMLParser

class MeuParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        print(f"Abertura: <{tag}> com atributos {attrs}")

    def handle_endtag(self, tag):
        print(f"Fechamento: </{tag}>")

    def handle_data(self, data):
        if data.strip():
            print(f"Texto: {data.strip()!r}")

parser = MeuParser()
parser.feed("<p>Ola <b>mundo</b></p>")
```

```text
Abertura: <p> com atributos []
Texto: 'Ola'
Abertura: <b> com atributos [('class', None)]
Texto: 'mundo'
Fechamento: </b>
Fechamento: </p>
```

`feed()` pode ser chamado várias vezes com pedaços sucessivos do documento (útil para um fluxo recebido aos poucos, por exemplo pela rede): o parser não precisa conhecer nada antecipadamente do que vem a seguir.

> **Nota:** `HTMLParser` não verifica **nenhuma** coerência de estrutura. Um `</p>` sem `<p>` correspondente, ou uma tag nunca fechada, não provoca nenhum erro: cada `handle_*` é simplesmente chamado quando a tag correspondente é encontrada, sem julgamento sobre a validade do documento. Cabe ao código chamador decidir o que fazer com um evento inesperado.

## Reconstruir uma estrutura: manter o estado por conta própria

`HTMLParser` transmite eventos, mas nunca devolve "a linha de uma tabela" ou "a célula atual": essas noções só existem construindo variáveis de instância atualizadas a cada evento, exatamente como faz um projeto real que reconstrói uma tabela HTML (`<table>`/`<tr>`/`<td>`) em uma grade de células:

```python
class ParserTabela(HTMLParser):
    def __init__(self):
        super().__init__()
        self.linhas = []             # todas as linhas completas, uma vez fechadas
        self._linha_atual = None     # None = "nao esta atualmente dentro de um <tr>"
        self._celula_atual = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._linha_atual = []
        elif tag in ("td", "th"):
            self._celula_atual = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._celula_atual is not None:
            texto = "".join(self._celula_atual).strip()
            self._linha_atual.append(texto)
            self._celula_atual = None
        elif tag == "tr" and self._linha_atual is not None:
            self.linhas.append(self._linha_atual)
            self._linha_atual = None

    def handle_data(self, data):
        if self._celula_atual is not None:
            self._celula_atual.append(data)
```

- `self._linha_atual` e `self._celula_atual` são o **estado** dessa máquina de estados: seu valor (`None` ou uma lista em preenchimento) determina como interpretar o próximo evento recebido.
- `handle_data` pode ser chamado **várias vezes** para um mesmo texto (o módulo HTML subjacente às vezes divide o texto em vários fragmentos, por exemplo ao redor de uma entidade como `&amp;`): é por isso que `_celula_atual` acumula em uma **lista** (`.append`), em vez de sobrescrever uma simples variável a cada chamada.

> **Armadilha:** sobrescrever o estado acumulado em vez de estendê-lo (`self._celula_atual = data` em vez de `self._celula_atual.append(data)`). Se o texto de uma célula chega em vários fragmentos, só o último fragmento sobreviveria, sem erro visível: apenas uma célula truncada no resultado final.
>
> **Boa prática:** sempre acumular (`append`/concatenação) o texto recebido por `handle_data`, nunca substituí-lo, enquanto a tag de fechamento correspondente não for alcançada.

## O caso difícil: as fusões (`rowspan`) que atravessam várias linhas

Reconstruir a posição exata (linha, coluna) de cada célula se torna bem mais delicado assim que uma célula tem um `rowspan`: ela "ocupa" sua coluna nas linhas **seguintes**, que ainda não foram lidas no momento em que essa informação é conhecida.

```text
Eventos recebidos em ordem:               Grade reconstruida:
<tr><td rowspan="2">A</td><td>B</td></tr>   Linha 0: [A (col 0), B (col 1)]
<tr><td>C</td></tr>                          Linha 1: [A ainda ocupa col 0, C (col 1)]
```

Na linha 1, o único evento recebido é `<td>C</td>`: nada, nesse evento isolado, diz em qual coluna `C` deve cair. É preciso que o código se lembre, desde a linha anterior, que a coluna 0 ainda está "ocupada" pela célula `A` por mais uma volta:

```python
colunas_ocupadas = {}  # {indice da coluna: numero de linhas restantes ocupadas por uma fusao}

def posicionar_celula(coluna_inicial, rowspan, colunas_ocupadas):
    coluna = coluna_inicial
    while colunas_ocupadas.get(coluna, 0) > 0:  # essa coluna ainda esta presa por uma fusao anterior
        coluna += 1                             # -> deslocar para a primeira coluna realmente livre
    if rowspan > 1:
        colunas_ocupadas[coluna] = rowspan
    return coluna
```

Antes de processar cada nova linha, cada contador de `colunas_ocupadas` ainda ativo precisa ser decrementado em um (mais uma linha acabou de ser "consumida" pela fusão), e removido uma vez chegando a zero.

> **Armadilha:** posicionar uma célula em sua posição bruta (0, 1, 2...) sem consultar as fusões ainda ativas herdadas das linhas anteriores. A célula seguinte acaba então na coluna errada, um deslocamento que se propaga silenciosamente até o final da linha, sem que nenhum erro o sinalize.
>
> **Boa prática:** manter explicitamente, coluna por coluna, o número de linhas restantes que uma fusão vertical ainda precisa ocupar, e fazer essas colunas "pularem" antes de posicionar cada nova célula de uma linha.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um parser incremental (`HTMLParser`) entrega um evento por tag/texto encontrado, sem nunca construir uma estrutura completa: cabe ao código manter seu próprio estado (uma máquina de estados) para reconstruir sentido, linha por linha, célula por célula. |
| **Ferramentas utilizáveis** | `html.parser.HTMLParser` (`handle_starttag`/`handle_endtag`/`handle_data`), um dicionário de colunas ocupadas para acompanhar as fusões (`rowspan`) que atravessam várias linhas. |
| **Armadilhas a evitar** | Sobrescrever um texto acumulado em vez de estendê-lo entre várias chamadas a `handle_data`. Posicionar uma célula sem levar em conta as fusões ativas herdadas das linhas anteriores. |
| **Boas práticas** | Sempre acumular o texto recebido até a tag de fechamento. Acompanhar explicitamente, coluna por coluna, as fusões verticais ainda ativas antes de posicionar uma nova célula. |
