---
title: Les boucles
---

Python propose `for` et `while`, mais la boucle `for` fonctionne différemment de PHP/C/JS : elle parcourt toujours directement les éléments d'un itérable, jamais un compteur numérique manipulé manuellement.

## La boucle `for`

```python
fruits = ["pomme", "banane", "cerise"]

for fruit in fruits:
    print(fruit)
```

Pour obtenir un compteur numérique classique, `range()` génère une séquence de nombres :

```python
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 10, 2):  # de 2 à 10 (exclu), par pas de 2 -> 2, 4, 6, 8
    print(i)
```

## `enumerate()` : obtenir l'index ET la valeur

```python
for index, fruit in enumerate(fruits):
    print(f"{index} : {fruit}")
# 0 : pomme
# 1 : banane
# 2 : cerise
```

## `zip()` : parcourir plusieurs collections en parallèle

```python
noms = ["Jean", "Marie"]
ages = [25, 30]

for nom, age in zip(noms, ages):
    print(f"{nom} a {age} ans")
```

`zip()` s'arrête dès que la **plus courte** des collections est épuisée, même si les autres contiennent encore des éléments.

## La boucle `while`

```python
i = 0

while i < 5:
    print(i)
    i += 1   # Python n'a pas d'opérateur i++ ou ++i : il faut écrire i += 1
```

## `break` et `continue`

Comme dans la plupart des langages :

```python
for i in range(10):
    if i == 5:
        break
    if i % 2 == 0:
        continue
    print(i)
```

## La clause `else` d'une boucle — une particularité Python

Une boucle `for`/`while` peut avoir un bloc `else`, exécuté uniquement si la boucle s'est terminée **normalement**, sans `break` :

```python
nombres = [1, 3, 5, 7]

for n in nombres:
    if n % 2 == 0:
        print("Nombre pair trouvé")
        break
else:
    print("Aucun nombre pair dans la liste")  # exécuté seulement si aucun break n'a eu lieu
```

> **Note :** cette construction surprend souvent les développeurs venant d'autres langages (le `else` semble se rattacher au `if` du dessus, mais il se rattache bien au `for`). Elle évite un pattern classique où on aurait sinon besoin d'une variable "drapeau" (`trouve = False`, mise à `True` dans le `if`, testée après la boucle).

## Pas d'accès direct à l'index dans un `for`

Contrairement à une boucle `for` en C (`for (int i = 0; i < taille; i++)`), la boucle Python ne manipule jamais explicitement un index — `enumerate()` est le moyen idiomatique d'en obtenir un quand c'est nécessaire, plutôt que d'itérer sur `range(len(liste))` puis d'indexer manuellement.
