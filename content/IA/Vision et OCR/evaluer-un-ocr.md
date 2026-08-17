---
order: 21
---

# Évaluer un OCR : CER, WER et taux de reconnaissance par champ

Le principe général d'évaluation (séparer un jeu de test, comparer une prédiction à la vraie réponse) est déjà posé dans [Introduction au machine learning](/?c=data-science&p=machine-learning-scikit-learn). Un OCR a cependant un avantage qu'un LLM n'a pas : sa sortie se compare directement à une **vraie réponse connue** (le texte réel de l'image), sans le non-déterminisme qui oblige à des méthodes comme le golden set ou le LLM-as-judge (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)). Ce chapitre couvre les métriques spécifiques à cette comparaison directe.

> **Note :** ce déterminisme reste théorique au bit près. Sur un calcul multi-thread (les bibliothèques d'inférence comme MKL-DNN/oneDNN parallélisent les opérations internes), l'addition en virgule flottante n'est pas associative : additionner les mêmes nombres dans un ordre différent d'un run à l'autre peut produire un résultat légèrement différent. Deux exécutions du même modèle, sur le même CPU, peuvent donc en théorie diverger d'un epsilon numérique, un phénomène sans rapport avec le non-déterminisme par échantillonnage d'un LLM (voir plus haut) et en pratique presque toujours trop infime pour changer le texte reconnu.

## Mesurer l'écart entre deux textes : la distance d'édition

Comparer deux textes caractère par caractère à une position fixe échouerait dès le premier caractère manquant ou ajouté : tout le reste se décalerait, un désaccord artificiel à chaque position suivante. La [**distance de Levenshtein**](https://fr.wikipedia.org/wiki/Distance_de_Levenshtein) résout ce problème : le nombre minimal d'opérations (substituer, insérer, supprimer un caractère) pour transformer un texte en un autre.

```text
Texte reconnu :   "Ies chats dorment"
Texte reel :      "Les chats dorment"
                    ^
              1 substitution (I -> L) -> distance de Levenshtein = 1
```

```python
def distance_levenshtein(a, b):
    # table[i][j] = distance entre les i premiers caracteres de a et les j premiers de b
    table = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        table[i][0] = i   # transformer a[:i] en "" coute i suppressions
    for j in range(len(b) + 1):
        table[0][j] = j   # transformer "" en b[:j] coute j insertions

    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                table[i][j] = table[i - 1][j - 1]              # caracteres identiques, rien a faire
            else:
                table[i][j] = 1 + min(
                    table[i - 1][j],      # suppression
                    table[i][j - 1],      # insertion
                    table[i - 1][j - 1],  # substitution
                )
    return table[len(a)][len(b)]
```

## CER (*Character Error Rate*) : la distance d'édition, en proportion

Une distance brute de 5 n'a pas le même poids sur un mot de 6 lettres que sur une page de 2000 caractères : le **CER** rapporte cette distance à la longueur du texte de référence, pour obtenir une proportion comparable entre documents de tailles différentes.

```python
def cer(texte_reconnu, texte_reel):
    return distance_levenshtein(texte_reconnu, texte_reel) / len(texte_reel)

cer("Ies chats dorment", "Les chats dorment")  # 1 / 18 ~= 0.056 -> 5,6% de caracteres errones
```

Un CER de 0 signifie une reconnaissance parfaite ; un CER de 0,05 (5%) signifie qu'en moyenne, 5 caractères sur 100 sont mal reconnus.

## WER (*Word Error Rate*) : la même idée, au niveau du mot

Le **WER** applique le même calcul (distance d'édition, rapportée à la longueur de référence), mais sur la séquence de **mots** plutôt que de caractères :

```python
def wer(texte_reconnu, texte_reel):
    return distance_levenshtein(texte_reconnu.split(), texte_reel.split()) / len(texte_reel.split())
```

| | CER | WER |
|---|---|---|
| Unité comparée | Caractère | Mot |
| Sensibilité | Une seule lettre fausse dans un mot de 10 lettres pèse peu | La même erreur invalide le mot entier : plus proche de la lisibilité humaine |
| Cas d'usage typique | Écritures sans séparateur de mot net, ou évaluation fine d'un moteur de reconnaissance | Évaluation orientée usage final (un mot mal reconnu reste un mot à corriger, quelle que soit l'ampleur de l'erreur) |

> **Piège :** ne suivre qu'une seule de ces deux métriques et en tirer une conclusion générale sur "la qualité" du modèle. Un CER bas peut masquer un WER élevé (beaucoup de mots légèrement décalés, chacun compté comme faux au niveau mot) : les deux métriques répondent à des questions différentes, pas à la même question avec plus ou moins de précision.
>
> **Bonne pratique :** suivre les deux métriques en parallèle, et choisir celle qui prime selon l'usage réel (WER si un humain doit relire et corriger mot par mot, CER pour un diagnostic plus fin du comportement du modèle).

## Le piège du score global : le taux de reconnaissance par champ

Sur un document structuré (une facture, un formulaire), un CER ou un WER calculé sur l'intégralité du texte masque **où** se concentrent les erreurs :

```text
Facture avec CER global de 2% (excellent en apparence) :

  Adresse du client : "12 rue de la Paix, 750O8 Paris"   <- erreur sur 1 caractere du code postal (O au lieu de 0)
  Montant total      : "1 250,00 EUR"                     <- parfaitement reconnu

  Le CER global (2%) noie l'erreur sur le code postal (un champ critique pour la livraison)
  dans la masse du texte correctement reconnu autour.
```

> **Piège :** se satisfaire d'un CER ou WER global faible sans vérifier la répartition des erreurs par champ. Une seule erreur sur un champ critique (un montant, une date d'échéance, un numéro de compte) peut avoir des conséquences bien plus graves qu'un CER global agrégé ne le laisse penser, surtout si cette erreur se concentre systématiquement sur le même type de champ (une confusion récurrente O/0 dans les codes postaux, par exemple).
>
> **Bonne pratique :** calculer un CER/WER **par champ** identifié (montant, date, référence client...) en plus du score global, sur un jeu de documents représentatif, pour repérer un champ systématiquement plus fragile que les autres avant la mise en production.

Un jeu de test annoté (des images accompagnées de leur transcription exacte, vérifiée à la main) rejoué à chaque changement de modèle ou de version reprend exactement le principe du **golden set** déjà vu pour un LLM (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), appliqué ici à une sortie déterministe plutôt qu'à une sortie qui varie d'un appel à l'autre.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La distance de Levenshtein mesure le nombre minimal d'opérations pour transformer un texte en un autre. Le CER la rapporte à la longueur du texte au niveau caractère, le WER au niveau mot ; les deux répondent à des questions différentes et se suivent en parallèle. Un score global masque la répartition réelle des erreurs : mesurer aussi par champ sur un document structuré. |
| **Outils utilisables** | Un jeu de test annoté (golden set), rejoué à chaque changement de modèle. Des bibliothèques dédiées (`jiwer`, par exemple) calculent CER/WER sans réimplémenter la distance d'édition à la main. |
| **Pièges à éviter** | Ne suivre qu'une seule des deux métriques. Se satisfaire d'un score global sans vérifier la répartition des erreurs par champ. |
| **Bonnes pratiques** | Suivre CER et WER en parallèle. Calculer un score par champ en plus du score global sur un document structuré. |
