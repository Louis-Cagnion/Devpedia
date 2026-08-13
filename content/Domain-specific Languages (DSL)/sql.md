---
order: 2
---

# SQL

SQL (*Structured Query Language*) est un langage à but unique : interroger et manipuler des données stockées sous forme de tables. Comme [la regex](/?c=domain-specific-languages-dsl&p=regex), ce n'est pas un langage de programmation généraliste : il n'a ni boucles, ni fonctions définies par l'utilisateur, ni variables au sens classique. Il est interprété par un moteur de base de données ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), généralement piloté depuis un langage hôte ([PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JS](/?c=langages-de-programmation&s=javascript&p=javascript)...) via un connecteur.

## Une table, comme une feuille de tableur

Une table relationnelle ressemble à une feuille de tableur : des colonnes fixes, nommées à l'avance (`id`, `nom`, `ville`...), et chaque ligne représente un enregistrement complet qui remplit toutes ces colonnes.

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
- `LEFT JOIN` : garde toutes les lignes de la table de gauche, colonnes de droite à `NULL` si aucune correspondance : utile quand on veut lister *tout le monde*, correspondance trouvée ou pas (ex : tous les clients, qu'ils aient déjà acheté ou non).

> **Piège :** utiliser `JOIN` (INNER) quand on veut en réalité *tout le monde* : un client sans aucune vente disparaîtrait silencieusement du résultat, alors qu'un `LEFT JOIN` l'aurait gardé avec des colonnes à `NULL`.
>
> **Bonne pratique :** se demander explicitement, avant d'écrire la jointure, si les lignes sans correspondance doivent disparaître (`JOIN`) ou rester visibles (`LEFT JOIN`), les deux produisent un résultat syntaxiquement valide, mais sémantiquement différent.

## Piloter SQL depuis PHP avec PDO

PDO (*PHP Data Objects*) est l'interface native de PHP pour dialoguer avec une base de données, quel que soit son moteur.

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

## Injection SQL : pourquoi ne jamais concaténer une valeur externe

```php
<?php
// JAMAIS :
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

Si `$_GET['ville']` contenait `Lyon' OR '1'='1`, la requête deviendrait une condition toujours vraie, renvoyant toutes les lignes de la table. Équivalent conceptuel d'un [dépassement de tampon](/?c=langages-de-programmation&s=c&p=memoire) en C : une entrée non contrôlée qui modifie la **structure** de la commande, au lieu de rester une simple donnée.

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
-- pas de DROP, DELETE, ni accès aux autres tables/bases, si l'application n'en a jamais besoin
```

Concrètement, un compte applicatif compromis (via une faille dans le code, une fuite d'identifiants...) ne peut faire de dégâts qu'à la mesure de ses propres droits : un compte limité à `SELECT`/`INSERT`/`UPDATE` sur une seule table ne permet pas à un attaquant de supprimer toute une base de données, même s'il parvient à exécuter des requêtes arbitraires. C'est une protection **complémentaire** aux requêtes préparées, pas un substitut : elle limite les dégâts *si* une injection a quand même lieu (bug non détecté, requête dynamique mal construite...), plutôt que d'empêcher l'injection elle-même.

## Pour aller plus loin

- [Documentation PDO (php.net)](https://www.php.net/manual/fr/book.pdo.php)
- [W3Schools SQL (en anglais, bon aide-mémoire syntaxe)](https://www.w3schools.com/sql/)

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | SQL interroge et manipule des tables (colonnes fixes, lignes = enregistrements). `JOIN` combine deux tables sur une colonne commune ; `INNER JOIN` élimine les lignes sans correspondance, `LEFT JOIN` les garde. |
| **Outils utilisables** | `SELECT`/`WHERE`, fonctions d'agrégation (`COUNT`/`SUM`/`AVG`), `JOIN`/`LEFT JOIN`, requêtes préparées via PDO. |
| **Pièges à éviter** | Concaténer une valeur externe directement dans une requête SQL (injection SQL) ; utiliser `INNER JOIN` quand on veut garder les lignes sans correspondance. |
| **Bonnes pratiques** | Toujours passer par une requête préparée (`prepare`/`execute`) pour une valeur externe ; limiter les droits du compte applicatif au strict nécessaire (principe du moindre privilège). |
