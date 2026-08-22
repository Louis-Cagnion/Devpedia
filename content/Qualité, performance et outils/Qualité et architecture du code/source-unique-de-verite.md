---
order: 4
---

# Source unique de vérité

Quand une même famille d'informations existe à deux endroits différents, les deux copies finissent (pas si un jour, mais quand) par diverger. Ce n'est pas une question de rigueur : dès qu'une mise à jour touche une copie sans que son auteur sache que l'autre existe, l'incohérence est déjà là, silencieusement.

## Le cas le plus visible : plusieurs structures parallèles

```python
SITE_LABELS = {
    "leboncoin": "Leboncoin",
    "lacentrale": "La Centrale Pro",
    "vivacar": "Vivacar",
}
SITE_SCRAPERS = {
    "leboncoin": scrape_leboncoin,
    "lacentrale": scrape_lacentrale,
    "vivacar": scrape_vivacar,
}
SITE_AD_SPEC_FETCHERS = {
    "leboncoin": fetch_leboncoin_specs,
    "lacentrale": fetch_lacentrale_specs,
    "vivacar": fetch_vivacar_specs,
}
```

Trois dictionnaires, tenus manuellement synchronisés par convention plutôt que par construction : ajouter un site suppose de se souvenir de mettre à jour les trois. En oublier un ne produit pas toujours une erreur immédiate : parfois juste un comportement silencieusement incomplet pour ce site, découvert bien plus tard.

La consolidation en une seule source règle le problème par construction :

```python
SITE_REGISTRY = {
    "leboncoin": {
        "label": "Leboncoin",
        "scraper": scrape_leboncoin,
        "ad_spec_fetcher": fetch_leboncoin_specs,
    },
    "lacentrale": {
        "label": "La Centrale Pro",
        "scraper": scrape_lacentrale,
        "ad_spec_fetcher": fetch_lacentrale_specs,
    },
    # ...
}
```

Ajouter un site est maintenant **une seule** entrée à ajouter, avec tout ce qui le concerne au même endroit : impossible d'en synchroniser que la moitié.

## Le cas moins visible : la duplication entre fichiers qui ne se référencent pas

La même famille d'informations dupliquée à travers plusieurs fichiers indépendants est plus difficile à repérer, car rien dans le code ne signale visuellement le lien entre les deux : un fichier de données (`boutiques.csv`) qui recense des identifiants, et un rapport généré séparément qui, lui, a découvert que certains de ces identifiants redirigent en réalité vers d'autres entrées déjà présentes. Le fichier de données ne "sait" pas ce que le rapport a découvert : les deux dérivent, jusqu'à ce qu'un audit manuel rapproche les deux et retire les entrées redondantes.

Ce cas ne se corrige pas toujours par une fusion de structures comme l'exemple précédent : parfois, la vraie source unique doit devenir un processus (un script qui régénère le fichier de données à partir du rapport, ou l'inverse) plutôt qu'une simple structure en mémoire : l'essentiel est qu'une des deux représentations dérive explicitement de l'autre, plutôt que les deux évoluant côte à côte sans lien.

## Le principe général

Avant de dupliquer une information (une constante, une liste d'identifiants, une configuration), la question à se poser : *si cette information change, combien d'endroits faut-il mettre à jour, et existe-t-il un mécanisme qui garantit qu'ils le seront tous ?* Si la réponse est "il faut s'en souvenir", la duplication est un risque, même si elle semble anodine au moment où elle est introduite.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une même famille d'informations dupliquée à deux endroits finit toujours par diverger : pas par manque de rigueur, mais dès qu'une mise à jour touche une copie sans que son auteur sache que l'autre existe. |
| **Outils utilisables** | Consolider plusieurs structures parallèles (synchronisées par convention) en une seule structure imbriquée (synchronisée par construction). |
| **Pièges à éviter** | Dupliquer une information entre plusieurs fichiers qui ne se référencent jamais entre eux : le lien n'est visible nulle part dans le code. |
| **Bonnes pratiques** | Se demander, avant toute duplication, combien d'endroits il faudrait mettre à jour si l'information change, et si un mécanisme garantit qu'ils le seront tous. |
