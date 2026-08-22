---
order: 1
---

# OCR : de la reconnaissance de motifs classique au deep learning

Le chapitre [L'OCR structuré et l'analyse de mise en page](/?c=traitement-de-documents&p=ocr-structure) définit l'**OCR** (reconnaissance optique de caractères) et couvre ce qui se passe **autour** du texte (localiser un tableau, reconstruire sa grille). Ce chapitre se concentre sur l'étape qui vient avant : comment un modèle transforme les pixels d'une zone de texte en caractères, du tout premier OCR (comparaison de motifs) jusqu'aux modèles de deep learning modernes.

## L'OCR classique : reconnaître un caractère comme une image de référence

Les premiers moteurs d'OCR (dont les premières versions de [**Tesseract**](https://github.com/tesseract-ocr/tesseract), un moteur OCR open source) découpent le problème en trois étapes strictement séparées :

```text
Image de la ligne de texte
        │
        ▼
1. Segmentation : découper la ligne en une image par caractère
        │
        ▼
2. Extraction de caractéristiques : mesurer des traits du dessin
   (nombre de boucles, de traits verticaux, de trous...)
        │
        ▼
3. Comparaison : quel caractère de référence a les caractéristiques les plus proches ?
```

Cette approche fonctionne bien sur un texte propre, imprimé, avec des caractères bien séparés : c'est la **segmentation** de l'étape 1 qui en est le point faible.

> **Piège :** une segmentation qui suppose que les caractères sont toujours séparés par un espace net. Deux lettres qui se touchent (une police fine et serrée, un texte manuscrit cursif) ou un caractère abîmé par le bruit du scan (image un peu penchée, tachée) cassent cette hypothèse : la ligne se découpe alors au mauvais endroit, et toute la suite (extraction de caractéristiques, comparaison) part d'une image de caractère déjà fausse.
>
> **Bonne pratique :** réserver l'OCR classique aux documents dont le texte est effectivement propre et imprimé (formulaires standardisés, texte numérique rendu en image) ; pour un texte manuscrit ou de qualité variable, préférer une approche de deep learning qui ne dépend pas d'une segmentation préalable (voir plus bas).

## Le deep learning évite la segmentation caractère par caractère

Un **CRNN** (*Convolutional Recurrent Neural Network*) combine un CNN et un RNN à portes ([LSTM/GRU, déjà vus](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)) plutôt que d'inventer une nouvelle architecture :

```text
Image de la ligne entière
        │
        ▼
CNN : extrait une colonne de caracteristiques visuelles a chaque position horizontale
      (pas de decoupage en caracteres individuels)
        │
        ▼
RNN (LSTM/GRU) : lit ces colonnes de gauche a droite, comme une sequence
        │
        ▼
Une distribution de probabilite sur les caracteres possibles, a chaque position
```

Le CNN ne "sait" pas où commence ni où finit chaque caractère : il produit une suite de colonnes de caractéristiques, une par tranche verticale de l'image, sans jamais avoir besoin de segmenter la ligne en amont. C'est le RNN, puis l'étape suivante, qui donnent un sens à cette suite.

### Le problème que CTC résout : aligner une sortie plus longue que le texte

Le nombre de colonnes produites par le CNN (une par tranche de l'image) ne correspond jamais exactement au nombre de caractères du texte : une lettre large comme "M" occupe plusieurs colonnes, une lettre fine comme "l" n'en occupe qu'une. Sans mécanisme dédié, le réseau n'a aucune façon d'apprendre "quelles colonnes correspondent à quel caractère", faute d'annotation aussi précise dans les données d'entraînement (qui donnent le texte de la ligne, pas la position pixel par pixel de chaque lettre).

La **CTC** (*Connectionist Temporal Classification*) résout ce problème en ajoutant un symbole spécial, le **blanc** (`Ø`), que le modèle peut produire librement entre deux caractères répétés ou incertains, puis en appliquant une règle de simplification fixe pour obtenir le texte final :

```text
Sortie brute du RNN (une prediction par colonne) :
  Ø  Ø  h  h  Ø  e  e  Ø  l  l  l  Ø  Ø  l  o  o  Ø

Regle CTC : fusionner les caracteres identiques consecutifs, puis retirer les Ø
  h  h  →  h          l  l  l  →  l         (repetitions fusionnees)
  Ø         (retires)

Resultat : h  e  l  l  o   ->  "hello"
```

| | OCR classique | CRNN + CTC |
|---|---|---|
| Découpage en caractères | Obligatoire, avant reconnaissance | Jamais nécessaire |
| Donnée d'entraînement requise | Image de caractère isolé, déjà étiqueté | Image de ligne entière + son texte, sans position |
| Robustesse au texte cursif/serré | Faible (la segmentation échoue) | Bonne (aucune segmentation à faire) |

> **Piège :** répéter un caractère volontairement dans le texte réel (ex. "book", avec deux "o" consécutifs) et croire que la règle de fusion CTC va l'écraser en un seul "o". La règle de fusion ne s'applique qu'aux répétitions consécutives de la sortie brute du modèle, pas au texte final : le modèle apprend à insérer un `Ø` entre deux répétitions **voulues** dans le texte, précisément pour éviter qu'elles ne fusionnent à tort.
>
> **Bonne pratique :** laisser cette distinction à l'entraînement (le modèle apprend, à partir des exemples, quand insérer un `Ø` entre deux caractères identiques voulus) plutôt que d'essayer de la coder à la main dans le post-traitement.

## Les modèles à base de Transformers : remplacer le RNN par l'attention

Comme pour le texte pur (voir [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), le RNN d'un CRNN peut être remplacé par un mécanisme d'**attention**. Une architecture Transformer pour l'OCR (par ex. [TrOCR](https://arxiv.org/abs/2109.10282)) se compose de deux blocs :

- Un **encodeur visuel** : découpe l'image en petits patchs (comme un quadrillage), et calcule une représentation de chaque patch en tenant compte de tous les autres par attention, au lieu de la lecture strictement gauche-à-droite d'un RNN.
- Un **décodeur de texte** : génère les caractères un par un, chacun pouvant "regarder" n'importe quel patch de l'image (pas seulement les patchs voisins du dernier caractère produit), et le texte déjà généré.

Cette architecture ne dépend plus de CTC : le décodeur génère directement une suite de caractères, comme un LLM génère une suite de mots (voir [Traitement du langage naturel (NLP) et grands modèles de langage (LLM)](/?c=ia&s=nlp-llm&p=nlp-et-llm)), sans les contraintes d'alignement colonne par colonne d'un CRNN.

> **Piège :** supposer qu'un modèle Transformer est automatiquement supérieur à un CRNN+CTC pour toute tâche d'OCR. Un Transformer d'OCR est en général plus gourmand en données d'entraînement et en calcul ; sur un cas d'usage étroit (une seule police, un format de document fixe), un CRNN+CTC plus léger atteint souvent une qualité comparable pour un coût bien inférieur.
>
> **Bonne pratique :** faire ce choix selon la diversité réelle des documents à traiter (voir aussi [Arbitrage local vs cloud pour un modèle de vision](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision) pour la question de l'endroit où faire tourner le modèle retenu), pas par défaut vers l'architecture la plus récente.

## Comparatif des trois approches

| | OCR classique | CRNN + CTC | Transformer |
|---|---|---|---|
| Segmentation préalable en caractères | Nécessaire | Aucune | Aucune |
| Robustesse au texte cursif/dégradé | Faible | Bonne | Bonne à très bonne |
| Volume de données d'entraînement requis | Faible (motifs de référence) | Modéré | Élevé |
| Coût de calcul | Très faible | Faible à modéré | Modéré à élevé |

Voir aussi [L'OCR structuré et l'analyse de mise en page](/?c=traitement-de-documents&p=ocr-structure) pour l'étape qui utilise ce texte reconnu (le replacer dans une structure de page), et [Architectures : CNN, RNN et Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) pour le détail des briques (CNN, RNN, attention) réutilisées ici.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | L'OCR classique segmente la ligne en caractères puis compare chacun à des motifs de référence ; fragile dès que les caractères se touchent ou sont dégradés. Le CRNN combine CNN (extraction visuelle) et RNN (lecture séquentielle), avec CTC pour aligner une sortie plus longue que le texte final sans segmentation préalable. Un Transformer d'OCR remplace le RNN par l'attention et génère le texte directement, sans CTC. |
| **Outils utilisables** | Tesseract (moteur historique, OCR classique puis LSTM+CTC dans ses versions récentes), des modèles CRNN+CTC ou Transformer entraînables avec [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch). |
| **Pièges à éviter** | Appliquer l'OCR classique à un texte cursif ou dégradé. Croire que la règle de fusion CTC écrase des répétitions voulues dans le texte réel. Choisir un Transformer par défaut sans regarder le coût de calcul et le volume de données réellement disponibles. |
| **Bonnes pratiques** | Réserver l'OCR classique aux documents propres et imprimés. Laisser l'entraînement gérer la distinction entre répétition voulue et répétition à fusionner (CTC). Choisir l'architecture selon la diversité réelle des documents, pas selon sa nouveauté. |
