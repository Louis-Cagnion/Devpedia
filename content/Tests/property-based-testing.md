---
order: 10
---

# Le property-based testing

Tous les tests vus jusqu'ici (tests [unitaires](/?c=tests&p=tests-unitaires), [d'intégration](/?c=tests&p=tests-dintegration), [E2E](/?c=tests&p=tests-end-to-end)) partagent un même principe : choisir des exemples précis d'entrées, et vérifier le résultat attendu pour chacun. Le **property-based testing** inverse cette logique : au lieu de choisir les entrées soi-même, on décrit une **propriété** qui doit rester vraie pour n'importe quelle entrée valide, et un outil génère automatiquement des centaines d'entrées pour tenter de la contredire.

## Un test classique, exemple par exemple

Un test unitaire classique vérifie un nombre fini de cas choisis à la main :

```text
test "additionner(2, 3) == 5"
test "additionner(-1, 1) == 0"
test "additionner(0, 0) == 0"
```

Ces trois tests passent, mais ne disent rien sur ce qui se passe pour `additionner(1000000, -999999)`, ou pour n'importe quelle autre combinaison non explicitement testée : un bug caché dans un cas non choisi par la personne qui écrit le test reste invisible.

## Une propriété : ce qui doit toujours être vrai

Une **propriété** décrit une règle générale, valable pour n'importe quelle entrée respectant certaines contraintes, plutôt qu'un résultat précis pour une entrée précise :

```text
Propriété : "additionner est commutative"
  Pour tout a et b : additionner(a, b) == additionner(b, a)

Propriété : "trier une liste ne change pas sa taille"
  Pour toute liste L : taille(trier(L)) == taille(L)

Propriété : "trier deux fois donne le même résultat que trier une fois"
  Pour toute liste L : trier(trier(L)) == trier(L)
```

Un outil de property-based testing (par exemple [fast-check](https://fast-check.dev) en [JavaScript](/?c=langages&s=javascript&p=javascript), [Hypothesis](https://hypothesis.readthedocs.io) en [Python](/?c=langages&s=python&p=python), ou [QuickCheck](https://hackage.haskell.org/package/QuickCheck), l'outil historique du domaine en Haskell) génère ensuite automatiquement des centaines d'entrées aléatoires respectant les contraintes données, et vérifie la propriété sur chacune.

```text
Test property-based pour "trier ne change pas la taille" :

  répéter 200 fois :
    générer une liste aléatoire L (taille et contenu variables)
    vérifier que taille(trier(L)) == taille(L)

  -> si un seul cas généré casse la propriété, le test échoue
     et signale la liste exacte qui a posé problème
```

## Trouver un contre-exemple minimal (shrinking)

Quand un outil de property-based testing trouve une entrée qui casse la propriété, il ne s'arrête pas là : il tente de la **réduire** (*shrinking*) vers le plus petit contre-exemple possible qui reproduit encore le bug, pour faciliter le diagnostic.

```text
Contre-exemple trouvé initialement :
  L = [47, -12, 999, 3, -5, 0, 812, ...] (liste de 50 éléments)

Après réduction (shrinking) :
  L = [1, 0] (2 éléments, bug toujours reproduit)

-> bien plus facile à comprendre et corriger que la liste initiale
```

## Quand choisir cette approche

Le property-based testing ne remplace pas les tests classiques, il les complète, en particulier sur du code où une **règle générale** est plus facile à formuler qu'une liste de cas précis : fonctions mathématiques, algorithmes de tri ou d'encodage/décodage, parseurs, structures de données.

> **Piège :** essayer d'écrire une propriété pour un comportement qui n'a en réalité pas de règle générale simple (une logique métier avec de nombreux cas particuliers arbitraires). Forcer une propriété là où elle ne convient pas produit une règle si compliquée qu'elle devient elle-même sujette à erreur.
>
> **Bonne pratique :** réserver le property-based testing aux comportements qui obéissent réellement à une règle générale simple à énoncer ; garder des tests classiques par exemple pour la logique métier riche en cas particuliers.

## Un cas voisin : le test différentiel

Quand on réécrit un algorithme existant (implémentation plus rapide, changement de structure de données...), on n'a pas toujours de propriété générale simple à formuler. Le **test différentiel** compare alors directement les deux implémentations sur beaucoup d'entrées générées : l'ancienne sert de référence, et tout désaccord entre les deux résultats signale un bug dans la réécriture.

Exemple vécu sur le solveur SAT Skyscraper (voir [Encoder un problème en SAT](/?c=fondamentaux&s=algorithmes&p=encodages-sat)) : en passant des clauses implicites énumérées à retrouvées par calcul, la réécriture a été validée à deux niveaux : l'ensemble exact des clauses retirées comparé à l'ancien ensemble énuméré, puis l'accord « solution trouvée / pas de solution » entre les deux versions sur 700 grilles.

```python
def tri_ancien(xs):
    """Ancienne implémentation : tri par sélection (correcte mais lente)."""
    xs = list(xs)
    for i in range(len(xs)):
        m = i
        for j in range(i + 1, len(xs)):
            if xs[j] < xs[m]:
                m = j
        xs[i], xs[m] = xs[m], xs[i]
    return xs

def tri_nouveau(xs):
    """Réécriture à valider : tri natif de Python (Timsort)."""
    return sorted(xs)
```

Exécuté sur 500 listes aléatoires (longueurs de 0 à 20, valeurs de -50 à 50), en comparant `tri_ancien(xs) != tri_nouveau(xs)` à chaque tirage : sortie réelle `0 desaccord(s) sur 500 entrees generees`.

| Property-based testing | Test différentiel |
|---|---|
| Compare le résultat à une **propriété générale** énoncée à la main | Compare le résultat à une **autre implémentation** (l'ancienne version) |
| Utile même sans version précédente à comparer | Sert spécifiquement à valider une réécriture |
| Demande de formuler une règle vraie pour toute entrée valide | Demande seulement que l'ancienne implémentation reste disponible comme référence |

> **Piège :** le test différentiel ne détecte pas un bug présent dans les deux implémentations : elles seraient d'accord, à tort. Il valide une réécriture par rapport à l'existant, pas l'existant par rapport à la spécification.
>
> **Bonne pratique :** générer beaucoup d'entrées, en incluant des cas limites (liste vide, valeurs répétées, tailles extrêmes) ; combiner avec un test contre la spécification quand elle existe.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le property-based testing décrit une propriété valable pour n'importe quelle entrée, plutôt que de vérifier des exemples choisis à la main ; un outil génère automatiquement des centaines d'entrées pour tenter de la contredire, et réduit (shrinking) tout contre-exemple trouvé vers le cas le plus simple possible. Le test différentiel, un cas voisin, compare plutôt le résultat d'une réécriture à celui de l'ancienne implémentation sur beaucoup d'entrées générées. |
| **Outils utilisables** | fast-check (JavaScript), Hypothesis (Python), QuickCheck (Haskell, l'outil historique du domaine) ; test différentiel : aucun outil dédié requis, un script de comparaison suffit. |
| **Pièges à éviter** | Forcer une propriété sur un comportement qui n'a pas de règle générale simple ; croire qu'un accord entre deux implémentations en test différentiel prouve l'absence de bug partagé par les deux. |
| **Bonnes pratiques** | Réserver le property-based testing aux comportements avec une règle générale claire (fonctions mathématiques, tri, parseurs) ; garder des tests classiques pour la logique métier riche en cas particuliers ; en test différentiel, générer aussi des cas limites et combiner avec un test contre la spécification quand elle existe. |
