---
order: 2
---

# L'assistant IA agentique en terminal : au-delà du prompt simple

Les chapitres précédents couvrent séparément les briques d'un assistant LLM moderne : les [outils et la boucle d'agent](/?c=ia&s=nlp-llm&p=agents), le [RAG](/?c=ia&s=nlp-llm&p=rag), le [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering), les [limites de production](/?c=ia&s=nlp-llm&p=llm-en-production). Ce chapitre ne les répète pas : il assemble ce qui manque encore pour comprendre comment un assistant qui travaille dans un terminal (capable de lire et modifier des fichiers, d'exécuter des commandes, de chercher sur le web) fonctionne réellement d'un tour à l'autre. Claude en ligne de commande sert ici d'illustration concrète, mais rien n'est propre à un fournisseur précis : chaque mécanisme décrit est publiquement documenté et se retrouve, sous des noms parfois différents, chez la plupart des assistants agentiques actuels.

## Génération pure vs donnée réellement récupérée

Sans outil, un LLM ne fait que **générer du texte plausible** à partir de ce qu'il a appris à l'entraînement (voir sa définition dans [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) : il n'a aucun moyen de consulter quoi que ce soit d'extérieur. Deux demandes qui produisent, en surface, le même genre de réponse sont en réalité très différentes :

| Demande | Ce qui se passe | Fiabilité |
|---|---|---|
| "Donne-moi un exemple de JSON représentant un utilisateur" | Le modèle **invente** des valeurs plausibles (nom, email, id) : c'est exactement ce qu'on lui demande | Fiable pour l'usage : aucune valeur n'est censée être réelle |
| "Quel est le numéro de version actuel de la bibliothèque X ?" | Sans outil pour vérifier, le modèle produit une réponse tout aussi plausible **en apparence**, mais qui peut être fausse, une hallucination (voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)) | Non fiable sans vérification |

La différence ne se voit jamais dans la forme de la réponse : un texte inventé et un texte exact sont écrits avec la même assurance. Elle tient uniquement au fait qu'un outil ait réellement été utilisé pour récupérer la donnée, ou que le modèle l'ait produite de mémoire.

> **Piège :** demander une information factuelle vérifiable sans donner à l'assistant (ni vérifier qu'il a utilisé) un outil capable de la récupérer réellement : rien dans le ton de la réponse ne distingue une donnée récupérée d'une donnée inventée.
>
> **Bonne pratique :** pour toute donnée qui peut changer ou doit être exacte, s'assurer qu'un outil (recherche web, RAG, appel d'API) a bien été appelé plutôt que de se fier à la mémoire du modèle (voir les catégories d'outils plus bas).

## Le raisonnement interne étendu

Certains modèles génèrent, avant la réponse finale, une phase de **raisonnement interne étendu** : une suite de tokens qui explorent le problème, essaient des pistes, se corrigent, sans faire partie de la réponse destinée à l'utilisateur (elle peut être masquée, résumée, ou affichée à part selon l'interface).

Il ne faut pas confondre ce mécanisme avec le [*chain-of-thought* du prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) : là, le raisonnement détaillé est une **technique de prompt**, demandée explicitement par l'utilisateur dans sa question. Le raisonnement interne étendu, lui, est une **phase de génération distincte et native**, qui existe indépendamment de toute instruction du prompt à ce sujet :

```text
Chain-of-thought (prompte)       Raisonnement interne etendu (natif)
-------------------------------  -------------------------------------
Demande explicitement par le     Genere par defaut selon le modele,
prompt ("reflechis etape par     avant meme de commencer a rediger la
etape")                          reponse destinee a l'utilisateur
       |                                  |
Fait partie de la reponse        Peut etre masque, resume, ou montre
visible                          separement de la reponse finale
```

Le même avertissement que pour le chain-of-thought prompté s'applique, en plus marqué encore : un raisonnement affiché ou résumé ne garantit pas qu'il correspond fidèlement au mécanisme interne qui a réellement produit la réponse (voir [ce piège détaillé dans le prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering)).

## Catégories concrètes d'outils

Le chapitre [Agents](/?c=ia&s=nlp-llm&p=agents) présente le mécanisme générique du function calling sur un seul exemple (la météo). En pratique, un assistant qui travaille sur du code ou de l'information s'appuie sur des catégories d'outils récurrentes, chacune avec son propre compromis.

### Éditer un fichier : diff/patch vs réécriture complète

| | Diff / patch | Réécriture complète |
|---|---|---|
| Ce que l'outil reçoit | Les lignes à remplacer, plus leur contexte immédiat | Le contenu intégral du nouveau fichier |
| Coût en tokens | Faible, proportionnel à ce qui change | Élevé, proportionnel à la taille totale du fichier |
| Fragilité | Échoue si le contexte attendu ne correspond plus exactement au fichier réel (modifié depuis la dernière lecture) | Insensible à ce problème : le fichier entier est remplacé tel que fourni |

> **Piège :** appliquer un patch calculé sur une version du fichier qui n'est plus la version réelle sur disque : selon l'outil, ça échoue explicitement, ou pire, s'applique sur les mauvaises lignes sans erreur visible.
>
> **Bonne pratique :** relire un fichier immédiatement avant de calculer un patch dessus plutôt que de se fier à une lecture ancienne.

### Recherche web en direct vs RAG

Le [RAG](/?c=ia&s=nlp-llm&p=rag) interroge une base **pré-indexée à l'avance** et statique entre deux réindexations. Un outil de recherche web en direct envoie au contraire une requête **au moment même de la demande**, sans étape d'indexation préalable :

| | RAG | Recherche web en direct |
|---|---|---|
| Base interrogée | Un index vectoriel construit à l'avance (voir [RAG](/?c=ia&s=nlp-llm&p=rag)) | Le web tel qu'il est au moment de la requête |
| Fraîcheur | Aussi récente que la dernière réindexation | Toujours à jour |
| Reproductibilité | Deux recherches identiques renvoient les mêmes fragments | Deux recherches identiques peuvent renvoyer des résultats différents |
| Curation des sources | Choisie à l'avance (on décide quoi indexer) | Dépend de ce que le moteur de recherche renvoie |

> **Piège :** traiter un résultat de recherche web avec la même confiance qu'une source choisie à l'avance pour être indexée : une page trouvée en direct n'a subi aucune curation préalable, contrairement à une base RAG constituée délibérément.
>
> **Bonne pratique :** citer la source de toute information récupérée par recherche web, pour qu'un humain puisse vérifier l'origine plutôt que de faire confiance à l'assistant seul.

### Deux outils shell distincts sur Windows : Bash et PowerShell

Un assistant qui exécute des commandes ne dispose pas d'un seul outil "terminal" : le harnais (l'application qui fait tourner l'assistant, cf. [Client et serveur MCP](/?c=ia&s=nlp-llm&p=mcp)) peut exposer plusieurs outils shell **distincts et permanents**, chacun avec ses propres règles. Sur Windows, un cas concret revient souvent : deux outils nommés "Bash" et "PowerShell" coexistent, et ce ne sont pas deux vues sur le même terminal visible à l'écran, mais deux intégrations séparées.

| | Outil "Bash" | Outil "PowerShell" |
|---|---|---|
| Ce qu'il lance réellement sur Windows | [Git Bash](https://gitforwindows.org) (le shell [Bash](/?c=langages&s=bash&p=bash) fourni avec Git pour Windows), s'il est installé | [`powershell.exe`](https://learn.microsoft.com/powershell/) |
| Syntaxe attendue | Syntaxe Unix : `/dev/null`, guillemets simples, `$VAR` | Syntaxe PowerShell : `$env:VAR`, pas de `&&`/`\|\|` sous PowerShell 5.1 |

```text
Fenetre ouverte par l'utilisateur : PowerShell
        |
        v
L'assistant choisit, commande par commande, quel outil appeler
        |
   ------------------------
   |                      |
   v                      v
Outil "Bash"          Outil "PowerShell"
(lance Git Bash)      (lance powershell.exe)
   |                      |
syntaxe Unix          syntaxe PowerShell
```

Le choix entre les deux, à chaque commande, est fait par l'assistant lui-même (le modèle), pas imposé par le terminal dans lequel la session a été ouverte : c'est ce qui explique la syntaxe Unix (`/dev/null`, etc.) qui fonctionne même dans une fenêtre PowerShell.

> **Piège :** mélanger les deux syntaxes dans un seul appel (par exemple un pipe Unix passé à l'outil PowerShell) échoue, sans que l'erreur indique clairement laquelle des deux syntaxes était attendue.
>
> **Bonne pratique :** face à une commande qui échoue pour une raison de syntaxe, identifier d'abord quel outil shell a réellement été appelé (Bash ou PowerShell) avant de corriger la commande.

## Le pattern évaluateur-optimiseur

Le tableau des [patrons de coordination multi-agents](/?c=ia&s=nlp-llm&p=agents) couvre l'enchaînement séquentiel, l'orchestrateur/travailleurs et l'état partagé. Un quatrième patron, tout aussi courant pour un assistant qui produit du contenu (code, texte, plan) : l'**évaluateur-optimiseur**.

```text
1. Generation  -> une premiere version de la reponse/du code
2. Evaluation  -> critique selon des criteres explicites (checklist,
                  tests, format attendu)
3. Revision    -> une nouvelle version qui integre la critique
4. Retour a 2, jusqu'a un critere d'arret (qualite jugee suffisante,
   nombre de tours atteint)
```

> **Piège :** un cycle sans critère d'arrêt explicite hérite du même risque de boucle non bornée qu'une boucle d'agent classique (voir [Agents](/?c=ia&s=nlp-llm&p=agents)), sauf qu'ici la boucle tourne pour une seule tâche de qualité contestable, pas par manque d'information.
>
> **Bonne pratique :** définir un critère d'arrêt mesurable dès la conception (un score minimal, un nombre de tours maximal) plutôt que de laisser le cycle tourner jusqu'à interruption manuelle.

## Cache de prompt et compaction de contexte

Deux optimisations complémentaires, distinctes des mécanismes déjà vus.

### Réutiliser un préfixe déjà calculé

Un appel à un LLM recalcule normalement l'intégralité du prompt à chaque tour, y compris les tokens déjà envoyés au tour précédent (voir la tokenisation dans [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)). Or une grande partie d'un prompt agentique reste identique d'un tour à l'autre au sein d'une même session : les instructions système, la liste des outils disponibles, le début de l'historique. Le cache de prompt réutilise le calcul déjà effectué sur ce préfixe commun plutôt que de tout refaire depuis zéro à chaque tour : une application concrète du principe [ne jamais recalculer un résultat que rien n'a pu changer depuis](/?c=performance&p=eviter-le-recalcul-redondant).

> **Piège :** modifier le tout début du prompt (les instructions système, par exemple) pour un seul tour : ça invalide le cache construit sur ce préfixe pour tous les tours suivants de la session, annulant le gain pour un changement qui ne concernait qu'un seul tour.
>
> **Bonne pratique :** garder stable la partie du prompt destinée au cache (instructions système, description des outils), et ne faire varier que ce qui change réellement d'un tour à l'autre.

### Compacter le contexte sur une session longue

La [fenêtre de contexte](/?c=ia&s=nlp-llm&p=llm-en-production) reste bornée quel que soit le modèle. Sur une session agentique longue, l'historique complet grossit à chaque tour et finit par s'en approcher. La compaction résume les tours anciens en un condensé plus court avant qu'ils ne soient retirés du prompt, plutôt que de les tronquer silencieusement (le piège déjà signalé pour la fenêtre de contexte dans [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)).

> **Piège :** compacter en perdant une information encore nécessaire pour la suite (un identifiant, une contrainte donnée en tout début de session) : un résumé automatique ne garantit pas de préserver tout ce qui compte encore.
>
> **Bonne pratique :** conserver les éléments critiques (identifiants, contraintes explicites) hors du résumé compactable, plutôt que de tout confier à la compaction automatique.

## Les étapes du post-entraînement d'un assistant moderne

Le chapitre [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) distingue, de façon générique, le fine-tuning (ré-entraîner) du prompting (ne rien modifier). Un assistant conversationnel moderne passe en réalité par plusieurs étapes de fine-tuning distinctes, chacune publiquement documentée par les principaux fournisseurs :

```text
1. Pre-entrainement    -> predire le mot suivant sur un immense corpus
                          de texte (voir NLP et LLM) - le modele "brut"
2. SFT (Supervised     -> fine-tuning sur des exemples soigneusement
   Fine-Tuning)           rediges (instruction -> bonne reponse), pour
                          orienter le modele vers un comportement
                          d'assistant plutot que de simple completion
3. RLHF (Reinforcement -> des humains comparent des paires de reponses
   Learning from Human    ("laquelle est la meilleure ?") ; ces
   Feedback)              comparaisons entrainent un modele de
                          recompense, puis le modele principal est
                          ajuste par apprentissage par renforcement
                          pour maximiser cette recompense
4. Constitutional AI   -> variante publiee par Anthropic : le modele
   (variante)              critique et revise lui-meme ses reponses au
                          regard d'un ensemble ecrit de principes,
                          reduisant le besoin d'exemples humains
                          explicitement etiquetes "nuisibles"
```

| Étape | Pour aller plus loin |
|---|---|
| Pré-entraînement | Voir sa définition dans [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) |
| SFT | [InstructGPT](https://arxiv.org/abs/2203.02155), le papier qui a popularisé ce pipeline SFT + RLHF pour les assistants conversationnels |
| RLHF | [Deep reinforcement learning from human preferences](https://arxiv.org/abs/1706.03741), le papier fondateur du RLHF |
| Constitutional AI | [La page de recherche d'Anthropic sur Constitutional AI](https://www.anthropic.com/news/claude-s-constitution) |

> **Piège :** confondre ces étapes avec le fine-tuning générique déjà vu dans [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) : SFT, RLHF et Constitutional AI sont chacune une méthode de fine-tuning parmi d'autres possibles, pas des synonymes du terme générique.
>
> **Bonne pratique :** distinguer, face à l'annonce d'un nouveau modèle, la nature réelle de son post-entraînement (des exemples supervisés seulement ? un modèle de récompense appris ? une phase d'auto-critique ?) plutôt que de supposer un unique "fine-tuning" indifférencié.

Un assistant moderne comme celui décrit ici s'appuie sur un modèle unique et généraliste, qui gère à la fois la conversation, la génération de code et l'appel d'outils. Cela n'a pas toujours été le cas : d'anciens modèles comme **Codex** (le modèle spécialisé code d'OpenAI, antérieur à cette unification) étaient entraînés séparément pour un usage précis, une approche que les assistants actuels remplacent par un modèle unique post-entraîné pour couvrir l'ensemble de ces cas à la fois.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un assistant agentique combine génération pure (à distinguer d'une donnée réellement récupérée), raisonnement interne étendu natif (≠ chain-of-thought prompté), des catégories d'outils concrètes (diff vs réécriture, recherche live vs RAG, shells Bash/PowerShell distincts), le pattern évaluateur-optimiseur, le cache de prompt, la compaction de contexte, et plusieurs étapes de post-entraînement (SFT, RLHF, Constitutional AI). |
| **Outils utilisables** | Un outil d'édition par diff/patch pour les fichiers volumineux, un outil de recherche web en direct pour l'information fraîche, un ou plusieurs outils shell (Bash, PowerShell) selon la plateforme, un cache de prompt pour les préfixes stables, un mécanisme de compaction pour les sessions longues. |
| **Pièges à éviter** | Confondre une donnée inventée et une donnée récupérée. Prendre un raisonnement affiché pour un compte-rendu fidèle. Appliquer un patch sur un fichier changé depuis sa dernière lecture. Faire confiance à une source web sans curation. Mélanger syntaxe Bash et PowerShell dans un même appel. Une boucle évaluateur-optimiseur sans critère d'arrêt. Invalider le cache en modifiant son préfixe stable. Perdre une information critique en compactant. Confondre SFT/RLHF/Constitutional AI avec un fine-tuning générique. |
| **Bonnes pratiques** | Vérifier qu'un outil a bien été utilisé pour toute donnée factuelle vérifiable. Relire un fichier juste avant de calculer un patch. Citer la source de toute information trouvée par recherche web. Identifier quel outil shell a réellement été appelé avant de corriger une erreur de syntaxe. Définir un critère d'arrêt mesurable pour un cycle évaluateur-optimiseur. Garder stable le préfixe destiné au cache. Préserver les éléments critiques hors du résumé compactable. Identifier la nature réelle du post-entraînement d'un modèle plutôt que de le supposer générique. |
