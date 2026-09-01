---
order: 2
---

# As condições

Python usa `if`/`elif`/`else`, sem nenhuma chave: é a própria **indentação** que delimita os blocos de código, ao contrário de [PHP](/?c=langages-de-programmation&s=php&p=php), C ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript).

## `if` / `elif` / `else`

```python
idade = 20

if idade >= 18:
    print("Voce e maior de idade.")
elif idade >= 13:
    print("Voce e adolescente.")
else:
    print("Voce e crianca.")
```

> **Nota:** `elif` (contração de "else if") é a única palavra-chave para encadear condições; `else if` em duas palavras não existe em Python. A indentação coerente é **obrigatória**: um bloco mal indentado provoca um `IndentationError`, não apenas um aviso.

## Os valores "truthy" e "falsy"

Além de `True`/`False`, Python considera automaticamente certos valores como falsos em um contexto booleano (`if`, `while`...):

```python
if []:      # False -> uma lista vazia e "falsy"
if "":      # False -> uma string vazia e "falsy"
if 0:       # False -> zero e "falsy"
if None:    # False
if [1, 2]:  # True -> uma lista nao vazia e "truthy"
```

| Valor | Truthy / Falsy |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (string vazia) | Falsy |
| `[]`, `{}`, `set()` (coleções vazias) | Falsy |
| `None` | Falsy |
| Todo o resto | Truthy |

```python
usuarios = []

if usuarios:                # preferido a "if len(usuarios) > 0:"
    print("Ha usuarios")
else:
    print("Nenhum usuario")
```

## `and`/`or` retornam um valor, não apenas um booleano

```python
status = "ativo"
resultado = status and "encontrado"    # "encontrado" -> status e truthy, and retorna seu SEGUNDO operando
resultado = "" and "encontrado"        # ""           -> "" e falsy, and para e retorna seu PRIMEIRO operando

apelido = ""
nome_exibido = apelido or "Anonimo"    # "Anonimo" -> or retorna o primeiro operando truthy encontrado
```

`and`/`or` nunca recalculam um `True`/`False`: eles retornam um dos seus dois operandos, sem avaliar o outro além do necessário (**avaliação em curto-circuito**). `a and b` retorna `a` se `a` for falsy (sem sequer avaliar `b`), senão `b`; `a or b` retorna `a` se `a` for truthy, senão `b`. Esse idioma permite uma chamada condicional (`conectado and desconectar()`, só chama `desconectar()` se `conectado` for verdadeiro) ou um valor de reserva (`nome = apelido or "Anonimo"`).

> **Armadilha:** esse atalho continua pouco legível para um teste condicional simples clássico; reservá-lo para uma expressão (atribuição, argumento) que precise de um valor de reserva ou chamada condicional curta, manter um `if` explícito em todos os outros casos.

## O operador ternário

```python
idade = 20
status = "maior de idade" if idade >= 18 else "menor de idade"
```

Ao contrário de PHP/C/JS (`condicao ? valor_se_verdadeiro : valor_se_falso`), Python coloca a condição **no meio**: `valor_se_verdadeiro if condicao else valor_se_falso`.

## O operador "morsa" (`:=`, desde o Python 3.8)

Permite atribuir uma variável **e** usá-la na mesma expressão, principalmente em uma condição:

```python
# sem o operador morsa: a linha "resultado" e calculada duas vezes
if calcular_resultado() > 10:
    print(calcular_resultado())

# com o operador morsa: calculada uma unica vez, E utilizavel depois
if (resultado := calcular_resultado()) > 10:
    print(resultado)
```

## Sem `switch` clássico (antes do Python 3.10)

Python por muito tempo não ofereceu nenhum equivalente direto de `switch`; uma cadeia de `elif` ou um dicionário de correspondência servia de alternativa:

```python
def dia_semana(dia):
    correspondencia = {
        1: "Segunda",
        2: "Terca",
        3: "Quarta",
    }
    return correspondencia.get(dia, "Dia desconhecido")
```

Desde o Python 3.10, `match`/`case` oferece uma sintaxe dedicada, mais próxima de um `switch`:

```python
match dia:
    case 1:
        print("Segunda")
    case 2:
        print("Terca")
    case _:            # '_' : equivalente do "default" de um switch
        print("Outro dia")
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `if`/`elif`/`else` estrutura o controle de fluxo, sem chaves: a indentação delimita os blocos. Certos valores (`0`, `""`, `[]`, `None`) são "falsy" sem serem `False`. `and`/`or` retornam um dos seus operandos, não apenas um booleano. |
| **Ferramentas utilizáveis** | Operador ternário (`x if cond else y`), operador morsa (`:=`), `match`/`case` (Python 3.10+). |
| **Armadilhas a evitar** | Uma indentação incoerente: isso provoca um `IndentationError`, não apenas um aviso. |
| **Boas práticas** | Testar diretamente `if colecao:` em vez de `if len(colecao) > 0:`, apoiando-se no comportamento truthy/falsy. |
