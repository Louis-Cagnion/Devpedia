---
order: 4
---

# Réduire la variance des réponses : self-consistency, vote majoritaire et ensembling

Le chapitre [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production#la-temperature-controler-l-alea-de-generation) montre que la température resserre ou aplatit le tirage au sort d'un LLM, mais qu'elle ne garantit jamais qu'un seul appel produise la bonne réponse : une température basse limite l'aléa, elle ne le supprime pas, et un raisonnement à plusieurs étapes peut toujours partir sur un mauvais chemin dès le premier token. Une autre famille de techniques attaque le problème différemment : au lieu de changer *comment* une génération tire au sort, elle génère **plusieurs réponses indépendantes** et les combine pour obtenir un résultat plus fiable qu'un seul essai.

## Vote majoritaire : interroger plusieurs fois, garder la réponse la plus fréquente

Le **vote majoritaire** (*majority voting*) envoie le même prompt *N* fois avec une température non nulle (à température 0, les *N* réponses seraient presque toujours identiques, voir la note sur le déterminisme imparfait dans [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production#la-temperature-controler-l-alea-de-generation)), puis retient la réponse qui revient le plus souvent parmi les *N* :

```python
from collections import Counter

def voter_majoritaire(prompt, n=5, temperature=0.7):
    reponses = [
        client.chat.completions.create(
            model="...",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        ).choices[0].message.content
        for _ in range(n)
    ]
    plus_frequente, nombre_de_votes = Counter(reponses).most_common(1)[0]
    return plus_frequente, nombre_de_votes / n  # reponse retenue + score de confiance
```

Le rapport `nombre_de_votes / n` sert de score de confiance : 5 réponses identiques sur 5 inspirent plus confiance que 3 sur 5, même si le vote majoritaire retient la réponse gagnante dans les deux cas.

| Adapté à | Pas adapté à |
|---|---|
| Réponse discrète et vérifiable : classification, extraction d'un champ, QCM, calcul relayé à un outil | Génération ouverte : rédaction, résumé, brainstorming créatif |
| Plusieurs formulations valides d'une même réponse existent rarement | Deux rédactions différentes ne "votent" pas l'une pour l'autre : il n'y a pas de majorité à dégager |

> **Piège :** comparer des réponses textuelles libres pour un vote sans les normaliser au préalable (ex : "Paris" et "paris." comptés comme deux réponses différentes à cause de la casse ou de la ponctuation). Le vote sous-estime alors artificiellement la vraie majorité.
>
> **Bonne pratique :** normaliser chaque réponse (minuscule, ponctuation retirée, format unifié) avant de les comparer entre elles, en particulier pour une réponse censée être une valeur exacte plutôt qu'un texte libre.

## Self-consistency : voter sur la conclusion de plusieurs raisonnements

La **self-consistency** applique le même principe de vote, mais au résultat final de plusieurs [raisonnements chain-of-thought](/?c=ia&s=nlp-llm&p=prompt-engineering#le-raisonnement-etape-par-etape-chain-of-thought) indépendants plutôt qu'à une réponse produite directement. Chaque exécution peut emprunter un chemin de raisonnement différent (un calcul intermédiaire posé autrement, un ordre d'étapes différent), mais si la majorité des chemins convergent vers la même conclusion, cette conclusion est nettement plus fiable qu'un raisonnement isolé, même détaillé :

```text
Question : "Un train part a 14h12 a 80km/h, un autre a 14h27 a 100km/h sur la
meme voie. A quelle heure le second rattrape-t-il le premier ?"

5 raisonnements chain-of-thought independants (temperature > 0) :

Run 1 -> chemin de calcul A -> conclusion : 15h39
Run 2 -> chemin de calcul B -> conclusion : 15h39
Run 3 -> chemin de calcul A -> conclusion : 15h39
Run 4 -> chemin de calcul C -> conclusion : 15h42   (erreur d'arrondi)
Run 5 -> chemin de calcul A -> conclusion : 15h39

Vote sur la CONCLUSION (pas sur le chemin) : 15h39 retenue (4 votes sur 5)
```

La technique vient d'un papier de recherche dédié : [*Self-Consistency Improves Chain of Thought Reasoning in Language Models*](https://arxiv.org/abs/2203.11171) (Wang et al., 2022), qui montre des gains de fiabilité mesurables sur des tâches de calcul et de raisonnement logique par rapport à un chain-of-thought exécuté une seule fois.

> **Piège :** appliquer la self-consistency à une tâche qui ne bénéficie pas déjà du chain-of-thought (une extraction directe, une classification simple) : le surcoût (plusieurs raisonnements complets à générer, pas juste plusieurs réponses courtes) n'apporte alors rien qu'un simple vote majoritaire n'aurait pas déjà donné pour beaucoup moins cher.
>
> **Bonne pratique :** réserver la self-consistency aux tâches qui profitent déjà du chain-of-thought (calcul à plusieurs étapes, logique, décomposition d'un problème), et le vote majoritaire simple à tout le reste.

## Ensembling : combiner des modèles ou des configurations différentes

Plutôt que de rééchantillonner le même modèle avec le même prompt, l'**ensembling** combine les réponses de plusieurs modèles différents (par exemple deux fournisseurs distincts) ou de plusieurs variantes d'un même prompt (reformulation, exemples few-shot différents), puis agrège le tout par vote ou via un modèle "juge" chargé de comparer les réponses et de choisir la meilleure ou d'en synthétiser une nouvelle.

| Technique | Ce qui varie entre les *N* essais | Ce qui reste identique |
|---|---|---|
| Vote majoritaire | Le tirage aléatoire (température) | Le modèle, le prompt |
| Self-consistency | Le tirage aléatoire, le chemin de raisonnement | Le modèle, le prompt |
| Ensembling | Le modèle et/ou le prompt lui-même | Rien n'est nécessairement fixe |

L'ensembling aide davantage quand les erreurs des différents essais sont réellement indépendantes : des modèles de fournisseurs différents, entraînés sur des données et avec des choix d'architecture distincts, n'ont pas les mêmes angles morts, donc leurs erreurs respectives ont moins de chances de se recouper. C'est le même principe qu'un ensemble de modèles classiques en machine learning (plusieurs prédicteurs indépendants qui votent), transposé aux LLM.

> **Piège :** faire de l'ensembling avec plusieurs instances d'un même modèle sous-jacent (juste des prompts légèrement reformulés, par exemple), en espérant le même gain qu'avec des modèles réellement différents. Si les essais partagent le même biais de fond, leurs erreurs se recoupent aussi, et l'ensembling perd une grande partie de son intérêt.
>
> **Bonne pratique :** privilégier des sources d'erreur réellement indépendantes (fournisseurs ou architectures différents) plutôt que des variations superficielles d'un même modèle, quand l'enjeu justifie le coût de l'ensembling.

## Le compromis coût, latence et fiabilité

Ces trois techniques partagent le même compromis : la fiabilité gagnée se paie en appels multipliés par *N*, jamais gratuitement (voir aussi le [coût comme contrainte de conception](/?c=ia&s=nlp-llm&p=llm-en-production) pour un unique appel).

| | Coût (nombre d'appels) | Latence si séquentiel | Gain de fiabilité |
|---|---|---|---|
| Un seul essai | 1× | Référence | Aucun |
| Vote majoritaire | *N*× | *N*× | Modéré, sur réponse discrète |
| Self-consistency | *N*× (raisonnements complets) | *N*× | Élevé, sur tâche de raisonnement |
| Ensembling | *N*× (souvent plus cher : modèles différents) | *N*× | Élevé, si les erreurs sont indépendantes |

Les *N* appels peuvent s'exécuter en parallèle (requêtes API simultanées) pour limiter l'impact sur la latence perçue par l'utilisateur, mais le coût de calcul, lui, reste multiplié par *N* même quand le temps d'attente ne l'est pas.

> **Piège :** multiplier les échantillons par réflexe sur une tâche où la latence est critique (un chatbot conversationnel en temps réel) sans avoir mesuré le gain réel de fiabilité apporté. Le surcoût est systématique, le bénéfice ne l'est pas toujours.
>
> **Bonne pratique :** réserver ces techniques aux décisions dont une erreur coûte réellement plus cher que *N* appels supplémentaires (calcul critique, classification à fort enjeu, étape charnière d'un [agent](/?c=ia&s=nlp-llm&p=agents)), pas comme réflexe systématique sur chaque requête.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Baisser la température réduit l'aléa d'un seul appel mais ne le supprime pas. Le vote majoritaire, la self-consistency (vote sur la conclusion de plusieurs chain-of-thought) et l'ensembling (modèles ou prompts différents) génèrent plusieurs réponses indépendantes et les combinent pour obtenir un résultat plus fiable qu'un essai unique. |
| **Outils utilisables** | Plusieurs appels API en parallèle avec température non nulle, un compteur d'occurrences pour le vote, un modèle "juge" pour agréger des réponses d'ensembling. |
| **Pièges à éviter** | Comparer des réponses textuelles non normalisées pour un vote. Appliquer la self-consistency à une tâche qui n'a pas besoin de chain-of-thought. Faire de l'ensembling avec des variantes trop proches d'un même modèle. Multiplier les échantillons sans mesurer le gain réel de fiabilité. |
| **Bonnes pratiques** | Normaliser les réponses avant de voter. Réserver la self-consistency aux tâches de raisonnement à plusieurs étapes. Privilégier des modèles réellement indépendants pour l'ensembling. Réserver ces techniques aux décisions où l'enjeu justifie le coût multiplié par *N*. |
