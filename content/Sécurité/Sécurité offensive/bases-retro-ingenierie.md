---
order: 3
---

# Les bases de la rétro-ingénierie

La **rétro-ingénierie** (*reverse engineering*) consiste à comprendre le fonctionnement d'un programme sans disposer de son code source, à partir du seul binaire compilé. C'est une étape presque systématique en sécurité offensive : un attaquant ne reçoit jamais le code source de sa cible, seulement le programme qu'elle fait tourner.

## Deux outils complémentaires : désassembleur et débogueur

| Outil | Ce qu'il fait | Exemple |
|---|---|---|
| **Désassembleur** | Traduit le binaire (suite d'octets) en instructions assembleur lisibles, sans jamais exécuter le programme | Ghidra, `objdump` |
| **Débogueur** | Exécute réellement le programme, en permettant de le suspendre à tout moment pour inspecter registres, pile et mémoire (voir [Comment un programme s'exécute réellement](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)) | `gdb` |

```text
Desassembleur :  Binaire --> lecture seule --> "voici les instructions qu'il contient"

Debogueur :      Binaire --> execution --> pause a un point choisi --> "voici l'etat REEL
                                                                         de la memoire a cet instant"
```

Les deux se complètent : le désassembleur donne une vue d'ensemble rapide sans rien exécuter (utile face à un binaire potentiellement dangereux), le débogueur confirme ce qui se passe réellement à l'exécution, y compris des comportements qu'une simple lecture du désassemblage ne révèle pas (ex : une valeur calculée dynamiquement).

## Lire un minimum d'assembleur x86

L'**assembleur** est la représentation lisible par un humain des instructions qu'un processeur exécute directement. Quelques instructions x86 suffisent à suivre la logique générale d'un programme :

| Instruction | Effet |
|---|---|
| `mov dest, src` | Copie `src` dans `dest` (ex : `mov rax, rbx` copie `rbx` dans `rax`) |
| `push`/`pop` | Empile/dépile une valeur sur la pile |
| `call`/`ret` | Appelle une fonction (empile l'adresse de retour) / retourne à l'appelant (dépile cette adresse) |
| `cmp` | Compare deux valeurs (résultat utilisé par l'instruction suivante) |
| `jmp`/`je`/`jne` | Saute à une autre instruction, inconditionnellement (`jmp`) ou selon le résultat du `cmp` précédent (`je` : si égal, `jne` : si différent) |

```text
Pseudocode :        Assembleur equivalent (simplifie) :

if (a == b) {         cmp  rax, rbx      ; compare a (dans rax) et b (dans rbx)
    faireX();          jne  sinon         ; si different, saute vers "sinon"
} else {               call faireX
    faireY();           jmp  fin
}                      sinon:
                        call faireY
                       fin:
```

## Boîte noire ou boîte blanche

| Approche | Ce dont on dispose |
|---|---|
| **Boîte blanche** (*white-box*) | Le code source est disponible : on lit directement la logique métier |
| **Boîte noire** (*black-box*) | Seul le binaire (ou le service exposé) est accessible : il faut déduire le comportement en l'observant, via désassembleur/débogueur ou par ses entrées/sorties |

> **Bonne pratique :** commencer toujours par le désassembleur pour une vue d'ensemble rapide et sans risque, avant de passer au débogueur pour confirmer un détail précis en exécution réelle : inspecter tout un programme pas à pas dans un débogueur, sans plan, prend un temps disproportionné.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La rétro-ingénierie comprend un programme sans son code source. Le désassembleur traduit le binaire en assembleur lisible sans l'exécuter ; le débogueur l'exécute et permet d'en inspecter l'état réel à tout moment. Quelques instructions x86 (`mov`, `push`/`pop`, `call`/`ret`, `cmp`, `jmp`/`je`/`jne`) suffisent à suivre la logique générale d'un programme. |
| **Outils utilisables** | Ghidra ou `objdump` pour désassembler ; `gdb` pour déboguer. |
| **Pièges à éviter** | Se lancer directement dans un débogueur sans vue d'ensemble préalable du désassemblage. |
| **Bonnes pratiques** | Désassembler d'abord pour repérer les zones intéressantes, déboguer ensuite pour confirmer un comportement précis. |
