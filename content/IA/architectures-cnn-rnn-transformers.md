---
order: 3
---

# Architectures — CNN, RNN et Transformers

Le réseau "entièrement connecté" du chapitre sur les fondamentaux (chaque neurone relié à tous ceux de la couche suivante) n'est pas la seule façon d'organiser des couches. Selon le type de données traité (image, séquence, texte), certaines architectures sont bien plus efficaces. Ce chapitre présente les trois familles les plus influentes.

## Les réseaux convolutifs (CNN) — pour les images

Un réseau entièrement connecté traitant une image de 1000x1000 pixels nécessiterait un nombre de poids énorme (un poids par pixel, par neurone de la couche suivante) — impraticable, et ignorant une propriété essentielle des images : un motif (un bord, un œil, une texture) garde le même sens **où qu'il apparaisse** dans l'image.

Un **CNN** (*Convolutional Neural Network*) fait glisser un petit **filtre** (une grille de poids, ex. 3x3) sur toute l'image, en réutilisant **les mêmes poids** à chaque position :

```
Image (extrait)         Filtre (3x3)
1  2  0  1               0  1  0
0  1  1  0        *       1 -1  1     -> une seule valeur en sortie, par position du filtre
2  0  1  1                0  1  0
```

- Le même filtre détecte le même motif (ex. un bord vertical) **partout** dans l'image — une propriété appelée invariance par translation.
- Le nombre de poids à apprendre reste petit (la taille du filtre), indépendamment de la taille de l'image.
- Les couches de **pooling** (ex. *max pooling*) réduisent ensuite la résolution en ne gardant que la valeur maximale d'une petite zone, ce qui diminue le volume de calcul et rend le réseau plus robuste à de petits décalages.

Empiler plusieurs couches convolutives permet aux premières de détecter des motifs simples (bords, coins), et aux suivantes de les combiner en motifs de plus en plus abstraits (formes, puis objets entiers).

## Les réseaux récurrents (RNN) — pour les séquences

Une phrase, une série temporelle, un signal audio : ces données ont un ordre significatif, que ni un réseau entièrement connecté ni un CNN ne traite naturellement. Un **RNN** (*Recurrent Neural Network*) traite une séquence élément par élément, en conservant un **état caché** qui résume ce qui a été vu jusque-là :

```
mot1 -> [RNN] -> état1 --\
                           +-> mot2 -> [RNN] -> état2 --\
                                                           +-> mot3 -> [RNN] -> état3 -> sortie
```

Chaque étape reçoit à la fois l'élément courant **et** l'état caché de l'étape précédente — c'est ce qui permet au réseau de "se souvenir" du contexte précédent en traitant une phrase, par exemple.

### Le problème du gradient qui s'évanouit

Pour une séquence longue, la rétropropagation (voir [L'entraînement d'un modèle et la descente de gradient](/?c=ia&p=entrainement-descente-de-gradient)) doit remonter à travers **toutes** les étapes précédentes — le gradient peut devenir extrêmement petit (ou extrêmement grand) au fur et à mesure, rendant l'apprentissage de dépendances **lointaines** dans la séquence très difficile. Des variantes comme **LSTM** et **GRU** ajoutent des mécanismes de portes (*gates*) pour mieux contrôler quelle information conserver ou oublier, atténuant ce problème.

## Les Transformers — le mécanisme d'attention

Un RNN traite une séquence **séquentiellement** (impossible de calculer l'étape 5 avant l'étape 4) — un frein majeur à la parallélisation sur des séquences longues et de gros volumes de données. Le **Transformer** (2017) remplace la récurrence par un mécanisme d'**attention** : chaque élément de la séquence "regarde" directement tous les autres (y compris lui-même), en pondérant leur importance relative, sans dépendre d'un état propagé pas à pas.

```
"Le chat qui dort sur le canapé est noir"
                                    ^
                     l'attention permet à "est noir" de se relier directement à "chat",
                     malgré la distance dans la phrase, sans passer par tous les mots intermédiaires
```

- L'attention peut se calculer **en parallèle** pour toute la séquence (contrairement à un RNN), ce qui a permis d'entraîner des modèles bien plus grands, sur bien plus de données.
- C'est cette architecture qui est à la base des grands modèles de langage (LLM) modernes (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)).

## Comparatif rapide

| Architecture | Type de données adapté | Point fort | Limite |
|---|---|---|---|
| **CNN** | Images, grilles spatiales | Peu de poids, détecte des motifs locaux | Moins naturel pour des séquences longues |
| **RNN** (LSTM/GRU) | Séquences (texte, séries temporelles) | Modélise l'ordre et la mémoire courte | Difficile à paralléliser, dépendances lointaines fragiles |
| **Transformer** | Séquences, texte, de plus en plus d'images aussi | Parallélisable, capture les dépendances longues via l'attention | Coût mémoire/calcul élevé sur de très longues séquences |

Voir aussi [NLP et LLM](/?c=ia&p=nlp-et-llm) pour l'application de l'architecture Transformer au traitement du langage.
