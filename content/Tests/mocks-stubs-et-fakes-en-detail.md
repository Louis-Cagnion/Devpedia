---
order: 9
---

# Mocks, stubs et fakes en détail

Le chapitre sur l'[architecture de test](/?c=tests&p=architecture-de-test) a introduit les test doubles (stub, mock, fake) en une phrase chacun. Ce chapitre creuse leurs différences pratiques, et surtout le piège le plus courant de leur usage : la sur-simulation.

## Trois familles, trois usages

| Test double | Répond à | Vérifie |
|---|---|---|
| **Stub** | « Que doit renvoyer cette dépendance ? » | Rien : juste une réponse fixe, imposée par le test |
| **Mock** | « Cette dépendance a-t-elle été utilisée correctement ? » | Le fait qu'un appel a bien eu lieu, avec quels arguments, combien de fois |
| **Fake** | « Comment se comporterait une vraie version simplifiée ? » | Rien directement : c'est une implémentation qui se comporte presque comme la vraie |

```text
Fonction testée : envoyerNotification(utilisateur, service)

Avec un stub :
  service = { envoyer: () => "ok" }
  -> le test vérifie ce que fait envoyerNotification() avec cette
     réponse fixe, sans se soucier de comment service.envoyer()
     a été appelé

Avec un mock :
  service = mock du service, qui enregistre chaque appel
  -> le test vérifie ensuite : service.envoyer a-t-il été appelé
     une fois, avec l'utilisateur attendu en paramètre ?

Avec un fake :
  service = une implémentation en mémoire qui stocke réellement
  les notifications envoyées, sans jamais toucher au réseau
  -> le test peut relire la liste des notifications "envoyées"
     comme le ferait le vrai service
```

## Test basé sur l'état vs test basé sur l'interaction

Cette distinction reflète deux façons différentes de vérifier un comportement :

| Approche | Ce qu'elle regarde |
|---|---|
| **Basée sur l'état** (stub, fake) | Le résultat final : qu'est-ce que la fonction a produit ou changé ? |
| **Basée sur l'interaction** (mock) | Le déroulement : quelles dépendances ont été appelées, et comment ? |

Un test basé sur l'état reste valable même si l'implémentation change de façon interne (tant que le résultat final ne change pas) ; un test basé sur l'interaction, lui, casse dès que l'implémentation change sa façon d'appeler ses dépendances, même si le résultat final reste identique.

> **Piège :** utiliser un mock pour vérifier un détail d'implémentation qui n'a pas d'importance réelle (l'ordre exact de deux appels indépendants, par exemple). Le test devient alors couplé à une décision d'implémentation arbitraire, et casse au moindre refactoring qui ne change pourtant rien au comportement observable.
>
> **Bonne pratique :** préférer un test basé sur l'état chaque fois que le résultat final suffit à vérifier le comportement ; réserver le mock aux cas où l'interaction elle-même est le comportement à vérifier (ex. « un e-mail a bien été envoyé », où il n'existe pas d'autre résultat observable que l'appel lui-même).

## La sur-simulation : le piège le plus courant

Remplacer par un test double **chaque** dépendance d'une fonction, y compris celles qui pourraient rester réelles sans coût, produit un test qui ne vérifie plus grand-chose : il confirme seulement que le code appelle les bonnes fonctions dans le bon ordre, jamais qu'il produit un résultat correct.

```text
Fonction testée : calculerTotal(panier) qui utilise
  - une fonction interne appliquerRemise() (pure, aucune
    dépendance externe)
  - un service externe tauxDeChange()

Sur-simulation :
  mocker aussi appliquerRemise() -> le test ne vérifie plus si
  la remise est correctement appliquée, seulement qu'elle a
  été "appelée"

Bon dosage :
  garder appliquerRemise() réelle (pas de dépendance externe,
  rapide, déterministe), ne mocker que tauxDeChange()
  (dépendance externe, potentiellement lente ou non déterministe)
```

> **Piège :** simuler une dépendance uniquement parce qu'elle est appelée par la fonction testée, sans se demander si elle a réellement besoin de l'être (réseau, temps, aléatoire) ou si elle pourrait rester le vrai code.
>
> **Bonne pratique :** ne remplacer par un test double que les dépendances réellement coûteuses ou non déterministes à utiliser telles quelles dans un test ; garder le code interne, pur et déterministe, tel quel dans le test.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un stub renvoie une réponse fixe, un mock vérifie comment il a été appelé, un fake est une implémentation simplifiée mais fonctionnelle. Un test basé sur l'état reste stable face au refactoring interne ; un test basé sur l'interaction (mock) y est plus sensible. La sur-simulation (mocker des dépendances internes pures) produit des tests qui ne vérifient plus le comportement réel. |
| **Outils utilisables** | Un stub/fake pour un test basé sur l'état. Un mock uniquement quand l'interaction elle-même est le comportement à vérifier. |
| **Pièges à éviter** | Utiliser un mock pour un détail d'implémentation sans importance réelle. Simuler une dépendance qui pourrait rester réelle sans coût (code interne, pur, déterministe). |
| **Bonnes pratiques** | Préférer un test basé sur l'état quand le résultat final suffit. Ne mocker que les dépendances réellement coûteuses ou non déterministes. |
