---
order: 6
---

# Post-traitement et correction d'un OCR

Le [chapitre sur l'évaluation](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) mesure les erreurs d'un OCR ; ce chapitre couvre l'étape qui vient juste après, avant d'utiliser le texte reconnu : tenter de **corriger** automatiquement les erreurs les plus probables, sans repasser par le modèle de reconnaissance lui-même.

## Correction par dictionnaire

La correction par dictionnaire compare chaque mot reconnu à une liste de mots valides (un **lexique**) : si le mot reconnu n'y figure pas, il est remplacé par l'entrée du lexique la plus proche, mesurée par la [distance de Levenshtein](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr) déjà vue pour l'évaluation :

```python
def corriger_par_dictionnaire(mot, lexique, distance_max=2):
    if mot in lexique:
        return mot   # deja un mot valide, rien a corriger

    candidats = [(entree, distance_levenshtein(mot, entree)) for entree in lexique]
    meilleure_entree, meilleure_distance = min(candidats, key=lambda c: c[1])

    if meilleure_distance <= distance_max:
        return meilleure_entree   # suffisamment proche : on corrige
    return mot                     # trop different de tout mot connu : on ne touche a rien
```

> **Piège :** utiliser un dictionnaire de langue générique (les mots du français courant) sur un document métier. Un nom propre, une référence produit ou un identifiant technique (`SIRET`, une référence de commande) n'appartient à aucun dictionnaire généraliste : le mécanisme de correction les "corrigerait" vers le mot du dictionnaire le plus proche, souvent un mot totalement différent du bon.
>
> **Bonne pratique :** construire ou compléter le lexique à partir du vocabulaire réellement rencontré dans le domaine métier (noms de clients, références produit, terminologie du secteur), pas seulement d'un dictionnaire de langue générique.

## Correction contextuelle : au-delà du mot isolé

Une correction par dictionnaire traite chaque mot isolément, sans tenir compte de ce qui l'entoure. Une confusion fréquente en OCR (le chiffre `0` lu comme la lettre `O`, ou l'inverse) donne souvent lieu à un mot qui existe bel et bien dans un dictionnaire, mais faux dans son contexte :

```text
"Montant total : 1O0 EUR"
                  ^
        "1O0" n'est reconnu comme suspect par AUCUN dictionnaire de mots
        (ce n'est pas un mot) ; il faut le contexte ("Montant", "EUR")
        pour savoir qu'une suite de chiffres est attendue ici, pas une lettre
```

La correction contextuelle s'appuie sur un modèle qui évalue la **plausibilité** d'une séquence entière, pas d'un mot isolé : exactement le principe déjà vu dans [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), où un modèle de langage attribue une distribution de probabilité au token suivant compte tenu de ce qui précède. Appliqué ici, un modèle de langage évalue laquelle des lectures candidates (`1O0` vs `100`) est la plus probable étant donné le contexte ("Montant total :", suivi de "EUR") plutôt que de juger le token seul.

> **Piège :** appliquer une correction contextuelle uniforme, avec la même confiance, à tout le document. Une correction basée sur la plausibilité **statistique** peut, à l'inverse d'une erreur d'OCR réelle, "corriger" une valeur rare mais parfaitement exacte (un montant inhabituel, un nom peu commun) vers une valeur plus fréquente mais fausse.
>
> **Bonne pratique :** réserver la correction contextuelle automatique aux champs en texte libre, et la désactiver (ou l'utiliser uniquement en signalement, pas en remplacement automatique) sur les champs à haute contrainte de format (montants, identifiants), traités par validation de format (voir plus bas), plus fiable pour ce type de donnée.

## Validation par format : exploiter ce qu'on sait déjà du champ attendu

Beaucoup de champs d'un document structuré suivent un format connu à l'avance (une date, un numéro de SIRET à 14 chiffres, un code postal à 5 chiffres) : une contrainte qu'une [expression régulière](/?c=domain-specific-languages-dsl&p=regex) suffit à vérifier, sans dictionnaire ni modèle de langage :

```python
import re

def format_siret_valide(texte):
    return re.fullmatch(r"\d{14}", texte) is not None

format_siret_valide("1234567890123 4")  # False -> un espace en trop, signale une erreur probable d'OCR
format_siret_valide("12345678901234")   # True
```

Un champ qui échoue cette vérification est signalé comme suspect, même sans savoir précisément *quelle* correction appliquer : une information déjà utile en elle-même pour prioriser une relecture humaine.

## Détection par forme statistique : signaler sans corriger

Les trois approches précédentes ont toutes un point commun : elles savent, ou tentent de deviner, **quelle** valeur serait correcte. Un champ en texte libre, sans lexique métier ni format connu, ne se prête à aucune des trois : reste la possibilité de repérer qu'**une valeur a une forme statistiquement suspecte**, sans prétendre savoir la corriger.

Deux signaux fréquents en pratique :

- **Un ratio de lettres isolées anormalement élevé** : une lettre unique entourée de chiffres (`"12A34"`) est rare dans un texte réel bien reconnu ; un taux élevé de ce motif sur un document trahit souvent une confusion chiffre/lettre systématique du modèle d'OCR sur ce document précis.
- **Un motif de substitution restreint à un sous-ensemble confondable** : `0`/`O`, `1`/`l`/`I`, `5`/`S`, `8`/`B` se ressemblent visuellement et se confondent souvent ensemble ; une substitution en dehors de ce sous-ensemble (un `7` lu `K`, par exemple) est statistiquement bien plus rare et mérite une vigilance différente.

> **Piège :** confondre cette approche avec la correction contextuelle (vue plus haut) : la détection statistique ne propose **aucune** valeur de remplacement, elle se contente de signaler un champ comme suspect. La traiter comme une correction (remplacer automatiquement) revient à deviner une valeur sans aucune base réelle, pire qu'une correction contextuelle mal calibrée.
>
> **Bonne pratique :** réserver cette détection aux champs qui échappent aux trois approches précédentes (pas de lexique métier, pas de format connu, contexte insuffisant pour un modèle de langage), et toujours la faire déboucher sur une relecture humaine, jamais sur un remplacement automatique.

## Ne jamais perdre la trace du texte brut

Quelle que soit la méthode de correction appliquée, le texte reconnu **avant** correction reste une information précieuse : sans lui, il devient impossible de savoir après coup si une valeur vient du modèle d'OCR ou d'une correction automatique, ni de mesurer l'effet réel de cette correction sur la qualité globale (voir le [CER/WER](/?c=ia&s=vision-et-ocr&p=evaluer-un-ocr)).

> **Piège :** écraser le texte brut reconnu par sa version corrigée, sans conserver l'original. Un audit ultérieur, ou un futur changement de stratégie de correction, perd alors toute possibilité de comparer avant/après.
>
> **Bonne pratique :** toujours conserver le texte brut à côté du texte corrigé (deux champs distincts, jamais un seul champ écrasé), avec si possible la méthode de correction appliquée à chaque champ.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La correction par dictionnaire remplace un mot absent d'un lexique par son entrée la plus proche (distance de Levenshtein). La correction contextuelle juge la plausibilité d'une séquence entière via un modèle de langage, utile face à des confusions que le mot isolé ne révèle pas. La validation par format (regex) détecte une anomalie sur un champ à structure connue, sans dictionnaire ni modèle. La détection par forme statistique signale un champ suspect sans proposer de correction, pour les cas que les trois précédentes ne couvrent pas. |
| **Outils utilisables** | Un lexique métier construit sur le vocabulaire réellement rencontré. Un modèle de langage pour la correction contextuelle. Des expressions régulières pour valider un champ à format connu. Un ratio de lettres isolées ou un motif de substitution restreint pour la détection statistique. |
| **Pièges à éviter** | Utiliser un dictionnaire de langue générique sur du vocabulaire métier. Appliquer une correction contextuelle automatique sur des champs à haute contrainte de format. Écraser le texte brut par sa version corrigée. Traiter une détection statistique comme une correction, en remplaçant automatiquement la valeur signalée. |
| **Bonnes pratiques** | Construire le lexique à partir du vocabulaire métier réel. Réserver la correction contextuelle au texte libre, valider les champs à format connu par regex. Toujours conserver le texte brut à côté du texte corrigé. Faire déboucher toute détection statistique sur une relecture humaine, jamais un remplacement automatique. |
