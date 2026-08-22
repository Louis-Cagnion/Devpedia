---
order: 2
---

# La pyramide de test

Un programme peut être testé à plusieurs niveaux : une seule fonction isolée, plusieurs composants qui travaillent ensemble, ou l'application entière depuis l'écran de l'utilisateur. Ces trois niveaux n'ont pas le même coût ni la même vitesse d'exécution, ce qui pose une vraie question d'organisation : combien de tests écrire à chaque niveau ? La **pyramide de test** est le modèle qui répond à cette question.

## Trois niveaux, trois compromis

| Niveau | Ce qu'il vérifie | Vitesse | Coût de maintenance |
|---|---|---|---|
| **Test unitaire** | Une seule fonction ou classe, isolée du reste du programme | Très rapide (millisecondes) | Faible : peu de code à ajuster si le test casse |
| **Test d'intégration** | Plusieurs composants qui interagissent (ex. le code et une base de données) | Moyen (dépend des composants réels sollicités) | Moyen : dépend de composants externes qui peuvent eux-mêmes changer |
| **Test end-to-end** (*E2E*) | L'application entière, du point de vue de l'utilisateur (ex. un navigateur qui clique réellement sur les boutons) | Lent (secondes à minutes) | Élevé : cassé par le moindre changement d'interface, souvent instable (*flaky*) |

Un test unitaire isole la fonction testée du reste du programme grâce à des **mocks** ou **stubs** (des remplaçants factices des dépendances externes, détaillés dans le chapitre sur l'architecture de test) : c'est ce qui le rend rapide et fiable, mais il ne garantit pas que les différentes parties du programme fonctionnent correctement une fois assemblées.

## La forme pyramidale : beaucoup de rapide, peu de lent

```text
        /\
       /E2E\          <- peu nombreux (lents, chers à maintenir)
      /------\
     /Intégra-\       <- quantité moyenne
    /  tion    \
   /------------\
  / Unitaires    \    <- très nombreux (rapides, bon marché)
 /----------------\
```

Cette répartition n'est pas arbitraire : elle vient directement du tableau ci-dessus. Comme les tests unitaires sont rapides et bon marché, on peut se permettre d'en écrire beaucoup, ce qui permet de vérifier un grand nombre de cas précis. Comme les tests E2E sont lents et fragiles, on en garde peu, réservés aux parcours vraiment critiques (ex. « un client peut passer commande de bout en bout ») plutôt qu'à chaque détail.

> **Piège :** l'anti-pattern du « cône de glace » inversé, une pyramide retournée où la majorité des tests sont des tests E2E lents et peu de tests unitaires existent. Résultat : une suite de tests qui prend des heures à s'exécuter, échoue souvent pour des raisons sans rapport avec un vrai bug (un délai réseau, un élément d'interface qui a bougé), et que l'équipe finit par ignorer ou désactiver.
>
> **Bonne pratique :** avant d'ajouter un test E2E, se demander si un test unitaire ou d'intégration, plus rapide et plus stable, ne couvrirait pas déjà le même risque.

## Ce que la pyramide ne dit pas

La pyramide donne une proportion à viser, pas un nombre absolu ni un ordre d'écriture obligatoire. Elle ne dit pas non plus qu'un niveau remplace un autre : un test unitaire qui vérifie qu'une fonction calcule correctement un total, et un test E2E qui vérifie que ce total s'affiche bien à l'écran après un vrai clic, ne testent pas la même chose et sont complémentaires. Les chapitres suivants détaillent chaque niveau, ainsi que l'organisation concrète d'une suite de tests.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Trois niveaux de test (unitaire, intégration, end-to-end) ont des coûts et des vitesses très différents. La pyramide de test recommande beaucoup de tests unitaires rapides, moins de tests d'intégration, et peu de tests E2E lents réservés aux parcours critiques. |
| **Outils utilisables** | Aucun outil concret à ce stade : les chapitres suivants aborderont les outils propres à chaque niveau. |
| **Pièges à éviter** | Le « cône de glace » inversé : une majorité de tests E2E lents et fragiles, peu de tests unitaires. |
| **Bonnes pratiques** | Avant d'ajouter un test E2E, vérifier qu'un niveau plus rapide ne couvre pas déjà le même risque. |
