---
order: 16
---

# Le module `datetime`

Un ordinateur mesure le temps en interne comme un simple nombre de secondes écoulées (voir plus bas `time.time()`) ; le module standard **`datetime`** l'habille en un objet lisible (année, mois, jour, heure...), pratique pour l'afficher, le comparer ou le formater en chaîne.

## `datetime.now()` : la date et l'heure actuelles

```python
from datetime import datetime

maintenant = datetime.now()
print(maintenant)  # 2026-09-01 14:32:07.123456 -> un objet datetime, pas une simple chaîne

maintenant.year, maintenant.month, maintenant.day      # (2026, 9, 1)
maintenant.hour, maintenant.minute, maintenant.second  # (14, 32, 7)

datetime(2026, 1, 1)  # construit une date précise plutôt que "maintenant"
```

## Formater en chaîne : `.strftime()`

```python
# "2026-09-01_143207" -> format compact, utilisable dans un nom de fichier
maintenant.strftime("%Y-%m-%d_%H%M%S")
maintenant.strftime("%d/%m/%Y")         # "01/09/2026"        -> format français courant
```

| Code | Signifie |
|---|---|
| `%Y` | Année sur 4 chiffres |
| `%m` | Mois (01-12) |
| `%d` | Jour du mois (01-31) |
| `%H` | Heure (00-23) |
| `%M` | Minute (00-59) |
| `%S` | Seconde (00-59) |

## Parser une chaîne en date : `.strptime()`

```python
# opération INVERSE de strftime, même table de codes
datetime.strptime("2026-09-01_143207", "%Y-%m-%d_%H%M%S")
```

> **Piège :** le format donné à `strptime()` doit correspondre EXACTEMENT à la chaîne reçue (mêmes séparateurs, même ordre) ; un format qui ne correspond pas lève une `ValueError`, pas un résultat approximatif.

## Sérialiser une date : `.isoformat()`/`.fromisoformat()`

[JSON](/?c=infrastructure&p=json) n'a pas de type date natif : une date doit donc être convertie en chaîne pour être stockée ou transmise, puis reconvertie à la lecture.

```python
from datetime import date

aujourdhui = date(2026, 9, 15)

aujourdhui.isoformat()                    # "2026-09-15" -> format fixe AAAA-MM-JJ
date.fromisoformat("2026-09-15")          # date(2026, 9, 15) -> opération inverse
```

Contrairement à `strftime()`/`strptime()`, `isoformat()`/`fromisoformat()` n'exigent aucun code de format (`%Y`, `%m`...) : le format est toujours le même (AAAA-MM-JJ), ce qui les rend plus simples pour ce cas précis, mais inutilisables dès qu'un format différent est nécessaire.

> **Bonne pratique :** utiliser `isoformat()`/`fromisoformat()` pour stocker une date dans un fichier JSON ou une base de données, plutôt que `strftime()`/`strptime()` avec un format à retenir et faire correspondre partout où la date est lue.

## `datetime.now()` vs `time.time()`

```python
import time

# 1798819927.123456 -> nombre BRUT de secondes depuis le 1er janvier 1970 (epoch Unix)
time.time()
datetime.now()   # 2026-09-01 14:32:07.123456 -> objet avec année/mois/jour... déjà décomposés
```

`time.time()` convient pour mesurer une DURÉE (différence entre deux appels) ; `datetime` convient dès qu'il faut afficher, comparer ou décomposer une date/heure lisible. Voir aussi [`sorted()` sur des chaînes](/?c=langages-de-programmation&s=python&p=listes-et-tuples) pour trier des horodatages écrits au format `%Y-%m-%d...` sans passer par `datetime` du tout.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `datetime.now()` donne la date/heure actuelle sous forme d'objet décomposé (année, mois, jour...). `.strftime()` le formate en chaîne à partir de codes (`%Y`, `%m`...), `.strptime()` fait l'inverse. `.isoformat()`/`.fromisoformat()` font la même chose, sans code de format, pour sérialiser une date (ex. en JSON). |
| **Outils utilisables** | `datetime.now()`, `datetime(annee, mois, jour)`, `.strftime(format)`, `.strptime(chaine, format)`, `.isoformat()`/`date.fromisoformat()`, `time.time()` pour une simple durée. |
| **Pièges à éviter** | Un format `strptime()` qui ne correspond pas exactement à la chaîne reçue lève une `ValueError`, sans résultat approximatif. |
| **Bonnes pratiques** | Utiliser `datetime` pour tout ce qui doit être affiché/comparé comme une date ; réserver `time.time()` à une mesure de durée brute. `isoformat()`/`fromisoformat()` plutôt que `strftime()`/`strptime()` pour stocker une date (JSON, base de données). |
