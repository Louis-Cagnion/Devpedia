---
order: 12
---

# Un contexte de travail pour découper une grosse fonction

Une fonction qui fait tout (ouvrir un fichier, lire chaque ligne, convertir, allouer, ranger, nettoyer en cas d'erreur) finit longue, et chaque sortie d'erreur y répète le même nettoyage. Ce chapitre montre comment la découper sans que les sous-fonctions se retrouvent avec une liste de six paramètres, en regroupant ce qu'elles partagent dans une **structure** passée par pointeur : un **contexte de travail**. Une **structure** (`struct`) est un type qui regroupe plusieurs variables sous un même nom ; on lui passe l'adresse (un [pointeur](/?c=langages&s=c&p=pointeurs)) pour que toutes les fonctions voient la même.

Le chapitre [Responsabilité unique et faible couplage](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) explique **quand** scinder ; celui-ci montre **comment**, sur un exemple exécuté, avec l'injection d'échecs d'allocation du chapitre [Sanitizers et tests d'allocation](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) pour prouver que chaque sortie nettoie tout.

## L'exemple : charger un fichier de personnes

Le fichier contient une personne par ligne, au format `nom;âge;ville` (`Ada;36;Londres`). La fonction `load_people` renvoie un tableau de personnes, ou `NULL` avec un message qui nomme le fichier, la ligne et la cause. Un fichier est ouvert avec [`fopen` et lu ligne à ligne avec `fgets`](/?c=langages&s=c&p=lecture-de-fichiers) ; l'âge est converti avec [`strtol` et ses vérifications](/?c=langages&s=c&p=convertir-un-texte-en-nombre).

```c
#ifndef PEOPLE_H
# define PEOPLE_H
# include <stddef.h>

typedef struct s_person
{
	char	*name;
	char	*city;
	int		age;
}	t_person;

/* Lit un fichier de lignes « nom;age;ville ». Renvoie NULL en cas d'erreur. */
t_person	*load_people(const char *path, size_t *count);
void		free_people(t_person *people, size_t count);

#endif
```

## La version d'origine : une seule fonction

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

static char	*copy_n(const char *s, size_t n)
{
	char	*p = malloc(n + 1);

	if (p)
	{
		memcpy(p, s, n);
		p[n] = '\0';
	}
	return (p);
}

void	free_people(t_person *people, size_t count)
{
	for (size_t i = 0; i < count; i++)
	{
		free(people[i].name);
		free(people[i].city);
	}
	free(people);
}

t_person	*load_people(const char *path, size_t *count)
{
	FILE		*file = fopen(path, "r");
	t_person	*people = NULL, *grown;
	size_t		capacity = 0;
	char		line[256], *sep1, *sep2, *end, *name, *city;
	int			line_no = 0;
	long		age;

	*count = 0;
	if (!file)
	{
		fprintf(stderr, "%s: cannot open\n", path);
		return (NULL);
	}
	while (fgets(line, sizeof line, file))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		sep1 = strchr(line, ';');
		sep2 = sep1 ? strchr(sep1 + 1, ';') : NULL;
		if (!sep2)
		{
			fprintf(stderr, "%s:%d: missing separator\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (sep1 == line)
		{
			fprintf(stderr, "%s:%d: empty name\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		age = strtol(sep1 + 1, &end, 10);
		if (end != sep2 || end == sep1 + 1 || age < 0 || age > 150)
		{
			fprintf(stderr, "%s:%d: invalid age\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (sep2[1] == '\0')
		{
			fprintf(stderr, "%s:%d: empty city\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		name = copy_n(line, sep1 - line);
		if (!name)
		{
			fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		city = copy_n(sep2 + 1, strlen(sep2 + 1));
		if (!city)
		{
			fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
			free(name);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (*count == capacity)
		{
			capacity = capacity ? capacity * 2 : 2;
			grown = malloc(capacity * sizeof *grown);
			if (!grown)
			{
				fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
				free_people(people, *count);
				fclose(file);
				*count = 0;
				return (NULL);
			}
			if (*count)
				memcpy(grown, people, *count * sizeof *grown);
			free(people);
			people = grown;
		}
		people[*count].name = name;
		people[*count].city = city;
		people[*count].age = (int)age;
		(*count)++;
	}
	fclose(file);
	return (people);
}
```

`load_people` fait 98 lignes. Chaque `return (NULL)` précédé de `free_people(people, *count); fclose(file); *count = 0;` : **sept** blocs de nettoyage quasi identiques. Quand le code est copié sept fois, une copie finit par différer des autres : ici, celle de l'échec d'agrandissement du tableau (en bas) oublie de libérer `name` et `city`, que la copie de l'échec sur `city` libérait, elle (`free(name)`).

## Les deux fausses solutions

**Découper sans contexte.** Chaque étape devient une fonction, qui reçoit tout ce dont elle a besoin et renvoie ses résultats par pointeur :

```c
static int	parse_line(const char *line, const char *path, int line_no,
				char **name, int *age, char **city);
```

Six paramètres, dont trois qui ne servent qu'à écrire le message d'erreur ; l'appelant doit encore libérer `name` et `city` si l'étape suivante échoue : le nettoyage reste dispersé, et chaque nouvelle donnée allonge toutes les signatures.

**Des variables globales.** Elles évitent les paramètres, mais deux chargements en même temps (deux [threads](/?c=langages&s=c&p=threads), ou un chargement lancé depuis un chargement) écrasent leurs données mutuellement, et rien dans la signature ne dit que la fonction en dépend.

| Approche | Paramètres de chaque sous-fonction | Nettoyage | Limite |
|---|---|---|---|
| Une seule fonction | aucun (tout en variables locales) | dupliqué à chaque sortie (7 fois ici) | une copie oubliée = une fuite |
| Sous-fonctions sans contexte | 6 | dispersé chez chaque appelant | chaque donnée ajoutée change toutes les signatures |
| Variables globales | aucun | un seul endroit | non réentrant, dépendance invisible |
| **Contexte passé par pointeur** | **1** | **un seul endroit** | demande une règle de propriété (voir plus bas) |

## Le contexte de travail

On regroupe dans une structure tout ce qui vit pendant le chargement : le fichier, son chemin, la ligne en cours, les champs en cours de lecture (pas encore rangés), le tableau et sa taille. Une variable `t_job job` est créée une fois dans `load_people` ; les sous-fonctions reçoivent `&job`.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

typedef struct s_job
{
	FILE		*file;
	const char	*path;
	int			line_no;
	char		line[256];
	char		*name;
	char		*city;
	int			age;
	t_person	*people;
	size_t		count;
	size_t		capacity;
}	t_job;

static char	*copy_n(const char *s, size_t n)
{
	char	*p = malloc(n + 1);

	if (p)
	{
		memcpy(p, s, n);
		p[n] = '\0';
	}
	return (p);
}

void	free_people(t_person *people, size_t count)
{
	for (size_t i = 0; i < count; i++)
	{
		free(people[i].name);
		free(people[i].city);
	}
	free(people);
}
```

Le point central est **une seule fonction de sortie d'erreur**, qui libère tout ce que le contexte possède, quel que soit l'endroit où l'on en est :

```c
/* Signale la cause, libère TOUT ce que la tâche possède, renvoie -1. */
static int	fail_job(t_job *job, const char *cause)
{
	if (job->line_no)
		fprintf(stderr, "%s:%d: %s\n", job->path, job->line_no, cause);
	else
		fprintf(stderr, "%s: %s\n", job->path, cause);
	free(job->name);
	free(job->city);
	free_people(job->people, job->count);
	if (job->file)
		fclose(job->file);
	return (-1);
}
```

Cette fonction peut tout libérer sans savoir où l'on en est, parce que `free(NULL)` est permis (il ne fait rien) et que le contexte démarre **entièrement à zéro** (`t_job job = {0}` plus bas) : un champ pas encore rempli vaut `NULL`.

Les étapes deviennent de petites fonctions qui prennent le contexte et renvoient 0 (réussi) ou -1 (échec déjà signalé et nettoyé) :

```c
/* Découpe job->line en nom, âge et ville (copies dans job->name et job->city). */
static int	split_line(t_job *job)
{
	char	*sep1, *sep2, *end;
	long	age;

	job->line[strcspn(job->line, "\n")] = '\0';
	sep1 = strchr(job->line, ';');
	sep2 = sep1 ? strchr(sep1 + 1, ';') : NULL;
	if (!sep2)
		return (fail_job(job, "missing separator"));
	if (sep1 == job->line)
		return (fail_job(job, "empty name"));
	age = strtol(sep1 + 1, &end, 10);
	if (end != sep2 || end == sep1 + 1 || age < 0 || age > 150)
		return (fail_job(job, "invalid age"));
	if (sep2[1] == '\0')
		return (fail_job(job, "empty city"));
	job->name = copy_n(job->line, sep1 - job->line);
	job->city = copy_n(sep2 + 1, strlen(sep2 + 1));
	job->age = (int)age;
	if (!job->name || !job->city)
		return (fail_job(job, "out of memory"));
	return (0);
}

/* Range la personne en cours dans le tableau, agrandi par doublement au besoin. */
static int	store_person(t_job *job)
{
	t_person	*grown;

	if (job->count == job->capacity)
	{
		job->capacity = job->capacity ? job->capacity * 2 : 2;
		grown = malloc(job->capacity * sizeof *grown);
		if (!grown)
			return (fail_job(job, "out of memory"));
		if (job->count)
			memcpy(grown, job->people, job->count * sizeof *grown);
		free(job->people);
		job->people = grown;
	}
	job->people[job->count].name = job->name;
	job->people[job->count].city = job->city;
	job->people[job->count].age = job->age;
	job->count++;
	job->name = NULL;                               /* le tableau en est propriétaire */
	job->city = NULL;
	return (0);
}

t_person	*load_people(const char *path, size_t *count)
{
	t_job	job = {0};

	*count = 0;
	job.path = path;
	job.file = fopen(path, "r");
	if (!job.file)
		return (fail_job(&job, "cannot open"), NULL);
	while (fgets(job.line, sizeof job.line, job.file))
	{
		job.line_no++;
		if (split_line(&job) || store_person(&job))
			return (NULL);
	}
	fclose(job.file);
	*count = job.count;
	return (job.people);
}
```

La règle de **propriété** tient dans deux lignes de `store_person` : tant que `name` et `city` sont dans le contexte, c'est lui qui les libère ; une fois rangés dans le tableau, c'est le tableau, et le contexte les remet à `NULL` pour ne pas les libérer deux fois.

Mesuré sur les deux versions (`gcc` 12.4) :

| | Version d'origine | Avec contexte |
|---|---|---|
| `load_people` | 98 lignes | 19 lignes |
| Autres fonctions | aucune | `split_line` 24, `store_person` 23, `fail_job` 13 |
| Blocs de nettoyage dupliqués | 7 | 1 (`fail_job`) |
| Paramètres de chaque étape | | 1 (`t_job *job`) |

Le plafond de longueur retenu pour une fonction est de 100 lignes : l'originale (98) passe de justesse, et ce n'est pas la longueur qui était le défaut, mais les sept sorties à nettoyer. Le plafond est un **garde-fou** qui force à se poser la question, pas un but.

## Prouver que chaque sortie nettoie tout

Le banc suivant écrit quatre fichiers (un valide de 5 lignes, trois invalides), puis fait **échouer la k-ième allocation** pour k = 1, 2, 3... jusqu'à ce que le chargement du fichier valide réussisse (technique `--wrap=malloc` du chapitre [Sanitizers et tests d'allocation](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#injecter-des-echecs-d-allocation), fichier `wrap.c` identique). Les trois fichiers invalides vérifient que chaque cause de refus nettoie.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

void	set_fail_at(long k);

static void	write_file(const char *path, const char *text)
{
	FILE	*f = fopen(path, "w");

	fputs(text, f);
	fclose(f);
}

/* Fait échouer la 1re, 2e, 3e... allocation jusqu'à ce que le chargement réussisse. */
static void	inject_failures(const char *path)
{
	size_t		count;
	t_person	*people;
	long		k = 1;

	for (;; k++)
	{
		set_fail_at(k);
		people = load_people(path, &count);
		if (people)
			break ;
		if (k > 50)
			return ((void)puts("trop d'échecs"));
	}
	set_fail_at(-1);
	printf("%s : %ld échecs injectés, tous gérés ; le suivant réussit (%zu personnes)\n",
		path, k - 1, count);
	free_people(people, count);
}

static void	invalid_file(const char *path)
{
	size_t		count;
	t_person	*people;

	set_fail_at(-1);
	people = load_people(path, &count);
	printf("%s : %s (%zu personnes)\n", path, people ? "chargé" : "refusé", count);
	free_people(people, count);
}

int	main(void)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* sortie non tamponnée : pas perdue par LeakSanitizer */
	write_file("ok.txt", "Ada;36;Londres\nAlan;41;Wilmslow\nGrace;85;Arlington\n"
		"Linus;55;Portland\nMargaret;87;Boston\n");
	write_file("sep.txt", "Ada;36;Londres\nAlan 41 Wilmslow\n");
	write_file("age.txt", "Ada;36;Londres\nAlan;abc;Wilmslow\n");
	write_file("name.txt", "Ada;36;Londres\n;41;Wilmslow\n");
	inject_failures("ok.txt");
	invalid_file("sep.txt");
	invalid_file("age.txt");
	invalid_file("name.txt");
	invalid_file("absent.txt");
	return (0);
}
```

```bash
# people_old.c : version d'origine ; people_new.c : version avec contexte
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_old.c wrap.c -o test_old
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_new.c wrap.c -o test_new
./test_old 2> log_old.txt; echo "code de sortie : $?"
./test_new 2> log_new.txt; echo "code de sortie : $?"
```

`setvbuf(stdout, NULL, _IONBF, 0)` supprime le tampon de `stdout` : sans lui, une fuite détectée par LeakSanitizer ferait [disparaître la sortie](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#les-sanitizers-ce-qu-ils-verifient) d'un programme redirigé vers un fichier. Les messages d'erreur du programme et les rapports d'ASan vont tous deux sur `stderr`, donc dans `log_old.txt` et `log_new.txt`.

Sortie standard, identique pour les deux versions :

```
ok.txt : 13 échecs injectés, tous gérés ; le suivant réussit (5 personnes)
sep.txt : refusé (0 personnes)
age.txt : refusé (0 personnes)
name.txt : refusé (0 personnes)
absent.txt : refusé (0 personnes)
```

| | Version d'origine | Avec contexte |
|---|---|---|
| Code de sortie | 1 | 0 |
| Dans le journal d'erreurs | `Direct leak of 25 byte(s) in 3 object(s)`, `Direct leak of 19 byte(s) in 3 object(s)`, `SUMMARY: AddressSanitizer: 44 byte(s) leaked in 6 allocation(s)` | aucun rapport |
| Messages de refus | `sep.txt:2: missing separator`, `age.txt:2: invalid age`, `name.txt:2: empty name`, `absent.txt: cannot open` | les mêmes |

Les trois chargements de la version d'origine où l'agrandissement du tableau échoue (à la 1re, la 3e et la 5e personne) laissent fuir le nom et la ville en cours : 3 noms (4 + 6 + 9 = 19 octets) et 3 villes (8 + 10 + 7 = 25 octets), soit 6 blocs et 44 octets. C'est exactement la copie du nettoyage qui diffère des autres. Dans la version avec contexte, ce chemin passe par `fail_job`, qui libère `job->name` et `job->city` sans se poser la question.

## Les pièges

Deux erreurs de discipline, mesurées sur la version avec contexte :

| Erreur | Ce qui se passe (mesuré) |
|---|---|
| Oublier de remettre `job->name` et `job->city` à `NULL` après `store_person` | Un échec à la ligne suivante libère les deux champs une première fois par le tableau, une seconde par `fail_job` : `ERROR: AddressSanitizer: attempting double-free` |
| Écrire `t_job job;` au lieu de `t_job job = {0};` | Les champs contiennent ce que la pile contenait. Cette exécution, sous ASan et UBSan : **aucun rapport**, tout passe (la pile valait zéro par hasard). Sous valgrind : `Conditional jump or move depends on uninitialised value(s)`, puis `Use of uninitialised value of size 8` |

> **Piège :** un contexte non initialisé peut passer tous les tests sous ASan, pendant que `fail_job` appelle `free` sur un champ qui contient une valeur au hasard. Initialiser à zéro à la déclaration, sans exception.
>
> **Piège :** un contexte « fourre-tout » où l'on range tout ce qu'on veut partager entre des tâches différentes (le fichier d'un chargement, les réglages de l'application, un compteur d'affichage) : il redevient un ensemble de variables globales. Un contexte par **tâche**, créé au début et détruit à la fin de cette tâche.
>
> **Piège :** découper pour atteindre un plafond de lignes sans regarder le nettoyage. Une fonction courte avec sept `return` qui nettoient chacun à leur façon reste fragile.
>
> **Bonne pratique :** écrire la règle de propriété en commentaire à côté du transfert (`/* le tableau en est propriétaire */`), initialiser le contexte à zéro, une seule fonction de sortie en erreur qui libère tout, et la tester par injection d'échecs.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une grosse fonction qui nettoie à chaque sortie d'erreur duplique son nettoyage (7 fois dans l'exemple, 98 lignes) ; une copie finit par différer (ici, 44 octets fuient quand l'agrandissement du tableau échoue). Un contexte de travail (`struct`) passé par pointeur regroupe ce que les étapes partagent ; une seule fonction `fail_job` libère tout. Résultat : une fonction de 19 lignes, trois étapes de 13 à 24 lignes, aucune fuite sur 13 échecs injectés. |
| **Outils utilisables** | Une `struct` de contexte initialisée par `{0}` ; `free(NULL)` permis ; une fonction de sortie unique ; `-fsanitize=address` avec `-Wl,--wrap=malloc` pour faire échouer la k-ième allocation ; valgrind pour les valeurs non initialisées. |
| **Pièges à éviter** | Six paramètres par sous-fonction ; des variables globales (non réentrantes) ; oublier de remettre un pointeur à `NULL` après l'avoir transféré (double libération) ; un contexte non initialisé (silencieux sous ASan) ; un contexte fourre-tout ; découper pour un plafond de lignes sans regarder les sorties. |
| **Bonnes pratiques** | Un contexte par tâche ; une règle de propriété écrite à l'endroit du transfert ; une seule sortie d'erreur qui libère tout ; tester chaque sortie par injection d'échecs ; le plafond de longueur (100 lignes) comme garde-fou, pas comme but. |
