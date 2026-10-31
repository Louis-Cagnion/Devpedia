---
order: 12
---

# Migrations de données sûres

Une **base de données** est un logiciel qui range des informations dans des **tables** (comme des feuilles de tableur : une **ligne** par élément, une **colonne** par caractéristique). Quand une application évolue, il faut souvent modifier les lignes déjà présentes : corriger l'écriture d'un statut, remplir une nouvelle colonne, supprimer d'anciens comptes. Cette opération s'appelle une **migration de données**. Elle est plus risquée qu'un changement de code : un code fautif se corrige en rétablissant l'ancienne version, alors que des lignes détruites ou mal réécrites ne reviennent pas toutes seules. Ce chapitre donne quatre protections : la migration versionnée, la simulation, le SQL en masse et le garde-fou avant suppression.

Les migrations qui changent la **structure** des tables (ajouter une colonne, une table) sont présentées dans la section « Les migrations » du chapitre sur [l'ORM](/?c=donnees&s=bases-de-donnees&p=orm) ; ici, on s'occupe des **données**. Le cycle de vie d'une entité (ce qui se déclenche autour de l'enregistrement d'un objet) fait l'objet d'un autre chapitre.

Les exemples utilisent [SQLite](https://www.sqlite.org/docs.html), une base de données contenue dans un seul fichier, sans serveur à installer, et [PHP](/?c=langages&s=php&p=syntaxe) pour piloter la base. Les commandes se tapent dans un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Le langage de requêtes est [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql).

## La migration versionnée

Une **migration versionnée** est un fichier qui décrit **un seul changement**, numéroté pour fixer l'ordre, et que l'on ne modifie plus une fois appliqué. Une **table de suivi** retient quelles migrations ont déjà été jouées, pour ne jamais jouer la même deux fois. Voici trois fichiers d'un dossier `migrations/`. Chaque ligne de SQL qui commence par `--` est un commentaire.

Premier fichier, `migrations/0001_creer_clients.sql` :

```sql
-- Crée la table des clients (une ligne par client)
CREATE TABLE clients (
    id INTEGER PRIMARY KEY,      -- numéro unique de la ligne
    email TEXT NOT NULL,         -- adresse du client
    statut TEXT NOT NULL         -- état du compte, écrit à la main au début
);
-- Données de départ, avec des statuts écrits de façons différentes
INSERT INTO clients (email, statut) VALUES
    ('ana@exemple.org', 'Actif'),
    ('bob@exemple.org', 'actif '),
    ('chloe@exemple.org', 'ACTIF'),
    ('dan@exemple.org', 'inactif'),
    ('eva@exemple.org', 'Inactif');
```

Deuxième fichier, `migrations/0002_normaliser_statuts.sql` : un `UPDATE` (commande SQL qui modifie des lignes existantes), qui s'appuie sur la table créée par le premier.

```sql
-- Uniformise le statut : minuscules, sans espace autour
UPDATE clients SET statut = lower(trim(statut));
```

Troisième fichier, `migrations/0003_ajouter_derniere_connexion.sql` :

```sql
-- Ajoute une colonne pour la date de dernière connexion
ALTER TABLE clients ADD COLUMN derniere_connexion TEXT;
-- Remplit la colonne pour les lignes déjà présentes
UPDATE clients SET derniere_connexion = '2020-01-01' WHERE statut = 'inactif';
UPDATE clients SET derniere_connexion = '2026-10-01' WHERE statut = 'actif';
```

| Règle | Pourquoi |
|---|---|
| Un fichier par changement | Un échec se localise tout de suite ; le fichier se relit en entier |
| Un numéro en tête du nom (`0001`, `0002`) | L'ordre de passage est le même sur tous les postes et serveurs |
| Jamais de modification après application | Les bases déjà migrées ne rejoueraient pas le fichier : les environnements divergeraient |
| Une table qui retient les migrations jouées | Relancer le programme ne rejoue rien ; un fichier nouveau est repéré seul |
| Une empreinte par fichier | Une modification après coup est détectée au lieu d'être ignorée |

Une **empreinte** (*hash*) est une courte suite de caractères calculée à partir du texte du fichier ; si une seule lettre change, l'empreinte change (voir [le hachage](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) pour le principe). Le programme suivant, `migrate.php`, applique toutes les migrations pas encore jouées. Il les entoure d'une **transaction**, un groupe d'opérations qui réussit en entier ou est entièrement annulé (`beginTransaction`, `commit` pour valider, `rollBack` pour annuler). `PDO` est l'interface de PHP pour parler à une base (voir [Piloter SQL depuis PHP avec PDO](/?c=langages&s=domain-specific-languages-dsl&p=sql)) ; la fonction SQL `total_changes()` de SQLite renvoie le nombre de lignes modifiées depuis l'ouverture de la connexion, ce qui sert à compter l'effet de chaque fichier.

```php
<?php
// Usage : php migrate.php [--dry-run]
$simulation = in_array('--dry-run', $argv, true);   // vrai si l'option est donnée
$pdo = new PDO('sqlite:app.db');                    // ouvre (ou crée) la base
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // erreur = exception

// Table qui retient les migrations déjà jouées, avec l'empreinte du fichier
$pdo->exec('CREATE TABLE IF NOT EXISTS migrations (
    nom TEXT PRIMARY KEY, empreinte TEXT NOT NULL, jouee_le TEXT NOT NULL)');

// Lit les migrations déjà jouées : nom => empreinte
$jouees = $pdo->query('SELECT nom, empreinte FROM migrations')
    ->fetchAll(PDO::FETCH_KEY_PAIR);

$fichiers = glob(__DIR__ . '/migrations/*.sql');    // liste les fichiers
sort($fichiers);                                    // ordre du numéro : 0001, 0002...

/** Compte toutes les lignes modifiées depuis l'ouverture de la connexion. */
function lignesModifiees(PDO $pdo): int
{
    return (int) $pdo->query('SELECT total_changes()')->fetchColumn();
}

$pdo->beginTransaction();       // ouvre la transaction : tout ou rien
try {
    foreach ($fichiers as $fichier) {
        $nom = basename($fichier);
        $sql = file_get_contents($fichier);
        $empreinte = hash('sha256', $sql);
        if (isset($jouees[$nom])) {
            if ($jouees[$nom] !== $empreinte) {     // fichier modifié après coup
                throw new RuntimeException("$nom a été modifié après application");
            }
            continue;                               // déjà jouée : on passe
        }
        $avant = lignesModifiees($pdo);
        $pdo->exec($sql);                           // joue la migration
        $touchees = lignesModifiees($pdo) - $avant; // lignes qu'elle a modifiées
        $pdo->prepare('INSERT INTO migrations VALUES (?, ?, datetime())')
            ->execute([$nom, $empreinte]);          // la note comme jouée
        echo "$nom : $touchees ligne(s)\n";
    }
    if ($simulation) {
        $pdo->rollBack();                           // simulation : on annule tout
        echo "Simulation terminée : rien n'a été enregistré.\n";
    } else {
        $pdo->commit();                             // application : on valide tout
    }
} catch (Throwable $erreur) {
    $pdo->rollBack();                               // au moindre échec : retour arrière
    fwrite(STDERR, 'Échec : ' . $erreur->getMessage() . "\n");
    exit(1);
}
```

La première exécution est décrite dans la section suivante. Après une application réelle, relancer la commande n'affiche rien, car les trois noms figurent dans la table `migrations`. Si l'on ajoute une ligne à `0002_normaliser_statuts.sql` après coup, la commande échoue :

```text
Échec : 0002_normaliser_statuts.sql a été modifié après application
```

La correction d'une erreur passe par un **nouveau** fichier (`0004_...`), jamais par la réécriture de `0002`. Les migrations de données de ce type doivent aussi être **idempotentes** si possible : les rejouer par erreur ne change rien de plus. Le `lower(trim(...))` ci-dessus l'est (mettre en minuscules ce qui l'est déjà ne change rien) ; un `UPDATE ... SET prix = prix * 2` ne l'est pas.

Pour un traitement qui doit reprendre après une interruption, voir aussi [le point de contrôle](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

## Le mode simulation (« dry run »)

Le **mode simulation** (*dry run*, « répétition à blanc ») exécute la migration pour de vrai, compte ce qu'elle aurait modifié, puis **annule tout**. Il répond à la question : « que se passerait-il si je la lançais ? » avant que la réponse ne soit irréversible.

Ici, il suffit de ne pas valider la transaction : l'option `--dry-run` de `migrate.php` appelle `rollBack` à la fin au lieu de `commit`. Toutes les migrations en attente tournent dans la même transaction, pour que la deuxième voie les tables de la première.

```text
$ php migrate.php --dry-run
0001_creer_clients.sql : 5 ligne(s)
0002_normaliser_statuts.sql : 5 ligne(s)
0003_ajouter_derniere_connexion.sql : 5 ligne(s)
Simulation terminée : rien n'a été enregistré.
$ php migrate.php
0001_creer_clients.sql : 5 ligne(s)
0002_normaliser_statuts.sql : 5 ligne(s)
0003_ajouter_derniere_connexion.sql : 5 ligne(s)
```

| Manière de simuler | Principe | Limite |
|---|---|---|
| Transaction annulée (cet exemple) | On joue tout, puis `rollBack` | Fonctionne si la base annule aussi les changements de structure, ce que fait SQLite ; d'autres moteurs valident certaines commandes de structure d'office |
| Compter avant (`SELECT COUNT(*)` avec la même condition) | On lit le volume visé sans rien écrire | Ne prouve pas que la requête de modification réussira |
| Copie de la base | On migre une copie, pas l'original | Prend du temps et de la place sur une grosse base |
| Environnement de test | On migre une base de préproduction | Ses données ressemblent rarement à celles de production |

Un détail : le nombre affiché compte les lignes que la requête a **sélectionnées**, pas celles dont la valeur a réellement changé. Ici `0002` annonce 5 lignes alors que 3 seulement changent de valeur : deux étaient déjà en minuscules. Pour savoir ce qui change vraiment, ajouter à la condition `WHERE statut <> lower(trim(statut))`.

## SQL en masse ou enregistrement par enregistrement

Pour changer 20 000 lignes, deux approches existent. **Un par un** : le programme lit chaque ligne, calcule la nouvelle valeur, puis envoie une requête par ligne. **En masse** : une seule requête SQL décrit le changement et le moteur de la base boucle lui-même. Le programme suivant mesure les deux, plus deux variantes.

```php
<?php
$fichier = __DIR__ . '/bench.db';
@unlink($fichier);                                   // repart d'une base vide
$pdo = new PDO("sqlite:$fichier");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/** Recrée 20 000 clients aux statuts mal écrits. */
function preparer(PDO $pdo): void
{
    $pdo->exec('DROP TABLE IF EXISTS clients');
    $pdo->exec('CREATE TABLE clients (id INTEGER PRIMARY KEY, statut TEXT)');
    $pdo->beginTransaction();                        // une seule transaction : rapide
    $insertion = $pdo->prepare('INSERT INTO clients (statut) VALUES (?)');
    for ($i = 0; $i < 20000; $i++) {
        $insertion->execute([$i % 2 ? 'Actif ' : 'ACTIF']);
    }
    $pdo->commit();
}

/** Mesure la durée d'une action, en secondes. */
function mesurer(string $titre, callable $action): void
{
    $debut = microtime(true);                        // heure avant l'action
    $action();
    printf("%-34s %6.2f s\n", $titre, microtime(true) - $debut);
}

// 1. Un par un, chaque UPDATE est sa propre transaction (valeur par défaut)
preparer($pdo);
mesurer('un par un, sans transaction', function () use ($pdo) {
    $maj = $pdo->prepare('UPDATE clients SET statut = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, statut FROM clients')->fetchAll() as $c) {
        $maj->execute([strtolower(trim($c['statut'])), $c['id']]);
    }
});

// 2. Un par un, mais toutes les écritures dans une seule transaction
preparer($pdo);
mesurer('un par un, une transaction', function () use ($pdo) {
    $pdo->beginTransaction();
    $maj = $pdo->prepare('UPDATE clients SET statut = ? WHERE id = ?');
    foreach ($pdo->query('SELECT id, statut FROM clients')->fetchAll() as $c) {
        $maj->execute([strtolower(trim($c['statut'])), $c['id']]);
    }
    $pdo->commit();
});

// 3. En masse : une seule requête, le moteur boucle lui-même
preparer($pdo);
mesurer('une requête en masse', function () use ($pdo) {
    $pdo->exec('UPDATE clients SET statut = lower(trim(statut))');
});

// 4. En masse par tranches : une requête et une transaction par tranche
preparer($pdo);
mesurer('en masse, tranches de 5 000', function () use ($pdo) {
    $maj = $pdo->prepare(
        'UPDATE clients SET statut = lower(trim(statut)) WHERE id > ? AND id <= ?'
    );
    for ($debut = 0; $debut < 20000; $debut += 5000) {
        $maj->execute([$debut, $debut + 5000]);      // une tranche d'identifiants
    }
});
```

Sur la machine de test, le résultat est :

```text
un par un, sans transaction         48.91 s
un par un, une transaction           0.02 s
une requête en masse                0.01 s
en masse, tranches de 5 000          0.01 s
```

Les durées dépendent de la machine et du disque ; seul l'ordre de grandeur compte. Sans transaction explicite, chaque `UPDATE` valide et force l'écriture sur le disque, 20 000 fois ; c'est ce qui coûte, pas le calcul.

| Critère | Un par un | En masse (une requête) | En masse par tranches |
|---|---|---|---|
| Coût | Un aller-retour avec la base par ligne (voir [limiter les allers-retours](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)) | Un seul aller-retour | Quelques allers-retours |
| Verrou | Court, mais répété à chaque ligne | Long : la table (ou les lignes) reste bloquée pour les autres pendant toute la requête | Court par tranche, les autres utilisateurs passent entre deux |
| Mémoire | Toutes les lignes lues en mémoire par le programme si on les charge d'un coup | Presque nulle côté programme | Faible et bornée |
| Transaction | Une par ligne (défaut) : un échec laisse la moitié migrée | Une seule : tout ou rien | Une par tranche : un échec laisse les tranches déjà validées |
| Cas adapté | Calcul impossible en SQL (appel à un service, règle complexe) | Changement exprimable en SQL, volume modéré | Très gros volume, base utilisée pendant la migration |

Un **verrou** (*lock*) est une réservation que la base pose sur des lignes ou une table pendant qu'elle les modifie : les autres requêtes qui y touchent attendent. Une très longue requête en masse peut donc figer le site ; les tranches du dernier test (`WHERE id > ? AND id <= ?`) rendent la main entre chaque tranche. Une migration par tranches doit rester **reprenable** : si elle s'arrête à la tranche 3, la relance ne doit pas refaire les tranches 1 et 2, d'où l'intérêt de l'idempotence vue plus haut.

## Le garde-fou avant suppression

Supprimer est l'opération qui ne se rattrape pas : un `DELETE` dont la condition est trop large (ou vide) efface tout. Un **garde-fou** est une vérification qui bloque l'opération quand quelque chose cloche. Quatre gestes, dans cet ordre :

| Geste | Question posée | Exemple dans le programme |
|---|---|---|
| Compter | Combien de lignes la condition vise-t-elle ? | `SELECT COUNT(*)` avec la même condition que le `DELETE` |
| Limiter | Ce volume est-il plausible ? | Refus au-delà de `MAXIMUM` (100) lignes par exécution |
| Confirmer | L'humain attend-il bien ce nombre ? | Le nombre passé en argument doit égaler le nombre compté, puis `--confirmer` |
| Sauvegarder | Peut-on revenir en arrière ? | `VACUUM INTO` (commande SQLite qui écrit une copie complète de la base dans un nouveau fichier) avant la suppression |

Le programme `purge.php` supprime les clients inactifs depuis avant 2021. Sans `--confirmer`, il reste en simulation ; avec lui, il sauvegarde, supprime dans une transaction, et vérifie que le nombre de lignes supprimées est celui qui avait été compté.

```php
<?php
// Usage : php purge.php <nombre attendu> [--confirmer]
$attendu = (int) ($argv[1] ?? -1);                  // nombre de lignes à supprimer
$confirme = in_array('--confirmer', $argv, true);   // sans cette option : simulation
const MAXIMUM = 100;                                // plafond : jamais plus par exécution
$pdo = new PDO('sqlite:' . __DIR__ . '/app.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$filtre = "statut = 'inactif' AND derniere_connexion < '2021-01-01'";

// 1. Compter : combien de lignes la condition vise-t-elle ?
$nombre = (int) $pdo->query("SELECT COUNT(*) FROM clients WHERE $filtre")->fetchColumn();
echo "$nombre ligne(s) visée(s)\n";

// 2. Limiter : refuser un volume anormal
if ($nombre > MAXIMUM) {
    exit("Refusé : plus de " . MAXIMUM . " lignes.\n");
}
// 3. Confirmer : le nombre annoncé par l'humain doit égaler le nombre compté
if ($nombre !== $attendu) {
    exit("Refusé : $attendu attendue(s), $nombre trouvée(s).\n");
}
if (!$confirme) {
    exit("Simulation : ajoute --confirmer pour supprimer.\n");
}

// 4. Sauvegarder : copie complète de la base avant toute suppression
$copie = __DIR__ . '/sauvegarde-' . date('Ymd-His') . '.db';
$pdo->exec("VACUUM INTO '$copie'");
echo "Sauvegarde : $copie\n";

// 5. Supprimer dans une transaction, en vérifiant le résultat
$pdo->beginTransaction();
$supprimees = $pdo->exec("DELETE FROM clients WHERE $filtre");
if ($supprimees !== $nombre) {
    $pdo->rollBack();                               // écart : on annule tout
    exit("Annulé : $supprimees supprimée(s) au lieu de $nombre.\n");
}
$pdo->commit();
echo "$supprimees ligne(s) supprimée(s).\n";
```

Quatre appels sur la base du chapitre (le nom de la sauvegarde porte la date et l'heure) :

```text
$ php purge.php 5
2 ligne(s) visée(s)
Refusé : 5 attendue(s), 2 trouvée(s).
$ php purge.php 2
2 ligne(s) visée(s)
Simulation : ajoute --confirmer pour supprimer.
$ php purge.php 2 --confirmer
2 ligne(s) visée(s)
Sauvegarde : /chemin/sauvegarde-20261031-111248.db
2 ligne(s) supprimée(s).
$ php purge.php 2 --confirmer
0 ligne(s) visée(s)
Refusé : 2 attendue(s), 0 trouvée(s).
```

La dernière ligne montre un bénéfice : relancer par erreur la même commande ne supprime rien de plus, car le compte tombe à 0 et ne correspond plus à ce qui était attendu. Pour une table très volumineuse, la sauvegarde complète peut être trop lourde : on copie alors seulement les lignes visées dans une table d'archive (`INSERT INTO archive SELECT ... WHERE <même condition>`) avant le `DELETE`.

## Les pièges

| Piège | Conséquence | Remède |
|---|---|---|
| Modifier un fichier de migration déjà appliqué | Les bases déjà migrées ne le rejouent pas : les environnements divergent sans bruit | Écrire une nouvelle migration ; contrôler l'empreinte |
| Migrer directement en production sans simulation | La surprise (volume, condition fausse) arrive quand il est trop tard | Simuler, compter, puis appliquer |
| `UPDATE` ou `DELETE` sans `WHERE` | Toutes les lignes de la table sont touchées | Compter avant ; refuser une condition vide |
| Un `UPDATE` par ligne hors transaction | Très lent, et un arrêt laisse la table à moitié migrée | Une requête en masse, ou une transaction par tranche |
| Une seule énorme requête sur une table très utilisée | Verrou long : le site se fige | Travailler par tranches |
| Migration non idempotente relancée par erreur | Les valeurs sont modifiées deux fois | Écrire la condition pour qu'elle ne touche que ce qui reste à faire |
| Supprimer sans sauvegarde | Aucun retour arrière possible | Copier la base ou archiver les lignes avant |
| Confondre « lignes sélectionnées » et « lignes modifiées » dans un compte-rendu | Un rapport qui semble faux | Filtrer sur les lignes réellement différentes |

## Bonnes pratiques

| Pratique | Détail |
|---|---|
| Un fichier numéroté par changement | Jamais modifié après application ; une erreur se corrige par un fichier suivant |
| Enregistrer chaque migration jouée | Table de suivi avec nom et empreinte, comme `migrations` ci-dessus |
| Simuler avant d'appliquer | Transaction annulée, ou copie de la base, et lecture des comptes |
| Préférer le SQL en masse | Tranches pour les très gros volumes ; ligne par ligne seulement si SQL ne suffit pas |
| Tout en transaction | Un échec laisse la base dans l'état d'avant |
| Garde-fou avant suppression | Compter, limiter, confirmer par le nombre attendu, sauvegarder |
| Écrire des migrations idempotentes | Un rejeu accidentel ne change rien |

## Ce qu'il faut retenir

| Notion | À retenir |
|---|---|
| Migration versionnée | Un fichier numéroté par changement, jamais modifié après application, une table qui retient les migrations jouées |
| Simulation (*dry run*) | On exécute, on compte, on annule : la réponse arrive avant l'irréversible |
| En masse ou un par un | Une requête SQL est bien plus rapide ; les tranches limitent verrou et risque ; un par un reste pour les calculs hors SQL |
| Transaction | Tout ou rien : un échec ne laisse pas la moitié des lignes migrée |
| Garde-fou de suppression | Compter, limiter, confirmer le nombre, sauvegarder ; puis vérifier le nombre supprimé |
