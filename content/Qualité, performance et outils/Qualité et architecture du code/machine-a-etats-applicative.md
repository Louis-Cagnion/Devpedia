---
order: 17
---

# La machine à états applicative

Un article de blog passe par plusieurs étapes : on l'écrit, quelqu'un le relit, on le publie, un jour on l'archive. Cette étape s'enregistre dans un champ, souvent nommé **statut**. Si n'importe quel morceau de code peut y écrire n'importe quelle valeur, l'application finit par contenir des articles « publiés » que personne n'a relus, ou « archivés » alors qu'ils n'ont jamais été en ligne. Une **machine à états applicative** règle ce problème : on déclare une fois, dans une table, quels statuts existent et quels passages de l'un à l'autre sont permis, et un seul endroit du code applique cette table.

Ce chapitre s'appuie sur les [exceptions en PHP](/?c=langages&s=php&p=exceptions) et sur les [classes et méthodes](/?c=langages&s=php&p=poo). Le même principe sert à analyser un texte pas à pas, comme le montre le [parsing incrémental par machine à états](/?c=langages&s=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats) ; ici, la machine ne lit pas un texte mais protège la vie d'un enregistrement. Des systèmes de gestion de contenu comme Drupal (un logiciel PHP qui permet de construire et d'administrer un site web) fonctionnent ainsi pour leur statut de publication. Les exemples ci-dessous restent génériques et n'utilisent aucun code de ce logiciel.

## Les mots à connaître

| Mot | Sens | Exemple |
|---|---|---|
| État (ou statut) | La situation d'un objet à un instant donné, une seule à la fois | `brouillon` |
| Transition | Le passage d'un état à un autre | de `brouillon` à `en_relecture` |
| Transition autorisée | Un passage que la règle métier permet | `en_relecture` vers `publie` |
| Transition interdite | Un passage que la règle refuse | `brouillon` vers `publie` |
| État final | Un état dont on ne sort plus | `archive` |
| Effet | Une action déclenchée par une transition précise | noter la date de publication |

## Le schéma des statuts

Chaque flèche est une transition autorisée. Tout ce qui n'est pas dessiné est interdit.

```text
              +--------------+
              |   brouillon  |<-----------+
              +------+-------+            |
                     |                    |
                     v                    |
              +--------------+            |
              | en_relecture |------------+
              +------+-------+   (renvoi pour correction)
                     |
                     v
              +--------------+
              |    publie    |
              +------+-------+
                     |
                     v
              +--------------+
              |    archive   |   (état final)
              +--------------+
```

## Le problème : un statut libre, sans garde

Sans machine à états, le statut est une simple chaîne de caractères que chaque partie du code modifie à sa guise.

```php
<?php
$article = ['titre' => 'Les statuts', 'statut' => 'brouillon']; // un article tout neuf
$article['statut'] = 'publie';            // saute la relecture : personne ne l'empêche
$article['statut'] = 'publié ';           // une faute de frappe est acceptée aussi
$article['statut'] = 'archive';           // et on peut archiver ce qui n'a jamais existé
```

Chaque ligne est acceptée sans la moindre vérification. La **garde** (le contrôle placé avant le changement, qui refuse ou autorise) est absente.

## Les états impossibles

Une autre erreur fréquente remplace un statut unique par plusieurs cases à cocher (des booléens, valeurs vrai ou faux). Deux cases donnent quatre combinaisons, dont certaines n'ont aucun sens.

| `est_publie` | `est_archive` | Signification |
|---|---|---|
| faux | faux | Brouillon ou relecture, on ne sait pas lequel |
| vrai | faux | Publié |
| faux | vrai | Archivé, mais jamais publié ? Cas ambigu |
| vrai | vrai | Publié et archivé en même temps : état impossible |

Un champ unique qui ne peut prendre que les valeurs de la table rend ces combinaisons **impossibles à représenter** : on ne peut pas écrire ce qui n'existe pas. C'est le même principe que celui d'[un seul mécanisme par information](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-seul-mecanisme-par-information).

## Les `if` dispersés

Autre pente glissante : vérifier la règle à la main, à chaque endroit qui change le statut.

```php
<?php
function boutonPublier(array $article): void       // appelée par la page d'édition
{
    if ($article['statut'] === 'en_relecture') {   // règle écrite une première fois
        echo "Publier";                            // affiche le bouton
    }
}

function importerArticle(array $ligne): array      // appelée par un import de fichier
{
    if ($ligne['statut'] === 'publie') {           // règle réécrite, déjà différente
        $ligne['date'] = date('Y-m-d');            // oublie le contrôle de la relecture
    }
    return $ligne;                                 // renvoie la ligne, jamais refusée
}
```

Ces deux fonctions appliquent chacune leur version de la règle. Le jour où l'on ajoute un statut, il faut retrouver tous les `if`, et on en oublie toujours un. La solution est celle que décrit [éviter la répétition par des structures indexées](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) : une table de données, parcourue par un seul code.

## La table des transitions

Un **tableau associatif** (une liste où chaque valeur est retrouvée par un nom, sa clé) donne, pour chaque statut, la liste des statuts suivants permis. Une **constante** (`const`) est une valeur nommée qu'on ne peut plus modifier après sa déclaration.

| Statut actuel | Transitions autorisées |
|---|---|
| `brouillon` | `en_relecture` |
| `en_relecture` | `brouillon`, `publie` |
| `publie` | `archive` |
| `archive` | aucune |

```php
<?php
const TRANSITIONS = [                          // la table : une seule source de vérité
    'brouillon'    => ['en_relecture'],        // un brouillon part en relecture
    'en_relecture' => ['brouillon', 'publie'], // la relecture corrige ou publie
    'publie'       => ['archive'],             // un article publié finit archivé
    'archive'      => [],                      // état final : aucune sortie
];
```

Ajouter un statut revient à ajouter une ligne dans cette table, et nulle part ailleurs. C'est la [source unique de vérité](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite).

## Refuser une transition illégale, avec un message clair

Une fonction unique, `changerStatut`, est la seule porte d'entrée. Elle vérifie la table et lève une **exception** (un signal d'erreur que le code appelant peut attraper, voir le chapitre sur les [exceptions](/?c=langages&s=php&p=exceptions)) dont le message nomme la cause. Le principe est celui d'[un message d'erreur pour chaque cause](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-message-d-erreur-par-cause) : le message dit quel statut, quelle cible, et ce qui était permis.

```php
<?php
class TransitionInterdite extends DomainException {}   // un type d'erreur dédié à ce cas

function changerStatut(array $article, string $cible): array
{
    $actuel = $article['statut'] ?? '';                // lit le statut, vide s'il manque
    if (!array_key_exists($actuel, TRANSITIONS)) {     // le statut actuel est-il connu ?
        throw new TransitionInterdite(                 // sinon, refuse avec la cause
            "Statut actuel inconnu : « $actuel »."
        );
    }
    if (!array_key_exists($cible, TRANSITIONS)) {      // la cible existe-t-elle ?
        throw new TransitionInterdite(                 // sinon, refuse avec la cause
            "Statut cible inconnu : « $cible »."
        );
    }
    $permis = TRANSITIONS[$actuel];                    // les cibles permises depuis ici
    if (!in_array($cible, $permis, true)) {            // la cible est-elle dans la liste ?
        $liste = $permis ? implode(', ', $permis) : 'aucune';   // texte de la liste
        throw new TransitionInterdite(                 // refuse en nommant les choix
            "Passage de « $actuel » à « $cible » interdit. Permis : $liste."
        );
    }
    $article['statut'] = $cible;                       // la seule ligne qui écrit le statut
    return $article;                                   // renvoie l'article modifié
}
```

| Cas testé | Résultat |
|---|---|
| `brouillon` vers `en_relecture` | accepté |
| `brouillon` vers `publie` | refusé, message : permis `en_relecture` |
| `archive` vers `brouillon` | refusé, message : permis `aucune` |
| `publie` vers `Publie` (faute de casse) | refusé, statut cible inconnu |

Le troisième paramètre `true` de `in_array` impose une comparaison stricte : sans lui, PHP peut juger égales des valeurs de types différents.

## Les effets liés à une transition

Certaines actions n'ont de sens que pour un passage précis : noter la date au moment de la publication, prévenir l'auteur quand on renvoie en brouillon, retirer l'article du site à l'archivage. On les range dans une seconde table, indexée par la paire `départ>arrivée`. Chaque effet est une **fonction anonyme** (une fonction sans nom, écrite directement à l'endroit où on la range, ici avec la forme courte `fn`).

| Transition | Effet |
|---|---|
| `brouillon>en_relecture` | noter la date de la demande de relecture |
| `en_relecture>publie` | noter la date de publication |
| `publie>archive` | noter la date d'archivage |

```php
<?php
const FORMAT_DATE = 'Y-m-d';                              // format des dates stockées

function effets(): array                                  // la table des effets
{
    return [
        'brouillon>en_relecture' => fn(array $a): array   // à la demande de relecture
            => $a + ['relecture_le' => date(FORMAT_DATE)],
        'en_relecture>publie' => fn(array $a): array      // à la publication
            => $a + ['publie_le' => date(FORMAT_DATE)],
        'publie>archive' => fn(array $a): array           // à l'archivage
            => $a + ['archive_le' => date(FORMAT_DATE)],
    ];
}

function transiter(array $article, string $cible): array
{
    $depart = $article['statut'] ?? '';                   // mémorise le statut de départ
    $article = changerStatut($article, $cible);           // valide, lève si interdit
    $cle = "$depart>$cible";                              // clé de la table des effets
    $effet = effets()[$cle] ?? null;                      // cherche un effet pour ce passage
    return $effet ? $effet($article) : $article;          // l'exécute s'il existe
}
```

L'ordre compte : la validation vient **avant** les effets. Une transition refusée lève l'exception à la ligne de `changerStatut`, et la ligne qui exécute l'effet n'est jamais atteinte. L'opérateur `+` entre deux tableaux ajoute les clés manquantes sans modifier celles qui existent.

Les effets qui prolongent une transition (envoyer un courriel, vider un cache) peuvent aussi passer par des points d'extension que d'autres modules branchent, comme dans un chapitre voisin consacré aux hooks et aux événements ; ce chapitre garde la table, plus simple tant que les effets restent peu nombreux.

## Voir la machine fonctionner

```php
<?php
$article = ['titre' => 'Les statuts', 'statut' => 'brouillon'];   // point de départ
$article = transiter($article, 'en_relecture');                   // transition permise
$article = transiter($article, 'publie');                         // transition permise
echo $article['statut'], ' le ', $article['publie_le'], "\n";     // affiche l'état final
try {
    transiter($article, 'brouillon');                             // publié vers brouillon
} catch (TransitionInterdite $e) {                                // attrape le refus
    echo $e->getMessage(), "\n";                                  // affiche la cause
}
```

La sortie du dernier bloc ressemble à :

```text
publie le 2026-10-31
Passage de « publie » à « brouillon » interdit. Permis : archive.
```

## Tester la table elle-même

Une table peut contenir une faute de frappe : une cible qui n'existe pas, un état dont on ne peut plus sortir par erreur. Un [test unitaire](/?c=tests&p=tests-unitaires) la vérifie en quelques lignes.

```php
<?php
function verifierTable(array $table): array               // renvoie la liste des anomalies
{
    $anomalies = [];                                      // liste vide au départ
    foreach ($table as $depart => $cibles) {              // parcourt chaque statut
        foreach ($cibles as $cible) {                     // parcourt ses cibles
            if (!array_key_exists($cible, $table)) {      // la cible a-t-elle une entrée ?
                $anomalies[] = "$depart mène à $cible, inconnu";   // note l'anomalie
            }
        }
    }
    return $anomalies;                                    // vide si la table est saine
}
```

La fonction ci-dessus réalise le premier contrôle du tableau suivant ; les deux autres s'écrivent de la même façon, en parcourant la table.

| Contrôle | Ce qu'il détecte |
|---|---|
| Toute cible est aussi une clé | Faute de frappe dans une cible |
| Au moins un état final | Machine sans fin possible |
| Tout état est atteignable depuis le premier | Statut ajouté mais relié à rien |

## Statut libre, `if` dispersés ou table

| Critère | Statut libre | `if` dispersés | Table de transitions |
|---|---|---|---|
| Valeur invalide acceptée | oui | parfois | non |
| Règle écrite à un seul endroit | non | non | oui |
| Ajouter un statut | rien ne guide | chercher tous les `if` | une ligne dans la table |
| Message d'erreur clair | aucun | différent partout | un seul, nomme la cause |
| Règle relisible d'un coup d'œil | non | non | oui |

## Les pièges

| Piège | Pourquoi c'est un problème | Réflexe |
|---|---|---|
| Statut libre sans garde | Toute valeur est acceptée, y compris une faute de frappe | Une seule fonction écrit le statut et valide d'abord |
| Plusieurs cases à cocher au lieu d'un statut | Des états impossibles deviennent représentables | Un champ unique dont les valeurs sont listées |
| Règle recopiée dans plusieurs `if` | Les copies divergent, l'une est oubliée | Une table lue par un seul code |
| Écrire le statut directement en base, hors de la fonction | Contourne la garde, par exemple dans un import | Faire passer tout chemin, import compris, par `transiter` |
| Effet exécuté avant la validation | Une transition refusée a déjà eu des conséquences | Valider d'abord, appliquer ensuite |
| Deux utilisateurs qui changent le statut en même temps | Chacun valide sur un statut déjà périmé | Écrire avec une condition sur l'ancien statut, voir les [bases de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) |
| Message vague (« erreur de statut ») | L'utilisateur ne sait pas quoi faire | Nommer le départ, la cible et les choix permis |
| Statuts renommés après coup | Les anciennes valeurs stockées deviennent inconnues | Prévoir une migration des données avant de renommer |

## Bonnes pratiques

| Pratique | Raison |
|---|---|
| Déclarer états et transitions dans une table de données | Une seule source de vérité, relisible d'un coup d'œil |
| Une seule fonction autorisée à écrire le statut | Aucun chemin ne contourne la garde |
| Valider avant d'appliquer les effets | Un refus ne laisse aucune trace |
| Un message d'erreur qui nomme l'état, la cible et les choix | Le débogage se fait en une lecture |
| Un identifiant d'état stable, en minuscules, sans espace | Les données déjà stockées restent valides |
| Un test qui contrôle la table elle-même | Détecte une cible inconnue avant la mise en ligne |
| Garder les effets dans une table tant qu'ils sont peu nombreux | Plus simple qu'un système de points d'extension |

Documentation officielle de référence : [tableaux PHP](https://www.php.net/manual/fr/language.types.array.php) et [exceptions PHP](https://www.php.net/manual/fr/language.exceptions.php).

## Ce qu'il faut retenir

| Notion | À retenir |
|---|---|
| Machine à états | Un champ à valeurs listées et une table des passages permis |
| Transition | Un passage d'un état à un autre, autorisé ou interdit par la table |
| Garde | Le contrôle placé avant le changement, qui refuse avec une exception claire |
| Effet | Une action liée à une transition précise, exécutée après la validation |
| Point d'entrée unique | Une seule fonction écrit le statut, import et interface compris |
| État impossible | Évité en remplaçant plusieurs booléens par un seul statut |
| Piège principal | Un statut libre, ou une règle dispersée dans des `if` qui divergent |
