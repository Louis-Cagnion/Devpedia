---
order: 7
---

# RLHF, RLVR, RLCD : entraîner un modèle à autre chose qu'à bien écrire

La [méthodologie](/?c=ia&s=modeles-de-decision-structuree&p=methodologie-system-one) et les propriétés calibrées vues jusqu'ici ne tombent pas d'un entraînement classique : elles viennent d'un choix délibéré, fait *après* l'entraînement de base du modèle, sur ce qu'on cherche à optimiser. Ce chapitre présente trois approches de cette phase d'entraînement, appelée **post-entraînement** (elle intervient après l'entraînement principal détaillé dans [Entraînement et descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).

## Le principe commun : ajuster un modèle à partir d'un signal de retour

Les trois approches ci-dessous reposent sur l'**apprentissage par renforcement** (*reinforcement learning*) : plutôt que d'apprendre à reproduire un exemple exact (comme l'entraînement supervisé classique), le modèle produit une sortie, reçoit un **signal de retour** (une récompense) qui juge cette sortie, et ajuste ses paramètres pour obtenir de meilleures récompenses la prochaine fois. C'est le même principe qu'on utiliserait pour dresser un animal à coups de friandises : aucune instruction explicite du geste à faire, seulement un signal de "bien" ou "mal" après coup, répété jusqu'à ce que le comportement recherché émerge. Ce qui distingue RLHF, RLVR et RLCD, c'est **d'où vient ce signal de récompense**.

| Approche | D'où vient la récompense | Optimise pour |
|---|---|---|
| **RLHF** (*Reinforcement Learning from Human Feedback*) | Des humains qui comparent des réponses et disent laquelle ils préfèrent | Des réponses appréciées par des humains (chatbots, assistants conversationnels) |
| **RLVR** (*Reinforcement Learning with Verifiable Rewards*) | Un vérificateur automatique (ex : un test unitaire qui passe, un calcul dont le résultat est connu) | Des raisonnements corrects sur des tâches à réponse vérifiable (mathématiques, code) |
| **RLCD** (*Reinforcement Learning for Calibrated Decisions*) | L'écart entre la probabilité annoncée et la fréquence réelle du bon résultat | Des probabilités fiables plutôt qu'un texte généré |

## RLHF : optimiser pour la préférence humaine

Le **RLHF** est l'approche la plus répandue pour les [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) conversationnels actuels : des évaluateurs humains comparent des paires de réponses à un même prompt et indiquent laquelle ils préfèrent, ce signal sert ensuite à entraîner le modèle à produire des réponses de ce type plus souvent.

## RLVR : optimiser pour un résultat vérifiable

Le **RLVR** remplace le jugement humain par une vérification automatique et objective : un test unitaire passe ou échoue, un résultat de calcul est juste ou faux. Cette approche produit des modèles de raisonnement performants sur des tâches à réponse vérifiable (mathématiques, génération de code testable), au prix d'une inférence plus lente et plus coûteuse (le modèle "réfléchit" plus longtemps avant de répondre).

## RLCD : optimiser pour une probabilité fiable, pas pour un texte

Le **RLCD**, l'approche utilisée pour entraîner les [modèles de décision structurée](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm), ne cherche ni à plaire à un humain ni à produire un raisonnement textuel : la récompense mesure si la **probabilité annoncée par le modèle correspond à la fréquence réelle** du bon résultat sur de nombreux cas similaires (c'est la définition même de la [confiance calibrée](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree) vue au chapitre précédent). Un modèle entraîné par RLCD n'écrit jamais de réponse ouverte : il n'a même pas cette capacité, puisque rien dans son entraînement ne l'y pousse.

## Un risque propre au RLHF : le rétrécissement de la distribution

La documentation du fournisseur illustre un risque du RLHF par une analogie empruntée à une autre famille de modèles génératifs (les réseaux antagonistes génératifs, ou GAN, détaillés dans l'[article de recherche original](https://arxiv.org/abs/1406.2661) si le sujet mérite d'être approfondi) : le **mode collapse**, quand un générateur se met à produire répétitivement la même sortie plutôt que de couvrir toute la diversité possible. Un entraînement RLHF trop poussé peut produire un effet similaire : en optimisant fortement pour ce qu'un humain préfère, le modèle rétrécit l'éventail de ses réponses possibles autour de ce qui "plaît", au détriment de la diversité et, potentiellement, de la fiabilité sur des cas qui s'écartent de ce qui a été jugé préférable.

> **Piège :** supposer qu'un modèle optimisé par RLHF (donc jugé "bon" par des humains en conversation) est automatiquement fiable pour des décisions automatisées machine-à-machine. La documentation du fournisseur résume la distinction : *"compétence interpersonnelle et fiabilité machine sont des cibles d'optimisation différentes"*. Un modèle entraîné pour plaire n'est pas entraîné pour être exact ni prévisible.
>
> **Bonne pratique :** faire correspondre la méthode d'entraînement à l'usage réel visé : RLHF pour une interface conversationnelle où la qualité perçue par un humain compte, RLVR pour un raisonnement vérifiable, RLCD pour des décisions structurées consommées directement par du code, sans repasser par un jugement humain à chaque fois.

## Interface machine ou interface conversationnelle

Cette distinction reflète un choix de conception plus large : un LLM classique vise une **interface conversationnelle** (fluidité narrative, ton adapté à un humain) quand un modèle de décision structurée vise une **interface machine** (prédictibilité, sortie exploitable directement par du code, l'essentiel des interactions étant en réalité machine-à-machine plutôt qu'un dialogue avec un humain).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | RLHF, RLVR et RLCD sont trois façons d'entraîner un modèle après son entraînement de base, qui diffèrent par la source du signal de récompense : la préférence humaine (RLHF), un vérificateur automatique (RLVR), ou l'écart entre probabilité annoncée et fréquence réelle (RLCD). Un RLHF trop poussé peut rétrécir la diversité des réponses (mode collapse), et optimiser pour la préférence humaine n'optimise pas pour la fiabilité machine. |
| **Outils utilisables** | Aucun outil à manipuler directement ; cette distinction guide le choix d'un modèle selon l'usage visé (conversation, raisonnement vérifiable, décision automatisée). |
| **Pièges à éviter** | Supposer qu'un modèle RLHF, jugé "bon" par des humains, est fiable pour des décisions automatisées machine-à-machine. |
| **Bonnes pratiques** | Choisir la méthode d'entraînement (et donc le modèle) selon l'interface réellement visée : conversationnelle (RLHF), raisonnement vérifiable (RLVR), ou décision structurée consommée par du code (RLCD). |
