---
order: 5
---

# Traitement du langage naturel (NLP) et grands modèles de langage (LLM)

Un [réseau de neurones](/?c=ia&p=reseaux-de-neurones) manipule des nombres, jamais directement du texte. Le traitement du langage naturel (NLP, *Natural Language Processing*) regroupe les techniques qui convertissent du texte en représentations numériques exploitables, l'étape préalable indispensable à tout modèle de langage, jusqu'aux grands modèles de langage (LLM) modernes.

## La tokenisation : découper le texte

Un modèle ne traite jamais une phrase entière d'un bloc : le texte est d'abord découpé en unités plus petites, les **tokens** :

```text
"Les chats dorment" -> ["Les", "chats", "dorment"]          -> tokenisation par mot
"Les chats dorment" -> ["Les", "chat", "s", "dor", "ment"]   -> tokenisation en sous-mots (plus courant)
```

La tokenisation par mot entier pose un problème de vocabulaire : chaque mot possible (y compris les variantes de conjugaison, les mots rares, les noms propres...) nécessiterait sa propre entrée, un vocabulaire potentiellement infini. La tokenisation en **sous-mots** (ex. l'algorithme *Byte-Pair Encoding*) découpe les mots rares en fragments plus courants, gardant un vocabulaire de taille fixe et gérable (typiquement quelques dizaines de milliers d'entrées) tout en pouvant représenter n'importe quel mot, même jamais vu tel quel à l'entraînement.

> **Piège :** confondre nombre de tokens et nombre de mots. Avec la tokenisation en sous-mots, un seul mot peut être découpé en plusieurs tokens (voir l'exemple ci-dessus) : estimer une longueur de texte ou un coût (voir [LLM en production](/?c=ia&p=llm-en-production)) en comptant les mots plutôt que les tokens réels donne un résultat approximatif, parfois très éloigné.
>
> **Bonne pratique :** toujours mesurer une longueur de texte en tokens réels (via l'outil de tokenisation du modèle utilisé), jamais en comptant les mots à l'œil.

## Les embeddings : des mots aux vecteurs

Chaque token est ensuite converti en un [vecteur](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de nombres (un **embedding**), appris de façon à ce que des mots au sens proche aient des vecteurs proches dans cet espace :

```python
# Représentation purement illustrative
embedding("chat")   -> [0.2, -0.5, 0.8, ...]
embedding("chaton")  -> [0.3, -0.4, 0.7, ...]   # proche de "chat" -> sens similaire
embedding("voiture")  -> [-0.9, 0.6, -0.1, ...]  # loin de "chat" -> sens différent
```

"Proche" ou "loin" se mesure exactement comme vu dans le chapitre sur les [vecteurs et le produit scalaire](/?c=mathematiques&p=vecteurs-et-produit-scalaire) : par la norme de leur différence, ou par leur produit scalaire une fois normalisés. Cette propriété permet des opérations devenues classiques pour illustrer le concept : `embedding("roi") - embedding("homme") + embedding("femme")` produit un vecteur proche de `embedding("reine")` : le sens se retrouve encodé, au moins partiellement, comme une direction géométrique dans cet espace vectoriel.

> **Piège :** comparer deux embeddings produits par des **modèles différents**. Chaque modèle construit son propre espace vectoriel pendant son entraînement : deux modèles n'ont aucune raison de placer le mot "chat" au même endroit dans leurs espaces respectifs. Une distance entre deux embeddings n'a de sens qu'entre embeddings issus du **même** modèle.
>
> **Bonne pratique :** toujours produire les embeddings à comparer avec un seul et même modèle, jamais en mélangeant les sorties de deux modèles différents.

## L'attention appliquée au texte

Le mécanisme d'attention (voir [Architectures : CNN, RNN et Transformers](/?c=ia&p=architectures-cnn-rnn-transformers)) permet à chaque token de "regarder" les autres tokens de la séquence pour ajuster sa propre représentation selon le contexte :

```text
"La banque au bord de la rivière"      vs      "La banque a augmenté ses taux"
        ^                                              ^
   "banque" influencée par "rivière"          "banque" influencée par "taux"
   -> sens "berge"                            -> sens "établissement financier"
```

Le même mot ("banque") obtient une représentation numérique **différente** selon son contexte : c'est cette capacité qui distingue un modèle basé sur l'attention d'un simple dictionnaire "mot → vecteur" fixe.

## Qu'est-ce qu'un grand modèle de langage (LLM) ?

Un **LLM** (*Large Language Model*) est, dans son principe le plus simple, un modèle [Transformer](/?c=ia&p=architectures-cnn-rnn-transformers) entraîné sur d'immenses quantités de texte, avec un objectif d'entraînement remarquablement simple : **prédire le mot (ou token) suivant**, étant donné tout ce qui précède.

```text
"Le chat dort sur le" -> le modèle prédit une distribution de probabilité sur le token suivant
                          ("canapé" : 45%, "tapis" : 20%, "lit" : 15%, ...)
```

Cette sortie est exactement une [distribution de probabilité](/?c=mathematiques&p=les-probabilites-de-base) au sens vu précédemment : chaque token possible du vocabulaire reçoit une probabilité, et l'ensemble somme à 1.

Ce qui rend un LLM impressionnant n'est pas la simplicité de cet objectif, mais l'**échelle** : des milliards de paramètres, entraînés sur une fraction significative du texte disponible publiquement, avec suffisamment de puissance de calcul (voir [Deep learning avec PyTorch](/?c=ia&p=deep-learning-pytorch)) pour que cette tâche de prédiction, poussée à cette échelle, fasse émerger des capacités qui n'ont pas été explicitement programmées (répondre à des questions, résumer, traduire, raisonner étape par étape...), un phénomène qualifié de **capacités émergentes**.

> **Piège :** en déduire que le modèle "comprend" ou "raisonne" au sens humain du terme. Le mécanisme reste, du début à la fin, une prédiction statistique du token suivant, un comportement qui *ressemble* à de la compréhension, sans qu'aucune garantie n'existe qu'il en partage les propriétés (voir les limites détaillées dans [LLM en production](/?c=ia&p=llm-en-production)).
>
> **Bonne pratique :** évaluer un LLM sur ce qu'il produit réellement (des sorties vérifiées, testées) plutôt que sur une intuition de ce qu'il "doit" comprendre du fait de sa taille ou de la fluidité de ses réponses.

## Du modèle brut à un assistant utilisable : fine-tuning vs prompting

Un LLM fraîchement entraîné à "prédire le mot suivant" ne répond pas naturellement comme un assistant conversationnel ; deux approches (souvent combinées) permettent de l'orienter :

| Approche | Principe |
|---|---|
| **Fine-tuning** | Poursuivre l'entraînement du modèle sur des données spécifiques (des conversations exemplaires, des instructions suivies de bonnes réponses...), en ajustant à nouveau ses poids |
| **Prompting** | Ne modifie **aucun** poids du modèle : on formule simplement l'entrée (le *prompt*) de façon à guider le modèle déjà entraîné vers le comportement souhaité (donner des exemples dans le prompt, poser la question d'une certaine façon...) |

Le prompting exploite uniquement les capacités déjà acquises pendant l'entraînement initial : c'est pour ça qu'une bonne formulation de question (le **prompt engineering**, voir le chapitre dédié juste après) peut considérablement améliorer un résultat, sans qu'aucune donnée d'entraînement supplémentaire ni aucun calcul de gradient n'entre en jeu.

> **Piège :** attendre du prompting qu'il enseigne une compétence totalement absente de l'entraînement initial du modèle : reformuler différemment une question ne fait qu'exploiter ce que le modèle a déjà acquis, ça ne lui apprend rien de nouveau.
>
> **Bonne pratique :** réserver le fine-tuning aux cas où le comportement recherché dépasse ce que le prompting peut exploiter (un style très spécifique, une compétence absente des données d'entraînement d'origine) : le prompting reste plus rapide et moins coûteux dès qu'il suffit.

Voir aussi [Architectures : CNN, RNN et Transformers](/?c=ia&p=architectures-cnn-rnn-transformers) (le mécanisme d'attention sous-jacent), [Deep learning avec PyTorch](/?c=ia&p=deep-learning-pytorch) (comment un tel modèle est concrètement entraîné, à une échelle bien plus modeste dans les exemples de ce chapitre) et [Le prompt engineering](/?c=ia&p=prompt-engineering) (comment formuler concrètement un bon prompt).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le texte est découpé en tokens, puis converti en vecteurs (embeddings) dont la proximité reflète la proximité de sens. Un LLM est un Transformer entraîné à prédire une distribution de probabilité sur le token suivant, à très grande échelle. Le prompting exploite les capacités déjà acquises ; le fine-tuning en ajoute de nouvelles en ré-entraînant le modèle. |
| **Outils utilisables** | L'outil de tokenisation du modèle utilisé, pour mesurer une longueur réelle en tokens plutôt qu'en mots. |
| **Pièges à éviter** | Confondre nombre de tokens et nombre de mots. Comparer des embeddings issus de modèles différents. Attribuer une compréhension véritable à un LLM. Attendre du prompting qu'il enseigne une compétence absente de l'entraînement initial. |
| **Bonnes pratiques** | Mesurer la longueur d'un texte en tokens réels. Ne comparer des embeddings qu'issus d'un même modèle. Évaluer un LLM sur ses sorties réelles plutôt que sur une intuition de ce qu'il "doit" comprendre. Réserver le fine-tuning aux cas où le prompting ne suffit pas. |
