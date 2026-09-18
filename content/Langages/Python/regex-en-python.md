---
order: 18
---

# Les regex en Python : le module `re`

Contrairement à [JavaScript](/?c=langages&s=javascript&p=regex), Python n'a pas de syntaxe littérale pour les regex (pas de `/motif/`) : le module `re` de la bibliothèque standard fournit toutes les fonctions et méthodes nécessaires. La syntaxe du motif lui-même (classes de caractères, quantificateurs, groupes, ancres) est exactement la même que celle vue dans [La regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) -- ce chapitre couvre uniquement l'API Python : comment compiler un motif, l'exécuter, et récupérer son résultat.

## Compiler un motif : `re.compile()`

```python
import re

motif = re.compile(r"\d{4}-\d{2}-\d{2}")   # précompile le motif, réutilisable
```

> **Note :** le préfixe `r"..."` (chaîne brute, *raw string*) empêche Python d'interpréter `\d` comme une séquence d'échappement invalide : indispensable dès qu'un motif contient un backslash.

`re.compile(motif)` transforme une chaîne en objet `Pattern`, réutilisable pour plusieurs recherches sans réinterpréter le motif à chaque fois -- plus efficace qu'un appel direct comme `re.match(motif, texte)` si le même motif sert plusieurs fois.

## Chercher une correspondance

| Méthode | Cherche | Renvoie |
|---|---|---|
| `pattern.match(texte)` | Une correspondance uniquement au DÉBUT de la chaîne | Un `Match`, ou `None` |
| `pattern.search(texte)` | La première correspondance n'importe où dans la chaîne | Un `Match`, ou `None` |
| `pattern.fullmatch(texte)` | Une correspondance sur la chaîne ENTIÈRE | Un `Match`, ou `None` |
| `pattern.findall(texte)` | Toutes les correspondances | Une liste de chaînes (ou de tuples si plusieurs groupes) |
| `pattern.finditer(texte)` | Toutes les correspondances | Un itérateur d'objets `Match` |

```python
motif = re.compile(r"\d{4}-\d{2}-\d{2}")

motif.match("2024-06-15 est une date")      # correspond : commence par le motif
motif.match("Le 2024-06-15 est une date")   # None -> ne commence PAS par le motif

motif.search("Le 2024-06-15 est une date")  # correspond, n'importe où dans la chaîne
```

> **Piège :** confondre `match()` (uniquement au début de la chaîne) et `search()` (n'importe où). Une regex qui ne trouve rien avec `match()` peut très bien correspondre avec `search()`, simplement parce que la correspondance ne se trouve pas en tout début de chaîne.
>
> **Bonne pratique :** utiliser `search()` par défaut dès que la correspondance peut se trouver n'importe où dans le texte ; réserver `match()` au cas où elle doit obligatoirement commencer la chaîne.

## L'objet `Match`

```python
resultat = motif.search("Le 2024-06-15 est une date")

resultat.group(0)   # "2024-06-15" -> la correspondance complète
resultat[0]         # équivalent, notation raccourcie
resultat.start()    # 3 -> index de début dans la chaîne
resultat.end()      # 13 -> index de fin
```

`resultat.group(0)` (ou `resultat[0]`) renvoie toujours la correspondance complète, que le motif contienne des groupes ou non. Si aucune correspondance n'est trouvée, `search()`/`match()` renvoient `None` : appeler `.group()` dessus lève une `AttributeError` ("NoneType n'a pas d'attribut group").

> **Piège :** appeler `.group()` sans vérifier d'abord que le résultat n'est pas `None`. Toujours tester le résultat avant de l'utiliser :
>
> ```python
> resultat = motif.search(texte)
> if resultat:
>     print(resultat.group(0))
> ```

## Les groupes capturants

```python
motif = re.compile(r"(\d{4})-(\d{2})-(\d{2})")
resultat = motif.search("2024-06-15")

resultat.group(1)   # "2024" (année)
resultat.group(2)   # "06" (mois)
resultat.group(3)   # "15" (jour)
resultat.groups()   # ("2024", "06", "15") -> tous les groupes en un tuple
```

## Les groupes nommés : `(?P<nom>...)`

Au-delà de deux ou trois groupes, s'y retrouver par position (`group(1)`, `group(2)`...) devient vite peu lisible et fragile : insérer un nouveau groupe au milieu du motif décale la numérotation de tous ceux qui suivent. Un **groupe nommé** associe une étiquette au groupe, indépendante de sa position :

```python
motif = re.compile(r"(?P<annee>\d{4})-(?P<mois>\d{2})-(?P<jour>\d{2})")
resultat = motif.search("2024-06-15")

resultat.group("annee")   # "2024"
resultat["annee"]         # équivalent, notation raccourcie
resultat.groupdict()      # {"annee": "2024", "mois": "06", "jour": "15"}
```

> **Bonne pratique :** nommer les groupes dès qu'un motif en compte plusieurs -- `resultat["annee"]` reste correct même si un groupe est ajouté ou retiré ailleurs dans le motif, contrairement à `resultat.group(2)`, dont le numéro dépend de la position.

## Remplacer avec `re.sub()`

```python
texte = "Le 2024-06-15 est une date"

re.sub(r"\d{4}-\d{2}-\d{2}", "JJ/MM/AAAA", texte)
# "Le JJ/MM/AAAA est une date"

# réutiliser un groupe capturé dans le remplacement, avec \1, \2...
re.sub(r"(\d{4})-(\d{2})-(\d{2})", r"\3/\2/\1", texte)
# "Le 15/06/2024 est une date"
```

Voir aussi [La regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) pour la syntaxe générale des motifs (classes de caractères, quantificateurs, ancres, assertions), commune à tous les langages.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Python n'a pas de syntaxe littérale de regex : le module `re` fournit `compile()`, `match()`/`search()`/`findall()`/`finditer()`, et un objet `Match` pour récupérer le résultat. Les groupes nommés (`(?P<nom>...)`) rendent l'accès aux groupes capturés indépendant de leur position. |
| **Outils utilisables** | `re.compile()`, `pattern.match()`/`search()`/`fullmatch()`/`findall()`/`finditer()`, `match.group()`/`groups()`/`groupdict()`, `re.sub()`. |
| **Pièges à éviter** | Confondre `match()` (début de chaîne uniquement) et `search()` (n'importe où). Appeler `.group()` sur un résultat `None` sans le vérifier d'abord. |
| **Bonnes pratiques** | Précompiler un motif réutilisé plusieurs fois avec `re.compile()`. Nommer les groupes dès qu'un motif en a plusieurs. Toujours tester qu'un résultat de recherche n'est pas `None` avant d'appeler `.group()`. |
