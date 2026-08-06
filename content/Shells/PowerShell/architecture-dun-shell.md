---
order: 13
---

# Comment fonctionne PowerShell (architecture interne)

PowerShell repose sur la même mécanique de fond que Bash — une boucle qui lit, interprète et exécute — mais il ne tourne pas directement sur le système d'exploitation comme un simple exécutable natif : c'est un environnement construit sur le **.NET Runtime**, ce qui explique à la fois ses objets typés (cf. chapitres sur les variables et les redirections) et certaines de ses différences de performance avec Bash.

> **Prérequis :** ce chapitre suppose connu ce qu'est un processus (`fork`/`exec`) — voir le chapitre sur l'architecture d'un shell (rubrique Bash), qui détaille ce mécanisme côté Unix ; les concepts se retrouvent ici, mais implémentés différemment sous Windows.

## La boucle principale (REPL)

Comme pour Bash, une session interactive PowerShell est fondamentalement une boucle infinie :

```
tant que vrai :
    afficher le prompt
    lire une ligne de commande
    découper la ligne en jetons (tokenisation)
    résoudre chaque commande (cmdlet, fonction, alias, exécutable externe)
    exécuter le pipeline résultant
    afficher les objets non capturés produits par le pipeline
```

## Cmdlet vs fonction vs exécutable externe

Contrairement à Bash, qui distingue seulement *builtin* (exécuté par le shell lui-même) et *externe* (nouveau processus), PowerShell distingue trois types de commandes :

### Les cmdlets

`Get-ChildItem`, `Set-Location`, `Write-Output`... sont des classes **.NET compilées**, packagées dans des modules — exécutées directement dans le processus PowerShell (comme un *builtin* Bash), mais implémentées en C#, pas interprétées ligne par ligne.

### Les fonctions

Écrites directement en langage PowerShell (`function Saluer { ... }`, cf. chapitre dédié) — interprétées à l'exécution, comme une fonction Bash, mais bénéficiant du même typage et du même système de paramètres qu'une cmdlet.

### Les commandes externes

Pour un exécutable comme `notepad.exe`, PowerShell délègue au système d'exploitation Windows la création d'un nouveau processus (rôle équivalent à `fork`/`execve` en C, mais via l'API Windows `CreateProcess`) :

```
CreateProcess("notepad.exe", arguments, ...)
// le nouveau processus démarre en parallèle
// PowerShell attend sa fin (ou continue, si lancé en arrière-plan) selon le contexte
```

## Le pipeline d'objets : ce que `|` fait réellement circuler

C'est la différence la plus fondamentale avec Bash. Un pipe Bash (`cmd1 | cmd2`) connecte deux **descripteurs de fichiers** au niveau du système d'exploitation (cf. chapitre sur l'architecture d'un shell Bash, avec `pipe()`/`dup2()`) — le flux qui y circule est une suite d'octets, sans aucune structure.

Un pipeline PowerShell (`Cmd1 | Cmd2`), lui, transmet directement des **objets .NET en mémoire**, un par un, sans jamais les sérialiser en texte entre les deux commandes — c'est ce qui permet à `Get-ChildItem | Where-Object { $_.Length -gt 1000 }` de filtrer sur une vraie propriété numérique, plutôt que de chercher un motif dans du texte formaté comme le ferait un `ls -l | grep`.

> **Note :** cette différence a un coût : un pipeline PowerShell garde tous les objets en mémoire tant qu'ils n'ont pas été consommés par l'étape suivante, alors qu'un pipe Bash ne fait circuler que des octets au fil de l'eau — sur un très grand volume de données, un script Bash bien conçu peut donc rester plus économe en mémoire qu'un pipeline PowerShell équivalent.

## Comment PowerShell trouve quelle commande lancer

Si la commande tapée contient un chemin explicite (`.\script.ps1`, `C:\outils\notepad.exe`), PowerShell l'utilise directement. Sinon, il cherche dans cet ordre : alias, fonction, cmdlet, puis exécutable externe dans les dossiers de `$env:PATH` — contrairement à Bash, qui ne connaît que builtins et `$PATH`, PowerShell doit départager quatre types de commandes potentiellement homonymes avant de choisir laquelle exécuter.

## Implémenter un pipeline (équivalent conceptuel de `pipe()`)

Le moteur PowerShell (le *pipeline processor*) instancie chaque cmdlet du pipeline, puis appelle leurs méthodes `.NET` `BeginProcessing()`/`ProcessRecord()`/`EndProcessing()` en enchaînant la sortie de l'une comme entrée de la suivante — objet par objet, au fur et à mesure qu'ils sont produits, plutôt que d'attendre que la première cmdlet ait fini de tout produire :

```
Cmd1.ProcessRecord() -> produit un objet -> immédiatement transmis à Cmd2.ProcessRecord()
```

C'est ce mécanisme (le *streaming* objet par objet) qui joue, à l'intérieur du runtime .NET, un rôle équivalent à celui de `pipe()`/`dup2()` au niveau du système d'exploitation pour un pipe Bash — sans jamais passer par un descripteur de fichier ni par le système d'exploitation lui-même, puisque tout se déroule dans le même processus.

## Le contrôle de tâches : jobs plutôt que groupes de processus

Contrairement à Bash, où `&`, `Ctrl+Z`, `fg`/`bg` manipulent des groupes de processus au niveau du système d'exploitation (cf. chapitre équivalent en Bash), PowerShell gère l'arrière-plan via des objets `Job` (cf. chapitre sur la gestion des processus) — une abstraction du runtime .NET, pas un mécanisme du noyau Windows partagé avec les autres programmes du système.
