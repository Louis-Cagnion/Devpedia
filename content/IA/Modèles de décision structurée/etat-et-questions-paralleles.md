---
order: 3
---

# L'état et le fan-out spéculatif : poser toutes les questions d'un coup

Les [primitives Choice, Score et Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#comparer-les-trois-primitives) s'évaluent toujours contre un **état** : le contenu que le modèle doit juger. Ce chapitre détaille ce qu'un état peut contenir, puis une conséquence directe de l'indépendance des questions : poser beaucoup de questions d'un coup coûte à peine plus cher qu'en poser une seule.

## L'état : le contenu à évaluer

L'état est la donnée fournie au modèle, contre laquelle une ou plusieurs questions sont posées. Il accepte trois formats :

| Format | Cas d'usage typique |
|---|---|
| Chaîne de caractères simple | Un message unique, un passage de texte isolé |
| Objet [JSON](/?c=infrastructure&p=json) | Plusieurs champs nommés, un état applicatif structuré (ex : `{"ticket": "...", "historique": [...]}` ) |
| Tableau [JSON](/?c=infrastructure&p=json) | Une séquence de messages ou d'enregistrements |

```json
{
  "ticket": {
    "sujet": "Colis jamais recu",
    "message": "Commande passee il y a 12 jours, toujours rien recu.",
    "client_vip": true
  }
}
```

L'objet structuré préserve les relations entre données (ici, le fait que `client_vip` décrit bien ce ticket précis) mieux qu'une seule chaîne qui mélangerait tout en prose. Seul le texte est accepté : ni image, ni audio, ni vidéo. Le modèle privilégie aussi l'anglais, les autres langues (dont le français) ayant une précision actuellement moindre selon la documentation du fournisseur.

| Piège | Bonne pratique |
|---|---|
| Tout entasser dans une seule chaîne de texte non structurée | Séparer le contenu (l'état) des jugements demandés (les questions), et regrouper en un objet JSON les informations réellement liées à la décision |

## Des questions évaluées indépendamment

Point central du fonctionnement de ces modèles : **toutes les questions posées dans une même requête voient le même état, et sont évaluées indépendamment les unes des autres**. Aucune question ne "voit" la réponse d'une autre. Cette indépendance a une conséquence directe : rien n'empêche de poser plusieurs questions à la fois, y compris des questions dont on ne sait pas encore si la réponse sera utile.

## Le pattern du fan-out spéculatif

Le **fan-out spéculatif** (*speculative fan-out*) consiste à envoyer d'emblée toutes les questions plausibles pour un cas donné, plutôt que d'enchaîner les appels un par un au fur et à mesure des besoins, puis à laisser le code choisir après coup quelles réponses garder :

```text
Approche sequentielle (3 appels, un apres l'autre)
  Appel 1 -> categorie du ticket = "bug"
  Appel 2 -> (car c'est un bug) severite = "bloquant"
  Appel 3 -> (car bloquant) demande-t-il un remboursement ?

Fan-out speculatif (1 seul appel, 5 questions en parallele)
  categorie, severite_bug, etapes_reproductibles, remboursement_demande, frustration
  -> le code ignore ensuite severite_bug si la categorie n'est pas "bug"
```

Comme les questions s'évaluent en parallèle contre le même état, ajouter des questions supplémentaires a peu d'effet sur le temps de réponse : le coût dominant est la lecture de l'état lui-même, pas le nombre de questions posées dessus.

```python
reponse = client.system_one(
    state=ticket,
    questions={
        "categorie": Choice(instructions="Categorie du ticket ?", criteria=CATEGORIES),
        "severite_bug": Score(instructions="Severite si c'est un bug ?", criteria=NIVEAUX),
        "etapes_reproductibles": Noul(instructions="Des etapes de reproduction sont-elles donnees ?"),
        "remboursement_demande": Noul(instructions="Un remboursement est-il demande ?"),
        "frustration": Score(instructions="Niveau de frustration exprime ?", criteria=NIVEAUX_FRUSTRATION),
    },
)

# Le code choisit ensuite quelles reponses exploiter, selon la categorie retenue
if reponse.answers["categorie"].choice == "bug":
    traiter_bug(reponse.answers["severite_bug"], reponse.answers["etapes_reproductibles"])
```

## Ce que ça change en coût et en vitesse

Sur un cas mesuré par le fournisseur (13 questions réglementaires posées sur un même document), grouper les questions en une seule requête plutôt que 13 requêtes séparées donne :

| | 13 requêtes séparées | 1 requête groupée |
|---|---|---|
| Coût | Référence | **12,2× moins cher** (le document n'est transmis qu'une fois) |
| Vitesse | Référence | **10× plus rapide** |
| Fiabilité des réponses | Référence | Identique : chaque question reste indépendante des autres |

Ce chiffre vient du fournisseur et n'a pas été vérifié de façon indépendante ; ce qui compte ici est le principe qu'il illustre (le coût dominant est la lecture de l'état, pas le nombre de questions), pas le benchmark exact.

> **Piège :** croire qu'ajouter des questions spéculatives risque de "polluer" les réponses utiles, comme le ferait un prompt surchargé envoyé à un LLM génératif. Ici, chaque question s'évalue indépendamment contre le même état : une question inutile ne modifie jamais la réponse d'une autre.
>
> **Bonne pratique :** dès qu'une décision dépend potentiellement de plusieurs facteurs, poser toutes les questions plausibles dans un seul appel plutôt que d'enchaîner les appels au fil de l'eau, et laisser le code (pas une nouvelle requête) filtrer les réponses non pertinentes.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | L'état (texte, objet ou tableau JSON) est le contenu évalué. Les questions posées contre un même état sont indépendantes les unes des autres, ce qui permet le fan-out spéculatif : poser d'un coup toutes les questions plausibles, puis filtrer les réponses utiles en code, pour un coût et une latence proches d'une seule question. |
| **Outils utilisables** | Un objet JSON structuré comme état ; plusieurs questions Choice/Score/Noul dans une seule requête ; du code applicatif pour filtrer les réponses spéculatives non pertinentes. |
| **Pièges à éviter** | Tout entasser en une seule chaîne de texte non structurée. Craindre qu'ajouter des questions dégrade les autres réponses (ce n'est pas le cas, elles sont indépendantes). |
| **Bonnes pratiques** | Séparer contenu et questions, structurer l'état en JSON. Grouper toutes les questions plausibles d'un cas en une seule requête plutôt que d'enchaîner les appels séquentiels. |
