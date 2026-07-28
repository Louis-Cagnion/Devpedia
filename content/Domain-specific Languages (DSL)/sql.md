---
title: SQL
---

SQL (*Structured Query Language*) est un langage à but unique : interroger et manipuler des données stockées sous forme de tables. Comme la regex, ce n'est pas un langage de programmation généraliste — il n'a ni boucles, ni fonctions définies par l'utilisateur, ni variables au sens classique. Il est interprété par un moteur de base de données (MySQL, PostgreSQL, SQL Server, SQLite...), généralement piloté depuis un langage hôte (PHP, Python, JS...) via un connecteur.

## Une table = un tableau de structs / une liste de dicts

Une table relationnelle a des colonnes fixes (comme les champs d'un `struct` en C, ou les clés d'un dict en Python) ; chaque ligne est une instance de cette structure.

```sql
SELECT id, nom FROM clients WHERE ville = 'Lyon';
```

"Colonnes `id`/`nom`, depuis la table `clients`, seulement les lignes où `ville = 'Lyon'`." `SELECT *` sélectionne toutes les colonnes.

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

## `JOIN` : combiner deux tables sur une colonne commune

Équivalent déclaratif d'apparier deux collections par une clé partagée, au lieu d'écrire une boucle avec une recherche manuelle :

```sql
SELECT c.nom, v.date_achat
FROM clients c
JOIN ventes v ON v.client_id = c.id; -- INNER JOIN : les lignes sans correspondance disparaissent
```

```sql
SELECT c.nom, v.date_achat
FROM clients c
LEFT JOIN ventes v ON v.client_id = c.id; -- garde TOUTES les lignes de gauche, NULL si pas de correspondance
```

- `c`/`v` sont des alias de table, indispensables dès que deux tables partagent un nom de colonne (`c.nom` vs un éventuel `v.nom`, sans ambiguïté).
- `JOIN` (ou `INNER JOIN`) : ne garde que les lignes qui matchent des deux côtés.
- `LEFT JOIN` : garde toutes les lignes de la table de gauche, colonnes de droite à `NULL` si aucune correspondance — utile quand on veut lister *tout le monde*, correspondance trouvée ou pas (ex : tous les clients, qu'ils aient déjà acheté ou non).

## Piloter SQL depuis PHP avec PDO

PDO (*PHP Data Objects*) est l'interface native de PHP pour dialoguer avec une base de données, quel que soit son moteur.

```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=boutique', 'utilisateur', 'motdepasse');

$stmt = $pdo->prepare('SELECT * FROM clients WHERE ville = :ville');
$stmt->execute([':ville' => 'Lyon']);

$ligne  = $stmt->fetch(\PDO::FETCH_ASSOC);    // une seule ligne, tableau associatif
$toutes = $stmt->fetchAll(\PDO::FETCH_ASSOC); // toutes les lignes
?>
```

Le cycle est toujours le même : `prepare()` (écrire la requête, avec des espaces réservés comme `:ville`) → `execute()` (fournir les vraies valeurs) → `fetch()`/`fetchAll()` (récupérer le résultat).

> **Note :** `$pdo->query($sql)` est un raccourci **sans** espace réservé, utilisable uniquement si `$sql` est une string 100% écrite en dur, sans aucune variable externe concaténée dedans. Dès qu'une seule valeur externe (utilisateur, URL, session...) entre dans la requête, il faut passer par `prepare()`/`execute()`.

## Injection SQL : pourquoi ne jamais concaténer une valeur externe

```php
<?php
// JAMAIS :
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

Si `$_GET['ville']` contenait `Lyon' OR '1'='1`, la requête deviendrait une condition toujours vraie, renvoyant toutes les lignes de la table. Équivalent conceptuel d'un dépassement de tampon en C : une entrée non contrôlée qui modifie la **structure** de la commande, au lieu de rester une simple donnée.

Les espaces réservés nommés (`:ville`) empêchent ça structurellement : la valeur passée à `execute()` est **toujours** traitée comme une donnée pure par le driver, jamais réinterprétée comme du SQL, quoi qu'elle contienne.

```php
<?php
// Construire dynamiquement une clause WHERE reste sûr,
// tant que seuls les NOMS de placeholders sont concaténés — jamais les valeurs elles-mêmes :
function construireOu(array $criteres): array
{
    $clauses = [];
    $params  = [];
    foreach ($criteres as $colonne => $valeur) {
        $clauses[] = "{$colonne} = :{$colonne}";
        $params[":{$colonne}"] = $valeur;
    }
    return [implode(' AND ', $clauses), $params];
}
// construireOu(['ville' => 'Lyon']) -> ["ville = :ville", [':ville' => 'Lyon']]
?>
```

Le texte SQL généré ne contient jamais la valeur réelle, seulement le nom littéral du placeholder (`:ville`) — la vraie valeur part séparément dans `$params`, utilisée par `execute($params)`.

## Pour aller plus loin

- [Documentation PDO — php.net](https://www.php.net/manual/fr/book.pdo.php)
- [W3Schools SQL (en anglais, bon aide-mémoire syntaxe)](https://www.w3schools.com/sql/)
