---
order: 8
---

# L'architecture ARM

Les chapitres précédents de cette catégorie s'appuient sur x86-64, l'architecture la plus courante sur PC. **ARM** est une architecture différente, aujourd'hui omniprésente ailleurs : la quasi-totalité des smartphones, les puces Apple Silicon (M1 et suivantes) sur Mac, une large part des objets connectés. Comprendre ses différences est nécessaire dès qu'une cible n'est plus un PC classique.

## RISC contre CISC

| | x86 (CISC) | ARM (RISC) |
|---|---|---|
| Philosophie | *Complex Instruction Set Computer* : des instructions riches, qui font parfois plusieurs opérations à la fois | *Reduced Instruction Set Computer* : des instructions volontairement simples et uniformes |
| Conséquence | Un programme peut tenir en moins d'instructions, chacune plus complexe à décoder pour le processeur | Un programme nécessite plus d'instructions, mais chacune s'exécute plus rapidement et prévisiblement |

Cette différence de philosophie explique en grande partie pourquoi ARM domine sur batterie (mobile, embarqué) : des instructions plus simples consomment moins d'énergie par instruction exécutée.

## Des registres renommés, mêmes rôles

Les registres vus dans [Comment un programme s'exécute réellement](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) existent aussi sur ARM, sous d'autres noms :

| Rôle | x86-64 | ARM (64 bits) |
|---|---|---|
| Prochaine instruction | `rip` | `pc` |
| Sommet de la pile | `rsp` | `sp` |
| Adresse de retour | Sauvegardée sur la pile par `call` | Sauvegardée directement dans un registre dédié, `lr` (*link register*), avant d'être copiée sur la pile si besoin |
| Registres généraux | `rax`, `rbx`, `rcx`... | `x0` à `x30` |

La différence la plus notable pour l'exploitation : sur x86, l'adresse de retour part directement sur la pile au moment de l'appel (`call`), donc directement exposée à un [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) voisin. Sur ARM, elle transite d'abord par `lr`, un registre séparé de la pile : un dépassement de tampon simple ne l'atteint donc pas automatiquement, ce qui change la façon de construire une exploitation, sans rendre le principe de fond différent.

## Pourquoi ça compte de plus en plus

Un binaire compilé pour x86 ne s'exécute pas tel quel sur ARM (et inversement) : chaque architecture a son propre jeu d'instructions, donc son propre assembleur à lire lors d'une [rétro-ingénierie](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie). Avec la place croissante d'ARM (mobile, Apple Silicon, cloud à bas coût), une cible réelle a aujourd'hui une chance significative de ne pas être x86 du tout.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | ARM (RISC, instructions simples et uniformes) diffère de x86 (CISC, instructions riches) et domine sur batterie. Les registres changent de nom (`pc`/`sp`/`lr`/`x0`-`x30` contre `rip`/`rsp`/`rax`...) et l'adresse de retour transite par un registre dédié (`lr`) plutôt que d'aller directement sur la pile. |
| **Outils utilisables** | Ghidra et `gdb` (chapitre rétro-ingénierie) supportent tous deux ARM, avec le même flux de travail que sur x86. |
| **Pièges à éviter** | Supposer qu'une technique d'exploitation x86 fonctionne telle quelle sur ARM sans tenir compte de `lr`. |
| **Bonnes pratiques** | Identifier l'architecture cible avant toute analyse (`file` sur un binaire Linux l'indique directement), pour choisir d'emblée la bonne référence d'assembleur. |
