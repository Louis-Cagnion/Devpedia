---
order: 3
---

# L'encodage des textes (ASCII, Unicode, UTF-8)

Un ordinateur ne stocke pas des lettres, seulement des nombres. Un **encodage** est la convention qui associe chaque caractère à un nombre, puis ce nombre à une suite d'octets. Quand deux programmes ne s'accordent pas sur la convention, on obtient les fameux `Ã©` à la place des `é`.

## ASCII : 128 caractères, 7 bits

**ASCII** (*American Standard Code for Information Interchange*), normalisé en 1963, associe un nombre de 0 à 127 aux caractères de l'anglais. Il tient donc sur 7 bits, stockés dans un octet.

| Caractère | Code |
|---|---|
| `A` → `Z` | 65 → 90 |
| `a` → `z` | 97 → 122 |
| `0` → `9` | 48 → 57 |
| espace | 32 |

Deux propriétés de cette table sont exploitées en permanence :

```c
// Passer d'une minuscule a une majuscule : 32 d'ecart, soit un seul bit
char majuscule = minuscule - 32;

// Convertir un chiffre-caractere en sa valeur numerique
int valeur = caractere - '0';    // '7' - '0' = 55 - 48 = 7
```

C'est pour cette raison qu'en [C](/?c=langages-de-programmation&s=c&p=c) un `char` **est** un entier : `'A'` et `65` sont la même valeur. Voir le chapitre [Les variables et types de données](/?c=langages-de-programmation&s=c&p=variables).

Les codes 0 à 31 ne sont pas des caractères imprimables mais des **caractères de contrôle**, héritage des téléscripteurs : `\n` (10, saut de ligne), `\t` (9, tabulation), `\0` (0, marqueur de fin de chaîne en [C](/?c=langages-de-programmation&s=c&p=c)).

## Le problème : 128 caractères ne suffisent pas

Ni `é`, ni `ñ`, ni `京`, ni `😀` n'entrent dans ASCII. Chaque région a donc créé sa propre extension sur le 8ᵉ bit (codes 128–255) : [`ISO-8859-1`](https://en.wikipedia.org/wiki/ISO/IEC_8859-1) (Latin-1) pour l'Europe de l'Ouest, `ISO-8859-5` pour le cyrillique, [`Windows-1252`](https://en.wikipedia.org/wiki/Windows-1252)...

D'où le problème structurel : **le même octet désignait des caractères différents selon la table utilisée**, et rien dans le fichier n'indiquait laquelle. Un texte français lu avec une table cyrillique donnait du charabia.

## Unicode : séparer le caractère de son stockage

Unicode résout le problème en distinguant deux questions qui étaient confondues :

1. **Quel caractère ?** Chaque caractère reçoit un numéro unique et définitif, appelé **point de code**, noté `U+XXXX`. `é` est `U+00E9`, `京` est `U+4EAC`, `😀` est `U+1F600`. Il y en a plus de 150 000.
2. **Comment le stocker en octets ?** C'est le rôle d'un **format de transformation** : UTF-8, UTF-16 ou UTF-32.

Unicode n'est donc pas un encodage : c'est un catalogue. UTF-8 est un encodage de ce catalogue.

## UTF-8 : la longueur variable

UTF-8 encode un point de code sur **1 à 4 octets**, selon sa valeur :

| Plage de points de code | Octets | Contenu |
|---|---|---|
| `U+0000` → `U+007F` | 1 | identique à ASCII |
| `U+0080` → `U+07FF` | 2 | latin accentué, grec, cyrillique, arabe, hébreu |
| `U+0800` → `U+FFFF` | 3 | chinois, japonais, coréen |
| `U+10000` → `U+10FFFF` | 4 | emojis, écritures rares |

Sa qualité décisive est la **compatibilité ascendante avec ASCII** : un fichier ASCII est déjà un fichier UTF-8 valide, sans conversion. C'est ce qui a permis son adoption universelle : il représente aujourd'hui plus de 98 % du web.

```text
"A"  -> 1 octet  : 41
"é"  -> 2 octets : C3 A9
"京" -> 3 octets : E4 BA AC
"😀" -> 4 octets : F0 9F 98 80
```

L'encodage est conçu pour être **auto-descriptif** : les bits de poids fort du premier octet annoncent la longueur de la séquence, et les octets suivants commencent tous par `10`. On peut donc se resynchroniser au milieu d'un flux, et un octet de continuation n'est jamais confondu avec un début de caractère.

## La conséquence : un caractère ≠ un octet

C'est le piège pratique le plus courant. En UTF-8, la longueur en octets ne correspond plus au nombre de caractères :

```python
texte = "café"
len(texte)                  # 4 -> Python compte les caracteres
len(texte.encode("utf-8"))  # 5 -> le "é" prend 2 octets
```

En C, où une chaîne est un tableau d'octets, `strlen("café")` renvoie **5**. Découper une telle chaîne à l'octet près peut couper un caractère en deux et produire des données invalides.

Pire, "un caractère" est lui-même ambigu : certains signes visibles sont composés de **plusieurs** points de code (une lettre plus un accent combinant, un emoji drapeau, un emoji avec modificateur de teint). L'unité que perçoit un humain s'appelle un **graphème**, et compter les graphèmes demande une bibliothèque dédiée.

## Le mojibake : diagnostiquer les caractères cassés

Quand un texte encodé en UTF-8 est lu comme du Latin-1, chaque octet est interprété séparément :

```text
"é" en UTF-8    = octets C3 A9
lus en Latin-1  : C3 -> "Ã"   A9 -> "©"
resultat        : "Ã©"
```

Ce symptôme est très reconnaissable et permet de remonter à la cause :

| Symptôme | Diagnostic probable |
|---|---|
| `Ã©`, `Ã¨`, `Ã ` | UTF-8 lu comme du Latin-1 |
| `?` ou `�` | Caractère absent de l'encodage cible, remplacé |
| Accents corrects sauf dans un tableur | Séparateur ou BOM manquant à l'ouverture |

La correction n'est jamais de "remplacer les caractères" mais de **déclarer le bon encodage** au point de lecture. Chaque couche doit être cohérente : la balise [HTML](/?c=langages-de-balisage&s=html&p=html) (`<meta charset="utf-8">`, voir le chapitre [Structure d'un document](/?c=langages-de-balisage&s=html&p=structure-dun-document)), [l'en-tête HTTP](/?c=infrastructure&p=api-et-http), l'encodage des fichiers sources, et le jeu de caractères de la base de données (`utf8mb4` pour [MySQL](https://dev.mysql.com/doc/) : `utf8` seul y est un faux ami limité à 3 octets, qui rejette les emojis).

## Le BOM

Le **BOM** (*Byte Order Mark*, `U+FEFF`) est une marque optionnelle en début de fichier signalant l'encodage. Il est indispensable en UTF-16 pour indiquer l'ordre des octets, mais **inutile en UTF-8**, où l'ordre est fixe.

Il reste néanmoins courant sous Windows, où certains outils (dont [Excel](https://www.microsoft.com/microsoft-365/excel)) s'en servent pour reconnaître un fichier UTF-8. D'où un arbitrage classique : un CSV destiné à Excel a besoin du BOM pour afficher correctement les accents, alors qu'un fichier source [PHP](/?c=langages-de-programmation&s=php&p=php) avec BOM provoque un envoi prématuré de contenu et casse les en-têtes HTTP.

## UTF-16 et UTF-32

- **UTF-16** : 2 ou 4 octets par caractère. Utilisé en interne par Java, C#, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) et Windows. Les caractères hors du plan de base (les emojis) y occupent deux unités de 16 bits, appelées *surrogate pair* : d'où le fait qu'en [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), `"😀".length` renvoie **2**.
- **UTF-32** : 4 octets par caractère, taille fixe. Simple à indexer, mais gaspille beaucoup d'espace ; rarement utilisé pour du stockage.

## Un BOM dans un fichier lu par un programme : deux pannes silencieuses

Un programme C qui [lit un fichier de texte ligne par ligne](/?c=langages&s=c&p=lecture-de-fichiers) (avec `fgets`) suppose deux choses : qu'un caractère tient dans un octet, et que le texte commence par son premier caractère visible. Un [BOM](#le-bom) met en défaut l'une ou l'autre, **sans produire la moindre erreur**. Chaque encodage a le sien, écrit avec ses propres octets :

| Encodage | Octets du BOM | Remarque |
|---|---|---|
| UTF-8 | `EF BB BF` | Facultatif ; 3 octets en tête, puis le texte |
| UTF-16 petit-boutiste (*little-endian*) | `FF FE` | L'octet de poids faible de chaque unité d'abord (voir [l'organisation en mémoire](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)) |
| UTF-16 gros-boutiste (*big-endian*) | `FE FF` | L'octet de poids fort d'abord |
| UTF-32 petit-boutiste | `FF FE 00 00` | Commence comme l'UTF-16 petit-boutiste |
| UTF-32 gros-boutiste | `00 00 FE FF` | |

Six fichiers contenant les mêmes deux lignes (`title Mon texte` et `size 12`) dans les différents encodages, avec la commande [`file`](https://man7.org/linux/man-pages/man1/file.1.html) pour les identifier et [`iconv`](https://man7.org/linux/man-pages/man1/iconv.1.html) pour convertir d'un encodage à l'autre :

```bash
printf 'title Mon texte\nsize 12\n' > utf8.txt                          # UTF-8 sans BOM
printf '\xef\xbb\xbftitle Mon texte\nsize 12\n' > utf8bom.txt           # UTF-8 avec BOM
iconv -f UTF-8 -t UTF-16LE utf8.txt > corps16.bin                         # UTF-16 petit-boutiste, sans BOM
printf '\xff\xfe' | cat - corps16.bin > utf16.txt                         # on ajoute le BOM FF FE devant
iconv -f UTF-8 -t UTF-16BE utf8.txt > corps16be.bin
printf '\xfe\xff' | cat - corps16be.bin > utf16be.txt
iconv -f UTF-8 -t UTF-32LE utf8.txt > corps32le.bin
printf '\xff\xfe\x00\x00' | cat - corps32le.bin > utf32le.txt
iconv -f UTF-8 -t UTF-32BE utf8.txt > corps32be.bin
printf '\x00\x00\xfe\xff' | cat - corps32be.bin > utf32be.txt
iconv -f UTF-16 -t UTF-8 utf16.txt > utf16_converti.txt                   # retour en UTF-8 : le BOM disparaît
file utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_converti.txt
```

```
utf8.txt:           ASCII text
utf8bom.txt:        Unicode text, UTF-8 (with BOM) text
utf16.txt:          Unicode text, UTF-16, little-endian text
utf16be.txt:        Unicode text, UTF-16, big-endian text
utf32le.txt:        Unicode text, UTF-32, little-endian
utf32be.txt:        Unicode text, UTF-32, big-endian
utf16_converti.txt: ASCII text
```

Les octets de `utf8bom.txt` (trois octets en plus) et de `utf16.txt` (chaque lettre suivie d'un octet `00`), avec [`xxd`](https://manpages.debian.org/xxd), qui affiche un fichier en hexadécimal :

```bash
xxd utf8bom.txt | head -1
xxd utf16.txt | head -2
```

```
00000000: efbb bf74 6974 6c65 204d 6f6e 2074 6578  ...title Mon tex
00000000: fffe 7400 6900 7400 6c00 6500 2000 4d00  ..t.i.t.l.e. .M.
00000010: 6f00 6e00 2000 7400 6500 7800 7400 6500  o.n. .t.e.x.t.e.
```

### Un lecteur naïf et un lecteur qui regarde le début du fichier

Le programme lit des **directives** (une ligne `mot valeur` : ici `title` suivi d'un texte, `size` suivi d'un nombre). Le lecteur naïf compare chaque ligne au mot attendu et **ignore sans bruit** toute ligne inconnue ; le lecteur sûr lit d'abord les quatre premiers octets (`skip_bom`), saute un BOM UTF-8, refuse nommément un UTF-16 ou un UTF-32, et signale les lignes inconnues.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Lit un fichier de directives « title texte » et « size nombre », sans se soucier du BOM. */
static void	parse_naive(const char *path)
{
	FILE	*f = fopen(path, "r");
	char	line[128], title[64] = "(absent)";
	int		size = -1, ignored = 0;

	if (!f)
		return ;
	while (fgets(line, sizeof line, f))
	{
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			ignored++;                              /* directive inconnue : ignorée sans bruit */
	}
	fclose(f);
	printf("naïf  %-12s : titre=%s, taille=%d, lignes ignorées=%d\n", path, title, size, ignored);
}

/* Lit les 4 premiers octets : saute le BOM UTF-8, refuse UTF-16 et UTF-32. Renvoie 0 ou -1. */
static int	skip_bom(FILE *f, const char *path)
{
	unsigned char	b[4] = {0};
	size_t			n = fread(b, 1, 4, f);

	if (n >= 4 && b[0] == 0xFF && b[1] == 0xFE && b[2] == 0 && b[3] == 0)
		return (fprintf(stderr, "%s : UTF-32 (BOM FF FE 00 00) non pris en charge\n", path), -1);
	if (n >= 4 && b[0] == 0 && b[1] == 0 && b[2] == 0xFE && b[3] == 0xFF)
		return (fprintf(stderr, "%s : UTF-32 (BOM 00 00 FE FF) non pris en charge\n", path), -1);
	if (n >= 2 && b[0] == 0xFF && b[1] == 0xFE)
		return (fprintf(stderr, "%s : UTF-16 (BOM FF FE) non pris en charge\n", path), -1);
	if (n >= 2 && b[0] == 0xFE && b[1] == 0xFF)
		return (fprintf(stderr, "%s : UTF-16 (BOM FE FF) non pris en charge\n", path), -1);
	if (n >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF)
		return (fseek(f, 3, SEEK_SET), 0);          /* BOM UTF-8 : on reprend juste après */
	return (fseek(f, 0, SEEK_SET), 0);              /* pas de BOM : on reprend au début */
}

/* Même lecture, mais le BOM est traité et une directive inconnue est signalée. */
static void	parse_safe(const char *path)
{
	FILE	*f = fopen(path, "rb");
	char	line[128], title[64] = "(absent)";
	int		size = -1, line_no = 0, unknown = 0;

	if (!f || skip_bom(f, path) != 0)
		return ((void)(f && fclose(f)));
	while (fgets(line, sizeof line, f))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		if (strncmp(line, "title ", 6) == 0)
			snprintf(title, sizeof title, "%s", line + 6);
		else if (strncmp(line, "size ", 5) == 0)
			size = atoi(line + 5);
		else
			unknown += fprintf(stderr, "%s:%d : directive inconnue\n", path, line_no) > 0;
	}
	fclose(f);
	printf("sûr   %-12s : titre=%s, taille=%d, directives inconnues=%d\n", path, title, size, unknown);
}

int	main(int argc, char **argv)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* messages et résultats dans l'ordre */
	for (int i = 1; i < argc; i++)
		parse_naive(argv[i]);
	for (int i = 1; i < argc; i++)
		parse_safe(argv[i]);
	return (0);
}
```

```bash
gcc -Wall -Wextra -g -fsanitize=address,undefined directives.c -o directives
./directives utf8.txt utf8bom.txt utf16.txt utf16be.txt utf32le.txt utf32be.txt utf16_converti.txt
```

```
naïf  utf8.txt     : titre=Mon texte, taille=12, lignes ignorées=0
naïf  utf8bom.txt  : titre=(absent), taille=12, lignes ignorées=1
naïf  utf16.txt    : titre=(absent), taille=-1, lignes ignorées=3
naïf  utf16be.txt  : titre=(absent), taille=-1, lignes ignorées=2
naïf  utf32le.txt  : titre=(absent), taille=-1, lignes ignorées=3
naïf  utf32be.txt  : titre=(absent), taille=-1, lignes ignorées=2
naïf  utf16_converti.txt : titre=Mon texte, taille=12, lignes ignorées=0
sûr   utf8.txt     : titre=Mon texte, taille=12, directives inconnues=0
sûr   utf8bom.txt  : titre=Mon texte, taille=12, directives inconnues=0
utf16.txt : UTF-16 (BOM FF FE) non pris en charge
utf16be.txt : UTF-16 (BOM FE FF) non pris en charge
utf32le.txt : UTF-32 (BOM FF FE 00 00) non pris en charge
utf32be.txt : UTF-32 (BOM 00 00 FE FF) non pris en charge
sûr   utf16_converti.txt : titre=Mon texte, taille=12, directives inconnues=0
```

**Premier cas : le BOM UTF-8 collé à la première directive.** Le fichier `utf8bom.txt` ressemble à `utf8.txt` à l'écran, mais sa première ligne commence par les octets `EF BB BF` : elle vaut `\xEF\xBB\xBFtitle Mon texte`, qui n'est pas `title ` ; le lecteur naïf la range parmi les lignes inconnues, **la première directive disparaît** et rien ne le dit (`titre=(absent)`, une ligne ignorée). Le reste du fichier est lu normalement, ce qui rend le défaut difficile à relier à sa cause.

**Second cas : l'UTF-16 et les octets NUL.** Une chaîne de caractères en C se termine par un octet de valeur 0, le **NUL** (`'\0'`) ; `strlen` et la plupart des fonctions de texte s'arrêtent au premier. Or en UTF-16 (et en UTF-32), une lettre ASCII est suivie d'un ou trois octets NUL : `t` s'écrit `74 00`. Mesure sur la première ligne de `utf16.txt` :

```c
#include <stdio.h>
#include <string.h>

int	main(void)
{
	FILE	*f = fopen("utf16.txt", "rb");
	char	line[128];
	long	start = ftell(f);                       /* position avant la lecture */

	fgets(line, sizeof line, f);                    /* lit jusqu'au premier octet 0x0A */
	printf("octets lus : %ld, strlen : %zu\n", ftell(f) - start, strlen(line));
	printf("premiers octets : %02x %02x %02x %02x\n", (unsigned char)line[0],
		(unsigned char)line[1], (unsigned char)line[2], (unsigned char)line[3]);
	fclose(f);
	return (0);
}
```

```
octets lus : 33, strlen : 3
premiers octets : ff fe 74 00
```

`fgets` a lu 33 octets (jusqu'au premier octet `0A`, un retour à la ligne : en UTF-16 il s'écrit `0A 00`, son `00` ouvre donc la ligne suivante), mais `strlen` n'en voit que 3 : `FF`, `FE`, `74`, puis le NUL arrête tout. Chaque ligne est vue comme un seul caractère précédé du BOM : **aucune directive ne correspond**, le lecteur naïf ne remplit rien (`titre=(absent), taille=-1`, 3 lignes ignorées) et ne signale rien.

Le lecteur sûr ne tente pas de deviner : il lit le BOM, et **refuse nommément** l'encodage (`utf16.txt : UTF-16 (BOM FF FE) non pris en charge`) en donnant l'octet qui l'a trahi. La conversion se fait ailleurs, avec `iconv -f UTF-16 -t UTF-8` : le fichier converti est lu normalement (`utf16_converti.txt`).

| Fichier | Lecteur naïf | Lecteur sûr |
|---|---|---|
| UTF-8 sans BOM | correct | correct |
| UTF-8 avec BOM | **titre perdu**, sans erreur | correct (BOM sauté) |
| UTF-16 (LE ou BE) | **tout ignoré**, sans erreur | refus nommé |
| UTF-32 (LE ou BE) | **tout ignoré**, sans erreur | refus nommé |
| UTF-16 converti en UTF-8 | correct | correct |

> **Piège :** un éditeur qui enregistre « en UTF-8 » ajoute parfois un BOM, que `cat` ou un simple `diff` n'affichent pas. Un fichier qui paraît identique à l'écran peut commencer par trois octets invisibles. La commande `file` (ou `xxd | head -1`) le révèle.
>
> **Piège :** tester l'ordre des octets du BOM UTF-32 petit-boutiste (`FF FE 00 00`) **après** celui de l'UTF-16 (`FF FE`) : les deux commencent par les mêmes octets, le plus court gagnerait toujours. Dans `skip_bom`, le test à quatre octets vient en premier.
>
> **Bonne pratique :** lire les premiers octets avant d'analyser un fichier de texte venu de l'extérieur, sauter un BOM UTF-8, refuser nommément les autres encodages (avec le BOM trouvé dans le message), et signaler une directive inconnue plutôt que de l'ignorer en silence.

## Retirer les accents d'un texte : la normalisation Unicode (NFKD)

Comparer ou rechercher du texte en ignorant les accents (regrouper "café" et "cafe" comme une même entrée, par exemple) demande de séparer chaque lettre accentuée de son accent. Le module standard `unicodedata` fournit cette décomposition sans réinventer de table de correspondance :

```python
import unicodedata

def retirer_les_accents(texte):
    decompose = unicodedata.normalize("NFKD", texte)   # "é" -> "e" + accent aigu combinant
    return "".join(c for c in decompose if not unicodedata.combining(c))

retirer_les_accents("café")   # "cafe"
```

`unicodedata.normalize("NFKD", ...)` décompose chaque caractère accentué en sa lettre de base suivie d'un **caractère combinant** séparé (l'accent lui-même, un point de code à part) ; `unicodedata.combining(c)` renvoie vrai pour ces caractères combinants, qu'il suffit alors de filtrer.

NFKD est une des 4 formes de normalisation Unicode standard :

| Forme | Effet |
|---|---|
| NFC | Recompose : forme la plus courte, un point de code par caractère visible quand c'est possible |
| NFD | Décompose : lettre de base + accents combinants séparés |
| NFKC | Comme NFC, en unifiant aussi les variantes de présentation (ex. ligature `ﬁ` → `fi`) |
| NFKD | Comme NFD, avec la même unification que NFKC |

> **Piège :** deux textes visuellement identiques peuvent être composés différemment en mémoire (`é` en un seul point de code `U+00E9`, ou en deux `U+0065` + `U+0301`) et donc échouer une comparaison `==` alors qu'ils s'affichent pareil. Normaliser les deux textes dans la même forme avant de les comparer évite ce piège.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un encodage associe chaque caractère à un nombre (Unicode : le catalogue) puis à des octets (UTF-8 : le format). UTF-8 est compatible ASCII et code un caractère sur 1 à 4 octets : un caractère n'est donc pas forcément un octet. La normalisation Unicode (NFC/NFD/NFKC/NFKD) recompose ou décompose un caractère accentué, notamment pour comparer ou rechercher du texte en ignorant les accents. |
| **Outils utilisables** | `<meta charset="utf-8">`, `utf8mb4` pour MySQL, une bibliothèque dédiée pour compter des graphèmes, `unicodedata.normalize()`/`unicodedata.combining()` pour normaliser un texte ou en retirer les accents. |
| **Pièges à éviter** | Lire un fichier UTF-8 avec le mauvais encodage déclaré (mojibake, `Ã©`) ; découper une chaîne à l'octet près sans tenir compte des caractères multi-octets ; comparer deux textes visuellement identiques mais composés différemment en mémoire sans les normaliser d'abord ; analyser un fichier qui commence par un BOM sans le traiter (directive perdue en UTF-8, tout le texte ignoré en UTF-16). |
| **Bonnes pratiques** | Déclarer le bon encodage à chaque couche (fichier, HTTP, base de données) plutôt que de "réparer" des caractères déjà corrompus. Normaliser deux textes dans la même forme Unicode avant de les comparer ou de les rechercher. Lire les premiers octets d'un fichier venu de l'extérieur pour y repérer un BOM, et signaler un encodage non pris en charge au lieu de l'ignorer. |
