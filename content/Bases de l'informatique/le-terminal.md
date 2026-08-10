---
order: 2
---

# Le terminal : donner des instructions par écrit

Le chapitre précédent explique que [le code est une liste d'instructions](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers), mais comment donne-t-on concrètement un ordre à un ordinateur, sans cliquer sur une icône ? C'est le rôle du terminal.

## Deux façons de piloter un ordinateur

| | Interface graphique (GUI) | Ligne de commande (CLI) |
|---|---|---|
| Comment on donne un ordre | En cliquant sur des icônes, boutons, menus | En écrivant une instruction en texte |
| Exemple concret | Faire glisser un fichier vers la corbeille | Taper une instruction qui supprime ce fichier |
| Avantage principal | Immédiatement visuel, rien à mémoriser | Précis, répétable, automatisable (rejouer 100 fois la même instruction en une fois) |

**GUI** (*Graphical User Interface*) et **CLI** (*Command-Line Interface*) sont les deux abréviations que vous croiserez partout pour désigner ces deux mondes. Ce site s'intéresse surtout au second.

> **Piège :** supposer qu'une suppression en CLI passe par une corbeille, comme en GUI. La plupart des commandes de suppression sont **définitives** et immédiates, sans étape de récupération possible.
>
> **Bonne pratique :** avant de taper une commande qui modifie ou supprime quelque chose, vérifier une dernière fois ce qu'elle cible précisément : il n'y a pas de "annuler" après coup.

## Le terminal et le shell : deux choses différentes

Deux mots reviennent tout le temps, et sont souvent confondus :

- Le **terminal** est le programme qui affiche une fenêtre de texte : il reçoit ce que vous tapez, et affiche ce qu'on lui répond. Il ne comprend rien lui-même.
- Le **shell** est le programme qui reçoit ce texte depuis le terminal, l'interprète, et l'exécute réellement.

```text
Vous tapez : ls
      │
      ▼
Terminal (la fenêtre)   →  transmet le texte tapé
      │
      ▼
Shell (l'interpréteur)  →  comprend "ls", demande au système la liste des fichiers
      │
      ▼
Résultat affiché dans le terminal
```

> **Analogie :** le terminal est le combiné téléphonique, le shell est la personne à qui vous parlez. Le combiné ne comprend pas votre demande : il ne fait que transmettre votre voix et vous renvoyer la réponse.

> **Approfondir :** ce site détaille en profondeur deux shells très utilisés, [Bash](/?c=shells&s=bash&p=bash) (Linux/macOS) et [PowerShell](/?c=shells&s=powershell&p=powershell) (Windows), chacun avec son propre vocabulaire de commandes.

> **Piège :** chercher à "réparer" une commande qui ne fonctionne pas en changeant d'application terminal. L'apparence (couleurs, police, onglets) dépend du terminal ; les commandes disponibles dépendent uniquement du shell : changer l'un ne change jamais l'autre.
>
> **Bonne pratique :** face à une commande qui échoue, se demander d'abord "quel shell l'interprète, et la connaît-il ?" avant de remettre en cause le terminal lui-même.

## Ouvrir un terminal

| Système | Comment l'ouvrir |
|---|---|
| Windows | Menu Démarrer → taper "Terminal" ou "PowerShell" → Entrée |
| macOS | Spotlight (`Cmd + Espace`) → taper "Terminal" → Entrée |
| Linux | Selon l'environnement de bureau : souvent `Ctrl + Alt + T`, ou dans le menu des applications |

Une fois ouvert, le terminal affiche une ligne qui se termine par un symbole (`>`, `$`, `%`...) suivi d'un curseur clignotant : c'est le **prompt**. Il attend que vous tapiez quelque chose ; rien ne s'exécute avant d'appuyer sur `Entrée`.

> **Piège :** sous Windows, confondre l'**Invite de commandes** (`cmd.exe`, l'ancien shell historique de Windows) avec **PowerShell** : les deux se ressemblent visuellement, mais leurs commandes et leur syntaxe diffèrent largement.
>
> **Bonne pratique :** sur une machine récente, préférer PowerShell (plus complet, cf. [chapitre dédié](/?c=shells&s=powershell&p=powershell)) à l'Invite de commandes, sauf raison précise d'utiliser cette dernière.

## Anatomie d'une commande

Une **commande** est le nom d'une instruction que le shell sait exécuter. Elle peut être suivie d'**arguments** (sur quoi agir) et d'**options** (qui changent son comportement, généralement précédées de `-` ou `--`) :

```text
ls -l /home
│  │  │
│  │  └── argument : le dossier concerné
│  └───── option : affiche les détails (taille, date...)
└──────── commande : lister le contenu d'un dossier
```

Le nom exact des commandes change d'un shell à l'autre (`ls` sous Bash devient `Get-ChildItem` sous PowerShell) ; c'est le sujet des chapitres [Bash](/?c=shells&s=bash&p=bash) et [PowerShell](/?c=shells&s=powershell&p=powershell), pas de celui-ci : ici, seule la structure générale (commande, options, arguments) compte.

> **Piège :** une option qui semble anodine peut désactiver une protection : une option comme "forcer" ou "sans confirmation" (souvent `-f`/`--force`) supprime justement la question "vous êtes sûr ?" qu'une commande poserait sinon.
>
> **Bonne pratique :** en cas de doute sur l'effet exact d'une option rencontrée dans une commande copiée en ligne, la chercher (`--help`, documentation) avant de l'exécuter, jamais après.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le **terminal** affiche et transmet le texte tapé ; le **shell** l'interprète et l'exécute réellement. Une **commande** se compose d'un nom, d'options (`-x`) et d'arguments. Rien ne s'exécute avant `Entrée`. |
| **Outils utilisables** | Le terminal déjà installé sur votre système (voir tableau ci-dessus) : aucune installation supplémentaire n'est nécessaire pour commencer. |
| **Pièges à éviter** | Confondre terminal et shell : changer l'apparence du terminal ne change jamais les commandes disponibles, qui dépendent uniquement du shell. Taper une commande copiée sans savoir ce qu'elle fait, surtout si elle modifie ou supprime des fichiers. |
| **Bonnes pratiques** | Lire le résultat affiché après chaque commande avant d'en taper une autre. En cas de doute sur l'effet d'une commande trouvée en ligne, chercher ce qu'elle fait avant de l'exécuter, plutôt qu'après. |
