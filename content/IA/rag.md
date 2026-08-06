---
order: 9
---

# RAG : augmenter un LLM avec des données externes

Un LLM ne connaît que ce qu'il a vu à l'entraînement, jusqu'à une date de coupure (voir [LLM en production](/?c=ia&p=llm-en-production)) — il ignore vos documents internes, votre base de connaissance, ou tout ce qui s'est produit après cette date. Le **RAG** (*Retrieval-Augmented Generation*, génération augmentée par recherche documentaire) répond à ce problème en allant chercher, au moment de la question, les documents pertinents et en les injectant dans le prompt avant de demander la réponse.

## Pourquoi pas simplement ré-entraîner le modèle ?

Ré-entraîner ou affiner (*fine-tuning*) un modèle sur ses propres données est une alternative, mais avec un coût et un délai que le RAG évite :

| | Fine-tuning | RAG |
|---|---|---|
| Mise à jour d'une donnée | Nécessite un nouvel entraînement | Modifier le document source suffit |
| Coût | Élevé (calcul, temps) | Coût d'une recherche + d'un prompt plus long |
| Traçabilité de la réponse | Diffuse (noyée dans les poids du modèle) | Explicite : les documents utilisés sont identifiables |
| Adapté à | Changer le *style* ou le comportement du modèle | Lui donner accès à des *faits* changeants ou privés |

Le RAG et le fine-tuning ne s'excluent pas : un modèle peut être affiné pour mieux exploiter des documents récupérés, tout en restant alimenté en RAG pour le contenu factuel.

## Le pipeline en quatre étapes

```
1. Decoupage (chunking)   : chaque document source est decoupe en fragments
2. Indexation             : chaque fragment est converti en embedding (voir
                            NLP et LLM) et stocke dans une base vectorielle
3. Recherche (retrieval)  : la question posee est aussi convertie en embedding,
                            puis comparee a tous les fragments indexes
4. Generation              : les fragments les plus proches sont colles dans
                            le prompt, et le LLM repond en s'appuyant dessus
```

La comparaison à l'étape 3 se fait par une mesure de similarité entre vecteurs — le plus souvent, exactement le [produit scalaire entre vecteurs normalisés](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (le cosinus de l'angle qui les sépare) : deux fragments dont les embeddings sont proches parlent, en principe, de sujets proches — c'est exactement la propriété des embeddings détaillée dans [NLP et LLM](/?c=ia&p=nlp-et-llm).

> **Piège :** changer de modèle d'embedding sans réindexer l'intégralité des documents existants. Les embeddings produits par deux modèles différents ne partagent pas le même espace vectoriel (voir la comparaison d'embeddings dans [NLP et LLM](/?c=ia&p=nlp-et-llm)) — mélanger anciens et nouveaux embeddings dans une même recherche ne produit aucune comparaison valide, même si le calcul s'exécute sans erreur apparente.
>
> **Bonne pratique :** réindexer l'intégralité de la base documentaire dès qu'un modèle d'embedding change, jamais un mélange partiel de deux modèles différents.

## Le découpage (chunking) : un choix qui se paie des deux côtés

La taille des fragments n'est jamais neutre :

- **Trop petits**, un fragment perd le contexte qui l'entoure (une phrase isolée de son paragraphe peut devenir ambiguë ou trompeuse une fois recherchée seule).
- **Trop grands**, un fragment dilue sa pertinence : sur un document de plusieurs pages, seule une portion répond vraiment à la question, mais tout le fragment est injecté dans le prompt — au prix (voir [LLM en production](/?c=ia&p=llm-en-production)) et au risque de noyer l'information utile dans du texte non pertinent.

Un compromis courant garde un chevauchement entre fragments consécutifs (les derniers mots d'un fragment répétés en tête du suivant), pour qu'une information à cheval sur deux fragments ne soit jamais totalement perdue.

> **Piège :** choisir une taille de fragment par défaut, recopiée d'un autre projet, sans la tester sur ses propres documents. La taille optimale dépend fortement du type de document (articles courts, manuels longs...) et de la nature des questions posées.
>
> **Bonne pratique :** tester plusieurs tailles de fragment (et de chevauchement) sur des questions représentatives avant d'en figer une, plutôt que d'en choisir une arbitrairement une fois pour toutes.

## La limite du RAG : un mauvais retrieval ne se voit pas

Le RAG ne rend pas le LLM plus honnête, il l'entoure de meilleures données — si l'étape de recherche ne trouve pas le bon fragment (question mal formulée, embedding qui ne capture pas la bonne nuance, information absente de la base), le modèle répond quand même, avec les mêmes risques d'hallucination que sans RAG (voir [LLM en production](/?c=ia&p=llm-en-production)), sans qu'aucune alerte ne signale que le contexte fourni était insuffisant ou hors sujet.

> **Piège :** supposer qu'une réponse d'un système RAG est fiable simplement parce qu'elle semble bien sourcée. Un mauvais retrieval (fragment non pertinent) produit une réponse tout aussi assurée qu'un bon retrieval — rien en surface ne distingue les deux cas.
>
> **Bonne pratique :** monitorer la qualité du retrieval lui-même (les fragments récupérés étaient-ils réellement pertinents ?), pas seulement la qualité de la réponse finale — voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le RAG recherche des documents pertinents au moment de la question et les injecte dans le prompt, plutôt que de ré-entraîner le modèle. La recherche compare des embeddings par similarité (produit scalaire normalisé). Un mauvais retrieval produit une réponse aussi assurée qu'un bon retrieval, sans se distinguer en surface. |
| **Outils utilisables** | Une base vectorielle pour stocker et rechercher des embeddings ; un modèle d'embedding cohérent sur l'ensemble de la base documentaire. |
| **Pièges à éviter** | Mélanger des embeddings issus de modèles différents. Choisir une taille de fragment sans la tester. Faire confiance à une réponse RAG sans vérifier la qualité du retrieval. |
| **Bonnes pratiques** | Réindexer intégralement la base après tout changement de modèle d'embedding. Tester plusieurs tailles de fragment sur des cas représentatifs. Monitorer la qualité du retrieval en plus de la réponse finale. |
