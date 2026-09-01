---
order: 3
---

# Les boucles

Python propose `for` et `while`, mais la boucle `for` fonctionne différemment de [PHP](/?c=langages-de-programmation&s=php&p=php)/C/JS : elle parcourt toujours directement les éléments d'un itérable, jamais un compteur numérique manipulé manuellement.

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

## `any()` / `all()` : tester une condition sur tout un itérable

```python
ages = [16, 20, 15, 30]

any(age >= 18 for age in ages)  # True  -> AU MOINS UN élément vérifie la condition
all(age >= 18 for age in ages)  # False -> il en faudrait un pour CHAQUE élément
```

`any(iterable)` renvoie `True` dès qu'un élément est vrai, sans forcément parcourir le reste (court-circuit, comme `or`) ; `all(iterable)` renvoie `True` seulement si tous le sont, et s'arrête au premier faux (comme `and`). Les deux s'utilisent typiquement directement sur une [expression génératrice](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) (sans construire de liste intermédiaire), ce qui évite de parcourir toute la collection si la réponse est déjà connue.

> **Piège :** sur un itérable VIDE, les résultats surprennent souvent : `any([])` vaut `False` (aucun élément vrai trouvé), `all([])` vaut `True` (vacuité : « tous » les zéro éléments vérifient bien la condition, faute d'un seul qui la contredise).

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

## La clause `else` d'une boucle : une particularité Python

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

Contrairement à une boucle `for` en [C](/?c=langages-de-programmation&s=c&p=c) (`for (int i = 0; i < taille; i++)`), la boucle Python ne manipule jamais explicitement un index ; `enumerate()` est le moyen idiomatique d'en obtenir un quand c'est nécessaire, plutôt que d'itérer sur `range(len(liste))` puis d'indexer manuellement.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `for` parcourt directement les éléments d'un itérable (jamais un compteur manuel) ; `range()` génère une séquence de nombres si besoin. `enumerate()`/`zip()` couvrent les besoins d'index et de parcours parallèle. |
| **Outils utilisables** | `enumerate()`, `zip()`, `any()`/`all()`, la clause `else` d'une boucle (exécutée si aucun `break`). |
| **Pièges à éviter** | Itérer sur `range(len(liste))` puis indexer manuellement, plutôt que d'utiliser directement `for element in liste` ou `enumerate()`. |
| **Bonnes pratiques** | Utiliser `enumerate()` dès qu'un index est nécessaire en plus de la valeur, plutôt que de le gérer manuellement. |
