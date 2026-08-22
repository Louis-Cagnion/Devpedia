---
order: 1
---

# Vocabulaire des tests logiciels (QA, ISTQB)

Avant d'écrire le moindre test, il faut un vocabulaire commun : sans lui, « tester le code » peut vouloir dire dix choses différentes selon la personne qui parle. Ce chapitre pose les termes que le reste de la section réutilisera, en s'appuyant sur ceux normalisés par l'**ISTQB** (*International Software Testing Qualifications Board*), l'organisme de référence qui certifie les testeurs et harmonise ce vocabulaire dans l'industrie. **QA** (*Quality Assurance*, assurance qualité) désigne, plus largement, l'ensemble des activités visant à garantir la qualité d'un logiciel, dont les tests ne sont qu'une partie.

## Les briques de base d'un test

| Terme | Définition |
|---|---|
| **Cas de test** (*test case*) | Une situation précise à vérifier : une entrée donnée, une action, et le résultat attendu |
| **Plan de test** (*test plan*) | Le document qui décrit la stratégie de test globale : quoi tester, avec quels moyens, dans quel ordre |
| **Jeu de données de test** (*test data*) | Les valeurs concrètes utilisées pour exécuter un cas de test (ex. un email valide, un email mal formé) |
| **Résultat attendu** (*expected result*) | Ce que le programme est censé produire si tout fonctionne correctement, défini avant l'exécution du test |
| **Résultat obtenu** (*actual result*) | Ce que le programme produit réellement à l'exécution, comparé au résultat attendu pour juger si le test passe |

```text
Cas de test : "Connexion avec un mot de passe correct"
  Jeu de données : email="alice@exemple.fr", mot de passe="bonMotDePasse123"
  Action : soumettre le formulaire de connexion
  Résultat attendu : redirection vers le tableau de bord
  Résultat obtenu : (constaté à l'exécution, comparé à l'attendu)
```

> **Piège :** écrire un cas de test sans résultat attendu précis (« vérifier que ça marche »). Sans référence claire, impossible de dire objectivement si le test a réussi ou échoué.
>
> **Bonne pratique :** toujours formuler le résultat attendu avant d'exécuter le test, jamais après avoir regardé ce que le programme a produit.

## Passer ou échouer, et ce qui s'ensuit

Un cas de test **passe** (*pass*) quand le résultat obtenu correspond au résultat attendu, et **échoue** (*fail*) sinon. Un échec ne veut pas automatiquement dire « bug dans le programme » : le test lui-même peut être mal écrit (mauvais résultat attendu, jeu de données invalide).

| Terme | Définition |
|---|---|
| **Anomalie / bug** (*defect*) | Un écart confirmé entre le comportement du programme et son comportement voulu, généralement suivi dans un outil de suivi (ticket) |
| **Non-régression** (*regression*) | Le fait qu'une modification du code casse un comportement qui fonctionnait auparavant ; un **test de non-régression** est un test rejoué après chaque changement pour détecter ce cas |
| **Critère de sortie** (*exit criteria*) | La condition qui définit qu'une phase de test est terminée (ex. « 100% des cas de test critiques passent », « couverture de code ≥ 80% ») |

> **Piège :** considérer qu'un test qui échoue est forcément un bug à corriger dans le programme. Le test lui-même peut être en tort (résultat attendu erroné, jeu de données mal choisi).
>
> **Bonne pratique :** avant de corriger le programme, vérifier que le test échoue pour la bonne raison en relisant son résultat attendu et son jeu de données.

## Qui écrit et exécute les tests

| Terme | Définition |
|---|---|
| **Test manuel** | Un humain exécute les étapes du cas de test à la main et compare le résultat lui-même |
| **Test automatisé** | Un programme exécute le cas de test et compare automatiquement le résultat obtenu au résultat attendu |
| **Testeur** (*tester*) | La personne (ou l'équipe) responsable de concevoir et exécuter les tests, distincte des développeurs sur les projets qui ont ce rôle dédié |

Sur beaucoup d'équipes actuelles, les développeurs écrivent eux-mêmes une bonne partie des tests automatisés (notamment les tests unitaires, vus dans un chapitre à venir) ; le rôle de testeur dédié se concentre alors sur les tests qui demandent un regard extérieur ou une vision d'ensemble du produit.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'ISTQB normalise le vocabulaire des tests logiciels ; QA désigne plus largement l'ensemble des activités d'assurance qualité. Un cas de test compare un résultat obtenu à un résultat attendu défini à l'avance. Un test qui échoue n'est pas forcément un bug dans le programme. |
| **Outils utilisables** | Aucun outil pratique à ce stade : ce chapitre pose le vocabulaire, les chapitres suivants aborderont la pyramide de test et l'architecture de test. |
| **Pièges à éviter** | Écrire un cas de test sans résultat attendu précis. Corriger le programme avant d'avoir vérifié que le test lui-même est correct. |
| **Bonnes pratiques** | Formuler le résultat attendu avant d'exécuter le test. Vérifier le test avant de corriger le programme en cas d'échec. |
