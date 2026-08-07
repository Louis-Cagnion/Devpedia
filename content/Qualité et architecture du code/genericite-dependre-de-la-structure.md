---
order: 5
---

# Généricité : dépendre de la structure plutôt que de valeurs figées

Un code qui fonctionne aujourd'hui peut malgré tout être fragile s'il dépend de valeurs propres à un cas particulier — un identifiant précis, un nom de site, une valeur qui n'existe que dans le jeu de données actuel — plutôt que de la **forme** générale des données qu'il reçoit. Le symptôme n'apparaît pas tout de suite : le code casse silencieusement, ou doit être modifié à la main, dès que les données changent ou proviennent d'une source différente.

## Le symptôme

```python
def report_groups_for(site):
    if site == "leboncoin":
        return ["leboncoin"]
    elif site == "lacentrale":
        return ["lacentrale-espacevo"]
    elif site == "espacevo":
        return ["lacentrale-espacevo"]
    elif site == "vivacar":
        return ["vivacar"]
    elif site == "zoomcar":
        return ["zoomcar"]
```

Cette fonction ne dépend d'aucune structure : elle encode, en dur, une connaissance qui existe déjà ailleurs dans le code (quel site appartient à quel groupe de rapport). Ajouter un site suppose de se souvenir de venir compléter cette liste, en plus de toute autre liste similaire ailleurs — un problème de [source unique de vérité](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) qui se traite ici à la racine, en dérivant le comportement de la structure des données plutôt que de valeurs citées une à une.

## La version générique

Si l'information "quel groupe de rapport pour quel site" est déjà présente dans un registre centralisé (voir le chapitre sur la [source unique de vérité](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), la fonction n'a plus besoin de connaître aucun site par son nom :

```python
def report_groups_for(site):
    return [SITE_REGISTRY[site]["report_group"]]
```

Un nouveau site n'exige plus aucune modification de `report_groups_for` : ajouter son entrée au registre suffit, parce que la fonction lit la **structure** du registre plutôt que de réagir à des valeurs qu'elle connaît d'avance.

## Reconnaître le signal

Le signal d'alerte est un `if`/`elif`/`switch` dont chaque branche teste une valeur précise (un identifiant, un nom) qui existe déjà, sous une forme ou une autre, dans une donnée ou une structure accessible ailleurs dans le programme. Si cette structure existe déjà, la dupliquer sous forme de branches conditionnelles est un signe qu'elle devrait plutôt être consultée directement. Si elle n'existe pas encore, c'est souvent le signe qu'il faut la créer.

## La limite : ne pas généraliser un cas qui restera unique

Ce principe ne justifie pas de construire une structure générique pour un cas qui, par nature, ne connaîtra jamais qu'une seule valeur — un traitement réellement spécifique à un unique site n'a pas besoin d'un mécanisme de configuration généralisé, cela relèverait de la sur-ingénierie (YAGNI). La généricité se justifie quand le nombre de cas est amené à varier ; elle devient un coût inutile quand il ne varie structurellement pas.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un code qui teste des valeurs précises (`if site == "leboncoin"`) plutôt que de lire la structure des données déjà disponibles casse silencieusement dès que les données changent ou viennent d'ailleurs. |
| **Outils utilisables** | Dériver un comportement depuis un registre déjà centralisé, plutôt que de dupliquer sa connaissance sous forme de branches conditionnelles. |
| **Pièges à éviter** | Un `if`/`elif` dont chaque branche teste une valeur déjà présente dans une structure accessible ailleurs — signal qu'elle devrait être consultée directement. |
| **Bonnes pratiques** | Faire dépendre le code de la forme des données plutôt que de valeurs particulières, dès que le nombre de cas est amené à varier. |
