---
order: 2
---

# Choisir le modèle et le niveau d'effort de Claude

> **Valeurs vérifiées le 11/10/2026.** Les modèles, les niveaux d'effort et les tarifs évoluent : vérifier la documentation officielle d'[Anthropic](https://www.anthropic.com), l'entreprise qui développe Claude, sur la [page des modèles](https://docs.claude.com/en/docs/about-claude/models) et sur la [page des tarifs](https://www.anthropic.com/pricing).

**Claude** est une famille de [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) (grands modèles de langage, des programmes qui produisent du texte). Deux réglages déterminent le résultat et la facture : le **modèle** (quel programme répond) et l'**effort** (combien de travail il fournit avant de répondre). Un mauvais choix coûte cher dans les deux sens : trop faible, la tâche échoue ; trop fort, on paie des [tokens](/?c=ia&s=nlp-llm&p=nlp-et-llm) (les fragments de mots que le modèle lit et écrit, et que l'on facture) pour rien. Ce chapitre donne les repères pour choisir, puis montre où poser chaque réglage dans [Claude Code](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) et dans l'[API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (le moyen d'envoyer des requêtes à un service depuis un programme).

## Deux réglages distincts

| Réglage | Question | Ce qu'il change |
|---|---|---|
| Modèle | Quel programme répond ? | Le prix par token, la capacité de raisonnement, le délai de réponse (la latence, voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)) |
| Effort | Quel travail fournit-il pour cette réponse ? | Le nombre de tokens produits, donc le coût et le délai ; un effort bas donne aussi moins d'appels d'outils (actions comme lire un fichier, voir [Agents](/?c=ia&s=nlp-llm&p=agents)), moins de préambule (texte d'introduction avant d'agir) et des confirmations plus brèves |

Les deux se combinent et se choisissent ensemble, comme le montre l'arbre de décision plus bas.

## Les modèles actuels

Chaque modèle a un **identifiant API** : la chaîne exacte à fournir quand un programme appelle le service par l'API. Les prix sont en dollars par million de tokens (M). L'**entrée** désigne les tokens envoyés au modèle (le [prompt](/?c=ia&s=nlp-llm&p=prompt-engineering), la consigne et les documents fournis), la **sortie** ceux qu'il produit (la réponse), plus chers.

| Modèle | Identifiant API | Entrée ($/M) | Sortie ($/M) | Effort par défaut | Quand le choisir |
|---|---|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | 0,10 | 0,50 | medium | Tâches simples et nombreuses (classer, extraire, converser), sous-agents : le moins cher |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | 2,00 | 10,00 | high | Palier intermédiaire : quand Haiku échoue sur un échantillon réel (quelques tâches représentatives de son propre travail) et que le surcoût d'Opus n'est pas justifié |
| Claude Opus 5.5 | `claude-opus-5-5` | 4,00 | 20,00 | medium | Quand Sonnet échoue sur un échantillon réel ; sa réflexion ne peut pas être désactivée, l'effort est son seul réglage de profondeur |
| Claude Fable 5.1 | `claude-fable-5-1` | 10,00 | 50,00 | high | Le plus cher : seulement quand Opus échoue à un effort adapté |

Deux précisions :

- Haiku 5.5 est facturé au prix ci-dessus pour des prompts jusqu'à 100 000 tokens ; au-delà, 0,50 $ en entrée et 2,50 $ en sortie.
- Les quatre modèles ont une fenêtre de contexte de 1 million de tokens : la quantité maximale de texte (prompt et réponse compris) qu'ils traitent en une fois (voir [la fenêtre de contexte](/?c=ia&s=nlp-llm&p=llm-en-production)).

La colonne « Quand le choisir » applique une règle simple : prendre le modèle le moins cher qui réussit sur un échantillon réel de ses propres tâches, et ne monter d'un cran que si une mesure l'exige.

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

## Arbre de décision

```text
Tâche à confier à Claude
        │
        ▼
1. MODÈLE : partir du moins cher (Haiku 5.5), le tester sur un échantillon réel
        │
        ├─ réussit ──────────────► le garder
        └─ échoue ───────────────► Sonnet 5.5, puis Opus 5.5, puis Fable 5.1
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
| Commencer par le modèle le moins cher et son effort par défaut | C'est le point de départ le plus économique ; on monte seulement si la tâche le justifie |
| Augmenter pour une raison concrète : ambiguïté forte, enjeu élevé ou échec constaté | Chaque palier a un coût ; une raison précise évite d'en payer inutilement |
| Réserver `max` à un échec constaté à `xhigh` sur un problème sans solution connue | Seul cas où la marge supplémentaire peut valoir son prix |
| Mesurer sur un échantillon réel avant de monter un défaut | Une mesure prime sur l'intuition (voir [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)) |
| Fixer le niveau dans l'en-tête de chaque agent | Chaque rôle garde son modèle et son effort, par exemple `low` pour un sous-agent de recherche |
| Surveiller le coût par tâche terminée | Seul indicateur qui compte les tours supplémentaires |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Deux réglages : le modèle (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, du moins au plus cher) et l'effort (`low`, `medium`, `high`, `xhigh`, `max`). On commence par le défaut et on monte seulement sur une raison concrète. `max` est réservé à un échec constaté à `xhigh`. Dans Claude Code : `/model`, `/effort`, les lignes `model:` et `effort:` d'un agent ; côté API : `output_config`. |
| **Pièges à éviter** | `max` par défaut, monter sans mesurer, juger le coût par requête, comparer à effort différent, oublier qu'un réglage est enregistré, croire que Haiku 5.5 ne gère pas l'effort, attendre de l'effort qu'il corrige une consigne floue. |
| **Bonnes pratiques** | Le moins cher d'abord, mesurer sur un échantillon réel, fixer le niveau dans l'en-tête des agents, juger le coût par tâche terminée, vérifier la documentation officielle. |
