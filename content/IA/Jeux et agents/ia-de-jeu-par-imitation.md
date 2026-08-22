---
order: 1
---

# L'IA de jeu par imitation : apprendre d'un joueur humain

Un adversaire contrôlé par l'ordinateur (un **bot**) peut être construit de deux façons fondamentalement différentes : **scripté** (un développeur écrit à la main les règles de décision : "si l'ennemi est visible, tirer") ou **appris par imitation** (le comportement est déduit automatiquement d'enregistrements de parties jouées par des humains, sans que personne n'écrive la règle explicitement).

## Bot scripté vs bot appris par imitation

| | Bot scripté | Bot appris par imitation |
|---|---|---|
| Origine du comportement | Règles écrites à la main par un développeur | Déduit d'enregistrements de parties humaines |
| Réalisme | Souvent reconnaissable comme "artificiel" (patterns répétitifs) | Peut reproduire des habitudes et imperfections humaines |
| Coût de création | Écrire et maintenir chaque règle | Collecter des données de jeu, puis entraîner un modèle |
| Comportement face à une situation jamais prévue | Suit la règle la plus proche, prévisible | Imprévisible : le modèle n'a jamais "vu" cette situation à l'entraînement |

## Enregistrer des parties pour en faire des données d'entraînement

Le principe reprend celui de l'apprentissage supervisé (voir [Réseaux de neurones](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)) : chaque instant d'une partie humaine devient un exemple d'entraînement, où l'**état du jeu** à cet instant (position des joueurs, munitions restantes, ce que le joueur voit à l'écran...) est associé à l'**action** que le joueur a réellement effectuée à ce moment-là (tirer, se déplacer, viser dans telle direction).

```text
Partie humaine enregistree, instant par instant :

Etat du jeu (entree)              Action du joueur (sortie attendue)
------------------------          -----------------------------------
ennemi visible, 30 munitions  ->  tirer
ennemi hors de vue             ->  se deplacer vers le point A
sante basse                    ->  battre en retraite
```

Des milliers de ces paires (état, action) constituent le jeu de données. Le modèle apprend à prédire l'action la plus probable à partir d'un état donné, exactement comme un modèle de classification d'images apprend à prédire une catégorie à partir de pixels.

> **Piège :** collecter des parties provenant d'un seul joueur, ou d'un style de jeu trop homogène. Le modèle reproduit alors fidèlement les habitudes de ce joueur précis (y compris ses défauts), plutôt qu'un comportement représentatif d'un adversaire humain "générique".
>
> **Bonne pratique :** diversifier les sources d'enregistrement (plusieurs joueurs, plusieurs niveaux de compétence, plusieurs styles) pour que le modèle généralise au-delà des habitudes d'un seul individu.

## Le piège de la généralisation : une situation jamais vue

Un modèle entraîné par imitation ne sait réagir qu'aux situations suffisamment proches de celles rencontrées dans les données d'entraînement. Une configuration de jeu inédite (une carte jamais jouée dans les enregistrements, une combinaison d'objets rare) peut produire une action absurde, sans qu'aucune règle explicite n'existe pour la corriger, contrairement à un bot scripté qui suit toujours sa règle la plus proche même dans un cas rare.

> **Piège :** supposer qu'un modèle entraîné sur un contenu de jeu (une carte, un mode) se comportera correctement sur un contenu différent, jamais vu à l'entraînement.
>
> **Bonne pratique :** tester explicitement le bot sur du contenu absent des données d'entraînement avant de le déployer, plutôt que de supposer que le comportement appris se généralise automatiquement.

## Simuler l'imperfection humaine : la dégradation volontaire de précision

Un modèle entraîné pour maximiser sa précision peut finir par viser avec une exactitude quasi parfaite, un comportement qui ne ressemble à aucun joueur humain réel et qui rend l'adversaire perçu comme injuste plutôt que crédible. Une technique corrige ce décalage : dégrader volontairement la précision du bot, par exemple en ajoutant un bruit aléatoire à la direction de visée ou en simulant un temps de réaction variable, pour imiter la fatigue et l'imperfection d'un joueur humain plutôt que la perfection mécanique d'un algorithme.

```text
Precision du modele "brute"     ->  quasi parfaite, percue comme "de triche"
Precision + bruit aleatoire     ->  variable, ressemble a un joueur humain fatigable
```

> **Bonne pratique :** calibrer ce bruit en fonction du niveau de difficulté visé (plus de bruit = adversaire plus facile), plutôt que d'appliquer une valeur fixe unique pour tous les niveaux.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un bot appris par imitation déduit son comportement d'enregistrements de parties humaines (paires état → action), plutôt que de règles écrites à la main. Il généralise mal à une situation absente des données d'entraînement. Dégrader volontairement sa précision (bruit, temps de réaction variable) le rend plus crédible qu'une précision mécanique parfaite. |
| **Outils utilisables** | Un modèle de classification qui prédit une action à partir d'un état de jeu, entraîné sur des paires (état, action) enregistrées. |
| **Pièges à éviter** | Entraîner sur les parties d'un seul joueur. Déployer un bot sur du contenu jamais vu à l'entraînement sans le tester d'abord. |
| **Bonnes pratiques** | Diversifier les sources d'enregistrement. Tester sur du contenu inédit avant déploiement. Ajouter du bruit à la précision pour simuler l'imperfection humaine, calibré selon le niveau de difficulté voulu. |
