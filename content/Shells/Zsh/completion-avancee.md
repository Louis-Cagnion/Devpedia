---
order: 4
---

# La complétion avancée

Bash complète les noms de fichiers et, pour certaines commandes, propose une liste à plat via la touche Tab. Le système de complétion de zsh (`compsys`) est un moteur à part entière, sensible au **contexte** : il sait qu'après `git checkout`, il doit proposer des noms de branches, et qu'après `kill`, des PID de processus en cours, pas seulement des noms de fichiers.

## Activer le système de complétion

```bash
autoload -Uz compinit
compinit
```

Ces deux lignes, placées dans `~/.zshrc` (voir [Les fichiers de démarrage](/?c=shells&s=zsh&p=fichiers-de-demarrage)), chargent `compsys`. Sans elles, zsh se limite à une complétion basique proche de celle de Bash.

> **Note :** `compinit` reconstruit un cache de définitions de complétion à chaque lancement, ce qui peut ralentir perceptiblement l'ouverture d'un nouveau terminal ; d'où l'usage courant de `compinit -C` (sans revérification du cache) une fois la configuration stabilisée, ou d'un appel conditionné à la date du cache.

## Ce que ça change concrètement

```bash
git checkout <Tab>        # propose les branches locales, pas les fichiers du dossier
kill -9 <Tab>              # propose les PID de processus en cours, avec leur nom
ssh <Tab>                  # propose les hôtes connus (~/.ssh/config, ~/.ssh/known_hosts)
```

Sans `compsys`, chacune de ces commandes se contenterait de compléter des noms de fichiers du dossier courant, rarement ce qu'on veut dans ces cas précis.

## Le menu de complétion navigable

Quand plusieurs résultats sont possibles, zsh peut afficher un **menu** navigable aux flèches plutôt que de simplement lister les possibilités :

```bash
zstyle ':completion:*' menu select
```

Une fois cette ligne ajoutée à `~/.zshrc`, appuyer sur Tab avec plusieurs résultats possibles ouvre un menu où les flèches directionnelles déplacent la sélection, et Entrée valide : plus rapide que retaper des caractères pour désambiguïser.

## Complétion insensible à la casse

```bash
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
```

Permet de taper `desk<Tab>` et de compléter vers `Desktop` malgré la majuscule, utile notamment sous macOS/Windows où la casse des noms de fichiers est moins strictement respectée qu'en Bash sous Linux.

## `zstyle` : le mécanisme de configuration derrière tout ça

Les exemples ci-dessus utilisent `zstyle`, la commande générique de configuration de `compsys` : chaque règle associe un contexte (`':completion:*'` = partout) à un comportement. C'est un mécanisme propre à zsh, sans équivalent direct en Bash, dont la complétion n'expose pas ce niveau de personnalisation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `compsys` est un moteur de complétion sensible au contexte : après `git checkout`, il propose des branches, pas des noms de fichiers. Il doit être activé explicitement (`compinit`). |
| **Outils utilisables** | `autoload -Uz compinit`/`compinit`, `zstyle` pour personnaliser (menu navigable, insensibilité à la casse). |
| **Pièges à éviter** | `compinit` reconstruit son cache à chaque lancement : peut ralentir perceptiblement l'ouverture d'un terminal. |
| **Bonnes pratiques** | Utiliser `compinit -C` une fois la configuration stabilisée, pour éviter la revérification systématique du cache. |
