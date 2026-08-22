---
order: 9
---

# Les skills : packager une compétence réutilisable pour un agent

Le chapitre sur les [agents](/?c=ia&s=nlp-llm&p=agents) a montré comment donner à un modèle des outils qu'il peut appeler. Ces outils restent cependant des actions ponctuelles (appeler une API, lire un fichier) : ils ne disent rien de *comment* mener à bien une tâche complexe et récurrente (déboguer méthodiquement, mener une revue de code, cadrer un projet avant de coder). Un **skill** répond à ce besoin : un paquet réutilisable d'instructions, et éventuellement de scripts ou de documents associés, que l'agent charge à la demande plutôt que de redemander à chaque fois.

## Le problème : répéter les mêmes instructions à chaque conversation

Sans skill, obtenir d'un agent qu'il suive une méthode précise (par exemple, un cycle de développement piloté par les tests, voir le chapitre [TDD](/?c=tests&p=tdd)) demande de réexpliquer cette méthode dans chaque nouvelle conversation, ou de la coller dans un long prompt système. Un skill packagé une fois pour toutes évite cette répétition, et reste disponible d'une session à l'autre sans avoir à le retransmettre.

## La structure : un dossier, un fichier SKILL.md

La convention la plus répandue (normalisée par Anthropic sous le nom **Agent Skills**, et implémentée par plusieurs agents) organise un skill comme un dossier contenant un fichier `SKILL.md` obligatoire, et des ressources associées optionnelles :

```text
mon-skill/
├── SKILL.md          <- obligatoire : métadonnées + instructions
├── scripts/           <- optionnel : code exécutable
├── references/         <- optionnel : documentation détaillée
└── assets/              <- optionnel : modèles, fichiers de référence
```

`SKILL.md` lui-même combine un en-tête structuré et des instructions en langage naturel :

```markdown
---
name: revue-de-securite
description: Revue de sécurité méthodique d'un changement de code,
  à utiliser avant de fusionner une pull request touchant à
  l'authentification ou aux données sensibles.
---

# Revue de sécurité

1. Identifier tous les points d'entrée de données utilisateur
   modifiés par ce changement.
2. Pour chacun, vérifier : validation, échappement, autorisation.
3. ...
```

## Le chargement progressif : ne pas tout charger d'un coup

Un agent qui aurait accès à des dizaines de skills ne peut pas se permettre de lire l'intégralité de chacun à chaque tour, sous peine de saturer sa [fenêtre de contexte](/?c=ia&s=nlp-llm&p=llm-en-production) pour rien. Le mécanisme retenu, le **chargement progressif** (*progressive disclosure*), ne charge chaque niveau que si le niveau précédent le justifie :

```text
Niveau 1 : le nom et la description de chaque skill disponible
           (quelques lignes chacun) -> toujours présents

Niveau 2 : si une tâche correspond à la description d'un skill,
           charger le corps complet de son SKILL.md

Niveau 3 : si les instructions du skill le demandent, charger
           un fichier de référence ou exécuter un script associé
```

Ce mécanisme explique pourquoi la **description** d'un skill compte autant que son contenu : c'est le seul élément que l'agent voit avant de décider si le skill s'applique à la tâche en cours.

> **Piège :** écrire une description vague ou trop générale ("aide pour le code"). Une description qui ne dit pas précisément à quelle situation le skill répond ne permet pas à l'agent de savoir quand le charger, ni à la personne qui écrit le skill de vérifier qu'il ne se déclenche pas dans des cas non voulus.
>
> **Bonne pratique :** rédiger la description comme une réponse à « dans quelle situation précise ce skill doit-il se déclencher ? », avec des mots-clés concrets plutôt que des formulations générales.

## Où trouver des skills existants

Plutôt que d'écrire chaque skill depuis zéro, des collections publiques existent déjà. [skills.sh](https://skills.sh), un annuaire de skills classés par popularité d'usage, en référence des milliers. Le dépôt [mattpocock/skills](https://github.com/mattpocock/skills) en est un exemple concret largement utilisé : une collection de skills pensés pour de l'ingénierie logicielle réelle plutôt que pour un prototypage superficiel, avec des skills comme `tdd` (cycle rouge/vert/refactor automatisé), `diagnosing-bugs` (méthode de débogage disciplinée), ou `grill-me` (une interview poussée pour clarifier un plan avant de l'exécuter).

> **Piège :** installer un skill tiers sans en avoir lu le contenu, en particulier s'il embarque des scripts exécutables (dossier `scripts/`). Un skill malveillant ou mal écrit peut faire exécuter du code arbitraire par l'agent, exactement comme n'importe quel autre code téléchargé d'une source non vérifiée.
>
> **Bonne pratique :** lire le contenu d'un skill (instructions et scripts associés) avant de l'installer, surtout s'il vient d'une source qu'on ne contrôle pas soi-même, en appliquant le même niveau de prudence qu'à l'exécution de n'importe quel code tiers.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un skill packagé une fois pour toutes (dossier + `SKILL.md`, éventuellement scripts/références/assets) évite de réexpliquer une méthode récurrente à chaque conversation. Le chargement progressif ne charge le contenu complet d'un skill que si sa description correspond à la tâche en cours, gardant le coût en contexte faible même avec beaucoup de skills disponibles. |
| **Outils utilisables** | Le format `SKILL.md` (en-tête `name`/`description` + instructions). skills.sh pour découvrir des skills existants ; mattpocock/skills comme collection concrète orientée ingénierie réelle. |
| **Pièges à éviter** | Une description de skill trop vague pour que l'agent sache quand le déclencher. Installer un skill tiers, en particulier avec des scripts exécutables, sans en avoir lu le contenu. |
| **Bonnes pratiques** | Rédiger la description comme une réponse précise à « quand ce skill doit-il se déclencher ? ». Lire un skill avant de l'installer, comme pour tout code tiers. |
