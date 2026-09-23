---
order: 11
---

# Recettes : vérifier, filtrer et fiabiliser

Dernière série de recettes : mesurer la stabilité d'un modèle de décision structurée, l'utiliser comme filtre de sécurité, et l'employer pour des tâches de recherche ou d'appel de fonction habituellement confiées à un LLM génératif.

## Self-consistency : mesurer la stabilité d'une réponse

La [self-consistency](/?c=ia&s=nlp-llm&p=reduire-la-variance-des-reponses#self-consistency-voter-sur-la-conclusion-de-plusieurs-raisonnements) d'un LLM génératif vote sur la conclusion de plusieurs raisonnements. Pour un modèle de décision structurée, l'équivalent consiste à répéter la même question plusieurs fois (15 fois dans les tests du fournisseur) et à mesurer l'écart-type des probabilités obtenues :

| Type de question | Résultat mesuré |
|---|---|
| Noul, répété 15 fois | Écart-type moyen de 0,0102 (très stable), contre des LLM génératifs qui varient même à température 0 |
| Choice, répété 15 fois | 99,2 % d'accord entre les répétitions avec une zone d'incertitude (probabilité maximale < 0,60 renvoyée comme "incertain"), contre 90,8 % sans cette zone |

Plutôt que de forcer une décision binaire à 0,5 pour un Noul, une **bande d'incertitude** absorbe les cas limites :

```python
if probabilite < 0.30:
    decision = "non"
elif probabilite > 0.70:
    decision = "oui"
else:
    decision = "incertain"   # escalade humain, la probabilite reste visible
```

## Re-ranking : réordonner une liste déjà présélectionnée

Une recherche rapide (mots-clés) produit d'abord une courte liste de candidats ; le **re-ranking** réordonne ensuite cette liste en jugeant chaque candidat individuellement par rapport à la requête, via une question Noul répétée sur chaque paire requête/candidat. Sur 40 requêtes juridiques testées, cette étape a fait passer la précision du premier résultat de 5 % à 18 %, et celle des dix premiers de 38 % à 62 %.

## Recherche sémantique ligne par ligne

Pour localiser la réponse à une question dans un document de plusieurs centaines de lignes, chaque ligne reçoit un identifiant (`L001`, `L002`...), puis deux questions s'exécutent en une seule requête : un Choice classe les lignes par pertinence, un Noul vérifie en parallèle si le document contient seulement une réponse. Cette seconde question distingue une mauvaise correspondance (le document ne répond pas) d'une réponse simplement mal classée.

## Appel de fonction : transformer une demande en langage naturel en appel typé

Une demande en langage naturel ("trace la corrélation glissante entre NVDA et SPY sur le dernier mois") se convertit en appel de fonction typé, où chaque paramètre n'accepte qu'un ensemble fermé de valeurs :

```text
"compare nvda amd et msft sur les trois derniers mois"
   -> compare_rendements(symboles=['NVDA','AMD','MSFT'], fenetre='3mo')
      confiance : 0.94
```

La confiance rapportée est celle du jugement **le moins certain** de la chaîne (pas une moyenne ni un produit de probabilités) : un seul paramètre mal identifié suffit à abaisser la confiance globale de l'appel.

## Vérification de citations : détecter une source fabriquée

Pour vérifier qu'une citation produite par un LLM existe réellement dans un document source :

```text
1. Recherche textuelle normalisee (espaces, guillemets) de la citation dans
   la source -> absente = verdict "fabriquee" immediat, pas besoin du modele
2. Si trouvee, une question Choice juge la relation entre citation et
   affirmation : soutient / contredit / n'aborde pas le sujet
```

| Verdict | Signification |
|---|---|
| Vérifiée | La source soutient l'affirmation |
| Contredite | La source contredit l'affirmation |
| Non soutenue | La source n'aborde pas le sujet |
| Fabriquée | La citation n'existe pas dans la source |

## Garde-fous : une couche de sécurité indépendante du modèle principal

Plutôt que de placer les règles de sécurité dans les instructions système d'un LLM (contournables) ou de les faire vérifier par un second LLM (coûteux, lui aussi contournable), une seule requête de décision structurée évalue chaque message entrant et sortant, avec un Noul par risque (contournement d'instructions, aide à une activité illégale, détresse...) et un Score de gravité globale :

```text
passe  <- risque sous tous les seuils
revision  <- au moins un risque proche du seuil, sans le depasser
bloque  <- un risque depasse le seuil de blocage
oriente_support  <- un motif de detresse est detecte
```

Les seuils restent définis et modifiables par l'application, plutôt qu'hérités du comportement par défaut d'un modèle.

## Découverte de features : transformer du texte libre en colonnes numériques

Un modèle de machine learning classique (ex : CatBoost) a besoin d'un tableau de nombres, pas de texte libre. Une boucle automatisée propose des questions sur le texte (intensité d'un trait, présence d'un fait), les convertit en colonnes via des probabilités calibrées, entraîne le modèle, puis utilise son erreur pour proposer de nouvelles questions. Sur 2000 avis testés, l'erreur de prédiction (RMSE) est passée de 2,47 (texte brut) à 1,77 après cinq itérations de cette boucle, sans qu'aucune des 38 questions finales n'ait été écrite manuellement.

> **Piège commun à ces sept recettes :** traiter une seule exécution comme définitivement fiable, sans jamais mesurer sa stabilité (self-consistency), sans filtre de sécurité indépendant (garde-fous), ou sans vérifier qu'une source citée existe réellement (citation check).
>
> **Bonne pratique commune :** ajouter une étape de vérification dédiée (répétition et mesure d'écart-type, garde-fou en amont/aval, recherche textuelle avant jugement) plutôt que de faire confiance à une seule réponse brute, en particulier sur tout ce qui touche à la sécurité ou à l'exactitude factuelle.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Sept recettes de fiabilisation : mesurer la stabilité par répétition (self-consistency), réordonner une liste par jugement individuel (re-ranking), localiser une réponse ligne par ligne, convertir une demande en appel de fonction typé, vérifier qu'une citation existe réellement, filtrer messages entrants/sortants par des garde-fous indépendants, transformer du texte libre en colonnes numériques exploitables par un modèle classique. |
| **Outils utilisables** | Répétitions et écart-type pour la self-consistency ; questions Noul/Choice pour re-ranking, recherche, function calling, citations, garde-fous ; boucle proposition/mesure pour la découverte de features. |
| **Pièges à éviter** | Faire confiance à une seule exécution sans vérification de stabilité ni garde-fou indépendant. |
| **Bonnes pratiques** | Ajouter systématiquement une étape de vérification dédiée avant de faire confiance à une réponse, en particulier sur la sécurité et l'exactitude factuelle. |
