---
order: 2
---

# SQL

SQL (*Structured Query Language*) est un langage à but unique : interroger et manipuler des données stockées sous forme de tables. Comme [la regex](/?c=domain-specific-languages-dsl&p=regex), ce n'est pas un langage de programmation généraliste : il n'a ni boucles, ni fonctions définies par l'utilisateur, ni variables au sens classique. Il est interprété par un moteur de base de données ([MySQL](https://dev.mysql.com/doc/), [PostgreSQL](https://www.postgresql.org/docs/), [SQL Server](https://learn.microsoft.com/en-us/sql/sql-server/), [SQLite](https://sqlite.org/docs.html)...), généralement piloté depuis un langage hôte ([PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JS](/?c=langages-de-programmation&s=javascript&p=javascript)...) via un connecteur.

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
    FOREIGN KEY (client_id) REFERENCES clients(id)  -- chaque vente doit pointer vers un client existant
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

## `NULL` : une donnée manquante, pas une valeur comme les autres

`NULL` signifie "on ne sait pas" ou "rien n'a été renseigné" ; ce n'est **pas** la même chose qu'une valeur sentinelle comme `-1` ou une chaîne vide, qui signifie "on sait qu'il n'y en a structurellement pas".

```sql
SELECT AVG(remise) FROM ventes;
-- AVG/SUM/COUNT(colonne) ignorent les lignes à NULL : une remise à NULL ne compte pas comme 0
```

> **Piège :** stocker `-1` au lieu de `NULL` pour "pas de remise" fausse `AVG(remise)`, qui compterait alors `-1` comme une vraie valeur numérique au lieu de l'ignorer.
>
> **Bonne pratique :** réserver `NULL` à "valeur inconnue/non renseignée" ; n'utiliser une valeur sentinelle que si son sens métier est documenté, et ne jamais mélanger les deux pour une même colonne.

## Piloter SQL depuis PHP avec PDO

PDO (*[PHP](/?c=langages-de-programmation&s=php&p=php) Data Objects*) est l'interface native de [PHP](/?c=langages-de-programmation&s=php&p=php) pour dialoguer avec une base de données, quel que soit son moteur.

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

## Piloter SQL depuis Python avec `pyodbc`

[`pyodbc`](https://github.com/mkleehammer/pyodbc/wiki) est l'équivalent [Python](/?c=langages-de-programmation&s=python&p=python) de PDO pour dialoguer avec une base de données via un driver ODBC.

```python
import pyodbc

connexion = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=mon_serveur;DATABASE=boutique;UID=utilisateur;PWD=motdepasse"
)  # ouvre la connexion vers la base

curseur = connexion.cursor()
curseur.execute("SELECT * FROM clients WHERE ville = ?", "Lyon")  # ? = espace réservé, valeur passée séparément

une_ligne = curseur.fetchone()   # une seule ligne
toutes    = curseur.fetchall()   # toutes les lignes

connexion.commit()  # valide les écritures (INSERT/UPDATE/DELETE) ; inutile après un simple SELECT
```

Même cycle que PDO : `connect()` (ouvrir la connexion) → `cursor()` → `execute()` (avec `?` comme espace réservé, valeur passée à part, jamais concaténée) → `fetchone()`/`fetchall()`. `executemany()` répète une même requête pour une liste de jeux de valeurs (insertion en masse), plus rapide qu'une boucle de `execute()` un par un.

## Injection SQL : pourquoi ne jamais concaténer une valeur externe

```php
<?php
// JAMAIS :
$sql = "SELECT * FROM clients WHERE ville = '" . $_GET['ville'] . "'";
?>
```

Si `$_GET['ville']` contenait `Lyon' OR '1'='1`, la requête deviendrait une condition toujours vraie, renvoyant toutes les lignes de la table. Équivalent conceptuel d'un [dépassement de tampon](/?c=langages-de-programmation&s=c&p=memoire) en [C](/?c=langages-de-programmation&s=c&p=c) : une entrée non contrôlée qui modifie la **structure** de la commande, au lieu de rester une simple donnée.

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

## SCD2 : garder l'historique des changements d'une table

Un `UPDATE` classique écrase l'ancienne valeur pour toujours :

```sql
UPDATE clients SET ville = 'Paris' WHERE id = 1;  -- l'ancienne ville 'Lyon' est perdue définitivement
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
| **À retenir** | SQL interroge (DML) et définit la structure (DDL) de tables (colonnes fixes, lignes = enregistrements). `JOIN` combine deux tables sur une colonne commune ; `INNER JOIN` élimine les lignes sans correspondance, `LEFT JOIN` les garde. `NULL` = valeur inconnue, à ne jamais confondre avec une valeur sentinelle. |
| **Outils utilisables** | `SELECT`/`WHERE`, fonctions d'agrégation (`COUNT`/`SUM`/`AVG`), `JOIN`/`LEFT JOIN`, `CREATE TABLE`/`ALTER TABLE`, index, requêtes préparées via PDO ([PHP](/?c=langages-de-programmation&s=php&p=php)) ou `pyodbc` ([Python](/?c=langages-de-programmation&s=python&p=python)), SCD2 pour historiser des changements. |
| **Pièges à éviter** | Concaténer une valeur externe dans une requête SQL (injection) ; `INNER JOIN` quand on veut garder les lignes sans correspondance ; réordonner des colonnes via `ALTER TABLE` (impossible, il faut recréer la table) ; confondre `NULL` et une valeur sentinelle. |
| **Bonnes pratiques** | Toujours une requête préparée (`prepare`/`execute`) pour une valeur externe ; limiter les droits du compte applicatif (moindre privilège) ; clé technique (`IDENTITY`) plutôt que clé naturelle large pour l'indexation. |
