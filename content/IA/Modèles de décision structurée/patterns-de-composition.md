---
order: 5
---

# Composer des décisions : scoring composite et routage d'intention

Un modèle de décision structurée ne répond jamais qu'à des questions étroites et atomiques ([Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Composer un comportement plus riche (une décision finale, un routage) est le travail du **code appelant**, pas du modèle. Quatre patrons reviennent le plus souvent pour cette composition :

| Patron | Principe | Où il est couvert |
|---|---|---|
| Fan-out spéculatif | Poser d'un coup toutes les questions plausibles, filtrer en code | [État et questions parallèles](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#le-pattern-du-fan-out-speculatif) |
| Routage par confiance | Agir, confirmer ou escalader selon le niveau de confiance | [Confiance calibrée](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#trois-seuils-trois-comportements) |
| **Scoring composite** | Combiner plusieurs scores indépendants en une décision unique | Ce chapitre |
| **Routage d'intention** | Classer une requête puis l'orienter vers le bon traitement | Ce chapitre |

## Scoring composite : combiner des dimensions indépendantes

Le **scoring composite** décompose un jugement complexe en dimensions séparées, note chacune indépendamment (une question Score par dimension, posées en une seule requête grâce au [fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#le-pattern-du-fan-out-speculatif)), puis les combine par une formule pondérée que le code contrôle entièrement.

```text
1. Poser une question Score par dimension (en parallele, meme requete)
2. Normaliser chaque score entre 0 et 1 (diviser par le niveau maximal)
3. Combiner par une somme ponderee, avec des poids fixes en code
```

Exemple : évaluer un CV selon plusieurs axes, avec des poids qui changent selon le poste visé.

```python
# Chaque score est normalise entre 0 et 1 avant d'etre pondere
def score_candidat(reponses, poids: dict[str, float]) -> float:
    total = 0.0
    for dimension, poids_dimension in poids.items():
        score_brut     = reponses[dimension].score          # ex : 3 sur une echelle 0-4
        niveau_maximal = len(reponses[dimension].legend) - 1  # 4
        score_normalise = score_brut / niveau_maximal
        total += poids_dimension * score_normalise
    return total

# Un poste de manager pese plus la dimension "leadership" qu'un poste d'IC senior
poids_ic_senior = {"profondeur_python": 0.5, "leadership": 0.1, "conception_systeme": 0.4}
poids_manager    = {"profondeur_python": 0.2, "leadership": 0.5, "conception_systeme": 0.3}
```

Cette approche préserve la granularité de chaque dimension (on peut inspecter pourquoi un candidat obtient tel score global) tout en permettant d'ajuster rapidement les priorités (changer les poids) sans reconstruire tout le système d'évaluation.

> **Piège :** noter directement une impression globale ("bon candidat" en une seule question Score), qui mélange plusieurs dimensions sans qu'on puisse ensuite ajuster leur importance relative séparément.
>
> **Bonne pratique :** une question Score par dimension réellement indépendante, combinée en code avec des poids explicites et modifiables sans toucher aux questions elles-mêmes.

## Routage d'intention : classer avant de traiter

Le **routage d'intention** (*intent routing*) place un modèle de décision structurée en amont de plusieurs traitements possibles, pour orienter chaque requête vers le bon traitement sans systématiquement passer par le traitement le plus coûteux (un LLM, un humain).

```text
Message client
     |
     v
Modele de decision structuree (2 questions en parallele : Choice + Score)
     |
     v
Reponses + confiance
     |
     +-- confiance intention < 0.5 -----------------> Agent humain
     +-- intention = "statut_commande" --------------> Recherche deterministe (pas de LLM)
     +-- intention = "question_produit" -------------> LLM specialise produit
     +-- intention = "reclamation" + complexite > 1 --> Agent humain
     +-- intention = "reclamation" + complexite <= 1 -> LLM de resolution
```

```python
reponse = client.system_one(
    state=message_client,
    questions={
        "intention":  Choice(instructions="Categorie de la demande ?", criteria=CATEGORIES),
        "complexite": Score(instructions="Complexite de la demande ?", criteria=NIVEAUX_COMPLEXITE),
    },
)

if reponse.answers["intention"].confidence < 0.5:
    router_vers("agent_humain")
elif reponse.answers["intention"].choice == "statut_commande":
    router_vers("recherche_deterministe")
elif reponse.answers["intention"].choice == "reclamation" and reponse.answers["complexite"].score > 1:
    router_vers("agent_humain")
else:
    router_vers("llm_specialise")
```

Le gain principal est économique : les ressources coûteuses (un LLM de raisonnement, un humain) ne sont mobilisées que pour les cas qui le justifient réellement, le reste étant traité par une logique déterministe ou un modèle plus léger.

> **Piège :** router uniquement sur l'intention choisie, sans tenir compte de la confiance associée : une intention mal classée mais traitée comme certaine peut envoyer une requête vers le mauvais traitement sans qu'aucun signal ne le révèle.
>
> **Bonne pratique :** toujours vérifier la confiance de l'intention avant de router dessus (voir le [routage par confiance](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#trois-seuils-trois-comportements)), et combiner intention et autres signaux (ici la complexité) plutôt que de router sur un seul critère isolé.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Composer une décision riche à partir de questions atomiques reste le travail du code, pas du modèle. Le scoring composite combine plusieurs scores indépendants par une formule pondérée ; le routage d'intention classe une requête puis l'oriente vers le traitement le moins coûteux qui convient, sous réserve d'une confiance suffisante. |
| **Outils utilisables** | Plusieurs questions Score en parallèle, une formule de pondération en code, une question Choice pour classer une intention avant routage. |
| **Pièges à éviter** | Une seule question Score qui mélange plusieurs dimensions. Router sur une intention sans vérifier sa confiance. |
| **Bonnes pratiques** | Une dimension par question Score, poids explicites et ajustables en code. Vérifier la confiance avant de router, combiner plusieurs signaux plutôt qu'un seul. |
