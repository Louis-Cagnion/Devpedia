---
order: 14
---

# Alias et raccourcis de commandes en PowerShell

Un **raccourci de commande** est un nom court que l'on tape à la place d'une commande longue ou d'une suite de commandes. Dans [PowerShell](/?c=langages&s=powershell&p=powershell), le shell (le programme qui lit ce que l'on tape dans un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) et l'exécute), il existe plusieurs outils pour cela, du plus simple au plus puissant. Ce chapitre les présente **en quatre niveaux**, chacun s'appuyant sur le précédent :

| Niveau | Besoin | Outil | Section |
|---|---|---|---|
| 1 | Un autre nom pour une seule commande | L'**alias** (`Set-Alias`) | [Niveau 1](#niveau-1-l-alias-simple) |
| 2 | Une commande avec des arguments déjà remplis | Une **fonction** courte | [Niveau 2](#niveau-2-des-arguments-fixes-avec-une-fonction) |
| 3 | Un vrai petit outil : paramètres nommés, valeurs par défaut, [pipeline](/?c=langages&s=powershell&p=redirections-et-pipes) | Une fonction avancée, puis un alias posé dessus | [Niveau 3](#niveau-3-un-raccourci-complexe) |
| 4 | Faire cohabiter tout cela sans mauvaise surprise | `Get-Command`, `$PROFILE`, dot sourcing (charger un fichier dans la session courante) | [Niveau 4](#niveau-4-cohabitation-et-pieges) |

Une **cmdlet** (prononcé « commandelette ») est une commande native de PowerShell, nommée `Verbe-Nom` comme `Get-ChildItem` ; elle est présentée dans [les commandes de base](/?c=langages&s=powershell&p=commandes-de-base). Un **argument** est tout ce que l'on écrit après le nom d'une commande ; un **paramètre** est un argument nommé qui commence par un tiret, comme `-Force` dans `Get-ChildItem -Force`. La **session** est la période qui va de l'ouverture de la fenêtre du terminal à sa fermeture. Ce chapitre suppose connus [les fonctions](/?c=langages&s=powershell&p=fonctions) et [les variables d'environnement](/?c=langages&s=powershell&p=variables-denvironnement) (qui présentent le fichier de profil `$PROFILE`).

## Ce qu'est un alias, et pourquoi on en crée

Un **alias** est un second nom donné à **une** commande. L'image la plus proche est un contact dans un téléphone : l'entrée « Maman » ne contient pas de conversation, elle désigne un numéro. Quand vous appelez « Maman », le téléphone compose le numéro. De même, quand vous tapez l'alias, PowerShell lance la commande qu'il désigne.

```
   Vous tapez :   ll -Force
                   |
                   v
   1. PowerShell lit le premier mot : ll
   2. Il trouve l'alias ll, qui désigne la cmdlet Get-ChildItem
   3. Il remplace ll par Get-ChildItem et garde le reste tel quel
                   |
                   v
   Il exécute :   Get-ChildItem -Force
```

On crée un alias pour taper moins (`ll` au lieu de `Get-ChildItem`), pour retrouver un nom connu d'un autre shell, ou pour garder un nom court facile à retenir.

## Niveau 1 : l'alias simple

### Créer un alias : `Set-Alias` et `New-Alias`

```powershell
# Set-Alias crée un alias : -Name donne le nouveau nom, -Value la commande désignée
Set-Alias -Name ll -Value Get-ChildItem
# ll fait maintenant la même chose que Get-ChildItem : il liste le dossier courant
ll
# ce qui s'écrit après l'alias est transmis à la commande : ici, le paramètre -Force
ll -Force
# forme courte : sans les mots -Name et -Value, le 1er mot est le nom, le 2e la commande
Set-Alias g git
# g désigne le programme git (à installer à part) : « g status » lance « git status »
g status
```

Deux cmdlets créent un alias. Elles diffèrent sur un seul cas : le nom existe déjà.

| | `Set-Alias` | `New-Alias` |
|---|---|---|
| Le nom n'existe pas encore | Crée l'alias | Crée l'alias |
| Le nom existe déjà | **Remplace** l'alias existant, sans avertissement | **Refuse** et affiche une erreur |
| Avec `-Force` | Inutile | Se comporte comme `Set-Alias` |
| À utiliser pour | Un fichier de profil que l'on recharge | Créer un nom que l'on croit libre, en étant prévenu s'il ne l'est pas |

```powershell
# première création : le nom ll est libre, l'alias est créé
New-Alias -Name ll -Value Get-ChildItem
# deuxième création du même nom : erreur, car ll existe déjà (rien n'est modifié)
New-Alias -Name ll -Value Get-ChildItem
# avec -Force, New-Alias remplace l'alias existant, comme Set-Alias
New-Alias -Name ll -Value Get-ChildItem -Force
```

Quelques paramètres utiles de ces deux cmdlets (la page [Set-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/set-alias) et la page [New-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/new-alias) de Microsoft donnent la liste complète) :

| Paramètre | Rôle |
|---|---|
| `-Name` | Le nom de l'alias |
| `-Value` | Le nom de la commande désignée (un nom seul, voir [la limite centrale](#la-limite-centrale-un-nom-jamais-une-commande-avec-arguments)) |
| `-Description` | Un texte libre qui rappelle à quoi sert l'alias |
| `-Option ReadOnly` | Protège l'alias : le modifier exige ensuite `-Force` |
| `-Scope Global` | Choisit la portée où l'alias vit (voir [le niveau 4](#niveau-4-cohabitation-et-pieges)) |

### Lister et retrouver un alias : `Get-Alias`

```powershell
# sans argument, Get-Alias liste tous les alias de la session (les vôtres compris)
Get-Alias
# que désigne l'alias ls ?
Get-Alias -Name ls
# quels alias désignent la cmdlet Get-ChildItem ? (retrouver l'alias d'une cmdlet)
Get-Alias -Definition Get-ChildItem
# un joker (voir ci-dessous) : tous les alias dont le nom commence par g
Get-Alias -Name g*
```

Un **joker** (*wildcard*) est un caractère spécial qui remplace des lettres inconnues : `*` remplace n'importe quelle suite de caractères (voir [l'expansion et les jokers](/?c=langages&s=powershell&p=expansion-et-jokers)). `Get-Alias` affiche une ligne par alias, sous la forme `ll -> Get-ChildItem` dans la colonne du nom. Avec `-Definition Get-ChildItem`, on y retrouve par exemple `gci` et, sous Windows, `dir` et `ls`, plus `ll` si vous l'avez créé. La page [Get-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-alias) détaille les paramètres.

### La limite centrale : un nom, jamais une commande avec arguments

Un alias ne sait désigner qu'un **nom de commande**. Il ne peut pas contenir une commande **suivie de ses arguments**. L'erreur est fréquente, parce qu'elle fonctionne dans d'autres shells (voir [le tableau de comparaison](#et-dans-bash-et-zsh)) :

```powershell
# Piège : on met une commande ET un argument dans -Value
Set-Alias -Name gs -Value "git status"
# La création ne produit aucun message : PowerShell ne vérifie rien à ce moment
# On tape l'alias : c'est là que l'erreur apparaît
gs
# Erreur, en substance : le terme git status n'est pas reconnu comme le nom d'une cmdlet,
# d'une fonction, d'un fichier de script ou d'un programme (le texte exact varie)
```

L'explication tient en une phrase : PowerShell lit `"git status"` comme **un seul nom**, avec une espace au milieu, et cherche une commande qui s'appellerait ainsi. Il n'en existe aucune. L'alias est bien créé, mais il pointe dans le vide.

```powershell
# Correct : l'alias désigne SEULEMENT le nom git
Set-Alias -Name g -Value git
# Ce que l'on tape après l'alias est ajouté tel quel : cette ligne lance « git status »
g status
# mais on ne peut pas fixer « status » dans l'alias lui-même : il faut une fonction
```

| Écriture | Ce que PowerShell cherche | Résultat |
|---|---|---|
| `Set-Alias -Name g -Value git` | Une commande nommée `git` | Fonctionne ; `g status` lance `git status` |
| `Set-Alias -Name gs -Value "git status"` | Une commande nommée `git status` (avec l'espace) | Erreur à l'utilisation |
| `Set-Alias -Name ll -Value "Get-ChildItem -Force"` | Une commande nommée `Get-ChildItem -Force` | Erreur à l'utilisation |

Pour figer un argument dans un raccourci, il faut passer au [niveau 2](#niveau-2-des-arguments-fixes-avec-une-fonction).

### Supprimer un alias

```powershell
# Alias: se comporte comme un lecteur de disque virtuel qui contient les alias
# Remove-Item (la cmdlet qui supprime) retire donc l'alias comme on supprime un fichier
Remove-Item Alias:ll
# l'alias n'existe plus : cette commande signale une erreur « introuvable »
Get-Alias -Name ll
```

PowerShell présente les alias comme les fichiers d'un lecteur nommé `Alias:`. Voir aussi [la suppression de fichiers](/?c=langages&s=powershell&p=permissions-et-fichiers) avec `Remove-Item`. Sur PowerShell (Core), la cmdlet [Remove-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/remove-alias) fait la même chose ; elle manque à la version historique livrée avec Windows, d'où la forme `Remove-Item Alias:` qui marche partout.

### La portée : la session en cours seulement

Un alias créé dans le terminal est conservé **en mémoire**, dans la session. Fermez la fenêtre et rouvrez-la : l'alias n'existe plus.

| Où l'alias est créé | Combien de temps il vit |
|---|---|
| Tapé dans le terminal | Jusqu'à la fermeture de la fenêtre |
| Dans un script lancé normalement (`.\script.ps1`) | Jusqu'à la fin du script (voir [le niveau 4](#niveau-4-cohabitation-et-pieges)) |
| Dans le fichier de profil `$PROFILE` | Dans chaque nouvelle session : c'est la solution |

### Rendre un alias permanent avec `$PROFILE`

Le **profil** est un fichier de script que PowerShell exécute à chaque démarrage d'une session interactive (voir [les fichiers de configuration](/?c=langages&s=powershell&p=variables-denvironnement#fichiers-de-configuration-profils)). Son chemin est stocké dans la variable `$PROFILE`, et sa valeur dépend du système : il faut toujours la lire plutôt que la deviner.

```powershell
# affiche le chemin du fichier de profil
$PROFILE
# Test-Path renvoie True (vrai) si le chemin existe, False (faux) sinon
# -not inverse ce résultat : le bloc ne s'exécute que si le fichier n'existe PAS
if (-not (Test-Path -Path $PROFILE)) {
    # New-Item crée le fichier ; -Force crée aussi les dossiers manquants
    # Out-Null jette le message que New-Item afficherait
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
# Add-Content ajoute une ligne à la fin du fichier, sans toucher au reste
Add-Content -Path $PROFILE -Value "Set-Alias -Name ll -Value Get-ChildItem"
# le point suivi d'une espace (dot sourcing) exécute le fichier DANS la session courante
. $PROFILE
```

Le test `if (-not (Test-Path ...))` n'est pas décoratif : `New-Item -Force` sur un fichier **qui existe déjà** le remplace par un fichier vide, et efface donc tous vos réglages (les conditions `if` sont expliquées dans [le chapitre dédié](/?c=langages&s=powershell&p=conditions)). Le dot sourcing est détaillé au [niveau 4](#niveau-4-cohabitation-et-pieges).

Dans un profil que l'on recharge souvent, on utilise `Set-Alias` plutôt que `New-Alias` : la seconde exécution de `New-Alias` sur un nom existant afficherait une erreur à chaque rechargement.

## Niveau 2 : des arguments fixes avec une fonction

Dès que le raccourci doit **contenir un argument** (`git status`, `Get-ChildItem -Force`), l'alias ne suffit plus : il faut une **fonction**, c'est-à-dire un bloc d'instructions auquel on donne un nom (voir [les fonctions](/?c=langages&s=powershell&p=fonctions)). Une fonction se tape comme une commande, donc elle joue le rôle d'un raccourci.

```powershell
# function déclare une fonction nommée gs ; les accolades { } entourent ses instructions
function gs {
    # $args : variable automatique qui contient ce qui est tapé après gs
    # @args : répartit cette liste en arguments séparés, ajoutés après « git status »
    git status @args
}
```

Le `@` devant `args` s'appelle le **splatting** (de l'anglais *splat*, « éclabousser ») : au lieu de transmettre la liste comme un seul bloc, PowerShell la répartit en autant d'arguments séparés, avec le sens de chacun. Pour une cmdlet, `@args` conserve même les paramètres nommés (`-Force` reste un paramètre), ce que `$args` seul ne garantit pas. `$args` est une [variable automatique](/?c=langages&s=powershell&p=variables#variables-automatiques), c'est-à-dire créée et remplie par PowerShell lui-même. La page [about_Splatting](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_splatting) détaille le mécanisme.

```powershell
gs                     # exécute : git status
gs --short             # exécute : git status --short
gs --short --branch    # exécute : git status --short --branch
```

Même principe avec une cmdlet, dont on fixe un paramètre :

```powershell
# la fonction la lance Get-ChildItem avec -Force (afficher aussi les éléments cachés)
function la {
    # -Force est fixe ; tout ce que l'on tape derrière « la » s'ajoute ensuite
    Get-ChildItem -Force @args
}
la                     # exécute : Get-ChildItem -Force
la -Recurse            # exécute : Get-ChildItem -Force -Recurse
la src                 # exécute : Get-ChildItem -Force src
```

| | Alias | Fonction courte |
|---|---|---|
| Donner un autre nom à une commande | Oui | Oui |
| Fixer un ou plusieurs arguments | **Non** | Oui |
| Transmettre ce que l'on tape derrière | Oui, automatiquement | Oui, avec `@args` |
| Enchaîner plusieurs commandes | Non | Oui |
| Se supprime avec | `Remove-Item Alias:nom` | `Remove-Item Function:nom` |
| Se retrouve avec | `Get-Alias` | `Get-Command` ou `Get-ChildItem Function:` |

Une fonction tapée dans le terminal vit, elle aussi, dans la session seulement : pour la garder, on la place dans `$PROFILE`, comme un alias.

### Une autre piste : les valeurs par défaut des paramètres

Pour qu'une **cmdlet** reçoive toujours un paramètre, sans créer de nouveau nom, PowerShell a la variable `$PSDefaultParameterValues`. C'est une **table associative** : une liste de paires `clé = valeur`.

```powershell
# la clé « Get-ChildItem:Force » désigne le paramètre -Force de Get-ChildItem
# $true signifie « vrai » : le paramètre est activé à chaque appel de la cmdlet
$PSDefaultParameterValues["Get-ChildItem:Force"] = $true
# retire ce réglage
$PSDefaultParameterValues.Remove("Get-ChildItem:Force")
```

| | Fonction `la` | `$PSDefaultParameterValues` |
|---|---|---|
| Nouveau nom à taper | Oui (`la`) | Non : on garde `Get-ChildItem` |
| Marche pour un programme externe comme `git` | Oui | Non : seulement les cmdlets et fonctions |
| Visible dans le code qui l'utilise | Oui | Non : le réglage agit en coulisses, y compris sur les scripts lancés dans la session |

La page [about_Parameters_Default_Values](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_parameters_default_values) de Microsoft documente cette variable.

## Niveau 3 : un raccourci complexe

Un raccourci peut devenir un petit outil : il reçoit des **paramètres nommés** (avec un type et une valeur par défaut), accepte des valeurs venant d'un **pipeline** (l'enchaînement `commande1 | commande2` où la sortie de la première devient l'entrée de la seconde, voir [les pipes](/?c=langages&s=powershell&p=redirections-et-pipes)) et se comporte comme une vraie cmdlet. Exemple : lister les plus gros fichiers d'un ou plusieurs dossiers.

```powershell
function Get-GrosFichier {
    # attribut : un réglage entre crochets posé avant param ; celui-ci donne à la fonction
    # les comportements d'une cmdlet (paramètres communs comme -Verbose)
    [CmdletBinding()]
    param(
        # ce paramètre peut aussi recevoir ses valeurs du pipeline
        [Parameter(ValueFromPipeline)]
        # [string] : le type texte ; "." désigne le dossier courant (valeur par défaut)
        [string]$Dossier = ".",
        # [int] : le type nombre entier ; 5 si rien n'est donné
        [int]$Nombre = 5
    )
    # bloc process : exécuté une fois pour chaque valeur reçue du pipeline
    process {
        # affiché seulement si l'appel contient -Verbose
        Write-Verbose "Analyse de $Dossier"
        # tous les fichiers (-File) du dossier et de ses sous-dossiers (-Recurse)
        Get-ChildItem -Path $Dossier -File -Recurse |
            # trie du plus gros au plus petit, d'après la propriété Length (la taille)
            Sort-Object -Property Length -Descending |
            # garde les $Nombre premiers, et seulement les colonnes Name et Length
            Select-Object -First $Nombre -Property Name, Length
    }
}
```

| Élément | Rôle |
|---|---|
| `[CmdletBinding()]` | Ajoute les paramètres communs (`-Verbose`, `-ErrorAction`...) et **refuse** un argument que la fonction ne déclare pas (`$args` n'existe plus, donc plus de `@args`) |
| `[Parameter(ValueFromPipeline)]` | Le paramètre peut recevoir ses valeurs depuis le pipeline |
| `[string]$Dossier = "."` | Un paramètre nommé `-Dossier`, de type texte, valant `"."` s'il est omis |
| `[int]$Nombre = 5` | Un paramètre nommé `-Nombre`, de type entier, valant `5` s'il est omis |
| `process { }` | Le bloc répété pour chaque valeur arrivant du pipeline |
| `Write-Verbose` | Un message de suivi, invisible sauf avec `-Verbose` |

Les pages [about_Functions_CmdletBindingAttribute](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_cmdletbindingattribute) et [about_Functions_Advanced_Parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_advanced_parameters) de Microsoft donnent toutes les options.

```powershell
Get-GrosFichier                                   # dossier courant, les 5 plus gros fichiers
Get-GrosFichier -Dossier src -Nombre 3            # paramètres nommés
Get-GrosFichier src 3                             # sans les noms : dans l'ordre déclaré
"src", "docs" | Get-GrosFichier -Nombre 3         # pipeline : un passage par dossier
Get-GrosFichier -Dossier src -Verbose             # affiche aussi « Analyse de src »
```

Le nom `Get-GrosFichier` suit la convention `Verbe-Nom`, ce qui le rend facile à retrouver (`Get-Command -Verb Get`), mais il est long à taper. On pose alors un **alias sur la fonction** : `Set-Alias` accepte le nom d'une fonction aussi bien que celui d'une cmdlet.

```powershell
# l'alias gros désigne la fonction Get-GrosFichier
Set-Alias -Name gros -Value Get-GrosFichier
gros                   # exécute : Get-GrosFichier
gros -Nombre 3         # les paramètres suivent l'alias, comme pour une cmdlet
"src" | gros           # le pipeline fonctionne aussi à travers l'alias
Get-Alias -Name gros   # confirme : gros -> Get-GrosFichier
```

La logique vit dans la fonction ; l'alias n'est que le nom court. C'est la répartition recommandée : un nom complet pour les scripts, un nom court pour les doigts.

## Niveau 4 : cohabitation et pièges

### Qui répond quand on tape un nom ?

Plusieurs commandes peuvent porter le même nom. PowerShell choisit selon un ordre fixe (alias, puis fonction, puis cmdlet, puis programme), décrit dans [le chapitre sur l'architecture](/?c=langages&s=powershell&p=architecture-dun-shell#comment-powershell-trouve-quelle-commande-lancer). Conséquence directe : un alias **gagne toujours** contre une fonction du même nom, et une fonction gagne contre la cmdlet. `Get-Command` ([documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/get-command)) montre qui répond.

```powershell
# gl est déjà un alias fourni par PowerShell (il désigne Get-Location)
# on croit créer un raccourci pour « git log », mais l'alias passe avant
function gl { git log --oneline @args }
# affiche le dossier courant : c'est l'alias qui a répondu, pas notre fonction
gl
# qui répond au nom gl ? (la commande qui gagne)
Get-Command -Name gl
# -All montre aussi les commandes masquées, dans l'ordre de priorité
Get-Command -Name gl -All
# on retire la fonction devenue inutile : Function: est le lecteur virtuel des fonctions
Remove-Item Function:gl
```

Avant de choisir un nom, on vérifie qu'il est libre :

```powershell
# -ErrorAction SilentlyContinue : ne rien afficher si aucune commande ne porte ce nom
$existant = Get-Command -Name glg -ErrorAction SilentlyContinue
# la variable est vide (faux) quand le nom est libre, remplie (vrai) sinon
if ($existant) { "Nom déjà pris" } else { "Nom libre" }
```

| Vous définissez | Le nom est déjà porté par | Ce qui répond ensuite |
|---|---|---|
| Une fonction `gl` | L'alias `gl` | L'alias : votre fonction n'est jamais appelée |
| Un alias `ls` | L'alias par défaut `ls` (qui désigne `Get-ChildItem`) | Le vôtre le remplace, sauf si l'alias par défaut est protégé |
| Une fonction nommée comme une cmdlet (`Get-Date`) | La cmdlet | Votre fonction, dans toute la session |
| Un alias nommé comme un programme (`git`) | Le programme | Votre alias : le programme est masqué |

Les alias par défaut (`ls`, `cp`, `cat`, `rm`...) sont listés dans [les alias familiers](/?c=langages&s=powershell&p=commandes-de-base#alias-familiers). Les redéfinir est tentant mais risqué : vos habitudes, les exemples trouvés en ligne et les scripts de vos collègues comptent sur leur sens d'origine. Autre piège : ces alias ne sont pas les mêmes partout. PowerShell sous Linux et macOS laisse, pour certains noms comme `ls`, la commande du système répondre ; la version historique livrée avec Windows définit même `curl` comme alias de `Invoke-WebRequest`. Dans le doute, `Get-Command` donne la réponse sur la machine où l'on se trouve.

### Contourner un alias ou une fonction

| Je veux | Écriture | Remarque |
|---|---|---|
| La cmdlet cachée derrière un alias | Son nom complet : `Get-ChildItem` | L'alias n'est consulté que pour son nom court |
| La cmdlet quand une fonction du même nom la masque | `Microsoft.PowerShell.Management\Get-ChildItem` | Le nom est précédé de celui de son module (le paquet qui contient la cmdlet) |
| Un programme masqué par un alias ou une fonction | `& (Get-Command git -CommandType Application)` | `&` (opérateur d'appel) exécute la commande désignée par ce qui suit |
| Supprimer le masque pour la session | `Remove-Item Alias:nom` ou `Remove-Item Function:nom` | Définitif jusqu'à la prochaine session |
| Voir si un problème vient de mes raccourcis | `pwsh -NoProfile` | `pwsh` démarre une nouvelle session PowerShell (Core), ici sans lire `$PROFILE` ; `powershell -NoProfile` pour la version livrée avec Windows |

### Ne pas mettre ses raccourcis dans un script partagé

Vos alias et vos fonctions existent **sur votre machine**, parce que votre profil les crée. Un script qui utilise `gs` ou `ll` échoue chez un collègue, sur un serveur, ou dans une tâche planifiée (une commande lancée automatiquement à heure fixe) qui ne charge pas de profil. Dans un script destiné à être partagé, on écrit les noms complets : `Get-ChildItem`, `git status`. Les raccourcis sont faits pour taper vite à la main, pas pour être lus par d'autres.

Il y a une seconde subtilité, côté définition. Un script lancé normalement s'exécute dans sa **propre portée** (la zone de la session où vivent les noms, voir [la portée des variables](/?c=langages&s=powershell&p=variables#portee-des-variables)), et ce qu'il y crée disparaît quand il se termine.

```powershell
# raccourcis.ps1 contient la ligne : Set-Alias -Name ll -Value Get-ChildItem
# lancement normal : le script a sa propre portée, qui est détruite à sa fin
.\raccourcis.ps1
# erreur : l'alias ll n'existe plus
ll
# dot sourcing : le point, une espace, puis le chemin ; le script s'exécute dans la portée
# courante (celle de la session), et ses alias et fonctions y restent
. .\raccourcis.ps1
# cette fois, ll existe
ll
```

### Organiser son `$PROFILE`

Un profil qui grossit devient illisible. On y laisse quelques lignes, qui chargent par dot sourcing un fichier dédié placé au même endroit.

```powershell
# --- contenu de $PROFILE (le fichier de profil) ---
# Split-Path -Parent : le dossier qui contient le profil
$dossierProfil = Split-Path -Path $PROFILE -Parent
# Join-Path assemble un dossier et un nom de fichier avec le bon séparateur
$raccourcis = Join-Path -Path $dossierProfil -ChildPath "raccourcis.ps1"
# on charge le fichier seulement s'il existe, pour ne pas faire d'erreur au démarrage
if (Test-Path -Path $raccourcis) { . $raccourcis }
```

```powershell
# --- contenu de raccourcis.ps1 (dans le même dossier que le profil) ---
Set-Alias -Name ll -Value Get-ChildItem        # niveau 1 : alias simple
Set-Alias -Name g -Value git                   # niveau 1 : alias vers un programme
function gs { git status @args }               # niveau 2 : argument fixe
function glg { git log --oneline --graph @args }
```

Le profil étant lui-même chargé par dot sourcing, les alias et fonctions de `raccourcis.ps1` restent disponibles dans toute la session. Pour appliquer une modification sans rouvrir le terminal : `. $PROFILE`.

| Fichier | Contenu | Pourquoi |
|---|---|---|
| `$PROFILE` | Les trois lignes de chargement, et les réglages de l'environnement (voir [les variables d'environnement](/?c=langages&s=powershell&p=variables-denvironnement)) | Il reste court et lisible |
| `raccourcis.ps1` | Tous les alias et fonctions personnels | Un seul endroit à relire, à sauvegarder, à copier sur une autre machine |
| Un script partagé | Aucun raccourci personnel | Il doit marcher sans votre profil |

Sous Windows, le profil et `raccourcis.ps1` sont des scripts : la **politique d'exécution** peut empêcher leur chargement au démarrage. Ce réglage de sécurité est décrit dans [le chapitre sur les scripts](/?c=langages&s=powershell&p=ecrire-et-executer-un-script#pas-de-shebang-mais-une-politique-d-execution).

## Synthèse des niveaux

| Niveau | Besoin | Outil | Limite |
|---|---|---|---|
| 1 | Un autre nom pour une commande | `Set-Alias -Name ll -Value Get-ChildItem` | Un nom seul : aucun argument fixe ; session courante seulement sans profil |
| 2 | Une commande avec des arguments fixes | `function gs { git status @args }` | Pas de paramètres nommés ni de valeurs par défaut ; pas de pipeline structuré |
| 3 | Paramètres nommés, valeurs par défaut, pipeline | Fonction avec `[CmdletBinding()]`, puis `Set-Alias` sur elle | Plus long à écrire ; le nom complet reste à retenir pour les scripts |
| 4 | Plusieurs raccourcis sans conflit, rechargés à chaque session | `Get-Command`, `$PROFILE`, dot sourcing | Un raccourci personnel n'existe pas sur les autres machines |

## Et dans Bash et Zsh ?

Les mêmes questions se posent dans [Bash](/?c=langages&s=bash&p=bash) et [Zsh](/?c=langages&s=zsh&p=zsh) (deux autres shells, courants sous Linux et macOS), avec une différence de fond : leur commande `alias` mémorise un **texte** qui remplace le mot tapé avant que la ligne soit analysée. Ce texte peut donc contenir des arguments, ce qui est impossible en PowerShell.

| | PowerShell | Bash | Zsh |
|---|---|---|---|
| Créer | `Set-Alias -Name ll -Value Get-ChildItem` | `alias ll='ls -la'` | `alias ll='ls -la'` |
| Contenu de l'alias | Un nom de commande seul | Un texte quelconque, arguments compris | Comme Bash |
| Alias avec argument fixe | Impossible : une fonction | `alias gs='git status'` fonctionne | Comme Bash |
| Lister | `Get-Alias` | `alias` | `alias` |
| Supprimer | `Remove-Item Alias:ll` | `unalias ll` | `unalias ll` |
| Qui répond au nom | `Get-Command nom` | `type -a nom` | `type -a nom` ou `whence -a nom` |
| Contourner | Nom complet, `&` | `\nom` ou `command nom` | Comme Bash |
| Rendre permanent | Fichier `$PROFILE` | `~/.bashrc` (voir [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement)) | `~/.zshrc` (voir [les fichiers de démarrage](/?c=langages&s=zsh&p=fichiers-de-demarrage)) |
| Dans un script | Absent, sauf définition dans le script ou dot sourcing | Non développé par défaut dans un script | Défini dans `~/.zshrc`, lu seulement par un shell interactif : un script ne le voit pas |
| Besoin de logique ou de paramètres | Fonction (niveaux 2 et 3) | Fonction (voir [les fonctions Bash](/?c=langages&s=bash&p=fonctions)) | Fonction |

Les alias avancés propres à Bash et à Zsh ne sont pas traités ici : ils relèvent des chapitres [Alias avancés en Bash](/?c=langages&s=bash&p=alias-avances) et [Alias avancés en Zsh](/?c=langages&s=zsh&p=alias-avances).

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| `Set-Alias -Name gs -Value "git status"` | L'alias ne désigne qu'un nom : l'erreur n'apparaît qu'à l'utilisation | Une fonction : `function gs { git status @args }` |
| Alias créé dans le terminal | Perdu à la fermeture de la session | L'ajouter au fichier `$PROFILE` |
| `New-Alias` dans un profil rechargé | Erreur à chaque rechargement, car le nom existe déjà | `Set-Alias` dans le profil |
| `New-Item -Force` sur un `$PROFILE` existant | Le fichier est remplacé par un fichier vide | Tester d'abord avec `Test-Path` |
| Fonction sans `@args` | Ce que l'on tape derrière le raccourci est ignoré | Terminer la ligne par `@args` |
| `[CmdletBinding()]` combiné à `$args` | Un argument non déclaré est refusé, `$args` n'est plus disponible | Déclarer chaque paramètre dans `param()` |
| Fonction nommée comme un alias existant (`gl`) | L'alias passe avant : la fonction ne s'exécute jamais | `Get-Command -Name nom` avant de choisir |
| Redéfinir `ls`, `cp`, `cat`, `rm`... | Les habitudes et les exemples en ligne perdent leur sens | Choisir un nouveau nom libre |
| Supposer les mêmes alias partout | Selon le système et la version, un nom désigne une autre commande, ou aucune | Vérifier avec `Get-Command` sur la machine concernée |
| Raccourcis dans un script partagé | Ils n'existent pas chez les autres, ni dans une tâche planifiée | Écrire les noms complets dans les scripts |
| Alias défini dans un script lancé normalement | Il disparaît à la fin du script | Dot sourcing (`. .\fichier.ps1`) |
| `$PSDefaultParameterValues` oublié | Il change le comportement de toutes les cmdlets concernées, scripts compris | Le réserver à un réglage assumé, le noter dans `raccourcis.ps1` |
| Profil bloqué par la politique d'exécution | Le fichier est ignoré au démarrage, les raccourcis manquent | Régler la politique comme dans le chapitre sur les scripts |
| Profil trop lourd | Chaque ouverture de terminal ralentit | N'y mettre que l'utile |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Un alias pour un simple renommage, une fonction dès qu'un argument est fixe | Chaque outil reste dans son domaine |
| Terminer les fonctions-raccourcis par `@args` | Ce qu'on tape derrière le raccourci arrive jusqu'à la commande |
| Pour un raccourci riche : une fonction `Verbe-Nom` avec `[CmdletBinding()]`, puis un alias court | Un nom complet pour les scripts, un nom court pour la main |
| Vérifier le nom avec `Get-Command` avant de le créer | Aucun masque involontaire |
| `Set-Alias` dans le profil, `New-Alias` pour un nom que l'on croit libre | Rechargement sans erreur ; avertissement si le nom est pris |
| Ranger tous les raccourcis dans `raccourcis.ps1`, chargé par dot sourcing depuis `$PROFILE` | Un profil court, des raccourcis faciles à sauvegarder |
| Écrire les noms complets dans tout script partagé | Le script marche sur toutes les machines |
| Tester avec `pwsh -NoProfile` quand un comportement paraît étrange | Écarter les raccourcis comme cause |
| Garder son profil léger | Un terminal qui s'ouvre vite |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un **alias** est un second nom pour **une** commande : `Set-Alias -Name ll -Value Get-ChildItem` (écrase un alias existant) ou `New-Alias` (refuse, sauf `-Force`) ; `Get-Alias` liste et retrouve (`-Definition` pour partir d'une cmdlet) ; `Remove-Item Alias:ll` supprime. Il vit dans la session et se rend permanent par `$PROFILE`. La limite centrale : `-Value` est un **nom de commande**, jamais une commande suivie d'arguments ; `Set-Alias -Name gs -Value "git status"` cherche une commande nommée « git status » et échoue à l'utilisation. Avec des arguments fixes, on écrit une **fonction** (`function gs { git status @args }`, `@args` transmettant ce qui est tapé derrière). Pour un raccourci complexe : fonction avec `[CmdletBinding()]`, paramètres nommés et typés avec valeurs par défaut, `[Parameter(ValueFromPipeline)]` et bloc `process`, puis `Set-Alias` sur son nom. Un alias passe avant une fonction, qui passe avant une cmdlet : `Get-Command nom -All` montre qui répond. Le profil charge par dot sourcing un fichier `raccourcis.ps1`. Bash et Zsh gardent un texte entier dans `alias`, arguments compris. |
| **Pièges à éviter** | Mettre un argument dans `-Value` ; croire qu'un alias survit à la session ; `New-Alias` dans un profil rechargé ; `New-Item -Force` sur un profil existant ; fonction sans `@args` ; `[CmdletBinding()]` avec `$args` ; fonction masquée par un alias du même nom ; redéfinir `ls`, `cp`, `cat` ; raccourcis personnels dans un script partagé ; alias défini dans un script sans dot sourcing ; profil bloqué par la politique d'exécution. |
| **Bonnes pratiques** | Alias pour renommer, fonction pour figer des arguments, fonction avancée plus alias pour un vrai outil ; `Get-Command` avant de nommer ; `Set-Alias` dans le profil ; tous les raccourcis dans `raccourcis.ps1` ; noms complets dans les scripts partagés ; `pwsh -NoProfile` pour écarter ses raccourcis lors d'un diagnostic. |
