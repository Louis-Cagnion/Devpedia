---
order: 3
---

# Architecture d'une suite de tests

Écrire un test isolé est simple ; en garder des centaines lisibles, fiables et faciles à faire évoluer l'est beaucoup moins. Ce chapitre couvre comment organiser une **suite de tests** (l'ensemble des tests d'un projet) pour qu'elle reste maintenable dans la durée, quel que soit le niveau de la pyramide de test concerné.

## Où ranger les tests : miroir du code source

La convention la plus répandue est de faire correspondre l'arborescence des tests à celle du code source, un fichier de test par fichier de code, dans un dossier séparé (souvent nommé `tests/` ou `__tests__/`) :

```text
source/
  users/
    authentification.js
    profil.js
tests/
  users/
    authentification.test.js
    profil.test.js
```

Cette organisation permet de retrouver immédiatement les tests d'un fichier donné, et rend visible d'un coup d'œil le code qui n'a aucun test associé (un fichier source sans fichier de test miroir).

## Fixtures : préparer un état de départ commun

Une **fixture** est un état préparé à l'avance (des données, une configuration, une connexion) que plusieurs tests réutilisent, pour éviter de recréer ce contexte à chaque fois.

```text
Sans fixture (répété dans chaque test) :
  test "peut modifier son profil" :
    créer un utilisateur "alice@exemple.fr"
    connecter cet utilisateur
    modifier son profil
    vérifier le changement

Avec fixture (préparée une fois, réutilisée) :
  fixture "utilisateur_connecte" :
    créer un utilisateur "alice@exemple.fr"
    connecter cet utilisateur

  test "peut modifier son profil" (utilise fixture "utilisateur_connecte") :
    modifier son profil
    vérifier le changement
```

> **Piège :** des fixtures qui se contaminent entre tests, par exemple une base de données de test qui garde les données laissées par un test précédent. Un test qui dépend de l'ordre d'exécution des autres devient imprévisible.
>
> **Bonne pratique :** chaque test doit repartir d'un état propre et prévisible, généralement en recréant la fixture avant chaque test plutôt qu'en la réutilisant telle quelle entre eux.

## Test doubles : mocks, stubs et fakes

Un **test double** est un remplaçant factice d'une dépendance réelle (une base de données, une API externe, l'heure système), utilisé pour isoler ce qu'on teste vraiment. Le terme regroupe plusieurs variantes, souvent confondues :

| Terme | Rôle |
|---|---|
| **Stub** | Renvoie une réponse fixe et prédéfinie, sans logique (« quand on l'appelle, renvoie toujours ce résultat ») |
| **Mock** | Comme un stub, mais vérifie en plus *comment* il a été utilisé (a-t-il été appelé, avec quels arguments, combien de fois) |
| **Fake** | Une implémentation simplifiée mais fonctionnelle (ex. une base de données en mémoire à la place d'une vraie base de données) |

```text
Stub : "getUtilisateur(id) renvoie toujours {nom: 'Alice'}"
Mock : "getUtilisateur a bien été appelé une fois, avec id=42"
Fake : une vraie petite base de données en mémoire, qui se comporte
       comme la vraie mais sans fichier ni serveur à installer
```

> **Piège :** sur-utiliser les mocks au point que le test ne vérifie plus que « le code appelle bien les bonnes fonctions », sans jamais vérifier un vrai résultat métier.
>
> **Bonne pratique :** réserver les test doubles aux dépendances vraiment coûteuses ou peu fiables à utiliser telles quelles dans un test (réseau, temps, aléatoire) ; garder la vraie logique du programme testé, jamais la simuler elle-même.

## Environnements de test

Un projet fait généralement tourner ses tests dans un **environnement** séparé de la production : une base de données de test, des identifiants factices, parfois des services externes eux-mêmes simulés. Séparer ces environnements évite qu'un test échoué ou mal écrit n'affecte des données réelles, et rend les résultats reproductibles indépendamment de l'état changeant de la production.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une suite de tests maintenable reflète l'arborescence du code source, utilise des fixtures pour préparer un état de départ propre et reproductible, et des test doubles (stub, mock, fake) pour isoler les dépendances coûteuses ou peu fiables. |
| **Outils utilisables** | Aucun outil concret à ce stade : les chapitres suivants sur chaque niveau de test (unitaire, intégration, E2E) aborderont des outils précis. |
| **Pièges à éviter** | Des fixtures qui se contaminent entre tests. Sur-utiliser les mocks au point de ne plus tester la vraie logique. |
| **Bonnes pratiques** | Repartir d'un état propre à chaque test. Réserver les test doubles aux dépendances vraiment coûteuses (réseau, temps, aléatoire). |
