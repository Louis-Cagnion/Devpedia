---
order: 5
---

# Les dictionnaires et les ensembles

Le **dictionnaire** (`dict`) associe des clés à des valeurs, exactement comme un tableau associatif en [PHP](/?c=langages-de-programmation&s=php&p=php). L'**ensemble** (`set`) stocke des valeurs uniques, sans ordre ni doublons. Les deux structures s'appuient en interne sur une [table de hachage](/?c=langages-de-programmation&s=c&p=tables-de-hachage) : c'est ce qui permet à `dico["cle"]` ou `"valeur" in ensemble` d'être quasi instantané, même sur une très grande collection.

## Les dictionnaires

```python
personne = {"nom": "Dupont", "age": 25}

personne["nom"]                         # "Dupont"
personne["email"] = "jean@exemple.com"  # ajoute une nouvelle clé
personne["age"] = 26                    # modifie une clé existante
del personne["age"]                     # supprime une clé

personne.get("telephone")             # None si la clé n'existe pas (pas d'erreur)
personne.get("telephone", "inconnu")  # "inconnu" -> valeur par défaut si absente

"nom" in personne            # True -> teste la présence d'une CLÉ (pas d'une valeur)
```

> **Note :** `personne["telephone"]` (accès direct par crochets) lève une `KeyError` si la clé n'existe pas ; contrairement à `.get()`, qui renvoie `None` (ou une valeur par défaut fournie) sans jamais planter. Préférer `.get()` dès que l'absence de la clé est un cas normal, pas une erreur.

### Parcourir un dictionnaire

```python
for cle in personne:
    print(cle)                      # parcourt uniquement les clés

for cle, valeur in personne.items():
    print(f"{cle} : {valeur}")       # parcourt clés ET valeurs ensemble

for valeur in personne.values():
    print(valeur)                    # parcourt uniquement les valeurs
```

### Compréhension de dictionnaire

```python
carres = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

## Les ensembles (`set`)

```python
fruits = {"pomme", "banane", "cerise"}

fruits.add("kiwi")        # ajoute un élément
fruits.remove("banane")   # retire un élément (erreur si absent)
fruits.discard("mangue")  # retire un élément, SANS erreur si absent

"pomme" in fruits   # True -> test d'appartenance quasi instantané (table de hachage)
```

### Opérations d'ensembles

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b  # {1, 2, 3, 4} -> union
a & b  # {2, 3}       -> intersection
a - b  # {1}           -> différence (dans a, pas dans b)
a ^ b  # {1, 4}        -> différence symétrique (dans l'un OU l'autre, pas les deux)
```

> **Note :** un `set` élimine automatiquement les doublons : `set([1, 2, 2, 3, 3, 3])` donne `{1, 2, 3}`. C'est une façon très courante de dédupliquer rapidement une liste en Python : `list(set(ma_liste))`.

### Compréhension d'ensemble

```python
carres_uniques = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 et 2**2 valent tous deux 4, donc dédupliqués automatiquement
```

Voir aussi [Les tables de hachage](/?c=langages-de-programmation&s=c&p=tables-de-hachage) pour ce qui se passe réellement en mémoire derrière `dict` et `set`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `dict` associe des clés à des valeurs, un `set` stocke des valeurs uniques sans ordre ; les deux reposent sur une table de hachage, donc quasi instantanés en accès/test. |
| **Outils utilisables** | `.get()` (sans erreur), compréhensions de dict/set, opérations d'ensembles (`\|`, `&`, `-`, `^`). |
| **Pièges à éviter** | Accéder à une clé absente par crochets (`dico["x"]`) plutôt que par `.get()` : cela lève une `KeyError`. |
| **Bonnes pratiques** | Utiliser `.get()` dès que l'absence d'une clé est un cas normal, pas une erreur ; `list(set(ma_liste))` pour dédupliquer rapidement. |
