---
order: 2
---

# SQL

SQL (*Structured Query Language*) est un langage à but unique : interroger et manipuler des données stockées sous forme de tables. Comme [la regex](/?c=domain-specific-languages-dsl&p=regex), ce n'est pas un langage de programmation généraliste : il n'a ni boucles, ni fonctions définies par l'utilisateur, ni variables au sens classique. Il est interprété par un moteur de base de données ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), généralement piloté depuis un langage hôte ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), [JS](/?c=langages&s=javascript&p=javascript)...) via un connecteur.

## DDL et DML : deux familles de commandes

Les commandes SQL se rangent en deux familles, selon qu'elles touchent à la structure des tables ou aux données à l'intérieur :

| Famille | Nom complet | Rôle | Commandes |
|---|---|---|---|
| DDL | *Data Definition Language* | Créer/modifier/supprimer la structure d'une table | `CREATE`, `ALTER`, `DROP` |
| DML | *Data Manipulation Language* | Lire/ajouter/modifier/supprimer les données | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |

Les exemples `SELECT` ci-dessous sont donc du DML : ils lisent des données dans une table déjà créée. Le DDL (créer cette table) est couvert plus bas.

## Une table, comme une feuille de tableur

Une table relationnelle ressemble à une feuille de tableur : des colonnes fixes, nommées à l'avance (`id`, `nom`, `ville`...), et chaque ligne représente un enregistrement complet qui remplit toutes ces colonnes.

```sql
SELECT id, nom FROM clients WHERE ville = 'Lyon';
```

"Colonnes `id`/`nom`, depuis la table `clients`, seulement les lignes où `ville = 'Lyon'`." `SELECT *` sélectionne toutes les colonnes.

## Lignes et colonnes : les deux directions d'une table

Quand on débute, on mélange souvent ces deux mots. Une **colonne** est verticale : c'est un type d'information, le même pour tous les enregistrements (le titre, le prix). Une **ligne** est horizontale : c'est un enregistrement complet (un livre, avec son titre, son prix, sa date). Les exemples qui suivent lisent une table `livres` de sept lignes et cinq colonnes :

| id | titre | genre | prix | publie_le |
|---|---|---|---|---|
| 1 | Les Nuits de Brume | roman | 12.50 | 2024-03-15 |
| 2 | Cuisine en famille | cuisine | 24.00 | 2023-11-02 |
| 3 | Atlas des mers | science | 39.90 | 2022-06-30 |
| 4 | Le Dernier Phare | roman | 9.90 | 2025-01-20 |
| 5 | Pâtes et sauces | cuisine | 18.00 | 2024-09-05 |
| 6 | Voyage au centre | roman | 15.00 | 2021-05-12 |
| 7 | Étoiles proches | science | 22.00 | 2025-04-01 |

```
              colonnes (verticales) : se choisissent après SELECT
              id    titre                genre     prix
                 \     |                     |      /
   ligne 1  ->   1     Les Nuits de Brume    roman   12.50
   ligne 2  ->   2     Cuisine en famille    cuisine 24.00
   ligne 3  ->   3     Atlas des mers        science 39.90

   lignes (horizontales) : se retirent avec WHERE et TOP
```

Chaque direction se règle donc à un endroit différent de la **requête** (la demande écrite en SQL, détaillée [plus bas](#lire-une-requete-pas-a-pas-select-from-where)) :

| Je veux... | Je règle... | Exemple |
|---|---|---|
| Garder certaines colonnes seulement | la liste après `SELECT` | `SELECT titre, prix` |
| Garder certaines lignes seulement | `WHERE` | `WHERE genre = 'roman'` |
| Garder les `n` premières lignes seulement | `TOP n` (T-SQL, la variante de SQL propre à SQL Server) | `SELECT TOP 3 titre` |
| Changer l'ordre des lignes | `ORDER BY` | `ORDER BY prix DESC` |

Confondre les deux est l'erreur la plus courante : `WHERE` ne fait jamais disparaître une colonne, et la liste après `SELECT` ne fait jamais disparaître une ligne.

### `SELECT *` : toutes les colonnes d'un coup

L'étoile `*` remplace la liste des colonnes par « toutes, dans l'ordre où la table les déclare ». Utile pour un premier coup d'œil sur une table inconnue :

```sql
SELECT * FROM livres WHERE id = 2;  -- toutes les colonnes de la ligne dont id vaut 2
```

```
id  titre               genre    prix  publie_le
--  ------------------  -------  ----  ----------
2   Cuisine en famille  cuisine  24    2023-11-02
```

| Risque de `SELECT *` hors d'un essai | Pourquoi |
|---|---|
| Données inutiles transportées | Le **serveur** (le programme du moteur de base de données, qui détient les données et répond aux requêtes) lit et envoie des colonnes dont on n'a pas besoin, parfois volumineuses |
| Données sensibles exposées | Une colonne ajoutée plus tard (un mot de passe, un numéro) sort sans que personne l'ait décidé |
| Code fragile | Un programme qui lit le résultat « par position » se casse si une colonne est ajoutée ou déplacée |
| Table énorme | Sans `WHERE` ni `TOP`, on rapatrie la table entière |

> **Bonne pratique :** `SELECT *` pour explorer, la liste explicite des colonnes (`SELECT titre, prix`) dans tout ce qui est enregistré ou relancé plus tard.

## Lire une requête pas à pas : `SELECT`, `FROM`, `WHERE`

Une **requête** est une demande écrite en SQL et envoyée au **serveur** : le programme du moteur de base de données, qui détient les données et répond. Elle se compose de **clauses** : chacune commence par un mot-clé (`SELECT`, `FROM`, `WHERE`...) et répond à une question.

```sql
SELECT titre, prix       -- 1. quelles colonnes afficher
FROM livres              -- 2. dans quelle table lire
WHERE genre = 'roman';   -- 3. quelles lignes garder
```

| Clause | Question à laquelle elle répond | Ici |
|---|---|---|
| `SELECT` | Quelles colonnes veux-tu voir ? | `titre` et `prix` |
| `FROM` | Dans quelle table lis-tu ? | `livres` |
| `WHERE` | Quelles lignes garde-t-on ? | celles dont `genre` vaut `'roman'` |

```
titre               prix
------------------  ----
Les Nuits de Brume  12.5
Le Dernier Phare    9.9
Voyage au centre    15
```

(Ces résultats ont été obtenus avec SQLite ; l'affichage des décimales, `12.5` ou `12.50`, varie d'un moteur à l'autre.)

### `FROM` et le nom complet `schéma.table`

Sur un vrai serveur, une table appartient à un **schéma** (un espace de noms qui range les tables, expliqué dans [Schémas et tables techniques](/?c=bases-de-donnees&p=schemas-et-tables-techniques)). Le nom complet s'écrit `schéma.table`, et sur SQL Server le schéma par défaut s'appelle `dbo` :

```sql
SELECT titre FROM dbo.livres;  -- nom complet : schéma dbo, table livres
```

Écrire seulement `livres` marche quand le moteur sait dans quel schéma chercher ; le nom complet évite l'ambiguïté si deux schémas ont une table de même nom. Pour lire une autre base du même serveur, il s'ajoute un troisième segment, vu dans [la requête inter-bases](#requete-inter-bases-sur-la-meme-instance).

### `WHERE` : le serveur teste chaque ligne

`WHERE` contient une **condition** : une affirmation qui est vraie ou fausse pour une ligne donnée. Le serveur la teste ligne par ligne : si elle est vraie, la ligne reste ; si elle est fausse, elle disparaît du résultat. Les comparaisons possibles :

| Opérateur | Sens | Exemple |
|---|---|---|
| `=` | égal à (un seul signe `=`, pas deux) | `genre = 'roman'` |
| `<>` | différent de (`!=` aussi accepté par la plupart des moteurs) | `genre <> 'roman'` |
| `<` / `>` | strictement inférieur / supérieur | `prix < 20` |
| `<=` / `>=` | inférieur ou égal / supérieur ou égal | `prix >= 20` |

Le texte et les dates s'écrivent entre apostrophes, les nombres tels quels : la règle complète est dans [Types de colonne et valeurs cohérentes](#types-de-colonne-et-valeurs-coherentes).

### `AND` et `OR` : combiner plusieurs conditions

| Mot-clé | La ligne est gardée si... |
|---|---|
| `AND` | les deux conditions sont vraies à la fois |
| `OR` | au moins une des deux est vraie |

Voici ce que fait le serveur pour `WHERE genre = 'roman' AND prix < 12`, ligne par ligne :

| id | genre | prix | `genre = 'roman'` | `prix < 12` | Ligne gardée ? |
|---|---|---|---|---|---|
| 1 | roman | 12.50 | vrai | faux | non |
| 2 | cuisine | 24.00 | faux | faux | non |
| 3 | science | 39.90 | faux | faux | non |
| 4 | roman | 9.90 | vrai | vrai | **oui** |
| 5 | cuisine | 18.00 | faux | faux | non |
| 6 | roman | 15.00 | vrai | faux | non |
| 7 | science | 22.00 | faux | faux | non |

> **Piège :** `AND` passe avant `OR`, comme la multiplication avant l'addition. `WHERE genre = 'cuisine' OR genre = 'roman' AND prix < 10` se lit « cuisine, ou (roman et moins de 10) » : tous les livres de cuisine ressortent, même à 24.00.
>
> **Bonne pratique :** dès qu'un `OR` côtoie un `AND`, mettre des parenthèses pour que la lecture ne dépende pas de la règle de priorité.

```sql
-- sans parenthèses : cuisine (tous les prix) OU (roman à moins de 10)
SELECT titre, genre, prix FROM livres
WHERE genre = 'cuisine' OR genre = 'roman' AND prix < 10;

-- avec parenthèses : (cuisine OU roman) ET moins de 10
SELECT titre, genre, prix FROM livres
WHERE (genre = 'cuisine' OR genre = 'roman') AND prix < 10;
```

```
titre               genre    prix       titre             genre  prix
------------------  -------  ----       ----------------  -----  ----
Cuisine en famille  cuisine  24         Le Dernier Phare  roman  9.9
Le Dernier Phare    roman    9.9
Pâtes et sauces     cuisine  18
   (sans parenthèses : 3 lignes)       (avec parenthèses : 1 ligne)
```

## `ORDER BY` : trier le résultat

Une table n'a **aucun ordre garanti** : le serveur renvoie les lignes dans l'ordre qui l'arrange (celui du stockage, celui d'un [index](/?c=bases-de-donnees&p=les-index), celui d'un autre chemin de lecture), et cet ordre peut changer d'une exécution à l'autre. `ORDER BY` fixe l'ordre, et se place après `WHERE` :

```sql
SELECT titre, prix
FROM livres
WHERE publie_le >= '2023-01-01'  -- d'abord, retirer les lignes trop anciennes
ORDER BY prix DESC;              -- ensuite, trier le reste du plus cher au moins cher
```

| Écriture | Effet |
|---|---|
| `ORDER BY prix` | croissant (du plus petit au plus grand) ; `ASC` est la valeur par défaut |
| `ORDER BY prix DESC` | décroissant (`DESC` pour *descending*) |
| `ORDER BY genre, prix DESC` | d'abord par `genre`, et à genre égal par `prix` décroissant |

Résultat de `ORDER BY genre, prix DESC` sur toute la table :

```
titre               genre    prix
------------------  -------  ----
Cuisine en famille  cuisine  24
Pâtes et sauces     cuisine  18
Voyage au centre    roman    15
Les Nuits de Brume  roman    12.5
Le Dernier Phare    roman    9.9
Atlas des mers      science  39.9
Étoiles proches     science  22
```

`WHERE` et `ORDER BY` ne font pas le même travail :

| | `WHERE` | `ORDER BY` |
|---|---|---|
| Rôle | retire des lignes | range les lignes |
| Nombre de lignes après | diminue (ou reste égal) | identique |
| Se place | après `FROM` | à la fin de la requête |

> **Piège :** croire qu'insérer les lignes dans l'ordre voulu suffit. Le résultat d'une requête sans `ORDER BY` n'est pas garanti, même si, un jour, il sort dans l'ordre d'insertion : un index ajouté plus tard ou une autre façon de lire la table suffit à le changer.
>
> **Bonne pratique :** tout résultat dont l'ordre compte porte un `ORDER BY`, avec une seconde colonne si la première peut contenir des doublons (deux livres au même prix sortent sinon dans un ordre indéfini entre eux).

Deux limites à connaître :

- **Le coût.** Trier une grosse table demande du travail au serveur ; un [index](/?c=bases-de-donnees&p=les-index) sur la colonne de tri peut lui livrer les lignes déjà rangées.
- **Quand l'éviter.** Compter des lignes (`COUNT(*)`, voir [Les fonctions d'agrégation](#les-fonctions-d-agregation)) ou tester qu'il en existe au moins une n'a aucun besoin d'ordre : le trier serait du travail perdu.

## `TOP n` (T-SQL) : limiter le nombre de lignes, et son piège

En T-SQL, le langage de [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), `TOP n` garde les `n` premières lignes du résultat. Il s'écrit juste après `SELECT`. MySQL, PostgreSQL et SQLite ont l'équivalent `LIMIT n`, écrit à la fin de la requête. Détails de `TOP` : [documentation officielle](https://learn.microsoft.com/en-us/sql/t-sql/queries/top-transact-sql).

```sql
-- T-SQL : les 3 livres les plus chers
SELECT TOP 3 titre, prix
FROM livres
ORDER BY prix DESC;  -- sans ce tri, TOP 3 renverrait 3 lignes quelconques

-- équivalent MySQL / PostgreSQL / SQLite
SELECT titre, prix FROM livres ORDER BY prix DESC LIMIT 3;
```

```
titre               prix
------------------  ----
Atlas des mers      39.9
Cuisine en famille  24
Étoiles proches     22
```

(Sortie obtenue avec la forme `LIMIT 3` sous SQLite.)

Le piège tient en deux points :

| Piège | Ce qui se passe | Parade |
|---|---|---|
| `TOP` sans `ORDER BY` | `TOP` plafonne sans ordre précis : le serveur rend `n` lignes quelconques, pas « les premières » ou « les meilleures » | toujours le coupler à `ORDER BY` |
| Le message « n lignes affectées » | il annonce le nombre de lignes **renvoyées**, pas le nombre de lignes qui correspondent à la condition | lancer un `COUNT(*)` avec le même `WHERE` |

```sql
-- AS nb donne le nom nb à la colonne calculée (voir les fonctions d'agrégation)
SELECT COUNT(*) AS nb FROM livres WHERE genre = 'roman';  -- combien de romans en tout
```

```
nb
--
3
```

Avec `TOP 2` (ou `LIMIT 2`) sur ces romans, le serveur affiche « 2 lignes » alors qu'il y en a 3 : sans le `COUNT(*)`, on prendrait 2 pour le total. Même avec `ORDER BY`, si la colonne de tri contient des doublons à la frontière (par exemple deux livres à 15.00 se disputant la 2e place avec `TOP 2`), la ligne retenue entre les deux est arbitraire : ajouter une seconde colonne de tri.

## Le point-virgule : la fin d'une instruction

Une **instruction** est une commande SQL complète. Le point-virgule `;` la termine : il ne sépare jamais deux clauses d'une même requête.

```sql
SELECT titre FROM livres WHERE genre = 'roman';  -- une seule instruction, un seul ;
SELECT COUNT(*) FROM livres;                     -- une seconde instruction, à la suite
```

> **Piège :** un `;` mal placé coupe la requête en deux. `SELECT titre FROM livres; WHERE genre = 'roman';` exécute d'abord `SELECT titre FROM livres;` **sans filtre** (tous les livres s'affichent), puis échoue sur `WHERE ...` qui ne forme pas une instruction.

| Écriture | Ce que fait le moteur (SQLite) |
|---|---|
| `SELECT titre FROM livres;` | affiche les titres de tous les livres |
| ` WHERE genre = 'roman';` (seule) | erreur `near "WHERE": syntax error` |
| ` FROM livres;` (seule) | erreur `near "FROM": syntax error` (le message exact change selon le moteur) |

Sur SQL Server, le `;` final est facultatif pour la plupart des instructions mais certaines l'exigent (`MERGE`, vu [plus bas](#merge-upsert-en-une-seule-requete-sql-server)) : le mettre partout est la règle la plus sûre.

## Types de colonne et valeurs cohérentes

Chaque colonne a un **type** : la sorte de valeur qu'elle accepte (évoqué plus bas dans [`CREATE TABLE`](#create-table-creer-une-table-ddl)). Une valeur écrite dans une requête doit correspondre à ce type, et son écriture dépend de lui.

### Écrire une valeur : nombre, texte, date

| Sorte de valeur | Écriture | Exemple |
|---|---|---|
| Nombre | tel quel, le point pour les décimales | `24`, `12.5` |
| Texte | entre apostrophes `'...'` | `'roman'` |
| Date | texte entre apostrophes, au format `'AAAA-MM-JJ'` | `'2024-03-15'` |
| Valeur absente | le mot `NULL`, sans apostrophes (voir [`NULL`](#null-une-donnee-manquante-pas-une-valeur-comme-les-autres)) | `NULL` |

Un texte qui contient lui-même une apostrophe la double : `'L''Isle'` désigne le texte `L'Isle`. Les apostrophes sont obligatoires : sans elles, le moteur lit `roman` comme le nom d'une colonne.

```sql
SELECT titre FROM livres WHERE genre = roman;  -- oubli des apostrophes
```

```
Error: no such column: roman
```

> **Piège :** comparer une colonne de dates à un nombre. `WHERE publie_le = 2024` mélange deux types : SQL Server se comporte selon le type de la colonne : une colonne `date` refuse avec l'erreur « Operand type clash » (types incompatibles), tandis qu'une colonne `datetime` accepte `2024` comme un nombre de jours depuis le 1er janvier 1900, sans erreur ; SQLite, plus permissif, ne dit rien et renvoie zéro ligne, ce qui est pire (aucune erreur à lire).
>
> **Bonne pratique :** écrire chaque valeur au type de sa colonne, et chercher une année avec une plage de dates (`publie_le >= '2024-01-01' AND publie_le < '2025-01-01'`).

### Convertir une valeur : `CAST`

Quand la valeur n'a pas le bon type, on la **convertit** (on la transforme en une valeur d'un autre type). `CAST(valeur AS type)` est la forme standard, comprise par tous les moteurs ; T-SQL ajoute `CONVERT(type, valeur)`.

```sql
-- INT : nombre entier (voir « Nombres » plus bas)
SELECT CAST('42' AS INT) + 1 AS resultat;  -- le texte '42' devient le nombre 42
```

```
resultat
--------
43
```

> **Piège :** une conversion impossible (`CAST('abc' AS INT)`) ne se comporte pas pareil partout. SQLite renvoie `0` sans rien dire, ce qui fabrique une fausse donnée ; SQL Server s'arrête avec une erreur de conversion.
>
> **Bonne pratique :** convertir explicitement, et préférer l'erreur au silence : une erreur se corrige, un `0` inventé se retrouve dans des totaux.

### Nombres : `INT`, `numeric` et `decimal`

| Type | Contenu | Exact ? |
|---|---|---|
| `INT` | nombre entier (`12`, `-3`) | oui |
| `decimal(p, s)` ou `numeric(p, s)` | nombre à virgule : `p` chiffres au total, dont `s` après la virgule | oui |
| `float` | nombre à virgule « approximatif » | non |

Sur SQL Server, `numeric` et `decimal` sont deux noms pour le même type. `decimal(8, 2)` accepte jusqu'à 999999.99 et garde toujours deux décimales (`12.5` est rangé comme `12.50`).

Le même calcul donne deux résultats selon le moteur. Sous **SQLite**, `0.1` et `0.2` sont lus comme des `float`, et une comparaison peut s'écrire directement dans la liste `SELECT` :

```sql
-- SQLite
SELECT 0.1 + 0.2 AS somme, 0.1 + 0.2 = 0.3 AS egal;  -- 1 = vrai, 0 = faux
```

```
somme                egal
-------------------  ----
0.30000000000000004  0
```

Sous **SQL Server**, ce même `SELECT` ne marche pas : une comparaison ne peut pas s'écrire dans la liste `SELECT`, et les littéraux `0.1` et `0.2` y sont lus comme des `numeric` exacts, donc `0.1 + 0.2 = 0.3` y serait vrai. Pour observer le défaut du `float`, il faut déclarer des variables `float` ([`DECLARE @a`](#variable-de-table-s-exercer-sans-rien-creer-de-durable-t-sql) crée une variable) et tester avec `CASE WHEN condition THEN a ELSE b END` (renvoie `a` si la condition est vraie, `b` sinon) :

```sql
-- SQL Server
DECLARE @a FLOAT = 0.1, @b FLOAT = 0.2;  -- deux variables de type float
SELECT @a + @b AS somme,
       CASE WHEN @a + @b = 0.3 THEN 1 ELSE 0 END AS egal;  -- 1 = vrai, 0 = faux
```

```
somme  egal
-----  ----
0.3    0
```

(Sortie SQL Server écrite à la main, non exécutée ici : `egal` vaut bien `0`, mais l'outil affiche souvent `somme` arrondie à `0.3`, alors que l'écart existe.)

Un `float` est rangé en binaire (le système à deux chiffres, 0 et 1, qu'utilise l'ordinateur ; voir [Nombres flottants](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)), et `0.1` n'a pas d'écriture exacte en binaire (comme un tiers n'en a pas en décimal) : le moteur garde une valeur très proche. L'écart est minuscule (de l'ordre de 0.00000000000000005) mais suffit à rendre l'égalité fausse.

> **Piège :** ranger un prix dans une colonne approximative, puis faire une somme ou une égalité dessus.
>
> **Bonne pratique :** `decimal(p, s)` pour tout ce qui se compte au centime près (prix, soldes), `float` seulement pour des mesures où l'arrondi est acceptable.

### Texte : `varchar(n)` contre `char(n)`

| Type | Longueur stockée | Exemple avec `'FR'` |
|---|---|---|
| `varchar(n)` | celle du texte, jusqu'à `n` caractères | `FR` (2 caractères) |
| `char(n)` | toujours `n` : complété par des espaces à droite | `FR` suivi de 3 espaces si `n` vaut 5 |

`char(n)` convient aux codes dont la longueur ne varie jamais (un code pays sur 2 lettres) ; `varchar(n)` aux noms, titres, adresses. Un texte plus long que `n` est refusé (SQL Server signale une erreur de troncature : le texte serait coupé) ou coupé selon le moteur.

### Dates : `date` contre `datetime`

| Type | Contenu | Exemple |
|---|---|---|
| `date` | le jour seulement | `'2026-10-31'` |
| `datetime` | le jour et l'heure | `'2026-10-31 14:45:00'` |

Deux pièges, un par type :

- **Le format.** `'AAAA-MM-JJ'` est lu sans ambiguïté par une colonne `date`. Pour un `datetime`, SQL Server peut, selon la langue de la **connexion** (la session ouverte entre le programme qui envoie les requêtes et le serveur ; réglage `SET DATEFORMAT`, voir la [documentation](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-dateformat-transact-sql)), lire `'2026-10-11'` comme le 10 novembre au lieu du 11 octobre ; les formes `'AAAAMMJJ'` (`'20261011'`) et `'AAAA-MM-JJThh:mm:ss'` sont, elles, indépendantes de la langue.
- **L'heure cachée.** Comparer un `datetime` à un jour seul revient à le comparer à minuit : les lignes de l'après-midi sont ratées. On filtre alors par plage, de minuit inclus au minuit suivant exclu.

```sql
-- commandes(id, passee_le) : id 1 à 09:30, id 2 à 14:45 le 31/10, id 3 le 01/11
SELECT id FROM commandes WHERE passee_le = '2026-10-31';  -- égal à minuit pile

SELECT id FROM commandes
WHERE passee_le >= '2026-10-31'  -- minuit du 31 inclus
  AND passee_le <  '2026-11-01'; -- minuit du 1er novembre exclu
```

```
(première requête)  aucune ligne
(seconde requête)   id = 1 et id = 2
```

(Test fait sous SQLite, qui range les dates dans une colonne de texte : le raisonnement est le même que pour un `datetime` de SQL Server.)

### Clé primaire

Une **clé primaire** est la colonne (ou le groupe de colonnes) qui identifie chaque ligne de façon unique : deux lignes n'ont jamais la même valeur, et elle n'est jamais `NULL`. Une table en a une seule. Ici, `id` : chercher `WHERE id = 2` renvoie au plus une ligne. Elle se déclare avec `PRIMARY KEY` (voir [`CREATE TABLE`](#create-table-creer-une-table-ddl)).

| Sans clé primaire | Avec clé primaire |
|---|---|
| Deux livres identiques sont indiscernables | Chaque ligne a son identifiant |
| Modifier « ce » livre peut en modifier deux | `WHERE id = 2` n'en touche qu'un |
| Une autre table ne peut pas pointer vers une ligne précise | Une [`FOREIGN KEY`](#create-table-creer-une-table-ddl) pointe vers elle |

La liste complète des types de SQL Server est dans sa [documentation officielle](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql).

## Les fonctions d'agrégation

Elles résument plusieurs lignes en une seule valeur :

| Fonction | Rôle |
|---|---|
| `COUNT(*)` | Nombre de lignes |
| `SUM(colonne)` | Somme d'une colonne numérique |
| `AVG(colonne)` | Moyenne d'une colonne numérique |
| `MAX(colonne)` / `MIN(colonne)` | Valeur maximale / minimale |

```sql
SELECT COUNT(*) AS nb_clients FROM clients WHERE ville = 'Lyon';
```

`AS nom` donne un alias à une colonne du résultat (ici, la colonne calculée s'appellera `nb_clients`).

Combinée à `GROUP BY`, une fonction d'agrégation calcule une valeur par groupe plutôt qu'une seule valeur globale :

```sql
SELECT ville, COUNT(*) AS nb_clients
FROM clients
GROUP BY ville;  -- une ligne de resultat par ville distincte
```

### Dans quel ordre le serveur traite une requête d'agrégation

Une requête s'écrit dans un ordre (`SELECT` d'abord) mais le serveur la traite dans un autre. Pour une requête qui calcule par groupe, l'ordre de traitement est celui-ci :

```sql
SELECT genre, COUNT(*) AS nb, AVG(prix) AS prix_moyen
FROM livres
WHERE publie_le >= '2023-01-01'  -- 1. retirer les livres plus anciens
GROUP BY genre                   -- 2. former un groupe par genre
                                 -- 3. (COUNT et AVG : un calcul dans chaque groupe)
ORDER BY nb DESC, genre;          -- 4. trier le résultat final (genre départage les égalités)
```

```
table livres : 7 lignes
      |  WHERE publie_le >= '2023-01-01'    garde 5 lignes
      v
5 lignes
      |  GROUP BY genre                     forme 3 groupes
      v
roman (2 lignes)   cuisine (2 lignes)   science (1 ligne)
      |  COUNT(*), AVG(prix)                un calcul par groupe
      v
3 lignes de résultat (une par groupe)
      |  ORDER BY nb DESC                   tri en dernier
      v
résultat final
```

```
genre    nb  prix_moyen
-------  --  ----------
cuisine  2   21.0
roman    2   11.2
science  1   22.0
```

| Étape | Clause | Ce qui se passe |
|---|---|---|
| 1 | `WHERE` | filtre les lignes **avant** tout calcul |
| 2 | `GROUP BY` | range les lignes restantes en groupes (une valeur de `genre` = un groupe) |
| 3 | `COUNT`, `AVG`... | s'appliquent **dans chaque groupe**, pas sur toute la table |
| 4 | `ORDER BY` | trie en dernier : le total `nb` n'existe qu'après le calcul, d'où la possibilité de trier sur son nom |

Quelques conséquences :

- **Un calcul porte sur les lignes gardées par `WHERE`**, pas sur toute la table. Croire le contraire est une erreur fréquente : ici `COUNT(*)` ne compte que les 5 livres récents, pas les 7.
- **Sans `GROUP BY`, une fonction de calcul seule renvoie une seule ligne** (un groupe unique : toutes les lignes gardées). `SELECT COUNT(*) FROM livres WHERE genre = 'roman'` renvoie `3`.
- **Dans `COUNT(*)`, l'étoile ne choisit aucune colonne** : elle veut dire « compte les lignes ».
- **`GROUP BY` ne trie pas.** Le résultat ci-dessus est ordonné par le `ORDER BY nb DESC, genre` de la requête (le second critère départage `cuisine` et `roman`, tous deux à `nb = 2`) ; sans `ORDER BY`, l'ordre des groupes n'est pas garanti (ils peuvent sortir dans l'ordre alphabétique par hasard d'implémentation, mais rien ne le garantit). La preuve que `GROUP BY` n'est pas un tri : `GROUP BY genre DESC` est refusé par SQL Server et SQLite (erreur de syntaxe), car `DESC` n'a de sens que dans `ORDER BY`.
- **Selon le moteur, la moyenne peut s'afficher avec plus de décimales** que la colonne n'en contient (par exemple `21.000000` pour des prix à deux décimales).

> **Piège :** des valeurs mal saisies forment des groupes séparés. Un `GROUP BY ville` sur `Lyon`, `Lyon`, `Lyonn` rend deux groupes : `Lyon` (2) et `Lyonn` (1). Le serveur ne devine pas qu'il s'agit de la même ville.
>
> **Bonne pratique :** regarder les valeurs distinctes d'une colonne (`SELECT DISTINCT ville FROM clients` : `DISTINCT` retire les doublons) avant de grouper dessus, et normaliser la saisie à l'écriture.

### `GROUPING SETS` : total et détail en une seule requête (T-SQL)

Obtenir à la fois le total global et le détail par ville demanderait normalement deux requêtes séparées (une avec `GROUP BY`, une sans), ou une [`UNION`](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/set-operators-union-transact-sql) (qui empile les lignes de deux requêtes) des deux. `GROUPING SETS` (SQL Server, entre autres) calcule les deux dans le même passage sur la table :

```sql
SELECT ville, COUNT(*) AS nb_clients
FROM clients
GROUP BY GROUPING SETS ((ville), ());
-- (ville) : une ligne par ville, comme un GROUP BY classique
-- ()      : une ligne de total global, ville affichee a NULL
```

| Groupe demandé | Résultat |
|---|---|
| `(ville)` | Une ligne par ville distincte, comme `GROUP BY ville` seul |
| `()` (groupe vide) | Une seule ligne : le total sur l'ensemble de la table, `ville` vaut `NULL` |

> **Piège :** sur la ligne de total, `ville` vaut `NULL`, mais ce `NULL` signifie « ceci est un total agrégé », pas « valeur inconnue » comme le `NULL` vu plus bas ([`NULL` : une donnée manquante](#null-une-donnee-manquante-pas-une-valeur-comme-les-autres)). Filtrer naïvement `WHERE ville IS NOT NULL` supprimerait la ligne de total par erreur.
>
> **Bonne pratique :** utiliser `GROUPING(ville)` pour distinguer les deux sans ambiguïté : elle vaut `1` sur la ligne de total (la colonne est `NULL` parce qu'agrégée), `0` sinon (y compris si la vraie donnée `ville` était elle-même `NULL`).

```sql
SELECT
    ville,
    COUNT(*) AS nb_clients,
    GROUPING(ville) AS est_total  -- 1 = ligne de total, 0 = ligne detail
FROM clients
GROUP BY GROUPING SETS ((ville), ());
```

Apparentée à `ROLLUP` (hiérarchie de totaux imbriqués, ex. jour → mois → année) et `CUBE` (tous les croisements possibles entre plusieurs colonnes), `GROUPING SETS` en est la forme la plus explicite : chaque combinaison de colonnes voulue est écrite à la main entre parenthèses.

## `JOIN` : combiner deux tables sur une colonne commune

Équivalent déclaratif d'apparier deux collections par une clé partagée, au lieu d'écrire une boucle avec une recherche manuelle :

```sql
SELECT c.nom, v.date_achat
FROM clients c
-- INNER JOIN : les lignes sans correspondance disparaissent
JOIN ventes v ON v.client_id = c.id;
```

```sql
SELECT c.nom, v.date_achat
FROM clients c
-- garde TOUTES les lignes de gauche, NULL si pas de correspondance
LEFT JOIN ventes v ON v.client_id = c.id;
```

- `c`/`v` sont des alias de table, indispensables dès que deux tables partagent un nom de colonne (`c.nom` vs un éventuel `v.nom`, sans ambiguïté).
- `JOIN` (ou `INNER JOIN`) : ne garde que les lignes qui matchent des deux côtés.
- `LEFT JOIN` : garde toutes les lignes de la table de gauche, colonnes de droite à `NULL` si aucune correspondance : utile quand on veut lister *tout le monde*, correspondance trouvée ou pas (ex : tous les clients, qu'ils aient déjà acheté ou non).

> **Piège :** utiliser `JOIN` (INNER) quand on veut en réalité *tout le monde* : un client sans aucune vente disparaîtrait silencieusement du résultat, alors qu'un `LEFT JOIN` l'aurait gardé avec des colonnes à `NULL`.
>
> **Bonne pratique :** se demander explicitement, avant d'écrire la jointure, si les lignes sans correspondance doivent disparaître (`JOIN`) ou rester visibles (`LEFT JOIN`), les deux produisent un résultat syntaxiquement valide, mais sémantiquement différent.

### `OUTER APPLY` / `CROSS APPLY` : une jointure qui peut appeler une fonction par ligne (T-SQL)

La condition `ON` d'un `JOIN` classique ne peut référencer que des colonnes, jamais appeler une fonction ou une sous-requête paramétrée par la ligne courante. `APPLY` (SQL Server) lève cette limite : il exécute une sous-requête **pour chaque ligne** de la table de gauche, en lui passant les colonnes de cette ligne en paramètre.

```sql
SELECT c.nom, derniere.date_achat
FROM clients c
OUTER APPLY (
    SELECT TOP 1 v.date_achat
    FROM ventes v
    -- référence c, la ligne courante : impossible dans un ON de JOIN
    WHERE v.client_id = c.id
    ORDER BY v.date_achat DESC
) AS derniere;
```

| Variante | Comportement si la sous-requête ne renvoie rien |
|---|---|
| `CROSS APPLY` | La ligne de `clients` disparaît du résultat (équivalent `INNER JOIN`) |
| `OUTER APPLY` | La ligne de `clients` est gardée, colonnes de la sous-requête à `NULL` (équivalent `LEFT JOIN`) |

> **Note :** ce même besoin (référencer la ligne courante depuis une sous-requête jointe) s'appelle `LATERAL JOIN` sur PostgreSQL -- notion équivalente, syntaxe différente selon le moteur.

## Requête inter-bases sur la même instance

Une connexion ouverte sur une base peut lire directement une table d'une autre base, tant que les deux se trouvent sur le même serveur/instance et que le login a les droits sur les deux : il suffit de préfixer le nom de la table par la base et le schéma, avec la notation à trois segments `Base.schema.table`.

```sql
-- connecté à base_or, lit quand même base_argent sans linked server ni connexion séparée
SELECT *
FROM base_argent.dbo.scores_historique;
```

> **Piège :** confondre ce cas (même instance, juste une autre base) avec un accès à un serveur distant, qui lui nécessite un `linked server` ou une connexion séparée : la notation à trois segments ne fonctionne que sur la même instance.

## `CREATE TABLE` : créer une table (DDL)

```sql
CREATE TABLE clients (
    id    INT IDENTITY PRIMARY KEY,  -- identifiant unique, généré automatiquement
    nom   VARCHAR(100) NOT NULL,     -- texte obligatoire, jamais vide
    ville VARCHAR(100) NULL          -- texte facultatif, peut rester vide
);

CREATE TABLE ventes (
    id         INT IDENTITY PRIMARY KEY,
    client_id  INT NOT NULL,
    date_achat DATE NOT NULL,
    -- chaque vente doit pointer vers un client existant
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

- Chaque colonne a un type (`INT`, `VARCHAR(100)` pour du texte de 100 caractères max, `DATE`...) qui contraint ce qu'elle peut contenir.
- `NOT NULL` / `NULL` : oblige (ou non) la colonne à toujours avoir une valeur, indépendamment du type.
- `PRIMARY KEY` : identifie chaque ligne de façon unique ; `IDENTITY` la génère automatiquement (1, 2, 3...), pas besoin de la fournir.
- `FOREIGN KEY` : force `client_id` à toujours correspondre à un `id` existant dans `clients`, empêchant une vente orpheline.

> **Note :** renommer la table `clients` (ex : `sp_rename` sur [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/)) ne casse pas la contrainte `FOREIGN KEY` : elle est liée en interne à l'objet, pas à son nom.

## Index : accélérer une recherche ou une jointure

Un index est une structure auxiliaire (comme l'index d'un livre) qui permet au moteur de retrouver des lignes sans parcourir toute la table.

```sql
CREATE INDEX idx_clients_ville ON clients(ville);
```

> **Piège :** une clé composée de colonnes trop larges peut dépasser la limite de taille d'un index (900 octets sur [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/)).
>
> **Bonne pratique :** préférer une clé technique auto-générée (`IDENTITY`, dite clé de substitution) à une clé "naturelle" (ex : nom + adresse combinés) trop large pour être indexée efficacement.

## `ALTER TABLE` : ce qu'on peut modifier après coup

| Opération | Possible avec `ALTER TABLE` (SQL Server) |
|---|---|
| Ajouter une colonne | Oui, trivial |
| Supprimer une colonne | Oui |
| Changer le type d'une colonne | Oui, sous conditions (ex : donnée déjà présente compatible) |
| Réordonner physiquement les colonnes | Non : il faut recréer la table et copier les données |

> **Piège :** vouloir réordonner des colonnes existantes en croyant qu'un simple `ALTER TABLE` suffit, comme pour un ajout de colonne.

## Variable de table : s'exercer sans rien créer de durable (T-SQL)

Une **variable** est un nom qui désigne une valeur gardée en mémoire ; en T-SQL, son nom commence par `@` et `DECLARE` la déclare. Une **variable de table** est une variable qui contient une petite table entière : on la déclare avec ses colonnes, on la remplit avec `INSERT`, on la lit avec `SELECT`, comme une vraie table.

```sql
DECLARE @catalogue TABLE (          -- déclare la variable de table @catalogue
    id    INT PRIMARY KEY,          -- même syntaxe de colonnes que CREATE TABLE
    titre VARCHAR(100),
    prix  DECIMAL(8, 2)
);

INSERT INTO @catalogue (id, titre, prix)  -- remplit la variable, ligne par ligne
VALUES (1, 'Les Nuits de Brume', 12.50),
       (2, 'Atlas des mers', 39.90),
       (3, 'Le Dernier Phare', 9.90);

SELECT titre, prix
FROM @catalogue                     -- le @ reste obligatoire dans FROM
WHERE prix < 20
ORDER BY prix;
```

```
titre               prix
------------------  -----
Le Dernier Phare     9.90
Les Nuits de Brume  12.50
```

(Sortie attendue sous SQL Server, écrite à la main : ce script est du T-SQL, SQLite ne l'exécute pas. `decimal(8, 2)` garde deux décimales, d'où `9.90`.)

Cette variable n'existe que le temps d'une exécution : à la fin de l'exécution (le **lot** : l'ensemble des instructions envoyées d'un coup au serveur), elle disparaît avec ses lignes. Elle ne crée **rien de durable** dans la base (aucune table, rien à nettoyer ensuite). Comparée aux autres façons de ranger des lignes (une **table temporaire** est une vraie table mais éphémère, dont le nom commence par `#` et que le serveur supprime seul à la fin de la connexion, voir la [documentation](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql#temporary-tables) ; la **connexion** est définie [plus haut](#dates-date-contre-datetime)) :

| | `CREATE TABLE clients` | table temporaire `#t` | variable de table `@t` |
|---|---|---|---|
| Se déclare avec | `CREATE TABLE` | `CREATE TABLE #t (...)` | `DECLARE @t TABLE (...)` |
| Durée de vie | permanente, jusqu'à `DROP TABLE` | tant que la connexion vit (ou jusqu'à `DROP`) | l'exécution en cours |
| Visible par | tous les comptes autorisés | la connexion qui l'a créée | l'exécution qui l'a déclarée |
| Laisse une trace dans la base | oui | non | non |
| Usage typique | données de l'application | résultats intermédiaires, volumes moyens | petits essais, quelques lignes |

C'est un bon terrain d'exercice : on peut s'entraîner à `SELECT`, `WHERE` et `ORDER BY` sur des données inventées, sans droit d'écrire dans les tables de la base.

> **Piège :** sélectionner et lancer seulement la dernière partie du script (le `SELECT ... FROM @catalogue`) : la variable a été déclarée dans une exécution précédente, donc elle n'existe plus et le moteur répond que `@catalogue` n'est pas déclarée. Écrire `FROM catalogue` sans `@` échoue aussi (le moteur cherche une table de ce nom).
>
> **Bonne pratique :** lancer le script en entier (déclaration, `INSERT`, lecture) à chaque essai ; pour garder des données d'une exécution à l'autre, passer à une table temporaire `#t` ou à un [`CREATE TABLE`](#create-table-creer-une-table-ddl) ; pour un gros volume de lignes, ne pas utiliser de variable de table, conçue pour les petits volumes.

Détails de la syntaxe : [documentation officielle](https://learn.microsoft.com/en-us/sql/t-sql/data-types/table-transact-sql).

## `NULL` : une donnée manquante, pas une valeur comme les autres

`NULL` signifie "on ne sait pas" ou "rien n'a été renseigné" ; ce n'est **pas** la même chose qu'une valeur sentinelle comme `-1` ou une chaîne vide, qui signifie "on sait qu'il n'y en a structurellement pas".

```sql
SELECT AVG(remise) FROM ventes;
-- AVG/SUM/COUNT(colonne) ignorent les lignes à NULL : une remise à NULL
-- ne compte pas comme 0
```

> **Piège :** stocker `-1` au lieu de `NULL` pour "pas de remise" fausse `AVG(remise)`, qui compterait alors `-1` comme une vraie valeur numérique au lieu de l'ignorer.
>
> **Bonne pratique :** réserver `NULL` à "valeur inconnue/non renseignée" ; n'utiliser une valeur sentinelle que si son sens métier est documenté, et ne jamais mélanger les deux pour une même colonne.

### Comparer avec `NULL` : `IS NULL`, le piège de `<>` et `COUNT`

Un test comme `ville = 'Lyon'` donne « vrai » ou « faux » pour une ligne. Avec `NULL` (valeur inconnue), la réponse est un troisième état : **inconnu**, ni vrai ni faux. Or `WHERE` ne garde que les lignes dont la condition vaut **vrai** : une condition inconnue fait disparaître la ligne, comme une condition fausse.

Table `clients` utilisée ci-dessous (David n'a pas de ville renseignée) :

| id | nom | ville |
|---|---|---|
| 1 | Alice | Lyon |
| 2 | Bruno | Paris |
| 3 | Chloé | Lyon |
| 4 | David | `NULL` |
| 5 | Emma | Paris |
| 6 | Farid | Marseille |

| Condition | Alice (`Lyon`) | David (`NULL`) | Lignes gardées |
|---|---|---|---|
| `ville = 'Lyon'` | vrai | inconnu | Alice, Chloé |
| `ville <> 'Lyon'` | faux | inconnu | Bruno, Emma, Farid |
| `NOT (ville = 'Lyon')` | faux | inconnu | Bruno, Emma, Farid |
| `ville = NULL` | inconnu | inconnu | aucune |
| `ville IS NULL` | faux | vrai | David |
| `ville IS NOT NULL` | vrai | faux | tous sauf David |

Deux conséquences. Premièrement, `= NULL` ne renvoie jamais rien (même `NULL = NULL` est inconnu, avec le réglage par défaut de SQL Server, `ANSI_NULLS ON`) : il faut `IS NULL` ou `IS NOT NULL`.

```sql
SELECT nom FROM clients WHERE ville = NULL;     -- jamais aucune ligne, sans erreur
SELECT nom FROM clients WHERE ville IS NULL;    -- David
```

```
(première requête)  aucune ligne
(seconde requête)   David
```

Deuxièmement, **`<>` écarte aussi les lignes sans valeur** : « les clients qui n'habitent pas Lyon » devrait inclure David, qui n'y habite sûrement pas, mais sa ville est inconnue. La correction ajoute explicitement les lignes à `NULL` :

```sql
SELECT nom FROM clients
WHERE ville <> 'Lyon'      -- les villes connues et différentes de Lyon
   OR ville IS NULL;       -- plus les clients sans ville
```

```
nom
-----
Bruno
David
Emma
Farid
```

> **Piège :** écrire `WHERE ville <> 'Lyon'` en croyant obtenir « tous les autres » : les lignes à `NULL` disparaissent sans message. Même effet avec `NOT (ville = 'Lyon')`.
>
> **Bonne pratique :** pour toute condition de négation sur une colonne qui peut valoir `NULL`, se demander ce qu'on veut des lignes sans valeur, puis l'écrire (`OR colonne IS NULL`).

#### `COUNT(*)` contre `COUNT(colonne)`

| Écriture | Ce qu'elle compte |
|---|---|
| `COUNT(*)` | les **lignes**, quelles que soient leurs valeurs |
| `COUNT(colonne)` | les lignes où cette colonne a une **valeur** (pas `NULL`) |

```sql
SELECT COUNT(*) AS nb_lignes, COUNT(ville) AS nb_villes FROM clients;
```

```
nb_lignes  nb_villes
---------  ---------
6          5
```

La même logique vaut pour les autres fonctions : elles ne portent que sur les valeurs connues. Sur une table `films(id, titre, annee, note)`, `note` étant une colonne numérique (voir [Nombres](#nombres-int-numeric-et-decimal)), où deux films n'ont pas encore de note (`NULL`) et trois ont `8`, `6` et `10` :

```sql
SELECT COUNT(*) AS nb_lignes, COUNT(note) AS nb_notes,
       SUM(note) AS total, AVG(note) AS moyenne
FROM films;
```

```
nb_lignes  nb_notes  total  moyenne
---------  --------  -----  -------
5          3         24     8.0
```

(Sortie obtenue avec SQLite. Sous SQL Server, si `note` est un `decimal`, les sommes et moyennes s'affichent avec des décimales, `24.0` par exemple, et leur nombre varie selon le moteur. Si `note` est un `INT`, `AVG` renvoie un **entier** : `8` ici, mais `4` et non `4.8` pour la moyenne avec des zéros ci-dessous. Pour garder les décimales, écrire `AVG(CAST(note AS decimal(4, 1)))`.)

La moyenne vaut `24 / 3 = 8` (trois notes connues), et non `24 / 5 = 4.8`. Les films sans note ne tirent pas la moyenne vers le bas : ils sont ignorés, ce qui est le bon comportement tant que `NULL` veut dire « pas encore noté ». Si l'on remplace d'abord `NULL` par `0` ([`ISNULL`/`COALESCE`](#isnull-ne-remplir-une-colonne-que-si-elle-est-encore-vide)), la moyenne tombe à `4.8` (en `decimal` ou sous SQLite) : un `0` est une vraie note, pas une absence.

### `ISNULL()` : ne remplir une colonne que si elle est encore vide

`SET colonne = valeur` écrase toujours la colonne, y compris si elle contenait déjà une donnée valide. `ISNULL(colonne, valeur)` (équivalent standard SQL : `COALESCE(colonne, valeur)`) ne renvoie `valeur` que si `colonne` est actuellement `NULL`, et la colonne elle-même sinon : un rattrapage de données qui ne touche jamais une ligne déjà correctement renseignée.

```sql
-- ne modifie siret que pour les lignes ou il est encore NULL ; sans risque a rejouer
UPDATE clients SET siret = ISNULL(siret, '12345678900010') WHERE id = 1;
```

> **Bonne pratique :** ce motif est idempotent (rejouable sans risque à volonté) : utile pour un script de rattrapage qu'on peut relancer après un ajout partiel de données, sans jamais écraser une valeur déjà présente.

## Piloter SQL depuis PHP avec PDO

PDO (*[PHP](/?c=langages&s=php&p=php) Data Objects*) est l'interface native de [PHP](/?c=langages&s=php&p=php) pour dialoguer avec une base de données, quel que soit son moteur.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'utilisateur', 'motdepasse');

$stmt = $pdo->prepare('SELECT * FROM clients WHERE ville = :ville');
$stmt->execute([':ville' => 'Lyon']);

$ligne  = $stmt->fetch(\PDO::FETCH_ASSOC);     // une seule ligne, tableau associatif
$toutes = $stmt->fetchAll(\PDO::FETCH_ASSOC);  // toutes les lignes
?>
```

Le cycle est toujours le même : `prepare()` (écrire la requête, avec des espaces réservés comme `:ville`) → `execute()` (fournir les vraies valeurs) → `fetch()`/`fetchAll()` (récupérer le résultat).

> **Note :** `$pdo->query($sql)` est un raccourci **sans** espace réservé, utilisable uniquement si `$sql` est une string 100% écrite en dur, sans aucune variable externe concaténée dedans. Dès qu'une seule valeur externe (utilisateur, URL, session...) entre dans la requête, il faut passer par `prepare()`/`execute()`.

## `IN (...)` avec une liste de taille variable en PDO

PDO ne permet de paramétrer que des valeurs individuelles, jamais un tableau entier en un seul espace réservé : `IN (:villes)` avec `execute([':villes' => ['Lyon', 'Paris']])` ne fonctionne pas, PDO traiterait le tableau comme une seule valeur (une erreur, ou une conversion incorrecte selon le driver).

```php
<?php
function requeteAvecIn(PDO $pdo, string $sql, string $prefixe, array $valeurs): PDOStatement
{
    // Génère un placeholder nommé par valeur : préfixe_0, préfixe_1...
    $placeholders = [];
    $params = [];
    foreach (array_values($valeurs) as $i => $valeur) {
        $nom = ":{$prefixe}_{$i}";
        $placeholders[] = $nom;
        $params[$nom] = $valeur;
    }

    // Remplace le marqueur {IN} du SQL fourni par la liste de placeholders générée
    $sqlFinal = str_replace('{IN}', implode(', ', $placeholders), $sql);

    $stmt = $pdo->prepare($sqlFinal);
    $stmt->execute($params);
    return $stmt;
}

$stmt = requeteAvecIn(
    $pdo,
    'SELECT * FROM clients WHERE ville IN ({IN})',
    'ville',
    ['Lyon', 'Paris']
);
// SQL généré : SELECT * FROM clients WHERE ville IN (:ville_0, :ville_1)
```

| Étape | Rôle |
|---|---|
| Un placeholder nommé par valeur (`:ville_0`, `:ville_1`...) | Contourne la limite de PDO (un espace réservé = une seule valeur) |
| `implode(', ', $placeholders)` | Construit la liste `(:ville_0, :ville_1)` à insérer dans le `IN (...)` |
| `$params` | Chaque valeur reste passée séparément à `execute()`, jamais concaténée dans le texte SQL |

> **Piège :** une liste vide (`$valeurs = []`) génère un `IN ()` syntaxiquement invalide pour la plupart des moteurs SQL. Vérifier `$valeurs` non vide avant d'appeler cette fonction (ou court-circuiter la requête entière : une recherche sur une liste vide de villes ne peut de toute façon renvoyer aucun résultat).
>
> **Bonne pratique :** ne jamais concaténer directement les valeurs dans le `IN (...)` (ce serait la même faille d'[injection SQL](#injection-sql-pourquoi-ne-jamais-concatener-une-valeur-externe) que concaténer n'importe quelle autre valeur externe) ; générer systématiquement un placeholder par valeur, quelle que soit la taille de la liste.

## Piloter SQL depuis Python avec `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) est l'équivalent [Python](/?c=langages&s=python&p=python) de PDO pour dialoguer avec une base de données via un driver ODBC.

```python
import pyodbc

connexion = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=mon_serveur;DATABASE=boutique;UID=utilisateur;PWD=motdepasse"
)  # ouvre la connexion vers la base

curseur = connexion.cursor()
# ? = espace réservé, valeur passée séparément
curseur.execute("SELECT * FROM clients WHERE ville = ?", "Lyon")

une_ligne = curseur.fetchone()   # une seule ligne
toutes    = curseur.fetchall()   # toutes les lignes

# valide les écritures (INSERT/UPDATE/DELETE) ; inutile après un simple SELECT
connexion.commit()
```

Même cycle que PDO : `connect()` (ouvrir la connexion) → `cursor()` → `execute()` (avec `?` comme espace réservé, valeur passée à part, jamais concaténée) → `fetchone()`/`fetchall()`. `executemany()` répète une même requête pour une liste de jeux de valeurs (insertion en masse), plus rapide qu'une boucle de `execute()` un par un.

### Authentification Windows intégrée : un message d'échec peut cacher deux causes différentes

Avec `Trusted_Connection=yes` dans la chaîne de connexion, aucun login ni mot de passe n'est fourni : Windows négocie l'identité en coulisses (Kerberos si un contrôleur de domaine est joignable, sinon repli NTLM), et le serveur SQL reçoit une identité déjà authentifiée.

```python
connexion = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=mon_serveur;DATABASE=boutique;Trusted_Connection=yes"
)
```

> **Piège :** un message `Login failed for user 'DOMAINE\utilisateur'` NE signifie PAS forcément que Kerberos/NTLM a échoué. L'identité Windows a très bien pu être négociée avec succès (authentification), mais le serveur SQL n'a ensuite trouvé aucun login mappé à ce compte sur CETTE instance précise (autorisation) : deux causes distinctes, exactement le même message d'erreur.
>
> **Bonne pratique :** avant de chercher un problème réseau/Kerberos, vérifier qu'un login existe bien pour ce compte Windows sur l'instance visée (ex : en confirmant que le même compte, depuis la même machine, se connecte sans problème à une autre instance).

## `sqlcmd` : exécuter un script SQL en ligne de commande, avec des variables (SQL Server)

`sqlcmd` exécute un fichier `.sql` directement en ligne de commande, sans passer par un langage hôte. L'option `-v` définit une **variable de script**, substituée dans le texte SQL avant exécution via `$(NOM)` :

```bash
sqlcmd -S mon_serveur -v DBNAME=base_recette -i script.sql
```

```sql
-- script.sql
USE [$(DBNAME)];

IF '$(DBNAME)' = '' OR '$(DBNAME)' = '$' + '(DBNAME)'
    RAISERROR('La variable DBNAME doit etre fournie via -v', 16, 1);
```

Le second test de la garde (`'$' + '(DBNAME)'`) attrape le cas où `$(DBNAME)` n'a même pas été substitué et apparaît tel quel dans le texte exécuté (script lancé sans `-v`, ou avec un nom de variable mal orthographié). `:setvar NOM valeur` fait la même chose directement dans le script, plutôt que sur la ligne de commande.

> **Bonne pratique :** paramétrer un même script `.sql` pour plusieurs environnements (pprod/prod) via `-v`, plutôt que de le dupliquer ou de le générer dynamiquement depuis un langage hôte.

## Injection SQL : pourquoi ne jamais concaténer une valeur externe

```php
<?php
// JAMAIS :
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

Si `$_GET['ville']` contenait `Lyon' OR '1'='1`, la requête deviendrait une condition toujours vraie, renvoyant toutes les lignes de la table. Équivalent conceptuel d'un [dépassement de tampon](/?c=langages&s=c&p=memoire) en [C](/?c=langages&s=c&p=c) : une entrée non contrôlée qui modifie la **structure** de la commande, au lieu de rester une simple donnée.

Les espaces réservés nommés (`:ville`) empêchent ça structurellement : la valeur passée à `execute()` est **toujours** traitée comme une donnée pure par le driver, jamais réinterprétée comme du SQL, quoi qu'elle contienne.

```php
<?php
// Construire dynamiquement une clause WHERE reste sûr,
// tant que seuls les NOMS de placeholders sont concaténés, jamais les valeurs elles-mêmes :
function construireEt(array $criteres): array
{
    $clauses = [];
    $params  = [];
    foreach ($criteres as $colonne => $valeur) {
        $clauses[] = "{$colonne} = :{$colonne}";
        $params[":{$colonne}"] = $valeur;
    }
    return [implode(' AND ', $clauses), $params];
}
// construireEt(['ville' => 'Lyon']) -> ["ville = :ville", [':ville' => 'Lyon']]
?>
```

Le texte SQL généré ne contient jamais la valeur réelle, seulement le nom littéral du placeholder (`:ville`) : la vraie valeur part séparément dans `$params`, utilisée par `execute($params)`.

> **Note (sécurité) :** ce mécanisme protège les **valeurs** (`$valeur`), mais pas les **noms de colonnes** (`$colonne`) : ceux-ci sont concaténés directement dans le SQL, sans passer par un placeholder (ce n'est techniquement pas possible : PDO ne permet de paramétrer que des valeurs, jamais des noms de colonnes ou de tables). Si `$criteres` provenait directement d'une entrée utilisateur non filtrée (ex. `construireEt($_GET)`), un nom de colonne forgé pourrait réintroduire une injection SQL. `$colonne` doit donc toujours provenir d'une liste blanche de colonnes autorisées à l'avance, jamais directement d'une entrée externe.

## Le principe du moindre privilège

Au-delà de l'injection SQL (qui protège le *comment* on interroge la base), une bonne pratique de sécurité porte sur le *qui* : le compte utilisé par une application pour se connecter à la base ne devrait jamais avoir plus de droits que ce dont elle a réellement besoin.

```sql
-- au lieu de donner tous les droits à un seul compte applicatif :
GRANT SELECT, INSERT, UPDATE ON boutique.commandes TO 'app_boutique'@'%';
-- pas de DROP, DELETE, ni accès aux autres tables/bases, si l'application
-- n'en a jamais besoin
```

Concrètement, un compte applicatif compromis (via une faille dans le code, une fuite d'identifiants...) ne peut faire de dégâts qu'à la mesure de ses propres droits : un compte limité à `SELECT`/`INSERT`/`UPDATE` sur une seule table ne permet pas à un attaquant de supprimer toute une base de données, même s'il parvient à exécuter des requêtes arbitraires. C'est une protection **complémentaire** aux requêtes préparées, pas un substitut : elle limite les dégâts *si* une injection a quand même lieu (bug non détecté, requête dynamique mal construite...), plutôt que d'empêcher l'injection elle-même.

## `MERGE` : UPSERT en une seule requête (SQL Server)

Une paire `SELECT` puis `UPDATE`/`INSERT` conditionnel pour synchroniser une table cible à partir d'une source demande deux requêtes et une décision en code (ou en T-SQL) entre les deux. `MERGE` fait les deux en une seule instruction atomique : elle compare une source (`USING`) à la cible sur une clé (`ON`), et exécute `WHEN MATCHED THEN UPDATE` ou `WHEN NOT MATCHED THEN INSERT` selon le cas.

```sql
MERGE clients AS cible
USING (SELECT 1 AS id_client, 'Dupont' AS nom, 'Marseille' AS ville) AS source
ON cible.id = source.id_client
WHEN MATCHED THEN
    UPDATE SET cible.nom = source.nom, cible.ville = source.ville
WHEN NOT MATCHED THEN
    INSERT (id, nom, ville) VALUES (source.id_client, source.nom, source.ville);
```

> **Bonne pratique :** générer le texte du `MERGE` depuis une simple liste `(colonne, type)` en code plutôt que d'écrire chaque `UPDATE SET`/`INSERT` à la main : ajouter une colonne au schéma ne demande alors qu'une entrée dans cette liste, jamais de retoucher le gabarit SQL.

## SCD2 : garder l'historique des changements d'une table

Un `UPDATE` classique écrase l'ancienne valeur pour toujours :

```sql
-- l'ancienne ville 'Lyon' est perdue définitivement
UPDATE clients SET ville = 'Paris' WHERE id = 1;
```

Le motif **SCD2** (*[Slowly Changing Dimension](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/) type 2*) évite cette perte : au lieu d'écraser une ligne, on ferme la version actuelle et on en insère une nouvelle, en gardant les deux.

| Colonne | Rôle |
|---|---|
| `valid_from` | Date à partir de laquelle cette version de la ligne est valide |
| `valid_to` | Date jusqu'à laquelle elle l'était (`NULL` si toujours valide) |
| `is_current` | Vrai uniquement pour la version actuelle de cette ligne |

```sql
-- 1. fermer la version actuelle
UPDATE clients SET valid_to = GETDATE(), is_current = 0
WHERE id_client = 1 AND is_current = 1;

-- 2. insérer la nouvelle version
INSERT INTO clients (id_client, nom, ville, valid_from, valid_to, is_current)
VALUES (1, 'Dupont', 'Paris', GETDATE(), NULL, 1);
```

> **Piège :** `id_client` (l'identifiant métier) se répète désormais sur plusieurs lignes (une par version) : la `PRIMARY KEY` de la table doit être une clé technique séparée (`IDENTITY`), pas `id_client` seul.
>
> **Bonne pratique :** réserver SCD2 aux colonnes dont l'historique compte réellement pour l'usage qu'on en fait (ex : la ville d'un client pour une analyse géographique dans le temps) ; écraser normalement (`UPDATE` simple) les colonnes où seule la valeur actuelle importe.

## Pour aller plus loin

- [Documentation PDO (php.net)](https://www.php.net/manual/fr/book.pdo.php)
- [Documentation `pyodbc` (dépôt officiel)](https://github.com/mkleehammer/pyodbc/wiki)
- [W3Schools SQL (en anglais, bon aide-mémoire syntaxe)](https://www.w3schools.com/sql/)

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Chaque colonne a un type (`INT`, `decimal`, `varchar`, `date`) et une clé primaire identifie chaque ligne. SQL interroge (DML) et définit la structure (DDL) de tables (colonnes fixes, lignes = enregistrements). `JOIN` combine deux tables sur une colonne commune ; `INNER JOIN` élimine les lignes sans correspondance, `LEFT JOIN` les garde ; `APPLY` combine une jointure et un appel de fonction/sous-requête paramétrée par ligne. `GROUP BY`/`GROUPING SETS` résument par groupe, avec ou sans total global dans la même requête. `NULL` = valeur inconnue, à ne jamais confondre avec une valeur sentinelle. `MERGE` fait en une requête ce qu'un `SELECT` puis `UPDATE`/`INSERT` ferait en deux. Une requête se lit clause par clause (`SELECT` les colonnes, `FROM` la table, `WHERE` les lignes) et le serveur la traite dans l'ordre `WHERE`, `GROUP BY`, calcul, `ORDER BY`. Une table n'a aucun ordre garanti : seul `ORDER BY` en fixe un. Avec `NULL`, une comparaison vaut « inconnu » et `WHERE` ne garde que le « vrai ». |
| **Outils utilisables** | `SELECT`/`WHERE`, fonctions d'agrégation (`COUNT`/`SUM`/`AVG`), `GROUP BY`/`GROUPING SETS`/`GROUPING()`, `JOIN`/`LEFT JOIN`/`OUTER APPLY`/`CROSS APPLY`, notation à trois segments pour une requête inter-bases sur la même instance, `MERGE` pour un UPSERT, `ISNULL()`/`COALESCE()` pour un rattrapage idempotent, `CREATE TABLE`/`ALTER TABLE`, index, requêtes préparées via PDO ([PHP](/?c=langages&s=php&p=php), y compris un `IN (...)` de taille variable via des placeholders générés) ou `pyodbc` ([Python](/?c=langages&s=python&p=python)), `sqlcmd` pour un script paramétré en ligne de commande, SCD2 pour historiser des changements, `ORDER BY`, `TOP n`, `CAST`, `IS NULL`, variable de table `DECLARE @t TABLE` pour s'exercer sans rien créer de durable. |
| **Pièges à éviter** | Concaténer une valeur externe dans une requête SQL (injection), y compris dans un `IN (...)` ; `INNER JOIN` quand on veut garder les lignes sans correspondance ; réordonner des colonnes via `ALTER TABLE` (impossible, il faut recréer la table) ; confondre `NULL` et une valeur sentinelle, y compris le `NULL` de total d'un `GROUPING SETS` ; interpréter un échec de login sur une connexion Windows intégrée comme forcément un échec Kerberos/NTLM, alors que l'authentification peut avoir réussi sans qu'un login existe sur l'instance ; `TOP n` sans `ORDER BY` ; un `;` placé entre deux clauses ; comparer des types différents (nombre contre date) ; `<>` ou `= NULL` sur une colonne qui contient des `NULL` ; croire qu'un calcul porte sur toute la table alors qu'il porte sur les lignes gardées par `WHERE`. |
| **Bonnes pratiques** | Toujours une requête préparée (`prepare`/`execute`) pour une valeur externe, y compris chaque valeur d'un `IN (...)` via un placeholder par valeur ; limiter les droits du compte applicatif (moindre privilège) ; clé technique (`IDENTITY`) plutôt que clé naturelle large pour l'indexation ; `GROUPING()` pour distinguer une ligne de total d'une vraie valeur `NULL` ; `ISNULL(colonne, valeur)` plutôt qu'un `UPDATE` direct pour un rattrapage rejouable sans risque ; `ORDER BY` pour tout résultat dont l'ordre compte ; parenthèses autour d'un `OR` combiné à un `AND` ; `decimal(p, s)` pour l'argent ; `IS NULL` plutôt que `= NULL`, et `COUNT(*)` pour connaître le total des lignes. |
