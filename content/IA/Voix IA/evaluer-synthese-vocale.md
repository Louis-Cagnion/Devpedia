---
order: 6
---

# Évaluer une synthèse vocale : MOS, intelligibilité, latence

[Évaluer un OCR](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) compare une sortie à une référence exacte connue (le texte réel de l'image). Une synthèse vocale n'a pas cette chance : il n'existe pas de "bonne réponse" unique pour "à quoi une voix doit ressembler", une question qui reste largement subjective.

## Le MOS (*Mean Opinion Score*) : mesurer une perception subjective

Le [**MOS**](https://fr.wikipedia.org/wiki/Mean_opinion_score) fait évaluer un échantillon audio par des auditeurs humains, sur une échelle de 1 (mauvais) à 5 (excellent), puis moyenne leurs notes :

```text
Echantillon audio genere
      │
      ▼
Note par plusieurs auditeurs humains independants : 4, 5, 3, 4, 4
      │
      ▼
MOS = moyenne des notes = (4+5+3+4+4) / 5 = 4.0
```

| MOS | Interprétation typique |
|---|---|
| Proche de 5 | Perçu comme une voix humaine réelle, quasi indiscernable |
| 3 à 4 | Compréhensible, mais des indices trahissent une origine synthétique |
| Sous 3 | Artefacts audibles gênants (voir la synthèse concaténative, voir [Fondamentaux](/?c=ia&s=voix-ia&p=synthese-classique-vs-deep-learning)) |

> **Piège :** comparer des scores MOS obtenus dans des conditions d'évaluation différentes (nombre d'auditeurs, consignes données, matériel d'écoute). Un MOS n'est pas une mesure physique absolue comme une longueur en mètres : deux protocoles d'évaluation différents produisent des scores qui ne se comparent pas directement, même sur le même échantillon audio.
>
> **Bonne pratique :** ne comparer des scores MOS que s'ils proviennent du même protocole d'évaluation (mêmes consignes, panel d'auditeurs comparable), ou utiliser un même prédicteur automatique de MOS pour les deux, jamais des scores glanés dans des contextes hétérogènes.

## L'intelligibilité : au-delà du naturel perçu

Un audio peut sonner "naturel" (MOS élevé) sans que chaque mot soit clairement compris, et inversement, une voix clairement synthétique peut rester parfaitement comprise. L'**intelligibilité** se mesure séparément, souvent en faisant retranscrire l'audio par des auditeurs et en comparant leur transcription au texte d'origine, exactement le même calcul de [WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) déjà vu pour l'OCR, mais appliqué à ce qu'un humain a compris à l'oreille plutôt qu'à ce qu'un modèle a reconnu sur une image.

> **Piège :** se fier uniquement au MOS pour un cas d'usage où la compréhension exacte du message compte plus que le naturel perçu (une annonce de sécurité, une alerte). Un MOS élevé ne garantit pas qu'un message critique reste intelligible à 100%.
>
> **Bonne pratique :** mesurer l'intelligibilité séparément du MOS dès qu'un cas d'usage exige une compréhension fiable du contenu, pas seulement une voix agréable à écouter.

## La latence : temps réel vs génération à l'avance

| | Génération à l'avance | Temps réel |
|---|---|---|
| Cas d'usage typique | Audiobook, narration vidéo | Assistant vocal, traduction en direct |
| Ce qui compte | Le temps total de génération (peut prendre plusieurs secondes par phrase) | Le délai entre l'envoi du texte et le premier son audible (*time to first audio*) |
| Contrainte sur l'architecture | Peu de contrainte : la génération peut tourner en arrière-plan | Nécessite un flux (*streaming*) : générer et jouer l'audio par petits segments, sans attendre la phrase entière |

> **Piège :** mesurer uniquement le temps total de génération d'une phrase entière pour juger si un modèle convient à un usage temps réel. Un modèle peut mettre 2 secondes à générer une phrase entière tout en produisant le premier segment audible en 200 ms via un flux progressif : c'est ce délai initial qui compte pour un usage interactif, pas le temps total.
>
> **Bonne pratique :** mesurer spécifiquement le délai avant le premier son audible pour un usage temps réel, et vérifier que l'architecture retenue supporte réellement un flux progressif plutôt qu'une génération bloquante de la phrase entière.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le MOS mesure une perception subjective de naturel via une notation humaine moyennée, non comparable entre protocoles différents. L'intelligibilité se mesure séparément (proche du WER, appliqué à l'écoute humaine) et compte davantage qu'un MOS élevé pour un message critique. La latence pertinente en temps réel est le délai avant le premier son, pas le temps de génération total. |
| **Outils utilisables** | Un panel d'auditeurs avec un protocole fixe pour le MOS. Une mesure de WER sur la retranscription humaine pour l'intelligibilité. Une architecture en flux (*streaming*) pour un usage temps réel. |
| **Pièges à éviter** | Comparer des MOS issus de protocoles différents. Se fier au seul MOS pour un message où la compréhension exacte compte. Juger la latence sur le temps de génération total plutôt que sur le délai avant le premier son. |
| **Bonnes pratiques** | Ne comparer des MOS qu'avec un protocole comparable. Mesurer l'intelligibilité séparément dès qu'elle est critique. Mesurer le délai avant le premier son pour un usage temps réel. |
