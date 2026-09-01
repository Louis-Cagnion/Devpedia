---
order: 1
---

# As variáveis e tipos básicos

Para lembrar, [uma variável é uma caixa etiquetada que contém um valor](/?c=bases-de-l-informatique&p=la-variable). Python é **dinamicamente tipado**: uma variável não tem um tipo declarado antecipadamente, ela simplesmente assume o tipo do valor que lhe é atribuído, e pode mudar de tipo livremente durante o programa (ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=php) ou [C](/?c=langages-de-programmation&s=c&p=c), onde o tipo de uma propriedade/variável tipada permanece fixo uma vez declarado).

## Declarar uma variável

```python
idade = 25          # int
preco = 9.99         # float
nome = "Devpedia"    # str
ativo = True         # bool
nada = None          # equivalente de null/NULL

idade = "vinte e cinco"    # perfeitamente valido: idade se torna um str, sem declarar nada
```

> **Nota:** ao contrário de PHP (`$variavel`), Python não usa nenhum símbolo particular para designar uma variável: apenas um nome, em minúsculas com underscores por convenção (`nome_usuario`, não `nomeUsuario`).

## Verificar o tipo de uma variável

```python
type(idade)             # <class 'int'>
isinstance(idade, int)  # True -> preferido a type() == int para verificacoes condicionais
```

## Os operadores

```python
a, b = 5, 3   # atribuicao multipla em uma unica linha

a + b   # 8
a - b   # 2
a * b   # 15
a / b   # 1.6666... -> divisao real, sempre um float
a // b  # 1 -> divisao inteira (floor division)
a % b   # 2 -> modulo
a ** b  # 125 -> potencia

a == b   # False
a != b   # True
a and b  # E logico (nao '&&')
a or b   # OU logico (nao '||')
not a    # NAO logico (nao '!')
```

> **Nota:** Python usa as palavras-chave `and`/`or`/`not` em vez dos símbolos `&&`/`||`/`!` encontrados em PHP, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) ou C.

## `==` e `is`: o valor ou o objeto?

Esses dois operadores frequentemente são confundidos apesar de fazerem duas perguntas diferentes:

| Operador | Compara | Pergunta feita |
|---|---|---|
| `==` | o **valor** | "o conteudo deles e identico?" |
| `is` | a **identidade** | "e o mesmo objeto na memoria?" |

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

a == b  # True  -> mesmo conteudo
a is b  # False -> duas listas distintas na memoria
a is c  # True  -> c e a designam o mesmo objeto
```

É exatamente a distinção entre comparação por **valor** e comparação por **referência** encontrada em C com os ponteiros: `*p1 == *p2` (os valores apontados) contra `p1 == p2` (os endereços). Veja o capítulo [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs) de C.

### Por que `is None` e não `== None`

Para testar se uma variável vale `None`, a convenção Python é `is None`:

```python
if valor is None:  # recomendado
if valor == None:  # a evitar
```

Duas razões:

- `None` é um **singleton**: existe apenas uma única instância dele em todo o programa. Testar a identidade é, portanto, exato por construção, e ligeiramente mais rápido.
- `==` pode ser **redefinido** por uma classe via `__eq__`. Um objeto pode, portanto, perfeitamente responder `True` a `== None` sem ser `None`, o que torna o teste pouco confiável.

É isso que explica o padrão da sentinela `None` usado para argumentos padrão mutáveis (veja o capítulo [As funções](/?c=langages-de-programmation&s=python&p=fonctions)).

> O mesmo raciocínio se aplica a `True`/`False`, que também são singletons. Na prática, raramente se escreve `is True`: testa-se diretamente `if condicao:`.

## As f-strings: inserir variáveis em texto

```python
nome = "Joao"
idade = 25

print(f"{nome} tem {idade} anos")             # Joao tem 25 anos
print(f"Em 10 anos: {idade + 10} anos")       # uma expressao real, nao apenas uma variavel
```

As f-strings (prefixo `f` antes das aspas) são o método moderno recomendado, substituindo `"{} tem {} anos".format(nome, idade)` ou a concatenação com `+`.

### O sinalizador de conversão `!r`

```python
texto = ""
print(f"Recebido: {texto!r}")   # Recebido: '' -> repr(): mostra as aspas, entao a string vazia fica visivel
print(f"Recebido: {texto}")     # Recebido:    -> insercao normal: nada para ver, ilegivel em uma mensagem de debug
```

`!r` chama `repr(x)` antes da inserção (equivalente a `f"{repr(x)}"`): útil em uma mensagem de erro para distinguir `""` (string vazia) de `" "` (espaço), ou mais genericamente para ver o valor exato recebido em vez de sua exibição "limpa". `!s` (`str(x)`, o comportamento padrão) e `!a` (`ascii(x)`, escapa os caracteres não-ASCII) também existem, mais raramente úteis.

## Imutabilidade das strings

Como em PHP, uma string Python é **imutável**: toda "modificação" na verdade cria uma nova string, ela nunca modifica a original na memória.

```python
texto = "ola"
texto.upper()  # retorna "OLA", NAO MODIFICA texto
print(texto)   # ainda "ola"

texto = texto.upper()  # e preciso reatribuir para "manter" a mudanca
```

## Juntar uma lista em uma string: `str.join()`

```python
palavras = ["Python", "e", "legivel"]

" ".join(palavras)   # "Python e legivel"
", ".join(palavras)  # "Python, e, legivel"
"".join(palavras)    # "Pythonelegivel" -> separador vazio: nenhum caractere entre os elementos
```

> **Armadilha:** a ordem é invertida em relação à intuição vinda de outras linguagens: é o SEPARADOR que chama `.join()`, nunca a lista (`", ".join(palavras)`, não `palavras.join(", ")`). `.join()` também exige que todos os elementos já sejam strings; juntar uma lista de números levanta um `TypeError` sem uma conversão prévia (`", ".join(str(n) for n in numeros)`).

## Dividir um texto em linhas: `str.splitlines()`

```python
texto = "linha1\nlinha2\r\nlinha3"

texto.splitlines()  # ["linha1", "linha2", "linha3"]     -> reconhece \n E \r\n, nenhum \n no resultado
texto.split("\n")   # ["linha1", "linha2", "linha3\r"]   -> "\r" fica grudado em "linha3"
```

`.splitlines()` reconhece tanto `\n` (fim de linha Unix) quanto `\r\n` (Windows) como separador, sem nunca deixar um caractere de quebra de linha no resultado: mais confiável que `.split("\n")` em um texto cuja origem (e portanto a convenção de fim de linha) não é garantida, por exemplo um arquivo baixado ou gerado em outra máquina.

## Resumo dos tipos básicos

| Tipo | Exemplo | Equivalente PHP |
|---|---|---|
| `int` | `25` | `int` |
| `float` | `9.99` | `float` |
| `str` | `"texto"` | `string` |
| `bool` | `True` / `False` | `bool` |
| `None` | `None` | `null` |

Veja também os capítulos sobre listas/tuplas e dicionários/conjuntos para as estruturas de dados compostas.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Python é dinamicamente tipado: uma variável assume o tipo de seu valor, sem declaração prévia, e pode mudá-lo. `==` compara o valor, `is` compara a identidade (o mesmo objeto na memória). |
| **Ferramentas utilizáveis** | `type()`/`isinstance()`, f-strings para interpolação, `is None` para testar uma ausência de valor. |
| **Armadilhas a evitar** | Confundir `==` e `is`: dois objetos com conteúdo idêntico não são necessariamente o mesmo objeto na memória. |
| **Boas práticas** | Usar `is None` em vez de `== None`; preferir f-strings à concatenação para inserir uma variável em um texto. |
