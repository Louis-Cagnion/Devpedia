---
order: 8
---

# La recherche utilisateur

Les chapitres précédents (hiérarchie visuelle, couleur, typographie...) supposent qu'on sait déjà ce que l'utilisateur doit accomplir sur un écran. La **recherche utilisateur** est l'étape qui vient avant : comprendre qui utilise réellement le produit, ce qu'il essaie de faire, et où il rencontre des difficultés, avant de dessiner quoi que ce soit. Sans cette étape, un designer conçoit pour un utilisateur imaginé, pas pour celui qui utilisera réellement le produit.

> **Pourquoi ça compte :** un écran parfaitement hiérarchisé, bien contrasté et accessible reste un échec s'il résout un problème que personne n'a. La recherche utilisateur réduit ce risque en confrontant les idées de conception à des personnes réelles, le plus tôt possible : corriger une direction fausse coûte bien moins avant qu'après avoir codé l'interface.

## Les personas : représenter un utilisateur type

Un **persona** est un profil fictif, mais construit à partir de données réelles (entretiens, observations, statistiques d'usage), qui représente un groupe d'utilisateurs partageant les mêmes objectifs et frustrations face au produit :

| Champ | Exemple |
|---|---|
| Nom et rôle | Sophie, 34 ans, responsable comptable dans une PME |
| Objectif principal | Clôturer les comptes du mois sans erreur, le plus vite possible |
| Frustration actuelle | Doit ressaisir les mêmes données dans deux outils différents |
| Niveau technique | À l'aise avec les tableurs, peu à l'aise avec un outil qu'elle juge "trop technique" |

Un produit vise rarement un seul persona : 2 à 4 personas distincts couvrent en général l'essentiel des usages réels, chacun orientant des décisions de conception différentes (un persona peu à l'aise techniquement pousse vers une interface plus guidée, par exemple).

> **Piège :** construire un persona à partir de suppositions ("je pense que nos utilisateurs sont plutôt jeunes et à l'aise avec la technologie") plutôt que de données réelles. Un persona imaginaire renforce les biais de l'équipe de conception au lieu de les corriger : il donne l'illusion d'une base solide sans en être une.
>
> **Bonne pratique :** construire chaque persona à partir d'entretiens ou de données d'usage réelles (voir la section suivante), et le mettre à jour si de nouvelles données le contredisent, plutôt que de le figer une fois pour toutes.

## Les entretiens utilisateur : recueillir l'information à la source

Un **entretien utilisateur** consiste à interroger une personne représentative pour comprendre son contexte, ses objectifs et ses difficultés, pas pour lui demander de noter une idée déjà conçue (ça, c'est le rôle du [test d'utilisabilité](#tester-l-utilisabilite-observer-plutot-que-demander), plus bas). La formulation des questions influence fortement la qualité des réponses obtenues :

| | Question orientée | Question ouverte |
|---|---|---|
| Exemple | "Vous n'aimez pas devoir ressaisir vos données, n'est-ce pas ?" | "Racontez-moi la dernière fois où vous avez clôturé les comptes du mois." |
| Effet | Suggère la réponse attendue ; la personne a tendance à confirmer par politesse (*biais de désirabilité sociale*) | Laisse la personne décrire son propre vécu, sans direction imposée |

> **Piège :** poser des questions qui suggèrent déjà la réponse souhaitée, ou qui portent sur une opinion future hypothétique ("utiliseriez-vous une fonctionnalité qui ferait X ?"). Les personnes interrogées surestiment systématiquement leur usage futur d'une fonctionnalité imaginée : ce qu'elles font réellement aujourd'hui est un indicateur bien plus fiable que ce qu'elles pensent qu'elles feraient.
>
> **Bonne pratique :** poser des questions ouvertes sur des comportements passés et concrets ("racontez-moi la dernière fois où...") plutôt que sur des opinions ou des intentions futures.

## La carte d'empathie : synthétiser plusieurs entretiens

Une **carte d'empathie** (*empathy map*) organise ce qu'on a appris d'un utilisateur ou d'un persona en quatre quadrants, pour faire ressortir les tensions entre ce qu'il dit et ce qu'il ressent réellement :

```text
+---------------------------+---------------------------+
| CE QU'IL DIT              | CE QU'IL PENSE            |
| "L'outil actuel marche    | Craint de perdre du temps |
|  bien, on s'en sort"      | si on change d'outil      |
+---------------------------+---------------------------+
| CE QU'IL FAIT              | CE QU'IL RESSENT          |
| Ressaisit les mêmes        | Frustration silencieuse,  |
| données dans 2 outils      | jamais exprimée à l'oral  |
+---------------------------+---------------------------+
```

L'écart entre le quadrant "dit" et les trois autres est souvent la découverte la plus utile : ici, la personne minimise oralement un problème qu'elle vit et exprime concrètement (voir aussi le [piège des questions orientées](#les-entretiens-utilisateur-recueillir-l-information-a-la-source) ci-dessus, qui produit exactement ce genre de décalage si on ne recoupe pas les dires avec l'observation).

## Tester l'utilisabilité : observer plutôt que demander

Un **test d'utilisabilité** consiste à observer une personne réelle essayer d'accomplir une tâche précise sur le produit (existant ou un prototype, voir le futur chapitre sur le prototypage), sans l'aider ni lui expliquer comment faire : ses hésitations et ses erreurs révèlent les points de friction réels, souvent différents de ceux que l'équipe de conception avait anticipés.

```text
Tache donnee   : "Trouvez comment exporter ce rapport en PDF."
Observation    : la personne cherche dans le menu "Fichier" pendant
                 45 secondes avant de repérer l'icone d'export, isolee
                 dans la barre laterale sans texte ni infobulle.
Conclusion     : l'export existe et fonctionne, mais sa position n'est
                 pas ou l'utilisateur le cherche naturellement.
```

Ce type de constat rejoint directement la [reconnaissance plutôt que le rappel](/?c=ui-ux&p=heuristiques-de-nielsen), l'une des dix heuristiques de Nielsen : un test d'utilisabilité est l'un des moyens concrets de vérifier si une interface la respecte réellement, plutôt que de le supposer.

> **Piège :** intervenir pendant le test pour expliquer où cliquer, ou reformuler la tâche si la personne semble bloquée. Ça masque exactement le problème que le test est censé révéler : une personne testant seule le produit en conditions réelles n'aura personne pour lui souffler la réponse.
>
> **Bonne pratique :** rester silencieux pendant que la personne essaie, noter précisément où et pourquoi elle hésite, et ne poser des questions qu'une fois la tâche terminée (réussie ou non).

## Quelle méthode, à quel moment

| Méthode | Répond à la question | Moment du projet |
|---|---|---|
| Entretien utilisateur | Qui sont les utilisateurs, quels sont leurs objectifs et frustrations ? | En amont, avant de concevoir quoi que ce soit |
| Persona | Comment résumer et partager ces profils avec toute l'équipe ? | Après une série d'entretiens, pour synthétiser |
| Carte d'empathie | Quelles tensions entre le discours et le vécu réel d'un utilisateur ? | Juste après les entretiens, pendant la synthèse |
| Test d'utilisabilité | Cette interface (ou ce prototype) fonctionne-t-elle réellement pour une tâche donnée ? | Une fois qu'il existe quelque chose à tester, même une maquette |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La recherche utilisateur précède la conception : entretiens pour comprendre les utilisateurs réels, personas pour synthétiser des profils types, carte d'empathie pour faire ressortir les tensions dit/pensé/fait/ressenti, test d'utilisabilité pour vérifier qu'une interface fonctionne réellement pour une tâche donnée. |
| **Outils utilisables** | Un guide d'entretien à questions ouvertes ; un gabarit de persona (nom, objectif, frustration, niveau technique) ; un gabarit de carte d'empathie à 4 quadrants ; une tâche précise à observer pour un test d'utilisabilité. |
| **Pièges à éviter** | Construire un persona sur des suppositions plutôt que des données réelles. Poser des questions orientées ou porter sur des intentions futures hypothétiques. Intervenir pendant un test d'utilisabilité au lieu d'observer en silence. |
| **Bonnes pratiques** | Construire les personas à partir d'entretiens ou de données d'usage réelles. Poser des questions ouvertes sur des comportements passés et concrets. Observer un test d'utilisabilité en silence, questionner seulement après. |
