---
order: 1
---

# Synthèse vocale : de la concaténation classique au deep learning

La **synthèse vocale** (*text-to-speech*, TTS) convertit du texte en audio. Comme pour l'OCR (voir [OCR : de la reconnaissance de motifs classique au deep learning](/?c=ia&s=vision-et-ocr&p=ocr-classique-vs-deep-learning)), les premières approches reposaient sur des règles et des fragments enregistrés, avant que le deep learning ne les remplace par des modèles entraînés de bout en bout.

## La synthèse concaténative : assembler des fragments enregistrés

Une voix humaine est enregistrée en studio, puis découpée en petits fragments sonores (des **diphones** : la transition entre deux sons consécutifs, par exemple le son entre "a" et "b" dans "ab"). Pour prononcer un nouveau mot, le système sélectionne et assemble les fragments correspondants dans une grande bibliothèque pré-enregistrée :

```text
Texte : "chat"
        │
        ▼
Decoupage en phonemes : ch - a - t
        │
        ▼
Recherche des diphones correspondants dans la bibliotheque enregistree :
  silence->ch, ch->a, a->t, t->silence
        │
        ▼
Concatenation des fragments audio trouves -> signal audio final
```

| | Avantage | Limite |
|---|---|---|
| Synthèse concaténative | Voix naturelle sur les fragments enregistrés (ce sont de vrais enregistrements) | Transitions parfois audibles entre fragments ; couverture limitée aux combinaisons prévues à l'enregistrement ; une nouvelle voix demande de tout ré-enregistrer |

> **Note :** la **Web Speech API** du navigateur (`SpeechSynthesisUtterance`, utilisée par la lecture audio de Devpedia elle-même) est une abstraction : elle délègue la synthèse réelle aux voix installées sur le système, qui varient selon l'appareil. Certaines de ces voix système restent proches du principe concaténatif décrit ici ; d'autres, sur des systèmes plus récents, s'appuient déjà sur des modèles neuronaux en interne. L'API elle-même ne dit rien du moteur sous-jacent, seulement une interface commune pour le piloter (texte à lire, langue, débit, hauteur).

> **Piège :** croire qu'un fragment enregistré peut se combiner avec n'importe quel autre sans perte de qualité. Deux diphones enregistrés dans des phrases différentes n'ont jamais exactement la même intonation, le même volume ou le même débit : les recoller produit souvent une transition audible, un artefact caractéristique de la synthèse concaténative.
>
> **Bonne pratique :** pour un cas d'usage où la qualité perçue compte (voir le [chapitre sur l'évaluation](/?c=ia&s=voix-ia&p=evaluer-synthese-vocale)), préférer un modèle de deep learning aux approches concaténatives dès que possible : il ne souffre pas de cet artefact, au prix d'un besoin de calcul plus important.

## La synthèse par deep learning : Tacotron et le vocodeur

Un modèle de deep learning ne recolle plus des fragments existants : il **génère** un signal audio, comme un [Transformer génère du texte token par token](/?c=ia&s=nlp-llm&p=nlp-et-llm). L'architecture pionnière, **Tacotron** (puis Tacotron 2), sépare le problème en deux étapes :

```text
Texte -> [Tacotron : encodeur-decodeur avec attention] -> spectrogramme (mel)
                                                                  │
                                                                  ▼
                                              [Vocodeur, ex. WaveNet] -> signal audio final
```

- **Tacotron** convertit le texte en un **spectrogramme mel** : une représentation image-comme-un-tableau de l'énergie sonore par fréquence au fil du temps, pas encore un signal audio jouable, via un encodeur-décodeur avec [attention](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers), le même mécanisme qu'un LLM utilise pour le texte.
- Le **vocodeur** (ex. **WaveNet**) convertit ce spectrogramme en une véritable onde sonore, échantillon par échantillon.

> **Piège :** croire qu'un spectrogramme mel est directement un son écoutable. C'est une représentation intermédiaire (proche de ce qu'une partition musicale décrit, en plus détaillé) : il faut le vocodeur pour la transformer en onde sonore réellement audible.
>
> **Bonne pratique :** traiter la génération de spectrogramme et le vocodage comme deux étapes distinctes, potentiellement remplaçables indépendamment (un même Tacotron peut fonctionner avec plusieurs vocodeurs différents), plutôt que comme un seul bloc indivisible.

## Comparatif

| | Concaténative | Deep learning (Tacotron + vocodeur) |
|---|---|---|
| Ce qui produit le son | Assemblage de fragments réellement enregistrés | Génération entièrement calculée par le modèle |
| Naturel sur les cas prévus | Oui | Oui, et sur une plus large variété de phrases |
| Artefacts typiques | Transitions audibles entre fragments | Rares avec un modèle bien entraîné, mais un vocodeur de mauvaise qualité produit un son "métallique" |
| Ajouter une nouvelle voix | Ré-enregistrer toute la bibliothèque de fragments | Ré-entraîner ou fine-tuner sur de nouveaux enregistrements (voir [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

Voir aussi [Architectures : CNN, RNN et Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) pour le mécanisme d'attention réutilisé ici, et [Contrôler la prosodie](/?c=ia&s=voix-ia&p=controler-la-prosodie) pour ce que Tacotron ne contrôle qu'implicitement.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La synthèse concaténative assemble des fragments audio réellement enregistrés (diphones), avec des transitions parfois audibles. La synthèse par deep learning génère le son : Tacotron convertit le texte en spectrogramme mel via attention, un vocodeur (WaveNet) le convertit ensuite en onde sonore. La Web Speech API du navigateur est une abstraction qui délègue à l'un ou l'autre selon le système. |
| **Outils utilisables** | La Web Speech API pour une synthèse simple, sans coût, côté client. Tacotron 2 + un vocodeur neuronal pour une synthèse de meilleure qualité, plus coûteuse en calcul. |
| **Pièges à éviter** | Supposer que deux fragments concaténés s'assemblent sans perte de qualité. Confondre un spectrogramme mel avec un signal audio directement jouable. |
| **Bonnes pratiques** | Préférer le deep learning à la concaténation dès que la qualité perçue compte. Traiter génération de spectrogramme et vocodage comme deux étapes distinctes. |
