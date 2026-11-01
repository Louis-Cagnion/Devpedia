---
order: 3
---

# Evitar a repetição: estruturas indexadas em vez de código duplicado

Um sinal clássico de código que vai se tornar penoso de manter: a mesma instrução, repetida uma vez por elemento de um conjunto, com apenas um ou dois valores mudando de uma repetição para outra.

## O sintoma

```python
parser.add_argument("--profile-dir", default=str(Path.home() / ".rapport_profil"))
parser.add_argument("--verbose", action="store_true")
parser.add_argument("--format", choices=["csv", "json", "xml", "html"])
parser.add_argument("--output", default="rapports/rapport.txt")
# ... mais umas dez, cada uma na sua própria chamada
```

Cada linha se parece com as outras, mas adicionar uma opção, remover uma, ou mudar um comportamento comum a todas (por exemplo, validar um tipo) obriga a repetir a mesma modificação em cada lugar, e é fácil esquecer uma.

## A solução: uma estrutura de dados, percorrida por código genérico

O princípio: descrever cada elemento uma única vez, em uma estrutura de dados (lista, dicionário), e depois escrever **uma única** função ou laço que a percorre e aplica o mesmo processamento a cada um.

```python
CLI_ARGUMENTS = [
    {"flag": "--profile-dir", "default": str(Path.home() / ".rapport_profil")},
    {"flag": "--verbose", "action": "store_true"},
    {"flag": "--format", "choices": ["csv", "json", "xml", "html"]},
    {"flag": "--output", "default": "rapports/rapport.txt"},
]

for arg in CLI_ARGUMENTS:
    flag = arg.pop("flag")
    parser.add_argument(flag, **arg)
```

Adicionar uma opção passa a ser uma entrada em uma lista, não uma nova linha de código a escrever seguindo o mesmo padrão das anteriores. Um comportamento comum (validação, valor padrão calculado, transformação) se muda em um único lugar (o laço) em vez de ser repetido em cada chamada.

## Um caso mais sutil: o dispatch

A mesma ideia se aplica quando a repetição está em uma condição em vez de em uma chamada de função:

```python
# Antes: um branch por caso, a manter sincronizado com a lista de formatos
if format_name == "csv":
    exporter = export_csv
elif format_name == "json":
    exporter = export_json
elif format_name == "xml":
    exporter = export_xml
elif format_name == "html":
    exporter = export_html

# Depois: um dicionario faz o papel de tabela de dispatch
FORMAT_EXPORTERS = {
    "csv": export_csv,
    "json": export_json,
    "xml": export_xml,
    "html": export_html,
}
exporter = FORMAT_EXPORTERS[format_name]
```

O dicionário cumpre exatamente o mesmo papel da cadeia de `if`/`elif`, mas adicionar um formato passa a ser adicionar uma entrada, sem tocar na lógica que seleciona o exportador certo.

## Onde parar

Essa generalização tem um custo: uma estrutura de dados abstrata demais para dois ou três casos que não vão crescer complica a leitura sem trazer benefício real (veja o princípio [KISS](https://en.wikipedia.org/wiki/KISS_principle)/[YAGNI](https://martinfowler.com/bliki/Yagni.html)). O limite de bom senso: assim que se escreve a **terceira** repetição do mesmo padrão, é o momento certo de substituí-la por uma estrutura indexada; antes disso, geralmente ainda não compensa.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma mesma instrução repetida para cada elemento de um conjunto (opções de CLI, `if`/`elif` por caso) deve se apoiar em uma estrutura indexada (lista, dicionário) percorrida por código genérico: adicionar um elemento passa a ser modificar um dado, não adicionar código. |
| **Ferramentas utilizáveis** | Uma lista de dicionários percorrida em laço, um dicionário de dispatch no lugar de uma cadeia `if`/`elif`. |
| **Armadilhas a evitar** | Generalizar já na primeira ou segunda ocorrência: uma estrutura abstrata demais para um caso que não vai crescer complica a leitura sem benefício real. |
| **Boas práticas** | Esperar a terceira repetição de um mesmo padrão antes de substituí-lo por uma estrutura indexada. |
