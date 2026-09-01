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
maintenant.strftime("%Y-%m-%d_%H%M%S")  # "2026-09-01_143207" -> format compact, utilisable dans un nom de fichier
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
datetime.strptime("2026-09-01_143207", "%Y-%m-%d_%H%M%S")  # opération INVERSE de strftime, même table de codes
```

> **Piège :** le format donné à `strptime()` doit correspondre EXACTEMENT à la chaîne reçue (mêmes séparateurs, même ordre) ; un format qui ne correspond pas lève une `ValueError`, pas un résultat approximatif.

## `datetime.now()` vs `time.time()`

```python
import time

time.time()      # 1798819927.123456 -> nombre BRUT de secondes depuis le 1er janvier 1970 (epoch Unix)
datetime.now()   # 2026-09-01 14:32:07.123456 -> objet avec année/mois/jour... déjà décomposés
```

`time.time()` convient pour mesurer une DURÉE (différence entre deux appels) ; `datetime` convient dès qu'il faut afficher, comparer ou décomposer une date/heure lisible. Voir aussi [`sorted()` sur des chaînes](/?c=langages-de-programmation&s=python&p=listes-et-tuples) pour trier des horodatages écrits au format `%Y-%m-%d...` sans passer par `datetime` du tout.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `datetime.now()` donne la date/heure actuelle sous forme d'objet décomposé (année, mois, jour...). `.strftime()` le formate en chaîne à partir de codes (`%Y`, `%m`...), `.strptime()` fait l'inverse. |
| **Outils utilisables** | `datetime.now()`, `datetime(annee, mois, jour)`, `.strftime(format)`, `.strptime(chaine, format)`, `time.time()` pour une simple durée. |
| **Pièges à éviter** | Un format `strptime()` qui ne correspond pas exactement à la chaîne reçue lève une `ValueError`, sans résultat approximatif. |
| **Bonnes pratiques** | Utiliser `datetime` pour tout ce qui doit être affiché/comparé comme une date ; réserver `time.time()` à une mesure de durée brute. |
