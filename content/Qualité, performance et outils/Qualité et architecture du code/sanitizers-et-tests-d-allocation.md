---
order: 11
---

# Sanitizers et tests d'allocation

Un bug de mémoire en C ne fait presque jamais planter le programme à l'endroit de l'erreur : il corrompt une case voisine, et le dégât n'apparaît que plus tard, ou jamais. Ce chapitre présente les outils qui rendent ces bugs visibles (les **sanitizers** et [**valgrind**](https://valgrind.org)), la technique qui fait **échouer volontairement `malloc`** pour tester des chemins qu'on ne rencontre jamais, puis les précautions pour que **l'outil de test lui-même** ne se trompe pas : un test qui accuse du code correct (un **faux positif**) fait perdre autant de temps qu'un bug.

Les bugs mémoire eux-mêmes (débordement, utilisation après `free`, fuite) sont décrits dans [les quatre bugs mémoire classiques](/?c=langages&s=c&p=memoire#les-quatre-bugs-memoire-classiques) ; le chapitre [Les outils de fuzzing](/?c=securite&s=securite-offensive&p=outils-de-fuzzing) en montre l'usage côté sécurité.

## Les sanitizers : ce qu'ils vérifient

Un **sanitizer** (*assainisseur*) est une option de compilation qui ajoute au programme des vérifications exécutées pendant qu'il tourne, et qui l'arrête avec un rapport précis dès qu'une erreur est constatée. Trois sont utiles au quotidien avec [`gcc` et `clang`](/?c=langages&s=c&p=compilation) :

| Sanitizer | Option | Ce qu'il détecte |
|---|---|---|
| **ASan** ([AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)) | `-fsanitize=address` | Lecture ou écriture hors d'un bloc alloué, utilisation d'un bloc après `free` |
| **LSan** ([LeakSanitizer](https://clang.llvm.org/docs/LeakSanitizer.html)) | inclus dans ASan sous Linux | Fuite : bloc jamais libéré à la fin du programme |
| **UBSan** ([UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)) | `-fsanitize=undefined` | Comportement indéfini : une opération que le langage ne définit pas, comme un dépassement d'entier signé (un `int` qui dépasse sa valeur maximale, 2 147 483 647) |

Un programme de démonstration avec quatre défauts, choisis par un argument (`./bugs 1` à `./bugs 4`) :

```c
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

int main(int argc, char **argv)
{
	int mode = argc > 1 ? atoi(argv[1]) : 0;      /* numéro du défaut à provoquer */
	int *tab = malloc(4 * sizeof *tab);           /* bloc de 4 entiers : 16 octets */

	if (!tab)
		return (1);
	if (mode == 1)
		tab[4] = 7;                       /* écrit une case après la fin */
	if (mode == 2)
	{
		free(tab);
		printf("%d\n", tab[0]);           /* lit après free */
		return (0);
	}
	if (mode == 3)
		return (0);                       /* oublie free(tab) */
	if (mode == 4)
	{
		int big = INT_MAX;

		printf("%d\n", big + argc);       /* dépassement d'entier signé */
	}
	free(tab);
	return (0);
}
```

```bash
# -g : numéros de ligne dans le rapport ; -fno-omit-frame-pointer : pile d'appels lisible
gcc -g -O0 -fno-omit-frame-pointer -fsanitize=address,undefined bugs.c -o bugs_san
gcc -g -O0 bugs.c -o bugs_plain               # même programme, sans sanitizer
```

Mesuré sous `gcc` 12.4 (Ubuntu 24.04) :

| Défaut | Programme normal | Programme avec sanitizers |
|---|---|---|
| `./bugs 1` : écriture après la fin | se termine sans rien dire (code 0) | `ERROR: AddressSanitizer: heap-buffer-overflow`, ligne 13, code 1 |
| `./bugs 2` : lecture après `free` | affiche une valeur au hasard (`256822755`) | `ERROR: AddressSanitizer: heap-use-after-free`, ligne 17, code 1 |
| `./bugs 3` : fuite | se termine sans rien dire (code 0) | `ERROR: LeakSanitizer: detected memory leaks`, `16 byte(s) leaked in 1 allocation(s)`, code 1 |
| `./bugs 4` : dépassement d'entier | affiche `-2147483647` | `runtime error: signed integer overflow: 2147483647 + 2 cannot be represented in type 'int'` |

Le compilateur voit aussi les cas évidents : avec `-Wall -Wextra`, `gcc` 12.4 prévient dès la compilation que `tab` est utilisé après `free` (`-Wuse-after-free`, ligne 17). ASan couvre ce que l'analyse du compilateur ne peut pas suivre, par exemple un pointeur libéré dans une autre fonction.

Le début du rapport d'ASan pour `./bugs 1` (raccourci) nomme la faute, l'endroit de l'écriture, puis l'endroit de l'allocation :

```
==10298==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x502000000020 ...
WRITE of size 4 at 0x502000000020 thread T0
    #0 0x586fed0cc470 in main bugs.c:13
0x502000000020 is located 0 bytes after 16-byte region [0x502000000010,0x502000000020)
allocated by thread T0 here:
    #0 0x718c5acfd9c7 in malloc ...
    #1 0x586fed0cc3ca in main bugs.c:8
```

Chaque ligne `#0`, `#1`... est un niveau de la **pile d'appels** (la liste des fonctions en cours d'exécution, de la plus récente à la plus ancienne). Le rapport dit ici : « 4 octets écrits juste après un bloc de 16 octets, alloué ligne 8 ».

**Le code de sortie** (la valeur que le programme renvoie à son lanceur, 0 pour « tout va bien » : voir [exit et les codes de retour](/?c=langages&s=c&p=exit-et-codes-de-retour)) n'est pas le même pour tous : ASan arrête le programme avec le code 1, mais UBSan **affiche son message et laisse le programme continuer**, avec le code 0. Mesuré : `UBSAN_OPTIONS=halt_on_error=1` donne le code 1 pour `./bugs 4`.

> **Piège :** un test automatique qui ne regarde que le code de sortie laisse passer toutes les erreurs d'UBSan. Soit on active `halt_on_error=1`, soit on cherche `runtime error` dans la sortie d'erreur (`stderr`, voir [les appels système et les descripteurs](/?c=langages&s=c&p=appels-systeme-et-descripteurs)).
>
> **Piège (la sortie du programme disparaît) :** quand LeakSanitizer constate une fuite, il termine le processus sans vider le [tampon](/?c=langages&s=bash&p=redirections-et-pipes) de `stdout`. Mesuré : un programme qui écrit 4 lignes avec `printf` puis fuit produit **0 octet** dans un fichier (`./programme > sortie.txt`), alors que les 4 lignes s'affichent dans un terminal. Un test qui compare la sortie à un résultat attendu voit alors une sortie vide et accuse le mauvais coupable : lire d'abord le rapport de LeakSanitizer sur `stderr`.

## Ce que ça coûte, et ce que ça ne voit pas

**valgrind** est l'autre grande famille : il exécute le programme dans une machine virtuelle qui surveille chaque accès mémoire, **sans recompiler** (`valgrind --leak-check=full ./bugs_plain 1`). Sur les trois premiers défauts il donne le même verdict qu'ASan (écriture invalide ligne 13, lecture invalide ligne 17, `16 bytes in 1 blocks are definitely lost`).

Un programme de test qui remplit un tableau de 32 Mio puis le parcourt 100 fois, mesuré sur un AMD Ryzen 7 6800H, trois mesures identiques :

| Exécution | Durée | Mémoire maximale | Facteur de durée |
|---|---|---|---|
| Sans outil | 0,23 s | 34 Mio | × 1 |
| ASan | 0,67 s | 42 Mio | × 2,9 |
| ASan + UBSan | 0,78 s | 44 Mio | × 3,4 |
| valgrind | 3,25 s | 87 Mio | × 14 |

Les facteurs dépendent du programme : celui-ci ne fait presque que des accès mémoire, justement ce que ces outils surveillent, donc le surcoût y est marqué. Chaque outil a aussi des angles morts :

| | ASan + UBSan (`gcc`) | valgrind | MSan (`clang -fsanitize=memory`) |
|---|---|---|---|
| Recompilation nécessaire | oui | non | oui |
| Écriture hors limites, `free` puis lecture, fuite | détecté | détecté | hors périmètre |
| Dépassement d'entier signé | détecté (message, le programme continue) | **non détecté** (mesuré : affiche `-2147483647`, code 0) | hors périmètre |
| Lecture d'une valeur **non initialisée** | **non détecté** (mesuré : code 0, aucun message) | détecté (`Conditional jump or move depends on uninitialised value(s)`) | détecté (`use-of-uninitialized-value`) |

> **Piège :** croire qu'un programme « propre sous ASan » est sans bug mémoire. Une valeur lue avant d'avoir été écrite (`malloc` ne met rien à zéro) passe sous ASan. Passer aussi sous valgrind, ou sous [MSan](https://clang.llvm.org/docs/MemorySanitizer.html) avec `clang` (qui ne se combine pas avec ASan : `clang: error: invalid argument '-fsanitize=address' not allowed with '-fsanitize=memory'`).
>
> **Bonne pratique :** sanitizers pendant le développement et en [intégration continue](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) (rapides), valgrind avant une livraison ou pour un programme qu'on ne peut pas recompiler.

## Limiter la mémoire d'un test sous ASan

Un test qui alloue beaucoup doit avoir un plafond de mémoire, pour qu'une erreur ne fasse pas ramer toute la machine (voir [les garde-fous de ressources](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). ASan impose deux précautions.

**`ulimit -v` ne s'utilise pas avec ASan.** Cette commande plafonne l'espace d'adresses virtuel du processus ; or ASan en réserve une très grande plage (environ 14 Tio) pour sa table de suivi. Mesuré avec `ulimit -v 1000000` (environ 1 Gio) :

```
==10351==ERROR: AddressSanitizer failed to allocate 0xdfff0001000 (15392894357504) bytes ... (errno: 12)
==10351==ReserveShadowMemoryRange failed while trying to map 0xdfff0001000 bytes. Perhaps you're using ulimit -v
```

Le programme n'a même pas démarré : ce n'est pas un bug du programme.

**`ASAN_OPTIONS=hard_rss_limit_mb=N`** arrête le programme quand sa mémoire réellement occupée (*RSS*, la mémoire physique utilisée) dépasse `N` Mio. Mesuré sur un programme qui alloue et remplit 10 Mio par tour :

| Limite demandée | Message | Mémoire au moment de l'arrêt |
|---|---|---|
| 200 Mio | `AddressSanitizer: hard rss limit exhausted (200Mb vs 249Mb)` | 249 Mio |
| 300 Mio | `AddressSanitizer: hard rss limit exhausted (300Mb vs 505Mb)` | 505 Mio |

La vérification est **périodique** : le programme continue d'allouer entre deux vérifications, donc la limite n'est pas un plafond strict (ici 505 Mio pour 300 demandés). Pour un plafond qui ne dépasse jamais, utiliser un groupe de contrôle du noyau (`systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0`), décrit dans le chapitre des garde-fous ; `hard_rss_limit_mb` reste utile pour obtenir un **message clair** plutôt qu'une mort silencieuse du processus.

## Injecter des échecs d'allocation

`malloc` renvoie `NULL` quand il n'y a plus de mémoire, et un programme correct doit alors tout libérer et signaler l'erreur. Mais `malloc` réussit presque toujours : ces chemins d'échec ne s'exécutent **jamais** pendant les tests, et un bug peut y rester des années. La technique consiste à faire échouer la **k-ième** allocation, pour k = 1, 2, 3... jusqu'à ce que tout réussisse.

L'option `--wrap=malloc` (passée à l'**éditeur de liens**, le programme qui assemble les fichiers compilés en un seul exécutable, avec `-Wl,` côté gcc) redirige tous les appels à `malloc` du programme vers une fonction `__wrap_malloc` écrite par soi, qui peut appeler le vrai `malloc` sous le nom `__real_malloc` ([documentation de `ld`](https://sourceware.org/binutils/docs/ld/Options.html)).

```c
#include <stdlib.h>

void	*__real_malloc(size_t size);            /* le vrai malloc, fourni par l'éditeur de liens */

static long	g_calls;                            /* nombre d'appels à malloc depuis le début */
static long	g_fail_at = -1;                     /* numéro de l'appel à faire échouer (-1 : aucun) */

void	set_fail_at(long k)
{
	g_calls = 0;
	g_fail_at = k;
}

void	*__wrap_malloc(size_t size)             /* appelé à la place de malloc */
{
	g_calls++;
	if (g_calls == g_fail_at)
		return (NULL);                          /* l'allocation numéro k « échoue » */
	return (__real_malloc(size));
}
```

Le programme testé copie deux chaînes dans une structure. La version `FIXED` libère ce qui a déjà été alloué quand une allocation échoue ; l'ancienne version oublie de le faire :

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void	set_fail_at(long k);

typedef struct s_pair
{
	char	*first;
	char	*second;
}	t_pair;

static char	*copy(const char *s)
{
	char	*p = malloc(strlen(s) + 1);

	if (p)
		strcpy(p, s);
	return (p);
}

/* Copie deux chaînes. Renvoie NULL si une allocation échoue. */
t_pair	*pair_new(const char *a, const char *b)
{
	t_pair	*pair = malloc(sizeof *pair);

	if (!pair)
		return (NULL);
	pair->first = copy(a);
	pair->second = copy(b);
	if (!pair->first || !pair->second)
	{
#ifdef FIXED
		free(pair->first);                      /* free(NULL) est permis */
		free(pair->second);
#endif
		free(pair);
		return (NULL);
	}
	return (pair);
}

int	main(void)
{
	for (long k = 1; k <= 4; k++)               /* 3 mallocs réussissent au plus : on teste k = 1..4 */
	{
		t_pair	*p;

		set_fail_at(k);
		p = pair_new("bonjour", "monde");
		printf("k=%ld : %s\n", k, p ? "succès" : "échec géré");
		if (p)
		{
			free(p->first);
			free(p->second);
			free(p);
		}
	}
	return (0);
}
```

```bash
gcc -g -fsanitize=address -Wl,--wrap=malloc pair.c wrap.c -o pair_bug
gcc -g -fsanitize=address -Wl,--wrap=malloc -DFIXED pair.c wrap.c -o pair_ok
```

| Version | Résultat mesuré |
|---|---|
| Ancienne (sans libération) | `ERROR: LeakSanitizer`, `Direct leak of 8 byte(s)` et `Direct leak of 6 byte(s)`, `14 byte(s) leaked in 2 allocation(s)`, code 1 |
| Corrigée | `k=1 : échec géré`, `k=2 : échec géré`, `k=3 : échec géré`, `k=4 : succès`, code 0 |

Les deux fuites correspondent aux deux cas où une copie réussit et l'autre échoue : `k=2` (la copie de `"bonjour"` échoue, celle de `"monde"`, 6 octets, fuit) et `k=3` (celle de `"monde"` échoue, celle de `"bonjour"`, 8 octets avec le `\0`, fuit). Sans cette injection, ces deux chemins ne s'exécutent jamais, et ASan ne peut rien dire d'un code qu'on ne lance pas.

Le wrapper ne voit que les appels à `malloc` **écrits dans le code lié par soi**. Mesuré : après un `strdup("bonjour")` (qui appelle `malloc` à l'intérieur de la bibliothèque C), le compteur du wrapper vaut 0 ; après un `malloc(8)` du programme, il vaut 1. Les allocations internes de `printf` ou de `strdup` ne sont donc pas comptées, et ne sont pas non plus testées : pour tester l'échec d'un `strdup`, écrire sa propre `copy` avec `malloc`, comme ci-dessus.

| Technique | Ce qu'elle touche | Limite |
|---|---|---|
| `-Wl,--wrap=malloc` | Seulement les appels à `malloc` du programme lié | Doit être recompilé et lié avec le wrapper |
| `LD_PRELOAD=./libfail.so` (bibliothèque qui remplace `malloc` pour tout le processus) | **Tous** les `malloc`, bibliothèque C comprise, sans recompiler | Touche aussi les outils lancés avec la variable |

> **Piège (`LD_PRELOAD`) :** la variable d'environnement est héritée par chaque processus lancé ensuite. Mesuré avec une bibliothèque qui fait échouer la deuxième allocation du processus : `LD_PRELOAD=./libfail.so valgrind -q true` s'arrête avec `sh: 0: Out of space` et le code 2, tout comme `LD_PRELOAD=./libfail.so sh -c 'echo ok'` : le shell et l'outil lancés subissent l'échec à la place du programme testé. Mettre la variable uniquement devant la commande du programme testé, jamais exportée, et préférer `--wrap` quand on peut recompiler.

## Valider l'outil de test sur l'ancien code défectueux

Un test qui n'a jamais échoué ne prouve rien : on ne sait pas s'il sait détecter le défaut. Avant de lui faire confiance, on le lance sur **l'ancien code défectueux connu** : il doit le condamner. C'est le principe des [tests de mutation](/?c=tests&p=tests-de-mutation), appliqué ici à la main.

L'exemple teste une fonction qui lit un entier positif de 1 à 9 chiffres. L'ancien code accepte la chaîne vide et ne limite pas la longueur ; le nouveau code corrige les deux. Le banc compare chaque version à une **référence indépendante** (écrite autrement, avec [`strtol`](https://man7.org/linux/man-pages/man3/strtol.3.html)) sur les mêmes entrées, selon le [test différentiel](/?c=tests&p=property-based-testing#un-cas-voisin-le-test-differentiel) :

```c
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef int	(*t_parse)(const char *s, int *out);

/* Ancien code : accepte la chaîne vide (aucun chiffre lu, valeur 0). */
static int	parse_old(const char *s, int *out)
{
	long	v = 0;

	for (; *s >= '0' && *s <= '9'; s++)
		v = v * 10 + (*s - '0');
	if (*s)
		return (-1);
	*out = (int)v;
	return (0);
}

/* Nouveau code : au moins un chiffre, 9 chiffres au plus, rien d'autre. */
static int	parse_new(const char *s, int *out)
{
	size_t	len = strspn(s, "0123456789");

	if (len == 0 || len > 9 || s[len] != '\0')
		return (-1);
	*out = atoi(s);
	return (0);
}

/* Référence indépendante : strtol, avec toutes les vérifications. */
static int	reference(const char *s, int *out)
{
	char	*end;
	long	v;

	if (s[0] < '0' || s[0] > '9' || strlen(s) > 9)
		return (-1);
	errno = 0;
	v = strtol(s, &end, 10);
	if (errno || *end)
		return (-1);
	*out = (int)v;
	return (0);
}

/* Renvoie 1 si l'implémentation et la référence divergent sur cette entrée. */
static int	differs(t_parse impl, const char *s)
{
	int	a = -1, b = -1;
	int	ra = impl(s, &a), rb = reference(s, &b);

	return (ra != rb || (ra == 0 && a != b));
}
```

Le banc fait trois choses : un **balayage exhaustif** (toutes les chaînes de 0 à 4 caractères prises dans `05- a`, soit 781 entrées), un **fuzz** (100 000 chaînes aléatoires de 0 à 12 caractères, voir [les outils de fuzzing](/?c=securite&s=securite-offensive&p=outils-de-fuzzing)) et la **relecture des cas déjà fautifs**, conservés dans des fichiers `regress/1.txt`, `regress/2.txt`... Le générateur aléatoire est un [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible) à graine fixe : les mêmes entrées reviennent à chaque lancement, donc un échec se reproduit.

```c
static unsigned	g_state = 2463534242u;           /* état du générateur xorshift32 */

static unsigned	next_random(void)
{
	g_state ^= g_state << 13;
	g_state ^= g_state >> 17;
	g_state ^= g_state << 5;
	return (g_state);
}

/* Écrit l'entrée fautive dans regress/<n>.txt, sauf si une entrée identique est déjà conservée. */
static void	save_regression(const char *s, int *saved, char kept[][13])
{
	char	path[64];
	FILE	*f;

	for (int i = 0; i < *saved; i++)
		if (strcmp(kept[i], s) == 0)
			return ;
	if (*saved == 3)
		return ;
	strcpy(kept[*saved], s);
	snprintf(path, sizeof path, "regress/%d.txt", ++*saved);
	f = fopen(path, "w");
	if (!f)
		return ;
	fputs(s, f);
	fclose(f);
}

/* Rejoue les entrées conservées (regress/1.txt, 2.txt...) : renvoie le nombre de divergences. */
static int	replay(t_parse impl, const char *name)
{
	char	path[64], buf[13];
	int		files = 0, bad = 0;

	for (int n = 1; n <= 3; n++)
	{
		snprintf(path, sizeof path, "regress/%d.txt", n);
		FILE	*f = fopen(path, "r");

		if (!f)
			break ;
		size_t	len = fread(buf, 1, sizeof buf - 1, f);

		buf[len] = '\0';
		fclose(f);
		files++;
		bad += differs(impl, buf);
	}
	printf("%s : %d entrées conservées rejouées, %d divergences\n", name, files, bad);
	return (bad);
}

/* Balayage exhaustif : toutes les chaînes de 0 à 4 caractères de l'alphabet. */
static int	sweep(t_parse impl, const char *name)
{
	static const char	alphabet[] = "05- a";
	char				buf[5];
	int					tested = 0, bad = 0;

	for (int len = 0; len <= 4; len++)
	{
		int	total = 1;

		for (int i = 0; i < len; i++)
			total *= 5;
		for (int n = 0; n < total; n++)
		{
			for (int i = 0, m = n; i < len; i++, m /= 5)
				buf[i] = alphabet[m % 5];
			buf[len] = '\0';
			tested++;
			if (differs(impl, buf) && bad++ == 0)
				printf("%s : première divergence sur \"%s\"\n", name, buf);
		}
	}
	printf("%s : balayage %d entrées, %d divergences\n", name, tested, bad);
	return (bad);
}

/* Fuzz : chaînes aléatoires de 0 à 12 caractères, divergence conservée dans regress/. */
static int	fuzz(t_parse impl, const char *name, int rounds)
{
	static const char	alphabet[] = "0123456789- a";
	char				buf[13], kept[3][13];
	int					bad = 0, saved = 0;

	for (int r = 0; r < rounds; r++)
	{
		int	len = next_random() % 13;

		for (int i = 0; i < len; i++)
			buf[i] = alphabet[next_random() % (sizeof alphabet - 1)];
		buf[len] = '\0';
		if (differs(impl, buf))
		{
			bad++;
			save_regression(buf, &saved, kept);
		}
	}
	printf("%s : fuzz %d tirages, %d divergences\n", name, rounds, bad);
	return (bad);
}

int	main(void)
{
	int	bad_old = sweep(parse_old, "ancien") + fuzz(parse_old, "ancien", 100000);
	int	bad_new;

	replay(parse_old, "ancien");
	bad_new = replay(parse_new, "nouveau") + sweep(parse_new, "nouveau")
		+ fuzz(parse_new, "nouveau", 100000);

	printf("outil validé sur l'ancien code : %s\n", bad_old ? "oui (il le condamne)" : "NON");
	return (bad_new != 0);
}
```

Sortie mesurée (les fichiers `regress/` doivent exister avant le lancement ; `mkdir regress`) :

```
ancien : première divergence sur ""
ancien : balayage 781 entrées, 1 divergences
ancien : fuzz 100000 tirages, 8873 divergences
ancien : 3 entrées conservées rejouées, 3 divergences
nouveau : 3 entrées conservées rejouées, 0 divergences
nouveau : balayage 781 entrées, 0 divergences
nouveau : fuzz 100000 tirages, 0 divergences
outil validé sur l'ancien code : oui (il le condamne)
```

Trois enseignements :

- **Le banc condamne l'ancien code** (1 divergence au balayage, 8 873 au fuzz) et acquitte le nouveau (0 partout) : on sait que les deux verdicts ont un sens.
- **Le balayage exhaustif n'a vu qu'un des deux défauts.** Il s'arrête à 4 caractères, donc la chaîne vide (`""`) est trouvée, mais jamais le défaut des nombres trop longs. Le fuzz, qui monte à 12 caractères, trouve les chaînes de 10 chiffres et plus (`regress/2.txt` contient `3582159301`) : l'ancien code les lit dans un `long` puis les tronque dans un `int`, et la référence les refuse. Un balayage exhaustif ne couvre que ce que son alphabet et sa longueur maximale permettent.
- **Chaque échec trouvé par le fuzz devient un test permanent.** Les fichiers `regress/*.txt` sont rejoués en premier à chaque lancement : le défaut ne peut plus revenir sans que le banc le signale.

> **Piège :** une référence qui partage le raisonnement du code testé (même `strspn`, même bug) donne toujours raison au code. Écrire la référence autrement, ou la prendre dans une fonction de la bibliothèque standard.
>
> **Piège :** comparer le nouveau code à l'ancien seulement, sans référence : si les deux se trompent de la même façon, aucune divergence n'apparaît.

## Les faux positifs de l'outil de test

Un **faux positif** est une alerte qui accuse du code correct : le défaut est dans l'outil de test, pas dans le programme. Avant de corriger quoi que ce soit, **confirmer l'alerte sur l'ancien code** : relancer le même test sur la version d'avant ([`git stash`](/?c=qualite-performance-et-outils&s=git&p=stash), ou [`git worktree add ../avant <commit>`](/?c=qualite-performance-et-outils&s=git&p=worktree)). Si l'alerte apparaît aussi sur l'ancien code, elle ne vient pas de la modification, et c'est souvent l'outil qui se trompe. Dans une revue réelle d'un programme graphique, 7 alertes sur 7 venaient de l'outil de test, aucune du programme.

| Cause du faux positif | Symptôme | Parade |
|---|---|---|
| Le vérificateur compare des **numéros** (de sommets, d'identifiants) | Deux objets identiques sont déclarés différents dès qu'on les renumérote | Comparer le contenu (coordonnées, valeurs), dans un ordre canonique |
| Le test lit une valeur **avant** l'appel qui la modifie | Valeur attendue absente | Lire après l'appel |
| L'outil est **recompilé pendant qu'une série tourne** | Une série mélange les résultats de deux versions | Ne jamais relancer la compilation pendant une série ; compiler dans un autre dossier puis remplacer |
| Un **curseur de souris** apparaît dans une capture d'écran | La boîte englobante de l'image est fausse | `ffmpeg -draw_mouse 0` (voir [mesurer ce que l'application affiche](/?c=infrastructure-devops&s=administration-systeme&p=touche-coincee-clavier-virtuel-xtest)) |
| Un effet **pulse** (luminosité qui varie) | Deux captures de la même scène diffèrent | Normaliser la luminosité de chaque image avant de comparer |

**Comparer des numéros.** Deux maillages (un carré fait de deux triangles) identiques, le second avec ses sommets renumérotés :

```python
# Deux maillages identiques : le second est renuméroté (les sommets sont dans un autre ordre).
sommets_a = [(0, 0), (1, 0), (0, 1), (1, 1)]            # sommet numéro 0, 1, 2, 3
triangles_a = [(0, 1, 2), (1, 3, 2)]                    # chaque triangle cite des numéros

ordre = [2, 0, 3, 1]                                    # ordre[j] : ancien sommet placé à la position j
sommets_b = [sommets_a[i] for i in ordre]
nouveau_numero = {ancien: nouveau for nouveau, ancien in enumerate(ordre)}
triangles_b = [tuple(nouveau_numero[i] for i in t) for t in triangles_a]

# Vérificateur fragile : compare les numéros de sommets.
print("par numéros     :", "identiques" if triangles_a == triangles_b else "DIFFÉRENTS (faux positif)")

# Vérificateur robuste : compare les coordonnées, dans un ordre canonique.
def forme(sommets, triangles):
    return sorted(tuple(sorted(sommets[i] for i in t)) for t in triangles)

print("par coordonnées :", "identiques" if forme(sommets_a, triangles_a) == forme(sommets_b, triangles_b) else "DIFFÉRENTS")
```

```
par numéros     : DIFFÉRENTS (faux positif)
par coordonnées : identiques
```

**Lire avant l'appel.** Le test fragile garde la valeur d'avant ; le test correct la lit après :

```c
#include <stdio.h>

static int	g_count;                            /* compteur modifié par la fonction testée */

static void	register_item(void)
{
	g_count++;
}

int	main(void)
{
	int	avant = g_count;                        /* lu AVANT l'appel : vaut 0 */

	register_item();
	printf("test fragile : g_count vaut %d, attendu 1 : %s\n", avant, avant == 1 ? "ok" : "ÉCHEC (faux positif)");
	printf("test correct : g_count vaut %d, attendu 1 : %s\n", g_count, g_count == 1 ? "ok" : "ÉCHEC");
	return (0);
}
```

```
test fragile : g_count vaut 0, attendu 1 : ÉCHEC (faux positif)
test correct : g_count vaut 1, attendu 1 : ok
```

**Recompiler pendant une série.** Une série de 6 lancements espacés de 0,3 s ; l'outil est recompilé (version 2) puis remplacé par `mv` après 0,7 s :

```bash
gcc -DVERSION='"outil v1"' tool.c -o tool                  # première version de l'outil
( for i in 1 2 3 4 5 6; do ./tool; sleep 0.3; done ) > serie.txt &   # série lancée en arrière-plan
sleep 0.7
gcc -DVERSION='"outil v2"' tool.c -o tool.new && mv tool.new tool    # recompilation pendant la série
wait; cat serie.txt
```

```
outil v1
outil v1
outil v1
outil v2
outil v2
outil v2
```

Aucune erreur, aucun avertissement : l'éditeur de liens ou `mv` remplacent le fichier même s'il est en cours d'utilisation. La série contient les résultats de deux outils différents, et l'écart observé entre les 3 premiers et les 3 derniers lancements ne dit rien du programme testé.

**Normaliser la luminosité.** Un programme dont le rendu pulse (luminosité qui monte et descend) produit deux captures différentes de la même scène. Simulation sur une image de 16 pixels, une fois à pleine luminosité, une fois à 0,6 ; la normalisation divise chaque pixel par la moyenne de l'image :

```python
def image(luminosite):
    """Image 4 x 4 : un motif fixe multiplié par la luminosité du moment."""
    motif = [[(x + 2 * y) % 5 + 1 for x in range(4)] for y in range(4)]
    return [[round(v * luminosite * 40) for v in ligne] for ligne in motif]

def a_plat(img):
    return [v for ligne in img for v in ligne]

def ecart_max(a, b):
    return max(abs(p - q) for p, q in zip(a_plat(a), a_plat(b)))

def normaliser(img):
    moyenne = sum(a_plat(img)) / 16
    return [[v / moyenne for v in ligne] for ligne in img]

def ecart_max_normalise(a, b):
    return max(abs(p - q) for p, q in zip(a_plat(normaliser(a)), a_plat(normaliser(b))))

clair = image(1.0)                                  # scène à pleine luminosité
sombre = image(0.6)                                 # même scène, 0,6 fois plus sombre
print("écart maximal brut        :", ecart_max(clair, sombre), "niveaux sur 255")
print("écart maximal normalisé   :", round(ecart_max_normalise(clair, sombre), 4))
```

```
écart maximal brut        : 80 niveaux sur 255
écart maximal normalisé   : 0.0
```

L'écart brut (80 niveaux sur 255) ferait échouer un test de comparaison alors que la scène est identique ; après normalisation il tombe à 0. Sur de vraies captures, l'écart ne tombe pas exactement à 0 (bruit de compression, arrondis) : fixer un seuil de tolérance mesuré sur deux captures de la même scène.

> **Piège :** corriger le programme avant d'avoir confirmé l'alerte sur l'ancien code. On « répare » un défaut qui n'existe pas, et on peut en introduire un vrai.
>
> **Piège :** valider l'outil seulement sur du code correct. Il doit aussi condamner un code défectueux connu (section précédente) : sinon il peut se taire par défaut et ne rien détecter.
>
> **Bonne pratique :** pour toute alerte inattendue, trois questions dans l'ordre : l'outil a-t-il changé ? l'alerte existe-t-elle sur l'ancien code ? que dit une comparaison faite autrement (contenu plutôt que numéros, après normalisation) ?

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un bug mémoire en C passe souvent inaperçu : `-fsanitize=address,undefined` (ASan : accès hors limites et utilisation après `free` ; LeakSanitizer : fuites ; UBSan : comportement indéfini) les rend visibles pour un coût d'environ ×3 en durée et ×1,2 en mémoire, contre ×14 et ×2,6 pour valgrind. Faire échouer la k-ième `malloc` (`-Wl,--wrap=malloc`) exécute les chemins d'échec qu'aucun test normal n'atteint. Un outil de test se valide en le lançant sur du code défectueux connu, et une alerte se confirme sur l'ancien code avant d'accuser le nouveau. |
| **Outils utilisables** | `gcc`/`clang` avec `-fsanitize=address,undefined -g -fno-omit-frame-pointer` ; `UBSAN_OPTIONS=halt_on_error=1` ; `valgrind --leak-check=full` ; MSan (`clang -fsanitize=memory`) pour les valeurs non initialisées ; `ASAN_OPTIONS=hard_rss_limit_mb=N` ; `systemd-run ... -p MemoryMax=...` ; `-Wl,--wrap=malloc` ; un banc balayage exhaustif + fuzz à graine fixe + entrées conservées dans `regress/`. |
| **Pièges à éviter** | `ulimit -v` avec ASan (le programme ne démarre pas) ; ne regarder que le code de sortie (UBSan continue, code 0) ; croire un programme « propre sous ASan » sans valeur non initialisée (ASan ne la voit pas) ; la sortie de `stdout` perdue quand LeakSanitizer termine le processus ; `LD_PRELOAD` exporté qui casse les outils lancés ensuite ; une référence qui partage le bug du code ; comparer des numéros plutôt que le contenu ; recompiler l'outil pendant une série ; lire une valeur avant l'appel qui la modifie ; ne valider un test que sur du code correct. |
| **Bonnes pratiques** | Sanitizers en développement et en intégration continue, valgrind avant livraison ; injecter l'échec de chaque allocation (k = 1, 2, 3...) et vérifier fuite et message ; lancer l'outil de test sur l'ancien code défectueux avant de lui faire confiance ; garder chaque échec du fuzz comme test permanent ; confirmer toute alerte inattendue sur l'ancien code ; comparer le contenu et normaliser ce qui varie (luminosité) avant de comparer deux rendus. |
