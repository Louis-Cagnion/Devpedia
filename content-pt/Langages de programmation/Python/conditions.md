---
order: 2
---

# As condições

O Python utiliza `if` / `elif` / `else`, sem quaisquer chaves — é a própria **indentação** que delimita os blocos de código, ao contrário do PHP, do C ou do JavaScript.

## `if` / `elif` / `else`

```python
idade = 20

if idade >= 18:
    print("Vous êtes majeur.")
elif idade >= 13:
    print("Vous êtes adolescent.")
else:
    print("Vous êtes enfant.")
```

> **Nota:** «`elif`» (contracção de «else if») é a única palavra-chave para encadear condições — «`else if`», em duas palavras, não existe em Python. É **obrigatório utilizar** uma indentação coerente: um bloco mal indentado provoca uma «`IndentationError`», não apenas um aviso.

## Os valores «truthy» e «falsy»

Para além de `True` / `False`, o Python considera automaticamente certos valores como falsos num contexto booleano (`if`, `while`...):

```python
if []:        # False -> uma lista vazia é «falsy»
if "":         # False -> uma cadeia de caracteres vazia é «falsy»
if 0:          # False -> zero é «falsy»
if None:       # False
if [1, 2]:    # True -> uma lista não vazia é «truthy»
```

| Valor | Verdadeiro / Falso |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (cadeia vazia) | Falsy |
| `[]`, `{}`, `set()` (coleções vazias) | Falsy |
| `None` | Falsy |
| Todo o resto | Truthy |

```python
utilisateurs = []

if utilisateurs:                # preferível a «if len(usuários) > 0:»
    print("Il y a des utilisateurs")
else:
    print("Aucun utilisateur")
```

## O operador ternário

```python
idade = 20
statut = "majeur" if idade >= 18 else "mineur"
```

Ao contrário do PHP/C/JS (`condition ? valeur_si_vrai : valeur_si_faux`), o Python coloca a condição **no meio**: `valeur_si_vrai if condition else valeur_si_faux`.

## O operador «morse» (`:=`) — a partir do Python 3.8

Permite atribuir um valor a uma variável **e** utilizá-la na mesma expressão, nomeadamente numa condição:

```python
# sem o operador morse: a linha «resultado» é calculada duas vezes
if calculer_resultat() > 10:
    print(calculer_resultat())

# com o operador Morse: calculada uma única vez e, posteriormente, utilizável
if (resultado := calculer_resultat()) > 10:
    print(resultado)
```

## Sem o comando clássico «`switch`» (antes do Python 3.10)

Durante muito tempo, o Python não disponibilizou nenhum equivalente direto a um «`switch`» — uma cadeia de «`elif`» ou um dicionário de correspondência serviam de alternativa:

```python
def jour_semaine(jour):
    correspondance = {
        1: "Lundi",
        2: "Mardi",
        3: "Mercredi",
    }
    return correspondance.get(jour, "Jour inconnu")
```

Desde o Python 3.10, `match` / `case` disponibiliza uma sintaxe específica, mais próxima de um «`switch`»:

```python
match jour:
    case 1:
        print("Lundi")
    case 2:
        print("Mardi")
    case _:            # '_' : equivalente ao «default» de um switch
        print("Autre jour")
```
