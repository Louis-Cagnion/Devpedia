---
order: 2
---

# Condiciones

Python utiliza `if` / `elif` / `else`, sin llaves; es la propia **sangría** la que delimita los bloques de código, a diferencia de PHP, C o JavaScript.

## `if` / `elif` / `else`

```python
edad = 20

if edad >= 18:
    print("Vous êtes majeur.")
elif edad >= 13:
    print("Vous êtes adolescent.")
else:
    print("Vous êtes enfant.")
```

> **Nota:** «`elif`» (contracción de «else if») es la única palabra clave para encadenar condiciones; «`else if`» (en dos palabras) no existe en Python. Es **obligatorio** utilizar una sangría coherente: un bloque mal sangrado provoca un «`IndentationError`», no solo una advertencia.

## Los valores «truthy» y «falsy»

Aparte de `True` / `False`, Python considera automáticamente ciertos valores como falsos en un contexto booleano (`if`, `while`...):

```python
if []:        # False -> una lista vacía es «falsy»
if "":         # False -> una cadena vacía es «falsy»
if 0:          # False -> cero es «falsy»
if None:       # False
if [1, 2]:    # True -> una lista no vacía es «truthy»
```

| Valor | Verdadero / Falso |
|---|---|
| `0`, `0.0` | Falsy |
| `""` (cadena vacía) | Falsy |
| `[]`, `{}`, `set()` (colecciones vacías) | Falsy |
| `None` | Falsy |
| Todo lo demás | Truthy |

```python
utilisateurs = []

if utilisateurs:                # Se prefiere a «if len(usuarios) > 0:»
    print("Il y a des utilisateurs")
else:
    print("Aucun utilisateur")
```

## El operador ternario

```python
edad = 20
statut = "majeur" if edad >= 18 else "mineur"
```

A diferencia de PHP/C/JS (`condition ? valeur_si_vrai : valeur_si_faux`), Python coloca la condición **en medio**: `valeur_si_vrai if condition else valeur_si_faux`.

## El operador «morse» (`:=`) — desde Python 3.8

Permite asignar una variable **y** utilizarla en la misma expresión, especialmente en una condición:

```python
# Sin el operador morse: la línea «resultado» se calcula dos veces.
if calculer_resultat() > 10:
    print(calculer_resultat())

# con el operador Morse: se calcula una sola vez y, a continuación, se puede utilizar
if (resultado := calculer_resultat()) > 10:
    print(resultado)
```

## No hay un «`switch`» clásico (antes de Python 3.10)

Durante mucho tiempo, Python no ofrecía ningún equivalente directo a «`switch`»; como alternativa se utilizaba una cadena de «`elif`» o un diccionario de correspondencias:

```python
def jour_semaine(jour):
    correspondance = {
        1: "Lundi",
        2: "Mardi",
        3: "Mercredi",
    }
    return correspondance.get(jour, "Jour inconnu")
```

Desde Python 3.10, `match` / `case` ofrece una sintaxis específica, más parecida a la de un lenguaje de programación de tipo «`switch`»:

```python
match jour:
    case 1:
        print("Lundi")
    case 2:
        print("Mardi")
    case _:            # '_' : equivalente al «default» de un switch
        print("Autre jour")
```
