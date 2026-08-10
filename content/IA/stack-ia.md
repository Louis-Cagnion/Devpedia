---
order: 16
---

# Le stack IA : les couches d'une application en production

Les chapitres précédents couvrent chacun un mécanisme : [entraîner un réseau de neurones](/?c=ia&p=entrainement-descente-de-gradient), [donner des outils à un modèle](/?c=ia&p=agents), [l'augmenter avec des données externes](/?c=ia&p=rag), [le surveiller en production](/?c=ia&p=gestion-dun-llm)... Ce chapitre n'en ajoute aucun : il montre comment ces pièces s'empilent réellement dans une application, et nomme les catégories d'outils concrètes qui existent à chaque étage, un vocabulaire qu'aucun autre chapitre ne couvre, parce qu'il ne concerne pas le fonctionnement d'un mécanisme mais le paysage des outils qui l'implémentent.

**Stack IA** : l'ensemble des couches, chacune avec un rôle distinct, qui doivent s'assembler pour transformer un modèle de langage en application utilisable, du calcul brut jusqu'à ce que voit l'utilisateur final.

## Les couches, de bas en haut

```text
Application       -> chatbot, assistant en ligne de commande...
      |               (voir Construire un chatbot, L'assistant IA
      |                agentique en terminal)
Orchestration     -> enchainement de prompts, boucle d'agent
      |               (voir Agents)
Observabilite     -> logs, couts, evaluation des reponses
      |               (voir Monitoring et gestion operationnelle)
Donnees           -> base vectorielle, documents source (RAG)
      |               (voir RAG)
Modele            -> API hebergee OU modele auto-heberge
      |
Calcul / cloud    -> GPU, location a la demande
                      (voir CPU vs GPU, Qu'est-ce que le cloud)
```

Chaque couche s'appuie sur celle du dessous, et un problème dans une couche basse (un GPU insuffisant, une API de modèle en panne) se répercute sur toutes les couches au-dessus, même si leur propre code n'a aucun défaut.

| Couche | Rôle | Déjà couvert ailleurs |
|---|---|---|
| Calcul / cloud | Fournir la puissance de calcul brute | [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu), [Le cloud](/?c=infrastructure&p=le-cloud) |
| Modèle | Produire une réponse à partir d'un prompt | [NLP et LLM](/?c=ia&p=nlp-et-llm), [LLM en production](/?c=ia&p=llm-en-production) |
| Données | Fournir au modèle une information qu'il n'a pas en mémoire | [RAG](/?c=ia&p=rag) |
| Orchestration | Décider quoi appeler, dans quel ordre | [Agents](/?c=ia&p=agents) |
| Observabilité | Savoir ce qui s'est passé, combien ça a coûté | [Monitoring et gestion opérationnelle](/?c=ia&p=gestion-dun-llm) |
| Application | Exposer tout ça à un utilisateur final | [Construire un chatbot](/?c=ia&p=chatbot), [L'assistant IA agentique en terminal](/?c=ia&p=assistant-agentique-terminal) |

Les sections suivantes détaillent les trois couches dont seul le *mécanisme* (pas le *paysage d'outils*) a été vu ailleurs.

## La couche modèle : API hébergée ou modèle auto-hébergé

Utiliser un LLM suppose de choisir entre deux façons radicalement différentes d'y accéder :

| | API hébergée | Modèle auto-hébergé |
|---|---|---|
| Principe | Un fournisseur héberge le modèle, on l'appelle par [API](/?c=infrastructure&p=api-et-http) | On fait tourner soi-même un modèle à poids ouverts sur son propre matériel (ou du [cloud](/?c=infrastructure&p=le-cloud) loué) |
| Coût | Payé à l'usage (par token), aucun investissement matériel | Coût fixe (GPU possédés ou loués en continu), rentable seulement à fort volume |
| Contrôle des données | La donnée transite chez un tiers (voir la [gouvernance des données](/?c=ia&p=gouvernance-des-donnees)) | La donnée ne quitte jamais l'infrastructure de l'entreprise |
| Maintenance | À la charge du fournisseur | À la charge de l'entreprise (mises à jour, mise à l'échelle, disponibilité) |
| Qualité disponible | Accès aux modèles les plus performants du marché | Limitée à ce que le matériel disponible peut faire tourner |

> **Piège :** choisir l'auto-hébergement uniquement pour économiser le coût par token, sans compter le coût fixe du matériel ni le temps d'ingénierie nécessaire pour égaler la fiabilité d'un service géré : l'équation ne devient favorable qu'à un volume d'usage suffisant.
>
> **Bonne pratique :** chiffrer les deux options sur le volume d'usage réel prévu (pas un usage hypothétique), et réévaluer ce choix si ce volume change significativement : la bascule n'est jamais définitive.

## La couche données : la base vectorielle

Le chapitre [RAG](/?c=ia&p=rag) explique le mécanisme (découpage, indexation, recherche par similarité) sans nommer d'outil précis. En pratique, l'étape d'indexation s'appuie sur l'une de ces deux familles :

| | Base vectorielle dédiée | Extension d'une base existante |
|---|---|---|
| Principe | Un système conçu uniquement pour stocker et rechercher des embeddings (Pinecone, Weaviate, Milvus...) | Une extension ajoutée à une base déjà en place (ex. `pgvector` pour PostgreSQL) |
| Avantage | Optimisée pour la recherche par similarité à grande échelle | Pas de nouvelle infrastructure à opérer si la base existante suffit en volume |
| Inconvénient | Un système supplémentaire à opérer et sécuriser | Moins performante qu'une base dédiée au-delà d'un certain volume |

Le choix suit la même logique qu'ailleurs en architecture : une extension suffit tant que le volume de documents reste modeste ; une base dédiée se justifie quand la recherche par similarité devient elle-même un goulot d'étranglement.

## La couche orchestration : écrire la boucle soi-même, ou s'appuyer sur un framework

Le chapitre [Agents](/?c=ia&p=agents) décrit la boucle réflexion/action et les patrons de coordination multi-agents en général, sans dire comment ils sont concrètement implémentés. Deux approches :

| | Écrire la boucle soi-même | Framework d'orchestration |
|---|---|---|
| Principe | Coder directement les appels au modèle, aux outils, et la boucle qui les enchaîne | S'appuyer sur une bibliothèque (LangChain, LlamaIndex...) qui fournit déjà ces briques |
| Avantage | Contrôle total, aucune dépendance externe, plus simple à déboguer ligne par ligne | Interface commune vers plusieurs fournisseurs de modèles, gestion de la mémoire de conversation et du chaînage déjà résolues |
| Inconvénient | Chaque brique (retries, gestion de la mémoire, format des outils) est à réécrire | Une couche d'abstraction supplémentaire à comprendre, parfois plus lourde que le besoin réel |

> **Piège :** adopter un framework d'orchestration complet pour un besoin qui se résume à un seul appel outil, la même erreur que sur-ingénierier n'importe quel autre système avant d'en avoir besoin.
>
> **Bonne pratique :** commencer par la boucle la plus simple qui répond au besoin réel, et n'introduire un framework que lorsque la coordination (plusieurs outils, plusieurs agents, gestion fine de la mémoire) dépasse ce qu'un code écrit à la main peut raisonnablement maintenir.

## Le piège transversal : un couplage caché entre les couches

Chaque couche semble indépendante : jusqu'à ce qu'un changement dans l'une casse le fonctionnement d'une autre sans erreur visible. L'exemple déjà rencontré dans [RAG](/?c=ia&p=rag) : changer de modèle d'embedding (couche modèle) invalide silencieusement une base vectorielle existante (couche données), puisque les deux modèles ne partagent pas le même espace vectoriel.

> **Piège :** modifier une couche isolément et ne tester que cette couche, en supposant que les autres n'ont aucune raison d'être affectées.
>
> **Bonne pratique :** après tout changement de composant à une couche (modèle, base vectorielle, framework d'orchestration), rejouer un test d'intégration bout en bout, pas seulement un test isolé de la couche modifiée.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une application IA s'assemble en couches distinctes (calcul, modèle, données, orchestration, observabilité, application), chacune couverte mécaniquement ailleurs sur le site. Le choix API hébergée vs auto-hébergé, base vectorielle dédiée vs extension, et boucle codée à la main vs framework d'orchestration sont des décisions d'architecture propres à chaque couche. |
| **Outils utilisables** | Une API de modèle hébergée pour démarrer sans infrastructure. Une extension comme `pgvector` pour un volume de documents modeste, une base vectorielle dédiée au-delà. Un framework d'orchestration une fois la coordination trop complexe pour du code écrit à la main. |
| **Pièges à éviter** | Choisir l'auto-hébergement sur le seul coût par token sans compter le coût fixe. Adopter un framework complet pour un besoin trivial. Modifier une couche sans retester l'intégration bout en bout. |
| **Bonnes pratiques** | Chiffrer les deux options d'hébergement sur le volume réel prévu. Commencer par la boucle la plus simple avant d'introduire un framework. Rejouer un test d'intégration bout en bout après tout changement de composant. |
