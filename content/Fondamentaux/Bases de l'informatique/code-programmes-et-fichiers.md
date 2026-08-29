---
order: 1
---

# Qu'est-ce qu'un ordinateur exécute ?

Avant de parler de terminal, d'éditeur de code ou d'un langage précis, une seule question compte : que fait réellement un ordinateur quand on dit qu'il "exécute" quelque chose ? Ce chapitre pose ce socle : tout le reste du site s'appuiera sur lui.

## Un ordinateur suit des instructions, sans les comprendre

Un ordinateur ne "réfléchit" pas et ne devine jamais une intention. Il fait une seule chose, très vite et sans se poser de question : lire une liste d'instructions, dans l'ordre, et les exécuter une par une, exactement comme elles sont écrites.

```text
Instruction 1  →  exécutée telle quelle
Instruction 2  →  exécutée telle quelle
Instruction 3  →  exécutée telle quelle
```

> **Analogie :** c'est comme suivre une recette de cuisine à la lettre, sans jamais improviser. Si la recette dit "casser 2 œufs", on en casse 2 (ni plus, ni moins) et on ne se demande pas pourquoi.

**Pourquoi c'est important :** à peu près tout ce qui peut sembler "intelligent" chez un ordinateur (corriger une faute de frappe, deviner ce qu'on voulait faire) vient en réalité d'instructions écrites à l'avance par un humain pour ce cas précis, jamais d'une compréhension du problème par la machine elle-même.

> **Piège :** croire qu'une instruction imprécise sera "comprise raisonnablement". L'ordinateur choisit toujours une interprétation précise (souvent la plus littérale possible), pas forcément celle imaginée en l'écrivant ; voir le chapitre sur [le bug](/?c=bases-de-l-informatique&p=le-bug) pour ce que ça produit concrètement.
>
> **Bonne pratique :** écrire des instructions aussi précises que possible, sans rien laisser à "deviner" par la machine.

## Le code : la liste d'instructions écrite par un humain

Le **code** (ou **code source**) est le texte qui contient ces instructions. Il est écrit par une personne, dans un **langage de programmation**, une des nombreuses "langues" qu'un ordinateur peut suivre, chacune avec sa propre grammaire ([Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), [le C](/?c=langages-de-programmation&s=c&p=c)...).

```text
afficher "Bonjour"      → écrit "Bonjour" à l'écran
afficher "Au revoir"    → écrit "Au revoir" à l'écran juste après
```

> **Note :** le bloc ci-dessus n'est pas un vrai langage : c'est du **pseudocode**, une façon simplifiée d'écrire des instructions sans la syntaxe précise d'un langage réel. Il sert uniquement à illustrer l'idée d'une suite d'instructions, avant d'en choisir un pour de vrai.

Devpédia détaille plusieurs langages en profondeur, chacun dans son propre chapitre (par exemple [Python](/?c=langages-de-programmation&s=python&p=python) ou [le C](/?c=langages-de-programmation&s=c&p=c)). Ce chapitre n'entre dans aucun d'eux : juste le principe commun à tous.

> **Piège :** essayer d'exécuter tel quel le pseudocode ci-dessus dans un vrai langage : ça ne fonctionnera pas, ce n'est qu'une illustration simplifiée, pas une syntaxe réelle.
>
> **Bonne pratique :** toujours vérifier la syntaxe exacte attendue par le [langage choisi](/?c=langages) avant d'écrire du code destiné à être réellement exécuté.

## Le fichier : où le code est rangé

Un **fichier** est une unité de données stockée sur le disque de l'ordinateur, identifiée par un **nom** et une **extension**, la partie après le point, qui indique son type de contenu.

| Extension | Type de contenu | Exemple de nom |
|---|---|---|
| `.txt` | Texte brut, sans mise en forme | `notes.txt` |
| `.py` | Code source en langage [Python](/?c=langages-de-programmation&s=python&p=python) | `programme.py` |
| `.js` | Code source en langage [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) | `script.js` |
| `.md` | Texte au format Markdown (celui de cette page) | `README.md` |

> **Analogie :** un fichier, c'est comme une feuille de papier rangée dans un classeur (le **dossier**), avec un nom écrit sur l'onglet pour la retrouver.

Le code source est presque toujours écrit dans un fichier texte ; comprendre ce qu'est un "fichier" est nécessaire avant de pouvoir naviguer dans une arborescence de dossiers ou ouvrir quoi que ce soit dans un éditeur (deux chapitres à venir).

> **Piège :** croire que renommer un fichier change ce qu'il contient : renommer `notes.txt` en `notes.py` ne transforme pas du texte quelconque en code [Python](/?c=langages-de-programmation&s=python&p=python) valide. L'extension n'est qu'une **indication** pour les humains et les outils (quel éditeur ouvrir, quelle coloration appliquer) ; ce qui décide vraiment de la nature d'un fichier, c'est ce qui l'ouvre et l'interprète, jamais son nom.
>
> **Bonne pratique :** choisir l'extension qui correspond au contenu réel du fichier, pas l'inverse.

## Le programme : ce que l'ordinateur exécute pour de vrai

Le code écrit par un humain n'est pas toujours ce que le [processeur](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu) exécute directement. Deux approches existent :

| | Interprété | Compilé |
|---|---|---|
| Ce qui se passe | Un autre programme, l'**interpréteur**, lit le code et l'exécute directement, ligne par ligne | Un programme, le **compilateur**, transforme d'abord tout le code en une forme que le processeur comprend nativement |
| Quand l'exécution démarre | Immédiatement | Seulement une fois la transformation (la **compilation**) terminée |
| Exemple de langage | [Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) | [C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp) |

> **Approfondir :** ce chapitre s'arrête à cette distinction de principe ; le détail de ce qui se passe pendant une compilation (étapes, erreurs possibles) est couvert dans [Le processus de compilation](/?c=langages-de-programmation&s=c&p=compilation).

> **Piège :** croire qu'un programme compilé fonctionne partout tel quel. Un exécutable compilé pour Windows ne s'exécute pas sur Linux ou macOS : la compilation produit du code spécifique au système visé, il faut recompiler pour chaque système cible.
>
> **Bonne pratique :** pour un programme interprété, vérifier que l'interpréteur du bon langage est installé sur la machine cible ; pour un programme compilé, le recompiler pour chaque système visé plutôt que de supposer qu'un seul exécutable suffira partout.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un ordinateur exécute des instructions à la lettre, sans en comprendre le sens. Le **code** est cette liste d'instructions, écrite dans un **langage de programmation**, rangée dans un **fichier**. Un programme est **interprété** (exécuté directement) ou **compilé** (transformé avant d'être exécuté). |
| **Outils utilisables** | [Le terminal](/?c=bases-de-l-informatique&p=le-terminal) et [l'éditeur de code](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide), pour écrire et lancer du code soi-même. |
| **Pièges à éviter** | Croire que l'ordinateur "comprend" ce qu'on veut faire, ou qu'il peut deviner une intention non écrite explicitement dans le code. Confondre un fichier quelconque avec un programme : un fichier `.txt` n'est jamais exécuté, un fichier `.py` l'est seulement via un interpréteur [Python](/?c=langages-de-programmation&s=python&p=python). |
| **Bonnes pratiques** | Toujours distinguer, face à un problème, "qu'est-ce que le code dit de faire" de "qu'est-ce que je voulais qu'il fasse" : la plupart des erreurs de débutant viennent d'une instruction exécutée à la lettre, mais mal formulée. |
