---
order: 2
---

# Les trois primitives de question : Choice, Score et Noul

Le [chapitre précédent](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm) explique qu'un modèle de décision structurée ne répond jamais par du texte libre : il répond à une **question fermée**, posée contre un **état** (le contenu à évaluer, un message, un document...). Concrètement, cette question fermée prend toujours l'une de ces trois formes, appelées des **primitives** :

| Primitive | La question qu'elle pose | Ce qu'elle renvoie |
|---|---|---|
| **Choice** | "Laquelle de ces options ?" | L'option choisie, une probabilité par option, une confiance |
| **Score** | "À quel niveau, sur cette échelle ?" | Une position sur l'échelle, une probabilité par niveau, une confiance |
| **Noul** | "Cette affirmation est-elle vraie ?" | Une seule probabilité, entre 0 et 1 |

Chaque question porte un identifiant, un type (`choice`, `score` ou `noul`) et des instructions. Plusieurs questions peuvent être posées en une seule requête contre le même état : chacune est évaluée **indépendamment**, sans voir la réponse des autres.

## Choice : choisir parmi des options sans ordre

**Choice** sert à sélectionner une catégorie parmi un ensemble connu à l'avance, sans hiérarchie entre les options (contrairement à Score, voir plus bas). Exemple : router un ticket de support vers la bonne équipe.

```json
{
  "departement": {
    "type": "choice",
    "instructions": "Quelle equipe doit traiter ce ticket ?",
    "criteria": {
      "retours": "Echanges, articles manquants ou endommages",
      "livraison": "Statut de livraison, retards, colis perdus",
      "facturation": "Facturation, factures, problemes de paiement"
    }
  }
}
```

La réponse contient trois éléments :

```json
{
  "choice": "retours",
  "confidence": 1.0,
  "probabilities": { "retours": 1.0, "livraison": 0.0, "facturation": 0.0 }
}
```

`probabilities` totalise toujours 1 (c'est une distribution) ; `choice` est l'option qui a reçu la plus forte probabilité ; `confidence` (entre 0 et 1) mesure à quel point cette probabilité domine les autres.

| Piège | Bonne pratique |
|---|---|
| Proposer des options qui se recouvrent (ex : "retours" et "echanges" comme deux options distinctes alors qu'un même cas relève des deux) | Rédiger des critères mutuellement exclusifs, avec des descriptions qui listent explicitement ce qu'une option couvre (et ce qu'elle exclut) |
| Ne prévoir aucune option pour un cas hors périmètre | Ajouter systématiquement une option "autre", pour ne jamais forcer un choix qui ne correspond à rien |

Une requête accepte jusqu'à 255 options par question Choice.

## Score : noter sur une échelle ordonnée

**Score** sert à positionner une évaluation sur un continuum, quand les niveaux ont un ordre naturel (sévérité, satisfaction, compétence). Les niveaux sont numérotés de `0` à leur position dans la liste :

```json
{
  "severite_bug": {
    "type": "score",
    "instructions": "Quelle est la severite du probleme ?",
    "criteria": [
      "Aucun impact fonctionnel",
      "Fonctionnalite degradee mais un contournement existe",
      "Blocage complet"
    ]
  }
}
```

La réponse renvoie une position **pondérée**, pas forcément un entier :

```json
{
  "score": 1.43,
  "confidence": 0.35,
  "probabilities": { "0": 0.0, "1": 0.57, "2": 0.43 },
  "legend": { "0": "Aucun impact", "1": "Contournement existe", "2": "Blocage complet" }
}
```

`score` se calcule comme une moyenne pondérée par les probabilités de chaque niveau :

```python
# score = somme, sur chaque niveau, de (numero_du_niveau x probabilite_du_niveau)
niveaux        = [0, 1, 2]
probabilites   = [0.0, 0.57, 0.43]
score = sum(niveau * proba for niveau, proba in zip(niveaux, probabilites))
# -> 0*0.0 + 1*0.57 + 2*0.43 = 1.43
```

Une échelle Score accepte entre 2 et 10 niveaux.

| Piège | Bonne pratique |
|---|---|
| Décrire des degrés abstraits ("modérément grave") plutôt que des situations concrètes | Décrire ce qui est observable ("fonctionnalité cassée avec contournement"), plus facile à évaluer de façon cohérente |
| Évaluer plusieurs dimensions dans une seule question ("rapide ET expérimenté") | Une dimension par question Score ; combiner ensuite plusieurs scores en code (moyenne pondérée, seuils) |

Une confiance basse signale généralement un chevauchement entre niveaux voisins ou une question qui mélange plusieurs dimensions.

## Noul : vérifier une affirmation binaire

**Noul** répond à une question oui/non, ou juge la véracité d'une affirmation, par une probabilité unique :

```json
{
  "demande_humain": {
    "type": "noul",
    "instructions": "Le client demande-t-il a parler a un humain ?"
  }
}
```

```json
{ "noul": 0.92 }
```

Une valeur proche de 1 signifie oui avec quasi-certitude, proche de 0 signifie non avec quasi-certitude, proche de 0.5 signifie incertitude. Il n'y a pas de champ `confidence` séparé : la probabilité elle-même porte à la fois la réponse et le degré de certitude.

En code, on seuille cette probabilité plutôt que de la traiter comme un booléen brut :

```python
SEUIL_OUI = 0.8
SEUIL_NON = 0.2

probabilite = reponse["noul"]
if probabilite > SEUIL_OUI:
    decision = "oui"
elif probabilite < SEUIL_NON:
    decision = "non"
else:
    decision = "incertain"   # escalade vers un humain
```

| Piège | Bonne pratique |
|---|---|
| Combiner deux conditions dans une seule affirmation ("le client est en colère ET demande un remboursement") | Une affirmation par Noul ; poser deux Noul distincts si deux conditions sont réellement à vérifier |
| Traiter la probabilité comme un booléen strict (`> 0.5`) sans zone d'incertitude | Adapter les deux seuils au coût d'une erreur : un seuil plus large pour une action réversible, plus étroit pour une action à fort enjeu |

## Comparer les trois primitives

| | Choice | Score | Noul |
|---|---|---|---|
| Nature des réponses possibles | Catégories sans ordre | Niveaux ordonnés | Vrai/faux |
| Nombre d'options | Jusqu'à 255 | 2 à 10 | Toujours 2 (implicite) |
| Réponse renvoyée | Une catégorie + distribution | Une position pondérée + distribution | Une seule probabilité |
| Champ de confiance séparé | Oui | Oui | Non (la probabilité en tient lieu) |
| Exemple d'usage | Router, classer | Noter une sévérité, une qualité | Vérifier une affirmation, filtrer |

## Structurer les critères en JSON plutôt qu'en texte libre

Les champs `instructions` et `criteria` des trois primitives acceptent aussi bien une simple chaîne qu'une structure [JSON](/?c=infrastructure&p=json) (objet ou tableau). Structurer devient utile dans deux cas : une question à plusieurs volets (les clés nomment chaque volet, ce qu'une phrase ne fait pas aussi clairement) et une donnée déjà structurée à réutiliser telle quelle (un schéma, une taxonomie), plutôt que de la retranscrire en prose.

```json
{
  "type": "noul",
  "instructions": "Ce commentaire mentionne-t-il un probleme deja signale ?",
  "criteria": {
    "true": "Mentionne une tentative, un ticket ou un signalement anterieur precis",
    "false": "Aucune trace d'un contact ou signalement anterieur"
  }
}
```

Cette forme structurée (`true`/`false` détaillés, ou `what`/`examples` pour une option Choice ou un niveau Score) désambiguïse les cas limites, là où une seule phrase de critère resterait vague sur la frontière exacte entre deux réponses possibles.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un modèle de décision structurée ne connaît que trois formes de question : Choice (choisir une catégorie sans ordre), Score (positionner sur une échelle ordonnée) et Noul (juger une affirmation vrai/faux). Chaque question renvoie une réponse typée accompagnée d'une probabilité, jamais du texte libre à interpréter. |
| **Outils utilisables** | Les trois primitives Choice/Score/Noul, exprimées en JSON (requête) et interprétées en code (seuils, moyennes pondérées, routage). |
| **Pièges à éviter** | Options Choice qui se recouvrent, sans option "autre". Niveaux Score décrits en degrés abstraits, ou question Score qui mélange plusieurs dimensions. Noul qui combine deux conditions, ou traité comme un booléen strict sans zone d'incertitude. |
| **Bonnes pratiques** | Critères mutuellement exclusifs plus option "autre" pour Choice. Niveaux Score décrits par des situations observables, une dimension par question. Seuils Noul adaptés au coût d'une erreur. Critères structurés en JSON pour désambiguïser les cas limites. |
