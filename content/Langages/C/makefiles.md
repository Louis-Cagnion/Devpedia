---
order: 12
---

# Les Makefiles

Un **Makefile** automatise la compilation d'un projet C à plusieurs fichiers : plutôt que de retaper manuellement chaque commande [`gcc`](https://gcc.gnu.org) (voir [Le processus de compilation](/?c=langages-de-programmation&s=c&p=compilation)), on décrit une fois les règles de construction, et l'outil [`make`](https://www.gnu.org/software/make/manual/make.html) les exécute, en ne recompilant que ce qui a réellement changé depuis la dernière fois.

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
| `-g` | Ajoute les informations de débogage (nécessaires pour [`gdb`](https://sourceware.org/gdb/) et [Valgrind](/?c=langages&s=c&p=memoire#les-quatre-bugs-memoire-classiques)) |
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
main.o: main.c
	$(CC) $(CFLAGS) -I includes -I libft/includes -c main.c -o main.o
```

`-I` ajoute un dossier à la liste de ceux où le compilateur cherche un fichier `#include "..."` ou `#include <...>` (voir [Les headers](/?c=langages&s=c&p=headers)). Elle sert donc à la compilation d'un `.c` (`-c`), jamais à l'édition de liens, qui ne lit plus aucun en-tête : indispensable dès qu'un projet répartit ses `.h` ailleurs que dans le dossier courant, ou dépend d'une bibliothèque tierce.

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
	echo "Compilation..."   # déjà silencieux grâce à MAKEFLAGS ; le @ devient inutile ici
	gcc main.c -o programme
```

> **Note :** les deux mécanismes se recoupent, sans s'exclure. `MAKEFLAGS += -s` évite d'oublier un `@` sur une nouvelle ligne ajoutée plus tard ; `@` ligne par ligne permet à l'inverse de garder certaines lignes volontairement visibles (un message d'erreur qu'on veut voir apparaître même en mode silencieux, par exemple). Combiner les deux, comme le fait un projet prudent, est redondant mais sans danger.

## Une règle pour tous les fichiers : `%`, `$@`, `$<`, `$^`

Écrire une règle par fichier `.c` (comme dans [Enchaîner les règles](#enchainer-les-regles)) devient vite long. Une **règle générique** (*pattern rule*) les remplace toutes : le `%` y représente « n'importe quel nom », le même des deux côtés de la règle.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# la liste des sources, écrite une seule fois
SRCS = main.c calculs.c
# la même liste, chaque .c remplacé par .o : main.o calculs.o
OBJS = $(SRCS:%.c=%.o)

# $@ vaut programme, $^ vaut main.o calculs.o
programme: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

# vaut pour chaque .o : main.o depuis main.c, calculs.o depuis calculs.c
%.o: %.c calculs.h
	$(CC) $(CFLAGS) -c $< -o $@
```

`$@`, `$<` et `$^` sont des **variables automatiques** : `make` les remplit lui-même, règle par règle, au moment d'exécuter la commande.

| Variable | Contient | Pour `main.o` dans la règle `%.o: %.c calculs.h` |
|---|---|---|
| `$@` | La cible en cours de construction | `main.o` |
| `$<` | La **première** dépendance | `main.c` |
| `$^` | **Toutes** les dépendances, sans doublon | `main.c calculs.h` |

`$(SRCS:%.c=%.o)` est une **référence de substitution** : elle recopie la liste `SRCS` en remplaçant, dans chaque mot, le motif de gauche du `=` par celui de droite.

```text
$ make
gcc -Wall -Wextra -O2 -c main.c -o main.o
gcc -Wall -Wextra -O2 -c calculs.c -o calculs.o
gcc -Wall -Wextra -O2 -o programme main.o calculs.o
```

> **Piège :** `$^` à la place de `$<` dans la règle `%.o` passe aussi `calculs.h` à `gcc` (`gcc -c main.c calculs.h -o main.o`), qui refuse : `cannot specify '-o' with '-c', '-S' or '-E' with multiple files`. Pour compiler un `.c`, toujours `$<`.

## Changer d'options ne recompile rien

Une variable du Makefile peut être remplacée au lancement, pour cette seule exécution : `make CFLAGS="-O0 -g"` construit avec ces options-là, sans modifier le fichier. Mais `make` décide de reconstruire en comparant uniquement des **dates de modification** : les options de compilation n'entrent pas dans sa décision.

```bash
make                    # compile main.o, calculs.o et programme avec -O2
make CFLAGS="-O0 -g"    # make: 'programme' is up to date.  (rien n'est recompilé)
```

| Situation | Résultat |
|---|---|
| `make CFLAGS="-O0 -g"` juste après `make` | Rien ne change : le programme reste en `-O2`, sans informations de débogage |
| Un seul `.c` modifié entre les deux lancements | Programme **mélangé** : ce fichier compilé avec les nouvelles options, les autres avec les anciennes |

| Parade | Principe | Coût |
|---|---|---|
| `make clean` avant chaque changement d'options | Plus aucun `.o` : tout est recompilé | Recompilation complète à chaque changement ; un oubli passe inaperçu |
| Un dossier d'objets par jeu d'options | Chaque jeu d'options a ses propres `.o` : revenir à des options déjà utilisées ne recompile rien | Un dossier de plus par jeu d'options essayé |

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
# obj/ suivi d'un nombre calculé à partir du texte de CFLAGS
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculs.c
# obj/<nombre>/main.o obj/<nombre>/calculs.o
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)

# FORCE : l'édition de liens est refaite à chaque appel (voir plus bas)
programme: $(OBJS) FORCE
	$(CC) $(CFLAGS) -o $@ $(OBJS)

# mkdir -p crée le dossier s'il manque, sans erreur s'il existe déjà
$(OBJDIR)/%.o: %.c calculs.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

# supprime d'un coup les dossiers d'objets de tous les jeux d'options
clean:
	rm -rf obj programme

FORCE:
.PHONY: clean FORCE
```

Le nom du dossier vient d'une commande [shell](/?c=langages&s=bash&p=bash), exécutée par `$(shell ...)` (voir [`pkg-config`](#retrouver-les-flags-de-compilation-d-une-bibliotheque-pkg-config)), dont les trois étapes sont reliées par des [pipes](/?c=langages&s=bash&p=redirections-et-pipes#les-pipes-chainer-des-commandes) :

| Étape | Rôle | Sortie pour `-Wall -Wextra -O2` |
|---|---|---|
| [`printf '%s' '...'`](https://man7.org/linux/man-pages/man1/printf.1.html) | Écrit le texte des options, sans retour à la ligne | `-Wall -Wextra -O2` |
| [`cksum`](https://man7.org/linux/man-pages/man1/cksum.1.html) | Calcule une **somme de contrôle** : un nombre qui résume le texte (comme une [fonction de hachage](/?c=langages&s=c&p=tables-de-hachage#la-fonction-de-hachage)), différent dès qu'un caractère change | `364582449 17` (la somme, puis le nombre d'octets) |
| [`cut -d' ' -f1`](/?c=langages&s=bash&p=traitement-de-texte#cut-extraire-des-colonnes-simplement) | Garde le premier champ | `364582449` |

**Pourquoi l'[édition de liens](/?c=langages&s=c&p=compilation#4-l-edition-de-liens-linking) est toujours refaite.** Une cible qui dépend de `FORCE` (une cible sans dépendance ni commande, qui ne correspond à aucun fichier) est reconstruite à chaque appel. Sans elle :

| Étape | Commande | Ce qui se passe sans `FORCE` |
|---|---|---|
| 1 | `make` | `obj/364582449/*.o` compilés, `programme` relié en `-O2` |
| 2 | `make CFLAGS="-O0 -g"` | `obj/1873556349/*.o` compilés, `programme` relié en `-O0`, donc plus récent que `obj/364582449/*.o` |
| 3 | `make` | `programme` est plus récent que `obj/364582449/*.o` : « à jour », il reste en `-O0` |

Avec `FORCE`, l'étape 3 relie à nouveau les objets de `obj/364582449/`, sans rien recompiler : l'édition de liens ne prend qu'un instant.

> **Piège :** `$^` à la place de `$(OBJS)` dans la commande d'édition de liens contient aussi `FORCE` : l'éditeur de liens cherche alors un fichier de ce nom et s'arrête (`cannot find FORCE: No such file or directory`).

> **Piège :** un commentaire écrit au bout d'une ligne de variable (`OBJDIR = obj/...   # objets`) laisse dans la valeur les espaces qui le précèdent : `$(OBJDIR)/%.o` devient `obj/364582449   /%.o`, soit deux cibles distinctes. `make` s'arrête alors sur `mixed implicit and normal rules` et `No rule to make target '%.c'`, des messages qui ne désignent pas le commentaire. Écrire les commentaires de variables sur leur propre ligne, au-dessus.

## Les en-têtes modifiés : dépendances automatiques (`-MMD -MP`)

Les règles ci-dessus citent `calculs.h` à la main. Un en-tête oublié dans la liste, ou inclus par un autre en-tête, est invisible pour `make` : le `.o` n'est pas recompilé et le programme garde l'ancien code. Exemple mesuré, avec `#define FACTEUR 1` dans `calculs.h` et une règle `%.o: %.c` sans en-tête :

```text
$ make                      # FACTEUR vaut 1
$ ./programme
9
$ sed -i 's/FACTEUR 1/FACTEUR 2/' calculs.h
$ make
make: 'programme' is up to date.
$ ./programme
9                           # devrait afficher 36 : rien n'a été recompilé
```

`gcc` sait lister lui-même les en-têtes qu'il lit. Avec `-MMD`, il écrit à côté de chaque `.o` un fichier `.d` (*dépendances*) pendant la compilation habituelle, sans les en-têtes du système (`<stdio.h>`...) :

```text
$ cat main.d
main.o: main.c calculs.h
calculs.h:
```

La première ligne est une règle `make` complète. La seconde vient de `-MP` : une règle **vide** pour chaque en-tête. Il reste à charger ces fichiers avec `include` :

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2 -MMD -MP
SRCS = main.c calculs.c
OBJS = $(SRCS:%.c=%.o)

programme: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# charge les .d ; le tiret ignore un fichier absent (premier build, avant tout .d)
-include $(OBJS:.o=.d)
```

| Élément | Rôle | Sans lui |
|---|---|---|
| `-MMD` | `gcc` écrit `main.d` : la liste des en-têtes réellement inclus | modifier un en-tête ne recompile rien |
| `-MP` | une règle vide par en-tête | un en-tête renommé ou supprimé arrête `make` (voir ci-dessous) |
| `-include` | charge les `.d` sans erreur s'ils manquent | `make` s'arrête au premier build (`No rule to make target 'a.d'`), avant que le moindre `.d` n'existe |

Même changement d'en-tête (`FACTEUR` à 3) avec ces règles : les deux `.c` sont recompilés et le programme affiche `81`. Si un en-tête est ensuite renommé, les anciens `.d` le citent encore. Sans `-MP`, `make` s'arrête :

```text
make: *** No rule to make target 'calculs.h', needed by 'main.o'.  Stop.
```

Avec `-MP`, la règle vide fait croire à `make` que l'en-tête existe : il recompile le `.c`, et c'est le compilateur qui signale la vraie erreur ou constate que les `#include` sont à jour.

**Une autre dépendance cachée : le Makefile lui-même.** Changer une option **dans** le Makefile ne recompile rien non plus, puisque `make` ne compare que des dates de fichiers. Mesuré avec `CFLAGS = -DOPT=1` changé en `-DOPT=2` : sans `Makefile` dans les dépendances (`programme: a.c`), `make` répond « up to date » et le programme affiche toujours `opt=1` ; avec `programme: a.c Makefile`, il recompile et affiche `opt=2`. Le fichier source reste **en premier** : `$<` désigne la première dépendance. Contrepartie : toucher au Makefile recompile tout.

## Dépendance d'ordre : exécuter avant, sans forcer la reconstruction

Une règle peut séparer ses dépendances en deux groupes avec une barre verticale : `cible: dépendances normales | dépendances d'ordre`. `make` construit d'abord les dépendances d'ordre (*order-only*) si elles manquent, mais **leur date n'entre jamais dans la décision** de reconstruire la cible.

**Premier cas : le dossier des objets.** Un dossier est une cible comme une autre, mais sa date change chaque fois qu'un fichier y est créé. Mis dans les dépendances normales, il rend les `.o` « périmés » juste après leur création. Mesuré avec `obj/a.o` et `obj/b.o`, appelés trois fois de suite :

| Appel | Dossier en dépendance normale | Dossier après la barre `\|` |
|---|---|---|
| 1 | crée `obj/`, compile `a.o` et `b.o` | crée `obj/`, compile `a.o` et `b.o` |
| 2 | recompile `a.o` | `Nothing to be done` |
| 3 | recompile `b.o` | `Nothing to be done` |

```makefile
OBJDIR = obj
OBJS = $(OBJDIR)/a.o $(OBJDIR)/b.o

all: $(OBJS)

# après la barre : le dossier doit exister avant la compilation, sa date est ignorée
$(OBJDIR)/%.o: %.c | $(OBJDIR)
	gcc -c $< -o $@

$(OBJDIR):
	mkdir -p $@
```

Dans la recette, `$^` ne contient que les dépendances normales (`a.c`) : les dépendances d'ordre sont dans une autre variable automatique, `$|` (ici `obj`). Un `$^` passé au compilateur n'embarque donc jamais le dossier (à l'inverse de `FORCE`, vu plus haut, qui est une dépendance normale).

**Second cas : une cible factice (`.PHONY`) à exécuter avant, sans forcer la reconstruction.** Une cible `.PHONY` placée parmi les dépendances **normales** est toujours considérée comme à refaire, donc la cible qui en dépend l'est aussi. Mesuré avec une cible `verif` qui affiche un message et un `programme` relié depuis `a.o` et `b.o` :

| Appel | `programme: a.o b.o verif` | `programme: a.o b.o \| verif` |
|---|---|---|
| 1 | compile, `verif`, relie | compile, `verif`, relie |
| 2 | `verif`, **relie à nouveau** | `verif` seulement |

Après la barre, `verif` s'exécute à chaque appel (utile pour un contrôle préalable), sans forcer l'édition de liens.

## Tester la présence d'un outil ou d'une bibliothèque

Un Makefile qui suppose un outil installé échoue plus loin, avec un message qui n'en désigne pas la cause. On teste d'abord, et on s'arrête avec un message précis.

**Un outil : `command -v`.** La commande `command -v nom` affiche le chemin de l'outil s'il existe et n'affiche rien sinon (code de sortie différent de 0). Elle est prévue par la norme POSIX, contrairement à `which`, un programme à part. `$(error texte)` arrête `make` avec ce texte :

```makefile
# $(shell ...) renvoie la sortie de la commande : vide si l'outil n'existe pas
ifeq ($(shell command -v pkg-config),)
$(error pkg-config introuvable : installez-le avant de lancer make)
endif
```

```text
Makefile:2: *** pkg-config introuvable : installez-le avant de lancer make.  Stop.
```

**Une bibliothèque : un test de compilation.** `pkg-config` (voir plus haut) peut manquer, ou ne pas connaître une bibliothèque installée à la main, et son `.pc` ne prouve pas que la compilation réussira. Le test le plus fiable fait ce que le programme fera : compiler un programme minimal qui inclut l'en-tête et lie la bibliothèque.

```bash
printf '#include <math.h>\nint main(void){return sqrt(4.0)>0;}\n' | gcc -x c - -lm -o /dev/null
```

| Morceau | Rôle |
|---|---|
| `printf '...'` | écrit un petit programme C (`\n` = retour à la ligne) |
| `\|` | l'envoie à `gcc` par son entrée standard |
| `-x c -` | `-x c` dit que le texte est du C (l'entrée standard n'a pas d'extension `.c`) ; `-` signifie « lire l'entrée standard » |
| `-lm` | lie la bibliothèque à tester |
| `-o /dev/null` | jette l'exécutable produit : seul le code de sortie compte (`0` = en-tête trouvé **et** bibliothèque liée) |

**Piège du `#` dans un Makefile.** Dans une définition de variable ou une ligne de dépendances, `#` commence un commentaire : la ligne `INCL := printf '#include <math.h>\n'` est coupée à `#` et la variable ne vaut plus que `printf '` (mesuré). `\#` donne un `#` littéral dans une définition ordinaire. Mais **dans `$(shell ...)`, `make` ne retire pas le backslash** : le shell reçoit `\#include`, et `gcc` répond `stray '\' in program` (mesuré). Deux parades : une variable `HASH := \#` insérée avec `$(HASH)`, ou le code octal `\043` de `printf`.

```makefile
CC = gcc
# une variable qui contient seulement le caractère #
HASH := \#
TEST_MATH = printf '$(HASH)include <math.h>\nint main(void){return sqrt(4.0)>0;}\n' | $(CC) -x c - -lm -o /dev/null 2>/dev/null && echo oui
# "oui" si le test réussit, vide sinon
HAVE_MATH := $(shell $(TEST_MATH))

ifeq ($(HAVE_MATH),)
$(error test de compilation de math.h et -lm impossible : en-tete ou bibliotheque manquant)
endif
```

Résultats mesurés avec ce schéma sur quatre tests :

| Test | Valeur obtenue |
|---|---|
| `#include <math.h>` et `-lm` | `oui` |
| `#include <inexistant.h>` | vide |
| `-lbibliotheque_absente` | vide |
| `\043include <math.h>` (octal, sans `HASH`) | `oui` |

> **Piège :** `2>/dev/null` cache les messages du compilateur, et donc la cause réelle de l'échec. Pour diagnostiquer, relancer la commande du test à la main, sans cette redirection.

## Enchaîner les trois étapes de la PGO dans une cible

L'[optimisation guidée par profil](/?c=langages&s=c&p=compilation#l-optimisation-guidee-par-profil-pgo) (PGO) compile le programme trois fois de suite : version instrumentée, exécution d'entraînement, version optimisée. Une cible du Makefile peut enchaîner les trois, en relançant `make` sur une cible de compilation ordinaire (`lier`) avec d'autres options.

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2
NOM = programme
OBJDIR = obj/$(shell printf '%s' '$(CFLAGS)' | cksum | cut -d' ' -f1)
SRCS = main.c calculs.c
OBJS = $(SRCS:%.c=$(OBJDIR)/%.o)
# dossier des profils (fichiers .gcda)
PGO_DIR = pgo
# entrées d'entraînement, différentes de celles des mesures de vitesse
PGO_ENTREES = essai1.txt essai2.txt

# cible par défaut : les trois étapes, refaites seulement si un source ou le Makefile change
$(NOM): $(SRCS) calculs.h Makefile
	rm -rf $(PGO_DIR) obj/pgo
	$(MAKE) lier NOM=instrumente OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-generate=$(PGO_DIR)"
	for f in $(PGO_ENTREES); do ./instrumente $$f > /dev/null || exit 1; done
	rm -f instrumente obj/pgo/*.o
	$(MAKE) lier NOM=$(NOM) OBJDIR=obj/pgo \
		CFLAGS="$(CFLAGS) -fprofile-use=$(PGO_DIR)"

# compilation directe, sans PGO (essais, débogage), toujours reliée comme avec FORCE
lier: $(OBJS)
	$(CC) $(CFLAGS) -o $(NOM) $(OBJS)

$(OBJDIR)/%.o: %.c calculs.h
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf obj $(PGO_DIR) instrumente $(NOM)

.PHONY: lier clean
```

| Détail | Pourquoi |
|---|---|
| [`$(MAKE)`](https://www.gnu.org/software/make/manual/html_node/MAKE-Variable.html) plutôt que `make` | Relance exactement le même programme `make`, en le signalant comme un appel récursif : ses options (`-j`, `-n`...) se transmettent correctement au sous-`make` |
| `NOM=... OBJDIR=... CFLAGS=...` après `lier` | Remplacent, pour ce seul appel, les valeurs écrites dans le Makefile (section précédente) |
| Même `OBJDIR=obj/pgo` aux étapes 1 et 3 | Le profil de chaque `.o` porte le nom de ce `.o` : avec un autre dossier à l'étape 3, le profil n'est pas trouvé, ce que `gcc` ne signale que par un [avertissement](/?c=langages&s=c&p=compilation#l-optimisation-guidee-par-profil-pgo) |
| `rm -f ... obj/pgo/*.o` avant l'étape 3 | Les `.o` instrumentés sont plus récents que les sources : sans ce `rm`, `make` ne recompile rien, relie les objets de l'étape 1 sans la bibliothèque qui compte les passages, et échoue (`undefined reference to '__gcov_merge_add'`) |
| `\` en fin de ligne | Chaque ligne de commande s'exécute dans son propre shell ; `\` réunit deux lignes en une seule commande |
| `$$f` | Dans une commande, `$` appartient à `make` ; `$$` transmet un `$` au shell, pour la variable de la [boucle `for`](/?c=langages&s=bash&p=boucles#la-boucle-for-parcours-de-liste) |
| `\|\| exit 1` | Arrête tout au premier entraînement qui échoue : sans lui, la boucle ne renvoie que le [code de sortie](/?c=langages&s=bash&p=scripts-et-shebang#codes-de-sortie-exit) de son dernier tour, et un échec plus tôt passerait inaperçu |
| Dépendances `$(SRCS) calculs.h Makefile` | Les trois étapes ne sont refaites que si le code ou le Makefile change |

## Savoir si une reconstruction est due : `make -q`

Avec `-q` (*question*), `make` n'exécute aucune commande : il répond seulement par son [code de sortie](/?c=langages&s=bash&p=scripts-et-shebang#codes-de-sortie-exit).

| Option | Exécute les commandes ? | Ce qu'elle apporte |
|---|---|---|
| `make -n` | Non | Affiche les commandes qui seraient exécutées |
| `make -q` | Non | Code de sortie `0` si tout est à jour, `1` si une reconstruction est due, `2` en cas d'erreur |

Utile dans un script, pour prévenir avant une reconstruction longue (les trois étapes de la PGO prennent environ 24 secondes sur le solveur SAT cité dans [la compilation](/?c=langages&s=c&p=compilation#l-optimisation-guidee-par-profil-pgo)) :

```bash
if ! make -q; then                           # 1 ou 2 : il y a quelque chose à faire
    echo "Reconstruction (environ 24 s)..."  # prévient avant l'attente
fi
make -s || exit 1                            # construit si besoin, en silence
```

> **Piège :** une cible `.PHONY`, ou qui dépend de `FORCE`, n'est jamais « à jour » : `make -q lier` répond toujours `1`. Poser la question sur une cible qui est un vrai fichier, construite seulement quand ses dépendances changent (ici `programme`, la cible PGO).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un Makefile décrit des règles (`cible: dépendances` + commande) que `make` exécute, en ne reconstruisant que ce qui a réellement changé. Une recette courte peut aussi tenir sur la ligne de la cible, après un `;`. `make` ne compare que des dates : changer les options de compilation ne recompile rien. |
| **Outils utilisables** | Variables (`CC`, `CFLAGS`), cibles factices (`.PHONY`), `-I` pour les en-têtes, `pkg-config` pour les flags d'une bibliothèque, `@`/`MAKEFLAGS += -s` pour le mode silencieux ; règles génériques (`%`, `$@`, `$<`, `$^`) ; `make VARIABLE=valeur` ; `$(MAKE)` pour enchaîner des étapes (PGO) ; `make -n` et `make -q` ; `-MMD -MP` avec `-include` pour les en-têtes ; dépendance d'ordre (`cible: normales \| ordre`) ; `command -v`, `$(error ...)` et un test de compilation (`gcc -x c -`) pour vérifier un outil ou une bibliothèque. |
| **Pièges à éviter** | Indenter une commande avec des espaces plutôt qu'une tabulation ; pointer `-I` sur le mauvais niveau de dossier ; confondre le nom `pkg-config` d'une bibliothèque avec le nom de son paquet système ; `$^` pour compiler un `.c` ; un commentaire au bout d'une ligne de variable ; croire qu'un nouveau `CFLAGS` a été appliqué ; lister les en-têtes à la main (un oubli laisse un programme périmé) ; mettre un dossier ou une cible `.PHONY` en dépendance normale (reconstruction à chaque appel) ; écrire `\#` dans un `$(shell ...)` ; masquer les erreurs d'un test de compilation sans pouvoir les relire. |
| **Bonnes pratiques** | Déclarer `.PHONY` pour toute cible qui ne produit pas un vrai fichier (`clean`, `test`...), pour éviter un conflit avec un fichier de même nom ; passer par `pkg-config` plutôt que deviner des `-I`/`-l` à la main pour une bibliothèque tierce ; un dossier d'objets par jeu d'options, avec une édition de liens toujours refaite ; `\|\| exit 1` dans une boucle de commande. Laisser `gcc` produire les dépendances d'en-têtes (`-MMD -MP`) et mettre le `Makefile` parmi les dépendances d'un objet ; créer un dossier d'objets par une dépendance d'ordre ; tester un outil avant de s'en servir et s'arrêter avec un message qui le nomme. |
