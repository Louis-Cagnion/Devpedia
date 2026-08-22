---
order: 3
---

# Architectures : CNN, RNN et Transformers

Le réseau "entièrement connecté" du [chapitre sur les fondamentaux](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) (chaque neurone relié à tous ceux de la couche suivante) n'est pas la seule façon d'organiser des couches. Selon le type de données traité (image, séquence, texte), certaines architectures sont bien plus efficaces. Ce chapitre présente les trois familles les plus influentes.

## Les réseaux convolutifs (CNN) : pour les images

Un réseau entièrement connecté traitant une image de 1000x1000 pixels nécessiterait un nombre de poids énorme (un poids par pixel, par neurone de la couche suivante) ; impraticable, et ignorant une propriété essentielle des images : un motif (un bord, un œil, une texture) garde le même sens **où qu'il apparaisse** dans l'image.

Un **CNN** (*Convolutional Neural Network*) fait glisser un petit **filtre** (une grille de poids, ex. 3x3) sur toute l'image, en réutilisant **les mêmes poids** à chaque position :

```text
Image (extrait)         Filtre (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> une seule valeur en sortie, par position du filtre
2  0  1  1                0  1  0
```

- Le même filtre détecte le même motif (ex. un bord vertical) **partout** dans l'image : une propriété appelée invariance par translation.
- Le nombre de poids à apprendre reste petit (la taille du filtre), indépendamment de la taille de l'image.
- Les couches de **pooling** (ex. *max pooling*) réduisent ensuite la résolution en ne gardant que la valeur maximale d'une petite zone, ce qui diminue le volume de calcul et rend le réseau plus robuste à de petits décalages.

Empiler plusieurs couches convolutives permet aux premières de détecter des motifs simples (bords, coins), et aux suivantes de les combiner en motifs de plus en plus abstraits (formes, puis objets entiers).

> **Piège :** utiliser un CNN sur des données sans structure spatiale locale (une donnée tabulaire classique, par exemple, où chaque colonne a un sens fixe et différent des autres) : l'hypothèse centrale du CNN (un motif garde le même sens où qu'il apparaisse) n'a alors aucun fondement.
>
> **Bonne pratique :** réserver le CNN aux données où la position **relative** compte mais la position **absolue** non (images, grilles, sons représentés en spectrogramme), pas aux données où chaque position a un sens fixe et non interchangeable.

## Les réseaux récurrents (RNN) : pour les séquences

Une phrase, une série temporelle, un signal audio : ces données ont un ordre significatif, que ni un réseau entièrement connecté ni un CNN ne traite naturellement. Un **RNN** (*Recurrent Neural Network*) traite une séquence élément par élément, en conservant un **état caché** qui résume ce qui a été vu jusque-là :

```text
mot1 -> [RNN] -> état1 --\
                           +-> mot2 -> [RNN] -> état2 --\
                                                           +-> mot3 -> [RNN] -> état3 -> sortie
```

Chaque étape reçoit à la fois l'élément courant **et** l'état caché de l'étape précédente : c'est ce qui permet au réseau de "se souvenir" du contexte précédent en traitant une phrase, par exemple.

### Le problème du gradient qui s'évanouit

Pour une séquence longue, la rétropropagation (voir [L'entraînement d'un modèle et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) doit remonter à travers **toutes** les étapes précédentes : le gradient peut devenir extrêmement petit (ou extrêmement grand) au fur et à mesure, rendant l'apprentissage de dépendances **lointaines** dans la séquence très difficile. Des variantes comme **[LSTM](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)** et **GRU** ajoutent des mécanismes de portes (*gates*) pour mieux contrôler quelle information conserver ou oublier, atténuant ce problème.

> **Piège :** utiliser un RNN "simple" (sans portes) sur des séquences longues où des dépendances lointaines comptent (le début d'un paragraphe influence sa conclusion, par exemple) : le gradient qui s'évanouit rend cet apprentissage peu fiable en pratique.
>
> **Bonne pratique :** préférer une variante à portes (LSTM, GRU) dès que la séquence est longue et que des dépendances lointaines sont susceptibles d'être importantes pour la tâche.

## Les Transformers : le mécanisme d'attention

Un RNN traite une séquence **séquentiellement** (impossible de calculer l'étape 5 avant l'étape 4) : un frein majeur à la parallélisation sur des séquences longues et de gros volumes de données (voir le calcul parallèle sur [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu)). Le **Transformer** (2017) remplace la récurrence par un mécanisme d'**attention** : chaque élément de la séquence "regarde" directement tous les autres (y compris lui-même), en pondérant leur importance relative, sans dépendre d'un état propagé pas à pas.

```text
"Le chat qui dort sur le canapé est noir"
                                    ^
                     l'attention permet à "est noir" de se relier directement à "chat",
                     malgré la distance dans la phrase, sans passer par tous les mots intermédiaires
```

- L'attention peut se calculer **en parallèle** pour toute la séquence (contrairement à un RNN), ce qui a permis d'entraîner des modèles bien plus grands, sur bien plus de données.
- C'est cette architecture qui est à la base des grands modèles de langage (LLM) modernes (voir [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

> **Piège :** appliquer un Transformer standard à une séquence extrêmement longue sans y prêter attention : le coût de calcul de l'attention augmente plus vite que la longueur de la séquence elle-même (chaque élément regarde tous les autres), au contraire d'un RNN dont le coût par étape reste constant.
>
> **Bonne pratique :** pour une séquence très longue, vérifier les limites de contexte du modèle utilisé (voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)) plutôt que de supposer qu'un Transformer absorbe n'importe quelle longueur sans coût supplémentaire.

## Comparatif rapide

| Architecture | Type de données adapté | Point fort | Limite |
|---|---|---|---|
| **CNN** | Images, grilles spatiales | Peu de poids, détecte des motifs locaux | Moins naturel pour des séquences longues |
| **RNN** (LSTM/GRU) | Séquences (texte, séries temporelles) | Modélise l'ordre et la mémoire courte | Difficile à paralléliser, dépendances lointaines fragiles |
| **Transformer** | Séquences, texte, de plus en plus d'images aussi | Parallélisable, capture les dépendances longues via l'attention | Coût mémoire/calcul élevé sur de très longues séquences |

Voir aussi [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) pour l'application de l'architecture Transformer au traitement du langage.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le CNN exploite la structure spatiale locale des images via des filtres à poids partagés. Le RNN traite une séquence pas à pas en conservant un état caché, mais souffre du gradient qui s'évanouit sur les dépendances lointaines. Le Transformer remplace la récurrence par l'attention, parallélisable et à la base des LLM modernes. |
| **Outils utilisables** | Les bibliothèques de deep learning fournissent des couches prêtes à l'emploi pour chaque architecture (voir [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Pièges à éviter** | Utiliser un CNN sur des données sans structure spatiale locale. Utiliser un RNN simple sur des séquences longues à dépendances lointaines. Sous-estimer le coût de l'attention sur une séquence très longue. |
| **Bonnes pratiques** | Choisir l'architecture selon la structure réelle des données (spatiale, séquentielle courte, séquentielle longue), pas par habitude. Préférer LSTM/GRU à un RNN simple dès que des dépendances lointaines comptent. Vérifier les limites de contexte avant de soumettre une séquence très longue à un Transformer. |
