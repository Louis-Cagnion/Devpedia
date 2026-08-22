---
order: 3
---

# Éviter la répétition : structures indexées plutôt que du code dupliqué

Un signe classique de code qui va devenir pénible à maintenir : la même instruction, répétée une fois par élément d'un ensemble, avec seulement une ou deux valeurs qui changent d'une répétition à l'autre.

## Le symptôme

```python
parser.add_argument("--profile-dir", default=str(Path.home() / ".scraper_profile"))
parser.add_argument("--headless", action="store_true")
parser.add_argument("--site", choices=["leboncoin", "lacentrale", "vivacar", "zoomcar"])
parser.add_argument("--output", default="rapports/rapport.txt")
# ... une dizaine d'autres, chacune sur son propre appel
```

Chaque ligne se ressemble, mais ajouter une option, en supprimer une, ou changer un comportement commun à toutes (par exemple, valider un type) oblige à répéter la même modification à chaque endroit, et il est facile d'en oublier une.

## La solution : une structure de données, parcourue par du code générique

Le principe : décrire chaque élément une seule fois, dans une structure de données (liste, dictionnaire), puis écrire **une seule** boucle ou fonction qui la parcourt et applique le même traitement à chacun.

```python
CLI_ARGUMENTS = [
    {"flag": "--profile-dir", "default": str(Path.home() / ".scraper_profile")},
    {"flag": "--headless", "action": "store_true"},
    {"flag": "--site", "choices": ["leboncoin", "lacentrale", "vivacar", "zoomcar"]},
    {"flag": "--output", "default": "rapports/rapport.txt"},
]

for arg in CLI_ARGUMENTS:
    flag = arg.pop("flag")
    parser.add_argument(flag, **arg)
```

Ajouter une option devient une entrée dans une liste, pas une nouvelle ligne de code à écrire selon le même patron que les précédentes. Un comportement commun (validation, valeur par défaut calculée, transformation) se change à un seul endroit (la boucle) au lieu d'être répété dans chaque appel.

## Un cas plus subtil : le dispatch

La même idée s'applique quand la répétition porte sur une condition plutôt que sur un appel de fonction :

```python
# Avant : une branche par cas, à maintenir en synchronisation avec la liste des sites
if site == "leboncoin":
    scraper = scrape_leboncoin
elif site == "lacentrale":
    scraper = scrape_lacentrale
elif site == "vivacar":
    scraper = scrape_vivacar
elif site == "zoomcar":
    scraper = scrape_zoomcar

# Après : un dictionnaire fait office de table de dispatch
SITE_SCRAPERS = {
    "leboncoin": scrape_leboncoin,
    "lacentrale": scrape_lacentrale,
    "vivacar": scrape_vivacar,
    "zoomcar": scrape_zoomcar,
}
scraper = SITE_SCRAPERS[site]
```

Le dictionnaire remplit exactement le même rôle que la chaîne de `if`/`elif`, mais ajouter un site revient à ajouter une entrée, sans toucher à la logique qui sélectionne le bon scraper.

## Où s'arrêter

Cette généralisation a un coût : une structure de données trop abstraite pour deux ou trois cas qui ne grandiront pas complique la lecture sans apporter de bénéfice réel (voir le principe [KISS](https://en.wikipedia.org/wiki/KISS_principle)/[YAGNI](https://martinfowler.com/bliki/Yagni.html)). Le seuil de bon sens : dès qu'on écrit la **troisième** répétition d'un même patron, c'est le bon moment pour la remplacer par une structure indexée ; avant, ce n'est souvent pas encore rentable.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une même instruction répétée pour chaque élément d'un ensemble (options CLI, `if`/`elif` par cas) doit s'appuyer sur une structure indexée (liste, dictionnaire) parcourue par du code générique : ajouter un élément devient modifier une donnée, pas ajouter du code. |
| **Outils utilisables** | Une liste de dictionnaires parcourue en boucle, un dictionnaire de dispatch à la place d'une chaîne `if`/`elif`. |
| **Pièges à éviter** | Généraliser dès la première ou la deuxième occurrence : une structure trop abstraite pour un cas qui ne grandira pas complique la lecture sans bénéfice réel. |
| **Bonnes pratiques** | Attendre la troisième répétition d'un même patron avant de le remplacer par une structure indexée. |
