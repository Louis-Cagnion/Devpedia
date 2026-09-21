---
order: 15
---

# Le worktree : plusieurs branches ouvertes en même temps

Un dossier de travail Git classique n'a qu'une seule branche extraite (*checked out*) à la fois : changer de branche remplace le contenu du dossier par celui de la branche cible. Un **worktree** est un dossier de travail supplémentaire, connecté au même dépôt, avec sa propre branche extraite à part : plusieurs branches restent donc disponibles en même temps, chacune dans son propre dossier.

## Le problème que le worktree résout

Une fonctionnalité est à moitié terminée sur `feature`, un bug urgent tombe sur `main`. Changer de branche pour corriger le bug oblige soit à commiter un travail incomplet, soit à passer par un [`git stash`](/?c=git&p=stash) qui met tout de côté le temps de la correction. Un worktree évite ce choix : la correction se fait dans un second dossier, pendant que le premier garde `feature` intact et inchangé.

```text
Sans worktree                        Avec worktree
un seul dossier, une branche         un dossier par branche, en parallele
a la fois -> stash pour changer      mon-projet/         (main)
                                      mon-projet-hotfix/  (hotfix)
                                      mon-projet-feature/ (feature)
```

## Créer, lister et retirer un worktree

```bash
git worktree add ../mon-projet-hotfix hotfix   # cree un dossier, branche "hotfix" extraite
git worktree list                              # liste les worktrees du depot et leur branche
git worktree remove ../mon-projet-hotfix       # retire un worktree termine
```

`git worktree add` accepte aussi une branche qui n'existe pas encore (`-b nouvelle-branche`), créée à la volée à partir du commit courant.

## Historique partagé, fichiers de travail séparés

Tous les worktrees d'un dépôt partagent le même historique (`.git`) : pas besoin de cloner le dépôt en entier pour chaque branche. Seuls les fichiers de travail (dossier de travail + index) sont propres à chaque worktree.

> **Piège :** l'historique est partagé, mais pas les dépendances installées (`node_modules`, environnement virtuel Python...). Chaque worktree reprend son propre exemplaire de ces dossiers, ce qui consomme de l'espace disque et demande une réinstallation par worktree.

> **Note :** un merge entre deux branches issues de worktrees différents reste un merge Git ordinaire, avec les mêmes conflits possibles qu'entre deux branches d'un seul dossier de travail. Le worktree isole le travail en cours, il ne dispense jamais de résoudre un conflit réel au moment de fusionner.

## Cas d'usage typique : plusieurs agents en parallèle

Un usage de plus en plus courant : donner à chaque agent codant en parallèle (ou chaque tâche indépendante) son propre worktree, pour qu'aucun ne modifie les fichiers sur lequel un autre travaille déjà :

```bash
git worktree add ../projet-auth authentification
git worktree add ../projet-billing facturation
# un agent travaille dans chaque dossier, sans jamais se marcher dessus
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un worktree est un dossier de travail supplémentaire connecté au même dépôt, avec sa propre branche extraite. Plusieurs branches restent ainsi ouvertes en même temps, sans `stash` ni clone séparé : seul l'historique est partagé, les fichiers de travail (dont les dépendances installées) restent propres à chaque worktree. |
| **Outils utilisables** | `git worktree add`/`list`/`remove`. |
| **Pièges à éviter** | Croire que les dépendances installées (`node_modules`...) sont partagées entre worktrees : chacun a son propre exemplaire à réinstaller. |
| **Bonnes pratiques** | Donner un worktree séparé à chaque branche/tâche menée en parallèle (hotfix urgent, plusieurs agents codant simultanément), plutôt que d'enchaîner des `stash`. |
