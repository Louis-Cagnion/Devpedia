---
order: 2
---

# As condições

Python usa `if`/`elif`/`else`, sem nenhuma chave: é a própria **indentação** que delimita os blocos de código, ao contrário de PHP, C ou JavaScript.

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
| **Para lembrar** | `if`/`elif`/`else` estrutura o controle de fluxo, sem chaves: a indentação delimita os blocos. Certos valores (`0`, `""`, `[]`, `None`) são "falsy" sem serem `False`. |
| **Ferramentas utilizáveis** | Operador ternário (`x if cond else y`), operador morsa (`:=`), `match`/`case` (Python 3.10+). |
| **Armadilhas a evitar** | Uma indentação incoerente: isso provoca um `IndentationError`, não apenas um aviso. |
| **Boas práticas** | Testar diretamente `if colecao:` em vez de `if len(colecao) > 0:`, apoiando-se no comportamento truthy/falsy. |
