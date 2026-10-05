---
order: 13
---

# Un message d'erreur pour chaque cause

Un message d'erreur est lu à un moment précis : quand un programme vient d'échouer et que son lecteur ne sait pas pourquoi. Il doit alors lui dire **quoi corriger**, sans qu'il ait à relire le code. Ce chapitre montre, sur un programme qui lit un numéro de port dans un fichier, trois façons d'écrire ces messages (un texte commun à toutes les causes, un texte « corrigé » en supposant la cause, un texte par cause) et ce que chacune coûte à celui qui reçoit l'erreur. Il montre aussi qu'un chemin d'erreur qui oublie de refermer un fichier finit par produire... une erreur au message trompeur.

Les règles retenues : **un message par cause** (jamais le même texte pour deux causes, jamais un message vide ni une sortie en erreur sans message) ; il **nomme l'élément fautif** (fichier, ligne, champ, valeur reçue) ; il donne la **cause réelle** lue dans le système (`strerror(errno)`), jamais une cause supposée ; il ne contient pas de retour à la ligne.

## L'exemple : lire `port=NNNN` dans un fichier

Le programme lit la première ligne d'un fichier de configuration, qui doit valoir `port=` suivi d'un nombre de 1 à 65535. Il existe en trois versions, choisies par un argument (`./cfg 1 fichier`, `./cfg 2 fichier`, `./cfg 3 fichier`). Les erreurs partent sur [`stderr`](/?c=langages&s=c&p=appels-systeme-et-descripteurs), le flux d'erreur standard ; le **code de sortie** (0 si tout va bien, 1 en cas d'échec) est celui décrit dans [exit et les codes de retour](/?c=langages&s=c&p=exit-et-codes-de-retour).

La **version 1** écrit le même message quelle que soit la cause, convertit avec `atoi` (qui renvoie 0 sur n'importe quel texte et s'arrête sans protester à la première lettre) et oublie de refermer le fichier sur deux chemins :

```c
#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

/* Version 1 : un message commun à toutes les causes, un fichier jamais refermé sur un chemin. */
static int	load_v1(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f || !fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	*port = atoi(line + 5);                         /* 0 sur n'importe quoi, 80 pour « 80x » */
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);                                /* fclose oublié sur ce chemin */
	}
	fclose(f);
	return (0);
}
```

La **version 2** est la « correction » de quelqu'un qui n'a testé que le cas d'un fichier absent : tout échec d'ouverture devient « file not found » :

```c
/* Version 2 : « corrigée » en supposant la cause : tout échec d'ouverture devient « not found ». */
static int	load_v2(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f)
	{
		fprintf(stderr, "error: %s: file not found\n", path);
		return (-1);
	}
	if (!fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		fclose(f);
		return (-1);
	}
	*port = atoi(line + 5);
	fclose(f);
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	return (0);
}
```

La **version 3** donne un message par cause, avec le fichier, la ligne et la valeur reçue, vérifie que le chemin est un fichier ordinaire avec [`stat`](https://man7.org/linux/man-pages/man2/stat.2.html), convertit avec [`strtol` et ses vérifications](/?c=langages&s=c&p=convertir-un-texte-en-nombre), et referme le fichier en **un seul endroit** :

```c
static int	report(const char *path, int line_no, const char *fmt, ...)
{
	va_list	args;

	if (line_no)
		fprintf(stderr, "%s:%d: ", path, line_no);
	else
		fprintf(stderr, "%s: ", path);
	va_start(args, fmt);
	vfprintf(stderr, fmt, args);
	va_end(args);
	fputc('\n', stderr);
	return (-1);
}

/* Lit « port=NNNN » : un message par cause, avec le fichier, la ligne et la valeur reçue. */
static int	parse_port(const char *path, const char *line, int *port)
{
	char	*end;
	long	value;

	if (strncmp(line, "port=", 5) != 0)
		return (report(path, 1, "expected \"port=\", got \"%.20s\"", line));
	errno = 0;
	value = strtol(line + 5, &end, 10);
	if (end == line + 5 || *end)
		return (report(path, 1, "port \"%.20s\" is not a number", line + 5));
	if (errno == ERANGE || value < 1 || value > 65535)
		return (report(path, 1, "port %ld is out of range (1 to 65535)", value));
	*port = (int)value;
	return (0);
}

/* Version 3 : chaque cause a son message ; le fichier est refermé en un seul endroit. */
static int	load_v3(const char *path, int *port)
{
	struct stat	st;
	FILE		*f;
	char		line[64];
	int			rc;

	if (stat(path, &st) != 0)
		return (report(path, 0, "%s", strerror(errno)));
	if (!S_ISREG(st.st_mode))
		return (report(path, 0, "not a regular file"));
	f = fopen(path, "r");
	if (!f)
		return (report(path, 0, "%s", strerror(errno)));
	if (!fgets(line, sizeof line, f))
		rc = report(path, 0, ferror(f) ? "%s" : "empty file", strerror(errno));
	else
	{
		line[strcspn(line, "\n")] = '\0';           /* le message ne doit pas contenir de retour à la ligne */
		rc = parse_port(path, line, port);
	}
	fclose(f);
	return (rc);
}
```

```c
int	main(int argc, char **argv)
{
	int	failed = 0;

	if (argc < 3)
		return (fprintf(stderr, "usage: %s 1|2|3 file...\n", argv[0]), 2);
	for (int i = 2; i < argc; i++)
	{
		int	port = 0, rc;

		if (strcmp(argv[1], "1") == 0)
			rc = load_v1(argv[i], &port);
		else if (strcmp(argv[1], "2") == 0)
			rc = load_v2(argv[i], &port);
		else
			rc = load_v3(argv[i], &port);
		if (rc == 0)
			printf("port=%d\n", port);
		failed |= rc != 0;
	}
	return (failed);
}
```

Les fichiers d'essai, un par cause (le fichier `absent.cfg` n'est pas créé : il n'existe pas), et la compilation :

```bash
printf 'port=8080\n' > ok.cfg                 # valide
: > empty.cfg                                 # vide
printf 'listen=80\n' > noprefix.cfg           # pas de « port= »
printf 'port=abc\n' > abc.cfg                 # pas un nombre
printf 'port=\n' > novalue.cfg                # valeur absente
printf 'port=99999\n' > big.cfg               # hors de 1 à 65535
printf 'port=80x\n' > trail.cfg               # nombre suivi d'un caractère
mkdir dir.cfg                                 # un dossier
printf 'port=8080\n' > noperm.cfg; chmod 000 noperm.cfg   # fichier sans droit de lecture
gcc -Wall -Wextra -g -fsanitize=address,undefined cfg.c -o cfg
```

## Ce que reçoit celui qui lit l'erreur

Message affiché par chaque version (`./cfg 1 fichier`, `./cfg 2 fichier`, `./cfg 3 fichier`), mesuré ; le code de sortie vaut 1 à chaque échec :

| Fichier | Cause réelle | Version 1 | Version 2 | Version 3 |
|---|---|---|---|---|
| `absent.cfg` | le fichier n'existe pas | `error: cannot load config` | `error: absent.cfg: file not found` | `absent.cfg: No such file or directory` |
| `noperm.cfg` | droit de lecture refusé | `error: cannot load config` | `error: noperm.cfg: file not found` (**faux**) | `noperm.cfg: Permission denied` |
| `dir.cfg` | c'est un dossier | `error: cannot load config` | `error: cannot load config` | `dir.cfg: not a regular file` |
| `empty.cfg` | fichier vide | `error: cannot load config` | `error: cannot load config` | `empty.cfg: empty file` |
| `noprefix.cfg` | pas de `port=` | `error: cannot load config` | `error: cannot load config` | `noprefix.cfg:1: expected "port=", got "listen=80"` |
| `abc.cfg` | pas un nombre | `error: cannot load config` | `error: cannot load config` | `abc.cfg:1: port "abc" is not a number` |
| `novalue.cfg` | valeur absente | `error: cannot load config` | `error: cannot load config` | `novalue.cfg:1: port "" is not a number` |
| `big.cfg` | hors de 1 à 65535 | `error: cannot load config` | `error: cannot load config` | `big.cfg:1: port 99999 is out of range (1 to 65535)` |
| `trail.cfg` | `80x` : pas un nombre | **accepté : `port=80`**, code 0 | **accepté : `port=80`**, code 0 | `trail.cfg:1: port "80x" is not a number` |
| `ok.cfg` | valide | `port=8080` | `port=8080` | `port=8080` |

Trois défauts se lisent dans ce tableau.

- **Un seul texte pour huit causes** (version 1) : l'utilisateur ne sait pas s'il doit créer le fichier, changer ses droits, corriger la valeur ou la mettre dans une autre plage.
- **Une valeur acceptée à tort** : `atoi("80x")` vaut 80, donc `80x` passe silencieusement pour le port 80 (la conversion stricte avec `strtol`, qui compare la fin de la lecture, le refuse) ; `atoi("abc")` vaut 0, et ce 0 tombe dans le test de plage au lieu d'être refusé comme « pas un nombre ».
- **Une cause supposée** (version 2) : `noperm.cfg` existe, mais le message affirme « file not found ». Ce message est **pire que le message vague** : il envoie chercher un fichier qui est là, au lieu de regarder ses droits. La version 3 lit la vraie cause dans `errno` avec `strerror`.

## Le chemin d'erreur qui oublie de refermer

Dans la version 1, deux chemins d'erreur oublient `fclose` : celui où `fgets` échoue (fichier vide) et celui où le port est hors plage. Chaque appel qui échoue laisse un **descripteur de fichier** ouvert (le numéro que le système donne à un fichier ouvert, voir [les appels système et les descripteurs](/?c=langages&s=c&p=appels-systeme-et-descripteurs)), et un processus n'en a qu'un nombre limité. Ici, 60 lectures du fichier `big.cfg` (refusé) puis une du fichier valide `ok.cfg`, avec au plus 50 descripteurs (`ulimit -n 50`) :

```bash
for v in 1 2 3; do
  echo "--- version $v"
  ( ulimit -n 50; ASAN_OPTIONS=detect_leaks=0 ./cfg $v $(yes big.cfg | head -60) ok.cfg 2>&1 | sort | uniq -c | sort -rn )
done
```

```
--- version 1
     61 error: cannot load config
--- version 2
     60 error: cannot load config
      1 port=8080
--- version 3
     60 big.cfg:1: port 99999 is out of range (1 to 65535)
      1 port=8080
```

Avec la version 1, les 61 lectures échouent avec **le même message**, y compris celle du fichier valide : les descripteurs sont épuisés, `fopen` échoue, et le programme répond « cannot load config ». Rien dans le message ne permet de relier cet échec à une fuite. La version 2 referme le fichier avant le test de plage et la version 3 le referme en un seul endroit : le fichier valide est lu.

Sur un fichier valide, mais sans aucun descripteur disponible (`ulimit -n 3` : seuls l'entrée, la sortie et l'erreur standard sont ouverts), la version 3 donne **la cause réelle** là où la version 1 garde son texte commun. L'exécutable est lié statiquement (`-static`) parce que le chargeur de bibliothèques d'un exécutable normal a lui-même besoin d'un descripteur :

```bash
gcc -static -Wall -Wextra -g cfg.c -o cfg_static
sh -c 'ulimit -n 3; exec ./cfg_static 1 ok.cfg'      # version 1
sh -c 'ulimit -n 3; exec ./cfg_static 3 ok.cfg'      # version 3
```

```
error: cannot load config
ok.cfg: Too many open files
```

> **Piège :** une fuite de descripteurs n'est pas une fuite de mémoire : LeakSanitizer ne la voit pas (mesuré : aucun rapport pour la version 1, la bibliothèque C garde la trace des fichiers ouverts). Elle se découvre en abaissant la limite de descripteurs (`ulimit -n`) pendant un test.

## Écrire un message par cause

| Règle | Pourquoi |
|---|---|
| Un message **par cause**, jamais le même texte pour deux causes | Le lecteur sait quoi corriger sans relire le code |
| Jamais de message vide, ni de `exit(1)` sans message | Un échec sans texte est indiagnosticable |
| Nommer l'**élément fautif** : fichier, ligne, champ, **valeur reçue** (`port "abc" is not a number`) | Le lecteur retrouve l'endroit à corriger |
| Donner la **cause réelle** lue dans le système (`strerror(errno)`), jamais une cause supposée | Un message faux envoie chercher au mauvais endroit |
| Ne pas mettre de retour à la ligne ni de caractère de contrôle dans le message | Un message coupé sur deux lignes se lit mal et se filtre mal ; ici, la ligne lue gardait son `\n` avant d'être nettoyée |
| Avec plusieurs entrées, dire **laquelle** est en cause | `big.cfg:1:` plutôt que « invalid port » |
| Refermer et libérer **en un seul endroit**, sur tous les chemins | Un chemin d'erreur ne fuit plus quand il passe par le même nettoyage que le chemin normal (voir [Un contexte de travail pour découper une grosse fonction](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=contexte-de-travail-pour-decouper-une-fonction)) |
| Écrire sur `stderr`, pas sur `stdout` | Le résultat du programme reste exploitable, les erreurs vont ailleurs |

## Ne jamais annoncer « corrigé » sans test réel

La version 2 donne l'impression d'une correction : sur `absent.cfg`, le message a changé et il est juste. Elle a pourtant été validée sur **un seul cas**, le seul que son auteur imaginait, et elle se trompe sur `noperm.cfg`. Ce qui permet de dire qu'un message est corrigé :

| Étape | Exemple ici |
|---|---|
| Produire **chaque** cause pour de vrai (pas seulement la plus fréquente) | Les neuf fichiers d'essai, dont un dossier et un fichier sans droit |
| Lancer et **lire** le message de chaque cas | Le tableau ci-dessus, cellule par cellule |
| Vérifier que le cas valide passe toujours | `ok.cfg` donne `port=8080` dans les trois versions |
| Pousser vers les limites du système | `ulimit -n 50` a révélé la fuite de descripteurs |
| Comparer au comportement d'avant sur les mêmes entrées | Le tableau place les trois versions côte à côte |

> **Piège :** déduire la cause d'un échec du seul endroit où il a lieu (« `fopen` a échoué donc le fichier n'existe pas »). `fopen` échoue aussi pour un droit refusé, un dossier ou trop de fichiers ouverts : il faut lire `errno`.
>
> **Piège :** vérifier un correctif sur le cas qui a motivé le changement et sur lui seul. Il faut rejouer **toutes** les causes, et le cas valide.
>
> **Bonne pratique :** pour chaque cause d'échec, un fichier ou une entrée d'essai qui la produit, rejoués après chaque modification des messages.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un message d'erreur doit dire quoi corriger : un message par cause, qui nomme le fichier, la ligne et la valeur reçue, avec la cause réelle lue dans `errno` (`strerror`). Un texte commun à toutes les causes est indiagnosticable ; un texte qui suppose la cause (« file not found » pour un droit refusé) est pire. Dans l'exemple, la version 1 acceptait `80x` comme le port 80 et épuisait ses descripteurs sur deux chemins d'erreur, jusqu'à refuser un fichier valide avec le même message. |
| **Outils utilisables** | `strerror(errno)` ; `stat` et `S_ISREG` pour refuser un dossier ; `strtol` avec test de fin de lecture, de `errno` et de plage ; une fonction `report` qui préfixe fichier et ligne ; `ulimit -n` pour vérifier qu'aucun descripteur ne fuit ; `ASAN_OPTIONS=exitcode=...` pour distinguer l'échec d'ASan de celui du programme. |
| **Pièges à éviter** | Le même message pour plusieurs causes ; un message vide ou `exit(1)` sans texte ; une cause supposée ; `atoi` (accepte `80x`, renvoie 0 pour `abc`) ; un retour à la ligne dans le message ; oublier de refermer un fichier sur un chemin d'erreur ; croire qu'un correctif est bon après un seul test. |
| **Bonnes pratiques** | Un message par cause avec fichier, ligne et valeur reçue ; la cause réelle lue dans le système ; un nettoyage unique pour tous les chemins ; une entrée d'essai par cause, rejouée après chaque modification ; le cas valide et les limites du système (`ulimit -n`) testés avant de dire « corrigé ». |
