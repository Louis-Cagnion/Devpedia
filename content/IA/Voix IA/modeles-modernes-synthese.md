---
order: 3
---

# Modèles modernes de synthèse : les codecs neuronaux

[Tacotron + vocodeur](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning) traite le texte et l'audio comme deux mondes séparés, reliés par un spectrogramme intermédiaire. Une famille de modèles plus récente, illustrée par [**VALL-E**](https://arxiv.org/abs/2301.02111), unifie les deux en traitant la synthèse vocale comme un problème de langage, exactement comme un LLM traite du texte.

## L'idée clé : l'audio devient une séquence de tokens

Un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) prédit le token de texte suivant, à partir de ceux qui précèdent. VALL-E applique le même principe, mais sur des **tokens audio** plutôt que des tokens de texte :

```text
LLM texte :
"Le chat dort sur le" -> predit le token de texte suivant ("canape")

VALL-E (LLM applique a l'audio) :
Texte a lire + quelques secondes de voix de reference
      -> predit une sequence de tokens audio, un par un
      -> ces tokens audio sont ensuite decodes en un signal sonore
```

Ces tokens audio proviennent d'un **codec neuronal** (*neural codec*) : un modèle entraîné séparément à compresser un signal audio en une courte séquence de nombres discrets (les tokens), puis à le reconstruire depuis ces mêmes tokens, un peu comme un fichier audio compressé (MP3) représente un son par une suite de nombres plus courte que l'onde d'origine, mais appris plutôt que conçu à la main.

> **Piège :** confondre cette approche avec Tacotron sous prétexte que les deux "génèrent de l'audio à partir de texte". Tacotron produit un spectrogramme continu (une image), token par token dans le cas de VALL-E, c'est une séquence discrète de symboles, prédite exactement comme un LLM prédit du texte : l'objectif d'entraînement et la nature de la sortie intermédiaire diffèrent complètement.
>
> **Bonne pratique :** identifier si un modèle produit une représentation continue (spectrogramme) ou une séquence de tokens discrets avant de le comparer à un autre : ce choix structurel explique une bonne partie de ses forces et limites (voir le clonage de voix ci-dessous).

## Ce que cette architecture permet : le clonage "zero-shot"

Parce que le modèle reçoit "quelques secondes de voix de référence" comme partie de son entrée (comme un [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) qui guide un LLM), il peut imiter une voix qu'il n'a jamais vue à l'entraînement, à partir d'un très court échantillon, sans aucun ré-entraînement :

| | Voix "figée" (une voix pré-entraînée) | Clonage zero-shot (VALL-E et équivalents) |
|---|---|---|
| Nouvelle voix disponible | Non, seulement les voix déjà entraînées | Oui, à partir de quelques secondes d'audio de référence |
| Ré-entraînement nécessaire | Non (déjà entraîné) | Non (le modèle généralise à partir de l'exemple donné en entrée) |
| Contrôle du résultat | Prévisible, la voix a été validée à l'entraînement | Variable, la fidélité dépend de la qualité et de la durée de l'échantillon de référence |

Ce mécanisme est développé plus en détail, avec ses enjeux éthiques et légaux, dans [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | VALL-E et les modèles similaires traitent la synthèse vocale comme un problème de langage : un codec neuronal convertit l'audio en tokens discrets, qu'un modèle prédit un par un comme un LLM prédit du texte. Cette architecture permet le clonage de voix "zero-shot" à partir d'un court échantillon, sans ré-entraînement. |
| **Outils utilisables** | Un codec neuronal pour convertir l'audio en tokens ; un modèle de type LLM pour prédire ces tokens à partir du texte et d'un échantillon de référence. |
| **Pièges à éviter** | Confondre cette architecture avec Tacotron parce que les deux "génèrent de l'audio à partir de texte", en ignorant la différence entre représentation continue et tokens discrets. |
| **Bonnes pratiques** | Identifier si un modèle produit une représentation continue ou des tokens discrets avant de le comparer à un autre. |
