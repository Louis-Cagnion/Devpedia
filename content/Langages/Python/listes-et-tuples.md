---
order: 4
---

# Les listes et les tuples

Python distingue deux structures ordonnées de collections : la **liste**, mutable, et le **tuple**, immuable. Toutes deux peuvent mélanger librement des éléments de types différents.

## Les listes

```python
fruits = ["pomme", "banane", "cerise"]

fruits[0]     # "pomme"
fruits[-1]    # "cerise" -> index négatif : compte depuis la fin
fruits[0:2]   # ["pomme", "banane"] -> slicing : éléments de l'index 0 (inclus) à 2 (exclu)
fruits[::-1]  # ["cerise", "banane", "pomme"] -> inverse la liste (pas à pas -1)

fruits.append("kiwi")       # ajoute à la fin
fruits.insert(0, "mangue")  # insère à un index précis
fruits.remove("banane")     # retire la première occurrence de cette valeur
fruits.pop()                # retire ET renvoie le dernier élément
len(fruits)                 # nombre d'éléments
"pomme" in fruits           # True/False -> teste la présence d'une valeur
```

> **Note :** contrairement à un tableau en [C](/?c=langages-de-programmation&s=c&p=c) (taille fixe, un seul type), une liste Python est un tableau **dynamique** hétérogène : elle grandit automatiquement, et chaque élément peut être d'un type différent, au prix d'un surcoût mémoire par élément (chaque élément est en réalité une référence vers un objet Python, pas une valeur brute contiguë comme en [C](/?c=langages-de-programmation&s=c&p=c)).

### `.append()` vs `.extend()`

```python
fruits.append("kiwi")              # déjà vu : ajoute UN SEUL élément (même si c'est une liste, imbriquée telle quelle)
fruits.extend(["kiwi", "mangue"])  # ajoute CHAQUE élément de l'itérable donné, un par un, à la fin

fruits.append(["a", "b"])  # [..., ["a", "b"]] -> UN élément, imbriqué
fruits.extend(["a", "b"])  # [..., "a", "b"]   -> DEUX éléments, à plat
```

> **Piège :** confondre les deux méthodes sur une liste imbriquée : `.append(x)` ajoute toujours `x` tel quel comme un seul élément, jamais son contenu déplié.

## Le slicing en détail

```python
nombres = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

nombres[2:5]  # [2, 3, 4] -> de l'index 2 (inclus) à 5 (exclu)
nombres[:3]   # [0, 1, 2] -> depuis le début
nombres[7:]   # [7, 8, 9] -> jusqu'à la fin
nombres[::2]  # [0, 2, 4, 6, 8] -> un élément sur deux
```

## Les tuples : des listes immuables

```python
coordonnees = (48.8566, 2.3522)

coordonnees[0]      # 48.8566
coordonnees[0] = 0  # TypeError : un tuple ne peut pas être modifié après création
```

Un tuple sert typiquement à représenter un enregistrement fixe (une paire de coordonnées, un point RGB...) plutôt qu'une collection destinée à évoluer.

### Déballage (*unpacking*)

```python
latitude, longitude = coordonnees
print(latitude)   # 48.8566

a, b, c = 1, 2, 3  # fonctionne aussi sans parenthèses explicites : un tuple implicite
a, b = b, a        # échange de valeurs, sans variable temporaire
```

## `sorted()` : trier sans modifier l'original

```python
notes = [12, 5, 18, 9]

sorted(notes)  # [5, 9, 12, 18] -> NOUVELLE liste triée, notes reste inchangée
notes.sort()   # trie EN PLACE, ne renvoie rien (None), notes est modifiée
```

`sorted(iterable)` fonctionne aussi sur des chaînes de caractères : le tri est alors **lexicographique** (caractère par caractère, comme un dictionnaire), ce qui trie aussi chronologiquement des dates écrites à longueur fixe (`AAAA-MM-JJ...`), sans avoir besoin de les parser :

```python
runs = ["2026-08-14_101530", "2026-08-06_090000", "2026-08-14_090000"]
sorted(runs)  # ["2026-08-06_090000", "2026-08-14_090000", "2026-08-14_101530"] -> ordre chronologique, "gratuit"
```

> **Piège :** ce tri lexicographique ne fonctionne QUE si tous les éléments comparés ont la même longueur (ex. toujours `AAAA-MM-JJ`) : `"9"` se classe APRÈS `"10"` en tri lexicographique (`"9" > "1"` caractère par caractère), contrairement à un tri numérique.

## Les compréhensions de liste

Une **compréhension de liste** construit une nouvelle liste en une seule expression, plus concise et souvent plus rapide qu'une boucle `for` classique avec `.append()` :

```python
carres = [x ** 2 for x in range(5)]
# équivalent à :
carres = []
for x in range(5):
    carres.append(x ** 2)
```

Avec une condition de filtrage :

```python
pairs = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

> **Note :** une compréhension reste lisible pour une transformation simple sur une seule ligne ; au-delà (plusieurs conditions imbriquées, logique complexe), une boucle `for` classique reste plus claire à lire et à déboguer.

Voir aussi [Les dictionnaires et les ensembles](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) pour l'équivalent des compréhensions sur ces structures, et [Itérateurs et générateurs](/?c=langages-de-programmation&s=python&p=iterateurs-et-generateurs) pour l'expression génératrice (variante paresseuse d'une compréhension de liste).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une liste est mutable, un tuple est immuable : tous deux ordonnés et hétérogènes. Le slicing (`[debut:fin:pas]`) extrait une portion ; une compréhension construit une liste en une expression. |
| **Outils utilisables** | `append`/`insert`/`remove`/`pop`, slicing, déballage (*unpacking*), compréhensions de liste. |
| **Pièges à éviter** | Essayer de modifier un tuple après création (`TypeError`) : utiliser une liste si le contenu doit évoluer. |
| **Bonnes pratiques** | Utiliser un tuple pour un enregistrement fixe, une liste pour une collection destinée à évoluer ; réserver la compréhension à une transformation simple, une boucle `for` au-delà. |
