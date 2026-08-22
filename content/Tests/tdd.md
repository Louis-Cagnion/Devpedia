---
order: 7
---

# Le TDD (Test-Driven Development)

Jusqu'ici, chaque type de test a été présenté comme une vérification écrite **après** le code, pour s'assurer qu'il fonctionne. Le **TDD** (*Test-Driven Development*, développement piloté par les tests) renverse cet ordre : le test s'écrit **avant** le code qu'il vérifie, et c'est ce test qui guide l'écriture du code, pas l'inverse.

## Le cycle rouge / vert / refactor

Le TDD s'organise en un cycle court, répété pour chaque petit morceau de comportement à ajouter :

| Étape | Couleur | Ce qui se passe |
|---|---|---|
| **1. Écrire un test qui échoue** | 🔴 Rouge | Le test décrit un comportement qui n'existe pas encore ; il échoue forcément, puisque le code n'existe pas |
| **2. Écrire le code minimal qui le fait passer** | 🟢 Vert | Juste assez de code pour que le test passe, sans anticiper des besoins futurs |
| **3. Améliorer le code sans changer son comportement** | 🔵 Refactor | Nettoyer, clarifier, éliminer la duplication ; les tests déjà écrits garantissent que le comportement reste identique |

```text
Cycle TDD pour "calculerRemise(prix, pourcentage)" :

1. Rouge    : écrire test_calculerRemise_applique_10_pourcent()
              -> échoue, la fonction n'existe pas encore

2. Vert     : écrire calculerRemise() avec le strict nécessaire
              pour faire passer CE test précis
              -> le test passe

3. Refactor : nettoyer le code si besoin (renommer une variable,
              simplifier un calcul), en relançant le test à chaque
              changement pour vérifier qu'il passe toujours
```

Ce cycle se répète ensuite pour le prochain comportement à ajouter (par exemple, gérer un pourcentage à zéro), chaque itération restant volontairement courte.

> **Piège :** écrire, à l'étape verte, plus de code que ce qui est strictement nécessaire pour faire passer le test en cours (anticiper un cas non encore testé). Le code non couvert par un test à ce stade reste non vérifié, malgré l'apparence de rigueur du TDD.
>
> **Bonne pratique :** à l'étape verte, écrire le code le plus simple possible qui fait passer le test, quitte à le généraliser plus tard, une fois qu'un nouveau test l'exige réellement.

## Pourquoi écrire le test en premier change quelque chose

Écrire le test avant le code oblige à répondre à une question précise avant de coder quoi que ce soit : quel est le résultat attendu, exactement, pour cette entrée précise ? Cette clarification a un effet direct sur la conception du code : une fonction pensée pour être testée facilement (entrées et sorties claires, peu de dépendances cachées) est aussi, en général, une fonction plus simple à comprendre et à réutiliser.

> **Piège :** croire que le TDD garantit à lui seul un code de bonne qualité, indépendamment de la réflexion de conception. Le TDD structure le rythme d'écriture, mais ne remplace pas les [critères de qualité de code](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) habituels (responsabilité unique, faible couplage).
>
> **Bonne pratique :** utiliser le TDD comme un outil parmi d'autres pour arriver à un code testable et bien conçu, pas comme une garantie automatique qui dispenserait de réfléchir à l'architecture.

## Le TDD n'est pas obligatoire pour avoir des tests

Écrire les tests après le code (l'ordre le plus courant, et celui implicitement suivi dans les chapitres précédents de cette section) reste parfaitement valable : le TDD est une **discipline d'écriture**, pas une condition pour qu'un test ait de la valeur. Certaines situations s'y prêtent mieux que d'autres : une règle métier bien comprise dès le départ se prête bien au TDD ; un problème encore flou, où l'exploration précède la compréhension du besoin, se prête souvent mieux à écrire d'abord une ébauche de code, puis les tests une fois le comportement stabilisé.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le TDD écrit le test avant le code, selon un cycle court rouge (test qui échoue) / vert (code minimal qui le fait passer) / refactor (nettoyage sans changer le comportement). Il structure la conception mais ne remplace pas les critères de qualité de code habituels. |
| **Outils utilisables** | Le cycle rouge/vert/refactor comme rythme d'écriture. |
| **Pièges à éviter** | Écrire plus de code que nécessaire à l'étape verte. Croire que le TDD garantit à lui seul un code bien conçu. |
| **Bonnes pratiques** | À l'étape verte, écrire le code le plus simple qui fait passer le test. Utiliser le TDD comme un outil parmi d'autres, pas une garantie automatique de qualité. |
