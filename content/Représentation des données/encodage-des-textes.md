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

```
// Passer d'une minuscule a une majuscule : 32 d'ecart, soit un seul bit
char majuscule = minuscule - 32;

// Convertir un chiffre-caractere en sa valeur numerique
int valeur = caractere - '0';    // '7' - '0' = 55 - 48 = 7
```

C'est pour cette raison qu'en C un `char` **est** un entier : `'A'` et `65` sont la même valeur. Voir le chapitre [Les variables et types de données](/?c=langages-de-programmation&s=c&p=variables).

Les codes 0 à 31 ne sont pas des caractères imprimables mais des **caractères de contrôle**, héritage des téléscripteurs : `\n` (10, saut de ligne), `\t` (9, tabulation), `\0` (0, marqueur de fin de chaîne en C).

## Le problème : 128 caractères ne suffisent pas

Ni `é`, ni `ñ`, ni `京`, ni `😀` n'entrent dans ASCII. Chaque région a donc créé sa propre extension sur le 8ᵉ bit (codes 128–255) : `ISO-8859-1` (Latin-1) pour l'Europe de l'Ouest, `ISO-8859-5` pour le cyrillique, `Windows-1252`...

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

Sa qualité décisive est la **compatibilité ascendante avec ASCII** : un fichier ASCII est déjà un fichier UTF-8 valide, sans conversion. C'est ce qui a permis son adoption universelle — il représente aujourd'hui plus de 98 % du web.

```
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
len(texte)                    # 4 -> Python compte les caracteres
len(texte.encode("utf-8"))    # 5 -> le "é" prend 2 octets
```

En C, où une chaîne est un tableau d'octets, `strlen("café")` renvoie **5**. Découper une telle chaîne à l'octet près peut couper un caractère en deux et produire des données invalides.

Pire, "un caractère" est lui-même ambigu : certains signes visibles sont composés de **plusieurs** points de code (une lettre plus un accent combinant, un emoji drapeau, un emoji avec modificateur de teint). L'unité que perçoit un humain s'appelle un **graphème**, et compter les graphèmes demande une bibliothèque dédiée.

## Le mojibake : diagnostiquer les caractères cassés

Quand un texte encodé en UTF-8 est lu comme du Latin-1, chaque octet est interprété séparément :

```
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

La correction n'est jamais de "remplacer les caractères" mais de **déclarer le bon encodage** au point de lecture. Chaque couche doit être cohérente : la balise HTML (`<meta charset="utf-8">`, voir le chapitre [Structure d'un document](/?c=langages-de-balisage&s=html&p=structure-dun-document)), l'en-tête HTTP, l'encodage des fichiers sources, et le jeu de caractères de la base de données (`utf8mb4` pour MySQL — `utf8` seul y est un faux ami limité à 3 octets, qui rejette les emojis).

## Le BOM

Le **BOM** (*Byte Order Mark*, `U+FEFF`) est une marque optionnelle en début de fichier signalant l'encodage. Il est indispensable en UTF-16 pour indiquer l'ordre des octets, mais **inutile en UTF-8**, où l'ordre est fixe.

Il reste néanmoins courant sous Windows, où certains outils (dont Excel) s'en servent pour reconnaître un fichier UTF-8. D'où un arbitrage classique : un CSV destiné à Excel a besoin du BOM pour afficher correctement les accents, alors qu'un fichier source PHP avec BOM provoque un envoi prématuré de contenu et casse les en-têtes HTTP.

## UTF-16 et UTF-32

- **UTF-16** : 2 ou 4 octets par caractère. Utilisé en interne par Java, C#, JavaScript et Windows. Les caractères hors du plan de base (les emojis) y occupent deux unités de 16 bits, appelées *surrogate pair* — d'où le fait qu'en JavaScript, `"😀".length` renvoie **2**.
- **UTF-32** : 4 octets par caractère, taille fixe. Simple à indexer, mais gaspille beaucoup d'espace ; rarement utilisé pour du stockage.

## Résumé

| Notion | À retenir |
|---|---|
| ASCII | 128 caractères, 7 bits, base de tout le reste |
| Unicode | Un catalogue de points de code, **pas** un encodage |
| UTF-8 | 1 à 4 octets, compatible ASCII, standard de fait du web |
| Caractère ≠ octet | `strlen` en C compte des octets, pas des lettres |
| Mojibake `Ã©` | UTF-8 lu comme du Latin-1 : corriger la déclaration, pas le texte |
| BOM | Inutile en UTF-8, mais attendu par Excel, néfaste en tête d'un source PHP |
