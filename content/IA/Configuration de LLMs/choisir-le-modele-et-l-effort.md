---
order: 2
---

# Choisir le modèle et le niveau d'effort de Claude (11/10/2026)
**Claude** est une famille de [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (grands modèles de langage, des programmes qui produisent du texte). Deux réglages déterminent le résultat et la facture : le **modèle** (quel programme répond) et l'**effort** (combien de travail il fournit avant de répondre). Un mauvais choix coûte cher dans les deux sens : trop faible, la tâche échoue ; trop fort, on paie des [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm) (les fragments de mots que le modèle lit et écrit, et que l'on facture) pour rien. Ce chapitre donne les repères pour choisir, puis montre où poser chaque réglage dans [Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) et dans l'[API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (le moyen d'envoyer des requêtes à un service depuis un programme).

## Deux réglages distincts

| Réglage | Question | Ce qu'il change |
|---|---|---|
| Modèle | Quel programme répond ? | Le prix par token, le délai de réponse (la latence, voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)), et surtout le **plafond de qualité** : ce que Claude sait et comprend, et la difficulté maximale des tâches qu'il sait traiter |
| Effort | Quel travail fournit-il pour cette réponse ? | Le nombre de tokens produits, donc le coût et le délai ; un effort bas donne aussi moins d'appels d'outils (actions comme lire un fichier, voir [Agents](/?c=ia&s=nlp-llm&p=agents)), moins de préambule (texte d'introduction avant d'agir) et des confirmations plus brèves |

Une analogie : le modèle est la personne qui travaille (un stagiaire, un ingénieur confirmé, un expert), l'effort est le temps qu'elle consacre à ce dossier. Passer plus de temps ne donne ni les connaissances ni l'intuition qui manquent : un stagiaire qui y passe une semaine ne devient pas expert, et un expert qui y passe deux minutes peut rater un détail.

| Combinaison | Effet |
|---|---|
| Petit modèle, effort élevé | Réfléchit longtemps mais reste borné par ce qu'il sait faire : des tokens dépensés sans garantie de réussite si la tâche est trop difficile pour lui |
| Grand modèle, effort bas | Répond vite et pour peu de tokens, mais peut passer à côté d'un détail dans une tâche subtile |
| Même modèle, effort différent | Même savoir, profondeur différente : plus ou moins de réflexion et d'actions avant de répondre |
| Même effort, modèle différent | Même profondeur de travail, mais un autre plafond de qualité et un autre prix par token |

L'effort n'est pas une limite stricte de tokens : c'est une consigne de profondeur que le modèle suit.

Les deux se combinent et se choisissent ensemble, comme le montre l'arbre de décision plus bas.

## Les modèles actuels

Chaque modèle a un **identifiant API** : la chaîne exacte à fournir quand un programme appelle le service par l'API. Les prix sont en dollars par million de tokens (M). L'**entrée** désigne les tokens envoyés au modèle (le [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering), la consigne et les documents fournis), la **sortie** ceux qu'il produit (la réponse), plus chers. Ces valeurs évoluent : les relire dans la documentation officielle d'[Anthropic](https://www.anthropic.com), l'entreprise qui développe Claude, sur la [page des modèles](https://docs.claude.com/en/docs/about-claude/models) et sur la [page des tarifs](https://www.anthropic.com/pricing).

| Modèle | Identifiant API | Entrée ($/M) | Sortie ($/M) | Effort par défaut |
|---|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0,10 | 0,50 | medium |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2,00 | 10,00 | high |
| Claude Opus 5.5 | `claude-opus-5-5` | 4,00 | 20,00 | medium |
| Claude Fable 5.1 | `claude-fable-5-1` | 10,00 | 50,00 | high |

Une précision :

- Haiku 5.5 est facturé au prix ci-dessus pour des prompts jusqu'à 100 000 tokens ; au-delà, 0,50 $ en entrée et 2,50 $ en sortie.

## Ce que le modèle change, au-delà du prix

Le prix n'est pas la seule différence. D'après la [comparaison officielle](https://platform.claude.com/docs/en/about-claude/models/overview) d'Anthropic, les modèles se distinguent par leur **rapidité de réponse** (la latence) et par la **difficulté des tâches** auxquelles ils sont destinés. Une tâche est plus difficile quand elle demande de raisonner en plusieurs étapes, de tenir compte de nombreuses consignes à la fois ou de trouver une cause cachée.

| Modèle | Rapidité (comparée) | Destiné à (d'après Anthropic) |
|---|---|---|
| Claude Haiku 5.5 | La plus rapide | Tâches nombreuses où la rapidité compte : classer, extraire, aiguiller (*routing* : décider à qui ou à quoi envoyer une demande) |
| Claude Sonnet 5.5 | Rapide | Le meilleur compromis entre rapidité et intelligence, pour le travail quotidien |
| Claude Opus 5.5 | Moyenne | Travail long et autonome : code agentique (un agent qui lit, modifie et teste du code), travail de connaissance. Sa réflexion ne peut pas être désactivée : l'effort est son seul réglage de profondeur |
| Claude Fable 5.1 | La plus lente | Raisonnement exigeant et travail autonome de longue durée ; à utiliser quand les évaluations sur Opus 5.5, même à un effort plus élevé, restent insuffisantes |

Du plus petit au plus grand, la rapidité baisse, le prix monte et la capacité à venir à bout de tâches difficiles monte. La documentation ne donne pas d'échelle chiffrée de cette capacité : l'écart réel se mesure sur ses propres tâches.

Ce qui **ne change pas** d'un modèle à l'autre, d'après la même comparaison : texte et images en entrée, texte en sortie, plusieurs langues, utilisation d'outils, fenêtre de contexte de 1 million de tokens (la quantité maximale de texte, prompt et réponse compris, qu'ils traitent en une fois, voir [la fenêtre de contexte](/?c=ia&s=nlp-llm&p=llm-en-production)), réponse de 128 000 tokens au plus, connaissances arrêtées à juin 2026. Choisir un modèle ne change donc pas ce que Claude peut lire ou produire, mais la qualité de son raisonnement sur les tâches difficiles, sa rapidité et son prix.

Aucun modèle n'est le bon par défaut : le choix dépend de la tâche (voir « Estimer le modèle et l'effort d'une tâche » plus bas). Pour un gros volume où le prix ou la rapidité compte, on garde le plus petit modèle qui réussit sur un **échantillon réel** (quelques tâches représentatives de son propre travail).

## Les niveaux d'effort

Les quatre modèles acceptent les mêmes cinq niveaux, du plus économe au plus coûteux. Le repère officiel est donné pour chacun, avec un exemple de tâche.

| Niveau | Repère officiel | Exemple concret |
|---|---|---|
| `low` | Sous-agents, tâches simples, chat, classification | Ranger un message de support client dans l'une de trois catégories (facturation, bug, autre) ; un [sous-agent](/?c=ia&s=nlp-llm&p=agents) (agent secondaire lancé par un autre agent pour une sous-tâche) qui cherche dans quel fichier se trouve une fonction |
| `medium` | Palier d'économie et point de départ pour du code agentique (un agent qui lit, modifie et teste du code) | Modifier une fonction dont le comportement attendu est décrit précisément, puis lancer les tests |
| `high` | Bon compromis qualité/tokens ; minimum pour un travail où la qualité dépend directement de la finesse du raisonnement | Faire une revue de code (relire des modifications pour y trouver des erreurs) d'un module de paiement |
| `xhigh` | Recommandé pour la plupart des usages de code et d'agents, surtout longs | Ajouter une fonctionnalité qui touche une dizaine de fichiers, en plusieurs étapes enchaînées |
| `max` | Quand la justesse compte plus que le coût, seulement si une mesure montre une marge au niveau inférieur | Une anomalie intermittente (qui n'apparaît que de temps en temps), dont la cause reste inconnue après un essai complet à `xhigh` |

## Le coût : juger par tâche terminée

Le coût d'un appel est : tokens d'entrée × prix d'entrée + tokens de sortie × prix de sortie. Exemple chiffré à partir du tableau des modèles, pour une tâche de 100 000 tokens en entrée et 20 000 en sortie (hors effet de l'effort, qui fait varier la sortie) :

| Modèle | Entrée (0,1 M) | Sortie (0,02 M) | Total |
|---|---|---|---|
| Haiku 5.5 | 0,01 $ | 0,01 $ | 0,02 $ |
| Sonnet 5.5 | 0,20 $ | 0,20 $ | 0,40 $ |
| Opus 5.5 | 0,40 $ | 0,40 $ | 0,80 $ |
| Fable 5.1 | 1,00 $ | 1,00 $ | 2,00 $ |

Monter l'effort fait croître la sortie, donc la facture. Mais le bon indicateur n'est pas le prix d'une requête : c'est le coût par **tâche terminée**. Une requête moins chère qui oblige à enchaîner plus de tours (échanges successifs avec le modèle) ne coûte pas moins au total. Le suivi se fait comme pour tout [coût de LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm).

Le niveau `max` suit donc une règle stricte : il n'est justifié que pour un problème de frontière (sans solution connue), **après un échec constaté à `xhigh`**. Jamais par défaut, jamais par précaution.

## Ce qu'un effort supérieur ne garantit pas

| Limite | Explication |
|---|---|
| Rendements décroissants | Chaque palier coûte plus de tokens et de temps, pour un gain de qualité de plus en plus faible, voire nul sur une tâche déjà réussie au niveau inférieur |
| Sur-réflexion | Sur une tâche simple, un effort élevé dépense des tokens à examiner ce qui n'a pas besoin de l'être |
| Pas de vérité garantie | Un effort élevé n'élimine pas les [hallucinations](/?c=ia&s=nlp-llm&p=llm-en-production) (affirmations inventées, énoncées avec assurance) : le résultat se vérifie toujours |
| Pas de remplaçant d'une bonne consigne | Une demande floue reste floue à `max` : la [rédaction du prompt](/?c=ia&s=nlp-llm&p=prompt-engineering) prime |

## Estimer le modèle et l'effort d'une tâche

Aucun couple modèle et effort n'est le bon par défaut : on l'estime d'après la tâche, avec six questions. Les orientations sont des règles pratiques, pas des mesures d'Anthropic : un test sur un échantillon réel les confirme ou les corrige.

| Question sur la tâche | Si oui | Orientation |
|---|---|---|
| Tient-elle en une étape, avec une réponse facile à vérifier (classer, extraire, reformuler) ? | Tâche simple | Haiku 5.5, effort `low` |
| Est-elle bien décrite, avec un résultat attendu précis, mais sur plusieurs étapes ou fichiers (code courant, rédaction, débogage simple) ? | Tâche courante | Sonnet 5.5, effort `medium` |
| Contient-elle une ambiguïté, une cause inconnue à trouver ou un choix d'architecture à trancher ? | Tâche difficile | Opus 5.5, effort `high` |
| Opus 5.5 échoue-t-il encore à un effort élevé ? | Limite du modèle | Fable 5.1 ; `max` seulement après un échec constaté à `xhigh` |
| Une erreur coûte-t-elle cher ou est-elle difficile à défaire (revue avant une action irréversible, travail long et autonome) ? | Enjeu élevé | Monter l'effort (`xhigh`) avant de changer de modèle |
| Le volume est-il grand, ou la rapidité essentielle ? | Contrainte de prix ou de délai | Descendre d'un cran de modèle et valider sur un échantillon réel |

Quand une tâche échoue, la question est : faut-il un modèle plus fort ou plus d'effort ? Si le modèle bâcle (oublis, réponse superficielle, étape sautée), on monte l'**effort**. S'il échoue malgré un effort élevé, parce qu'il lui manque le raisonnement ou le savoir pour cette tâche, on change de **modèle**. L'effort ne remplace pas ce qui manque au modèle, et un grand modèle à effort bas peut passer à côté d'un détail.

## Arbre de décision

```text
Tâche à confier à Claude
        │
        ▼
1. MODÈLE : choisir d'après la tâche
        │
        ├─ nombreuse, courte, rapidité essentielle ────────────► Haiku 5.5
        ├─ travail quotidien, compromis rapidité/qualité ──────► Sonnet 5.5
        ├─ travail long et autonome, cas général ──────────────► Opus 5.5
        └─ raisonnement exigeant, Opus insuffisant ────────────► Fable 5.1
        │
        ▼
2. EFFORT : partir du défaut du modèle, augmenter seulement si la tâche
   le justifie concrètement (ambiguïté forte, enjeu élevé, échec constaté)
        │
        ├─ simple, sous-agent, classification ─► low
        ├─ code bien spécifié ─────────────────► medium
        ├─ revue, travail sensible ────────────► high
        ├─ code ou agent long ─────────────────► xhigh
        └─ échec constaté à xhigh, problème
           sans solution connue ───────────────► max
        │
        ▼
3. Mesurer le coût par tâche terminée : insuffisant ? monter d'un cran et remesurer
```

## Demander un niveau dans Claude Code et l'API

[Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) est l'assistant IA que l'on pilote depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Une **session** y est une conversation en cours. Le choix se pose à trois endroits :

| Où | Réglage | Portée |
|---|---|---|
| Session Claude Code | Commandes `/model` et `/effort` | La session en cours, et les nouvelles sessions (réglage enregistré par défaut) |
| Définition d'agent | Lignes `model:` et `effort:` de l'en-tête du fichier | Chaque fois que cet [agent](/?c=ia&s=nlp-llm&p=agents) est lancé |
| API | Champ `output_config` avec `effort` | La requête envoyée |

### Dans la session

```text
/model sonnet
```

Une commande commençant par `/` se tape dans la conversation de Claude Code. `/model <nom>` change le modèle de la session et l'enregistre par défaut pour les nouvelles sessions.

```text
/effort medium
```

`/effort <niveau>` règle l'effort. Réponse observée : « Set effort level to medium (saved as your default for new sessions): Balanced approach with standard implementation and testing ». Le niveau reste donc appliqué aux sessions suivantes : le remettre à sa valeur habituelle après un besoin ponctuel.

### Dans une définition d'agent

Une définition d'agent est un fichier du dossier `~/.claude/agents/` (le `~` désigne le dossier personnel de l'utilisateur, voir [chemins et arborescence](/?c=fondamentaux&s=bases-de-l-informatique&p=arborescence-et-chemins)), nommé `<nom>.md`. Son **en-tête** (*frontmatter*) est un bloc de réglages encadré par deux lignes `---`, au format [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) (des lignes `clé: valeur`). Extrait du fichier réel `builder-sonnet-medium.md` (description abrégée ; les lignes `tools` et `color`, sans rapport avec le sujet, sont omises) :

```yaml
---
# Début de l'en-tête
name: builder-sonnet-medium
# Nom sous lequel l'agent est appelé
description: Réalise UNE sous-tâche d'un plan validé (sonnet, effort medium : travail quotidien).
# Rôle de l'agent en une phrase
model: sonnet
# Modèle de l'agent : un nom court est accepté ici
effort: medium
# Niveau d'effort de l'agent : low, medium, high, xhigh ou max
---
# Fin de l'en-tête : le texte qui suit dans le fichier contient les consignes de l'agent
```

Le fichier `builder-haiku.md` porte `model: haiku` mais aucune ligne `effort:` : le fichier ne fixe donc aucun effort. Sa description dit « sans effort », ce qui signifie ici « aucun réglage posé », non « Haiku ne gère pas l'effort » : Haiku 5.5 accepte les cinq niveaux.

### Côté API

Une requête est un message [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (un format d'échange de données textuel) envoyé au service. L'effort se règle dans le champ `output_config` :

```text
// Contenu partiel de la requête : les autres champs (les messages, notamment) sont omis
{
    // Identifiant API du modèle (voir le tableau des modèles)
    "model": "claude-sonnet-5-5",
    // Réglages de la sortie ; "effort" prend l'un des cinq niveaux
    "output_config": { "effort": "medium" }
}
```

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Choisir `max` par défaut ou par précaution | Coût maximal pour un gain le plus souvent nul : il se réserve à un échec constaté à `xhigh` |
| Choisir le modèle sur son seul prix | Un modèle trop petit échoue sur les tâches difficiles et coûte des relances ; un modèle trop grand est plus lent et plus cher que nécessaire |
| Monter l'effort avant de mesurer | Sans mesure sur un échantillon réel, on ne sait pas si le niveau inférieur suffisait |
| Juger le coût par requête | Une requête moins chère qui demande plus de tours coûte autant ou plus par tâche terminée |
| Comparer deux modèles à effort différent | Les défauts diffèrent (Sonnet 5.5 à `high`, Opus 5.5 à `medium`) : la comparaison ne mesure plus le modèle seul |
| Oublier qu'un réglage est enregistré | `/model` et `/effort` persistent pour les nouvelles sessions : un niveau élevé laissé en place fait payer chaque session suivante |
| Croire que Haiku ne gère aucun effort | Vrai pour les anciens Haiku 4.5, faux pour la génération actuelle : Haiku 5.5 accepte `low` à `max` |
| Compter sur l'effort pour compenser une consigne floue | Il approfondit le raisonnement, il ne devine pas l'intention : clarifier le prompt d'abord |
| Se fier à des valeurs de mémoire | Modèles, niveaux et tarifs changent : relire la documentation officielle avant de décider |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Choisir le modèle d'après la tâche, garder le plus petit qui réussit sur un échantillon réel, et partir de son effort par défaut | Le prix et la latence baissent vers Haiku, la capacité sur les tâches difficiles monte vers Fable ; on ne monte que si la tâche le justifie |
| Augmenter pour une raison concrète : ambiguïté forte, enjeu élevé ou échec constaté | Chaque palier a un coût ; une raison précise évite d'en payer inutilement |
| Réserver `max` à un échec constaté à `xhigh` sur un problème sans solution connue | Seul cas où la marge supplémentaire peut valoir son prix |
| Mesurer sur un échantillon réel avant de monter un défaut | Une mesure prime sur l'intuition (voir [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) |
| Fixer le niveau dans l'en-tête de chaque agent | Chaque rôle garde son modèle et son effort, par exemple `low` pour un sous-agent de recherche |
| Surveiller le coût par tâche terminée | Seul indicateur qui compte les tours supplémentaires |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Deux réglages : le modèle (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, du plus rapide et moins cher au plus capable et plus cher ; il fixe la rapidité, le prix et la difficulté des tâches réussies) et l'effort (`low`, `medium`, `high`, `xhigh`, `max`). On commence par le défaut et on monte seulement sur une raison concrète. `max` est réservé à un échec constaté à `xhigh`. Dans Claude Code : `/model`, `/effort`, les lignes `model:` et `effort:` d'un agent ; côté API : `output_config`. |
| **Pièges à éviter** | `max` par défaut, monter sans mesurer, juger le coût par requête, comparer à effort différent, oublier qu'un réglage est enregistré, croire que Haiku 5.5 ne gère pas l'effort, attendre de l'effort qu'il corrige une consigne floue. |
| **Bonnes pratiques** | Modèle choisi d'après la tâche (le plus petit qui réussit), mesurer sur un échantillon réel, fixer le niveau dans l'en-tête des agents, juger le coût par tâche terminée, vérifier la documentation officielle. |
