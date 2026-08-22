---
order: 4
---

# Les tests unitaires

La [pyramide de test](/?c=tests&p=pyramide-de-test) place les tests unitaires à sa base : les plus nombreux, les plus rapides, les moins chers à maintenir. Ce chapitre détaille concrètement ce que ce niveau vérifie, et comment écrire un test unitaire qui reste utile dans la durée.

## Une unité, une responsabilité

Un test unitaire vérifie une **unité** de code isolée du reste du programme, le plus souvent une seule fonction ou une seule méthode. « Isolée » signifie qu'aucune dépendance externe réelle (base de données, réseau, système de fichiers) n'intervient : ces dépendances sont remplacées par des [test doubles](/?c=tests&p=architecture-de-test) quand la fonction en a besoin.

```text
Fonction testée : calculerRemise(prix, pourcentage)

Test unitaire :
  entrée : prix=100, pourcentage=10
  résultat attendu : 90
  -> aucune base de données, aucun réseau, aucun fichier impliqué
```

## Le triptyque Arrange / Act / Assert

La grande majorité des tests unitaires suivent la même structure en trois temps, quel que soit le langage ou l'outil de test utilisé :

| Étape | Rôle |
|---|---|
| **Arrange** (préparer) | Mettre en place les données et l'état nécessaires au test |
| **Act** (agir) | Appeler la fonction ou la méthode testée |
| **Assert** (vérifier) | Comparer le résultat obtenu au résultat attendu |

```text
test "calculerRemise applique correctement un pourcentage" :
  // Arrange
  prix = 100
  pourcentage = 10

  // Act
  resultat = calculerRemise(prix, pourcentage)

  // Assert
  verifier que resultat == 90
```

Cette structure rend un test lisible d'un seul coup d'œil, même pour quelqu'un qui ne l'a pas écrit : où sont les données de départ, quelle action est testée, quel résultat est attendu.

> **Piège :** mélanger plusieurs "Act" dans un seul test (appeler plusieurs fonctions différentes avant de vérifier). Si le test échoue, impossible de savoir laquelle des actions est en cause sans déboguer.
>
> **Bonne pratique :** un test unitaire vérifie un seul comportement précis ; s'il faut tester plusieurs comportements d'une même fonction, écrire plusieurs tests distincts plutôt qu'un seul test qui fait tout.

## Un nom de test qui documente le comportement

Le nom d'un test unitaire sert de documentation vivante : il doit décrire le comportement attendu, pas seulement la fonction appelée.

```text
Nom peu utile  :  test_calculerRemise()

Nom utile      :  test_calculerRemise_applique_correctement_un_pourcentage()
                   test_calculerRemise_renvoie_zero_pour_un_pourcentage_de_100
                   test_calculerRemise_leve_une_erreur_pour_un_pourcentage_negatif
```

Un rapport d'exécution qui liste les tests en échec devient alors lisible directement par son nom, sans avoir à ouvrir le code du test pour comprendre ce qui a cassé.

## Couvrir les cas limites, pas seulement le cas nominal

Un test unitaire qui ne vérifie que le cas normal (le *happy path*) laisse passer les comportements aux limites : une valeur à zéro, une liste vide, une valeur négative là où seule une valeur positive était prévue.

```text
Fonction testée : calculerRemise(prix, pourcentage)

Cas à couvrir :
  - cas nominal      : pourcentage=10  -> remise appliquée normalement
  - limite basse     : pourcentage=0   -> aucune remise, prix inchangé
  - limite haute     : pourcentage=100 -> résultat à zéro
  - cas invalide      : pourcentage=-5  -> comportement attendu à définir
                                            (erreur ? valeur par défaut ?)
```

> **Piège :** se contenter d'un seul test sur le cas nominal et considérer la fonction "testée". La plupart des bugs réels se cachent dans les cas limites, jamais exercés par un unique test heureux.
>
> **Bonne pratique :** pour chaque fonction testée, lister explicitement ses cas limites (valeurs à zéro, vides, négatives, maximales) avant d'écrire les tests, plutôt que de les découvrir après coup en production.

## Un test qui échoue pour une seule raison

Un test unitaire bien conçu échoue pour une seule cause possible : le comportement qu'il vérifie n'est plus correct. Un test qui dépend de l'ordre d'exécution d'autres tests, d'un état global partagé, ou de l'heure système, peut échouer sans lien avec un vrai bug : c'est un test **fragile** (*flaky*), qui érode la confiance de l'équipe dans l'ensemble de la suite de tests.

> **Piège :** un test qui passe ou échoue de façon incohérente d'une exécution à l'autre, sans changement de code. Une équipe qui rencontre ça régulièrement finit par ignorer les échecs de tests par réflexe, ce qui annule l'intérêt même d'avoir des tests.
>
> **Bonne pratique :** traiter un test fragile comme un bug à corriger en priorité, pas comme une gêne à contourner (relancer le test jusqu'à ce qu'il passe, par exemple), car un test auquel on ne fait plus confiance ne sert plus à rien.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un test unitaire vérifie une seule unité de code isolée, généralement selon la structure Arrange/Act/Assert. Son nom documente le comportement attendu. Il doit couvrir les cas limites, pas seulement le cas nominal, et échouer pour une seule cause possible. |
| **Outils utilisables** | La structure Arrange/Act/Assert pour organiser un test. Une liste explicite de cas limites (zéro, vide, négatif, maximal) avant d'écrire les tests. |
| **Pièges à éviter** | Mélanger plusieurs actions dans un seul test. Ne couvrir que le cas nominal. Laisser un test fragile (flaky) sans le corriger. |
| **Bonnes pratiques** | Un test = un comportement vérifié. Nommer un test d'après le comportement qu'il vérifie. Lister les cas limites avant d'écrire les tests. Corriger un test fragile en priorité plutôt que de le contourner. |
