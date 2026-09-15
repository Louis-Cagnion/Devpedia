---
order: 18
---

# Regex em Python: o módulo `re`

Ao contrário do [JavaScript](/?c=langages&s=javascript&p=regex), Python não tem sintaxe literal para regex (sem `/padrao/`): o módulo `re` da biblioteca padrão fornece todas as funções e métodos necessários. A sintaxe do padrão em si (classes de caracteres, quantificadores, grupos, âncoras) é exatamente a mesma vista em [A regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) -- este capítulo cobre apenas a API do Python: como compilar um padrão, executá-lo e recuperar seu resultado.

## Compilar um padrão: `re.compile()`

```python
import re

padrao = re.compile(r"\d{4}-\d{2}-\d{2}")   # pre-compila o padrao, reutilizavel
```

> **Nota:** o prefixo `r"..."` (string bruta, *raw string*) impede que o Python interprete `\d` como uma sequência de escape inválida: indispensável assim que um padrão contém uma barra invertida.

`re.compile(padrao)` transforma uma string em um objeto `Pattern`, reutilizável para várias buscas sem reinterpretar o padrão a cada vez -- mais eficiente que uma chamada direta como `re.match(padrao, texto)` se o mesmo padrão for usado várias vezes.

## Procurar uma correspondência

| Método | Procura | Retorna |
|---|---|---|
| `padrao.match(texto)` | Uma correspondência apenas no INÍCIO da string | Um `Match`, ou `None` |
| `padrao.search(texto)` | A primeira correspondência em qualquer lugar da string | Um `Match`, ou `None` |
| `padrao.fullmatch(texto)` | Uma correspondência com a string INTEIRA | Um `Match`, ou `None` |
| `padrao.findall(texto)` | Todas as correspondências | Uma lista de strings (ou tuplas se houver vários grupos) |
| `padrao.finditer(texto)` | Todas as correspondências | Um iterador de objetos `Match` |

```python
padrao = re.compile(r"\d{4}-\d{2}-\d{2}")

padrao.match("2024-06-15 e uma data")      # corresponde: comeca com o padrao
padrao.match("A data e 2024-06-15")        # None -> NAO comeca com o padrao

padrao.search("A data e 2024-06-15")       # corresponde, em qualquer lugar da string
```

> **Armadilha:** confundir `match()` (apenas no início da string) e `search()` (em qualquer lugar). Uma regex que não encontra nada com `match()` pode perfeitamente corresponder com `search()`, simplesmente porque a correspondência não está bem no início da string.
>
> **Boa prática:** usar `search()` por padrão sempre que a correspondência puder estar em qualquer lugar do texto; reservar `match()` para quando ela precisa obrigatoriamente começar a string.

## O objeto `Match`

```python
resultado = padrao.search("A data e 2024-06-15")

resultado.group(0)   # "2024-06-15" -> a correspondencia completa
resultado[0]         # equivalente, notacao abreviada
resultado.start()    # 8 -> indice de inicio na string
resultado.end()      # 18 -> indice de fim
```

`resultado.group(0)` (ou `resultado[0]`) sempre retorna a correspondência completa, tenha o padrão grupos ou não. Se nenhuma correspondência for encontrada, `search()`/`match()` retornam `None`: chamar `.group()` nisso lança um `AttributeError` ("NoneType não tem atributo group").

> **Armadilha:** chamar `.group()` sem antes verificar se o resultado não é `None`. Sempre testar o resultado antes de usá-lo:
>
> ```python
> resultado = padrao.search(texto)
> if resultado:
>     print(resultado.group(0))
> ```

## Os grupos de captura

```python
padrao = re.compile(r"(\d{4})-(\d{2})-(\d{2})")
resultado = padrao.search("2024-06-15")

resultado.group(1)   # "2024" (ano)
resultado.group(2)   # "06" (mes)
resultado.group(3)   # "15" (dia)
resultado.groups()   # ("2024", "06", "15") -> todos os grupos em uma tupla
```

## Os grupos nomeados: `(?P<nome>...)`

Além de dois ou três grupos, se localizar por posição (`group(1)`, `group(2)`...) rapidamente se torna pouco legível e frágil: inserir um novo grupo no meio do padrão desloca a numeração de todos os seguintes. Um **grupo nomeado** associa um rótulo ao grupo, independente de sua posição:

```python
padrao = re.compile(r"(?P<ano>\d{4})-(?P<mes>\d{2})-(?P<dia>\d{2})")
resultado = padrao.search("2024-06-15")

resultado.group("ano")   # "2024"
resultado["ano"]         # equivalente, notacao abreviada
resultado.groupdict()    # {"ano": "2024", "mes": "06", "dia": "15"}
```

> **Boa prática:** nomear os grupos assim que um padrão tiver vários -- `resultado["ano"]` continua correto mesmo que um grupo seja adicionado ou removido em outra parte do padrão, ao contrário de `resultado.group(2)`, cujo número depende da posição.

## Substituir com `re.sub()`

```python
texto = "A data e 2024-06-15"

re.sub(r"\d{4}-\d{2}-\d{2}", "DD/MM/AAAA", texto)
# "A data e DD/MM/AAAA"

# reutilizar um grupo capturado na substituicao, com \1, \2...
re.sub(r"(\d{4})-(\d{2})-(\d{2})", r"\3/\2/\1", texto)
# "A data e 15/06/2024"
```

Veja também [A regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) para a sintaxe geral dos padrões (classes de caracteres, quantificadores, âncoras, asserções), comum a todas as linguagens.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Python não tem sintaxe literal de regex: o módulo `re` fornece `compile()`, `match()`/`search()`/`findall()`/`finditer()`, e um objeto `Match` para recuperar o resultado. Os grupos nomeados (`(?P<nome>...)`) tornam o acesso aos grupos capturados independente de sua posição. |
| **Ferramentas utilizáveis** | `re.compile()`, `padrao.match()`/`search()`/`fullmatch()`/`findall()`/`finditer()`, `match.group()`/`groups()`/`groupdict()`, `re.sub()`. |
| **Armadilhas a evitar** | Confundir `match()` (apenas início da string) e `search()` (em qualquer lugar). Chamar `.group()` em um resultado `None` sem verificá-lo antes. |
| **Boas práticas** | Pré-compilar um padrão reutilizado várias vezes com `re.compile()`. Nomear os grupos assim que um padrão tiver vários. Sempre verificar que um resultado de busca não é `None` antes de chamar `.group()`. |
