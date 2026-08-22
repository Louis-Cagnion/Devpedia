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

Un outil de property-based testing (par exemple [fast-check](https://fast-check.dev) en JavaScript, [Hypothesis](https://hypothesis.readthedocs.io) en Python, ou [QuickCheck](https://hackage.haskell.org/package/QuickCheck), l'outil historique du domaine en Haskell) génère ensuite automatiquement des centaines d'entrées aléatoires respectant les contraintes données, et vérifie la propriété sur chacune.

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

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le property-based testing décrit une propriété valable pour n'importe quelle entrée, plutôt que de vérifier des exemples choisis à la main ; un outil génère automatiquement des centaines d'entrées pour tenter de la contredire, et réduit (shrinking) tout contre-exemple trouvé vers le cas le plus simple possible. |
| **Outils utilisables** | fast-check (JavaScript), Hypothesis (Python), QuickCheck (Haskell, l'outil historique du domaine). |
| **Pièges à éviter** | Forcer une propriété sur un comportement qui n'a pas de règle générale simple. |
| **Bonnes pratiques** | Réserver le property-based testing aux comportements avec une règle générale claire (fonctions mathématiques, tri, parseurs) ; garder des tests classiques pour la logique métier riche en cas particuliers. |
