---
order: 12
---

# Les Makefiles

Un **Makefile** automatise la compilation d'un projet C à plusieurs fichiers : plutôt que de retaper manuellement chaque commande [`gcc`](https://gcc.gnu.org) (voir [Le processus de compilation](/?c=langages-de-programmation&s=c&p=compilation)), on décrit une fois les règles de construction, et l'outil `make` les exécute, en ne recompilant que ce qui a réellement changé depuis la dernière fois.

## Anatomie d'une règle

```makefile
cible: dependances
	commande
```

```makefile
programme: main.o calculs.o
	gcc main.o calculs.o -o programme
```

"Pour construire `programme`, j'ai besoin de `main.o` et `calculs.o` ; si l'un des deux est plus récent que `programme` (ou si `programme` n'existe pas encore), exécute la commande." La ligne de commande **doit** être indentée avec une tabulation, jamais des espaces : une des erreurs les plus fréquentes avec les Makefiles.

## Enchaîner les règles

```makefile
programme: main.o calculs.o
	gcc main.o calculs.o -o programme

main.o: main.c calculs.h
	gcc -c main.c -o main.o

calculs.o: calculs.c calculs.h
	gcc -c calculs.c -o calculs.o
```

En tapant simplement `make`, l'outil construit la **première règle du fichier** (`programme`), et remonte récursivement ses dépendances : pour obtenir `main.o`, il regarde la règle `main.o: ...`, etc. Si `calculs.c` n'a pas changé depuis la dernière compilation, `make` ne recompile pas `calculs.o` : seule la partie modifiée du projet est reconstruite.

## Variables

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

programme: main.o calculs.o
	$(CC) main.o calculs.o -o programme

main.o: main.c calculs.h
	$(CC) $(CFLAGS) -c main.c -o main.o
```

`$(CC)` et `$(CFLAGS)` sont des variables Makefile : changer le compilateur ou les options d'avertissement ne demande alors qu'une seule modification, en haut du fichier.

| Option `gcc` courante | Rôle |
|---|---|
| `-Wall -Wextra` | Active la majorité des avertissements utiles du compilateur |
| `-g` | Ajoute les informations de débogage (nécessaires pour `gdb`/Valgrind) |
| `-o nom` | Nomme le fichier de sortie |
| `-O2` | Active [l'optimisation](/?c=langages-de-programmation&s=c&p=compilation) recommandée en production |

> **Piège :** `-O2`/`-O3` dans `CFLAGS` peut faire apparaître un avertissement absent à `-O0` (voir [Les niveaux d'optimisation](/?c=langages-de-programmation&s=c&p=compilation)) : tester `make` avec les `CFLAGS` réellement utilisées en production, pas seulement en configuration de débogage (`-O0 -g`).

## Cibles factices (`.PHONY`)

Une cible comme `clean` ne correspond à aucun vrai fichier à produire : elle sert juste à exécuter une commande utilitaire (ici, supprimer les fichiers compilés) :

```makefile
.PHONY: clean

clean:
	rm -f *.o programme
```

`.PHONY` indique à `make` que `clean` n'est pas un nom de fichier : sans cette ligne, si un fichier nommé `clean` existait par coïncidence dans le dossier, `make clean` pourrait le considérer "à jour" et ne rien exécuter.

> **Note :** appeler une cible en argument (`make clean`, `make programme`) construit **cette** cible précise plutôt que la première du fichier.

## Écrire la recette sur la même ligne : `;`

Une recette suit toujours la ligne `cible: dépendances`, indentée d'une tabulation, comme vu plus haut. Un `;` après la liste de dépendances permet d'écrire une recette courte directement sur cette même ligne, sans passer à la ligne suivante :

```makefile
clean: ; rm -f *.o
```

Strictement équivalent à :

```makefile
clean:
	rm -f *.o
```

> **Piège :** confondre ce `;` de Makefile avec un `;` shell classique (qui enchaîne deux commandes). Ici, il sépare uniquement la liste de dépendances de la recette elle-même : rien à voir avec un enchaînement de commandes.

## Inclure les en-têtes d'une bibliothèque : `-I`

```makefile
programme: main.o
	$(CC) main.o -I includes -I libft/includes -o programme
```

`-I` ajoute un dossier à la liste de ceux où le compilateur cherche un fichier `#include "..."` ou `#include <...>` (voir [Les headers](/?c=langages&s=c&p=headers)) : indispensable dès qu'un projet répartit ses `.h` ailleurs que dans le dossier courant, ou dépend d'une bibliothèque tierce.

> **Piège :** pointer `-I` sur le mauvais niveau de dossier (ex. `-I includes` alors que les fichiers sont dans `includes/sous_dossier`). Le compilateur échoue alors avec un message `fichier introuvable`, même si le fichier existe bel et bien quelque part dans le projet.

## Retrouver les flags de compilation d'une bibliothèque : `pkg-config`

Lier une bibliothèque externe (ex. [GLFW](https://www.glfw.org) pour ouvrir une fenêtre OpenGL) demande souvent plusieurs `-I` et `-l` (nom de la bibliothèque à l'édition de liens) différents selon la machine et sa distribution. `pkg-config` évite de les deviner à la main : chaque bibliothèque installe un petit fichier `.pc` qui décrit ses propres flags, et `pkg-config` les lit à la demande.

```bash
pkg-config --cflags glfw3        # -I/usr/include            (flags de compilation)
pkg-config --cflags --libs glfw3 # ajoute -lglfw -lm ...      (+ flags d'édition de liens)
```

Dans un Makefile, `$(shell ...)` exécute une commande shell et remplace l'appel par sa sortie, ce qui permet d'y injecter directement le résultat de `pkg-config` :

```makefile
GLFW_FLAGS = $(shell pkg-config --cflags --libs glfw3)

programme: main.o
	$(CC) main.o $(GLFW_FLAGS) -o programme
```

> **Piège :** le nom passé à `pkg-config` (ici `glfw3`) n'est pas toujours identique au nom du paquet système qui l'installe (ex. `libglfw3-dev` sur Debian/Ubuntu). `pkg-config --list-all` liste tous les modules `.pc` réellement disponibles sur la machine quand ce nom exact n'est pas connu à l'avance.

## Mode silencieux : `@` et `MAKEFLAGS`

Par défaut, `make` affiche chaque commande avant de l'exécuter. Un `@` en préfixe de ligne supprime cet affichage, pour **cette seule ligne** :

```makefile
compile:
	@echo "Compilation..."
	@gcc main.c -o programme
```

Sans `@`, `make` afficherait d'abord la ligne `gcc main.c -o programme` telle quelle, en plus du message `Compilation...` produit par son exécution.

Pour appliquer ce comportement à **tout** le fichier sans préfixer chaque ligne individuellement, `MAKEFLAGS += -s` en tout début de fichier a le même effet, mais globalement :

```makefile
MAKEFLAGS += -s

compile:
	echo "Compilation..."   # deja silencieux grace a MAKEFLAGS ; le @ devient inutile ici
	gcc main.c -o programme
```

> **Note :** les deux mécanismes se recoupent, sans s'exclure. `MAKEFLAGS += -s` évite d'oublier un `@` sur une nouvelle ligne ajoutée plus tard ; `@` ligne par ligne permet à l'inverse de garder certaines lignes volontairement visibles (un message d'erreur qu'on veut voir apparaître même en mode silencieux, par exemple). Combiner les deux, comme le fait un projet prudent, est redondant mais sans danger.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un Makefile décrit des règles (`cible: dépendances` + commande) que `make` exécute, en ne reconstruisant que ce qui a réellement changé. Une recette courte peut aussi tenir sur la ligne de la cible, après un `;`. |
| **Outils utilisables** | Variables (`CC`, `CFLAGS`), cibles factices (`.PHONY`), `-I` pour les en-têtes, `pkg-config` pour les flags d'une bibliothèque, `@`/`MAKEFLAGS += -s` pour le mode silencieux. |
| **Pièges à éviter** | Indenter une commande avec des espaces plutôt qu'une tabulation ; pointer `-I` sur le mauvais niveau de dossier ; confondre le nom `pkg-config` d'une bibliothèque avec le nom de son paquet système. |
| **Bonnes pratiques** | Déclarer `.PHONY` pour toute cible qui ne produit pas un vrai fichier (`clean`, `test`...), pour éviter un conflit avec un fichier de même nom ; passer par `pkg-config` plutôt que deviner des `-I`/`-l` à la main pour une bibliothèque tierce. |
