---
order: 19
---

# Modèles "Document AI" : comprendre un document au-delà du texte pur

Les deux chapitres précédents traitent la lecture d'un document comme un **pipeline** : d'abord [détecter la mise en page](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page) (où sont les zones), puis [reconnaître le texte](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) de chaque zone, séparément. Ce chapitre présente une famille de modèles plus récente, dite **Document AI**, qui traite un document comme un objet à part entière (texte, position, apparence visuelle réunis), plutôt que comme du texte pur une fois l'OCR terminé.

## Ce qu'un LLM texte pur ne voit pas

Un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) classique reçoit une suite de [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm), sans aucune notion de **où** chaque mot se trouvait sur la page d'origine. Or, sur un document réel, la position porte du sens à elle seule :

```text
Facture n°2024-118          <- en haut de page, gras : un titre/reference
                             
Client        Montant       <- alignes en colonnes : un tableau
Dupont SA     1 250 EUR
```

Le même mot ("Montant") a un rôle différent selon qu'il apparaît comme en-tête de colonne ou dans une phrase de paragraphe : un modèle qui ignore la position doit deviner ce rôle uniquement à partir du texte environnant, avec plus de risques de confusion qu'un modèle qui voit directement la position.

## LayoutLM : fusionner texte, position et image

[**LayoutLM**](https://arxiv.org/abs/1912.13318) reprend l'architecture Transformer d'un LLM texte, mais construit l'[embedding](/?c=ia&s=nlp-llm&p=nlp-et-llm) de chaque token à partir de **trois** sources combinées, au lieu d'une seule :

```text
Pour chaque mot reconnu par l'OCR :

  embedding(texte du mot)  +  embedding(position x,y du mot)  +  embedding(image de la zone du mot)
         |                            |                                    |
   comme un LLM             coordonnees normalisees                extrait par un CNN
   texte classique          sur la page (0 a 1000)                 (police, style...)

                    = embedding final, envoye au Transformer
```

- **Texte** : le mot lui-même, comme dans n'importe quel LLM.
- **Position** : les coordonnées de la boîte englobante du mot (voir [Détection de mise en page](/?c=ia&s=vision-et-ocr&p=detection-de-mise-en-page)), converties elles aussi en vecteur.
- **Image** : une représentation visuelle de la zone (issue d'un [CNN](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers)), qui capture des indices que le texte seul ne porte pas (gras, taille de police, encadré).

Ces trois vecteurs sont additionnés pour former un seul embedding par mot, exactement comme un LLM texte additionne déjà l'embedding d'un token et son embedding de position dans la séquence : LayoutLM ajoute simplement deux dimensions supplémentaires (position **spatiale** 2D, et image) à ce mécanisme déjà connu.

> **Piège :** croire que LayoutLM se passe d'un OCR. LayoutLM a toujours besoin qu'un OCR ait d'abord extrait le texte de chaque mot et sa position : il enrichit ce que l'OCR a produit, il ne le remplace pas.
>
> **Bonne pratique :** situer LayoutLM comme une étape **après** l'OCR classique (reconnaissance de texte), pas comme une alternative à cette étape.

## Donut : se passer complètement de l'OCR

[**Donut**](https://arxiv.org/abs/2111.15664) (*Document understanding transformer*) prend le problème à l'envers : au lieu d'ajouter de l'information à un texte déjà extrait par OCR, il part directement de l'**image brute** du document et génère directement la sortie voulue (par exemple, une structure JSON avec les champs d'une facture), sans jamais faire tourner un OCR séparé :

```text
Pipeline classique (LayoutLM) :
Image -> OCR (texte + position) -> LayoutLM (texte+position+image) -> resultat structure

Donut (bout-en-bout, sans OCR) :
Image -> encodeur visuel -> decodeur -> resultat structure directement
```

L'architecture reprend le même principe encodeur/décodeur qu'un [Transformer d'OCR](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning) : un encodeur visuel lit l'image, un décodeur génère la sortie token par token. La différence est que la sortie n'est plus le texte brut de l'image, mais directement la structure finale voulue (les champs déjà extraits et nommés).

| | Pipeline classique (OCR + LayoutLM) | Bout-en-bout (Donut) |
|---|---|---|
| Étapes | Plusieurs modèles spécialisés enchaînés | Un seul modèle, entrée image, sortie structure |
| Chaque étape inspectable séparément | Oui (le texte reconnu, la position, la structure finale sont chacun visibles) | Non (seule la sortie finale est visible ; impossible de savoir "où" une erreur a été introduite) |
| Sensible aux erreurs d'OCR classique | Oui (une erreur de reconnaissance de caractère se propage) | Moins directement, mais ses propres erreurs sont plus difficiles à diagnostiquer |
| Volume de données d'entraînement requis | Modéré (chaque modèle spécialisé s'entraîne sur une tâche étroite) | Élevé (le modèle doit apprendre la tâche complète d'un seul bloc) |

> **Piège :** choisir Donut par défaut parce qu'il est plus récent et plus simple à appeler (une seule étape). Un pipeline classique reste plus facile à déboguer (chaque étape produit un résultat intermédiaire vérifiable) et demande moins de données d'entraînement pour un cas d'usage étroit.
>
> **Bonne pratique :** choisir une architecture bout-en-bout quand la simplicité opérationnelle (un seul modèle à maintenir) compte plus que la capacité à diagnostiquer précisément une erreur ; garder un pipeline classique quand la traçabilité de chaque étape est importante (un contexte réglementé, par exemple), ou que le volume de données d'entraînement disponible reste limité.

## PP-StructureV3 : un pipeline classique complet et prêt à l'emploi

Le chapitre [L'OCR structuré et l'analyse de mise en page](/?c=traitement-de-documents&p=ocr-structure) mentionne déjà [**PP-StructureV3**](https://github.com/PaddlePaddle/PaddleOCR) : c'est un exemple concret de pipeline classique (au sens de la ligne "Pipeline classique" du tableau ci-dessus), qui enchaîne détection de mise en page, OCR, et reconstruction de tableaux comme des étapes séparées, mais fournies déjà assemblées et prêtes à l'emploi plutôt qu'à construire soi-même modèle par modèle.

Voir aussi [L'OCR structuré et l'analyse de mise en page](/?c=traitement-de-documents&p=ocr-structure) pour le détail de la reconstruction de grille en aval de ce chapitre, et [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) pour le mécanisme d'embedding et d'attention réutilisé ici.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un LLM texte pur ignore la position d'un mot sur la page, une information porteuse de sens sur un document réel. LayoutLM fusionne texte, position et image dans un seul embedding, mais a toujours besoin d'un OCR en amont. Donut se passe entièrement d'OCR en générant directement une sortie structurée depuis l'image, au prix d'une traçabilité étape par étape perdue. PP-StructureV3 est un exemple de pipeline classique complet, prêt à l'emploi. |
| **Outils utilisables** | LayoutLM et Donut comme modèles pré-entraînés réutilisables ; PP-StructureV3 comme pipeline classique déjà assemblé. |
| **Pièges à éviter** | Croire que LayoutLM remplace l'OCR. Choisir une architecture bout-en-bout par défaut sans considérer la perte de traçabilité et le volume de données requis. |
| **Bonnes pratiques** | Situer LayoutLM après l'OCR, pas à sa place. Réserver le bout-en-bout aux cas où la simplicité opérationnelle prime sur la traçabilité, et garder un pipeline classique dans un contexte réglementé ou à données limitées. |
