---
order: 8
---

# Wireframing et prototypage

La [recherche utilisateur](/?c=ui-ux&p=recherche-utilisateur) dit *qui* utilise le produit et *quel problème* résoudre. Avant de passer à un écran fini (couleurs, typographie, polish visuel), une étape intermédiaire vérifie que la **structure** de l'écran tient la route — le **wireframing** — puis que le **parcours** entre les écrans fonctionne — le **prototypage**.

## Le wireframe : la structure, sans le visuel

Un **wireframe** représente l'agencement des éléments d'un écran (où va le titre, où va le bouton principal, où va la liste de résultats) sans aucune décision de style — pas de couleur définitive, pas de police choisie, souvent juste des rectangles et du texte de remplissage :

```text
+------------------------------------------+
| [Logo]              [Recherche...] [Menu] |
+------------------------------------------+
|                                            |
|  Titre principal                          |
|  Sous-titre descriptif                    |
|                                            |
|  [ Bouton d'action principal ]            |
|                                            |
+------------------+------------------------+
|  Filtre A         |  Résultat 1            |
|  Filtre B         |  Résultat 2            |
|  Filtre C         |  Résultat 3            |
+------------------+------------------------+
```

Ce schéma applique directement les leviers de la [hiérarchie visuelle](/?c=ui-ux&p=hierarchie-visuelle) (position, taille des blocs) sans encore toucher aux leviers purement visuels (couleur, typographie) — l'idée est de valider l'agencement avant d'investir du temps sur leur habillage final, qui devra être refait si la structure change.

## Les niveaux de fidélité

Un wireframe (ou un prototype) se décline à différents niveaux de détail, chacun adapté à une question différente :

| Fidélité | Ce qu'elle montre | Coût de modification | Adapté pour vérifier |
|---|---|---|---|
| Basse | Rectangles, texte de remplissage, agencement grossier | Très faible (papier, ou quelques minutes en outil) | La structure générale et le parcours logique |
| Moyenne | Vraie hiérarchie, vrais libellés, pas encore de style visuel final | Faible à modérée | L'organisation détaillée du contenu, les cas limites (texte long, liste vide) |
| Haute | Rendu quasi final (couleurs, typographie, composants réels) | Élevé (chaque changement retouche un visuel abouti) | Le détail des micro-interactions, la cohérence visuelle finale |

> **Piège :** présenter un prototype haute fidélité à un stade où seule la structure doit encore être validée. Un rendu déjà poli détourne l'attention des testeurs vers l'esthétique ("j'aime bien ce bleu") plutôt que vers ce qui compte encore à ce stade (le parcours a-t-il un sens ? trouve-t-on l'information ?) — et chaque changement de structure coûte alors bien plus cher à répercuter.
>
> **Bonne pratique :** faire correspondre le niveau de fidélité à la question du moment — basse fidélité tant que la structure peut encore changer, haute fidélité seulement une fois qu'elle est stabilisée.

## Le prototype cliquable : simuler le parcours

Un **prototype cliquable** relie plusieurs wireframes ou écrans entre eux (un clic sur "Voir le produit" mène à l'écran produit, un clic sur "Retour" revient à la liste), pour qu'une personne puisse *naviguer* dans le produit avant qu'une seule ligne de code réelle n'existe :

```text
[Liste de resultats] --clic sur un resultat--> [Fiche produit]
        ^                                            |
        |                                            |
        +-------------------clic sur "Retour"---------+
```

Ce parcours simulé permet de reprendre exactement la méthode du [test d'utilisabilité](/?c=ui-ux&p=recherche-utilisateur) — observer une personne essayer d'accomplir une tâche, sans l'aider — mais bien avant que le développement ne commence, quand corriger un problème de parcours ne coûte qu'un lien à redessiner plutôt qu'une fonctionnalité déjà codée à reprendre.

> **Piège :** ne prototyper que le chemin "idéal" (celui que l'équipe de conception a en tête) et laisser toute sortie de ce chemin mener à un écran non prévu, ou à rien du tout. Une personne qui teste le prototype dévie presque toujours du chemin prévu à un moment — c'est justement ce qu'un wireframe papier ou un prototype pauvrement relié ne révèle pas avant la mise en production.
>
> **Bonne pratique :** prototyper aussi les chemins secondaires plausibles (une recherche sans résultat, une erreur de saisie), pas seulement le scénario qui marche du premier coup.

## L'aller-retour avec la recherche utilisateur

Wireframing/prototypage et [recherche utilisateur](/?c=ui-ux&p=recherche-utilisateur) ne sont pas deux étapes séquentielles isolées, mais une boucle répétée : un prototype (même basse fidélité) sert de support à un nouveau test d'utilisabilité, dont les résultats guident la version suivante du wireframe, testée à son tour :

```text
Wireframe/prototype -> Test d'utilisabilite -> Constats -> Wireframe revise -> ...
```

Chaque tour de cette boucle coûte d'autant moins cher que la fidélité est restée basse — une raison supplémentaire de ne monter en fidélité qu'une fois la structure stabilisée par plusieurs tours de cette boucle.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le wireframe fixe la structure d'un écran sans style visuel ; le prototype cliquable relie plusieurs écrans pour simuler un parcours complet. Les deux existent à différents niveaux de fidélité (basse/moyenne/haute), chacun adapté à une question différente, et s'articulent en boucle avec la recherche utilisateur plutôt qu'en étape isolée. |
| **Outils utilisables** | Papier et crayon ou un outil numérique pour un wireframe basse fidélité ; un outil de prototypage pour relier plusieurs écrans en parcours cliquable. |
| **Pièges à éviter** | Présenter une haute fidélité alors que la structure doit encore changer. Ne prototyper que le chemin idéal, sans les sorties de parcours plausibles. |
| **Bonnes pratiques** | Faire correspondre la fidélité à la question du moment. Prototyper aussi les chemins secondaires (erreur, résultat vide). Boucler avec un test d'utilisabilité à chaque itération plutôt qu'une seule fois en fin de conception. |
