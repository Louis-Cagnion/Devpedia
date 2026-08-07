---
order: 5
---

# Annuler des changements et naviguer dans l'historique

Git propose plusieurs commandes pour revenir en arrière, à des niveaux différents : annuler une modification non commitée, un commit déjà fait, ou même retrouver un commit qui semble avoir disparu.

## Annuler des modifications non commitées

```bash
git checkout -- fichier.txt   # restaure un fichier à son dernier état commité, écrase les modifications locales
git restore fichier.txt        # équivalent moderne de la commande ci-dessus

git restore --staged fichier.txt  # retire un fichier du staging, SANS toucher à ses modifications dans le dossier de travail
```

> **Note :** `git checkout -- fichier.txt` et `git restore fichier.txt` sont **irréversibles** : les modifications non commitées sont perdues définitivement, contrairement à un commit qu'on peut toujours retrouver (cf. `git reflog` plus bas).

## `git reset` : déplacer la branche courante en arrière

```bash
git reset --soft HEAD~1    # annule le dernier commit, mais garde tout en staging (prêt à recommiter)
git reset --mixed HEAD~1   # annule le dernier commit ET le staging, garde les modifications dans le dossier de travail (par défaut)
git reset --hard HEAD~1    # annule le dernier commit, le staging, ET les modifications elles-mêmes -> perte définitive
```

| Option | Commit annulé | Staging | Dossier de travail |
|---|---|---|---|
| `--soft` | Oui | Conservé | Conservé |
| `--mixed` (défaut) | Oui | Réinitialisé | Conservé |
| `--hard` | Oui | Réinitialisé | **Réinitialisé (perte de données)** |

> **Note :** `git reset --hard` est l'une des commandes Git les plus destructrices — elle écrase silencieusement toute modification non commitée, sans possibilité de récupération simple. À utiliser uniquement en étant certain de ce qu'on abandonne.

## `git revert` : annuler un commit déjà partagé

Contrairement à `reset` (qui réécrit l'historique en supprimant des commits), `revert` crée un **nouveau** commit qui applique l'inverse d'un commit précédent — l'historique original reste intact, ce qui le rend sûr même sur des commits déjà poussés et partagés :

```bash
git revert a3f9c1d
```

## `git reflog` : retrouver un commit "perdu"

Même après un `reset --hard` ou une manipulation ratée, Git conserve en réalité une trace de tous les déplacements de `HEAD` pendant un certain temps :

```bash
git reflog
# a3f9c1d HEAD@{0}: reset: moving to HEAD~1
# e4f5g6h HEAD@{1}: commit: Corrige le calcul de remise
```

```bash
git checkout e4f5g6h        # récupère l'état d'un commit "perdu" retrouvé via reflog
git branch recuperation e4f5g6h   # ou crée directement une branche à partir de ce commit
```

> **Note :** `git reflog` est souvent la solution de secours après une manipulation Git qui a mal tourné — tant qu'un commit a existé localement à un moment donné, il reste généralement retrouvable pendant plusieurs semaines, même s'il n'est plus référencé par aucune branche.

Voir aussi [Les branches](/?c=git&p=branches) et [Le rebase](/?c=git&p=rebase), dont les manipulations sont les plus concernées par ce chapitre.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `restore`/`checkout --` annulent des modifications non commitées (irréversible) ; `reset` déplace la branche en arrière (`--soft`/`--mixed`/`--hard`) ; `revert` crée un commit inverse, sûr sur un historique déjà partagé ; `reflog` retrouve un commit "perdu". |
| **Outils utilisables** | `git restore`, `git reset --soft/--mixed/--hard`, `git revert`, `git reflog`. |
| **Pièges à éviter** | `git reset --hard` écrase silencieusement toute modification non commitée, sans récupération simple. |
| **Bonnes pratiques** | Préférer `revert` à `reset` sur un historique déjà partagé ; vérifier `git reflog` avant de croire un commit définitivement perdu. |
